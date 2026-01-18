import { Router } from "express";
import { LivestockController } from "../controllers/livestock";
import { authenticate, isAdmin } from "../middlewares";
import { uploadImage } from "../middlewares/upload";

const livestock = Router();
const livestockController = new LivestockController();

livestock.get("/", (_req, res) => res.json({ ok: true, message: "Livestock API is running" }));
livestock.get("/livestocks", (req, res) => livestockController.getLivestocks(req, res));
livestock.get("/livestocks/:id", (req, res) => livestockController.getLivestocks(req, res));

livestock.post('/livestocks', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => livestockController.addLivestock(req, res));  

livestock.put('/livestocks/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => livestockController.editLivestock(req, res));  

livestock.delete('/livestocks', authenticate, isAdmin, (req, res) => livestockController.bulkDeleteLivestocks(req, res));

livestock.delete('/livestocks/:id', authenticate, isAdmin, (req, res) => livestockController.deleteLivestock(req, res));

export default livestock;