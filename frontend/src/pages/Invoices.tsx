import React, { useEffect, useState } from 'react';
import { DataTable, Column } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { apiRequest } from '../services/api';
import { Invoice, BillingSchedule, MonthlyCompletedWork, Currency, Tax, Country, Project, Customer, InvoicePayment, SiteSurvey, Discipline, InvoiceItem } from '../types';
import { Plus, FileText, CheckCircle, CreditCard, DollarSign, Percent, Calendar, Download, RefreshCw, Eye, AlertCircle, ClipboardCheck, Trash2, Edit2, Power } from 'lucide-react';
import { SearchableSelect } from '../components/forms/SearchableSelect';
import { showSuccess, showError } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

export const Invoices: React.FC<{ projectId?: number }> = ({ projectId }) => {
  const { user } = useAuth();
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId ? String(projectId) : '');
  const [invoiceCountryId, setInvoiceCountryId] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(String(projectId));
    }
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

  const openGenerateInvoiceModal = async (cw?: MonthlyCompletedWork) => {
    if (cw) {
      setSelectedCompletedWork(cw);
      const sub = Number(cw.approved_amount);
      const defaultCurrency = currencies.find(c => c.is_base === 1) || currencies[0];
      const defaultTax = taxes[0];
      const taxRate = defaultTax ? Number(defaultTax.tax_percentage) : 0;
      const isSplit = defaultTax ? Boolean(defaultTax.is_split || defaultTax.tax_type === 'CGST_SGST') : false;
      const cgstPct = defaultTax && isSplit ? Number(defaultTax.cgst_percentage || taxRate / 2) : 0;
      const sgstPct = defaultTax && isSplit ? Number(defaultTax.sgst_percentage || taxRate / 2) : 0;
      const cgstAmt = isSplit ? (sub * cgstPct) / 100 : 0;
      const sgstAmt = isSplit ? (sub * sgstPct) / 100 : 0;
      const taxAmt = isSplit ? cgstAmt + sgstAmt : (sub * taxRate) / 100;
      const igstAmt = (!isSplit && defaultTax && defaultTax.tax_type === 'IGST') ? taxAmt : 0;

      // Fetch site surveys for this project
      const surveyRes = await apiRequest<SiteSurvey[]>(`/site-surveys?project_id=${cw.project_id}`);
      if (surveyRes.success && surveyRes.data) {
        setProjectSurveys(surveyRes.data);
      } else {
        setProjectSurveys([]);
      }

      setInvoiceForm({
        customer_id: '', // repo automatically resolves from project
        project_id: String(cw.project_id),
        quotation_id: '',
        schedule_id: String(cw.schedule_id),
        completed_work_id: String(cw.completed_work_id),
        survey_id: '',
        currency_id: defaultCurrency ? String(defaultCurrency.currency_id) : '',
        tax_id: defaultTax ? String(defaultTax.tax_id) : '',
        tax_type: defaultTax ? defaultTax.tax_type || '' : '',
        cgst_amount: cgstAmt,
        sgst_amount: sgstAmt,
        igst_amount: igstAmt,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal_amount: sub,
        tax_amount: taxAmt,
        total_amount: sub + taxAmt,
        items: [
          {
            description: `Monthly Billing Schedule #${cw.schedule_id}`,
            amount: sub,
            is_extra_work: false,
          }
        ]
      });
    }
    setIsInvoiceModalOpen(true);
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
    const payload = {
      schedule_id: Number(invoiceForm.schedule_id),
      completed_work_id: Number(invoiceForm.completed_work_id),
      survey_id: invoiceForm.survey_id ? Number(invoiceForm.survey_id) : null,
      currency_id: Number(invoiceForm.currency_id),
      tax_id: invoiceForm.tax_id ? Number(invoiceForm.tax_id) : null,
      tax_type: invoiceForm.tax_type || null,
      cgst_amount: invoiceForm.cgst_amount || 0,
      sgst_amount: invoiceForm.sgst_amount || 0,
      igst_amount: invoiceForm.igst_amount || 0,
      tax_amount: invoiceForm.tax_amount || 0,
      invoice_date: invoiceForm.invoice_date,
      due_date: invoiceForm.due_date,
      items: invoiceForm.items,
    };

    const res = await apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      showSuccess('Invoice generated successfully!');
      setIsInvoiceModalOpen(false);
      fetchInvoices();
    } else {
      showError(res.message || 'Failed to generate invoice.');
    }
  };

  const handleApproveInvoice = async (id: number) => {
    const res = await apiRequest(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });

    if (res.success) {
      showSuccess('Invoice approved!');
      fetchInvoices();
    } else {
      showError(res.message || 'Failed to approve invoice.');
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = Number(inv.total_amount) - Number(inv.paid_amount || 0);
    setPaymentForm({
      invoice_id: inv.invoice_id,
      payment_date: new Date().toISOString().split('T')[0],
      amount: remaining > 0 ? remaining : 0,
      payment_method: 'Bank Transfer',
      reference_number: '',
    });
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      showError('Please enter a valid payment amount.');
      return;
    }

    const res = await apiRequest(`/invoices/${paymentForm.invoice_id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentForm),
    });

    if (res.success) {
      showSuccess('Payment recorded successfully!');
      setIsPaymentModalOpen(false);
      fetchInvoices();
    } else {
      showError(res.message || 'Failed to record payment.');
    }
  };

  const handleDownloadPdf = (invoiceId: number, invoiceNum: string) => {
    const url = `/api/v1/invoices/${invoiceId}/pdf`;
    window.open(url, '_blank');
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
    { header: 'Invoice #', accessor: 'invoice_number', sortKey: 'invoice_number' },
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
      accessor: (r) => <strong style={{ color: '#38bdf8' }}>AED {Number(r.expected_amount).toLocaleString()}</strong>,
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
                Approved: AED {Number(r.approved_amount || 0).toLocaleString()}
              </div>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No Work Logged</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
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
      accessor: (r) => <strong style={{ color: '#4ade80' }}>AED {Number(r.approved_amount).toLocaleString()}</strong>,
    },
    {
      header: 'Status',
      accessor: (r) => <Badge variant={r.status === 'approved' ? 'success' : 'warning'}>{r.status.toUpperCase()}</Badge>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Monthly Invoices & Billing Workflow</h1>
          <p className="page-subtitle">Manage project billing schedules, monthly completion, tax calculations, & payments</p>
        </div>
      </div>

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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                <Button variant="secondary" onClick={() => handleDownloadPdf(row.invoice_id, row.invoice_number)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}>
                  <Download size={13} /> PDF
                </Button>
                {isAdminOrManager && row.status === 'pending_approval' && (
                  <Button variant="primary" onClick={() => handleApproveInvoice(row.invoice_id)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', background: '#16a34a' }}>
                    <CheckCircle size={13} /> Approve
                  </Button>
                )}
                {isAdminOrManager && row.status !== 'paid' && row.status !== 'cancelled' && (
                  <Button variant="secondary" onClick={() => openPaymentModal(row)} style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
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
              <div>
                {row.status === 'pending' && isAdminOrManager && (
                  <Button variant="primary" onClick={() => openLogCompletedWorkModal(row)} style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}>
                    <CheckCircle size={13} /> Log Monthly Work
                  </Button>
                )}
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
              label="Claimed Billing Amount (AED)"
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
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generate Monthly Invoice">
        <form onSubmit={handleSubmitInvoice}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Invoice Line Items</h4>
              <Button type="button" variant="secondary" onClick={() => {
                const newItems = [...invoiceForm.items, { discipline_id: null, description: '', amount: 0, is_extra_work: true }];
                updateInvoiceItems(newItems);
              }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Extra Work
              </Button>
            </div>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead style={{ background: 'var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '25%' }}>Discipline</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', width: '40%' }}>Description</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '10%' }}>Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', width: '20%' }}>Amount</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceForm.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.5rem' }}>
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
                      <td style={{ padding: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].description = e.target.value;
                            updateInvoiceItems(newItems);
                          }}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                          placeholder="Line item description"
                          required
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <select 
                          value={item.is_extra_work ? '1' : '0'}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].is_extra_work = e.target.value === '1';
                            updateInvoiceItems(newItems);
                          }}
                          style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        >
                          <option value="0">Normal</option>
                          <option value="1">Extra Work</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input 
                          type="number" 
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...invoiceForm.items];
                            newItems[idx].amount = Number(e.target.value);
                            updateInvoiceItems(newItems);
                          }}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', textAlign: 'right' }}
                          required
                          min="0"
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {idx > 0 && (
                          <Button type="button" variant="secondary" onClick={() => {
                            const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                            updateInvoiceItems(newItems);
                          }} style={{ padding: '0.3rem', color: '#ef4444' }}>
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

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--border-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span>Subtotal Amount:</span>
              <strong>{invoiceForm.subtotal_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            {invoiceForm.cgst_amount > 0 || invoiceForm.sgst_amount > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#38bdf8' }}>
                  <span>CGST Amount:</span>
                  <strong>+ {invoiceForm.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#38bdf8' }}>
                  <span>SGST Amount:</span>
                  <strong>+ {invoiceForm.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </>
            ) : invoiceForm.igst_amount > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#38bdf8' }}>
                <span>IGST Amount:</span>
                <strong>+ {invoiceForm.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#a855f7' }}>
                <span>Tax Amount ({taxes.find(t => String(t.tax_id) === invoiceForm.tax_id)?.tax_name || 'Tax'}):</span>
                <strong>+ {invoiceForm.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', color: '#4ade80', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontWeight: 700 }}>
              <span>Grand Total:</span>
              <strong>{invoiceForm.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate & Save Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment for ${selectedInvoice?.invoice_number}`}>
        <form onSubmit={handleSubmitPayment}>
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
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Record Payment</Button>
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
    </div>
  );
};
export default Invoices;
