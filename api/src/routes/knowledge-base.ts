import { Router } from "express";
import { KnowledgeBaseController } from "../controllers/knowledge-base";
import { authenticate, isAdmin } from "../middlewares";
import { uploadFile } from "../middlewares/upload";

const knowledgeBase = Router();
const knowledgeBaseController = new KnowledgeBaseController();

// knowledgeBase.get("/", (_req, res) => res.json({ ok: true, message: "Knowledge Base API is running" }));
knowledgeBase.get("", (req, res) => knowledgeBaseController.getKnowledgeBase(req, res));
knowledgeBase.get("/:id", (req, res) => knowledgeBaseController.getKnowledgeBase(req, res));

knowledgeBase.post('/', authenticate, isAdmin, uploadFile.array('file_urls'), (req, res) => knowledgeBaseController.addKnowledgeBase(req, res));  

knowledgeBase.put('/:id', authenticate, isAdmin, uploadFile.array('file_urls'), (req, res) => knowledgeBaseController.editKnowledgeBase(req, res));  

knowledgeBase.delete('/:id', authenticate, isAdmin, (req, res) => knowledgeBaseController.deleteKnowledgeBase(req, res));

export default knowledgeBase;
