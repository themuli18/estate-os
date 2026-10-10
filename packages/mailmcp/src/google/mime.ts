import { randomBytes } from 'node:crypto';
import type { gmail_v1 } from 'googleapis';
import { convert } from 'html-to-text';

type Part = gmail_v1.Schema$MessagePart;

export interface AttachmentInfo {
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ParsedMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  date: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  messageId: string | null;
  snippet: string;
  body: string;
  bodyTruncated: boolean;
  attachments: AttachmentInfo[];
}

export function header(part: Part | undefined, name: string): string | null {
  const h = part?.headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value ?? null;
}

function decodeData(data: string | null | undefined): string {
  return data ? Buffer.from(data, 'base64url').toString('utf8') : '';
}

function walk(part: Part | undefined, visit: (p: Part) => void): void {
  if (!part) return;
  visit(part);
  for (const child of part.parts ?? []) walk(child, visit);
}

export function htmlToText(html: string): string {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
  });
}

// Prefer text/plain; fall back to HTML converted to text.
export function extractBody(payload: Part | undefined): string {
  let plain = '';
  let html = '';
  walk(payload, (p) => {
    if (p.filename) return;
    if (p.mimeType === 'text/plain' && !plain) plain = decodeData(p.body?.data);
    else if (p.mimeType === 'text/html' && !html) html = decodeData(p.body?.data);
  });
  if (plain.trim()) return plain.replace(/\r\n/g, '\n').trim();
  return html ? htmlToText(html).trim() : '';
}

export function extractAttachments(payload: Part | undefined): AttachmentInfo[] {
  const out: AttachmentInfo[] = [];
  walk(payload, (p) => {
    if (p.filename && (p.body?.attachmentId || p.body?.data)) {
      out.push({
        partId: p.partId ?? '',
        filename: p.filename,
        mimeType: p.mimeType ?? 'application/octet-stream',
        size: p.body?.size ?? 0,
      });
    }
  });
  return out;
}

export function findPart(payload: Part | undefined, partId: string): Part | undefined {
  let found: Part | undefined;
  walk(payload, (p) => {
    if (!found && p.partId === partId) found = p;
  });
  return found;
}

export function truncate(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max) + '\n…[truncated]', truncated: true };
}

export function parseMessage(msg: gmail_v1.Schema$Message, maxBodyChars: number): ParsedMessage {
  const p = msg.payload;
  const body = truncate(extractBody(p), maxBodyChars);
  return {
    id: msg.id ?? '',
    threadId: msg.threadId ?? '',
    labelIds: msg.labelIds ?? [],
    date: header(p, 'Date'),
    from: header(p, 'From'),
    to: header(p, 'To'),
    cc: header(p, 'Cc'),
    subject: header(p, 'Subject'),
    messageId: header(p, 'Message-ID'),
    snippet: decodeEntities(msg.snippet ?? ''),
    body: body.text,
    bodyTruncated: body.truncated,
    attachments: extractAttachments(p),
  };
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// RFC 2047 encoded-word for non-ASCII header values.
export function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

// Encode display names in an address list ("Jörg <j@x.de>, a@b.c").
export function encodeAddressList(list: string): string {
  return splitAddresses(list)
    .map((addr) => {
      const m = addr.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
      if (!m) return addr.trim();
      const name = m[1]!.trim();
      return name ? `${encodeHeaderValue(name) === name ? `"${name}"` : encodeHeaderValue(name)} <${m[2]}>` : `<${m[2]}>`;
    })
    .join(', ');
}

// Split an address list on commas that are not inside quotes or angle brackets.
export function splitAddresses(list: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  let angle = false;
  for (const ch of list) {
    if (ch === '"') quoted = !quoted;
    else if (ch === '<') angle = true;
    else if (ch === '>') angle = false;
    if (ch === ',' && !quoted && !angle) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function bareEmail(addr: string): string {
  const m = addr.match(/<([^>]+)>/);
  return (m ? m[1]! : addr).trim().toLowerCase();
}

export interface MimeInput {
  from: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}

function base64Lines(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
}

export function buildMime(input: MimeInput): string {
  const headers: string[] = [`From: ${encodeAddressList(input.from)}`];
  if (input.to) headers.push(`To: ${encodeAddressList(input.to)}`);
  if (input.cc) headers.push(`Cc: ${encodeAddressList(input.cc)}`);
  if (input.bcc) headers.push(`Bcc: ${encodeAddressList(input.bcc)}`);
  headers.push(`Subject: ${encodeHeaderValue(input.subject)}`);
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);
  headers.push('MIME-Version: 1.0');

  const textPart = ['Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', base64Lines(input.text)];
  if (!input.html) return [...headers, ...textPart].join('\r\n');

  const boundary = `mm_${randomBytes(12).toString('hex')}`;
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    ...textPart,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lines(input.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

export function replySubject(subject: string | null): string {
  const s = subject ?? '';
  return /^\s*re:/i.test(s) ? s : `Re: ${s}`.trim();
}
