# UI Redesign Plan: Project Workspace & Modal-to-Page Conversion

## 1. Current Routing Approach
The application currently uses a custom hash-based router implemented in `App.tsx`. 
Navigation is managed via the `currentPage` React state and synced with `window.location.hash`. There is no third-party routing library like `react-router-dom`. We will KEEP this custom router and extend it to handle nested routes and URL parameters for the new pages (e.g., parsing `/project/workspace/:projectId/:tab`).

## 2. Sidebar Item Mapping
Old separate sidebar entries will be consolidated into the new "Project Workspace" structure.

| Old Sidebar Item / Route | New Location / Sidebar Item | New Route (Redirect Target) |
| --- | --- | --- |
| `projects` (Project List) | Project Workspace > Project List Tab | `project/workspace/0/list` (or no ID) |
| `projects/manage-work` | Project Workspace > Manage Project Work Tab | `project/workspace/:projectId/manage-work` |
| `tasks` (Task Management) | Project Workspace > Task Management Tab | `project/workspace/:projectId/tasks` |
| `labours` (Labour Work) | Project Workspace > Labour / Employee Work Tab | `project/workspace/:projectId/labour-work` |
| `materials` (Material Management) | Project Workspace > Material Management Tab | `project/workspace/:projectId/materials` |
| `site-surveys` | Project Workspace > Site Survey Tab | `project/workspace/:projectId/site-surveys` |
| `timesheets` | Project Workspace > Timesheets Tab | `project/workspace/:projectId/timesheets` |
| `attendance` | Project Workspace > GPS Attendance Tab | `project/workspace/:projectId/attendance` |
| `gantt-chart` | Project Workspace > Gantt Chart Tab | `project/workspace/:projectId/gantt` |
| `invoices` | Project Workspace > Monthly Invoices Tab | `project/workspace/:projectId/invoices` |
| `masters` | Master > (Split into specific child items) | `masters/:masterKey` |
| `employees` | Master > Employee Master | `masters/employees` |

**Sidebar Hierarchy:**
- Dashboard
- Customer
- Quotation
- Project 
  - Project Workspace
- Master
  - Project Types, WBS Templates, Terms & Conditions, Materials, Employee Master, Labour / Contractor, Units, Communities, Currency, Taxes
- Reports
- Settings

## 3. Modal-to-Page Conversion Mapping
Every Create, Edit, and View modal will be converted into a dedicated full page route. 

| Existing File / Component | Modal Purpose | New Route | New Page Component |
| --- | --- | --- | --- |
| `Tasks.tsx` | Create/Edit Task Modal | `project/workspace/:projectId/tasks/new` & `.../:taskId/edit` | `TaskFormPage` |
| `Tasks.tsx` | View Task Modal | `project/workspace/:projectId/tasks/:taskId` | `TaskViewPage` |
| `Project360Modal.tsx` | 360 Project View Modal | `project/workspace/:projectId/list` (Header Details) | N/A (Integrated into Workspace Header) |
| `ProjectWork.tsx` | Add WBS / Task / Logs Modals | `project/workspace/:projectId/wbs/new` | `WbsFormPage` |
| `MaterialSurveys.tsx` | Create/Edit Material Survey | `project/workspace/:projectId/site-surveys/new` | `SiteSurveyFormPage` |
| `Attendance.tsx` | Check In / Edit Attendance | `project/workspace/:projectId/attendance/new` | `AttendanceFormPage` |
| `Invoices.tsx` | Log Work / Generate Invoice | `invoices/new` | `InvoiceFormPage` |
| `Customers.tsx` | Create/Edit/View Customer | `customers/new`, `customers/:id/edit`, `customers/:id` | `CustomerFormPage`, `CustomerViewPage` |
| `Masters.tsx` | Create/Edit various Masters | `masters/:master/new`, `masters/:master/:id/edit` | `MasterFormPage` |
| `Employees.tsx` | Create/Edit/View Employee | `masters/employees/new`, `masters/employees/:id/edit` | `EmployeeFormPage` |
| `WbsTemplates.tsx`| Edit WBS Template | `masters/wbs-templates/:id/edit` | `WbsTemplateFormPage` |
| `Materials.tsx` | Create/Edit/View Material | `masters/materials/new`, `masters/materials/:id/edit` | `MaterialFormPage` |
| `LogHistoryModal.tsx` | Timesheet/Log Edit Modal | `project/workspace/:projectId/timesheets/:id/edit` | `TimesheetFormPage` |
| `LabourDetailsModal`| Labour Work Details | `project/workspace/:projectId/labour-work/:id` | `LabourWorkViewPage` |
| `DocumentManagerModal`| View/Edit Documents | `documents/:entity/:id` | `DocumentManagerPage` |

## 4. Reusable & New Components
To achieve the clean white cards, rounded corners, status pills, and progress rings from the mockup, we will build/extend the following:

- **Layouts**: 
  - `ProjectWorkspaceLayout`: The shell holding the Workspace Header and Tabs.
  - `FormPageLayout`: Sticky action bar (Save/Cancel) + sections stacking.
  - `DetailLayout`: Read-only views with side-by-side data grids.
- **Components**:
  - `WorkspaceHeader`: Sticky header, project thumbnail, status badge, progress ring, summary tiles, actions menu.
  - `WorkspaceTabs`: Horizontal scrolling tabs, URL-synced, empty states.
  - `ProgressRing`: SVG circular progress indicator based on backend completion percentage.
  - `StatusBadge` & `WbsTypeBadge`: Updated pills for "In Progress", "Planning", "[LABOUR]", etc.
  - `ListToolbar`: Search + Filters + Export Excel action.

## 5. Per-Phase Change List
1. **Routing & Sidebar**: Update `App.tsx` router to handle the new URL structures and regex parsing. Update `Sidebar.tsx` to the new hierarchical structure. Add redirect fallbacks for old routes.
2. **Project Workspace Shell**: Create `ProjectWorkspace.tsx`, `WorkspaceHeader.tsx`, `WorkspaceTabs.tsx`. Make it responsive and theme-aware.
3. **Tab Components**: Refactor existing `Projects.tsx`, `ProjectWork.tsx`, `Tasks.tsx`, etc., into Tab Components that accept a `projectId` prop.
4. **Form Pages**: Create `TaskFormPage.tsx`, `WbsFormPage.tsx`, `CustomerFormPage.tsx`, etc., following the `FormPageLayout`. Update the tables to link to these routes instead of opening modals.
5. **View Pages**: Create `TaskViewPage.tsx`, `CustomerViewPage.tsx`, etc.
6. **Excel Export**: Create `utils/excelExport.ts` and attach it to the `ListToolbar`.

## 6. Risks & Mitigation
- **Risk**: Extracting logic from existing pages into Tab Components might break local state.
  - *Mitigation*: Carefully lift state or ensure Tab Components fetch their own data on mount based on the `projectId` prop.
- **Risk**: Legacy hash URLs failing to resolve.
  - *Mitigation*: Ensure `App.tsx` has strict fallback regexes that catch old URLs and redirect them to the equivalent `project/workspace/:projectId/:tab` route.
- **Risk**: API dependencies on modal state.
  - *Mitigation*: Form pages will pull IDs from the URL and fetch their own `initialData` on mount, rather than relying on a parent component passing down the `item`.

This redesign preserves all existing backend capabilities while drastically improving the UX by moving from a scattered modal-heavy UI to a cohesive, deeply linkable Workspace approach.
