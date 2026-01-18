import { Request, Response } from "express";
import { FishService } from "../services/fish";

export class FishController {
    public async getFishs(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await FishService.getFishById(id)).fish 
                : (await FishService.getAllFishs()).fishs

            if (!data) {
                res.status(404).json({ message: 'Fishs not found' });
                return;
            }

            res.status(200).json({ message: 'Get all fishs successful', data });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching fishs: ${error}` });
            console.error("Error fetching fishs:", error);
        }
    }

    public async addFish(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newFish = (await FishService.addNewFish(name, description, image_urls)).fish;

            if (!newFish) {
                res.status(400).json({ message: 'Fish added fail' })
            }

            res.status(201).json({ message: 'Fish added successfully', data: newFish });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding fish: ${error}`})
            console.error("Error adding fish:", error)
        }
    }

    public async editFish(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingFish = (await FishService.getFishById(id)).fish;

            if (!existingFish) {
                res.status(404).json({ message: 'Fish not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingFish!.image_urls, ...newImageUrls];
            
            const updatedFish = (await FishService.updateFish(id, name, description, image_urls)).fish;

            res.status(200).json({ message: 'Fish updated successfully', data: updatedFish });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing fish: ${error}` })
            console.error("Error editing fish:", error)
        }
    }

    public async deleteFish(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await FishService.deleteFishs(ids);
            
            res.status(200).json({ message: 'Fish(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting fish(s): ${error}` })
            console.error("Error deleting fish(s):", error)
        }
    }

    public async bulkDeleteFishes(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await FishService.deleteFishs(ids);
            
            res.status(200).json({ message: 'Fishes deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting fishes: ${error}` })
            console.error("Error deleting fishes:", error)
        }
    }
}