import { Request, Response } from "express";
import { AIChatService } from "../services/ai-chat";

export class AIChatController {
    /**
     * SSE endpoint for streaming AI chat responses
     */
    public async chatStream(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { question, roomId } = req.body;

            if (!question) {
                res.status(400).json({ message: "Question is required" });
                return;
            }

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Get conversation history for the room (if provided) or user
            const history = await AIChatService.getChatHistory(userId, roomId, 10);
            const conversationHistory = history.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // Save user message to database with room_id
            await AIChatService.saveUserMessage(userId, question, roomId);

            // Send user message confirmation
            res.write(`data: ${JSON.stringify({ type: 'user_message', content: question })}\n\n`);

            let fullResponse = '';
            let sources: any[] = [];

            try {
                // Stream response from Python RAG service
                for await (const chunk of AIChatService.streamRAGResponse(
                    question,
                    userId,
                    conversationHistory
                )) {
                    // Check if chunk contains sources marker
                    if (chunk.includes('[SOURCES]')) {
                        const parts = chunk.split('[SOURCES]');
                        // Send the text part before sources
                        if (parts[0]) {
                            fullResponse += parts[0];
                            res.write(`data: ${JSON.stringify({ type: 'chunk', content: parts[0] })}\n\n`);
                        }
                        // Parse sources JSON
                        if (parts[1]) {
                            try {
                                sources = JSON.parse(parts[1].trim());
                            } catch (e) {
                                console.error('Failed to parse sources:', e);
                            }
                        }
                    } else {
                        fullResponse += chunk;
                        // Send chunk to client
                        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
                    }
                }

                // Save assistant response to database with sources and room_id
                await AIChatService.saveAssistantMessage(userId, fullResponse, sources, roomId);

                // Send completion signal with sources
                res.write(`data: ${JSON.stringify({ type: 'done', content: fullResponse, sources })}\n\n`);
            } catch (error) {
                // Send error signal
                res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to get AI response' })}\n\n`);
            }

            res.end();
        } catch (error) {
            console.error('Chat stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: `Error in chat stream: ${error}` });
            }
        }
    }

    /**
     * Get chat history for a user
     */
    public async getChatHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { limit, roomId } = req.query;

            const messages = await AIChatService.getChatHistory(userId, roomId as string, Number(limit) || 50);

            res.status(200).json({ message: "Chat history retrieved", data: messages });
        } catch (error) {
            res.status(500).json({ message: `Error fetching chat history: ${error}` });
        }
    }

    /**
     * Clear chat history for a user
     */
    public async clearChatHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { roomId } = req.query;

            await AIChatService.clearChatHistory(userId, roomId as string);

            res.status(200).json({ message: "Chat history cleared" });
        } catch (error) {
            res.status(500).json({ message: `Error clearing chat history: ${error}` });
        }
    }

    /**
     * Check RAG service health
     */
    public async checkHealth(req: Request, res: Response): Promise<void> {
        try {
            const isHealthy = await AIChatService.checkRAGServiceHealth();

            res.status(200).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                service: 'RAG Chat Service',
            });
        } catch (error) {
            res.status(500).json({ message: `Error checking health: ${error}` });
        }
    }
}
