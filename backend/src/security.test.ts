import assert from 'node:assert/strict';
import { test } from 'node:test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'x'.repeat(32);
process.env.ENCRYPTION_KEY = 'y'.repeat(32);
process.env.CORS_ORIGIN = 'http://localhost:3000';

async function modules() {
  return {
    credentials: await import('./utils/credentialUtil'),
    system: await import('./controllers/system/systemController'),
    cookies: await import('./middleware/cookies'),
    csv: await import('./services/importExport/importExportService'),
  };
}
test('profile rejects role and relational injection before persistence', async () => {
  const { UserService } = await import('./services/users/userService');
  const service = new UserService();
  (service as any).userRepository = { findById: async () => ({ id: 'u' }), updateProfile: async () => { assert.fail('invalid profile must not reach persistence'); } };
  for (const data of [{ role: 'ADMIN' }, { name: { set: 'attacker' } }, { passwordEntries: { connect: { id: 'victim' } } }]) {
    await assert.rejects(service.updateUserProfile('u', data as any), /Campos de perfil inválidos/);
  }
});
test('password policy measures UTF-8 bytes without bcrypt truncation', async () => {
  const { credentials } = await modules();
  assert.doesNotThrow(() => credentials.validateNewPassword('é'.repeat(36)));
  assert.throws(() => credentials.validateNewPassword('é'.repeat(37)));
  assert.equal(await credentials.verifyPassword('x'.repeat(73)), false);
});
test('CSRF comparison handles equal character counts with different byte lengths', async () => {
  const { cookies } = await modules();
  assert.equal(cookies.secureTokenEqual('é', 'a'), false);
  assert.equal(cookies.secureTokenEqual('token', 'token'), true);
});
test('CSV quotes values and neutralizes spreadsheet formulas', async () => {
  const { csv } = await modules();
  assert.equal(csv.csvCell('a"b,c'), '"a""b,c"');
  assert.equal(csv.csvCell(' =1+1'), '"\' =1+1"');
  assert.equal(csv.csvCell('line\nbreak'), '"line\nbreak"');
});
test('update notice only reports a release ahead of the installed revision', async () => {
  const { system } = await modules();
  for (const status of ['behind', 'identical', 'diverged', 'ahead']) {
    const response = await system.checkUpdate('a'.repeat(40), async path => path === 'releases/latest' ? { tag_name: 'v1.2.3', target_commitish: 'main' } : { status, ahead_by: 2 });
    assert.equal(response.updateAvailable, status === 'ahead');
  }
  assert.equal((await system.checkUpdate('development', async () => { assert.fail('development must not query releases'); })).updateAvailable, false);
});
