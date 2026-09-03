import React, { useState } from 'react';
import { ToastContainer } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Projects } from './pages/Projects';
import { ProjectForm } from './pages/ProjectForm';
import { Tasks } from './pages/Tasks';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Labours } from './pages/Labours';
import { ProjectWorkReport } from './pages/ProjectWorkReport';
import { ProjectWork } from './pages/ProjectWork';
import { Timesheets } from './pages/Timesheets';
import { Settings } from './pages/Settings';
import { Support } from './pages/Support';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { RequirePermission } from './components/common/RequirePermission';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return sessionStorage.getItem('saved_page') || 'dashboard';
  });

  React.useEffect(() => {
    sessionStorage.setItem('saved_page', currentPage);
  }, [currentPage]);
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');

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

  const renderPage = () => {
    const fallback = (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );

    switch (currentPage) {
      case 'dashboard': 
        return <Dashboard />; // Everyone has a dashboard, metrics are scoped
      case 'employees': 
        return <RequirePermission module="employees" action="view" fallback={fallback}><Employees /></RequirePermission>;
      case 'labours':
        return <RequirePermission module="labours" action="view" fallback={fallback}><Labours /></RequirePermission>;
      case 'projects': 
        return <RequirePermission module="projects" action="view" fallback={fallback}><Projects onNavigate={(page) => setCurrentPage(page)} /></RequirePermission>;
      case 'projects/create':
        return <RequirePermission module="projects" action="create" fallback={fallback}><ProjectForm onBack={() => setCurrentPage('projects')} /></RequirePermission>;
      case 'projects/manage-work':
        return <RequirePermission module="projects" action="view" fallback={fallback}><ProjectWork /></RequirePermission>;
      case 'tasks': 
        return <RequirePermission module="tasks" action="view" fallback={fallback}><Tasks /></RequirePermission>;
      case 'timesheets':
        return <RequirePermission module="timesheets" action="view" fallback={fallback}><Timesheets /></RequirePermission>;
      case 'attendance':
        return <RequirePermission module="attendance" action="view" fallback={fallback}><Attendance /></RequirePermission>;
      case 'payments': 
        return <RequirePermission module="payments" action="view" fallback={fallback}><Payments /></RequirePermission>;
      case 'reports': 
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports /></RequirePermission>;
      case 'reports/project-work':
        return <RequirePermission module="reports" action="view" fallback={fallback}><ProjectWorkReport /></RequirePermission>;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      default: 
        return <Dashboard />;
    }
  };

  const renderContent = () => {
    const fallback = (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );

    if (currentPage.startsWith('projects/edit/')) {
      const id = parseInt(currentPage.split('/').pop() || '0', 10);
      return <RequirePermission module="projects" action="update" fallback={fallback}><ProjectForm projectId={id} onBack={() => setCurrentPage('projects')} /></RequirePermission>;
    }
    
    return renderPage();
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
    </AuthProvider>
  );
};

export default App;
