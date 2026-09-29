CREATE TABLE IF NOT EXISTS reactions (
  path TEXT NOT NULL,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (path, voter_hash)
);

CREATE INDEX IF NOT EXISTS reactions_path_idx ON reactions (path);
