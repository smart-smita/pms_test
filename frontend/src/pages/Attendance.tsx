import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormSelect } from '../components/forms/FormSelect';
import { FormInput } from '../components/forms/FormInput';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors } from '../services/api';
import { AttendanceLog, Task, Project } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { MapPin, LogIn, LogOut, Navigation, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [activeCheckIn, setActiveCheckIn] = useState<AttendanceLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check In Modal
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('Click to fetch GPS location');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    const promises: Promise<any>[] = [
      apiRequest<AttendanceLog[]>('/attendance/logs'),
      apiRequest<AttendanceLog>('/attendance/active'),
      apiRequest<Task[]>('/tasks?assigned_to_me=true'),
    ];
    if (isAdmin) {
      promises.push(apiRequest<Project[]>('/projects'));
    }

    const [lRes, aRes, tRes, pRes] = await Promise.all(promises);

    if (lRes.success && lRes.data) setLogs(lRes.data);
    if (aRes.success) setActiveCheckIn(aRes.data || null);
    if (tRes.success && tRes.data) setTasks(tRes.data);
    if (pRes?.success && pRes.data) setProjects(pRes.data);

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
          showError('GPS Permission Denied. You must allow location access to check in.');
          setLocationStatus('Permission Denied');
        } else {
          showError('Failed to acquire GPS location. Please check your signal and try again.');
          setLocationStatus('GPS Error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenCheckInModal = () => {
    setFormErrors({});
    if (tasks.length > 0) setSelectedTaskId(tasks[0].task_id);
    getGPSLocation();
    setIsCheckInModalOpen(true);
  };

  const handlePerformCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      showError('Please acquire GPS location before checking in');
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

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
      showSuccess('Checked in successfully.');
      setIsCheckInModalOpen(false);
      fetchAttendanceData();
    } else {
      showError(res.message || 'Check-in failed.');
    }
  };

  const handlePerformCheckOut = async (attendanceId: number) => {
    if (!latitude || !longitude) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await submitCheckOut(attendanceId, pos.coords.latitude, pos.coords.longitude);
        },
        async () => {
          showError('GPS is required for check-out. Please enable location permissions in your browser and try again.');
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
      showSuccess('Checked out successfully.');
      fetchAttendanceData();
    } else {
      showError(res.message || 'Check-out failed.');
    }
    setIsLoading(false);
  };

  // Real-time distance evaluation for check-in modal
  const selectedTaskObj = tasks.find((t) => t.task_id === selectedTaskId);
  const selectedProjectObj = selectedTaskObj ? projects.find((p) => p.project_id === selectedTaskObj.project_id) : null;
  
  let calculatedDistance: number | null = null;
  let isWithinRadius: boolean = true;
  const projectRadius = (selectedTaskObj as any)?.project_radius_meters || selectedProjectObj?.radius_meters || 500;
  const targetLat = (selectedTaskObj as any)?.project_latitude ?? selectedProjectObj?.latitude;
  const targetLng = (selectedTaskObj as any)?.project_longitude ?? selectedProjectObj?.longitude;

  if (latitude && longitude && targetLat != null && targetLng != null) {
    calculatedDistance = calculateHaversineDistance(
      latitude,
      longitude,
      Number(targetLat),
      Number(targetLng)
    );
    isWithinRadius = calculatedDistance <= projectRadius;
  }

  const columns: Column<AttendanceLog>[] = [
    ...(isAdmin ? [{ 
      header: 'Employee', 
      accessor: (r: AttendanceLog) => `${r.employee_name || 'Worker'} (${r.employee_code || '-'})`, 
      csvAccessor: (r: AttendanceLog) => `${r.employee_name || 'Worker'} (${r.employee_code || '-'})`, 
      sortKey: (r: AttendanceLog) => r.employee_name || '' 
    }] : []),
    { header: 'Date', accessor: 'attendance_date', sortKey: 'attendance_date' },
    { header: 'Task / Project', accessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work', csvAccessor: (r) => r.task_name ? `${r.task_name} (${r.project_name || ''})` : 'General Site Work', sortKey: (r) => r.task_name || '' },
    { header: 'Check In Time', accessor: (r) => new Date(r.check_in_time).toLocaleTimeString(), csvAccessor: (r) => new Date(r.check_in_time).toLocaleTimeString(), sortKey: 'check_in_time' },
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
      header: 'Location & Distance',
      accessor: (r) => {
        const distText = r.in_distance_meters != null
          ? `${r.in_distance_meters}m / ${r.project_radius_meters || 500}m allowed (${r.in_status === 'outside' ? 'Outside' : 'Inside'})`
          : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={13} color="#06b6d4" /> {r.in_address || 'GPS Logged'}
            </span>
            {distText && (
              <span style={{ fontSize: '0.75rem', color: r.in_status === 'outside' ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                {distText}
              </span>
            )}
          </div>
        );
      },
      csvAccessor: (r) => `${r.in_address || 'GPS Logged'}${r.in_distance_meters != null ? ` (${r.in_distance_meters}m)` : ''}`,
      sortKey: 'in_address'
    },
    {
      header: 'Attendance Status',
      accessor: (r) => {
        if (r.status === 'open') {
          return <Badge variant="info">Present / Checked-In</Badge>;
        }
        if (r.status === 'completed') {
          return <Badge variant="success">Checked-Out / Completed</Badge>;
        }
        if (r.status === 'outside_area') {
          return <Badge variant="danger">Outside Project Area</Badge>;
        }
        if (r.status === 'missing_checkout') {
          return <Badge variant="warning">Missing Checkout</Badge>;
        }
        return <Badge variant="info">{r.status}</Badge>;
      },
      csvAccessor: (r) => {
        if (r.status === 'open') return 'Present / Checked-In';
        if (r.status === 'completed') return 'Checked-Out / Completed';
        if (r.status === 'outside_area') return 'Outside Project Area';
        if (r.status === 'missing_checkout') return 'Missing Checkout';
        return r.status;
      },
      sortKey: 'status'
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">GPS Attendance & Time Logging</h1>
          <p className="page-subtitle">Site Check-In / Check-Out with verified latitude, longitude, and task time tracking</p>
        </div>
        {isAdmin && (!activeCheckIn ? (
          <Button variant="primary" onClick={handleOpenCheckInModal}>
            <LogIn size={18} /> GPS Check-In
          </Button>
        ) : (
          <Button variant="danger" onClick={() => handlePerformCheckOut(activeCheckIn.attendance_id)}>
            <LogOut size={18} /> Check-Out Now
          </Button>
        ))}
      </div>

      {/* Active Check-In Banner */}
      {isAdmin && activeCheckIn && (
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

        <div className="glass-card">
          <DataTable
            columns={columns}
            data={logs}
            searchPlaceholder="Search attendance logs by employee, task, or location..."
            exportFilename="gps_attendance_logs"
            isLoading={isLoading}
            actions={isAdmin ? (row) =>
              row.status === 'open' || row.status === 'missing_checkout' ? (
                <Button variant="danger" onClick={() => handlePerformCheckOut(row.attendance_id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                  <LogOut size={12} /> Check-Out
                </Button>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
              )
            : undefined}
          />
        </div>

      {/* Check In Modal */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="GPS Site Check-In">
        <form noValidate onSubmit={handlePerformCheckIn}>
          {tasks.length > 0 ? (
            <FormSelect
              label="Select Assigned Task *"
              value={selectedTaskId}
              onChange={(e) => { setSelectedTaskId(parseInt(e.target.value, 10)); setFormErrors(prev => ({...prev, task_id: ''})); }}
              options={tasks.map((t) => ({ value: t.task_id, label: `${t.task_name} (${t.project_name})` }))}
              error={formErrors.task_id}
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

          {/* Real-time Radius Compliance Display */}
          {selectedProjectObj && calculatedDistance !== null && (
            <div style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              background: isWithinRadius ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${isWithinRadius ? '#10b981' : '#ef4444'}`,
              fontSize: '0.85rem',
              color: isWithinRadius ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {isWithinRadius ? <CheckCircle size={20} color="#10b981" /> : <AlertTriangle size={20} color="#ef4444" />}
              <div>
                <strong>{isWithinRadius ? 'Inside Project Area ✓' : 'Outside Project Area ⚠'}</strong>
                <div style={{ fontSize: '0.78rem', marginTop: '0.15rem', color: 'var(--text-primary)' }}>
                  Distance: <strong>{calculatedDistance}m</strong> | Allowed Radius: <strong>{projectRadius}m</strong> ({selectedProjectObj.project_name})
                </div>
              </div>
            </div>
          )}

          <FormInput
            label="Location Address / Site Note"
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setFormErrors(prev => ({...prev, address: ''})); }}
            placeholder="Auto-resolved GPS address"
            error={formErrors.address}
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
