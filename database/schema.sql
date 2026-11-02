-- Draft PostgreSQL content schema. Run only in your own development database.
-- Authentication tables must be supplied by the chosen auth implementation.
CREATE TABLE IF NOT EXISTS posts (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 slug text UNIQUE NOT NULL,
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 50000),
 summary text,
 author_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comments (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 display_name text NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
 body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
