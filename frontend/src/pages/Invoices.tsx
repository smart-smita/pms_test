import { useWorkCategory } from '../context/WorkCategoryContext';
import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest, API_BASE_URL } from '../services/api';
import { Invoice, BillingSchedule, MonthlyCompletedWork, Currency, Tax, Country, Project, Customer, InvoicePayment, SiteSurvey, Discipline, InvoiceItem } from '../types';
import { Plus, FileText, RotateCcw, CheckCircle, CreditCard, DollarSign, Percent, Calendar, Download, RefreshCw, Eye, AlertCircle, ClipboardCheck, Trash2, Edit2, Power, Mail, Send } from 'lucide-react';
import { SearchableSelect } from '../components/forms/SearchableSelect';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Invoices: React.FC<{ projectId?: number; hideHeader?: boolean }> = ({ projectId, hideHeader = false }) => {
  const { user } = useAuth();
  const { isMaterialEnabled, isLabourEnabled } = useWorkCategory();
  const isAdminOrManager = user?.role_name === 'Admin' || user?.role_name === 'Super Admin' || user?.role_name === 'Manager';

  const [activeTab, setActiveTab] = useState<'invoices' | 'schedules' | 'completed_work' | 'masters'>('invoices');

  // Master lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [projectSurveys, setProjectSurveys] = useState<SiteSurvey[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedules, setSchedules] = useState<BillingSchedule[]>([]);
  const [completedWorks, setCompletedWorks] = useState<MonthlyCompletedWork[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<number | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isApprovingInvoice, setIsApprovingInvoice] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId ? String(projectId) : '');
  const [invoiceCountryId, setInvoiceCountryId] = useState<string>('');

  useEffect(() => {
    setSelectedProjectId(projectId ? String(projectId) : '');
  }, [projectId]);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isGeneratingScheduleModalOpen, setIsGeneratingScheduleModalOpen] = useState(false);
  const [isCompletedWorkModalOpen, setIsCompletedWorkModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

  // Selected for modals
  const [selectedCompletedWork, setSelectedCompletedWork] = useState<MonthlyCompletedWork | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BillingSchedule | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [projectCosts, setProjectCosts] = useState<any | null>(null);

  // Phase 6: Credit Note & Revision Modal States
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditNoteInvoice, setCreditNoteInvoice] = useState<Invoice | null>(null);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [isSubmittingCreditNote, setIsSubmittingCreditNote] = useState(false);

  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [reviseInvoice, setReviseInvoice] = useState<Invoice | null>(null);
  const [reviseReason, setReviseReason] = useState('');
  const [isSubmittingRevise, setIsSubmittingRevise] = useState(false);

  // View Details Modal State
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [invoicePaymentsList, setInvoicePaymentsList] = useState<InvoicePayment[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Email Invoice Modal State
  const [isEmailInvoiceModalOpen, setIsEmailInvoiceModalOpen] = useState(false);
  const [emailingInvoice, setEmailingInvoice] = useState<Invoice | null>(null);
  const [invoiceRecipientEmail, setInvoiceRecipientEmail] = useState('');
  const [invoiceEmailSubject, setInvoiceEmailSubject] = useState('');
  const [invoiceEmailMessage, setInvoiceEmailMessage] = useState('');
  const [includeSurveyReport, setIncludeSurveyReport] = useState(true);
  const [selectedSurveyIdForEmail, setSelectedSurveyIdForEmail] = useState<string>('');
  const [isSendingInvoiceEmail, setIsSendingInvoiceEmail] = useState(false);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    project_id: '',
    quotation_id: '',
    schedule_id: '',
    completed_work_id: '',
    survey_id: '',
    currency_id: '',
    tax_id: '',
    tax_type: '',
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    invoice_type: 'combined' as 'combined' | 'labour' | 'material',
    items: [] as InvoiceItem[],
  });

  const [completedWorkForm, setCompletedWorkForm] = useState({
    schedule_id: '',
    project_id: '',
    completion_percentage: 100,
    approved_amount: 0,
    status: 'submitted' as 'draft' | 'submitted' | 'approved',
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: 0,
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'Bank Transfer',
    reference_number: '',
  });

  const [currencyForm, setCurrencyForm] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    exchange_rate: 1.0,
    is_base: 0,
  });

  const [taxForm, setTaxForm] = useState({
    tax_name: '',
    tax_code: '',
    tax_type: 'VAT' as 'VAT' | 'GST' | 'CGST_SGST' | 'IGST' | 'SALES_TAX' | 'OTHER',
    tax_percentage: 0,
    country_id: '',
    is_split: false,
    cgst_percentage: 0,
    sgst_percentage: 0,
    status: 1,
  });

  // Fetch initial masters
  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (activeTab === 'invoices') fetchInvoices();
    if (activeTab === 'schedules') fetchSchedules();
    if (activeTab === 'completed_work') fetchCompletedWorks();
  }, [activeTab, selectedProjectId]);

  const fetchMasters = async () => {
    const [pRes, cRes, tRes, dRes, coRes] = await Promise.all([
      apiRequest<Project[]>('/projects'),
      apiRequest<Currency[]>('/invoices/currencies'),
      apiRequest<Tax[]>('/masters/taxes?all=true'),
      apiRequest<Discipline[]>('/masters/disciplines'),
      apiRequest<Country[]>('/masters/countries'),
    ]);
    if (pRes.success && pRes.data) setProjects(pRes.data);
    if (cRes.success && cRes.data) setCurrencies(cRes.data);
    if (tRes.success && tRes.data) setTaxes(tRes.data);
    if (dRes.success && dRes.data) setDisciplines(dRes.data);
    if (coRes.success && coRes.data) setCountries(coRes.data);
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    const query = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
    const res = await apiRequest<Invoice[]>(`/invoices${query}`);
    if (res.success && res.data) setInvoices(res.data);
    setIsLoading(false);
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    const query = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
    const res = await apiRequest<BillingSchedule[]>(`/invoices/schedules${query}`);
    if (res.success && res.data) setSchedules(res.data);
    setIsLoading(false);
  };

  const fetchCompletedWorks = async () => {
    setIsLoading(true);
    const query = selectedProjectId ? `?project_id=${selectedProjectId}` : '';
    const res = await apiRequest<MonthlyCompletedWork[]>(`/invoices/completed-work${query}`);
    if (res.success && res.data) setCompletedWorks(res.data);
    setIsLoading(false);
  };

  // Handlers
  const handleAutoGenerateSchedules = async () => {
    if (!selectedProjectId) {
      showError('Please select a project first to generate schedules.');
      return;
    }
    setIsLoading(true);
    const res = await apiRequest(`/invoices/schedules/generate/${selectedProjectId}`, { method: 'POST' });
    setIsLoading(false);
    if (res.success) {
      showSuccess(res.message || 'Billing schedules generated successfully.');
      fetchSchedules();
    } else {
      showError(res.message || 'Failed to generate billing schedules.');
    }
  };

  const openLogCompletedWorkModal = (sch: BillingSchedule) => {
    setSelectedSchedule(sch);
    setCompletedWorkForm({
      schedule_id: String(sch.schedule_id),
      project_id: String(sch.project_id),
      completion_percentage: 100,
      approved_amount: sch.expected_amount,
      status: 'submitted',
    });
    setIsCompletedWorkModalOpen(true);
  };

  const handleSubmitCompletedWork = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      schedule_id: Number(completedWorkForm.schedule_id),
      project_id: Number(completedWorkForm.project_id),
      completion_percentage: Number(completedWorkForm.completion_percentage),
      approved_amount: Number(completedWorkForm.approved_amount),
      status: completedWorkForm.status,
    };

    const res = await apiRequest('/invoices/completed-work', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      showSuccess('Monthly completed work recorded.');
      setIsCompletedWorkModalOpen(false);
      fetchSchedules();
      fetchCompletedWorks();
    } else {
      showError(res.message || 'Failed to record completed work.');
    }
  };

  const handleApproveCompletedWork = async (id: number) => {
    const res = await apiRequest(`/invoices/completed-work/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });
    if (res.success) {
      showSuccess('Completed work approved!');
      fetchCompletedWorks();
    } else {
      showError(res.message || 'Failed to approve work.');
    }
  };

  const openGenerateInvoiceModal = async (cw?: MonthlyCompletedWork, directSchedule?: BillingSchedule, overrideProjectId?: number) => {
    const projId = overrideProjectId || (cw ? cw.project_id : (directSchedule ? directSchedule.project_id : (Number(selectedProjectId) || projects[0]?.project_id)));
    if (!projId) {
      showError('Please select a project first');
      return;
    }

    // Find schedule
    let targetSchedule = directSchedule;
    if (!targetSchedule && cw) {
      targetSchedule = schedules.find(s => s.schedule_id === cw.schedule_id);
    }
    if (!targetSchedule) {
      const projSchedules = schedules.filter(s => s.project_id === projId && s.status !== 'invoiced' && s.status !== 'paid');
      targetSchedule = projSchedules[0] || schedules.find(s => s.project_id === projId);
    }

    if (!targetSchedule) {
      try {
        const sRes = await apiRequest<BillingSchedule[]>(`/invoices/schedules?project_id=${projId}`);
        if (sRes.success && sRes.data && sRes.data.length > 0) {
          setSchedules(prev => {
            const map = new Map(prev.map(s => [s.schedule_id, s]));
            sRes.data!.forEach(s => map.set(s.schedule_id, s));
            return Array.from(map.values());
          });
          targetSchedule = sRes.data.find(s => s.status !== 'invoiced' && s.status !== 'paid') || sRes.data[0];
        }
      } catch (err) {
        console.error('Failed to load project schedules:', err);
      }
    }

    setSelectedSchedule(targetSchedule || null);
    setSelectedCompletedWork(cw || null);

    // Fetch site surveys
    const surveyRes = await apiRequest<SiteSurvey[]>(`/site-surveys?project_id=${projId}`);
    if (surveyRes.success && surveyRes.data) {
      setProjectSurveys(surveyRes.data);
    } else {
      setProjectSurveys([]);
    }

    // Fetch project costs (labour + materials)
    let fetchedCosts: any = null;
    try {
      const costsRes = await apiRequest<any>(`/invoices/project-costs/${projId}`);
      if (costsRes.success && costsRes.data) {
        fetchedCosts = costsRes.data;
        setProjectCosts(costsRes.data);
      }
    } catch (e) {
      console.error(e);
    }

    // Currency Synchronization: Quotation -> Project -> Invoice
    const targetProj = projects.find(p => String(p.project_id) === String(projId));
    const projectCurrency = (targetProj?.currency_id ? currencies.find(c => c.currency_id === targetProj.currency_id) : null)
      || currencies.find(c => c.is_base === 1)
      || currencies[0];
    const curSym = projectCurrency?.symbol || '₹';

    const defaultTax = taxes[0];
    const taxRate = defaultTax ? Number(defaultTax.tax_percentage) : 0;
    const isSplit = defaultTax ? Boolean(defaultTax.is_split || defaultTax.tax_type === 'CGST_SGST') : false;
    const cgstPct = defaultTax && isSplit ? Number(defaultTax.cgst_percentage || taxRate / 2) : 0;
    const sgstPct = defaultTax && isSplit ? Number(defaultTax.sgst_percentage || taxRate / 2) : 0;

    let items: InvoiceItem[] = [];
    if (fetchedCosts && (fetchedCosts.labour_items?.length > 0 || fetchedCosts.material_items?.length > 0)) {
      items = [
        ...fetchedCosts.labour_items.map((l: any) => ({
          discipline_id: l.wbs_id || null,
          description: `Labour: ${l.labour_name} (${l.labour_type === 'direct_labour' ? 'Direct' : 'Contractor'}) - ${l.work_description || l.task_name} [${l.work_date}]`,
          amount: Number(l.amount || 0),
          is_extra_work: false,
          item_type: 'labour' as const,
          project_wbs_id: l.wbs_id || null,
          task_id: l.task_id || null,
          quantity: Number(l.total_working_hours || 0),
          rate: Number(l.rate || 0),
        })),
        ...fetchedCosts.material_items.map((m: any) => ({
          discipline_id: m.wbs_id || null,
          description: `Material: ${m.material_name} (${Number(m.quantity)} ${m.unit} @ ${curSym}${Number(m.rate).toFixed(2)}) - ${m.task_name}`,
          amount: Number(m.amount || 0),
          is_extra_work: false,
          item_type: 'material' as const,
          project_wbs_id: m.wbs_id || null,
          task_id: m.task_id || null,
          quantity: Number(m.quantity || 0),
          rate: Number(m.rate || 0),
        })),
      ];
    } else {
      const sub = Number(cw ? cw.approved_amount : (targetSchedule?.expected_amount || 0));
      items = [
        {
          description: targetSchedule
            ? `Monthly Billing Schedule #${targetSchedule.schedule_id} - Milestone Work`
            : `Monthly Progress Invoice - Milestone Work`,
          amount: sub,
          is_extra_work: false,
        }
      ];
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const cgstAmt = isSplit ? (subtotal * cgstPct) / 100 : 0;
    const sgstAmt = isSplit ? (subtotal * sgstPct) / 100 : 0;
    const taxAmt = isSplit ? cgstAmt + sgstAmt : (subtotal * taxRate) / 100;
    const igstAmt = (!isSplit && defaultTax && defaultTax.tax_type === 'IGST') ? taxAmt : 0;

    setInvoiceForm({
      customer_id: '',
      project_id: String(projId),
      quotation_id: '',
      schedule_id: targetSchedule ? String(targetSchedule.schedule_id) : '',
      completed_work_id: cw ? String(cw.completed_work_id) : '',
      survey_id: '',
      currency_id: projectCurrency ? String(projectCurrency.currency_id) : '',
      tax_id: defaultTax ? String(defaultTax.tax_id) : '',
      tax_type: defaultTax ? defaultTax.tax_type || '' : '',
      cgst_amount: cgstAmt,
      sgst_amount: sgstAmt,
      igst_amount: igstAmt,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal_amount: subtotal,
      tax_amount: taxAmt,
      total_amount: subtotal + taxAmt,
      invoice_type: 'combined',
      items,
    });

    setIsInvoiceModalOpen(true);
  };

  const handlePopulateCombined = () => {
    if (!projectCosts) return;
    const cur = currencies.find(c => String(c.currency_id) === invoiceForm.currency_id) || currencies[0];
    const sym = cur?.symbol || '₹';
    const newItems: InvoiceItem[] = [
      ...projectCosts.labour_items.map((l: any) => ({
        discipline_id: l.wbs_id || null,
        description: `Labour: ${l.labour_name} (${l.labour_type === 'direct_labour' ? 'Direct' : 'Contractor'}) - ${l.work_description || l.task_name} [${l.work_date}]`,
        amount: Number(l.amount || 0),
        is_extra_work: false,
        item_type: 'labour' as const,
        project_wbs_id: l.wbs_id || null,
        task_id: l.task_id || null,
        quantity: Number(l.total_working_hours || 0),
        rate: Number(l.rate || 0),
      })),
      ...projectCosts.material_items.map((m: any) => ({
        discipline_id: m.wbs_id || null,
        description: `Material: ${m.material_name} (${Number(m.quantity)} ${m.unit} @ ${sym}${Number(m.rate).toFixed(2)}) - ${m.task_name}`,
        amount: Number(m.amount || 0),
        is_extra_work: false,
        item_type: 'material' as const,
        project_wbs_id: m.wbs_id || null,
        task_id: m.task_id || null,
        quantity: Number(m.quantity || 0),
        rate: Number(m.rate || 0),
      })),
    ];
    setInvoiceForm(prev => ({ ...prev, invoice_type: 'combined' }));
    updateInvoiceItems(newItems);
  };

  const handlePopulateLabourOnly = () => {
    if (!projectCosts) return;
    const newItems: InvoiceItem[] = projectCosts.labour_items.map((l: any) => ({
      discipline_id: l.wbs_id || null,
      description: `Labour: ${l.labour_name} (${l.labour_type === 'direct_labour' ? 'Direct' : 'Contractor'}) - ${l.work_description || l.task_name} [${l.work_date}]`,
      amount: Number(l.amount || 0),
      is_extra_work: false,
      item_type: 'labour' as const,
      project_wbs_id: l.wbs_id || null,
      task_id: l.task_id || null,
      quantity: Number(l.total_working_hours || 0),
      rate: Number(l.rate || 0),
    }));
    setInvoiceForm(prev => ({ ...prev, invoice_type: 'labour' }));
    updateInvoiceItems(newItems);
  };

  const handlePopulateMaterialsOnly = () => {
    if (!projectCosts) return;
    const cur = currencies.find(c => String(c.currency_id) === invoiceForm.currency_id) || currencies[0];
    const sym = cur?.symbol || '₹';
    const newItems: InvoiceItem[] = projectCosts.material_items.map((m: any) => ({
      discipline_id: m.wbs_id || null,
      description: `Material: ${m.material_name} (${Number(m.quantity)} ${m.unit} @ ${sym}${Number(m.rate).toFixed(2)}) - ${m.task_name}`,
      amount: Number(m.amount || 0),
      is_extra_work: false,
      item_type: 'material' as const,
      project_wbs_id: m.wbs_id || null,
      task_id: m.task_id || null,
      quantity: Number(m.quantity || 0),
      rate: Number(m.rate || 0),
    }));
    setInvoiceForm(prev => ({ ...prev, invoice_type: 'material' }));
    updateInvoiceItems(newItems);
  };

  const handlePopulateLabourAndMaterials = handlePopulateCombined;

  const handlePopulateScheduledAmount = () => {
    const amt = Number(selectedCompletedWork ? selectedCompletedWork.approved_amount : (selectedSchedule?.expected_amount || 0));
    const schId = invoiceForm.schedule_id || selectedSchedule?.schedule_id;
    const newItems: InvoiceItem[] = [
      {
        description: schId
          ? `Monthly Billing Schedule #${schId} - Milestone Work`
          : `Monthly Progress Invoice - Milestone Work`,
        amount: amt,
        is_extra_work: false,
      }
    ];
    setInvoiceForm(prev => ({ ...prev, invoice_type: 'combined' }));
    updateInvoiceItems(newItems);
  };

  const handlePopulateWbsWise = async () => {
    const cur = currencies.find(c => String(c.currency_id) === invoiceForm.currency_id) || currencies[0];
    const sym = cur?.symbol || '₹';

    if (projectCosts && (projectCosts.labour_items?.length > 0 || projectCosts.material_items?.length > 0)) {
      const wbsMap = new Map<number | string, { name: string; labourTotal: number; materialTotal: number; tasks: Set<string> }>();

      projectCosts.labour_items.forEach((l: any) => {
        const key = l.wbs_id || 'General';
        const name = l.wbs_name || 'General Work Package';
        if (!wbsMap.has(key)) {
          wbsMap.set(key, { name, labourTotal: 0, materialTotal: 0, tasks: new Set() });
        }
        const entry = wbsMap.get(key)!;
        entry.labourTotal += Number(l.amount || 0);
        if (l.task_name) entry.tasks.add(l.task_name);
      });

      projectCosts.material_items.forEach((m: any) => {
        const key = m.project_wbs_id || m.wbs_id || 'General';
        const name = m.wbs_name || 'General Work Package';
        if (!wbsMap.has(key)) {
          wbsMap.set(key, { name, labourTotal: 0, materialTotal: 0, tasks: new Set() });
        }
        const entry = wbsMap.get(key)!;
        entry.materialTotal += Number(m.amount || 0);
        if (m.task_name) entry.tasks.add(m.task_name);
      });

      const newItems: InvoiceItem[] = [];
      wbsMap.forEach((data, key) => {
        const wbsId = typeof key === 'number' ? key : null;
        const taskSummary = data.tasks.size > 0 ? ` [${Array.from(data.tasks).slice(0, 2).join(', ')}]` : '';

        if (data.labourTotal > 0 && isLabourEnabled) {
          newItems.push({
            project_wbs_id: wbsId,
            discipline_id: wbsId,
            description: `WBS Milestone: ${data.name} - Labour Execution${taskSummary}`,
            amount: Number(data.labourTotal.toFixed(2)),
            is_extra_work: false,
            item_type: 'labour' as const,
          });
        }
        if (data.materialTotal > 0 && isMaterialEnabled) {
          newItems.push({
            project_wbs_id: wbsId,
            discipline_id: wbsId,
            description: `WBS Milestone: ${data.name} - Material Incurred`,
            amount: Number(data.materialTotal.toFixed(2)),
            is_extra_work: false,
            item_type: 'material' as const,
          });
        }
      });

      if (newItems.length > 0) {
        setInvoiceForm(prev => ({ ...prev, invoice_type: 'combined' }));
        updateInvoiceItems(newItems);
        showSuccess(`Generated ${newItems.length} WBS milestone item(s)`);
        return;
      }
    }

    // Fallback: Fetch project WBS from API
    try {
      const pid = invoiceForm.project_id;
      if (pid) {
        const wbsRes = await apiRequest<any[]>(`/projects/${pid}/wbs`);
        if (wbsRes.success && wbsRes.data && wbsRes.data.length > 0) {
          const scheduleAmt = Number(selectedCompletedWork ? selectedCompletedWork.approved_amount : (selectedSchedule?.expected_amount || 0));
          const perWbs = scheduleAmt > 0 ? Number((scheduleAmt / wbsRes.data.length).toFixed(2)) : 0;

          const newItems: InvoiceItem[] = wbsRes.data.map((w: any) => ({
            project_wbs_id: w.id || w.wbs_id,
            discipline_id: w.id || w.wbs_id,
            description: `WBS Milestone: ${w.wbs_name || 'Work Breakdown Milestone'} (Budget: ${sym}${Number(w.budget_amount || 0).toLocaleString()})`,
            amount: perWbs || Number(w.budget_amount || 0),
            is_extra_work: false,
            item_type: 'other' as const,
          }));
          setInvoiceForm(prev => ({ ...prev, invoice_type: 'combined' }));
          updateInvoiceItems(newItems);
          showSuccess(`Generated ${newItems.length} WBS milestone item(s) from project WBS`);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    handlePopulateScheduledAmount();
  };

  const openEmailInvoiceModal = (inv: Invoice) => {
    setEmailingInvoice(inv);
    const email = inv.customer_email || '';
    setInvoiceRecipientEmail(email);
    const sym = inv.currency_symbol || '₹';
    setInvoiceEmailSubject(`Tax Invoice #${inv.invoice_number} - ${inv.project_name || 'Project Billing'}`);
    setInvoiceEmailMessage(
      `Dear ${inv.customer_name || 'Valued Client'},\n\n` +
      `Please find attached Tax Invoice #${inv.invoice_number} for project ${inv.project_name || 'Project'}.\n\n` +
      `Invoice Date: ${inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}\n` +
      `Total Due: ${sym} ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `Due Date: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}\n\n` +
      `Thank you for your business.\n\n` +
      `Best regards,\n` +
      `Project Finance & Control Team`
    );
    setIncludeSurveyReport(Boolean(inv.survey_id));
    setIsEmailInvoiceModalOpen(true);
  };

  const handleSendInvoiceEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailingInvoice) return;
    if (!invoiceRecipientEmail) {
      showError('Please enter recipient email address.');
      return;
    }

    setIsSendingInvoiceEmail(true);
    const res = await apiRequest<{ success: boolean; message: string }>(`/invoices/${emailingInvoice.invoice_id}/send-email`, {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: invoiceRecipientEmail,
        include_survey_report: includeSurveyReport,
        subject: invoiceEmailSubject,
        message: invoiceEmailMessage,
      }),
    });
    setIsSendingInvoiceEmail(false);

    if (res.success) {
      showSuccess(res.message || `Invoice sent to ${invoiceRecipientEmail} successfully!`);
      setIsEmailInvoiceModalOpen(false);
      fetchInvoices();
      if (viewingInvoice && viewingInvoice.invoice_id === emailingInvoice.invoice_id) {
        setViewingInvoice(prev => prev ? { ...prev, status: 'sent' } : null);
      }
    } else {
      showError(res.message || 'Failed to dispatch invoice email.');
    }
  };

  const handleRecalculateInvoiceTax = (taxIdStr: string, currentItems: InvoiceItem[]) => {
    const selectedT = taxes.find((t) => String(t.tax_id) === taxIdStr);
    const taxRate = selectedT ? Number(selectedT.tax_percentage) : 0;
    const isSplit = selectedT ? Boolean(selectedT.is_split || selectedT.tax_type === 'CGST_SGST') : false;
    const cgstPct = selectedT && isSplit ? Number(selectedT.cgst_percentage || taxRate / 2) : 0;
    const sgstPct = selectedT && isSplit ? Number(selectedT.sgst_percentage || taxRate / 2) : 0;

    const subtotal = currentItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const cgstAmt = isSplit ? (subtotal * cgstPct) / 100 : 0;
    const sgstAmt = isSplit ? (subtotal * sgstPct) / 100 : 0;
    const taxAmt = isSplit ? cgstAmt + sgstAmt : (subtotal * taxRate) / 100;
    const igstAmt = !isSplit && selectedT && selectedT.tax_type === 'IGST' ? taxAmt : 0;

    setInvoiceForm((prev) => ({
      ...prev,
      tax_id: taxIdStr,
      tax_type: selectedT ? selectedT.tax_type || '' : '',
      cgst_amount: cgstAmt,
      sgst_amount: sgstAmt,
      igst_amount: igstAmt,
      subtotal_amount: subtotal,
      tax_amount: taxAmt,
      total_amount: subtotal + taxAmt,
    }));
  };

  const updateInvoiceItems = (newItems: InvoiceItem[]) => {
    setInvoiceForm((prev) => {
      const selectedT = taxes.find((t) => String(t.tax_id) === prev.tax_id);
      const taxRate = selectedT ? Number(selectedT.tax_percentage) : 0;
      const isSplit = selectedT ? Boolean(selectedT.is_split || selectedT.tax_type === 'CGST_SGST') : false;
      const cgstPct = selectedT && isSplit ? Number(selectedT.cgst_percentage || taxRate / 2) : 0;
      const sgstPct = selectedT && isSplit ? Number(selectedT.sgst_percentage || taxRate / 2) : 0;

      const subtotal = newItems.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const cgstAmt = isSplit ? (subtotal * cgstPct) / 100 : 0;
      const sgstAmt = isSplit ? (subtotal * sgstPct) / 100 : 0;
      const taxAmt = isSplit ? cgstAmt + sgstAmt : (subtotal * taxRate) / 100;
      const igstAmt = !isSplit && selectedT && selectedT.tax_type === 'IGST' ? taxAmt : 0;

      return {
        ...prev,
        items: newItems,
        tax_type: selectedT ? selectedT.tax_type || '' : '',
        cgst_amount: cgstAmt,
        sgst_amount: sgstAmt,
        igst_amount: igstAmt,
        subtotal_amount: subtotal,
        tax_amount: taxAmt,
        total_amount: subtotal + taxAmt,
      };
    });
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.items || invoiceForm.items.length === 0) {
      showError('Please add at least one line item to the invoice.');
      return;
    }

    const payload = {
      project_id: Number(invoiceForm.project_id || selectedProjectId || selectedCompletedWork?.project_id || 0),
      schedule_id: invoiceForm.schedule_id ? Number(invoiceForm.schedule_id) : null,
      completed_work_id: invoiceForm.completed_work_id ? Number(invoiceForm.completed_work_id) : null,
      survey_id: invoiceForm.survey_id ? Number(invoiceForm.survey_id) : null,
      currency_id: Number(invoiceForm.currency_id) || 1,
      tax_id: invoiceForm.tax_id ? Number(invoiceForm.tax_id) : null,
      tax_type: invoiceForm.tax_type || null,
      cgst_amount: invoiceForm.cgst_amount || 0,
      sgst_amount: invoiceForm.sgst_amount || 0,
      igst_amount: invoiceForm.igst_amount || 0,
      tax_amount: invoiceForm.tax_amount || 0,
      invoice_date: invoiceForm.invoice_date,
      due_date: invoiceForm.due_date,
      invoice_type: invoiceForm.invoice_type || 'combined',
      items: invoiceForm.items,
      status: 'pending_approval',
    };

    const res = await apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      showSuccess('Invoice generated successfully! Pending approval.');
      setIsInvoiceModalOpen(false);
      fetchInvoices();
      fetchSchedules();
      fetchCompletedWorks();
    } else {
      showError(res.message || 'Failed to generate invoice.');
    }
  };

  const handleRegenerateInvoice = async (id: number) => {
    try {
      const res = await apiRequest(`/invoices/${id}/regenerate`, { method: 'POST' });
      if (res.success) {
        showSuccess('Draft invoice regenerated successfully from source changes');
        fetchInvoices();
      } else {
        showError(res.message || 'Failed to regenerate invoice');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to regenerate invoice');
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteInvoice) return;
    if (!creditNoteReason || creditNoteReason.trim().length < 5) {
      showError('A mandatory reason (minimum 5 characters) is required');
      return;
    }
    setIsSubmittingCreditNote(true);
    try {
      const res = await apiRequest(`/invoices/${creditNoteInvoice.invoice_id}/credit-note`, {
        method: 'POST',
        body: JSON.stringify({ reason: creditNoteReason }),
      });
      if (res.success) {
        showSuccess(`Credit Note issued successfully (${(res.data as any)?.invoice_number || 'Issued'})`);
        setIsCreditNoteModalOpen(false);
        setCreditNoteInvoice(null);
        setCreditNoteReason('');
        fetchInvoices();
      } else {
        showError(res.message || 'Failed to issue credit note');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to issue credit note');
    } finally {
      setIsSubmittingCreditNote(false);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviseInvoice) return;
    if (!reviseReason || reviseReason.trim().length < 5) {
      showError('A mandatory reason (minimum 5 characters) is required');
      return;
    }
    setIsSubmittingRevise(true);
    try {
      const res = await apiRequest(`/invoices/${reviseInvoice.invoice_id}/revise`, {
        method: 'POST',
        body: JSON.stringify({ reason: reviseReason }),
      });
      if (res.success) {
        showSuccess(`Invoice revised successfully as #${(res.data as any)?.invoice_number || 'Revised'}`);
        setIsReviseModalOpen(false);
        setReviseInvoice(null);
        setReviseReason('');
        fetchInvoices();
      } else {
        showError(res.message || 'Failed to revise invoice');
      }
    } catch (e: any) {
      showError(e.message || 'Failed to revise invoice');
    } finally {
      setIsSubmittingRevise(false);
    }
  };

  const handleApproveInvoice = async (id: number) => {
    try {
      setIsApprovingInvoice(id);
      const res = await apiRequest(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });

      if (res.success) {
        showSuccess('Invoice approved successfully!');
        fetchInvoices();
        fetchSchedules();
        fetchCompletedWorks();
      } else {
        showError(res.message || 'Failed to approve invoice.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to approve invoice.');
    } finally {
      setIsApprovingInvoice(null);
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    if (inv.status === 'draft' || inv.status === 'pending_approval') {
      showError('Cannot pay an unapproved invoice. Please approve the invoice first.');
      return;
    }
    if (inv.status === 'paid') {
      showError('This invoice is already fully paid.');
      return;
    }
    if (inv.status === 'cancelled') {
      showError('Cannot record payment for a cancelled invoice.');
      return;
    }
    setSelectedInvoice(inv);
    const remaining = Math.max(0, Math.round((Number(inv.total_amount) - Number(inv.paid_amount || 0)) * 100) / 100);
    setPaymentForm({
      invoice_id: inv.invoice_id,
      payment_date: new Date().toISOString().split('T')[0],
      amount: remaining,
      payment_method: 'Bank Transfer',
      reference_number: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;

    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      showError('Please enter a valid positive payment amount.');
      return;
    }

    if (selectedInvoice) {
      const alreadyPaid = Number(selectedInvoice.paid_amount || 0);
      const remaining = Math.round((Number(selectedInvoice.total_amount) - alreadyPaid) * 100) / 100;
      if (amt > remaining + 0.01) {
        showError(`Payment amount (${amt.toFixed(2)}) exceeds remaining balance of ${remaining.toFixed(2)}.`);
        return;
      }
    }

    setIsSubmittingPayment(true);
    try {
      const res = await apiRequest(`/invoices/${paymentForm.invoice_id}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentForm),
      });

      if (res.success) {
        showSuccess('Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        fetchInvoices();
        fetchSchedules();
      } else {
        showError(res.message || 'Failed to record payment.');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: number, invoiceNum: string) => {
    try {
      setIsDownloadingPdf(invoiceId);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        let errMsg = 'Failed to generate invoice PDF';
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch (_) { }
        showError(errMsg);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanNum = invoiceNum && !invoiceNum.includes('undefined') ? invoiceNum : `INV-${invoiceId}`;
      link.download = `${cleanNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess(`Invoice PDF (${cleanNum}) downloaded.`);
    } catch (err: any) {
      showError(err.message || 'Failed to download PDF.');
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/invoices/currencies', {
      method: 'POST',
      body: JSON.stringify(currencyForm),
    });

    if (res.success) {
      showSuccess('Currency master saved.');
      setIsCurrencyModalOpen(false);
      fetchMasters();
    } else {
      showError(res.message || 'Failed to save currency.');
    }
  };

  const openAddTaxModal = () => {
    setEditingTax(null);
    setTaxForm({
      tax_name: '',
      tax_code: '',
      tax_type: 'VAT',
      tax_percentage: 0,
      country_id: '',
      is_split: false,
      cgst_percentage: 0,
      sgst_percentage: 0,
      status: 1,
    });
    setIsTaxModalOpen(true);
  };

  const openEditTaxModal = (t: Tax) => {
    setEditingTax(t);
    setTaxForm({
      tax_name: t.tax_name,
      tax_code: t.tax_code || '',
      tax_type: t.tax_type || 'VAT',
      tax_percentage: Number(t.tax_percentage || 0),
      country_id: t.country_id ? String(t.country_id) : '',
      is_split: Boolean(t.is_split || t.tax_type === 'CGST_SGST'),
      cgst_percentage: Number(t.cgst_percentage || 0),
      sgst_percentage: Number(t.sgst_percentage || 0),
      status: Number(t.status !== undefined ? t.status : 1),
    });
    setIsTaxModalOpen(true);
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tax_name: taxForm.tax_name,
      tax_code: taxForm.tax_code || undefined,
      tax_type: taxForm.tax_type,
      tax_percentage: Number(taxForm.tax_percentage),
      country_id: taxForm.country_id ? Number(taxForm.country_id) : null,
      is_split: taxForm.is_split ? 1 : 0,
      cgst_percentage: taxForm.is_split ? Number(taxForm.cgst_percentage) : 0,
      sgst_percentage: taxForm.is_split ? Number(taxForm.sgst_percentage) : 0,
      status: taxForm.status,
    };

    const endpoint = editingTax ? `/masters/taxes/${editingTax.tax_id}` : '/masters/taxes';
    const method = editingTax ? 'PUT' : 'POST';

    const res = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.success) {
      showSuccess(editingTax ? 'Tax rule updated!' : 'Tax rule created!');
      setIsTaxModalOpen(false);
      fetchMasters();
    } else {
      showError(res.message || 'Failed to save tax rule.');
    }
  };

  const handleToggleTaxStatus = async (t: Tax) => {
    const newStatus = t.status === 1 ? 0 : 1;
    const res = await apiRequest(`/masters/taxes/${t.tax_id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      showSuccess(`Tax rule ${newStatus === 1 ? 'activated' : 'deactivated'}.`);
      fetchMasters();
    } else {
      showError(res.message || 'Failed to update tax status.');
    }
  };

  // Columns for Invoices Table
  const invoiceColumns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessor: (r) => {
        const num = r.invoice_number?.includes('undefined')
          ? r.invoice_number.replace('undefined', String(r.project_id || '8'))
          : r.invoice_number;
        return <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{num}</span>;
      },
      sortKey: 'invoice_number'
    },
    {
      header: 'Customer / Project',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.customer_name}</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.project_name}</div>
        </div>
      ),
    },
    {
      header: 'Month / Quotation',
      accessor: (r) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>Month: <strong>{r.billing_month ? new Date(r.billing_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</strong></div>
          <div style={{ color: '#6366f1' }}>Quote: {r.quotation_code || 'N/A'}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#38bdf8' }}>
            {r.currency_symbol || '$'} {Number(r.total_amount).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Sub: {Number(r.subtotal_amount).toLocaleString()} | Tax: {Number(r.tax_amount).toLocaleString()}
          </div>
        </div>
      ),
      sortKey: 'total_amount',
    },
    {
      header: 'Paid Amount',
      accessor: (r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#4ade80' }}>
            {r.currency_symbol || '$'} {Number(r.paid_amount || 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Dates',
      accessor: (r) => (
        <div style={{ fontSize: '0.78rem' }}>
          <div>Inv: {new Date(r.invoice_date).toLocaleDateString()}</div>
          <div style={{ color: '#f87171' }}>Due: {new Date(r.due_date).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => {
        const variantMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'secondary'> = {
          draft: 'secondary',
          pending_approval: 'warning',
          approved: 'info',
          sent: 'info',
          partially_paid: 'warning',
          paid: 'success',
          cancelled: 'danger',
        };
        return <Badge variant={variantMap[r.status] || 'secondary'}>{r.status.replace('_', ' ').toUpperCase()}</Badge>;
      },
      sortKey: 'status',
    },
  ];

  // Columns for Schedules
  const scheduleColumns: Column<BillingSchedule>[] = [
    {
      header: 'Billing Month',
      accessor: (r) => (
        <div style={{ fontWeight: 700, color: '#6366f1' }}>
          {new Date(r.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      ),
      sortKey: 'billing_month',
    },
    { header: 'Project', accessor: (r) => r.project_name || 'N/A' },
    { header: 'Customer', accessor: (r) => r.customer_name || 'N/A' },
    {
      header: 'Expected Amount',
      accessor: (r) => (
        <strong style={{ color: '#38bdf8' }}>
          {r.currency_symbol || '₹'} {Number(r.expected_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
      ),
      sortKey: 'expected_amount',
    },
    {
      header: 'Work Progress',
      accessor: (r) => (
        <div>
          {r.completed_work_id ? (
            <div>
              <Badge variant={r.work_status === 'approved' ? 'success' : 'warning'}>
                {r.completion_percentage}% Done ({r.work_status})
              </Badge>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                Approved: {r.currency_symbol || '₹'} {Number(r.approved_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No Work Logged</span>
          )}
        </div>
      ),
    },
    {
      header: 'Invoice Status',
      accessor: (r) => {
        if (!r.invoice_id) {
          return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Not Generated</span>;
        }
        const variantMap: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'secondary'> = {
          draft: 'secondary',
          pending_approval: 'warning',
          approved: 'info',
          sent: 'info',
          partially_paid: 'warning',
          paid: 'success',
          cancelled: 'danger',
        };
        const status = r.invoice_status || 'draft';
        const num = r.invoice_number?.includes('undefined')
          ? r.invoice_number.replace('undefined', String(r.project_id || '8'))
          : r.invoice_number;
        return (
          <div>
            <Badge variant={variantMap[status] || 'secondary'}>{status.replace('_', ' ').toUpperCase()}</Badge>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem', fontFamily: 'monospace' }}>
              {num}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Schedule Status',
      accessor: (r) => <Badge variant={r.status === 'invoiced' || r.status === 'paid' ? 'success' : 'secondary'}>{r.status.toUpperCase()}</Badge>,
      sortKey: 'status',
    },
  ];

  // Columns for Completed Work
  const completedWorkColumns: Column<MonthlyCompletedWork>[] = [
    {
      header: 'Month / Schedule',
      accessor: (r) => (
        <div style={{ fontWeight: 600 }}>
          {r.billing_month ? new Date(r.billing_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : `Schedule #${r.schedule_id}`}
        </div>
      ),
    },
    { header: 'Project', accessor: (r) => r.project_name || 'N/A' },
    {
      header: 'Completion %',
      accessor: (r) => <Badge variant="info">{r.completion_percentage}%</Badge>,
    },
    {
      header: 'Approved Billing Amount',
      accessor: (r) => (
        <strong style={{ color: '#4ade80' }}>
          {r.currency_symbol || '₹'} {Number(r.approved_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
      ),
    },
    {
      header: 'Status',
      accessor: (r) => <Badge variant={r.status === 'approved' ? 'success' : 'warning'}>{r.status.toUpperCase()}</Badge>,
    },
  ];

  return (
    <div>
      {!hideHeader && (
        <div className="page-header">
          <div>
            <h1 className="page-title">Project Monthly Invoices & Billing Workflow</h1>
            <p className="page-subtitle">Manage project billing schedules, monthly completion, tax calculations, & payments</p>
          </div>
        </div>
      )}

      {/* Filter / Action Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant={activeTab === 'invoices' ? 'primary' : 'secondary'} onClick={() => setActiveTab('invoices')}>
            <FileText size={16} /> Monthly Invoices
          </Button>
          <Button variant={activeTab === 'schedules' ? 'primary' : 'secondary'} onClick={() => setActiveTab('schedules')}>
            <Calendar size={16} /> Billing Schedules
          </Button>
          <Button variant={activeTab === 'completed_work' ? 'primary' : 'secondary'} onClick={() => setActiveTab('completed_work')}>
            <CheckCircle size={16} /> Completed Work Logs
          </Button>
          <Button variant={activeTab === 'masters' ? 'primary' : 'secondary'} onClick={() => setActiveTab('masters')}>
            <DollarSign size={16} /> Currencies & Taxes
          </Button>
        </div>

        {/* Project Selector Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '250px' }}>
            <SearchableSelect
              label=""
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val as string)}
              options={[
                { value: '', label: '-- All Projects --' },
                ...projects.map((p) => ({ value: String(p.project_id), label: `${p.project_code} - ${p.project_name}` })),
              ]}
              placeholder="Search project..."
            />
          </div>
          {isAdminOrManager && (
            <Button
              variant="primary"
              onClick={() => openGenerateInvoiceModal()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
            >
              <Plus size={15} /> Generate Invoice
            </Button>
          )}
          {activeTab === 'schedules' && isAdminOrManager && (
            <Button variant="secondary" onClick={handleAutoGenerateSchedules} style={{ border: '1px solid #6366f1', color: '#6366f1' }}>
              <RefreshCw size={14} /> Auto-Generate Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'invoices' && (
        <div className="glass-card">
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            searchPlaceholder="Search invoices by number, customer, project, date..."
            exportFilename="monthly_invoices"
            isLoading={isLoading}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  disabled={isDownloadingPdf === row.invoice_id}
                  onClick={() => handleDownloadPdf(row.invoice_id, row.invoice_number)}
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                >
                  <Download size={13} /> {isDownloadingPdf === row.invoice_id ? 'Downloading...' : 'PDF'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openEmailInvoiceModal(row)}
                  style={{
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.78rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Send Tax Invoice and Photographic Report to customer email"
                >
                  <Mail size={13} /> Email
                </Button>
                {isAdminOrManager && (row.status === 'draft' || row.status === 'pending_approval') && (
                  <Button
                    variant="primary"
                    disabled={isApprovingInvoice === row.invoice_id}
                    onClick={() => handleApproveInvoice(row.invoice_id)}
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: '#16a34a' }}
                  >
                    <CheckCircle size={13} /> {isApprovingInvoice === row.invoice_id ? 'Approving...' : 'Approve'}
                  </Button>
                )}
                {isAdminOrManager && (row.status === 'approved' || row.status === 'partially_paid') && (
                  <Button
                    variant="secondary"
                    onClick={() => openPaymentModal(row)}
                    style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                  >
                    <CreditCard size={13} /> Pay
                  </Button>
                )}
              </div>
            )}
          />
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="glass-card">
          <DataTable
            columns={scheduleColumns}
            data={schedules}
            searchPlaceholder="Search billing schedules..."
            exportFilename="billing_schedules"
            isLoading={isLoading}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {row.status === 'pending' && isAdminOrManager && (
                  <Button variant="primary" onClick={() => openLogCompletedWorkModal(row)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                    <CheckCircle size={13} /> Log Monthly Work
                  </Button>
                )}
                {row.invoice_id ? (
                  <>
                    <Button
                      variant="secondary"
                      disabled={isDownloadingPdf === row.invoice_id}
                      onClick={() => handleDownloadPdf(row.invoice_id!, row.invoice_number || '')}
                      style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                    >
                      <Download size={13} /> {isDownloadingPdf === row.invoice_id ? 'Downloading...' : 'PDF'}
                    </Button>
                    {isAdminOrManager && (row.invoice_status === 'draft' || row.invoice_status === 'pending_approval') && (
                      <Button
                        variant="primary"
                        disabled={isApprovingInvoice === row.invoice_id}
                        onClick={() => handleApproveInvoice(row.invoice_id!)}
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: '#16a34a' }}
                      >
                        <CheckCircle size={13} /> Approve
                      </Button>
                    )}
                    {isAdminOrManager && (row.invoice_status === 'approved' || row.invoice_status === 'partially_paid') && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const inv = invoices.find(i => i.invoice_id === row.invoice_id);
                          if (inv) openPaymentModal(inv);
                          else {
                            apiRequest<Invoice>(`/invoices/${row.invoice_id}`).then(res => {
                              if (res.success && res.data) openPaymentModal(res.data);
                            });
                          }
                        }}
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                      >
                        <CreditCard size={13} /> Pay
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            )}
          />
        </div>
      )}

      {activeTab === 'completed_work' && (
        <div className="glass-card">
          <DataTable
            columns={completedWorkColumns}
            data={completedWorks}
            searchPlaceholder="Search completed work submissions..."
            exportFilename="completed_work_logs"
            isLoading={isLoading}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {row.status !== 'approved' && isAdminOrManager && (
                  <Button variant="primary" onClick={() => handleApproveCompletedWork(row.completed_work_id)} style={{ padding: '0.35rem 0.58rem', fontSize: '0.78rem', background: '#16a34a' }}>
                    Approve Work
                  </Button>
                )}
                {row.status === 'approved' && isAdminOrManager && (
                  <Button variant="primary" onClick={() => openGenerateInvoiceModal(row)} style={{ padding: '0.35rem 0.58rem', fontSize: '0.78rem' }}>
                    <FileText size={13} /> Generate Invoice
                  </Button>
                )}
              </div>
            )}
          />
        </div>
      )}

      {activeTab === 'masters' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Currencies Master */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={18} color="#38bdf8" /> Currency Master</h3>
              {isAdminOrManager && <Button variant="secondary" onClick={() => setIsCurrencyModalOpen(true)}><Plus size={14} /> Add Currency</Button>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Code</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Symbol</th>
                  <th style={{ padding: '0.5rem' }}>Rate</th>
                  <th style={{ padding: '0.5rem' }}>Base?</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => (
                  <tr key={c.currency_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.currency_code}</td>
                    <td style={{ padding: '0.5rem' }}>{c.currency_name}</td>
                    <td style={{ padding: '0.5rem', color: '#38bdf8' }}>{c.symbol}</td>
                    <td style={{ padding: '0.5rem' }}>{c.exchange_rate}</td>
                    <td style={{ padding: '0.5rem' }}>{c.is_base ? <Badge variant="success">Yes</Badge> : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Taxes Master */}
          <div className="glass-card" style={{ padding: '1.5rem', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Percent size={18} color="#a855f7" /> Country-Wise Tax Master</h3>
              {isAdminOrManager && <Button variant="secondary" onClick={openAddTaxModal}><Plus size={14} /> Add Tax Rule</Button>}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Tax Code</th>
                  <th style={{ padding: '0.5rem' }}>Tax Name</th>
                  <th style={{ padding: '0.5rem' }}>Type</th>
                  <th style={{ padding: '0.5rem' }}>Rate (%)</th>
                  <th style={{ padding: '0.5rem' }}>Split Details</th>
                  <th style={{ padding: '0.5rem' }}>Country</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  {isAdminOrManager && <th style={{ padding: '0.5rem', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {taxes.map((t) => (
                  <tr key={t.tax_id} style={{ borderBottom: '1px solid var(--border-color)', opacity: t.status === 1 ? 1 : 0.6 }}>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{t.tax_code || '-'}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{t.tax_name}</td>
                    <td style={{ padding: '0.5rem' }}><Badge variant="info">{t.tax_type || 'VAT'}</Badge></td>
                    <td style={{ padding: '0.5rem', color: '#a855f7', fontWeight: 700 }}>{t.tax_percentage}%</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.78rem' }}>
                      {t.is_split || t.tax_type === 'CGST_SGST' ? (
                        <span style={{ color: '#38bdf8' }}>CGST ({t.cgst_percentage || t.tax_percentage / 2}%) + SGST ({t.sgst_percentage || t.tax_percentage / 2}%)</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Single Rate</span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{t.country_name || 'All Countries'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {t.status === 1 ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
                    </td>
                    {isAdminOrManager && (
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          <button onClick={() => openEditTaxModal(t)} title="Edit Tax Rule" style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '0.2rem' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleToggleTaxStatus(t)} title={t.status === 1 ? 'Deactivate' : 'Activate'} style={{ background: 'transparent', border: 'none', color: t.status === 1 ? '#ef4444' : '#4ade80', cursor: 'pointer', padding: '0.2rem' }}>
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Completed Work Modal */}
      <Modal isOpen={isCompletedWorkModalOpen} onClose={() => setIsCompletedWorkModalOpen(false)} title="Log Monthly Completed Work">
        <form onSubmit={handleSubmitCompletedWork}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Completion Percentage (%)"
              type="number"
              value={String(completedWorkForm.completion_percentage)}
              onChange={(e) => {
                const pct = Number(e.target.value);
                const expected = selectedSchedule ? Number(selectedSchedule.expected_amount) : 0;
                setCompletedWorkForm({
                  ...completedWorkForm,
                  completion_percentage: pct,
                  approved_amount: (expected * pct) / 100,
                });
              }}
              required
            />
            <FormInput
              label={`Claimed Billing Amount (${selectedSchedule?.currency_symbol || '₹'})`}
              type="number"
              value={String(completedWorkForm.approved_amount)}
              onChange={(e) => setCompletedWorkForm({ ...completedWorkForm, approved_amount: Number(e.target.value) })}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCompletedWorkModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Completed Work</Button>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generate Monthly Invoice" size="xl">
        <form onSubmit={handleSubmitInvoice}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-primary)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem'
          }}>
            <SearchableSelect
              label="Select Project *"
              value={invoiceForm.project_id}
              onChange={(val) => {
                const pid = Number(val);
                setInvoiceForm(prev => ({ ...prev, project_id: val, schedule_id: '' }));
                if (pid) {
                  openGenerateInvoiceModal(undefined, undefined, pid);
                }
              }}
              options={projects.map((p) => ({ value: String(p.project_id), label: `${p.project_code} - ${p.project_name}` }))}
              required
            />
            <SearchableSelect
              label="Target Billing Schedule (Optional)"
              value={invoiceForm.schedule_id}
              onChange={(val) => {
                const sch = schedules.find(s => String(s.schedule_id) === val);
                if (sch) setSelectedSchedule(sch);
                else setSelectedSchedule(null);
                setInvoiceForm(prev => ({ ...prev, schedule_id: val }));
              }}
              options={[
                { value: '', label: '-- Ad-hoc / Monthly Milestone (No Schedule) --' },
                ...schedules
                  .filter(s => String(s.project_id) === String(invoiceForm.project_id) && s.status !== 'invoiced' && s.status !== 'paid')
                  .map((s) => ({
                    value: String(s.schedule_id),
                    label: `Schedule #${s.schedule_id} - ${s.billing_month ? s.billing_month.split('T')[0] : ''} (Expected: ${s.currency_symbol || '₹'}${Number(s.expected_amount).toLocaleString()})`
                  }))
              ]}
            />
            <SearchableSelect
              label="Select Currency"
              value={invoiceForm.currency_id}
              onChange={(val) => setInvoiceForm({ ...invoiceForm, currency_id: val })}
              options={currencies.map((c) => ({ value: String(c.currency_id), label: `${c.currency_code} (${c.symbol})` }))}
              required
            />
            <SearchableSelect
              label="Country Filter (Tax Scope)"
              value={invoiceCountryId}
              onChange={(val) => setInvoiceCountryId(val)}
              options={[
                { value: '', label: '-- All Countries / Automatic --' },
                ...countries.map((c) => ({ value: String(c.country_id), label: `${c.country_name} (${c.country_code})` })),
              ]}
            />
            <SearchableSelect
              label="Select Tax Rule"
              value={invoiceForm.tax_id}
              onChange={(val) => handleRecalculateInvoiceTax(val, invoiceForm.items)}
              options={[
                { value: '', label: '-- No Tax (0%) --' },
                ...(invoiceCountryId
                  ? taxes.filter(t => !t.country_id || String(t.country_id) === String(invoiceCountryId))
                  : taxes
                ).map((t) => ({ value: String(t.tax_id), label: `${t.tax_name} (${t.tax_percentage}%) ${t.country_name ? `[${t.country_name}]` : ''}` })),
              ]}
            />
            <SearchableSelect
              label="Attach Site Survey Report (Optional)"
              value={invoiceForm.survey_id}
              onChange={(val) => setInvoiceForm({ ...invoiceForm, survey_id: val })}
              options={[
                { value: '', label: '-- None Attached --' },
                ...projectSurveys.map((s) => ({
                  value: String(s.survey_id),
                  label: `${s.survey_code} (${s.survey_date}) - ${s.discipline_name || 'General'}`,
                })),
              ]}
            />
            <FormInput
              label="Invoice Date"
              type="date"
              value={invoiceForm.invoice_date}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
              required
            />
            <FormInput
              label="Due Date"
              type="date"
              value={invoiceForm.due_date}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              required
            />
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            {/* Quick Populate & Invoice Type Selection Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
              background: 'var(--bg-primary)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Presets:</span>
                {projectCosts && (
                  <>
                    {isMaterialEnabled && isLabourEnabled && (
                      <button
                        type="button"
                        onClick={handlePopulateCombined}
                        className="btn"
                        style={{
                          background: invoiceForm.invoice_type === 'combined' ? '#2563eb' : 'rgba(37, 99, 235, 0.1)',
                          color: invoiceForm.invoice_type === 'combined' ? '#ffffff' : '#2563eb',
                          border: '1px solid #2563eb',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Generate combined invoice containing both labour and materials"
                      >
                        ⚡ Combined ({currencies.find(c => String(c.currency_id) === invoiceForm.currency_id)?.symbol || '₹'}{Number(projectCosts.total_cost || 0).toLocaleString()})
                      </button>
                    )}

                    {isLabourEnabled && (
                      <button
                        type="button"
                        onClick={handlePopulateLabourOnly}
                        className="btn"
                        style={{
                          background: invoiceForm.invoice_type === 'labour' ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                          color: invoiceForm.invoice_type === 'labour' ? '#ffffff' : '#059669',
                          border: '1px solid #059669',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Generate separate Labour Only invoice"
                      >
                        👷 Labour Only ({currencies.find(c => String(c.currency_id) === invoiceForm.currency_id)?.symbol || '₹'}{Number(projectCosts.total_labour_amount || 0).toLocaleString()})
                      </button>
                    )}

                    {isMaterialEnabled && (
                      <button
                        type="button"
                        onClick={handlePopulateMaterialsOnly}
                        className="btn"
                        style={{
                          background: invoiceForm.invoice_type === 'material' ? '#d97706' : 'rgba(217, 119, 6, 0.1)',
                          color: invoiceForm.invoice_type === 'material' ? '#ffffff' : '#d97706',
                          border: '1px solid #d97706',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Generate separate Material Only invoice"
                      >
                        🧱 Materials Only ({currencies.find(c => String(c.currency_id) === invoiceForm.currency_id)?.symbol || '₹'}{Number(projectCosts.total_material_amount || 0).toLocaleString()})
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={handlePopulateWbsWise}
                  className="btn"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Generate invoice items grouped by WBS milestone package"
                >
                  📑 Group by WBS
                </button>
                <button
                  type="button"
                  onClick={handlePopulateScheduledAmount}
                  className="btn"
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Reset line items to milestone scheduled amount"
                >
                  📋 Milestone ({currencies.find(c => String(c.currency_id) === invoiceForm.currency_id)?.symbol || '₹'}{Number(selectedCompletedWork ? selectedCompletedWork.approved_amount : (selectedSchedule?.expected_amount || 0)).toLocaleString()})
                </button>
              </div>

              <Button type="button" variant="secondary" onClick={() => {
                const newItems = [...invoiceForm.items, { discipline_id: null, description: '', amount: 0, is_extra_work: true }];
                updateInvoiceItems(newItems);
              }} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Plus size={14} /> Add Extra Work
              </Button>
            </div>

            {/* Line Items Table with Dedicated Horizontal Scroll Container */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              overflowX: 'auto',
              background: 'var(--bg-card)',
              WebkitOverflowScrolling: 'touch',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '22%', fontWeight: 600, color: 'var(--text-secondary)' }}>Discipline</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '40%', fontWeight: 600, color: 'var(--text-secondary)' }}>Description *</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '12%', fontWeight: 600, color: 'var(--text-secondary)' }}>Work Type</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '20%', fontWeight: 600, color: 'var(--text-secondary)' }}>Amount ({currencies.find(c => String(c.currency_id) === invoiceForm.currency_id)?.symbol || '₹'}) *</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '6%', fontWeight: 600, color: 'var(--text-secondary)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceForm.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <SearchableSelect
                          label=""
                          value={item.discipline_id ? String(item.discipline_id) : ''}
                          onChange={(val) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].discipline_id = val ? Number(val) : null;
                            updateInvoiceItems(newItems);
                          }}
                          options={[
                            { value: '', label: '-- General / Unplanned --' },
                            ...disciplines.map(d => ({ value: String(d.discipline_id), label: d.discipline_name }))
                          ]}
                          placeholder="Select Discipline"
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].description = e.target.value;
                            updateInvoiceItems(newItems);
                          }}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                          placeholder="Line item description"
                          required
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <select
                          value={item.is_extra_work ? '1' : '0'}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].is_extra_work = e.target.value === '1';
                            updateInvoiceItems(newItems);
                          }}
                          style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                        >
                          <option value="0">Normal</option>
                          <option value="1">Extra Work</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].amount = Number(e.target.value);
                            updateInvoiceItems(newItems);
                          }}
                          style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600, fontSize: '0.82rem' }}
                          required
                          min="0"
                        />
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {idx > 0 && (
                          <Button type="button" variant="secondary" onClick={() => {
                            const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                            updateInvoiceItems(newItems);
                          }} style={{ padding: '0.35rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Remove Line Item">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(() => {
            const cur = currencies.find(c => String(c.currency_id) === invoiceForm.currency_id) || currencies[0];
            const sym = cur?.symbol || '₹';
            const labourSum = invoiceForm.items
              .filter(it => (it as any).item_type === 'labour' || it.description.startsWith('Labour:'))
              .reduce((s, it) => s + Number(it.amount || 0), 0);
            const materialSum = invoiceForm.items
              .filter(it => (it as any).item_type === 'material' || it.description.startsWith('Material:'))
              .reduce((s, it) => s + Number(it.amount || 0), 0);

            return (
              <div style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                background: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {labourSum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#059669', fontSize: '0.88rem' }}>
                    <span>👷 Labour Subtotal:</span>
                    <strong style={{ fontWeight: 600 }}>{sym} {labourSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
                {materialSum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#d97706', fontSize: '0.88rem' }}>
                    <span>🧱 Material Subtotal:</span>
                    <strong style={{ fontWeight: 600 }}>{sym} {materialSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: (labourSum > 0 || materialSum > 0) ? '1px dashed var(--border-color)' : 'none',
                  paddingTop: (labourSum > 0 || materialSum > 0) ? '0.45rem' : '0',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  <span>Gross Subtotal:</span>
                  <strong style={{ fontWeight: 600 }}>{sym} {invoiceForm.subtotal_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                {invoiceForm.cgst_amount > 0 || invoiceForm.sgst_amount > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284c7', fontSize: '0.88rem' }}>
                      <span>CGST Amount:</span>
                      <strong style={{ fontWeight: 600 }}>+ {sym} {invoiceForm.cgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284c7', fontSize: '0.88rem' }}>
                      <span>SGST Amount:</span>
                      <strong style={{ fontWeight: 600 }}>+ {sym} {invoiceForm.sgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </>
                ) : invoiceForm.igst_amount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284c7', fontSize: '0.88rem' }}>
                    <span>IGST Amount:</span>
                    <strong style={{ fontWeight: 600 }}>+ {sym} {invoiceForm.igst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9333ea', fontSize: '0.88rem' }}>
                    <span>Tax ({taxes.find(t => String(t.tax_id) === invoiceForm.tax_id)?.tax_name || 'Standard'}):</span>
                    <strong style={{ fontWeight: 600 }}>+ {sym} {invoiceForm.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.25rem',
                  color: 'var(--success, #16a34a)',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid var(--border-color)',
                  fontWeight: 700
                }}>
                  <span>Grand Total ({cur?.currency_code || 'INR'}):</span>
                  <span>{sym} {invoiceForm.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate & Save Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoice_number?.includes('undefined') ? selectedInvoice.invoice_number.replace('undefined', String(selectedInvoice.project_id || '8')) : selectedInvoice?.invoice_number || ''}`}
      >
        <form onSubmit={handleSubmitPayment}>
          {selectedInvoice && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(56,189,248,0.08)', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <div>Total: <strong>{selectedInvoice.currency_symbol || '$'} {Number(selectedInvoice.total_amount).toLocaleString()}</strong></div>
              <div>Paid: <strong style={{ color: '#4ade80' }}>{selectedInvoice.currency_symbol || '$'} {Number(selectedInvoice.paid_amount || 0).toLocaleString()}</strong></div>
              <div>Outstanding: <strong style={{ color: '#f87171' }}>{selectedInvoice.currency_symbol || '$'} {Math.max(0, Number(selectedInvoice.total_amount) - Number(selectedInvoice.paid_amount || 0)).toLocaleString()}</strong></div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Payment Date"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              required
            />
            <FormInput
              label="Payment Amount"
              type="number"
              step="0.01"
              value={String(paymentForm.amount)}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              required
            />
            <FormSelect
              label="Payment Method"
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              options={[
                { value: 'Bank Transfer', label: 'Bank Transfer / Wire' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Cash', label: 'Cash' },
                { value: 'Credit Card', label: 'Credit Card' },
              ]}
              required
            />
            <FormInput
              label="Reference / Transaction #"
              placeholder="e.g. CHQ-98124 or TXN-8120"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)} disabled={isSubmittingPayment}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSubmittingPayment}>
              {isSubmittingPayment ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Currency Modal */}
      <Modal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} title="Add New Currency">
        <form onSubmit={handleCreateCurrency}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Currency Code" placeholder="e.g. AED, INR, USD" value={currencyForm.currency_code} onChange={(e) => setCurrencyForm({ ...currencyForm, currency_code: e.target.value.toUpperCase() })} required />
            <FormInput label="Currency Name" placeholder="e.g. UAE Dirham" value={currencyForm.currency_name} onChange={(e) => setCurrencyForm({ ...currencyForm, currency_name: e.target.value })} required />
            <FormInput label="Symbol" placeholder="e.g. AED, ₹, $" value={currencyForm.symbol} onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })} required />
            <FormInput label="Exchange Rate (Base)" type="number" step="0.0001" value={String(currencyForm.exchange_rate)} onChange={(e) => setCurrencyForm({ ...currencyForm, exchange_rate: Number(e.target.value) })} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsCurrencyModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Currency</Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Tax Modal */}
      <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={editingTax ? "Edit Tax Rule" : "Add Tax Rule"}>
        <form onSubmit={handleSaveTax}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput label="Tax Name" placeholder="e.g. GST Intra-State 18%, UAE VAT 5%" value={taxForm.tax_name} onChange={(e) => setTaxForm({ ...taxForm, tax_name: e.target.value })} required />
            <FormInput label="Tax Code (Optional)" placeholder="e.g. CGST_SGST_18, VAT5" value={taxForm.tax_code} onChange={(e) => setTaxForm({ ...taxForm, tax_code: e.target.value.toUpperCase() })} />
            <FormSelect
              label="Tax Type"
              value={taxForm.tax_type}
              onChange={(e) => {
                const type = e.target.value as any;
                const isSplit = type === 'CGST_SGST';
                setTaxForm({ ...taxForm, tax_type: type, is_split: isSplit });
              }}
              options={[
                { value: 'VAT', label: 'VAT (Value Added Tax)' },
                { value: 'GST', label: 'GST (General Sales Tax)' },
                { value: 'CGST_SGST', label: 'CGST + SGST (Intra-State India Split)' },
                { value: 'IGST', label: 'IGST (Inter-State India)' },
                { value: 'SALES_TAX', label: 'Sales Tax' },
                { value: 'OTHER', label: 'Other Tax' },
              ]}
              required
            />
            <FormSelect
              label="Country Scope"
              value={taxForm.country_id}
              onChange={(e) => setTaxForm({ ...taxForm, country_id: e.target.value })}
              options={[
                { value: '', label: '-- All Countries / Global --' },
                ...countries.map((c) => ({ value: String(c.country_id), label: `${c.country_name} (${c.country_code})` })),
              ]}
            />
            <FormInput label="Total Tax Rate (%)" type="number" step="0.01" value={String(taxForm.tax_percentage)} onChange={(e) => {
              const val = Number(e.target.value);
              setTaxForm({
                ...taxForm,
                tax_percentage: val,
                cgst_percentage: taxForm.is_split ? val / 2 : taxForm.cgst_percentage,
                sgst_percentage: taxForm.is_split ? val / 2 : taxForm.sgst_percentage,
              });
            }} required />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input
                type="checkbox"
                id="is_split_check"
                checked={taxForm.is_split}
                onChange={(e) => setTaxForm({
                  ...taxForm,
                  is_split: e.target.checked,
                  tax_type: e.target.checked ? 'CGST_SGST' : taxForm.tax_type,
                  cgst_percentage: e.target.checked ? taxForm.tax_percentage / 2 : 0,
                  sgst_percentage: e.target.checked ? taxForm.tax_percentage / 2 : 0,
                })}
              />
              <label htmlFor="is_split_check" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Split Tax into CGST + SGST</label>
            </div>
            {taxForm.is_split && (
              <>
                <FormInput label="CGST Rate (%)" type="number" step="0.01" value={String(taxForm.cgst_percentage)} onChange={(e) => setTaxForm({ ...taxForm, cgst_percentage: Number(e.target.value) })} required />
                <FormInput label="SGST Rate (%)" type="number" step="0.01" value={String(taxForm.sgst_percentage)} onChange={(e) => setTaxForm({ ...taxForm, sgst_percentage: Number(e.target.value) })} required />
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsTaxModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Tax Rule</Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Details Modal */}
      <Modal
        isOpen={isViewDetailsOpen}
        onClose={() => {
          setIsViewDetailsOpen(false);
          setViewingInvoice(null);
          setInvoicePaymentsList([]);
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span>Invoice Details: {viewingInvoice?.invoice_number || 'Loading...'}</span>
            {viewingInvoice && (
              <>
                <Badge variant={
                  viewingInvoice.status === 'paid' ? 'success' :
                    viewingInvoice.status === 'approved' ? 'info' :
                      viewingInvoice.status === 'pending_approval' ? 'warning' : 'secondary'
                }>
                  {viewingInvoice.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {viewingInvoice.invoice_type && (
                  <span style={{
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    background: viewingInvoice.invoice_type === 'labour' ? '#ecfdf5' : (viewingInvoice.invoice_type === 'material' ? '#fffbeb' : '#eff6ff'),
                    color: viewingInvoice.invoice_type === 'labour' ? '#047857' : (viewingInvoice.invoice_type === 'material' ? '#b45309' : '#1d4ed8'),
                    border: '1px solid currentColor'
                  }}>
                    {viewingInvoice.invoice_type}
                  </span>
                )}
              </>
            )}
          </div>
        }
        size="2xl"
      >
        {isLoadingDetails ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading invoice details...
          </div>
        ) : !viewingInvoice ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            Invoice not found or could not be loaded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quick Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Billing Month: <strong>{viewingInvoice.billing_month ? new Date(viewingInvoice.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={() => openEmailInvoiceModal(viewingInvoice)}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', background: '#4f46e5', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Mail size={14} /> Send to Customer Email
                </Button>
                <Button variant="secondary" onClick={() => handleDownloadPdf(viewingInvoice.invoice_id, viewingInvoice.invoice_number)} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
                  <Download size={14} /> Download PDF
                </Button>
                {isAdminOrManager && viewingInvoice.status === 'pending_approval' && (
                  <Button variant="primary" onClick={() => { handleApproveInvoice(viewingInvoice.invoice_id); setIsViewDetailsOpen(false); }} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', background: '#16a34a' }}>
                    <CheckCircle size={14} /> Approve Invoice
                  </Button>
                )}
                {isAdminOrManager && viewingInvoice.status !== 'paid' && viewingInvoice.status !== 'cancelled' && (
                  <Button variant="secondary" onClick={() => { setIsViewDetailsOpen(false); openPaymentModal(viewingInvoice); }} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                    <CreditCard size={14} /> Record Payment
                  </Button>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {/* Customer Box */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Customer Details
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{viewingInvoice.customer_name || 'N/A'}</div>
                {viewingInvoice.customer_email && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✉️ {viewingInvoice.customer_email}</div>}
                {viewingInvoice.customer_phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {viewingInvoice.customer_phone}</div>}
                {viewingInvoice.customer_address && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>📍 {viewingInvoice.customer_address}</div>}
              </div>

              {/* Project Box */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Project Info
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{viewingInvoice.project_name || 'N/A'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>Code: {viewingInvoice.project_code || 'PRJ-' + viewingInvoice.project_id}</div>
                {viewingInvoice.quotation_code && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quotation: {viewingInvoice.quotation_code}</div>}
                {viewingInvoice.survey_code && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Survey: {viewingInvoice.survey_code}</div>}
              </div>

              {/* Invoice Dates Box */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Invoice Dates
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice Date: </span>
                  <strong>{viewingInvoice.invoice_date ? new Date(viewingInvoice.invoice_date).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Due Date: </span>
                  <strong style={{ color: '#ef4444' }}>{viewingInvoice.due_date ? new Date(viewingInvoice.due_date).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Schedule #{viewingInvoice.schedule_id}
                </div>
              </div>

              {/* Currency & Tax Meta */}
              <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--card-bg, #f8fafc)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Currency & Tax
                </div>
                <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Currency: </span>
                  <strong>{viewingInvoice.currency_code || 'INR'} ({viewingInvoice.currency_symbol || '₹'})</strong>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tax Rule: </span>
                  <strong>{viewingInvoice.tax_name || 'General Tax'} ({Number(viewingInvoice.tax_percentage || 0)}%)</strong>
                </div>
                {viewingInvoice.tax_type && (
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.2rem' }}>
                    Type: {viewingInvoice.tax_type}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Invoice Line Items ({viewingInvoice.items?.length || 0})
                </h4>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '40px' }}>#</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '22%' }}>Discipline / WBS</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>Description / Work Details</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '90px' }}>Type</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '120px' }}>Qty & Rate</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '120px' }}>Amount ({viewingInvoice.currency_symbol || '₹'})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!viewingInvoice.items || viewingInvoice.items.length === 0) ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No line items found for this invoice.
                        </td>
                      </tr>
                    ) : (
                      viewingInvoice.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                            {item.discipline_name || item.wbs_name || 'General Work'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <div style={{ color: 'var(--text-primary)' }}>{item.description}</div>
                            {item.task_name && <div style={{ fontSize: '0.74rem', color: '#6366f1' }}>Task: {item.task_name}</div>}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: item.item_type === 'labour' ? '#ecfdf5' : (item.item_type === 'material' ? '#fffbeb' : '#f1f5f9'),
                              color: item.item_type === 'labour' ? '#065f46' : (item.item_type === 'material' ? '#92400e' : '#475569'),
                            }}>
                              {(item.item_type || 'Work').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {item.quantity ? `${item.quantity} × ${Number(item.rate || 0).toFixed(2)}` : '-'}
                          </td>
                          <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {viewingInvoice.currency_symbol || '₹'}{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Payments History Box */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Payment History ({invoicePaymentsList.length})
                  </h5>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a' }}>
                    Paid: {viewingInvoice.currency_symbol || '₹'}{Number(viewingInvoice.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {invoicePaymentsList.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No payments recorded yet for this invoice.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                    {invoicePaymentsList.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--card-bg, #ffffff)', borderRadius: '4px', fontSize: '0.78rem', border: '1px solid var(--border-color)' }}>
                        <div>
                          <strong>{new Date(p.payment_date).toLocaleDateString()}</strong> - {p.payment_method}
                          {p.reference_number && <span style={{ color: 'var(--text-muted)' }}> (#{p.reference_number})</span>}
                        </div>
                        <strong style={{ color: '#16a34a' }}>
                          + {viewingInvoice.currency_symbol || '₹'}{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax & Grand Total Box */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                {(() => {
                  const sym = viewingInvoice.currency_symbol || '₹';
                  const labourSum = viewingInvoice.items
                    ?.filter(it => it.item_type === 'labour' || it.description.startsWith('Labour:'))
                    .reduce((s, it) => s + Number(it.amount || 0), 0) || 0;
                  const materialSum = viewingInvoice.items
                    ?.filter(it => it.item_type === 'material' || it.description.startsWith('Material:'))
                    .reduce((s, it) => s + Number(it.amount || 0), 0) || 0;
                  const balanceDue = Number(viewingInvoice.total_amount) - Number(viewingInvoice.paid_amount || 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {labourSum > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                          <span>👷 Labour Subtotal:</span>
                          <strong>{sym} {labourSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      )}
                      {materialSum > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d97706' }}>
                          <span>🧱 Material Subtotal:</span>
                          <strong>{sym} {materialSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: (labourSum > 0 || materialSum > 0) ? '1px dashed var(--border-color)' : 'none', paddingTop: (labourSum > 0 || materialSum > 0) ? '0.35rem' : '0' }}>
                        <span>Gross Subtotal:</span>
                        <strong>{sym} {Number(viewingInvoice.subtotal_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>

                      {Number(viewingInvoice.cgst_amount || 0) > 0 || Number(viewingInvoice.sgst_amount || 0) > 0 ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                            <span>CGST Amount:</span>
                            <strong>+ {sym} {Number(viewingInvoice.cgst_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                            <span>SGST Amount:</span>
                            <strong>+ {sym} {Number(viewingInvoice.sgst_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </div>
                        </>
                      ) : Number(viewingInvoice.igst_amount || 0) > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7' }}>
                          <span>IGST Amount:</span>
                          <strong>+ {sym} {Number(viewingInvoice.igst_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
                          <span>Tax ({viewingInvoice.tax_name || 'Applied Tax'}):</span>
                          <strong>+ {sym} {Number(viewingInvoice.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: '#16a34a', paddingTop: '0.45rem', borderTop: '1px solid var(--border-color)', fontWeight: 750 }}>
                        <span>Grand Total ({viewingInvoice.currency_code || 'INR'}):</span>
                        <strong>{sym} {Number(viewingInvoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', paddingTop: '0.2rem' }}>
                        <span>Paid Amount:</span>
                        <strong>- {sym} {Number(viewingInvoice.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: balanceDue > 0 ? '#dc2626' : '#16a34a', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)', fontWeight: 700 }}>
                        <span>Balance Due:</span>
                        <strong>{sym} {balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsViewDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Invoice & Site Survey Report Dispatch Modal */}
      {isEmailInvoiceModalOpen && emailingInvoice && (
        <Modal
          isOpen={isEmailInvoiceModalOpen}
          onClose={() => setIsEmailInvoiceModalOpen(false)}
          title={`Email Tax Invoice: #${emailingInvoice.invoice_number}`}
        >
          <form onSubmit={handleSendInvoiceEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div><strong>Client:</strong> {emailingInvoice.customer_name || 'Valued Client'}</div>
                <div><strong>Project:</strong> {emailingInvoice.project_name} ({emailingInvoice.project_code || 'PRJ-' + emailingInvoice.project_id})</div>
                <div><strong>Invoice Total:</strong> {emailingInvoice.currency_symbol || '₹'} {Number(emailingInvoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div><strong>Due Date:</strong> {emailingInvoice.due_date ? new Date(emailingInvoice.due_date).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6366f1', borderTop: '1px dashed rgba(99, 102, 241, 0.2)', paddingTop: '0.4rem' }}>
                📎 <strong>Attachments:</strong> Tax-Invoice-{emailingInvoice.invoice_number}.pdf
                {includeSurveyReport && (emailingInvoice.survey_id || selectedSurveyIdForEmail) && (
                  <span> + Photographic-Report-{emailingInvoice.survey_code || 'PLN-03-F04'}.pdf</span>
                )}
              </div>
            </div>

            <FormInput
              label="Recipient Email Address *"
              type="email"
              placeholder="e.g. client@example.com"
              value={invoiceRecipientEmail}
              onChange={(e) => setInvoiceRecipientEmail(e.target.value)}
              required
            />

            <FormInput
              label="Email Subject *"
              placeholder="Email subject line..."
              value={invoiceEmailSubject}
              onChange={(e) => setInvoiceEmailSubject(e.target.value)}
              required
            />

            {/* Photographic Report Attachment Toggle */}
            <div style={{ padding: '0.85rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={includeSurveyReport}
                  onChange={(e) => setIncludeSurveyReport(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
                />
                📷 Attach Site Photographic Progress Report (PLN-03-F04 Multi-Page PDF)
              </label>

              {includeSurveyReport && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {emailingInvoice.survey_id ? (
                    <div style={{ color: '#0369a1', fontWeight: 600 }}>
                      ✓ Linked Survey: {emailingInvoice.survey_code ? `Ref ${emailingInvoice.survey_code}` : `Survey #${emailingInvoice.survey_id}`} will be compiled and attached.
                    </div>
                  ) : projectSurveys.length > 0 ? (
                    <div>
                      <span style={{ display: 'block', marginBottom: '0.3rem' }}>Select which completed site survey report to attach:</span>
                      <SearchableSelect
                        label=""
                        value={selectedSurveyIdForEmail}
                        onChange={(val) => setSelectedSurveyIdForEmail(val)}
                        options={projectSurveys.map((s) => ({
                          value: String(s.survey_id),
                          label: `${s.report_number || s.survey_code} (${s.survey_date}) - ${s.discipline_name || 'General Site'}`,
                        }))}
                        placeholder="Choose Site Survey Report"
                      />
                    </div>
                  ) : (
                    <div style={{ color: '#d97706', fontSize: '0.78rem' }}>
                      ℹ️ Note: No survey report is currently linked to this invoice. A general project photographic report will be included if available.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Email Message Body
              </label>
              <textarea
                value={invoiceEmailMessage}
                onChange={(e) => setInvoiceEmailMessage(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsEmailInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSendingInvoiceEmail} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Send size={15} /> {isSendingInvoiceEmail ? 'Dispatching...' : 'Send Invoice via Email'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default Invoices;
