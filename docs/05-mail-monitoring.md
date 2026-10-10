# 5. Mail monitoring with Mail MCP

After a death, important mail lands in at least three mailboxes: the survivor's, the deceased's (insurers, portals
and utilities still write there) and the coordinator's. Estate OS reads all of them through a single connector and
flags whatever is urgent or important.

## What Mail MCP is

A small, self-hosted **remote MCP server** (Node/TypeScript, Docker) that gives Claude (Claude Code, claude.ai, the
desktop and mobile apps) access to **several Google accounts at once**: Gmail, Calendar and Drive.

| Area | Tools | Notes |
|---|---|---|
| Accounts | `list_accounts` | shows each account's alias and whether it needs reconnecting |
| Gmail | `gmail_search`★, `gmail_get_thread`, `gmail_get_message`, `gmail_list_labels`, `gmail_get_attachment`, `gmail_list_drafts`, `gmail_create_draft`, `gmail_update_draft` | **no send tool** |
| Calendar | `calendar_list_calendars`, `calendar_list_events`★, `calendar_get_event`, `calendar_create_event`, `calendar_update_event`, `calendar_freebusy`★ | invitations are only emailed when explicitly requested |
| Drive | `drive_search`★, `drive_list_recent`★, `drive_get_metadata`, `drive_read_file` | read-only |

★ = accepts `account: "all"`, which queries every account in parallel and tags each result with its account.

**Why self-hosted and why no send:** the family keeps control of the OAuth tokens, and the server can't send email
at all. That makes "the assistant drafts, a human sends" a technical guarantee rather than a promise.

### How it is built

```
Claude ──HTTPS──► tunnel (e.g. Cloudflare Tunnel, own hostname) ──► 127.0.0.1:<port> ──► container :3000
```

There are two OAuth layers:

1. **Claude → Mail MCP.** The server is its own OAuth 2.1 authorization server (dynamic client registration, PKCE).
   Only addresses in `OWNER_EMAILS` can approve a client.
2. **Mail MCP → Google.** Each Google account is connected once on the server's `/accounts` page. Refresh tokens
   are stored in SQLite, encrypted with AES-256-GCM (`TOKEN_ENC_KEY`).

### Setting it up for another family

The full source is in [`packages/mailmcp/`](../packages/mailmcp/) with its own README (Docker, deploy script,
tests). In short:

1. **Google Cloud.** Create a project and enable the Gmail, Calendar and Drive APIs. Set the OAuth consent screen
   to *External* with the scopes `gmail.readonly`, `gmail.compose`, `calendar.readonly`, `calendar.events`,
   `drive.readonly`, `openid` and `email`. **Publish it** ("In production"), because in Testing mode refresh tokens
   expire after 7 days. Personal use doesn't need verification; you click through the "unverified app" warning once.
   Create a *Web application* client with the redirect URI `https://<host>/google/callback`.
2. **Secrets.** `PUBLIC_URL`, `OWNER_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENC_KEY` and
   `SESSION_SECRET` (generate the last two with `openssl rand -hex 32`). Keep them in a password or secrets
   manager, not in the repo.
3. **Hosting.** Any always-on machine with Docker (a home server, a Mac mini, a NAS that runs containers, or a small
   VPS) behind an HTTPS tunnel. Don't put an extra SSO or access proxy in front of the hostname. It breaks the OAuth
   flow, and the server does its own auth.
4. **Separate instance per family.** Give each family its own database, keys and `OWNER_EMAILS`. Several instances
   can share one Google OAuth client, with one redirect URI per hostname. Revoking a Google account's grant on one
   instance revokes it on all of them.
5. **Connect accounts** at `https://<host>/accounts`. Give each one an alias that reads well in the assistant's
   reports, such as `partner`, `overledene` or `coordinator`. For the deceased's mailbox you need its password or an
   active session. Do this early, before the phone or password manager becomes inaccessible.
6. **Connect Claude.** In Claude Code:
   `claude mcp add --transport http --scope user mailmcp https://<host>/mcp`, then `/mcp` to sign in. In claude.ai
   or the desktop app: Settings → Connectors → Add custom connector.
7. Record the aliases and which mailbox belongs to whom in `CLAUDE.md` §2b.

**Simpler alternatives** if self-hosting is too much: the built-in Gmail connector in claude.ai (one account per
connection), or Gmail delegation, which gives the coordinator's account delegated access to the survivor's and the
deceased's mailboxes so a single connected account sees all three. Both lose the hard "cannot send" guarantee, so
keep the never-send rule in `CLAUDE.md`.

## The `mail-controleren` routine

Say "check de mail". The skill (`template/.claude/skills/mail-controleren/SKILL.md`):

1. **Health check.** `list_accounts`. A disconnected mailbox is reported first, because silent gaps are the real
   risk.
2. **Window.** Everything since the last sweep logged in `LOG.md`, or 7 days if there isn't one.
3. **Three queries, all accounts:**
   - recent mail outside the promotions and social categories, excluding sent mail
   - mail from every sender in `CLAUDE.md` §8 (institutions often land in "updates" or "promotions")
   - Dutch trigger words: `aanmaning`, `herinnering`, `termijn`, `uiterlijk`, `incasso`, `deurwaarder`,
     `laatste waarschuwing`, `beschikking`, `aanslag`, `akte`, `nabestaanden`
4. **Triage:**

| Class | Criteria | Action |
|---|---|---|
| **Urgent** | deadline within 14 days, arrears, debt collection, cancellation, account blocked, bank or DigiD security notice, request for a document | top of the report with a proposed action; TODO with date |
| **Important** | any institution from §8, decisions, policies, annual statements, invoices for running contracts, confirmations of open TODO items | TODO / strike-through; file the attachment |
| **Info** | tariff or terms changes from known providers | one line in LOG |
| **Ignore** | advertising, social, private correspondence | **not summarised, not logged** |

5. **Act.** Qualifying attachments are fetched with `gmail_get_attachment` and filed like scans. Replies are created
   as **drafts in the correct mailbox** with `gmail_create_draft`, and the user is told to review and send.
6. **Journal.** A LOG entry with one line per relevant message, plus "nothing new from: …" listing the institutions
   we're waiting on. That last line is valuable, because it shows what has been checked.

## Running it on a schedule

The sweep is useful daily during the estate phase and weekly afterwards. Options:

- **Interactive:** begin each session with "check de mail en verwerk de post".
- **Claude Code `/loop`** while a session is open (for example every few hours).
- **Scheduled routine:** Claude Code's `/schedule` (cloud routines), or a local `launchd`/cron job that runs
  `claude -p "Voer de skill mail-controleren uit en daarna post-verwerken"` in the repository folder. Unattended runs
  should only *write* to LOG/TODO and drafts. Have them notify the coordinator, for example with a push notification
  or a draft summary mail, rather than act.

## Privacy rules for mail

- Read-only plus drafts. Nothing is marked read, archived or deleted.
- Private messages that have nothing to do with the administration are not summarised or logged.
- Sending is always a human action. Drafts say clearly which mailbox they're in.
