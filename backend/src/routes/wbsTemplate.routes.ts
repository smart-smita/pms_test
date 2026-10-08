import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { WbsTemplateRepository } from '../repositories/wbsTemplate.repository';
import { AuthenticatedRequest } from '../types';
import { Response } from 'express';

const router = Router();
const repo = new WbsTemplateRepository();

const sortDetailsTopologically = (details: any[]) => {
  const result: any[] = [];
  const byParent = new Map<any, any[]>();
  
  for (const d of details) {
    const pId = d.parent_id || null;
    if (!byParent.has(pId)) byParent.set(pId, []);
    byParent.get(pId)!.push(d);
  }

  const addChildren = (pId: any) => {
    const children = byParent.get(pId) || [];
    children.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    for (const c of children) {
      result.push(c);
      addChildren(c.id);
    }
  };

  const allIds = new Set(details.map(d => d.id));
  const roots = details.filter(d => !d.parent_id || !allIds.has(d.parent_id));
  
  roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  for (const r of roots) {
    result.push(r);
    addChildren(r.id);
  }

  return result;
};

router.use(authenticateJwt);

// ── Templates ──────────────────────────────────────────────────────────────

// GET /wbs-templates
router.get('/', requirePermission('wbs', 'view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project_type_id = req.query.project_type_id ? Number(req.query.project_type_id) : undefined;
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const data = await repo.findAll({ project_type_id, status });
    return sendSuccess(res, 'WBS templates retrieved', data);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to retrieve WBS templates', [], 500);
  }
});

// GET /wbs-templates/:id
router.get('/:id', requirePermission('wbs', 'view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const template = await repo.findById(id);
    if (!template) return sendError(res, 'WBS Template not found', [], 404);
    return sendSuccess(res, 'WBS Template retrieved', template);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to retrieve WBS template', [], 500);
  }
});

// GET /wbs-templates/:id/project-types/:projectTypeId/wbs
// Fulfills Quotation & Project requirement: fetch ONLY the WBS items/tree belonging to a specific Project Type
router.get('/:id/project-types/:projectTypeId/wbs', requirePermission('wbs', 'view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    const projectTypeId = parseInt(req.params.projectTypeId, 10);
    const template = await repo.findById(templateId);
    if (!template) return sendError(res, 'WBS Template not found', [], 404);

    const details = await repo.findDetails(templateId, projectTypeId);
    return sendSuccess(res, 'Project Type WBS items retrieved', details);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to retrieve project type WBS items', [], 500);
  }
});

// POST /wbs-templates
router.post('/', requirePermission('wbs', 'create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { template_code, template_name, description, status, project_type_ids, details } = req.body;
    if (!template_name?.trim()) return sendError(res, 'Template name is required', [], 400);

    const code = template_code?.trim() || await repo.generateCode();
    const existing = await repo.findByCode(code);
    if (existing) return sendError(res, `Template code '${code}' already exists`, [], 409);

    const id = await repo.create({
      template_code: code,
      template_name: template_name.trim(),
      description: description || null,
      status: status !== undefined ? Number(status) : 1,
      created_by: req.user?.employee_id,
    });

    // Save associated project types
    const validPtIds: number[] = Array.isArray(project_type_ids)
      ? project_type_ids.map(Number).filter(n => !isNaN(n) && n > 0)
      : [];

    // Extract any project_type_ids from details if not explicitly listed
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d.project_type_id && !validPtIds.includes(Number(d.project_type_id))) {
          validPtIds.push(Number(d.project_type_id));
        }
      }
    }

    if (validPtIds.length > 0) {
      await repo.setTemplateProjectTypes(id, validPtIds);
    }

    // Insert hierarchical details
    if (Array.isArray(details) && details.length > 0) {
      const sortedDetails = sortDetailsTopologically(details);
      const idMap = new Map<string | number, number>();
      for (let i = 0; i < sortedDetails.length; i++) {
        const d = sortedDetails[i];
        if (!d.wbs_name?.trim() && !d.wbs_id) continue;
        const ptId = Number(d.project_type_id);
        if (!ptId) continue;

        const parentId = d.parent_id ? idMap.get(d.parent_id) || null : null;
        const newDetailId = await repo.createDetail({
          template_id: id,
          project_type_id: ptId,
          parent_id: parentId,
          wbs_id: d.wbs_id ? Number(d.wbs_id) : null,
          wbs_name: d.wbs_name?.trim() || '',
          wbs_code: d.wbs_code?.trim() || null,
          description: d.description || null,
          sort_order: d.sort_order !== undefined ? Number(d.sort_order) : i,
        });
        if (d.id) {
          idMap.set(d.id, newDetailId);
        }
      }
    }

    const created = await repo.findById(id);
    return sendSuccess(res, 'WBS Template created successfully', created, 201);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to create WBS template', [], 500);
  }
});

