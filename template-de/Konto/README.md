# Konto – Bankexporte und Kontoübersicht

Hier liegen die unveränderten Exporte aller Konten und Karten und eine daraus **gebaute** Übersicht.
Alles läuft lokal; nichts wird hochgeladen.

```
Konto/
├── README.md             ← diese Datei
├── Transaktionen.xlsx    ← erzeugt – nie von Hand bearbeiten
├── <Bank-A>/             ← Exporte je Bank (camt.053-XML, CSV oder PDF-Auszüge)
├── <Bank-B>/
└── _tools/               ← baue_uebersicht.py, camt053.py, csv_de.py, commerzbank_pdf.py, anbieter.py, transaktion.py
```

## Exporte besorgen

Je Konto und Karte **mindestens 24 Monate** (Jahreszahlungen werden so sichtbar). Bevorzugt:
1. **camt.053 (XML)** – strukturiert, mit Anfangs-/Endsaldo; viele Sparkassen und Volksbanken bieten es an.
2. **CSV** – Sparkasse „CSV-CAMT", DKB, ING (Deutschland).
3. **PDF-Auszüge** – Commerzbank (Giro und Kreditkarte) wird direkt gelesen; andere Banken siehe Anleitung im Kit.

Dateien unverändert in den Ordner der Bank legen. Doppelte Exporte schaden nicht (es wird entdoppelt).

## Neu bauen

```
.venv/bin/python Konto/_tools/baue_uebersicht.py
```

1. Liest jeden Export in ein gemeinsames Modell (`_tools/transaktion.py`): Datum, Konto, Betrag, Gegenpartei,
   Gegenkonto, Verwendungszweck, Typ, Gläubiger-ID, Mandatsreferenz, Referenz, Saldo.
2. **Prüft**: Anfangssaldo + Buchungen = Endsaldo je Auszug. Geht ein Auszug nicht auf, wird er gegen den Endsaldo
   des Vorauszugs verkettet (manche Banken drucken einen falschen Anfangssaldo) und das im Blatt „Prüfung" vermerkt.
   CSV: laufender Saldo je Zeile. Lücken (Monate ohne Buchung) werden gemeldet.
3. Entdoppelt überlappende Exporte.
4. Markiert Umbuchungen zwischen eigenen Konten als *intern*.
5. Vergibt **Anbieter** und **Kategorie** über `_tools/anbieter.py` (Regex, erste Übereinstimmung gewinnt).
6. Schreibt `Transaktionen.xlsx`: **Buchungen** (Excel-Tabelle), **Wiederkehrend** (je Gläubiger-ID + Mandatsreferenz:
   Anzahl, Rhythmus, letzter Betrag, Ø pro Jahr – Grundlage des Vertragsverzeichnisses), **Je Monat** (Kategorie × Monat)
   und **Prüfung**.

Nach jedem Bau: alles in „Sonstiges" mit Gläubiger-ID oder hohem Betrag bekommt eine Regel in `anbieter.py`.

## Regeln

Die xlsx wird immer neu gebaut, nie von Hand bearbeitet. Excel vorher schließen. In erzeugten Formeln nur Funktionen,
die die Excel-Version der Nutzer kennt (im Zweifel SUMMEWENNS/INDEX/VERGLEICH, kein XVERWEIS).
Ändert eine Bank ihr Exportformat, bricht der Parser mit einer Meldung ab, welche Spalte fehlt – nur die Spaltenliste anpassen.
