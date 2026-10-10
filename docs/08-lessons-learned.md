# 8. Lessons learned

Each of these cost real time in the first Estate OS. They are already built into the template's rules and tools. Add
new ones to `CLAUDE.md` §2c with a date.

## Data and archive

- **Silent deletion through `git add -A`.** A duplicate-file cleaner removed archived files because each one still
  had a twin in `~/Downloads`. The next `git add -A && git commit && git push` recorded the deletions and carried
  them to the backup. They were recovered from history.
  **Rules:** keep the repo out of `~/Downloads`, exclude it from duplicate cleaners, check
  `git diff --cached --name-only --diff-filter=D` before every commit, and run the archive check after every
  archive change. The check is what revealed the loss.
- **Identical target names overwrite each other.** Two letters from the same sender on the same day got the same
  name, and the second replaced the first. It was only noticed because the file count was off. The subject must
  contain the distinguishing number, and `controleer_archief.py` checks this.
- **Scanner file names are unreliable.** Phone scanners used birth dates from lab reports as the file date, or put
  OCR garbage in the title. Always derive the name from the document content.
- **Phone-photo OCR gets digits wrong.** Words come out right and numbers don't (an `8` read as `3`, a `1` as `7`).
  200, 300 and 400 dpi made no difference, because the source image is the limit.
  **Cross-check every number**, best against bank-statement mandate references, which are native text and usually
  contain the contract number.
- **Tesseract with only the English model** turns local names into nonsense and runs on the CPU alone. Apple Vision
  with the right language list is better and on-device.
- **`unzip` mangles UTF-8 file names on macOS.** Use Python `zipfile` plus `unicodedata.normalize("NFC", …)`.

- **A bank printed a wrong opening balance** on several statements, even though no booking was missing. Chain
  each statement to the previous one's closing balance before calling it a parser error. The German build does this.

## Spreadsheets

- **Excel kept the old workbook open** and would have overwritten the rebuilt one on save. Close it before every
  rebuild.
- **The user's older Excel didn't know newer functions** (MAXIFS, XLOOKUP and others showed `#NAME?`) even though
  LibreOffice calculated them. Use SUMIFS, SUMPRODUCT and INDEX/MATCH, and verify in the user's actual Excel.
- **Excel drops conditional formatting placed on pivot-table cells** when it rebuilds the pivot on open. Put heat
  maps on a mirror range of plain cells (`GETPIVOTDATA`).
- **Pivot tables can be generated with openpyxl** (pivot classes, empty cache, `refreshOnLoad`). Excel fills them
  on open. Each extra page filter shifts the pivot down a row, and any mirror formulas have to move with it.

## Shell and automation

- **An unquoted heredoc executes backticks and `$`.** A Markdown code span in replacement text ran as a command.
  Always use `<<'EOF'`.
- **Typographic quotes inside a Python heredoc** caused syntax errors. Write replacement text to a file and read it
  from there.
- **`sudo` needs a TTY.** Root actions on the NAS couldn't be run from the assistant's shell. Copy the command to the
  clipboard (`pbcopy`) and have the human run it in Terminal.
- **Browsers throttle background tabs.** Long scripted browser jobs (for example exporting an order history) only
  run fast in a visible window. Save progress to `localStorage` so a reload doesn't lose it.

## Process

- **Two people pushing in parallel** produce conflicts in TODO, LOG and the index counters. Pull first, keep both
  sides and recount.
- **"Prepare letters in advance" creates clutter.** Most were never needed. Draft only when sending is imminent.
- **Facts drift.** Early assumptions from memory (about health, about which vehicles existed) turned out wrong once the documents
  arrived. Keep facts in §0 with their source and update them visibly.
- **The deceased's access is time-critical.** 2FA apps, a tax-portal certificate file and the password manager were
  on the phone. A certificate had expired without anyone noticing. Inventory digital access in week 1.
- **"Nothing new from …" is information.** Logging which institutions were checked and had not answered made the
  follow-ups obvious.
- **Ask the user to confirm facts the documents can't settle**, such as which fuel station a card payment went to,
  and write the answer down with the date.
