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

const wakeUpAIProcessor = async () => {
  const maxRetries = 15;
  const retryDelay = 4000; // 4 seconds

  console.log('🔄 Waking up AI Processor...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (response.ok) {
        console.log('✅ AI Processor is awake and ready');
        return true;
      }
    } catch (error) {
      console.log(`⏳ Wake-up attempt ${i + 1}/${maxRetries} failed, retrying...`);
    }
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.log('⚠️  Failed to wake up AI Processor after multiple attempts');
  return false;
};

const keepAIProcessorAlive = () => {
  setInterval(async () => {
    try {
      const response = await fetch(`${RAG_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
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

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  
  // Wake up AI processor on server startup
  await wakeUpAIProcessor();
  
  // Start keep-alive ping for ai-processor
  keepAIProcessorAlive();
});

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly more than keepAliveTimeout
server.timeout = 120000; // 2 minutes for long-running requests