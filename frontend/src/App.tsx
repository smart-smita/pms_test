import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Projects } from './pages/Projects';
import { Tasks } from './pages/Tasks';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Support } from './pages/Support';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { RequirePermission } from './components/common/RequirePermission';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
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
      case 'projects': 
        return <RequirePermission module="projects" action="view" fallback={fallback}><Projects /></RequirePermission>;
      case 'tasks': 
        return <RequirePermission module="tasks" action="view" fallback={fallback}><Tasks /></RequirePermission>;
      case 'attendance': 
        return <RequirePermission module="attendance" action="view" fallback={fallback}><Attendance /></RequirePermission>;
      case 'payments': 
        return <RequirePermission module="payments" action="view" fallback={fallback}><Payments /></RequirePermission>;
      case 'reports': 
        return <RequirePermission module="reports" action="view" fallback={fallback}><Reports /></RequirePermission>;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      default: 
        return <Dashboard />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={(page) => setCurrentPage(page)}>
      {renderPage()}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
