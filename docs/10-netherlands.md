# 10. Netherlands context

The original Estate OS was built for German law and institutions. This page maps the structure to the Netherlands.

> **Verify everything here against current primary sources** (rijksoverheid.nl, belastingdienst.nl, svb.nl, the
> notary, the institution itself) before acting. Amounts, exemptions and procedures change. Where the deceased or the
> survivor has ties to another country, have a cross-border advisor check it. The assistant is told to cite sources
> and mark deadlines *hard* or *soft*, and that applies doubly here.

## Germany → Netherlands mapping

| Concept | Germany (original) | Netherlands (template) |
|---|---|---|
| Death certificate | Sterbeurkunde (Standesamt) | **Akte van overlijden** (gemeente); the uitvaartondernemer usually files the aangifte |
| Will registry | Zentrales Testamentsregister | **Centraal Testamentenregister (CTR)** |
| Proof of heirship | Erbschein (Nachlassgericht) | **Verklaring van erfrecht** (notaris) |
| Accept / disclaim | Ausschlagung within 6 weeks | **Zuiver aanvaarden / beneficiair aanvaarden / verwerpen**. The latter two are declared at the rechtbank |
| Statutory spouse share | § 1931 BGB | **Wettelijke verdeling**, art. 4:13 BW (partner receives the goods, children get a claim) |
| Widow's pension | DRV Witwenrente | **Partnerpensioen / nabestaandenpensioen** (pension fund); **Anw** (SVB, conditions apply) |
| State pension | DRV Altersrente | **AOW** (SVB). Ends for the deceased; the survivor may move to the single-person rate |
| Inheritance tax | Erbschaftsteuer, notification § 30 ErbStG | **Erfbelasting**: return (if required) within **8 months** of death; extension possible |
| Final income tax | Einkommensteuer Todesjahr | **Aangifte inkomstenbelasting** for the deceased over the year of death (often via an invitation / F-biljet) |
| Power of attorney | Vorsorgevollmacht | **Levenstestament** (notary) |
| Living will | Patientenverfügung | **Schriftelijke wilsverklaring / behandelverbod** |
| Government login | ELSTER certificate | **DigiD** (personal; use **DigiD Machtigen** for helpers) |
| Broadcast fee | Rundfunkbeitrag | — (none) |
| Municipal charges | Grundsteuer, Abfall | **Gemeentelijke belastingen** (OZB, afvalstoffenheffing, rioolheffing), **waterschapsbelasting** |
| Car | Zulassungsstelle, Kfz-Steuer, TÜV | **RDW** (tenaamstelling), **motorrijtuigenbelasting**, **APK** |
| Land registry | Grundbuchberichtigung | **Kadaster**, via the notary |

## What is often automatic in NL (but check)

The municipality registers the death in the **BRP** (basisregistratie personen). Many public bodies get it from
there, including SVB, Belastingdienst, pension funds and health insurers. In the original German case, by contrast,
nearly every institution had to be notified by hand. **Don't assume, verify.** The mail sweep should look for the
letters these bodies send, and TODO keeps an item open until a confirmation is filed.

Banks, private insurers, utilities, telecom, subscriptions, clubs and webshops generally **must be notified by the
family**.

## Workstreams (as in `template/CLAUDE.md` §5)

**A. First two weeks.** Uitvaart and the akte van overlijden (get several copies); notify life, funeral and accident
insurers immediately (short notice periods in some policies); notify banks and settle what happens to joint
(en/of) accounts; secure the deceased's phone, mail and password manager.

**B. Estate.** CTR check → notary → verklaring van erfrecht. Decide how to accept the inheritance only once there's
an overview of assets *and* debts. Housing: an owned home is updated in the Kadaster via the notary; for a rental,
arrange continuation of the lease with the landlord.

**C. Income.** SVB (AOW for the deceased stops, possible overlijdensuitkering, the survivor's AOW changes); every
pension fund → partner pension; **toeslagen** (zorgtoeslag, huurtoeslag): report the change and re-estimate income;
health insurance: the deceased's policy ends, adjust a family policy.

**D. Contracts.** Pull 12–24 months of bank exports (Dutch banks offer CSV and usually CAMT.053), then build the
recurring-payments list by *incassant-ID* + *machtigingskenmerk*. That list is the contract register. For each
contract: transfer it to the survivor's name, cancel it, or keep it running.

**E. Protection.** Levenstestament, wilsverklaring, the survivor's own will, DigiD Machtigen, bank authorisation,
Wmo-loket of the municipality for practical support.

**F. Taxes.** The deceased's final income tax return; erfbelasting return if required (8 months); the survivor's
return (fiscal partnership in the year of death, single afterwards: worth an adviser's look); municipal and water
board taxes, including remission (kwijtschelding) if income drops.

**G. Digital estate.** Phone, mailboxes, Apple/Google ID, password manager, social media, webshops, comparison
sites. Delete nothing until settled.

## Dutch vocabulary used in the template

| Template term | Meaning |
|---|---|
| `Documenten/` | archive |
| `Afspraken/` | appointments (prep + minutes) |
| `Financien/` | bank exports + workbook |
| `_TE_SCANNEN.md` | still-to-scan list |
| `post-verwerken` | process scanned post |
| `mail-controleren` | mailbox sweep |
| `sessie-afsluiten` | close session |
| `controleer_archief.py` | archive check |
| `tekstlaag.py` | OCR text layer |
| `transcribeer.sh` | transcription |
| hard / zacht | hard (legal/contractual) / soft (recommended) deadline |
| wie / uiterlijk / stand | owner / due by / status |

## Language settings

- OCR defaults to `nl-NL,en-US`. Override with `OCR_LANGS=de-DE,nl-NL` for cross-border paperwork.
- Transcription defaults to `nl`. Put the family names and recurring institutions into `WHISPER_PROMPT` so they are
  spelled right.
- Mail triage uses Dutch trigger words (`aanmaning`, `deurwaarder`, `beschikking` …). Add English or German ones if
  there is cross-border mail.
