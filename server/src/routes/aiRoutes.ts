import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { chatWithAi } from '../controllers/aiController.js';

export const aiRoutes = Router();

aiRoutes.use(requireAuth);
aiRoutes.use(requireRole('FIELD_AGENT'));

aiRoutes.post('/chat', (req, res, next) => chatWithAi(req, res).catch(next));
