"""Gemeenschappelijk model voor alle bankparsers + hulpfuncties voor Nederlandse bedragen en SEPA-velden."""
from __future__ import annotations
import re
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from decimal import Decimal


@dataclass
class Transactie:
    datum: date                 # boekdatum
    rekening: str               # eigen IBAN
    bedrag: Decimal             # negatief = af, positief = bij
    tegenpartij: str = ""       # naam tegenpartij zoals de bank hem levert
    tegenrekening: str = ""     # IBAN tegenpartij
    omschrijving: str = ""      # vrije tekst / mededelingen
    type: str = ""              # incasso, overboeking, betaalautomaat, ...
    incassant_id: str = ""      # SEPA Creditor ID (bijv. NL12ZZZ123456780000)
    machtigingskenmerk: str = ""  # SEPA mandaatreferentie – bevat vaak het contractnummer
    kenmerk: str = ""           # betalingskenmerk / end-to-end-referentie
    saldo_na: Decimal | None = None
    bron: str = ""              # bestandsnaam waaruit de regel komt
    leverancier: str = ""       # toegekend door leveranciers.py
    categorie: str = ""
    extra: dict = field(default_factory=dict)

    def sleutel(self) -> tuple:
        """Voor ontdubbelen: dezelfde boeking uit twee overlappende exports."""
        return (self.rekening, self.datum, self.bedrag, self.tegenrekening, self.omschrijving[:60])

    def als_dict(self) -> dict:
        d = asdict(self); d.pop("extra"); return d


def bedrag_nl(s: str) -> Decimal:
    """'1.234,56' / '-12,34' / '+12,34' / '12.34' -> Decimal."""
    s = s.strip().replace(" ", "").replace(" ", "")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    return Decimal(s)


def datum(s: str) -> date:
    s = s.strip()
    for fmt in ("%Y%m%d", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"onbekend datumformaat: {s!r}")


# SEPA-velden in vrije tekst. Twee gangbare notaties:
#  1. Slash-notatie (o.a. ABN AMRO, MT940):  /TRTP/SEPA Incasso/CSID/NL..ZZZ../NAME/Bedrijf/MARF/123/REMI/tekst/IBAN/NL..
#  2. Label-notatie (o.a. ING-mededelingen): Naam: Bedrijf Omschrijving: tekst IBAN: NL.. Kenmerk: .. Machtiging ID: .. Incassant ID: ..
_SLASH_TAGS = ("TRTP", "CSID", "NAME", "MARF", "REMI", "IBAN", "BIC", "EREF", "ORDP", "BENM", "ID", "ADDR")
_LABELS = {"Naam": "naam", "Omschrijving": "omschrijving", "IBAN": "iban", "Kenmerk": "kenmerk",
           "Machtiging ID": "machtiging", "Incassant ID": "incassant", "Doorlopende incasso": "_",
           "Datum/Tijd": "_", "Pasvolgnr": "_", "Transactie": "_", "Term": "_", "Valutadatum": "_"}


def sepa_velden(tekst: str) -> dict:
    """Haalt naam, iban, incassant, machtiging, kenmerk en omschrijving uit vrije tekst."""
    uit: dict[str, str] = {}
    if "/TRTP/" in tekst or "/CSID/" in tekst or "/REMI/" in tekst:
        delen = re.split(r"/(" + "|".join(_SLASH_TAGS) + r")/", "/" + tekst.strip().lstrip("/"))
        # delen = ['', TAG, waarde, TAG, waarde, ...]
        for i in range(1, len(delen) - 1, 2):
            uit.setdefault(delen[i], delen[i + 1].strip())
        return {"naam": uit.get("NAME", ""), "iban": uit.get("IBAN", ""), "incassant": uit.get("CSID", ""),
                "machtiging": uit.get("MARF", ""), "kenmerk": uit.get("EREF", ""),
                "omschrijving": uit.get("REMI", ""), "type": uit.get("TRTP", "")}
    patroon = r"(" + "|".join(re.escape(l) for l in sorted(_LABELS, key=len, reverse=True)) + r"):\s*"
    delen = re.split(patroon, tekst)
    for i in range(1, len(delen) - 1, 2):
        sleutel = _LABELS[delen[i]]
        if sleutel != "_":
            uit.setdefault(sleutel, delen[i + 1].strip())
    # Identificatoren bevatten geen spaties; wat erachter staat ("Doorlopende incasso" e.d.) hoort er niet bij.
    for k in ("iban", "incassant", "machtiging", "kenmerk"):
        if uit.get(k):
            uit[k] = uit[k].split()[0]
    return uit
