import React, { useRef, useEffect, useState } from 'react';
import { 
  Home, Layers, CheckSquare, Package, MapPin, Clock, 
  Users, BarChart2, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

export interface WorkspaceTabItem {
  id: string;
  label: string;
  icon: any;
  badgeCount?: number;
}

interface WorkspaceTabsProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  hasSelectedProject: boolean;
}

// All 10 tabs directly visible in the scrollable tabs header
export const ALL_WORKSPACE_TABS: WorkspaceTabItem[] = [
  { id: 'list', label: 'Project List', icon: Home },
  { id: 'manage-work', label: 'Manage Project Work', icon: Layers },
  { id: 'tasks', label: 'Task Management', icon: CheckSquare },
  { id: 'materials', label: 'Material Management', icon: Package },
  { id: 'site-surveys', label: 'Site Survey', icon: MapPin },
  { id: 'timesheets', label: 'Timesheets', icon: Clock },
  { id: 'attendance', label: 'GPS Attendance', icon: MapPin },
  { id: 'labour-work', label: 'Labour / Employee Work', icon: Users },
  { id: 'gantt', label: 'Gantt Chart', icon: BarChart2 },
  { id: 'invoices', label: 'Monthly Invoices', icon: FileText },
];

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeTab,
  onSelectTab,
  hasSelectedProject,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
    // Small timeout to re-check scroll bounds after scroll animation completes
    const timer = setTimeout(checkScrollability, 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const distance = 260;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
      }}
    >
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          style={{
            position: 'absolute',
            left: '0.25rem',
            zIndex: 10,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Scrollable Tabs Track */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0 1rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          width: '100%',
          minWidth: 0,
        }}
      >
        {ALL_WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              onClick={() => onSelectTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.9rem 1.15rem',
                background: 'transparent',
                border: 'none',
                borderBottom: `2.5px solid ${isActive ? '#4f46e5' : 'transparent'}`,
                color: isActive ? '#4f46e5' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              title={tab.label}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#4f46e5' : 'currentColor'} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: isActive ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {tab.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          style={{
            position: 'absolute',
            right: '0.25rem',
            zIndex: 10,
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};
