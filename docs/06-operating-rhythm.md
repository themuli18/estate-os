# 6. Operating rhythm

## A working session

1. **Start.** Open Claude Code in the repository. `CLAUDE.md` loads automatically. Run `git pull` first if someone
   else works in the repo too.
2. **Inputs.** "Check de mail en verwerk de post." Both skills run, and you get urgent items first.
3. **Work.** Pick from `TODO.md`: "This week" and anything in the urgent section. Typical tasks:
   - work out what a letter means and what the deadline is, citing the source
   - prepare an appointment (`Afspraken/YYYY-MM-DD_Instantie_Onderwerp.md`: goal, what to bring, numbered questions)
   - fill in a form or draft a reply (drafts only, in the right mailbox)
   - compare offers (energy, insurance) and record the decision with reasons
   - analyse the bank workbook ("which contracts are still in the deceased's name?")
4. **Close.** "Sluit af." The `sessie-afsluiten` skill updates LOG, TODO and CLAUDE.md, checks names and masking,
   runs the archive check, guards against accidental deletions, commits and pushes.

Keep sessions short and frequent. Because the state lives in the three control files, nothing depends on the chat
history.

## Cadence

| When | What |
|---|---|
| **Daily** (estate phase, first ~3 months) | mail sweep + post intake; check hard deadlines within 14 days |
| **Weekly** | refresh TODO "This week"; chase anything with no answer after 2 weeks (draft follow-ups); update §2a "current state" |
| **After every appointment** | fill in the minutes section of the `Afspraken/` file; new deadlines go to TODO + §7 |
| **Monthly** | new bank exports into `Financien/`, rebuild the workbook, look for new or ended direct debits |
| **Yearly** (household phase) | see the calendar in [09-after-the-estate.md](09-after-the-estate.md) |

## Writing conventions

- Dates are ISO (`2026-09-19`). Amounts are Dutch-formatted in Dutch text (`€ 1.820,79`).
- Every TODO line has **who**, **by when** and **status**. Done items are struck through with date and name.
- Every deadline is **hard** (legal or contractual, with article or clause) or **soft**.
- LOG entries say **who** did something when it wasn't the assistant ("verstuurd door …").
- The person who sends something logs that it was sent. A draft is not a sent message.

## Working with the survivor

- Write short Dutch summaries in large steps with no jargon, one topic per page. Print them if that helps.
- Put appointments on the survivor's own calendar with a short instruction in the description. Mail MCP can create
  calendar events.
- The survivor signs and attends. Everything else should be prepared so that this is all they need to do.

## Working with several helpers

- Pull before working and push after. Conflicts happen almost only in `TODO.md`, `LOG.md` and the `00_INDEX.md`
  counters. Keep both sides and recount.
- Put your name in LOG headings: `## 2026-10-03 — Topic (Name)`.
- Split by topic rather than by day to avoid double work. Note in TODO who owns which topic.
