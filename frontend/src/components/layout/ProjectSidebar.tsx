import React, { useState } from 'react';
import { 
  FolderKanban, MapPin, Building2, Layers, Clock, ShieldCheck, 
  Receipt, IndianRupee, FileText, Download, User, Phone, Mail, ChevronLeft,
  Users, Package, History, ChevronRight, Menu, X
} from 'lucide-react';

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBackToProjects: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ activeTab, onTabChange, onBackToProjects }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderKanban },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'wbs', label: 'WBS', icon: Layers },
    { id: 'tasks', label: 'Tasks', icon: Clock },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'labours', label: 'Labour', icon: ShieldCheck },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'timesheets', label: 'Work Logs', icon: Clock },
    { id: 'attendance', label: 'Attendance', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'quotations', label: 'Quotation', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const renderButton = (id: string, label: string, Icon: any, isActive: boolean) => {
    return (
      <button
        key={id}
        onClick={() => {
          onTabChange(id);
          setIsMobileOpen(false);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? '0' : '0.85rem',
          padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
          borderRadius: '10px',
          border: 'none',
          background: isActive ? '#4f46e5' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-secondary)',
          fontWeight: isActive ? 600 : 500,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginBottom: '4px',
        }}
        title={isCollapsed ? label : undefined}
      >
        <Icon size={19} color={isActive ? '#ffffff' : 'currentColor'} />
        {!isCollapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Drawer Toggle */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        style={{
          display: 'none', // Controlled by media query in actual implementation or CSS, but let's just make it a floating button on mobile
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          zIndex: 40,
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
        }}
        className="mobile-project-sidebar-toggle"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 45
          }}
          className="mobile-project-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`project-sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          width: isCollapsed ? '80px' : '240px',
          minWidth: isCollapsed ? '80px' : '240px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          overflowY: 'auto'
        }}
      >
        <div style={{
          padding: isCollapsed ? '1rem' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {!isCollapsed && (
            <button
              onClick={onBackToProjects}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: 0
              }}
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {isCollapsed && (
            <button onClick={onBackToProjects} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }} title="Back to Projects">
              <ChevronLeft size={20} />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="desktop-collapse-btn"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
          
          <button
            onClick={() => setIsMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, padding: isCollapsed ? '0.75rem 0.5rem' : '1rem 0.85rem' }}>
          {tabs.map(tab => renderButton(tab.id, tab.label, tab.icon, activeTab === tab.id))}
        </div>
      </aside>

      <style>{`
        .desktop-collapse-btn { display: block; }
        .mobile-close-btn { display: none; }
        .mobile-project-sidebar-toggle { display: none; }
        
        @media (max-width: 1024px) {
          .project-sidebar {
            position: fixed;
            top: 0;
            bottom: 0;
            left: -100%;
            height: 100vh;
            width: 260px !important;
            min-width: 260px !important;
          }
          .project-sidebar.open {
            left: 0;
          }
          .desktop-collapse-btn { display: none !important; }
          .mobile-close-btn { display: block !important; }
          .mobile-project-sidebar-toggle { display: flex !important; align-items: center; justify-content: center; }
        }
      `}</style>
    </>
  );
};
