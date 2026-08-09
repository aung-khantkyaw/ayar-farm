import { Router } from "express";
import { ChatRoomController } from "../controllers/chat-room";
import { authenticate } from "../middlewares";

const chatRoom = Router();
const chatRoomController = new ChatRoomController();

chatRoom.get("/", authenticate, (req, res) => chatRoomController.getChatRooms(req, res));
chatRoom.get("/:id", authenticate, (req, res) => chatRoomController.getChatRoom(req, res));
chatRoom.post("/", authenticate, (req, res) => chatRoomController.createChatRoom(req, res));
chatRoom.put("/:id", authenticate, (req, res) => chatRoomController.updateChatRoom(req, res));
chatRoom.delete("/:id", authenticate, (req, res) => chatRoomController.deleteChatRoom(req, res));

export default chatRoom;
