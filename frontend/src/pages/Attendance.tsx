import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormSelect } from '../components/forms/FormSelect';
import { FormInput } from '../components/forms/FormInput';
import { apiRequest } from '../services/api';
import { AttendanceLog, Task, Project } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { MapPin, LogIn, LogOut, Navigation, Clock, Edit2, Trash2, Users, HardHat, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'Super Admin';

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<AttendanceLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filterProjectId, setFilterProjectId] = useState<number>(0);

  // Check In / Punch on Behalf Modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [modalProjectId, setModalProjectId] = useState<number>(0);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('Click to fetch GPS location');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editCheckInTime, setEditCheckInTime] = useState('');
  const [editCheckOutTime, setEditCheckOutTime] = useState('');
  const [editInAddress, setEditInAddress] = useState('');

  // Delete Confirmation State
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    const isManagerOrAdmin = isAdmin || user?.role_name === 'Manager';
    const promises: Promise<any>[] = [
      apiRequest<AttendanceLog[]>('/attendance/logs'),
      apiRequest<AttendanceLog>('/attendance/active'),
      apiRequest<Task[]>('/tasks'),
      apiRequest<Project[]>('/projects'),
    ];
    if (isManagerOrAdmin) {
      promises.push(apiRequest<any[]>('/employees'));
    }

    const [lRes, aRes, tRes, pRes, eRes] = await Promise.all(promises);

    if (lRes.success && lRes.data) setLogs(lRes.data);
    if (aRes.success) setActiveCheckIn(aRes.data || null);
    if (tRes.success && tRes.data) setTasks(tRes.data);
    if (pRes?.success && pRes.data) setProjects(pRes.data);
    if (eRes?.success && eRes.data) setEmployees(eRes.data.filter((e: any) => e.status === 'active'));

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const getGPSLocation = () => {
    setLocationStatus('Acquiring high-accuracy GPS coordinates...');
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationStatus(`GPS Locked: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setAddress(`Site GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      },
      () => {
        setLocationStatus('GPS Permission Denied - Defaulting to Manual Site Punch');
        setAddress('Manual Punch (Location Access Denied)');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleOpenCheckInModal = () => {
    if (tasks.length > 0) setSelectedTaskId(tasks[0].task_id);
    setSelectedEmployeeId(0);
    getGPSLocation();
    setIsCheckInModalOpen(true);
  };

  const handlePerformCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Employee Check In
    const res = await apiRequest('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        task_id: selectedTaskId || undefined,
        employee_id: isAdmin && selectedEmployeeId ? selectedEmployeeId : undefined,
        latitude,
        longitude,
        address,
      }),
    });

    setIsSubmitting(false);
    if (res.success) {
      showSuccess('Checked in successfully.');
      setIsCheckInModalOpen(false);
      fetchAttendanceData();
    } else {
      showError(res.message || 'Check-in failed.');
    }
  };

  const handlePerformCheckOut = async (attendanceId: number) => {
    setIsLoading(true);
    const res = await apiRequest('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({
        attendance_id: attendanceId,
        address: address || 'Site GPS Punch Out',
      }),
    });

    if (res.success) {
      showSuccess('Checked out successfully.');
      fetchAttendanceData();
    } else {
      showError(res.message || 'Check-out failed.');
    }
    setIsLoading(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setIsSubmitting(true);

    const endpoint = `/attendance/${editingLog.attendance_id}`;
    
    const bodyPayload = { check_in_time: editCheckInTime, check_out_time: editCheckOutTime, in_address: editInAddress };

    const res = await apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(bodyPayload),
    });

    setIsSubmitting(false);
    if (res.success) {
      showSuccess('Attendance record updated successfully.');
      setEditingLog(null);
      fetchAttendanceData();
    } else {
      showError(res.message || 'Failed to update record.');
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deletingLogId) return;
    setIsLoading(true);

    const endpoint = `/attendance/${deletingLogId}`;
    const res = await apiRequest(endpoint, { method: 'DELETE' });

    setIsLoading(false);
    setDeletingLogId(null);

    if (res.success) {
      showSuccess('Attendance record soft-deleted successfully.');
      fetchAttendanceData();
    } else {
      showError(res.message || 'Delete failed.');
    }
  };

  const employeeColumns: Column<AttendanceLog>[] = [
    ...(isAdmin ? [{ 
      header: 'Employee', 
      accessor: (r: AttendanceLog) => `${r.employee_name || 'Worker'} (${r.employee_code || '-'})`, 
      csvAccessor: (r: AttendanceLog) => `${r.employee_name || 'Worker'} (${r.employee_code || '-'})`, 
      sortKey: (r: AttendanceLog) => r.employee_name || '' 
    }] : []),
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Task / Project', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work', csvAccessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work', sortKey: (r) => r.task_name || '' },
    { header: 'Check In Time', accessor: (r) => r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '-', csvAccessor: (r) => r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : '-', sortKey: 'check_in_time' },
    { header: 'Check Out Time', accessor: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-', csvAccessor: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-', sortKey: 'check_out_time' },
    {
      header: 'Working Hours',
      accessor: (r) => (
        <span style={{ fontWeight: 700, color: r.total_working_hours > 0 ? '#10b981' : '#f59e0b' }}>
          {r.total_working_hours > 0 ? `${r.total_working_hours} hrs` : 'Active'}
        </span>
      ),
      csvAccessor: (r) => r.total_working_hours > 0 ? `${r.total_working_hours} hrs` : 'Active',
      sortKey: 'total_working_hours'
    },
    {
      header: 'Location Address',
      accessor: (r) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={13} color="#06b6d4" /> {r.in_address || 'GPS Logged'}
        </span>
      ),
      csvAccessor: (r) => r.in_address || 'GPS Logged',
      sortKey: 'in_address'
    },
    {
      header: 'Status',
      accessor: (r) => {
        if (r.status === 'open') return <Badge variant="info">Checked-In</Badge>;
        if (r.status === 'completed') return <Badge variant="success">Completed</Badge>;
        return <Badge variant="warning">{r.status}</Badge>;
      },
      csvAccessor: (r) => r.status,
      sortKey: 'status'
    },
  ];

  // Filter data based on filterProjectId
  const filteredLogs = logs.filter((l) => {
    if (!filterProjectId) return true;
    if ((l as any).project_id && Number((l as any).project_id) === filterProjectId) return true;
    const task = tasks.find((t) => t.task_id === l.task_id);
    if (task && Number(task.project_id) === filterProjectId) return true;
    return false;
  });

  const modalAvailableTasks = tasks.filter((t) => {
    if (!modalProjectId) return true;
    return Number(t.project_id) === modalProjectId;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">GPS Attendance & Time Logging</h1>
          <p className="page-subtitle">Site Check-In / Check-Out with verified latitude, longitude, and task time tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="primary" onClick={handleOpenCheckInModal}>
            <LogIn size={18} /> {isAdmin ? 'Punch / Log Attendance' : 'GPS Check-In'}
          </Button>
        </div>
      </div>

      {/* Active Check-In Banner for Employee */}
      {!isAdmin && activeCheckIn && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            border: '1px solid #06b6d4',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>
                You are currently checked in!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Task: {activeCheckIn.task_name || 'General Site'} | Checked in at {new Date(activeCheckIn.check_in_time).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <Button variant="danger" onClick={() => handlePerformCheckOut(activeCheckIn.attendance_id)}>
            <LogOut size={18} /> Perform Check-Out
          </Button>
        </div>
      )}

      {/* Project Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Filter size={16} style={{ color: '#6366f1' }} /> Filter Attendance Logs:
          </div>

          <div style={{ minWidth: '220px' }}>
            <select
              className="form-input"
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(parseInt(e.target.value, 10) || 0)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value={0}>All Projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          {filterProjectId !== 0 && (
            <Button
              variant="secondary"
              onClick={() => setFilterProjectId(0)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Reset Filter
            </Button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredLogs.length}</strong> records
          </div>
        </div>
      </div>

      <div className="glass-card">
          <DataTable
            columns={employeeColumns}
            data={filteredLogs}
            searchPlaceholder="Search employee attendance logs..."
            exportFilename="employee_attendance_logs"
            isLoading={isLoading}
            actions={isAdmin ? (row: AttendanceLog) => (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setEditingLog(row);
                    setEditCheckInTime(row.check_in_time ? new Date(row.check_in_time).toISOString().slice(0, 16) : '');
                    setEditCheckOutTime(row.check_out_time ? new Date(row.check_out_time).toISOString().slice(0, 16) : '');
                    setEditInAddress(row.in_address || '');
                  }}
                  title="Edit Record"
                  style={{ background: 'rgba(99, 102, 241, 0.1)', border: 'none', color: '#6366f1', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    setDeletingLogId(row.attendance_id);
                  }}
                  title="Soft Delete"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : undefined}
          />
      </div>

      {/* Check In / Log Attendance Modal */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="Site Punch & Attendance Entry">
        <form noValidate onSubmit={handlePerformCheckIn}>
          {isAdmin && (
            <FormSelect
              label="Select Employee (Punch on Behalf)"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(parseInt(e.target.value, 10) || 0)}
              options={[
                { value: 0, label: '-- Punch In Myself --' },
                ...employees.map(emp => ({ value: emp.employee_id, label: `${emp.name} (${emp.employee_code})` }))
              ]}
            />
          )}

          {/* Project Selection for Punch Modal */}
          <FormSelect
            label="Select Project"
            value={modalProjectId}
            onChange={(e) => {
              const pId = parseInt(e.target.value, 10) || 0;
              setModalProjectId(pId);
              const matching = tasks.filter(t => !pId || Number(t.project_id) === pId);
              if (matching.length > 0) {
                setSelectedTaskId(matching[0].task_id);
              } else {
                setSelectedTaskId(0);
              }
            }}
            options={[
              { value: 0, label: '-- All Projects --' },
              ...projects.map(p => ({ value: p.project_id, label: p.project_name }))
            ]}
          />

          <FormSelect
            label="Select Assigned Task"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(parseInt(e.target.value, 10))}
            options={[
              { value: 0, label: '-- Select Task --' },
              ...modalAvailableTasks.map((t) => ({ value: t.task_id, label: `${t.task_name} (${t.project_name || 'General Site'})` }))
            ]}
          />

          <div className="form-group">
            <label className="form-label">GPS Verification</label>
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: latitude ? '#10b981' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={18} color={latitude ? '#10b981' : '#94a3b8'} />
                <span>{locationStatus}</span>
              </div>
              <Button type="button" variant="secondary" onClick={getGPSLocation} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                Refresh GPS
              </Button>
            </div>
          </div>

          <FormInput
            label="Location Address / Site Note"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Location address"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              <LogIn size={18} /> {isSubmitting ? 'Recording...' : 'Confirm Punch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Edit Modal */}
      <Modal isOpen={!!editingLog} onClose={() => setEditingLog(null)} title="Edit Attendance Record">
        <form onSubmit={handleSaveEdit}>
          <FormInput
            label="Check-In Time"
            type="datetime-local"
            value={editCheckInTime}
            onChange={(e) => setEditCheckInTime(e.target.value)}
          />
          <FormInput
            label="Check-Out Time"
            type="datetime-local"
            value={editCheckOutTime}
            onChange={(e) => setEditCheckOutTime(e.target.value)}
          />
          <FormInput
            label="Location Address"
            type="text"
            value={editInAddress}
            onChange={(e) => setEditInAddress(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setEditingLog(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingLogId} onClose={() => setDeletingLogId(null)} title="Confirm Soft Delete">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Are you sure you want to soft-delete this attendance record? The data will be marked as deleted (`is_deleted = 1`) and preserved in the audit database.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => setDeletingLogId(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmSoftDelete}>
            Soft Delete Record
          </Button>
        </div>
      </Modal>
    </div>
  );
};
