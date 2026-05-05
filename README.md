# Infra Setup:

## What

Sets up the complete backend infrastructure and database schema for Route Mate.

## Changes

- Yarn workspaces + Turborepo monorepo setup
- @route-mate/shared package for cross-app type sharing
- Fastify server with typed config validation
- Docker Compose with PostgreSQL 15 + PostGIS and Redis 7
- Custom migration runner using tsx + plain SQL files
- 9 database migrations covering full schema:
  users, driver_profiles, vehicles, rides, bookings,
  payments, reviews, identity_verifications
- Foreign keys, check constraints, partial indexes

## How to test

1. docker compose up -d (from docker/)
2. cd apps/api && yarn migrate:up
3. docker exec -it route-mate-postgres psql -U routemate -d routemate_db -c "\dt"
   → should show all 9 tables
4. yarn dev
   → PostgreSQL connected
   → Redis connected
   → Server listening at 0.0.0.0:3000

## Notes

- Geo index (GIST) on rides.origin_location powers location search
- Partial indexes on bookings cover only active statuses
- Migration runner tracks applied migrations in migrations table
