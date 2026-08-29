import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FolderKanban, CheckSquare, MapPin, IndianRupee, FileBarChart, X, Bell, Settings, HelpCircle, Rocket, User, LogOut } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { hasPermission, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isAllowed: true }, // Everyone sees Dashboard
    { id: 'employees', label: 'Employees', icon: Users, isAllowed: hasPermission('employees', 'view') },
    { id: 'projects', label: 'Projects', icon: FolderKanban, isAllowed: hasPermission('projects', 'view') },
    { id: 'tasks', label: 'Task Management', icon: CheckSquare, isAllowed: hasPermission('tasks', 'view') },
    { id: 'attendance', label: 'GPS Attendance', icon: MapPin, isAllowed: hasPermission('attendance', 'view') },
    { id: 'payments', label: 'Hour Payments', icon: IndianRupee, isAllowed: hasPermission('payments', 'view') },
    { id: 'reports', label: 'Reports', icon: FileBarChart, isAllowed: hasPermission('reports', 'view') },
  ];

  const filteredMenu = menuItems.filter((item) => item.isAllowed);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', width: '280px', transition: 'transform 0.3s' }}>
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
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              GPS & Workforce
            </div>
          </div>
        </div>
        <button 
          className="hamburger-btn" 
          onClick={onClose}
          style={{ display: window.innerWidth <= 1024 ? 'block' : 'none', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
        
        {/* Main Menu */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', padding: '1rem 0.5rem 0.5rem 0.5rem' }}>
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
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} color={isActive ? '#ffffff' : '#cbd5e1'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ height: '1px', background: 'rgba(150,150,150,0.1)', margin: '1.5rem 0.5rem' }}></div>

        {/* Other Menu */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', padding: '0 0.5rem 0.5rem 0.5rem' }}>
          OTHER
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Bell size={20} color="#cbd5e1" />
              <span>Notifications</span>
            </div>
            <span style={{ background: '#6366f1', color: '#fff', fontSize: '0.7rem', fontWeight: 700, width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</span>
          </button>
          
          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <Settings size={20} color="#cbd5e1" />
            <span>Settings</span>
          </button>

          <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left' }}>
            <HelpCircle size={20} color="#cbd5e1" />
            <span>Help & Support</span>
          </button>
        </nav>
      </div>

      {/* System Footer / Profile Trigger */}
      <div style={{ padding: '1.5rem 1rem', position: 'relative' }}>
        
        {/* Profile Popover */}
        {showProfileMenu && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% - 1rem)',
            left: '1rem',
            right: '1rem',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <button 
              onClick={() => { setShowProfileMenu(false); alert('Profile clicked! (Placeholder for profile view)'); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: '#f8fafc', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={18} /> My Profile
            </button>
            <button 
              onClick={() => { setShowProfileMenu(false); logout(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}

        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '16px', 
            padding: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
        >
          <div style={{ width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Rocket size={20} color="#0f172a" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>HTCO Construction</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Building the future</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
