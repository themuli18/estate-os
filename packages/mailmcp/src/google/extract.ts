import { PDFParse } from 'pdf-parse';
import { htmlToText, truncate } from './mime.js';

export type ExtractedContent =
  | { kind: 'text'; text: string; truncated: boolean; totalChars: number }
  | { kind: 'image'; data: string; mimeType: string }
  | { kind: 'unsupported'; note: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TEXT_TYPES = /^(text\/|application\/(json|xml|csv|x-yaml|yaml|javascript|x-sh|sql|ld\+json))/i;
const TEXT_EXT = /\.(txt|md|csv|tsv|json|xml|ya?ml|log|ics|vcf|eml|ini|toml|sql|js|ts|py|sh)$/i;

export function sliceText(full: string, offset: number, maxChars: number): ExtractedContent {
  const t = truncate(full.slice(offset), maxChars);
  return { kind: 'text', text: t.text, truncated: t.truncated, totalChars: full.length };
}

export async function pdfToText(buf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    return (await parser.getText()).text.trim();
  } finally {
    await parser.destroy();
  }
}

export async function extractText(
  buf: Buffer,
  mimeType: string,
  filename: string,
  maxChars: number,
  offset = 0,
): Promise<ExtractedContent> {
  if (/^text\/html/i.test(mimeType)) return sliceText(htmlToText(buf.toString('utf8')), offset, maxChars);
  if (TEXT_TYPES.test(mimeType) || TEXT_EXT.test(filename)) return sliceText(buf.toString('utf8'), offset, maxChars);
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(filename)) {
    const text = await pdfToText(buf);
    if (!text) return { kind: 'unsupported', note: 'PDF contains no extractable text (probably scanned).' };
    return sliceText(text, offset, maxChars);
  }
  if (/^image\/(png|jpe?g|gif|webp)$/i.test(mimeType)) {
    if (buf.length > MAX_IMAGE_BYTES) return { kind: 'unsupported', note: `Image too large (${buf.length} bytes).` };
    return { kind: 'image', data: buf.toString('base64'), mimeType: mimeType.toLowerCase().replace('jpg', 'jpeg') };
  }
  return { kind: 'unsupported', note: `Cannot extract text from ${mimeType} (${filename}).` };
}
