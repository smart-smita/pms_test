import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, MapPin, IndianRupee, FileBarChart, X, Bell, Settings, HelpCircle, Rocket, User, LogOut, Clock } from 'lucide-react';

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
    { id: 'employees', label: 'Employees', icon: Users, isAllowed: !isEmployee && hasPermission('employees', 'view') },
    { id: 'labours', label: 'Labours / Contractors', icon: Users, isAllowed: !isEmployee && hasPermission('labours', 'view') },
    { id: 'projects', label: 'Projects', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
    { id: 'projects/manage-work', label: 'Manage Project Work', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
    { id: 'tasks', label: isEmployee ? 'My Tasks' : 'Task Management', icon: CheckSquare, isAllowed: hasPermission('tasks', 'view') },
    { id: 'timesheets', label: isEmployee ? 'My Timesheets' : 'Timesheets', icon: Clock, isAllowed: hasPermission('timesheets', 'view') },
    { id: 'attendance', label: 'GPS Attendance', icon: MapPin, isAllowed: hasPermission('attendance', 'view') },
    { id: 'payments', label: 'Labour Payments', icon: IndianRupee, isAllowed: !isEmployee && hasPermission('payments', 'view') },
    { id: 'reports', label: isEmployee ? 'My Reports' : 'Reports', icon: FileBarChart, isAllowed: hasPermission('reports', 'view') },
    { id: 'reports/project-work', label: 'Project Work Report', icon: FileBarChart, isAllowed: hasPermission('reports', 'view') },
  ];

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
            const isActive = currentPage === item.id;
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
