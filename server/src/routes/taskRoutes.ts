import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createTask,
  deleteTask,
  listElves,
  listMyTasks,
  listTasks,
  updateMyTaskStatus,
  updateTask,
} from '../controllers/taskController.js';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

// Santa

taskRoutes.get('/', requireRole('OVERSEER'), (req, res, next) => listTasks(req, res).catch(next));
taskRoutes.post('/', requireRole('OVERSEER'), (req, res, next) => createTask(req, res).catch(next));
taskRoutes.patch('/:taskId', requireRole('OVERSEER'), (req, res, next) => updateTask(req, res).catch(next));
taskRoutes.delete('/:taskId', requireRole('OVERSEER'), (req, res, next) => deleteTask(req, res).catch(next));

taskRoutes.get('/elves', requireRole('OVERSEER'), (req, res, next) => listElves(req, res).catch(next));

// Elf

taskRoutes.get('/my', requireRole('FIELD_AGENT'), (req, res, next) => listMyTasks(req, res).catch(next));
taskRoutes.patch('/my/:taskId/status', requireRole('FIELD_AGENT'), (req, res, next) => updateMyTaskStatus(req, res).catch(next));
