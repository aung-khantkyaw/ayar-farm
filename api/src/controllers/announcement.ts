import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

const ANNOUNCEMENT_TYPES = ['INFORMATION', 'WARNING', 'BREAKING_NEWS'] as const;

type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export class AnnouncementController {
  private normalizeType(raw?: string): AnnouncementType | undefined {
    if (!raw) return undefined;
    const upper = raw.toUpperCase();
    return ANNOUNCEMENT_TYPES.includes(upper as AnnouncementType)
      ? (upper as AnnouncementType)
      : undefined;
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { title, message, data, type } = req.body;
    const creatorId = (req as any).user?.id as string | undefined;

    const rawUserIds = (req.body.userIds ?? req.body.userId) as string | string[] | undefined;
    const targetUserIds = Array.isArray(rawUserIds)
      ? rawUserIds
      : rawUserIds
        ? [rawUserIds]
        : [];
    const uniqueTargetUserIds = [...new Set(targetUserIds.filter(Boolean))];

    if (!creatorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!title || !message) {
      res.status(400).json({ message: 'title and message are required' });
      return;
    }

    const normalizedType = this.normalizeType(type) ?? 'INFORMATION';

    try {
      const announcement = await prisma.$transaction(async (tx) => {
        const created = await tx.announcements.create({
          data: {
            creatorId,
            title,
            message,
            data,
            type: normalizedType,
          },
        });

        if (uniqueTargetUserIds.length > 0) {
          await tx.announcementRecipient.createMany({
            data: uniqueTargetUserIds.map((userId) => ({ announcementId: created.id, userId })),
            skipDuplicates: true,
          });
        }

        return created;
      });

      res.status(201).json({ data: announcement });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create announcement', error: String(error) });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { type, active: activeRaw } = req.query;
    const normalizedType = this.normalizeType(type as string);
    const userId = (req as any).user?.id as string;
    const isAdmin = (req as any).user?.user_type === 'ADMIN';

    let activeFilter: boolean | 'all' = true; // default to active only
    if (typeof activeRaw === 'string') {
      const lower = activeRaw.toLowerCase();
      if (lower === 'true') activeFilter = true;
      else if (lower === 'false') activeFilter = false;
      else if (lower === 'all') activeFilter = 'all';
    } else if (Array.isArray(activeRaw)) {
      if (activeRaw.some((v) => typeof v === 'string' && v.toLowerCase() === 'all')) {
        activeFilter = 'all';
      } else if (activeRaw.some((v) => typeof v === 'string' && v.toLowerCase() === 'false')) {
        activeFilter = false;
      } else {
        activeFilter = true;
      }
    }

    try {
      const announcements = await prisma.announcements.findMany({
        where: {
          AND: [
            ...(normalizedType ? [{ type: normalizedType }] : []),
            ...(activeFilter === 'all' ? [] : [{ isActive: activeFilter }]),
            ...(isAdmin ? [] : [{ recipients: { some: { userId } } }]),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ data: announcements });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch announcements', error: String(error) });
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const announcement = await prisma.announcements.findUnique({ where: { id } });
      if (!announcement) {
        res.status(404).json({ message: 'Announcement not found' });
        return;
      }
      res.status(200).json({ data: announcement });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch announcement', error: String(error) });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { title, message, data, isActive, type } = req.body;
    const normalizedType = this.normalizeType(type as string);

    try {
      const existing = await prisma.announcements.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Announcement not found' });
        return;
      }

      const announcement = await prisma.announcements.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(message !== undefined ? { message } : {}),
          ...(data !== undefined ? { data } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(normalizedType ? { type: normalizedType } : {}),
        },
      });

      res.status(200).json({ data: announcement });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update announcement', error: String(error) });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const existing = await prisma.announcements.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Announcement not found' });
        return;
      }
      await prisma.announcements.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete announcement', error: String(error) });
    }
  }
}
