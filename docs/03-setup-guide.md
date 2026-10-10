# 3. Setup guide (human)

Expect about half a day for the base system. Scanner and Mail MCP setup are covered in
[04](04-scanning-intake.md) and [05](05-mail-monitoring.md).

## 1. Machine

- A Mac. The OCR uses Apple's Vision framework, which runs on-device and handles Dutch and German well. Apple Silicon
  is needed for local transcription with `mlx-whisper`.
- Install the base tools:

```bash
xcode-select --install                 # swiftc, for the OCR helpers
brew install git poppler python        # poppler = pdftotext, pdftoppm
brew install --cask libreoffice        # optional: recalculating generated spreadsheets
```

- Install Claude Code (see https://docs.claude.com/en/docs/claude-code) and sign in.

## 2. Create the repository

```bash
mkdir -p ~/Estate/<name> && cd ~/Estate/<name>
cp -R <path-to-estate-os>/template/. .
git init -b main
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# optional, for transcription:
.venv/bin/pip install mlx-whisper
```

**Where to put it:** in a normal folder under your home directory, **not** in `~/Downloads`, and not inside an
iCloud, Dropbox or Google Drive sync folder. Exclude it from any duplicate-file cleaner (see
[08-lessons-learned.md](08-lessons-learned.md)).

Run the tools with the venv's Python, for example `.venv/bin/python _tools/tekstlaag.py --controleer`, or activate it
with `source .venv/bin/activate`.

## 3. Fill in the template

Open `CLAUDE.md` and replace the placeholders `[OVERLEDENE]`, `[PARTNER]`, `[COÖRDINATOR]` and the §0 facts table.
Anything you don't know stays `?` and becomes a question in §9. The bootstrap agent
([AGENT_BOOTSTRAP.md](../AGENT_BOOTSTRAP.md)) does this through an interview.

## 4. Private backup remote

The data includes health records, national ID numbers, IBANs and access codes, so it should not go to a public
cloud git host. The original setup used a **bare git repository on a home NAS**, reached over **Tailscale** with
SSH keys.

### Synology NAS (as used originally)

1. DSM: install the **Git Server** package. Create a user `gituser` (group `users` only, deny all apps). In Git
   Server, allow access for `gituser`. Its shell becomes `git-shell`, so it can only run git.
2. Create a hidden shared folder `git` with no recycle bin, read/write for `gituser` and your admin user.
3. On the NAS over SSH as admin: `git init --bare /volume1/git/<name>.git` and `chown -R gituser /volume1/git/<name>.git`.
4. Keys go in `/var/services/homes/gituser/.ssh/authorized_keys` (home dir 711, `.ssh` 700, file 600, owned by
   `gituser`). Prefix each key with `no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty`. Editing this
   needs root (`sudo -i`) in a real terminal.
5. Install Tailscale on the NAS and on every helper's machine, then share the NAS with the helpers.
6. Per helper: `git remote add origin gituser@<nas-tailnet-name>:/volume1/git/<name>.git`, then `git push -u origin main`.

What to know about this setup:

- **Every key has full read and write access to everything.** A bare repo over SSH has no read-only mode. Treat
  "who has a key" as "who can see all the health and bank data", and record that list in `CLAUDE.md` §2.
- Synology's `git-shell` rejects custom `git-shell-commands`, so you can't use per-key wrappers. The commit author is
  the only attribution. Sign commits if you need stronger proof.
- To revoke access, delete that person's line from `authorized_keys`.
- A `post-receive` hook that appends date, ref and new SHA to a log file gives you a simple push audit.
- At home without Tailscale, you can push to the NAS's LAN name with
  `GIT_SSH_COMMAND="ssh -o HostKeyAlias=<tailnet-name>"` so the host key is still verified. Don't add a second remote.

### Alternatives

| Option | Fine for | Note |
|---|---|---|
| Any Linux box or NAS with SSH | same as above | `git init --bare`, a user with `git-shell` |
| Encrypted external SSD as a bare repo | a single coordinator | `git clone --bare . /Volumes/<ssd>/<name>.git`. Keep it off-site sometimes |
| Private repository on a hosted git service | only if the family accepts it | Health data then lives with a third party. Write that decision down in `CLAUDE.md` §2 |

Whatever you pick, `CLAUDE.md` §2 names the **one** allowed remote, and the assistant must never add another.

## 5. Claude Code configuration

- Open Claude Code in the repository folder. It picks up `CLAUDE.md` and `.claude/skills/` automatically.
- Connect **Mail MCP** (see [05](05-mail-monitoring.md)):
  `claude mcp add --transport http --scope user mailmcp https://<your-host>/mcp`, then `/mcp` to authenticate.
- Optional: a project `.claude/settings.json` that allowlists the read-only commands you run often (`pdftotext`,
  `git status`, the `_tools`), which cuts down on permission prompts.

## 6. First-run checklist

- [ ] `python3 _tools/controleer_archief.py` → all zeros
- [ ] `zsh _tools/ocr.sh <any scanned pdf>` prints readable Dutch text
- [ ] `.venv/bin/python _tools/tekstlaag.py --controleer` runs
- [ ] `git push` reaches the private remote, and a second helper can clone
- [ ] In Claude Code, "check de mail" lists the connected accounts
- [ ] A test scan appears in the scan inbox, and "verwerk de post" files it
