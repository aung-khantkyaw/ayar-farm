import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

let messagingInstance: admin.messaging.Messaging | null = null;

// Check if Firebase Admin is already initialized to prevent multiple initializations
if (!admin.apps.length) {
  try {
    // Initialize with service account key from environment variables
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
      // Process the private key to convert escaped newlines (\n) to actual newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')
        ? process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        : process.env.FIREBASE_PRIVATE_KEY;

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      messagingInstance = admin.messaging();
      logger.info('Firebase Admin SDK initialized successfully');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
      // Fallback to application default credentials if service account info is not available
      // but application default credentials are configured
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      });

      messagingInstance = admin.messaging();
      logger.info('Firebase Admin SDK initialized with application default credentials');
    } else {
      // If no credentials are available, log a warning but don't throw an error
      // This allows the app to continue running even without Firebase
      logger.warn(
        'Firebase configuration is incomplete. Push notifications will be disabled. ' +
        'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    // Don't throw the error, just log it and continue without Firebase
    logger.warn('Firebase will be disabled due to configuration error. Push notifications will not work.');
  }
} else {
  // If already initialized, get the existing messaging instance
  try {
    messagingInstance = admin.messaging();
  } catch (error) {
    logger.warn('Could not get Firebase messaging instance:', error);
  }
}

export const firebaseAdmin = admin;
export const messaging = messagingInstance;