import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import request from 'supertest';

// Only a dedicated, disposable test database may be used. No .env values are printed.
const enabled = process.env['ATACTE_INTEGRATION'] === '1';
if (enabled && !process.env['DATABASE_URL']?.includes('/atacte_test')) throw new Error('Use a disposable atacte_test database');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-only-'.repeat(3);
process.env.ENCRYPTION_KEY = 'x'.repeat(32);
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.COOKIE_SECURE = 'false';
process.env.AUTH_RATE_LIMIT_MAX = '100';

test('real database, Redis and password authentication security flows', { skip: !enabled }, async () => {
  const { prisma } = await import('./infrastructure/prisma');
  const { getRedis, closeRedis } = await import('./infrastructure/redis');
  const { AuthService } = await import('./services/auth/authService');
  const { allowRegistration, changePassword } = await import('./services/auth/securityService');
  const { hashPassword, tokenHash } = await import('./utils/credentialUtil');
  const { redisRateLimitStore } = await import('./middleware/rateLimitStore');
  const app = (await import('./server')).default;
  const redis = await getRedis();
  const auth = new AuthService();
  try {
    await prisma.user.deleteMany();
    await prisma.securityState.update({ where: { id: 1 }, data: { initialized: false } });
    await allowRegistration('owner@example.invalid');
    const registered = await Promise.allSettled([1, 2].map(() => auth.register({ email: 'owner@example.invalid', masterPassword: 'integration-password' })));
    assert.equal(registered.filter(r => r.status === 'fulfilled').length, 1, 'only one bootstrap succeeds');
    assert.equal((await request(app).get('/api/passwords')).status, 401);
    const user = await prisma.user.create({ data: { email: 'user@example.invalid', ...await hashPassword('integration-password') } });
    await assert.rejects(auth.login({ email: user.email, masterPassword: 'incorrect-password' }));
    const login = await auth.login({ email: user.email, masterPassword: 'integration-password' });
    const cookie = `atacte_session=${login.token}; atacte_csrf=integration-csrf`;
    const call = (method: 'get' | 'post' | 'patch' | 'put', path: string) => request(app)[method](path).set('Cookie', cookie).set('X-CSRF-Token', 'integration-csrf');
    assert.equal((await call('get', '/api/passwords')).status, 200);
    const { PasswordService } = await import('./services/passwords/passwordService');
    const service = new PasswordService();
    const entry = await service.createPassword(user.id, { name: 'Test', password: 'vault-secret', folder: 'Work', isFavorite: true, customFields: [{ fieldName: 'old', value: 'private', fieldType: 'text' }] });
    await service.updatePassword(user.id, entry.id, { customFields: [{ fieldName: 'new', value: 'replacement', fieldType: 'text' }] });
    assert.equal(await prisma.customField.count({ where: { passwordEntryId: entry.id } }), 1);
    assert.deepEqual(await service.getUserFolders(user.id), ['Work']);
    const beforeFailure = await prisma.passwordEntry.findUniqueOrThrow({ where: { id: entry.id } });
    await assert.rejects(service.updatePassword(user.id, entry.id, { name: 'Must rollback', customFields: [{ fieldName: null as any, value: 'invalid', fieldType: 'text' }] }));
    assert.equal((await prisma.passwordEntry.findUniqueOrThrow({ where: { id: entry.id } })).name, beforeFailure.name);
    assert.equal(await prisma.customField.count({ where: { passwordEntryId: entry.id } }), 1);
    const vaultCounts = await call('get', '/api/passwords/counts');
    assert.deepEqual(vaultCounts.body.data, { total: 1, favorites: 1, totp: 0 });
    assert.equal((await call('get', '/api/passwords/generate?length=24')).body.data.password.length, 24);
    assert.equal((await call('get', '/api/passwords/generate?length=1000000000')).status, 400);
    const activity = (await prisma.userSession.findUniqueOrThrow({ where: { id: login.sessionId } })).lastUsed;
    await call('get', '/api/passwords/counts');
    assert.equal((await prisma.userSession.findUniqueOrThrow({ where: { id: login.sessionId } })).lastUsed.getTime(), activity.getTime());

    assert.equal((await call('patch', '/api/users/profile').send({ role: 'ADMIN' })).status, 400);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).role, 'USER');
    assert.equal((await call('get', '/api/users/admin/users')).status, 403);
    for (const [method, path] of [['post', '/api/update'], ['put', '/api/config'], ['post', '/api/auth/trust-device'], ['post', '/api/auth/passkeys/authentication/options']] as const) assert.equal((await call(method, path).send({})).status, 404);
    assert.equal((await call('patch', '/api/users/profile').set('Origin', 'https://evil.invalid').set('Host', 'evil.invalid').set('X-Forwarded-Proto', 'https').send({ name: 'x' })).status, 403);
    await prisma.userSession.update({ where: { id: login.sessionId }, data: { reauthenticatedAt: null } });
    assert.equal((await call('post', '/api/users/export')).body.requiresReauthentication, true);
    assert.equal((await call('post', '/api/auth/reauthenticate').send({ password: 'incorrect-password' })).status, 403);
    assert.equal((await call('post', '/api/auth/reauthenticate').send({ password: 'integration-password' })).status, 200);
    assert.ok((await prisma.userSession.findUniqueOrThrow({ where: { id: login.sessionId } })).reauthenticatedAt);
    const reset = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({ data: { userId: user.id, token: tokenHash(reset), expiresAt: new Date(Date.now() + 60000) } });
    const resetResults = await Promise.allSettled([1, 2].map(() => auth.resetPassword(reset, 'new-integration-password')));
    assert.equal(resetResults.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await prisma.userSession.count({ where: { userId: user.id } }), 0);
    const fresh = await auth.login({ email: user.email, masterPassword: 'new-integration-password' });
    await changePassword(user.id, 'admin-changed-password');
    assert.equal(await prisma.userSession.count({ where: { id: fresh.sessionId } }), 0);
    const prefix = `integration-${randomBytes(8).toString('hex')}`;
    const storeA = redisRateLimitStore(prefix), storeB = redisRateLimitStore(prefix);
    storeA.init({ windowMs: 1000 } as any); storeB.init({ windowMs: 1000 } as any);
    const counts = await Promise.all([storeA.increment('account'), storeB.increment('account')]);
    assert.deepEqual(counts.map(c => c.totalHits).sort(), [1, 2]);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal((await storeA.increment('account')).totalHits, 1);
    await storeA.resetKey('account');
  } finally {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    await closeRedis();
  }
});
