import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement';
import { authenticate, isAdmin } from '../middlewares';

const announcement = Router();
const controller = new AnnouncementController();

announcement.post('/', authenticate, isAdmin, (req, res) => controller.create(req, res));
announcement.get('/', authenticate, (req, res) => controller.list(req, res));
announcement.get('/:id', authenticate, (req, res) => controller.getById(req, res));
announcement.patch('/:id', authenticate, isAdmin, (req, res) => controller.update(req, res));
announcement.delete('/:id', authenticate, isAdmin, (req, res) => controller.delete(req, res));

export default announcement;
