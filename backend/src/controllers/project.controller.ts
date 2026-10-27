import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { createProjectSchema, updateProjectSchema, updateProjectStatusSchema } from '../validators/project.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ProjectController {
  private projectService = new ProjectService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;
      
      if (user?.role_name === 'Manager') managerId = userId;
      if (user?.role_name === 'Employee') employeeId = userId;

      const projects = await this.projectService.getProjects(status as string, search as string, managerId, employeeId);
      return sendSuccess(res, 'Projects retrieved successfully', projects);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch projects', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;
      
      if (user?.role_name === 'Manager') managerId = userId;
      if (user?.role_name === 'Employee') employeeId = userId;

      const project = await this.projectService.getProjectById(id, managerId, employeeId);
      return sendSuccess(res, 'Project retrieved successfully', project);
    } catch (error: any) {
      return sendError(res, error.message || 'Project not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const project = await this.projectService.createProject(parseResult.data);
      return sendSuccess(res, 'Project created successfully', project, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create project', [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.projectService.updateProject(id, parseResult.data);
      return sendSuccess(res, 'Project updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update project', [], 400);
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    const parseResult = updateProjectStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.projectService.updateProject(id, { status: parseResult.data.status });
      return sendSuccess(res, 'Project status updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update project status', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deletedBy = (req as any).user.id;
      const success = await this.projectService.deleteProject(id, deletedBy);
      if (success) {
        res.json({ success: true, message: 'Project deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Project not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  get360Details = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;
      
      if (user?.role_name === 'Manager') managerId = userId;
      if (user?.role_name === 'Employee') employeeId = userId;

      const details = await this.projectService.getProject360Details(id, managerId, employeeId);
      return sendSuccess(res, 'Project 360 details retrieved successfully', details);
    } catch (error: any) {
      return sendError(res, error.message || 'Project 360 details not found', [], 404);
    }
  };
}
