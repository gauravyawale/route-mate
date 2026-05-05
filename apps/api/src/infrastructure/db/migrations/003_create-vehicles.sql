-- migrate:up
CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  make          VARCHAR(50) NOT NULL,
  model         VARCHAR(50) NOT NULL,
  year          INTEGER NOT NULL,
  color         VARCHAR(30) NOT NULL,
  plate_number  VARCHAR(20) NOT NULL UNIQUE,
  total_seats   INTEGER NOT NULL,
  vehicle_type  VARCHAR(10) NOT NULL DEFAULT 'car',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT vehicles_type_check
    CHECK (vehicle_type IN ('car', 'bike')),

  CONSTRAINT vehicles_bike_seats_check
    CHECK (vehicle_type != 'bike' OR total_seats = 1),

  CONSTRAINT vehicles_year_check
    CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);

-- migrate:down
DROP TABLE IF EXISTS vehicles;