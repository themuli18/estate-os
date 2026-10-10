#!/usr/bin/env python3
"""Prüft das Dokumentenarchiv: eindeutige Dateinamen, Namensschema, Index vollständig, keine toten Links.

Aufruf: python3 _tools/pruefe_archiv.py [pfad/zum/original.zip]
Nach jeder Änderung in Dokumente/ laufen lassen und immer vor dem Löschen eines Originals.
Exitcode 1, wenn etwas nicht stimmt.
"""
import os, re, sys, collections, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(os.path.dirname(HERE), "Dokumente")
NAAM = re.compile(r"^\d{4}-\d{2}-\d{2}_[^_]+_[^_]+_[^_.]+\.[a-z0-9]+$")

docs = [os.path.join(r, f) for r, _, fs in os.walk(D) for f in fs
        if not f.endswith((".md", ".zip")) and not f.startswith(".") and "_Original" not in r]
namen = collections.Counter(os.path.basename(p) for p in docs)
dubbel = [n for n, c in namen.items() if c > 1]
fout_schema = [os.path.relpath(p, D) for p in docs if not NAAM.match(os.path.basename(p))]
index = open(os.path.join(D, "00_INDEX.md"), encoding="utf-8").read()
gelinkt = set(re.findall(r"\]\((\d\d_[^)]+)\)", index))
zonder_regel = [os.path.relpath(p, D) for p in docs if os.path.relpath(p, D) not in gelinkt]
dood = [l for l in gelinkt if not os.path.exists(os.path.join(D, l))]

print(f"Dokumente: {len(docs)} | Indexeinträge: {len(gelinkt)}")
for titel, lijst in (("Doppelte Dateinamen", dubbel), ("Weicht vom Namensschema ab", fout_schema),
                     ("Ohne Indexeintrag", zonder_regel), ("Index zeigt ins Leere", dood)):
    print(f"{titel}: {len(lijst)}")
    for x in sorted(lijst): print("   ", x)
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    z = sorted(i.file_size for i in zipfile.ZipFile(sys.argv[1]).infolist() if not i.is_dir())
    d = sorted(os.path.getsize(p) for p in docs)
    print("Abgleich mit ZIP:", "vollständig" if z == d else f"ABWEICHUNG ({len(z)} im ZIP, {len(d)} im Archiv)")
sys.exit(1 if (dubbel or fout_schema or zonder_regel or dood) else 0)
