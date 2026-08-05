import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export class DeviceTokenController {
  /**
   * Register a device token for a user
   */
  public async registerDeviceToken(req: Request, res: Response): Promise<void> {
    const { token, platform } = req.body;
    const userId = (req as any).user.id;

    if (!token || !platform) {
      res.status(400).json({ 
        success: false,
        message: 'Token and platform are required' 
      });
      return;
    }

    try {
      // Check if the token already exists for a different user and remove it
      await prisma.deviceToken.deleteMany({
        where: {
          token: token,
          NOT: {
            userId: userId
          }
        }
      });

      // Create or update the device token
      const deviceToken = await prisma.deviceToken.upsert({
        where: {
          userId_platform: {
            userId: userId,
            platform: platform,
          }
        },
        update: {
          token: token,
        },
        create: {
          token: token,
          userId: userId,
          platform: platform,
        }
      });

      res.status(200).json({ 
        success: true,
        message: 'Device token registered successfully',
        data: deviceToken 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to register device token',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Remove a device token for a user
   */
  public async removeDeviceToken(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const userId = (req as any).user.id;

    if (!token) {
      res.status(400).json({ 
        success: false,
        message: 'Token is required' 
      });
      return;
    }

    try {
      await prisma.deviceToken.deleteMany({
        where: {
          token: token,
          userId: userId
        }
      });

      res.status(200).json({ 
        success: true,
        message: 'Device token removed successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to remove device token',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get all device tokens for a user
   */
  public async getUserDeviceTokens(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;

    try {
      const deviceTokens = await prisma.deviceToken.findMany({
        where: {
          userId: userId
        }
      });

      res.status(200).json({ 
        success: true,
        data: deviceTokens 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch device tokens',
        error: (error as Error).message 
      });
    }
  }
}