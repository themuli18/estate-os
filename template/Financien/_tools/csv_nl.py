"""Parsers voor de CSV/TXT-exports van ING, Rabobank en ABN AMRO.

Het formaat wordt herkend aan de kopregel (ABN AMRO-TXT heeft er geen en wordt herkend aan de tabs).
Banken veranderen hun exports af en toe: klopt een kolomnaam niet meer, dan meldt de parser welke kolom
ontbreekt. Pas dan alleen de KOLOMMEN-tabel van die bank aan.
"""
from __future__ import annotations
import csv, io
from pathlib import Path
from transactie import Transactie, bedrag_nl, datum, sepa_velden


def lees_tekst(pad: str | Path) -> str:
    ruw = Path(pad).read_bytes()
    for enc in ("utf-8-sig", "cp1252"):
        try:
            return ruw.decode(enc)
        except UnicodeDecodeError:
            pass
    return ruw.decode("latin-1")


def _rijen(tekst: str) -> tuple[list[str], list[dict]]:
    eerste = tekst.splitlines()[0]
    scheiding = ";" if eerste.count(";") > eerste.count(",") else ","
    lezer = csv.DictReader(io.StringIO(tekst), delimiter=scheiding)
    return lezer.fieldnames or [], list(lezer)


def _eis(kop: list[str], nodig: list[str], bank: str):
    mist = [k for k in nodig if k not in kop]
    if mist:
        raise ValueError(f"{bank}: kolom(men) ontbreken {mist}. Gevonden: {kop}")


# ---------------------------------------------------------------- ING
ING = ["Datum", "Naam / Omschrijving", "Rekening", "Tegenrekening", "Code", "Af Bij", "Bedrag (EUR)",
       "Mutatiesoort", "Mededelingen"]   # nieuwere exports: ook "Saldo na mutatie", "Tag"


def ing(pad) -> list[Transactie]:
    kop, rijen = _rijen(lees_tekst(pad))
    _eis(kop, ING, "ING")
    uit = []
    for r in rijen:
        b = bedrag_nl(r["Bedrag (EUR)"])
        if r["Af Bij"].strip().lower() == "af":
            b = -b
        sepa = sepa_velden(r["Mededelingen"])
        uit.append(Transactie(
            datum=datum(r["Datum"]), rekening=r["Rekening"].strip(), bedrag=b,
            tegenpartij=r["Naam / Omschrijving"].strip(), tegenrekening=r["Tegenrekening"].strip(),
            omschrijving=sepa.get("omschrijving") or r["Mededelingen"].strip(),
            type=r["Mutatiesoort"].strip().lower(),
            incassant_id=sepa.get("incassant", ""), machtigingskenmerk=sepa.get("machtiging", ""),
            kenmerk=sepa.get("kenmerk", ""),
            saldo_na=bedrag_nl(r["Saldo na mutatie"]) if r.get("Saldo na mutatie") else None,
            bron=Path(pad).name))
    return uit


# ---------------------------------------------------------------- Rabobank
RABO = ["IBAN/BBAN", "Datum", "Bedrag", "Saldo na trn", "Tegenrekening IBAN/BBAN", "Naam tegenpartij",
        "Code", "Machtigingskenmerk", "Incassant ID", "Betalingskenmerk", "Omschrijving-1"]
_RABO_CODE = {"id": "incasso", "ei": "incasso", "cb": "overboeking", "tb": "overboeking", "ba": "betaalautomaat",
              "ga": "geldautomaat", "bg": "bankgiro", "st": "storting", "db": "diverse boekingen"}


def rabobank(pad) -> list[Transactie]:
    kop, rijen = _rijen(lees_tekst(pad))
    _eis(kop, RABO, "Rabobank")
    uit = []
    for r in rijen:
        omschr = " ".join(r.get(k, "").strip() for k in ("Omschrijving-1", "Omschrijving-2", "Omschrijving-3")).strip()
        uit.append(Transactie(
            datum=datum(r["Datum"]), rekening=r["IBAN/BBAN"].strip(), bedrag=bedrag_nl(r["Bedrag"]),
            tegenpartij=r["Naam tegenpartij"].strip(), tegenrekening=r["Tegenrekening IBAN/BBAN"].strip(),
            omschrijving=omschr, type=_RABO_CODE.get(r["Code"].strip().lower(), r["Code"].strip().lower()),
            incassant_id=r["Incassant ID"].strip(), machtigingskenmerk=r["Machtigingskenmerk"].strip(),
            kenmerk=r["Betalingskenmerk"].strip(), saldo_na=bedrag_nl(r["Saldo na trn"]) if r["Saldo na trn"] else None,
            bron=Path(pad).name))
    return uit


# ---------------------------------------------------------------- ABN AMRO (TXT, tab-gescheiden, geen kopregel)
# Kolommen: rekeningnummer, munt, transactiedatum, beginsaldo, eindsaldo, rentedatum, bedrag, omschrijving
def abnamro_txt(pad) -> list[Transactie]:
    uit = []
    for regel in lees_tekst(pad).splitlines():
        if not regel.strip():
            continue
        k = regel.split("\t")
        if len(k) < 8:
            raise ValueError(f"ABN AMRO: verwacht 8 tab-gescheiden kolommen, kreeg {len(k)}: {regel[:80]!r}")
        omschr = "\t".join(k[7:]).strip()
        sepa = sepa_velden(omschr)
        t = Transactie(datum=datum(k[2]), rekening=k[0].strip(), bedrag=bedrag_nl(k[6]),
                       tegenpartij=sepa.get("naam", ""), tegenrekening=sepa.get("iban", ""),
                       omschrijving=sepa.get("omschrijving") or " ".join(omschr.split()),
                       type=(sepa.get("type") or omschr.split(" ")[0]).lower(),
                       incassant_id=sepa.get("incassant", ""), machtigingskenmerk=sepa.get("machtiging", ""),
                       kenmerk=sepa.get("kenmerk", ""), saldo_na=bedrag_nl(k[4]), bron=Path(pad).name)
        t.extra["beginsaldo"] = bedrag_nl(k[3])
        uit.append(t)
    return uit


def herken(pad) -> str | None:
    """Welke parser past bij dit bestand? None = onbekend."""
    p = Path(pad)
    if p.suffix.lower() == ".xml":
        return "camt053"
    tekst = lees_tekst(p)
    eerste = tekst.splitlines()[0] if tekst else ""
    if "Naam / Omschrijving" in eerste and "Af Bij" in eerste:
        return "ing"
    if "IBAN/BBAN" in eerste and "Saldo na trn" in eerste:
        return "rabobank"
    if eerste.count("\t") >= 7:
        return "abnamro_txt"
    return None
