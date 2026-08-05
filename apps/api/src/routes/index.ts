import { Router } from "express";
import { Controller } from "../controllers";

const router = Router();
const controller = new Controller();


router.get("/", (_req, res) => res.json({ ok: true, message: "API is running" }));

// DB connectivity / basic query test
router.get("/db-test", (req, res) => controller.databaseTest(req, res));

// Broadcast a notification to all admins (HTTP -> realtime)
router.post("/notify/admin", (req, res) => controller.adminNoti(req, res));

// Send a private notification to a user by id
router.post("/notify/user/:id", (req, res) => controller.privateNoti(req, res));

export default router;