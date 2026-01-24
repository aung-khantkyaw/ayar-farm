import { Request, Response } from 'express';
import { PushService } from '../services/push';

export class PushNotificationController {
  /**
   * Send push notification to a specific user
   */
  public async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, body, data } = req.body;

      if (!userId || !title || !body) {
        res.status(400).json({ 
          success: false,
          message: 'userId, title, and body are required' 
        });
        return;
      }

      const success = await PushService.sendToUser(userId, title, body, data);

      if (success) {
        res.status(200).json({ 
          success: true,
          message: 'Push notification sent successfully' 
        });
      } else {
        res.status(404).json({ 
          success: false,
          message: 'No device tokens found for the specified user' 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send push notification',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Send push notification to a specific device token
   */
  public async sendToDevice(req: Request, res: Response): Promise<void> {
    try {
      const { deviceToken, title, body, data } = req.body;

      if (!deviceToken || !title || !body) {
        res.status(400).json({ 
          success: false,
          message: 'deviceToken, title, and body are required' 
        });
        return;
      }

      const response = await PushService.sendToDeviceToken(deviceToken, title, body, data);

      res.status(200).json({ 
        success: true,
        message: 'Push notification sent successfully',
        messageId: response
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send push notification',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Send push notification to a topic
   */
  public async sendToTopic(req: Request, res: Response): Promise<void> {
    try {
      const { topic, title, body, data } = req.body;

      if (!topic || !title || !body) {
        res.status(400).json({ 
          success: false,
          message: 'topic, title, and body are required' 
        });
        return;
      }

      const response = await PushService.sendToTopic(topic, title, body, data);

      res.status(200).json({ 
        success: true,
        message: 'Push notification sent to topic successfully',
        messageId: response
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to send push notification to topic',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Subscribe device tokens to a topic
   */
  public async subscribeToTopic(req: Request, res: Response): Promise<void> {
    try {
      const { tokens, topic } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !topic) {
        res.status(400).json({ 
          success: false,
          message: 'tokens (array) and topic are required' 
        });
        return;
      }

      await PushService.subscribeToTopic(tokens, topic);

      res.status(200).json({ 
        success: true,
        message: 'Devices subscribed to topic successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to subscribe devices to topic',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   */
  public async unsubscribeFromTopic(req: Request, res: Response): Promise<void> {
    try {
      const { tokens, topic } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !topic) {
        res.status(400).json({ 
          success: false,
          message: 'tokens (array) and topic are required' 
        });
        return;
      }

      await PushService.unsubscribeFromTopic(tokens, topic);

      res.status(200).json({ 
        success: true,
        message: 'Devices unsubscribed from topic successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to unsubscribe devices from topic',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Validate a device token
   */
  public async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ 
          success: false,
          message: 'token is required' 
        });
        return;
      }

      const isValid = await PushService.validateToken(token);

      res.status(200).json({ 
        success: true,
        isValid,
        message: isValid ? 'Token is valid' : 'Token is invalid'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to validate token',
        error: (error as Error).message 
      });
    }
  }
}