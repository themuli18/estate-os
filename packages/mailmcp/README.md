# mailmcp

A remote MCP server that gives Claude (claude.ai, Claude Desktop, mobile and Claude Code) access to **several Google
accounts at once**: Gmail, Calendar and Drive. Every tool takes an `account` (an email or an alias), and the
search/list tools also accept `"all"`.

Within Estate OS it's the connector that watches the survivor's, the deceased's and the coordinator's mailboxes
(see `docs/05-mail-monitoring.md`).

**Access policy:**
- Gmail, Calendar and Drive can all be read.
- Gmail can **only create drafts**. The server has no send tool, so people send drafts themselves from Gmail.
- Calendar events can be created and updated. Invitations are only emailed when `sendUpdates` is set.

## Tools

| Area | Tools |
|---|---|
| Accounts | `list_accounts` |
| Gmail | `gmail_search`★, `gmail_get_thread`, `gmail_get_message`, `gmail_list_labels`, `gmail_get_attachment`, `gmail_list_drafts`, `gmail_create_draft`, `gmail_update_draft` |
| Calendar | `calendar_list_calendars`, `calendar_list_events`★, `calendar_get_event`, `calendar_create_event`, `calendar_update_event`, `calendar_freebusy`★ |
| Drive | `drive_search`★, `drive_list_recent`★, `drive_get_metadata`, `drive_read_file` |

★ = accepts `account: "all"`. It runs against every account in parallel and tags each result with its account.

## How it works

```
Claude ──HTTPS──► tunnel (e.g. Cloudflare Tunnel, https://mailmcp.example.org) ──► 127.0.0.1:2310 ──► container :3000
```

There are two separate OAuth layers:

1. **Claude → mailmcp.** mailmcp is its own OAuth 2.1 authorization server (MCP SDK `mcpAuthRouter`, dynamic client
   registration, PKCE). When a client connects, you sign in with Google on `/consent` and approve it. Only emails
   listed in `OWNER_EMAILS` can do this.
2. **mailmcp → Google.** Each account is connected once at `/accounts`. Its refresh token is stored in SQLite,
   AES-256-GCM encrypted with `TOKEN_ENC_KEY`.

Main files:
- `src/server.ts`: Express app, OAuth router, stateless Streamable HTTP `/mcp` endpoint
- `src/tools/index.ts`: tool definitions and the `all` fan-out
- `src/google/*`: Gmail, Calendar and Drive calls, MIME parsing and building
- `src/auth/*`: MCP OAuth provider and the signed owner-session cookie
- `src/web/*`: admin, consent, privacy and terms pages

## One-time setup

### 1. Google Cloud
1. At https://console.cloud.google.com create a project (e.g. **mailmcp**) and enable the **Gmail API**, **Google
   Calendar API** and **Google Drive API**.
2. OAuth consent screen (Google Auth Platform → Branding / Audience):
   1. User type **External**.
   2. Scopes `gmail.readonly`, `gmail.compose`, `calendar.readonly`, `calendar.events`, `drive.readonly`, `openid`,
      `email`.
   3. **Publish the app ("In production").** In Testing mode, refresh tokens expire after 7 days.
   4. Personal use doesn't need verification. Click through the "Google hasn't verified this app" warning
      (Advanced → continue).
3. **Clients → Create client → Web application**, with the redirect URI `https://<your-host>/google/callback`
   (plus `http://localhost:3000/google/callback` for development).
4. For **Google Workspace** accounts: Admin console → Security → Access and data control → API controls → Manage
   third-party app access, and add the client ID as **Trusted**. Otherwise the Gmail and Drive scopes are blocked.

### 2. Secrets
Six variables (see `.env.example`): `PUBLIC_URL`, `OWNER_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`TOKEN_ENC_KEY`, `SESSION_SECRET`. Generate the last two with `openssl rand -hex 32`. Keep them in a password or
secrets manager and never commit a `.env`.

### 3. Tunnel
Any HTTPS tunnel or reverse proxy that forwards `https://<your-host>` to `127.0.0.1:<HOST_PORT>` works. Example for
Cloudflare Tunnel (`~/.cloudflared/config.yml`, above the `http_status:404` catch-all):

```yaml
  - hostname: mailmcp.example.org
    service: http://localhost:2310
```

then `cloudflared tunnel route dns <tunnel-id> mailmcp.example.org` and restart cloudflared.

Don't put an SSO/access proxy (such as Cloudflare Access) in front of this hostname. It breaks the OAuth flow from
claude.ai, and the server does its own authentication.

### 4. Deploy
On the Docker host, directly:

```bash
cp .env.example .env   # fill in
docker compose -p mailmcp up -d --build
curl -fsS http://127.0.0.1:2310/healthz
```

Or from your laptop over SSH with `scripts/deploy.sh` (writes `.env` over SSH stdin, pulls, rebuilds):

```bash
MAILMCP_HOST=user@docker-host MAILMCP_REPO=<git-url-of-this-repo> \
  scripts/deploy.sh ./secrets.env mailmcp-family 2311
```

**One instance per family.** Each instance has its own directory, port, database, `TOKEN_ENC_KEY`,
`SESSION_SECRET` and `OWNER_EMAILS`. Instances can share one Google OAuth client (one redirect URI per hostname).
Google tracks grants per account per client, so revoking an account in one instance revokes it everywhere that
account is connected.

### 5. Connect accounts and clients
1. Open `https://<your-host>/accounts`, sign in, and click **Connect Google account** for each mailbox. Give each one
   an alias (e.g. `partner`, `overledene`, `coordinator`).
2. **claude.ai / Desktop / mobile:** Settings → Connectors → Add custom connector → `https://<your-host>/mcp`.
3. **Claude Code:** `claude mcp add --transport http --scope user mailmcp https://<your-host>/mcp`, then `/mcp` to
   authenticate.

## Development
```bash
npm install
npm test            # unit tests
npm run typecheck
cp .env.example .env && PUBLIC_URL=http://localhost:3000 npm run dev
npx @modelcontextprotocol/inspector   # → http://localhost:3000/mcp
```

## Operations
- **Logs:** `docker compose -p <instance> logs -f` on the host.
- **Data:** everything lives in the instance's Docker volume (`<instance>_mailmcp-data`). If you lose it, reconnect
  the accounts and re-authorize the clients. Back the volume up if that would be painful.
- **Revoked accounts:** a revoked or expired Google grant shows as *needs reconnect* in `/accounts` and
  `list_accounts`. The other accounts keep working.
- **Rotating `TOKEN_ENC_KEY`** makes every stored Google token unreadable, so all accounts have to be reconnected.
