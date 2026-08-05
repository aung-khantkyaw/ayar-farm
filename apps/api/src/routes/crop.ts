import { Router } from "express";
import { CropController } from "../controllers/crop";
import { authenticate, isAdmin } from "../middlewares";
import { uploadImage } from "../middlewares/upload";

const crop = Router();
const cropController = new CropController();

crop.get("/", (_req, res) => res.json({ ok: true, message: "Crop API is running" }));
crop.get("/croptypes", (req, res) => cropController.getCropTypes(req, res));
crop.get("/croptypes/:id", (req, res) => cropController.getCropTypes(req, res));
crop.get("/crops", (req, res) => cropController.getCrops(req, res));
crop.get("/crops/:id", (req, res) => cropController.getCrops(req, res));

crop.post('/croptypes', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => cropController.addCropType(req, res));
crop.post('/crops', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => cropController.addCrop(req, res));  

crop.put('/croptypes/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => cropController.editCropType(req, res));
crop.put('/crops/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => cropController.editCrop(req, res));  

crop.delete('/croptypes', authenticate, isAdmin, (req, res) => cropController.bulkDeleteCropTypes(req, res));
crop.delete('/crops', authenticate, isAdmin, (req, res) => cropController.bulkDeleteCrops(req, res));

crop.delete('/croptypes/:id', authenticate, isAdmin, (req, res) => cropController.deleteCropType(req, res));
crop.delete('/crops/:id', authenticate, isAdmin, (req, res) => cropController.deleteCrop(req, res));

export default crop;