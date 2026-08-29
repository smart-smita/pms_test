import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RoleName } from '../types';
import { verifyAccessToken } from '../config/jwt';
import { sendError } from '../utils/apiResponse';

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token missing or malformed', [], 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired access token', [], 401);
  }
}

export function authorizeRoles(allowedRoles: RoleName[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', [], 401);
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return sendError(res, `Forbidden: Role '${req.user.role_name}' does not have access`, [], 403);
    }

    return next();
  };
}
