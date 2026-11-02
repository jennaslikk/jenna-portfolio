-- Login counters live in Postgres so limits also apply across server instances.
CREATE TABLE IF NOT EXISTS login_attempts (
 key text NOT NULL,
 window_start timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 1,
 PRIMARY KEY (key, window_start)
);
