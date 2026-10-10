import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decrypt, encrypt, parseKey } from '../src/crypto.js';
import { signSession, verifySession } from '../src/auth/session.js';
import { mergeIntervals } from '../src/google/calendar.js';
import { buildDriveQuery } from '../src/google/drive.js';
import { AccountStore } from '../src/google/accounts.js';
import { openDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';

const env = {
  PUBLIC_URL: 'http://localhost:3000/',
  OWNER_EMAILS: 'Owner@Example.com, second@example.com',
  GOOGLE_CLIENT_ID: 'client-id-123.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'secret-123456',
  TOKEN_ENC_KEY: randomBytes(32).toString('base64'),
  SESSION_SECRET: randomBytes(32).toString('hex'),
  DB_PATH: ':memory:',
};

describe('config', () => {
  it('normalises owners and public url', () => {
    const c = loadConfig(env);
    expect(c.PUBLIC_URL).toBe('http://localhost:3000');
    expect(c.OWNER_EMAILS).toEqual(['owner@example.com', 'second@example.com']);
  });
});

describe('crypto', () => {
  it('round-trips and rejects tampering', () => {
    const key = parseKey(env.TOKEN_ENC_KEY);
    const blob = encrypt('1//refresh-token', key);
    expect(decrypt(blob, key)).toBe('1//refresh-token');
    const bad = Buffer.from(blob, 'base64');
    bad[bad.length - 1]! ^= 1;
    expect(() => decrypt(bad.toString('base64'), key)).toThrow();
  });
});

describe('session cookie', () => {
  it('verifies signature and expiry', () => {
    const v = signSession('a@b.c', 'secret', 1000);
    expect(verifySession(v, 'secret', 2000)).toBe('a@b.c');
    expect(verifySession(v, 'other', 2000)).toBeUndefined();
    expect(verifySession(v, 'secret', 1000 + 13 * 3600_000)).toBeUndefined();
    expect(verifySession(v.replace(/^./, 'x'), 'secret', 2000)).toBeUndefined();
  });
});

describe('calendar', () => {
  it('merges overlapping busy intervals', () => {
    expect(
      mergeIntervals([
        { start: '2026-10-01T10:00:00Z', end: '2026-10-01T11:00:00Z' },
        { start: '2026-10-01T09:00:00Z', end: '2026-10-01T10:30:00Z' },
        { start: '2026-10-01T12:00:00Z', end: '2026-10-01T13:00:00Z' },
      ]),
    ).toEqual([
      { start: '2026-10-01T09:00:00.000Z', end: '2026-10-01T11:00:00.000Z' },
      { start: '2026-10-01T12:00:00.000Z', end: '2026-10-01T13:00:00.000Z' },
    ]);
  });
});

describe('drive query', () => {
  it('escapes quotes', () => {
    expect(buildDriveQuery({ query: "Bob's plan" })).toBe(
      "trashed = false and (name contains 'Bob\\'s plan' or fullText contains 'Bob\\'s plan')",
    );
  });
});

describe('AccountStore', () => {
  const store = () => new AccountStore(openDb(':memory:'), loadConfig(env));

  it('resolves by email or alias and "all"', () => {
    const s = store();
    s.upsert('me@gmail.com', 'rt1', ['s'], 'personal');
    s.upsert('me@work.com', 'rt2', ['s']);
    s.setAlias('me@work.com', 'Work');
    expect(s.resolve('PERSONAL').email).toBe('me@gmail.com');
    expect(s.resolve('work').email).toBe('me@work.com');
    expect(s.resolveMany('all').map((a) => a.email)).toEqual(['me@gmail.com', 'me@work.com']);
    expect(() => s.resolve('nope')).toThrow(/personal \(me@gmail.com\)/);
  });

  it('excludes accounts needing reconnect from "all"', () => {
    const s = store();
    s.upsert('a@x.com', 'rt', ['s']);
    s.upsert('b@x.com', 'rt', ['s']);
    s.markNeedsReconnect('a@x.com', 'invalid_grant');
    expect(s.resolveMany('all').map((a) => a.email)).toEqual(['b@x.com']);
    expect(() => s.auth(s.resolve('a@x.com'))).toThrow(/reconnected/);
    s.upsert('a@x.com', 'rt-new', ['s']);
    expect(s.resolve('a@x.com').status).toBe('ok');
  });

  it('rejects reserved aliases', () => {
    const s = store();
    s.upsert('a@x.com', 'rt', ['s']);
    expect(() => s.setAlias('a@x.com', 'all')).toThrow();
  });
});

describe('pending state', () => {
  it('takePending of another kind does not consume the row', async () => {
    const { putPending, takePending } = await import('../src/db.js');
    const db = openDb(':memory:');
    putPending(db, 's1', 'google-connect', { owner: 'o' }, 60_000);
    expect(takePending(db, 's1', 'google-login')).toBeUndefined();
    expect(takePending(db, 's1', 'google-connect')).toEqual({ owner: 'o' });
    expect(takePending(db, 's1', 'google-connect')).toBeUndefined();
  });
});
