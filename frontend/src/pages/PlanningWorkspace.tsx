import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

// Planning Components
import { PlanningListTab } from '../components/planning/PlanningListTab';
import { PlanningHeader } from '../components/planning/PlanningHeader';
import { PlanningOverviewTab } from '../components/planning/PlanningOverviewTab';
import { PlanningWbsTab } from '../components/planning/PlanningWbsTab';
import { PlanningTasksTab } from '../components/planning/PlanningTasksTab';
import { PlanningDependenciesTab } from '../components/planning/PlanningDependenciesTab';
import { PlanningLabourTab } from '../components/planning/PlanningLabourTab';
import { PlanningMaterialsTab } from '../components/planning/PlanningMaterialsTab';
import { PlanningTermsTab } from '../components/planning/PlanningTermsTab';
import { PlanningCalendarTab } from '../components/planning/PlanningCalendarTab';
import { PlanningGanttTab } from '../components/planning/PlanningGanttTab';
import { PlanningRevisionsTab } from '../components/planning/PlanningRevisionsTab';
import { PlanningValidationModal } from '../components/planning/PlanningValidationModal';
import { PlanningQuotationDiffModal } from '../components/planning/PlanningQuotationDiffModal';

interface PlanningWorkspaceProps {
  planningId?: number;
  initialTab?: string;
  onNavigate: (page: string) => void;
}

