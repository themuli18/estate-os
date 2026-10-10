# 14. Budget forecast for the survivor

After a death, the question behind most worries is simple: *can the survivor keep living as before, and if not, what
has to change?* The budget forecast answers it from the household's real bank data rather than from guesses.

It's a sheet in the generated workbook (`Transacties.xlsx` / `Transaktionen.xlsx`), built by the same script and from
the same transaction table. This page explains the method and ends with a **ready-to-use prompt** for an AI agent.

> Pension and benefit rules below are pointers, not advice. Every rate, threshold and allowance must be checked
> against the current official source (SVB / pension fund in NL, Deutsche Rentenversicherung in DE) for the case at
> hand. The forecast shows its assumptions openly so that anyone can check and change them.

## The idea in one picture

```
 transactions (last 12 full months, external only, one-offs removed)
        │
        ▼
 B. per category: average €/month ──► × adjustment % (or a fixed override) ──► forecast €/month
        │                                                                         │
 A. survivor's income after the death ───────────────────────────────────────────┤
    (own pension + survivor's pension, transition phase vs. permanent)            ▼
                                                    C. summary: income − spending = monthly balance
                                                       transition phase · permanent · first year · later years
```

## Prerequisites in the transaction table

The forecast is only as good as the categorisation underneath. Before building it, the table needs:

| Column | Purpose | How |
|---|---|---|
| **Kategorie / Categorie** | groups spending into 15–20 human categories | provider rules (`anbieter.py` / `leveranciers.py`) |
| **Extern** (yes/no) | excludes money moving between the family's own accounts (savings transfers, credit card settlements) | own-account detection plus rules for card settlements |
| **Einmalig / Eenmalig** (yes/no) | removes one-off purchases (a new appliance, a roof repair) from the averages | rule: listed one-off providers, plus any single booking above a threshold (e.g. €300) in discretionary categories |
| **Unterkategorie / Subcategorie** (optional) | splits out a structural block inside a category, such as everything about a car (insurance + vehicle tax + fuel) | rule per provider. Lets the forecast drop "the car" as one row |
| **Who** (optional) | whose contract it is (deceased / survivor / joint) | from the contract register. Helps decide what stops |

**Category "Overig/Sonstiges" should be small**, under about 10 % of spending. If it isn't, add provider rules first.

## Block A: the survivor's income

Compute it in visible steps, with every assumption in an input cell next to its source.

1. **Read the last actual net payments from the data:** the deceased's pension(s) and the survivor's own pension(s).
   Use the most recent regular payment, not an average, because pensions change once a year.
2. **Net to gross, if the rules work on gross amounts.** Divide by (1 − health/care contribution rate) or use the
   gross figure from the latest pension statement in the archive. Write down which.
3. **Survivor's pension per country:**
   - **Germany (Witwen-/Witwerrente):** a percentage of the deceased's gross pension (55 % or 60 % depending on
     marriage date and birth year, check which). Then the **income offset**: the survivor's own net income above
     an allowance (a multiple of the current *Rentenwert*), after a flat deduction, reduces the survivor's pension
     by 40 % of the excess. Then deduct health and care contributions. The **Sterbevierteljahr** (the three calendar
     months after the month of death) pays the deceased's full pension without offset. Model it as a separate
     "transition" column.
   - **Netherlands:** the survivor's **AOW** usually switches to the single-person rate (check the cohabitation
     situation). **Anw** only under conditions (age, children, incapacity). The **partner pension
     (nabestaandenpensioen)** from each pension fund is per the fund's letter. The deceased's AOW stops, and SVB may
     pay a one-off death benefit (**overlijdensuitkering**), which is a one-off and belongs in the first-year line,
     not the monthly forecast. **Toeslagen** (zorgtoeslag, huurtoeslag) change with income and household; estimate
     them separately.
   - **Elsewhere:** the same pattern. Last actual payments → the rule that turns them into the survivor's income →
     transition phase vs. permanent.
4. Output two numbers: **survivor's monthly net income in the transition phase** and **permanently**. In the
   per-category block, the income row is a formula fed from these. It is never averaged from history.

## Block B: spending per category

