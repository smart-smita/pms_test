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
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
}
