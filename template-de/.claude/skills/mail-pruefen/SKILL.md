---
name: mail-pruefen
description: Die verbundenen Postfächer (über Mail MCP) auf Nachrichten prüfen, die für Nachlass oder Verwaltung wichtig oder dringend sind. Verwenden bei "prüf die Mails", "ist etwas gekommen", "tägliche Prüfung", oder als geplante Routine.
---

# Mails prüfen

Ziel: Nichts, was eine Frist, Geld oder eine Entscheidung enthält, bleibt ungesehen in einem Postfach liegen.

## Schritte

1. `list_accounts` – welche Postfächer gibt es, welche stehen auf „needs reconnect"? Eine getrennte Verbindung sofort melden.
2. **Zeitraum**: seit dem letzten `mail-pruefen`-Eintrag in `LOG.md` (sonst 7 Tage). Suchen mit `gmail_search`,
   `account: "all"`:
   - `after:JJJJ/MM/TT -category:promotions -category:social -in:sent`
   - gezielt nach Absendern aus `CLAUDE.md` Abschnitt 8 (Behörden, Notar, Versicherungen, Bank, Rentenservice,
     Finanzamt, Krankenkasse, Nachlassgericht) – auch wenn sie in einer anderen Kategorie gelandet sind.
   - nach Wörtern: `Mahnung OR Erinnerung OR Frist OR "bis zum" OR Inkasso OR Gerichtsvollzieher OR Kündigung OR
     Bescheid OR Nachlass OR Sterbefall OR Hinterbliebenen`.
3. **Einordnen** (nur lesen, nichts löschen, nichts als gelesen markieren):
   - **Dringend** – Frist binnen 14 Tagen, Zahlungsrückstand, Inkasso, Kündigung, Sperre, Sicherheitsmeldung einer
     Bank oder von ELSTER, Anforderung eines Dokuments.
   - **Wichtig** – jede Stelle aus Abschnitt 8, jeder Bescheid, Versicherungsschein, Jahresmitteilung, Rechnung eines
     laufenden Vertrags, Bestätigung von etwas Offenem in `TODO.md`.
   - **Info** – Tarif- oder Bedingungsänderungen bekannter Anbieter.
   - **Ignorieren** – Werbung, soziale Netzwerke, private Korrespondenz ohne Bezug zur Verwaltung.
     **Private Nachrichten nicht zusammenfassen und nicht loggen.**
4. **Verarbeiten**:
   - Anhänge, die die Aufnahmekriterien erfüllen (`Dokumente/README.md`): mit `gmail_get_attachment` holen und wie in
     `post-verarbeiten` Schritt 4 ablegen.
   - Aufgaben und Fristen → `TODO.md` (und Abschnitt 7). Bestätigungen → TODO-Zeile durchstreichen.
   - Antwort nötig? Nur einen **Entwurf** mit `gmail_create_draft` im richtigen Postfach anlegen und sagen, dass die
     Nutzer ihn prüfen und senden müssen. Es wird nie gesendet.
5. **LOG.md**: `## JJJJ-MM-TT — Postfächer geprüft` – je relevanter Nachricht eine Zeile (Absender, Datum, Kern, Folge)
   und „sonst nichts Neues von: …" mit den Stellen, auf deren Antwort gewartet wird.
6. Committen und pushen, wenn sich Dateien geändert haben.

## Bericht an die Nutzer

Zuerst **Dringend** (mit Frist und vorgeschlagener Aktion), dann **Wichtig**, dann eine Zeile „sonst nichts".
Keine Inhalte privater Nachrichten.
