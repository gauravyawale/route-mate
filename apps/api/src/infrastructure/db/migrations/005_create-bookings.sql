-- migrate:up
CREATE TABLE IF NOT EXISTS bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id                 UUID NOT NULL REFERENCES rides(id) ON DELETE RESTRICT,
  rider_id                UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seats_booked            INTEGER NOT NULL DEFAULT 1,
  total_amount            NUMERIC(10,2) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
  expires_at              TIMESTAMPTZ,
  confirmed_at            TIMESTAMPTZ,
  paid_at                 TIMESTAMPTZ,
  no_show_reported_at     TIMESTAMPTZ,
  payment_attempts        INTEGER NOT NULL DEFAULT 0,
  last_payment_attempt_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(ride_id, rider_id),

  CONSTRAINT bookings_status_check
    CHECK (status IN (
      'pending','confirmed','payment_pending',
      'paid','cancelled','expired','no_show'
    )),

  CONSTRAINT bookings_seats_check
    CHECK (seats_booked >= 1 AND seats_booked <= 6),

  CONSTRAINT bookings_amount_check
    CHECK (total_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_bookings_ride_id
  ON bookings(ride_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_rider_id
  ON bookings(rider_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_status_expires_at
  ON bookings(status, expires_at);

-- migrate:down
DROP TABLE IF EXISTS bookings;