import React, { useEffect, useState } from 'react';
import {
  Package,
  Boxes,
  Layers,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Plus,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Building2,
  Clock,
  Eye,
  XCircle,
  FileSpreadsheet,
  ArrowLeftRight,
  RefreshCw,
  Send,
  FileBarChart,
  Filter,
  Calendar,
  Check,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { SearchableSelect } from '../components/forms/SearchableSelect';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { showSuccess, showError } from '../utils/toast';
import { ProcurementReportsTab } from '../components/procurement/ProcurementReportsTab';
import { DataTable, Column } from '../components/common/DataTable';
import { useConfirm } from '../context/ConfirmationContext';

export interface ProcurementHubProps {
  initialTab?: 'stock' | 'po' | 'grn' | 'issues' | 'reports';
}

export const ProcurementHub: React.FC<ProcurementHubProps> = ({ initialTab = 'stock' }) => {
  const { hasPermission, user } = useAuth();
  const { confirm, promptModal } = useConfirm();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'stock' | 'po' | 'grn' | 'issues' | 'reports'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Master Lists
  const [stores, setStores] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projectWbsList, setProjectWbsList] = useState<any[]>([]);

  // ── Tab 1: Stock & Store Balances State ─────────────────────────────────
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [adjustForm, setAdjustForm] = useState({
    material_id: '',
    store_id: '1',
    adjusted_qty: 0,
    rate: 0,
    reason: '',
  });
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  // Stock Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferForm, setTransferForm] = useState({
    from_store_id: '1',
    to_store_id: '2',
    material_id: '',
    quantity: 1,
    reason: '',
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);

  // ── Tab 2: GRN State ───────────────────────────────────────────────────
  const [grns, setGrns] = useState<any[]>([]);
  const [isLoadingGrn, setIsLoadingGrn] = useState<boolean>(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState<boolean>(false);
  const [selectedGrn, setSelectedGrn] = useState<any | null>(null);
  const [isPostingGrn, setIsPostingGrn] = useState<number | null>(null);
  const [isLoadingPoLines, setIsLoadingPoLines] = useState<boolean>(false);

  // GRN Form State
  const [grnForm, setGrnForm] = useState({
    project_id: '',
    po_id: '',
    vendor_id: '',
    store_id: '1',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_challan_number: '',
    challan_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    remarks: '',
    items: [
      {
        po_item_id: null as number | null,
        material_id: '',
        material_name: '',
        unit: 'Nos',
        ordered_quantity: 0,
        previously_received: 0,
        pending_quantity: 0,
        received_quantity: 1,
        accepted_quantity: 1,
        rejected_quantity: 0,
        damaged_quantity: 0,
        short_quantity: 0,
        unit_rate: 0,
      },
    ],
  });

  // GRN Reversal State
  const [isReverseModalOpen, setIsReverseModalOpen] = useState<boolean>(false);
  const [reverseGrnId, setReverseGrnId] = useState<number | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');
  const [isReversingGrn, setIsReversingGrn] = useState<boolean>(false);

  // Vendor Invoice Creation State
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<number | null>(null);

  // ── Tab 3: Purchase Orders State ───────────────────────────────────────
  const [pos, setPos] = useState<any[]>([]);
  const [isLoadingPo, setIsLoadingPo] = useState<boolean>(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  const [isSubmittingPo, setIsSubmittingPo] = useState<boolean>(false);
  const [isApprovingPo, setIsApprovingPo] = useState<number | null>(null);
  const [isCancellingPo, setIsCancellingPo] = useState<number | null>(null);
  const [viewingPoDetails, setViewingPoDetails] = useState<any | null>(null);
  const [isLoadingPoDetails, setIsLoadingPoDetails] = useState<boolean>(false);
  const [poForm, setPoForm] = useState({
    project_id: '',
    wbs_id: '',
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    payment_terms: 'Net 30',
    delivery_address: '',
    terms_conditions: '',
    items: [
      {
        material_id: '',
        quantity: 10,
        unit_rate: 0,
        tax_percentage: 18,
        discount_amount: 0,
        remarks: '',
      },
    ],
  });


  // ── Tab 5: Material Issues State ───────────────────────────────────────
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [issueForm, setIssueForm] = useState({
    project_id: '',
    wbs_id: '',
    task_id: '',
    material_id: '',
    store_id: '1',
    quantity: 1,
    issue_date: new Date().toISOString().split('T')[0],
    site_location: '',
    remarks: '',
  });

  // Phase 5: Issue Context
  const [issueContext, setIssueContext] = useState<any | null>(null);
  const [isLoadingIssueContext, setIsLoadingIssueContext] = useState<boolean>(false);

  // Return Unused Material Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnIssue, setReturnIssue] = useState<any | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState<boolean>(false);

  // Filter & details modal state for Material Issues tab
  const [issueSearch, setIssueSearch] = useState<string>('');
  const [issueProjectFilter, setIssueProjectFilter] = useState<string>('');
  const [issueStatusFilter, setIssueStatusFilter] = useState<'all' | 'returnable' | 'reconciled'>('all');
  const [selectedSlipModal, setSelectedSlipModal] = useState<any | null>(null);

  // Load masters and all tab metrics on mount for immediate summary KPI cards
  useEffect(() => {
    fetchMasters();
    fetchStockData();
    fetchPos();
    fetchIssues();
    fetchGrns();
  }, []);

  // Re-fetch tab data when activeTab or store filter changes
  useEffect(() => {
    if (activeTab === 'stock') fetchStockData();
    if (activeTab === 'grn') {
      fetchGrns();
      fetchPos();
    }
    if (activeTab === 'po') fetchPos();
    if (activeTab === 'issues') fetchIssues();
  }, [activeTab, selectedStoreId]);

  const fetchMasters = async () => {
    try {
      const [storesRes, matRes, projRes, venRes] = await Promise.all([
        apiRequest<any[]>('/procurement/stores'),
        apiRequest<any[]>('/materials/master'),
        apiRequest<any[]>('/projects'),
        apiRequest<any[]>('/vendors').catch(() => ({ data: [] })),
      ]);
      setStores(storesRes.data || []);
      setMaterials(matRes.data || []);
      setProjects(projRes.data || []);
      setVendors(venRes.data || []);
    } catch (e: any) {
      console.warn('Failed to load masters:', e.message);
    }
  };

  const fetchStockData = async () => {
    setIsLoadingStock(true);
    try {
      let url = '/procurement/stock/balances?';
      if (selectedStoreId) url += `store_id=${selectedStoreId}&`;
      if (stockSearch) url += `search=${encodeURIComponent(stockSearch)}&`;

      const [balRes, ledgerRes] = await Promise.all([
        apiRequest<any[]>(url),
        apiRequest<any[]>('/procurement/stock/ledger?limit=100'),
      ]);
      setBalances(balRes.data || []);
      setLedger(ledgerRes.data || []);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch stock balances');
    } finally {
      setIsLoadingStock(false);
    }
  };

  const fetchGrns = async () => {
    setIsLoadingGrn(true);
    try {
      const res = await apiRequest<any[]>('/procurement/grn');
      setGrns(res.data || []);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch GRNs');
    } finally {
      setIsLoadingGrn(false);
    }
  };

  const fetchPos = async () => {
    setIsLoadingPo(true);
    try {
      const res = await apiRequest<any[]>('/procurement/purchase-orders');
      setPos(res.data || []);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch Purchase Orders');
    } finally {
      setIsLoadingPo(false);
    }
  };


  const fetchIssues = async () => {
    setIsLoadingIssues(true);
    try {
      const res = await apiRequest<any[]>('/procurement/issues');
      setIssues(res.data || []);
    } catch (e: any) {
      showError(e.message || 'Failed to fetch Material Issues');
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleFetchProjectWbs = async (projectId: string) => {
    if (!projectId) {
      setProjectWbsList([]);
      return;
    }
    try {
      const res = await apiRequest<any[]>(`/projects/${projectId}/wbs`);
      setProjectWbsList(res.data || []);
    } catch (e: any) {
      console.warn('Failed to load project WBS:', e.message);
    }
  };

  // ── Phase 4: Handle PO Select in Create GRN Modal ──────────────────────
  const handleSelectPoForGrn = async (poId: string) => {
    setGrnForm((prev) => ({ ...prev, po_id: poId }));
    if (!poId) return;

    setIsLoadingPoLines(true);
    try {
      const res = await apiRequest<any>(`/procurement/purchase-orders/${poId}/receivable-lines`);
      if (res.data) {
        const poData = res.data;
        const items = (poData.items || []).map((i: any) => ({
          po_item_id: i.po_item_id,
          material_id: String(i.material_id),
          material_name: i.material_name,
          unit: i.unit || 'Nos',
          ordered_quantity: Number(i.ordered_quantity || 0),
          previously_received: Number(i.previously_received || 0),
          pending_quantity: Number(i.pending_quantity || 0),
          received_quantity: Number(i.pending_quantity || 0),
          accepted_quantity: Number(i.pending_quantity || 0),
          rejected_quantity: 0,
          damaged_quantity: 0,
          short_quantity: 0,
          unit_rate: Number(i.unit_rate || 0),
        }));

        setGrnForm((prev) => ({
          ...prev,
          po_id: poId,
          project_id: String(poData.project_id || prev.project_id),
          vendor_id: String(poData.vendor_id || prev.vendor_id),
          items: items.length > 0 ? items : prev.items,
        }));
      }
    } catch (e: any) {
      showError(e.message || 'Failed to load PO receivable lines');
    } finally {
      setIsLoadingPoLines(false);
    }
  };

  // ── Phase 5: Fetch Issue Context ───────────────────────────────────────
  const fetchIssueContext = async (projectId: string, wbsId: string, materialId: string, storeId: string) => {
    if (!projectId || !wbsId || !materialId) {
      setIssueContext(null);
      return;
    }
    setIsLoadingIssueContext(true);
    try {
      const res = await apiRequest<any>(
        `/procurement/issue-context?project_id=${projectId}&wbs_id=${wbsId}&material_id=${materialId}&store_id=${storeId || 1}`
      );
      setIssueContext(res.data);
    } catch (e: any) {
      console.warn('Failed to load issue context:', e.message);
      setIssueContext(null);
    } finally {
      setIsLoadingIssueContext(false);
    }
  };

  // ── Stock Adjustment ───────────────────────────────────────────────────
  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.material_id || adjustForm.adjusted_qty === undefined) {
      showError('Material and adjusted quantity are required');
      return;
    }
    if (!adjustForm.reason || adjustForm.reason.trim().length < 5) {
      showError('A mandatory reason (minimum 5 characters) is required for audit compliance');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await apiRequest('/procurement/stock/adjust', {
        method: 'POST',
        body: JSON.stringify({
          material_id: Number(adjustForm.material_id),
          store_id: Number(adjustForm.store_id || 1),
          adjusted_qty: Number(adjustForm.adjusted_qty),
          rate: Number(adjustForm.rate || 0),
          reason: adjustForm.reason,
        }),
      });
      showSuccess('Stock adjustment posted successfully');
      setIsAdjustModalOpen(false);
      setAdjustForm({ material_id: '', store_id: '1', adjusted_qty: 0, rate: 0, reason: '' });
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Failed to adjust stock');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // ── Phase 5: Stock Transfer Between Stores ─────────────────────────────
  const handleStockTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.material_id || !transferForm.quantity || transferForm.quantity <= 0) {
      showError('Valid material and transfer quantity are required');
      return;
    }
    if (transferForm.from_store_id === transferForm.to_store_id) {
      showError('Source and destination stores must be different');
      return;
    }
    if (!transferForm.reason || transferForm.reason.trim().length < 5) {
      showError('A mandatory reason (min 5 chars) is required');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await apiRequest('/procurement/stock/transfer', {
        method: 'POST',
        body: JSON.stringify({
          from_store_id: Number(transferForm.from_store_id),
          to_store_id: Number(transferForm.to_store_id),
          material_id: Number(transferForm.material_id),
          quantity: Number(transferForm.quantity),
          reason: transferForm.reason,
        }),
      });
      showSuccess('Dual-entry stock transfer executed successfully');
      setIsTransferModalOpen(false);
      setTransferForm({ from_store_id: '1', to_store_id: '2', material_id: '', quantity: 1, reason: '' });
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Transfer failed');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // ── Post GRN (Transactional Stock Write) ───────────────────────────────
  const handlePostGrn = async (grnId: number) => {
    const isConfirmed = await confirm({
      title: 'Post GRN to Stock Ledger',
      message: 'Post this GRN into inventory? This locks PO lines, posts accepted quantity to the stock ledger, and transitions PO status.',
      confirmText: 'Post GRN',
      type: 'warning',
    });
    if (!isConfirmed) return;

    setIsPostingGrn(grnId);
    try {
      await apiRequest(`/procurement/grn/${grnId}/post`, { method: 'POST' });
      showSuccess('GRN posted successfully to stock ledger');
      fetchGrns();
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Failed to post GRN');
    } finally {
      setIsPostingGrn(null);
    }
  };

  // ── Phase 4: Reverse Posted GRN ────────────────────────────────────────
  const handleReverseGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reverseGrnId) return;
    if (!reverseReason || reverseReason.trim().length < 5) {
      showError('A mandatory reversal reason (minimum 5 characters) is required');
      return;
    }

    setIsReversingGrn(true);
    try {
      await apiRequest(`/procurement/grn/${reverseGrnId}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason: reverseReason }),
      });
      showSuccess('GRN reversed successfully. Inventory adjusted.');
      setIsReverseModalOpen(false);
      setReverseGrnId(null);
      setReverseReason('');
      fetchGrns();
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Failed to reverse GRN');
    } finally {
      setIsReversingGrn(false);
    }
  };

  // ── Phase 4: Create Vendor Invoice from Posted GRN ──────────────────────
  const handleCreateVendorInvoice = async (grnId: number) => {
    const isConfirmed = await confirm({
      title: 'Generate Vendor Invoice',
      message: 'Generate a vendor invoice matching this posted GRN?',
      confirmText: 'Generate Invoice',
      type: 'info',
    });
    if (!isConfirmed) return;

    setIsCreatingInvoice(grnId);
    try {
      const res = await apiRequest<any>(`/procurement/vendor-invoices/from-grn/${grnId}`, {
        method: 'POST',
      });
      showSuccess(`Vendor Invoice #${res.data?.invoice_number || 'Generated'} created successfully for ₹${Number(res.data?.payable_amount || 0).toLocaleString()}!`);
      fetchGrns();
    } catch (e: any) {
      showError(e.message || 'Failed to create vendor invoice');
    } finally {
      setIsCreatingInvoice(null);
    }
  };

  // ── Phase 3: Create Purchase Order ─────────────────────────────────────
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.project_id) {
      showError('Please select a project');
      return;
    }
    if (!poForm.vendor_id) {
      showError('Please select a vendor');
      return;
    }

    const validItems = poForm.items.filter((i) => i.material_id && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showError('Please add at least one line item with material and quantity > 0');
      return;
    }

    const selectedVendor = vendors.find((v) => String(v.vendor_id) === String(poForm.vendor_id));

    setIsSubmittingPo(true);
    try {
      const payload = {
        project_id: Number(poForm.project_id),
        wbs_id: poForm.wbs_id ? Number(poForm.wbs_id) : null,
        vendor_id: Number(poForm.vendor_id),
        vendor_name: selectedVendor?.vendor_name || 'Vendor',
        po_date: poForm.po_date,
        expected_delivery_date: poForm.expected_delivery_date || null,
        payment_terms: poForm.payment_terms || 'Net 30',
        delivery_address: poForm.delivery_address || null,
        terms_conditions: poForm.terms_conditions || null,
        items: validItems.map((item) => {
          const mat = materials.find((m) => String(m.material_id) === String(item.material_id));
          return {
            material_id: Number(item.material_id),
            material_name: mat?.material_name || 'Material',
            unit: mat?.unit || 'Nos',
            quantity: Number(item.quantity),
            unit_rate: Number(item.unit_rate),
            tax_percentage: Number(item.tax_percentage || 0),
            discount_amount: Number(item.discount_amount || 0),
            remarks: item.remarks || null,
          };
        }),
      };

      const res = await apiRequest<any>('/procurement/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success || res.data) {
        showSuccess('Purchase Order created successfully in Draft status');
        setIsPoModalOpen(false);
        // Reset form
        setPoForm({
          project_id: '',
          wbs_id: '',
          vendor_id: '',
          po_date: new Date().toISOString().split('T')[0],
          expected_delivery_date: '',
          payment_terms: 'Net 30',
          delivery_address: '',
          terms_conditions: '',
          items: [
            {
              material_id: '',
              quantity: 10,
              unit_rate: 0,
              tax_percentage: 18,
              discount_amount: 0,
              remarks: '',
            },
          ],
        });
        fetchPos();
      } else {
        showError(res.message || 'Failed to create Purchase Order');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create Purchase Order');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  const handleApprovePo = async (po: any) => {
    const isConfirmed = await confirm({
      title: 'Approve & Issue Purchase Order',
      message: (
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>
            Approve and issue Purchase Order <strong>#{po.po_number}</strong> to <strong>{po.vendor_name || 'Vendor'}</strong>?
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            This will transition the PO to ISSUED status and make items receivable in Goods Receipt Notes (GRN).
          </p>
        </div>
      ),
      confirmText: 'Approve & Issue',
      type: 'success',
    });

    if (!isConfirmed) return;

    setIsApprovingPo(po.po_id);
    try {
      await apiRequest(`/procurement/purchase-orders/${po.po_id}/approve`, {
        method: 'PATCH',
      });
      showSuccess(`PO #${po.po_number} approved and issued successfully`);
      fetchPos();
    } catch (err: any) {
      showError(err.message || 'Failed to approve Purchase Order');
    } finally {
      setIsApprovingPo(null);
    }
  };

  const handleCancelPo = async (po: any) => {
    const reason = await promptModal({
      title: 'Cancel Purchase Order',
      message: `Please specify the mandatory reason for cancelling PO #${po.po_number}. This will be logged in the audit trail.`,
      confirmText: 'Confirm Cancellation',
      type: 'danger',
      promptInput: {
        label: 'Cancellation Reason',
        placeholder: 'Enter reason (minimum 5 characters)...',
        minLength: 5,
        required: true,
      },
    });

    if (!reason) return;

    setIsCancellingPo(po.po_id);
    try {
      await apiRequest(`/procurement/purchase-orders/${po.po_id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      showSuccess(`PO #${po.po_number} cancelled`);
      fetchPos();
    } catch (err: any) {
      showError(err.message || 'Failed to cancel Purchase Order');
    } finally {
      setIsCancellingPo(null);
    }
  };

  const handleViewPoDetails = async (poId: number) => {
    setIsLoadingPoDetails(true);
    try {
      const res = await apiRequest<any>(`/procurement/purchase-orders/${poId}`);
      if (res.data) {
        setViewingPoDetails(res.data);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to load PO details');
    } finally {
      setIsLoadingPoDetails(false);
    }
  };

  // ── Submit Draft GRN ───────────────────────────────────────────────────
  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnForm.project_id || grnForm.items.length === 0 || !grnForm.items[0].material_id) {
      showError('Project and at least one material item are required');
      return;
    }

    // Validation checks
    for (const item of grnForm.items) {
      const rec = Number(item.received_quantity || 0);
      const acc = Number(item.accepted_quantity || 0);
      const rej = Number(item.rejected_quantity || 0);
      const dam = Number(item.damaged_quantity || 0);
      const pend = Number(item.pending_quantity || 0);

      if (grnForm.po_id && pend > 0 && rec > pend) {
        showError(`Over-receipt not permitted for material #${item.material_id}. Received: ${rec}, Pending: ${pend}`);
        return;
      }
      if (acc + rej + dam !== rec) {
        showError(`Math imbalance: Accepted (${acc}) + Rejected (${rej}) + Damaged (${dam}) must equal Received (${rec})`);
        return;
      }
    }

    try {
      await apiRequest('/procurement/grn', {
        method: 'POST',
        body: JSON.stringify({
          project_id: Number(grnForm.project_id),
          po_id: grnForm.po_id ? Number(grnForm.po_id) : null,
          vendor_id: grnForm.vendor_id ? Number(grnForm.vendor_id) : null,
          store_id: Number(grnForm.store_id || 1),
          delivery_date: grnForm.delivery_date,
          delivery_challan_number: grnForm.delivery_challan_number,
          challan_date: grnForm.challan_date,
          invoice_number: grnForm.invoice_number,
          invoice_date: grnForm.invoice_date,
          remarks: grnForm.remarks,
          items: grnForm.items.map((i) => ({
            po_item_id: i.po_item_id || null,
            material_id: Number(i.material_id),
            received_quantity: Number(i.received_quantity),
            accepted_quantity: Number(i.accepted_quantity),
            rejected_quantity: Number(i.rejected_quantity || 0),
            damaged_quantity: Number(i.damaged_quantity || 0),
            short_quantity: Number(i.short_quantity || 0),
            unit_rate: Number(i.unit_rate || 0),
          })),
        }),
      });
      showSuccess('Draft GRN created successfully');
      setIsGrnModalOpen(false);
      fetchGrns();
    } catch (e: any) {
      showError(e.message || 'Failed to create GRN');
    }
  };

  // ── Submit Material Issue Slip ─────────────────────────────────────────
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.project_id || !issueForm.wbs_id || !issueForm.material_id || !issueForm.quantity) {
      showError('Project, WBS discipline, material, and quantity are required');
      return;
    }

    if (issueContext && Number(issueForm.quantity) > Number(issueContext.available_stock)) {
      showError(`Insufficient stock. Required: ${issueForm.quantity}, Available: ${issueContext.available_stock}`);
      return;
    }

    try {
      await apiRequest('/procurement/issues', {
        method: 'POST',
        body: JSON.stringify({
          project_id: Number(issueForm.project_id),
          wbs_id: Number(issueForm.wbs_id),
          task_id: issueForm.task_id ? Number(issueForm.task_id) : null,
          material_id: Number(issueForm.material_id),
          store_id: Number(issueForm.store_id || 1),
          quantity: Number(issueForm.quantity),
          issue_date: issueForm.issue_date,
          site_location: issueForm.site_location,
          remarks: issueForm.remarks,
        }),
      });
      showSuccess('Material issued successfully from store');
      setIsIssueModalOpen(false);
      setIssueContext(null);
      fetchIssues();
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Failed to issue material');
    }
  };

  // ── Phase 5: Return Unused Material ────────────────────────────────────
  const handleReturnMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnIssue || !returnQuantity || returnQuantity <= 0) {
      showError('Valid return quantity is required');
      return;
    }

    const maxReturnable = Number(returnIssue.quantity) - Number(returnIssue.consumed_quantity || 0) - Number(returnIssue.returned_quantity || 0);
    if (returnQuantity > maxReturnable) {
      showError(`Cannot return ${returnQuantity} units. Max returnable balance is ${maxReturnable}`);
      return;
    }

    setIsSubmittingReturn(true);
    try {
      await apiRequest('/procurement/issues/return', {
        method: 'POST',
        body: JSON.stringify({
          issue_id: returnIssue.issue_id,
          return_quantity: Number(returnQuantity),
          reason: returnReason || 'Excess material returned to store',
        }),
      });
      showSuccess('Material returned to store inventory successfully');
      setIsReturnModalOpen(false);
      setReturnIssue(null);
      setReturnQuantity(1);
      setReturnReason('');
      fetchIssues();
      fetchStockData();
    } catch (e: any) {
      showError(e.message || 'Failed to return material');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const filteredIssues = issues.filter((i) => {
    const q = issueSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (i.issue_code && i.issue_code.toLowerCase().includes(q)) ||
      (i.material_name && i.material_name.toLowerCase().includes(q)) ||
      (i.project_name && i.project_name.toLowerCase().includes(q)) ||
      (i.wbs_name && i.wbs_name.toLowerCase().includes(q));

    const matchesProject = !issueProjectFilter || String(i.project_id) === String(issueProjectFilter);

    const issued = Number(i.quantity || 0);
    const consumed = Number(i.consumed_quantity || 0);
    const returned = Number(i.returned_quantity || 0);
    const returnable = Math.max(0, issued - consumed - returned);

    const matchesStatus =
      issueStatusFilter === 'all' ||
      (issueStatusFilter === 'returnable' && returnable > 0) ||
      (issueStatusFilter === 'reconciled' && returnable === 0);

    return matchesSearch && matchesProject && matchesStatus;
  });

  // ── DataTable Columns Definitions ──────────────────────────────────────────

  // Tab 1: Balances Table Columns
  const balanceColumns: Column<any>[] = [
    {
      header: 'Material',
      accessor: 'material_name',
      sortable: true,
      render: (b) => <span style={{ fontWeight: 600 }}>{b.material_name}</span>,
    },
    {
      header: 'Code',
      accessor: 'material_code',
      sortable: true,
      render: (b) => <span style={{ color: 'var(--text-secondary)' }}>{b.material_code || '-'}</span>,
    },
    { header: 'Store', accessor: 'store_name', sortable: true },
    {
      header: 'On-Hand',
      accessor: 'on_hand_qty',
      sortable: true,
      render: (b) => <strong style={{ color: 'var(--text-primary)' }}>{b.on_hand_qty} {b.unit}</strong>,
    },
    {
      header: 'Reserved',
      accessor: 'reserved_qty',
      sortable: true,
      render: (b) => <span style={{ color: 'var(--text-secondary)' }}>{b.reserved_qty} {b.unit}</span>,
    },
    {
      header: 'Available',
      accessor: 'available_qty',
      sortable: true,
      render: (b) => (
        <Badge variant={Number(b.available_qty) > 0 ? 'success' : 'neutral'}>
          {b.available_qty} {b.unit}
        </Badge>
      ),
    },
    {
      header: 'Avg Rate',
      accessor: 'average_rate',
      sortable: true,
      render: (b) => <span>₹{Number(b.average_rate || 0).toFixed(2)}</span>,
    },
    {
      header: 'Total Valuation',
      accessor: 'stock_valuation',
      sortable: true,
      render: (b) => <strong style={{ color: 'var(--text-primary)' }}>₹{Number(b.stock_valuation || 0).toLocaleString()}</strong>,
    },
  ];

  // Tab 1: Ledger Table Columns
  const ledgerColumns: Column<any>[] = [
    {
      header: 'Date',
      accessor: 'txn_date',
      sortable: true,
      render: (l) => <span style={{ color: 'var(--text-secondary)' }}>{l.txn_date}</span>,
    },
    {
      header: 'Txn Type',
      accessor: 'txn_type',
      sortable: true,
      render: (l) => (
        <Badge
          variant={
            l.qty_in > 0
              ? 'success'
              : l.txn_type === 'reversal' || l.txn_type === 'damage'
              ? 'danger'
              : 'info'
          }
        >
          {String(l.txn_type).toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Material',
      accessor: 'material_name',
      sortable: true,
      render: (l) => <span style={{ fontWeight: 600 }}>{l.material_name}</span>,
    },
    { header: 'Store', accessor: 'store_name', sortable: true },
    {
      header: 'In (+)',
      accessor: 'qty_in',
      sortable: true,
      render: (l) => (
        <span style={{ color: '#10b981', fontWeight: 600 }}>
          {l.qty_in > 0 ? `+${l.qty_in}` : '-'}
        </span>
      ),
    },
    {
      header: 'Out (-)',
      accessor: 'qty_out',
      sortable: true,
      render: (l) => (
        <span style={{ color: '#ef4444', fontWeight: 600 }}>
          {l.qty_out > 0 ? `-${l.qty_out}` : '-'}
        </span>
      ),
    },
    {
      header: 'Balance',
      accessor: 'balance_after',
      sortable: true,
      render: (l) => <strong>{l.balance_after}</strong>,
    },
    {
      header: 'Reference / Project',
      accessor: (l) => `${l.ref_type}: #${l.ref_id || 'N/A'} ${l.project_name ? `(${l.project_name})` : ''}`,
      sortable: true,
      render: (l) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          {l.ref_type}: #{l.ref_id || 'N/A'} {l.project_name ? `(${l.project_name})` : ''}
        </span>
      ),
    },
  ];

  // Tab 2: GRN Table Columns
  const grnColumns: Column<any>[] = [
    {
      header: 'GRN #',
      accessor: 'grn_number',
      sortable: true,
      render: (g) => <strong style={{ color: 'var(--text-primary)' }}>{g.grn_number}</strong>,
    },
    {
      header: 'PO #',
      accessor: (g) => (g.po_number ? `#${g.po_number}` : 'Direct'),
      sortable: true,
      render: (g) => <span style={{ color: 'var(--text-secondary)' }}>{g.po_number ? `#${g.po_number}` : 'Direct'}</span>,
    },
    { header: 'Project', accessor: (g) => g.project_name || 'Central', sortable: true },
    { header: 'Vendor', accessor: (g) => g.vendor_name || '-', sortable: true },
    { header: 'Delivery Date', accessor: 'delivery_date', sortable: true },
    {
      header: 'DC # / Inv #',
      accessor: (g) => g.delivery_challan_number || g.invoice_number || '-',
      sortable: true,
      render: (g) => <span style={{ color: 'var(--text-secondary)' }}>{g.delivery_challan_number || g.invoice_number || '-'}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (g) => (
        <Badge
          variant={
            g.status === 'posted'
              ? 'success'
              : g.status === 'reversed'
              ? 'info'
              : g.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
        >
          {String(g.status).toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Value',
      accessor: 'total_grn_value',
      sortable: true,
      render: (g) => <span>₹{Number(g.total_grn_value || 0).toLocaleString()}</span>,
    },
  ];

  // Tab 3: Purchase Orders Columns
  const poColumns: Column<any>[] = [
    {
      header: 'PO #',
      accessor: 'po_number',
      sortable: true,
      render: (p) => <strong style={{ color: 'var(--text-primary)' }}>{p.po_number}</strong>,
    },
    { header: 'Vendor', accessor: (p) => p.vendor_name || '-', sortable: true },
    { header: 'Project', accessor: (p) => p.project_name || '-', sortable: true },
    { header: 'Date', accessor: 'po_date', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (p) => (
        <Badge
          variant={
            p.status === 'completed'
              ? 'success'
              : p.status === 'partially_received'
              ? 'info'
              : p.status === 'cancelled'
              ? 'danger'
              : 'warning'
          }
        >
          {String(p.status).toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      sortable: true,
      render: (p) => <strong style={{ color: 'var(--text-primary)' }}>₹{Number(p.total_amount || 0).toLocaleString()}</strong>,
    },
    {
      header: 'Actions',
      accessor: (p) => p.po_id,
      render: (p) => (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => handleViewPoDetails(p.po_id)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            title="View PO Details & Line Items"
          >
            <Eye size={13} /> View
          </Button>

          {p.status === 'draft' && hasPermission('purchase_orders', 'approve') && (
            <Button
              variant="primary"
              onClick={() => handleApprovePo(p)}
              disabled={isApprovingPo === p.po_id}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: '#10b981',
                borderColor: '#10b981'
              }}
              title="Approve & Issue to Vendor"
            >
              <Check size={13} /> {isApprovingPo === p.po_id ? '...' : 'Approve'}
            </Button>
          )}

          {p.status === 'draft' && hasPermission('purchase_orders', 'update') && (
            <Button
              variant="danger"
              onClick={() => handleCancelPo(p)}
              disabled={isCancellingPo === p.po_id}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              title="Cancel Purchase Order"
            >
              <XCircle size={13} /> {isCancellingPo === p.po_id ? '...' : 'Cancel'}
            </Button>
          )}
        </div>
      ),
    },
  ];


  // Tab 5: Material Issues Columns
  const issueColumns: Column<any>[] = [
    {
      header: 'Slip #',
      accessor: 'issue_number',
      sortable: true,
      render: (i) => <strong style={{ color: 'var(--text-primary)' }}>{i.issue_number}</strong>,
    },
    { header: 'Date', accessor: 'issue_date', sortable: true },
    {
      header: 'Project & WBS',
      accessor: (i) => `${i.project_name || '-'} ${i.wbs_name || ''}`,
      sortable: true,
      render: (i) => (
        <div>
          <div style={{ fontWeight: 600 }}>{i.project_name || 'Central'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{i.wbs_name || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Material',
      accessor: 'material_name',
      sortable: true,
      render: (i) => <span style={{ fontWeight: 600 }}>{i.material_name}</span>,
    },
    {
      header: 'Issued',
      accessor: 'quantity',
      sortable: true,
      render: (i) => <strong style={{ color: '#6366f1' }}>{i.quantity} {i.unit}</strong>,
    },
    {
      header: 'Consumed',
      accessor: 'consumed_quantity',
      sortable: true,
      render: (i) => <span style={{ color: '#10b981', fontWeight: 600 }}>{i.consumed_quantity || 0} {i.unit}</span>,
    },
    {
      header: 'Returned',
      accessor: 'returned_quantity',
      sortable: true,
      render: (i) => <span style={{ color: '#3b82f6', fontWeight: 600 }}>{i.returned_quantity || 0} {i.unit}</span>,
    },
    {
      header: 'Returnable',
      accessor: (i) => Math.max(0, Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0)),
      sortable: true,
      render: (i) => {
        const returnable = Math.max(0, Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0));
        return (
          <div>
            <strong style={{ color: returnable > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
              {returnable} {i.unit}
            </strong>
            <div className="procurement-progress-bar" style={{ marginTop: '4px', width: '90px' }}>
              <div style={{ width: `${Math.min(100, ((i.consumed_quantity || 0) / (i.quantity || 1)) * 100)}%`, background: '#10b981' }} />
              <div style={{ width: `${Math.min(100, ((i.returned_quantity || 0) / (i.quantity || 1)) * 100)}%`, background: '#3b82f6' }} />
              <div style={{ width: `${Math.min(100, (returnable / (i.quantity || 1)) * 100)}%`, background: '#f59e0b' }} />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (i) => (Math.max(0, Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0)) > 0 ? 'Active On-Site' : 'Fully Reconciled'),
      sortable: true,
      render: (i) => {
        const returnable = Math.max(0, Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0));
        return returnable > 0 ? (
          <Badge variant="warning">Active On-Site</Badge>
        ) : (
          <Badge variant="success">Fully Reconciled</Badge>
        );
      },
    },
  ];

  return (
    <div className="procurement-hub-container">
      {/* Responsive Header */}
      <div className="procurement-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="procurement-header-title">
              <Boxes size={28} style={{ color: '#6366f1' }} />
              Procurement & Inventory Control
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Append-Only Ledger Active
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Single-source-of-truth inventory ledger, PO receiving, vendor invoicing, and project allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => {
              fetchMasters();
              if (activeTab === 'stock') fetchStockData();
              if (activeTab === 'grn') fetchGrns();
              if (activeTab === 'po') fetchPos();
              if (activeTab === 'issues') fetchIssues();
              showSuccess('Inventory data refreshed');
            }}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} style={{ marginRight: '0.4rem' }} /> Refresh
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="procurement-kpi-grid">
        <div className="procurement-kpi-card">
          <div className="procurement-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <RotateCcw size={22} />
          </div>
          <div>
            <div className="procurement-kpi-value">{issues.length}</div>
            <div className="procurement-kpi-label">Site Dispatches</div>
          </div>
        </div>

        <div className="procurement-kpi-card">
          <div className="procurement-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Building2 size={22} />
          </div>
          <div>
            <div className="procurement-kpi-value">{stores.length || 1}</div>
            <div className="procurement-kpi-label">Active Stores</div>
          </div>
        </div>

        <div className="procurement-kpi-card">
          <div className="procurement-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="procurement-kpi-value">
              {issues.filter((i) => Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0) > 0).length}
            </div>
            <div className="procurement-kpi-label">Returnable On-Site</div>
          </div>
        </div>

        <div className="procurement-kpi-card">
          <div className="procurement-kpi-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
            <Truck size={22} />
          </div>
          <div>
            <div className="procurement-kpi-value">{pos.length}</div>
            <div className="procurement-kpi-label">Purchase Orders</div>
          </div>
        </div>
      </div>

      {/* Responsive Segmented Tab Navigation Track */}
      <div className="procurement-tabs-track">
        <button
          className={`procurement-tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <Layers size={17} /> Store Inventory & Ledger
          {balances.length > 0 && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: activeTab === 'stock' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-primary)', fontWeight: 700 }}>
              {balances.length}
            </span>
          )}
        </button>

        <button
          className={`procurement-tab-btn ${activeTab === 'po' ? 'active' : ''}`}
          onClick={() => setActiveTab('po')}
        >
          <FileText size={17} /> Purchase Orders
          {pos.length > 0 && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: activeTab === 'po' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-primary)', fontWeight: 700 }}>
              {pos.length}
            </span>
          )}
        </button>

        <button
          className={`procurement-tab-btn ${activeTab === 'grn' ? 'active' : ''}`}
          onClick={() => setActiveTab('grn')}
        >
          <Truck size={17} /> Goods Receipt Notes (GRN)
          {grns.length > 0 && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: activeTab === 'grn' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-primary)', fontWeight: 700 }}>
              {grns.length}
            </span>
          )}
        </button>

        <button
          className={`procurement-tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          <RotateCcw size={17} /> Material Issues & Returns
          {issues.length > 0 && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: activeTab === 'issues' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-primary)', fontWeight: 700 }}>
              {issues.length}
            </span>
          )}
        </button>

        <button
          className={`procurement-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileBarChart size={17} /> Reports & Analytics
          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: activeTab === 'reports' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-primary)', fontWeight: 700 }}>
            7
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TAB 1: Store Inventory & Ledger
      ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="form-select"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  minWidth: '220px',
                }}
              >
                <option value="">All Physical Stores</option>
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name} ({s.location || 'Central'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasPermission('material_issue', 'transfer') && (
                <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)}>
                  <ArrowLeftRight size={16} style={{ marginRight: '0.4rem' }} /> Transfer Between Stores
                </Button>
              )}
              {hasPermission('stock', 'adjust') && (
                <Button variant="primary" onClick={() => setIsAdjustModalOpen(true)}>
                  <Sliders size={16} style={{ marginRight: '0.4rem' }} /> Adjust Stock
                </Button>
              )}
            </div>
          </div>

          {/* Balances Grid DataTable */}
          <div className="procurement-table-card" style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Live Store On-Hand & Available Quantities
            </div>
            <DataTable
              columns={balanceColumns}
              data={balances}
              exportFilename="live_inventory_balances.csv"
              searchPlaceholder="Filter material, code, store..."
              isLoading={isLoadingStock}
              keyExtractor={(b) => `${b.material_id}-${b.store_id}`}
            />
          </div>

          {/* Stock Ledger Audit Trail DataTable */}
          <div className="procurement-table-card" style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Immutable Append-Only Stock Ledger (Audit Trail)
            </div>
            <DataTable
              columns={ledgerColumns}
              data={ledger}
              exportFilename="append_only_stock_ledger.csv"
              searchPlaceholder="Search txn type, material, store, project..."
              keyExtractor={(l) => String(l.ledger_id)}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 2: Goods Receipt Notes (GRN)
      ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'grn' && (
        <div className="procurement-table-card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Goods Receipt Notes (GRN)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Inspect, accept, reject or post vendor deliveries to inventory
              </div>
            </div>
          </div>
          <DataTable
            columns={grnColumns}
            data={grns}
            exportFilename="goods_receipt_notes.csv"
            searchPlaceholder="Search GRN #, PO #, project, vendor..."
            isLoading={isLoadingGrn}
            toolbarActions={
              hasPermission('grn', 'create') && (
                <Button variant="primary" onClick={() => setIsGrnModalOpen(true)} style={{ height: '36px' }}>
                  <Plus size={16} style={{ marginRight: '0.4rem' }} /> Create Draft GRN
                </Button>
              )
            }
            actions={(g) => (
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                {g.status === 'draft' && hasPermission('grn', 'post') && (
                  <Button
                    variant="primary"
                    onClick={() => handlePostGrn(g.grn_id)}
                    disabled={isPostingGrn === g.grn_id}
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    <ShieldCheck size={14} style={{ marginRight: '0.35rem' }} />
                    {isPostingGrn === g.grn_id ? 'Posting...' : 'Post to Stock'}
                  </Button>
                )}
                {g.status === 'posted' && (
                  <>
                    {hasPermission('vendor_invoices', 'create') && (
                      <Button
                        variant="secondary"
                        onClick={() => handleCreateVendorInvoice(g.grn_id)}
                        disabled={isCreatingInvoice === g.grn_id}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        <FileSpreadsheet size={14} style={{ marginRight: '0.35rem' }} />
                        {isCreatingInvoice === g.grn_id ? 'Invoicing...' : 'Vendor Invoice'}
                      </Button>
                    )}
                    {hasPermission('grn', 'reverse') && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setReverseGrnId(g.grn_id);
                          setIsReverseModalOpen(true);
                        }}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        <RotateCcw size={14} style={{ marginRight: '0.35rem' }} />
                        Reverse
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
            keyExtractor={(g) => String(g.grn_id)}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 5: Material Issues & Returns
      ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'issues' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Responsive Search & Filters Toolbar */}
          <div className="procurement-toolbar">
            <div className="procurement-filters-cluster">
              <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                />
                <input
                  type="text"
                  placeholder="Search slip #, material, project..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem 0.55rem 2.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <select
                value={issueProjectFilter}
                onChange={(e) => setIssueProjectFilter(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  flex: '0 1 200px',
                }}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </option>
                ))}
              </select>

              <select
                value={issueStatusFilter}
                onChange={(e) => setIssueStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  flex: '0 1 180px',
                }}
              >
                <option value="all">All Dispatches</option>
                <option value="returnable">Has Returnable Surplus</option>
                <option value="reconciled">Fully Consumed / Reconciled</option>
              </select>

              {(issueSearch || issueProjectFilter || issueStatusFilter !== 'all') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIssueSearch('');
                    setIssueProjectFilter('');
                    setIssueStatusFilter('all');
                  }}
                  style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem' }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Showing {filteredIssues.length} of {issues.length} slips
              </span>
              {hasPermission('material_issue', 'create') && (
                <Button variant="primary" onClick={() => setIsIssueModalOpen(true)} style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}>
                  <RotateCcw size={16} style={{ marginRight: '0.5rem' }} /> Issue Material to Site
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="procurement-desktop-table procurement-table-card" style={{ padding: '1.25rem' }}>
            <DataTable
              columns={issueColumns}
              data={filteredIssues}
              exportFilename="material_issues_slips.csv"
              searchPlaceholder="Filter slips by code, material, project..."
              actions={(i) => {
                const returnable = Math.max(0, Number(i.quantity) - Number(i.consumed_quantity || 0) - Number(i.returned_quantity || 0));
                return (
                  <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedSlipModal(i)}
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                      title="View Slip Details"
                    >
                      <Eye size={13} style={{ marginRight: '0.25rem' }} /> View
                    </Button>

                    {returnable > 0 && hasPermission('material_issue', 'return') && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setReturnIssue(i);
                          setReturnQuantity(returnable);
                          setIsReturnModalOpen(true);
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          borderColor: 'rgba(245, 158, 11, 0.3)',
                          color: '#f59e0b',
                        }}
                      >
                        <RotateCcw size={13} style={{ marginRight: '0.3rem' }} /> Return
                      </Button>
                    )}
                  </div>
                );
              }}
              keyExtractor={(i) => String(i.issue_id)}
            />
          </div>

          {/* Mobile Card View (shown when width < 768px) */}
          <div className="procurement-mobile-cards">
            {filteredIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '12px' }}>
                No material issue slips found.
              </div>
            ) : (
              filteredIssues.map((i) => {
                const issued = Number(i.quantity || 0);
                const consumed = Number(i.consumed_quantity || 0);
                const returned = Number(i.returned_quantity || 0);
                const returnable = Math.max(0, issued - consumed - returned);
                const consumedPct = issued > 0 ? (consumed / issued) * 100 : 0;
                const returnablePct = issued > 0 ? (returnable / issued) * 100 : 0;

                return (
                  <div key={i.issue_id} className="procurement-card-item">
                    <div className="procurement-card-header">
                      <div>
                        <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '0.92rem' }}>{i.issue_code}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{i.issue_date}</div>
                      </div>
                      <div>
                        {returnable > 0 ? (
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                            }}
                          >
                            Active On-Site
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                            }}
                          >
                            Reconciled
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{i.material_name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {i.project_name} • {i.wbs_name || 'Discipline'}
                      </div>
                    </div>

                    <div className="procurement-progress-bar">
                      <div style={{ width: `${consumedPct}%`, background: '#10b981' }}></div>
                      <div style={{ width: `${returnablePct}%`, background: '#f59e0b' }}></div>
                    </div>

                    <div className="procurement-card-metrics-grid">
                      <div className="procurement-card-metric-col">
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Issued</span>
                        <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.88rem' }}>{issued}</span>
                      </div>
                      <div className="procurement-card-metric-col">
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consumed</span>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.88rem' }}>{consumed}</span>
                      </div>
                      <div className="procurement-card-metric-col">
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Returned</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{returned}</span>
                      </div>
                      <div className="procurement-card-metric-col">
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Returnable</span>
                        <span style={{ fontWeight: 700, color: returnable > 0 ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.88rem' }}>{returnable}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedSlipModal(i)}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flex: 1 }}
                      >
                        <Eye size={14} style={{ marginRight: '0.35rem' }} /> View Details
                      </Button>
                      {returnable > 0 && hasPermission('material_issue', 'return') && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReturnIssue(i);
                            setReturnQuantity(returnable);
                            setIsReturnModalOpen(true);
                          }}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b',
                            flex: 1,
                          }}
                        >
                          <RotateCcw size={14} style={{ marginRight: '0.35rem' }} /> Return
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          TAB 3: Purchase Orders
      ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'po' && (
        <div className="procurement-table-card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                Purchase Orders
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Track procurement orders, vendor commitments, and delivery status
              </div>
            </div>
          </div>
          <DataTable
            columns={poColumns}
            data={pos}
            exportFilename="purchase_orders.csv"
            searchPlaceholder="Search PO #, vendor, project..."
            isLoading={isLoadingPo}
            toolbarActions={
              hasPermission('purchase_orders', 'create') && (
                <Button variant="primary" onClick={() => setIsPoModalOpen(true)} style={{ height: '36px' }}>
                  <Plus size={16} style={{ marginRight: '0.4rem' }} /> Create Purchase Order
                </Button>
              )
            }
            keyExtractor={(p) => String(p.po_id)}
          />
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────────
          TAB 6: Procurement & Stock Reports (Phase 7)
      ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <ProcurementReportsTab
          stores={stores}
          materials={materials}
          projects={projects}
          vendors={vendors}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Create Purchase Order (Phase 3)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Create Purchase Order"
        size="xl"
      >
        <form onSubmit={handleCreatePo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            background: 'var(--bg-primary)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <SearchableSelect
              label="Project *"
              value={poForm.project_id}
              onChange={(val) => {
                setPoForm((prev) => ({ ...prev, project_id: val, wbs_id: '' }));
                handleFetchProjectWbs(val);
                const proj = projects.find((p) => String(p.project_id) === val);
                if (proj && proj.project_address) {
                  setPoForm((prev) => ({ ...prev, delivery_address: proj.project_address }));
                }
              }}
              options={projects.map((p) => ({
                value: String(p.project_id),
                label: `${p.project_code || 'PRJ'} - ${p.project_name}`,
              }))}
              required
            />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                WBS / Work Package (Optional)
              </label>
              <select
                value={poForm.wbs_id}
                onChange={(e) => setPoForm((prev) => ({ ...prev, wbs_id: e.target.value }))}
                className="form-control"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)' }}
              >
                <option value="">-- General / Whole Project --</option>
                {projectWbsList.map((w) => (
                  <option key={w.id || w.wbs_id} value={String(w.id || w.wbs_id)}>
                    {w.wbs_name || `WBS #${w.id || w.wbs_id}`}
                  </option>
                ))}
              </select>
            </div>

            <SearchableSelect
              label="Vendor *"
              value={poForm.vendor_id}
              onChange={(val) => setPoForm((prev) => ({ ...prev, vendor_id: val }))}
              options={vendors.map((v) => ({
                value: String(v.vendor_id),
                label: `${v.vendor_name} (${v.contact_person || v.phone || 'Vendor'})`,
              }))}
              required
            />

            <FormInput
              label="PO Date *"
              type="date"
              value={poForm.po_date}
              onChange={(e) => setPoForm((prev) => ({ ...prev, po_date: e.target.value }))}
              required
            />

            <FormInput
              label="Expected Delivery Date"
              type="date"
              value={poForm.expected_delivery_date}
              onChange={(e) => setPoForm((prev) => ({ ...prev, expected_delivery_date: e.target.value }))}
            />

            <FormInput
              label="Payment Terms"
              value={poForm.payment_terms}
              onChange={(e) => setPoForm((prev) => ({ ...prev, payment_terms: e.target.value }))}
              placeholder="e.g. Net 30, 50% Advance"
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <FormInput
                label="Delivery Address"
                value={poForm.delivery_address}
                onChange={(e) => setPoForm((prev) => ({ ...prev, delivery_address: e.target.value }))}
                placeholder="Site location or delivery address"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Ordered Materials ({poForm.items.length})
              </h4>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setPoForm((prev) => ({
                    ...prev,
                    items: [
                      ...prev.items,
                      {
                        material_id: '',
                        quantity: 1,
                        unit_rate: 0,
                        tax_percentage: 18,
                        discount_amount: 0,
                        remarks: '',
                      },
                    ],
                  }));
                }}
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> Add Line Item
              </Button>
            </div>

            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              overflowX: 'auto',
              background: 'var(--bg-card)',
              WebkitOverflowScrolling: 'touch',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '28%', fontWeight: 600, color: 'var(--text-secondary)' }}>Material *</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '12%', fontWeight: 600, color: 'var(--text-secondary)' }}>Qty *</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '8%', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '15%', fontWeight: 600, color: 'var(--text-secondary)' }}>Rate (₹) *</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '10%', fontWeight: 600, color: 'var(--text-secondary)' }}>Tax %</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '10%', fontWeight: 600, color: 'var(--text-secondary)' }}>Discount (₹)</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', width: '12%', fontWeight: 600, color: 'var(--text-secondary)' }}>Total (₹)</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '5%', fontWeight: 600, color: 'var(--text-secondary)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {poForm.items.map((item, idx) => {
                    const selectedMat = materials.find((m) => String(m.material_id) === String(item.material_id));
                    const lineGross = Math.max(0, Number(item.quantity || 0) * Number(item.unit_rate || 0) - Number(item.discount_amount || 0));
                    const lineTax = (lineGross * Number(item.tax_percentage || 0)) / 100;
                    const lineTotal = lineGross + lineTax;

                    return (
                      <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <select
                            value={item.material_id}
                            onChange={(e) => {
                              const mId = e.target.value;
                              const mat = materials.find((m) => String(m.material_id) === mId);
                              const newItems = [...poForm.items];
                              newItems[idx] = {
                                ...newItems[idx],
                                material_id: mId,
                                unit_rate: mat ? Number(mat.purchase_rate || mat.rate || 0) : newItems[idx].unit_rate,
                                tax_percentage: mat && mat.tax_percentage !== undefined ? Number(mat.tax_percentage) : 18,
                              };
                              setPoForm((prev) => ({ ...prev, items: newItems }));
                            }}
                            className="form-control"
                            style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', fontSize: '0.82rem' }}
                            required
                          >
                            <option value="">-- Select Material --</option>
                            {materials.map((m) => (
                              <option key={m.material_id} value={String(m.material_id)}>
                                {m.material_name} {m.material_code ? `(${m.material_code})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...poForm.items];
                              newItems[idx].quantity = Number(e.target.value);
                              setPoForm((prev) => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600, fontSize: '0.82rem' }}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {selectedMat?.unit || 'Nos'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_rate}
                            onChange={(e) => {
                              const newItems = [...poForm.items];
                              newItems[idx].unit_rate = Number(e.target.value);
                              setPoForm((prev) => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600, fontSize: '0.82rem' }}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.tax_percentage}
                            onChange={(e) => {
                              const newItems = [...poForm.items];
                              newItems[idx].tax_percentage = Number(e.target.value);
                              setPoForm((prev) => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', textAlign: 'right', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount_amount}
                            onChange={(e) => {
                              const newItems = [...poForm.items];
                              newItems[idx].discount_amount = Number(e.target.value);
                              setPoForm((prev) => ({ ...prev, items: newItems }));
                            }}
                            style={{ width: '100%', padding: '0.45rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', textAlign: 'right', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          {poForm.items.length > 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                const newItems = poForm.items.filter((_, i) => i !== idx);
                                setPoForm((prev) => ({ ...prev, items: newItems }));
                              }}
                              style={{ padding: '0.35rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Remove Line"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation Summary Card */}
          {(() => {
            let gross = 0;
            let tax = 0;
            let discount = 0;
            poForm.items.forEach((item) => {
              const g = Math.max(0, Number(item.quantity || 0) * Number(item.unit_rate || 0) - Number(item.discount_amount || 0));
              const t = (g * Number(item.tax_percentage || 0)) / 100;
              gross += g;
              tax += t;
              discount += Number(item.discount_amount || 0);
            });
            const grandTotal = gross + tax;

            return (
              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <span>Subtotal Amount:</span>
                  <strong style={{ fontWeight: 600 }}>₹{gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#d97706', fontSize: '0.88rem' }}>
                    <span>Total Discount:</span>
                    <strong style={{ fontWeight: 600 }}>- ₹{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284c7', fontSize: '0.88rem' }}>
                  <span>Total Tax (GST):</span>
                  <strong style={{ fontWeight: 600 }}>+ ₹{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.2rem',
                  color: 'var(--success, #16a34a)',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid var(--border-color)',
                  fontWeight: 700
                }}>
                  <span>Total PO Amount:</span>
                  <span>₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })()}

          {/* Terms & Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Terms & Conditions / Special Instructions (Optional)
            </label>
            <textarea
              value={poForm.terms_conditions}
              onChange={(e) => setPoForm((prev) => ({ ...prev, terms_conditions: e.target.value }))}
              placeholder="e.g. All materials must meet IS standards. Mill test certificates required."
              rows={2}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg-solid, var(--bg-card))', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <Button type="button" variant="secondary" onClick={() => setIsPoModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmittingPo}>
              {isSubmittingPo ? 'Creating PO...' : 'Create Purchase Order (Draft)'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: View Purchase Order Details (Phase 3)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!viewingPoDetails}
        onClose={() => setViewingPoDetails(null)}
        title={`Purchase Order Details - ${viewingPoDetails?.po_number || ''}`}
        size="lg"
      >
        {viewingPoDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              background: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Vendor:</span> <strong>{viewingPoDetails.vendor_name || '-'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Project:</span> <strong>{viewingPoDetails.project_name || '-'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>WBS:</span> <strong>{viewingPoDetails.wbs_name || 'General'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Date:</span> <strong>{viewingPoDetails.po_date || '-'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <Badge variant={viewingPoDetails.status === 'completed' ? 'success' : viewingPoDetails.status === 'cancelled' ? 'danger' : 'warning'}>{String(viewingPoDetails.status).toUpperCase()}</Badge></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Total:</span> <strong style={{ color: '#10b981' }}>₹{Number(viewingPoDetails.total_amount || 0).toLocaleString()}</strong></div>
            </div>

            {viewingPoDetails.items && viewingPoDetails.items.length > 0 && (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead style={{ background: 'var(--bg-primary)', borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Material</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Ordered</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Received</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Pending</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Rate (₹)</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingPoDetails.items.map((it: any, i: number) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.6rem' }}><strong>{it.material_name}</strong> {it.material_code ? `(${it.material_code})` : ''}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>{it.quantity} {it.unit}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{it.received_qty || 0} {it.unit}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{Math.max(0, Number(it.quantity) - Number(it.received_qty || 0))} {it.unit}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right' }}>₹{Number(it.unit_rate || 0).toLocaleString()}</td>
                        <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 600 }}>₹{Number(it.total_amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setViewingPoDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Create Draft GRN (Phase 4 PO Receivable Lines Integration)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        title="Create Goods Receipt Note (GRN)"
      >
        <form onSubmit={handleCreateGrn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Link to Purchase Order */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Select Issued Purchase Order (PO)
            </label>
            <select
              value={grnForm.po_id}
              onChange={(e) => handleSelectPoForGrn(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Direct Receipt / No PO</option>
              {pos
                .filter((p) => ['issued', 'partially_received'].includes(p.status))
                .map((p) => (
                  <option key={p.po_id} value={p.po_id}>
                    {p.po_number} - {p.vendor_name || 'Vendor'} ({p.status})
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                Project *
              </label>
              <select
                value={grnForm.project_id}
                onChange={(e) => setGrnForm({ ...grnForm, project_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                Receiving Store *
              </label>
              <select
                value={grnForm.store_id}
                onChange={(e) => setGrnForm({ ...grnForm, store_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name} ({s.location || 'Site'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Delivery Challan # (DC)"
              value={grnForm.delivery_challan_number}
              onChange={(e) => setGrnForm({ ...grnForm, delivery_challan_number: e.target.value })}
            />
            <FormInput
              label="Challan Date"
              type="date"
              value={grnForm.challan_date}
              onChange={(e) => setGrnForm({ ...grnForm, challan_date: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormInput
              label="Supplier Invoice #"
              value={grnForm.invoice_number}
              onChange={(e) => setGrnForm({ ...grnForm, invoice_number: e.target.value })}
            />
            <FormInput
              label="Invoice Date"
              type="date"
              value={grnForm.invoice_date}
              onChange={(e) => setGrnForm({ ...grnForm, invoice_date: e.target.value })}
            />
          </div>

          <FormInput
            label="Delivery Date *"
            type="date"
            value={grnForm.delivery_date}
            onChange={(e) => setGrnForm({ ...grnForm, delivery_date: e.target.value })}
            required
          />

          {/* Line Items Table */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Receiving Line Items</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Balance Rule: Accepted + Rejected + Damaged = Received
              </span>
            </div>

            {grnForm.items.map((item, idx) => {
              const rec = Number(item.received_quantity || 0);
              const acc = Number(item.accepted_quantity || 0);
              const rej = Number(item.rejected_quantity || 0);
              const dam = Number(item.damaged_quantity || 0);
              const isBalanced = acc + rej + dam === rec;

              return (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                    <div>
                      {item.material_name || 'Material # ' + item.material_id} ({item.unit})
                    </div>
                    {item.ordered_quantity > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Ordered: {item.ordered_quantity} | Previously Received: {item.previously_received} | Pending: {item.pending_quantity}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <FormInput
                      label="Received Qty *"
                      type="number"
                      step="0.01"
                      value={item.received_quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const copy = [...grnForm.items];
                        copy[idx].received_quantity = val;
                        copy[idx].accepted_quantity = val;
                        copy[idx].rejected_quantity = 0;
                        copy[idx].damaged_quantity = 0;
                        copy[idx].short_quantity = Math.max(0, copy[idx].pending_quantity - val);
                        setGrnForm({ ...grnForm, items: copy });
                      }}
                      required
                    />
                    <FormInput
                      label="Accepted Qty *"
                      type="number"
                      step="0.01"
                      value={item.accepted_quantity}
                      onChange={(e) => {
                        const copy = [...grnForm.items];
                        copy[idx].accepted_quantity = parseFloat(e.target.value) || 0;
                        setGrnForm({ ...grnForm, items: copy });
                      }}
                      required
                    />
                    <FormInput
                      label="Rejected Qty"
                      type="number"
                      step="0.01"
                      value={item.rejected_quantity}
                      onChange={(e) => {
                        const copy = [...grnForm.items];
                        copy[idx].rejected_quantity = parseFloat(e.target.value) || 0;
                        setGrnForm({ ...grnForm, items: copy });
                      }}
                    />
                    <FormInput
                      label="Damaged Qty"
                      type="number"
                      step="0.01"
                      value={item.damaged_quantity}
                      onChange={(e) => {
                        const copy = [...grnForm.items];
                        copy[idx].damaged_quantity = parseFloat(e.target.value) || 0;
                        setGrnForm({ ...grnForm, items: copy });
                      }}
                    />
                  </div>

                  {!isBalanced && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                      ⚠ Imbalance: Accepted ({acc}) + Rejected ({rej}) + Damaged ({dam}) = {acc + rej + dam} (Must equal {rec})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <FormInput
            label="Remarks / Notes"
            value={grnForm.remarks}
            onChange={(e) => setGrnForm({ ...grnForm, remarks: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsGrnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Draft GRN
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: GRN Reversal (Phase 4)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        title="Reverse Posted Goods Receipt Note"
      >
        <form onSubmit={handleReverseGrn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Reversing a posted GRN will post reversal ledger rows and restore pending balance on the linked Purchase Order.
            Reversal will be refused if materials have already been issued, consumed, or transferred.
          </div>

          <FormInput
            label="Mandatory Reversal Reason (minimum 5 characters) *"
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            placeholder="e.g. Accidental receipt posted with incorrect quantities"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsReverseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={isReversingGrn}>
              {isReversingGrn ? 'Reversing...' : 'Confirm Reversal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Issue Material to Site (Phase 5 Context Grid)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Material to Project Site / WBS"
      >
        <form onSubmit={handleCreateIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Project *
            </label>
            <select
              value={issueForm.project_id}
              onChange={(e) => {
                const pId = e.target.value;
                setIssueForm({ ...issueForm, project_id: pId, wbs_id: '' });
                handleFetchProjectWbs(pId);
                fetchIssueContext(pId, issueForm.wbs_id, issueForm.material_id, issueForm.store_id);
              }}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              WBS Discipline *
            </label>
            <select
              value={issueForm.wbs_id}
              onChange={(e) => {
                const wId = e.target.value;
                setIssueForm({ ...issueForm, wbs_id: wId });
                fetchIssueContext(issueForm.project_id, wId, issueForm.material_id, issueForm.store_id);
              }}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select WBS Discipline</option>
              {projectWbsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wbs_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Material *
            </label>
            <select
              value={issueForm.material_id}
              onChange={(e) => {
                const mId = e.target.value;
                setIssueForm({ ...issueForm, material_id: mId });
                fetchIssueContext(issueForm.project_id, issueForm.wbs_id, mId, issueForm.store_id);
              }}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select Material</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Phase 5 Context Metric Card */}
          {issueContext && (
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                PROJECT REQUIREMENT & STORE INVENTORY CONTEXT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Requirement</div>
                  <div style={{ fontWeight: 700 }}>{issueContext.requirement}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Reserved</div>
                  <div style={{ fontWeight: 700 }}>{issueContext.reserved}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Prev Issued</div>
                  <div style={{ fontWeight: 700 }}>{issueContext.previously_issued}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Remaining Req</div>
                  <div style={{ fontWeight: 700 }}>{issueContext.remaining_requirement}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Available Stock</div>
                  <div style={{ fontWeight: 700, color: '#10b981' }}>{issueContext.available_stock}</div>
                </div>
              </div>

              {Number(issueForm.quantity) > Number(issueContext.available_stock) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                  ⚠ Insufficient stock. Required: {issueForm.quantity}, Available: {issueContext.available_stock}.
                </div>
              )}
            </div>
          )}

          <FormInput
            label="Issue Quantity *"
            type="number"
            min="0.01"
            step="0.01"
            value={issueForm.quantity}
            onChange={(e) => setIssueForm({ ...issueForm, quantity: parseFloat(e.target.value) || 0 })}
            required
          />

          <FormInput
            label="Issue Date"
            type="date"
            value={issueForm.issue_date}
            onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
          />

          <FormInput
            label="Site Location / Tower / Floor"
            value={issueForm.site_location}
            onChange={(e) => setIssueForm({ ...issueForm, site_location: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Post Issue Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Return Unused Material (Phase 5)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Return Unused Material to Store"
      >
        <form onSubmit={handleReturnMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {returnIssue && (
            <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <div><strong>Slip:</strong> {returnIssue.issue_code}</div>
              <div><strong>Material:</strong> {returnIssue.material_name}</div>
              <div><strong>Issued:</strong> {returnIssue.quantity} {returnIssue.unit} | <strong>Consumed:</strong> {returnIssue.consumed_quantity || 0} | <strong>Previously Returned:</strong> {returnIssue.returned_quantity || 0}</div>
            </div>
          )}

          <FormInput
            label="Return Quantity *"
            type="number"
            step="0.01"
            min="0.01"
            value={returnQuantity}
            onChange={(e) => setReturnQuantity(parseFloat(e.target.value) || 0)}
            required
          />

          <FormInput
            label="Return Reason / Remarks"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Excess material returned to central inventory"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingReturn}>
              {isSubmittingReturn ? 'Returning...' : 'Confirm Return to Store'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Stock Transfer (Phase 5)
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Dual-Entry Controlled Stock Transfer Between Stores"
      >
        <form onSubmit={handleStockTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                From Store *
              </label>
              <select
                value={transferForm.from_store_id}
                onChange={(e) => setTransferForm({ ...transferForm, from_store_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                To Store *
              </label>
              <select
                value={transferForm.to_store_id}
                onChange={(e) => setTransferForm({ ...transferForm, to_store_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                {stores.map((s) => (
                  <option key={s.store_id} value={s.store_id}>
                    {s.store_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Material *
            </label>
            <select
              value={transferForm.material_id}
              onChange={(e) => setTransferForm({ ...transferForm, material_id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select Material to Transfer</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Transfer Quantity *"
            type="number"
            min="0.01"
            step="0.01"
            value={transferForm.quantity}
            onChange={(e) => setTransferForm({ ...transferForm, quantity: parseFloat(e.target.value) || 0 })}
            required
          />

          <FormInput
            label="Transfer Reason (mandatory min 5 chars) *"
            value={transferForm.reason}
            onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
            placeholder="e.g. Rebalancing store inventory for upcoming civil work"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingTransfer}>
              {isSubmittingTransfer ? 'Transferring...' : 'Execute Dual-Entry Transfer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Stock Adjustment
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Physical Stock Adjustment"
      >
        <form onSubmit={handleStockAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              Material *
            </label>
            <select
              value={adjustForm.material_id}
              onChange={(e) => {
                const matId = e.target.value;
                const mat = materials.find((m) => String(m.material_id) === matId);
                setAdjustForm({
                  ...adjustForm,
                  material_id: matId,
                  rate: mat?.purchase_rate || mat?.rate || 0,
                });
              }}
              required
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="">Select Material</option>
              {materials.map((m) => (
                <option key={m.material_id} value={m.material_id}>
                  {m.material_name} ({m.unit})
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Adjusted Net Delta Quantity (+/-) *"
            type="number"
            step="0.01"
            value={adjustForm.adjusted_qty}
            onChange={(e) => setAdjustForm({ ...adjustForm, adjusted_qty: parseFloat(e.target.value) || 0 })}
            required
          />

          <FormInput
            label="Audit Compliance Reason (minimum 5 characters) *"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            placeholder="e.g. Monthly physical audit variance reconciliation"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingAdjust}>
              {isSubmittingAdjust ? 'Posting...' : 'Post Adjustment'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* ─────────────────────────────────────────────────────────────────
          MODAL: Material Issue Slip Details
      ─────────────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedSlipModal}
        onClose={() => setSelectedSlipModal(null)}
        title={`Material Issue Slip #${selectedSlipModal?.issue_code || ''}`}
      >
        {selectedSlipModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Project</span>
                <strong>{selectedSlipModal.project_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>WBS Discipline</span>
                <strong>{selectedSlipModal.wbs_name || 'General Discipline'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Material</span>
                <strong>{selectedSlipModal.material_name} ({selectedSlipModal.unit})</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Issue Date</span>
                <strong>{selectedSlipModal.issue_date}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Issued</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#3b82f6' }}>{selectedSlipModal.quantity} {selectedSlipModal.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Consumed</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981' }}>{selectedSlipModal.consumed_quantity || 0} {selectedSlipModal.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Returned</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{selectedSlipModal.returned_quantity || 0} {selectedSlipModal.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Returnable</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f59e0b' }}>
                  {Math.max(0, Number(selectedSlipModal.quantity) - Number(selectedSlipModal.consumed_quantity || 0) - Number(selectedSlipModal.returned_quantity || 0))} {selectedSlipModal.unit}
                </div>
              </div>
            </div>

            {selectedSlipModal.task_name && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Allocated Task</span>
                <div>{selectedSlipModal.task_name}</div>
              </div>
            )}

            {selectedSlipModal.site_location && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Site Location</span>
                <div>{selectedSlipModal.site_location}</div>
              </div>
            )}

            {selectedSlipModal.remarks && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Remarks / Purpose</span>
                <div>{selectedSlipModal.remarks}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setSelectedSlipModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
