import { Router } from "express";
import { FishController } from "../controllers/fish";
import { authenticate, isAdmin } from "../middlewares";
import { uploadImage } from "../middlewares/upload";

const fish = Router();
const fishController = new FishController();

fish.get("/", (_req, res) => res.json({ ok: true, message: "Fish API is running" }));
fish.get("/fishs", (req, res) => fishController.getFishs(req, res));
fish.get("/fishs/:id", (req, res) => fishController.getFishs(req, res));

fish.post('/fishs', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => fishController.addFish(req, res));  

fish.put('/fishs/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => fishController.editFish(req, res));  

fish.delete('/fishs', authenticate, isAdmin, (req, res) => fishController.bulkDeleteFishes(req, res));

fish.delete('/fishs/:id', authenticate, isAdmin, (req, res) => fishController.deleteFish(req, res));

export default fish;