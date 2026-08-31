import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { ArrowLeft, MapPin, Plus, Trash2, Save } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiRequest, parseApiErrors } from '../services/api';
import { Project } from '../types';
import { showSuccess, showError } from '../utils/toast';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Fix for default Leaflet icon missing in React
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function LocationMarker({ position, setPosition }: { position: {lat: number, lng: number}, setPosition: (p: any) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={defaultIcon} />
  );
}

interface ProjectFormProps {
  projectId?: number;
  onBack: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onBack }) => {
  // Safe date parser
  const getFormattedDate = (d?: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    return d.split('T')[0].split(' ')[0]; // Handles both ISO and SQL date strings
  };

  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId);
  const [project, setProject] = useState<Project | null>(null);

  // Main Form State
  const [projectCode, setProjectCode] = useState(`PRJ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [projectDate, setProjectDate] = useState(getFormattedDate());
  const [clientCode, setClientCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('active');

  // Map / Location State
  const [latitude, setLatitude] = useState<string>('18.5204');
  const [longitude, setLongitude] = useState<string>('73.8567');

  // WBS Allocations State
  const [wbsAllocations, setWbsAllocations] = useState<any[]>([]);
  const [wbsName, setWbsName] = useState('');
  const [wbsStart, setWbsStart] = useState('');
  const [wbsEnd, setWbsEnd] = useState('');
  const [wbsHours, setWbsHours] = useState('');
  const [masterWbsList, setMasterWbsList] = useState<any[]>([]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [wbsErrors, setWbsErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WBS Delete State
  const [isWbsDeleteModalOpen, setIsWbsDeleteModalOpen] = useState(false);
  const [deletingWbsIndex, setDeletingWbsIndex] = useState<number | null>(null);

  // Fetch existing project data, WBS allocations and master list
  React.useEffect(() => {
    apiRequest<any[]>('/wbs').then(res => {
      if (res.success && res.data) {
        setMasterWbsList(res.data);
      }
    });

    if (projectId) {
      setIsLoadingProject(true);
      // Fetch project details
      apiRequest<Project>(`/projects/${projectId}`).then(res => {
        if (res.success && res.data) {
          const p = res.data;
          setProject(p);
          setProjectCode(p.project_code);
          setProjectName(p.project_name);
          setProjectAddress(p.project_address || '');
          setRadiusMeters(p.radius_meters || 500);
          setProjectDate(getFormattedDate(p.project_date));
          setClientCode(p.client_code || '');
          setClientName(p.client_name || '');
          setNote(p.note || '');
          setStatus(p.status || 'active');
          if (p.latitude) setLatitude(String(p.latitude));
          if (p.longitude) setLongitude(String(p.longitude));
        }
      });

      // Fetch WBS allocations
      apiRequest<any[]>(`/projects/${projectId}/wbs`).then(res => {
        if (res.success && res.data) {
          setWbsAllocations(res.data.map(w => ({
            id: w.id,
            wbs_id: w.wbs_id,
            wbs_code: w.wbs_code,
            wbs_name: w.wbs_name,
            start_date: w.start_date ? w.start_date.split('T')[0] : '',
            end_date: w.end_date ? w.end_date.split('T')[0] : '',
            total_hours: w.total_hours || 0
          })));
        }
        setIsLoadingProject(false);
      });
    }
  }, [projectId]);

  const handleAddWbs = () => {
    let hasWbsErrors = false;
    const newWbsErrors: Record<string, string> = {};
    if (!wbsName) { newWbsErrors.wbsName = 'WBS Name is required.'; hasWbsErrors = true; }
    if (!wbsStart) { newWbsErrors.wbsStart = 'Start Date is required.'; hasWbsErrors = true; }
    if (!wbsEnd) { newWbsErrors.wbsEnd = 'End Date is required.'; hasWbsErrors = true; }
    if (wbsStart && wbsEnd && wbsEnd < wbsStart) { newWbsErrors.wbsEnd = 'End Date cannot be before Start Date.'; hasWbsErrors = true; }
    if (!wbsHours) { newWbsErrors.wbsHours = 'Total Hours is required.'; hasWbsErrors = true; }
    else if (parseFloat(wbsHours) <= 0) { newWbsErrors.wbsHours = 'Total Hours must be greater than 0.'; hasWbsErrors = true; }

    if (hasWbsErrors) {
      setWbsErrors(newWbsErrors);
      return;
    }

    // Find if it matches a master WBS (to get wbs_id)
    const master = masterWbsList.find(m => m.wbs_name.toLowerCase() === wbsName.toLowerCase() || m.wbs_code === wbsName);
    const wbsId = master ? master.id : undefined;
    const finalName = master ? master.wbs_name : wbsName;
    const finalCode = master ? master.wbs_code : '-';

    setWbsAllocations([...wbsAllocations, {
      id: Date.now(),
      wbs_id: wbsId,
      wbs_name: finalName,
      wbs_code: finalCode,
      start_date: wbsStart,
      end_date: wbsEnd,
      total_hours: parseFloat(wbsHours) || 0
    }]);
    setWbsName('');
    setWbsStart('');
    setWbsEnd('');
    setWbsHours('');
    setWbsErrors({});
    showSuccess('WBS added successfully.');
  };

  const handleRemoveWbs = (id: number) => {
    // If it's an existing allocation (id is a small integer, not Date.now())
    if (projectId && id < 1000000000000) {
      setDeletingWbsIndex(id);
      setIsWbsDeleteModalOpen(true);
    } else {
      setWbsAllocations(wbsAllocations.filter((d: any) => d.id !== id));
      showSuccess('WBS removed successfully.');
    }
  };

  const confirmDeleteWbs = () => {
    if (deletingWbsIndex !== null) {
      setWbsAllocations(wbsAllocations.filter((d: any) => d.id !== deletingWbsIndex));
      setIsWbsDeleteModalOpen(false);
      setDeletingWbsIndex(null);
      showSuccess('WBS allocation removed. Save project to apply changes.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    const payload: any = {
      project_name: projectName,
      project_address: projectAddress,
      client_name: clientName,
      client_code: clientCode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius_meters: radiusMeters,
      project_date: projectDate,
      status,
      note,
      wbs_allocations: wbsAllocations.length > 0 ? wbsAllocations.map((w: any) => ({ ...w, total_hours: parseFloat(w.total_hours) || 0 })) : undefined
    };

    if (projectId) {
      const res = await apiRequest(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Project updated successfully.');
        onBack();
      } else {
        if (res.errors && res.errors.length > 0) {
          setFormErrors(parseApiErrors(res.errors));
        }
        showError(res.message || 'Failed to update project.');
      }
    } else {
      payload.project_code = projectCode;
      const res = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Project created successfully.');
        onBack();
      } else {
        if (res.errors && res.errors.length > 0) {
          setFormErrors(parseApiErrors(res.errors));
        }
        showError(res.message || 'Failed to create project.');
      }
    }
    setIsSubmitting(false);
  };

  if (isLoadingProject) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">{projectId ? 'Master / Edit Project' : 'Master / Add Project'}</h1>
          <p className="page-subtitle">Configure project details, location boundaries, and task disciplines</p>
        </div>
        <button onClick={onBack} style={{ background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 1rem', borderRadius: '8px', gap: '0.5rem', border: '1px solid var(--border-color)' }} className="hover-bg">
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <form noValidate onSubmit={handleSubmit} className="grid-auto" style={{ alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Project Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>Project Form</h3>
          
          <FormInput label="Project Code" type="text" value={projectCode} onChange={e => { setProjectCode(e.target.value); setFormErrors(prev => ({...prev, project_code: ''})); }} required disabled={!!project} error={formErrors.project_code} />
          <FormInput label="Project Name" type="text" value={projectName} onChange={e => { setProjectName(e.target.value); setFormErrors(prev => ({...prev, project_name: ''})); }} required error={formErrors.project_name} />
          
          <div className="form-group">
            <label className="form-label">Project Address <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea className={`form-input ${formErrors.project_address ? 'invalid-input' : ''}`} rows={3} value={projectAddress} onChange={e => { setProjectAddress(e.target.value); setFormErrors(prev => ({...prev, project_address: ''})); }} placeholder="Full site address..." />
            {formErrors.project_address && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{formErrors.project_address}</span>}
          </div>

          <FormInput label="Project Radius (meters)" type="number" value={radiusMeters} onChange={e => { setRadiusMeters(parseInt(e.target.value) || 500); setFormErrors(prev => ({...prev, radius_meters: ''})); }} required error={formErrors.radius_meters} />
          <FormInput label="Project Date" type="date" value={projectDate} onChange={e => { setProjectDate(e.target.value); setFormErrors(prev => ({...prev, project_date: ''})); }} required error={formErrors.project_date} />
          
          <div className="grid-2-col">
            <FormInput label="Client Code" type="text" value={clientCode} onChange={e => { setClientCode(e.target.value); setFormErrors(prev => ({...prev, client_code: ''})); }} required error={formErrors.client_code} />
            <FormInput label="Client Name" type="text" value={clientName} onChange={e => { setClientName(e.target.value); setFormErrors(prev => ({...prev, client_name: ''})); }} required error={formErrors.client_name} />
          </div>

          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <FormSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <Button type="submit" variant="primary" style={{ marginTop: '1rem', width: '100%' }} disabled={isSubmitting}>
            <Save size={18} style={{ marginRight: '0.5rem' }} /> {isSubmitting ? 'Saving...' : 'Submit Project'}
          </Button>
        </div>

        {/* RIGHT COLUMN: Map & Disciplines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Map Area */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--accent-primary)" /> Project Location
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Drag project location / search project location (OpenStreetMap integration preview)</p>
            
            {/* Interactive Map (OpenStreetMap) */}
            <div style={{ width: '100%', height: '300px', background: '#1e293b', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
               <MapContainer 
                 center={[parseFloat(latitude) || 18.5204, parseFloat(longitude) || 73.8567]} 
                 zoom={13} 
                 style={{ height: '100%', width: '100%' }}
                 scrollWheelZoom={true}
               >
                 <TileLayer
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 />
                 <LocationMarker 
                   position={{ lat: parseFloat(latitude) || 18.5204, lng: parseFloat(longitude) || 73.8567 }}
                   setPosition={(pos) => {
                     setLatitude(pos.lat.toFixed(6));
                     setLongitude(pos.lng.toFixed(6));
                   }} 
                 />
               </MapContainer>
            </div>

            <div className="grid-2-col" style={{ marginTop: '1rem' }}>
              <FormInput label="Latitude" type="number" step="any" value={latitude} onChange={e => { setLatitude(e.target.value); setFormErrors(prev => ({...prev, latitude: ''})); }} required error={formErrors.latitude} />
              <FormInput label="Longitude" type="number" step="any" value={longitude} onChange={e => { setLongitude(e.target.value); setFormErrors(prev => ({...prev, longitude: ''})); }} required error={formErrors.longitude} />
            </div>
          </div>

          {/* Work Breakdown Structure (WBS) */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Work Breakdown Structure (WBS)</h3>
            
            <div className="grid-2-col" style={{ marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">WBS Name / Code <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  className={`form-input ${wbsErrors.wbsName ? 'invalid-input' : ''}`}
                  list="wbs-master-list"
                  value={wbsName} 
                  onChange={e => { setWbsName(e.target.value); setWbsErrors(prev => ({...prev, wbsName: ''})); }} 
                  placeholder="e.g. Electrical Installation or WBS-01" 
                />
                {wbsErrors.wbsName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{wbsErrors.wbsName}</span>}
                <datalist id="wbs-master-list">
                  {masterWbsList.map(w => (
                    <option key={w.id} value={w.wbs_name}>{w.wbs_code}</option>
                  ))}
                </datalist>
              </div>
              <FormInput label="Start Date" type="date" value={wbsStart} onChange={e => { setWbsStart(e.target.value); setWbsErrors(prev => ({...prev, wbsStart: '', wbsEnd: ''})); }} required error={wbsErrors.wbsStart} />
              <FormInput label="End Date" type="date" value={wbsEnd} onChange={e => { setWbsEnd(e.target.value); setWbsErrors(prev => ({...prev, wbsEnd: ''})); }} required error={wbsErrors.wbsEnd} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <FormInput label="Total Hours" type="number" value={wbsHours} onChange={e => { setWbsHours(e.target.value); setWbsErrors(prev => ({...prev, wbsHours: ''})); }} required error={wbsErrors.wbsHours} />
                </div>
                <Button type="button" variant="primary" onClick={handleAddWbs} style={{ height: '42px', padding: '0 1.5rem', marginTop: '1.6rem' }}>
                  <Plus size={18} /> Add WBS
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>WBS Code</th>
                    <th>WBS Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Hrs.</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wbsAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No WBS allocated yet</td>
                    </tr>
                  ) : (
                    wbsAllocations.map((w, index) => (
                      <tr key={w.id}>
                        <td>{index + 1}</td>
                        <td>{w.wbs_code || '-'}</td>
                        <td>{w.wbs_name}</td>
                        <td>{w.start_date || '-'}</td>
                        <td>{w.end_date || '-'}</td>
                        <td>{w.total_hours}</td>
                        <td>
                          <button type="button" onClick={() => handleRemoveWbs(w.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
