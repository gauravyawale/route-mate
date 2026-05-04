import Fastify from "fastify";
import type { RideStatus } from "@route-mate/shared";

const app = Fastify({ logger: true });

// Temporary test — delete after confirming
const status: RideStatus = "open";
console.log("Shared type works:", status);

export default app;
