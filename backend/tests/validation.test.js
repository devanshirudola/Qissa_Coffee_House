// Validation layer tests (Node.js built‑in test runner + supertest)
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { query, body, param } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';

// Helper to create an app with given validation chain and dummy handler
function createApp(chain) {
  const app = express();
  app.use(express.json());
  app.get('/test', chain, (req, res) => {
    // Echo back sanitized values for inspection
    res.json({ success: true, query: req.query, body: req.body, params: req.params });
  });
  return app;
}

// 1. Invalid pagination values
await test('GET /test with negative page should return 400', async t => {
  const app = createApp([query('page').optional().isInt({ min: 1 }).toInt(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?page=-5'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /page/);
});

await test('GET /test with non‑numeric limit should return 400', async t => {
  const app = createApp([query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?limit=abc'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /limit/);
});

// 2. Invalid order status
await test('PATCH /test/:id/status with wrong status enum should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.patch('/test/:id/status', [param('id').isMongoId(), body('status').isIn(['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled']), validateRequest], (req, res) => {
    res.json({ success: true });
  });
  const res = await import('supertest').then(s => s.default(app).patch('/test/507f1f77bcf86cd799439011/status').send({ status: 'Invalid' }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /status/);
});

// 3. Invalid MongoDB ID
await test('GET /test/:id with malformed id should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.get('/test/:id', [param('id').isMongoId(), validateRequest], (req, res) => {
    res.json({ success: true });
  });
  const res = await import('supertest').then(s => s.default(app).get('/test/not-a-mongo-id'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /id/);
});

// 4. Missing required product fields
await test('POST /test with missing product name should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.post('/test', [
    body('name').exists().isString().trim(),
    body('price').exists().isFloat({ min: 0 }),
    body('description').exists().isString().trim(),
    body('category').exists().isString().trim(),
    body('imageUrl').exists().isString().trim(),
    validateRequest,
  ], (req, res) => {
    res.json({ success: true });
  });
  const payload = { price: 10, description: 'Desc', category: 'Cat', imageUrl: 'url' }; // name missing
  const res = await import('supertest').then(s => s.default(app).post('/test').send(payload));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /name/);
});

// 5. Invalid product price (negative)
await test('POST /test with negative price should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.post('/test', [
    body('name').exists().isString().trim(),
    body('price').exists().isFloat({ min: 0 }),
    body('description').exists().isString().trim(),
    body('category').exists().isString().trim(),
    body('imageUrl').exists().isString().trim(),
    validateRequest,
  ], (req, res) => {
    res.json({ success: true });
  });
  const payload = { name: 'Prod', price: -5, description: 'Desc', category: 'Cat', imageUrl: 'url' };
  const res = await import('supertest').then(s => s.default(app).post('/test').send(payload));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /price/);
});

// 6. Invalid date format for reservation filter
await test('GET /test with bad ISO date should return 400', async t => {
  const app = createApp([query('date').optional().isISO8601(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?date=not-a-date'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /date/);
});

// 7. Invalid notification query parameters
await test('GET /test with unreadOnly not true/false should return 400', async t => {
  const app = createApp([query('unreadOnly').optional().isIn(['true', 'false']), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?unreadOnly=maybe'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /unreadOnly/);
});

// 8. Valid request passes validation and sanitization
await test('GET /test with valid pagination passes and sanitizes', async t => {
  const app = createApp([query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?page=2&limit=10'));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.success, true);
  // ensure sanitization (converted to numbers)
  assert.equal(typeof res.body.query.page, 'number');
  assert.equal(typeof res.body.query.limit, 'number');
});

// Additional tests for real admin routes using the actual validation chains
import adminRoutes from '../routes/adminRoutes.js';

function mockAuth(req, res, next) {
  // Provide a dummy admin user
  req.user = { _id: '507f1f77bcf86cd799439011', role: 'admin' };
  next();
}
function mockAdmin(req, res, next) { next(); }

await test('Admin GET /orders with invalid pagination returns 400', async t => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', mockAuth, mockAdmin, adminRoutes);
  const res = await import('supertest').then(s => s.default(app).get('/api/admin/orders?page=-1'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /page/);
});

await test('Admin GET /orders with valid pagination passes and sanitizes', async t => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', mockAuth, mockAdmin, adminRoutes);
  const res = await import('supertest').then(s => s.default(app).get('/api/admin/orders?page=2&limit=5'));
  assert.equal(res.statusCode, 200);
  // verify sanitization to numbers
  assert.equal(typeof res.body.query.page, 'number');
  assert.equal(typeof res.body.query.limit, 'number');
});

// 2. Invalid order status
await test('PATCH /test/:id/status with wrong status enum should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.patch('/test/:id/status', [param('id').isMongoId(), body('status').isIn(['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled']), validateRequest], (req, res) => {
    res.json({ success: true });
  });
  const res = await import('supertest').then(s => s.default(app).patch('/test/507f1f77bcf86cd799439011/status').send({ status: 'Invalid' }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /status/);
});

// 3. Invalid MongoDB ID
await test('GET /test/:id with malformed id should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.get('/test/:id', [param('id').isMongoId(), validateRequest], (req, res) => {
    res.json({ success: true });
  });
  const res = await import('supertest').then(s => s.default(app).get('/test/not-a-mongo-id'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /id/);
});

// 4. Missing required product fields
await test('POST /test with missing product name should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.post('/test', [
    body('name').exists().isString().trim(),
    body('price').exists().isFloat({ min: 0 }),
    body('description').exists().isString().trim(),
    body('category').exists().isString().trim(),
    body('imageUrl').exists().isString().trim(),
    validateRequest,
  ], (req, res) => {
    res.json({ success: true });
  });
  const payload = { price: 10, description: 'Desc', category: 'Cat', imageUrl: 'url' }; // name missing
  const res = await import('supertest').then(s => s.default(app).post('/test').send(payload));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /name/);
});

// 5. Invalid product price (negative)
await test('POST /test with negative price should return 400', async t => {
  const app = express();
  app.use(express.json());
  app.post('/test', [
    body('name').exists().isString().trim(),
    body('price').exists().isFloat({ min: 0 }),
    body('description').exists().isString().trim(),
    body('category').exists().isString().trim(),
    body('imageUrl').exists().isString().trim(),
    validateRequest,
  ], (req, res) => {
    res.json({ success: true });
  });
  const payload = { name: 'Prod', price: -5, description: 'Desc', category: 'Cat', imageUrl: 'url' };
  const res = await import('supertest').then(s => s.default(app).post('/test').send(payload));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /price/);
});

// 6. Invalid date format for reservation filter
await test('GET /test with bad ISO date should return 400', async t => {
  const app = createApp([query('date').optional().isISO8601(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?date=not-a-date'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /date/);
});

// 7. Invalid notification query parameters
await test('GET /test with unreadOnly not true/false should return 400', async t => {
  const app = createApp([query('unreadOnly').optional().isIn(['true', 'false']), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?unreadOnly=maybe'));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.stringify(res.body), /unreadOnly/);
});

// 8. Valid request passes validation
await test('GET /test with valid pagination passes', async t => {
  const app = createApp([query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt(), validateRequest]);
  const res = await import('supertest').then(s => s.default(app).get('/test?page=2&limit=10'));
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.success, true);
});
