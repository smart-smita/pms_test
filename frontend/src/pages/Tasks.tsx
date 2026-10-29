import { useWorkCategory } from '../context/WorkCategoryContext';
import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiRequest, parseApiErrors, apiService } from '../services/api';
import { Task, Project, Employee } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, RefreshCw, Eye, Calendar, Filter, RotateCcw, Package, AlertTriangle, FileText, Clock, ExternalLink, MapPin } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/common/ConfirmDeleteModal';
import { RequirePermission } from '../components/common/RequirePermission';
import { LogHistoryModal } from '../components/common/LogHistoryModal';
import { LabourCombobox } from '../components/common/LabourCombobox';
import { EmployeeMultiSelect } from '../components/common/EmployeeMultiSelect';

const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Tasks: React.FC<{ projectId?: number; onNavigate?: (page: string) => void }> = ({ projectId: propProjectId, onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'Admin';
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Manager';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectWbs, setProjectWbs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [materialsMaster, setMaterialsMaster] = useState<any[]>([]);
  const { isMaterialEnabled, isLabourEnabled } = useWorkCategory();
  const [isLoading, setIsLoading] = useState(true);

  // Cascading Filter State
  const [filterProjectId, setFilterProjectId] = useState<number>(propProjectId || 0);
  const [filterWbsId, setFilterWbsId] = useState<number>(0);
  const [filterDisciplines, setFilterDisciplines] = useState<any[]>([]);

  // Task Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isLoadingTaskDetails, setIsLoadingTaskDetails] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Task Form State
  const [projectId, setProjectId] = useState<number>(0);
  const [wbsId, setWbsId] = useState<number>(0);
  const [taskCode, setTaskCode] = useState('');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [workerCount, setWorkerCount] = useState<number | string>(1);
  const [workingHours, setWorkingHours] = useState<number | string>(0);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [taskAddress, setTaskAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dependencies, setDependencies] = useState<{predecessor_task_id: number, dependency_type: string, lag_days?: number}[]>([]);
  const [usedMaterials, setUsedMaterials] = useState<any[]>([]);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [materialForm, setMaterialForm] = useState({
    material_id: '',
    material_name: '',
    quantity: '',
    unit: 'Nos',
    rate: '',
    used_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const resetMaterialForm = () => {
    setMaterialForm({
      material_id: '',
      material_name: '',
      quantity: '',
      unit: 'Nos',
      rate: '',
      used_date: startDate || new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingMaterialIndex(null);
  };

  const handleMaterialSelect = (val: string) => {
    const matched = materialsMaster.find(
      (m: any) => m.material_name.toLowerCase() === val.trim().toLowerCase() || String(m.material_id) === val
    );
    if (matched) {
      setMaterialForm(prev => ({
        ...prev,
        material_name: matched.material_name,
        material_id: String(matched.material_id),
        unit: matched.unit || prev.unit || 'Nos',
        rate: String(matched.billing_rate ?? matched.rate ?? matched.purchase_rate ?? prev.rate ?? ''),
      }));
    } else {
      setMaterialForm(prev => ({
        ...prev,
        material_name: val,
        material_id: '',
      }));
    }
  };

  const selectedMasterMaterial = materialsMaster.find(
    (m: any) => (materialForm.material_id && String(m.material_id) === String(materialForm.material_id)) ||
                (materialForm.material_name && m.material_name.toLowerCase() === materialForm.material_name.trim().toLowerCase())
  );

  // Auto-calculate Worker Count based on allocated labour workers count
  useEffect(() => {
    if (isModalOpen) {
      setWorkerCount(allocations.length > 0 ? allocations.length : 1);
    }
  }, [allocations, isModalOpen]);

  // Status State
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed' | 'delayed' | 'on-hold' | 'cancelled'>('pending');
  const [statusUpdatingId, setStatusUpdatingId] = useState<number>(0);

  // Log History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);

  // Log Timesheet Modal State
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [timesheetTask, setTimesheetTask] = useState<Task | null>(null);
  const [timesheetForm, setTimesheetForm] = useState({
    employee_id: user?.employee_id || (user as any)?.id || '',
    log_date: new Date().toISOString().split('T')[0],
    working_hours: '',
    comment: '',
  });
  const [isLoggingTimesheet, setIsLoggingTimesheet] = useState(false);

  // Labour Creation Modal State
  const [isCreateLabourModalOpen, setIsCreateLabourModalOpen] = useState(false);
  const [createLabourForm, setCreateLabourForm] = useState({
    name: '',
    contact_number: '',
    aadhar_id: '',
    labour_type: 'direct_labour' as 'direct_labour' | 'contractor'
  });

  // Labour Allocation Form State
  const [allocationForm, setAllocationForm] = useState<{
    work_log_id?: number;
    work_date: string;
    labour_id: string;
    amount: string;
    payment_status: string;
    work_description: string;
  }>({
    work_date: '',
    labour_id: '',
    amount: '',
    payment_status: 'paid',
    work_description: ''
  });
  const [editingAllocIndex, setEditingAllocIndex] = useState<number | null>(null);

  const resetAllocationForm = () => {
    setAllocationForm({
      work_log_id: undefined,
      work_date: startDate || new Date().toISOString().split('T')[0],
      labour_id: '',
      amount: '',
      payment_status: 'paid',
      work_description: ''
    });
    setEditingAllocIndex(null);
  };

  // Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected project & currency
  const selectedProject = projects.find(p => Number(p.project_id) === Number(projectId));
  const currencySymbol = (selectedProject as any)?.currency_symbol || (selectedProject as any)?.symbol || '₹';

  // WBS dependency validation checks
  const selectedWbs = projectWbs.find(w => Number(w.id) === Number(wbsId) || Number(w.wbs_id) === Number(wbsId));
  const wbsTotalHours = Number(selectedWbs?.total_hours || selectedWbs?.planned_hours || 0);
  const wbsBudgetAmount = Number(selectedWbs?.budget_amount || selectedWbs?.planned_cost || 0);
  const wbsPlannedQty = Number(selectedWbs?.planned_quantity || 0);

  const parsedWorkingHours = Number(workingHours) || 0;
  const isHoursExceeded = wbsTotalHours > 0 && parsedWorkingHours > wbsTotalHours;

  const totalLabourCost = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalMaterialCost = usedMaterials.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const totalTaskCost = totalLabourCost + totalMaterialCost;
  const isCostExceeded = wbsBudgetAmount > 0 && totalTaskCost > wbsBudgetAmount;

  const totalMaterialQty = usedMaterials.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const isQtyExceeded = wbsPlannedQty > 0 && totalMaterialQty > wbsPlannedQty;

  const fetchData = async () => {
    setIsLoading(true);
    const promises: Promise<any>[] = [
      apiRequest<Task[]>('/tasks'),
      apiRequest<Project[]>('/projects'),
      apiRequest<Employee[]>('/employees'),
      apiRequest<any[]>('/labours'),
      apiRequest<any[]>('/materials/master'),
    ];

    const [tRes, pRes, eRes, lRes, matRes] = await Promise.all(promises);

    if (tRes.success && tRes.data) setTasks(tRes.data);
    if (pRes?.success && pRes.data) setProjects(pRes.data);
    if (eRes?.success && eRes.data) setEmployees(eRes.data.filter((e: Employee) => e.status === 'active'));
    if (lRes?.success && lRes.data) setLabours(lRes.data);
    if (matRes?.success && matRes.data) setMaterialsMaster(matRes.data);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync propProjectId if provided from tab or routing
  useEffect(() => {
    if (propProjectId !== undefined) {
      setFilterProjectId(propProjectId);
      if (propProjectId) {
        setProjectId(propProjectId);
      }
    }
  }, [propProjectId]);

  // Cascading Disciplines fetch for top filter
  useEffect(() => {
    if (filterProjectId) {
      apiService.get<any[]>(`/projects/${filterProjectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setFilterDisciplines(res.data);
        } else {
          setFilterDisciplines([]);
        }
      });
    } else {
      setFilterDisciplines([]);
      setFilterWbsId(0);
    }
  }, [filterProjectId]);

  // Form WBS fetch (all WBS types)
  useEffect(() => {
    if (projectId) {
      apiRequest<any[]>(`/projects/${projectId}/wbs`).then((res) => {
        if (res.success && res.data) {
          setProjectWbs(res.data);
          if (!wbsId && res.data.length > 0) {
            setWbsId(res.data[0].id);
          }
        } else {
          setProjectWbs([]);
        }
      });
    } else {
      setProjectWbs([]);
    }
  }, [projectId]);

  const openCreateModal = () => {
    setEditingTask(null);
    setProjectId(propProjectId || projects[0]?.project_id || 0);
    setWbsId(0);
    setTaskCode(`TSK-${String(Date.now()).slice(-4)}`);
    setAssignedEmployeeIds(user?.employee_id ? [String(user.employee_id)] : []);
    setAllocations([]);
    setUsedMaterials([]);
    resetMaterialForm();
    setTaskName('');
    setDescription('');
    setWorkerCount(1);
    setWorkingHours(8);
    const today = getTodayStr();
    setStartDate(today);
    setStartTime('09:00');
    setTargetDate(today);
    setTargetTime('18:00');
    setPriority('medium');
    setProgressPercentage(0);
    setTaskAddress('');
    setLatitude('');
    setLongitude('');
    setDependencies([]);
    setStatus('pending');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = async (t: Task) => {
    setEditingTask(t);
    setProjectId(t.project_id);
    setWbsId(t.wbs_id || 0);
    
    // Support multiple employees (initial fast populate from row)
    if ((t as any).assigned_employees && Array.isArray((t as any).assigned_employees)) {
      setAssignedEmployeeIds((t as any).assigned_employees.map((e: any) => String(e.employee_id)));
    } else if (t.assigned_employee_id) {
      setAssignedEmployeeIds([String(t.assigned_employee_id)]);
    } else {
      setAssignedEmployeeIds([]);
    }
    
    setAllocations([]);
    const initialUsedMaterials = (t as any).used_materials || (t as any).materials || [];
    setUsedMaterials(Array.isArray(initialUsedMaterials) ? initialUsedMaterials : []);
    resetMaterialForm();

    // Fetch fresh complete task details from backend to ensure all assignments and materials are up to date
    apiRequest<any>(`/tasks/${t.task_id}`).then(res => {
      if (res.success && res.data) {
        const fresh = res.data;
        if (fresh.assigned_employees && Array.isArray(fresh.assigned_employees)) {
          setAssignedEmployeeIds(fresh.assigned_employees.map((e: any) => String(e.employee_id)));
        }
        const freshMats = fresh.used_materials || fresh.materials;
        if (Array.isArray(freshMats)) {
          setUsedMaterials(freshMats);
        }
        if (fresh.allocations && Array.isArray(fresh.allocations) && fresh.allocations.length > 0) {
          setAllocations(fresh.allocations.map((a: any) => ({
            work_log_id: a.work_log_id,
            labour_id: a.labour_id || '',
            work_date: a.work_date ? a.work_date.split('T')[0] : '',
            amount: a.amount || '',
            work_description: a.work_description || '',
            payment_status: a.payment_status?.toLowerCase() || 'pending',
          })));
        }
      }
    }).catch(console.error);

    apiService.get<any[]>(`/tasks/${t.task_id}/allocations`).then(res => {
      if (res.success && res.data) {
        const task = t;
        setAllocations(
          task.allocations?.map((a: any) => ({
            work_log_id: a.work_log_id,
            labour_id: a.labour_id || '',
            work_date: a.work_date ? a.work_date.split('T')[0] : '',
            amount: a.amount || '',
            work_description: a.work_description || '',
            payment_status: a.payment_status?.toLowerCase() || 'pending',
          })) || res.data.map((a: any) => ({
            work_log_id: a.work_log_id,
            labour_id: a.labour_id || '',
            work_date: a.work_date ? a.work_date.split('T')[0] : '',
            amount: a.amount || '',
            work_description: a.work_description || '',
            payment_status: a.payment_status?.toLowerCase() || 'pending',
          })) || []
        );
        resetAllocationForm();
      }
    }).catch(console.error);

    apiService.get<any[]>(`/tasks/${t.task_id}/dependencies`).then(res => {
      if (res.success && res.data) {
        setDependencies(res.data.map((d: any) => ({
          predecessor_task_id: d.predecessor_task_id,
          dependency_type: d.dependency_type || 'FS',
          lag_days: d.lag_days || 0
        })));
      } else {
        setDependencies([]);
      }
    }).catch(console.error);

    setTaskCode(t.task_code || '');
    setTaskName(t.task_name);
    setDescription(t.description || '');
    setWorkerCount(t.required_worker_count);
    setWorkingHours(Number(t.estimated_hours));
    setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
    setStartTime(t.start_time || '');
    setTargetDate(t.target_date ? t.target_date.split('T')[0] : '');
    setTargetTime(t.target_time || '');
    setPriority((t as any).priority || 'medium');
    setProgressPercentage(t.progress_percentage || 0);
    setTaskAddress((t as any).task_address || '');
    setLatitude((t as any).latitude || '');
    setLongitude((t as any).longitude || '');
    setStatus(t.status as any);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openStatusModal = (t: Task) => {
    setEditingTask(t);
    setStatusUpdatingId(t.task_id);
    setStatus(t.status as any);
    setIsStatusModalOpen(true);
  };

  const openViewLogs = (t: Task) => {
    setHistoryTaskId(t.task_id);
    setIsHistoryModalOpen(true);
  };

  const openViewDetails = async (t: Task) => {
    setViewingTask(t);
    setIsViewDetailsOpen(true);
    setIsLoadingTaskDetails(true);
    try {
      const res = await apiRequest<Task>(`/tasks/${t.task_id}`);
      if (res.success && res.data) {
        setViewingTask(res.data);
      }
    } catch (err) {
      console.error('Failed to load full task details:', err);
    } finally {
      setIsLoadingTaskDetails(false);
    }
  };

  const openLogTimesheetModal = (t: Task) => {
    setTimesheetTask(t);
    setTimesheetForm({
      employee_id: user?.employee_id || (user as any)?.id || (employees[0]?.employee_id || ''),
      log_date: new Date().toISOString().split('T')[0],
      working_hours: '',
      comment: '',
    });
    setIsTimesheetModalOpen(true);
  };

  const handleSaveTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timesheetTask) return;
    if (!timesheetForm.employee_id) {
      showError('Please select an employee');
      return;
    }
    const hrs = Number(timesheetForm.working_hours);
    if (!hrs || hrs <= 0) {
      showError('Please enter valid work hours greater than 0');
      return;
    }

    const today = getTodayStr();
    if (timesheetForm.log_date && timesheetForm.log_date < today) {
      showError('Log date cannot be a past date');
      return;
    }

    setIsLoggingTimesheet(true);
    try {
      const res = await apiService.post('/timesheets', {
        project_id: timesheetTask.project_id,
        wbs_id: timesheetTask.wbs_id || null,
        task_id: timesheetTask.task_id,
        employee_id: Number(timesheetForm.employee_id),
        log_date: timesheetForm.log_date,
        working_hours: hrs,
        comment: timesheetForm.comment || null,
      });

      if (res.success) {
        showSuccess('Timesheet logged successfully for task');
        setIsTimesheetModalOpen(false);
        setTimesheetTask(null);
        fetchData();
      } else {
        showError(res.message || 'Failed to log timesheet');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to log timesheet');
    } finally {
      setIsLoggingTimesheet(false);
    }
  };

  const handleInitiateCreateLabour = (name: string, type: 'direct_labour' | 'contractor') => {
    setCreateLabourForm({ name, labour_type: type, contact_number: '', aadhar_id: '' });
    setIsCreateLabourModalOpen(true);
  };

  const handleCreateLabourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLabourForm.name.trim() || !createLabourForm.contact_number.trim()) {
      showError('Name and Contact Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiService.post<any>('/labours', {
        ...createLabourForm,
        status: 'active'
      });
      if (res.success && res.data) {
        showSuccess('Labour created successfully.');
        const newLabour = {
          labour_id: res.data.labour_id,
          name: res.data.name,
          labour_type: res.data.labour_type,
          sub_worker_count: 0
        };
        setLabours([...labours, newLabour]);
        setAllocationForm({ ...allocationForm, labour_id: String(newLabour.labour_id) });
        setIsCreateLabourModalOpen(false);
      } else {
        showError(res.message || 'Failed to create labour.');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterial = () => {
    if (!materialForm.material_name.trim()) {
      showError('Please select or enter a material name.');
      return;
    }
    const qty = Number(materialForm.quantity || 0);
    if (qty <= 0) {
      showError('Please enter a valid material quantity greater than 0.');
      return;
    }

    // Material availability validation
    if (selectedMasterMaterial) {
      const availStock = Number(selectedMasterMaterial.available_stock || 0);
      if (availStock <= 0) {
        showError(`Material "${selectedMasterMaterial.material_name}" is currently out of stock (Available: 0 ${selectedMasterMaterial.unit || 'Nos'}). Cannot add to task.`);
        return;
      }
      if (qty > availStock) {
        showError(`Requested quantity (${qty}) exceeds available stock (${availStock} ${selectedMasterMaterial.unit || 'Nos'}).`);
        return;
      }
    }

    // Material used date validation against task start & target dates
    if (startDate && materialForm.used_date && materialForm.used_date < startDate) {
      showError(`Material used date (${materialForm.used_date}) cannot be earlier than task start date (${startDate}).`);
      return;
    }
    if (targetDate && materialForm.used_date && materialForm.used_date > targetDate) {
      showError(`Material used date (${materialForm.used_date}) cannot be later than task end date (${targetDate}).`);
      return;
    }

    const rt = Number(materialForm.rate || 0);
    const amt = qty * rt;
    const materialEntry = {
      material_id: materialForm.material_id ? Number(materialForm.material_id) : undefined,
      material_name: materialForm.material_name.trim(),
      used_date: materialForm.used_date,
      quantity: qty,
      unit: materialForm.unit || 'Nos',
      rate: rt,
      amount: amt,
      notes: materialForm.notes || '',
    };

    if (editingMaterialIndex !== null) {
      const next = [...usedMaterials];
      next[editingMaterialIndex] = materialEntry;
      setUsedMaterials(next);
      showSuccess('Material updated successfully.');
    } else {
      setUsedMaterials([...usedMaterials, materialEntry]);
      showSuccess('Material added.');
    }

    resetMaterialForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Manual frontend date/time validation
    const today = getTodayStr();
    if (!editingTask && startDate && startDate < today) {
      setFormErrors({ start_date: 'Start date cannot be a past date.' });
      return;
    }
    if (!editingTask && targetDate && targetDate < today) {
      setFormErrors({ target_date: 'End date cannot be a past date.' });
      return;
    }
    if (startDate && targetDate) {
      if (targetDate < startDate) {
        setFormErrors({ target_date: 'End date cannot be earlier than start date.' });
        return;
      }
      const startDateTime = new Date(`${startDate}T${startTime || '00:00:00'}`);
      const endDateTime = new Date(`${targetDate}T${targetTime || '23:59:59'}`);
      if (endDateTime < startDateTime) {
        setFormErrors({ target_date: 'End date/time cannot be earlier than start date/time.' });
        return;
      }
    }

    if (!projectId || !wbsId) {
      setFormErrors({ project_id: !projectId ? 'Required' : '', wbs_id: !wbsId ? 'Required' : '' });
      return;
    }

    const sanitizedEmployeeIds = assignedEmployeeIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id > 0);

    if (sanitizedEmployeeIds.length === 0 && allocations.length === 0) {
      setFormErrors({ assigned_employee_ids: 'Please select an employee or add a labour allocation.' });
      return;
    }

    setIsSubmitting(true);
    const parsedWorkerCount = typeof workerCount === 'string' ? parseInt(workerCount, 10) || 1 : workerCount;
    const finalWorkerCount = Math.max(parsedWorkerCount, sanitizedEmployeeIds.length, 1);

    const payload: any = {
      project_id: projectId,
      wbs_id: wbsId,
      task_code: taskCode,
      task_name: taskName,
      description,
      required_worker_count: finalWorkerCount,
      estimated_hours: typeof workingHours === 'string' ? parseFloat(workingHours) || 0 : workingHours,
      start_date: startDate || undefined,
      start_time: startTime || undefined,
      target_date: targetDate || undefined,
      target_time: targetTime || undefined,
      status,
      priority,
      progress_percentage: progressPercentage,
      assigned_employee_ids: sanitizedEmployeeIds,
      allocations: allocations.map(a => ({
        ...a,
        labour_id: typeof a.labour_id === 'string' ? parseInt(a.labour_id, 10) || 0 : a.labour_id,
        amount: typeof a.amount === 'string' ? parseFloat(a.amount) || 0 : a.amount
      })),
      task_address: taskAddress,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      used_materials: usedMaterials,
      dependencies: dependencies
    };

    if (editingTask) {
      const res = await apiRequest(`/tasks/${editingTask.task_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Task updated successfully.');
        setIsModalOpen(false);
        fetchData();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to update task.');
      }
    } else {
      const res = await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        showSuccess('Task created successfully.');
        setIsModalOpen(false);
        fetchData();
      } else {
        if (res.errors) setFormErrors(parseApiErrors(res.errors));
        showError(res.message || 'Failed to create task.');
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: number, name: string) => {
    setDeletingTask({ id, name });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    const res = await apiRequest(`/tasks/${deletingTask.id}`, { method: 'DELETE' });
    setIsDeleting(false);
    if (res.success) {
      showSuccess('Task deleted successfully.');
      setIsDeleteModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to delete task.');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdatingId) return;

    setIsSubmitting(true);
    const res = await apiRequest(`/tasks/${statusUpdatingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      showSuccess('Task status updated successfully.');
      setIsStatusModalOpen(false);
      fetchData();
    } else {
      showError(res.message || 'Failed to update task status.');
    }
    setIsSubmitting(false);
  };

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr).toLocaleDateString();
    if (timeStr) return `${d} ${timeStr}`;
    return d;
  };

  // Filter tasks based on selected Project & Discipline
  const filteredTasks = tasks.filter((t) => {
    if (filterProjectId && t.project_id !== filterProjectId) return false;
    if (filterWbsId && t.wbs_id !== filterWbsId) return false;
    return true;
  });

  const columns: Column<Task>[] = [
    { header: 'Project', accessor: (r) => r.project_name || '-', sortKey: 'project_name' },
    { header: 'WBS / Discipline', accessor: (r) => r.wbs_name || '-', sortKey: 'wbs_name' },
    { header: 'Task Name', accessor: 'task_name', sortKey: 'task_name' },
    ...((isAdmin || canManage)
      ? [
          {
            header: 'Employee Name',
            accessor: (r: Task) => (
              <span style={{ fontWeight: 500 }}>
                {r.assigned_employees && r.assigned_employees.length > 0 ? (
                  r.assigned_employees.map((e) => e.name).join(', ')
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                )}
              </span>
            ),
            csvAccessor: (r: Task) => r.assigned_employees?.map((e) => e.name).join(', ') || 'Unassigned',
            sortKey: (r: Task) => r.assigned_employees?.map((e) => e.name).join(', ') || '',
          },
        ]
      : []),
    ...((isAdmin || canManage)
      ? [
          {
            header: 'Assigned Labours',
            accessor: (r: Task) => (
              <span style={{ fontWeight: 500 }}>
                {r.assigned_labours && r.assigned_labours.length > 0 ? (
                  r.assigned_labours.map((l) => l.name).join(', ')
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                )}
              </span>
            ),
            csvAccessor: (r: Task) => r.assigned_labours?.map((l) => l.name).join(', ') || '-',
            sortKey: (r: Task) => r.assigned_labours?.map((l) => l.name).join(', ') || '',
          },
        ]
      : []),
    { header: 'Worker Count', accessor: 'required_worker_count', sortKey: 'required_worker_count' },
    {
      header: 'Working Hours',
      accessor: (r: Task) => {
        const est = Number(r.estimated_hours || 0);
        const act = Number(r.actual_hours || 0);
        const rem = Math.max(est - act, 0);
        const alloc = r.allocation_status || (act > est ? 'Hours Exceeded' : act >= est * 0.85 ? 'Near Limit' : 'Within Allocation');
        const badgeBg = alloc === 'Hours Exceeded' ? 'rgba(239, 68, 68, 0.12)' : alloc === 'Near Limit' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
        const badgeColor = alloc === 'Hours Exceeded' ? '#ef4444' : alloc === 'Near Limit' ? '#f59e0b' : '#10b981';

        return (
          <div>
            <div style={{ fontWeight: 600 }}>{est}h <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(Rem: {rem}h)</span></div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Logged: {act}h</div>
            <div style={{ marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                {alloc}
              </span>
            </div>
          </div>
        );
      },
      csvAccessor: (r: Task) => `${r.estimated_hours}h (Actual: ${r.actual_hours || 0}h, Rem: ${Math.max((r.estimated_hours || 0) - (r.actual_hours || 0), 0)}h)`,
      sortKey: 'estimated_hours',
    },
    {
      header: 'Start Date & Time',
      accessor: (r) => formatDateTime(r.start_date, r.start_time),
      csvAccessor: (r) => formatDateTime(r.start_date, r.start_time),
      sortKey: (r) => `${r.start_date || ''} ${r.start_time || ''}`,
    },
    {
      header: 'End Date & Time',
      accessor: (r) => formatDateTime(r.target_date, r.target_time),
      csvAccessor: (r) => formatDateTime(r.target_date, r.target_time),
      sortKey: (r) => `${r.target_date || ''} ${r.target_time || ''}`,
    },
    {
      header: 'Status',
      accessor: (r) => (
        <Badge
          variant={
            r.status === 'completed'
              ? 'success'
              : r.status === 'in-progress'
              ? 'info'
              : r.status === 'delayed'
              ? 'danger'
              : r.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
        >
          {r.status}
        </Badge>
      ),
      csvAccessor: (r) => r.status.charAt(0).toUpperCase() + r.status.slice(1),
      sortKey: 'status',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{!(isAdmin || canManage) ? 'My Tasks' : 'Task Management'}</h1>
          <p className="page-subtitle">
            {!(isAdmin || canManage)
              ? 'View your assigned tasks and working schedules'
              : 'Manage tasks, assign responsible employees, and track complete timesheet log history'}
          </p>
        </div>
        {(isAdmin || canManage) && (
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              <Plus size={18} /> Create Task
            </button>
          </div>
        )}
      </div>

      {/* Cascading Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            <Filter size={16} style={{ color: '#6366f1' }} /> Filter Tasks:
          </div>

          {!propProjectId && (
            <div style={{ minWidth: '200px' }}>
              <select
                className="form-input"
                value={filterProjectId}
                onChange={(e) => {
                  setFilterProjectId(parseInt(e.target.value, 10) || 0);
                  setFilterWbsId(0);
                }}
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
          )}

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-input"
              value={filterWbsId}
              onChange={(e) => setFilterWbsId(parseInt(e.target.value, 10) || 0)}
              disabled={!filterProjectId}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            >
              <option value={0}>{filterProjectId ? 'All Disciplines' : 'Select Project First'}</option>
              {filterDisciplines.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name}
                </option>
              ))}
            </select>
          </div>

          {(filterProjectId !== 0 || filterWbsId !== 0) && (
            <Button
              variant="secondary"
              onClick={() => {
                setFilterProjectId(propProjectId || 0);
                setFilterWbsId(0);
              }}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Reset Filters
            </Button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredTasks.length}</strong> of {tasks.length} tasks
          </div>
        </div>
      </div>

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={filteredTasks}
          searchPlaceholder="Search tasks by name, project, or discipline..."
          exportFilename="tasks"
          isLoading={isLoading}
          actions={(row) => (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {/* View Logs Button (Eye Icon) */}
              <Button
                variant="secondary"
                onClick={() => openViewLogs(row)}
                style={{ padding: '0.35rem 0.6rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                title="View Log History"
              >
                <Eye size={14} /> Logs
              </Button>

              {/* View Details Button for Completed Tasks */}
              {row.status === 'completed' && (
                <Button
                  variant="secondary"
                  onClick={() => openViewDetails(row)}
                  style={{
                    padding: '0.35rem 0.6rem',
                    color: '#0284c7',
                    borderColor: 'rgba(2, 132, 199, 0.35)',
                    background: 'rgba(2, 132, 199, 0.08)',
                    fontWeight: 600,
                  }}
                  title="View Completed Task Details"
                >
                  <FileText size={14} /> View details
                </Button>
              )}

              {/* Log Timesheet Button (Calendar Icon) */}
              {row.status !== 'completed' && row.status !== 'cancelled' && (
                <Button
                  variant="secondary"
                  onClick={() => openLogTimesheetModal(row)}
                  style={{ padding: '0.35rem 0.6rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                  title="Log Timesheet"
                >
                  <Calendar size={14} /> Log Time
                </Button>
              )}

              {(isAdmin || canManage) && row.status !== 'completed' && row.status !== 'cancelled' && (
                <Button variant="secondary" onClick={() => openEditModal(row)} style={{ padding: '0.35rem 0.6rem' }}>
                  <Edit size={14} /> Edit
                </Button>
              )}

              {row.status !== 'completed' && row.status !== 'cancelled' && (
                <Button variant="secondary" onClick={() => openStatusModal(row)} style={{ padding: '0.35rem 0.6rem' }}>
                  <RefreshCw size={14} /> Status
                </Button>
              )}

              {(isAdmin || canManage) && row.status !== 'completed' && row.status !== 'cancelled' && (
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(row.task_id, row.task_name)}
                  style={{ padding: '0.35rem 0.6rem', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              )}
            </div>
          )}
        />
      </div>

      {/* View Task Details Modal */}
      <Modal
        isOpen={isViewDetailsOpen}
        onClose={() => {
          setIsViewDetailsOpen(false);
          setViewingTask(null);
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>Task Details: {viewingTask?.task_name || 'Loading...'}</span>
            {viewingTask && (
              <>
                <Badge variant={viewingTask.status === 'completed' ? 'success' : viewingTask.status === 'in-progress' ? 'info' : 'warning'}>
                  {viewingTask.status.toUpperCase()}
                </Badge>
                {viewingTask.task_code && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    #{viewingTask.task_code}
                  </span>
                )}
              </>
            )}
          </div>
        }
        size="2xl"
      >
        {isLoadingTaskDetails ? (
          <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <LoadingSpinner />
            <span style={{ color: 'var(--text-secondary)' }}>Loading task details...</span>
          </div>
        ) : !viewingTask ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            Task not found or could not be loaded.
          </div>
        ) : (() => {
          const planned = Number(viewingTask.planned_hours ?? viewingTask.estimated_hours) || 0;
          const actual = Number(viewingTask.actual_hours) || 0;
          const remaining = Math.max(planned - actual, 0);
          const extra = Math.max(actual - planned, 0);
          const compPct = viewingTask.progress_percentage ?? (viewingTask.status === 'completed' ? 100 : 0);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Top Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                {/* Project & WBS */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Project & Discipline
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{viewingTask.project_name || 'N/A'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, marginTop: '2px' }}>
                    WBS: {viewingTask.wbs_name || 'General Discipline'}
                  </div>
                </div>

                {/* Assigned Workforce */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Assigned Workforce
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {viewingTask.assigned_employees && viewingTask.assigned_employees.length > 0
                      ? viewingTask.assigned_employees.map(e => e.name).join(', ')
                      : (viewingTask.assigned_employee_name || 'No employee assigned')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Labours: {viewingTask.assigned_labours && viewingTask.assigned_labours.length > 0
                      ? viewingTask.assigned_labours.map(l => l.name).join(', ')
                      : (viewingTask.assigned_labour_name || 'None')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Worker Count: {viewingTask.required_worker_count || 1}
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Execution Timeline
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Start: </span>
                    <strong>{formatDateTime(viewingTask.start_date, viewingTask.start_time)}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>End: </span>
                    <strong style={{ color: '#059669' }}>{formatDateTime(viewingTask.target_date, viewingTask.target_time)}</strong>
                  </div>
                </div>

                {/* Progress Card */}
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Task Progress
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 750, color: '#16a34a' }}>{compPct}%</span>
                    <Badge variant="success">Completed</Badge>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${compPct}%`, height: '100%', background: '#16a34a', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>

              {/* Hours Breakdown */}
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} color="#6366f1" /> Hours Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLANNED</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{planned.toFixed(2)}h</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>LOGGED ACTUAL</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>{actual.toFixed(2)}h</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600 }}>REMAINING</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginTop: '2px' }}>{remaining.toFixed(2)}h</div>
                  </div>
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '6px', background: extra > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)', border: extra > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: extra > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>EXTRA / OVERTIME</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: extra > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '2px' }}>{extra.toFixed(2)}h</div>
                  </div>
                </div>
              </div>

              {/* Description & Work Scope */}
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Description & Scope of Work
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {viewingTask.description || 'No detailed scope of work provided for this task.'}
                </div>
                {(viewingTask as any).task_address && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} color="#ef4444" />
                    <span>{(viewingTask as any).task_address}</span>
                  </div>
                )}
              </div>

              {/* Used Materials if any */}
              {viewingTask.used_materials && viewingTask.used_materials.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={15} color="#d97706" /> Used Materials ({viewingTask.used_materials.length})
                  </div>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'left' }}>#</th>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'left' }}>Material Name</th>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>Date Used</th>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Qty</th>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Rate</th>
                          <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingTask.used_materials.map((m: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.5rem 0.65rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ padding: '0.5rem 0.65rem', fontWeight: 600 }}>{m.material_name}</td>
                            <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center' }}>{m.used_date || 'N/A'}</td>
                            <td style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>{m.quantity} {m.unit || 'Nos'}</td>
                            <td style={{ padding: '0.5rem 0.65rem', textAlign: 'right' }}>₹{Number(m.rate || 0).toFixed(2)}</td>
                            <td style={{ padding: '0.5rem 0.65rem', textAlign: 'right', fontWeight: 700 }}>₹{Number(m.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    openViewLogs(viewingTask);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                >
                  <Eye size={14} /> View Task Logs
                </Button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onNavigate && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setIsViewDetailsOpen(false);
                        onNavigate(`project/workspace/${viewingTask.project_id}/tasks/${viewingTask.task_id}`);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <ExternalLink size={14} /> Open Full Page
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setIsViewDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Log History Modal Component */}
      <LogHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        taskId={historyTaskId}
        onLogUpdated={fetchData}
      />

      {/* Log Timesheet Modal for specific task */}
      {timesheetTask && (
        <Modal
          isOpen={isTimesheetModalOpen}
          onClose={() => {
            setIsTimesheetModalOpen(false);
            setTimesheetTask(null);
          }}
          title="Log Time Sheet"
        >
          <form noValidate onSubmit={handleSaveTimesheet}>
            <div style={{ marginBottom: '1rem', background: 'rgba(99, 102, 241, 0.05)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project & Discipline</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {timesheetTask.project_name} &rarr; {timesheetTask.wbs_name || 'General'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6366f1', marginTop: '0.25rem', fontWeight: 500 }}>
                Task: {timesheetTask.task_name}
              </div>
            </div>

            <FormSelect
              label="Employee Name *"
              value={timesheetForm.employee_id}
              onChange={(e) => setTimesheetForm({ ...timesheetForm, employee_id: e.target.value })}
              options={[
                { value: '', label: '-- Select Employee --' },
                ...employees.map((emp) => ({
                  value: emp.employee_id,
                  label: `${emp.name} (${emp.employee_code})`,
                })),
              ]}
              required
            />

            <div className="grid-2-col">
              <FormInput
                label="Log Date *"
                type="date"
                value={timesheetForm.log_date}
                min={getTodayStr()}
                onChange={(e) => {
                  const val = e.target.value;
                  const today = getTodayStr();
                  if (val && val < today) {
                    showError('Log date cannot be a past date');
                    return;
                  }
                  setTimesheetForm({ ...timesheetForm, log_date: val });
                }}
                required
              />
              <FormInput
                label="Work HRs. *"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 6"
                value={timesheetForm.working_hours}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, working_hours: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Log Description / Remarks</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Enter work details or progress remarks..."
                value={timesheetForm.comment}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, comment: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsTimesheetModalOpen(false);
                  setTimesheetTask(null);
                }}
              >
                Close
              </Button>
              <Button type="submit" variant="primary" disabled={isLoggingTimesheet}>
                {isLoggingTimesheet ? 'Saving...' : 'Save Log'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? 'Edit Task' : 'Create New Task'}>
        <form noValidate onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Task Details</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <FormSelect
                label="Project *"
                value={projectId}
                onChange={(e) => {
                  const pid = parseInt(e.target.value, 10) || 0;
                  setProjectId(pid);
                  setWbsId(0);
                  setFormErrors((prev) => ({ ...prev, project_id: '', wbs_id: '' }));
                  if (!editingTask) {
                    const proj = projects.find(p => p.project_id === pid);
                    if (proj) {
                      setTaskAddress(proj.project_address || '');
                      setLatitude((proj as any).latitude || '');
                      setLongitude((proj as any).longitude || '');
                    }
                  }
                }}
                options={[
                  { value: 0, label: '-- Select Project --' },
                  ...projects.map((p) => ({ value: p.project_id, label: p.project_name })),
                ]}
                required
                error={formErrors.project_id}
              />
              <FormInput
                label="Task Code"
                type="text"
                value={taskCode}
                onChange={(e) => setTaskCode(e.target.value)}
                placeholder="TSK-..."
              />
              <FormInput
                label="Task Name *"
                type="text"
                value={taskName}
                placeholder="Enter task name"
                onChange={(e) => {
                  setTaskName(e.target.value);
                  setFormErrors((prev) => ({ ...prev, task_name: '' }));
                }}
                required
                error={formErrors.task_name}
              />
              <FormSelect
                label="WBS *"
                value={wbsId}
                onChange={(e) => {
                  setWbsId(parseInt(e.target.value, 10) || 0);
                  setFormErrors((prev) => ({ ...prev, wbs_id: '' }));
                }}
                options={[
                  { value: 0, label: 'Select WBS' },
                  ...projectWbs.map((w) => ({ value: w.id, label: w.wbs_name })),
                ]}
                required
                error={formErrors.wbs_id}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <FormInput
                label="Start Date *"
                type="date"
                value={startDate}
                min={editingTask && editingTask.start_date ? editingTask.start_date.split('T')[0] : getTodayStr()}
                onChange={(e) => {
                  const val = e.target.value;
                  const today = getTodayStr();
                  if (!editingTask && val && val < today) {
                    setFormErrors((prev) => ({ ...prev, start_date: 'Start date cannot be a past date.' }));
                    return;
                  }
                  setStartDate(val);
                  setFormErrors((prev) => ({ ...prev, start_date: '' }));
                  if (targetDate && targetDate < val) {
                    setTargetDate(val);
                    setFormErrors((prev) => ({ ...prev, target_date: '' }));
                  }
                }}
                required
                error={formErrors.start_date}
              />
              <FormInput
                label="End Date *"
                type="date"
                value={targetDate}
                min={startDate ? startDate : (editingTask ? undefined : getTodayStr())}
                onChange={(e) => {
                  const val = e.target.value;
                  const today = getTodayStr();
                  if (!editingTask && val && val < today) {
                    setFormErrors((prev) => ({ ...prev, target_date: 'End date cannot be a past date.' }));
                    return;
                  }
                  if (startDate && val && val < startDate) {
                    setFormErrors((prev) => ({ ...prev, target_date: 'End date cannot be earlier than start date.' }));
                    return;
                  }
                  setTargetDate(val);
                  setFormErrors((prev) => ({ ...prev, target_date: '' }));
                }}
                required
                error={formErrors.target_date}
              />
              <FormSelect
                label="Status *"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'delayed', label: 'Delayed' },
                  { value: 'on-hold', label: 'On Hold' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                required
              />
              <FormSelect
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
              <FormInput
                label="Progress % (0-100)"
                type="number"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Assignment</h3>
            <EmployeeMultiSelect
              employees={employees}
              selectedIds={assignedEmployeeIds}
              onChange={(ids) => {
                setAssignedEmployeeIds(ids);
                setFormErrors((prev) => ({ ...prev, assigned_employee_ids: '' }));
              }}
              error={formErrors.assigned_employee_ids}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <FormInput
                label="Planned Hours"
                type="number"
                step="any"
                min="0"
                value={workingHours}
                onChange={(e) => {
                  setWorkingHours(e.target.value === '' ? '' : parseFloat(e.target.value));
                  setFormErrors((prev) => ({ ...prev, estimated_hours: '' }));
                }}
                error={formErrors.estimated_hours}
              />
              {isHoursExceeded && (
                <div style={{
                  marginTop: '0.35rem',
                  padding: '0.4rem 0.6rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  color: '#b45309',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Notice:</strong> Task hours ({parsedWorkingHours} hrs) exceed parent WBS allocated hours ({wbsTotalHours} hrs).
                  </span>
                </div>
              )}
              {wbsTotalHours > 0 && !isHoursExceeded && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Parent WBS allocation: {wbsTotalHours} hrs
                </div>
              )}
            </div>
            <FormInput
              label="Actual Hours"
              type="number"
              value={editingTask?.actual_hours || 0.00}
              readOnly
              disabled
            />
            <FormInput
              label="Remaining Hours"
              type="number"
              value={editingTask ? Math.max((Number(editingTask.estimated_hours || 0) - Number(editingTask.actual_hours || 0)), 0) : workingHours || 0.00}
              readOnly
              disabled
            />
          </div>

          {/* WBS Budget / Cost Warning */}
          {isCostExceeded && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.55rem 0.85rem',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '6px',
              color: '#b45309',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Cost Exceeded:</strong> Total task cost ({currencySymbol}{totalTaskCost.toFixed(2)}) exceeds parent WBS budget ({currencySymbol}{wbsBudgetAmount.toFixed(2)}).
              </span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={4} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Enter task description..." 
            />
          </div>

          {/* 10. Task Dependencies */}
          <div className="form-group" style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              Task Dependencies / Predecessor (Optional)
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                <strong style={{ color: 'var(--text-primary)' }}>What is a Predecessor Task?</strong>
                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  A <strong>Predecessor Task</strong> is a prerequisite task that must finish before this task can start (Finish-to-Start dependency).
                  It sequences tasks in the <strong>Gantt Chart</strong> and project timeline. If a predecessor task is delayed or shifted, dependent tasks automatically adjust their schedule.
                </p>
              </div>

              {!projectId ? (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💡</span>
                  <span><strong>Step 1 Required:</strong> Please select a <strong>Project</strong> at the top of this form to view and link its tasks as predecessors.</span>
                </div>
              ) : tasks.filter(t => Number(t.project_id) === Number(projectId) && (!editingTask || Number(t.task_id) !== Number(editingTask.task_id))).length === 0 ? (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(234, 179, 8, 0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>ℹ️</span>
                  <span>No other tasks found in this project yet. This will be the project's first task (no predecessor needed).</span>
                </div>
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  ✓ Found {tasks.filter(t => Number(t.project_id) === Number(projectId) && (!editingTask || Number(t.task_id) !== Number(editingTask.task_id))).length} existing tasks in this project available as predecessors.
                </div>
              )}
              
              <FormSelect
                label="Select Predecessor Task"
                value={dependencies.length > 0 ? dependencies[0].predecessor_task_id : ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val) {
                    setDependencies([{ predecessor_task_id: val, dependency_type: 'FS', lag_days: 0 }]);
                  } else {
                    setDependencies([]);
                  }
                }}
                options={
                  !projectId
                    ? [{ value: '', label: '-- Select a Project above first --' }]
                    : tasks.filter(t => Number(t.project_id) === Number(projectId) && (!editingTask || Number(t.task_id) !== Number(editingTask.task_id))).length === 0
                      ? [{ value: '', label: '-- No existing tasks in this project (First task) --' }]
                      : [
                          { value: '', label: '-- None (Independent Task - No Predecessor) --' },
                          ...tasks
                            .filter(t => Number(t.project_id) === Number(projectId) && (!editingTask || Number(t.task_id) !== Number(editingTask.task_id)))
                            .map(t => ({
                              value: t.task_id,
                              label: `#${t.task_id} - ${t.task_name} [${(t.status || 'pending').toUpperCase()}${t.target_date ? ` · Target: ${t.target_date.split('T')[0]}` : ''}]`
                            }))
                        ]
                }
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#6366f1', color: 'white', padding: '0.75rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Calendar size={16} /> Labour / Contractor Daily Allocation
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Add daily work allocation records for workers on this task. Each worker can work multiple dates, and multiple workers can be allocated per date.
              </p>

              {(!startDate || !targetDate) && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Please select Task <strong>Start Date</strong> and <strong>End Date</strong> above before adding allocations.
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Work Date <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      value={allocationForm.work_date}
                      min={startDate}
                      max={targetDate}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, work_date: e.target.value })}
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Labour / Contractor <span style={{ color: '#ef4444' }}>*</span></label>
                    <LabourCombobox
                      selectedLabourId={allocationForm.labour_id}
                      labours={labours}
                      onSelectLabour={(l) => setAllocationForm({ ...allocationForm, labour_id: l ? String(l.labour_id) : '' })}
                      onInitiateCreate={handleInitiateCreateLabour}
                      disabled={!startDate || !targetDate}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Amount ({currencySymbol}) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={allocationForm.amount}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, amount: e.target.value })}
                      placeholder="Enter amount..."
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Payment Status</label>
                    <select
                      className="form-input"
                      value={allocationForm.payment_status}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, payment_status: e.target.value })}
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div style={{ minWidth: '200px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Remarks / Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      value={allocationForm.work_description}
                      disabled={!startDate || !targetDate}
                      onChange={(e) => setAllocationForm({ ...allocationForm, work_description: e.target.value })}
                      placeholder="Optional notes / remarks"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                  {editingAllocIndex !== null && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetAllocationForm}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!startDate || !targetDate || !allocationForm.work_date || !allocationForm.labour_id || !allocationForm.amount}
                    onClick={() => {
                      if (editingAllocIndex !== null) {
                        const newAlloc = [...allocations];
                        newAlloc[editingAllocIndex] = { ...allocations[editingAllocIndex], ...allocationForm };
                        setAllocations(newAlloc);
                      } else {
                        setAllocations([...allocations, { ...allocationForm }]);
                      }
                      resetAllocationForm();
                    }}
                    style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem', background: editingAllocIndex !== null ? '#f59e0b' : '#6366f1', borderColor: editingAllocIndex !== null ? '#f59e0b' : '#6366f1' }}
                  >
                    {editingAllocIndex !== null ? <><Edit size={14} /> Update Allocation</> : <><Plus size={14} /> Add Allocation</>}
                  </Button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Date</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Labour / Contractor</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Type</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Amount ({currencySymbol})</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Payment Status</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Remarks</th>
                      <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', width: '70px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No allocations added.
                        </td>
                      </tr>
                    ) : (
                      allocations.map((alloc, idx) => {
                        const labour = labours.find(l => l.labour_id === Number(alloc.labour_id));
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                              {alloc.work_date ? new Date(alloc.work_date).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{labour?.name || 'Unknown'}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(L{String(labour?.labour_id).padStart(3, '0')})</div>
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                              {labour?.labour_type === 'contractor' ? (
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Contractor</span>
                              ) : (
                                <span style={{ background: '#4f46e5', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Direct Labour</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {currencySymbol}{Number(alloc.amount).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                              {alloc.payment_status?.toLowerCase() === 'paid' ? (
                                <span style={{ background: '#22c55e', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Paid</span>
                              ) : (
                                <span style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{alloc.payment_status || 'Pending'}</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                              {alloc.work_description || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setAllocationForm({
                                    work_log_id: alloc.work_log_id,
                                    work_date: alloc.work_date,
                                    labour_id: alloc.labour_id.toString(),
                                    amount: alloc.amount.toString(),
                                    payment_status: alloc.payment_status?.toLowerCase() || 'pending',
                                    work_description: alloc.work_description || ''
                                  });
                                  setEditingAllocIndex(idx);
                                }}
                                style={{ background: '#38bdf8', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                                title="Edit Allocation"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newAlloc = [...allocations];
                                  newAlloc.splice(idx, 1);
                                  setAllocations(newAlloc);
                                  if (editingAllocIndex === idx) resetAllocationForm();
                                }}
                                style={{ background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }}
                                title="Delete Allocation"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {allocations.length > 0 && (
                    <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          Total Summary:
                        </td>
                        <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                          {currencySymbol}{allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0).toFixed(2)}
                        </td>
                        <td colSpan={3} style={{ padding: '0.75rem' }}>
                          <span style={{ background: '#4f46e5', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            {allocations.length} Allocations
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Used Materials Allocation */}
          <div className="form-group" style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <div style={{ background: '#10b981', color: 'white', padding: '0.75rem 1rem', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Package size={16} /> Used Materials Allocation (Quantities & Costs to match Quotation)
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Add used material records for this task with quantity and rate to match against planned quotation materials.
              </p>

              {/* WBS Quantity Exceeded Warning */}
              {isQtyExceeded && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.55rem 0.85rem',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  color: '#b45309',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Quantity Exceeded:</strong> Total material quantity ({totalMaterialQty}) exceeds parent WBS planned quantity ({wbsPlannedQty}).
                  </span>
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Material Name / Master <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ position: "relative" }}>
                      <input 
                        type="text" 
                        list="materialsMasterOptions"
                        className="form-input" 
                        placeholder="Search material or type new..." 
                        value={materialForm.material_name} 
                        onChange={(e) => handleMaterialSelect(e.target.value)} 
                        style={{ width: "100%", paddingRight: "2rem", padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                      />
                      <div style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                    <datalist id="materialsMasterOptions">
                      {materialsMaster.map((m: any) => (
                        <option key={m.material_id} value={m.material_name}>
                          Available: {m.available_stock ?? 0} {m.unit || 'Nos'} | Rate: ₹{m.billing_rate || m.rate || 0}
                        </option>
                      ))}
                    </datalist>

                    {selectedMasterMaterial && (
                      <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {Number(selectedMasterMaterial.available_stock || 0) > 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Package size={13} /> Available Stock: {Number(selectedMasterMaterial.available_stock)} {selectedMasterMaterial.unit || 'Nos'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertTriangle size={13} /> Out of Stock (0 {selectedMasterMaterial.unit || 'Nos'} available)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Used Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={materialForm.used_date}
                      min={startDate || undefined}
                      max={targetDate || undefined}
                      onChange={(e) => setMaterialForm({ ...materialForm, used_date: e.target.value })}
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                    {startDate && targetDate && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                        Schedule: {startDate} to {targetDate}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Quantity <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={materialForm.quantity}
                      onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })}
                      placeholder="e.g. 10"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unit</label>
                    <input
                      type="text"
                      className="form-input"
                      value={materialForm.unit}
                      onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                      placeholder="e.g. Nos, Kg, Bags, Mtr"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cost / Rate per Unit ({currencySymbol})</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={materialForm.rate}
                      onChange={(e) => setMaterialForm({ ...materialForm, rate: e.target.value })}
                      placeholder="e.g. 150.00"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Calculation Card & Action Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px dashed #cbd5e1'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 500 }}>
                      Calculated Total Amount:
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 750, color: '#047857' }}>
                      {currencySymbol}{(Number(materialForm.quantity || 0) * Number(materialForm.rate || 0)).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {editingMaterialIndex !== null && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetMaterialForm}
                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddMaterial}
                      disabled={!materialForm.material_name || !materialForm.quantity}
                      style={{
                        padding: '0.55rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: editingMaterialIndex !== null ? '#2563eb' : '#10b981',
                        borderColor: editingMaterialIndex !== null ? '#2563eb' : '#10b981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: '6px'
                      }}
                    >
                      {editingMaterialIndex !== null ? (
                        <><Edit size={16} /> Update Material</>
                      ) : (
                        <><Plus size={16} /> Add Material</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Table of Used Materials */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>Date</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>Material Name</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>Quantity & Unit</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>Rate ({currencySymbol})</th>
                      <th style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>Total Amount ({currencySymbol})</th>
                      <th style={{ padding: '0.75rem', width: '85px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No materials logged for this task.
                        </td>
                      </tr>
                    ) : (
                      usedMaterials.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                            {m.used_date ? new Date(m.used_date).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', fontWeight: 600 }}>
                            {m.material_name}
                          </td>
                          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                            {m.quantity} {m.unit || 'Nos'}
                          </td>
                          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)' }}>
                            {currencySymbol}{Number(m.rate || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {currencySymbol}{Number(m.amount || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                              <button
                                type="button"
                                title="Edit Material"
                                onClick={() => {
                                  setEditingMaterialIndex(idx);
                                  setMaterialForm({
                                    material_id: m.material_id ? String(m.material_id) : '',
                                    material_name: m.material_name || '',
                                    quantity: String(m.quantity || ''),
                                    unit: m.unit || 'Nos',
                                    rate: String(m.rate || ''),
                                    used_date: m.used_date ? m.used_date.split('T')[0] : (startDate || new Date().toISOString().split('T')[0]),
                                    notes: m.notes || '',
                                  });
                                }}
                                style={{ background: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                title="Delete Material"
                                onClick={() => {
                                  if (editingMaterialIndex === idx) {
                                    resetMaterialForm();
                                  }
                                  const next = [...usedMaterials];
                                  next.splice(idx, 1);
                                  setUsedMaterials(next);
                                }}
                                style={{ background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', padding: '0.3rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {usedMaterials.length > 0 && (
                    <tfoot style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          Total Materials Summary ({usedMaterials.length} items):
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>Total Material Cost:</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                          {currencySymbol}{usedMaterials.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTask ? 'Save Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Change Task Status">
        <form noValidate onSubmit={handleStatusSubmit}>
          <div style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Task</div>
            <div style={{ fontWeight: 600 }}>{editingTask?.task_name}</div>
          </div>

          <FormSelect
            label="Select New Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'on-hold', label: 'On Hold' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {isAdmin && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          recordName={deletingTask?.name || 'this task'}
          isLoading={isDeleting}
        />
      )}

      {/* Create Labour / Contractor Modal */}
      <Modal isOpen={isCreateLabourModalOpen} onClose={() => setIsCreateLabourModalOpen(false)} title="Create New Labour / Contractor">
        <form noValidate onSubmit={handleCreateLabourSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.name}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <FormSelect
              label="Type *"
              value={createLabourForm.labour_type}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, labour_type: e.target.value as any })}
              options={[
                { value: 'direct_labour', label: 'Direct Labour' },
                { value: 'contractor', label: 'Contractor' }
              ]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Number (10 digits) *</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.contact_number}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, contact_number: e.target.value })}
              maxLength={10}
              placeholder="e.g. 9876543210"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aadhar ID (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={createLabourForm.aadhar_id}
              onChange={(e) => setCreateLabourForm({ ...createLabourForm, aadhar_id: e.target.value })}
              maxLength={12}
              placeholder="e.g. 123456789012"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCreateLabourModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Labour'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tasks;
