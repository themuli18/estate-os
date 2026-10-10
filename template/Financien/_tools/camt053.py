"""Parser voor ISO 20022 camt.053 (dagafschrift in XML). Werkt voor elke bank die camt.053 levert.

Voorkeursformaat: gestructureerd, met begin- en eindsaldo per afschrift (dus controleerbaar) en
de SEPA-velden (incassant-ID, machtigingskenmerk) als aparte elementen.
"""
from __future__ import annotations
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path
from transactie import Transactie, datum


def _ns(tag: str) -> str:
    return tag.split("}", 1)[-1]


def _vind(el, pad: str):
    """Namespace-onafhankelijk zoeken: pad als 'A/B/C' met lokale namen."""
    huidige = [el]
    for deel in pad.split("/"):
        volgende = []
        for h in huidige:
            volgende += [k for k in h if _ns(k.tag) == deel]
        huidige = volgende
        if not huidige:
            return None
    return huidige[0]


def _tekst(el, pad: str) -> str:
    x = _vind(el, pad)
    return (x.text or "").strip() if x is not None else ""


def _alle(el, naam: str):
    return [k for k in el if _ns(k.tag) == naam]


def parse(pad: str | Path) -> tuple[list[Transactie], list[dict]]:
    """Geeft (transacties, afschriften). Elk afschrift: rekening, begin, eind, som, klopt."""
    wortel = ET.parse(pad).getroot()
    stmts = [e for e in wortel.iter() if _ns(e.tag) == "Stmt"]
    transacties, afschriften = [], []
    for st in stmts:
        iban = _tekst(st, "Acct/Id/IBAN")
        saldi = {}
        for bal in _alle(st, "Bal"):
            code = _tekst(bal, "Tp/CdOrPrtry/Cd")
            s = Decimal(_tekst(bal, "Amt"))
            if _tekst(bal, "CdtDbtInd") == "DBIT":
                s = -s
            saldi[code] = s
        som = Decimal(0)
        for n in _alle(st, "Ntry"):
            bedrag = Decimal(_tekst(n, "Amt"))
            if _tekst(n, "CdtDbtInd") == "DBIT":
                bedrag = -bedrag
            som += bedrag
            boekdatum = _tekst(n, "BookgDt/Dt") or _tekst(n, "BookgDt/DtTm")[:10]
            tx = _vind(n, "NtryDtls/TxDtls")
            debet = bedrag < 0
            partij = "Cdtr" if debet else "Dbtr"
            t = Transactie(datum=datum(boekdatum), rekening=iban, bedrag=bedrag, bron=Path(pad).name)
            if tx is not None:
                t.tegenpartij = _tekst(tx, f"RltdPties/{partij}/Nm") or _tekst(tx, f"RltdPties/{partij}/Pty/Nm")
                t.tegenrekening = _tekst(tx, f"RltdPties/{partij}Acct/Id/IBAN")
                rmt = _vind(tx, "RmtInf")
                ustrd = [(u.text or "").strip() for u in _alle(rmt, "Ustrd")] if rmt is not None else []
                t.omschrijving = " ".join(u for u in ustrd if u) or _tekst(tx, "RmtInf/Strd/CdtrRefInf/Ref")
                t.machtigingskenmerk = _tekst(tx, "Refs/MndtId")
                t.kenmerk = _tekst(tx, "Refs/EndToEndId")
                if t.kenmerk.upper() == "NOTPROVIDED":
                    t.kenmerk = ""
                t.incassant_id = (_tekst(tx, "RltdPties/Cdtr/Id/PrvtId/Othr/Id")
                                  or _tekst(tx, "RltdPties/Cdtr/Pty/Id/PrvtId/Othr/Id"))
            if not t.omschrijving:
                t.omschrijving = _tekst(n, "AddtlNtryInf")
            dom = _tekst(n, "BkTxCd/Domn/Fmly/SubFmlyCd")
            t.type = {"DDBT": "incasso", "ESCT": "overboeking", "STDO": "periodieke overboeking",
                      "POSD": "betaalautomaat", "CWDL": "geldautomaat"}.get(dom, dom.lower())
            transacties.append(t)
        begin, eind = saldi.get("OPBD"), saldi.get("CLBD")
        afschriften.append({"rekening": iban, "id": _tekst(st, "Id"), "begin": begin, "eind": eind, "som": som,
                            "klopt": None if begin is None or eind is None else begin + som == eind,
                            "bron": Path(pad).name})
    return transacties, afschriften
