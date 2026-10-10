import express, { type Request, type Response, type Router } from 'express';
import { GOOGLE_DATA_SCOPES, GOOGLE_LOGIN_SCOPES, GOOGLE_REDIRECT_PATH, type Config } from '../config.js';
import { type McpOAuthProvider, type PendingAuthorization } from '../auth/mcpProvider.js';
import { checkCsrf, clearSession, csrfToken, sessionEmail, setSession } from '../auth/session.js';
import { randomToken } from '../crypto.js';
import { getPending, putPending, takePending, type Db } from '../db.js';
import type { AccountStore } from '../google/accounts.js';
import { errorMessage } from '../util.js';
import { accountsPage, consentPage, landingPage, messagePage, privacyPage, termsPage } from './pages.js';

const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;

interface LoginState {
  next: string;
}
interface ConnectState {
  owner: string;
  alias?: string;
}

// Only allow same-origin relative redirects after login.
function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/accounts';
}

export function webRoutes(config: Config, db: Db, accounts: AccountStore, provider: McpOAuthProvider): Router {
  const router = express.Router();
  const secure = config.PUBLIC_URL.startsWith('https://');
  const form = express.urlencoded({ extended: false, limit: '16kb' });

  const isOwner = (email: string) => config.OWNER_EMAILS.includes(email.toLowerCase());

  function requireOwner(req: Request, res: Response): string | undefined {
    const email = sessionEmail(req, config.SESSION_SECRET);
    if (email && isOwner(email)) return email;
    res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    return undefined;
  }

  const contact = config.CONTACT_EMAIL ?? config.OWNER_EMAILS[0]!;
  router.get('/', (_req, res) => res.send(landingPage(`${config.PUBLIC_URL}/mcp`)));
  router.get('/privacy', (_req, res) => res.send(privacyPage(contact)));
  router.get('/terms', (_req, res) => res.send(termsPage(contact)));

  router.get('/login', (req, res) => {
    const state = randomToken(24);
    putPending(db, state, 'google-login', { next: safeNext(req.query.next) } satisfies LoginState, GOOGLE_STATE_TTL_MS);
    const url = accounts.newOAuthClient().generateAuthUrl({
      scope: GOOGLE_LOGIN_SCOPES,
      state,
      prompt: 'select_account',
    });
    res.redirect(url);
  });

  router.get('/logout', (_req, res) => {
    clearSession(res);
    res.send(messagePage('Signed out', 'You have been signed out.'));
  });

  router.get(GOOGLE_REDIRECT_PATH, async (req, res) => {
    const state = String(req.query.state ?? '');
    const code = String(req.query.code ?? '');
    if (req.query.error) {
      res.status(400).send(messagePage('Google sign-in failed', String(req.query.error)));
      return;
    }
    const login = takePending<LoginState>(db, state, 'google-login');
    const connect = login ? undefined : takePending<ConnectState>(db, state, 'google-connect');
    if (!login && !connect) {
      res.status(400).send(messagePage('Expired', 'This sign-in link has expired. Please start again.'));
      return;
    }
    try {
      const client = accounts.newOAuthClient();
      const { tokens } = await client.getToken(code);
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token ?? '', audience: config.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      const email = payload?.email?.toLowerCase();
      if (!email || !payload?.email_verified) throw new Error('Google did not return a verified email address');

      if (login) {
        if (!isOwner(email)) {
          res.status(403).send(messagePage('Not allowed', `${email} is not allowed to administer this server.`));
          return;
        }
        setSession(res, email, config.SESSION_SECRET, secure);
        res.redirect(login.next);
        return;
      }

      // Connecting a data account: the owner session must still be the one that started it.
      if (sessionEmail(req, config.SESSION_SECRET) !== connect!.owner) {
        res.status(403).send(messagePage('Not allowed', 'Owner session missing or changed. Please sign in again.'));
        return;
      }
      if (!tokens.refresh_token) {
        throw new Error('Google did not return a refresh token. Remove mailmcp at myaccount.google.com/permissions and retry.');
      }
      const granted = (tokens.scope ?? '').split(' ');
      const missing = GOOGLE_DATA_SCOPES.filter((s) => s.startsWith('https://') && !granted.includes(s));
      accounts.upsert(email, tokens.refresh_token, granted, connect!.alias);
      const note = missing.length ? ` Missing permissions: ${missing.map((s) => s.split('/').pop()).join(', ')}.` : '';
      res.redirect(`/accounts?flash=${encodeURIComponent(`Connected ${email}.${note}`)}`);
    } catch (err) {
      res.status(400).send(messagePage('Google sign-in failed', errorMessage(err)));
    }
  });

  router.get('/accounts', (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    res.send(
      accountsPage({
        owner,
        accounts: accounts.list(),
        csrf: csrfToken(owner, 'accounts', config.SESSION_SECRET),
        mcpUrl: `${config.PUBLIC_URL}/mcp`,
        flash: typeof req.query.flash === 'string' ? req.query.flash : undefined,
      }),
    );
  });

  router.post('/accounts/connect', form, (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    if (!checkCsrf(owner, 'accounts', req.body.csrf, config.SESSION_SECRET)) {
      res.status(403).send(messagePage('Forbidden', 'Invalid form token.'));
      return;
    }
    const alias = String(req.body.alias ?? '').trim().toLowerCase() || undefined;
    const hint = String(req.body.email ?? '').trim() || undefined;
    const state = randomToken(24);
    putPending(db, state, 'google-connect', { owner, alias } satisfies ConnectState, GOOGLE_STATE_TTL_MS);
    const url = accounts.newOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: GOOGLE_DATA_SCOPES,
      include_granted_scopes: true,
      login_hint: hint,
      state,
    });
    res.redirect(url);
  });

  router.post('/accounts/alias', form, (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    if (!checkCsrf(owner, 'accounts', req.body.csrf, config.SESSION_SECRET)) {
      res.status(403).send(messagePage('Forbidden', 'Invalid form token.'));
      return;
    }
    try {
      accounts.setAlias(String(req.body.email), String(req.body.alias ?? ''));
      res.redirect('/accounts?flash=' + encodeURIComponent('Alias saved.'));
    } catch (err) {
      res.redirect('/accounts?flash=' + encodeURIComponent(errorMessage(err)));
    }
  });

  router.post('/accounts/remove', form, async (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    if (!checkCsrf(owner, 'accounts', req.body.csrf, config.SESSION_SECRET)) {
      res.status(403).send(messagePage('Forbidden', 'Invalid form token.'));
      return;
    }
    const email = String(req.body.email);
    try {
      // Best effort: revoke the grant at Google too.
      const acc = accounts.list().find((a) => a.email === email);
      if (acc?.status === 'ok') {
        const client = accounts.auth(acc);
        await client.revokeToken(client.credentials.refresh_token!).catch(() => undefined);
      }
    } finally {
      accounts.remove(email);
    }
    res.redirect('/accounts?flash=' + encodeURIComponent(`Removed ${email}.`));
  });

  // ── MCP OAuth consent ───────────────────────────────────────────────
  router.get('/consent', (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const id = String(req.query.id ?? '');
    const pending = getPending<PendingAuthorization>(db, id, 'mcp-auth');
    if (!pending) {
      res.status(400).send(messagePage('Expired', 'This authorization request has expired. Start the connection again.'));
      return;
    }
    res.send(
      consentPage({
        owner,
        clientName: pending.clientName ?? pending.clientId,
        redirectUri: pending.redirectUri,
        id,
        csrf: csrfToken(owner, `consent:${id}`, config.SESSION_SECRET),
      }),
    );
  });

  router.post('/consent', form, (req, res) => {
    const owner = requireOwner(req, res);
    if (!owner) return;
    const id = String(req.body.id ?? '');
    if (!checkCsrf(owner, `consent:${id}`, req.body.csrf, config.SESSION_SECRET)) {
      res.status(403).send(messagePage('Forbidden', 'Invalid form token.'));
      return;
    }
    const pending = takePending<PendingAuthorization>(db, id, 'mcp-auth');
    if (!pending) {
      res.status(400).send(messagePage('Expired', 'This authorization request has expired.'));
      return;
    }
    const target = new URL(pending.redirectUri);
    if (req.body.decision === 'approve') {
      target.searchParams.set('code', provider.issueCode(pending, owner));
    } else {
      target.searchParams.set('error', 'access_denied');
    }
    if (pending.state) target.searchParams.set('state', pending.state);
    res.redirect(target.href);
  });

  return router;
}
