import { Router } from "express";
import { AIChatController } from "../controllers/ai-chat";
import { authenticate } from "../middlewares";

const router = Router();
const aiChatController = new AIChatController();

// All AI chat routes require authentication
router.use(authenticate);

// SSE streaming chat endpoint
router.post("/stream", (req, res) => aiChatController.chatStream(req, res));

// Get chat history
router.get("/history", (req, res) => aiChatController.getChatHistory(req, res));

// Clear chat history
router.delete("/history", (req, res) => aiChatController.clearChatHistory(req, res));

// Health check for RAG service
router.get("/health", (req, res) => aiChatController.checkHealth(req, res));

export default router;
