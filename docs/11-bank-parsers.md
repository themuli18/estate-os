# 11. Bank statement parsers (Netherlands)

> German banks (camt.053, Sparkasse, DKB, ING Deutschland, Commerzbank PDF) are covered in the German template, see
> [13-germany.md](13-germany.md). The method below applies to both.

Bank data is the most valuable input in the whole system. A year of statements shows every running contract
(insurance, energy, telecom, subscriptions, memberships), usually with the contract number in the direct-debit mandate
reference. It also shows income (AOW, pensions) and the household budget the survivor will have to live on.

The template ships working parsers in `template/Financien/_tools/`:

| File | Role |
|---|---|
| `transactie.py` | Common model (`Transactie`), Dutch amount and date parsing, SEPA field extraction from free text |
| `camt053.py` | ISO 20022 **camt.053** XML, which works for any bank that offers it |
| `csv_nl.py` | **ING** CSV, **Rabobank** CSV and **ABN AMRO** TXT, plus `herken()` for format detection |
| `leveranciers.py` | Regex rules mapping counterparty to provider and category (seeded with common Dutch names) |
| `bouw_overzicht.py` | Parse → deduplicate → reconcile → find gaps → flag internal transfers → categorise → find recurring payments → `Transacties.xlsx` |

`tests/test_bankparsers.py` runs everything against **synthetic** fixtures in `tests/fixtures/`.

> **Caveat.** The CSV/TXT column layouts were written from documentation and known export formats, not from a real
> export of the friend's accounts. The parsers **fail loudly** when an expected column is missing and print what they
> found. The first real export is the actual test. Adjust the column list, not the logic.

## 1. Getting the exports

Order of preference:

1. **camt.053 (XML).** Structured, includes opening and closing balance per statement, and has the SEPA fields as
   separate elements. Many Dutch banks offer it, but availability depends on the bank and account type. Look in the
   download/export dialog of internet banking.
2. **CSV/TXT** from internet banking. Good enough. ING and Rabobank CSVs include a running balance, ABN AMRO TXT has
   start and end balance per row.
3. **MT940.** An older SWIFT text format that many banks still offer. It isn't implemented yet, but the `:86:`
   field uses the same `/TRTP/…/CSID/…/MARF/…` slash notation that `sepa_velden()` already parses. See §4.
4. **PDF statements.** Only as a last resort, for example for closed accounts or periods older than the online
   export allows. See §5.

Export **24 months** if possible, so that yearly payments (insurance, memberships, municipal taxes) show up at least
twice. Put files unchanged in `Financien/<Bank>/`. Overlapping exports are fine, because the build deduplicates them.

Credit cards (for example ICS-issued cards) usually have their own portal and their own export. Treat each card as
its own "account" folder.

## 2. The model

Every parser returns a list of `Transactie`:

```
datum, rekening (own IBAN), bedrag (− = debit), tegenpartij, tegenrekening, omschrijving, type,
incassant_id (SEPA Creditor ID), machtigingskenmerk (mandate ref), kenmerk (payment/end-to-end ref),
saldo_na (balance after, if the format has it), bron (file name)
```

Two fields matter most:

- **`incassant_id`**: the SEPA Creditor ID (`NL..ZZZ…`). It's stable per company, even when the display name
  changes.
- **`machtigingskenmerk`**: the mandate reference. It's unique per contract and often *is* the policy or customer
  number. That makes it the best OCR-free cross-check for numbers read from scanned letters.

## 3. How each format maps

| Field | camt.053 element | ING CSV | Rabobank CSV | ABN AMRO TXT |
|---|---|---|---|---|
| date | `Ntry/BookgDt/Dt` | `Datum` (YYYYMMDD) | `Datum` (YYYY-MM-DD) | col 3 (YYYYMMDD) |
| amount | `Ntry/Amt` + `CdtDbtInd` | `Bedrag (EUR)` + `Af Bij` | `Bedrag` (signed) | col 7 (signed) |
| counterparty | `RltdPties/Cdtr\|Dbtr/Nm` | `Naam / Omschrijving` | `Naam tegenpartij` | `/NAME/` in description |
| counter IBAN | `RltdPties/CdtrAcct\|DbtrAcct/Id/IBAN` | `Tegenrekening` | `Tegenrekening IBAN/BBAN` | `/IBAN/` |
| creditor ID | `Cdtr/Id/PrvtId/Othr/Id` | `Incassant ID:` in Mededelingen | `Incassant ID` | `/CSID/` |
| mandate ref | `Refs/MndtId` | `Machtiging ID:` in Mededelingen | `Machtigingskenmerk` | `/MARF/` |
| description | `RmtInf/Ustrd` | `Omschrijving:` in Mededelingen | `Omschrijving-1..3` | `/REMI/` |
| balance check | `Bal` OPBD + Σ = CLBD | `Saldo na mutatie` running | `Saldo na trn` running | start + amount = end per row |

