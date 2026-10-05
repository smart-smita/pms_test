# HTCO ERP & Workforce Management System — Project Understanding Document

---

## 1. Project at a Glance

| Item | Details |
|------|---------|
| **Project Name** | HTCO Project & Workforce Management System |
| **System Category** | Enterprise Resource Planning (ERP), Timesheet & GPS Attendance System |
| **Target Enterprise** | HTCO (Engineering, Construction, or Field-Operations Company) |
| **Core Functionality** | Project setup, Discipline allocation, Sub-task assignment, Timesheet logging, GPS-based mobile attendance, Dashboard reports |
| **Primary Platforms** | Web Portal (Managers/Admins) + Mobile App APIs (Field Employees) |
| **System Status** | Functional core with legacy code patches applied; contains several unimplemented stubs and critical security risks |

---

## 2. What Exactly Is This Project?

**Simple Explanation:**  
This project is a **Project Tracking and Employee Work Logging System**.

Think of it as a central digital hub where a company manages its client projects from start to finish. Instead of relying on paper timesheets, Excel sheets, or WhatsApp updates, this application allows:
1. **Managers** to set up projects, define engineering/work categories (Disciplines like Civil, Electrical, Mechanical), assign tasks to workers, and track planned vs. actual working hours.
2. **Field Employees** to check in and check out of work sites using a mobile application, which automatically captures their GPS location and logs their daily working hours against specific tasks.

---

## 3. Project Purpose & Problem Solved

### The Problem It Solves
Without this system, the company faced several operational challenges:
- **No real-time tracking:** Managers could not easily see if a project was running behind schedule or over budget.
- **Manual timesheets:** Field workers manually wrote down hours, leading to errors, lost records, or inflated hours.
- **Attendance fraud:** No reliable way to verify if an employee was physically present at the client project location.
- **Disconnected systems:** Employee records lived in an external corporate ERP, while project tasks lived in local spreadsheets.

### The Objective
To streamline project delivery by linking **Projects → Work Disciplines → Employee Tasks → Timesheets → GPS Attendance** into a unified dashboard.

---

## 4. Technology Stack

| Component | Technology Used | Why It Is Used in This Project | Where It Is Used |
|-----------|-----------------|--------------------------------|------------------|
| **Frontend UI** | HTML5, CSS3, JavaScript, jQuery, Bootstrap 3.x | Provides responsive forms, modal popups, data tables, and navigation menus. | All web screens (`application/views/`) |
| **UI Icons** | FontAwesome & Material Design Icons (`zmdi`) | Renders icons for menu items, buttons, and status indicators. | Navigation sidebar and action tables |
| **Backend Framework** | PHP (CodeIgniter 2.2.0 core adapted for PHP 8.4) | MVC framework for routing requests, handling business logic, and session control. | Controllers (`application/controllers/`), System core |
| **Database** | MySQL (`eth_htco_db`) via MySQLi driver | Stores relational data for projects, employees, tasks, timesheets, and attendance logs. | All database queries via `base_models.php` |
| **Charts & Graphs** | Morris.js, Chart.js, jsGantt | Renders visual donut charts for project status, bar charts for planned vs actual hours, and Gantt charts. | Main Dashboard (`Home.php`), Reports |
| **PDF & Excel** | DOMPDF & PHPExcel | PDF document generation and Excel spreadsheet export capabilities. | Libraries (`application/libraries/dompdf`, `third_party/PHPExcel`) |
| **External Integration** | cURL / REST API | Connects to external corporate ERP (`htco-erp.ethdigitalcampus.com`) to authenticate users & sync employee lists. | `Welcome.php`, `Master.php` |
| **Mobile API** | Custom REST API (JSON responses) | Communicates with the Android mobile app for field worker check-in/out and task sync. | `application/controllers/Api/` |

---

## 5. Complete Project Flow Diagram

