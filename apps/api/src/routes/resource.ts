import { Router } from "express";
import { ResourceController } from "../controllers/resource";
import { uploadResource } from "../middlewares/upload";
import { authenticate, isOwner } from "../middlewares";

const resource = Router();
const resourceController = new ResourceController();

resource.get("/", (_req, res) => res.json({ ok: true, message: "Resource API is running" }));
resource.get("/resources", (req, res) => resourceController.getResources(req, res));
resource.get("/resources/:id", (req, res) => resourceController.getResources(req, res)); 

resource.post("/resources/", authenticate, uploadResource.fields([{ name: 'resource', maxCount: 5 }, { name: 'image', maxCount: 5 }]), (req, res) => resourceController.addResource(req, res));

resource.put("/resources/:id", authenticate, uploadResource.fields([{ name: 'resource', maxCount: 5 }, { name: 'image', maxCount: 5 }]), isOwner, (req, res) => resourceController.editResource(req, res));
resource.patch("/resources/:id", (req, res) => resourceController.downloadCountIncrease(req, res));

resource.delete("/resources/:id", authenticate, isOwner, (req, res) => resourceController.deleteResource(req, res));

export default resource;