# GAPTM System Audit & Phase 0 Report

## 1. Confirmed A2 Defects & Structural Gaps

Following a deep code and database audit, all items in Section A2 have been verified. (Note: Many P1 items were preemptively patched in the previous session via `migrate.ts` Phase 7, but their original state is documented here).

| Defect | Status & Code Reference |
|---|---|
| **Flow is inverted** (`quotations.project_id` required) | ✅ Confirmed. `backend/src/repositories/quotation.repository.ts` (Line 7). *Fixed in Phase 7.* |
| **WBS Identity Ambiguity** | ✅ Confirmed. `backend/src/repositories/wbs.repository.ts` (Line 42): Uses `pw.id OR pw.wbs_id`. The dual-key lookup masks inconsistent references in `tasks`, `timesheets`, and `labour_work_logs`. |
| **WBS Master Polluted** | ✅ Confirmed. `quotation.repository.ts` (Line 391): Generates `WBS-TEMP-*` codes dynamically on approval. |
| **`quotation_disciplines` missing data** | ✅ Confirmed. `migrate.ts` (Line 806): Lacks WBS linkage, planned dates, cost split, or validation (quantity can be negative). |
| **Actual Hours dual source** | ✅ Confirmed. `wbs.repository.ts` (Line 52): Recomputes via `MAX(loggedHrs, storedHrs)`. Stored field becomes stale. |
| **No Planned/Actual Cost Split** | ✅ Confirmed. `migrate.ts` (Line 374): Only `budget_amount` exists for `project_wbs`. No labour/material split tracking. |
| **Employee Cost = Current Rate** | ✅ Confirmed. `timesheets` stored only `working_hours`. *Patched in Phase 7 to snapshot rate.* |
| **Labour Tables MyISAM** | ✅ Confirmed. Missing transactional safety and ignoring FKs. *Patched in Phase 7.* |
| **Material Module Disconnected / Unsafe** | ✅ Confirmed. `03_material_management.sql` contained destructive `DROP TABLE` statements. *Neutralised in Phase 7.* Schema in `migrate.ts` Phase 6 lacked application wiring. |
| **Invoice Hardcodes** | ✅ Confirmed. `invoice.service.ts` hardcoded `quotationId=1` and `budget=100000`. *Patched in Phase 7.* |
| **Tax split missing** | ⚠️ Partial. Header-level CGST/SGST/IGST exists, but per-line tax and place-of-supply logic are missing. |
| **Tasks Data Quality** | ✅ Confirmed. `task.service.ts` restricted to 1 employee despite `required_worker_count`. *Patched in Phase 7.* |
| **Customer Tax Fields Missing** | ✅ Confirmed. Missing GST/PAN/Currency in `migrate.ts`. *Patched in Phase 7.* |

---

## 2. Live Schema Check (Read-Only SQL)

Since the SQL dump may differ from live production, run this script to identify orphaned records and WBS mismatches before executing the migration phase.

```sql
-- 1. General Table Status
SELECT table_name, engine, table_rows 
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name IN ('tasks', 'timesheets', 'labour_work_logs', 'project_wbs', 'work_breakdown_structures');

-- 2. Orphan/Mismatch checks for WBS
-- Identify if task WBS IDs point to the project_wbs junction or the global master
SELECT 'tasks_wbs_matches_pw' AS check_name, COUNT(*) FROM tasks t JOIN project_wbs pw ON t.wbs_id = pw.id
UNION ALL
SELECT 'tasks_wbs_matches_master', COUNT(*) FROM tasks t JOIN work_breakdown_structures w ON t.wbs_id = w.id
UNION ALL
SELECT 'tasks_wbs_orphans', COUNT(*) FROM tasks t 
LEFT JOIN project_wbs pw ON t.wbs_id = pw.id 
LEFT JOIN work_breakdown_structures w ON t.wbs_id = w.id 
WHERE pw.id IS NULL AND w.id IS NULL;

-- 3. Timesheets WBS Check
SELECT 'ts_wbs_matches_pw' AS check_name, COUNT(*) FROM timesheets ts JOIN project_wbs pw ON ts.wbs_id = pw.id
UNION ALL
SELECT 'ts_wbs_matches_master', COUNT(*) FROM timesheets ts JOIN work_breakdown_structures w ON ts.wbs_id = w.id;

-- 4. Labour Logs WBS Check
SELECT 'labour_wbs_matches_pw' AS check_name, COUNT(*) FROM labour_work_logs l JOIN project_wbs pw ON l.wbs_id = pw.id
UNION ALL
SELECT 'labour_wbs_matches_master', COUNT(*) FROM labour_work_logs l JOIN work_breakdown_structures w ON l.wbs_id = w.id;

-- 5. Duplicate WBS Temp Codes
SELECT wbs_name, COUNT(*) as occurrence_count 
FROM work_breakdown_structures 
GROUP BY wbs_name 
HAVING COUNT(*) > 1;
```

