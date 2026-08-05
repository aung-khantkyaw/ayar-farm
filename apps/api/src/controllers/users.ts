import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export class UsersController {
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (id) {
        const users = await prisma.users.findFirst({
          where: { id },
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            user_type: true,
            isVerified: true,
            profile_picture: true,
            location: true,
            gender: true,
            created_at: true,
          },
        });
        res.status(200).json({ data: users });
      } else {
        const users = await prisma.users.findMany({
          select: {
            id: true,
            name: true,
            phone_number: true,
            email: true,
            user_type: true,
            isVerified: true,
            profile_picture: true,
            location: true,
            gender: true,
            created_at: true,
          },
        });
        res.status(200).json({ data: users });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: String(error) });
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      const query = String(q || '').trim();
      
      if (!query) {
        res.status(200).json({ data: [] });
        return;
      }

      const users = await prisma.users.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true,
          user_type: true,
        },
        take: 20,
      });
      
      res.status(200).json({ data: users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to search users', error: String(error) });
    }
  }
}
