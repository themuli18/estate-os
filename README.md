# Estate OS

A private, local-first "operating system" for handling the administration after a death, and afterwards for running
the surviving partner's household paperwork. It's a git repository of scanned documents and plain-text control files,
with an AI assistant (Claude Code) working inside it under written rules.

The setup was first built for a German estate. This kit generalizes it and ships two templates: a **Dutch-language
template** (`template/`) and a **German-language template** (`template-de/`). The instructions are in English so that a
person or an AI agent can follow them.

> This kit contains no personal data from the original estate. Every name, number and place in the
> template is a placeholder.

## What you get

| Path | What it is | Language |
|---|---|---|
| [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md) | Step-by-step runbook for an AI agent to set up a new Estate OS with a family | English |
| [`docs/01-concept.md`](docs/01-concept.md) | What Estate OS is, its principles, and why it is built this way | English |
| [`docs/02-architecture.md`](docs/02-architecture.md) | Components, data flows, the control files | English |
| [`docs/03-setup-guide.md`](docs/03-setup-guide.md) | Human setup: Mac, git, private backup, tools, Claude Code | English |
| [`docs/04-scanning-intake.md`](docs/04-scanning-intake.md) | ScanSnap → scan inbox → archive | English |
| [`docs/05-mail-monitoring.md`](docs/05-mail-monitoring.md) | Mail MCP: watching mailboxes for urgent or important mail | English |
| [`docs/06-operating-rhythm.md`](docs/06-operating-rhythm.md) | Daily, weekly and yearly routines; what a session looks like | English |
| [`docs/07-privacy-security.md`](docs/07-privacy-security.md) | Threat model, access, what never leaves the machine | English |
| [`docs/08-lessons-learned.md`](docs/08-lessons-learned.md) | Pitfalls that cost real time the first time | English |
| [`docs/09-after-the-estate.md`](docs/09-after-the-estate.md) | Phase 2: Estate OS as the survivor's ongoing admin | English |
| [`docs/10-netherlands.md`](docs/10-netherlands.md) | Dutch context: institutions, workstreams, deadlines to verify | English + Dutch terms |
| [`docs/11-bank-parsers.md`](docs/11-bank-parsers.md) | Dutch bank exports (camt.053, ING, Rabobank, ABN AMRO, MT940, PDF): how the parsers work and how to add a bank | English |
| [`docs/12-gaps.md`](docs/12-gaps.md) | What is missing, untested or deliberately left out | English |
| [`template/`](template/) | The repository to copy: control files, folders, tools (incl. bank parsers), skills | **Dutch** |
| [`docs/13-germany.md`](docs/13-germany.md) | German variant: folders, tools, German bank parsers (camt.053, Sparkasse, DKB, ING, Commerzbank PDF), workstreams | English |
| [`docs/14-budget-forecast.md`](docs/14-budget-forecast.md) | How to build the survivor's budget forecast (income after the death vs. spending per category), plus a copy-paste agent prompt | English |
| [`template-de/`](template-de/) | The German repository to copy: same structure, German law and banks | **German** |
| [`packages/mailmcp/`](packages/mailmcp/) | Mail MCP server source: multi-account Gmail/Calendar/Drive MCP, read + drafts only | English |
| [`tests/`](tests/) | Bank-parser tests (Dutch and German) on synthetic fixtures | — |

## Quick start

**With an AI agent (recommended).** Open Claude Code in an empty folder and say:

> Read `<path-to-estate-os>/AGENT_BOOTSTRAP.md` and set up an Estate OS here with me.

The agent interviews you, copies the template, fills in the facts and connects the tooling, checking each step as
it goes.

**By hand.** Follow [`docs/03-setup-guide.md`](docs/03-setup-guide.md), then copy `template/` into your new private
repository.

## The five ideas that make it work

1. **One folder, one truth.** All documents, notes, deadlines and tools are in one git repository. Nothing important
   lives only in someone's head, inbox or chat history.
2. **Three control files.** `CLAUDE.md` holds the facts, rules, deadlines and contacts. `TODO.md` is the only open
   list. `LOG.md` is the dated journal. The assistant reads them at the start of a session and updates them before it
   ends.
3. **An index, not a folder hunt.** Every document is renamed `YYYY-MM-DD_Sender_Subject_Person.pdf`, made
   full-text searchable on-device, and listed in `Documenten/00_INDEX.md` with its reference number.
4. **Inputs flow in automatically. Outputs never go out on their own.** Scanned post and mailboxes are monitored.
   The assistant reads, files, extracts deadlines and drafts replies. A human always sends.
5. **Private by construction.** Local OCR and transcription, a single private git remote (for example a home NAS),
   identifiers masked in anything shareable.
