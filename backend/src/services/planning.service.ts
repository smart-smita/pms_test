import { PlanningRepository } from '../repositories/planning.repository';
import { ScheduleService } from './schedule.service';

export class PlanningService {
  static async getAll(filters: { status?: string; customer_id?: number; quotation_id?: number } = {}) {
    return PlanningRepository.getAll(filters);
  }

  static async getById(id: number) {
    return PlanningRepository.getById(id);
  }

  static async createFromQuotation(quotationId: number, userId?: number, ipAddress?: string) {
    return PlanningRepository.createFromQuotation(quotationId, userId, ipAddress);
  }

  static async saveDraft(id: number, data: any, userId?: number, ipAddress?: string) {
    return PlanningRepository.saveDraft(id, data, userId, ipAddress);
  }

  static async validatePlanning(id: number) {
    return PlanningRepository.validatePlanning(id);
  }

  static async submitPlanning(id: number, userId?: number, ipAddress?: string) {
    return PlanningRepository.submitPlanning(id, userId, ipAddress);
  }

  static async approvePlanning(id: number, userId?: number, ipAddress?: string) {
    return PlanningRepository.approvePlanning(id, userId, ipAddress);
  }

  static async rejectPlanning(id: number, reason: string, userId?: number, ipAddress?: string) {
    return PlanningRepository.rejectPlanning(id, reason, userId, ipAddress);
  }

  static async calculateSchedule(id: number) {
    await ScheduleService.calculatePlanningSchedule(id);
    return PlanningRepository.getById(id);
  }

  static async applyQuotationChanges(id: number, userId?: number, ipAddress?: string) {
    return PlanningRepository.applyQuotationChanges(id, userId, ipAddress);
  }
}
