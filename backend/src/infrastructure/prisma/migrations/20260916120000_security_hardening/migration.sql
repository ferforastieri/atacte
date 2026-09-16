ALTER TABLE "user_sessions" ADD COLUMN "reauthenticated_at" TIMESTAMP(3);
CREATE TABLE "security_state" ("id" INTEGER PRIMARY KEY, "initialized" BOOLEAN NOT NULL DEFAULT false, "bootstrapEmail" TEXT, "bootstrapExpiresAt" TIMESTAMP(3));
INSERT INTO "security_state" ("id", "initialized") VALUES (1, EXISTS (SELECT 1 FROM "users"));
-- Previous sessions/trust were established through the vulnerable approval flow.
DELETE FROM "user_sessions";
DROP TABLE "trusted_devices";
-- Invalidate legacy plaintext reset tokens; new tokens are stored only as hashes.
DELETE FROM "password_reset_tokens";


ALTER TABLE "user_sessions" DROP COLUMN "is_trusted";
