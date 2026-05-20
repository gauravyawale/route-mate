-- migrate:up
ALTER TABLE rides
  ADD COLUMN route_line GEOGRAPHY(LINESTRING, 4326);

-- Index for route corridor search
CREATE INDEX IF NOT EXISTS idx_rides_route_line
  ON rides USING GIST(route_line);

-- migrate:down
ALTER TABLE rides
  DROP COLUMN IF EXISTS route_line;