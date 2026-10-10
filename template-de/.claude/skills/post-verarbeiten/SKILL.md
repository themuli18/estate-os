---
name: post-verarbeiten
description: Neue Post verarbeiten, die mit dem ScanSnap gescannt wurde. Verwenden bei "neue Post", "ich habe gescannt", "verarbeite die Scans", "ist etwas im Scan-Eingang", oder als Teil der täglichen Prüfung.
---

# Post verarbeiten

Ziel: Jeder neue Scan liegt nach einer Sitzung richtig benannt im Archiv, mit Indexzeile, und jede Aufgabe oder Frist
daraus steht in `TODO.md`.

## Schritte

1. **Eingang lesen.** Ort steht in `CLAUDE.md` 2b.
   - Lokaler Ordner: Dateien direkt lesen.
   - Google Drive: mit Mail MCP `drive_search` / `drive_list_recent` (Konto aus 2b) die neuen Dateien finden, mit
     `drive_read_file` lesen. Dateien, die schon in `00_INDEX.md` stehen, überspringen.
2. **Je Dokument**: Text lesen (`pdftotext`; bei leerem Text `zsh _tools/ocr.sh datei.pdf`). Bestimmen:
   Dokumentdatum, Absender, Betreff, Person, unterscheidende Nummer, Ordner (siehe `Dokumente/README.md`).
   Erfüllt es die Aufnahmekriterien nicht → nicht ablegen, aber im Bericht nennen.
3. **Doppelt?** Nummer und Datum in `00_INDEX.md` suchen. Zweiter Scan desselben Blatts → überspringen.
4. **Ablegen**: nach `Dokumente/<ordner>/JJJJ-MM-TT_Absender_Betreff_Person.pdf` kopieren,
   `python3 _tools/textebene.py <pfad>` wenn noch keine Textebene, Indexzeile ergänzen, Zähler anpassen.
   Drive: Die Datei selbst kommt über den Drive-Desktop-Ordner oder einen Browser-Download nach `~/Downloads`;
   sonst die Nutzer darum bitten.
5. **Inhalt verarbeiten** – das Wichtigste:
   - Wird etwas verlangt (Formular, Zahlung, Antwort)? → `TODO.md` mit wer/bis wann/Stand.
   - Frist? Hart oder weich, mit Quelle → `TODO.md` **und** `CLAUDE.md` Abschnitt 7.
   - Bestätigt es etwas Offenes? → TODO-Zeile mit Datum durchstreichen.
   - Neue Stelle oder Nummer → `CLAUDE.md` Abschnitt 8.
   - Ziffern aus Handyfotos gegen eine zweite Quelle prüfen.
6. `python3 _tools/pruefe_archiv.py` – muss sauber sein.
7. **LOG.md**: Eintrag `## JJJJ-MM-TT — Neue Post (Name)`, je Dokument eine Zeile: Absender, Datum, Kern, Folge.
8. Eingang aufräumen: verarbeitete Dateien in den Unterordner `Erledigt` (nie löschen).
9. Committen (`git diff --cached --name-only --diff-filter=D` vorher leer!) und pushen.

## Bericht an die Nutzer

Kurz, auf Deutsch: je Dokument eine Zeile, dann **was jetzt zu tun ist** mit Frist. Dringendes zuerst.
