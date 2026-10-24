import React, { useState, useEffect } from 'react';
import { useWorkCategory, WorkCategoryType } from '../context/WorkCategoryContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { showSuccess, showError } from '../utils/toast';
import { 
  Package, 
  Users, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  Info,
  Clock,
  ShoppingCart
} from 'lucide-react';

interface ImpactStats {
  target: string;
  laboursCount: number;
  pendingTimesheetsCount: number;
  unpaidLabourPaymentsCount: number;
  materialsCount: number;
  pendingPurchaseOrdersCount: number;
  pendingIndentsCount: number;
}

export const WorkCategorySettings: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';
  const { workCategory, updateWorkCategory, isLoading } = useWorkCategory();

  const [selectedCategory, setSelectedCategory] = useState<WorkCategoryType>(workCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  useEffect(() => {
    setSelectedCategory(workCategory);
  }, [workCategory]);

  const hasUnsavedChanges = selectedCategory !== workCategory;

  const handleCancel = () => {
    setSelectedCategory(workCategory);
  };

  const handleOpenConfirmation = async () => {
    if (!hasUnsavedChanges) return;

    // If changing to a restricted category, fetch impact
    if (selectedCategory !== 'both') {
      setIsLoadingImpact(true);
      try {
        const res = await apiRequest<ImpactStats>(`/settings/work-category/impact?target=${selectedCategory}`);
        if (res.success && res.data) {
          setImpactStats(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch category impact:', err);
      } finally {
        setIsLoadingImpact(false);
      }
    } else {
      setImpactStats(null);
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    const res = await updateWorkCategory(selectedCategory);
    setIsSubmitting(false);
    setIsConfirmModalOpen(false);

    if (res.success) {
      showSuccess(res.message || 'Work category settings updated successfully.');
    } else {
      showError(res.message || 'Failed to update work category settings.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Only users with the <strong>Admin</strong> or <strong>Super Admin</strong> role have permission to configure global work categories.
        </p>
      </div>
    );
  }

  const options = [
    {
      id: 'material' as WorkCategoryType,
      title: 'Materials Only',
      badge: 'Materials Mode',
      badgeColor: '#0284c7',
      icon: Package,
      description: 'Optimized for supply and material handling projects.',
      enabledList: [
        'Material Master & Catalogue',
        'Store & Warehouse Management',
        'Material Indents & PO Approvals',
        'Goods Receipt Notes (GRN)',
        'Material Allocations & Issues',
        'Stock Ledger & Consumables',
        'Procurement & Inventory Reports',
      ],
      disabledList: [
        'Labour Registry & Contractors',
        'Labour Task Allocation',
        'GPS & Timesheet Attendance',
        'Daily Labour Payments',
        'Labour Work Logs & Reports',
      ],
    },
    {
      id: 'labour' as WorkCategoryType,
      title: 'Labour & Contractors Only',
      badge: 'Labour Mode',
      badgeColor: '#8b5cf6',
      icon: Users,
      description: 'Optimized for workforce management, contracting, and labour services.',
      enabledList: [
        'Labour Registry & Contractors',
        'Workforce Planning & Allocation',
        'Daily Timesheets & Work Logs',
        'GPS Live Attendance',
        'Daily Labour Payment Processing',
        'Labour Productivity Reports',
        'Contractor Performance Tracking',
      ],
      disabledList: [
        'Material Master & Stores',
        'Purchase Orders & Requisitions',
        'Goods Receipt Notes (GRN)',
        'Material Allocation & Consumption',
        'Procurement & Stock Reports',
      ],
    },
    {
      id: 'both' as WorkCategoryType,
      title: 'Materials + Labour & Contractors',
      badge: 'Comprehensive Mode (Default)',
      badgeColor: '#10b981',
      icon: Layers,
      description: 'Full PMS ERP suite enabling both material supply and workforce execution.',
      enabledList: [
        'All Material & Store Operations',
        'Purchase Orders, Indents & GRN',
        'Stock Ledger & Material Allocation',
        'All Labour Registry & Contractor Ops',
        'Timesheets, GPS Attendance & Logs',
        'Daily Labour Payments',
        'Unified Costing, Invoicing & Reports',
      ],
      disabledList: [],
    },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '1.5rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#4f46e5', letterSpacing: '0.05em' }}>
                Settings → Project Configuration
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Global Work Category Settings
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.4rem 0 0 0', maxWidth: '750px', lineHeight: 1.5 }}>
              Configure which work disciplines are enabled across PMS ERP. This configuration centrally controls navigation menus, quotation calculations, task allocations, project costing, and invoice generation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges || isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={16} /> Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleOpenConfirmation}
              disabled={!hasUnsavedChanges || isSubmitting || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={16} /> Save Changes
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--text-primary)',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={17} color="#eab308" style={{ flexShrink: 0 }} />
            <span>You have unsaved changes. Click <strong>Save Changes</strong> above to apply this configuration to the entire system.</span>
          </div>
        )}
      </div>

      {/* Mode Selection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedCategory === opt.id;
          const isCurrentActive = workCategory === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => setSelectedCategory(opt.id)}
              className="glass-card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                borderRadius: '14px',
                border: isSelected ? '2px solid #4f46e5' : '1px solid var(--border-color)',
                background: isSelected 
                  ? 'rgba(79, 70, 229, 0.05)' 
                  : 'var(--bg-card)',
                boxShadow: isSelected 
                  ? '0 8px 24px rgba(79, 70, 229, 0.18)' 
                  : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: isSelected ? '#4f46e5' : 'var(--bg-secondary)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCurrentActive && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        CURRENT ACTIVE
                      </span>
                    )}
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: isSelected ? '6px solid #4f46e5' : '2px solid var(--border-color)',
                        background: '#ffffff',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
                  {opt.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.45 }}>
                  {opt.description}
                </p>

                {/* Enabled Capabilities */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                    Active Features Included
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {opt.enabledList.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disabled Capabilities */}
                {opt.disabledList.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                      Hidden / Disabled Features
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {opt.disabledList.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>✕</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bottom select indicator */}
              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <span
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: isSelected ? '#4f46e5' : 'var(--bg-secondary)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? '✓ Selected Mode' : 'Click to Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture & Safety Notice */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', background: 'rgba(79, 70, 229, 0.04)', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Data Integrity &amp; Preservation Guarantee:</strong>
            <p style={{ margin: '0.25rem 0 0 0' }}>
              Switching work categories never deletes existing material or labour records. Historical transactions, purchase orders, timesheets, and invoices are strictly preserved in the database for auditing and reporting compliance. Common modules (Customers, Projects, WBS, Tasks, Documents, Invoices) remain continuously accessible in all modes.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation & Impact Warning Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Work Category Reconfiguration"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={24} color="#eab308" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                System-Wide Configuration Change
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                You are updating the active global work category from <strong style={{ textTransform: 'capitalize' }}>{workCategory}</strong> to <strong style={{ textTransform: 'capitalize', color: '#4f46e5' }}>{selectedCategory}</strong>.
              </p>
            </div>
          </div>

          {/* Impact Stats if turning off a category */}
          {selectedCategory === 'material' && impactStats && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} color="#8b5cf6" />
                Labour Data Impact Preview:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <li><strong>{impactStats.laboursCount}</strong> registered labours and contractors will be hidden from new allocations.</li>
                {impactStats.pendingTimesheetsCount > 0 && (
                  <li style={{ color: '#eab308' }}><strong>{impactStats.pendingTimesheetsCount}</strong> pending timesheets will be hidden from active approval queues.</li>
                )}
                {impactStats.unpaidLabourPaymentsCount > 0 && (
                  <li><strong>{impactStats.unpaidLabourPaymentsCount}</strong> labour payment records remain preserved in the ledger.</li>
                )}
              </ul>
            </div>
          )}

          {selectedCategory === 'labour' && impactStats && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingCart size={15} color="#0284c7" />
                Material Data Impact Preview:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <li><strong>{impactStats.materialsCount}</strong> catalogue materials will be hidden from new task consumption.</li>
                {impactStats.pendingPurchaseOrdersCount > 0 && (
                  <li style={{ color: '#eab308' }}><strong>{impactStats.pendingPurchaseOrdersCount}</strong> active/pending Purchase Orders will be paused from active views.</li>
                )}
                {impactStats.pendingIndentsCount > 0 && (
                  <li><strong>{impactStats.pendingIndentsCount}</strong> submitted indents remain securely preserved.</li>
                )}
              </ul>
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Are you sure you want to apply this global configuration? All active user sessions and API endpoints will immediately follow the new category mode.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmSave} disabled={isSubmitting}>
              {isSubmitting ? 'Applying Configuration...' : 'Confirm & Apply'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
