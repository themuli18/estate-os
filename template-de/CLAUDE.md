# CLAUDE.md — Estate OS: Nachlass [VERSTORBENE PERSON] und Verwaltung für [PARTNER]

> Zweck dieses Ordners: alles koordinieren, was nach dem Tod von [VERSTORBENE PERSON] geschehen muss, damit [PARTNER]
> finanziell abgesichert, rechtlich geschützt und praktisch versorgt ist. Danach bleibt der Ordner die laufende
> Verwaltung von [PARTNER].
>
> Diese Datei ist das Gedächtnis des Assistenten: Fakten, Regeln, Werkzeuge, Fristen, Kontakte.
> Zu Beginn jeder Sitzung vollständig lesen.

---

## 0. Die Fakten – Grundlage für alles Weitere

Nur bestätigte Fakten. Unbekannt = `?` und eine Frage in Abschnitt 9. Nie raten.

| Thema | Wert | Quelle / bestätigt von |
|---|---|---|
| Verstorben | [voller Name], geboren [Datum] | |
| Todestag | [JJJJ-MM-TT] – **alle Fristen werden davon gerechnet** | Sterbeurkunde |
| Sterbeort / Standesamt | [Ort] | |
| Partner/in | [voller Name], geboren [Datum] | |
| Güterstand | [Zugewinngemeinschaft / Gütertrennung / Ehevertrag / ?] | |
| Testament / Erbvertrag | [ja/nein/?] – Eröffnung durch Nachlassgericht [Datum] | |
| Erben und Quoten | [?] | Testament / gesetzliche Erbfolge / Erbschein |
| Wohnung / Haus | [Eigentum/Miete], [Adresse nur hier] | |
| Schulden bekannt | [ja/nein/?] | |
| Lebenssituation Partner/in | [?] | |

---

## 1. Personen und Rollen

- **[KOORDINATION]** ([E-Mail]): koordiniert. Sprache im Chat: [Deutsch/Englisch]. Will, dass Dinge erledigt werden, keine Belehrungen.
- **[PARTNER]**: lebt in [Ort]. Alles für [PARTNER] kurz, klar, in großen Schritten, ohne Fachsprache.
- **[VERSTORBENE PERSON]**: verstorben am [Datum]. Steht auf den meisten Verträgen.
- **Weitere Nutzer dieses Ordners**: [Namen + Aufgabe, z. B. scannt die Post].
- Fachleute (ergänzen, sobald beauftragt): Bestatter, Notar, Steuerberater, Fachanwalt für Erbrecht, Hausarzt,
  Ansprechpartner Bank.

---

## 2. Wie der Assistent in diesem Ordner arbeitet

**Ton.** Warm, ruhig, effizient. Die Situation einmal anerkennen, dann an die Arbeit. Keine wiederholten
Beileidsbekundungen, keine Floskeln, keine Belehrungen. Jede Nachricht beantwortet eine Frage oder bringt eine
Aufgabe voran.

**Namen – nicht verhandelbar.** Immer die Vornamen: [VERSTORBENE PERSON] und [PARTNER]. Nie „Vater", „Mutter",
„die Witwe", „der Verstorbene", „Ihr Partner" – nicht im Chat, nicht in Dateien, nicht in Entwürfen, nicht in
TODO/LOG. In Schreiben an Behörden die vollen Namen. Ausnahme: ein Gesetz oder Formularfeld zitieren, das selbst
einen allgemeinen Begriff verwendet („Erblasser", „Ehegatte" in § 1931 BGB) – und dann sofort sagen, wer gemeint ist.
Vor jeder Antwort auf Ausrutscher prüfen.

**Sprache.**
- Alles in diesem Ordner auf **Deutsch**: Chat (wenn nicht anders gewünscht), `TODO.md`, `LOG.md`, Übersichten,
  Terminvorbereitungen, Commit-Nachrichten.
- Schreiben an Behörden: Deutsch, förmlich (*Sie*), versandfertig, Unbekanntes als `[Platzhalter]`.
- **Briefentwürfe nicht auf Vorrat.** Erst schreiben, wenn sie tatsächlich gebraucht werden.
- Datum im ISO-Format (2026-09-19). Beträge in Auswertungen als `1.820,79 €`.

