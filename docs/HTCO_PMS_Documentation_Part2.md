# HTCO PMS — Complete Project Documentation
### Part 2: API Reference, Database Schema & Auth

---

## 5. Frontend Pages Summary

| Page | Route Key | Purpose | API Calls | Roles |
|---|---|---|---|---|
| Login | — | Authenticate via employee code + password | POST /auth/login | All |
| ForgotPassword | — | Request password reset token | POST /auth/forgot-password | All |
| Dashboard | dashboard | Role-aware metrics, charts, live attendance | GET /dashboard/metrics | All |
| Employees | employees | CRUD for employee records | GET/POST/PUT/DELETE /employees | Admin |
| Projects | projects | List projects with progress % | GET /projects | Admin, Manager |
| ProjectForm | projects/create, projects/edit/:id | Create/edit project + WBS allocations | GET/POST/PUT /projects, GET /wbs | Admin, Manager |
| Tasks | tasks | Task CRUD, assign workers, status update | GET/POST/PUT/PATCH/DELETE /tasks | All |
| Attendance | attendance | GPS check-in/out, log table, CSV export | POST /attendance/check-in & check-out, GET /attendance/logs | All |
| Payments | payments | Payment summaries by employee/day/project/task | GET /payments/* | All |
| Reports | reports | Filter & export 4 report categories to CSV | GET /reports/* | All |
| Settings | settings | Update profile name, change password | PUT /auth/profile, PUT /auth/password | All |
| Support | support | Submit support ticket → notifies Admins | POST /auth/support | All |

---

## 6. Complete API Reference

**Base URL:** `http://localhost:5000/api/v1` (dev) / Render URL (prod)

### Auth APIs

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /auth/login | No | Login with employee_code + password → returns accessToken, refreshToken, user |
| POST | /auth/forgot-password | No | Request password reset token by email |
| POST | /auth/reset-password | No | Reset password using token from email |
| POST | /auth/logout | JWT | Logout (client-side token clear; server returns 200) |
| PUT | /auth/profile | JWT | Update own display name |
| PUT | /auth/password | JWT | Change own password (requires current password) |
| POST | /auth/support | JWT | Submit support ticket → creates notification for all Admins |

**Login Request:**
```json
{ "employee_code": "ADMIN001", "password": "Admin@123" }
```
**Login Response:**
```json
{
  "success": true, "message": "Login successful",
  "data": {
    "user": { "employee_id": 1, "employee_code": "ADMIN001", "name": "...", "role_name": "Admin", "permissions": ["employees_view", "..."] },
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>"
  }
}
```

---

### Employee APIs (all require JWT + permission)

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | /employees | employees_view | List all active employees |
| GET | /employees/:id | employees_view | Get single employee |
| POST | /employees | employees_create | Create new employee |
| PUT | /employees/:id | employees_update | Update employee |
| DELETE | /employees/:id | employees_delete | Soft delete employee |

**Query params (GET /employees):** `status`, `role_id`, `search`

---

### Project APIs

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | /projects | projects_view | List all projects (with task_count, progress_percentage) |
| GET | /projects/:id | projects_view | Get single project |
| POST | /projects | projects_create | Create project (with optional WBS allocations in body) |
| PUT | /projects/:id | projects_update | Update project + WBS allocations (transactional) |
| PATCH | /projects/:id/status | projects_update | Update project status only |
| DELETE | /projects/:id | projects_delete | Soft delete project |
| GET | /projects/:projectId/wbs | projects_view | Get WBS allocations for a project |

---

### Task APIs

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| GET | /tasks | tasks_view | List tasks (filters: project_id, employee_id, status, assigned_to_me) |
| GET | /tasks/:id | tasks_view | Get single task with assigned employees |
| POST | /tasks | tasks_create | Create task (with optional assigned_employee_ids) |
| PUT | /tasks/:id | tasks_update | Update task details + reassign workers |
| PATCH | /tasks/:id/status | tasks_update | Update task status only |
| POST | /tasks/:id/assign | tasks_assign | Assign workers → triggers notification to each worker |
| DELETE | /tasks/:id | tasks_delete | Soft delete task |

---

### Attendance APIs

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| POST | /attendance/check-in | attendance_create | GPS check-in (prevents duplicate open sessions) |
| POST | /attendance/check-out | attendance_create | GPS check-out (calculates working hours server-side) |
| GET | /attendance/active | attendance_view | Get current open check-in for logged-in user |
| GET | /attendance/logs | attendance_view | List attendance logs (filters: employee_id, task_id, project_id, start_date, end_date, status) |

**Check-In Request:**
```json
{ "task_id": 1, "latitude": 18.5204, "longitude": 73.8567, "address": "Site A" }
```
**Check-Out Request:**
```json
{ "attendance_id": 5, "latitude": 18.5204, "longitude": 73.8567, "address": "Site A" }
```

---

### Payment APIs (all read-only)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /payments/employee | Employee payment summary (hourly_rate × hours, grouped by employee) |
| GET | /payments/daily | Daily payment summary (grouped by date) |
| GET | /payments/project | Project labor cost (grouped by project) |
| GET | /payments/task | Task labor cost (grouped by task) |

**Query params:** `start_date`, `end_date`, `employee_id` (for /employee endpoint)

---

### Dashboard API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /dashboard/metrics | Returns role-scoped metrics. Admin/Manager = executive view. Employee = personal view. |

---

### Report APIs (all read-only, filterable)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /reports/attendance | Attendance report (filters: employee_id, start_date, end_date) |
| GET | /reports/project | Project progress report |
| GET | /reports/task | Task report (filters: project_id, status, employee_id) |
| GET | /reports/payment | Payment report (param: type=employee|daily|project|task) |

---

### Notification APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /notifications | Get user's 50 most recent notifications |
| GET | /notifications/unread-count | Get unread notification count |
| PUT | /notifications/mark-all-read | Mark all notifications as read |
| PUT | /notifications/:id/read | Mark single notification as read |

---

### WBS API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /wbs | Get master WBS list (all disciplines/categories) |

---

## 7. Database Schema

### Core Tables

| Table | Purpose | PK | Related Tables |
|---|---|---|---|
| `roles` | Defines Admin/Manager/Employee roles | role_id | employees |
| `employees` | All system users (all roles) | employee_id | roles, tasks, attendance_logs |
| `projects` | Construction/infrastructure projects | project_id | tasks, project_wbs |
| `tasks` | Work tasks under projects | task_id | projects, project_wbs, task_assignments, attendance_logs |
| `task_assignments` | M:M — employees assigned to tasks | assignment_id | tasks, employees |
| `attendance_logs` | GPS check-in/check-out records | attendance_id | employees, tasks |
| `password_reset_tokens` | One-time password reset tokens | token_id | employees |

### ACL Tables (auto-created by migrate.ts)

| Table | Purpose | PK |
|---|---|---|
| `permissions` | Permission definitions (module + action + code) | id |
| `role_permissions` | Maps role_id → permission_id | id |
| `notifications` | In-app notifications per user | notification_id |
| `audit_logs` | Login and action audit trail | id |

### WBS Tables (wbs_migration.sql)

| Table | Purpose | PK |
|---|---|---|
| `work_breakdown_structures` | Master WBS/discipline catalogue | id |
| `project_wbs` | WBS allocations per project (with hours/dates) | id |

### Key Table Details

**employees**
```
employee_id (PK), employee_code (UNIQUE), name, email (UNIQUE),
password_hash, role_id (FK→roles), hourly_rate DECIMAL(10,2),
status ENUM('active','inactive'), is_deleted TINYINT(1),
deleted_at DATETIME, created_at, updated_at
```

**projects**
```
project_id (PK), project_code (UNIQUE), project_name, project_address,
client_name, client_code, latitude DECIMAL(10,8), longitude DECIMAL(11,8),
radius_meters INT DEFAULT 500, project_date, status ENUM('active','inactive','completed','cancelled'),
note, is_deleted, deleted_at, created_at, updated_at
```

**tasks**
```
task_id (PK), project_id (FK→projects), wbs_id (FK→project_wbs),
task_name, description, required_worker_count, estimated_hours,
start_date, start_time, target_date, target_time,
status ENUM('pending','in-progress','completed','delayed'),
is_deleted, deleted_at, created_at, updated_at
```

**attendance_logs**
```
attendance_id (PK), employee_id (FK→employees), task_id (FK→tasks),
attendance_date, check_in_time DATETIME, check_out_time DATETIME,
in_latitude, in_longitude, in_address, out_latitude, out_longitude, out_address,
in_distance_meters DECIMAL(10,2), out_distance_meters, project_radius_meters,
in_status ENUM('inside','outside'), out_status ENUM('inside','outside'),
total_working_hours DECIMAL(10,2),
status ENUM('open','completed','outside_area','missing_checkout'),
created_at, updated_at
```

**notifications**
```
notification_id (PK), user_id INT (employee_id),
title VARCHAR(150), message TEXT, type VARCHAR(50) DEFAULT 'info',
is_read TINYINT(1) DEFAULT 0, created_at TIMESTAMP
```

### Database Relationships

```
roles (1) ──────────── (M) employees
employees (M) ─────── (M) tasks  [via task_assignments]
projects (1) ─────────(M) tasks
tasks (1) ─────────── (M) attendance_logs
employees (1) ────────(M) attendance_logs
work_breakdown_structures (1) ─── (M) project_wbs
projects (1) ─────────(M) project_wbs
project_wbs (1) ──────(M) tasks [wbs_id FK]
roles (M) ────────────(M) permissions [via role_permissions]
```

---

## 8. Authentication & Authorization Flow

```
1. LOGIN
   POST /auth/login { employee_code, password }
        │
        ├─ UserRepository.findByEmployeeCode()
        ├─ Check status = 'active'
        ├─ bcrypt.compare(password, hash)
        │   └─ Fallback: legacy plain-text check for seed credentials
        │       └─ Auto-upgrade: re-hash and save bcrypt hash
        ├─ Fetch permissions from role_permissions + permissions tables
        ├─ generateAccessToken(payload)  → JWT 15min
        ├─ generateRefreshToken(payload) → JWT 7d
        └─ Return { user, accessToken, refreshToken }

2. CLIENT STORAGE
   localStorage.setItem('access_token', accessToken)
   localStorage.setItem('user', JSON.stringify(user))

3. AUTHENTICATED REQUEST
   Every request: headers['Authorization'] = 'Bearer <token>'
        │
        ▼
   authenticateJwt middleware
        ├─ Extract token from Authorization header
        ├─ jwt.verify(token, JWT_SECRET)
        ├─ req.user = payload (employee_id, role_name, permissions[])
        └─ next()

4. AUTHORIZATION
   requirePermission(module, action) middleware
        ├─ Admin → bypass (always allowed)
        ├─ 'view' on personal modules → bypass
        ├─ attendance 'create' → bypass (any authenticated user)
        └─ DB lookup: SELECT rp.id FROM role_permissions rp
                      JOIN permissions p ON rp.permission_id = p.id
                      JOIN roles r ON rp.role_id = r.role_id
                      WHERE r.role_name = ? AND p.module = ? AND p.action = ?

5. SESSION EXPIRY
   api.ts: on 401 response →
        ├─ localStorage.removeItem('access_token')
        ├─ localStorage.removeItem('user')
        └─ window.dispatchEvent(new CustomEvent('auth-expired'))
            └─ AuthContext listener: setUser(null) → redirect to Login

6. FORGOT PASSWORD
   POST /auth/forgot-password { email }
        ├─ crypto.randomBytes(32).toString('hex') → resetToken
        ├─ Stored in password_reset_tokens (expires in 1 hour)
        └─ Token returned in API response (no email service configured)

   POST /auth/reset-password { token, new_password }
        ├─ Validate token (not used, not expired)
        ├─ bcrypt.hash(new_password, 10)
        ├─ UPDATE employees SET password_hash = ?
        └─ markTokenUsed()
```

---

## 9. Role-Permission Matrix

| Module / Action | Admin | Manager | Employee |
|---|---|---|---|
| employees: view | ✅ | ✅ | ❌ |
| employees: create | ✅ | ❌ | ❌ |
| employees: update | ✅ | ❌ | ❌ |
| employees: delete | ✅ | ❌ | ❌ |
| projects: view | ✅ | ✅ | ✅ (own) |
| projects: create | ✅ | ❌ | ❌ |
| projects: update | ✅ | ✅ | ❌ |
| projects: delete | ✅ | ❌ | ❌ |
| tasks: view | ✅ | ✅ | ✅ (own) |
| tasks: create | ✅ | ✅ | ❌ |
| tasks: update | ✅ | ✅ | ✅ (status only) |
| tasks: assign | ✅ | ✅ | ❌ |
| tasks: delete | ✅ | ❌ | ❌ |
| attendance: view | ✅ | ✅ | ✅ (own) |
| attendance: create (check-in/out) | ✅ | ✅ | ✅ |
| payments: view | ✅ | ✅ | ✅ (own) |
| reports: view | ✅ | ✅ | ✅ (own) |
| reports: export (CSV) | ✅ | ✅ | ✅ |
| settings / profile | ✅ | ✅ | ✅ |
| support | ✅ | ✅ | ✅ |
| dashboard | ✅ (executive) | ✅ (scoped) | ✅ (personal) |

> **Note:** Admin bypasses all permission checks at middleware level. Frontend also enforces role-based navigation visibility.
