-- migrate:up
CREATE TABLE IF NOT EXISTS driver_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_number      VARCHAR(50) NOT NULL,
  license_expiry      DATE NOT NULL,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_rides         INTEGER NOT NULL DEFAULT 0,
  cancellation_count  INTEGER NOT NULL DEFAULT 0,
  host_no_show_count  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrate:down
DROP TABLE IF EXISTS driver_profiles;