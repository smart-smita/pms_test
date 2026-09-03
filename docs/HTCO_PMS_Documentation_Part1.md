# HTCO PMS — Complete Project Documentation
### Part 1: Overview, Tech Stack, Architecture & Folder Structure

---

## 1. Project Overview

| Field | Details |
|---|---|
| **Project Name** | HTCO Employee GPS Attendance & Project Task Management System (HTCO PMS) |
| **Business Objective** | Digitize field workforce management for construction/infrastructure firms by tracking employee attendance via GPS, managing projects, assigning tasks, and computing hour-based labor costs |
| **Main Users** | Field employees, site managers, company administrators |
| **Deployment** | Backend on Render (Node.js), Frontend on Vercel/static, Database on cPanel MySQL |

### User Roles

| Role | Code | Default Password | Description |
|---|---|---|---|
| **Admin** | ADMIN001 | Admin@123 | Full system access |
| **Manager** | MGR001 | Manager@123 | Scoped project/task/employee view |
| **Employee** | EMP001 | Employee@123 | Personal tasks, GPS check-in/out |

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.2 | Type safety |
| Vite | 5.3.1 | Build tool & dev server |
| Recharts | 3.10.1 | Charts (AreaChart, PieChart) |
| Leaflet / react-leaflet | 1.9.4 / 4.2.1 | Map integration |
| Lucide-React | 0.395.0 | Icon library |
| Vanilla CSS | — | Custom glassmorphism design system |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | Runtime |
| Express.js | 4.19.2 | HTTP server framework |
| TypeScript | 5.5.2 | Type safety |
| mysql2/promise | 3.11.0 | MySQL connection pool |
| jsonwebtoken | 9.0.2 | JWT access & refresh tokens |
| bcrypt | 5.1.1 | Password hashing |
| zod | 3.23.8 | Request body validation |
| express-rate-limit | 7.3.1 | Login rate limiting |
| dotenv | 16.4.5 | Environment variables |

### Database & Auth
- **MySQL** (InnoDB, utf8mb4), connection pool limit: 10
- **JWT Access Token** — 15 min expiry
- **JWT Refresh Token** — 7 day expiry
- **bcrypt** — salt rounds = 10
- Token stored in browser `localStorage`

### Deployment
| Component | Platform |
|---|---|
| Backend | Render (Node.js) |
| Frontend | Vercel (Vite SPA) |
| Database | cPanel Remote MySQL |

---

## 3. System Architecture

```
User Browser
     │
     ▼
React SPA (Vite, port 5173)
     │  fetch() + Authorization: Bearer <JWT>
     ▼
Express REST API (Node.js, port 5000)
  /api/v1/*
     │
     ├─► CORS Middleware (origin: true)
     ├─► express.json() parser
     ├─► authenticateJwt  (verify JWT → req.user)
     ├─► authorizeRoles   (check role name)
     ├─► requirePermission (DB ACL lookup)
     │
     ├─► Route → Controller → Zod Validator
     │                │
     │                ▼
     │           Service (Business Logic)
     │                │
     │                ▼
     │         Repository (Parameterized SQL)
     │                │
     ▼                ▼
  MySQL Database (InnoDB)
     │
     ▼
{ success, message, data } JSON Response
     │
     ▼
React UI Update (useState re-render)
```

---

## 4. Project Folder Structure

