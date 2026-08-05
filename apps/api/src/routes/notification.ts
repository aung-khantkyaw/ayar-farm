import { Router } from 'express';
import { NotificationController } from '../controllers/notification';
import { authenticate } from '../middlewares';

const notification = Router();
const notificationController = new NotificationController();

notification.post('/', authenticate, (req, res) => notificationController.create(req, res));
notification.get('/', authenticate, (req, res) => notificationController.getAll(req, res));
notification.get('/user/:userId', authenticate, (req, res) => notificationController.getByUser(req, res));
notification.get('/:id', authenticate, (req, res) => notificationController.getById(req, res));
notification.patch('/:id/read', authenticate, (req, res) => notificationController.markRead(req, res));
notification.put('/:id/read', authenticate, (req, res) => notificationController.markRead(req, res));
notification.delete('/:id', authenticate, (req, res) => notificationController.delete(req, res));

export default notification;
