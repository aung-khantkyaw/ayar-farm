import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Check if Firebase Admin is already initialized to prevent multiple initializations
if (!admin.apps.length) {
  try {
    // Initialize with service account key from environment variables
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback to application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }

    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

export const firebaseAdmin = admin;
export const messaging = admin.messaging();