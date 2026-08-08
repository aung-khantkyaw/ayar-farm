import { Request, Response } from "express";
import { ApiKeyService } from "../services/api-key";

export class ApiKeyController {
    public async getApiKeys(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const data = id 
                ? (await ApiKeyService.getApiKeyById(id)).apiKey
                : (await ApiKeyService.getAllApiKeys()).apiKeys;

            if (!data) {
                res.status(404).json({ message: 'ApiKey not found' });
                return;
            }

            res.status(200).json({ message: 'Get API key(s) successful', data });
        } catch (error) {
            res.status(500).json({ message: `Error fetching API keys: ${error}` });
            console.error("Error fetching API keys:", error);
        }
    }

    public async createApiKey(req: Request, res: Response): Promise<void> {
        try {
            const { 
                provider, 
                llmModelName, 
                embeddingModelName, 
                vectorSize, 
                apiKey, 
                baseUrl, 
                limit, 
                expiresAt 
            } = req.body;

            const newApiKey = (await ApiKeyService.createApiKey({
                provider,
                llmModelName,
                embeddingModelName,
                vectorSize,
                apiKey,
                baseUrl,
                limit,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            })).apiKey;

            res.status(201).json({ message: 'API key created successfully', data: newApiKey });
        } catch (error) {
            res.status(500).json({ message: `Error creating API key: ${error}` });
            console.error("Error creating API key:", error);
        }
    }

    public async updateApiKey(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { 
                provider, 
                llmModelName, 
                embeddingModelName, 
                vectorSize, 
                apiKey, 
                baseUrl, 
                limit, 
                used, 
                expiresAt,
                active 
            } = req.body;

            const updatedApiKey = (await ApiKeyService.updateApiKey(id, {
                provider,
                llmModelName,
                embeddingModelName,
                vectorSize,
                apiKey,
                baseUrl,
                limit,
                used,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                active,
            })).apiKey;

            res.status(200).json({ message: 'API key updated successfully', data: updatedApiKey });
        } catch (error) {
            res.status(500).json({ message: `Error updating API key: ${error}` });
            console.error("Error updating API key:", error);
        }
    }

    public async deleteApiKey(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await ApiKeyService.deleteApiKeys(ids);
            res.status(200).json({ message: 'API key(s) deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error deleting API key(s): ${error}` });
            console.error("Error deleting API key(s):", error);
        }
    }

    public async bulkDeleteApiKeys(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await ApiKeyService.deleteApiKeys(ids);
            res.status(200).json({ message: 'API keys deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error deleting API keys: ${error}` });
            console.error("Error deleting API keys:", error);
        }
    }
}