import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { chatWithAi, getAiConfig, listAiModels } from '../controllers/aiController.js';

export const aiRoutes = Router();

aiRoutes.use(requireAuth);
aiRoutes.use(requireRole('FIELD_AGENT'));

import type { Request, Response, NextFunction } from 'express';

aiRoutes.get('/config', (req: Request, res: Response, next: NextFunction) => getAiConfig(req, res).catch(next));
aiRoutes.get('/models', (req: Request, res: Response, next: NextFunction) => listAiModels(req, res).catch(next));

aiRoutes.post('/chat', (req: Request, res: Response, next: NextFunction) => chatWithAi(req, res).catch(next));
