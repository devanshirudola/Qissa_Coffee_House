import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { initSocket } from '../utils/socket.js';
import app from '../server.js';

// Helper to start a temporary HTTP server and return base URL
function startServer() {
  const server = http.createServer(app);
  initSocket(server);
  return new Promise(resolve => {
    server.listen(0, () => {
      const port = server.address().port;
      resolve({ server, baseUrl: `http://localhost:${port}` });
    });
  });
}

// Ensure admin env vars are defined for the tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(32);
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass123!';

await test('Admin login and pagination on orders', async t => {
  const { server, baseUrl } = await startServer();

  // Login as admin
  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  assert.ok(token, 'Token should be returned');

  // Get orders with pagination
  const ordersRes = await fetch(`${baseUrl}/api/admin/orders?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(ordersRes.status, 200);
  const ordersData = await ordersRes.json();
  assert.ok(Array.isArray(ordersData.data?.orders), 'Orders array present');
  assert.ok(ordersData.data?.pagination, 'Pagination info present');

  server.close();
});

await test('Admin reservation pagination', async t => {
  const { server, baseUrl } = await startServer();

  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const token = (await loginRes.json()).data?.token;

  const res = await fetch(`${baseUrl}/api/admin/reservations?page=1&limit=3`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.data?.reservations), 'Reservations array present');
  assert.ok(data.data?.pagination, 'Pagination info present');

  server.close();
});

await test('Product creation success', async t => {
  const { server, baseUrl } = await startServer();

  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const token = (await loginRes.json()).data?.token;

  const productData = {
    name: 'E2E Test Product',
    price: 12.5,
    description: 'End‑to‑end test product.',
    category: 'E2E Category',
    imageUrl: 'https://example.com/e2e.png',
  };

  const createRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(productData),
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  assert.equal(createData.success, true);
  assert.equal(createData.data.name, productData.name);

  server.close();
});

await test('Product creation missing name should fail', async t => {
  const { server, baseUrl } = await startServer();

  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
  });
  const token = (await loginRes.json()).data?.token;

  const badData = {
    price: 5,
    description: 'Bad data',
    category: 'Bad',
    imageUrl: 'https://example.com/bad.png',
  };

  const res = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(badData),
  });
  assert.equal(res.status, 400);

  server.close();
});\n
