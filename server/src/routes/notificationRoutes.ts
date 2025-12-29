import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listMyNotifications, markNotificationRead } from '../controllers/notificationController.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', (req, res, next) => listMyNotifications(req, res).catch(next));
notificationRoutes.patch('/:notificationId/read', (req, res, next) => markNotificationRead(req, res).catch(next));
