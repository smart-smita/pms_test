# HTCO PMS — Complete Project Documentation
### Part 3: Module Flows, Security, Deployment & Developer Guide

---

## 10. Module-Wise CRUD Flows

### 10.1 Employees Module

**Flow (Create):**
```
EmployeeForm (Employees.tsx)
  └─► POST /employees { employee_code, name, email, password, role_id, hourly_rate, status }
        └─► createEmployeeSchema (Zod validation)
        └─► EmployeeController.create()
        └─► EmployeeService.createEmployee()
              ├─ Check duplicate employee_code
              ├─ Check duplicate email
              ├─ bcrypt.hash(password, 10)
              └─ UserRepository.create() → INSERT INTO employees
```

**Soft Delete:** `UPDATE employees SET is_deleted=1, deleted_at=NOW()` — record remains in DB but excluded from all queries via `WHERE is_deleted=0`.

**Validation (Zod):**
- employee_code: min 2 chars
- name: min 2 chars
- email: valid email format
- password: min 6 chars
- role_id: positive integer
- hourly_rate: non-negative (default 25.00)
- status: 'active' | 'inactive' (default 'active')

---

### 10.2 Projects Module

**Flow (Create with WBS):**
```
ProjectForm.tsx
  └─► POST /projects { project_code, project_name, ..., wbs_allocations: [...] }
        └─► ProjectController.create()
        └─► ProjectService.createProject()
              ├─ DB Transaction BEGIN
              ├─ Check duplicate project_code
              ├─ INSERT INTO projects
              ├─ For each wbs_allocation:
              │     ├─ If wbs_id missing + wbs_name → INSERT INTO work_breakdown_structures
              │     └─ INSERT INTO project_wbs
              └─ COMMIT (or ROLLBACK on error)
```

**Status values:** `active | inactive | completed | cancelled`

**Progress calculation (server-side):**
`progress_percentage = (completed_task_count / task_count) * 100`

---

### 10.3 Tasks Module

**Flow (Create + Assign):**
```
Tasks.tsx modal form
  └─► POST /tasks { project_id, wbs_id, task_name, estimated_hours, ..., assigned_employee_ids }
        └─► TaskService.createTask()
              ├─ Validate project exists
              ├─ TaskRepository.create() → INSERT INTO tasks
              ├─ If assigned_employee_ids:
              │     └─ DELETE existing task_assignments + INSERT new ones
              └─ Return task with assigned_employees[]
```

**Task Status Auto-Update (server-side, on every list fetch):**
- If status is `pending` or `in-progress` AND `target_date < today` → automatically returns as `delayed`

**Productivity Status (computed, not stored):**
- `completed` + actual_hours > estimated_hours → `extra-hours-logged`
- `completed` + actual_hours <= estimated_hours → `completed`
- active + actual_hours > estimated_hours → `exceeding-estimate`
- active + target_date < today → `delayed`

**Worker Assignment Notification:**
When `POST /tasks/:id/assign` is called → `NotificationService.createNotification()` for each assigned employee with title "New Task Assigned".

---

### 10.4 Attendance Module (GPS)

**Check-In Flow:**
```
Attendance.tsx
  ├─ navigator.geolocation.getCurrentPosition() → lat, lng
  └─► POST /attendance/check-in { task_id, latitude, longitude, address }
        └─► AttendanceService.checkIn()
              ├─ Check for existing 'open' session (prevent duplicate)
              ├─ Fetch task → project → get GPS coordinates & radius
              ├─ calculateDistanceMeters(Haversine formula)
              │     ├─ distance <= radius → in_status='inside', status='open'
              │     └─ distance > radius → in_status='outside', status='outside_area'
              └─ INSERT INTO attendance_logs
```

**Check-Out Flow:**
```
POST /attendance/check-out { attendance_id, latitude, longitude, address }
  └─► AttendanceService.checkOut()
        ├─ Validate record belongs to employee
        ├─ Validate status='open'
        ├─ Calculate out distance & out_status
        ├─ total_working_hours = (check_out_time - check_in_time) in hours [SERVER-SIDE]
        └─ UPDATE attendance_logs SET check_out_time, out_*, total_working_hours, status='completed'
```

**Missing Checkout Auto-Fix:**
On every `GET /attendance/logs` call → `UPDATE attendance_logs SET status='missing_checkout' WHERE status='open' AND attendance_date < TODAY`

