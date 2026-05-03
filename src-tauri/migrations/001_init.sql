CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  done        INTEGER NOT NULL DEFAULT 0,
  due_at      INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_done_created ON tasks(done, created_at DESC);

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT PRIMARY KEY,
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);

CREATE TABLE IF NOT EXISTS layouts (
  id          TEXT PRIMARY KEY DEFAULT 'default',
  data        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS widget_configs (
  widget_id   TEXT PRIMARY KEY,
  config      TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);
