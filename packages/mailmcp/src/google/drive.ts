import { google, type Auth, type drive_v3 } from 'googleapis';
import { compact } from '../util.js';
import { extractText, sliceText, type ExtractedContent } from './extract.js';

const drv = (auth: Auth.OAuth2Client) => google.drive({ version: 'v3', auth });

const FILE_FIELDS = 'id,name,mimeType,modifiedTime,size,webViewLink,owners(emailAddress),parents,driveId,description';
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

// Native Google formats and what we export them as.
const EXPORTS: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/markdown',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
  'application/vnd.google-apps.drawing': 'image/png',
};

export function summarizeFile(f: drive_v3.Schema$File) {
  return compact({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    size: f.size ? Number(f.size) : undefined,
    owner: f.owners?.[0]?.emailAddress,
    sharedDrive: f.driveId ?? undefined,
    webViewLink: f.webViewLink,
  });
}

export function escapeQuery(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export interface SearchInput {
  query?: string;
  rawQuery?: string;
  mimeType?: string;
  maxResults: number;
  pageToken?: string;
  orderBy?: string;
}

export function buildDriveQuery(input: Pick<SearchInput, 'query' | 'rawQuery' | 'mimeType'>): string {
  const clauses = ['trashed = false'];
  if (input.query) clauses.push(`(name contains '${escapeQuery(input.query)}' or fullText contains '${escapeQuery(input.query)}')`);
  if (input.mimeType) clauses.push(`mimeType = '${escapeQuery(input.mimeType)}'`);
  if (input.rawQuery) clauses.push(`(${input.rawQuery})`);
  return clauses.join(' and ');
}

export async function searchFiles(auth: Auth.OAuth2Client, input: SearchInput) {
  const q = buildDriveQuery(input);
  const res = await drv(auth).files.list({
    q,
    pageSize: input.maxResults,
    pageToken: input.pageToken,
    // fullText search does not support custom ordering.
    orderBy: input.query ? undefined : (input.orderBy ?? 'modifiedTime desc'),
    fields: `nextPageToken, files(${FILE_FIELDS})`,
    corpora: 'allDrives',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return { files: (res.data.files ?? []).map(summarizeFile), nextPageToken: res.data.nextPageToken ?? undefined };
}

export async function getMetadata(auth: Auth.OAuth2Client, fileId: string) {
  const res = await drv(auth).files.get({ fileId, fields: FILE_FIELDS, supportsAllDrives: true });
  return compact({ ...summarizeFile(res.data), description: res.data.description });
}

export async function readFile(
  auth: Auth.OAuth2Client,
  fileId: string,
  maxChars: number,
  offset: number,
): Promise<{ file: ReturnType<typeof summarizeFile>; content: ExtractedContent }> {
  const api = drv(auth);
  const meta = await api.files.get({ fileId, fields: FILE_FIELDS, supportsAllDrives: true });
  const file = summarizeFile(meta.data);
  const mimeType = meta.data.mimeType ?? '';
  const name = meta.data.name ?? fileId;

  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const target = EXPORTS[mimeType];
    if (!target) return { file, content: { kind: 'unsupported', note: `Cannot export ${mimeType}.` } };
    const res = await api.files.export({ fileId, mimeType: target }, { responseType: 'arraybuffer' });
    const buf = Buffer.from(res.data as ArrayBuffer);
    if (target.startsWith('image/')) return { file, content: await extractText(buf, target, name, maxChars) };
    return { file, content: sliceText(buf.toString('utf8'), offset, maxChars) };
  }

  if (Number(meta.data.size ?? 0) > MAX_DOWNLOAD_BYTES) {
    return { file, content: { kind: 'unsupported', note: `File too large to read (${meta.data.size} bytes).` } };
  }
  const res = await api.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
  return { file, content: await extractText(Buffer.from(res.data as ArrayBuffer), mimeType, name, maxChars, offset) };
}
