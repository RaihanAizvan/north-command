import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { deleteElf, getAnalytics, listElvesAdmin, resetElfPassword } from '../controllers/adminController.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth);
adminRoutes.use(requireRole('OVERSEER'));

adminRoutes.get('/analytics', (req, res, next) => getAnalytics(req, res).catch(next));
adminRoutes.get('/elves', (req, res, next) => listElvesAdmin(req, res).catch(next));
adminRoutes.post('/elves/:elfId/reset-password', (req, res, next) => resetElfPassword(req, res).catch(next));
adminRoutes.delete('/elves/:elfId', (req, res, next) => deleteElf(req, res).catch(next));
