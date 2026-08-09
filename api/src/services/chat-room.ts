import { prisma } from '../prisma/client';

export class ChatRoomService {
  static async getAllChatRooms(userId: string) {
    const chatRooms = await prisma.chatRoom.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return { chatRooms };
  }

  static async getChatRoomById(roomId: string, userId: string) {
    const chatRoom = await prisma.chatRoom.findFirst({
      where: { id: roomId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return { chatRoom };
  }

  static async createChatRoom(userId: string, title?: string) {
    const chatRoom = await prisma.chatRoom.create({
      data: {
        userId,
        title: title || 'New Chat',
      },
    });
    return { chatRoom };
  }

  static async updateChatRoom(roomId: string, userId: string, title?: string) {
    const chatRoom = await prisma.chatRoom.updateMany({
      where: { id: roomId, userId },
      data: { title },
    });
    return { chatRoom };
  }

  static async deleteChatRoom(roomId: string, userId: string) {
    // Delete all messages in the room first
    await prisma.aIChatMessage.deleteMany({
      where: { roomId },
    });
    
    // Delete the room
    const chatRoom = await prisma.chatRoom.deleteMany({
      where: { id: roomId, userId },
    });
    return { chatRoom };
  }
}
