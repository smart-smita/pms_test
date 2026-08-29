# HTCO Employee GPS Attendance & Project Task Management System

A modern, responsive, full-stack Web Application built with **React.js + TypeScript (Frontend)**, **Node.js + Express + TypeScript (Backend)**, and **MySQL (Database)**.

---

## Architecture & Technology Stack

- **Frontend**: React.js 18, TypeScript, Vite, Custom Vanilla CSS Modern Glassmorphic Design System, Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, REST API, Zod Request Validation, Layered Architecture (`Route -> Controller -> Validator -> Service -> Repository -> MySQL`).
- **Database**: MySQL (`eth_htco_db`), `mysql2/promise` connection pooling, normalized schema, indexes on frequent queries.
- **Security**: JWT Access Token (15m) + Refresh Token (7d), bcrypt password hashing, server-side rate limiting on login, server-side parameter binding (zero string concatenation SQL), server-side recomputation of payment totals and working hours.

---

## Directory Structure

```
project-root/ (c:\wamp64\www\GAPTM)
├── frontend/                     # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # Common, Forms, Layout, Tables
│   │   ├── context/              # AuthContext with JWT handling
│   │   ├── pages/                # Login, Dashboard, Employees, Projects, Tasks, Attendance, Payments, Reports
│   │   ├── services/             # API Client (apiRequest wrapper)
│   │   ├── types/                # TypeScript Interfaces
│   │   ├── App.tsx
│   │   ├── index.css             # Glassmorphism Design System
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── config/               # DB connection pool, JWT, Environment
│   │   ├── controllers/          # Request handlers
│   │   ├── middleware/           # Auth JWT, Role RBAC, Rate limiting, Error handling
│   │   ├── repositories/         # Parameterized SQL Data Access Layer
│   │   ├── routes/               # Express Router mapped under /api/v1
│   │   ├── services/             # Core business logic & server-side computations
│   │   ├── validators/           # Zod input validation schemas
│   │   └── app.ts                # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── database/                     # Schema, Seed, and Migrations
│   ├── schema.sql                # Full Normalized MySQL DDL
│   ├── seed.sql                  # Initial Roles, Seed Admin/Users, Projects, Tasks, Attendance Logs
│   └── migrations/
│       └── 001_initial_schema.sql
├── docs/                         # Documentation
│   ├── API_DOCUMENTATION.md      # REST API Specification
│   └── ASSUMPTIONS.md            # Key business logic assumptions
├── .env.example                  # Environment template files
└── README.md
```

---

## Quick Start Guide

### 1. Database Setup
Create MySQL database and run schema/seed scripts:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend API will start at `http://localhost:5000/api/v1`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend web portal will be accessible at `http://localhost:5173`.

---

## Demo Credentials (from Seed)

| Role | Employee Code | Password | Access Level |
|------|---------------|----------|--------------|
| **Admin** | `ADMIN001` | `Admin@123` | Full access to all modules, employee management, payment views, and reports |
| **Manager** | `MGR001` | `Manager@123` | Project setup, task creation, worker assignment, payment & reporting |
| **Employee** | `EMP001` | `Employee@123` | View assigned tasks, perform GPS Check-In / Check-Out, view personal work log |

---

## Core Business Flow Covered

1. **Login**: Authenticate with Employee Code + Password (bcrypt verified).
2. **View Assigned Tasks**: Employee selects assigned task from project list.
3. **GPS Check-In**: Captures latitude, longitude, resolved address, and timestamp. Prevents duplicate open check-in sessions.
4. **Work & Departure**: Perform work on site.
5. **GPS Check-Out**: Captures check-out GPS and time.
6. **Calculate Working Hours**: Server calculates exact duration `(check_out_time - check_in_time)`. Updates task actual hours.
7. **Hour-Wise Payment**: Payment derived server-side as `hourly_rate * total_working_hours`.
8. **Real-time Dashboard & Reports**: Reflected immediately in Dashboard cards, task progress meters, and exportable CSV reports.
