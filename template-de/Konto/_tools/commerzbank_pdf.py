"""Parser für Commerzbank-PDF-Auszüge: Girokonto (Kontoauszug) und Kreditkarten (Mastercard/Visa Premium-Abrechnung).

Liest den Text mit `pdftotext -layout` (die Auszüge sind native Text-PDFs, keine OCR nötig) und prüft jeden Auszug:
alter Saldo + Buchungen = neuer Saldo. Ein Auszug, der nicht aufgeht, wird gemeldet – das findet jeden Parserfehler.

Ist zugleich die Vorlage für PDF-Parser anderer Banken: Kopf (alter Saldo), Buchungszeilen mit Datum am Anfang und
Betrag am rechten Rand (Soll mit nachgestelltem Minus), Folgezeilen mit Gegenpartei und SEPA-Feldern, Fuß (neuer Saldo).
"""
from __future__ import annotations
import calendar, re, subprocess
from datetime import date
from decimal import Decimal
from pathlib import Path
from transaktion import Transaktion, betrag_de

BETRAG = r"\d{1,3}(?:\.\d{3})*,\d{2}"


def _d(s: str) -> date:
    t, m, j = s.strip().split(".")
    return date(int(j), int(m), int(t))


def pdf_text(pfad) -> str:
    return subprocess.run(["pdftotext", "-layout", str(pfad), "-"], capture_output=True, text=True, check=True).stdout


# ---------------------------------------------------------------- Girokonto
RE_TX = re.compile(rf"^(.*?\S)\s{{2,}}(\d{{2}}\.\d{{2}})\s+({BETRAG})(-?)\s*$")
RE_BIC = re.compile(r"^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$")
RE_IBAN = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$")
RE_TYP = re.compile(r"^(SEPA-[A-ZÄÖÜ]+.*|Dauerauftrag.*)$", re.I)


def girokonto(text: str, quelle: str):
    zeilen = text.splitlines()
    m_alt = re.search(rf"Alter Kontostand vom (\d{{2}}\.\d{{2}}\.\d{{4}})\s+({BETRAG}-?)", text)
    m_neu = re.search(rf"Neuer Kontostand vom (\d{{2}}\.\d{{2}}\.\d{{4}})\s+({BETRAG}-?)", text)
    m_iban = re.search(r"IBAN[:\s]+(DE\d{2}(?:\s?\d{4}){4}\s?\d{2})", text)
    konto = m_iban.group(1).replace(" ", "") if m_iban else "Girokonto"
    roh, im_bereich, buchung, akt = [], False, None, None
    for zeile in zeilen:
        s = zeile.rstrip()
        if not s.strip():
            continue
        if "Angaben zu den Umsätzen" in s:
            im_bereich = True; continue
        if re.match(r"^\s*(Folgeseite|Kreditlinie|Neuer Kontostand|Guthaben sind als Einlagen)", s):
            im_bereich = False; akt = None; continue
        if not im_bereich:
            continue
        mb = re.match(r"^\s*Buchungsdatum:\s*(\d{2}\.\d{2}\.\d{4})", s)
        if mb:
            buchung = _d(mb.group(1)); akt = None; continue
        mt = RE_TX.match(s)
        if mt and buchung:
            name, valuta, betrag, minus = mt.groups()
            akt = {"buchung": buchung, "name": name.strip(), "betrag": betrag_de(betrag + minus), "zeilen": []}
            roh.append(akt); continue
        if akt is not None:
            akt["zeilen"].append(s)
    aus = []
    for r in roh:
        ls = r["zeilen"]
        if ls:
            rand = min(len(l) - len(l.lstrip(" ")) for l in ls)
            ls = [l[rand:] for l in ls]
        felder, zweck, wartet = {}, [], None
        for l in ls:
            ll = l.strip()
            if wartet:
                felder[wartet] = ll; wartet = None; continue
            m = re.match(r"^(End-to-End-Ref\.|Mandatsref|Gläubiger-ID|Kundenreferenz):\s*(.*)$", ll)
            if m:
                if m.group(2):
                    felder[m.group(1)] = m.group(2)
                else:
                    wartet = m.group(1)
                continue
            if RE_TYP.match(ll):
                felder["typ"] = ll; continue
            if RE_BIC.match(ll) and "bic" not in felder:
                felder["bic"] = ll; continue
            if RE_IBAN.match(ll) and "iban" not in felder:
                felder["iban"] = ll; continue
            zweck.append(ll)
        e2e = felder.get("End-to-End-Ref.", "")
        aus.append(Transaktion(datum=r["buchung"], konto=konto, betrag=r["betrag"], gegenpartei=r["name"],
                               gegenkonto=felder.get("iban", ""), verwendungszweck=re.sub(r"\s+", " ", " ".join(zweck)).strip(),
                               type=felder.get("typ", "").lower(), glaeubiger_id=felder.get("Gläubiger-ID", ""),
                               mandatsreferenz=felder.get("Mandatsref", ""),
                               referenz="" if e2e.upper() == "NOTPROVIDED" else e2e, quelle=quelle))
    pruefung = None
    if m_alt and m_neu:
        alt, neu = betrag_de(m_alt.group(2)), betrag_de(m_neu.group(2))
        summe = sum((t.betrag for t in aus), Decimal(0))
        pruefung = {"konto": konto, "id": _d(m_neu.group(1)).isoformat(), "anfang": alt, "ende": neu, "summe": summe,
                    "stimmt": alt + summe == neu, "quelle": quelle}
    return aus, pruefung


