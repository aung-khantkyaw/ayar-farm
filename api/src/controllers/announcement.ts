import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { PushService } from '../services/push';
import { emitToAll } from '../socket';

export class AnnouncementController {
  public async create(req: Request, res: Response): Promise<void> {
    const { title, message, type, data, recipientIds } = req.body;
    const userId = (req as any).user.id;

    if (!title || !message) {
      res.status(400).json({ message: 'Title and message are required' });
      return;
    }

    try {
      // Create the announcement
      const announcement = await prisma.announcements.create({
        data: {
          title,
          message,
          type: type || 'INFORMATION',
          data,
          creatorId: userId,
          recipients: recipientIds ? {
            create: recipientIds.map((userId: string) => ({
              userId
            }))
          } : undefined
        },
        include: {
          creator: true,
          recipients: {
            include: {
              user: true
            }
          }
        }
      });

      // Send push notifications to all recipients if announcement is active
      if (announcement.isActive) {
        // Send to specific recipients if they exist
        if (announcement.recipients && announcement.recipients.length > 0) {
          for (const recipient of announcement.recipients) {
            try {
              await PushService.sendToUser(
                recipient.userId,
                announcement.title,
                announcement.message,
                {
                  announcementId: announcement.id,
                  type: 'announcement',
                  ...data
                }
              );
            } catch (error) {
              console.error(`Failed to send notification to user ${recipient.userId}:`, error);
            }
          }
        } else {
          // If no specific recipients, send to a general announcement topic
          try {
            await PushService.sendToTopic(
              'announcements',
              announcement.title,
              announcement.message,
              {
                announcementId: announcement.id,
                type: 'announcement',
                ...data
              }
            );
          } catch (error) {
            console.error('Failed to send notification to announcements topic:', error);
          }
        }
      }

      // Emit socket event to notify all clients that an announcement was updated
      // This ensures that even if push notifications fail, clients will check for new announcements
      emitToAll('announcement:updated', {
        announcementId: announcement.id,
        title: announcement.title,
        message: announcement.message,
        isActive: announcement.isActive
      });

      res.status(201).json({ data: announcement });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create announcement', error: String(error) });
    }
  }

  public async list(req: Request, res: Response): Promise<void> {
    try {
      const { active, userId } = req.query;
      let whereClause: any = {};

      // Filter by active status if specified
      if (active === 'true') {
        whereClause.isActive = true;
      } else if (active === 'false') {
        whereClause.isActive = false;
      }

      // If userId is provided, find announcements that are either:
      // 1. General announcements (no specific recipients), OR
      // 2. Specific to this user
      if (userId) {
        // Find announcements that either have no recipients or include this user
        const announcementsForUser = await prisma.announcements.findMany({
          where: {
            AND: [
              whereClause, // Apply active status filter if present
              {
                OR: [
                  // Announcements with no recipients
                  {
                    recipients: { none: {} }
                  },
                  // Announcements that include this user as recipient
                  {
                    recipients: { some: { userId: String(userId) } }
                  }
                ]
              }
            ]
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                user_type: true
              }
            },
            recipients: {
              select: {
                userId: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ data: announcementsForUser });
        return;
      }

      const announcements = await prisma.announcements.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              user_type: true
            }
          },
          recipients: {
            select: {
              userId: true
            }
          }
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
      const announcement = await prisma.announcements.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              user_type: true
            }
          },
          recipients: {
            select: {
              userId: true
            }
          }
        }
      });

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
    const { title, message, type, data, isActive, recipientIds } = req.body;

    try {
      const announcement = await prisma.announcements.update({
        where: { id },
        data: {
          title,
          message,
          type,
          data,
          isActive,
          ...(recipientIds !== undefined && {
            recipients: {
              deleteMany: {}, // Remove all existing recipients
              create: recipientIds.map((userId: string) => ({
                userId
              }))
            }
          })
        },
        include: {
          creator: true,
          recipients: true
        }
      });

      // If announcement is active, send push notifications
      if (announcement.isActive) {
        // Send to specific recipients if they exist
        if (announcement.recipients && announcement.recipients.length > 0) {
          for (const recipient of announcement.recipients) {
            try {
              await PushService.sendToUser(
                recipient.userId,
                announcement.title,
                announcement.message,
                {
                  announcementId: announcement.id,
                  type: 'announcement',
                  ...data
                }
              );
            } catch (error) {
              console.error(`Failed to send notification to user ${recipient.userId}:`, error);
            }
          }
        } else {
          // If no specific recipients, send to a general announcement topic
          try {
            await PushService.sendToTopic(
              'announcements',
              announcement.title,
              announcement.message,
              {
                announcementId: announcement.id,
                type: 'announcement',
                ...data
              }
            );
          } catch (error) {
            console.error('Failed to send notification to announcements topic:', error);
          }
        }
      }

      // Emit socket event to notify all clients that an announcement was updated
      // This ensures that even if push notifications fail, clients will check for new announcements
      emitToAll('announcement:updated', {
        announcementId: announcement.id,
        title: announcement.title,
        message: announcement.message,
        isActive: announcement.isActive
      });

      res.status(200).json({ data: announcement });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update announcement', error: String(error) });
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      await prisma.announcements.delete({ where: { id } });

      // Emit socket event to notify all clients that an announcement was deleted
      emitToAll('announcement:deleted', {
        announcementId: id
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete announcement', error: String(error) });
    }
  }
}