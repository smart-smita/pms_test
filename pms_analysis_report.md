# PMS/HTCO Code Analysis & Implementation Plan

## 1. Executive Summary
This document provides a comprehensive analysis of the existing PMS/HTCO project architecture. The current system is a robust, custom-built Node.js/Express backend using raw MySQL (no ORM) coupled with a React/Vite frontend. The core objective of this plan is to integrate Project Management, WBS, Executions, and Financial Tracking while strictly adhering to the fundamental principle: **Quotation MUST precede Project Work.** No existing flows will be broken.

## 2. Existing Architecture
- **Backend**: Node.js, Express, TypeScript. Centralized business logic in `Service` classes, database interactions in `Repository` classes via `mysql2`. Validation uses `Zod`.
- **Frontend**: React 18+, Vite, TypeScript. Custom CSS (no Tailwind). Uses React Router for navigation and `fetch`-based `apiService`.
- **Database**: MySQL. Relational structure with soft-deletes (`is_deleted`, `status`).

## 3. Existing Business Flow
1. **Master Data**: Users create Countries, Communities, Project Types, etc.
2. **Customer**: Created via `Customers.tsx` (`POST /customers`). 
3. **Project**: Created via `ProjectForm.tsx` (`POST /projects`), linking a Customer, Country, and Community. 
4. **Quotation**: Currently created via `Quotations.tsx`. 
5. **WBS**: Project breakdown into disciplines. 
6. **Task**: Tasks added to WBS with allocations. 
7. **Labour/Material Execution**: Logged against tasks. 
8. **Invoices/Reports**: Generated based on logs and tasks.

## 4. Existing Database Flow
- `customers` (1) → `projects` (N)
- `projects` (1) → `project_wbs` (N)
- `project_wbs` (1) → `tasks` (N)
- `tasks` (1) → `labour_work_logs` (N) / `material_logs` (N)

## 5. Existing API Flow
Standard RESTful pattern:
- `Routes` (e.g., `task.routes.ts`) → `Controller` (`task.controller.ts`) → `Service` (`task.service.ts`) → `Repository` (`task.repository.ts`).

## 6. Existing Permission Flow
ACL is handled via JWT and `requirePermission(module, action)` middleware. Roles include 'System Administrator', 'Manager', and 'Employee'.

## 7. Existing Document Flow
Documents are handled entity-by-entity.

## 8. Existing Notification Flow
Currently limited; needs expansion for expiry dates.

## 9. New Requirements Mapping
- **Quotation Pre-requisite**: Must validate quotation status before allowing WBS/Task creation.
- **Multiple Locations/Master**: `Community` master already exists (`/masters/communities`) but requires frontend UI for creation.
- **Expiry Management**: Needs a cron job to check `expiry_date` on documents.

## 10. Dependency Map
Customer → Project → Quotation (Approval Required) → WBS/Discipline → Task (Dependencies) → Resource Allocation → Execution (Logs) → Financial Reporting.

## 11. Impact Analysis
High impact on Task Creation and Execution routes which must now validate Quotation status. Low impact on master data.

## 12. Database Changes Required
- No structural changes needed for Customer → Multiple Projects (already 1:N).
- Need `is_approved` or similar flag on Quotations to gatekeep task creation.
- Document tracking requires `expiry_date` (already exists in some forms, needs standardization).

## 13. API Changes Required
- `POST /tasks` and `POST /projects/:id/wbs`: Add validation to check if a valid Quotation exists for the project.

## 14. Frontend Changes Required
- **Masters UI**: Add UI to create Communities (resolving the empty dropdown issue).
- **Quotation Gate**: Disable WBS/Task creation buttons in UI if quotation is not approved.

## 15. Validation Changes
- Inject Zod validation in Task/WBS to ensure Quotation adherence.

## 16. Notification Changes
- Create an automated background job (or API triggered by frontend dashboard load) to check document expiries and insert into a notifications table.

## 17. PDF/Document Changes
- Re-use existing export logic for Terms & Conditions and Quotation PDFs.

## 18. Report Changes
- Existing reports (P&L, Planned vs Actual) are successfully isolated and will not break. 

## 19. Security/ACL Changes
- No new roles required; existing ACL logic is sufficient.

## 20. Risks / Possible Breaking Changes
- Enforcing Quotation validation might lock out existing projects that were created without a quotation. Safe migration required (e.g., bypass validation for legacy projects).

## 21. Required Clarifications / Questions
1. Should legacy projects (created before this rule) be exempt from the Quotation-first rule, or must they be backfilled with a quotation?
2. Are Communities meant to be managed in a dedicated Master UI by Admins only? 
3. Should document expiry notifications be sent via Email, In-App, or both?

## 22. Recommended Implementation Sequence
1. Fix Community Master UI (Address dropdown bug).
2. Implement Quotation Validation gate on Backend APIs.
3. Update Frontend to reflect Quotation gate.
4. Implement Expiry Tracking Cron/Logic.

## 23. Testing Plan
- Create Project without Quotation → Attempt WBS/Task (Should Fail).
- Create Project → Add Quotation → Approve → Attempt WBS/Task (Should Succeed).

## 24. Final Implementation Checklist
- [ ] Community Master UI
- [ ] Quotation Enforcement Logic
- [ ] Document Expiry System
