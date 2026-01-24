import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

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
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
      // Fallback to application default credentials if service account info is not available
      // but application default credentials are configured
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
      });
    } else {
      // If no credentials are available, throw a more descriptive error
      throw new Error(
        'Firebase configuration is incomplete. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

export const firebaseAdmin = admin;
export const messaging = admin.messaging();