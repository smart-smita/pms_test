import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ProjectController {
  private projectService = new ProjectService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, search } = req.query;
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      
      if (user.role_name === 'Manager') managerId = user.id;
      if (user.role_name === 'Employee') employeeId = user.id;

      const projects = await this.projectService.getProjects(status as string, search as string, managerId, employeeId);
      return sendSuccess(res, 'Projects retrieved successfully', projects);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to fetch projects', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await this.projectService.getProjectById(id);
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
}
