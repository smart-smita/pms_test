import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { FormInput } from '../forms/FormInput';
import { apiService } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';
import { Edit, Trash2, Calendar, Clock, User, Download, FileSpreadsheet } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useAuth } from '../../context/AuthContext';

interface LogHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number | null;
  onLogUpdated?: () => void;
}

interface LogEntry {
  timesheet_id: number;
  project_id: number;
  project_name: string;
  wbs_id?: number | null;
  wbs_name?: string | null;
  task_id?: number | null;
  task_name?: string | null;
  employee_id: number;
  employee_name: string;
  employee_code: string;
  log_date: string;
  working_hours: number;
  comment?: string | null;
  created_at: string;
}

interface TaskHistoryData {
  task: {
    task_id: number;
    task_name: string;
    project_id: number;
    project_name: string;
    wbs_id?: number;
    wbs_name?: string;
    estimated_hours: number;
    actual_hours: number;
    status: string;
  };
  total_logged_hours: number;
  remaining_hours: number;
  logs: LogEntry[];
}

export const LogHistoryModal: React.FC<LogHistoryModalProps> = ({
  isOpen,
  onClose,
  taskId,
  onLogUpdated,
}) => {
  const { user } = useAuth();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Manager';

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TaskHistoryData | null>(null);

  // Edit Log state
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [editLogDate, setEditLogDate] = useState('');
  const [editHours, setEditHours] = useState<number | string>(0);
  const [editComment, setEditComment] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Log state
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await apiService.get<TaskHistoryData>(`/timesheets/task/${taskId}/history`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showError(res.message || 'Failed to load task log history');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load task log history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchHistory();
    } else {
      setData(null);
      setEditingLog(null);
    }
  }, [isOpen, taskId]);

  const handleOpenEdit = (log: LogEntry) => {
    setEditingLog(log);
    setEditLogDate(log.log_date);
    setEditHours(log.working_hours);
    setEditComment(log.comment || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    const hrs = Number(editHours);
    if (!hrs || hrs <= 0) {
      showError('Please enter valid working hours greater than 0');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await apiService.put(`/timesheets/${editingLog.timesheet_id}`, {
        log_date: editLogDate,
        working_hours: hrs,
        comment: editComment,
      });

      if (res.success) {
        showSuccess('Timesheet log entry updated successfully');
        setEditingLog(null);
        fetchHistory();
        if (onLogUpdated) onLogUpdated();
      } else {
        showError(res.message || 'Failed to update timesheet log');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to update timesheet log');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingLogId) return;
    setIsDeleting(true);
    try {
      const res = await apiService.delete(`/timesheets/${deletingLogId}`);
      if (res.success) {
        showSuccess('Log entry deleted successfully');
        setDeletingLogId(null);
        fetchHistory();
        if (onLogUpdated) onLogUpdated();
      } else {
        showError(res.message || 'Failed to delete log entry');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to delete log entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCsv = () => {
    if (!data || !data.logs || data.logs.length === 0) return;
    const headers = ['Log Date', 'Employee', 'Employee Code', 'Work Hours', 'Remarks / Comment', 'Created Date'];
    const rows = data.logs.map((l) => [
      l.log_date,
      `"${l.employee_name}"`,
      `"${l.employee_code}"`,
      l.working_hours,
      `"${(l.comment || '').replace(/"/g, '""')}"`,
      new Date(l.created_at).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Task_${data.task.task_id}_Log_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Log History">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <LoadingSpinner />
        </div>
      ) : !data ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          No data available for this task.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Task Information */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {data.task.task_name}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Project: <strong style={{ color: 'var(--text-main)' }}>{data.task.project_name}</strong> | Discipline: <strong style={{ color: 'var(--text-main)' }}>{data.task.wbs_name || 'General'}</strong>
                </div>
              </div>
              <Badge variant={data.task.status === 'completed' ? 'success' : data.task.status === 'in-progress' ? 'info' : 'warning'}>
                {data.task.status}
              </Badge>
            </div>

            {/* Summary Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              <div
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Planned Hours
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.2rem' }}>
                  {data.task.estimated_hours}h
                </div>
              </div>

              <div
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Logged
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
                  {data.total_logged_hours}h
                </div>
              </div>

              <div
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Remaining Hours
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: data.remaining_hours === 0 ? '#ef4444' : '#f59e0b',
                    marginTop: '0.2rem',
                  }}
                >
                  {data.remaining_hours}h
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Timesheet Log History ({data.logs.length} {data.logs.length === 1 ? 'entry' : 'entries'})
            </div>
            {data.logs.length > 0 && (
              <Button variant="secondary" onClick={exportToCsv} style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                <Download size={14} /> Export CSV
              </Button>
            )}
          </div>

          {/* History Log Table */}
          {data.logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--card-bg, #f8fafc)', borderRadius: '8px', border: '1px dashed var(--border-color, #cbd5e1)' }}>
              <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No timesheet logs recorded for this task yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(99, 102, 241, 0.05)', textAlign: 'left', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Log Date</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Employee</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Work Hours</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Remarks / Description</th>
                    {canManage && <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log.timesheet_id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: '#6366f1' }} />
                          {log.log_date}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                          {log.employee_name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({log.employee_code})</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant="info">
                          {log.working_hours} HRs
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {log.comment || <em style={{ fontSize: '0.8rem' }}>No remarks</em>}
                      </td>
                      {canManage && (
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <Button
                              variant="secondary"
                              onClick={() => handleOpenEdit(log)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              title="Edit Entry"
                            >
                              <Edit size={13} />
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setDeletingLogId(log.timesheet_id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                              title="Soft Delete Entry"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Inline Edit Log Entry Modal */}
      {editingLog && (
        <Modal isOpen={!!editingLog} onClose={() => setEditingLog(null)} title="Edit Timesheet Log Entry">
          <form noValidate onSubmit={handleSaveEdit}>
            <div style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee</div>
              <div style={{ fontWeight: 600 }}>{editingLog.employee_name} ({editingLog.employee_code})</div>
            </div>

            <FormInput
              label="Log Date *"
              type="date"
              value={editLogDate}
              onChange={(e) => setEditLogDate(e.target.value)}
              required
            />

            <FormInput
              label="Work HRs. *"
              type="number"
              step="0.5"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
            />

            <div className="form-group">
              <label className="form-label">Remarks / Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingLog(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingLogId}
        onClose={() => setDeletingLogId(null)}
        onConfirm={confirmDelete}
        recordName="this timesheet log entry"
        isLoading={isDeleting}
      />
    </Modal>
  );
};
