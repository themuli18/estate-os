#!/usr/bin/env python3
"""Bouwt Financien/Transacties.xlsx uit alle bankexports in Financien/<bank>/.

Gebruik:  python3 Financien/_tools/bouw_overzicht.py            (vanuit de repo-root, met de .venv)
Herkent automatisch: camt.053 (XML), ING-CSV, Rabobank-CSV, ABN AMRO-TXT. Onbekende bestanden worden gemeld.

Stappen: parsen -> ontdubbelen -> saldi controleren -> gaten melden -> eigen overboekingen markeren ->
leverancier/categorie toekennen -> terugkerende betalingen bepalen -> werkmap schrijven.
De werkmap wordt altijd volledig opnieuw gebouwd: nooit met de hand bewerken, Excel eerst sluiten.
"""
from __future__ import annotations
import sys
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
from statistics import median

sys.path.insert(0, str(Path(__file__).parent))
import camt053, csv_nl                       # noqa: E402
from leveranciers import indelen, INTERN     # noqa: E402

FIN = Path(__file__).resolve().parent.parent
UIT = FIN / "Transacties.xlsx"


def verzamel(map_: Path):
    transacties, controles, onbekend = [], [], []
    for p in sorted(map_.rglob("*")):
        if not p.is_file() or "_tools" in p.parts or p.name.startswith((".", "~$")) or p.suffix.lower() in (".md", ".xlsx", ".pdf"):
            continue
        soort = csv_nl.herken(p)
        if soort == "camt053":
            t, afschriften = camt053.parse(p)
            for a in afschriften:
                controles.append((p.name, a["rekening"], f"afschrift {a['id']}", a["klopt"],
                                  f"begin {a['begin']} + mutaties {a['som']} = eind {a['eind']}"))
        elif soort:
            t = getattr(csv_nl, soort)(p)
            controles.append(controleer_saldi(p.name, t, soort))
        else:
            onbekend.append(p.name); continue
        transacties += t
    return transacties, controles, onbekend


def controleer_saldi(naam, t, soort):
    """Lopend saldo per regel controleren, in de volgorde van het bestand (oplopend of aflopend)."""
    if soort == "abnamro_txt":
        fout = [x for x in t if x.extra["beginsaldo"] + x.bedrag != x.saldo_na]
        return (naam, t[0].rekening if t else "", "beginsaldo + bedrag = eindsaldo per regel", not fout, f"{len(fout)} afwijkingen")
    met = [x for x in t if x.saldo_na is not None]
    if len(met) < 2:
        return (naam, t[0].rekening if t else "", "lopend saldo", None, "geen saldi in export – niet te controleren")
    op = sum(1 for a, b in zip(met, met[1:]) if a.saldo_na + b.bedrag != b.saldo_na)
    af = sum(1 for a, b in zip(met, met[1:]) if b.saldo_na + a.bedrag != a.saldo_na)
    fout = min(op, af)
    return (naam, met[0].rekening, "lopend saldo", fout == 0, f"{fout} breuken (o.a. meerdere rekeningen in één bestand)" if fout else "sluitend")


def ontdubbel(t):
    gezien, uit = set(), []
    for x in sorted(t, key=lambda x: (x.rekening, x.datum)):
        if x.sleutel() not in gezien:
            gezien.add(x.sleutel()); uit.append(x)
    return uit


def gaten(t):
    per = defaultdict(set)
    for x in t:
        per[x.rekening].add((x.datum.year, x.datum.month))
    meldingen = []
    for rek, mnd in per.items():
        j, m = min(mnd); eind = max(mnd)
        while (j, m) < eind:
            if (j, m) not in mnd:
                meldingen.append((rek, f"{j}-{m:02d}"))
            j, m = (j + 1, 1) if m == 12 else (j, m + 1)
    return meldingen


def frequentie(dagen: float) -> str:
    for grens, naam in ((10, "wekelijks"), (40, "maandelijks"), (100, "per kwartaal"), (200, "halfjaarlijks"), (400, "jaarlijks")):
        if dagen <= grens:
            return naam
    return "onregelmatig"


def terugkerend(t):
    groepen = defaultdict(list)
    for x in t:
        if x.bedrag >= 0 or x.categorie == INTERN:
            continue
        sleutel = (x.incassant_id, x.machtigingskenmerk) if x.incassant_id else ("", x.tegenrekening or x.tegenpartij.upper())
        groepen[sleutel].append(x)
    rijen = []
    for (inc, ref), xs in groepen.items():
        maanden = {(x.datum.year, x.datum.month) for x in xs}
        if len(maanden) < 2 and not inc:
            continue
        xs.sort(key=lambda x: x.datum)
        tussen = [(b.datum - a.datum).days for a, b in zip(xs, xs[1:])]
        laatste = xs[-1]
        per_jaar = sum(-x.bedrag for x in xs) / max(Decimal((xs[-1].datum - xs[0].datum).days or 365) / 365, Decimal(1))
        rijen.append([laatste.leverancier, laatste.categorie, laatste.rekening, inc, ref if inc else "",
                      laatste.tegenrekening, len(xs), frequentie(median(tussen)) if tussen else "eenmalig (incasso)",
                      xs[0].datum, laatste.datum, float(-laatste.bedrag), float(round(per_jaar, 2))])
    return sorted(rijen, key=lambda r: -r[-1])


