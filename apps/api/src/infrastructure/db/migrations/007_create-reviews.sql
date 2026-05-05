-- migrate:up
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id       UUID NOT NULL REFERENCES rides(id) ON DELETE RESTRICT,
  reviewer_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewee_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating        INTEGER NOT NULL,
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reviews_rating_check
    CHECK (rating >= 1 AND rating <= 5),

  CONSTRAINT reviews_unique_per_ride
    UNIQUE (ride_id, reviewer_id, reviewee_id),

  CONSTRAINT reviews_no_self_review
    CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id
  ON reviews(reviewee_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id
  ON reviews(reviewer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_ride_id
  ON reviews(ride_id);

-- migrate:down
DROP TABLE IF EXISTS reviews;