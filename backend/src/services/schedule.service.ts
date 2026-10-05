import { dbPool } from '../config/db';

export interface CalendarInfo {
  id: number;
  calendar_name: string;
  workDays: number[]; // e.g. [1, 2, 3, 4, 5, 6] (0=Sun, 1=Mon, ..., 6=Sat)
  workingHoursPerDay: number;
  holidays: Set<string>; // 'YYYY-MM-DD'
}

export class ScheduleService {
  /**
   * Fetches calendar configuration and active holidays
   */
  static async getCalendarInfo(calendarId?: number | null): Promise<CalendarInfo> {
    let calRow: any = null;

    if (calendarId) {
      const [rows]: any = await dbPool.query(`SELECT * FROM company_calendar WHERE id = ? AND deleted_at IS NULL`, [calendarId]);
      if (rows.length > 0) calRow = rows[0];
    }

    if (!calRow) {
      const [rows]: any = await dbPool.query(`SELECT * FROM company_calendar WHERE status = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1`);
      if (rows.length > 0) calRow = rows[0];
    }

    let workDays = [1, 2, 3, 4, 5, 6]; // Default Mon-Sat
    let workingHoursPerDay = 10.0;
    let actualCalendarId = 1;

    if (calRow) {
      actualCalendarId = calRow.id;
      workingHoursPerDay = Number(calRow.working_hours_per_day || 10.0);
      try {
        if (typeof calRow.working_days_json === 'string') {
          const parsed = JSON.parse(calRow.working_days_json);
          if (Array.isArray(parsed)) workDays = parsed.map(Number);
        } else if (Array.isArray(calRow.working_days_json)) {
          workDays = calRow.working_days_json.map(Number);
        }
      } catch (e) {
        if (calRow.work_days) {
          workDays = String(calRow.work_days).split(',').map(Number).filter(n => !isNaN(n));
        }
      }
    }

    // Fetch holidays
    const [holRows]: any = await dbPool.query(
      `SELECT holiday_date FROM holidays WHERE calendar_id = ? OR calendar_id = 1`,
      [actualCalendarId]
    );
    const holidays = new Set<string>(
      holRows.map((h: any) => {
        const d = new Date(h.holiday_date);
        return d.toISOString().split('T')[0];
      })
    );

    return {
      id: actualCalendarId,
      calendar_name: calRow?.calendar_name || 'Default Company Calendar',
      workDays,
      workingHoursPerDay,
      holidays,
    };
  }

  /**
   * Helper to format a Date as YYYY-MM-DD
   */
  static formatDateStr(d: Date | string): string {
    if (typeof d === 'string') {
      return d.split('T')[0];
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a date string safely in local time without UTC offset bugs
   */
  static parseDate(dStr: string | Date): Date {
    if (dStr instanceof Date) return new Date(dStr);
    const parts = dStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dStr);
  }

  /**
   * Checks whether a given date is a working day
   */
  static isWorkDay(date: Date, cal: CalendarInfo): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
    if (!cal.workDays.includes(dayOfWeek)) return false;
    const dateStr = this.formatDateStr(date);
    if (cal.holidays.has(dateStr)) return false;
    return true;
  }

  /**
   * Returns the date itself if it is a working day, or the next available working day
   */
  static getNextWorkDay(date: Date, cal: CalendarInfo): Date {
    const result = new Date(date);
    let attempts = 0;
    while (!this.isWorkDay(result, cal) && attempts < 365) {
      result.setDate(result.getDate() + 1);
      attempts++;
    }
    return result;
  }

  /**
   * Adds N working days to a start date.
   * If duration = 1, start date itself (if working day) is the end date.
   * If duration = 5, returns the 5th working day.
   */
  static addWorkDays(startDate: Date, durationDays: number, cal: CalendarInfo): Date {
    let date = this.getNextWorkDay(new Date(startDate), cal);
    let remaining = Math.max(0, durationDays - 1);
    let safety = 0;
    while (remaining > 0 && safety < 1000) {
      date.setDate(date.getDate() + 1);
      safety++;
      if (this.isWorkDay(date, cal)) {
        remaining--;
      }
    }
    return date;
  }

