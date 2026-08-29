# HTCO REST API Documentation (v1)

Base URL: `http://localhost:5000/api/v1`

Every API response follows the consistent envelope structure:
```json
// SUCCESS (200 / 201)
{
  "success": true,
  "message": "Human-readable status message",
  "data": { ... }
}

// ERROR (400 / 401 / 403 / 404 / 500)
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Endpoint | Method | Auth | Body / Query | Description |
|----------|--------|------|--------------|-------------|
| `/auth/login` | `POST` | None | `{ "employee_code": "ADMIN001", "password": "..." }` | Returns user info + JWT Access Token (15m) + Refresh Token (7d). Rate limited to 15 attempts/15m. |
| `/auth/forgot-password` | `POST` | None | `{ "email": "admin@htco.com" }` | Generates a 1-hour password reset token. |
| `/auth/reset-password` | `POST` | None | `{ "token": "...", "new_password": "..." }` | Resets password using valid token and encrypts via bcrypt. |
| `/auth/logout` | `POST` | Bearer | None | Invalidates current session token. |

---

## 2. Employee Management Endpoints (`/api/v1/employees`)

| Endpoint | Method | Auth (Roles) | Body / Query | Description |
|----------|--------|--------------|--------------|-------------|
| `/employees` | `GET` | Admin, Manager | Query: `status`, `role_id`, `search` | Lists all employees with filtering. |
| `/employees/:id` | `GET` | Admin, Manager, Employee | Param: `id` | Gets detailed profile for single employee. |
| `/employees` | `POST` | Admin, Manager | `{ "employee_code", "name", "email", "password", "role_id", "hourly_rate", "status" }` | Creates new employee record with unique code and hashed password. |
| `/employees/:id` | `PUT` | Admin, Manager | `{ "name", "email", "password", "role_id", "hourly_rate", "status" }` | Updates employee profile and optional password/hourly_rate. |

---

## 3. Project Management Endpoints (`/api/v1/projects`)

| Endpoint | Method | Auth (Roles) | Description |
|----------|--------|--------------|-------------|
| `/projects` | `GET` | All Roles | Lists all projects with dynamically calculated progress percentage based on task completion. |
| `/projects/:id` | `GET` | All Roles | Gets single project details. |
| `/projects` | `POST` | Admin, Manager | Creates a new project with optional GPS bounding coordinates and radius. |
| `/projects/:id` | `PUT` | Admin, Manager | Updates project status, details, or GPS coordinates. |

---

## 4. Task & Staffing Endpoints (`/api/v1/tasks`)

| Endpoint | Method | Auth (Roles) | Description |
|----------|--------|--------------|-------------|
| `/tasks` | `GET` | All Roles | Lists tasks with calculated actual hours, productivity classification, and under-staffing warning flags. Query `assigned_to_me=true` filters for caller. |
| `/tasks/:id` | `GET` | All Roles | Gets task details and assigned employee roster. |
| `/tasks` | `POST` | Admin, Manager | Creates new task assigned to a project with required worker count and estimated hours. |
| `/tasks/:id` | `PUT` | Admin, Manager | Updates task details, status, or worker assignments. |
| `/tasks/:id/assign` | `POST` | Admin, Manager | Assigns worker crew (`employee_ids: []`) to the task. |

---

## 5. GPS Attendance Endpoints (`/api/v1/attendance`)

| Endpoint | Method | Auth (Roles) | Description |
|----------|--------|--------------|-------------|
| `/attendance/check-in` | `POST` | All Roles | Captures latitude, longitude, address, timestamp, and task ID. Prevents duplicate open check-ins. |
| `/attendance/check-out` | `POST` | All Roles | Captures check-out GPS & time. Server recomputes total working hours and updates task actual hours. |
| `/attendance/active` | `GET` | All Roles | Returns caller's currently active open check-in session if any. |
| `/attendance/logs` | `GET` | All Roles | Lists attendance logs. Automatically flags records past EOD as `missing_checkout`. |

---

## 6. Hour-Wise Payment Endpoints (`/api/v1/payments`)

| Endpoint | Method | Auth (Roles) | Description |
|----------|--------|--------------|-------------|
| `/payments/employee` | `GET` | Admin, Manager | Returns employee payment summary calculated as `hourly_rate * total_working_hours`. |
| `/payments/daily` | `GET` | Admin, Manager | Returns total daily labor payouts and active worker counts. |
| `/payments/project` | `GET` | Admin, Manager | Aggregates labor costs by project. |
| `/payments/task` | `GET` | Admin, Manager | Aggregates labor costs by task. |

---

## 7. Dashboard & Reports Endpoints (`/api/v1/dashboard`, `/api/v1/reports`)

| Endpoint | Method | Auth (Roles) | Description |
|----------|--------|--------------|-------------|
| `/dashboard/metrics` | `GET` | All Roles | Returns aggregated real-time metrics (employees, present, absent, live check-ins, active projects, costs). |
| `/reports/attendance` | `GET` | Admin, Manager | Generates filtered attendance reports with date range and employee filters. |
| `/reports/project` | `GET` | Admin, Manager | Generates project progress reports. |
| `/reports/task` | `GET` | Admin, Manager | Generates task productivity reports. |
| `/reports/payment` | `GET` | Admin, Manager | Generates payment breakdown reports. |
