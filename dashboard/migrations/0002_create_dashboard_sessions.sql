CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS dashboard_sessions_expires_at_idx ON dashboard_sessions (expires_at);