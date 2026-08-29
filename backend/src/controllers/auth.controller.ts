import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuditService } from '../services/audit.service';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const result = await this.authService.login(
        parseResult.data.employee_code,
        parseResult.data.password
      );
      
      // Inject user for audit log
      (req as any).user = { id: result.user.employee_id };
      await AuditService.log(req, 'auth', 'login', `User logged in: ${result.user.employee_code}`, result.user.employee_id);
      
      return sendSuccess(res, 'Login successful', result);
    } catch (error: any) {
      return sendError(res, error.message || 'Login failed', [], 401);
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const result = await this.authService.forgotPassword(parseResult.data.email);
      return sendSuccess(res, result.message, result);
    } catch (error: any) {
      return sendError(res, error.message || 'Request failed', [], 400);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const result = await this.authService.resetPassword(
        parseResult.data.token,
        parseResult.data.new_password
      );
      return sendSuccess(res, result.message);
    } catch (error: any) {
      return sendError(res, error.message || 'Reset password failed', [], 400);
    }
  };

  logout = async (req: Request, res: Response) => {
    return sendSuccess(res, 'Logged out successfully');
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const { name } = req.body;
      const result = await this.authService.updateProfile(userId, name);
      return sendSuccess(res, 'Profile updated successfully', result);
    } catch (error: any) {
      return sendError(res, error.message || 'Profile update failed', [], 400);
    }
  };

  updatePassword = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      await this.authService.updatePassword(userId, currentPassword, newPassword);
      return sendSuccess(res, 'Password updated successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Password update failed', [], 400);
    }
  };

  submitSupportTicket = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const { subject, message } = req.body;
      await this.authService.submitSupportTicket(userId, subject, message);
      return sendSuccess(res, 'Support ticket submitted successfully');
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit ticket', [], 500);
    }
  };
}
