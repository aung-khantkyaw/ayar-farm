import http from "http";
import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function initSocket(server: http.Server) {
  if (io) return io;
  io = new IOServer(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    cors: { 
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true 
    },
  });
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return io;
}

export function emitToAdmins(event: string, payload: any) {
  try {
    getIO().to("admins").emit(event, payload);
  } catch (e) {
    // no-op — server may not be initialized in some scripts
    console.warn("emitToAdmins failed", e);
  }
}

export function emitToUser(userId: string, event: string, payload: any) {
  try {
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    console.warn("emitToUser failed", e);
  }
}

export function emitToAll(event: string, payload: any) {
  try {
    getIO().emit(event, payload);
  } catch (e) {
    console.warn("emitToAll failed", e);
  }
}

export default initSocket;
