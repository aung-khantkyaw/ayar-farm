import { Request, Response } from "express";
import { LivestockService } from "../services/livestock";

export class LivestockController {
    public async getLivestocks(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await LivestockService.getLivestockById(id)).livestock 
                : (await LivestockService.getAllLivestocks()).livestocks

            if (!data) {
                res.status(404).json({ message: 'Livestocks not found' });
                return;
            }

            res.status(200).json({ message: 'Get all livestocks successful', data });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching livestocks: ${error}` });
            console.error("Error fetching livestocks:", error);
        }
    }

    public async addLivestock(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newLivestock = (await LivestockService.addNewLivestock(name, description, image_urls)).livestock;

            if (!newLivestock) {
                res.status(400).json({ message: 'Livestock added fail' })
            }

            res.status(201).json({ message: 'Livestock added successfully', data: newLivestock });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding livestock: ${error}`})
            console.error("Error adding livestock:", error)
        }
    }

    public async editLivestock(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingLivestock = (await LivestockService.getLivestockById(id)).livestock;

            if (!existingLivestock) {
                res.status(404).json({ message: 'Livestock not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingLivestock!.image_urls, ...newImageUrls];
            
            const updatedLivestock = (await LivestockService.updateLivestock(id, name, description, image_urls)).livestock;

            res.status(200).json({ message: 'Livestock updated successfully', data: updatedLivestock });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing livestock: ${error}` })
            console.error("Error editing livestock:", error)
        }
    }

    public async deleteLivestock(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await LivestockService.deleteLivestocks(ids);
            
            res.status(200).json({ message: 'Livestock(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting livestock(s): ${error}` })
            console.error("Error deleting livestock(s):", error)
        }
    }
}