**Attendance Status Values:**
| Status | Meaning |
|---|---|
| open | Currently checked in |
| completed | Checked out normally |
| outside_area | Checked in outside project GPS radius |
| missing_checkout | No checkout recorded (auto-flagged next day) |

---

### 10.5 Payments Module

All payment data is **read-only, computed from attendance_logs**.

Formula: `total_payment = SUM(total_working_hours × employee.hourly_rate)` where `al.status = 'completed'`

| View | Grouping | SQL Source |
|---|---|---|
| By Employee | GROUP BY employee_id | employees JOIN attendance_logs |
| By Date | GROUP BY attendance_date | attendance_logs JOIN employees |
| By Project | GROUP BY project_id | projects → tasks → attendance_logs |
| By Task | GROUP BY task_id | tasks JOIN attendance_logs |

---

### 10.6 Dashboard Module

**Admin/Manager View (executive):**
- Total / active employees, present today, absent today, checked-in live
- Today's total working hours, today's labor cost (₹)
- Total / active / completed projects, overall progress %
- Task distribution: pending, in-progress, completed, delayed
- 7-day working hours area chart (per-day SUM from attendance_logs)
- Live attendance table (top 5 currently checked-in)
- Recent tasks table (latest 5 tasks)

**Employee View (personal):**
- My assigned tasks count (pending, in-progress, completed, delayed)
- Today attendance status (Checked-In / Not Checked-In)
- Working hours today / this week / this month
- My assigned projects (via task_assignments)
- 7-day personal working hours chart
- Task distribution pie chart
- My activity details table (all assigned tasks with logged hours)

---

### 10.7 Reports Module

4 report categories, all filterable and CSV-exportable:

| Category | Filters | Columns |
|---|---|---|
| Attendance | start_date, end_date, employee_id | Date, Employee, Task/Project, Check-In, Check-Out, GPS Address, Hours, Status |
| Project | (none) | Code, Name, Client, Task counts, Est/Actual Hours, Progress % |
| Task | project_id, status, employee_id | Task, Project, Workers, Est/Actual Hours, Dates, Status |
| Payment | type(employee/daily/project/task), start_date, end_date | Identifier, Hours, Total Cost/Payout |

**CSV Export:** Built into DataTable component. `exportToCSV()` utility generates a downloadable `.csv` file client-side from the filtered+sorted dataset.

---

### 10.8 Notifications Module

**Triggers:**
| Event | Recipient | Type |
|---|---|---|
| Task assigned to employee | Assigned employee | info |
| Support ticket submitted | All Admin users | warning |

**Storage:** `notifications` table with `user_id`, `title`, `message`, `type`, `is_read`.

**Navbar Bell:** `GET /notifications/unread-count` polled to show badge count. Clicking marks as read.

**Limit:** Last 50 notifications per user.

---

### 10.9 Settings Module

- **Profile Update:** `PUT /auth/profile { name }` — only name is editable (email/code/role are read-only in UI)
- **Password Change:** `PUT /auth/password { currentPassword, newPassword }` — verifies current password before updating

---

### 10.10 Support Module

`POST /auth/support { subject, message }` → creates an in-app notification for every Admin user. **No email service is integrated** — tickets only appear as in-app notifications.

---

### 10.11 WBS (Work Breakdown Structure) Module

WBS is a discipline/category master list (e.g., "Civil Works", "Electrical Installation"). Projects have WBS allocations with hours and dates. Tasks are linked to a WBS allocation.

**Master list:** `GET /wbs` → returns `work_breakdown_structures` table
**Project allocations:** `GET /projects/:id/wbs` → returns `project_wbs` with WBS details
**On-the-fly creation:** When creating/editing a project, if a WBS name is provided without a wbs_id, a new master WBS entry is auto-created with a temp code.

---

## 11. Security Analysis

### CRITICAL
- **Plain-text password fallback in auth.service.ts** (line 32): `user.password_hash === password` compares raw password to stored hash. This should be removed — it is a plain-text comparison backdoor even though it's labeled a "legacy" check.
- **Hardcoded JWT secrets in env.ts defaults**: `JWT_SECRET` and `JWT_REFRESH_SECRET` have known default values that are used if env vars are not set.
- **Production credentials in .env.production committed to repo**: DB password, JWT secrets visible in `.env.production`.

