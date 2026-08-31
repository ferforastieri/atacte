-- Baseline: database schema before Prisma Migrate was introduced.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "master_password_hash" TEXT NOT NULL,
    "master_password_salt" TEXT NOT NULL,
    "encryption_key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "name" TEXT,
    "phone_number" TEXT,
    "profile_picture" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "username" TEXT,
    "encrypted_password" TEXT NOT NULL,
    "notes" TEXT,
    "folder" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used" TIMESTAMP(3),
    "totp_secret" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "password_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "password_entry_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secure_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "encrypted_content" TEXT NOT NULL,
    "folder" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secure_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "device_fingerprint" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3),
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_devices_user_id_device_fingerprint_key" ON "trusted_devices"("user_id", "device_fingerprint");

-- CreateIndex
CREATE INDEX "secure_notes_user_id_created_at_idx" ON "secure_notes"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_entries" ADD CONSTRAINT "password_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_password_entry_id_fkey" FOREIGN KEY ("password_entry_id") REFERENCES "password_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secure_notes" ADD CONSTRAINT "secure_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
