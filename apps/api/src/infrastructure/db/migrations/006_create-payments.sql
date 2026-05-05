-- migrate:up
CREATE TABLE IF NOT EXISTS payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount            NUMERIC(10,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'INR',
  provider          VARCHAR(20) NOT NULL,
  provider_ref      VARCHAR(100),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempt_number    INTEGER NOT NULL DEFAULT 1,
  failure_reason    TEXT,
  refunded_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payments_status_check
    CHECK (status IN ('pending','success','failed','refunded')),

  CONSTRAINT payments_amount_check
    CHECK (amount > 0),

  CONSTRAINT payments_attempt_check
    CHECK (attempt_number >= 1 AND attempt_number <= 3)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id
  ON payments(booking_id, status);

-- migrate:down
DROP TABLE IF EXISTS payments;