One row per external category (and per sub-category where defined):

| Column | Content |
|---|---|
| Category (– subcategory) | label |
| **Average €/month** | sum of the last **12 full calendar months**, external bookings only, **one-offs excluded**, ÷ 12. Show the window (from–to) above the table |
| **Adjustment %** | input. What share of the two-person spending remains for one person |
| **Fixed amount €/month** | optional input. Overrides the calculation when known (a contract that is being cancelled, a new single tariff) |
| **Forecast €/month (permanent)** | `fixed amount if set, else average × adjustment` |
| **Forecast €/month (transition)** | usually the same as permanent. Differs only where something ends later (a contract with notice running) |
| **Forecast €/year** | × 12 |
| **Comment** | why this adjustment, with source where possible |
| **One-offs last 12 months** | the excluded amount, shown so nobody thinks it vanished |

### Starting assumptions for a one-person household

They are a starting point, with the reason written in the comment cell. The coordinator and survivor then go through
them row by row.

| Category type | Typical start | Reason |
|---|---|---|
| Housing (rent/mortgage), building insurance, property tax, municipal charges | 100 % | the home stays the same |
| Energy and water | 90–100 % | heating doesn't halve; water use drops a little |
| Groceries | 60–70 % | one person, but not half (portion sizes, waste) |
| Drugstore, household goods | 70 % | |
| Health, pharmacy | person-specific | check which costs belonged to whom; for elderly survivors often 100 % or more |
| Insurances | per contract | from the contract register: life/accident on the deceased **end**, liability may switch to a single tariff, a family travel policy becomes single |
| Car (whole subcategory) | 0 % or 100 % | the biggest single decision: does the survivor drive? |
| Telecom | per contract | the deceased's mobile contract ends; the landline/internet stays |
| Subscriptions, media | per item | cancel or keep, from the register |
| Clothing, leisure, restaurants, travel | 50–60 % | adjust after talking to the survivor |
| Donations, church, clubs | per item | memberships of the deceased end |
| Cash withdrawals | 50–70 % | unknown use, so be conservative |

**Where the defaults live:** in the build script as a dictionary (category → (percentage, reason)), with an extra
dictionary for (category, subcategory) and per-contract exceptions. Input cells in the sheet are for what-ifs, and a
rebuild resets them to the defaults. A decision that sticks ("the car is sold") goes into the dictionary, with a
date and who decided, so it survives the next build.

## Block C: summary

| Line | Formula |
|---|---|
| Income per month (transition / permanent) | from block A |
| Spending per month (transition / permanent) | sum of block B |
| **Balance per month** | income − spending, in both phases |
| **First year after the death** | transition months × transition balance + remaining months × permanent balance (in Germany 3 + 9) |
| **Later years** | 12 × permanent balance |
| Savings runway (optional) | current liquid savings ÷ monthly deficit, if negative |

Add one line under the summary in plain words, for example *"Permanently about €X per month short, mainly because
the second pension drops to Y; covered by savings for about Z years."* This sentence is what the survivor needs.

## Optional: seasonality and scenarios

- **Seasonality:** a category × calendar-month table (average per year) shows *when* the large annual payments hit
  (insurance renewals, property tax, annual energy bill). The monthly forecast is an average, but liquidity has to
  cover the peak months. Add a short "months with large payments" list.
- **Scenarios:** two or three named columns (e.g. "keep the car", "sell the car", "move to a smaller home") are
  easier to discuss than editing one set of cells.

## Pitfalls

- **One-offs inside the average** inflate a category. The one-off flag handles most of them. Check the top 3
  bookings per category anyway, and use a fixed amount where needed.
- **Annual payments**, such as an insurance paid once a year, only show up correctly with a full 12-month window.
  With fewer months of data, annualise from the contract register instead.
- **Internal transfers** counted as spending (moving money to savings, paying off the credit card from the current
  account) double-count everything. Check: spending in the forecast should be close to what actually left the
  household.
- **Credit cards:** include the card *transactions*, exclude the current-account *settlement* of the card.
- **Gross vs. net pensions:** be explicit. Bank data shows net amounts, but the rules usually work on gross.
- **The deceased's last months are distorted** (hospital, care, funeral). If the death followed a long illness, use a
  12-month window that ends before the illness, or correct those categories by hand.
