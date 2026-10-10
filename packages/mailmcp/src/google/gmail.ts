import { google, type Auth, type gmail_v1 } from 'googleapis';
import { compact, mapLimit } from '../util.js';
import { extractText, type ExtractedContent } from './extract.js';
import {
  bareEmail,
  buildMime,
  decodeEntities,
  findPart,
  header,
  parseMessage,
  replySubject,
  splitAddresses,
} from './mime.js';

const gm = (auth: Auth.OAuth2Client) => google.gmail({ version: 'v1', auth });

export interface MessageSummary {
  id: string;
  threadId: string;
  date: string | null;
  internalDate: number;
  from: string | null;
  to: string | null;
  subject: string | null;
  snippet: string;
  labelIds?: string[];
  unread: boolean;
  hasAttachments: boolean;
}

function summarize(m: gmail_v1.Schema$Message): MessageSummary {
  const p = m.payload;
  const labels = m.labelIds ?? [];
  return {
    id: m.id ?? '',
    threadId: m.threadId ?? '',
    date: header(p, 'Date'),
    internalDate: Number(m.internalDate ?? 0),
    from: header(p, 'From'),
    to: header(p, 'To'),
    subject: header(p, 'Subject'),
    snippet: decodeEntities(m.snippet ?? ''),
    labelIds: labels.filter((l) => !['UNREAD', 'CATEGORY_UPDATES', 'CATEGORY_PERSONAL'].includes(l)),
    unread: labels.includes('UNREAD'),
    hasAttachments: (p?.parts ?? []).some((x) => !!x.filename) || /multipart\/mixed/i.test(p?.mimeType ?? ''),
  };
}

export async function searchMessages(
  auth: Auth.OAuth2Client,
  query: string,
  maxResults: number,
  pageToken?: string,
): Promise<{ messages: MessageSummary[]; nextPageToken?: string; resultSizeEstimate?: number }> {
  const api = gm(auth);
  const list = await api.users.messages.list({ userId: 'me', q: query, maxResults, pageToken });
  const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  const messages = await mapLimit(ids, 10, async (id) => {
    const res = await api.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });
    return summarize(res.data);
  });
  return {
    messages,
    nextPageToken: list.data.nextPageToken ?? undefined,
    resultSizeEstimate: list.data.resultSizeEstimate ?? undefined,
  };
}

export async function getThread(auth: Auth.OAuth2Client, threadId: string, maxBodyChars: number) {
  const res = await gm(auth).users.threads.get({ userId: 'me', id: threadId, format: 'full' });
  const messages = (res.data.messages ?? []).map((m) => compact({ ...parseMessage(m, maxBodyChars) }));
  return { threadId, messageCount: messages.length, messages };
}

export async function getMessage(auth: Auth.OAuth2Client, messageId: string, maxBodyChars: number) {
  const res = await gm(auth).users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  return compact({ ...parseMessage(res.data, maxBodyChars) });
}

