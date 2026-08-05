import { Router } from 'express';
import { DeviceTokenController } from '../controllers/device-token';
import { authenticate } from '../middlewares';

const deviceToken = Router();
const deviceTokenController = new DeviceTokenController();

deviceToken.post('/', authenticate, (req, res) => deviceTokenController.registerDeviceToken(req, res));
deviceToken.delete('/', authenticate, (req, res) => deviceTokenController.removeDeviceToken(req, res));
deviceToken.get('/', authenticate, (req, res) => deviceTokenController.getUserDeviceTokens(req, res));

export default deviceToken;