def schrijf(t, controles, gat, terug, onbekend):
    from openpyxl import Workbook
    from openpyxl.worksheet.table import Table, TableStyleInfo
    from openpyxl.utils import get_column_letter
    wb = Workbook()

    def tabblad(titel, kop, rijen, tabel=None, eerste=False):
        ws = wb.active if eerste else wb.create_sheet()
        ws.title = titel
        ws.append(kop)
        for r in rijen:
            ws.append(r)
        if tabel and rijen:
            ref = f"A1:{get_column_letter(len(kop))}{len(rijen) + 1}"
            tb = Table(displayName=tabel, ref=ref)
            tb.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
            ws.add_table(tb)
        for i, k in enumerate(kop, 1):
            ws.column_dimensions[get_column_letter(i)].width = max(10, min(45, len(k) + 4))
        ws.freeze_panes = "A2"
        return ws

    kop = ["Datum", "Rekening", "Bedrag", "Leverancier", "Categorie", "Tegenpartij", "Tegenrekening", "Omschrijving",
           "Type", "Incassant-ID", "Machtigingskenmerk", "Kenmerk", "Jaar", "Maand", "Bron"]
    tabblad("Transacties", kop, [[x.datum, x.rekening, float(x.bedrag), x.leverancier, x.categorie, x.tegenpartij,
                                  x.tegenrekening, x.omschrijving, x.type, x.incassant_id, x.machtigingskenmerk,
                                  x.kenmerk, x.datum.year, f"{x.datum:%Y-%m}", x.bron] for x in t], "tblTransacties", True)
    tabblad("Terugkerend", ["Leverancier", "Categorie", "Rekening", "Incassant-ID", "Machtigingskenmerk", "Tegenrekening",
                            "Aantal", "Frequentie", "Eerste", "Laatste", "Laatste bedrag", "Per jaar (gem.)"], terug, "tblTerugkerend")
    # categorie x maand (alleen extern)
    som = defaultdict(Decimal); maanden = sorted({f"{x.datum:%Y-%m}" for x in t})
    for x in t:
        if x.categorie != INTERN:
            som[(x.categorie, f"{x.datum:%Y-%m}")] += x.bedrag
    cats = sorted({c for c, _ in som})
    tabblad("Per maand", ["Categorie"] + maanden, [[c] + [float(som.get((c, m), 0)) for m in maanden] for c in cats])
    rijen = [list(c) for c in controles] + [[r, "", f"geen boekingen in {m}", False, "export ontbreekt?"] for r, m in gat] \
        + [[o, "", "onbekend formaat", False, "niet ingelezen"] for o in onbekend]
    tabblad("Controle", ["Bestand/rekening", "Rekening", "Controle", "Klopt", "Toelichting"], rijen)
    wb.save(UIT)


def main():
    t, controles, onbekend = verzamel(FIN)
    voor = len(t); t = ontdubbel(t)
    eigen = {x.rekening.replace(" ", "") for x in t}
    for x in t:
        x.leverancier, x.categorie = indelen(x.tegenpartij, x.omschrijving)
        if x.tegenrekening.replace(" ", "") in eigen:
            x.leverancier, x.categorie = "Eigen rekening", INTERN
    gat = gaten(t); terug = terugkerend(t)
    schrijf(t, controles, gat, terug, onbekend)
    print(f"{len(t)} transacties ({voor - len(t)} dubbel verwijderd) uit {len({x.bron for x in t})} bestanden, "
          f"{len(eigen)} eigen rekening(en).")
    for c in controles:
        if c[3] is False:
            print(f"  LET OP  {c[0]}: {c[2]} – {c[4]}")
    for r, m in gat:
        print(f"  GAT     {r}: geen boekingen in {m}")
    for o in onbekend:
        print(f"  ONBEKEND formaat, niet ingelezen: {o}")
    overig = sum(1 for x in t if x.categorie == "Overig")
    print(f"{len(terug)} terugkerende betalingen; {overig} transacties in 'Overig' (regels aanvullen in leveranciers.py).")
    print(f"-> {UIT.relative_to(FIN.parent)}")


if __name__ == "__main__":
    main()
