import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().default(3000),
  // Public base URL as seen by clients, e.g. https://mailmcp.example.org (no trailing slash).
  PUBLIC_URL: z.url().transform((u) => u.replace(/\/+$/, '')),
  // Comma-separated Google emails allowed to sign in as owner.
  OWNER_EMAILS: z
    .string()
    .min(3)
    .transform((s) => s.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)),
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  // 32 random bytes, base64 or hex encoded. Encrypts Google refresh tokens at rest.
  TOKEN_ENC_KEY: z.string().min(32),
  // Random string used to sign the owner session cookie.
  SESSION_SECRET: z.string().min(32),
  DB_PATH: z.string().default('./data/mailmcp.db'),
  // Contact shown on the privacy policy and terms pages; defaults to the first owner.
  CONTACT_EMAIL: z.email().optional(),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return parsed.data;
}

export const GOOGLE_REDIRECT_PATH = '/google/callback';

// Scopes requested when connecting a Google account for data access.
export const GOOGLE_DATA_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Scopes requested when the owner signs in to the admin UI / MCP authorization.
export const GOOGLE_LOGIN_SCOPES = ['openid', 'email'];
