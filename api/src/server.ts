import app from "./app";
import dotenv from "dotenv";
import http from "http";
import initSocket from "./socket";
import registerSocketHandlers from "./sockets";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer(app);

// initialize socket.io and register handlers
const io = initSocket(server);
registerSocketHandlers(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly more than keepAliveTimeout
server.timeout = 120000; // 2 minutes for long-running requests