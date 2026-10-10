"""Parser für ISO 20022 camt.053 (Kontoauszug als XML). Funktioniert für jede Bank, die camt.053 liefert
(viele Sparkassen, Volksbanken und Direktbanken bieten es im Online-Banking an).

Bevorzugtes Format: strukturiert, mit Anfangs- und Endsaldo je Auszug (also prüfbar) und den
SEPA-Feldern (Gläubiger-ID, Mandatsreferenz) als eigenen Elementen.
"""
from __future__ import annotations
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path
from transaktion import Transaktion, datum


def _ns(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _finde(el, pad: str):
    """Namespace-unabhängig suchen: Pfad als 'A/B/C' mit lokalen Namen."""
    aktuell = [el]
    for teil in pad.split("/"):
        naechste = []
        for h in aktuell:
            naechste += [k for k in h if _ns(k.tag) == teil]
        aktuell = naechste
        if not aktuell:
            return None
    return aktuell[0]


def _text(el, pad: str) -> str:
    x = _finde(el, pad)
    return (x.text or "").strip() if x is not None else ""


def _alle(el, naam: str):
    return [k for k in el if _ns(k.tag) == naam]


def parse(pad: str | Path) -> tuple[list[Transaktion], list[dict]]:
    """Liefert (transaktionen, auszuege). Je Auszug: konto, anfang, ende, summe, stimmt."""
    wurzel = ET.parse(pad).getroot()
    stmts = [e for e in wurzel.iter() if _ns(e.tag) == "Stmt"]
    transaktionen, auszuege = [], []
    for st in stmts:
        iban = _text(st, "Acct/Id/IBAN")
        saldi = {}
        for bal in _alle(st, "Bal"):
            code = _text(bal, "Tp/CdOrPrtry/Cd")
            s = Decimal(_text(bal, "Amt"))
            if _text(bal, "CdtDbtInd") == "DBIT":
                s = -s
            saldi[code] = s
        summe = Decimal(0)
        for n in _alle(st, "Ntry"):
            betrag = Decimal(_text(n, "Amt"))
            if _text(n, "CdtDbtInd") == "DBIT":
                betrag = -betrag
            summe += betrag
            buchungsdatum = _text(n, "BookgDt/Dt") or _text(n, "BookgDt/DtTm")[:10]
            tx = _finde(n, "NtryDtls/TxDtls")
            debet = betrag < 0
            partei = "Cdtr" if debet else "Dbtr"
            t = Transaktion(datum=datum(buchungsdatum), konto=iban, betrag=betrag, quelle=Path(pad).name)
            if tx is not None:
                t.gegenpartei = _text(tx, f"RltdPties/{partei}/Nm") or _text(tx, f"RltdPties/{partei}/Pty/Nm")
                t.gegenkonto = _text(tx, f"RltdPties/{partei}Acct/Id/IBAN")
                rmt = _finde(tx, "RmtInf")
                ustrd = [(u.text or "").strip() for u in _alle(rmt, "Ustrd")] if rmt is not None else []
                t.verwendungszweck = " ".join(u for u in ustrd if u) or _text(tx, "RmtInf/Strd/CdtrRefInf/Ref")
                t.mandatsreferenz = _text(tx, "Refs/MndtId")
                t.referenz = _text(tx, "Refs/EndToEndId")
                if t.referenz.upper() == "NOTPROVIDED":
                    t.referenz = ""
                t.glaeubiger_id = (_text(tx, "RltdPties/Cdtr/Id/PrvtId/Othr/Id")
                                  or _text(tx, "RltdPties/Cdtr/Pty/Id/PrvtId/Othr/Id"))
            if not t.verwendungszweck:
                t.verwendungszweck = _text(n, "AddtlNtryInf")
            dom = _text(n, "BkTxCd/Domn/Fmly/SubFmlyCd")
            t.type = {"DDBT": "lastschrift", "ESCT": "überweisung", "STDO": "dauerauftrag",
                      "POSD": "kartenzahlung", "CWDL": "geldautomat"}.get(dom, dom.lower())
            transaktionen.append(t)
        anfang, ende = saldi.get("OPBD"), saldi.get("CLBD")
        auszuege.append({"konto": iban, "id": _text(st, "Id"), "anfang": anfang, "ende": ende, "summe": summe,
                            "stimmt": None if anfang is None or ende is None else anfang + summe == ende,
                            "quelle": Path(pad).name})
    return transaktionen, auszuege
