-- migrate:up
ALTER TABLE rides
ALTER COLUMN status SET DEFAULT 'open';

UPDATE rides SET status = 'open' WHERE status = 'scheduled';