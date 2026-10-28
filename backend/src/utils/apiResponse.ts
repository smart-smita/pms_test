import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, message: string, data?: T, statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, errors: any[] = [], statusCode: number = 400) {
  // Sanitize database connection errors
  let safeMessage = message;
  if (message.includes('ECONNREFUSED') || message.includes('Access denied for user')) {
    safeMessage = 'Database connection failed. Please try again later or contact support.';
    if (statusCode === 400) statusCode = 500; // Force 500 for DB connection errors
  }

  const response: ApiResponse = {
    success: false,
    message: safeMessage,
    errors,
  };
  return res.status(statusCode).json(response);
}
