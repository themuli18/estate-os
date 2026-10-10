# 2. Architecture

```
                 ┌────────────────────────── INPUTS ───────────────────────────┐
  Paper post ──► ScanSnap ──► scan inbox (local folder or Google Drive folder)
  Mailboxes (survivor, deceased, coordinator) ──► Mail MCP (read + drafts only)
  Bank / card exports (CSV, CAMT.053, PDF) ──► Financien/<bank>/
  Phone calls, voice memos (with consent) ──► _tools/transcribeer.sh (local Whisper)
  Customer portals (insurer, energy, pension) ──► downloaded PDFs
                 └──────────────────────────────┬──────────────────────────────┘
                                                ▼
                     ┌──────────── Claude Code in the repo ────────────┐
                     │ reads CLAUDE.md rules · skills:                   │
                     │   post-verwerken · mail-controleren ·             │
                     │   sessie-afsluiten                                │
                     │ local tools: ocr.sh · tekstlaag.py ·              │
                     │   controleer_archief.py · bank build               │
                     └──────────────────────┬───────────────────────────┘
                                            ▼
  ┌──────────────────────────── THE REPOSITORY (git) ───────────────────────────┐
  │ CLAUDE.md   facts · rules · tools · pitfalls · workstreams · deadlines ·     │
  │             contacts · open questions                                        │
  │ TODO.md     the only open list (who · by when · status)                      │
  │ LOG.md      dated journal of every session                                   │
  │ Documenten/ 11 topic folders + 00_INDEX.md + README.md + _TE_SCANNEN.md      │
  │ Afspraken/  preparation + minutes of real appointments                       │
  │ Financien/  raw exports + generated Transacties.xlsx                         │
  │ _tools/     OCR, text layer, archive check, transcription                    │
  │ .claude/skills/  repeatable procedures                                       │
  └───────────────────────────────┬─────────────────────────────────────────────┘
                                  ▼
                 OUTPUTS (always via a human)
                 drafts in the right mailbox · filled-in forms · appointment prep ·
                 plain-language summaries for the survivor · calendar entries
                                  ▼
                 BACKUP: git push to ONE private remote (home NAS over SSH/VPN)
```

## Components

### 1. The control files

| File | Role | Updated |
|---|---|---|
| `CLAUDE.md` | The assistant's long-term memory and rulebook. §0 facts table (only confirmed facts, otherwise `?`), §1 people, §2 working rules, §2a current state, §2b tools, §2c pitfalls, §3 structure, §4 finances, §5 workstreams, §6 order of work, §7 deadline table, §8 contacts, §9 open questions | Whenever a fact, deadline, contact or lesson appears |
| `TODO.md` | The single open-items list, in sections (fixed appointments, blockers, deadlines, recurring payments, this week, contracts, estate, protection, scanning). Done items are struck through with date and name, never deleted | Every session |
| `LOG.md` | Append-only journal. `## YYYY-MM-DD — topic (name)` followed by bullet points | Every session that changes anything |

Claude Code loads `CLAUDE.md` automatically at session start, so the rules are always in context. As the work
grows the file gets large (the original reached about 90 KB). That's fine, but keep §2a "current state" short and
current so a new session gets oriented quickly.

### 2. The document archive (`Documenten/`)

- 11 topic folders, numbered so they sort the same way everywhere.
- File name `YYYY-MM-DD_Sender_Subject_Person.ext`. The date is the **document date**, the subject contains the
  **distinguishing number**, and there are no spaces or diacritics.
- `00_INDEX.md`: one table per folder with date, sender, subject, person, reference number and a link. People search
  here, not in Finder.
- Every PDF gets an invisible OCR text layer (`_tools/tekstlaag.py`, Apple Vision), so Spotlight, Preview and
  `pdftotext` find text inside scans.
- `_TE_SCANNEN.md`: what is still missing, why it's needed, who looks for it, and what doesn't exist at home and has
  to be requested.
- Inclusion rule: running contracts, decisions from authorities or funds, and documents about the death. Receipts
  for one-off purchases are left out.
- `_tools/controleer_archief.py` checks for duplicate names, schema violations, files without an index row, and
  index rows pointing at nothing. Run it after every change.

### 3. Finances (`Financien/`)

Raw exports go in unchanged. A build script parses them, reconciles balances, deduplicates, matches transfers between
the family's own accounts, maps counterparties to a provider and category with regex rules, and writes a workbook
with pivots plus a "recurring" tab. That recurring tab, grouped by creditor ID and mandate reference, is what reveals
every running contract, including the ones nobody knew about. The direct-debit mandate reference often contains the
contract number. This makes it the best OCR-free cross-check for numbers read from phone-photo scans.

The bank parser is bank-specific and gets written per family. `template/Financien/README.md` contains the spec for
the agent.

### 4. Skills (`.claude/skills/`)

Repeatable procedures written as Claude Code skills, so every helper's assistant runs them the same way:

- `post-verwerken`: process the scan inbox end to end.
- `mail-controleren`: sweep all mailboxes and sort messages into urgent, important, info or ignore.
- `sessie-afsluiten`: update LOG and TODO, check names, mask identifiers, run the archive check, guard against
  deletions, commit and push.

### 5. Connectors

- **Mail MCP**: a self-hosted remote MCP server that exposes several Google accounts (Gmail, Calendar, Drive) to
  Claude at once, with `account: "all"` fan-out on search. It can read and create drafts, and **cannot send**. See
  [05-mail-monitoring.md](05-mail-monitoring.md).
- Everything else stays local. The rule in `CLAUDE.md` lists which connectors are allowed, and any connector not on
  the list is off-limits for estate data.

### 6. Backup and collaboration

A bare git repository on a private NAS, reachable over a VPN (for example Tailscale) with SSH key authentication.
Each helper clones it. There is no cloud git host. See [03-setup-guide.md](03-setup-guide.md) §4.