```
[ User (Web Browser or Mobile App) ]
                 │
                 ▼
     ┌───────────────────────┐
     │  Authentication Stage │
     └───────────┬───────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[ Web Admin/Manager ]  [ Mobile Worker ]
      │                     │
      ▼                     ▼
[ Login Screen ]      [ Mobile App Login ]
      │                     │
      ├─────────────────────┼────────────────────┐
      │ (Local HTCO-01 Check│ (Checks against    │
      │  or External ERP)   │  htco_employee_master)
      ▼                     ▼
[ Session Created ]   [ Access Token Returned ]
      │                     │
      ▼                     ▼
[ Web Dashboard ]     [ Mobile Actions ]
      │                     ├── Map Check-in / Out (GPS)
      │                     └── Task List Sync
      ▼
[ Web Master Modules ]
  ├── 1. Project Master (Create Projects & Assign Disciplines)
  ├── 2. Manage Tasks (Assign Sub-tasks to Employees)
  ├── 3. Timesheet Logging (Log Planned vs. Actual Hours)
  ├── 4. Master Data (Employee & Discipline Setup)
  └── 5. Attendance Reports (Day-wise GPS & Hours Reports)
      │
      ▼
┌───────────────────────────┐
│ MySQL Database            │
│ (eth_htco_db)             │
└───────────────────────────┘
```

---

## 6. User Roles

### Role 1: Super Admin / Management
- **Who they are:** Top management or system administrators.
- **Login Method:** Hardcoded master bypass (`HTCO-01` / `admin!@#`) or corporate ERP account.
- **Access Level:** Complete access to all modules, project creation, status overrides, and company-wide attendance/timesheet reports.

### Role 2: Project Managers / Team Leads
- **Who they are:** Department leads supervising projects and disciplines.
- **Login Method:** Corporate ERP credentials.
- **Access Level:** Create/manage projects, allocate sub-tasks to employees, log/edit team timesheets, and monitor planned vs. actual project progress.

### Role 3: Field Employees / Field Workers
- **Who they are:** On-site engineering and operational personnel.
- **Access Method:** Mobile Application (Android).
- **Access Level:** View assigned tasks, perform GPS Check-in when arriving at a project site, perform GPS Check-out upon departure, and review personal work logs.

---

## 7. Module-Wise Explanation

### MODULE 1: Authentication & Access (`Welcome.php`)
- **What it is:** The entry door to the web portal.
- **Why it is used:** To verify user identity and establish a secure browser session.
- **Who uses it:** All web portal users.
- **How it works:**
  1. User enters Employee Code and Password.
  2. If credentials match `HTCO-01` / `admin!@#`, the user is logged in as Super Admin instantly.
  3. Otherwise, the app sends a cURL request to the external ERP API (`http://htco-erp.ethdigitalcampus.com/.../authenticateEmployee`).
  4. If the ERP returns `code=0`, the session is created and redirected to the Dashboard.
