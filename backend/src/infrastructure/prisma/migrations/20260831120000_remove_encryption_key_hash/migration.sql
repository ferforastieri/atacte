-- The vault now uses the process-level ENCRYPTION_KEY. The per-user
-- encryption_key_hash marker is no longer used by the application.
ALTER TABLE "users" DROP COLUMN "encryption_key_hash";