export async function listLabels(auth: Auth.OAuth2Client) {
  const res = await gm(auth).users.labels.list({ userId: 'me' });
  return (res.data.labels ?? [])
    .map((l) => ({ id: l.id, name: l.name, type: l.type }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

export async function getAttachment(
  auth: Auth.OAuth2Client,
  messageId: string,
  partId: string,
  maxChars: number,
): Promise<{ filename: string; mimeType: string; size: number; content: ExtractedContent }> {
  const api = gm(auth);
  const msg = await api.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  const part = findPart(msg.data.payload, partId);
  if (!part) throw new Error(`No part ${partId} in message ${messageId}`);
  let data = part.body?.data ?? '';
  if (!data && part.body?.attachmentId) {
    const att = await api.users.messages.attachments.get({ userId: 'me', messageId, id: part.body.attachmentId });
    data = att.data.data ?? '';
  }
  const buf = Buffer.from(data, 'base64url');
  const mimeType = part.mimeType ?? 'application/octet-stream';
  const filename = part.filename ?? 'attachment';
  return { filename, mimeType, size: buf.length, content: await extractText(buf, mimeType, filename, maxChars) };
}

export async function listDrafts(auth: Auth.OAuth2Client, maxResults: number, pageToken?: string) {
  const api = gm(auth);
  const list = await api.users.drafts.list({ userId: 'me', maxResults, pageToken });
  const drafts = await mapLimit(list.data.drafts ?? [], 10, async (d) => {
    const res = await api.users.drafts.get({ userId: 'me', id: d.id!, format: 'metadata' });
    const m = res.data.message ?? {};
    return {
      draftId: d.id,
      messageId: m.id,
      threadId: m.threadId,
      to: header(m.payload, 'To'),
      subject: header(m.payload, 'Subject'),
      snippet: decodeEntities(m.snippet ?? ''),
    };
  });
  return { drafts, nextPageToken: list.data.nextPageToken ?? undefined };
}

export interface DraftInput {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
  replyToMessageId?: string;
  replyAll?: boolean;
}

interface ReplyContext {
  threadId: string;
  inReplyTo?: string;
  references?: string;
  subject: string;
  to: string;
  cc?: string;
}

async function replyContext(
  api: gmail_v1.Gmail,
  self: string,
  messageId: string,
  replyAll: boolean,
): Promise<ReplyContext> {
  const res = await api.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['Message-ID', 'References', 'Subject', 'From', 'Reply-To', 'To', 'Cc'],
  });
  const p = res.data.payload;
  const msgId = header(p, 'Message-ID') ?? undefined;
  const refs = [header(p, 'References'), msgId].filter(Boolean).join(' ') || undefined;
  const from = header(p, 'From') ?? '';
  const sentBySelf = bareEmail(from) === self;
  // Replying to our own message goes to its original recipients.
  const primary = sentBySelf ? (header(p, 'To') ?? '') : (header(p, 'Reply-To') ?? from);
  let cc: string | undefined;
  if (replyAll) {
    const taken = new Set([self, ...splitAddresses(primary).map(bareEmail)]);
    const others = [...splitAddresses(sentBySelf ? '' : (header(p, 'To') ?? '')), ...splitAddresses(header(p, 'Cc') ?? '')]
      .filter((a) => {
        const e = bareEmail(a);
        if (taken.has(e)) return false;
        taken.add(e);
        return true;
      });
    cc = others.join(', ') || undefined;
  }
  return {
    threadId: res.data.threadId ?? '',
    inReplyTo: msgId,
    references: refs,
    subject: replySubject(header(p, 'Subject')),
    to: primary,
    cc,
  };
}

function toRaw(mime: string): string {
  return Buffer.from(mime, 'utf8').toString('base64url');
}

export async function createDraft(auth: Auth.OAuth2Client, self: string, input: DraftInput) {
  const api = gm(auth);
  const ctx = input.replyToMessageId
    ? await replyContext(api, self, input.replyToMessageId, input.replyAll ?? false)
    : undefined;
  const to = input.to ?? ctx?.to;
  if (!to && !input.cc && !input.bcc && !ctx) throw new Error('Provide at least one recipient (to/cc/bcc)');
  const mime = buildMime({
    from: self,
    to,
    cc: input.cc ?? ctx?.cc,
    bcc: input.bcc,
    subject: input.subject ?? ctx?.subject ?? '',
    text: input.body ?? '',
    html: input.htmlBody,
    inReplyTo: ctx?.inReplyTo,
    references: ctx?.references,
  });
  const res = await api.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw: toRaw(mime), threadId: ctx?.threadId } },
  });
  return { draftId: res.data.id, messageId: res.data.message?.id, threadId: res.data.message?.threadId, to, subject: input.subject ?? ctx?.subject };
}

export async function updateDraft(auth: Auth.OAuth2Client, self: string, draftId: string, input: DraftInput) {
  const api = gm(auth);
  const existing = await api.users.drafts.get({ userId: 'me', id: draftId, format: 'full' });
  const m = existing.data.message ?? {};
  const parsed = parseMessage(m, Number.MAX_SAFE_INTEGER);
  const p = m.payload;
  const mime = buildMime({
    from: self,
    to: input.to ?? header(p, 'To') ?? undefined,
    cc: input.cc ?? header(p, 'Cc') ?? undefined,
    bcc: input.bcc ?? header(p, 'Bcc') ?? undefined,
    subject: input.subject ?? header(p, 'Subject') ?? '',
    text: input.body ?? parsed.body,
    html: input.htmlBody,
    inReplyTo: header(p, 'In-Reply-To') ?? undefined,
    references: header(p, 'References') ?? undefined,
  });
  const res = await api.users.drafts.update({
    userId: 'me',
    id: draftId,
    requestBody: { id: draftId, message: { raw: toRaw(mime), threadId: m.threadId } },
  });
  return { draftId: res.data.id, messageId: res.data.message?.id, threadId: res.data.message?.threadId };
}