**Kein Anwalt, kein Steuerberater – aber konkret.**
- Regeln mit Rechtsgrundlage nennen (z. B. „§ 1944 BGB", „§ 30 ErbStG"), damit sie prüfbar sind.
- Jede Frist als **hart** (gesetzlich/vertraglich) oder **weich** (empfohlen) kennzeichnen.
- Klar sagen, wann Notar, Steuerberater oder Fachanwalt nötig ist und was mitzubringen ist.
- Eine rechtliche oder steuerliche Schlussfolgerung nie als endgültig darstellen. Beträge und Freibeträge ändern sich
  jährlich – sagen, wenn eine Zahl für das laufende Jahr nachzuprüfen ist.
- Grenzüberschreitendes bekommt den Hinweis „mit einem Berater für beide Länder prüfen".
- **Primärquellen zuerst.** Eigene Ableitungen aus dem Gesetzestext als solche kennzeichnen.

**Datenschutz und Sicherheit.** Dieser Ordner enthält echte Finanz-, Gesundheits- und Personendaten.
- Dokumente und deren Inhalt nicht an externe Dienste, Webtools oder andere Connectoren geben als die unten erlaubten.
  Lokale Werkzeuge zuerst (`pdftotext`, `_tools/ocr.sh`, `_tools/textebene.py`).
- Erlaubter Connector: **Mail MCP** (Mail/Kalender/Drive lesen, Entwürfe anlegen). Siehe 2b.
- In allem, was geteilt werden könnte, Kennungen kürzen: IBAN → `DE12 …3456`, Karten → letzte 4 Ziffern,
  Steuer-ID und Rentenversicherungsnummer nie vollständig.
- **Nie im Namen anderer E-Mails, Nachrichten oder Formulare absenden.** Entwurf anlegen; der Mensch sendet.
- Dieser Ordner ist ein git-Repository mit genau **einem** Remote: `[PRIVATE REMOTE URL]`. Nie einen weiteren Remote
  anlegen, nie öffentlich pushen. Nach jeder Sitzung mit Änderungen committen und pushen.
- Keine Kopien außerhalb des Ordners. Temporäres ins Sitzungs-Scratchpad, nicht aufbewahren.
- Fakten über die Familie nie raten. Fragen und die Antwort in Abschnitt 0 festhalten.

**Buchführungsdisziplin.**
- Jede Sitzung, die etwas ändert, ergänzt `LOG.md` um einen datierten Eintrag (was getan, was gesendet, was gelernt,
  von wem). Neuestes unten.
- `TODO.md` ist die einzige offene Liste. Jede Zeile: **wer**, **bis wann**, **Stand**.
- Neue Frist irgendwo entdeckt → Tabelle in Abschnitt 7 **und** `TODO.md`.
- Neuer Kontakt → Abschnitt 8.
- Erledigt = durchstreichen mit Datum und Name, nicht löschen (`~~...~~ – erledigt JJJJ-MM-TT, Name`).
- Zum Abschluss: Skill `sitzung-abschliessen`.

---

## 2a. Stand der Arbeit ([Datum])

**Fertig und belastbar**
- …

**Die wichtigsten offenen Punkte** (vollständig: `TODO.md`; fehlende Papiere: `Dokumente/_ZU_SCANNEN.md`)
1. …

---

## 2b. Werkzeuge und Abläufe – Kurzreferenz

Alles, was hier erzeugt wird, wird **neu gebaut, nie von Hand bearbeitet**. Änderungen gehören ins Werkzeug.