### HIGH
- **No token refresh mechanism on frontend**: The 15-min access token expiry causes session termination without a refresh flow. Users are redirected to login on 401.
- **`taskRepository.findById()` calls `findAll()` internally**: Every single task lookup loads ALL tasks from the database. Severe N+1 / performance issue.
- **No email service**: Forgot-password returns the reset token in the API response body — requires user to manually copy the token. Not suitable for production.
- **CORS set to `origin: true`**: Allows all origins. Should be restricted to specific frontend domain in production.
- **Demo credentials shown in Login UI**: `Login.tsx` shows seed credentials in the UI — must be removed before production.

### MEDIUM
- **No refresh token endpoint**: `refreshToken` is generated and returned but there is no `POST /auth/refresh` endpoint to use it.
- **`deleted_by` in `project_wbs` is always hardcoded to `1`** (admin) when WBS allocations are removed.
- **Dashboard `on_leave` metric is hardcoded to `0`**: `const onLeave = 0; // Mocked for now`
- **Audit log uses `user.id`** but the payload stores `employee_id` — audit logs always record `null` for user_id.
- **`manager_projects` and `manager_employees` tables are created** but Manager scoping relies on them being populated — no UI to manage these relationships.
- **Task `findById()` is O(n)** — calls `findAll()` and uses `.find()` in memory.

### LOW
- **Rate limiter on login only**: Other sensitive endpoints (password reset, profile update) have no rate limiting.
- **No input sanitization for `address` field** in attendance check-in.
- **`start_all.bat` / startup scripts** contain no error handling.
- **Trend percentages on dashboard ("↑ 12% from yesterday") are hardcoded** strings, not real calculations.

---

## 12. Known Issues & Missing Features