- **Spreadsheet compatibility:** generated formulas should use functions the user's Excel version knows (SUMIFS,
  SUMPRODUCT, INDEX/MATCH; avoid XLOOKUP, MAXIFS, LET in older Excel). Verify in the actual program, not only in
  LibreOffice.
- **Not in the forecast,** so say so in a footnote: life-insurance payouts, funeral costs, inheritance, tax changes
  (e.g. loss of joint assessment), inflation, future pension indexation.

## Checks before showing it to anyone

- [ ] Window is 12 *full* months and stated on the sheet
- [ ] Spending total ≈ actual external outflow of the window (± one-offs)
- [ ] Income row comes from block A, not from history
- [ ] Every adjustment ≠ 100 % has a reason in the comment cell
- [ ] Every rate/allowance in block A has its source and year next to it
- [ ] The plain-language sentence under the summary matches the numbers
- [ ] Opened and recalculated in the user's own spreadsheet program

---

## Agent prompt

Copy this into Claude Code inside the family's Estate OS repository. It works with both templates.

```text
Build a budget forecast for [SURVIVOR] after the death of [DECEASED], as a new sheet in the generated
transaction workbook, following the Estate OS method.

Context: read CLAUDE.md first (facts, dates, people) and the finance README (Financien/README.md or
Konto/README.md). The workbook is generated by the build script in the finance _tools folder; never edit the
xlsx by hand – extend the build script. The country decides the survivor's-pension rules (CLAUDE.md §0).

Do this in order and show me the result of each step before moving on:

1. Data readiness. Report: share of spending in the catch-all category (target < 10 %), whether internal
   transfers and credit-card settlements are excluded, whether a one-off flag exists. If not, add to the
   transaction model: an external yes/no flag, a one-off yes/no flag (listed one-off providers + any single
   booking ≥ €300 in discretionary categories), and optionally a subcategory (e.g. everything about the car).
   Add provider rules until the catch-all is small. Show me the top 10 uncategorised counterparties first.

2. Window. Use the last 12 full calendar months before the death (or before a long illness, if CLAUDE.md
   says so). Tell me the window and why.

3. Block A – income. Read the latest regular net payments of each pension/benefit from the data. Look up the
   survivor's-pension rules for the country from current official sources and cite them (rate, allowances,
   offsets, transition period, health/care contribution rate, with year). Build visible input cells for every
   assumption with its source next to it. Output: survivor's monthly net income in the transition phase and
   permanently. Mark anything you derived yourself as such. Do not guess facts about the family – ask.

4. Block B – spending. One row per external category (and subcategory): 12-month average without one-offs,
   adjustment %, optional fixed amount, forecast per month (transition / permanent), per year, comment, and the
   excluded one-off amount. Start from one-person defaults kept in a dictionary in the build script
   (category → (percent, reason)), plus per-contract exceptions from the contract register (contracts of
   [DECEASED] that end → 0 with the reason). Income row is fed from block A.

5. Block C – summary: income, spending and balance per month for transition and permanent phase; first year;
   later years; optional savings runway. Add one plain-language sentence that a non-expert can read.

6. Optional: seasonality (category × calendar month) and a short list of months with large payments.

7. Verify: spending total vs. actual external outflow in the window; every non-100 % adjustment has a reason;
   formulas use only functions my Excel knows (SUMIFS, SUMPRODUCT, INDEX/MATCH); rebuild, then open and
   recalculate in the real program if you can. Footnote what is not included (insurance payouts, funeral
   costs, tax changes, inflation).

8. Write it down: README section for the new sheet, a LOG entry, TODO items for every assumption that needs a
   decision by [SURVIVOR] (car, subscriptions, housing). Then a one-page summary in the template's language
   for [SURVIVOR]: what comes in, what goes out, the balance, and the two or three decisions that matter most.

Rules: no figures in chat beyond what is needed; mask IBANs; nothing leaves this machine; rates and
allowances always with source and year; ask me before deciding anything about the family's choices.
```
