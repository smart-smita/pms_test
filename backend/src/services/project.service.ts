import { ProjectRepository } from '../repositories/project.repository';

export class ProjectService {
  private projectRepo = new ProjectRepository();

  async getProjects(status?: string, search?: string, managerId?: number, employeeId?: number) {
    return await this.projectRepo.findAll(status, search, managerId, employeeId);
  }

  async getProjectById(id: number) {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new Error('Project not found');
    return project;
  }

  async createProject(data: any) {
    const existing = await this.projectRepo.findByCode(data.project_code);
    if (existing) throw new Error('Project code already exists');

    const projectId = await this.projectRepo.create(data);
    
    // Insert disciplines (tasks) if provided
    if (data.disciplines && Array.isArray(data.disciplines) && data.disciplines.length > 0) {
      const { TaskRepository } = await import('../repositories/task.repository');
      const taskRepo = new TaskRepository();
      
      for (const disc of data.disciplines) {
        await taskRepo.create({
          project_id: projectId,
          task_name: disc.task_name,
          start_date: disc.start_date || undefined,
          target_date: disc.target_date || undefined,
          estimated_hours: disc.estimated_hours || 0,
          required_worker_count: 1, // Default
          status: 'pending'
        });
      }
    }

    return await this.projectRepo.findById(projectId);
  }

  async updateProject(id: number, data: any) {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new Error('Project not found');

    await this.projectRepo.update(id, data);
    return await this.projectRepo.findById(id);
  }

  async deleteProject(id: number, deletedBy: number) {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new Error('Project not found');
    return await this.projectRepo.softDelete(id, deletedBy);
  }
}