export const PlanningWorkspace: React.FC<PlanningWorkspaceProps> = ({
  planningId: propPlanningId,
  initialTab = 'overview',
  onNavigate,
}) => {
  const { user } = useAuth();
  const isAdminOrManager =
    user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [selectedPlanningId, setSelectedPlanningId] = useState<number | null>(propPlanningId || null);
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'overview');
  const [planningData, setPlanningData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Validation Modal State
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Quotation Diff Modal State
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isApplyingDiff, setIsApplyingDiff] = useState(false);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (propPlanningId && propPlanningId !== selectedPlanningId) {
      setSelectedPlanningId(propPlanningId);
    }
  }, [propPlanningId]);

  useEffect(() => {
    if (selectedPlanningId) {
      fetchPlanningRecord(selectedPlanningId);
    } else {
      setPlanningData(null);
    }
  }, [selectedPlanningId]);

  const fetchPlanningRecord = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>(`/planning/${id}`);
      if (res.success && res.data) {
        setPlanningData(res.data);
      } else {
        showError(res.message || 'Failed to load planning record');
      }
    } catch (e: any) {
      showError('Failed to load planning data');
    }
    setIsLoading(false);
  };

  const handleSelectPlanning = (id: number) => {
    setSelectedPlanningId(id);
    setActiveTab('overview');
    onNavigate(`planning/workspace/${id}/overview`);
  };

  const handleBackToList = () => {
    setSelectedPlanningId(null);
    setPlanningData(null);
    onNavigate('planning/workspace');
  };

  // ── SAVE DRAFT ──────────────────────────────────────────────────
  const handleSaveDraft = async (dataOverride?: any) => {
    if (!selectedPlanningId || !planningData) return;
    if (planningData.status === 'approved') {
      showError('Approved planning cannot be edited directly.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = dataOverride || planningData;
      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/save-draft`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setPlanningData(res.data);
        showSuccess('Planning draft saved successfully');
      } else {
        showError(res.message || 'Failed to save planning draft');
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred while saving');
    }
    setIsSaving(false);
  };

  // ── RECALCULATE SCHEDULE ─────────────────────────────────────────
  const handleRecalculateSchedule = async () => {
    if (!selectedPlanningId) return;
    setIsSaving(true);
    try {
      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/calculate`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setPlanningData(res.data);
        showSuccess('Working days & dependencies schedule recalculated successfully!');
      } else {
        showError(res.message || 'Calculation failed');
      }
    } catch (e: any) {
      showError(e.message || 'Calculation failed');
    }
    setIsSaving(false);
  };

  // ── VALIDATE ─────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!selectedPlanningId) return;
    try {
      await handleSaveDraft();

      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/validate`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setValidationResult(res.data);
        setIsValidationModalOpen(true);
      }
    } catch (e: any) {
      showError('Validation check failed');
    }
  };

  // ── SUBMIT PLANNING ──────────────────────────────────────────────
  const handleSubmitPlanning = async () => {
    if (!selectedPlanningId) return;
    setIsSaving(true);
    try {
      // Auto-save first so the backend validates the latest edited data
      await handleSaveDraft();

      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/submit`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setPlanningData(res.data);
        setIsValidationModalOpen(false);
        showSuccess('Planning submitted for review successfully!');
      } else {
        showError(res.message || 'Submission failed');
      }
    } catch (e: any) {
      showError(e.message || 'Submission failed');
    }
    setIsSaving(false);
  };

  // ── APPROVE PLANNING (CREATES / UPDATES PROJECT) ──────────────────
  const handleApprovePlanning = async () => {
    if (!selectedPlanningId) return;
    if (!confirm('Are you sure you want to approve this plan? This will finalize dates and create or update the Project execution records.')) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiRequest<{ project_id: number; action: string }>(
        `/planning/${selectedPlanningId}/approve`,
        { method: 'POST' }
      );

      if (res.success && res.data) {
        showSuccess(
          res.data.action === 'created'
            ? 'Plan approved! New Project created automatically.'
            : 'Plan approved! Existing Project updated with approved schedule.'
        );
        fetchPlanningRecord(selectedPlanningId);
        // Navigate to project workspace
        onNavigate(`project/workspace/${res.data.project_id}/manage-work`);
      } else {
        showError(res.message || 'Approval failed');
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred during approval');
    }
    setIsSaving(false);
  };

  // ── REJECT PLANNING ──────────────────────────────────────────────
  const handleRejectPlanning = async () => {
    if (!selectedPlanningId || !rejectionReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
      });

      if (res.success && res.data) {
        setPlanningData(res.data);
        setIsRejectModalOpen(false);
        setRejectionReason('');
        showSuccess('Planning rejected');
      } else {
        showError(res.message || 'Rejection failed');
      }
    } catch (e: any) {
      showError('Failed to reject planning');
    }
    setIsSaving(false);
  };

  // ── APPLY QUOTATION CHANGES ───────────────────────────────────────
  const handleApplyQuotationChanges = async () => {
    if (!selectedPlanningId) return;
    setIsApplyingDiff(true);
    try {
      const res = await apiRequest<any>(`/planning/${selectedPlanningId}/apply-quotation-changes`, {
        method: 'POST',
      });

      if (res.success && res.data) {
        setPlanningData(res.data);
        setIsDiffModalOpen(false);
        showSuccess('Quotation changes synchronized into planning draft!');
      } else {
        showError(res.message || 'Failed to apply quotation changes');
      }
    } catch (e: any) {
      showError('Failed to apply quotation changes');
    }
    setIsApplyingDiff(false);
  };

  // Local State Update Handlers
  const handleUpdateWbsList = (updatedWbs: any[]) => {
    const updated = { ...planningData, wbs: updatedWbs };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  const handleUpdateTasksList = (updatedTasks: any[]) => {
    const updated = { ...planningData, tasks: updatedTasks };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  const handleUpdateDependencies = (updatedDeps: any[]) => {
    const updated = { ...planningData, dependencies: updatedDeps };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  const handleUpdateLabourList = (updatedLabour: any[]) => {
    const updated = { ...planningData, labour: updatedLabour };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  const handleUpdateMaterialsList = (updatedMaterials: any[]) => {
    const updated = { ...planningData, materials: updatedMaterials };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  const handleUpdateTermsList = (updatedTerms: any[]) => {
    const updated = { ...planningData, terms_snapshots: updatedTerms };
    setPlanningData(updated);
    handleSaveDraft(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '3rem' }}>
      {selectedPlanningId ? (
        <>
          {isLoading || !planningData ? (
            <div style={{ padding: '4rem' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <PlanningHeader
                planning={planningData}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onBack={handleBackToList}
                onSaveDraft={() => handleSaveDraft()}
                onRecalculate={handleRecalculateSchedule}
                onValidate={handleValidate}
                onSubmit={handleSubmitPlanning}
                onApprove={handleApprovePlanning}
                onReject={() => setIsRejectModalOpen(true)}
                onOpenDiffModal={() => setIsDiffModalOpen(true)}
                isSaving={isSaving}
                isAdminOrManager={isAdminOrManager}
              />

              {/* Active Tab Content */}
              <div style={{ flex: 1 }}>
                {activeTab === 'overview' && (
                  <PlanningOverviewTab planning={planningData} onNavigateTab={setActiveTab} />
                )}
                {activeTab === 'wbs' && (
                  <PlanningWbsTab
                    planning={planningData}
                    onUpdateWbsList={handleUpdateWbsList}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'tasks' && (
                  <PlanningTasksTab
                    planning={planningData}
                    onUpdateTasksList={handleUpdateTasksList}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'dependencies' && (
                  <PlanningDependenciesTab
                    planning={planningData}
                    onUpdateDependencies={handleUpdateDependencies}
                    onRecalculateSchedule={handleRecalculateSchedule}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'labour' && (
                  <PlanningLabourTab
                    planning={planningData}
                    onUpdateLabourList={handleUpdateLabourList}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'materials' && (
                  <PlanningMaterialsTab
                    planning={planningData}
                    onUpdateMaterialsList={handleUpdateMaterialsList}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'terms' && (
                  <PlanningTermsTab
                    planning={planningData}
                    onUpdateTermsList={handleUpdateTermsList}
                    isReadOnly={planningData.status === 'approved'}
                  />
                )}
                {activeTab === 'calendar' && <PlanningCalendarTab planning={planningData} />}
                {activeTab === 'gantt' && <PlanningGanttTab planning={planningData} />}
                {activeTab === 'revisions' && <PlanningRevisionsTab planning={planningData} />}
              </div>

              {/* Validation Modal */}
              <PlanningValidationModal
                isOpen={isValidationModalOpen}
                onClose={() => setIsValidationModalOpen(false)}
                validationResult={validationResult}
                onNavigateTab={setActiveTab}
                onSubmitPlanning={handleSubmitPlanning}
              />

              {/* Quotation Diff Modal */}
              <PlanningQuotationDiffModal
                isOpen={isDiffModalOpen}
                onClose={() => setIsDiffModalOpen(false)}
                diffs={planningData.quotation_changes?.diffs || []}
                onApplyChanges={handleApplyQuotationChanges}
                isApplying={isApplyingDiff}
              />

              {/* Reject Planning Modal */}
              <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Reject Planning Draft"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Please provide constructive feedback or reasons for rejecting this planning draft so the planner can revise and resubmit.
                  </p>
                  <div>
                    <label className="form-label">Rejection Reason / Feedback *</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="e.g., Dates exceed client milestone window; please compress Foundation duration to 10 days."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="secondary" onClick={handleRejectPlanning} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </>
      ) : (
        <PlanningListTab onSelect={handleSelectPlanning} />
      )}
    </div>
  );
};
