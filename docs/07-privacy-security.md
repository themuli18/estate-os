# 7. Privacy and security

## What is in the repository

National ID numbers (BSN), IBANs, card numbers, medical records, insurance and pension numbers, the home address,
access codes (SIM PIN/PUK, DigiD activation, internet credentials) and every transaction for the past years. Treat
the repository with the same care as the deceased's wallet and filing cabinet together.

## Rules (written into `CLAUDE.md` §2)

| Rule | Why |
|---|---|
| **Local processing first.** OCR (Apple Vision), transcription (local Whisper), PDF parsing (`pdftotext`) and spreadsheets all run on the Mac | No document content goes to third-party web tools |
| **Explicit connector allow-list.** Only the connectors named in `CLAUDE.md` may touch estate data (by default Mail MCP) | Prevents an assistant from "helpfully" pasting a policy into a web search or another integration |
| **Never send.** The assistant drafts, a human sends, and Mail MCP has no send tool | Nothing goes out in the family's name without a person deciding |
| **Mask in anything shareable.** IBAN `NL12 …3456`, last 4 card digits, never a BSN | Chat transcripts, LOG lines and summaries get forwarded |
| **One private remote.** Named in `CLAUDE.md`, and the assistant never adds another | Stops accidental pushes to public hosts |
| **No copies outside the folder.** Temporary extractions go to the session scratchpad and aren't kept | Stray copies in `/tmp` or Downloads are how data leaks |
| **🔒 documents never leave.** Files with codes or passwords are marked in the index | |
| **Give institutions only what they ask for.** One document, not the folder | |
| **Consent before recording calls** | Recording a conversation without consent may be unlawful. Check the rules where you live |

## Access

- Everyone with a key to the private remote can read **everything** (see the setup guide). Keep the list short and
  written down.
- Revocation: remove the key and, if needed, rotate anything sensitive that person could have copied.
- The survivor's own access (online banking, DigiD, mailbox) should be their own, with a trusted person
  **authorised** (DigiD Machtigen, bank authorisations) rather than shared passwords.

## The deceased's digital accounts

- Secure the phone and password manager early. They hold the 2FA apps and the passwords. If the phone is wiped or
  lost, many accounts become very hard to recover.
- Don't log in to government or tax portals repeatedly by trial and error. They lock accounts.
- Delete nothing until the estate is settled. Old mail and portal accounts are evidence of contracts.

## Backup hygiene

- Before each commit, run `git diff --cached --name-only --diff-filter=D`. An unexpected deletion means stop. (See
  [08](08-lessons-learned.md) for the incident that made this rule.)
- The NAS should have its own snapshot or backup schedule. Git history protects against bad commits, not against
  losing the NAS.
