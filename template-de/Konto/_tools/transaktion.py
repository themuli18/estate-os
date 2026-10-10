"""Gemeinsames Modell für alle Bank-Parser + Hilfsfunktionen für deutsche Beträge, Datumsangaben und SEPA-Felder."""
from __future__ import annotations
import re
from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from decimal import Decimal


@dataclass
class Transaktion:
    datum: date                   # Buchungstag
    konto: str                    # eigenes Konto (IBAN oder bei Karten "Karte …1234")
    betrag: Decimal               # negativ = Belastung, positiv = Gutschrift
    gegenpartei: str = ""         # Auftraggeber/Empfänger, wie die Bank ihn liefert
    gegenkonto: str = ""          # IBAN der Gegenseite
    verwendungszweck: str = ""
    type: str = ""                # Lastschrift, Überweisung, Dauerauftrag, Kartenzahlung, …
    glaeubiger_id: str = ""       # SEPA-Gläubiger-ID (z. B. DE98ZZZ09999999999)
    mandatsreferenz: str = ""     # enthält oft die Vertrags- oder Kundennummer
    referenz: str = ""            # End-to-End-Referenz / Kundenreferenz
    saldo_nach: Decimal | None = None
    quelle: str = ""              # Dateiname
    anbieter: str = ""            # vergeben durch anbieter.py
    kategorie: str = ""
    extra: dict = field(default_factory=dict)

    def schluessel(self) -> tuple:
        """Zum Entdoppeln: dieselbe Buchung aus zwei überlappenden Exporten."""
        return (self.konto, self.datum, self.betrag, self.gegenkonto, self.verwendungszweck[:60])

    def als_dict(self) -> dict:
        d = asdict(self); d.pop("extra"); return d


def betrag_de(s: str) -> Decimal:
    """'1.234,56' / '-12,34' / '12,34-' (nachgestelltes Minus wie auf Auszügen) -> Decimal."""
    s = s.strip().replace(" ", "").replace(" ", "").replace("€", "").replace("EUR", "")
    neg = s.endswith("-")
    s = s.rstrip("-").lstrip("+")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    v = Decimal(s)
    return -v if neg else v


def datum(s: str) -> date:
    s = s.strip()
    for fmt in ("%d.%m.%Y", "%d.%m.%y", "%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"unbekanntes Datumsformat: {s!r}")


# SEPA-Felder im Freitext (z. B. MT940 :86: oder manche CSV-Verwendungszwecke):
#   Schlüsselwort-Notation: EREF+... MREF+... CRED+... SVWZ+... ABWA+...
_SEPA = {"EREF": "referenz", "MREF": "mandat", "CRED": "glaeubiger", "SVWZ": "zweck", "ABWA": "abw_auftraggeber",
         "ABWE": "abw_empfaenger", "KREF": "kundenreferenz", "IBAN": "iban", "BIC": "bic"}


def sepa_felder(text: str) -> dict:
    """Zerlegt 'EREF+123 MREF+ABC CRED+DE..ZZZ.. SVWZ+Beitrag' in ein Wörterbuch."""
    teile = re.split(r"\b(" + "|".join(_SEPA) + r")\+", text)
    aus = {}
    for i in range(1, len(teile) - 1, 2):
        aus.setdefault(_SEPA[teile[i]], teile[i + 1].strip())
    for k in ("referenz", "mandat", "glaeubiger", "iban"):
        if aus.get(k):
            aus[k] = aus[k].split()[0]
    return aus
