import { Request, Response } from "express";
import { DataVectorizationService } from "../services/data-vectorization";

export class DataVectorizationController {
    public async getPendingItems(req: Request, res: Response): Promise<void> {
        try {
            const { items } = await DataVectorizationService.getPendingItems();
            res.status(200).json({ message: "Get pending items successfully", items });
        } catch (error) {
            res.status(500).json({ message: `Error fetching pending items: ${error}` });
            console.error("Error fetching pending items:", error);
        }
    }

    public async updateEmbeddingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { type, id, status } = req.body;

            if (!type || !id || !status) {
                res.status(400).json({ message: 'Missing required fields: type, id, status' });
                return;
            }

            await DataVectorizationService.updateEmbeddingStatus(type, id, status);
            res.status(200).json({ message: 'Embedding status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error updating embedding status: ${error}` });
            console.error("Error updating embedding status:", error);
        }
    }

    public async bulkUpdateEmbeddingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { updates } = req.body;

            if (!updates || !Array.isArray(updates)) {
                res.status(400).json({ message: 'Invalid updates array provided' });
                return;
            }

            await DataVectorizationService.bulkUpdateEmbeddingStatus(updates);
            res.status(200).json({ message: 'Bulk embedding status updated successfully' });
        } catch (error) {
            res.status(500).json({ message: `Error bulk updating embedding status: ${error}` });
            console.error("Error bulk updating embedding status:", error);
        }
    }
}
