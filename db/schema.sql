-- Keep portfolio URLs and display order stable when content moves into Postgres.
CREATE TABLE IF NOT EXISTS projects (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 slug text NOT NULL UNIQUE,
 title text NOT NULL,
 category text[] NOT NULL DEFAULT '{}',
 type text NOT NULL DEFAULT 'landscape',
 year text,
 client text,
 description text NOT NULL DEFAULT '',
 context text,
 roles text[] NOT NULL DEFAULT '{}',
 tools text[] NOT NULL DEFAULT '{}',
 body text NOT NULL DEFAULT '',
 summary text,
 display_order integer NOT NULL,
 content jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 username text NOT NULL UNIQUE,
 password_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 id text PRIMARY KEY,
 user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS comments (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 project_id bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
 message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_project_created_idx ON comments(project_id, created_at DESC);

-- Login counters live in Postgres so limits also apply across server instances.
CREATE TABLE IF NOT EXISTS login_attempts (
 key text NOT NULL,
 window_start timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 1,
 PRIMARY KEY (key, window_start)
);
