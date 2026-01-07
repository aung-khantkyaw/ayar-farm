import { Request, Response } from "express";
import { ChatService } from "../services/chat";
import { prisma } from "../prisma/client";

export class ChatController {
    public async getConversations(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const conversations = await ChatService.getUserConversations(userId);
            res.status(200).json({ message: "Get conversations successful", data: conversations });
        } catch (error) {
            res.status(500).json({ message: `Error fetching conversations: ${error}` });
        }
    }

    public async searchGroups(req: Request, res: Response): Promise<void> {
        try {
            const { q } = req.query;
            const query = String(q || '').trim();
            
            if (!query) {
                res.status(200).json({ data: [] });
                return;
            }

            const groups = await prisma.conversation.findMany({
                where: {
                    type: 'GROUP',
                    name: { contains: query, mode: 'insensitive' },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    profile_picture: true,
                                },
                            },
                        },
                    },
                },
                take: 20,
            });
            
            res.status(200).json({ data: groups });
        } catch (error) {
            res.status(500).json({ message: `Error searching groups: ${error}` });
        }
    }

    public async getConversation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;
            const conversation = await ChatService.getConversationById(id, userId);
            
            if (!conversation) {
                res.status(404).json({ message: "Conversation not found" });
                return;
            }
            
            res.status(200).json({ message: "Get conversation successful", data: conversation });
        } catch (error) {
            res.status(500).json({ message: `Error fetching conversation: ${error}` });
        }
    }

    public async createDirectConversation(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { participantId } = req.body;
            
            const conversation = await ChatService.createDirectConversation(userId, participantId);
            res.status(201).json({ message: "Conversation created", data: conversation });
        } catch (error) {
            res.status(500).json({ message: `Error creating conversation: ${error}` });
        }
    }

    public async createGroupConversation(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { name, description, participantIds } = req.body;
            const files = (req as any).files as Express.Multer.File[];
            const imageUrl = files && files.length > 0 ? files[0].path : undefined;
            
            const conversation = await ChatService.createGroupConversation(userId, name, description, participantIds, imageUrl);
            res.status(201).json({ message: "Group created", data: conversation });
        } catch (error) {
            res.status(500).json({ message: `Error creating group: ${error}` });
        }
    }

    public async getMessages(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = (req as any).user.id;
            const { limit, before } = req.query;
            
            const messages = await ChatService.getMessages(conversationId, userId, Number(limit) || 50, before as string);
            res.status(200).json({ message: "Get messages successful", data: messages });
        } catch (error) {
            res.status(500).json({ message: `Error fetching messages: ${error}` });
        }
    }

    public async sendMessage(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = (req as any).user.id;
            const { content, type } = req.body;
            const file = (req as any).file;
            
            const message = await ChatService.sendMessage(conversationId, userId, type || 'TEXT', content, file);
            res.status(201).json({ message: "Message sent", data: message });
        } catch (error) {
            res.status(500).json({ message: `Error sending message: ${error}` });
        }
    }

    public async addParticipants(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = (req as any).user.id;
            const { participantIds } = req.body;
            
            await ChatService.addParticipants(conversationId, userId, participantIds);
            res.status(200).json({ message: "Participants added" });
        } catch (error) {
            res.status(500).json({ message: `Error adding participants: ${error}` });
        }
    }

    public async removeParticipant(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId, participantId } = req.params;
            const userId = (req as any).user.id;
            
            await ChatService.removeParticipant(conversationId, userId, participantId);
            res.status(200).json({ message: "Participant removed" });
        } catch (error) {
            res.status(500).json({ message: `Error removing participant: ${error}` });
        }
    }

    public async leaveConversation(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = (req as any).user.id;
            
            await ChatService.leaveConversation(conversationId, userId);
            res.status(200).json({ message: "Left conversation" });
        } catch (error) {
            res.status(500).json({ message: `Error leaving conversation: ${error}` });
        }
    }

    public async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = (req as any).user.id;
            
            await ChatService.markAsRead(conversationId, userId);
            res.status(200).json({ message: "Conversation marked as read" });
        } catch (error) {
            res.status(500).json({ message: `Error marking conversation as read: ${error}` });
        }
    }
}

