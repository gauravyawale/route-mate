-- PostGIS: enables geography/geometry types and spatial queries
-- This is what powers "find rides near me"
CREATE EXTENSION IF NOT EXISTS postgis;

-- uuid-ossp: enables gen_random_uuid() for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify PostGIS loaded correctly
SELECT PostGIS_Version();
