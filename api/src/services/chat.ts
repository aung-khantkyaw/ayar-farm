import { MessageType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { getIO } from "../socket";

export class ChatService {
    public static async getUserConversations(userId: string) {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profile_picture: true,
                                user_type: true
                            }
                        }
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true
                    }
                }
            },
            orderBy: { lastMessageTime: 'desc' }
        });

        // Calculate unread count for each conversation
        const payload = await Promise.all(conversations.map(async (conv) => {
            const participant = conv.participants.find(p => p.userId === userId);
            let unreadCount = 0;
            if (participant && participant.lastReadAt) {
                unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        createdAt: { gt: participant.lastReadAt }
                    }
                });
            }
            return {
                ...conv,
                unreadCount
            };
        }));

        return payload;
    }

    public static async markAsRead(conversationId: string, userId: string) {
        await prisma.conversationParticipant.updateMany({
            where: { conversationId, userId },
            data: { lastReadAt: new Date() }
        });
    }


    public static async getConversationById(conversationId: string, userId: string) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profile_picture: true,
                                user_type: true
                            }
                        }
                    }
                },
                moderators: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true
                    }
                }
            }
        });

        return conversation;
    }

    public static async createDirectConversation(userId: string, participantId: string) {
        // Check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                type: 'DIRECT',
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: participantId } } }
                ]
            }
        });

        if (existing) return existing;

        return await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                participants: {
                    create: [
                        { userId },
                        { userId: participantId }
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profile_picture: true
                            }
                        }
                    }
                }
            }
        });
    }

    public static async createGroupConversation(ownerId: string, name: string, description: string | undefined, participantIds: string[], imageUrl?: string) {
        // Parse participantIds if it's a string
        let parsedParticipantIds: string[] = [];
        if (typeof participantIds === 'string') {
            try {
                parsedParticipantIds = JSON.parse(participantIds);
            } catch {
                parsedParticipantIds = [participantIds];
            }
        } else {
            parsedParticipantIds = participantIds || [];
        }
        
        const allParticipants = Array.from(new Set([ownerId, ...parsedParticipantIds]));
        
        // Validate all users exist
        const existingUsers = await prisma.users.findMany({
            where: { id: { in: allParticipants } },
            select: { id: true }
        });
        
        if (existingUsers.length !== allParticipants.length) {
            const missingUsers = allParticipants.filter(id => !existingUsers.some(u => u.id === id));
            throw new Error(`Users not found: ${missingUsers.join(', ')}`);
        }
        
        return await prisma.conversation.create({
            data: {
                type: 'GROUP',
                name,
                description,
                imageUrl,
                ownerId,
                participants: {
                    create: allParticipants.map(id => ({ userId: id }))
                },
                moderators: {
                    create: { userId: ownerId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profile_picture: true
                            }
                        }
                    }
                }
            }
        });
    }

    public static async getMessages(conversationId: string, userId: string, limit: number = 50, before?: string) {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId }
        });

        if (!participant) throw new Error("Not a participant");

        return await prisma.message.findMany({
            where: {
                conversationId,
                ...(before && { createdAt: { lt: new Date(before) } })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    public static async sendMessage(conversationId: string, userId: string, type: string, content?: string, file?: any) {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId }
        });

        if (!participant) throw new Error("Not a participant");

        const message = await prisma.message.create({
            data: {
                conversationId,
                userId,
                type: type as MessageType,
                content,
                fileUrl: file?.path,
                fileName: file?.originalname,
                fileSize: file?.size
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profile_picture: true
                    }
                }
            }
        });

        // Update conversation last message
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessage: content || `Sent a ${type.toLowerCase()}`,
                lastMessageTime: new Date()
            }
        });

        // Emit to conversation room AND all participants
        try {
            const io = getIO();
            io.to(`conversation:${conversationId}`).emit("message:new", message);
            
            // Get all participants and emit to their user rooms
            const participants = await prisma.conversationParticipant.findMany({
                where: { conversationId },
                select: { userId: true }
            });
            
            participants.forEach(p => {
                io.to(`user:${p.userId}`).emit("message:new", message);
            });
        } catch (e) {
            console.warn("Socket emit failed", e);
        }

        return message;
    }

    public static async addParticipants(conversationId: string, userId: string, participantIds: string[]) {
        // Verify user is moderator or owner
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { moderators: true }
        });

        if (!conversation || (conversation.ownerId !== userId && !conversation.moderators.some(m => m.userId === userId))) {
            throw new Error("Not authorized");
        }

        await prisma.conversationParticipant.createMany({
            data: participantIds.map(id => ({ conversationId, userId: id })),
            skipDuplicates: true
        });
    }

    public static async removeParticipant(conversationId: string, userId: string, participantId: string) {
        // Verify user is moderator or owner
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { moderators: true }
        });

        if (!conversation || (conversation.ownerId !== userId && !conversation.moderators.some(m => m.userId === userId))) {
            throw new Error("Not authorized");
        }

        await prisma.conversationParticipant.deleteMany({
            where: { conversationId, userId: participantId }
        });
    }

    public static async leaveConversation(conversationId: string, userId: string) {
        await prisma.conversationParticipant.deleteMany({
            where: { conversationId, userId }
        });
    }

    public static async deleteConversation(conversationId: string, userId: string) {
        // Find the conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        // Check if user is the owner of the conversation (only owner can delete)
        if (conversation.ownerId !== userId) {
            throw new Error("Only the owner can delete this conversation");
        }

        // Delete all messages in the conversation
        await prisma.message.deleteMany({
            where: { conversationId }
        });

        // Delete conversation participants
        await prisma.conversationParticipant.deleteMany({
            where: { conversationId }
        });

        // Delete conversation moderators
        await prisma.conversationModerator.deleteMany({
            where: { conversationId }
        });

        // Finally, delete the conversation
        await prisma.conversation.delete({
            where: { id: conversationId }
        });
    }
}
