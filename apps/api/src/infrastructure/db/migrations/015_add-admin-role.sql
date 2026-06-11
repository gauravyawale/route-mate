-- migrate:up
ALTER TABLE users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- migrate:down
ALTER TABLE users DROP COLUMN role;