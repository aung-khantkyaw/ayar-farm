import { Request, Response } from "express";
import { ChatRoomService } from "../services/chat-room";

export class ChatRoomController {
    public async getChatRooms(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { chatRooms } = await ChatRoomService.getAllChatRooms(userId);
            res.status(200).json({ message: "Get chat rooms successfully", chatRooms });
        } catch (error) {
            res.status(500).json({ message: `Error fetching chat rooms: ${error}` });
            console.error("Error fetching chat rooms:", error);
        }
    }

    public async getChatRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id } = req.params;
            const { chatRoom } = await ChatRoomService.getChatRoomById(id, userId);
            
            if (!chatRoom) {
                res.status(404).json({ message: "Chat room not found" });
                return;
            }

            res.status(200).json({ message: "Get chat room successfully", chatRoom });
        } catch (error) {
            res.status(500).json({ message: `Error fetching chat room: ${error}` });
            console.error("Error fetching chat room:", error);
        }
    }

    public async createChatRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { title } = req.body;
            const { chatRoom } = await ChatRoomService.createChatRoom(userId, title);
            res.status(201).json({ message: "Chat room created successfully", chatRoom });
        } catch (error) {
            res.status(500).json({ message: `Error creating chat room: ${error}` });
            console.error("Error creating chat room:", error);
        }
    }

    public async updateChatRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id } = req.params;
            const { title } = req.body;
            const { chatRoom } = await ChatRoomService.updateChatRoom(id, userId, title);
            res.status(200).json({ message: "Chat room updated successfully", chatRoom });
        } catch (error) {
            res.status(500).json({ message: `Error updating chat room: ${error}` });
            console.error("Error updating chat room:", error);
        }
    }

    public async deleteChatRoom(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            const { id } = req.params;
            const { chatRoom } = await ChatRoomService.deleteChatRoom(id, userId);
            res.status(200).json({ message: "Chat room deleted successfully", chatRoom });
        } catch (error) {
            res.status(500).json({ message: `Error deleting chat room: ${error}` });
            console.error("Error deleting chat room:", error);
        }
    }
}
