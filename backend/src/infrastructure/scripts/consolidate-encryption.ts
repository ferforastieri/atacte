import { PrismaClient } from '../../../node_modules/.prisma/client';
import { ENCRYPTION_KEY } from '../config';
import { CryptoUtil } from '../../utils/cryptoUtil';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const USER_KEY_MARKER = 'master-key:v1';

type Counters = {
  users: number;
  passwordEntries: number;
  customFields: number;
  totpSecrets: number;
  secureNotes: number;
  passwordNotes: number;
};

function reencrypt(value: string, legacyKey: string): string {
  if (CryptoUtil.isAuthenticatedCiphertext(value)) return value;
  return CryptoUtil.encrypt(CryptoUtil.decryptLegacy(value, legacyKey), ENCRYPTION_KEY);
}

async function main(): Promise<void> {
  if (!APPLY) {
    console.log('Modo simulação. Use --apply para gravar a migração.');
  }

  const counters: Counters = {
    users: 0,
    passwordEntries: 0,
    customFields: 0,
    totpSecrets: 0,
    secureNotes: 0,
    passwordNotes: 0,
  };

  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      select: { id: true, encryptionKeyHash: true },
    });

    for (const user of users) {
      const legacyKey = user.encryptionKeyHash;
      if (legacyKey === USER_KEY_MARKER) {
        counters.users++;
        continue;
      }

      const entries = await tx.passwordEntry.findMany({
        where: { userId: user.id },
        include: { customFields: true },
      });

      for (const entry of entries) {
        const data: { encryptedPassword?: string; notes?: string; totpSecret?: string } = {};
        if (!CryptoUtil.isAuthenticatedCiphertext(entry.encryptedPassword)) {
          data.encryptedPassword = reencrypt(entry.encryptedPassword, legacyKey);
          counters.passwordEntries++;
        }
        if (entry.notes && !CryptoUtil.isAuthenticatedCiphertext(entry.notes)) {
          // PasswordEntry.notes was plaintext in the legacy schema.
          data.notes = CryptoUtil.encrypt(entry.notes, ENCRYPTION_KEY);
          counters.passwordNotes++;
        }
        if (entry.totpSecret && !CryptoUtil.isAuthenticatedCiphertext(entry.totpSecret)) {
          data.totpSecret = reencrypt(entry.totpSecret, legacyKey);
          counters.totpSecrets++;
        }
        if (APPLY && Object.keys(data).length > 0) {
          await tx.passwordEntry.update({ where: { id: entry.id }, data });
        }

        for (const field of entry.customFields) {
          if (!CryptoUtil.isAuthenticatedCiphertext(field.encryptedValue)) {
            counters.customFields++;
            const encryptedValue = reencrypt(field.encryptedValue, legacyKey);
            if (APPLY) {
              await tx.customField.update({
                where: { id: field.id },
                data: { encryptedValue },
              });
            }
          }
        }
      }

      const notes = await tx.secureNote.findMany({ where: { userId: user.id } });
      for (const note of notes) {
        if (!CryptoUtil.isAuthenticatedCiphertext(note.encryptedContent)) {
          counters.secureNotes++;
          const encryptedContent = reencrypt(note.encryptedContent, legacyKey);
          if (APPLY) {
            await tx.secureNote.update({
              where: { id: note.id },
              data: { encryptedContent },
            });
          }
        }
      }

      counters.users++;
      if (APPLY) {
        await tx.user.update({
          where: { id: user.id },
          data: { encryptionKeyHash: USER_KEY_MARKER },
        });
      }
    }
  }, { maxWait: 10_000, timeout: 10 * 60 * 1000 });

  console.log(JSON.stringify({ applied: APPLY, ...counters }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error('Migração abortada; nenhuma alteração foi confirmada.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
