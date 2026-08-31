/**
 * Reencrypts vault data from the legacy SHA256(email) key to a key derived
 * from ENCRYPTION_KEY and the immutable user id.
 *
 * This is deliberately a data-only migration: it does not change Prisma's
 * schema, create tables, drop data, or run migrations. Each user is processed
 * in its own transaction, so a decryption error leaves that user's records
 * untouched. Run it once during a maintenance window with the same
 * ENCRYPTION_KEY used by the API, after taking a PostgreSQL backup.
 */
import { PrismaClient } from '../../../node_modules/.prisma/client';
import { ENCRYPTION_KEY } from '../config';
import { CryptoUtil } from '../../utils/cryptoUtil';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function reencrypt(value: string, sourceKey: string, targetKey: string, location: string): string {
  try {
    return CryptoUtil.encrypt(CryptoUtil.decrypt(value, sourceKey), targetKey);
  } catch (error) {
    throw new Error(`${location}: ${error instanceof Error ? error.message : 'valor inválido'}`);
  }
}

async function migrateUser(user: {
  id: string;
  encryptionKeyHash: string;
  passwordEntries: Array<{
    id: string;
    encryptedPassword: string;
    totpSecret: string | null;
    customFields: Array<{ id: string; encryptedValue: string }>;
  }>;
  secureNotes: Array<{ id: string; encryptedContent: string }>;
}): Promise<number> {
  const sourceKey = user.encryptionKeyHash;
  const targetKey = CryptoUtil.deriveUserKey(ENCRYPTION_KEY, user.id);
  const updates = user.passwordEntries.length + user.passwordEntries.reduce((sum, entry) => sum + entry.customFields.length, 0) + user.secureNotes.length;

  // Decrypt everything before opening the transaction. No database write can
  // occur unless every encrypted value for this user is valid.
  const passwords = user.passwordEntries.map((entry) => ({
    id: entry.id,
    encryptedPassword: reencrypt(entry.encryptedPassword, sourceKey, targetKey, `password_entries/${entry.id}/encrypted_password`),
    totpSecret: entry.totpSecret === null ? null : reencrypt(entry.totpSecret, sourceKey, targetKey, `password_entries/${entry.id}/totp_secret`),
    customFields: entry.customFields.map((field) => ({
      id: field.id,
      encryptedValue: reencrypt(field.encryptedValue, sourceKey, targetKey, `custom_fields/${field.id}/encrypted_value`),
    })),
  }));
  const notes = user.secureNotes.map((note) => ({
    id: note.id,
    encryptedContent: reencrypt(note.encryptedContent, sourceKey, targetKey, `secure_notes/${note.id}/encrypted_content`),
  }));

  if (dryRun) return updates;

  await prisma.$transaction(async (tx) => {
    for (const entry of passwords) {
      await tx.passwordEntry.update({
        where: { id: entry.id },
        data: { encryptedPassword: entry.encryptedPassword, totpSecret: entry.totpSecret },
      });
      for (const field of entry.customFields) {
        await tx.customField.update({ where: { id: field.id }, data: { encryptedValue: field.encryptedValue } });
      }
    }
    for (const note of notes) {
      await tx.secureNote.update({ where: { id: note.id }, data: { encryptedContent: note.encryptedContent } });
    }
    await tx.user.update({ where: { id: user.id }, data: { encryptionKeyHash: targetKey } });
  });

  return updates;
}

async function main(): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      encryptionKeyHash: true,
      passwordEntries: { select: { id: true, encryptedPassword: true, totpSecret: true, customFields: { select: { id: true, encryptedValue: true } } } },
      secureNotes: { select: { id: true, encryptedContent: true } },
    },
  });

  let migrated = 0;
  let failed = 0;
  for (const user of users) {
    try {
      const count = await migrateUser(user);
      migrated += 1;
      console.log(`Usuário ${user.id}: ${dryRun ? `${count} valores válidos (dry-run)` : `${count} valores recriptografados`}.`);
    } catch (error) {
      failed += 1;
      console.error(`Usuário ${user.id}: falha; nenhum write foi confirmado para este usuário.`);
      console.error(error instanceof Error ? error.message : error);
    }
  }
  console.log(`${dryRun ? 'Verificação' : 'Migração'} concluída: ${migrated} usuário(s) processado(s), ${failed} falha(s). Nenhuma alteração de schema foi executada.`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error('Migração interrompida antes da conclusão. Nenhum write parcial foi confirmado para o usuário com erro.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
