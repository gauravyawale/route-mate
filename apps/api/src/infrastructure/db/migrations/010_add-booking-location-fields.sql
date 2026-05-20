-- migrate:up
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS hop_in_address   TEXT,
  ADD COLUMN IF NOT EXISTS hop_in_location  GEOGRAPHY(POINT, 4326),
  ADD COLUMN IF NOT EXISTS hop_off_address  TEXT,
  ADD COLUMN IF NOT EXISTS hop_off_location GEOGRAPHY(POINT, 4326);

-- migrate:down
ALTER TABLE bookings
  DROP COLUMN IF EXISTS hop_in_address,
  DROP COLUMN IF EXISTS hop_in_location,
  DROP COLUMN IF EXISTS hop_off_address,
  DROP COLUMN IF EXISTS hop_off_location;