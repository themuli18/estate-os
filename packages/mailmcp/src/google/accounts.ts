import { google, type Auth } from 'googleapis';
import { GOOGLE_REDIRECT_PATH, type Config } from '../config.js';
import { decrypt, encrypt, parseKey } from '../crypto.js';
import type { Db } from '../db.js';

export interface Account {
  email: string;
  alias: string | null;
  scopes: string[];
  status: 'ok' | 'needs_reconnect';
  lastError: string | null;
}

interface AccountRow {
  email: string;
  alias: string | null;
  refresh_token_enc: string;
  scopes: string;
  status: 'ok' | 'needs_reconnect';
  last_error: string | null;
}

function toAccount(row: AccountRow): Account {
  return {
    email: row.email,
    alias: row.alias,
    scopes: row.scopes.split(' ').filter(Boolean),
    status: row.status,
    lastError: row.last_error,
  };
}

export class AccountStore {
  private readonly key: Buffer;
  private readonly clients = new Map<string, Auth.OAuth2Client>();

  constructor(
    private readonly db: Db,
    private readonly config: Config,
  ) {
    this.key = parseKey(config.TOKEN_ENC_KEY);
  }

  newOAuthClient(): Auth.OAuth2Client {
    return new google.auth.OAuth2(
      this.config.GOOGLE_CLIENT_ID,
      this.config.GOOGLE_CLIENT_SECRET,
      this.config.PUBLIC_URL + GOOGLE_REDIRECT_PATH,
    );
  }

  list(): Account[] {
    const rows = this.db.prepare('SELECT * FROM accounts ORDER BY created_at').all() as unknown as AccountRow[];
    return rows.map(toAccount);
  }

  private row(email: string): AccountRow | undefined {
    return this.db.prepare('SELECT * FROM accounts WHERE email = ?').get(email) as AccountRow | undefined;
  }

  // Resolve an account reference (email or alias, case-insensitive) to one account.
  resolve(ref: string): Account {
    const needle = ref.trim().toLowerCase();
    const match = this.list().find((a) => a.email === needle || a.alias?.toLowerCase() === needle);
    if (!match) {
      const known = this.list()
        .map((a) => (a.alias ? `${a.alias} (${a.email})` : a.email))
        .join(', ');
      throw new Error(`Unknown account "${ref}". Connected accounts: ${known || 'none'}`);
    }
    return match;
  }

  // Resolve a reference that may be "all" to the list of usable accounts.
  resolveMany(ref: string): Account[] {
    if (ref.trim().toLowerCase() === 'all') {
      const ok = this.list().filter((a) => a.status === 'ok');
      if (ok.length === 0) throw new Error('No connected accounts are available.');
      return ok;
    }
    return [this.resolve(ref)];
  }

  upsert(email: string, refreshToken: string, scopes: string[], alias?: string): void {
    const now = Date.now();
    const enc = encrypt(refreshToken, this.key);
    const existing = this.row(email);
    if (existing) {
      this.db
        .prepare(
          `UPDATE accounts SET refresh_token_enc = ?, scopes = ?, status = 'ok', last_error = NULL,
             alias = COALESCE(?, alias), updated_at = ? WHERE email = ?`,
        )
        .run(enc, scopes.join(' '), alias ?? null, now, email);
    } else {
      this.db
        .prepare(
          `INSERT INTO accounts (email, alias, refresh_token_enc, scopes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'ok', ?, ?)`,
        )
        .run(email, alias ?? null, enc, scopes.join(' '), now, now);
    }
    this.clients.delete(email);
  }

  setAlias(email: string, alias: string | null): void {
    const clean = alias?.trim().toLowerCase() || null;
    if (clean && (clean === 'all' || clean.includes('@'))) throw new Error('Alias must not be "all" or contain "@"');
    this.db.prepare('UPDATE accounts SET alias = ?, updated_at = ? WHERE email = ?').run(clean, Date.now(), email);
  }

  remove(email: string): void {
    this.db.prepare('DELETE FROM accounts WHERE email = ?').run(email);
    this.clients.delete(email);
  }

  markNeedsReconnect(email: string, error: string): void {
    this.db
      .prepare(`UPDATE accounts SET status = 'needs_reconnect', last_error = ?, updated_at = ? WHERE email = ?`)
      .run(error, Date.now(), email);
    this.clients.delete(email);
  }

  // Authenticated OAuth2 client for an account; access tokens refresh automatically.
  auth(account: Account): Auth.OAuth2Client {
    const cached = this.clients.get(account.email);
    if (cached) return cached;
    const row = this.row(account.email);
    if (!row) throw new Error(`Account ${account.email} is not connected`);
    if (row.status !== 'ok') {
      throw new Error(`Account ${account.email} needs to be reconnected at ${this.config.PUBLIC_URL}/accounts`);
    }
    const client = this.newOAuthClient();
    client.setCredentials({ refresh_token: decrypt(row.refresh_token_enc, this.key) });
    client.on('tokens', (tokens) => {
      // Google occasionally rotates refresh tokens; persist the new one.
      if (tokens.refresh_token) this.upsert(account.email, tokens.refresh_token, account.scopes);
    });
    this.clients.set(account.email, client);
    return client;
  }
}

// Detect errors meaning the stored refresh token is no longer usable.
export function isRevokedError(err: unknown): boolean {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  const code = e?.response?.data?.error ?? '';
  return code === 'invalid_grant' || code === 'unauthorized_client' || /invalid_grant/.test(e?.message ?? '');
}
