CREATE TABLE IF NOT EXISTS AdminOperations (
    id TEXT PRIMARY KEY NOT NULL,
    actor_type TEXT NOT NULL,
    actor_user_id TEXT,
    actor_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_operations_created_at
    ON AdminOperations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_operations_status_created_at
    ON AdminOperations(status, created_at DESC);
