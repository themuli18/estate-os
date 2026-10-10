# Financiën – bankexports en het rekeningoverzicht

Hier komen de ruwe exports van alle rekeningen en één overzicht dat daaruit **gebouwd** wordt.
Alles draait lokaal; er wordt niets geüpload.

```
Financien/
├── README.md            ← dit bestand
├── Transacties.xlsx     ← gegenereerd – nooit met de hand bewerken
├── <Bank-A>/            ← exports per bank (CSV, CAMT.053 of PDF-afschriften)
├── <Bank-B>/
└── _tools/              ← bouw_overzicht.py, camt053.py, csv_nl.py, leveranciers.py, transactie.py
```

## Exports ophalen

Per rekening de transacties van **minimaal 24 maanden** exporteren (meer is beter: jaarbetalingen worden zichtbaar).
Voorkeur: CSV of CAMT.053 (gestructureerd, geen OCR nodig). PDF-afschriften alleen als er niets anders is.
Bestanden ongewijzigd in de map van de bank zetten; dubbele exports zijn onschadelijk (de build ontdubbelt).

## Opnieuw bouwen

```
.venv/bin/python Financien/_tools/bouw_overzicht.py
```

Herkent automatisch **camt.053** (XML, voorkeur), **ING-CSV**, **Rabobank-CSV** en **ABN AMRO-TXT**. Andere bestanden
worden gemeld als „onbekend formaat". De build doet het volgende:

1. Parset elke export naar één model (`_tools/transactie.py`): datum, rekening, bedrag, tegenpartij, IBAN tegenpartij,
   omschrijving, type, incassant-ID, machtigingskenmerk, kenmerk, saldo.
2. **Controleert**: camt.053 beginsaldo + mutaties = eindsaldo; CSV/TXT het lopende saldo per regel.
   Gaten (maanden zonder boekingen) worden gemeld.
3. Ontdubbelt overlappende exports.
4. Markeert overboekingen tussen eigen rekeningen als *intern* (eigen = elke rekening waarvan een export binnen is).
5. Kent **Leverancier** en **Categorie** toe via `_tools/leveranciers.py` (regex, eerste treffer wint).
6. Schrijft `Transacties.xlsx`: **Transacties** (Excel-tabel), **Terugkerend** (per incassant-ID + machtigingskenmerk:
   aantal, frequentie, laatste bedrag, gemiddeld per jaar – de basis van het contractenregister), **Per maand**
   (categorie × maand) en **Controle** (saldocontroles, gaten, onbekende bestanden).

Na elke build: alles in „Overig" met een incassant-ID of een groot bedrag krijgt een regel in `leveranciers.py`.

## Budgetprognose

Het maandbudget van [PARTNER] na het overlijden (inkomen na wegvallen AOW/pensioen [OVERLEDENE] tegenover de
uitgaven per categorie) wordt op deze tabel gebouwd. Methode en kant-en-klare opdracht voor de assistent:
`docs/14-budget-forecast.md` in de Estate OS-kit.

## Een nieuwe bank toevoegen

Zie `docs/11-bank-parsers.md` in de Estate OS-kit. Kort: een functie in `csv_nl.py` (of een nieuw bestand) die een
lijst `Transactie` teruggeeft, plus een herkenningsregel in `herken()`. Altijd een saldocontrole inbouwen.

## Regels

De xlsx wordt altijd opnieuw gebouwd, nooit met de hand bewerkt. Excel eerst sluiten. Kolomnamen van banken
veranderen soms: de parser stopt dan met een melding welke kolom ontbreekt – alleen de kolomlijst aanpassen.
