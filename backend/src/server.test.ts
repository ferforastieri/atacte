import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/atacte';
process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.CORS_ORIGIN = 'http://localhost:3000';

let appPromise: Promise<import('express').Express> | undefined;
async function getApp() {
  appPromise ??= import('./server').then((module) => {
    const candidate = module.default as unknown as { default?: import('express').Express };
    return candidate.default ?? (module.default as unknown as import('express').Express);
  });
  return appPromise;
}

test('health check is public and uncached', async () => {
  const response = await request(await getApp()).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('health check is also available under the public API prefix', async () => {
  const response = await request(await getApp()).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('published version endpoint is public and uncached', async () => {
  const response = await request(await getApp()).get('/api/version');
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.version, 'string');
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('CSRF endpoint emits a readable token cookie', async () => {
  const response = await request(await getApp()).get('/api/auth/csrf');
  assert.equal(response.status, 200);
  const cookies = response.headers['set-cookie']?.join(';') ?? '';
  assert.match(cookies, /atacte_csrf=/);
  assert.doesNotMatch(cookies, /HttpOnly/);
});

test('mutating requests without CSRF are rejected before authentication', async () => {
  const response = await request(await getApp()).post('/api/auth/login').send({ email: 'x@example.com', masterPassword: 'password' });
  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'Token CSRF inválido');
});