# ---------------------------------------------------------------- Kreditkarte
RE_KTX = re.compile(rf"^\s*(\d{{1,2}}\.\d{{1,2}}\.\d{{4}})\s+(\d{{1,2}}\.\d{{1,2}}\.\d{{4}})\s+(.*?)\s+(-?{BETRAG})\s*$")
RE_FX = re.compile(rf"^(.*?)\s+(-?{BETRAG})\s+([A-Z]{{3}})\s+(\d+,\d+)$")
# Seitenkopf/-fuß, Vorstandszeile, Spaltenköpfe – keine Buchungen
RE_RAUSCHEN = re.compile(r"^\s*(100CB0|Seite \d|Vorsitzende|Vorstand|Umsatzdatum|Kartennummer:|Beratungscenter|"
                         r"Commerzbank AG|Postfach|Zu zahlender Betrag|Am \d)")
MONATE = {"januar": 1, "februar": 2, "märz": 3, "april": 4, "mai": 5, "juni": 6, "juli": 7, "august": 8,
          "september": 9, "oktober": 10, "november": 11, "dezember": 12}


def kreditkarte(text: str, quelle: str):
    m = re.search(r"Abrechnung (Mastercard|Visa) Premium (Kreditkarte per|\(Kreditkarte\) vom|\(Kreditkarte\) per) "
                  r"(\d{1,2}\.\d{1,2}\.\d{4}|\d{1,2} [A-Za-zäÄ]+ \d{4})", text)
    if not m:
        return None
    produkt, altes_format = m.group(1), m.group(2) == "Kreditkarte per"
    ds = m.group(3)
    if "." in ds:
        stichtag = _d(ds)
    else:
        t_, mo, j = ds.split()
        stichtag = date(int(j), MONATE[mo.lower()], int(t_))
    mk = re.search(r"^\s*(\d{4} \d{2}\*\* \*\*\*\* (\d{4})|\d{6}\*{6}(\d{4}))\s", text, re.M)
    konto = f"{produkt} …{(mk.group(2) or mk.group(3)) if mk else '????'}"
    m_alt = re.search(rf"Abrechnungssaldo vom (\d{{1,2}}\.\d{{1,2}}\.\d{{4}})\s+(-?{BETRAG})", text)
    m_neu = re.search(rf"^\s*Abrechnungssaldo\s+(-?{BETRAG})(?:\s+\S+)?\s*$", text, re.M)
    aus, akt, begonnen = [], None, False
    for zeile in text.splitlines():
        s = zeile.rstrip()
        if not s.strip() or RE_RAUSCHEN.match(s):
            continue
        if re.match(r"^\s*Abrechnungssaldo\s+-?\d", s):
            break
        mt = RE_KTX.match(s)
        if mt:
            begonnen = True
            umsatz, buchung, name, betrag = mt.groups()
            fx = RE_FX.match(name.strip())
            akt = Transaktion(datum=_d(buchung), konto=konto, betrag=betrag_de(betrag), type="kartenzahlung",
                              quelle=quelle, gegenpartei=re.sub(r"\s+", " ", (fx.group(1) if fx else name).strip()))
            if fx:
                akt.extra.update(fremdbetrag=betrag_de(fx.group(2)), waehrung=fx.group(3), kurs=fx.group(4))
            aus.append(akt); continue
        if begonnen and akt is not None and not altes_format and re.match(r"^\s{10,}\S", s):
            akt.gegenpartei = re.sub(r"\s+", " ", akt.gegenpartei + " " + s.strip())
    pruefung = None
    if m_alt and m_neu:
        alt, neu = betrag_de(m_alt.group(2)), betrag_de(m_neu.group(1))
        summe = sum((t.betrag for t in aus), Decimal(0))
        pruefung = {"konto": konto, "id": stichtag.isoformat(), "anfang": alt, "ende": neu, "summe": summe,
                    "stimmt": alt + summe == neu, "quelle": quelle}
    return aus, pruefung


def parse(pfad):
    """Liefert (transaktionen, [pruefung]) oder wirft ValueError, wenn es kein Commerzbank-Auszug ist."""
    text, quelle = pdf_text(pfad), Path(pfad).name
    if "Kontoauszug vom" in text and "Angaben zu den Umsätzen" in text:
        t, p = girokonto(text, quelle)
    else:
        r = kreditkarte(text, quelle)
        if r is None:
            raise ValueError("kein Commerzbank-Konto- oder Kreditkartenauszug")
        t, p = r
    return t, [p] if p else []
