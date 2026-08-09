import { Router } from "express";
import { DataVectorizationController } from "../controllers/data-vectorization";
import { authenticate, isAdmin } from "../middlewares";

const dataVectorization = Router();
const dataVectorizationController = new DataVectorizationController();

dataVectorization.get("/pending", (req, res) => dataVectorizationController.getPendingItems(req, res));

dataVectorization.get("/all", (req, res) => dataVectorizationController.getAllItems(req, res));

dataVectorization.put('/status', authenticate, isAdmin, (req, res) => dataVectorizationController.updateEmbeddingStatus(req, res));

dataVectorization.put('/status/bulk', authenticate, isAdmin, (req, res) => dataVectorizationController.bulkUpdateEmbeddingStatus(req, res));

export default dataVectorization;
