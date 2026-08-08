import { Request, Response } from "express";
import { KnowledgeBaseService } from "../services/knowledge-base";

export class KnowledgeBaseController {
    public async getKnowledgeBase(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
                        
            if (id) {
                const { knowledgeBase } = await KnowledgeBaseService.getKnowledgeBaseById(id);
                res.status(200).json({ message: "Get Knowledge Base successfully", knowledgeBase });
            } else {
                const { knowledgeBase } = await KnowledgeBaseService.getAllKnowledgeBase();
                res.status(200).json({ message: "Get Knowledge Base successfully", knowledgeBase });
            }
            
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching knowledge base: ${error}` });
            console.error("Error fetching knowledge base:", error);
        }
    }

    public async addKnowledgeBase(req: Request, res: Response): Promise<void> {
        try {
            const { title, author } = req.body;
            const files = req.files as Express.Multer.File[];
            const file_urls = files ? files.map(file => file.path) : [];
            const size = files && files.length > 0 ? files[0].size : (req.body.size ? parseInt(req.body.size) : 0);

            const newKnowledgeBase = (await KnowledgeBaseService.addKnowledgeBase(title, author, file_urls, size)).knowledgeBase;

            if (!newKnowledgeBase) {
                res.status(400).json({ message: 'Knowledge Base added fail' })
            }

            res.status(201).json({ message: 'Knowledge Base added successfully', data: newKnowledgeBase });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding knowledge base: ${error}` })
            console.error("Error adding knowledge base:", error)
        }
    }

    public async editKnowledgeBase(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { title, author } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);

            const existingKnowledgeBase = (await KnowledgeBaseService.getKnowledgeBaseById(id)).knowledgeBase;

            if (!existingKnowledgeBase) {
                res.status(404).json({ message: 'Knowledge Base not found' })
            }

            const newFileUrls = files ? files.map((file) => file.path) : [];
            const file_urls = [...existingKnowledgeBase!.file_urls, ...newFileUrls];
            const size = files && files.length > 0 ? files[0].size : (req.body.size ? parseInt(req.body.size) : existingKnowledgeBase!.size || 0);

            const updatedKnowledgeBase = (await KnowledgeBaseService.updateKnowledgeBase(id, title, author, file_urls, size));

            res.status(200).json({ message: 'Knowledge Base updated successfully', data: updatedKnowledgeBase });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing knowledge base: ${error}` })
            console.error("Error editing knowledge base:", error)
        }
    }

    public async deleteKnowledgeBase(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            await KnowledgeBaseService.deleteKnowledgeBase(id);

            res.status(200).json({ message: 'Knowledge Base deleted successfully' })
        } catch (error) {
            res.status(500).json({ message: `Error deleting knowledge base: ${error}` })
            console.error("Error deleting knowledge base:", error)
        }
    }
}
