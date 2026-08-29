import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  return sendError(res, message, errors, statusCode);
}
