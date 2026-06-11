import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { config } from "../../config/index.js";
import { queryOne } from "../db/client.js";

// Token payload interface
interface TokenPayload {
  sub: string;
  phone: string;
}

// Extend Socket to carry authenticated user info
interface AuthenticatedSocket extends Socket {
  userId: string;
}

/**
 * Singleton Socket.IO server instance
 * io instance is exported so services can emit events directly
 * e.g. io.to(userId).emit("booking.confirmed", payload)
 */
let io: Server;

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}

/**
 * Initializer
 * Called once from server.ts after Fastify is listening
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // TODO: restrict in production
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // support both for better compatibility
  });

  /**
   * Authentication Middleware
   * Every connection must send a valid JWT access token
   * Client sends: socket = io(url, { auth: { token: accessToken } })
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required."));
      }

      //verify token and extract payload
      const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

      // verify user exists in DB
      const user = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE id = $1`,
        [payload.sub],
      );

      if (!user) {
        return next(new Error("User not found."));
      }

      // attach userId to socket for later use in event handlers
      (socket as AuthenticatedSocket).userId = payload.sub;

      next();
    } catch (err) {
      next(new Error("Invalid or expired token."));
    }
  });

  /**
   * Connection Handler
   * Clients will join a room named after their userId for targeted notifications
   * e.g. io.to(userId).emit("booking.confirmed", payload)
   */
  io.on("connection", (socket) => {
    const userId = (socket as AuthenticatedSocket).userId;

    // join room for this user
    // io.to(userId).emit(...) will reach this socket
    socket.join(userId);

    console.log(`[socket] user ${userId} connected — socket ${socket.id}`);

    // handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`[socket] user ${userId} disconnected — reason: ${reason}`);
    });
  });
  console.log("✅ Socket.io initialized");
  return io;
}