Both free-text notations (ING's `Label: value` and the `/TAG/value/` slash notation) go through
`transactie.sepa_velden()`. Identifiers are cut at the first space, because trailing words like "Doorlopende
incasso" aren't part of the ID.

## 4. Adding a new bank or format

1. **Get one real export** and look at it without loading the whole file into the agent's context. `head -3` is
   enough for the header, and show the agent only a few rows with amounts masked if it must see content.
2. **Write a function** `mijnbank(pad) -> list[Transactie]` in `csv_nl.py` (or a new module):
   - read with `lees_tekst()` (handles UTF-8 BOM and Windows-1252)
   - declare the required columns and call `_eis()` so a format change fails loudly
   - convert amounts with `bedrag_nl()` and dates with `datum()`
   - run free-text descriptions through `sepa_velden()`
   - fill `saldo_na` if the format has a balance, otherwise the build can't reconcile
3. **Teach `herken()`** to recognise the file (header text, delimiter, extension).
4. **For MT940:** split on `:61:` (transaction line: value date, D/C mark, amount) and `:86:` (details, parse with
   `sepa_velden()`). `:60F:`/`:62F:` are the opening and closing balances, so reconcile them like camt.053.
5. **Add a synthetic fixture** to `tests/fixtures/<Bank>/` with invented names and `NL00…` IBANs, and assertions to
   `tests/test_bankparsers.py`. Never commit a real export to the kit.
6. Run the build on the real data in the family's repository and read the **Controle** tab. Every row should be
   "klopt", and a gap means an export is missing.

## 5. PDF statements (fallback)

This is the approach the original German setup used for one bank's PDFs:

1. `pdftotext -layout statement.pdf -`. Bank PDFs are normally native text, so no OCR is needed.
2. Find the line structure: a booking starts with a date at a fixed column, and the amount sits at the right edge
   with the debit mark (trailing `-` or a separate column). Continuation lines carry the counterparty and the SEPA
   fields.
3. Parse the header's **opening balance** and the footer's **closing balance**, and require
   `opening + Σ bookings = closing` for **every** statement. If a statement doesn't reconcile, chain it to the
   previous statement's closing balance instead and report the discrepancy. This check catches every parser bug.
4. Drop zero-amount notices that some banks print between bookings.
5. Keep the parser in `_tools/` and rebuild. Never fix numbers in the spreadsheet.

## 6. From transactions to contract register

The **Terugkerend** tab groups debits by `(incassant_id, machtigingskenmerk)`, or by counter IBAN or name when
there's no creditor ID. For each group it gives the count, frequency (weekly to yearly), first and last date, last
amount and average per year. The agent then:

1. Walks the list from the largest yearly amount down.
2. Writes each item into `04_Verzekeringen/00_Verzekeringsoverzicht.md` or
   `06_Woning_energie_en_gemeente/00_Leveranciersoverzicht.md`: provider, contract number (cross-checked against the
   mandate reference), holder (deceased or survivor), amount, frequency, action (transfer, cancel or keep) and
   deadline.
3. Adds every action to `TODO.md` and every provider to `CLAUDE.md` §8.
4. Marks anything deliberately ignored as such, so the next run doesn't raise it again.

Next step: the survivor's **budget forecast** built on top of this table. See
[14-budget-forecast.md](14-budget-forecast.md) for the method and a ready-to-use agent prompt.

## 7. Pitfalls

- **Close Excel** before rebuilding.
- **Several accounts in one CSV** (some banks export all accounts together) break the running-balance check per
  file. The Controle tab then reports "breuken". Split the check per account if it happens.
- **Same-day ordering.** Banks order same-day bookings differently, so the balance check tries both directions.
- **Encoding.** Rabobank and older exports may be Windows-1252, and `lees_tekst()` handles that.
- **Internal transfers** are detected only between accounts whose exports are present. Add the savings account
  export, or its transfers will show up as spending.
- **Privacy.** Real exports stay in the family's repository. Mask IBANs in anything shared (`NL12 …3456`).
