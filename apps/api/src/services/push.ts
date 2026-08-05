import { messaging } from '../config/firebase';
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { emitToUser } from '../socket'; // Import socket function to emit to specific user

// Check if messaging is available
const isMessagingAvailable = !!messaging;

export interface PushNotificationData {
  [key: string]: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: PushNotificationData;
  userId?: string;
  topic?: string;
}

export class PushService {
  /**
   * Send push notification to a specific user
   */
  static async sendToUser(userId: string, title: string, body: string, data?: PushNotificationData): Promise<boolean> {
    try {
      // Check if Firebase messaging is properly initialized
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Notification not sent.');
        return false;
      }

      const tokens = await prisma.deviceToken.findMany({
        where: { userId }
      });

      if (tokens.length === 0) {
        logger.warn(`No device tokens found for user: ${userId}`);
        // Emit a socket event to notify the user's client to check for announcements
        emitToUser(userId, 'announcement_notification_missing_token', {
          title,
          body,
          data,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      const messages = tokens.map(token => ({
        token: token.token,
        notification: { title, body },
        data: data || {},
      }));

      // Send messages individually since sendAll might not be available in all versions
      let successCount = 0;
      let failureCount = 0;

      for (const message of messages) {
        try {
          await messaging!.send(message);
          successCount++;
        } catch (error) {
          failureCount++;
          logger.error(`Failed to send notification to token ${message.token}:`, error);
        }
      }

      logger.info(`Sent notifications to user ${userId}. Success: ${successCount}, Failed: ${failureCount}`);

      return true;
    } catch (error) {
      logger.error(`Error sending push notification to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send push notification to a specific device token
   */
  static async sendToDeviceToken(deviceToken: string, title: string, body: string, data?: PushNotificationData): Promise<string> {
    try {
      // Check if Firebase messaging is properly initialized
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Notification not sent.');
        throw new Error('Firebase Messaging is not available');
      }

      const response = await messaging!.send({
        token: deviceToken,
        notification: { title, body },
        data: data || {},
      });

      logger.info(`Notification sent successfully to device token: ${deviceToken}`);
      return response;
    } catch (error) {
      logger.error(`Error sending push notification to device token ${deviceToken}:`, error);
      throw error;
    }
  }

  /**
   * Send push notification to a topic
   */
  static async sendToTopic(topic: string, title: string, body: string, data?: PushNotificationData): Promise<string> {
    try {
      // Check if Firebase messaging is properly initialized
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Notification not sent.');
        throw new Error('Firebase Messaging is not available');
      }

      const response = await messaging!.send({
        topic: topic,
        notification: { title, body },
        data: data || {},
      });

      logger.info(`Notification sent successfully to topic: ${topic}`);
      return response;
    } catch (error) {
      logger.error(`Error sending push notification to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe device tokens to a topic
   */
  static async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Subscription not performed.');
        return;
      }

      await messaging!.subscribeToTopic(tokens, topic);
      logger.info(`Successfully subscribed ${tokens.length} devices to topic: ${topic}`);
    } catch (error) {
      logger.error(`Error subscribing devices to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   */
  static async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Unsubscription not performed.');
        return;
      }

      await messaging!.unsubscribeFromTopic(tokens, topic);
      logger.info(`Successfully unsubscribed ${tokens.length} devices from topic: ${topic}`);
    } catch (error) {
      logger.error(`Error unsubscribing devices from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Validate a device token
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      if (!isMessagingAvailable) {
        logger.warn('Firebase Messaging is not available. Token validation not performed.');
        return false;
      }

      // Try to send a minimal message to validate the token
      await messaging!.send({
        token: token,
        data: { validation: 'true' },
      }, true); // dryRun = true to validate without actually sending

      return true;
    } catch (error) {
      logger.error(`Invalid device token: ${token}`, error);
      return false;
    }
  }

  /**
   * Clean invalid device tokens
   */
  static async cleanInvalidTokens(): Promise<void> {
    // This would typically iterate through stored tokens and validate them
    // For now, we'll just log this as a maintenance function
    logger.info('Cleaning invalid device tokens...');
  }
}