import { Server } from "socket.io"; //socket.io main server class
import socketAuth from "./socketAuth.js"; //socket authentication middleware

let io;
//socket.IO server initialization
export const initSocket = (httpServer) => {
  //determine which frontend to allow socket.IO connection
  const corsOrigin =
    process.env.SOCKET_CORS_ORIGIN ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";

    //create socket.IO server and connect with existing http server
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST"],
    },

    // Wait max 10 seconds to establish socket connection
    connectTimeout: 10000,

    pingTimeout: 60000, // Check client still alive or not 
    pingInterval: 25000, //Detect dead/stale connection

    // Allow requests from both polling and websocket transports
    //polling: Initially communication through HTTP req
    // websockets: Actual persistent real-time connection
    transports: ["polling", "websocket"],

    allowUpgrades: true, // allow to upgrade from polling to websocket

    // Maximum HTTP buffer size (for base64-encoded payloads)
    maxHttpBufferSize: 1e6,
  });

  // Authentication middleware
  // Random user cannot connect admin socket
  io.use(socketAuth);

  // Connection handler 
  //after sucessfully authenticated client connects,the code runs
  io.on("connection", (socket) => {
    console.log(
      `Socket connected: ${socket.userName} (${socket.userRole}) [${socket.id}]`
    );

    // Join user-specific room (for future customer notifications)
    socket.join(`user:${socket.userId}`);

    // Join admin room if the connected user is an admin
    if (socket.userRole === "admin") {
      socket.join("admins");
      console.log(`Admin joined room: ${socket.userName}`);
    }

    //  Disconnect event
    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.userName} [${socket.id}] — ${reason}`
      );
    });
  });

  console.log("Socket.IO server initialized");
};

// ─────────────────────────────────────────────────────────────────────────────
// EMIT HELPERS
// ─────────────────────────────────────────────────────────────────────────────
// These are called from controllers/services — NOT from socket event handlers.
// io.to("admins").emit() sends to ALL connected admins (including the sender
// if they are an admin). This is correct because these emissions originate
// from server-side code (after a DB write), not from a client action.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Broadcast an event to all connected admin sockets.
 * @param {string} event - Event name (e.g., "notification:new-order")
 * @param {object} data  - Payload to send
 */
export const emitToAdmins = (event, data) => {
  if (!io) {
    console.warn("Socket.IO not initialized — cannot emit:", event);
    return;
  }

  io.to("admins").emit(event, data);
};

/**
 * Emit an event to a specific user's room.
 * @param {string} userId  - The user's MongoDB ObjectId string
 * @param {string} event   - Event name
 * @param {object} data    - Payload
 */
export const emitToUser = (userId, event, data) => {
  if (!io) {
    console.warn("Socket.IO not initialized — cannot emit:", event);
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Get the number of connected admin sockets.
 * Useful for logging / metrics.
 */
export const getOnlineAdminCount = () => {
  if (!io) return 0;

  const adminsRoom = io.sockets.adapter.rooms.get("admins");
  return adminsRoom ? adminsRoom.size : 0;
};

/**
 * Get the Socket.IO server instance.
 * Rarely needed — prefer emitToAdmins/emitToUser.
 */
export const getIO = () => io;
