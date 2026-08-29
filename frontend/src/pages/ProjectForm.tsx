import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { ArrowLeft, MapPin, Plus, Trash2, Save } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiRequest } from '../services/api';
import { Project } from '../types';

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
  project?: Project | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onBack, onSuccess }) => {
  // Main Form State
  const [projectCode, setProjectCode] = useState(project?.project_code || `PRJ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
  const [projectName, setProjectName] = useState(project?.project_name || '');
  const [projectAddress, setProjectAddress] = useState(project?.project_address || '');
  const [radiusMeters, setRadiusMeters] = useState<number>(project?.radius_meters || 500);
  const [projectDate, setProjectDate] = useState(project?.project_date || new Date().toISOString().split('T')[0]);
  const [clientCode, setClientCode] = useState(project?.client_code || '');
  const [clientName, setClientName] = useState(project?.client_name || '');
  const [note, setNote] = useState(project?.note || '');
  const [status, setStatus] = useState(project?.status || 'active');

  // Map / Location State
  const [latitude, setLatitude] = useState<string>(project?.latitude ? String(project?.latitude) : '18.5204');
  const [longitude, setLongitude] = useState<string>(project?.longitude ? String(project?.longitude) : '73.8567');

  // Disciplines (Tasks) State
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [discName, setDiscName] = useState('');
  const [discStart, setDiscStart] = useState('');
  const [discEnd, setDiscEnd] = useState('');
  const [discHours, setDiscHours] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDiscipline = () => {
    if (!discName) return;
    setDisciplines([...disciplines, {
      id: Date.now(),
      task_name: discName,
      start_date: discStart,
      target_date: discEnd,
      estimated_hours: parseFloat(discHours) || 0
    }]);
    setDiscName('');
    setDiscStart('');
    setDiscEnd('');
    setDiscHours('');
  };

  const handleRemoveDiscipline = (id: number) => {
    setDisciplines(disciplines.filter(d => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      disciplines: disciplines.length > 0 ? disciplines : undefined
    };

    if (project) {
      const res = await apiRequest(`/projects/${project.project_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) onSuccess();
      else setError(res.message || 'Failed to update project');
    } else {
      payload.project_code = projectCode;
      const res = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) onSuccess();
      else setError(res.message || 'Failed to create project');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%' }} className="hover-bg">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="page-title">{project ? 'Edit Project' : 'Master / Add Project'}</h1>
          <p className="page-subtitle">Configure project details, location boundaries, and task disciplines</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Project Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>Project Form</h3>
          
          <FormInput label="Project Code" type="text" value={projectCode} onChange={e => setProjectCode(e.target.value)} required disabled={!!project} />
          <FormInput label="Project Name" type="text" value={projectName} onChange={e => setProjectName(e.target.value)} required />
          
          <div className="form-group">
            <label className="form-label">Project Address</label>
            <textarea className="form-input" rows={3} value={projectAddress} onChange={e => setProjectAddress(e.target.value)} placeholder="Full site address..." />
          </div>

          <FormInput label="Project Radius (meters)" type="number" value={radiusMeters} onChange={e => setRadiusMeters(parseInt(e.target.value) || 500)} required />
          <FormInput label="Project Date" type="date" value={projectDate} onChange={e => setProjectDate(e.target.value)} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Client Code" type="text" value={clientCode} onChange={e => setClientCode(e.target.value)} />
            <FormInput label="Client Name" type="text" value={clientName} onChange={e => setClientName(e.target.value)} />
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <FormInput label="Latitude" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
              <FormInput label="Longitude" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
            </div>
          </div>

          {/* Allocate Disciplines */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Allocate Disciplines</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormInput label="Discipline Name" type="text" value={discName} onChange={e => setDiscName(e.target.value)} placeholder="e.g. Electrical Installation" />
              </div>
              <FormInput label="Start Date" type="date" value={discStart} onChange={e => setDiscStart(e.target.value)} />
              <FormInput label="End Date" type="date" value={discEnd} onChange={e => setDiscEnd(e.target.value)} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <FormInput label="Total Hours" type="number" value={discHours} onChange={e => setDiscHours(e.target.value)} />
                </div>
                <Button type="button" variant="primary" onClick={handleAddDiscipline} style={{ height: '42px', padding: '0 1.5rem' }}>
                  <Plus size={18} /> Add
                </Button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Discipline Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Hrs.</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplines.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No disciplines allocated yet</td>
                    </tr>
                  ) : (
                    disciplines.map((d, index) => (
                      <tr key={d.id}>
                        <td>{index + 1}</td>
                        <td>{d.task_name}</td>
                        <td>{d.start_date || '-'}</td>
                        <td>{d.target_date || '-'}</td>
                        <td>{d.estimated_hours}</td>
                        <td>
                          <button type="button" onClick={() => handleRemoveDiscipline(d.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
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
