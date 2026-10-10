import type { Account } from '../google/accounts.js';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · mailmcp</title>
<style>
:root{--bg:#f7f7f5;--fg:#1c1c1a;--muted:#6b6b66;--card:#fff;--line:#e3e3de;--accent:#2f6fde;--warn:#b54708;--ok:#2e7d32}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--fg:#ececea;--muted:#9a9a94;--card:#1f1f1d;--line:#34342f;--accent:#7aa7ff;--warn:#f0a35e;--ok:#7bc47f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:760px;margin:40px auto;padding:0 16px}h1{font-size:22px;margin:0 0 4px}p.sub{color:var(--muted);margin:0 0 24px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:12px}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.grow{flex:1;min-width:200px}
.email{font-weight:600}.muted{color:var(--muted);font-size:13px}.ok{color:var(--ok)}.warn{color:var(--warn)}
input[type=text],input[type=email]{padding:7px 9px;border:1px solid var(--line);border-radius:7px;background:var(--bg);color:var(--fg);font:inherit;width:160px}
button,.btn{padding:7px 14px;border-radius:7px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;cursor:pointer;text-decoration:none;display:inline-block}
button.primary,.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}button.danger{color:var(--warn)}
form{margin:0}a{color:var(--accent)}code{font-size:13px;word-break:break-all}.flash{padding:10px 14px;border-radius:8px;border:1px solid var(--line);background:var(--card);margin-bottom:16px}
.prose h2{font-size:17px;margin:28px 0 6px}.prose p,.prose li{max-width:68ch}.prose ul{padding-left:20px}
.hero{margin:24px 0 32px}.hero h1{font-size:30px;letter-spacing:-.01em}.hero p{font-size:17px;color:var(--muted);max-width:60ch}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}.grid h3{margin:0 0 4px;font-size:15px}.grid p{margin:0;color:var(--muted);font-size:14px}
footer{margin:40px 0 24px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:13px;display:flex;gap:16px;flex-wrap:wrap}
</style></head><body><main>${body}
<footer><a href="/">mailmcp</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/accounts">Admin</a></footer></main></body></html>`;
}

export function accountsPage(opts: {
  owner: string;
  accounts: Account[];
  csrf: string;
  mcpUrl: string;
  flash?: string;
}): string {
  const rows = opts.accounts
    .map(
      (a) => `<div class="card"><div class="row">
  <div class="grow"><div class="email">${esc(a.email)}</div>
    <div class="muted">${a.status === 'ok' ? '<span class="ok">● connected</span>' : `<span class="warn">● needs reconnect</span> ${esc(a.lastError ?? '')}`}</div></div>
  <form method="post" action="/accounts/alias" class="row">
    <input type="hidden" name="csrf" value="${esc(opts.csrf)}"><input type="hidden" name="email" value="${esc(a.email)}">
    <input type="text" name="alias" placeholder="alias" value="${esc(a.alias ?? '')}"><button>Save</button></form>
  <form method="post" action="/accounts/connect">
    <input type="hidden" name="csrf" value="${esc(opts.csrf)}"><input type="hidden" name="email" value="${esc(a.email)}">
    <button>Reconnect</button></form>
  <form method="post" action="/accounts/remove" onsubmit="return confirm('Remove ${esc(a.email)}?')">
    <input type="hidden" name="csrf" value="${esc(opts.csrf)}"><input type="hidden" name="email" value="${esc(a.email)}">
    <button class="danger">Remove</button></form>
</div></div>`,
    )
    .join('');
  return layout(
    'Accounts',
    `<h1>Google accounts</h1>
<p class="sub">Signed in as ${esc(opts.owner)} · <a href="/logout">sign out</a> · MCP endpoint <code>${esc(opts.mcpUrl)}</code></p>
${opts.flash ? `<div class="flash">${esc(opts.flash)}</div>` : ''}
${rows || '<p class="muted">No accounts connected yet.</p>'}
<div class="card"><form method="post" action="/accounts/connect" class="row">
  <input type="hidden" name="csrf" value="${esc(opts.csrf)}">
  <input type="email" name="email" placeholder="email (optional hint)" style="width:240px">
  <input type="text" name="alias" placeholder="alias, e.g. work">
  <button class="primary">Connect Google account</button>
</form></div>`,
  );
}

export function consentPage(opts: { owner: string; clientName: string; redirectUri: string; id: string; csrf: string }): string {
  return layout(
    'Authorize',
    `<h1>Allow access to mailmcp?</h1>
<p class="sub">Signed in as ${esc(opts.owner)}</p>
<div class="card"><p><strong>${esc(opts.clientName)}</strong> wants to use all connected Google accounts through mailmcp
(read mail, calendars and Drive; create drafts and calendar events).</p>
<p class="muted">Redirects to <code>${esc(opts.redirectUri)}</code></p>
<form method="post" action="/consent" class="row">
  <input type="hidden" name="id" value="${esc(opts.id)}"><input type="hidden" name="csrf" value="${esc(opts.csrf)}">
  <button class="primary" name="decision" value="approve">Approve</button>
  <button name="decision" value="deny">Deny</button>
</form></div>`,
  );
}

export function messagePage(title: string, message: string): string {
  return layout(title, `<h1>${esc(title)}</h1><div class="card">${esc(message)}</div>`);
}

const EFFECTIVE = '24 September 2026';

