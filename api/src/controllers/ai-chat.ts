import { Request, Response } from "express";
import { AIChatService } from "../services/ai-chat";

export class AIChatController {
    /**
     * SSE endpoint for streaming AI chat responses
     */
    public async chatStream(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { question } = req.body;

            if (!question) {
                res.status(400).json({ message: "Question is required" });
                return;
            }

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Get conversation history
            const history = await AIChatService.getChatHistory(userId, 10);
            const conversationHistory = history.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // Save user message to database
            await AIChatService.saveUserMessage(userId, question);

            // Send user message confirmation
            res.write(`data: ${JSON.stringify({ type: 'user_message', content: question })}\n\n`);

            let fullResponse = '';

            try {
                // Stream response from Python RAG service
                for await (const chunk of AIChatService.streamRAGResponse(
                    question,
                    userId,
                    conversationHistory
                )) {
                    fullResponse += chunk;
                    // Send chunk to client
                    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
                }

                // Save assistant response to database
                await AIChatService.saveAssistantMessage(userId, fullResponse);

                // Send completion signal
                res.write(`data: ${JSON.stringify({ type: 'done', content: fullResponse })}\n\n`);
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
            const { limit } = req.query;

            const messages = await AIChatService.getChatHistory(userId, Number(limit) || 50);

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

            await AIChatService.clearChatHistory(userId);

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
