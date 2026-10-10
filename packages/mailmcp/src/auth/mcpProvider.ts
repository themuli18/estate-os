import type { Response } from 'express';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import { InvalidGrantError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type { OAuthClientInformationFull, OAuthTokenRevocationRequest, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import { randomToken, sha256 } from '../crypto.js';
import { putPending, type Db } from '../db.js';

const ACCESS_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;
export const CONSENT_TTL_MS = 10 * 60 * 1000;
export const SCOPE = 'mailmcp';

// A pending authorization request, waiting for the owner to sign in and approve.
export interface PendingAuthorization {
  clientId: string;
  clientName?: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scopes: string[];
  resource?: string;
}

interface CodeData {
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource?: string;
  owner: string;
}

interface TokenData {
  scopes: string[];
  resource?: string;
  owner: string;
}

class ClientsStore implements OAuthRegisteredClientsStore {
  constructor(private readonly db: Db) {}

  getClient(clientId: string): OAuthClientInformationFull | undefined {
    const row = this.db.prepare('SELECT data FROM oauth_clients WHERE client_id = ?').get(clientId) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as OAuthClientInformationFull) : undefined;
  }

  registerClient(client: OAuthClientInformationFull): OAuthClientInformationFull {
    this.db
      .prepare('INSERT INTO oauth_clients (client_id, data, created_at) VALUES (?, ?, ?)')
      .run(client.client_id, JSON.stringify(client), Date.now());
    return client;
  }
}

export class McpOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: ClientsStore;

  constructor(
    private readonly db: Db,
    private readonly publicUrl: string,
  ) {
    this.clientsStore = new ClientsStore(db);
  }

  // Park the request and send the browser to the consent page (which requires owner sign-in).
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const id = randomToken(24);
    const pending: PendingAuthorization = {
      clientId: client.client_id,
      clientName: client.client_name,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      state: params.state,
      scopes: params.scopes?.length ? params.scopes : [SCOPE],
      resource: params.resource?.href,
    };
    putPending(this.db, id, 'mcp-auth', pending, CONSENT_TTL_MS);
    res.redirect(`${this.publicUrl}/consent?id=${encodeURIComponent(id)}`);
  }

  // Called by the consent page after the owner approved.
  issueCode(pending: PendingAuthorization, owner: string): string {
    const code = randomToken(32);
    const data: CodeData = {
      redirectUri: pending.redirectUri,
      codeChallenge: pending.codeChallenge,
      scopes: pending.scopes,
      resource: pending.resource,
      owner,
    };
    this.db
      .prepare('INSERT INTO auth_codes (code_hash, client_id, data, expires_at) VALUES (?, ?, ?, ?)')
      .run(sha256(code), pending.clientId, JSON.stringify(data), Date.now() + CODE_TTL_MS);
    return code;
  }

  private loadCode(client: OAuthClientInformationFull, code: string): CodeData {
    const row = this.db
      .prepare('SELECT client_id, data, expires_at FROM auth_codes WHERE code_hash = ?')
      .get(sha256(code)) as { client_id: string; data: string; expires_at: number } | undefined;
    if (!row || row.expires_at < Date.now() || row.client_id !== client.client_id) {
      throw new InvalidGrantError('Invalid or expired authorization code');
    }
    return JSON.parse(row.data) as CodeData;
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    return this.loadCode(client, authorizationCode).codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    const data = this.loadCode(client, authorizationCode);
    this.db.prepare('DELETE FROM auth_codes WHERE code_hash = ?').run(sha256(authorizationCode));
    if (redirectUri && redirectUri !== data.redirectUri) throw new InvalidGrantError('redirect_uri mismatch');
    return this.issueTokens(client.client_id, { scopes: data.scopes, resource: data.resource, owner: data.owner });
  }

  async exchangeRefreshToken(client: OAuthClientInformationFull, refreshToken: string, scopes?: string[]): Promise<OAuthTokens> {
    const row = this.db
      .prepare(`SELECT client_id, data, expires_at FROM tokens WHERE token_hash = ? AND kind = 'refresh'`)
      .get(sha256(refreshToken)) as { client_id: string; data: string; expires_at: number } | undefined;
    if (!row || row.expires_at < Date.now() || row.client_id !== client.client_id) {
      throw new InvalidGrantError('Invalid or expired refresh token');
    }
    const data = JSON.parse(row.data) as TokenData;
    if (scopes?.some((s) => !data.scopes.includes(s))) throw new InvalidGrantError('Requested scope exceeds grant');
    // Rotate refresh tokens on every use.
    this.db.prepare('DELETE FROM tokens WHERE token_hash = ?').run(sha256(refreshToken));
    return this.issueTokens(client.client_id, { ...data, scopes: scopes?.length ? scopes : data.scopes });
  }

  private issueTokens(clientId: string, data: TokenData): OAuthTokens {
    const access = randomToken(32);
    const refresh = randomToken(32);
    const insert = this.db.prepare('INSERT INTO tokens (token_hash, kind, client_id, data, expires_at) VALUES (?, ?, ?, ?, ?)');
    insert.run(sha256(access), 'access', clientId, JSON.stringify(data), Date.now() + ACCESS_TTL_MS);
    insert.run(sha256(refresh), 'refresh', clientId, JSON.stringify(data), Date.now() + REFRESH_TTL_MS);
    return {
      access_token: access,
      token_type: 'bearer',
      expires_in: ACCESS_TTL_MS / 1000,
      refresh_token: refresh,
      scope: data.scopes.join(' '),
    };
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const row = this.db
      .prepare(`SELECT client_id, data, expires_at FROM tokens WHERE token_hash = ? AND kind = 'access'`)
      .get(sha256(token)) as { client_id: string; data: string; expires_at: number } | undefined;
    if (!row || row.expires_at < Date.now()) throw new InvalidTokenError('Invalid or expired access token');
    const data = JSON.parse(row.data) as TokenData;
    return {
      token,
      clientId: row.client_id,
      scopes: data.scopes,
      expiresAt: Math.floor(row.expires_at / 1000),
      resource: data.resource ? new URL(data.resource) : undefined,
      extra: { owner: data.owner },
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    this.db.prepare('DELETE FROM tokens WHERE token_hash = ? AND client_id = ?').run(sha256(request.token), client.client_id);
  }
}
