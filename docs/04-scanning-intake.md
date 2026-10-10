# 4. Scanning and intake (ScanSnap)

Goal: a letter that arrives at the house is in the archive within a day, correctly named and indexed, and any action
or deadline in it is on `TODO.md`. Nobody has to type or name anything by hand.

## The flow

```
letter ─► ScanSnap (profile "Estate OS") ─► scan inbox ─► "verwerk de post" ─► Documenten/<topic>/…pdf
                                              │                                 + 00_INDEX.md row
                                              │                                 + TODO / §7 deadlines / §8 contacts
                                              │                                 + LOG entry, commit, push
                                              └─► processed files moved to Scans-Inbox/Verwerkt
```

## 1. Choose where the inbox lives

| Option | When | How |
|---|---|---|
| **A. Local folder** (most private) | The scanner is connected to the coordinator's Mac | ScanSnap Home saves to `~/Scans/Inbox`. Nothing touches a cloud. |
| **B. Google Drive folder** (what the original used) | The scanner is at the survivor's house and the coordinator is elsewhere | ScanSnap saves into a Drive folder such as `Scans-Inbox`. The coordinator's Mac syncs it with **Google Drive for desktop**, so the files appear under `~/Library/CloudStorage/GoogleDrive-<account>/My Drive/Scans-Inbox`. Mail MCP's Drive tools can also search and read it remotely. |

Option B puts scans of personal post into a Google account. That was an accepted trade-off because it lets a remote
helper see new post the same day. Write the choice into `CLAUDE.md` §2b.

> **Downloading binaries.** Mail MCP's `drive_read_file` is for *reading* content (triage). To file the PDF itself,
> the assistant needs the actual file: the Drive-for-desktop path, or a browser download into `~/Downloads`. In the
> original setup, files without a local sync were downloaded through the browser.

## 2. ScanSnap Home profile

Create one profile, **"Estate OS"**, so the person scanning only presses one button:

| Setting | Value | Why |
|---|---|---|
| Document type | Documents | |
| Color | Auto | Keeps letterheads and stamps readable |
| Resolution | 300 dpi ("Best"/"Excellent") | Account numbers survive OCR at 300 dpi. Phone photos don't |
| Sides | Duplex, remove blank pages | |
| File format | PDF, one file per letter | Use "continue scanning" or the manual-split option for multi-page letters |
| Searchable PDF | optional | If ScanSnap already adds text, `tekstlaag.py` skips the file. Otherwise it adds a text layer with Apple Vision |
| File name | scanner default (timestamp) | The assistant renames. Asking the scanning person to name files causes errors |
| Save to | the inbox from step 1 | For option B, a Drive folder via ScanSnap Cloud, or a local Drive-for-desktop folder on the scanning Mac |

Tell the person who scans: **one letter = one scan**. Envelopes, adverts and receipts for one-off purchases don't need
scanning. Anything from an authority, insurer, bank, pension fund, notary, utility or the municipality does.

## 3. Processing: the `post-verwerken` skill

Say "verwerk de post" (or "nieuwe post"). The skill (`template/.claude/skills/post-verwerken/SKILL.md`) then works
through the inbox:

1. Lists new files in the inbox and skips anything already in the index.
2. Reads each file with `pdftotext`, falling back to `_tools/ocr.sh`. It determines the document date, sender,
   subject, person, reference number and topic folder.
3. Applies the inclusion rule and detects duplicate scans of the same sheet.
4. Copies and renames the file into `Documenten/<topic>/`, adds a text layer, adds an index row and updates the
   counters.
5. **Acts on the content.** Requests go to TODO, deadlines go to TODO and §7 (hard or soft, with source),
   confirmations strike through the open item, and new institutions or numbers go to §8.
6. Runs `controleer_archief.py`, writes a LOG entry, moves the inbox files to `Verwerkt/` (never deletes them),
   commits and pushes.
7. Reports in Dutch, urgent items first.

## 4. Other intake sources (same rules)

- **The existing paper archive at the house.** In the first weeks, scan in bulk by topic and use `_TE_SCANNEN.md` as
  the checklist. The order: documents needed for upcoming appointments first, then running contracts.
- **Existing scan collections** (old phone-scanner exports, Drive exports as ZIP). Unpack them with Python
  `zipfile` (not `unzip`, which mangles UTF-8 names on macOS) into `Documenten/_Origineel/`, which git ignores.
  Select by the inclusion rule, then file the selection. Typically only a small fraction of such an archive is
  relevant. Many phone scanners tag file names with keywords such as `INSURANCE`, `HOUSE` or `CAR`. Use
  those tags to pre-filter.
- **Customer portals.** Download policy documents and annual statements as PDFs into `~/Downloads`, then file them
  the same way. Native PDFs beat scans.
- **Mail attachments.** Handled by `mail-controleren` (see [05](05-mail-monitoring.md)).
- **Phone calls.** With the other party's consent, record and transcribe locally with `_tools/transcribeer.sh`. File
  the transcript next to the appointment notes in `Afspraken/`.

## 5. Quality rules

- The document date is the date printed on the letter, never the scan date.
- Reference numbers read from phone-photo scans are **not trusted** until checked against the image or a second
  source. Bank-statement mandate references are the best second source.
- Any document with PINs, activation codes or passwords gets 🔒 in the index and never goes into an email.