export function landingPage(mcpUrl: string): string {
  return layout(
    'Multi-account Google for Claude',
    `<div class="hero"><h1>mailmcp</h1>
<p>A private MCP server that gives Claude access to several Google accounts at once: Gmail, Google Calendar and Google Drive,
searchable one account at a time or across all of them.</p></div>
<div class="grid">
  <div class="card"><h3>Gmail</h3><p>Search and read mail and attachments, and prepare drafts. Mail is never sent automatically.</p></div>
  <div class="card"><h3>Calendar</h3><p>See events and free/busy time across accounts, and create or update events.</p></div>
  <div class="card"><h3>Drive</h3><p>Search and read Docs, Sheets, Slides, PDFs and text files. Read-only.</p></div>
</div>
<div class="card prose"><p style="margin-top:0"><strong>Personal use only.</strong> This is a self-hosted tool run by its owner for their own
Google accounts. It is not a public service and does not accept sign-ups.</p>
<p class="muted" style="margin-bottom:0">MCP endpoint: <code>${esc(mcpUrl)}</code></p></div>`,
  );
}

export function privacyPage(contact: string): string {
  return layout(
    'Privacy Policy',
    `<div class="prose"><h1>Privacy Policy</h1><p class="sub">Effective ${EFFECTIVE}</p>
<p>mailmcp is a self-hosted application operated by its owner for personal use. It connects the owner's own Google accounts
to the owner's AI assistant (Claude) through the Model Context Protocol. Only allowlisted owner accounts can sign in.</p>

<h2>Data we access</h2>
<p>With your explicit consent through Google's sign-in screen, mailmcp requests these Google permissions:</p>
<ul>
<li><strong>Basic profile</strong> (<code>openid</code>, <code>email</code>): to identify which account was connected and to sign the owner in.</li>
<li><strong>Gmail</strong> (<code>gmail.readonly</code>, <code>gmail.compose</code>): to search and read messages and attachments, and to create or edit drafts. mailmcp has no function that sends, deletes or modifies existing email.</li>
<li><strong>Google Calendar</strong> (<code>calendar.readonly</code>, <code>calendar.events</code>): to read calendars, events and free/busy time, and to create or update events on request.</li>
<li><strong>Google Drive</strong> (<code>drive.readonly</code>): to search for files and read their content.</li>
</ul>

<h2>How data is used</h2>
<p>Google data is fetched only when the owner's AI assistant makes a request, and only to answer that request. The result goes
back to the owner's own Claude session. Content is processed in memory and is <strong>not stored</strong> by mailmcp. Handling of
content inside Claude is governed by Anthropic's privacy policy and the owner's Anthropic account settings.</p>

<h2>Data we store</h2>
<ul>
<li>For each connected Google account: email address, an optional alias, the granted permissions and an OAuth refresh token.
Refresh tokens are encrypted at rest (AES-256-GCM).</li>
<li>OAuth client registrations and short-lived access tokens for the owner's MCP clients, stored only as hashes.</li>
</ul>
<p>This data is stored on a server controlled by the owner and is not shared with anyone.</p>

<h2>Sharing</h2>
<p>mailmcp does not sell, rent or share Google user data, and does not use it for advertising, for building user profiles, or
for training AI or machine-learning models. The only transfer is returning results to the owner's own AI assistant, at the
owner's request.</p>

<h2>Google API Services User Data Policy</h2>
<p>mailmcp's use and transfer of information received from Google APIs to any other app will adhere to the
<a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>,
including the Limited Use requirements.</p>

<h2>Retention and deletion</h2>
<p>An account's data is kept until the account is removed in the admin page, which deletes the stored token and revokes
the grant at Google. You can also revoke access at any time at
<a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</p>

<h2>Security</h2>
<p>All traffic uses HTTPS. Access requires owner sign-in with Google, and every MCP client must be explicitly approved.</p>

<h2>Contact</h2>
<p>Questions or deletion requests: <a href="mailto:${esc(contact)}">${esc(contact)}</a></p></div>`,
  );
}

export function termsPage(contact: string): string {
  return layout(
    'Terms of Service',
    `<div class="prose"><h1>Terms of Service</h1><p class="sub">Effective ${EFFECTIVE}</p>
<h2>1. The service</h2>
<p>mailmcp is a private, self-hosted tool that lets its owner use their own Google accounts with an AI assistant. It is not
offered to the public. Only accounts allowlisted by the owner can sign in or connect.</p>
<h2>2. Acceptable use</h2>
<p>Connect only Google accounts you own or are authorized to use, and follow Google's terms and your organization's policies.
Do not try to access accounts, data or endpoints you are not authorized for.</p>
<h2>3. Your data</h2>
<p>You keep all rights to your data. How data is handled is described in the <a href="/privacy">Privacy Policy</a>. You can
disconnect an account at any time.</p>
<h2>4. AI-generated actions</h2>
<p>Drafts and calendar changes may be prepared by an AI assistant. Review drafts before sending them. mailmcp never sends
email on its own.</p>
<h2>5. No warranty</h2>
<p>The service is provided "as is", without warranties of any kind, and may change, be interrupted or be discontinued at any
time.</p>
<h2>6. Limitation of liability</h2>
<p>To the extent permitted by law, the operator is not liable for any indirect or consequential damages, or for loss of
data, arising from use of the service.</p>
<h2>7. Changes</h2>
<p>These terms may be updated. The effective date above shows the latest version.</p>
<h2>8. Contact</h2>
<p><a href="mailto:${esc(contact)}">${esc(contact)}</a></p></div>`,
  );
}
