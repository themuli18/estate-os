import express from 'express';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpOAuthProvider, SCOPE } from './auth/mcpProvider.js';
import { loadConfig } from './config.js';
import { openDb, purgeExpired } from './db.js';
import { AccountStore } from './google/accounts.js';
import { createMcpServer } from './tools/index.js';
import { webRoutes } from './web/routes.js';

const config = loadConfig();
const db = openDb(config.DB_PATH);
const accounts = new AccountStore(db, config);
const provider = new McpOAuthProvider(db, config.PUBLIC_URL);
const mcpUrl = new URL('/mcp', config.PUBLIC_URL);

const app = express();
// Behind cloudflared: trust one proxy hop for client IPs (rate limiting).
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, accounts: accounts.list().length });
});

app.use(
  mcpAuthRouter({
    provider,
    issuerUrl: new URL(config.PUBLIC_URL),
    resourceServerUrl: mcpUrl,
    scopesSupported: [SCOPE],
    resourceName: 'mailmcp',
  }),
);

app.use(webRoutes(config, db, accounts, provider));

const bearer = requireBearerAuth({
  verifier: provider,
  requiredScopes: [SCOPE],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpUrl),
});

// Stateless Streamable HTTP: a fresh server + transport per request.
app.post('/mcp', bearer, express.json({ limit: '4mb' }), async (req, res) => {
  const server = createMcpServer(accounts);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request failed', err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});

app.all('/mcp', bearer, (_req, res) => {
  res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
});

setInterval(() => purgeExpired(db), 15 * 60 * 1000).unref();

const httpServer = app.listen(config.PORT, () => {
  console.log(`mailmcp listening on :${config.PORT} — public ${config.PUBLIC_URL}, MCP ${mcpUrl.href}`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    httpServer.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
