-- migrate:up
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN (
  'pending',
  'confirmed',
  'paid',
  'cancelled',
  'no_seat',
  'no_show'
));
