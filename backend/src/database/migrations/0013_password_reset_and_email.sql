ALTER TABLE Users ADD COLUMN email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
    ON Users(email)
    WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS PasswordResetTokens (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
    ON PasswordResetTokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_created_at
    ON PasswordResetTokens(user_id, created_at DESC);
