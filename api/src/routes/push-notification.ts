import { Router } from 'express';
import { PushNotificationController } from '../controllers/push-notification';
import { authenticate } from '../middlewares';

const pushNotification = Router();
const pushNotificationController = new PushNotificationController();

// Routes that require authentication
pushNotification.post('/user', authenticate, (req, res) => pushNotificationController.sendToUser(req, res));
pushNotification.post('/device', authenticate, (req, res) => pushNotificationController.sendToDevice(req, res));
pushNotification.post('/topic', authenticate, (req, res) => pushNotificationController.sendToTopic(req, res));
pushNotification.post('/subscribe', authenticate, (req, res) => pushNotificationController.subscribeToTopic(req, res));
pushNotification.post('/unsubscribe', authenticate, (req, res) => pushNotificationController.unsubscribeFromTopic(req, res));
pushNotification.post('/validate', authenticate, (req, res) => pushNotificationController.validateToken(req, res));

export default pushNotification;