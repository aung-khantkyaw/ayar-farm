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

// Keep ai-processor alive by pinging RAG health endpoint
const RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:8001';

const keepAIProcessorAlive = () => {
  setInterval(async () => {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/health`);
      if (response.ok) {
        console.log('✅ AI Processor health check passed');
      } else {
        console.warn('⚠️  AI Processor health check failed');
      }
    } catch (error) {
      console.error('❌ AI Processor health check error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Start keep-alive ping for ai-processor
  keepAIProcessorAlive();
});

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly more than keepAliveTimeout
server.timeout = 120000; // 2 minutes for long-running requests