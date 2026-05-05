-- migrate:up
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone               VARCHAR(15) NOT NULL UNIQUE,
  email               VARCHAR(255) UNIQUE,
  full_name           VARCHAR(100) NOT NULL,
  avatar_url          TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_driver_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  active_mode         VARCHAR(10) NOT NULL DEFAULT 'rider',
  no_show_count       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_active_mode_check CHECK (active_mode IN ('rider', 'driver'))
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- migrate:down
DROP TABLE IF EXISTS users;