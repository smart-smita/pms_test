import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Project, Project360Data, Customer } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { WorkspaceHeader } from '../components/projects/WorkspaceHeader';
import { WorkspaceTabs } from '../components/projects/WorkspaceTabs';
import { ProjectListTab } from '../components/projects/tabs/ProjectListTab';
import { ManageWorkTab } from '../components/projects/tabs/ManageWorkTab';
import { TaskManagementTab } from '../components/projects/tabs/TaskManagementTab';
import { MaterialTab } from '../components/projects/tabs/MaterialTab';
import { SiteSurveyTab } from '../components/projects/tabs/SiteSurveyTab';
import { TimesheetTab } from '../components/projects/tabs/TimesheetTab';
import { AttendanceTab } from '../components/projects/tabs/AttendanceTab';
import { LabourWorkTab } from '../components/projects/tabs/LabourWorkTab';
import { GanttTab } from '../components/projects/tabs/GanttTab';
import { InvoicesTab } from '../components/projects/tabs/InvoicesTab';
import { showSuccess, showError } from '../utils/toast';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '../components/common/Button';

interface ProjectWorkspaceProps {
  projectId?: number;
  initialTab?: string;
  onNavigate: (page: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  projectId: propProjectId,
  initialTab = 'list',
  onNavigate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(propProjectId || null);
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'list');
  const [projectData, setProjectData] = useState<Project360Data | null>(null);
  const [isLoadingHeader, setIsLoadingHeader] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (propProjectId && propProjectId !== selectedProjectId) {
      setSelectedProjectId(propProjectId);
    }
  }, [propProjectId]);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch project 360 header info whenever a project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchProject360(selectedProjectId);
    } else {
      setProjectData(null);
    }
  }, [selectedProjectId]);

  const fetchProject360 = async (id: number) => {
    setIsLoadingHeader(true);
    try {
      const res = await apiRequest<Project360Data>(`/projects/${id}/360`);
      if (res.success && res.data) {
        setProjectData(res.data);
      }
    } catch (e) {
      console.error('Failed to load project header data', e);
    }
    setIsLoadingHeader(false);
  };

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    setActiveTab('manage-work');
    onNavigate(`project/workspace/${id}/manage-work`);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (selectedProjectId) {
      onNavigate(`project/workspace/${selectedProjectId}/${tabId}`);
    } else {
      onNavigate(`project/workspace/0/${tabId}`);
    }
  };

  const handleBackToProjectList = () => {
    setSelectedProjectId(null);
    setProjectData(null);
    setActiveTab('list');
    onNavigate('project/workspace');
  };

  const handleToggleStatus = async () => {
    if (!selectedProjectId || !projectData?.project) return;
    const newStatus = projectData.project.status === 'active' ? 'cancelled' : 'active';
    const res = await apiRequest(`/projects/${selectedProjectId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      showSuccess(`Project marked as ${newStatus === 'active' ? 'Active' : 'Deactivated'}`);
      fetchProject360(selectedProjectId);
    } else {
      showError(res.message || 'Failed to update project status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg-primary)' }}>
      
      {/* 1. Project Workspace Hero Banner Card */}
      {selectedProjectId && projectData?.project ? (
        <WorkspaceHeader
          project={projectData.project}
          customer={projectData.customer}
          onBack={handleBackToProjectList}
          onEdit={() => onNavigate(`project/${selectedProjectId}/edit`)}
          onExportExcel={() => showSuccess('Project report export initiated.')}
          onDuplicate={() => onNavigate(`project/new?duplicateFrom=${selectedProjectId}`)}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        /* Workspace Header Bar when viewing all projects */
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(79, 70, 229, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <FolderKanban size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                WORKSPACE
              </div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Project Workspace
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Button
              variant="primary"
              onClick={() => onNavigate('project/new')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#4f46e5',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '0.5rem 1.1rem',
                fontWeight: 600,
                fontSize: '0.86rem',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Plus size={16} />
              <span>Add Project</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Horizontal Navigation Tabs Bar */}
      <WorkspaceTabs
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        hasSelectedProject={!!selectedProjectId}
      />

      {/* 3. Tab Content Body */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {activeTab === 'list' && (
          <ProjectListTab
            onSelectProject={handleSelectProject}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'manage-work' && (
          <ManageWorkTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskManagementTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'site-surveys' && (
          <SiteSurveyTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'timesheets' && (
          <TimesheetTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'labour-work' && (
          <LabourWorkTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'gantt' && (
          <GanttTab
            projectId={selectedProjectId || undefined}
            onNavigate={onNavigate}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab
            projectId={selectedProjectId || 0}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
};
