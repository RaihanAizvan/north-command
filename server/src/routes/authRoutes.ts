import { Router } from 'express';
import { loginAgent, loginOverseer, registerAgent } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/login/overseer', (req, res, next) => loginOverseer(req, res).catch(next));
authRoutes.post('/login/agent', (req, res, next) => loginAgent(req, res).catch(next));
authRoutes.post('/register/agent', (req, res, next) => registerAgent(req, res).catch(next));

