import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getOverseer, listDm, sendDm } from '../controllers/chatController.js';

export const chatRoutes = Router();

chatRoutes.use(requireAuth);

chatRoutes.get('/overseer', (req, res, next) => getOverseer(req, res).catch(next));
chatRoutes.get('/dm/:userId', (req, res, next) => listDm(req, res).catch(next));
chatRoutes.post('/dm/:userId', (req, res, next) => sendDm(req, res).catch(next));
