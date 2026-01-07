import { Router } from "express";
import { ChatController } from "../controllers/chat";
import { authenticate } from "../middlewares";
import { uploadImage, uploadFile } from "../middlewares/upload";

const chat = Router();
const chatController = new ChatController();

chat.get("/", (_req, res) => res.json({ ok: true, message: "Chat API is running" }));

// Conversations
chat.get("/conversations", authenticate, (req, res) => chatController.getConversations(req, res));
chat.get("/conversations/:id", authenticate, (req, res) => chatController.getConversation(req, res));
chat.post("/conversations/direct", authenticate, (req, res) => chatController.createDirectConversation(req, res));
chat.post("/conversations/group", authenticate, uploadImage.any(), (req, res) => chatController.createGroupConversation(req, res));

// Messages
chat.get("/conversations/:conversationId/messages", authenticate, (req, res) => chatController.getMessages(req, res));
chat.post("/conversations/:conversationId/messages", authenticate, uploadFile.single('file'), (req, res) => chatController.sendMessage(req, res));

// Participants
chat.post("/conversations/:conversationId/participants", authenticate, (req, res) => chatController.addParticipants(req, res));
chat.delete("/conversations/:conversationId/participants/:participantId", authenticate, (req, res) => chatController.removeParticipant(req, res));
chat.post("/conversations/:conversationId/leave", authenticate, (req, res) => chatController.leaveConversation(req, res));
chat.post("/conversations/:conversationId/read", authenticate, (req, res) => chatController.markAsRead(req, res));

export default chat;
