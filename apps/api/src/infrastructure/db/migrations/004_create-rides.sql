-- migrate:up
CREATE TABLE IF NOT EXISTS rides (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id             UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE RESTRICT,
  vehicle_id            UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  origin_address        TEXT NOT NULL,
  origin_location       GEOGRAPHY(POINT, 4326) NOT NULL,
  destination_address   TEXT NOT NULL,
  destination_location  GEOGRAPHY(POINT, 4326) NOT NULL,
  scheduled_at          TIMESTAMPTZ NOT NULL,
  seats_total           INTEGER NOT NULL,
  seats_available       INTEGER NOT NULL,
  price_per_seat        NUMERIC(10,2) NOT NULL,
  status                VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  cancelled_reason      TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rides_status_check
    CHECK (status IN ('scheduled','open','in_progress','completed','cancelled')),

  CONSTRAINT rides_seats_available_check
    CHECK (seats_available >= 0 AND seats_available <= seats_total),

  CONSTRAINT rides_price_check
    CHECK (price_per_seat > 0)
);

-- Geo index — powers "find rides near me" query
CREATE INDEX IF NOT EXISTS idx_rides_origin_location
  ON rides USING GIST(origin_location);

-- Status + time index — powers filtering open future rides
CREATE INDEX IF NOT EXISTS idx_rides_status_scheduled
  ON rides(status, scheduled_at);

-- Driver's rides lookup
CREATE INDEX IF NOT EXISTS idx_rides_driver_id
  ON rides(driver_id);

-- migrate:down
DROP TABLE IF EXISTS rides;