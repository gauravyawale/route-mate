-- migrate:up
CREATE TABLE IF NOT EXISTS driver_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  license_number   VARCHAR(50) NOT NULL,
  license_expiry   DATE NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_applications_status
ON driver_applications(status)
WHERE status = 'pending';

-- migrate:down
DROP TABLE IF EXISTS driver_applications;