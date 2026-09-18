import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

export interface TaskOption {
  id: number;
  name: string;
  project_id?: number;
  wbs_id?: number;
}

interface TaskComboboxProps {
  projectId: number | string;
  wbsId?: number | string;
  selectedTaskId: number | string;
  tasks: TaskOption[];
  onSelectTask: (task: TaskOption | null) => void;
  onTaskCreated?: (newTask: TaskOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
}

export const TaskCombobox: React.FC<TaskComboboxProps> = ({
  projectId,
  wbsId,
  selectedTaskId,
  tasks,
  onSelectTask,
  onTaskCreated,
  placeholder = '-- Choose or Search Task --',
  disabled = false,
  required = false,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find((t) => Number(t.id) === Number(selectedTaskId));
      if (found) setSearchTerm(found.name);
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [selectedTaskId, tasks, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedTaskId) {
          const found = tasks.find((t) => Number(t.id) === Number(selectedTaskId));
          setSearchTerm(found ? found.name : '');
        } else {
          setSearchTerm('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTaskId, tasks]);

  const filteredTasks = React.useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const term = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => t.name.toLowerCase().includes(term));
  }, [tasks, searchTerm]);

  const exactMatchExists = React.useMemo(() => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.trim().toLowerCase();
    return tasks.some((t) => t.name.trim().toLowerCase() === term);
  }, [tasks, searchTerm]);

  const handleSelect = (task: TaskOption) => {
    onSelectTask(task);
    setSearchTerm(task.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTask(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCreateNewTask = async () => {
    const taskName = searchTerm.trim();
    if (!taskName) return;
    if (!projectId) {
      showError('Please select a project before creating a new task');
      return;
    }

    setIsCreating(true);
    try {
      const payload: any = {
        project_id: Number(projectId),
        task_name: taskName,
        required_worker_count: 1,
        estimated_hours: 0,
        status: 'in-progress',
      };
      if (wbsId) payload.wbs_id = Number(wbsId);

      const res = await apiService.post<any>('/tasks', payload);
      if (res.success && res.data) {
        const newTask: TaskOption = {
          id: res.data.task_id,
          name: res.data.task_name,
          project_id: res.data.project_id,
          wbs_id: res.data.wbs_id,
        };
        showSuccess(`Task "${taskName}" created successfully`);
        if (onTaskCreated) onTaskCreated(newTask);
        onSelectTask(newTask);
        setSearchTerm(newTask.name);
        setIsOpen(false);
      } else {
        showError(res.message || 'Failed to create new task');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create new task');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="text"
          disabled={disabled}
          required={required && !selectedTaskId}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen && !disabled) setIsOpen(true);
          }}
          className="form-input"
          style={{
            paddingLeft: '36px',
            paddingRight: selectedTaskId ? '54px' : '32px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            width: '100%',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {selectedTaskId && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{ position: 'absolute', right: '28px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
            title="Clear task"
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown
          size={16}
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          style={{ position: 'absolute', right: '10px', color: 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
        />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            zIndex: 999,
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            maxHeight: '240px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t) => {
              const isSelected = Number(t.id) === Number(selectedTaskId);
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    color: isSelected ? '#6366f1' : 'var(--text-color, #1e293b)',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span>{t.name}</span>
                  {isSelected && <Check size={14} style={{ color: '#6366f1' }} />}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No existing tasks match "{searchTerm}"
            </div>
          )}

          {searchTerm.trim() !== '' && !exactMatchExists && (
            <div
              onClick={isCreating ? undefined : handleCreateNewTask}
              style={{
                marginTop: '4px',
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.08)',
                cursor: isCreating ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating task...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>+ Add New Task: "{searchTerm.trim()}"</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};