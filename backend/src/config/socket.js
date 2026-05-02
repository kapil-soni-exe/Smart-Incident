import { Server } from "socket.io";
import { config } from "./config.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client connected to WebSocket:", socket.id);
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io not initialized yet!");
    return null;
  }
  return io;
};
