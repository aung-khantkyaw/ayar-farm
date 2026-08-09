import { prisma } from "../prisma/client";
import axios from 'axios';

const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || '	http://localhost:8001';

export class AIChatService {
    /**
     * Get chat history for a user
     */
    public static async getChatHistory(userId: string, limit: number = 50) {
        try {
            const messages = await prisma.aIChatMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                take: limit,
            });

            return messages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                sources: msg.sources,
                createdAt: msg.createdAt,
            }));
        } catch (error) {
            throw new Error(`Failed to fetch chat history: ${error}`);
        }
    }

    /**
     * Save user question to database
     */
    public static async saveUserMessage(userId: string, content: string) {
        try {
            const message = await prisma.aIChatMessage.create({
                data: {
                    userId,
                    role: 'USER',
                    content,
                },
            });

            return message;
        } catch (error) {
            throw new Error(`Failed to save user message: ${error}`);
        }
    }

    /**
     * Save AI response to database
     */
    public static async saveAssistantMessage(
        userId: string,
        content: string,
        sources?: any
    ) {
        try {
            const message = await prisma.aIChatMessage.create({
                data: {
                    userId,
                    role: 'ASSISTANT',
                    content,
                    sources: sources || null,
                },
            });

            return message;
        } catch (error) {
            throw new Error(`Failed to save assistant message: ${error}`);
        }
    }

    /**
     * Clear chat history for a user
     */
    public static async clearChatHistory(userId: string) {
        try {
            await prisma.aIChatMessage.deleteMany({
                where: { userId },
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to clear chat history: ${error}`);
        }
    }

    /**
     * Stream response from Python RAG service
     */
    public static async *streamRAGResponse(
        question: string,
        userId: string,
        conversationHistory: Array<{ role: string; content: string }>
    ): AsyncGenerator<string, void, unknown> {
        try {
            const response = await axios.post(
                `${PYTHON_RAG_SERVICE_URL}/chat`,
                {
                    question,
                    user_id: userId,
                    conversation_history: conversationHistory,
                },
                {
                    responseType: 'stream',
                }
            );

            // Stream the response chunks
            for await (const chunk of response.data) {
                yield chunk.toString();
            }
        } catch (error) {
            console.error('Error streaming from RAG service:', error);
            throw new Error('Failed to get response from AI service');
        }
    }

    /**
     * Check if RAG service is healthy
     */
    public static async checkRAGServiceHealth(): Promise<boolean> {
        try {
            const response = await axios.get(`${PYTHON_RAG_SERVICE_URL}/health`, {
                timeout: 5000,
            });
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('RAG service health check failed:', error);
            return false;
        }
    }
}
