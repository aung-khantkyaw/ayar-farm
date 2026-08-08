import { Router } from "express";
import { ApiKeyController } from "../controllers/api-key";
import { authenticate, isAdmin } from "../middlewares";

const apiKeyRouter = Router();
const apiKeyController = new ApiKeyController();

// apiKeyRouter.get("/", (_req, res) => res.json({ ok: true, message: "API Key management is running" }));
apiKeyRouter.get("/", (req, res) => apiKeyController.getApiKeys(req, res));
apiKeyRouter.get("/:id", (req, res) => apiKeyController.getApiKeys(req, res));

apiKeyRouter.post("/", authenticate, isAdmin, (req, res) => apiKeyController.createApiKey(req, res));
apiKeyRouter.put("/:id", authenticate, isAdmin, (req, res) => apiKeyController.updateApiKey(req, res));

apiKeyRouter.delete("/", authenticate, isAdmin, (req, res) => apiKeyController.bulkDeleteApiKeys(req, res));
apiKeyRouter.delete("/:id", authenticate, isAdmin, (req, res) => apiKeyController.deleteApiKey(req, res));

export default apiKeyRouter;