// PUT /wbs-templates/:id
router.put('/:id', requirePermission('wbs', 'update'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { template_name, description, status, project_type_ids, details } = req.body;
    const template = await repo.findById(id);
    if (!template) return sendError(res, 'WBS Template not found', [], 404);

    await repo.update(id, {
      template_name: template_name?.trim() || template.template_name,
      description: description !== undefined ? description : template.description,
      status: status !== undefined ? Number(status) : template.status,
    });

    // Update project types
    const validPtIds: number[] = Array.isArray(project_type_ids)
      ? project_type_ids.map(Number).filter(n => !isNaN(n) && n > 0)
      : [];

    if (Array.isArray(details)) {
      for (const d of details) {
        if (d.project_type_id && !validPtIds.includes(Number(d.project_type_id))) {
          validPtIds.push(Number(d.project_type_id));
        }
      }
    }

    await repo.setTemplateProjectTypes(id, validPtIds);

    // Replace details if provided
    if (Array.isArray(details)) {
      await repo.deleteAllDetails(id);
      const sortedDetails = sortDetailsTopologically(details);
      const idMap = new Map<string | number, number>();
      for (let i = 0; i < sortedDetails.length; i++) {
        const d = sortedDetails[i];
        if (!d.wbs_name?.trim() && !d.wbs_id) continue;
        const ptId = Number(d.project_type_id);
        if (!ptId) continue;

        const parentId = d.parent_id ? idMap.get(d.parent_id) || null : null;
        const newDetailId = await repo.createDetail({
          template_id: id,
          project_type_id: ptId,
          parent_id: parentId,
          wbs_id: d.wbs_id ? Number(d.wbs_id) : null,
          wbs_name: d.wbs_name?.trim() || '',
          wbs_code: d.wbs_code?.trim() || null,
          description: d.description || null,
          sort_order: d.sort_order !== undefined ? Number(d.sort_order) : i,
        });
        if (d.id) {
          idMap.set(d.id, newDetailId);
        }
      }
    }

    const updated = await repo.findById(id);
    return sendSuccess(res, 'WBS Template updated successfully', updated);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to update WBS template', [], 500);
  }
});

// DELETE /wbs-templates/:id
router.delete('/:id', requirePermission('wbs', 'delete'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await repo.softDelete(id);
    if (!deleted) return sendError(res, 'WBS Template not found', [], 404);
    return sendSuccess(res, 'WBS Template deleted successfully');
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to delete WBS template', [], 500);
  }
});

// POST /wbs-templates/:id/duplicate
router.post('/:id/duplicate', requirePermission('wbs', 'create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const newId = await repo.duplicate(id, req.user?.employee_id);
    const created = await repo.findById(newId);
    return sendSuccess(res, 'WBS Template duplicated successfully', created, 201);
  } catch (e: any) {
    return sendError(res, e.message || 'Failed to duplicate WBS template', [], 500);
  }
});

export default router;
