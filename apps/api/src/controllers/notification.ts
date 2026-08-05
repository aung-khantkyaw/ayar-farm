import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export class NotificationController {
  public async create(req: Request, res: Response): Promise<void> {
    const { userId, title, message, data } = req.body;

    if (!userId || !message) {
      res.status(400).json({ message: 'userId and message are required' });
      return;
    }

    try {
      const notification = await prisma.notifications.create({
        data: {
          userId,
          title,
          message,
          data,
        },
      });

      res.status(201).json({ data: notification });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create notification', error: String(error) });
    }
  }

  public async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const notifications = await prisma.notifications.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ data: notifications });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications', error: String(error) });
    }
  }

  public async getByUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    try {
      const notifications = await prisma.notifications.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ data: notifications });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user notifications', error: String(error) });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const notification = await prisma.notifications.findUnique({ where: { id } });

      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      res.status(200).json({ data: notification });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notification', error: String(error) });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const existing = await prisma.notifications.findUnique({ where: { id } });

      if (!existing) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }

      await prisma.notifications.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete notification', error: String(error) });
    }
  }

  public async markRead(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const notification = await prisma.notifications.update({
        where: { id },
        data: { isRead: true },
      });
      res.status(200).json({ data: notification });
    } catch (error) {
      res.status(500).json({ message: 'Failed to mark notification as read', error: String(error) });
    }
  }
}