```
GAPTM/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                ← Root component, switch-case page routing
│   │   ├── main.tsx               ← ReactDOM.createRoot entry
│   │   ├── index.css              ← Glassmorphism design system (CSS vars)
│   │   ├── context/
│   │   │   └── AuthContext.tsx    ← JWT state, login(), logout(), hasPermission()
│   │   ├── services/
│   │   │   └── api.ts             ← apiRequest() fetch wrapper + parseApiErrors()
│   │   ├── types/index.ts         ← User, Employee, Project, Task, AttendanceLog…
│   │   ├── utils/
│   │   │   ├── toast.ts           ← showSuccess / showError
│   │   │   └── csvExport.ts       ← CSV export utility
│   │   ├── pages/
│   │   │   ├── Login.tsx          ← Employee code + password form
│   │   │   ├── ForgotPassword.tsx ← Email-based password reset
│   │   │   ├── Dashboard.tsx      ← Role-aware: Admin/Manager vs Employee view
│   │   │   ├── Employees.tsx      ← Employee CRUD (Admin)
│   │   │   ├── Projects.tsx       ← Project list with progress
│   │   │   ├── ProjectForm.tsx    ← Create/Edit project + WBS allocations
│   │   │   ├── Tasks.tsx          ← Task CRUD, assign workers, update status
│   │   │   ├── Attendance.tsx     ← GPS check-in/out + attendance log table
│   │   │   ├── Payments.tsx       ← Payment summaries (4 views)
│   │   │   ├── Reports.tsx        ← Filter & export reports (4 categories)
│   │   │   ├── Settings.tsx       ← Profile + password update
│   │   │   └── Support.tsx        ← Submit support ticket
│   │   └── components/
│   │       ├── common/
│   │       │   ├── DataTable.tsx  ← Search, sort, paginate, CSV export
│   │       │   ├── Modal.tsx      ← Overlay dialog
│   │       │   ├── Toast.tsx      ← Toast notification system
│   │       │   ├── Badge.tsx      ← success/warning/danger/info badges
│   │       │   ├── Button.tsx     ← primary/secondary/danger variants
│   │       │   ├── ConfirmDeleteModal.tsx
│   │       │   └── RequirePermission.tsx ← Client-side permission gate
│   │       ├── layout/
│   │       │   ├── MainLayout.tsx ← Shell: Sidebar + Navbar + main content
│   │       │   ├── Sidebar.tsx    ← Role-aware left navigation
│   │       │   ├── Navbar.tsx     ← Top bar: notifications bell, user menu
│   │       │   └── BottomNav.tsx  ← Mobile bottom navigation
│   │       └── forms/
│   │           ├── FormInput.tsx  ← Styled input + label + error message
│   │           └── FormSelect.tsx ← Styled select + label + error message
│   ├── .env                       ← VITE_API_BASE_URL=http://localhost:5000/api/v1
│   ├── vite.config.ts             ← port 5173, host: true
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── app.ts                 ← Express server, CORS, JSON parser, health check
│   │   ├── migrate.ts             ← Programmatic ACL migration + permissions seed
│   │   ├── config/
│   │   │   ├── env.ts             ← dotenv → typed env object
│   │   │   ├── db.ts              ← mysql2 pool, startup auto-migrations
│   │   │   └── jwt.ts             ← generate/verify access & refresh tokens
│   │   ├── middleware/
│   │   │   ├── auth.ts            ← authenticateJwt, authorizeRoles
│   │   │   ├── permission.middleware.ts ← requirePermission (DB ACL query)
│   │   │   ├── errorHandler.ts    ← Global error handler
│   │   │   └── rateLimiter.ts     ← 15 req/15min on login endpoint
│   │   ├── routes/index.ts        ← Mounts all routes under /api/v1
│   │   ├── controllers/           ← 10 controllers (one per module)
│   │   ├── services/              ← 11 services (business logic)
│   │   ├── repositories/          ← 8 repositories (parameterized SQL)
│   │   ├── validators/            ← 5 Zod schema files
│   │   ├── types/index.ts         ← AuthenticatedRequest, UserPayload, RowTypes
│   │   └── utils/
│   │       ├── apiResponse.ts     ← sendSuccess() / sendError()
│   │       └── distance.ts        ← Haversine GPS distance formula
│   ├── .env                       ← Local dev vars
│   ├── .env.production            ← cPanel production vars
│   └── package.json
│
├── database/
│   ├── schema.sql                 ← Core DDL: roles, employees, projects, tasks…
│   ├── seed.sql                   ← Seed data: 3 roles, 5 users, 3 projects, tasks
│   ├── wbs_migration.sql          ← work_breakdown_structures + project_wbs tables
│   └── task_times_migration.sql   ← Adds start_time, target_time to tasks
│
├── vercel.json                    ← Monorepo: frontend=Vite, backend=Node, /api rewrites
└── README.md
```
