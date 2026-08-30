import { Request, Response } from "express";
import { DataVectorizationService } from "../services/data-vectorization";

export class DataVectorizationController {

    public async getAllItems(req: Request, res: Response): Promise<void> {
        try {
            // Optional key context; defaults to the ACTIVE api key.
            const apiKeyId = typeof req.query.apiKeyId === 'string' ? req.query.apiKeyId : undefined;
            const { items, apiKeyId: resolvedKeyId } =
                await DataVectorizationService.getAllItemsWithRecords(apiKeyId);

            res.status(200).json({
                message: "Get all items successfully",
                items,
                apiKeyId: resolvedKeyId ?? null,
            });
        } catch (error) {
            res.status(500).json({ message: `Error fetching all items: ${error}` });
            console.error("Error fetching all items:", error);
        }
    }

    public async getEmbeddingSummary(_req: Request, res: Response): Promise<void> {
        try {
            const { keys } = await DataVectorizationService.getKeySummary();
            res.status(200).json({ message: "Get embedding summary successfully", keys });
        } catch (error) {
            res.status(500).json({ message: `Error fetching embedding summary: ${error}` });
            console.error("Error fetching embedding summary:", error);
        }
    }

    public async updateEmbeddingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { type, id, status, apiKeyId } = req.body;

            if (!type || !id || !status) {
                res.status(400).json({ message: 'Missing required fields: type, id, status' });
                return;
            }

            await DataVectorizationService.updateEmbeddingStatus(type, id, status, apiKeyId);
            res.status(200).json({ message: 'Embedding status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error updating embedding status: ${error}` });
            console.error("Error updating embedding status:", error);
        }
    }

    public async bulkUpdateEmbeddingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { updates, apiKeyId } = req.body;

            if (!updates || !Array.isArray(updates)) {
                res.status(400).json({ message: 'Invalid updates array provided' });
                return;
            }

            await DataVectorizationService.bulkUpdateEmbeddingStatus(updates, apiKeyId);
            res.status(200).json({ message: 'Bulk embedding status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error bulk updating embedding status: ${error}` });
            console.error("Error bulk updating embedding status:", error);
        }
    }
}
