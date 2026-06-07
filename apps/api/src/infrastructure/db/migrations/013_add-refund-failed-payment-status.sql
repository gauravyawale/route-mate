-- migrate:up
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments
ADD CONSTRAINT payments_status_check
CHECK (status IN (
  'pending',
  'success',
  'failed',
  'refunded',
  'refund_failed'
));