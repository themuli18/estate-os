"""Parser für CSV-Exporte deutscher Banken: Sparkasse (CSV-CAMT), DKB und ING (Deutschland).

Das Format wird an der Kopfzeile erkannt; vorangestellte Infozeilen (DKB, ING) werden übersprungen.
Banken ändern ihre Exporte gelegentlich: fehlt eine Spalte, bricht der Parser mit einer Meldung ab,
welche Spalte fehlt. Dann nur die SPALTEN-Liste der jeweiligen Bank anpassen.
Die Spaltennamen stammen aus dokumentierten Exportformaten und sind am ersten echten Export zu prüfen.
"""
from __future__ import annotations
import csv, io
from pathlib import Path
from transaktion import Transaktion, betrag_de, datum, sepa_felder


def lies_text(pfad) -> str:
    roh = Path(pfad).read_bytes()
    for enc in ("utf-8-sig", "cp1252"):
        try:
            return roh.decode(enc)
        except UnicodeDecodeError:
            pass
    return roh.decode("latin-1")


def _tabelle(text: str, merkmal: str) -> tuple[list[str], list[dict]]:
    """Sucht die Kopfzeile (enthält `merkmal`) in den ersten 20 Zeilen und liest ab dort."""
    zeilen = text.splitlines()
    for i, z in enumerate(zeilen[:20]):
        if merkmal in z:
            trenner = ";" if z.count(";") >= z.count(",") else ","
            leser = csv.DictReader(io.StringIO("\n".join(zeilen[i:])), delimiter=trenner)
            return [f.strip() for f in (leser.fieldnames or [])], [
                {(k or "").strip(): (v or "").strip() for k, v in r.items()} for r in leser]
    raise ValueError(f"Kopfzeile mit {merkmal!r} nicht gefunden")


def _fordere(kopf, noetig, bank):
    fehlt = [k for k in noetig if k not in kopf]
    if fehlt:
        raise ValueError(f"{bank}: Spalte(n) fehlen {fehlt}. Gefunden: {kopf}")


def _vorspann_iban(text: str) -> str:
    for z in text.splitlines()[:12]:
        for teil in z.replace('"', "").split(";"):
            t = teil.strip().replace(" ", "")
            if len(t) == 22 and t[:2] == "DE" and t[2:].isdigit():
                return t
    return ""


# ---------------------------------------------------------------- Sparkasse CSV-CAMT (V2)
SPARKASSE = ["Auftragskonto", "Buchungstag", "Buchungstext", "Verwendungszweck", "Glaeubiger ID", "Mandatsreferenz",
             "Kundenreferenz (End-to-End)", "Beguenstigter/Zahlungspflichtiger", "Kontonummer/IBAN", "Betrag"]


def sparkasse(pfad) -> list[Transaktion]:
    kopf, zeilen = _tabelle(lies_text(pfad), "Auftragskonto")
    _fordere(kopf, SPARKASSE, "Sparkasse")
    return [Transaktion(datum=datum(r["Buchungstag"]), konto=r["Auftragskonto"], betrag=betrag_de(r["Betrag"]),
                        gegenpartei=r["Beguenstigter/Zahlungspflichtiger"], gegenkonto=r["Kontonummer/IBAN"],
                        verwendungszweck=r["Verwendungszweck"], type=r["Buchungstext"].lower(),
                        glaeubiger_id=r["Glaeubiger ID"], mandatsreferenz=r["Mandatsreferenz"],
                        referenz="" if r["Kundenreferenz (End-to-End)"].upper() == "NOTPROVIDED" else r["Kundenreferenz (End-to-End)"],
                        quelle=Path(pfad).name) for r in zeilen if r.get("Buchungstag")]


# ---------------------------------------------------------------- DKB (Format seit 2023)
DKB = ["Buchungsdatum", "Zahlungspflichtige*r", "Zahlungsempfänger*in", "Verwendungszweck", "Umsatztyp", "IBAN",
       "Betrag (€)", "Gläubiger-ID", "Mandatsreferenz", "Kundenreferenz"]


def dkb(pfad) -> list[Transaktion]:
    text = lies_text(pfad)
    kopf, zeilen = _tabelle(text, "Buchungsdatum")
    _fordere(kopf, DKB, "DKB")
    konto = _vorspann_iban(text)
    aus = []
    for r in zeilen:
        if not r.get("Buchungsdatum"):
            continue
        b = betrag_de(r["Betrag (€)"])
        gegen = r["Zahlungsempfänger*in"] if b < 0 else r["Zahlungspflichtige*r"]
        aus.append(Transaktion(datum=datum(r["Buchungsdatum"]), konto=konto, betrag=b, gegenpartei=gegen,
                               gegenkonto=r["IBAN"], verwendungszweck=r["Verwendungszweck"], type=r["Umsatztyp"].lower(),
                               glaeubiger_id=r["Gläubiger-ID"], mandatsreferenz=r["Mandatsreferenz"],
                               referenz=r["Kundenreferenz"], quelle=Path(pfad).name))
    return aus


# ---------------------------------------------------------------- ING Deutschland
ING_DE = ["Buchung", "Auftraggeber/Empfänger", "Buchungstext", "Verwendungszweck", "Saldo", "Betrag"]


def ing_de(pfad) -> list[Transaktion]:
    text = lies_text(pfad)
    kopf, zeilen = _tabelle(text, "Auftraggeber/Empfänger")
    _fordere(kopf, ING_DE, "ING")
    konto = _vorspann_iban(text)
    aus = []
    for r in zeilen:
        if not r.get("Buchung"):
            continue
        sepa = sepa_felder(r["Verwendungszweck"])
        aus.append(Transaktion(datum=datum(r["Buchung"]), konto=konto, betrag=betrag_de(r["Betrag"]),
                               gegenpartei=r["Auftraggeber/Empfänger"], verwendungszweck=sepa.get("zweck") or r["Verwendungszweck"],
                               type=r["Buchungstext"].lower(), glaeubiger_id=sepa.get("glaeubiger", ""),
                               mandatsreferenz=sepa.get("mandat", ""), referenz=sepa.get("referenz", ""),
                               saldo_nach=betrag_de(r["Saldo"]) if r["Saldo"] else None, quelle=Path(pfad).name))
    return aus


def erkenne(pfad) -> str | None:
    """Welcher Parser passt zu dieser Datei? None = unbekannt."""
    p = Path(pfad)
    if p.suffix.lower() == ".xml":
        return "camt053"
    if p.suffix.lower() == ".pdf":
        return "commerzbank_pdf"   # bisher einziger PDF-Parser; prüft selbst, ob es ein Commerzbank-Auszug ist
    kopf = "\n".join(lies_text(p).splitlines()[:20])
    if "Auftragskonto" in kopf and "Glaeubiger ID" in kopf:
        return "sparkasse"
    if "Zahlungsempfänger*in" in kopf:
        return "dkb"
    if "Auftraggeber/Empfänger" in kopf:
        return "ing_de"
    return None
