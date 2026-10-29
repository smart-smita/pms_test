import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Briefcase,
  TrendingUp,
  Scale,
  Wallet,
  Receipt,
  Wrench,
  Users,
  CalendarCheck,
  Package,
} from 'lucide-react';
import { ProjectWorkReport } from './ProjectWorkReport';
import { ProjectProfitLossReport } from './ProjectProfitLossReport';
import { PlannedVsActualReport } from './PlannedVsActualReport';
import { CollectionsVsSpendingReport } from './CollectionsVsSpendingReport';
import { InvoiceAgingReport } from './InvoiceAgingReport';
import { EquipmentUtilizationReport } from './EquipmentUtilizationReport';
import { Reports as AttendanceReports } from './Reports';
import { useWorkCategory } from '../context/WorkCategoryContext';

export interface ReportsHubProps {
  initialTab?: string;
  initialReport?: string;
  onNavigate?: (page: string) => void;
}

export const ReportsHub: React.FC<ReportsHubProps> = ({
  initialTab,
  initialReport,
  onNavigate,
}) => {
  const { isLabourEnabled, isMaterialEnabled } = useWorkCategory();

  // Determine initial active tab
  const getStartingTab = () => {
    if (initialTab) return initialTab;
    if (initialReport) {
      if (initialReport === 'project-profit-loss' || initialReport === 'profit-loss') return 'profit-loss';
      if (initialReport === 'planned-vs-actual') return 'planned-vs-actual';
      if (initialReport === 'collections-spending' || initialReport === 'cost') return 'collections-spending';
      if (initialReport === 'invoice-aging' || initialReport === 'invoice') return 'invoice-aging';
      if (initialReport === 'equipment') return 'equipment';
      if (initialReport === 'attendance' || initialReport.startsWith('emp-') || initialReport.startsWith('lab-')) return 'attendance';
      return 'project-work';
    }
    return 'project-work';
  };

  const [activeTab, setActiveTab] = useState<string>(getStartingTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    {
      id: 'project-work',
      label: 'Work & Progress',
      icon: Briefcase,
      description: 'Tasks, employee allocation & hours',
    },
    {
      id: 'profit-loss',
      label: 'Financial P&L',
      icon: TrendingUp,
      description: 'Revenue, recognized cost & margins',
    },
    {
      id: 'planned-vs-actual',
      label: 'Planned vs Actual',
      icon: Scale,
      description: 'Budget execution & cost variance',
    },
    {
      id: 'collections-spending',
      label: 'Collections vs Spending',
      icon: Wallet,
      description: 'Verified receipts vs disbursements',
    },
    {
      id: 'invoice-aging',
      label: 'Invoice Aging',
      icon: Receipt,
      description: 'Receivables aging brackets',
    },
    {
      id: 'equipment',
      label: 'Equipment Fleet',
      icon: Wrench,
      description: 'Owned vs rented machinery',
    },
    ...(isLabourEnabled
      ? [
          {
            id: 'attendance',
            label: 'Staff Attendance',
            icon: CalendarCheck,
            description: 'Employee & labour attendance matrix',
          },
        ]
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Reports Navigation Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.6rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRight: '1px solid var(--border-color)',
            marginRight: '0.25rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          <FileBarChart2 size={18} style={{ color: '#6366f1' }} />
          <span>Reports Hub</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 'max-content' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Report View Container */}
      <div style={{ width: '100%' }}>
        {activeTab === 'project-work' && <ProjectWorkReport />}
        {activeTab === 'profit-loss' && <ProjectProfitLossReport />}
        {activeTab === 'planned-vs-actual' && <PlannedVsActualReport />}
        {activeTab === 'collections-spending' && <CollectionsVsSpendingReport />}
        {activeTab === 'invoice-aging' && <InvoiceAgingReport />}
        {activeTab === 'equipment' && <EquipmentUtilizationReport />}
        {activeTab === 'attendance' && (
          <AttendanceReports initialReport={initialReport || 'emp-attendance-1'} />
        )}
      </div>
    </div>
  );
};
