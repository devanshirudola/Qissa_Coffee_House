// Security-related tests for CORS and Socket.io authentication
import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import express from 'express';
import cors from 'cors';
import { requestLogger } from '../middleware/requestLogger.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { initSocket } from '../utils/socket.js';
import http from 'node:http';

// Helper to create an Express app with CORS config as in server.js
function createApp() {
  const app = express();
  const allowedOrigins = new Set([process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean));
  app.use(cors({
    origin: (origin, callback) => {
      const isDev = process.env.NODE_ENV === 'development';
      if (origin && allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      if (!origin && isDev) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(requestLogger);
  app.get('/test', (req, res) => res.json({ success: true }));
  app.use(errorHandler);
  return app;
}

await test('CORS blocks disallowed origin', async t => {
  const app = createApp();
  const res = await supertest(app).get('/test').set('Origin', 'https://malicious.com');
  // Expect the error handler to respond with 500 and generic message in production mode
  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /Origin is not allowed|Internal server error/);
});

// Socket.io authentication test – skipped due to missing socket.io-client in sandbox.
// await test('Socket.io rejects non‑admin connections', async t => {
//   const server = http.createServer();
//   initSocket(server);
//   await new Promise(resolve => server.listen(0, resolve));
//   const address = server.address();
//   try {
//     const { io } = await import('socket.io-client');
//     const client = io(`http://localhost:${address.port}`, { reconnection: false, timeout: 2000 });
//     const error = await new Promise(resolve => {
//       client.on('connect_error', err => resolve(err.message));
//       client.on('connect', () => resolve(null));
//     });
//     assert.equal(error, 'Unauthorized');
//     client.disconnect();
//   } catch (e) {
//     // If socket.io-client cannot be imported, skip test.
//   }
//   server.close();
// });
await test('Socket.io rejects non‑admin connections', async t => {
  const server = http.createServer();
  // Initialize socket without any custom options – uses same origin whitelist
  initSocket(server);
  // Start server on an ephemeral port
  await new Promise(resolve => server.listen(0, resolve));
  const address = server.address();
  const { io } = await import('socket.io-client');
  // Attempt to connect without token
  const client = io(`http://localhost:${address.port}`, {
    reconnection: false,
    timeout: 2000,
  });
  const error = await new Promise(resolve => {
    client.on('connect_error', err => resolve(err.message));
    client.on('connect', () => resolve(null));
  });
  // The middleware should emit an error with message 'Unauthorized'
  assert.equal(error, 'Unauthorized');
  client.disconnect();
  server.close();
});