---

## 3. Entity Map

| Flow Step | Primary Table | Controller | Service | Route / Page | Permission Key |
|---|---|---|---|---|---|
| **Customer** | `customers` | `CustomerController` | `CustomerService` | `/customers` / `Customers.tsx` | `customers_view` |
| **Quotation** | `quotations`, `quotation_disciplines` | `QuotationController` | `QuotationService` | `/quotations` / `Quotations.tsx` | `quotations_view` |
| **Project** | `projects` | `ProjectController` | `ProjectService` | `/projects` / `Projects.tsx` | `projects_view` |
| **Project WBS** | `project_wbs` | `WbsController` | `WbsService` | `/projects/:id/wbs` / (Inside Projects UI) | `projects_view` |
| **Task** | `tasks`, `task_assignments` | `TaskController` | `TaskService` | `/tasks` / `Tasks.tsx` | `tasks_view` |
| **Employee/Time**| `employees`, `timesheets` | `EmployeeController`, `TimesheetController` | `EmployeeService`, `TimesheetService` | `/timesheets` / `Timesheets.tsx` | `timesheets_view` |
| **Labour** | `labours`, `labour_work_logs` | `LabourController`, `LabourWorkLogController`| `LabourService`, `LabourWorkLogService`| `/labours` / `Labours.tsx` | `labours_view` |
| **Material** | `materials`, `material_transactions` | `MaterialController` | `MaterialService` | `/materials` / `Materials.tsx` | `materials_view` |
| **Invoice** | `invoices`, `invoice_items` | `InvoiceController` | `InvoiceService` | `/invoices` / `Invoices.tsx` | `invoices_view` |

---

## 4. Decision Proposals & Recommendations

**1. Is a discipline the same thing as a WBS in this business?**
* **Recommendation**: **Yes**. `quotation_disciplines` acts as the Quotation-WBS line. We will extend `quotation_disciplines` with planned dates, cost splits, and link it to the newly created `quotation_wbs_items` table for granular line items.

**2. Which employee-hours source feeds cost?**
* **Recommendation**: **`timesheets`**. `attendance_logs` will be strictly used for HR GPS punch-ins. A timesheet entry must be explicitly submitted (or auto-generated at end-of-day by a cron job) to attach hours and snapshotted cost to a specific WBS/Task. This cleanly prevents double-counting.

**3. Should material_quotations be folded into the customer quotation?**
* **Recommendation**: **Fold it in.** The new `quotation_wbs_items` table will store material lines directly under the customer quotation's WBS branches. This unified approach eliminates disconnected internal budgets and ensures the quoted total inherently includes material costs.

**4. Invoice model: keep billing-schedule invoices or replace?**
* **Recommendation**: **Keep both via `invoice_type`**. Adding an `invoice_type ENUM('schedule', 'progress')` allows legacy projects to continue using fixed billing schedules while new projects can generate granular, actuals-based progress invoices.

**5. Tax logic & Place of Supply**
* **Recommendation**: Implement **per-line taxes** linked to a configurable `taxes` master table. The system evaluates the `customers.billing_state` against the company's state: if identical, split the rate into CGST/SGST; if different, apply IGST.

---

## 5. Migration Plan

We will create a structured, idempotent migration script suite in `backend/scripts/`:

1. **`01_phase1_schema.ts`**:
   - Add `converted_project_id`, `place_of_supply_state`, `currency_id` to `quotations`.
   - Extend `quotation_disciplines` (planned dates, cost splits, tax splits).
   - Create `quotation_wbs_items` table.
   - Add tracking/budget columns to `projects` and `project_wbs`.
   - Update `tasks` (is_billable).
   - Create `material_transactions` ledger and `material_requirements`.
   - Update `invoices` and `invoice_items` (invoice_type, tax splits, wbs_id).
2. **`02_phase1_data_repair.ts`**:
   - Normalize `tasks.wbs_id` and `timesheets.wbs_id` to strictly reference `project_wbs.id`.
   - Backfill `projects.customer_id` from existing `client_name` matches.
   - Clean up orphaned `WBS-TEMP-*` codes in the master table.

*Rollback Strategy*: Since we are primarily adding columns and tables, rollback involves dropping the new columns/tables. Data normalization (wbs_id repairs) is destructive to the flawed state, so a full DB dump must be taken immediately prior to running `02_phase1_data_repair.ts`.

---

## 6. Risk List & Impact

* **High Risk**: Removing the `OR wbs_id = pw.wbs_id` hack in the backend queries will break cost rollups if the data repair script fails to perfectly normalize existing mismatched WBS IDs.
* **Medium Risk**: Folding `material_quotations` into standard quotations will deprecate the existing Material Quotations frontend page. Users expecting separate material budgets will need to adapt to the unified quotation builder.
* **Medium Risk**: Changing `quotation_disciplines` schema requires careful updates to the PDF generator to ensure previously generated quotes still render correctly.
