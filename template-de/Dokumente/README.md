# Dokumente – Ablageschema

Alle Unterlagen zu [VERSTORBENE PERSON] und [PARTNER], eingescannt und nach Sachgebiet sortiert.
**[00_INDEX.md](00_INDEX.md) ist das Inhaltsverzeichnis** – zu jedem Dokument Datum, Absender, Betreff, Person und die
wichtige Nummer (Versicherungs-, Kunden-, Kassenzeichen). Wer etwas sucht, sucht dort, nicht im Dateisystem.

## Ordner

| Ordner | Inhalt |
|---|---|
| `01_Personenstand` | Sterbeurkunde, Testament, Erbschein, Heiratsurkunde, Ausweise, Vollmachten. Was fehlt: `_ZU_SCANNEN.md`. |
| `02_Bestattung` | Bestatter, Kostenvoranschlag und Rechnung, Friedhof, Grabstätte, Trauerfeier. |
| `03_Renten` | Deutsche Rentenversicherung, Renten Service, Betriebsrenten, Hinterbliebenenrente. |
| `04_Versicherungen` | Lebens-, Unfall-, Sterbegeld-, Hausrat-, Wohngebäude-, Haftpflicht-, Rechtsschutz-, Kranken(zusatz)versicherung. Übersicht: `00_Versicherungsuebersicht.md`. |
| `05_Gesundheit` | Arztbriefe, Befunde, Krankenhaus, Krankenkasse, Pflegekasse. |
| `06_Haus_Energie_Abgaben` | Grundsteuer, Abfall, Strom, Gas, Wasser, Schornsteinfeger, Miete/Kredit. Übersicht: `00_Versorgeruebersicht.md`. |
| `07_Fahrzeuge` | Zulassung, HU, Kfz-Steuer, **Kfz-Versicherung**, Werkstatt – alles zum Auto an einem Ort. |
| `08_Steuern` | Finanzamt, ELSTER, Rentenbezugsmitteilungen, Erbschaftsteuer, Einkommensteuer. |
| `09_Abos_und_Mitgliedschaften` | Zeitungen, Streaming, Vereine, Spenden. |
| `10_Telekommunikation` | Festnetz, Internet, Mobilfunk. |
| `11_Bank` | Banken, Konten, Depots, Zugangsverfahren. |
| `_Original` | Unveränderte Exporte (ZIP) als Beleg. Nicht in git (siehe `.gitignore`). |

## Was wird aufgenommen, was nicht

Das Archiv ist **kein Belegarchiv**, sondern die Aktenlage zum Nachlass und zur laufenden Verwaltung.
Aufgenommen wird, was eine dieser Bedingungen erfüllt:

1. **Vertrag oder wiederkehrende Verpflichtung**, die noch läuft – unabhängig vom Alter des Dokuments.
2. **Bescheid einer Behörde, Kasse oder Versicherung** (Rente, Steuer, Grundsteuer, Krankenkasse).
3. **Unterlagen zum Sterbefall und Nachlass** (Bestattung, Urkunden, Notar, Nachlassgericht).

Nicht aufgenommen: einmalige Kaufbelege (Kleidung, Geschenke, Elektronik, Reisen), Werbung, Newsletter.

## Dateibenennung

```
JJJJ-MM-TT_Absender_Betreff_Person.ext
2026-05-19_Beispiel-Versicherung_Versicherungsschein-Hausrat-12345678_Partner.pdf
```

- **Datum = Datum des Dokuments**, nicht des Scans.
- **Absender und Betreff**: Wörter mit `-` verbunden, keine Leerzeichen, Umlaute umschrieben (ae, oe, ue, ss).
- **Der Betreff enthält die unterscheidende Nummer** (Vertrags-, Kunden-, Rechnungsnummer), sonst überschreiben sich gleiche Namen.
- **Person**: Vorname, oder `Name1-Name2`, wenn beide betroffen sind.

## Ein neues Dokument einsortieren

1. Datum, Absender und Nummer aus dem Dokument selbst lesen (`zsh _tools/ocr.sh datei.pdf`).
2. Nach Schema benennen und in den passenden Ordner legen.
3. Durchsuchbar machen: `python3 _tools/textebene.py Dokumente/<ordner>/<datei>.pdf`.
4. Zeile in `00_INDEX.md` ergänzen und die Zähler oben anpassen.
5. Folgen festhalten: neue Frist → `TODO.md` + `CLAUDE.md` Abschnitt 7; neuer Kontakt → Abschnitt 8.
6. `python3 _tools/pruefe_archiv.py` – muss sauber sein.
7. Committen und pushen.

Der Skill `post-verarbeiten` erledigt Schritt 1–7 für einen ganzen Scan-Eingang.

## Grenzen der Texterkennung

Abfotografierte Briefe: Wörter zuverlässig, **Ziffernfolgen nicht**. Jede Nummer aus solchen Scans gegen das Bild oder ein
zweites Dokument prüfen, bevor sie in ein Schreiben an eine Behörde geht. Die Nummern im Index sind geprüft.
ScanSnap- oder Flachbettscans mit 300 dpi sind deutlich zuverlässiger.

## Zugangsdaten

Dokumente mit PIN/PUK, Aktivierungscodes oder Passwörtern (SIM, ELSTER-Aktivierung, photoTAN, Internetzugang) werden im
Index mit 🔒 markiert. **Diese Dateien gehören in keine E-Mail und in keinen Cloud-Ordner.**

## Datenschutz

Die Unterlagen enthalten Gesundheitsdaten, Versicherungsnummern, Steuer-ID und die Anschrift. Sie bleiben in diesem
Ordner und auf der privaten Sicherung. Behörden bekommen nur das einzelne Dokument, das verlangt wird.
