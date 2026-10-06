import React, { useState, useEffect } from 'react';
import { ToastContainer } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Projects } from './pages/Projects';
import { ProjectForm } from './pages/ProjectForm';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { PlanningWorkspace } from './pages/PlanningWorkspace';
import { ProjectCreatePage } from './pages/ProjectCreatePage';
import { ProjectEditPage } from './pages/ProjectEditPage';

import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskEditPage } from './pages/TaskEditPage';
import { Tasks } from './pages/Tasks';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Labours } from './pages/Labours';
import { ProjectWorkReport } from './pages/ProjectWorkReport';
import { ProjectProfitLossReport } from './pages/ProjectProfitLossReport';
import { ProjectWork } from './pages/ProjectWork';
import { Timesheets } from './pages/Timesheets';
import { TimesheetFormPage } from './pages/TimesheetFormPage';
import { Settings } from './pages/Settings';
import { Masters } from './pages/Masters';
import { Support } from './pages/Support';
import { GanttChartPage } from './pages/GanttChartPage';
import { Customers } from './pages/Customers';
import { Quotations } from './pages/Quotations';
import { QuotationForm } from './pages/QuotationForm';
import { QuotationView } from './pages/QuotationView';
import { SiteSurveys } from './pages/SiteSurveys';
import { Invoices } from './pages/Invoices';
import { PlannedVsActualReport } from './pages/PlannedVsActualReport';
import { Materials } from './pages/Materials';
import { MaterialQuotations } from './pages/MaterialQuotations';

