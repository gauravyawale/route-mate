# Route Mate — Carpooling Platform

A carpooling app (Hopr/BlaBlaCar-style) built with Fastify, PostgreSQL + PostGIS, Redis, BullMQ, and Socket.io. Users act as both riders and drivers on a single account, toggling between modes. Includes a React Native mobile app, Next.js admin dashboard, and full production deployment.

---

## 🚀 Live Demo & Quick Access

Scan the QR codes below to test the deployed application immediately.

| Platform             | Access Method                                                                                                 | QR Code                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 🌐 **Web Dashboard** | [Visit Admin Board](https://route-mate-web-iota.vercel.app)                                                   | <img src="./apps/web/public/route-mate-qr.png" width="100" /> |
| 📱 **Mobile App**    | [Download APK (Android)](https://github.com/your-username/route-mate/releases/latest/download/route-mate.apk) | <img src="qr-mobile.png" width="100" />                       |
| 🔧 **API Docs**      | [Bruno Collection](./route-mate-collection.zip)                                                               | -                                                             |

### Try it instantly — no signup required

Tap **"Try Demo"** on the login screen (mobile) or **"Try Demo Admin"** (web) to explore the app pre-loaded with sample data:

- 🧳 **Demo Rider** — view bookings across various statuses (pending, confirmed, paid, cancelled)
- 🚗 **Demo Driver** — manage rides across Pune & Bangalore with pending booking requests to confirm
- 🛠️ **Demo Admin** — view platform stats, driver applications, and manage rides/users from the web dashboard

### Manual login (OTP-based)

- Any phone number can be used to sign up — OTP is currently fixed at `123456` for development/demo purposes (SMS provider integration pending business verification)
- **Admin access:** `+91 9860116098`

> **Note:** The mobile app is built with **Expo SDK 54** and supports **Dual-Mode** (Rider/Driver toggle).

---

## Local Development Setup

### Prerequisites

- Node.js v20+
- Yarn (classic, v1.x)
- Docker Desktop (running)
- A Razorpay account in test mode (free, no business verification needed) — see [razorpay.com](https://razorpay.com)
- (Optional) AWS account with an S3 bucket, for image uploads

### 1. Clone and install

```bash
git clone <repo-url>
cd route-mate
yarn install
```

This installs dependencies for all workspaces (`apps/api`, `apps/web`, `apps/mobile`, `packages/shared`) via Yarn workspaces.

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
cd docker
docker compose up -d
```

This starts:

- **postgres** — PostgreSQL 15 with PostGIS extension, on `localhost:5432`
- **redis** — Redis 7, on `localhost:6379`

Verify both are healthy:

```bash
docker ps
```

You should see `route-mate-postgres` and `route-mate-redis` with status `Up`.

### 3. Configure environment variables

Create `apps/api/.env`:

```env
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

# Optional — required only for image uploads (avatars/vehicles)
AWS_ACCESS_KEY_ID=<your AWS access key>
AWS_SECRET_ACCESS_KEY=<your AWS secret key>
AWS_REGION=<e.g. eu-north-1>
AWS_S3_BUCKET_NAME=<your S3 bucket name>

# Optional — SMS provider, not required in dev (OTP is hardcoded)
FAST2SMS_API_KEY=<optional, unused in dev>
```

Get Razorpay test keys from **Dashboard → Settings → API Keys → Generate Test Key**. No live/business account needed for development.

### 4. Run database migrations

```bash
cd apps/api
yarn migrate:up
```

This applies all migrations in order, creating the full schema: `users`, `driver_profiles`, `vehicles`, `rides`, `bookings`, `payments`, `reviews`, `identity_verifications`, `driver_applications`, plus supporting indexes and constraints.

Verify:

```bash
docker exec -it route-mate-postgres psql -U routemate -d routemate_db -c "\dt"
```

You should see all the tables listed above.

### 5. Create an admin user

The app has no signup form for admins — the first admin is set directly in the database.

1. Start the API (see step 6) and use the `send-otp` / `verify-otp` endpoints to register a normal user with your phone number (in dev mode, the OTP is logged to the console instead of sent via SMS — it's always `123456`).
2. Promote that user to admin:

```bash
docker exec -it route-mate-postgres psql -U routemate -d routemate_db
```

```sql
UPDATE users SET role = 'admin' WHERE phone = '+91XXXXXXXXXX';
```

### 6. Start the API server

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

### 7. Start the background worker (separate terminal)

```bash
cd apps/api
yarn dev:worker
```

Expected output:
✅ Workers process started
[booking.worker] worker is ready and listening for jobs

This process handles booking notifications and payment refunds via BullMQ. It must run as a separate process from the API server — this isn't optional, it mirrors how it's deployed in production (separate container/process).

> **Windows users:** BullMQ's blocking Redis commands are unreliable on native Windows. If the worker logs "ready" but never processes jobs, run the worker inside Docker instead — see `docker-compose.yml`'s worker service, or use WSL2.

### 8. Start the admin web app (optional, separate terminal)

```bash
cd apps/web
yarn dev
```

Open `http://localhost:3001`. Log in with the phone number you promoted to admin in step 5, or use the **"Try Demo Admin"** button. Non-admin users are denied access at login.

### 9. Start the mobile app (optional, separate terminal)

```bash
cd apps/mobile
npx expo start -c
```

Scan the QR code with **Expo Go** (Android, SDK 54) on your physical device. Ensure your phone and computer are on the same Wi-Fi network, and update `BASE_URL` in `apps/mobile/lib/api.ts` to your machine's local IP (find it via `ipconfig`).

---

## Verifying the Setup

Use the Bruno collection in `/route-mate-collection.zip` (or any HTTP client) to test the API directly:
POST /api/v1/auth/send-otp
{ "country_code": "+91", "phone": "9876543210" }
POST /api/v1/auth/verify-otp
{ "country_code": "+91", "phone": "9876543210", "otp": "123456" }

In development, OTP is always `123456` and is printed to the API console instead of sent via SMS.

A full request flow (create ride → request booking → confirm → pay → complete) is documented in the Bruno collection.

---

## Project Structure

route-mate/
├── apps/
│ ├── api/ ← Fastify backend (REST + Socket.io)
│ ├── web/ ← Next.js Admin Dashboard & User Portal
│ └── mobile/ ← React Native (Expo) – Rider & Driver Modes
├── packages/
│ └── shared/ ← Shared TypeScript types, Zod schemas, constants
├── docker/ ← Docker Compose (Postgres + Redis + Worker)
└── bruno/ ← API collection for testing

---

## Tech Stack

| Layer              | Technology                          |
| ------------------ | ----------------------------------- |
| Backend            | Fastify + TypeScript                |
| Database           | PostgreSQL 15 + PostGIS             |
| Cache              | Redis 7                             |
| Job Queue          | BullMQ (separate Redis connection)  |
| Real-time          | Socket.io (JWT-authenticated)       |
| Push Notifications | Firebase Cloud Messaging (FCM)      |
| Payments           | Razorpay (test mode, UPI)           |
| File Storage       | AWS S3 (presigned URL uploads)      |
| Mobile             | React Native + Expo SDK 54          |
| Admin Web          | Next.js 16 + shadcn/ui + Tailwind 4 |
| Monorepo           | Yarn workspaces + Turborepo         |

---

## Production Deployment

The live demo runs on:

- **Database:** [Supabase](https://supabase.com) (PostgreSQL + PostGIS)
- **Cache/Queue:** [Upstash](https://upstash.com) (Redis)
- **API + Worker:** [Render](https://render.com)
- **Web Admin:** [Vercel](https://vercel.com)
- **File Storage:** [AWS S3](https://aws.amazon.com/s3/) (profile image uploads)
- **Mobile Builds:** [EAS Build](https://expo.dev) (Expo Application Services)

---

## Known Limitations & Next Steps

- **SMS OTP:** Currently uses a fixed development OTP (`123456`); real SMS delivery via Fast2SMS/MSG91 pending business/DLT verification required by TRAI for Indian OTP routes.
- **Webhooks:** Razorpay webhooks are simulated in dev; production requires webhook endpoint configuration (currently relies on client-side signature verification).
- **KYC:** Manual driver approval workflow is in place; automated KYC is a future enhancement.
- **Email notifications:** Not yet implemented; currently relies on Socket.io (real-time) and FCM push notifications (offline delivery).
- **iOS:** Android build is available; iOS build is pending Apple Developer account and TestFlight setup.
