# 13. German variant (`template-de/`)

Estate OS was first built for a German estate. `template-de/` is that setup generalised into a German-language
template, for families dealing with German institutions. It mirrors the Dutch template one to one. The control files,
skills and tools are the same, with German names, German law and German banks.

> **Verify against current sources.** The legal pointers in `template-de/CLAUDE.md` §5/§7 (BGB, SGB VI, ErbStG,
> VVG, GNotKG) came out of the original case and are general. Deadlines, allowances and procedures change. Have the
> Notar, Nachlassgericht, Steuerberater or the Deutsche Rentenversicherung confirm them for each case.

## What's different from the Dutch template

| Part | Dutch (`template/`) | German (`template-de/`) |
|---|---|---|
| Archive folder | `Documenten/` | `Dokumente/` |
| Topic folders | `01_Persoonlijke_documenten` … `11_Bank_en_vermogen` | `01_Personenstand`, `02_Bestattung`, `03_Renten`, `04_Versicherungen`, `05_Gesundheit`, `06_Haus_Energie_Abgaben`, `07_Fahrzeuge`, `08_Steuern`, `09_Abos_und_Mitgliedschaften`, `10_Telekommunikation`, `11_Bank` |
| Appointments | `Afspraken/` | `Termine/` |
| Finances | `Financien/` + `bouw_overzicht.py` | `Konto/` + `baue_uebersicht.py` |
| Missing papers | `_TE_SCANNEN.md` | `_ZU_SCANNEN.md` |
| Tools | `tekstlaag.py`, `controleer_archief.py`, `transcribeer.sh` | `textebene.py`, `pruefe_archiv.py`, `transkribiere.sh` |
| Skills | `post-verwerken`, `mail-controleren`, `sessie-afsluiten` | `post-verarbeiten`, `mail-pruefen`, `sitzung-abschliessen` |
| OCR default | `nl-NL,en-US` | `de-DE,en-US` |
| Mail trigger words | aanmaning, deurwaarder … | Mahnung, Inkasso, Gerichtsvollzieher, Bescheid, Sterbefall … |

## Bank parsers (`template-de/Konto/_tools/`)

| Source | Parser | Status |
|---|---|---|
| **camt.053 XML** (many Sparkassen, Volksbanken, direct banks) | `camt053.py` | tested on synthetic data |
| **Sparkasse CSV-CAMT** | `csv_de.sparkasse` | synthetic test, column names from the documented format |
| **DKB CSV** (format since 2023, with preamble lines) | `csv_de.dkb` | synthetic test, column names from the documented format |
| **ING Deutschland CSV** (preamble, `EREF+/MREF+/CRED+/SVWZ+` in the purpose field) | `csv_de.ing_de` | synthetic test, column names from the documented format |
| **Commerzbank PDF**: Girokonto statements and Mastercard/Visa Premium card statements | `commerzbank_pdf.py` | **verified on real statements** in the original setup (every statement reconciles). Tests in the kit use synthetic statement text |

`baue_uebersicht.py` produces `Konto/Transaktionen.xlsx` with the tabs **Buchungen**, **Wiederkehrend** (grouped by
Gläubiger-ID + Mandatsreferenz), **Je Monat** and **Prüfung**.

**Chain check.** Banks occasionally print a wrong *opening* balance on a statement, even though no booking is
missing. When a statement doesn't reconcile on its own, the build checks it against the previous statement's
closing balance. If that works, it's marked "über Vorauszug verkettet" with the size of the misprint, instead of
being reported as an error.

The `commerzbank_pdf.py` docstring describes how to write a PDF parser for another German bank in the same way. See
also [11-bank-parsers.md](11-bank-parsers.md) §4–5.

## German workstreams in brief

From `template-de/CLAUDE.md` §5:

- **Immediately:** Sterbeurkunde (several certified copies); notify life, accident and funeral insurers right away;
  Rentenservice and an **advance on the survivor's pension** (short window after the death, often arranged by the
  undertaker); bank; secure phone, photoTAN, ELSTER access and password manager.
- **Estate:** deliver any will to the Nachlassgericht (§ 2259 BGB); disclaimer only within **6 weeks** (§ 1944 BGB);
  Erbschein or notarial will plus opening record; Grundbuch correction free of charge within two years.
- **Income:** Witwen-/Witwerrente (limited retroactivity, § 99 SGB VI; the deceased's pension runs to the end of the
  month of death, § 102 Abs. 5 SGB VI; full amount in the Sterbevierteljahr, then reduced); private health insurance:
  co-insured persons must declare continuation within **2 months** (§ 207 VVG).
- **Contracts:** recurring payments from the statements; **Rundfunkbeitrag** (deregister the deceased's account,
  register the survivor if needed); energy, telecom, subscriptions.
- **Protection:** Vorsorgevollmacht, Betreuungsverfügung, Patientenverfügung (Zentrales Vorsorgeregister).
- **Taxes:** inheritance notification within **3 months** (§ 30 ErbStG), each heir separately unless an exception
  applies; income tax return for the year of death; ELSTER certificates expire after three years.

## Using it

```bash
cp -R <estate-os>/template-de/. ~/Nachlass/<name>/
cd ~/Nachlass/<name> && git init -b main
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Then follow [AGENT_BOOTSTRAP.md](../AGENT_BOOTSTRAP.md). It asks for the country and picks the matching template.
