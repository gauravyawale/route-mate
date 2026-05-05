-- migrate:up
CREATE INDEX IF NOT EXISTS idx_bookings_status_expires_at
  ON bookings USING btree (status, expires_at)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_bookings_ride_id_status
  ON bookings USING btree (ride_id, status)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_payments_booking_id
  ON payments USING btree (booking_id);

-- migrate:down
DROP INDEX IF EXISTS idx_bookings_status_expires_at;
DROP INDEX IF EXISTS idx_bookings_ride_id_status;
DROP INDEX IF EXISTS idx_payments_booking_id;