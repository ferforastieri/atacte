CREATE INDEX "password_entries_user_id_name_idx" ON "password_entries"("user_id", "name");
CREATE INDEX "custom_fields_password_entry_id_idx" ON "custom_fields"("password_entry_id");
CREATE INDEX "user_sessions_user_id_token_hash_idx" ON "user_sessions"("user_id", "token_hash");
CREATE INDEX "user_sessions_user_id_last_used_idx" ON "user_sessions"("user_id", "last_used");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX "secure_notes_user_id_title_idx" ON "secure_notes"("user_id", "title");