| # | Issue | Severity |
|---|---|---|
| 1 | `taskRepository.findById()` calls `findAll()` — O(n) query | HIGH |
| 2 | No `/auth/refresh` token endpoint — 15min token forces re-login | HIGH |
| 3 | No email SMTP — forgot password returns token in API body | HIGH |
| 4 | `on_leave` count always returns 0 (mocked) | MEDIUM |
| 5 | Audit log records null user_id (wrong field name: `user.id` vs `user.employee_id`) | MEDIUM |
| 6 | Manager scope tables (manager_projects, manager_employees) have no management UI | MEDIUM |
| 7 | CORS `origin: true` allows all domains | MEDIUM |
| 8 | Demo credentials visible in Login page UI | MEDIUM |
| 9 | Dashboard trend values ("↑ 12%") are hardcoded, not real | LOW |
| 10 | `deleted_by` in project_wbs is always hardcoded to admin ID 1 | LOW |
| 11 | No file upload functionality (e.g., project documents, employee photos) | Missing Feature |
| 12 | No leave management module | Missing Feature |
| 13 | No payroll generation / payment approval workflow | Missing Feature |
| 14 | No real-time GPS tracking (only point-in-time check-in/out) | Missing Feature |
| 15 | `migrate.ts` FK references `users(id)` and `projects(id)` — wrong table/column names vs actual schema | BUG (migration tables may not create if users table doesn't exist) |

---

## 13. Environment Variables

### Backend (.env)

| Variable | Default | Description |
|---|---|---|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment mode |
| DB_HOST | localhost | MySQL host |
| DB_PORT | 3306 | MySQL port |
| DB_USER | root | MySQL username |
| DB_PASSWORD | (empty) | MySQL password |
| DB_NAME | eth_htco_db | Database name |
| JWT_SECRET | super_secret_jwt_access_key_htco_2026 | Access token signing key |
| JWT_REFRESH_SECRET | super_secret_jwt_refresh_key_htco_2026 | Refresh token signing key |
| JWT_EXPIRES_IN | 15m | Access token expiry |
| JWT_REFRESH_EXPIRES_IN | 7d | Refresh token expiry |
| CORS_ORIGIN | http://localhost:5173 | Allowed frontend origin |

### Frontend (.env)

| Variable | Default | Description |
|---|---|---|
| VITE_API_BASE_URL | http://localhost:5000/api/v1 | Backend API base URL |

---

## 14. Deployment Guide

### Backend on Render

1. Connect GitHub repo to Render
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `node dist/app.js`
5. Add environment variables in Render dashboard:
   - All variables from `.env.production` (do NOT commit secrets)
   - Set `CORS_ORIGIN` to your Vercel frontend URL
6. Ensure cPanel Remote MySQL allows Render's IP

### Frontend on Vercel

1. Connect GitHub repo to Vercel
2. Set **Root Directory**: `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add env variable: `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api/v1`

### Recommended Production Architecture

```
Internet
    │
    ▼
Vercel CDN (Frontend)
    │  API calls
    ▼
Render.com (Node.js Backend)
    │  mysql2 pool
    ▼
cPanel MySQL (Remote Database)
```

### Database Migration Order
```bash
1. mysql -u root -p < database/schema.sql
2. mysql -u root -p < database/seed.sql
3. mysql -u root -p < database/wbs_migration.sql
4. mysql -u root -p < database/task_times_migration.sql
# ACL tables are auto-created on first backend start via migrate.ts
```

---

## 15. Local Setup Guide

```bash
# 1. Clone
git clone <repo-url>
cd GAPTM

# 2. Database Setup
# Open phpMyAdmin or MySQL CLI
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/wbs_migration.sql
mysql -u root -p < database/task_times_migration.sql

# 3. Backend Setup
cd backend
npm install
# Create .env file:
# PORT=5000
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=eth_htco_db
# JWT_SECRET=any_secret_key
# JWT_REFRESH_SECRET=any_refresh_secret
npm run dev
# Backend starts at http://localhost:5000

# 4. Frontend Setup (new terminal)
cd frontend
npm install
# .env already has: VITE_API_BASE_URL=http://localhost:5000/api/v1
npm run dev
# Frontend starts at http://localhost:5173

# 5. Test Login
# Open http://localhost:5173
# Admin:    ADMIN001 / Admin@123
# Manager:  MGR001 / Manager@123
# Employee: EMP001 / Employee@123
```

---

## 16. Developer Handover Guide

### How to Add a New Module

**Backend:**
1. Create `src/validators/mymodule.validator.ts` — Zod schemas
2. Create `src/repositories/mymodule.repository.ts` — SQL queries
3. Create `src/services/mymodule.service.ts` — business logic
4. Create `src/controllers/mymodule.controller.ts` — HTTP handlers
5. Create `src/routes/mymodule.routes.ts` — Express router
6. Register in `src/routes/index.ts`: `router.use('/mymodule', mymoduleRoutes)`
7. Add permissions in `src/migrate.ts` → `permissionsToSeed` array
8. Seed role_permissions for Admin, Manager, Employee

**Frontend:**
1. Create `src/pages/MyModule.tsx`
2. Import and add a `case 'mymodule':` in `App.tsx` `renderPage()`
3. Add menu item to `Sidebar.tsx` with permission check
4. Add API calls using `apiRequest('/mymodule', { ... })`

### Key File Locations

| What | Where |
|---|---|
| Frontend entry | `frontend/src/main.tsx` |
| Page routing | `frontend/src/App.tsx` (switch-case) |
| API calls | `frontend/src/services/api.ts` |
| Auth state | `frontend/src/context/AuthContext.tsx` |
| Backend entry | `backend/src/app.ts` |
| All API routes | `backend/src/routes/index.ts` |
| Auth logic | `backend/src/services/auth.service.ts` |
| JWT logic | `backend/src/config/jwt.ts` |
| DB pool | `backend/src/config/db.ts` |
| DB queries | `backend/src/repositories/*.repository.ts` |
| Validation | `backend/src/validators/*.validator.ts` |
| Permissions | `backend/src/migrate.ts` (permissionsToSeed) |
| Database schema | `database/schema.sql` |
| Seed data | `database/seed.sql` |

### Coding Conventions
- **Backend**: Class-based controllers/services/repositories, async/await throughout
- **Frontend**: Functional React components with hooks, no external state manager (only AuthContext)
- **API responses**: Always `{ success: boolean, message: string, data?: T, errors?: any[] }`
- **Soft deletes**: `is_deleted=1, deleted_at=NOW()` — never hard delete
- **Validation**: Always Zod on backend; form-level error display on frontend via `parseApiErrors()`
- **SQL**: Always parameterized queries (`?` placeholders) — zero string concatenation
- **Payments**: Always computed server-side from `hourly_rate × total_working_hours`

### Package Scripts

**Backend:**
```bash
npm run dev      # ts-node-dev hot reload
npm run build    # tsc → dist/
npm start        # node dist/app.js (production)
```

**Frontend:**
```bash
npm run dev      # vite dev server (port 5173)
npm run build    # tsc + vite build → dist/
npm run preview  # preview production build
```
