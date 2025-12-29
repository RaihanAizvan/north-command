import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e = err instanceof HttpError ? err : null;
  const status = e?.status ?? 500;
  const message = e?.message ?? 'Internal server error';

  if (status >= 500) {
    // Avoid crashing the process if the error object has exotic getters (seen with some Node inspect paths).
    try {
      if (err instanceof Error) {
        console.error(err.stack ?? err.message);
      } else {
        console.error(String(err));
      }
    } catch {
      console.error('Internal error');
    }
  }

  res.status(status).json({ message });
}
