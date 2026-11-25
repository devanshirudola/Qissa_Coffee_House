import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requestLogger } from '../middleware/requestLogger.js';
import { errorHandler } from '../middleware/errorHandler.js';

// Helper to create app with optional env mode
function createApp(env) {
  const app = express();
  if (env) process.env.NODE_ENV = env;
  app.use(requestLogger);
  app.get('/error', (req, res) => {
    throw new Error('Test error');
  });
  // Must be after routes
  app.use(errorHandler);
  return app;
}

await test('Production mode hides error details', async t => {
  const app = createApp('production');
  const res = await import('supertest').then(s => s.default(app).get('/error'));
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'Internal server error');
  // Ensure original message not leaked
  assert.doesNotMatch(JSON.stringify(res.body), /Test error/);
});

await test('Development mode exposes error message', async t => {
  const app = createApp('development');
  const res = await import('supertest').then(s => s.default(app).get('/error'));
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'Test error');
});
