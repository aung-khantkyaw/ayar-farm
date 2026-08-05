import { Server, Socket } from "socket.io";
import { prisma } from "../prisma/client";
import jwt from "jsonwebtoken";

const onlineUsers = new Map<string, string>(); // userId -> socketId

export function registerSocketHandlers(io: Server) {
  io.on("connection", async (socket: Socket) => {
    console.log("socket connected:", socket.id);

    const auth = socket.handshake.auth || {};
    // support either token-based auth or simple userId/userType in handshake
    const token = auth.token as string | undefined;
    let userId = auth.userId as string | undefined;
    let providedType = (auth.userType as string | undefined) ?? undefined;

    if (token) {
      try {
        const secret = process.env.JWT_SECRET ?? "changeme";
        const decoded = jwt.verify(token, secret) as any;
        // accept standard `sub` or custom `userId`
        userId = userId ?? (decoded.sub as string | undefined) ?? (decoded.userId as string | undefined);
        providedType = providedType ?? (decoded.user_type as string | undefined) ?? (decoded.role as string | undefined);
      } catch (err) {
        socket.emit("socket:auth:error", { message: "invalid_token" });
      }
    }

    if (userId) {
      try {
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (user) {
          socket.join(`user:${user.id}`);
          socket.data.user = { id: user.id, user_type: user.user_type };
          if (user.user_type === "ADMIN") socket.join("admins");
          onlineUsers.set(user.id, socket.id);
          io.to("admins").emit("user-online", user.id);
          socket.emit("socket:auth:ok", { id: user.id, user_type: user.user_type });
        } else if (providedType) {
          socket.data.user = { id: userId, user_type: providedType };
          if (providedType === "ADMIN") socket.join("admins");
          socket.join(`user:${userId}`);
          socket.emit("socket:auth:ok", { id: userId, user_type: providedType });
        } else {
          socket.emit("socket:auth:invalid");
        }
      } catch (err) {
        socket.emit("socket:auth:error", { message: String(err) });
      }
    } else {
      socket.emit("socket:welcome", { message: "connected (unauthenticated)" });
    }

    socket.on("subscribe", (room: string) => {
      socket.join(room);
    });
    socket.on("unsubscribe", (room: string) => {
      socket.leave(room);
    });

    // Chat: join conversation rooms
    socket.on("chat:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });
    socket.on("chat:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("admin:notify", (payload: any, cb?: (r: any) => void) => {
      const user = socket.data.user;
      if (!user || user.user_type !== "ADMIN") {
        return cb?.({ ok: false, message: "forbidden" });
      }
      io.to("admins").emit("notification:admin", payload);
      cb?.({ ok: true });
    });

    socket.on("get-online-users", () => {
      socket.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("join_user_room", (data) => {
      const { userId } = data;
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    socket.on("ping", (cb) => cb?.({ ok: true, time: Date.now() }));

    socket.on("disconnect", (reason) => {
      const user = socket.data.user;
      if (user?.id) {
        onlineUsers.delete(user.id);
        io.to("admins").emit("user-offline", user.id);
      }
      console.log("socket disconnected:", socket.id, reason);
    });
  });
}

export default registerSocketHandlers;