| Was | Befehl / Skill | Ergebnis |
|---|---|---|
| Neue Post verarbeiten (Scans) | Skill `post-verarbeiten` | einsortiert, Index ergänzt, TODO/LOG aktualisiert |
| Postfächer prüfen | Skill `mail-pruefen` | Zusammenfassung dringend/wichtig, TODO/LOG, ggf. Entwürfe |
| Sitzung abschließen | Skill `sitzung-abschliessen` | LOG, TODO, Prüfungen, Commit, Push |
| Archiv prüfen | `python3 _tools/pruefe_archiv.py` | doppelte Namen, Namensschema, fehlende Indexeinträge, tote Links |
| Text aus einem Scan lesen | `zsh _tools/ocr.sh datei.pdf [seite]` | Text auf der Konsole (Apple Vision, de-DE) |
| Scans durchsuchbar machen | `python3 _tools/textebene.py [--pruefen \| datei]` | unsichtbare Textebene im PDF |
| Telefonat/Sprachmemo transkribieren | `zsh _tools/transkribiere.sh aufnahme.m4a [de] [zielordner]` | `.txt` und `.srt`, lokal. **Vorher Einverständnis (§ 201 StGB).** |
| Kontoübersicht bauen | `.venv/bin/python Konto/_tools/baue_uebersicht.py` | `Konto/Transaktionen.xlsx` (Buchungen, Wiederkehrend, Je Monat, Prüfung) |
| Sichern | `git add -A && git commit && git push` | privater Remote, siehe Abschnitt 2 |

**Mail-MCP-Konten** (Aliase): `[alias-1]` = Postfach [PARTNER], `[alias-2]` = Postfach [VERSTORBENE PERSON],
`[alias-3]` = [KOORDINATION]. Nur lesen und Entwürfe. Es gibt keine Sendefunktion – das ist Absicht.

