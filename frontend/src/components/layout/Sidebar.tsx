import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, MapPin, IndianRupee, FileBarChart, X, Bell, Settings, HelpCircle, Rocket, User, LogOut, Clock, BarChart2, Building2, Receipt, FileText, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user, hasPermission } = useAuth();
  const isEmployee = user?.role_name === 'Employee';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isAllowed: true },
    { id: 'customers', label: 'Customers', icon: Building2, isAllowed: !isEmployee },
    { id: 'quotations', label: 'Quotations', icon: FileText, isAllowed: !isEmployee && (hasPermission('quotations', 'view') || user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager') },
    { id: 'employees', label: 'Employees', icon: Users, isAllowed: !isEmployee && hasPermission('employees', 'view') },
    { id: 'labours', label: 'Labours / Contractors', icon: Users, isAllowed: !isEmployee && hasPermission('labours', 'view') },
    { id: 'projects', label: 'Projects', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
    { id: 'projects/manage-work', label: 'Manage Project Work', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
    { id: 'site-surveys', label: 'Site Surveys', icon: ClipboardCheck, isAllowed: !isEmployee && (hasPermission('site_surveys', 'view') || user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager') },
    { id: 'invoices', label: 'Monthly Invoices', icon: Receipt, isAllowed: !isEmployee && (hasPermission('invoices', 'view') || user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager') },
    { id: 'tasks', label: isEmployee ? 'My Tasks' : 'Task Management', icon: CheckSquare, isAllowed: hasPermission('tasks', 'view') },
    { id: 'gantt-chart', label: 'Gantt Chart', icon: BarChart2, isAllowed: hasPermission('tasks', 'view') },
    { id: 'timesheets', label: isEmployee ? 'My Timesheets' : 'Timesheets', icon: Clock, isAllowed: hasPermission('timesheets', 'view') },
    { id: 'attendance', label: 'GPS Attendance', icon: MapPin, isAllowed: hasPermission('attendance', 'view') },
    { id: 'payments', label: 'Labour Payments', icon: IndianRupee, isAllowed: !isEmployee && hasPermission('payments', 'view') },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: FileBarChart, 
      isAllowed: hasPermission('reports', 'view'),
      children: [
        { id: 'reports', label: isEmployee ? 'My Reports' : 'All Reports', isAllowed: true },
        { id: 'reports/project-work', label: 'Project Work Report', isAllowed: true },
        { id: 'reports/project-profit-loss', label: 'Profit & Loss Report', isAllowed: true },
        { id: 'reports/planned-vs-actual', label: 'Planned vs Actual', isAllowed: true }
      ]
    },
  ];

  // Check if current page is inside Reports
  const isReportActive = currentPage.startsWith('reports');
  const [isReportsExpanded, setIsReportsExpanded] = useState(isReportActive);


  const filteredMenu = menuItems.filter((item) => item.isAllowed);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', width: '260px', transition: 'transform 0.3s' }}>
      {/* Brand Logo */}
      <div
        style={{
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: '#4f46e5' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="var(--bg-card)"></circle>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>HTCO ERP</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              GPS & Workforce
            </div>
          </div>
        </div>
        <button 
          className="sidebar-close-btn hamburger-btn" 
          onClick={onClose}
          style={{ display: 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        
        {/* Main Menu */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '1rem 0.5rem 0.5rem 0.5rem', fontWeight: 600 }}>
          MAIN MENU
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'reports' && isReportActive && item.children);

            if (item.children) {
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <button
                    onClick={() => setIsReportsExpanded(!isReportsExpanded)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: isReportActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                      color: isReportActive ? '#4f46e5' : 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Icon size={20} color={isReportActive ? '#4f46e5' : 'currentColor'} />
                      <span>{item.label}</span>
                    </div>
                    {isReportsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {isReportsExpanded && (
                    <div style={{ paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {item.children.filter(child => child.isAllowed).map(child => {
                        const isChildActive = currentPage === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => onNavigate(child.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: isChildActive ? '#4f46e5' : 'transparent',
                              color: isChildActive ? '#ffffff' : 'var(--text-secondary)',
                              fontWeight: isChildActive ? 600 : 500,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#4f46e5' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ height: '1px', background: 'rgba(150,150,150,0.1)', margin: '1.5rem 0.5rem' }}></div>

        {/* Other Menu */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.5rem 0.5rem 0.5rem', fontWeight: 600 }}>
          OTHER
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button onClick={() => document.dispatchEvent(new CustomEvent('toggleNotifications'))} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Bell size={20} />
              <span>Notifications</span>
            </div>
          </button>
          
          <button onClick={() => onNavigate('settings')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: currentPage === 'settings' ? '#4f46e5' : 'transparent', color: currentPage === 'settings' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <Settings size={20} color={currentPage === 'settings' ? '#ffffff' : 'currentColor'} />
            <span>Settings</span>
          </button>
          
          <button onClick={() => onNavigate('masters')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: currentPage === 'masters' ? '#4f46e5' : 'transparent', color: currentPage === 'masters' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <FileText size={20} color={currentPage === 'masters' ? '#ffffff' : 'currentColor'} />
            <span>System Masters</span>
          </button>

          <button onClick={() => onNavigate('support')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: currentPage === 'support' ? '#4f46e5' : 'transparent', color: currentPage === 'support' ? '#ffffff' : 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <HelpCircle size={20} color={currentPage === 'support' ? '#ffffff' : 'currentColor'} />
            <span>Help & Support</span>
          </button>
        </nav>
      </div>

      {/* System Footer */}
      <div style={{ padding: '1.5rem 1rem' }}>
        <div 
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '16px', 
            padding: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
          }}
        >
          <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Rocket size={20} color="#0f172a" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>HTCO Construction</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Building the future</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
