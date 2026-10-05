# QUOTATION, PLANNING, AND PROJECT TASK MANAGEMENT FIXES

## Missing Column Audit
| Table | Field | Required By | Status | Action |
|-------|-------|-------------|--------|--------|
| quotation_wbs_labour | start_date | Quotation & Planning flow | Missing | Add Migration |
| quotation_wbs_labour | end_date | Quotation & Planning flow | Missing | Add Migration |
| quotation_wbs_material | start_date | Quotation & Planning flow | Missing | Add Migration |
| quotation_wbs_material | end_date | Quotation & Planning flow | Missing | Add Migration |
| quotations | source_template_id | Quotation template link | Missing | Add Migration (if not present) |
| quotation_email_log | all | Save & Send feature | Missing | Create Table |
| planning_tasks | old_start_date | Reschedule tracking | Missing | Add Migration |
| planning_tasks | old_end_date | Reschedule tracking | Missing | Add Migration |
| planning_revisions | all | Planning change log | Missing | Create Table |

## Bug Fix Tracking

### Part 1: Quotations
1. **Remove Quotation Number and Valid Until from UI**
   - **Cause:** Currently shown and required in the UI.
   - **Fix:** Removed from `Quotations.tsx`, `QuotationForm.tsx`, `QuotationView.tsx`, and `pdfGenerator.ts`. Backend auto-generates quotation_number if missing.
   - **Files:** `frontend/src/pages/Quotations.tsx`, `frontend/src/pages/QuotationForm.tsx`, `frontend/src/pages/QuotationView.tsx`, `backend/src/utils/pdfGenerator.ts`.
   - **Status:** Done.

2. **LABOUR DETAILS section is not responsive**
   - **Cause:** Table uses fixed `<style>` tags with hardcoded `display: none` for mobile, breaking consistency.
   - **Fix:** Redesign using global CSS grid/flex utilities for Labour, Material, and WBS rows.
   - **Status:** Pending.

3. **Materials dropdown shows empty options**
   - **Cause:** TBD (API filter or mapping mismatch).
   - **Fix:** Fix `/materials` endpoint to return correct structure for dropdowns.
   - **Status:** Pending.

4. **Financial Summary scrolling issue**
   - **Cause:** Nested overflow or flex constraints.
   - **Fix:** Ensure proper flex-shrink and overflow behavior. Sticky summary on desktop.
   - **Status:** Pending.

5. **"View Details": attachment documents not showing**
   - **Cause:** Attachments are not joined in the `/quotations/:id` endpoint or mapped in the View page.
   - **Fix:** Join `quotation_documents` in repository, add UI render in View page.
   - **Status:** Pending.

6. **Missing Columns: Start/End Dates for Labour & Materials**
   - **Cause:** DB schema lacks these dates.
   - **Fix:** Add migrations, update repositories and services.
   - **Status:** Pending.

7. **Project Name not fetched / required validation**
   - **Cause:** Mapping missing on Edit load for `new_project_name`.
   - **Fix:** Pre-fill project_name or new_project_name. Add frontend validators.
   - **Status:** Pending.

8. **Approve button error / HTML 404**
   - **Cause:** Frontend uses PUT instead of PATCH; Express returns HTML for unmatched routes.
   - **Fix:** Changed frontend to PATCH. Added JSON 404 handler to Express `app.ts`. Hardened `api.ts` to gracefully handle non-JSON responses.
   - **Files:** `frontend/src/pages/Quotations.tsx`, `backend/src/app.ts`, `frontend/src/services/api.ts`.
   - **Status:** Done.

9. **WBS Template Selection not preselected on edit**
   - **Cause:** Template state not restored from DB.
   - **Fix:** Restore `source_template_id` from quotation.
   - **Status:** Pending.

10. **Save and Send (email on save)**
    - **Cause:** Feature doesn't exist.
    - **Fix:** Add nodemailer, new API endpoint, UI button.
    - **Status:** Pending.

### Part 2: Planning
TBD

### Part 3: Project-wise / WBS-wise Task Management
TBD
