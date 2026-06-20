# Route Mate — Backend Setup

A carpooling app (Hopr-style) backend built with Fastify, PostgreSQL + PostGIS,
Redis, BullMQ, and Socket.io. Users act as both riders and drivers on a single
account, toggling between modes.

This README covers backend (`apps/api`) and admin web (`apps/web`) setup.
Mobile app setup is not yet available.

---

## Prerequisites

- Node.js v20+
- Yarn (classic, v1.x)
- Docker Desktop (running)
- A Razorpay account in **test mode** (free, no business verification needed)
  — see [razorpay.com](https://razorpay.com)

---

## 1. Clone and install

```bash
git clone <repo-url>
cd route-mate
yarn install
```

This installs dependencies for all workspaces (`apps/api`, `apps/web`,
`packages/shared`) via Yarn workspaces.

---

## 2. Start infrastructure (PostgreSQL + Redis)

```bash
cd docker
docker compose up -d
```

This starts:

- `postgres` — PostgreSQL 15 with PostGIS extension, on `localhost:5432`
- `redis` — Redis 7, on `localhost:6379`

Verify both are healthy:

```bash
docker ps
```

You should see `route-mate-postgres` and `route-mate-redis` with status `Up`.

---

## 3. Configure environment variables

Create `apps/api/.env` (copy from `.env.example` if present):

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://routemate:routemate_dev@localhost:5432/routemate_db
REDIS_URL=redis://localhost:6379

JWT_SECRET=<any string, 32+ characters>
JWT_REFRESH_SECRET=<any different string, 32+ characters>
OTP_EXPIRY_SECONDS=300

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your test key secret>
RAZORPAY_WEBHOOK_SECRET=<any placeholder — webhooks not used in dev>
```

Get Razorpay test keys from **Dashboard → Settings → API Keys → Generate Test
Key**. No live/business account needed for development.

---

## 4. Run database migrations

```bash
cd apps/api
yarn migrate:up
```

This applies all migrations in order, creating the full schema: `users`,
`driver_profiles`, `vehicles`, `rides`, `bookings`, `payments`, `reviews`,
`identity_verifications`, `driver_applications`, plus supporting indexes and
constraints.

Verify:

```bash
docker exec -it route-mate-postgres psql -U routemate -d routemate_db -c "\dt"
```

You should see all the tables listed above.

---

## 5. Create an admin user

The app has no signup form for admins — the first admin is set directly in
the database.

1. Start the API (see step 6) and use the `send-otp` / `verify-otp` endpoints
   to register a normal user with your phone number (in dev mode, the OTP is
   logged to the console instead of sent via SMS — it's always `123456`).
2. Promote that user to admin:

```bash
docker exec -it route-mate-postgres psql -U routemate -d routemate_db
```

```sql
UPDATE users SET role = 'admin' WHERE phone = '+91XXXXXXXXXX';
```

---

## 6. Start the API server

```bash
cd apps/api
yarn dev
```

Expected output:
✅ PostgreSQL connected

✅ Redis connected

✅ BullMQ Redis connected

Server listening at http://0.0.0.0:3000

✅ Socket.io started

---

## 7. Start the background worker (separate terminal)

```bash
cd apps/api
yarn dev:worker
```

Expected output:
✅ Workers process started

[booking.worker] worker is ready and listening for jobs

This process handles booking notifications and payment refunds via BullMQ.
It must run as a **separate process** from the API server — this isn't
optional, it mirrors how it will be deployed in production (separate
container/process).

> **Windows users:** BullMQ's blocking Redis commands are unreliable on native
> Windows. If the worker logs "ready" but never processes jobs, run the worker
> inside Docker instead — see `docker-compose.yml`'s `worker` service, or use
> WSL2.

---

## 8. Start the admin web app (optional, separate terminal)

```bash
cd apps/web
yarn dev
```

Open `http://localhost:3001`. Log in with the phone number you promoted to
admin in step 5. Non-admin users are denied access at login.

---

## Verifying the setup

Use the Bruno collection in `/route-mate-collection.zip` (or any HTTP client) to test the API
directly:

POST /api/v1/auth/send-otp { "country_code": "+91", "phone": "9876543210" }

POST /api/v1/auth/verify-otp { "country_code": "+91", "phone": "9876543210", "otp": "123456" }

In development, OTP is always `123456` and is printed to the API console
instead of sent via SMS.

A full request flow (create ride → request booking → confirm → pay → complete)
is documented in the Bruno collection.

---

## Project Structure

route-mate/

├── apps/

│ ├── api/ ← Fastify backend

│ ├── web/ ← Next.js admin dashboard

│ └── mobile/ ← not yet started

├── packages/

│ └── shared/ ← shared types, Zod schemas, constants

├── docker/ ← docker-compose for Postgres + Redis (+ optional worker)

└── bruno/ ← API collection for manual testing(Not Available)

---

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Backend   | Fastify + TypeScript                |
| Database  | PostgreSQL 15 + PostGIS             |
| Cache     | Redis 7                             |
| Job Queue | BullMQ (separate Redis connection)  |
| Real-time | Socket.io (JWT-authenticated)       |
| Payments  | Razorpay (test mode, UPI)           |
| Admin Web | Next.js 16 + shadcn/ui + Tailwind 4 |
| Monorepo  | Yarn workspaces + Turborepo         |

---

## Known Limitations (v1)

- Razorpay webhooks are not configured — payment confirmation relies on
  client-side signature verification only. Add webhooks before production.
- No automated KYC for driver verification — admin approves manually.
- BullMQ workers may not process jobs reliably on native Windows; use Docker
  or WSL2.
- Mobile app (React Native) is not yet built — riders and drivers currently
  have no client besides direct API access.
