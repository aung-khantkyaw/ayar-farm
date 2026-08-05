import { Request, Response } from 'express';
import { emitToAdmins, emitToUser } from "../socket";
import { Service } from '../services';
import { prisma } from '../prisma/client';

export class Controller {
    public async databaseTest(_req: Request, res: Response): Promise<void> {
        try {
            const dbInfo = await Service.getDatabaseInfo();
            res.json({ ok: true, message: "Database connection successful", data: dbInfo });
        } catch (error) {
            res.status(500).json({ ok: false, db: false, error: String(error) });
        }
    }

    public async adminNoti(req: Request, res: Response): Promise<void> {
        const payload = req.body;
        try {
            emitToAdmins("notify:admin", payload);
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ ok: false, error: String(error) });
        }
    }

    public async privateNoti(req: Request, res: Response): Promise<void> {
        const targetId = req.params.id;
        const payload = req.body;
        try {
            emitToUser(targetId, "notify:user", payload);
            res.json({ ok: true });
        } catch (error) {
            res.status(500).json({ ok: false, error: String(error) });
        }
    }

    public async deleteImages(req: Request, res: Response): Promise<void> {
        const { id, tableName, imageUrls } = req.body;
        try {
            // const hasTableName = await prisma.
        } catch (error) {
            res.status(500).json({ ok: false, error: String(error) });
        }
    }
}