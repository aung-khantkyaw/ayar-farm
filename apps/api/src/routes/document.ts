import { Router } from "express";
import { DocumentController } from "../controllers/document";
import { authenticate, isAdmin } from "../middlewares";
import { uploadFile } from "../middlewares/upload";

const document = Router();
const documentController = new DocumentController();

document.get("/", (_req, res) => res.json({ ok: true, message: "Document API is running" }));
document.get("/documents", (req, res) => documentController.getDocuments(req, res));
document.get("/documents/:id", (req, res) => documentController.getDocuments(req, res));

document.post('/documents', authenticate, isAdmin, uploadFile.array('file_urls'), (req, res) => documentController.addDocument(req, res));  

document.put('/documents/:id', authenticate, isAdmin, uploadFile.array('file_urls'), (req, res) => documentController.editDocument(req, res));  

document.delete('/documents/:id', authenticate, isAdmin, (req, res) => documentController.deleteDocument(req, res));

export default document;