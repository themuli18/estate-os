# 1. Concept

## The problem

When someone dies, the surviving family faces dozens of institutions at once: the municipality, banks, insurers,
pension funds, the tax authority, utilities, telecom, subscriptions and a notary. Each one wants a different
document and sets its own deadline. Many of the contracts are in the deceased's name, and the paper trail is spread
across a filing cabinet, two or three mailboxes, a phone and a bank account. Usually more than one family member
helps, often from different cities or countries.

Usually the surviving partner isn't the person who ran the paperwork. Once the estate is settled, they still need
a system they can lean on.

## The answer: an "operating system" for the household administration

Estate OS is a folder with a few strict rules and an AI assistant that follows them:

- **Everything goes in.** Paper is scanned, mail is read, bank exports are parsed, and phone calls are transcribed
  with consent.
- **Everything is findable.** One naming scheme, one index, full-text search, and reference numbers checked against
  a second source.
- **Everything has an owner and a date.** Each open item names who, by when, and its status. Every deadline is
  marked *hard* (legal or contractual, with its source) or *soft* (recommended).
- **Everything is journaled.** Each working session leaves a dated LOG entry: what was done, what was sent and by
  whom, what was learned. A second helper can pick up where the first left off.
- **Nothing leaves without a human.** The assistant drafts and a person sends. The mail connector has no send
  function at all.

## Design principles

| Principle | Consequence |
|---|---|
| **Plain text over apps** | Markdown control files work in any editor, diff cleanly in git, and stay readable in 20 years. No database, no SaaS lock-in. |
| **Generated artifacts are never hand-edited** | Spreadsheets and indexes are rebuilt by scripts. A wrong value gets fixed in the tool, not the output. |
| **Analyse, don't just list** | Each topic folder can have a `00_…` overview that evaluates what's there, for example which insurances overlap or which contracts must move to the survivor's name. |
| **Primary sources first** | Rules are stated with their legal basis so they can be verified. The assistant marks its own interpretations as such. |
| **Not a lawyer, but concrete** | The assistant says when a notary or tax advisor is needed and what to bring. It never presents a legal conclusion as final. |
| **Names, not roles** | The assistant uses first names, never "the widow" or "your father". This matters to grieving people. |
| **No letters on stock** | Drafts are written only when they are actually needed, so the repository doesn't fill up with unused paper. |
| **Local by default** | OCR and transcription run on-device. Only explicitly allowed connectors touch the data. |

## Two phases

1. **Estate phase** (roughly 0 to 12 months). Notify institutions, settle the inheritance, move contracts to the
   survivor's name or cancel them, secure the survivor's income, and file the tax returns. Work is driven by
   deadlines and is intense.
2. **Household phase** (ongoing). The same repository becomes the survivor's administration, with a yearly
   calendar, a contract register, intake of incoming post and mail, plain-language summaries and protective
   documents. See [09-after-the-estate.md](09-after-the-estate.md).

## Roles

| Role | Typical person | Does |
|---|---|---|
| **Coordinator** | an adult child or close friend | runs the sessions with the assistant, decides, sends |
| **Survivor** | the partner | signs, attends appointments, gets short plain-language summaries |
| **Scanner** | whoever is near the post | puts paper through the ScanSnap; that's all |
| **Assistant** | Claude Code in the repository | reads, files, analyses, tracks deadlines, drafts, keeps LOG/TODO current |
| **Professionals** | notary, tax advisor, lawyer | get exactly the documents they ask for |

More than one coordinator can work in the repository in parallel. Git keeps them in sync, and LOG entries carry the
person's name.
