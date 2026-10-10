#!/usr/bin/env python3
"""Legt eine unsichtbare, durchsuchbare Textebene über gescannte PDFs und Fotos – mit Apple Vision (lokal, de-DE).

Aufruf:   python3 _tools/textebene.py datei.pdf [weitere...]   (ersetzt die Datei erst nach erfolgreicher Prüfung)
          python3 _tools/textebene.py --pruefen              (zeigt, welche Dateien in Dokumente/ noch keine Textebene haben)
          python3 _tools/textebene.py                        (ergänzt alles, was noch keine Textebene hat)

Das Scanbild bleibt unverändert; der Text liegt unsichtbar darüber (PDF-Rendermodus 3).
Fotos (JPG/PNG) werden in ein durchsuchbares PDF daneben überführt; das Foto selbst bleibt liegen.
Benötigt: pdftoppm und pdftotext (brew install poppler), pip install pypdf reportlab, Xcode Command Line Tools (swiftc).
"""
import subprocess, sys, os, json, tempfile, shutil
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

HERE = os.path.dirname(os.path.abspath(__file__))
ARCHIEF = os.path.join(os.path.dirname(HERE), "Dokumente")
BOXES = os.path.join(HERE, ".ocr-boxes-bin")
TALEN = os.environ.get("OCR_LANGS", "de-DE,en-US")
MIN_TEKENS = 40  # weniger Text als das = "keine Textebene"

def bouw_binary():
    src = os.path.join(HERE, "ocr_boxes.swift")
    if not os.path.exists(BOXES) or os.path.getmtime(src) > os.path.getmtime(BOXES):
        subprocess.run(["swiftc", "-O", src, "-o", BOXES], check=True)

def herken(beeld):
    uit = subprocess.run([BOXES, beeld, TALEN], capture_output=True, text=True, check=True).stdout
    return json.loads(uit or "[]")

def tekstlaag(c, regels, bw, bh):
    t = c.beginText(); t.setTextRenderMode(3)
    for r in regels:
        txt = r["text"].strip()
        if not txt: continue
        x, y, w, h = r["x"] * bw, r["y"] * bh, r["w"] * bw, r["h"] * bh
        grootte = max(h * 0.85, 2)
        breedte = c.stringWidth(txt, "Helvetica", grootte) or 1
        if w > 0: grootte = min(grootte * (w / breedte), h * 1.4)
        t.setFont("Helvetica", max(grootte, 1))
        t.setTextOrigin(x, y)
        try: t.textLine(txt)
        except Exception: pass
    c.drawText(t)

def tekst_van(pad):
    return subprocess.run(["pdftotext", pad, "-"], capture_output=True, text=True).stdout

def pdf_verwerken(pad):
    lezer = PdfReader(pad)
    tmp = tempfile.mkdtemp()
    try:
        subprocess.run(["pdftoppm", "-r", "200", "-png", pad, os.path.join(tmp, "s")], check=True)
        beelden = sorted(f for f in os.listdir(tmp) if f.endswith(".png"))
        overlay = os.path.join(tmp, "overlay.pdf")
        c = canvas.Canvas(overlay)
        n = 0
        for i, pagina in enumerate(lezer.pages):
            bw, bh = float(pagina.mediabox.width), float(pagina.mediabox.height)
            c.setPageSize((bw, bh))
            if i < len(beelden):
                regels = herken(os.path.join(tmp, beelden[i])); n += len(regels)
                tekstlaag(c, regels, bw, bh)
            c.showPage()
        c.save()
        schrijver = PdfWriter()
        for pagina, ov in zip(lezer.pages, PdfReader(overlay).pages):
            pagina.merge_page(ov); schrijver.add_page(pagina)
        # Erst in eine Nebendatei schreiben, prüfen, dann ersetzen.
        nieuw = pad + ".nieuw"
        with open(nieuw, "wb") as f: schrijver.write(f)
        ok = len(PdfReader(nieuw).pages) == len(lezer.pages) and len("".join(tekst_van(nieuw).split())) >= MIN_TEKENS
        if not ok:
            os.remove(nieuw)
            raise RuntimeError(f"Textebene nicht plausibel, Original unverändert: {pad}")
        os.replace(nieuw, pad)
        return n
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def beeld_verwerken(pad):
    doel = os.path.splitext(pad)[0] + ".pdf"
    beeld = ImageReader(pad); iw, ih = beeld.getSize()
    schaal = min(595.0 / iw, 842.0 / ih)
    bw, bh = iw * schaal, ih * schaal
    c = canvas.Canvas(doel, pagesize=(bw, bh))
    c.drawImage(beeld, 0, 0, width=bw, height=bh)
    regels = herken(pad)
    tekstlaag(c, regels, bw, bh)
    c.showPage(); c.save()
    return doel, len(regels)

def zonder_tekstlaag():
    treffers = []
    for wortel, _, bestanden in os.walk(ARCHIEF):
        for b in bestanden:
            p = os.path.join(wortel, b)
            if b.lower().endswith(".pdf"):
                if len("".join(tekst_van(p).split())) < MIN_TEKENS: treffers.append(p)
            elif b.lower().endswith((".jpg", ".jpeg", ".png")) and not os.path.exists(os.path.splitext(p)[0] + ".pdf"):
                treffers.append(p)
    return sorted(treffers)

if __name__ == "__main__":
    if "--pruefen" in sys.argv:
        for p in zonder_tekstlaag(): print(os.path.relpath(p, ARCHIEF))
        sys.exit(0)
    bouw_binary()
    doelen = sys.argv[1:] or zonder_tekstlaag()
    for p in doelen:
        if p.lower().endswith(".pdf"):
            n = pdf_verwerken(p); print(f"  Textebene ergänzt   ({n:>4} Zeilen)  {p}")
        else:
            doel, n = beeld_verwerken(p); print(f"  durchsuchbares PDF ({n:>4} Zeilen)  {doel}")
