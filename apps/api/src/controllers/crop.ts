import { Request, Response } from "express";
import { CropService } from "../services/crop";

export class CropController {
    public async getCropTypes(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await CropService.getCropTypeById(id)).cropType
                : (await CropService.getAllCropTypes()).cropTypes;

            if (!data) {
                res.status(404).json({ message: 'CropType not found' });
                return;
            }

            res.status(200).json({ message: 'Get crop type(s) successful', data });
        } catch (error) {
            res.status(500).json({ message: `Error fetching crop types: ${error}` });
            console.error("Error fetching crop types:", error);
        }
    }

    public async getCrops(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await CropService.getCropById(id)).crop 
                : (await CropService.getAllCrops()).crops

            if (!data) {
                res.status(404).json({ message: 'Crops not found' });
                return;
            }

            res.status(200).json({ message: 'Get all crops successful', data });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching crops: ${error}` });
            console.error("Error fetching crops:", error);
        }
    }

    public async addCropType(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newCropType = (await CropService.addNewCropType(name, description, image_urls)).cropType;

            if (!newCropType) {
                res.status(400).json({ message: 'Crop type added fail' })
            }

            res.status(201).json({ message: 'Crop type added successfully', data: newCropType });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding crop types: ${error}`})
            console.error("Error adding crop types:", error)
        }
    }

    public async addCrop(req: Request, res: Response): Promise<void> {
        try {
            const { crop_type_id, name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newCrop = (await CropService.addNewCrop(crop_type_id, name, description, image_urls)).crop;

            if (!newCrop) {
                res.status(400).json({ message: 'Crop type added fail' })
            }

            res.status(201).json({ message: 'Crop added successfully', data: newCrop });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding crop: ${error}`})
            console.error("Error adding crop:", error)
        }
    }

    public async editCropType(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingCropType = (await CropService.getCropTypeById(id)).cropType;

            if (!existingCropType) {
                res.status(404).json({ message: 'Crop type not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingCropType!.image_urls, ...newImageUrls];
            
            const updatedCropType = (await CropService.updateCropType(id, name, description, image_urls)).cropType;

            res.status(200).json({ message: 'Crop type updated successfully', data: updatedCropType });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing crop types: ${error}` })
            console.error("Error editing crop types:", error)
        }
    }

    public async editCrop(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { crop_type_id, name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingCrop = (await CropService.getCropById(id)).crop;

            if (!existingCrop) {
                res.status(404).json({ message: 'Crop not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingCrop!.image_urls, ...newImageUrls];
            
            const updatedCrop = (await CropService.updateCrop(id, crop_type_id, name, description, image_urls)).crop;

            if (!updatedCrop) {
                console.log("FAIL UPDATE");
            }

            res.status(200).json({ message: 'Crop updated successfully', data: updatedCrop });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing crop: ${error}` })
            console.error("Error editing crop:", error)
        }
    }

    public async deleteCropType(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await CropService.deleteCropTypes(ids);
            
            res.status(200).json({ message: 'Crop type(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting crop type(s): ${error}` })
            console.error("Error deleting crop type(s):", error)
        }
    }

    public async deleteCrop(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await CropService.deleteCrops(ids);
            
            res.status(200).json({ message: 'Crop(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting crop(s): ${error}` })
            console.error("Error deleting crop(s):", error)
        }
    }

    public async bulkDeleteCropTypes(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await CropService.deleteCropTypes(ids);
            
            res.status(200).json({ message: 'Crop types deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting crop types: ${error}` })
            console.error("Error deleting crop types:", error)
        }
    }

    public async bulkDeleteCrops(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await CropService.deleteCrops(ids);
            
            res.status(200).json({ message: 'Crops deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting crops: ${error}` })
            console.error("Error deleting crops:", error)
        }
    }
}