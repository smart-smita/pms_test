# System Assumptions & Technical Decisions

## 1. Hour-Wise Payment Basis
- Payment is calculated server-side as `payment = hourly_rate * total_working_hours`.
- `hourly_rate` is defined per employee on the `employees` table.
- Clients can never submit payment amounts directly to the backend; all payments are recomputed upon request using verified attendance logs.

## 2. Attendance & GPS Verification
- Attendance duration is calculated as `check_out_time - check_in_time`.
- An employee can only have one "open" (checked-in, not checked-out) attendance log at a time across the entire system.
- If a check-in remains open past 23:59:59 of the attendance date, the system flags it as a "Missing Check-Out".

## 3. Project Progress & Task Productivity Classification
- Project Progress (%) = `(Count of Completed Tasks / Total Tasks in Project) * 100`. If a project has 0 tasks, progress is 0%.
- Task Productivity is classified dynamically:
  - **Completed**: Task status set to completed.
  - **Exceeding Estimate**: Actual logged hours > Estimated hours.
  - **Delayed**: Target date has passed, but status is not completed.
  - **Extra Hours Logged**: Actual logged hours > Estimated hours and status is completed.
  - **On-Time**: Task completed before/on target date without exceeding estimated hours.

## 4. Task Worker Requirements & Staffing
- Tasks have a `required_worker_count` field.
- If `assigned_worker_count < required_worker_count`, the task is flagged as **Under-Staffed**.

## 5. Security & Authentication
- Passwords are encrypted using `bcrypt` (10 rounds).
- Authentication produces a short-lived JWT Access Token (15m) and Refresh Token (7d).
- Protected API routes check role permissions (`Admin`, `Manager`, `Employee`).
