import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Auth } from 'googleapis';
import { z } from 'zod';
import { isRevokedError, type Account, type AccountStore } from '../google/accounts.js';
import * as calendar from '../google/calendar.js';
import * as drive from '../google/drive.js';
import type { ExtractedContent } from '../google/extract.js';
import * as gmail from '../google/gmail.js';
import { errorMessage } from '../util.js';

const VERSION = '0.1.0';

const accountOne = z.string().describe('Account email or alias (see list_accounts).');
const accountMany = z.string().describe('Account email or alias, or "all" to query every connected account.');

const READ = { readOnlyHint: true, openWorldHint: true } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: true } as const;

function json(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 1) }] };
}

function fail(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function contentResult(meta: Record<string, unknown>, content: ExtractedContent): CallToolResult {
  if (content.kind === 'image') {
    return { content: [{ type: 'text', text: JSON.stringify(meta) }, { type: 'image', data: content.data, mimeType: content.mimeType }] };
  }
  if (content.kind === 'unsupported') return json({ ...meta, note: content.note });
  const { text, ...rest } = content;
  return { content: [{ type: 'text', text: JSON.stringify({ ...meta, ...rest, kind: undefined }) }, { type: 'text', text }] };
}

export function createMcpServer(accounts: AccountStore): McpServer {
  const server = new McpServer(
    { name: 'mailmcp', version: VERSION },
    {
      instructions:
        'Access to several Google accounts (Gmail, Calendar, Drive). Call list_accounts first to see which accounts ' +
        'exist; every tool takes an `account` (email or alias), and search/list tools accept "all". Mail can only be ' +
        'drafted, never sent: create a draft and tell the user to review and send it in Gmail.',
    },
  );

  // Run fn for a single account, flagging accounts whose token was revoked.
  async function withAccount<T>(account: Account, fn: (auth: Auth.OAuth2Client) => Promise<T>): Promise<T> {
    try {
      return await fn(accounts.auth(account));
    } catch (err) {
      if (isRevokedError(err)) accounts.markNeedsReconnect(account.email, errorMessage(err));
      throw err;
    }
  }

  async function one(ref: string, fn: (auth: Auth.OAuth2Client, account: Account) => Promise<unknown>): Promise<CallToolResult> {
    try {
      const account = accounts.resolve(ref);
      return json(await withAccount(account, (auth) => fn(auth, account)));
    } catch (err) {
      return fail(errorMessage(err));
    }
  }

  // Fan out over one or all accounts; per-account failures are reported, not fatal.
  async function many<T>(
    ref: string,
    fn: (auth: Auth.OAuth2Client, account: Account) => Promise<T>,
  ): Promise<{ ok: { account: string; value: T }[]; errors: { account: string; error: string }[] } | CallToolResult> {
    let list: Account[];
    try {
      list = accounts.resolveMany(ref);
    } catch (err) {
      return fail(errorMessage(err));
    }
    const settled = await Promise.allSettled(list.map((a) => withAccount(a, (auth) => fn(auth, a))));
    const ok: { account: string; value: T }[] = [];
    const errors: { account: string; error: string }[] = [];
    settled.forEach((r, i) => {
      const account = list[i]!.email;
      if (r.status === 'fulfilled') ok.push({ account, value: r.value });
      else errors.push({ account, error: errorMessage(r.reason) });
    });
    if (ok.length === 0 && errors.length > 0) return fail(errors.map((e) => `${e.account}: ${e.error}`).join('\n'));
    return { ok, errors };
  }

  const isResult = (x: unknown): x is CallToolResult => typeof x === 'object' && x !== null && 'content' in x;

  // ── Accounts ──────────────────────────────────────────────────────────
  server.registerTool(
    'list_accounts',
    { title: 'List connected Google accounts', description: 'List connected Google accounts with alias and health.', annotations: READ },
    async () =>
      json(
        accounts.list().map((a) => ({
          email: a.email,
          alias: a.alias,
          status: a.status,
          ...(a.lastError ? { lastError: a.lastError } : {}),
        })),
      ),
  );

  // ── Gmail ─────────────────────────────────────────────────────────────
  server.registerTool(
    'gmail_search',
    {
      title: 'Search Gmail',
      description:
        'Search messages using Gmail search syntax (e.g. "from:bob newer_than:7d has:attachment", "in:inbox is:unread"). ' +
        'With account="all" results from every account are merged newest-first; pageToken only works for a single account.',
      inputSchema: {
        account: accountMany,
        query: z.string().describe('Gmail search query.'),
        maxResults: z.number().int().min(1).max(100).default(20).describe('Max results per account.'),
        pageToken: z.string().optional(),
      },
      annotations: READ,
    },
    async ({ account, query, maxResults, pageToken }) => {
      const r = await many(account, (auth) => gmail.searchMessages(auth, query, maxResults, pageToken));
      if (isResult(r)) return r;
      const messages = r.ok
        .flatMap(({ account, value }) => value.messages.map((m) => ({ account, ...m })))
        .sort((a, b) => b.internalDate - a.internalDate)
        .map(({ internalDate: _drop, ...m }) => m);
      const nextPageTokens = Object.fromEntries(r.ok.filter((x) => x.value.nextPageToken).map((x) => [x.account, x.value.nextPageToken]));
      return json({ messages, nextPageTokens, errors: r.errors.length ? r.errors : undefined });
    },
  );

  server.registerTool(
    'gmail_get_thread',
    {
      title: 'Get Gmail thread',
      description: 'Get all messages in a thread with decoded plain-text bodies and attachment list.',
      inputSchema: {
        account: accountOne,
        threadId: z.string(),
        maxBodyChars: z.number().int().min(200).max(100000).default(8000).describe('Per-message body limit.'),
      },
      annotations: READ,
    },
    async ({ account, threadId, maxBodyChars }) => one(account, (auth) => gmail.getThread(auth, threadId, maxBodyChars)),
  );

  server.registerTool(
    'gmail_get_message',
    {
      title: 'Get Gmail message',
      description: 'Get one message with decoded plain-text body and attachment list.',
      inputSchema: {
        account: accountOne,
        messageId: z.string(),
        maxBodyChars: z.number().int().min(200).max(200000).default(20000),
      },
      annotations: READ,
    },
    async ({ account, messageId, maxBodyChars }) => one(account, (auth) => gmail.getMessage(auth, messageId, maxBodyChars)),
  );

  server.registerTool(
    'gmail_list_labels',
    { title: 'List Gmail labels', description: 'List labels (system and user) for an account.', inputSchema: { account: accountOne }, annotations: READ },
    async ({ account }) => one(account, (auth) => gmail.listLabels(auth)),
  );

  server.registerTool(
    'gmail_get_attachment',
    {
      title: 'Read Gmail attachment',
      description:
        'Read an attachment by message id and partId (from gmail_get_message/thread). Text, CSV, HTML and PDF are ' +
        'returned as text; images as image content; other types return metadata only.',
      inputSchema: {
        account: accountOne,
        messageId: z.string(),
        partId: z.string(),
        maxChars: z.number().int().min(500).max(500000).default(50000),
      },
      annotations: READ,
    },
    async ({ account, messageId, partId, maxChars }) => {
      try {
        const acc = accounts.resolve(account);
        const r = await withAccount(acc, (auth) => gmail.getAttachment(auth, messageId, partId, maxChars));
        return contentResult({ filename: r.filename, mimeType: r.mimeType, size: r.size }, r.content);
      } catch (err) {
        return fail(errorMessage(err));
      }
    },
  );

  server.registerTool(
    'gmail_list_drafts',
    {
      title: 'List Gmail drafts',
      description: 'List drafts in an account.',
      inputSchema: { account: accountOne, maxResults: z.number().int().min(1).max(100).default(20), pageToken: z.string().optional() },
      annotations: READ,
    },
    async ({ account, maxResults, pageToken }) => one(account, (auth) => gmail.listDrafts(auth, maxResults, pageToken)),
  );

  const draftFields = {
    to: z.string().optional().describe('Comma-separated recipients, e.g. "Ann <ann@x.com>, bob@y.com".'),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional().describe('Plain-text body.'),
    htmlBody: z.string().optional().describe('Optional HTML alternative body.'),
  };

  server.registerTool(
    'gmail_create_draft',
    {
      title: 'Create Gmail draft',
      description:
        'Create a draft (never sends). For a reply pass replyToMessageId: the draft is threaded and recipients/subject ' +
        'default from the original; replyAll adds the original To/Cc. The user sends it from Gmail.',
      inputSchema: {
        account: accountOne.describe('Account to draft from (becomes the From address).'),
        ...draftFields,
        replyToMessageId: z.string().optional().describe('Gmail message id being replied to.'),
        replyAll: z.boolean().default(false),
      },
      annotations: WRITE,
    },
    async ({ account, ...input }) => one(account, (auth, acc) => gmail.createDraft(auth, acc.email, input)),
  );

  server.registerTool(
    'gmail_update_draft',
    {
      title: 'Update Gmail draft',
      description: 'Replace fields of an existing draft; omitted fields keep their current value.',
      inputSchema: { account: accountOne, draftId: z.string(), ...draftFields },
      annotations: WRITE,
    },
    async ({ account, draftId, ...input }) => one(account, (auth, acc) => gmail.updateDraft(auth, acc.email, draftId, input)),
  );

  // ── Calendar ──────────────────────────────────────────────────────────
  const isoTime = z.string().describe('RFC 3339 timestamp, e.g. 2026-10-01T09:00:00+02:00.');
  const sendUpdates = z
    .enum(['none', 'all', 'externalOnly'])
    .default('none')
    .describe('Whether Google emails invitations/updates to attendees.');

  server.registerTool(
    'calendar_list_calendars',
    { title: 'List calendars', description: 'List calendars visible to an account.', inputSchema: { account: accountOne }, annotations: READ },
    async ({ account }) => one(account, (auth) => calendar.listCalendars(auth)),
  );

  server.registerTool(
    'calendar_list_events',
    {
      title: 'List calendar events',
      description:
        'List events in a time range (recurring events expanded), ordered by start. Defaults: now to 7 days ahead, ' +
        'primary calendar. With account="all" the primary calendars of every account are merged.',
      inputSchema: {
        account: accountMany,
        timeMin: isoTime.optional(),
        timeMax: isoTime.optional(),
        query: z.string().optional().describe('Free-text filter.'),
        calendarId: z.string().default('primary'),
        maxResults: z.number().int().min(1).max(250).default(50),
        pageToken: z.string().optional(),
      },
      annotations: READ,
    },
    async ({ account, timeMin, timeMax, query, calendarId, maxResults, pageToken }) => {
      const now = new Date();
      const input = {
        calendarId: account.toLowerCase() === 'all' ? 'primary' : calendarId,
        timeMin: timeMin ?? now.toISOString(),
        timeMax: timeMax ?? new Date(now.getTime() + 7 * 86400_000).toISOString(),
        query,
        maxResults,
        pageToken,
      };
      const r = await many(account, (auth) => calendar.listEvents(auth, input));
      if (isResult(r)) return r;
      const events = r.ok
        .flatMap(({ account, value }) => value.events.map((e) => ({ account, ...e })))
        .sort((a, b) => Date.parse(String(a.start)) - Date.parse(String(b.start)));
      const nextPageTokens = Object.fromEntries(r.ok.filter((x) => x.value.nextPageToken).map((x) => [x.account, x.value.nextPageToken]));
      return json({ timeMin: input.timeMin, timeMax: input.timeMax, events, nextPageTokens, errors: r.errors.length ? r.errors : undefined });
    },
  );

  server.registerTool(
    'calendar_get_event',
    {
      title: 'Get calendar event',
      description: 'Get one event with full description.',
      inputSchema: { account: accountOne, eventId: z.string(), calendarId: z.string().default('primary') },
      annotations: READ,
    },
    async ({ account, eventId, calendarId }) => one(account, (auth) => calendar.getEvent(auth, calendarId, eventId)),
  );

  const eventFields = {
    summary: z.string().optional(),
    start: z.string().optional().describe('RFC 3339 date-time, or YYYY-MM-DD for all-day.'),
    end: z.string().optional().describe('RFC 3339 date-time, or YYYY-MM-DD (exclusive) for all-day.'),
    timeZone: z.string().optional().describe('IANA zone, e.g. Europe/Berlin (used when start/end lack an offset).'),
    description: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional().describe('Attendee emails (replaces the list on update).'),
    addMeet: z.boolean().optional().describe('Attach a Google Meet link.'),
  };

  server.registerTool(
    'calendar_create_event',
    {
      title: 'Create calendar event',
      description: 'Create an event. summary, start and end are required. Invitations are not emailed unless sendUpdates is set.',
      inputSchema: { account: accountOne, calendarId: z.string().default('primary'), ...eventFields, sendUpdates },
      annotations: WRITE,
    },
    async ({ account, calendarId, sendUpdates, ...input }) =>
      one(account, (auth) => calendar.createEvent(auth, calendarId, input, sendUpdates)),
  );

  server.registerTool(
    'calendar_update_event',
    {
      title: 'Update calendar event',
      description: 'Patch an event; only provided fields change.',
      inputSchema: { account: accountOne, eventId: z.string(), calendarId: z.string().default('primary'), ...eventFields, sendUpdates },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async ({ account, eventId, calendarId, sendUpdates, ...input }) =>
      one(account, (auth) => calendar.updateEvent(auth, calendarId, eventId, input, sendUpdates)),
  );

  server.registerTool(
    'calendar_freebusy',
    {
      title: 'Free/busy across accounts',
      description: 'Busy intervals per account plus a merged list; use account="all" to find time that is free everywhere.',
      inputSchema: { account: accountMany, timeMin: isoTime, timeMax: isoTime },
      annotations: READ,
    },
    async ({ account, timeMin, timeMax }) => {
      const r = await many(account, (auth) => calendar.freeBusy(auth, timeMin, timeMax, ['primary']));
      if (isResult(r)) return r;
      return json({
        timeMin,
        timeMax,
        mergedBusy: calendar.mergeIntervals(r.ok.flatMap((x) => x.value)),
        byAccount: Object.fromEntries(r.ok.map((x) => [x.account, x.value])),
        errors: r.errors.length ? r.errors : undefined,
      });
    },
  );

  // ── Drive ─────────────────────────────────────────────────────────────
  const mergeFiles = (r: { ok: { account: string; value: { files: ReturnType<typeof drive.summarizeFile>[]; nextPageToken?: string } }[]; errors: { account: string; error: string }[] }) => {
    const files = r.ok.flatMap(({ account, value }) => value.files.map((f) => ({ account, ...f })));
    if (r.ok.length > 1) files.sort((a, b) => String(b.modifiedTime).localeCompare(String(a.modifiedTime)));
    const nextPageTokens = Object.fromEntries(r.ok.filter((x) => x.value.nextPageToken).map((x) => [x.account, x.value.nextPageToken]));
    return json({ files, nextPageTokens, errors: r.errors.length ? r.errors : undefined });
  };

  server.registerTool(
    'drive_search',
    {
      title: 'Search Drive',
      description:
        'Search files by name/content across My Drive and shared drives. Optionally filter by mimeType ' +
        '(e.g. application/vnd.google-apps.document, application/pdf) or add a raw Drive query clause.',
      inputSchema: {
        account: accountMany,
        query: z.string().optional().describe('Words to match in name or content.'),
        mimeType: z.string().optional(),
        rawQuery: z.string().optional().describe("Extra Drive v3 query clause, e.g. \"modifiedTime > '2026-01-01'\"."),
        maxResults: z.number().int().min(1).max(100).default(20),
        pageToken: z.string().optional(),
      },
      annotations: READ,
    },
    async ({ account, ...input }) => {
      const r = await many(account, (auth) => drive.searchFiles(auth, input));
      return isResult(r) ? r : mergeFiles(r);
    },
  );

  server.registerTool(
    'drive_list_recent',
    {
      title: 'Recent Drive files',
      description: 'Most recently modified files.',
      inputSchema: { account: accountMany, maxResults: z.number().int().min(1).max(100).default(20), pageToken: z.string().optional() },
      annotations: READ,
    },
    async ({ account, maxResults, pageToken }) => {
      const r = await many(account, (auth) => drive.searchFiles(auth, { maxResults, pageToken, orderBy: 'modifiedTime desc' }));
      return isResult(r) ? r : mergeFiles(r);
    },
  );

  server.registerTool(
    'drive_get_metadata',
    { title: 'Drive file metadata', description: 'Get metadata for one file.', inputSchema: { account: accountOne, fileId: z.string() }, annotations: READ },
    async ({ account, fileId }) => one(account, (auth) => drive.getMetadata(auth, fileId)),
  );

  server.registerTool(
    'drive_read_file',
    {
      title: 'Read Drive file',
      description:
        'Read file content as text: Google Docs → Markdown, Sheets → CSV (first sheet), Slides → text, PDF/text files → ' +
        'text, images as image content. Use offset to page through long files.',
      inputSchema: {
        account: accountOne,
        fileId: z.string(),
        maxChars: z.number().int().min(500).max(500000).default(50000),
        offset: z.number().int().min(0).default(0),
      },
      annotations: READ,
    },
    async ({ account, fileId, maxChars, offset }) => {
      try {
        const acc = accounts.resolve(account);
        const r = await withAccount(acc, (auth) => drive.readFile(auth, fileId, maxChars, offset));
        return contentResult({ ...r.file, offset }, r.content);
      } catch (err) {
        return fail(errorMessage(err));
      }
    },
  );

  return server;
}
