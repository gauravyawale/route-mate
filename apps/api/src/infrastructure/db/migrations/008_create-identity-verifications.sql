-- migrate:up
CREATE TABLE IF NOT EXISTS identity_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type              VARCHAR(20) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider          VARCHAR(30) NOT NULL,
  provider_ref      VARCHAR(100),
  submitted_at      TIMESTAMPTZ,
  verified_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT identity_type_check
    CHECK (type IN ('aadhaar','pan','license','rc')),

  CONSTRAINT identity_status_check
    CHECK (status IN ('pending','submitted','verified','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id
  ON identity_verifications(user_id, type, status);

-- migrate:down
DROP TABLE IF EXISTS identity_verifications;