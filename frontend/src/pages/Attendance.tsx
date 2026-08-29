import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormSelect } from '../components/forms/FormSelect';
import { FormInput } from '../components/forms/FormInput';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest } from '../services/api';
import { AttendanceLog, Task } from '../types';
import { MapPin, LogIn, LogOut, Navigation, AlertTriangle, Clock } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<AttendanceLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check In Modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('Click to fetch GPS location');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    const [lRes, aRes, tRes] = await Promise.all([
      apiRequest<AttendanceLog[]>('/attendance/logs'),
      apiRequest<AttendanceLog>('/attendance/active'),
      apiRequest<Task[]>('/tasks?assigned_to_me=true'),
    ]);

    if (lRes.success && lRes.data) setLogs(lRes.data);
    if (aRes.success) setActiveCheckIn(aRes.data || null);
    if (tRes.success && tRes.data) setTasks(tRes.data);

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
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLatitude(null);
        setLongitude(null);
        if (err.code === err.PERMISSION_DENIED) {
          setError('GPS Permission Denied. You must allow location access to check in.');
          setLocationStatus('Permission Denied');
        } else {
          setError('Failed to acquire GPS location. Please check your signal and try again.');
          setLocationStatus('GPS Error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenCheckInModal = () => {
    setError(null);
    if (tasks.length > 0) setSelectedTaskId(tasks[0].task_id);
    getGPSLocation();
    setIsCheckInModalOpen(true);
  };

  const handlePerformCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      setError('Please acquire GPS location before checking in');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await apiRequest('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        task_id: selectedTaskId || undefined,
        latitude,
        longitude,
        address,
      }),
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsCheckInModalOpen(false);
      fetchAttendanceData();
    } else {
      setError(res.message || 'Check-in failed');
    }
  };

  const handlePerformCheckOut = async (attendanceId: number) => {
    if (!latitude || !longitude) {
      // Fetch GPS quickly
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await submitCheckOut(attendanceId, pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          alert('GPS is required for check-out. Please enable location permissions in your browser and try again.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      await submitCheckOut(attendanceId, latitude, longitude);
    }
  };

  const submitCheckOut = async (attendanceId: number, lat: number, lng: number) => {
    setIsLoading(true);
    const res = await apiRequest('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({
        attendance_id: attendanceId,
        latitude: lat,
        longitude: lng,
        address: `Check-out GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      }),
    });

    if (res.success) {
      fetchAttendanceData();
    } else {
      alert(res.message || 'Check-out failed');
    }
    setIsLoading(false);
  };

  const columns: Column<AttendanceLog>[] = [
    { header: 'Employee', accessor: (r) => `${r.employee_name || 'Worker'} (${r.employee_code || '-'})` },
    { header: 'Date', accessor: 'attendance_date' },
    { header: 'Task / Project', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work' },
    { header: 'Check In Time', accessor: (r) => new Date(r.check_in_time).toLocaleTimeString() },
    { header: 'Check Out Time', accessor: (r) => r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString() : '-' },
    {
      header: 'Working Hours',
      accessor: (r) => (
        <span style={{ fontWeight: 700, color: r.total_working_hours > 0 ? '#10b981' : '#f59e0b' }}>
          {r.total_working_hours > 0 ? `${r.total_working_hours} hrs` : 'Active'}
        </span>
      ),
    },
    {
      header: 'Location Address',
      accessor: (r) => (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <MapPin size={13} color="#06b6d4" /> {r.in_address || 'GPS Logged'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge variant={r.status === 'completed' ? 'success' : r.status === 'open' ? 'info' : 'danger'}>
          {r.status === 'missing_checkout' ? 'Missing Checkout' : r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">GPS Attendance & Time Logging</h1>
          <p className="page-subtitle">Site Check-In / Check-Out with verified latitude, longitude, and task time tracking</p>
        </div>
        {!activeCheckIn ? (
          <Button variant="primary" onClick={handleOpenCheckInModal}>
            <LogIn size={18} /> GPS Check-In
          </Button>
        ) : (
          <Button variant="danger" onClick={() => handlePerformCheckOut(activeCheckIn.attendance_id)}>
            <LogOut size={18} /> Check-Out Now
          </Button>
        )}
      </div>

      {/* Active Check-In Banner */}
      {activeCheckIn && (
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
            flexWrap: 'wrap',
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

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="glass-card">
          <DataTable
            columns={columns}
            data={logs}
            searchPlaceholder="Search attendance logs by employee, task, or location..."
            exportFilename="gps_attendance_logs.csv"
            actions={(row) =>
              row.status === 'open' ? (
                <Button variant="danger" onClick={() => handlePerformCheckOut(row.attendance_id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                  <LogOut size={12} /> Check-Out
                </Button>
              ) : null
            }
          />
        </div>
      )}

      {/* Check In Modal */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="GPS Site Check-In">
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handlePerformCheckIn}>
          {tasks.length > 0 ? (
            <FormSelect
              label="Select Assigned Task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(parseInt(e.target.value, 10))}
              options={tasks.map((t) => ({ value: t.task_id, label: `${t.task_name} (${t.project_name})` }))}
            />
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
              No tasks currently assigned. You can check in for general site duty.
            </p>
          )}

          <div className="form-group">
            <label className="form-label">GPS Location Verification</label>
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
            placeholder="Auto-resolved GPS address"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !latitude}>
              <LogIn size={18} /> {isSubmitting ? 'Recording...' : 'Confirm Check-In'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
