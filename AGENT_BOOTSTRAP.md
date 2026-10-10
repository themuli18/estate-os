# AGENT_BOOTSTRAP — set up an Estate OS

**Audience:** an AI coding agent (Claude Code or similar) running on the user's Mac, in the folder that will become
the new repository. **Goal:** a working Estate OS: template copied and filled in, tools verified, private backup,
mail and scan intake connected, first analysis done.

Read [`README.md`](README.md) and skim `docs/` before you start. There are two templates: [`template/`](template/) (Netherlands, Dutch) and [`template-de/`](template-de/) (Germany,
German; see `docs/13-germany.md`). Pick the one matching the country whose institutions you'll deal with (interview
question 3). Speak to the user in the language they use, but write everything inside the new repository in the
template's language unless the user decides otherwise. File and folder names below are those of the Dutch template;
the German equivalents are listed in `docs/13-germany.md`.

---

## Ground rules for you, the agent

1. **The user is grieving or helping someone who is.** Acknowledge it once, then be efficient. No repeated
   condolences.
2. **Never guess facts about the family.** Ask, and record the answer with its source. Unknown stays `?`.
3. **Never send anything** (email, form, message) on anyone's behalf. Create drafts and say where they are.
4. **Local first.** Use only the connectors the user approves in Phase 1. Never upload documents to web tools.
5. **Confirm before anything hard to reverse:** creating remotes, pushing, deleting, moving original files.
6. **Verify each phase** with its check before moving on. Report failures plainly.
7. **Use first names** for the deceased and the survivor once you know them. Never role words.

---

## Phase 0 — Prerequisites (check, don't assume)

Run and report:

```bash
sw_vers; uname -m
command -v git pdftotext pdftoppm swiftc python3
python3 -c "import sys; print(sys.version)"
```

Missing → propose `brew install git poppler python` and `xcode-select --install`, and wait for the user.
Check: every command resolves.

## Phase 1 — Interview (short; one message, numbered questions)

Ask only what is needed to start. The rest goes into §9 open questions.

1. First names of the deceased and the survivor; who coordinates; who else helps (and who scans the post).
2. Date of death. **All deadlines derive from it.**
3. Country/countries involved (template is NL; flag cross-border).
4. Married / registered partnership / cohabiting; known will? known debts? owned or rented home?
5. Which mailboxes matter (survivor, deceased, coordinator)? Is Mail MCP (or another mail connector) available?
6. Where does post get scanned, and should the scan inbox be a **local folder** or a **Google Drive folder**?
7. Backup target: home NAS over SSH / encrypted SSD / other? (Explain the trade-off in one line, see `docs/03` §4.)
8. Existing material: scan archives, ZIP exports, bank statements, portal downloads? Where?
9. Language for chat with the coordinator (default Dutch).
10. Which connectors are allowed to touch estate data? (Default: Mail MCP only.)

## Phase 2 — Scaffold