  /**
   * Calculates the number of working days between two dates inclusive
   */
  static countWorkDays(startDate: Date | string, endDate: Date | string, cal: CalendarInfo): number {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    if (start > end) return 0;

    let count = 0;
    const curr = new Date(start);
    let safety = 0;
    while (curr <= end && safety < 3000) {
      if (this.isWorkDay(curr, cal)) {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
      safety++;
    }
    return Math.max(1, count);
  }

  /**
   * Comprehensive Planning Reschedule & Recalculate Engine
   * Propagates changes across task dependencies, WBS roll-up, and project dates.
   */
  static async calculatePlanningSchedule(
    planningId: number,
    connection?: any
  ): Promise<{
    planning: any;
    wbsList: any[];
    tasksList: any[];
    dependencies: any[];
  }> {
    const db = connection || dbPool;

    // 1. Fetch Planning and Quotation
    const [pRows]: any = await db.query(`SELECT * FROM planning WHERE id = ?`, [planningId]);
    if (pRows.length === 0) throw new Error(`Planning with ID ${planningId} not found`);
    const planning = pRows[0];

    const [qRows]: any = await db.query(`SELECT * FROM quotations WHERE quotation_id = ?`, [planning.quotation_id]);
    const quotation = qRows[0] || {};

    const cal = await this.getCalendarInfo(planning.calendar_id);

    // Initial plan start date reference
    let defaultPlanStart = planning.start_date
      ? this.parseDate(planning.start_date)
      : (quotation.start_date ? this.parseDate(quotation.start_date) : new Date());
    defaultPlanStart = this.getNextWorkDay(defaultPlanStart, cal);

    // 2. Fetch WBS, Tasks, Dependencies, Labour, Materials
    const [wbsRows]: any = await db.query(
      `SELECT * FROM planning_wbs WHERE planning_id = ? ORDER BY sort_order ASC, id ASC`,
      [planningId]
    );

    const [tasksRows]: any = await db.query(
      `SELECT pt.* FROM planning_tasks pt
       JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
       WHERE pw.planning_id = ?
       ORDER BY pt.sort_order ASC, pt.id ASC`,
      [planningId]
    );

    const [depsRows]: any = await db.query(
      `SELECT ptd.* FROM planning_task_dependencies ptd
       JOIN planning_tasks pt ON ptd.task_id = pt.id
       JOIN planning_wbs pw ON pt.planning_wbs_id = pw.id
       WHERE pw.planning_id = ?`,
      [planningId]
    );

    const [labourRows]: any = await db.query(
      `SELECT * FROM planning_wbs_labour WHERE planning_id = ?`,
      [planningId]
    );

    const [materialRows]: any = await db.query(
      `SELECT * FROM planning_wbs_material WHERE planning_id = ?`,
      [planningId]
    );

    // 3. Task Dependency Scheduling via DAG / Forward Pass
    const tasksMap = new Map<number, any>();
    tasksRows.forEach((t: any) => {
      const dur = Math.max(1, Number(t.duration || 1));
      let initialStart: Date | null = null;
      if (t.start_date) {
        initialStart = this.getNextWorkDay(this.parseDate(t.start_date), cal);
      }
      tasksMap.set(t.id, {
        ...t,
        duration: dur,
        calculated_start: initialStart,
        calculated_end: initialStart ? this.addWorkDays(initialStart, dur, cal) : null,
      });
    });

    // Dependency graph structures
    const adj = new Map<number, any[]>(); // predecessor_id -> [dependency edges]
    const inDegree = new Map<number, number>();

    tasksRows.forEach((t: any) => {
      adj.set(t.id, []);
      inDegree.set(t.id, 0);
    });

    depsRows.forEach((d: any) => {
      if (adj.has(d.predecessor_task_id) && inDegree.has(d.task_id)) {
        adj.get(d.predecessor_task_id)!.push(d);
        inDegree.set(d.task_id, inDegree.get(d.task_id)! + 1);
      }
    });

    // Kahn's Queue for DAG traversal
    const queue: number[] = [];
    tasksRows.forEach((t: any) => {
      if (inDegree.get(t.id) === 0) {
        queue.push(t.id);
        const task = tasksMap.get(t.id);
        // If task doesn't have an explicit start date, assign from WBS or Plan start
        if (!task.calculated_start) {
          const parentWbs = wbsRows.find((w: any) => w.id === task.planning_wbs_id);
          const wbsStart = parentWbs?.start_date ? this.parseDate(parentWbs.start_date) : defaultPlanStart;
          task.calculated_start = this.getNextWorkDay(wbsStart, cal);
          task.calculated_end = this.addWorkDays(task.calculated_start, task.duration, cal);
        }
      }
    });

    let processedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      processedCount++;
      const predTask = tasksMap.get(u);

      for (const edge of adj.get(u) || []) {
        const v = edge.task_id;
        const currTask = tasksMap.get(v);
        if (!currTask) continue;

        const lag = Number(edge.lag_days || 0);
        let minStart = new Date(0);

        if (edge.dependency_type === 'FS') {
          // Finish-to-Start: successor starts on or after next working day of predecessor end + lag
          const baseDate = new Date(predTask.calculated_end);
          if (lag >= 0) {
            // Next work day after end
            baseDate.setDate(baseDate.getDate() + 1);
            minStart = this.addWorkDays(baseDate, lag + 1, cal);
          } else {
            // Lead (negative lag)
            minStart = new Date(baseDate);
            minStart.setDate(minStart.getDate() + lag);
            minStart = this.getNextWorkDay(minStart, cal);
          }
        } else if (edge.dependency_type === 'SS') {
          // Start-to-Start: successor starts on or after predecessor start + lag
          minStart = this.addWorkDays(predTask.calculated_start, Math.max(1, lag + 1), cal);
        } else if (edge.dependency_type === 'FF') {
          // Finish-to-Finish: successor finishes on or after predecessor end + lag
          const reqEnd = this.addWorkDays(predTask.calculated_end, Math.max(1, lag + 1), cal);
          minStart = new Date(reqEnd);
          // Reverse approx to start
          minStart.setDate(minStart.getDate() - Math.max(0, currTask.duration * 2));
          minStart = this.getNextWorkDay(minStart, cal);
          // adjust until addWorkDays gives reqEnd
          let calcEnd = this.addWorkDays(minStart, currTask.duration, cal);
          while (calcEnd < reqEnd) {
            minStart.setDate(minStart.getDate() + 1);
            if (this.isWorkDay(minStart, cal)) {
              calcEnd = this.addWorkDays(minStart, currTask.duration, cal);
            }
          }
        } else if (edge.dependency_type === 'SF') {
          // Start-to-Finish
          const reqEnd = this.addWorkDays(predTask.calculated_start, Math.max(1, lag + 1), cal);
          minStart = new Date(reqEnd);
          minStart.setDate(minStart.getDate() - Math.max(0, currTask.duration * 2));
          minStart = this.getNextWorkDay(minStart, cal);
          let calcEnd = this.addWorkDays(minStart, currTask.duration, cal);
          while (calcEnd < reqEnd) {
            minStart.setDate(minStart.getDate() + 1);
            if (this.isWorkDay(minStart, cal)) {
              calcEnd = this.addWorkDays(minStart, currTask.duration, cal);
            }
          }
        }

        // If dependency pushes start date forward, update
        if (!currTask.calculated_start || minStart > currTask.calculated_start) {
          currTask.calculated_start = this.getNextWorkDay(minStart, cal);
          currTask.calculated_end = this.addWorkDays(currTask.calculated_start, currTask.duration, cal);
        }

        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (tasksRows.length > 0 && processedCount < tasksRows.length) {
      throw new Error('Circular dependency detected in tasks. Please check predecessor relationships.');
    }

    // 4. Update Tasks in Database & Local Map
    for (const [id, task] of tasksMap.entries()) {
      if (task.calculated_start && task.calculated_end) {
        const startStr = this.formatDateStr(task.calculated_start);
        const endStr = this.formatDateStr(task.calculated_end);
        const dur = this.countWorkDays(startStr, endStr, cal);

        await db.query(
          `UPDATE planning_tasks SET 
             start_date = ?, 
             end_date = ?, 
             duration = ?,
             baseline_start = COALESCE(baseline_start, ?),
             baseline_end = COALESCE(baseline_end, ?),
             baseline_duration = CASE WHEN baseline_duration = 0 THEN ? ELSE baseline_duration END
           WHERE id = ?`,
          [startStr, endStr, dur, startStr, endStr, dur, id]
        );
        task.start_date = startStr;
        task.end_date = endStr;
        task.duration = dur;
      }
    }

    // 5. WBS Date & Cost Roll-up
    let overallPlanStart: Date | null = null;
    let overallPlanEnd: Date | null = null;
    let totalPlanLabourCost = 0;
    let totalPlanMaterialCost = 0;
    let totalPlanBudget = 0;

    const updatedWbsList: any[] = [];

    for (const wbs of wbsRows) {
      const childTasks = Array.from(tasksMap.values()).filter((t: any) => t.planning_wbs_id === wbs.id);
      const childLabour = labourRows.filter((l: any) => l.planning_wbs_id === wbs.id);
      const childMaterials = materialRows.filter((m: any) => m.planning_wbs_id === wbs.id);

      let wbsStart: Date | null = null;
      let wbsEnd: Date | null = null;

      // 1) From tasks
      if (childTasks.length > 0) {
        for (const t of childTasks) {
          if (t.calculated_start) {
            if (!wbsStart || t.calculated_start < wbsStart) wbsStart = new Date(t.calculated_start);
          }
          if (t.calculated_end) {
            if (!wbsEnd || t.calculated_end > wbsEnd) wbsEnd = new Date(t.calculated_end);
          }
        }
      }

      // 2) From Labour / Materials dates if WBS has no tasks or earlier/later
      for (const l of childLabour) {
        if (l.start_date) {
          const ls = this.parseDate(l.start_date);
          if (!wbsStart || ls < wbsStart) wbsStart = ls;
        }
        if (l.end_date) {
          const le = this.parseDate(l.end_date);
          if (!wbsEnd || le > wbsEnd) wbsEnd = le;
        }
      }
      for (const m of childMaterials) {
        if (m.start_date) {
          const ms = this.parseDate(m.start_date);
          if (!wbsStart || ms < wbsStart) wbsStart = ms;
        }
        if (m.end_date) {
          const me = this.parseDate(m.end_date);
          if (!wbsEnd || me > wbsEnd) wbsEnd = me;
        }
      }

      // 3) Fallback to WBS's own dates
      if (!wbsStart) {
        wbsStart = wbs.start_date ? this.parseDate(wbs.start_date) : (wbs.baseline_start ? this.parseDate(wbs.baseline_start) : defaultPlanStart);
      }
      wbsStart = this.getNextWorkDay(wbsStart, cal);

      if (!wbsEnd) {
        const dur = Math.max(1, Number(wbs.duration || wbs.baseline_duration || 5));
        wbsEnd = this.addWorkDays(wbsStart, dur, cal);
      }

      const wbsStartStr = this.formatDateStr(wbsStart);
      const wbsEndStr = this.formatDateStr(wbsEnd);
      const wbsDuration = this.countWorkDays(wbsStartStr, wbsEndStr, cal);

      // Cost rollups
      let wbsLabourCost = childLabour.reduce((sum: number, l: any) => sum + Number(l.amount || (Number(l.hours || 0) * Number(l.rate || 0))), 0);
      let wbsMaterialCost = childMaterials.reduce((sum: number, m: any) => sum + Number(m.amount || (Number(m.quantity || 0) * Number(m.rate || 0))), 0);
      let wbsPlannedHours = childLabour.reduce((sum: number, l: any) => sum + Number(l.hours || 0), 0);
      
      if (childTasks.length > 0) {
        const taskLabourCost = childTasks.reduce((sum: number, t: any) => sum + Number(t.planned_labour_cost || 0), 0);
        const taskMatCost = childTasks.reduce((sum: number, t: any) => sum + Number(t.planned_material_cost || 0), 0);
        const taskHours = childTasks.reduce((sum: number, t: any) => sum + Number(t.planned_hours || 0), 0);
        if (taskLabourCost > 0) wbsLabourCost = Math.max(wbsLabourCost, taskLabourCost);
        if (taskMatCost > 0) wbsMaterialCost = Math.max(wbsMaterialCost, taskMatCost);
        if (taskHours > 0) wbsPlannedHours = Math.max(wbsPlannedHours, taskHours);
      }

      // If no child items, preserve existing WBS costs
      if (wbsLabourCost === 0 && Number(wbs.planned_labour_cost || 0) > 0) wbsLabourCost = Number(wbs.planned_labour_cost);
      if (wbsMaterialCost === 0 && Number(wbs.planned_material_cost || 0) > 0) wbsMaterialCost = Number(wbs.planned_material_cost);
      const wbsBudget = Math.max(Number(wbs.budget_amount || 0), wbsLabourCost + wbsMaterialCost + Number(wbs.planned_other_cost || 0));

      await db.query(
        `UPDATE planning_wbs SET 
           start_date = ?, 
           end_date = ?, 
           duration = ?,
           planned_hours = ?,
           planned_labour_cost = ?,
           planned_material_cost = ?,
           budget_amount = ?,
           baseline_start = COALESCE(baseline_start, ?),
           baseline_end = COALESCE(baseline_end, ?),
           baseline_duration = CASE WHEN baseline_duration = 0 THEN ? ELSE baseline_duration END
         WHERE id = ?`,
        [
          wbsStartStr, wbsEndStr, wbsDuration,
          wbsPlannedHours, wbsLabourCost, wbsMaterialCost, wbsBudget,
          wbsStartStr, wbsEndStr, wbsDuration,
          wbs.id
        ]
      );

      updatedWbsList.push({
        ...wbs,
        start_date: wbsStartStr,
        end_date: wbsEndStr,
        duration: wbsDuration,
        planned_hours: wbsPlannedHours,
        planned_labour_cost: wbsLabourCost,
        planned_material_cost: wbsMaterialCost,
        budget_amount: wbsBudget,
      });

      // Overall Project Date & Cost Track
      if (!overallPlanStart || wbsStart < overallPlanStart) overallPlanStart = wbsStart;
      if (!overallPlanEnd || wbsEnd > overallPlanEnd) overallPlanEnd = wbsEnd;

      totalPlanLabourCost += wbsLabourCost;
      totalPlanMaterialCost += wbsMaterialCost;
      totalPlanBudget += wbsBudget;
    }

    // 6. Overall Planning Header Update
    const finalStartStr = overallPlanStart ? this.formatDateStr(overallPlanStart) : this.formatDateStr(defaultPlanStart);
    const finalEndStr = overallPlanEnd ? this.formatDateStr(overallPlanEnd) : finalStartStr;
    const totalDuration = this.countWorkDays(finalStartStr, finalEndStr, cal);

    // Calculate taxes
    const [taxRows]: any = await db.query(`SELECT * FROM planning_taxes WHERE planning_id = ?`, [planningId]);
    let totalTaxAmount = 0;
    for (const tax of taxRows) {
      const pct = Number(tax.tax_percentage || 0);
      const amt = (totalPlanBudget * pct) / 100;
      await db.query(`UPDATE planning_taxes SET taxable_amount = ?, tax_amount = ? WHERE id = ?`, [totalPlanBudget, amt, tax.id]);
      totalTaxAmount += amt;
    }

    await db.query(
      `UPDATE planning SET 
         start_date = ?, 
         end_date = ?, 
         total_duration = ?, 
         total_budget = ?, 
         total_labour_cost = ?, 
         total_material_cost = ?,
         total_tax_amount = ?
       WHERE id = ?`,
      [
        finalStartStr,
        finalEndStr,
        totalDuration,
        totalPlanBudget,
        totalPlanLabourCost,
        totalPlanMaterialCost,
        totalTaxAmount,
        planningId
      ]
    );

    const [updatedPlanRows]: any = await db.query(`SELECT * FROM planning WHERE id = ?`, [planningId]);

    return {
      planning: updatedPlanRows[0],
      wbsList: updatedWbsList,
      tasksList: Array.from(tasksMap.values()),
      dependencies: depsRows,
    };
  }
}
