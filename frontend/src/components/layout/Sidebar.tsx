import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  FolderKanban,
  Sliders,
  FileBarChart,
  Layers,
  Package,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  HelpCircle,
  Users,
  Rocket,
  CalendarCheck,
  TrendingUp,
  Scale,
  Calculator,
  FileSpreadsheet,
  Briefcase,
  Coins,
  Percent,
  Ruler
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose, isCollapsed = false }) => {
  const { user, hasPermission } = useAuth();
  const isEmployee = user?.role_name === 'Employee';
  const isAdminOrManager =
    user?.role_name === 'Admin' ||
    user?.role_name === 'Super Admin' ||
    user?.role_name === 'Manager';

  const handleNav = (page: string) => {
    onNavigate(page);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isMasterSubActive = (page: string) => page === 'masters' || page.startsWith('masters');
  const isReportsSubActive = (page: string) => page.startsWith('reports');
  const isProjectSubActive = (page: string) => page.startsWith('project') || page === 'projects' || page.startsWith('projects/');

  const getActiveMasterTabSlug = (page: string): string => {
    if (!page.startsWith('masters')) return '';
    const parts = page.split('?');
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      if (params.has('tab')) return params.get('tab') || '';
    }
    if (parts[0].includes('/')) {
      return parts[0].split('/')[1] || '';
    }
    return '';
  };

  const currentMasterTabSlug = getActiveMasterTabSlug(currentPage);

  const [isProjectExpanded, setIsProjectExpanded] = useState(() => isProjectSubActive(currentPage));
  const [isReportsExpanded, setIsReportsExpanded] = useState(() => isReportsSubActive(currentPage));
  const [isMasterExpanded, setIsMasterExpanded] = useState(() => isMasterSubActive(currentPage));

  useEffect(() => {
    if (isProjectSubActive(currentPage)) setIsProjectExpanded(true);
    if (isReportsSubActive(currentPage)) setIsReportsExpanded(true);
    if (isMasterSubActive(currentPage)) setIsMasterExpanded(true);
  }, [currentPage]);

  // Master Submenu Items
  const masterSubmenu = [
    {
      id: 'masters',
      tabSlug: '',
      label: 'Master Management',
      icon: Sliders,
    },
    {
      id: 'masters?tab=project-types',
      tabSlug: 'project-types',
      label: 'Project Types',
      icon: FolderKanban,
    },
    {
      id: 'masters?tab=wbs-templates',
      tabSlug: 'wbs-templates',
      label: 'WBS Templates',
      icon: Layers,
    },
    {
      id: 'masters?tab=terms',
      tabSlug: 'terms',
      label: 'Terms & Conditions',
      icon: FileText,
    },
    {
      id: 'masters?tab=materials',
      tabSlug: 'materials',
      label: 'Materials',
      icon: Package,
    },
    {
      id: 'masters?tab=employees',
      tabSlug: 'employees',
      label: 'Employees',
      icon: Users,
    },
    {
      id: 'masters?tab=labour',
      tabSlug: 'labour',
      label: 'Labour / Contractor',
      icon: Briefcase,
    },
    {
      id: 'masters?tab=units',
      tabSlug: 'units',
      label: 'Units & Disciplines',
      icon: Ruler,
    },
    {
      id: 'masters?tab=communities',
      tabSlug: 'communities',
      label: 'Communities',
      icon: Building2,
    },
    {
      id: 'masters?tab=currency',
      tabSlug: 'currency',
      label: 'Currency',
      icon: Coins,
    },
    {
      id: 'masters?tab=taxes',
      tabSlug: 'taxes',
      label: 'Taxes',
      icon: Percent,
    },
    {
      id: 'masters?tab=calendars',
      tabSlug: 'calendars',
      label: 'Calendars & Holidays',
      icon: CalendarCheck,
    },
  ];

  // Project Submenu Items (The ONLY child is Project Workspace)
  const projectSubmenu = [
    {
      id: 'project/workspace',
      label: 'Project Workspace',
      icon: FolderKanban,
      isAllowed: !isEmployee && (hasPermission('projects', 'view') || isAdminOrManager),
      isActive: isProjectSubActive(currentPage),
    },
  ];

  // Reports Submenu Items (Complete Reports List)
  const reportsSubmenu = [
    {
      id: 'reports',
      label: 'All Reports Hub',
      icon: FileBarChart,
      isAllowed: hasPermission('reports', 'view') || isAdminOrManager || isEmployee,
      isActive: currentPage === 'reports',
    },
    {
      id: 'reports/project-work',
      label: 'Project Work Report',
      icon: Briefcase,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/project-work',
    },
    {
      id: 'reports/project-profit-loss',
      label: 'Project P&L Report',
      icon: TrendingUp,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/project-profit-loss',
    },
    {
      id: 'reports/planned-vs-actual',
      label: 'Planned vs Actual',
      icon: Scale,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/planned-vs-actual',
    },
    {
      id: 'reports/attendance',
      label: 'Attendance Report',
      icon: CalendarCheck,
      isAllowed: hasPermission('reports', 'view') || isAdminOrManager || isEmployee,
      isActive: currentPage === 'reports/attendance',
    },
    {
      id: 'reports/cost',
      label: 'Cost & Budget Report',
      icon: Calculator,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/cost',
    },
    {
      id: 'reports/labour-employee',
      label: 'Labour & Employee Work',
      icon: Users,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/labour-employee',
    },
    {
      id: 'reports/quotation',
      label: 'Quotation Report',
      icon: FileText,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/quotation',
    },
    {
      id: 'reports/wbs',
      label: 'WBS & Discipline Report',
      icon: Layers,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/wbs',
    },

    {
      id: 'reports/invoice',
      label: 'Monthly Invoices Report',
      icon: FileSpreadsheet,
      isAllowed: !isEmployee && (hasPermission('reports', 'view') || isAdminOrManager),
      isActive: currentPage === 'reports/invoice',
    },
  ];

  const filteredProjectSubmenu = projectSubmenu.filter(i => i.isAllowed);
  const filteredReportsSubmenu = reportsSubmenu.filter(i => i.isAllowed);

  const renderButton = (
    id: string,
    label: string,
    Icon: any,
    isActive: boolean,
    isAllowed: boolean = true
  ) => {
    if (!isAllowed) return null;
    return (
      <button
        onClick={() => handleNav(id)}
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
          textAlign: 'left',
          minWidth: 0,
        }}
        title={label}
      >
        <Icon size={19} color={isActive ? '#ffffff' : 'currentColor'} style={{ flexShrink: 0 }} />
        {!isCollapsed && (
          <span
            style={{
              flex: 1,
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        width: isCollapsed ? '80px' : '265px',
        minWidth: isCollapsed ? '80px' : '265px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
      }}
    >
      {/* Brand Logo & Header */}
      <div
        style={{
          padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1.25rem 1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', justifyContent: 'center', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                PMS ERP
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                GPS & Workforce
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            className="sidebar-close-btn hamburger-btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '0.75rem 0' : '0.75rem 0.85rem' }}>
        
        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.5rem 0.5rem 0.4rem 0.5rem', fontWeight: 700, textAlign: 'left' }}>
            MAIN MENU
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {renderButton('dashboard', 'Dashboard', LayoutDashboard, currentPage === 'dashboard')}
          {renderButton('customers', 'Customer', Building2, currentPage === 'customers', !isEmployee)}
          {renderButton('quotations', 'Quotation', FileText, currentPage === 'quotations' || currentPage.startsWith('quotations/'), !isEmployee && (hasPermission('quotations', 'view') || isAdminOrManager))}
          {renderButton('planning/workspace', 'Planning', CalendarCheck, currentPage.startsWith('planning'), !isEmployee && (hasPermission('projects', 'view') || isAdminOrManager))}
          
          {/* Project Menu (Accordion) */}
          {!isEmployee && (hasPermission('projects', 'view') || isAdminOrManager) && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isCollapsed ? 'center' : 'stretch' }}>
              <button
                onClick={() => {
                  if (isCollapsed) handleNav('project/workspace');
                  else setIsProjectExpanded(!isProjectExpanded);
                }}
                style={{
                  width: isCollapsed ? 'auto' : '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '0.65rem 1rem' : '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isProjectSubActive(currentPage) ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                  color: isProjectSubActive(currentPage) ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: isProjectSubActive(currentPage) ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: 0,
                  transition: 'all 0.15s ease',
                }}
                title={isCollapsed ? 'Project' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '0.85rem', minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <FolderKanban size={19} color={isProjectSubActive(currentPage) ? '#818cf8' : 'currentColor'} style={{ flexShrink: 0 }} />
                  {!isCollapsed && (
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      Project
                    </span>
                  )}
                </div>
                {!isCollapsed && (isProjectExpanded ? <ChevronUp size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />)}
              </button>

              {!isCollapsed && isProjectExpanded && (
                <div style={{ padding: '0.2rem 0 0.35rem 0.5rem', margin: '0.15rem 0 0.35rem 0.75rem', borderLeft: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {filteredProjectSubmenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleNav(subItem.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: subItem.isActive ? '#4f46e5' : 'transparent',
                        color: subItem.isActive ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: subItem.isActive ? 600 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        minWidth: 0,
                        boxShadow: subItem.isActive ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title={subItem.label}
                    >
                      <subItem.icon size={15} color={subItem.isActive ? '#ffffff' : 'currentColor'} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {subItem.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Master Menu (Accordion) */}
          {!isEmployee && (hasPermission('masters', 'manage') || isAdminOrManager) && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isCollapsed ? 'center' : 'stretch' }}>
              <button
                onClick={() => {
                  if (isCollapsed) handleNav('masters');
                  else setIsMasterExpanded(!isMasterExpanded);
                }}
                style={{
                  width: isCollapsed ? 'auto' : '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '0.65rem 1rem' : '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isMasterSubActive(currentPage) ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                  color: isMasterSubActive(currentPage) ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: isMasterSubActive(currentPage) ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: 0,
                  transition: 'all 0.15s ease',
                }}
                title={isCollapsed ? 'Master' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '0.85rem', minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <Sliders size={19} color={isMasterSubActive(currentPage) ? '#818cf8' : 'currentColor'} style={{ flexShrink: 0 }} />
                  {!isCollapsed && (
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      Master
                    </span>
                  )}
                </div>
                {!isCollapsed && (isMasterExpanded ? <ChevronUp size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />)}
              </button>

              {!isCollapsed && isMasterExpanded && (
                <div style={{ padding: '0.2rem 0 0.35rem 0.5rem', margin: '0.15rem 0 0.35rem 0.75rem', borderLeft: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {masterSubmenu.map((subItem) => {
                    const isSubActive = isMasterSubActive(currentPage) && (
                      subItem.tabSlug
                        ? currentMasterTabSlug === subItem.tabSlug
                        : (!currentMasterTabSlug || currentMasterTabSlug === 'project-types')
                    );
                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => handleNav(subItem.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: isSubActive ? '#4f46e5' : 'transparent',
                          color: isSubActive ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: isSubActive ? 600 : 500,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          minWidth: 0,
                          boxShadow: isSubActive ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                        title={subItem.label}
                      >
                        <SubIcon size={15} color={isSubActive ? '#ffffff' : 'currentColor'} style={{ flexShrink: 0 }} />
                        <span
                          style={{
                            flex: 1,
                            textAlign: 'left',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3,
                          }}
                        >
                          {subItem.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reports Menu (Accordion) */}
          {filteredReportsSubmenu.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isCollapsed ? 'center' : 'stretch' }}>
              <button
                onClick={() => {
                  if (isCollapsed) handleNav(filteredReportsSubmenu[0].id);
                  else setIsReportsExpanded(!isReportsExpanded);
                }}
                style={{
                  width: isCollapsed ? 'auto' : '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '0.65rem 1rem' : '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isReportsSubActive(currentPage) ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                  color: isReportsSubActive(currentPage) ? '#818cf8' : 'var(--text-secondary)',
                  fontWeight: isReportsSubActive(currentPage) ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: 0,
                  transition: 'all 0.15s ease',
                }}
                title={isCollapsed ? 'Reports' : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '0.85rem', minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <FileBarChart size={19} color={isReportsSubActive(currentPage) ? '#818cf8' : 'currentColor'} style={{ flexShrink: 0 }} />
                  {!isCollapsed && (
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      Reports
                    </span>
                  )}
                </div>
                {!isCollapsed && (isReportsExpanded ? <ChevronUp size={16} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} style={{ flexShrink: 0 }} />)}
              </button>

              {!isCollapsed && isReportsExpanded && (
                <div style={{ padding: '0.2rem 0 0.35rem 0.5rem', margin: '0.15rem 0 0.35rem 0.75rem', borderLeft: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {filteredReportsSubmenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleNav(subItem.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: subItem.isActive ? '#4f46e5' : 'transparent',
                        color: subItem.isActive ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: subItem.isActive ? 600 : 500,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        minWidth: 0,
                        transition: 'all 0.15s ease',
                      }}
                      title={subItem.label}
                    >
                      <subItem.icon size={15} color={subItem.isActive ? '#ffffff' : 'currentColor'} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {subItem.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '1.25rem 0.5rem 1rem 0.5rem' }}></div>

        {!isCollapsed && (
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.5rem 0.4rem 0.5rem', fontWeight: 700, textAlign: 'left' }}>
            OTHER
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          {renderButton('settings', 'Settings', Settings, currentPage === 'settings')}
          {renderButton('support', 'Support', HelpCircle, currentPage === 'support')}
        </nav>
      </div>

      {/* Bottom Brand Card */}
      {!isCollapsed && (
        <div style={{
          margin: '0.5rem 0.85rem 1rem 0.85rem',
          padding: '0.75rem 0.85rem',
          borderRadius: '12px',
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
          minWidth: 0,
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(79, 70, 229, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            flexShrink: 0
          }}>
            <Rocket size={16} />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'left' }}>
              PMS Construction
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'left' }}>
              Building the future
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