- **Database / API used:** External ERP HTTP POST endpoint. Controller: [Welcome.php](file:///C:/wamp64/www/HTCO_Backup/application/controllers/Welcome.php).

---

### MODULE 2: Executive Dashboard (`Home.php`)
- **What it is:** The visual summary screen displayed right after login.
- **Why it is used:** Gives managers an instant status view of active work.
- **Who uses it:** Admins and Managers.
- **Key Features:**
  - Total Projects, Open Projects, and Completed Projects count cards.
  - Donut Chart showing active vs inactive project proportions.
  - Project Abstract Chart comparing Total Planned Hours vs Total Actual Hours logged across all projects.
  - Interactive Project Selector to view task progress by discipline.
- **Database / API used:** `htco_project_master`, `htco_project_task_master`, `htco_discipline_task_master`. Controller: [Home.php](file:///C:/wamp64/www/HTCO_Backup/application/controllers/Home.php).

---

### MODULE 3: Project Master (`ProjectMaster.php`)
- **What it is:** The primary module for managing projects and work structure.
- **Why it is used:** Allows managers to set up new client contracts and break them down into workable disciplines and tasks.
- **Who uses it:** Admins and Project Managers.
- **Sub-Features & Workflow:**
  1. **Manage Projects (`index`):** Table showing all projects with status tags (Pending, Active, Cancelled, Completed). Buttons allow activating, cancelling, or deleting projects.
  2. **Add/Edit Project (`addProject` / `acceptProjectDetails`):** Form to enter project code, project name, date, client code, client name, address, latitude, longitude, and radius. Also allows adding multiple disciplines (e.g. Civil, Mechanical) with planned start/end dates and budget hours.
  3. **Manage Project Work (`addWorkList` / `addNewWorkList`):** Allows updating actual start date, actual end date, and actual hours logged against each discipline.
  4. **Manage Tasks (`getDisciplineTask` / `addNewTaskWorkList`):** Breaks down a discipline into specific sub-tasks, assigning a specific employee, task description, work hours, and start/end timestamps.
  5. **Log & Edit Timesheets (`addWorkLogList` / `getTaskTimeLog` / `addTaskTimeLog`):** Allows managers or workers to submit daily timesheet entries against a discipline or sub-task.
- **Database Tables used:** `htco_project_master`, `htco_project_task_master`, `htco_discipline_task_master`, `htco_task_time_log_master`.

---

### MODULE 4: Master Data Management (`Master.php`)
- **What it is:** Administrative setup for employees and work categories.
- **Why it is used:** Maintains master lookup lists required across the application.
- **Who uses it:** Super Admin.
- **Key Features:**
  - **Employee List & ERP Sync (`getEmployee` / `getEmployeesOnApiCall`):** Displays employees. Features a one-click Sync button that calls the external ERP API to pull in the latest employee roster, email addresses, designations, and discipline assignments.
  - **Discipline Master (`getDiscipline` / `addDiscipline`):** Manages the list of standard work categories (Class Code + Discipline Name). Disciplines can be activated, deactivated, or deleted.
  - **Employee Profile (`profile`):** View/edit profile details for an employee.
- **Database Tables used:** `htco_employee_master`, `htco_discipline_master`.

---

### MODULE 5: Attendance Reports (`ReportMaster.php`)
- **What it is:** The reporting engine for employee work hours and field presence.
- **Why it is used:** Verifies employee attendance and hours for payroll and project billing.
- **Who uses it:** HR, Management, Payroll.
- **Key Features:**
  - **Attendance Report View 1 (Day-Wise Hours):** Filters by employee and date range. Calculates total hours using SQL `TIMEDIFF(max_out, min_in)`.
  - **Attendance Report View 2 (In/Out Time & Location):** Displays exact Check-in time, Check-out time, total hours, and recorded location address.
  - **Attendance Report View 3 (Compact Hours):** Condensed daily summary report.
- **Database Tables used:** `htco_attendence_details`, `htco_employee_master`.

---

### MODULE 6: Mobile REST API (`application/controllers/Api/`)
- **What it is:** Backend JSON API endpoints serving the Android field application.
- **Why it is used:** Field workers use a native mobile app rather than the web browser.
- **Who uses it:** Android Mobile Application.
- **Key Endpoints:**
  - `POST Api/Login/login`: Authenticates field worker against `htco_employee_master`. Returns user privileges and config.
  - `POST Api/Login/checkInOut`: Records GPS Check-in (latitude, longitude, timestamp, address, task ID) or Check-out.
  - `POST Api/Login/getTaskList`: Retrieves attendance history for a given employee and date range.
  - `POST Api/Login/getMapTaskList`: Retrieves active projects for map display.
  - `POST Api/MapActivity/mapcheckin`: Handles map-based site check-in.

---

## 8. User Flow

```
=====================================================
ADMIN / MANAGER USER FLOW
=====================================================
[1. Open Web Portal] -> [2. Enter Credentials] -> [3. View Dashboard Charts]
         │
         ├──> [4. Go to Project Master]
         │       ├── Create New Project (Name, Client, GPS Bounds)
         │       ├── Assign Disciplines (Civil, Elec) + Planned Hours
         │       └── Allocate Sub-Tasks to Employees
         │
         ├──> [5. Go to Timesheet Management]
         │       ├── Log Daily Hours for Team
         │       └── Review / Edit Existing Work Logs
         │
         ├──> [6. Go to Master Data]
         │       ├── Sync Roster with Corporate ERP
         │       └── Manage Work Disciplines
         │
         └──> [7. Go to Reports]
                 └── Generate Attendance & Hours Reports (Filter by Date/Employee)

=====================================================
FIELD EMPLOYEE MOBILE FLOW
=====================================================
[1. Open Mobile App] -> [2. Enter Employee Code & Password]
         │
         ├──> [3. View Assigned Site Projects on Map]
         │
         ├──> [4. Arrive at Site → Tap "Check In"]
         │       └── App sends GPS Lat/Long + Address + Selected Task ID
         │
         ├──> [5. Work on Assigned Task]
         │
         └──> [6. Depart Site → Tap "Check Out"]
                 └── App sends GPS Lat/Long + Timestamp → System calculates duration
```

---

## 9. Data Flow Architecture

```
[ User Input (Web Form or Mobile Touch) ]
                   │
                   ▼
       [ HTTP POST Request ]
                   │
                   ▼
    [ CodeIgniter Routing System ]
  (Directs request to Controller method)
                   │
                   ▼
     [ Controller Business Logic ]
   (Validates inputs & preps arrays)
                   │
                   ▼
     [ Universal Model (base_models.php) ]
   (Executes MySQL SELECT / INSERT / UPDATE)
                   │
                   ▼
       [ MySQL Database (eth_htco_db) ]
                   │
                   ▼
     [ Result Array Returned to Controller ]
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 [ Web Controller ]   [ API Controller ]
        │                     │
        ▼                     ▼
 [ Load View + Data ] [ Echo json_encode() ]
        │                     │
        ▼                     ▼
 [ Rendered HTML Page ] [ Mobile App JSON Response ]
```

---

## 10. Database Table Overview

| Table Name | Business Purpose | Key Columns | Used In Module |
|------------|------------------|-------------|----------------|
| `htco_employee_master` | Stores employee profiles and sync status | `employee_id`, `employee_code`, `employee_name`, `employee_password`, `employee_status`, `employee_discipline_data` | Master Data, Login, All Modules |
| `htco_project_master` | Stores client projects and GPS boundaries | `project_id`, `project_code`, `project_name`, `project_client_name`, `project_lat`, `project_lng`, `project_status` | Project Master, Dashboard, Mobile Map API |
| `htco_project_task_master` | Stores discipline work packages assigned to a project | `employee_project_id`, `project_id`, `task_id` (discipline_id), `plan_start_date`, `plan_hrs`, `actual_hrs` | Project Master, Timesheets |
| `htco_discipline_master` | Master lookup for work categories | `id`, `class_code`, `discipline_name`, `discipline_status` | Master Data, Task Allocation |
| `htco_discipline_task_master` | Specific sub-tasks assigned to individual employees | `dt_id`, `project_id`, `discipline_id`, `employee_id`, `task_description`, `work_hrs`, `task_start_datetime` | Task Allocation, Timesheets |
| `htco_task_time_log_master` | Daily timesheet entries submitted by/for workers | `time_log_id`, `project_id`, `discipline_id`, `task_id`, `employee_id`, `task_date`, `task_hrs`, `time_log_on` | Timesheets, Work Log List |
| `htco_attendence_details` | GPS check-in/out records from mobile app | `attendence_id`, `employee_id`, `attendence_date`, `attendence_in_time`, `attendence_out_time`, `in_latitude`, `in_longitude`, `in_address` | Attendance Reports, Mobile Check-in API |

---

## 11. API Reference Table

### Internal Mobile APIs (`application/controllers/Api/Login.php`)

| Endpoint Method | HTTP | Parameters | Purpose | Response |
|-----------------|------|------------|---------|----------|
| `login` | `POST` | `employee_code`, `employee_password` | Mobile worker login | `{ code: 0, msg: "Login Done", data: { profile, privilege } }` |
| `checkInOut` | `POST` | `employee_code`, `in_lat`, `in_long`, `address`, `task_id` (OR `attendance_id`, `out_lat`, `out_long` for check-out) | GPS Site Check-in or Check-out | `{ code: 0/1, msg: "Checked in/out", attendance_id }` |
| `getTaskList` | `POST` | `employee_code`, `date_start`, `date_end` | Fetch employee's personal attendance history | `{ code: 0, data: [...attendance_records] }` |
| `getMapTaskList` | `POST` | `employee_code` | Fetch active projects for mobile map view | `{ code: 0, data: [...active_projects] }` |

### External Integration API (cURL)

| Target Service | Endpoint URL | Triggered By | Purpose |
|----------------|--------------|--------------|---------|
| External Corporate ERP | `http://htco-erp.ethdigitalcampus.com/WebAPI/service/DC/authenticateEmployee` | `Welcome.php` login | Verifies non-admin credentials against external corporate database |
| External Corporate ERP | `http://htco-erp.ethdigitalcampus.com/WebAPI/service/DC/EmployeeDetails` | `Master.php` employee sync | Pulls full corporate employee roster and updates `htco_employee_master` |

---

## 12. Authentication & Security Assessment

### How Authentication Works
1. Web login checks hardcoded `HTCO-01` / `admin!@#` credentials first. If matched, access is granted as Admin.
2. If not matched, a background cURL POST is sent to the external ERP system.
3. Once authenticated, a native PHP session (`$_SESSION['employee_code']`) is populated.
4. `Base_Controller` verifies `$_SESSION['employee_code']` on every page request.

### 🔴 Security Vulnerabilities Identified in Code

| # | Vulnerability | Severity | Explanation |
|---|---------------|----------|-------------|
| 1 | **Plaintext Passwords** | **CRITICAL** | Passwords in `htco_employee_master.employee_password` are stored as raw text without hashing (`password_hash()`). |
| 2 | **SQL Injection** | **HIGH** | Multiple SQL queries construct strings by directly concatenating raw `$_POST` variables without parameter binding (e.g., `WHERE project_id=".$_POST['project_id']`). |
| 3 | **Hardcoded Admin Credentials** | **HIGH** | Master credentials (`HTCO-01` / `admin!@#`) are hardcoded directly into [Welcome.php line 37](file:///C:/wamp64/www/HTCO_Backup/application/controllers/Welcome.php#L37). |
| 4 | **No API Authentication** | **HIGH** | Mobile API endpoints accept requests without requiring API tokens or bearer authorization. |
| 5 | **Disabled CSRF** | **MEDIUM** | `$config['csrf_protection']` is set to `FALSE` in `config.php`. |
| 6 | **No Role Restrictions** | **MEDIUM** | Any user with a valid session can type URLs to access administrative screens; no granular permission checking exists. |

---

## 13. Important Files & Folder Directory

```
HTCO_Backup/
├── index.php                         ← Master front-controller file
├── .htaccess                         ← Apache URL rewrite rule file
├── application/
│   ├── config/
│   │   ├── config.php                ← Core settings (base_url, index_page)
│   │   ├── database.php              ← Database connection parameters
│   │   ├── autoload.php              ← Auto-loaded libraries and helpers
│   │   └── routes.php                ← System URL routing configuration
│   ├── core/
│   │   └── Base_Controller.php       ← Parent controller initializing session & models
│   ├── controllers/
│   │   ├── Welcome.php               ← Portal login, logout, and ERP cURL auth
│   │   ├── Home.php                  ← Dashboard charts and project metrics
│   │   ├── Master.php                ← Employee roster sync & discipline master
│   │   ├── ProjectMaster.php         ← Core project management & timesheet engine
│   │   ├── ReportMaster.php          ← Attendance & hours reporting views
│   │   ├── TaskMaster.php            ← Task allocation stub controller
│   │   └── Api/
│   │       ├── Login.php             ← Mobile app login & GPS check-in/out API
│   │       └── MapActivity.php       ← Mobile map check-in handler
│   ├── models/
│   │   ├── base_models.php           ← Universal CRUD model for MySQL queries
│   │   ├── jsganttchartmodel.php     ← Model preparing Gantt chart data structures
│   │   └── model_chartjs/            ← Color profiles and chart rendering models
│   └── views/
│       ├── common/                   ├── Header, Footer, Top Bar, Left Menu templates
│       ├── forms/                    ├── Dynamic entry forms for projects/tasks/timesheets
│       ├── reports/                  ├── Attendance report layout templates
│       └── dashboard.php             └── Dashboard UI container
└── assets/                           ← CSS, jQuery, Bootstrap, Morris Charts, jsGantt assets
```

---

## 14. Customer Demonstration Step-by-Step Flow

If you are demonstrating this application to a customer or manager, follow this exact sequence:

1. **Step 1: System Access & Login**
   - Open browser to `http://localhost/HTCO_Backup/index.php/Welcome`
   - Enter Employee Code: `HTCO-01` and Password: `admin!@#`
   - Click **Login**.

2. **Step 2: Dashboard Overview**
   - Show the Total, Open, and Completed project count cards.
   - Point out the **Project Details Donut Chart** and the **Project Abstract Bar Chart** (Planned vs Actual Hours).

3. **Step 3: Project Setup**
   - In left menu, click **Project Master → Manage Project**.
   - Click the blue `+` button to create a new project.
   - Enter Project Code, Project Name, Client details, and add Work Disciplines (e.g. Civil - 100 planned hours). Click **Submit**.

4. **Step 4: Task Allocation**
   - In left menu, click **Project Master → Manage Tasks**.
   - Select the project and discipline.
   - Assign specific sub-tasks to an employee with start/end times and estimated hours.

5. **Step 5: Timesheet Logging**
   - In left menu, click **Project Master → Log Timesheet**.
   - Enter daily worked hours against assigned disciplines/tasks.
   - Go to **Edit Timesheet** to review recorded entries.

6. **Step 6: Attendance Reports**
   - In left menu, click **Report Master → Attendance Report**.
   - Select an employee and date range. Show the calculated total hours and check-in location summary.

---

## 15. Technical Issues, Risks & Discrepancies Found

During full codebase inspection, the following discrepancies were identified:

1. **GPS Coordinate Column Swap Bug:**  
   In [Api/Login.php line 128-129](file:///C:/wamp64/www/HTCO_Backup/application/controllers/Api/Login.php#L128-L129), `in_latitude` receives the `in_lat` parameter value while `in_longitude` receives `in_long`. However, on lines 166-167, the parameters are assigned in reverse (`in_longitude` gets `in_lat`). This causes corrupted map coordinates for certain check-in modes.
2. **Dead Code in `ProjectMaster.php`:**  
   The `taskList()` method (lines 256–267) references `$discipline_id`, `$id`, `$discipline_start_date`, etc., which are never defined. Calling this method will cause a PHP fatal error.
3. **Unimplemented Report Stubs:**  
   - `ReportMaster/getBudgetDetails()` opens an empty project details template.
   - `ReportMaster/getTimeLineDetails()` opens an empty template.
   - `ReportMaster/ganttchart()` references an undefined `$data` variable.
4. **Dashboard Gantt Chart Hidden:**  
   The Gantt chart widget in `dashboard.php` is intentionally hidden using `if(isset($timeline_new) && false)`.
5. **Class Name Case Inconsistencies:**  
   Earlier, class names (`base_models`, `jsganttchartmodel`, `methodchartjsmodel`) did not match `new` instantiations in controllers. *Note: We fixed these case mismatches during our initial PHP 8.4 upgrade session.*

---

## 16. Clarification Questions for Customer / Previous Developer

When meeting with the client or previous developer, ask these key questions:

- [ ] **Authentication Strategy:** Should non-admin employee logins continue authenticating via the external cURL ERP API (`htco-erp.ethdigitalcampus.com`), or should all employee passwords be migrated into `eth_htco_db` with `password_hash()` encryption?
- [ ] **GPS Swapping:** Is the mobile app sending `lat,long` or `long,lat`? (We need to standardize column mapping in `Api/Login.php`).
- [ ] **Unfinished Reports:** Are the **Budget Report**, **Project Timeline Report**, and **Gantt Chart** required features for the next release, or were they abandoned requirements?
- [ ] **Role Permissions:** Are all web portal users supposed to have full manager access, or should field workers be blocked from accessing administrative project creation screens?
- [ ] **Task Master Menu:** The `Task Master` menu option is currently commented out in `left.php`. Should this module be reactivated or removed entirely?

---

## 17. Quick Summaries (For Easy Presentation)

### A. 2-Minute Project Explanation
> "HTCO is a web and mobile project management system designed for engineering and field-operations companies. It breaks client projects down into work categories like Civil or Electrical, assigns tasks to employees, and tracks working hours. Field employees use an Android mobile app to Check In and Check Out of work sites using GPS location verification. Managers use the web portal to set up projects, allocate planned hours, log timesheets, and monitor progress using visual dashboards and attendance reports."

### B. 5-Minute Project Explanation
> "HTCO was developed to replace manual paper timesheets and spreadsheet tracking with an automated digital workflow. 
> 
> The system operates in 4 main stages:
> 1. **Project Setup:** Managers create a project in the Web Portal, define location coordinates, and assign work disciplines with budget hours.
> 2. **Task Assignment:** Specific sub-tasks are allocated to employees with target start/end dates and hours.
> 3. **Field Attendance & Execution:** Field workers log in via an Android mobile app. Upon arriving at a project site, they tap 'Check In' which records their exact GPS coordinates and time against the selected task. When leaving, they tap 'Check Out'.
> 4. **Tracking & Reporting:** All logged hours flow into a central MySQL database. The web portal processes this data to generate planned vs. actual progress bar charts on the Dashboard, as well as day-wise attendance reports for management and payroll.
> 
> The system is built on PHP (CodeIgniter framework), MySQL, Bootstrap, and jQuery, and integrates via cURL with an external corporate ERP."

---

## 18. Final Project Summary

| Area | Assessment | Summary Status |
|------|------------|----------------|
| **Core Functionality** | 🟢 Working | Project management, task allocation, timesheets, and GPS check-in/out APIs are fully operational. |
| **PHP 8.4 Support** | 🟢 Upgraded | Legacy CI 2.2 errors (`E_STRICT`, `__autoload`, dynamic properties, `filter_var` type errors, `count(null)` errors) have been completely patched. |
| **User Interface** | 🟢 Functional | Responsive Bootstrap 3 dashboard with Morris.js charts and custom data tables. |
| **Security Risk** | 🔴 High Risk | Requires immediate password hashing, SQL injection parameter binding, CSRF enablement, and API token checks before production deployment. |
| **Completeness** | 🟡 Partial | Core workflows complete; Budget/Timeline reports and Gantt charts remain incomplete stubs. |

---
*Documentation generated based on source code analysis of `C:\wamp64\www\HTCO_Backup`.*
