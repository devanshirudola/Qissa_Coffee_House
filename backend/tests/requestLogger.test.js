// Tests for request logger without external dependencies
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requestLogger } from '../middleware/requestLogger.js';

// Helper to capture console.info output
function captureConsoleInfo(callback) {
  const original = console.info;
  const logs = [];
  console.info = (...args) => logs.push(args.join(' '));
  try { callback(); } finally { console.info = original; }
  return logs;
}

await test('Logger redacts sensitive query parameters and does not log body or auth header', async t => {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.get('/test', (req, res) => {
    res.json({ ok: true });
  });

  const logs = captureConsoleInfo(() => {
    // Use built-in fetch (Node v24) to send request
    const url = new URL('http://localhost:0/test');
    url.searchParams.append('token', 'secretToken');
    url.searchParams.append('normal', 'value');
    url.searchParams.append('password', 'myPass');
    // Start server on random port
    const server = app.listen(0, async () => {
      const port = server.address().port;
      const finalUrl = `http://127.0.0.1:${port}${url.pathname}?${url.searchParams}`;
      await fetch(finalUrl, {
        method: 'GET',
        headers: { Authorization: 'Bearer abcdef' },
        body: JSON.stringify({ hidden: 'should not appear' })
      });
      server.close();
    });
  });

  assert.equal(logs.length, 1);
  const line = logs[0];
  assert.match(line, /GET \/test/);
  assert.match(line, /"token":"\[REDACTED\]"/);
  assert.match(line, /"password":"\[REDACTED\]"/);
  assert.match(line, /"normal":"value"/);
  assert.doesNotMatch(line, /Authorization/);
  assert.doesNotMatch(line, /hidden/);
});\n
