# 12. What is missing

An honest list of what this kit doesn't do yet, what is untested, and what was left out on purpose. The items are
ordered by how much they matter for a Dutch household.

## Gaps that matter in the Netherlands

| Gap | Why it matters | Workaround / next step |
|---|---|---|
| **MijnOverheid Berichtenbox isn't monitored** | The Belastingdienst, SVB, RDW and municipalities increasingly send letters *only* there. Email gives just a notification without content | The mail sweep should treat "nieuw bericht in uw Berichtenbox" as **Urgent**. A person then logs in with DigiD and downloads the PDF into the scan inbox. Set up DigiD Machtigen for the helper |
| **Mail MCP is Google-only** | Many Dutch households use KPN, Ziggo, Outlook.com or provider mailboxes, not Gmail | Forward the relevant mailbox to a Gmail account that is connected, or extend Mail MCP with an IMAP backend (read-only IMAP + drafts via `APPEND` to the Drafts folder fits the same never-send design) |
| **Dutch legal content isn't verified** | `docs/10-netherlands.md` and template §5/§7 come from general knowledge, not checked against current law | The agent is told to verify every deadline against official sources before recording it. Have the notary confirm the estate steps |
| **Bank parsers haven't been run on real Dutch exports** | Column names were written from documented formats and checked only on synthetic fixtures | They fail loudly on missing columns. Fix the first real export per bank (see `docs/11-bank-parsers.md` §4) |
| **MT940 parser isn't implemented** | Some banks or older accounts only offer MT940 | Described in `docs/11` §4. The SEPA field parser already handles the `:86:` notation |
| **No PDF statement parser for Dutch banks** | Older periods are often only available as PDF | Use the reconciliation method in `docs/11` §5 for each bank |
| **No credit card parser** | ICS-issued cards and similar have their own exports | Add a parser per card issuer, following the same pattern |
| **Budget forecast ("Prognose") not ported** | The German original projected the survivor's monthly budget after pension changes | Specification in `docs/11` §6. Build it once AOW and partner pension amounts are known |

## German variant

| Gap | Note |
|---|---|
| Sparkasse/DKB/ING-DE column names unverified on real exports | They fail loudly on a missing column. Adjust the column list |
| Only one PDF bank (Commerzbank) | Other banks follow the `commerzbank_pdf.py` pattern |
| No Volksbank/Postbank/Deutsche Bank CSV parsers | Prefer camt.053 where offered |
| No budget forecast (the original had one, inside a larger personal workbook) | Specification in `docs/11` §6 |

## Automation not packaged

| Gap | Workaround |
|---|---|
| **No ready-made scheduler** for the daily mail and post check | `docs/05` "Running it on a schedule": Claude Code `/schedule` or a `launchd` job running `claude -p`. Write one per family, because it depends on the machine and permissions |
| **No push notifications** for urgent items | Have the scheduled run create a draft summary mail to the coordinator, or add a notification step (e.g. a Telegram bot) |
| **ScanSnap → archive isn't fully hands-off** | Someone still says "verwerk de post". With a scheduler this can run daily, but filing should stay supervised for the first weeks |
| **No Drive binary download in Mail MCP** | `drive_read_file` reads content only. Use Google Drive for desktop sync, or a browser download |
| **Contract register isn't auto-generated** | The workbook's "Terugkerend" tab is the input, and the agent writes the overview markdown by hand |
| **Yearly calendar isn't automated** | `docs/09` lists it. Create the calendar entries once via Mail MCP's calendar tools |

## Platform limits

- **macOS only** for OCR (Apple Vision) and transcription (MLX Whisper on Apple Silicon). On Windows or Linux, use
  `ocrmypdf` with the Dutch Tesseract model (`tesseract-lang`) and `faster-whisper` instead, but the tool scripts
  would need adapting.
- **Encryption at rest** depends on the machine. Turn on FileVault, and use encrypted volumes on the NAS.
- **No read-only access** for helpers via a bare git repo over SSH. Every key holder can read and write everything.

## Deliberately left out

- **No sending of mail or forms.** A human always sends. This is a design decision, not a gap.
- **No cloud document AI** (no uploading documents to OCR or summarisation services).
- **The original's Amazon order-history export** (a browser script) isn't included. It was specific to one account
  and fragile.
- **No personal data.** The template has placeholders only, and the test fixtures are invented (`NL00…` IBANs,
  "Voorbeeld …" companies).