import { WbsTemplates } from './pages/WbsTemplates';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { RequirePermission } from './components/common/RequirePermission';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Initialize page from URL Path or Session Storage
  const getInitialPage = () => {
    let path = window.location.pathname.replace(/^\/+/, '');
    if (path) return path;
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash) return hash;
    return sessionStorage.getItem('saved_page') || 'dashboard';
  };

  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');

  // Sync state to URL and sessionStorage
  useEffect(() => {
    // Phase 1 Redirection Map for legacy flat routes -> nested Workspace routes
    const redirects: Record<string, string> = {
      'projects': 'project/workspace/0/list',
      'projects/manage-work': 'project/workspace/0/manage-work',
      'tasks': 'project/workspace/0/tasks',
      'labours': 'project/workspace/0/labour-work',
      'materials': 'project/workspace/0/materials',
      'site-surveys': 'project/workspace/0/site-surveys',
      'timesheets': 'project/workspace/0/timesheets',
      'attendance': 'project/workspace/0/attendance',
      'gantt-chart': 'project/workspace/0/gantt',
      'invoices': 'project/workspace/0/invoices',
      'wbs-templates': 'masters?tab=wbs-templates',
      'employees': 'masters?tab=employees'
    };

    let targetPage = currentPage;
    if (redirects[currentPage]) {
      targetPage = redirects[currentPage];
      setCurrentPage(targetPage);
      return;
    }

    sessionStorage.setItem('saved_page', targetPage);
    
    // Update URL without hash if it differs
    const currentPath = window.location.pathname.replace(/^\/+/, '');
    if (currentPath !== targetPage) {
      window.history.pushState({}, '', `/${targetPage}`);
    }
  }, [currentPage]);

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname.replace(/^\/+/, '');
      if (!path) {
        const hash = window.location.hash.replace(/^#\/?/, '');
        if (hash) path = hash;
      }
      if (path && path !== currentPage) {
        setCurrentPage(path);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    if (authView === 'forgot-password') {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    }
    return <Login onForgotPassword={() => setAuthView('forgot-password')} />;
  }

  const renderContent = () => {
    const fallback = (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );

    const nav = (page: string) => setCurrentPage(page);

    // ── 1. Dynamic Task Routes inside Project Workspace ──
    // Route: project/workspace/:projectId/tasks/new
    if (currentPage.includes('/tasks/new')) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Task Creation Moved</h2>
          <p>Please go to the Manage Project Work tab to log timesheets and auto-create tasks.</p>
          <button onClick={() => nav('project/workspace')}>Go to Project Workspace</button>
        </div>
      );
    }

    // Route: project/workspace/:projectId/tasks/:taskId/edit
    if (currentPage.includes('/tasks/') && currentPage.endsWith('/edit')) {
      const match = currentPage.match(/project\/workspace\/(\d+)\/tasks\/(\d+)\/edit/);
      if (match) {
        const projectId = parseInt(match[1], 10);
        const taskId = parseInt(match[2], 10);
        return (
          <RequirePermission module="tasks" action="update" fallback={fallback}>
            <TaskEditPage projectId={projectId} taskId={taskId} onNavigate={nav} />
          </RequirePermission>
        );
      }
    }

    // Route: project/workspace/:projectId/tasks/:taskId (View Task Details)
    if (currentPage.includes('/tasks/')) {
      const match = currentPage.match(/project\/workspace\/(\d+)\/tasks\/(\d+)/);
      if (match) {
        const projectId = parseInt(match[1], 10);
        const taskId = parseInt(match[2], 10);
        return (
          <RequirePermission module="tasks" action="view" fallback={fallback}>
            <TaskDetailPage projectId={projectId} taskId={taskId} onNavigate={nav} />
          </RequirePermission>
        );
      }
    }

    // ── 1b. Dynamic Timesheet Routes inside Project Workspace ──
    // Route: project/workspace/:projectId/timesheets/new
    if (currentPage.includes('/timesheets/new')) {
      const match = currentPage.match(/project\/workspace\/(\d+)\/timesheets\/new/);
      const projectId = match ? parseInt(match[1], 10) : 0;
      return (
        <RequirePermission module="timesheets" action="create" fallback={fallback}>
          <TimesheetFormPage projectId={projectId} onNavigate={nav} />
        </RequirePermission>
      );
    }

    // Route: project/workspace/:projectId/timesheets/:timesheetId/edit
    if (currentPage.includes('/timesheets/') && currentPage.endsWith('/edit')) {
      const match = currentPage.match(/project\/workspace\/(\d+)\/timesheets\/(\d+)\/edit/);
      if (match) {
        const projectId = parseInt(match[1], 10);
        const timesheetId = parseInt(match[2], 10);
        return (
          <RequirePermission module="timesheets" action="update" fallback={fallback}>
            <TimesheetFormPage projectId={projectId} timesheetId={timesheetId} onNavigate={nav} />
          </RequirePermission>
        );
      }
    }

    // ── 2. Dynamic Project Routes ──
    // Route: project/new or projects/create
    if (currentPage === 'project/new' || currentPage === 'projects/create') {
      return (
        <RequirePermission module="projects" action="create" fallback={fallback}>
          <ProjectCreatePage onNavigate={nav} />
        </RequirePermission>
      );
    }

    // Route: project/:id/edit or projects/edit/:id
    if (currentPage.startsWith('project/') && currentPage.endsWith('/edit')) {
      const match = currentPage.match(/project\/(\d+)\/edit/);
      const id = match ? parseInt(match[1], 10) : 0;
      return (
        <RequirePermission module="projects" action="update" fallback={fallback}>
          <ProjectEditPage projectId={id} onNavigate={nav} />
        </RequirePermission>
      );
    }
    if (currentPage.startsWith('projects/edit/')) {
      const id = parseInt(currentPage.split('/').pop() || '0', 10);
      return (
        <RequirePermission module="projects" action="update" fallback={fallback}>
          <ProjectEditPage projectId={id} onNavigate={nav} />
        </RequirePermission>
      );
    }

    // Route: project/workspace or project/workspace/:projectId/:tab
    if (currentPage.startsWith('project/workspace') || currentPage.startsWith('projects/workspace')) {
      const parts = currentPage.split('?');
      const segments = parts[0].split('/');
      let projectId: number | undefined = undefined;
      let initialTab = 'list';

      if (segments.length >= 3 && !isNaN(Number(segments[2]))) {
        projectId = parseInt(segments[2], 10);
        if (segments.length >= 4) {
          initialTab = segments[3];
        }
      }

      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        if (params.has('tab')) initialTab = params.get('tab')!;
      }

      return (
        <RequirePermission module="projects" action="view" fallback={fallback}>
          <ProjectWorkspace projectId={projectId} initialTab={initialTab} onNavigate={nav} />
        </RequirePermission>
      );
    }

    // ── 2.5 Planning Workspace Route ──
    if (currentPage.startsWith('planning/workspace')) {
      const parts = currentPage.split('?');
      const segments = parts[0].split('/');
      let planningId: number | undefined = undefined;
      let initialTab = 'list';

      if (segments.length >= 3 && !isNaN(Number(segments[2]))) {
        planningId = parseInt(segments[2], 10);
        if (segments.length >= 4) {
          initialTab = segments[3];
        }
      }

      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        if (params.has('tab')) initialTab = params.get('tab')!;
      }

      return (
        <RequirePermission module="projects" action="view" fallback={fallback}>
          <PlanningWorkspace planningId={planningId} initialTab={initialTab} onNavigate={nav} />
        </RequirePermission>
      );
    }

    // ── 3. Quotation Routes ──
    if (currentPage.startsWith('quotations/edit/')) {
      const id = parseInt(currentPage.split('/').pop() || '0', 10);
      return <RequirePermission module="quotations" action="update" fallback={fallback}><QuotationForm quotationId={id} onBack={() => setCurrentPage('quotations')} onNavigate={nav} /></RequirePermission>;
    }
    if (currentPage.startsWith('quotations/view/')) {
      const id = parseInt(currentPage.split('/').pop() || '0', 10);
      return <RequirePermission module="quotations" action="view" fallback={fallback}><QuotationView quotationId={id} onBack={() => setCurrentPage('quotations')} onNavigate={nav} /></RequirePermission>;
    }

    // ── 3.5 Master Routes (Single Master Workspace with Tab Routing) ──
    if (currentPage.startsWith('masters')) {
      const parts = currentPage.split('?');
      let initialTab: string | undefined = undefined;
      let initialAction: string | undefined = undefined;

      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        if (params.has('tab')) initialTab = params.get('tab')!;
        if (params.has('action')) initialAction = params.get('action')!;
      }

      const segments = parts[0].split('/');
      if (segments.length >= 2 && segments[1]) {
        if (!initialTab) initialTab = segments[1];
        if (segments.length >= 3 && segments[2]) {
          initialAction = segments[2];
        }
      }

      return (
        <RequirePermission module="masters" action="manage" fallback={fallback}>
          <Masters initialTab={initialTab} initialAction={initialAction} onNavigate={nav} />
        </RequirePermission>
      );
    }

    // ── 4. Standard App Pages & Old Route Redirects ──
    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard onNavigate={nav} />;
      
      // Project Workspace (Primary Route) Fallback
      case 'project-work':
        return <RequirePermission module="projects" action="view" fallback={fallback}><ProjectWork /></RequirePermission>;

      case 'project/workspace':
        return <RequirePermission module="projects" action="view" fallback={fallback}><ProjectWorkspace onNavigate={nav} /></RequirePermission>;

      // Planning Workspace (Primary Route) Fallback
      case 'planning/workspace':
        return <RequirePermission module="projects" action="view" fallback={fallback}><PlanningWorkspace onNavigate={nav} /></RequirePermission>;

      case 'customers':
        return <RequirePermission module="customers" action="view" fallback={fallback}><Customers /></RequirePermission>;
      case 'quotations':
        return <RequirePermission module="quotations" action="view" fallback={fallback}><Quotations onNavigate={nav} /></RequirePermission>;
      case 'quotations/create':
        return <RequirePermission module="quotations" action="create" fallback={fallback}><QuotationForm onBack={() => setCurrentPage('quotations')} onNavigate={nav} /></RequirePermission>;
      case 'employees': 
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="employees" onNavigate={nav} /></RequirePermission>;
      case 'payments': 
        return <RequirePermission module="payments" action="view" fallback={fallback}><Payments /></RequirePermission>;
      
      // Reports
      case 'reports': 
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports /></RequirePermission>;
      case 'reports/project-work':
        return <RequirePermission module="reports" action="view" fallback={fallback}><ProjectWorkReport /></RequirePermission>;
      case 'reports/quotation':
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports initialReport="quotation" /></RequirePermission>;
      case 'reports/wbs':
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports initialReport="wbs" /></RequirePermission>;
      case 'reports/labour-employee':
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports initialReport="labour-employee" /></RequirePermission>;
      case 'reports/attendance':
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports initialReport="attendance" /></RequirePermission>;
      case 'reports/material':
        return <RequirePermission module="site_surveys" action="view" fallback={fallback}><SiteSurveys initialTab="material" /></RequirePermission>;
      case 'reports/cost':
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports initialReport="cost" /></RequirePermission>;
      case 'reports/invoice':
        return <RequirePermission module="invoices" action="view" fallback={fallback}><Invoices /></RequirePermission>;
      case 'reports/project-profit-loss':
        return <RequirePermission module="reports" action="view" fallback={fallback}><ProjectProfitLossReport /></RequirePermission>;
      case 'reports/planned-vs-actual':
        return <RequirePermission module="reports" action="view" fallback={fallback}><PlannedVsActualReport /></RequirePermission>;
      
      // Masters
      case 'materials':
        return <RequirePermission module="materials" action="view" fallback={fallback}><Materials /></RequirePermission>;
      case 'material-quotations':
        return <RequirePermission module="materials" action="view" fallback={fallback}><MaterialQuotations /></RequirePermission>;

      case 'wbs-templates':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="wbs_templates" onNavigate={nav} /></RequirePermission>;
      case 'masters': 
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters onNavigate={nav} /></RequirePermission>;
      case 'masters/project-types':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="project_types" onNavigate={nav} /></RequirePermission>;
      case 'masters/terms-templates':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="terms_templates" onNavigate={nav} /></RequirePermission>;
      case 'masters/labour-types':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="labour_types" onNavigate={nav} /></RequirePermission>;
      case 'masters/units':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="units" onNavigate={nav} /></RequirePermission>;
      case 'masters/communities':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="communities" onNavigate={nav} /></RequirePermission>;
      case 'masters/currency':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="currencies" onNavigate={nav} /></RequirePermission>;
      case 'masters/taxes':
        return <RequirePermission module="masters" action="manage" fallback={fallback}><Masters initialTab="taxes" onNavigate={nav} /></RequirePermission>;

      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      default: 
        return <Dashboard onNavigate={nav} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={(page) => setCurrentPage(page)}>
      {renderContent()}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastContainer />
      <AppContent />
      <PWAInstallPrompt />
    </AuthProvider>
  );
};

export default App;