```bash
cp -R <estate-os>/template/. .        # or template-de/ for Germany
git init -b main
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

Then in `CLAUDE.md`:
- Replace `[OVERLEDENE]`, `[PARTNER]`, `[COÖRDINATOR]` everywhere (also in `Documenten/README.md`, `Financien/README.md`,
  `TODO.md`, skills). Grep afterwards: `grep -rn '\[OVERLEDENE\]\|\[PARTNER\]\|\[COÖRDINATOR\]' .` → only intentional
  placeholders remain.
- Fill §0 with confirmed facts only; §1 people; §2 the allowed connector list and the one remote; §7 compute first
  deadlines from the date of death (each with source, hard/soft) — consult `docs/10-netherlands.md` and **verify
  against current official sources** before writing a number.
- `TODO.md`: date-of-death line, "Blokkeert al het andere", the first deadlines.
- `LOG.md`: first entry "Estate OS opgezet".

Check: `.venv/bin/python _tools/controleer_archief.py` exits 0; no unintended placeholders.

## Phase 3 — Tools

```bash
zsh _tools/ocr.sh <any scanned pdf or image>          # compiles the Vision helper on first run
.venv/bin/python _tools/tekstlaag.py --controleer
```

If there is no sample yet, render a test image with a few Dutch lines, save it as an image-only PDF in the scratchpad
(not in the repo), and run both tools on it. Optional: `.venv/bin/pip install mlx-whisper` for `transcribeer.sh`
(Apple Silicon only) and set `WHISPER_PROMPT` to the family names.

Check: OCR prints the expected Dutch text; tekstlaag makes `pdftotext` return it.

## Phase 4 — Private backup

With the user's go-ahead, follow `docs/03-setup-guide.md` §4 for the chosen target. Root actions on a NAS need a
real terminal: put the command on the clipboard (`pbcopy`) and let the user run it.
Write the remote URL and **who holds keys** into `CLAUDE.md` §2.

Check: `git push -u origin main` succeeds; `git ls-remote origin` shows `main`.

## Phase 5 — Mail and scan intake

- **Mail:** if no mail connector exists yet, help deploy `packages/mailmcp/` (see its README; needs a Docker host
  and a Google Cloud project, so this is a human-led step). Confirm the connector works (`list_accounts` for Mail MCP). Record the alias → mailbox mapping in
  `CLAUDE.md` §2b. If the deceased's mailbox is reachable, connect it **now** — access tends to disappear.
- **Scans:** help configure the ScanSnap profile (`docs/04-scanning-intake.md` §2). Record the inbox path in §2b.
  Ask the user to scan one real letter; run the `post-verwerken` skill on it end to end.
- **Schedule (optional):** propose a daily `mail-controleren` + `post-verwerken` run (see `docs/05` "Running it on a
  schedule"). Unattended runs only write LOG/TODO/drafts.

Check: one document filed with index row; one mail sweep logged.

## Phase 6 — Bulk intake of existing material

1. Unpack archives with Python `zipfile` (+ NFC normalisation) into `Documenten/_Origineel/` (git-ignored).
2. Inventory; select by the inclusion rule (`Documenten/README.md`); show the user the selection count before filing.
3. File, name, text-layer, index. Run the archive check after each batch. Commit per batch.
4. Fill `_TE_SCANNEN.md` with what is missing, ordered by which appointment or deadline needs it.

Check: `controleer_archief.py` clean; index counters match; `tekstlaag.py --controleer` prints nothing.

## Phase 7 — Finances and contract discovery

1. Ask for 12–24 months of exports per account (CSV/CAMT.053 preferred) into `Financien/<bank>/`.
2. Run `.venv/bin/python Financien/_tools/bouw_overzicht.py`. If a bank format isn't recognised or a column is
   missing, extend the parser following `docs/11-bank-parsers.md`. Read the **Controle** tab: every row must
   reconcile; gaps mean missing exports. Never hand-edit the output.
3. From the "recurring" view, write `Documenten/04_Verzekeringen/00_Verzekeringsoverzicht.md` and
   `Documenten/06_Woning_energie_en_gemeente/00_Leveranciersoverzicht.md`: per contract provider, number (cross-checked
   against mandate reference), holder, amount, frequency, action (transfer/cancel/keep), deadline.
4. Every action → `TODO.md`; every deadline → §7; every provider → §8.

Check: every recurring debit of the last 12 months appears in an overview or is explicitly marked "bewust genegeerd".

## Phase 8 — Hand over

- Update `CLAUDE.md` §2a "Stand van zaken" and §6 "Volgorde van het werk" (top 5–8 next steps, in order, with dates).
- Run the `sessie-afsluiten` skill.
- Give the coordinator a short Dutch briefing: what exists, the three phrases they'll use daily
  ("check de mail", "verwerk de post", "sluit af"), the top deadlines.

---

## Definition of done

- [ ] `CLAUDE.md` §0 facts filled or marked `?` with questions in §9
- [ ] Deadlines in §7 and `TODO.md`, each hard/soft with source
- [ ] Tools verified (OCR, text layer, archive check)
- [ ] Private remote set, pushed, key holders documented
- [ ] Mail connector working, aliases documented; deceased's mailbox connected or a TODO to do so
- [ ] Scan inbox working end to end with one real document
- [ ] Existing material ingested or scheduled in `_TE_SCANNEN.md`
- [ ] Recurring payments analysed into contract overviews (or a TODO with owner and date)
- [ ] LOG entry, commit, push