**Scan-Eingang:** [lokaler Ordner oder Drive-Ordner, z. B. Drive-Ordner „Scan-Eingang" von Konto `[alias]`]. Der Scanner
(ScanSnap-Profil „Estate OS") legt dort ab. Verarbeitete Scans kommen nach `[Scan-Eingang/Erledigt]`.

## 2c. Fallstricke, die schon Zeit gekostet haben

Hier jede Lektion mit Datum festhalten. Startbestand (aus früheren Einrichtungen):
- **`git add -A` verbucht auch verschwundene Dateien als gelöscht.** Vor jedem Commit:
  `git diff --cached --name-only --diff-filter=D`. Steht dort etwas Ungewolltes: nicht committen.
- **Diesen Ordner von jeder Dublettenbereinigung ausnehmen.** Einsortierte Dateien haben zunächst einen Zwilling in
  Downloads; eine Bereinigung löscht dann willkürlich einen davon.
- **Gleiche Zieldateinamen überschreiben sich still.** Der Name muss die unterscheidende Nummer tragen (Kunden-,
  Vertrags-, Rechnungsnummer). `pruefe_archiv.py` findet das.
- **OCR von Handyfotos liest Ziffern falsch**, Wörter richtig. Jede Referenznummer aus solchen Scans gegen das Bild
  oder eine zweite Quelle prüfen. Beste zweite Quelle: **Gläubiger-ID und Mandatsreferenz in den Kontoauszügen**
  (native Text-PDFs).
- **`unzip` verstümmelt UTF-8-Dateinamen auf macOS.** Mit Pythons `zipfile` entpacken und `unicodedata.normalize("NFC", …)`.
- **Unquotiertes Heredoc führt Backticks und `$` aus.** Immer `<<'EOF'`.
- **Mehrere Personen arbeiten parallel.** Vor jedem Push holen; Konflikte fast nur in `TODO.md`, `LOG.md` und den
  Zählern in `00_INDEX.md` (beide Fassungen behalten, neu zählen).
- **Eine in Excel geöffnete Mappe** zeigt die alte Fassung und überschreibt beim Speichern die neue. Vorher schließen.
- **Manche Banken drucken einen falschen Anfangssaldo** auf einzelnen Auszügen, obwohl keine Buchung fehlt.
  Die Kontoübersicht verkettet solche Auszüge gegen den Endsaldo des Vorauszugs und weist das im Blatt „Prüfung" aus.

---

## 3. Ordnerstruktur

```
[Ordner]/
├── CLAUDE.md          ← diese Datei: Fakten, Regeln, Werkzeuge, Fristen, Kontakte
├── TODO.md            ← die eine offene Liste
├── LOG.md             ← datiertes Journal jeder Sitzung
├── Dokumente/         ← alle Unterlagen nach Sachgebiet; 00_INDEX.md ist das Inhaltsverzeichnis
├── Termine/           ← Vorbereitung und Ergebnis konkreter Termine (Notar, Rentenberatung, Bank)
├── Konto/             ← Bankexporte, Kontoübersicht und das Werkzeug dafür
├── _tools/            ← OCR, Textebene, Archivprüfung, Transkription
└── .claude/skills/    ← post-verarbeiten, mail-pruefen, sitzung-abschliessen
```

Prinzip: ein Sachgebiet, ein Ordner, und wo es sich lohnt eine `00_…`-Übersicht, die den Bestand **auswertet** statt
ihn nur aufzulisten (z. B. `04_Versicherungen/00_Versicherungsuebersicht.md`). Querschnittsthemen bekommen in
`Dokumente/` eine Datei mit `_`-Präfix.

Dateibenennung: `JJJJ-MM-TT_Absender_Betreff_Person.ext` – Datum = **Dokumentdatum**, Umlaute umschrieben, keine Leerzeichen.

---

## 4. Finanzen

[Nach der ersten Auswertung ausfüllen: welche Konten und Karten, welche Exporte, wo die Übersicht liegt.]

---

## 5. Arbeitsbereiche

Abgehakt wird in `TODO.md`, nicht hier. Jeden Schritt an der aktuellen Quelle prüfen (Behörde, Gesetzestext).

### A. Unmittelbar nach dem Tod (Woche 1–2)
- **Todesbescheinigung** (Arzt) → **Sterbeurkunde** beim Standesamt des Sterbeorts (meist über den Bestatter).
  Mehrere beglaubigte Ausfertigungen bestellen; fast jede Stelle will eine.
- Bestatter, Friedhof, Traueranzeige. Alle Rechnungen aufheben (Nachlassverbindlichkeiten, Erbschaftsteuer).
- **Lebens-, Unfall- und Sterbegeldversicherungen sofort melden** – manche Bedingungen haben sehr kurze Fristen.
- **Rentenservice der Deutschen Post / Deutsche Rentenversicherung**: Tod melden; **Vorschuss auf die
  Hinterbliebenenrente** (Sterbevierteljahr) ist nur innerhalb kurzer Frist nach dem Tod möglich – prüfen und sofort
  beantragen (oft über den Bestatter).
- Bank: Tod melden, Umgang mit Gemeinschaftskonto, Karten, Vollmachten klären.
- Telefon, E-Mail und Passwortmanager von [VERSTORBENE PERSON] sichern – daran hängen die Zugänge (photoTAN, ELSTER).

### B. Nachlass (Woche 1–12)
- Testament beim **Nachlassgericht** abliefern (§ 2259 BGB); Eröffnung abwarten.
- **Ausschlagung** nur innerhalb von **sechs Wochen** ab Kenntnis (§ 1944 BGB) – nur relevant bei Überschuldung.
- **Erbschein** (Nachlassgericht oder Notar) oder notarielles Testament mit Eröffnungsprotokoll.
- Gesetzliche Erbfolge (§§ 1924 ff., 1931 BGB) und Güterstand (§ 1371 BGB) bestimmen die Quoten.
- Immobilie: **Grundbuchberichtigung** – gebührenfrei, wenn binnen zwei Jahren beantragt (GNotKG KV 14110, prüfen).
- Vermögens- und Schuldenübersicht zum Todestag (Kontostände, Policen, Immobilie, Fahrzeug, Verbindlichkeiten).

### C. Einkommen und Versicherungen [PARTNER] (Woche 1–8, dann laufend)
- **Witwen-/Witwerrente** beantragen (Versichertenberater oder Auskunfts- und Beratungsstelle der DRV).
  Rückwirkung ist begrenzt (§ 99 Abs. 2 SGB VI) – zügig stellen. Im Sterbevierteljahr volle Rente, danach reduziert
  und mit Einkommensanrechnung.
- Die Rente von [VERSTORBENE PERSON] wird bis Ende des Sterbemonats gezahlt (§ 102 Abs. 5 SGB VI); danach Gezahltes
  wird zurückgefordert.
- Betriebsrenten, Versorgungswerke, Zusatzversorgung: jeweils Tod melden, Hinterbliebenenleistung beantragen.
- **Private Krankenversicherung**: Mitversicherte müssen die Fortsetzung binnen **zwei Monaten** erklären
  (§ 207 VVG). Gesetzliche Kasse: Familienversicherung endet, eigene Mitgliedschaft (KVdR) klären.
- Versicherungen auf [PARTNER] umschreiben oder kündigen (Hausrat, Wohngebäude, Haftpflicht, Kfz, Rechtsschutz).

### D. Bank, Verträge, Abos
- Alle wiederkehrenden Zahlungen der letzten 12–24 Monate aus den Auszügen holen (Blatt „Wiederkehrend"):
  Gläubiger-ID, Mandatsreferenz, Betrag, Rhythmus, auf wen. Das ist das Vertragsverzeichnis.
- Je Vertrag: umschreiben, kündigen oder weiterlaufen lassen. Strom, Gas, Wasser, Telefon, Internet, Mobilfunk,
  **Rundfunkbeitrag** (Beitragskonto abmelden bzw. auf [PARTNER] umstellen), Zeitungen, Vereine, Spenden.

### E. Schutz für [PARTNER] (jetzt beginnen, nicht später)
- **Vorsorgevollmacht**, **Betreuungsverfügung**, **Patientenverfügung** (Notar oder Formular, Registrierung im
  Zentralen Vorsorgeregister).
- Eigenes Testament von [PARTNER] prüfen.
- Eigene Zugänge (Online-Banking, ELSTER, Postfach) mit einer Vertrauensperson, die bevollmächtigt ist –
  keine geteilten Passwörter.
- Alltag: Einkauf, Fahrten, Haushaltshilfe, Pflegestützpunkt, Pflegegrad falls nötig.

### F. Steuern
- **Anzeige des Erwerbs beim Erbschaftsteuer-Finanzamt binnen drei Monaten** (§ 30 ErbStG), jeder Erbe einzeln –
  entfällt u. U. bei notariellem Testament/Eröffnung; prüfen.
- Einkommensteuererklärung für das Todesjahr (Zusammenveranlagung möglich), ggf. offene Vorjahre.
- ELSTER-Zugang von [VERSTORBENE PERSON]: Zertifikate laufen nach drei Jahren ab – rechtzeitig klären.
- Grundsteuer, Abfallgebühren, Kirchgeld: Bescheide auf [PARTNER] umstellen.

### G. Digitaler Nachlass
- Telefon, E-Mail-Konten, Apple-/Google-ID, Passwortmanager, soziale Medien, Shops, Vergleichsportale.
- **Nichts löschen, bevor der Nachlass geregelt ist** – Konten enthalten Vertragsbelege.
- Das Postfach von [VERSTORBENE PERSON] bleibt über Mail MCP verbunden und wird in `mail-pruefen` mitgeprüft.

---

## 6. Reihenfolge der Arbeit ([Datum])

1. …

---

## 7. Fristen – gerechnet ab dem Todestag [Datum]

Dieselben Fristen mit Zuständigkeit und Stand stehen in `TODO.md`.

| Was | Bis | Art | Grundlage |
|---|---|---|---|
| Lebens-/Unfallversicherung melden | sofort | hart (Bedingungen) | Versicherungsbedingungen |
| Vorschuss Hinterbliebenenrente | [prüfen] | hart | Rentenservice |
| Ausschlagung (nur bei Überschuldung) | [Kenntnis + 6 Wochen] | hart | § 1944 BGB |
| Fortsetzung private KV erklären | [Todestag + 2 Monate] | hart | § 207 VVG |
| Erbschaftsteueranzeige | [Kenntnis + 3 Monate] | hart | § 30 ErbStG |
| Grundbuchberichtigung gebührenfrei | [Todestag + 2 Jahre] | Geldfrage | GNotKG KV 14110 |
| … | | | |

---

## 8. Kontakte (Stelle → was sie von uns braucht)

| Stelle | Kontakt | Kunden-/Aktenzeichen | Stand |
|---|---|---|---|
| | | | |

---

## 9. Offene Fragen an [KOORDINATION] / [PARTNER]

- …
