import { describe, expect, it } from 'vitest';
import {
  bareEmail,
  buildMime,
  encodeAddressList,
  extractAttachments,
  extractBody,
  parseMessage,
  replySubject,
  splitAddresses,
} from '../src/google/mime.js';

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64url');

const multipart = {
  mimeType: 'multipart/mixed',
  headers: [
    { name: 'From', value: 'Ann <ann@example.com>' },
    { name: 'Subject', value: 'Hello' },
    { name: 'Message-ID', value: '<abc@mail>' },
  ],
  parts: [
    {
      partId: '0',
      mimeType: 'multipart/alternative',
      parts: [
        { partId: '0.0', mimeType: 'text/plain', body: { data: b64('Plain body\r\nline 2') } },
        { partId: '0.1', mimeType: 'text/html', body: { data: b64('<p>HTML body</p>') } },
      ],
    },
    { partId: '1', mimeType: 'application/pdf', filename: 'invoice.pdf', body: { attachmentId: 'att1', size: 1234 } },
  ],
};

describe('MIME parsing', () => {
  it('prefers text/plain and normalises newlines', () => {
    expect(extractBody(multipart)).toBe('Plain body\nline 2');
  });

  it('falls back to HTML converted to text', () => {
    const htmlOnly = { mimeType: 'text/html', body: { data: b64('<div>Hi <b>there</b><br>next</div>') } };
    expect(extractBody(htmlOnly)).toBe('Hi there\nnext');
  });

  it('lists attachments with stable partIds', () => {
    expect(extractAttachments(multipart)).toEqual([
      { partId: '1', filename: 'invoice.pdf', mimeType: 'application/pdf', size: 1234 },
    ]);
  });

  it('parses headers and truncates long bodies', () => {
    const m = parseMessage({ id: 'm1', threadId: 't1', snippet: 'it&#39;s', payload: multipart }, 5);
    expect(m.from).toBe('Ann <ann@example.com>');
    expect(m.messageId).toBe('<abc@mail>');
    expect(m.snippet).toBe("it's");
    expect(m.bodyTruncated).toBe(true);
    expect(m.body.startsWith('Plain')).toBe(true);
  });
});

describe('addresses', () => {
  it('splits on commas outside quotes and brackets', () => {
    expect(splitAddresses('"Doe, John" <j@x.de>, b@y.com')).toEqual(['"Doe, John" <j@x.de>', 'b@y.com']);
  });
  it('extracts bare lowercased emails', () => {
    expect(bareEmail('Ann <Ann@Example.com>')).toBe('ann@example.com');
    expect(bareEmail(' bob@x.com ')).toBe('bob@x.com');
  });
  it('RFC 2047-encodes non-ASCII display names', () => {
    expect(encodeAddressList('Jörg <j@x.de>')).toBe(`=?UTF-8?B?${Buffer.from('Jörg').toString('base64')}?= <j@x.de>`);
    expect(encodeAddressList('Ann <a@x.de>')).toBe('"Ann" <a@x.de>');
  });
});

describe('buildMime', () => {
  it('builds a threaded plain-text reply', () => {
    const mime = buildMime({
      from: 'me@x.com',
      to: 'ann@example.com',
      subject: 'Grüße',
      text: 'Hallo 👋',
      inReplyTo: '<abc@mail>',
      references: '<root@mail> <abc@mail>',
    });
    expect(mime).toContain('In-Reply-To: <abc@mail>');
    expect(mime).toContain('References: <root@mail> <abc@mail>');
    expect(mime).toContain(`Subject: =?UTF-8?B?${Buffer.from('Grüße').toString('base64')}?=`);
    const body = mime.split('\r\n\r\n')[1]!;
    expect(Buffer.from(body.replace(/\r\n/g, ''), 'base64').toString('utf8')).toBe('Hallo 👋');
  });

  it('builds multipart/alternative when html is given', () => {
    const mime = buildMime({ from: 'me@x.com', to: 'a@b.c', subject: 's', text: 't', html: '<p>t</p>' });
    expect(mime).toMatch(/Content-Type: multipart\/alternative; boundary="mm_[0-9a-f]+"/);
    expect(mime).toContain('Content-Type: text/html; charset=UTF-8');
  });

  it('prefixes Re: once', () => {
    expect(replySubject('Hello')).toBe('Re: Hello');
    expect(replySubject('RE: Hello')).toBe('RE: Hello');
    expect(replySubject(null)).toBe('Re:');
  });
});
