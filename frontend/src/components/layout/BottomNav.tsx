import React, { useState } from 'react';
import { Home, Users, CheckSquare, MapPin, MoreHorizontal, FolderKanban, Clock, IndianRupee, FileBarChart, X, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const { hasPermission, user } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const isEmployee = user?.role_name === 'Employee';

  const primaryNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home, isAllowed: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, isAllowed: hasPermission('tasks', 'view') },
    { id: 'attendance', label: 'Attendance', icon: MapPin, isAllowed: hasPermission('attendance', 'view') },
    { id: 'projects', label: 'Projects', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
    { id: '__more__', label: 'More', icon: MoreHorizontal, isAllowed: true },
  ];

  const moreItems = [
    { id: 'employees', label: 'Employees', icon: Users, isAllowed: !isEmployee && hasPermission('employees', 'view') },
    { id: 'labours', label: 'Labours', icon: UserCheck, isAllowed: !isEmployee && hasPermission('labours', 'view') },
    { id: 'timesheets', label: 'Timesheets', icon: Clock, isAllowed: hasPermission('timesheets', 'view') },
    { id: 'payments', label: 'Payments', icon: IndianRupee, isAllowed: !isEmployee && hasPermission('payments', 'view') },
    { id: 'reports', label: 'Reports', icon: FileBarChart, isAllowed: hasPermission('reports', 'view') },
    { id: 'projects/manage-work', label: 'Proj. Work', icon: FolderKanban, isAllowed: !isEmployee && hasPermission('projects', 'view') },
  ].filter(i => i.isAllowed);

  const visiblePrimary = primaryNavItems.filter((item) => item.isAllowed);

  const handleNavClick = (id: string) => {
    if (id === '__more__') {
      setShowMore(prev => !prev);
    } else {
      setShowMore(false);
      onNavigate(id);
    }
  };

  return (
    <>
      {/* More Drawer */}
      {showMore && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowMore(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: '65px',
            left: 0,
            right: 0,
            zIndex: 39,
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            padding: '1.25rem 1rem 0.75rem',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>More Options</span>
              <button onClick={() => setShowMore(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', paddingBottom: '0.5rem' }}>
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setShowMore(false); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.85rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: isActive ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.72rem',
                    }}
                  >
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav className="bottom-nav-bar">
        {visiblePrimary.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === '__more__' ? showMore : currentPage === item.id;

          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
