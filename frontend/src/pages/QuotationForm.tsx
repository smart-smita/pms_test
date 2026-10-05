import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { FormInput } from '../components/forms/FormInput';
import { FormSelect } from '../components/forms/FormSelect';
import { SearchableSelect, SearchableOption } from '../components/common/SearchableSelect';
import { MultiSelectDropdown } from '../components/common/MultiSelectDropdown';
import { Modal } from '../components/common/Modal';
import { apiRequest } from '../services/api';
import { Quotation, Customer, Project, TermsTemplate, ProjectType } from '../types';
import {
  ArrowLeft,
  Save,
  Send,
  Building2,
  FolderKanban,
  HardHat,
  Package,
  Layers,
  Paperclip,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Upload,
  FileCheck,
  FileText,
  Mail,
  DollarSign,
  Calendar,
  AlertCircle,
  Clock,
  Eye,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

interface CurrencyMaster {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string;
  is_base_currency?: number;
  decimal_places?: number;
  exchange_rate?: number;
}

interface TaxMaster {
  tax_id: number;
  tax_name: string;
  tax_code: string;
  tax_type: string;
  tax_percentage: number;
  country_name?: string;
  is_split?: number;
  cgst_percentage?: number;
  sgst_percentage?: number;
}

interface TermsSnapshotItem {
  template_id?: number | null;
  template_name?: string | null;
  title: string;
  description: string;
  sort_order: number;
  is_mandatory: boolean;
}

export interface WbsLabourItem {
  id: string;
  labour_id?: number | null;
  labour_name: string;
  labour_type: string;
  hours: number;
  rate: number;
  amount: number;
  start_date?: string;
  end_date?: string;
}

export interface WbsMaterialItem {
  id: string;
  material_id?: number | null;
  material_name: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  start_date?: string;
  end_date?: string;
}

export interface QuotationWbsItem {
  id: string; // unique client id
  wbs_id?: number | null;
  wbs_template_id?: number | null;
  wbs_template_name?: string;
  discipline_name: string; // WBS Task Name
  start_date: string;
  end_date: string;
  labours: WbsLabourItem[];
  materials: WbsMaterialItem[];
}

interface UploadedDocItem {
  id: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  file_base64?: string;
  file_path?: string;
  uploaded_at?: string;
}

interface QuotationFormProps {
  quotationId?: number;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({ quotationId, onBack, onNavigate }) => {
  const { user } = useAuth();
  const isEditMode = Boolean(quotationId);

  // Masters
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTypesList, setProjectTypesList] = useState<ProjectType[]>([]);
  const [termsTemplates, setTermsTemplates] = useState<TermsTemplate[]>([]);
  const [wbsTemplates, setWbsTemplates] = useState<any[]>([]);
  const [currenciesList, setCurrenciesList] = useState<CurrencyMaster[]>([]);
  const [laboursList, setLaboursList] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [taxesList, setTaxesList] = useState<TaxMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Selection Mode: 'existing' or 'new'
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('existing');

  // Form State
  const [formData, setFormData] = useState({
    quotation_code: '',
    customer_id: '',
    project_id: '',
    new_project_name: '',
    project_type_id: '',
    currency_id: '',
    exchange_rate: '1',
    quotation_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    description: '',
    discount_amount: '0',
    status: 'draft' as 'draft' | 'pending_approval' | 'approved' | 'rejected',
    planning_required: true,
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-WBS Templates selection
  const [selectedWbsTemplateIds, setSelectedWbsTemplateIds] = useState<number[]>([]);
  const [availableWbsNodes, setAvailableWbsNodes] = useState<any[]>([]);

  // Combined WBS Line Items
  const [wbsItems, setWbsItems] = useState<QuotationWbsItem[]>([]);

  // Taxes
  const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>([]);
  const [customTaxRates, setCustomTaxRates] = useState<Record<number, number>>({});

  // Terms & Conditions (Multi-template)
  const [selectedTermsTemplateIds, setSelectedTermsTemplateIds] = useState<number[]>([]);
  const [termsSnapshots, setTermsSnapshots] = useState<TermsSnapshotItem[]>([]);

  // Documents
  const [documentsList, setDocumentsList] = useState<UploadedDocItem[]>([]);

  // Quick Customer Creation Inline Modal
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({
    customer_name: '',
    customer_code: '',
    contact_person: '',
    email: '',
    contact_number: '',
    address: '',
  });

  // Load Masters & Quotation Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          custRes,
          projRes,
          ptRes,
          termsRes,
          wbsRes,
          currRes,
          taxRes,
          labRes,
          matRes,
        ] = await Promise.all([
          apiRequest<Customer[]>('/customers'),
          apiRequest<Project[]>('/projects'),
          apiRequest<ProjectType[]>('/masters/project-types'),
          apiRequest<TermsTemplate[]>('/terms-templates'),
          apiRequest<any[]>('/wbs-templates'),
          apiRequest<CurrencyMaster[]>('/masters/currencies'),
          apiRequest<TaxMaster[]>('/masters/taxes'),
          apiRequest<any[]>('/labours'),
          apiRequest<any[]>('/materials/master'),
        ]);

        if (custRes.success && custRes.data) setCustomers(custRes.data);
        if (projRes.success && projRes.data) setProjects(projRes.data);
        if (ptRes.success && ptRes.data) setProjectTypesList(ptRes.data);
        if (termsRes.success && termsRes.data) setTermsTemplates(termsRes.data);
        if (wbsRes.success && wbsRes.data) setWbsTemplates(wbsRes.data);
        if (currRes.success && currRes.data) {
          setCurrenciesList(currRes.data);
          if (!formData.currency_id && currRes.data.length > 0) {
            const baseCurr = currRes.data.find((c) => c.is_base_currency === 1) || currRes.data[0];
            setFormData((prev) => ({ ...prev, currency_id: String(baseCurr.currency_id) }));
          }
        }
        if (taxRes.success && taxRes.data) setTaxesList(taxRes.data);
        if (labRes.success && labRes.data) setLaboursList(labRes.data);
        if (matRes.success && matRes.data) setMaterialsList(matRes.data);

        // If Edit Mode, fetch quotation details
        if (quotationId) {
          const qRes = await apiRequest<any>(`/quotations/${quotationId}`);
          if (qRes.success && qRes.data) {
            const q = qRes.data;
            setFormData({
              quotation_code: q.quotation_code || '',
              customer_id: q.customer_id ? String(q.customer_id) : '',
              project_id: q.project_id ? String(q.project_id) : '',
              new_project_name: q.new_project_name || '',
              project_type_id: q.project_type_id ? String(q.project_type_id) : '',
              currency_id: q.currency_id ? String(q.currency_id) : '',
              exchange_rate: String(q.exchange_rate || '1'),
              quotation_date: q.quotation_date ? q.quotation_date.split('T')[0] : new Date().toISOString().split('T')[0],
              validity_date: q.validity_date ? q.validity_date.split('T')[0] : '',
              description: q.description || '',
              discount_amount: String(q.discount_amount || '0'),
              status: q.status || 'draft',
              planning_required: q.planning_required !== undefined ? Boolean(q.planning_required) : true,
            });

            if (q.project_id) {
              setProjectMode('existing');
            } else if (q.new_project_name) {
              setProjectMode('new');
            }

            // Restore Selected WBS Templates
            const tmplIds: number[] = [];
            if (q.selected_wbs_templates && Array.isArray(q.selected_wbs_templates)) {
              q.selected_wbs_templates.forEach((t: any) => {
                const val = Number(t.template_id || t);
                if (val && !isNaN(val)) tmplIds.push(val);
              });
            }
            if (q.disciplines && Array.isArray(q.disciplines)) {
              q.disciplines.forEach((d: any) => {
                if (d.wbs_template_id) tmplIds.push(Number(d.wbs_template_id));
              });
            }
            setSelectedWbsTemplateIds(Array.from(new Set(tmplIds)));

            // Restore WBS Items
            if (q.disciplines && Array.isArray(q.disciplines)) {
              const mappedItems: QuotationWbsItem[] = q.disciplines.map((d: any, idx: number) => {
                let parsedLabours = d.labours || [];
                let parsedMaterials = d.materials || [];
                
                if (d.description && d.description.includes('{"labours"')) {
                  try {
                    const parsed = JSON.parse(d.description);
                    if (!d.labours || d.labours.length === 0) parsedLabours = parsed.labours || [];
                    if (!d.materials || d.materials.length === 0) parsedMaterials = parsed.materials || [];
                  } catch(e){}
                }

                return {
                  id: `edit_${d.id || idx}_${Date.now()}`,
                  wbs_id: d.wbs_id || null,
                  wbs_template_id: d.wbs_template_id || null,
                  wbs_template_name: d.wbs_template_name || undefined,
                  discipline_name: d.discipline_name || `WBS Item ${idx + 1}`,
                  start_date: d.start_date ? d.start_date.split('T')[0] : '',
                  end_date: d.end_date ? d.end_date.split('T')[0] : '',
                  labours: parsedLabours,
                  materials: parsedMaterials,
                };
              });
              setWbsItems(mappedItems);
            }

            // Restore Taxes
            if (q.taxes && Array.isArray(q.taxes)) {
              setSelectedTaxIds(q.taxes.map((t: any) => t.tax_id));
            } else if (q.tax_id) {
              setSelectedTaxIds([q.tax_id]);
            }

            // Restore Terms
            if (q.terms_snapshots && Array.isArray(q.terms_snapshots)) {
              setTermsSnapshots(q.terms_snapshots);
              const tplIds = Array.from(new Set(q.terms_snapshots.map((t: any) => t.template_id).filter(Boolean)));
              setSelectedTermsTemplateIds(tplIds as number[]);
            }

            // Restore Documents
            if (q.documents && Array.isArray(q.documents)) {
              setDocumentsList(
                q.documents.map((doc: any) => ({
                  id: String(doc.document_id || Date.now()),
                  file_name: doc.file_name || 'Document',
                  file_size: doc.file_size,
                  mime_type: doc.mime_type,
                  file_path: doc.file_path,
                  uploaded_at: doc.created_at,
                }))
              );
            }
          }
        }
      } catch (err: any) {
        showError('Failed to load quotation data: ' + (err.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [quotationId]);

  // Selected Currency Details
  const selectedCurrency = useMemo(() => {
    return (
      currenciesList.find((c) => String(c.currency_id) === formData.currency_id) ||
      currenciesList.find((c) => c.is_base_currency === 1) || {
        currency_id: 1,
        currency_code: 'INR',
        symbol: '₹',
        currency_name: 'Indian Rupee',
        decimal_places: 2,
      }
    );
  }, [currenciesList, formData.currency_id]);

  // Selected Taxes Objects
  const selectedTaxes = useMemo(() => {
    return taxesList
      .filter((t) => selectedTaxIds.includes(t.tax_id))
      .map((t) => ({
        ...t,
        tax_percentage: customTaxRates[t.tax_id] !== undefined ? customTaxRates[t.tax_id] : t.tax_percentage,
      }));
  }, [taxesList, selectedTaxIds, customTaxRates]);

  // Filter available WBS templates for selected Project Type
  const availableWbsTemplates = useMemo(() => {
    return wbsTemplates.filter((t) => {
      // 1. Always show if it's currently selected
      if (selectedWbsTemplateIds.includes(t.template_id || t.id)) return true;
      // 2. If no project type is selected, show all
      if (!formData.project_type_id) return true;
      // 3. If template has no project types restriction, show it
      if (!t.project_types || t.project_types.length === 0) return true;
      // 4. Otherwise, check if it matches the selected project type
      const ptId = Number(formData.project_type_id);
      return t.project_types.some((pt: any) => Number(pt.project_type_id) === ptId);
    });
  }, [wbsTemplates, formData.project_type_id, selectedWbsTemplateIds]);

  // Calculations Result
  const calculations = useMemo(() => {
    let labourSubtotal = 0;
    let materialSubtotal = 0;

    wbsItems.forEach((item) => {
      item.labours.forEach(l => labourSubtotal += Number(l.amount || 0));
      item.materials.forEach(m => materialSubtotal += Number(m.amount || 0));
    });

    const netSubtotal = labourSubtotal + materialSubtotal;
    const discount = Math.min(netSubtotal, Math.max(0, Number(formData.discount_amount || 0)));
    const taxableAmount = Math.max(0, netSubtotal - discount);

    let totalTaxAmount = 0;
    const taxDetails = selectedTaxes.map((tax) => {
      const taxAmt = (taxableAmount * Number(tax.tax_percentage || 0)) / 100;
      totalTaxAmount += taxAmt;
      return {
        ...tax,
        calculated_amount: taxAmt,
      };
    });

    const grandTotal = taxableAmount + totalTaxAmount;

    return {
      labourSubtotal,
      materialSubtotal,
      netSubtotal,
      discountAmount: discount,
      taxableAmount,
      totalTaxAmount,
      taxDetails,
      grandTotal,
    };
  }, [wbsItems, formData.discount_amount, selectedTaxes]);

  // Customer Select Options
  const customerOptions: SearchableOption[] = useMemo(() => {
    return customers.map((c) => ({
      value: String(c.customer_id),
      label: `${c.customer_name} (${c.customer_code})`,
      subLabel: c.contact_person ? `Contact: ${c.contact_person} | ${c.email || ''}` : c.email || undefined,
    }));
  }, [customers]);


  const labourOptions: SearchableOption[] = useMemo(() => laboursList.map(l => ({ value: String(l.labour_id), label: l.name, subLabel: l.labour_type })), [laboursList]);
  const materialOptions: SearchableOption[] = useMemo(() => materialsList.map(m => ({ value: String(m.material_id || m.id), label: m.material_name, subLabel: m.material_code })), [materialsList]);

  // Project Select Options
  const projectOptions: SearchableOption[] = useMemo(() => {
    const filtered = formData.customer_id
      ? projects.filter((p) => String(p.customer_id) === formData.customer_id || (formData.project_id && String(p.project_id) === formData.project_id))
      : projects;
    return filtered.map((p) => ({
      value: String(p.project_id),
      label: `${p.project_name} (${p.project_code || 'PROJ'})`,
      subLabel: p.project_type_name ? `Type: ${p.project_type_name}` : undefined,
    }));
  }, [projects, formData.customer_id, formData.project_id]);

  // Quick Customer Submit
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickCustomerData.customer_name.trim();
    if (!name || name.length < 2) {
      showError('Customer name is required (min 2 characters)');
      return;
    }

    if (quickCustomerData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(quickCustomerData.email.trim())) {
        showError('Please enter a valid email address');
        return;
      }
    }

    setIsCreatingCustomer(true);
    const res = await apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        ...quickCustomerData,
        customer_name: name,
        email: quickCustomerData.email?.trim() || null,
        contact_number: quickCustomerData.contact_number?.trim() || null,
        contact_person: quickCustomerData.contact_person?.trim() || null,
        address: quickCustomerData.address?.trim() || null,
        customer_code: quickCustomerData.customer_code?.trim() || `CUST-${Date.now().toString().slice(-4)}`,
      }),
    });

    setIsCreatingCustomer(false);
    if (res.success && res.data) {
      const newCustomer = res.data;
      showSuccess(`Customer "${newCustomer.customer_name}" created & selected`);
      setCustomers((prev) => [newCustomer, ...prev]);
      setFormData((prev) => ({ ...prev, customer_id: String(newCustomer.customer_id) }));
      setIsQuickCustomerOpen(false);
      setQuickCustomerData({
        customer_name: '',
        customer_code: '',
        contact_person: '',
        email: '',
        contact_number: '',
        address: '',
      });
    } else {
      showError(res.message || 'Failed to create customer');
    }
  };

  const handleProjectTypeChange = (newTypeId: string) => {
    if (selectedWbsTemplateIds.length > 0 || wbsItems.length > 0) {
      if (!window.confirm("Changing the Project Type will reset your selected WBS Templates and tasks. Are you sure?")) {
        return;
      }
      setSelectedWbsTemplateIds([]);
      setAvailableWbsNodes([]);
      setWbsItems([]);
    }
    setFormData((prev) => ({ ...prev, project_type_id: newTypeId }));
    if (errors.project_type_id) setErrors((prev) => ({ ...prev, project_type_id: '' }));
  };

  // Toggle WBS Template Selection
  const handleWbsTemplatesChange = async (newIds: (string | number)[]) => {
    const nextIds = newIds.map(Number);
    const removedIds = selectedWbsTemplateIds.filter((id) => !nextIds.includes(id));
    
    if (removedIds.length > 0) {
      const itemsToRemove = wbsItems.filter((item) => removedIds.includes(item.wbs_template_id as number));
      if (itemsToRemove.length > 0) {
        if (!window.confirm(`You are about to remove a WBS Template that has ${itemsToRemove.length} WBS task(s) currently added to this quotation. Removing it will delete these tasks from the quotation. Are you sure?`)) {
          return; // Abort the change
        }
      }
      setAvailableWbsNodes((prev) => prev.filter((node) => !removedIds.includes(node.template_id)));
      setWbsItems((prev) => prev.filter((item) => !removedIds.includes(item.wbs_template_id as number)));
    }
    
    const addedIds = nextIds.filter((id) => !selectedWbsTemplateIds.includes(id));
    setSelectedWbsTemplateIds(nextIds);
    
    if (!formData.project_type_id) return;

    for (const templateId of addedIds) {
      const tplMeta = availableWbsTemplates.find((t) => (t.template_id || t.id) === templateId);
      const templateName = tplMeta ? tplMeta.template_name : 'WBS Template';
      
      const tRes = await apiRequest<any[]>(`/wbs-templates/${templateId}/project-types/${formData.project_type_id}/wbs`);
      if (tRes.success && tRes.data) {
        const nodes = tRes.data.map((n: any) => ({
          ...n,
          template_id: templateId,
          template_name: templateName
        }));
        setAvailableWbsNodes(prev => [...prev, ...nodes]);

        // Automatically add them to the quotation
        const newWbsItems = nodes.map((node: any, idx: number) => ({
          id: `wbs_${node.template_id}_${node.id}_${idx}`,
          wbs_id: node.id,
          wbs_template_id: node.template_id,
          wbs_template_name: node.template_name,
          discipline_name: node.wbs_name || 'WBS Task',
          start_date: formData.quotation_date,
          end_date: formData.validity_date || '',
          labours: [{ id: `l_${Date.now()}_${idx}`, labour_name: '', labour_type: '', hours: 0, rate: 0, amount: 0 }],
          materials: [{ id: `m_${Date.now()}_${idx}`, material_name: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }],
        }));
        setWbsItems(prev => [...prev, ...newWbsItems]);
      }
    }
  };

  const handleToggleWbsNode = (node: any) => {
    const existingIndex = wbsItems.findIndex(i => i.wbs_id === node.id && i.wbs_template_id === node.template_id);
    if (existingIndex >= 0) {
      // Remove
      setWbsItems(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Add
      const newItem: QuotationWbsItem = {
        id: `wbs_${node.template_id}_${node.id}`,
        wbs_id: node.id,
        wbs_template_id: node.template_id,
        wbs_template_name: node.template_name,
        discipline_name: node.wbs_name || 'WBS Task',
        start_date: formData.quotation_date,
        end_date: formData.validity_date || '',
        labours: [{ id: `l_${Date.now()}_1`, labour_name: '', labour_type: '', hours: 0, rate: 0, amount: 0 }],
        materials: [{ id: `m_${Date.now()}_1`, material_name: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }],
      };
      setWbsItems(prev => [...prev, newItem]);
    }
  };

  // Add Custom WBS Node
  const handleAddCustomWbs = () => {
    const newItem: QuotationWbsItem = {
      id: `custom_${Date.now()}`,
      wbs_id: null,
      wbs_template_id: null,
      wbs_template_name: 'Custom WBS',
      discipline_name: 'New Custom Task',
      start_date: formData.quotation_date,
      end_date: formData.validity_date || '',
      labours: [{ id: `l_${Date.now()}_1`, labour_name: '', labour_type: '', hours: 0, rate: 0, amount: 0 }],
      materials: [{ id: `m_${Date.now()}_1`, material_name: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }],
    };
    setWbsItems((prev) => [...prev, newItem]);
  };

  const handleUpdateWbsItem = (id: string, updates: Partial<QuotationWbsItem>) => {
    setWbsItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...updates };
      })
    );
  };

  const handleAddLabour = (wbsId: string) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      return { ...item, labours: [...item.labours, { id: `l_${Date.now()}`, labour_name: '', labour_type: '', hours: 0, rate: 0, amount: 0 }] };
    }));
  };

  const handleUpdateLabour = (wbsId: string, labourId: string, field: string, val: any) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      const updatedLabours = item.labours.map((l) => {
        if (l.id !== labourId) return l;
        const updated = { ...l, [field]: val };
        updated.amount = Number(updated.hours || 0) * Number(updated.rate || 0);
        return updated;
      });
      return { ...item, labours: updatedLabours };
    }));
  };

  const handleRemoveLabour = (wbsId: string, labourId: string) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      return { ...item, labours: item.labours.filter((l) => l.id !== labourId) };
    }));
  };

  const handleAddMaterial = (wbsId: string) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      return { ...item, materials: [...item.materials, { id: `m_${Date.now()}`, material_name: '', quantity: 0, unit: 'Nos', rate: 0, amount: 0 }] };
    }));
  };

  const handleUpdateMaterial = (wbsId: string, materialId: string, field: string, val: any) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      const updatedMaterials = item.materials.map((m) => {
        if (m.id !== materialId) return m;
        const updated = { ...m, [field]: val };
        updated.amount = Number(updated.quantity || 0) * Number(updated.rate || 0);
        return updated;
      });
      return { ...item, materials: updatedMaterials };
    }));
  };

  const handleRemoveMaterial = (wbsId: string, materialId: string) => {
    setWbsItems((prev) => prev.map((item) => {
      if (item.id !== wbsId) return item;
      return { ...item, materials: item.materials.filter((m) => m.id !== materialId) };
    }));
  };

  const handleRemoveWbsItem = (id: string) => {
    setWbsItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Toggle Terms Template
  const handleTermsTemplatesChange = (newIds: (string | number)[]) => {
    const nextIds = newIds.map(Number);
    const removedIds = selectedTermsTemplateIds.filter((id) => !nextIds.includes(id));
    
    if (removedIds.length > 0) {
      setTermsSnapshots((prev) => prev.filter((t) => !removedIds.includes(t.template_id as number)));
    }
    
    const addedIds = nextIds.filter((id) => !selectedTermsTemplateIds.includes(id));
    setSelectedTermsTemplateIds(nextIds);
    
    for (const templateId of addedIds) {
      const template = termsTemplates.find(t => t.template_id === templateId);
      if (!template) continue;
      
      let clauses: TermsSnapshotItem[] = [];
      if (template.items && template.items.length > 0) {
        clauses = template.items.map((item: any, i: number) => ({
          template_id: template.template_id,
          template_name: template.template_name,
          title: item.title || `Clause ${i + 1}`,
          description: item.description || '',
          sort_order: item.sort_order || i + 1,
          is_mandatory: false,
        }));
      } else {
        clauses = [
          {
            template_id: template.template_id,
            template_name: template.template_name,
            title: template.template_name,
            description: template.terms_content || (template as any).description || '',
            sort_order: 1,
            is_mandatory: false,
          },
        ];
      }
      setTermsSnapshots((prev) => [...prev, ...clauses]);
    }
  };

  // Add Custom Term
  const handleAddCustomTerm = () => {
    setTermsSnapshots((prev) => [
      ...prev,
      {
        template_id: null,
        template_name: 'Custom',
        title: 'New Condition',
        description: 'Specify contractual condition or terms...',
        sort_order: prev.length + 1,
        is_mandatory: false,
      },
    ]);
  };

  const handleUpdateTerm = (idx: number, field: string, val: any) => {
    setTermsSnapshots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleRemoveTerm = (idx: number) => {
    setTermsSnapshots((prev) => prev.filter((_, i) => i !== idx));
  };

  // Document Upload Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        setDocumentsList((prev) => [
          ...prev,
          {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            file_base64: base64,
            uploaded_at: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveDocument = (id: string) => {
    setDocumentsList((prev) => prev.filter((doc) => doc.id !== id));
  };

  // Validate Form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Please select or add a Customer';
    }

    if (projectMode === 'existing' && !formData.project_id) {
      newErrors.project_id = 'Please select a Project or switch to "+ New Project"';
    } else if (projectMode === 'new' && !formData.new_project_name.trim()) {
      newErrors.new_project_name = 'Please enter a name for the new project';
    }

    if (!formData.project_type_id) {
      newErrors.project_type_id = 'Please select a Project Type';
    }

    if (!formData.quotation_date) {
      newErrors.quotation_date = 'Quotation Date is compulsory';
    }

    if (wbsItems.length === 0) {
      newErrors.wbs = 'Please select at least one WBS Template or add a Custom WBS task';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit (Draft, Submit, or Save & Send Email)
  const handleSubmit = async (targetStatus: 'draft' | 'pending_approval' | 'approved', sendEmail: boolean = false) => {
    if (!validate()) {
      showError('Please resolve the highlighted compulsory fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build disciplines list
      const disciplinesPayload: any[] = [];

      wbsItems.forEach((item) => {
        const totalLabourHours = item.labours.reduce((sum, l) => sum + Number(l.hours || 0), 0);
        const totalLabourAmount = item.labours.reduce((sum, l) => sum + Number(l.amount || 0), 0);
        const avgLabourRate = totalLabourHours > 0 ? totalLabourAmount / totalLabourHours : 0;

        const totalMaterialQty = item.materials.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
        const totalMaterialAmount = item.materials.reduce((sum, m) => sum + Number(m.amount || 0), 0);
        const avgMaterialRate = totalMaterialQty > 0 ? totalMaterialAmount / totalMaterialQty : 0;

        const wbsType = (item.labours.length > 0 && item.materials.length > 0) ? 'both' : (item.materials.length > 0 ? 'material' : 'labour');
        
        disciplinesPayload.push({
          wbs_id: item.wbs_id || null,
          wbs_template_id: item.wbs_template_id || null,
          wbs_template_name: item.wbs_template_name || null,
          discipline_name: item.discipline_name || 'WBS Task',
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          wbs_type: wbsType,
          quantity: 1,
          rate: totalLabourAmount + totalMaterialAmount,
          amount: totalLabourAmount + totalMaterialAmount,
          labour_hours: totalLabourHours,
          labour_rate: avgLabourRate,
          labour_cost: totalLabourAmount,
          material_quantity: totalMaterialQty,
          material_rate: avgMaterialRate,
          material_cost: totalMaterialAmount,
          description: null,
          labours: item.labours,
          materials: item.materials
        });
      });

      const payload = {
        quotation_code: formData.quotation_code.trim() || undefined,
        customer_id: Number(formData.customer_id),
        project_id: projectMode === 'existing' && formData.project_id ? Number(formData.project_id) : null,
        new_project_name: projectMode === 'new' ? formData.new_project_name.trim() : null,
        project_type_id: Number(formData.project_type_id),
        currency_id: Number(formData.currency_id || selectedCurrency.currency_id),
        exchange_rate: Number(formData.exchange_rate || 1),
        quotation_date: formData.quotation_date,
        validity_date: formData.validity_date || null,
        description: formData.description.trim() || null,
        discount_amount: calculations.discountAmount,
        subtotal_amount: calculations.netSubtotal,
        tax_amount: calculations.totalTaxAmount,
        total_amount: calculations.grandTotal,
        status: targetStatus,
        planning_required: formData.planning_required,
        selected_wbs_templates: selectedWbsTemplateIds.map((id) => {
          const t = wbsTemplates.find((wt) => (wt.template_id || wt.id) === id);
          return { template_id: id, template_name: t?.template_name || '' };
        }),
        taxes: selectedTaxes.map((tax) => ({
          tax_id: tax.tax_id,
          tax_name: tax.tax_name,
          tax_code: tax.tax_code,
          tax_type: tax.tax_type,
          tax_percentage: Number(tax.tax_percentage),
        })),
        terms_snapshots: termsSnapshots,
        documents: documentsList,
        disciplines: disciplinesPayload,
      };

      const endpoint = isEditMode ? `/quotations/${quotationId}` : '/quotations';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await apiRequest<any>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        const qId = res.data.quotation_id || quotationId;
        if (sendEmail && qId) {
          try {
            await apiRequest(`/quotations/${qId}/send-email`, { method: 'POST' });
            showSuccess(isEditMode ? 'Quotation updated and sent via email!' : 'Quotation created and sent via email!');
          } catch (e: any) {
            showSuccess(isEditMode ? 'Quotation updated successfully!' : 'Quotation saved successfully!');
          }
        } else {
          showSuccess(
            isEditMode
              ? 'Quotation updated successfully!'
              : targetStatus === 'approved'
              ? 'Quotation created & approved successfully!'
              : 'Quotation saved successfully!'
          );
        }
        onBack();
      } else {
        showError(res.message || 'Failed to save quotation');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while saving the quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="spinner" />
        <p>Loading quotation workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* ── TOP HEADER / ACTION BAR ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            variant="secondary"
            onClick={onBack}
            style={{
              padding: '0.45rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ArrowLeft size={16} /> Back to Quotations
          </Button>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={24} color="var(--accent-primary)" />
              {isEditMode ? `Edit Quotation (${formData.quotation_code || `#${quotationId}`})` : 'Create New Quotation'}
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
              Configure client, combined WBS items, terms, documents, and real-time financial estimates
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={16} /> Save Draft
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('pending_approval', true)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            <Mail size={16} /> {isEditMode ? 'Update & Send Email' : 'Save & Send Email'}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit('pending_approval')}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Send size={16} /> {isEditMode ? 'Update & Submit' : 'Save & Submit'}
          </Button>
        </div>
      </div>

      {/* ── RESPONSIVE MAIN CONTENT GRID ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="quotation-form-layout"
      >
        {/* ── LEFT COLUMN: MAIN FORM SECTIONS ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. CUSTOMER & PROJECT SECTION */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <Building2 size={18} color="var(--accent-primary)" />
              <span>1. Customer & Project Details</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Customer Search & Quick Add */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Customer <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickCustomerOpen(true)}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 500,
                    }}
                  >
                    <Plus size={13} /> Add New Customer
                  </button>
                </div>
                <SearchableSelect
                  options={customerOptions}
                  value={formData.customer_id}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, customer_id: String(val), project_id: '' }));
                    if (errors.customer_id) setErrors((prev) => ({ ...prev, customer_id: '' }));
                  }}
                  placeholder="Search customer by name or code..."
                />
                {errors.customer_id && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {errors.customer_id}
                  </span>
                )}
              </div>

              {/* Project Selection / New Project Toggle */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Project <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setProjectMode('existing')}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: projectMode === 'existing' ? 'var(--accent-primary)' : 'transparent',
                        color: projectMode === 'existing' ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectMode('new')}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: projectMode === 'new' ? 'var(--accent-primary)' : 'transparent',
                        color: projectMode === 'new' ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      + New
                    </button>
                  </div>
                </div>

                {projectMode === 'existing' ? (
                  <>
                    <SearchableSelect
                      options={projectOptions}
                      value={formData.project_id}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, project_id: String(val) }));
                        if (errors.project_id) setErrors((prev) => ({ ...prev, project_id: '' }));
                      }}
                      placeholder="Search existing project..."
                    />
                    {errors.project_id && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        {errors.project_id}
                      </span>
                    )}
                    {formData.project_id && (
                      (() => {
                        const sp = projects.find(p => String(p.project_id) === formData.project_id);
                        if (!sp) return null;
                        return (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              {sp.project_address && <div style={{ gridColumn: '1 / -1' }}><strong>Location:</strong> {sp.project_address}</div>}
                              {sp.country_name && <div><strong>Country:</strong> {sp.country_name}</div>}
                              {sp.radius_meters !== undefined && sp.radius_meters !== null && <div><strong>Radius:</strong> {sp.radius_meters} m</div>}
                              {sp.latitude !== undefined && sp.latitude !== null && <div><strong>Latitude:</strong> {sp.latitude}</div>}
                              {sp.longitude !== undefined && sp.longitude !== null && <div><strong>Longitude:</strong> {sp.longitude}</div>}
                              {sp.budget_amount !== undefined && sp.budget_amount !== null && <div><strong>Budget:</strong> {Number(sp.budget_amount).toLocaleString()}</div>}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </>
                ) : (
                  <div>
                    <input
                      className={`form-input ${errors.new_project_name ? 'invalid-input' : ''}`}
                      placeholder="Enter new project name (auto-created on approval)..."
                      value={formData.new_project_name}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, new_project_name: e.target.value }));
                        if (errors.new_project_name) setErrors((prev) => ({ ...prev, new_project_name: '' }));
                      }}
                    />
                    {errors.new_project_name && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                        {errors.new_project_name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Currency Master Selector */}
              <div>
                <FormSelect
                  label="Currency"
                  required
                  value={formData.currency_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency_id: e.target.value }))}
                  options={[
                    { value: '', label: '-- Select Currency --' },
                    ...currenciesList.map((c) => ({
                      value: String(c.currency_id),
                      label: `${c.currency_name} (${c.symbol} - ${c.currency_code})`,
                    }))
                  ]}
                />
              </div>

              {/* Project Type */}
              <div>
                <FormSelect
                  label="Project Type"
                  required
                  value={formData.project_type_id}
                  error={errors.project_type_id}
                  onChange={(e) => handleProjectTypeChange(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Project Type --' },
                    ...projectTypesList.map((pt) => ({
                      value: String(pt.type_id || (pt as any).project_type_id),
                      label: pt.type_name || (pt as any).project_type_name || `Type ${pt.type_id}`,
                    })),
                  ]}
                />
              </div>

              {/* Planning Required Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.planning_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, planning_required: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Planning Required before Execution (send approved quotation to Planning Workspace)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 2. QUOTATION INFORMATION */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <FileCheck size={18} color="var(--info)" />
              <span>2. Quotation Information</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <FormInput
                  label="Quotation Date"
                  type="date"
                  required
                  value={formData.quotation_date}
                  error={errors.quotation_date}
                  onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Scope Description / Reference</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="High-level project scope or reference notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* 3. WBS TEMPLATE SELECTION */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Layers size={18} color="var(--purple)" />
                <span>3. WBS Template Selection</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {formData.project_type_id ? 'Templates matching selected Project Type' : 'Select Project Type to filter'}
              </span>
            </div>

            {availableWbsTemplates.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No WBS Templates found for the selected Project Type. You can still add Custom WBS tasks below.
              </div>
            ) : (
              <MultiSelectDropdown
                options={availableWbsTemplates.map(tpl => ({ value: tpl.template_id || tpl.id, label: tpl.template_name }))}
                selectedValues={selectedWbsTemplateIds}
                onChange={handleWbsTemplatesChange}
                placeholder="Select WBS Templates..."
              />
            )}
          </div>

          
          {/* Available WBS Selection (from templates) */}
          {availableWbsNodes.length > 0 && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <Layers size={18} color="var(--info)" />
                <span>Select Required WBS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {availableWbsNodes.map(node => {
                   const isSelected = wbsItems.some(i => i.wbs_id === node.id && i.wbs_template_id === node.template_id);
                   return (
                     <label key={`node_${node.template_id}_${node.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)', border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>
                       <input 
                         type="checkbox" 
                         checked={isSelected}
                         onChange={() => handleToggleWbsNode(node)}
                         style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                       />
                       <div>
                         <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{node.wbs_name}</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{node.template_name}</div>
                       </div>
                     </label>
                   );
                })}
              </div>
            </div>
          )}

          {/* 4. WBS CONFIGURATION & LINE ITEMS */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <HardHat size={18} color="var(--warning)" />
                <span>4. WBS Task Configuration ({wbsItems.length} items)</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleAddCustomWbs}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> Add Custom WBS Task
              </Button>
            </div>

            {errors.wbs && (
              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <AlertCircle size={15} /> {errors.wbs}
              </div>
            )}

            {wbsItems.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p>No WBS line items added yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                  Select one or more WBS templates above or click "+ Add Custom WBS Task".
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {wbsItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                    }}
                  >
                    {/* WBS Item Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '220px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <input
                          className="form-input"
                          style={{ fontWeight: 600, fontSize: '0.9rem' }}
                          value={item.discipline_name}
                          onChange={(e) => handleUpdateWbsItem(item.id, { discipline_name: e.target.value })}
                          placeholder="Task / Discipline Name"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.wbs_template_name && (
                          <Badge variant="info" style={{ fontSize: '0.72rem' }}>
                            {item.wbs_template_name}
                          </Badge>
                        )}
                        {(() => {
                          const hasL = item.labours.some(l => l.labour_id || l.labour_name || Number(l.hours || 0) > 0 || Number(l.rate || 0) > 0);
                          const hasM = item.materials.some(m => m.material_id || m.material_name || Number(m.quantity || 0) > 0 || Number(m.rate || 0) > 0);
                          let type = 'NONE';
                          let bg = 'rgba(156, 163, 175, 0.15)';
                          let col = 'var(--text-muted)';
                          if (hasL && !hasM) { type = 'LABOUR'; bg = 'rgba(245, 158, 11, 0.15)'; col = 'var(--warning)'; }
                          else if (!hasL && hasM) { type = 'MATERIAL'; bg = 'rgba(6, 182, 212, 0.15)'; col = 'var(--info)'; }
                          else if (hasL && hasM) { type = 'BOTH'; bg = 'rgba(16, 185, 129, 0.15)'; col = 'var(--success)'; }
                          return (
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', background: bg, color: col }}>
                              TYPE: {type}
                            </span>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => handleRemoveWbsItem(item.id)}
                          style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'transparent',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                          }}
                          title="Remove WBS Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Schedule Dates */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      <FormInput
                        label="Start Date"
                        type="date"
                        value={item.start_date}
                        onChange={(e) => handleUpdateWbsItem(item.id, { start_date: e.target.value })}
                      />
                      <FormInput
                        label="End Date"
                        type="date"
                        value={item.end_date}
                        onChange={(e) => handleUpdateWbsItem(item.id, { end_date: e.target.value })}
                      />
                    </div>

                                        {/* Optional Labour & Material Sub-sections */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px dashed var(--border-color)',
                      }}
                    >
                      <style>{`
                        .wbs-details-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                        .wbs-details-table th { background: var(--bg-card); color: var(--text-secondary); font-weight: 600; padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border-color); }
                        .wbs-details-table td { padding: 0.5rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                        .wbs-details-table .form-input { padding: 0.35rem 0.5rem; }
                        .wbs-mobile-cards { display: none; }
                        
                        @media (max-width: 900px) {
                          .wbs-details-table { display: none; }
                          .wbs-mobile-cards { display: flex; flex-direction: column; gap: 0.75rem; }
                          .wbs-mobile-card { background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.75rem; position: relative; display: flex; flex-direction: column; gap: 0.5rem; }
                          .wbs-mobile-card .close-btn { position: absolute; top: -8px; right: -8px; background: var(--danger); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 12px; }
                        }
                      `}</style>
                      
                      {/* Labour Section */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--warning)' }}>
                            <HardHat size={16} /> LABOUR DETAILS
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddLabour(item.id)}
                            style={{ fontSize: '0.75rem', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', }}
                          >
                            <Plus size={12} /> Add Labour
                          </button>
                        </div>
                        
                        {item.labours.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {item.labours.map((l, idx) => (
                              <div key={l.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative' }}>
                                <button type="button" onClick={() => handleRemoveLabour(item.id, l.id)} style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                
                                <div className="grid-responsive-4" style={{ paddingRight: '2.5rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Labour / Role</label>
                                    <SearchableSelect
                                      options={labourOptions}
                                      value={l.labour_id ? String(l.labour_id) : l.labour_name || ''}
                                      onChange={(val) => {
                                        const found = laboursList.find(x => String(x.labour_id) === val);
                                        if (found) {
                                          handleUpdateLabour(item.id, l.id, 'labour_id', found.labour_id);
                                          handleUpdateLabour(item.id, l.id, 'labour_name', found.name);
                                          handleUpdateLabour(item.id, l.id, 'labour_type', found.labour_type);
                                        } else {
                                          handleUpdateLabour(item.id, l.id, 'labour_id', null);
                                          handleUpdateLabour(item.id, l.id, 'labour_name', val || '');
                                        }
                                      }}
                                      placeholder="Select or type..."
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</label>
                                    <input className="form-input" placeholder="e.g. Skilled" value={l.labour_type || ''} onChange={e => handleUpdateLabour(item.id, l.id, 'labour_type', e.target.value)} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Start Date</label>
                                    <input type="date" className="form-input" value={l.start_date || ''} onChange={e => handleUpdateLabour(item.id, l.id, 'start_date', e.target.value)} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>End Date</label>
                                    <input type="date" className="form-input" value={l.end_date || ''} onChange={e => handleUpdateLabour(item.id, l.id, 'end_date', e.target.value)} />
                                  </div>
                                </div>

                                <div className="grid-responsive-4" style={{ paddingRight: '2.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hours</label>
                                    <input type="number" className="form-input" placeholder="0" value={l.hours || ''} onChange={e => handleUpdateLabour(item.id, l.id, 'hours', Number(e.target.value))} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rate ({selectedCurrency.symbol})</label>
                                    <input type="number" className="form-input" placeholder="0.00" value={l.rate || ''} onChange={e => handleUpdateLabour(item.id, l.id, 'rate', Number(e.target.value))} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Cost</label>
                                    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                      {selectedCurrency.symbol} {Number(l.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Material Section */}
                      <div style={{ paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--info)' }}>
                            <Package size={16} /> MATERIAL DETAILS
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddMaterial(item.id)}
                            style={{ fontSize: '0.75rem', color: 'var(--info)', background: 'rgba(6, 182, 212, 0.08)', border: '1px dashed rgba(6, 182, 212, 0.3)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', }}
                          >
                            <Plus size={12} /> Add Material
                          </button>
                        </div>
                        
                        {item.materials.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            {item.materials.map((m, idx) => (
                              <div key={m.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative' }}>
                                <button type="button" onClick={() => handleRemoveMaterial(item.id, m.id)} style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                
                                <div className="grid-responsive-4" style={{ paddingRight: '2.5rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Material Name</label>
                                    <SearchableSelect
                                      options={materialOptions}
                                      value={m.material_id ? String(m.material_id) : m.material_name || ''}
                                      onChange={(val) => {
                                        const found = materialsList.find(x => String(x.material_id || x.id) === val);
                                        if (found) {
                                          handleUpdateMaterial(item.id, m.id, 'material_id', found.material_id || found.id);
                                          handleUpdateMaterial(item.id, m.id, 'material_name', found.material_name);
                                        } else {
                                          handleUpdateMaterial(item.id, m.id, 'material_id', null);
                                          handleUpdateMaterial(item.id, m.id, 'material_name', val || '');
                                        }
                                      }}
                                      placeholder="Select or type..."
                                    />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</label>
                                    <input className="form-input" placeholder="e.g. Kg, Pcs" value={m.unit || ''} onChange={e => handleUpdateMaterial(item.id, m.id, 'unit', e.target.value)} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Start Date</label>
                                    <input type="date" className="form-input" value={m.start_date || ''} onChange={e => handleUpdateMaterial(item.id, m.id, 'start_date', e.target.value)} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>End Date</label>
                                    <input type="date" className="form-input" value={m.end_date || ''} onChange={e => handleUpdateMaterial(item.id, m.id, 'end_date', e.target.value)} />
                                  </div>
                                </div>

                                <div className="grid-responsive-4" style={{ paddingRight: '2.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Quantity</label>
                                    <input type="number" className="form-input" placeholder="0" value={m.quantity || ''} onChange={e => handleUpdateMaterial(item.id, m.id, 'quantity', Number(e.target.value))} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rate ({selectedCurrency.symbol})</label>
                                    <input type="number" className="form-input" placeholder="0.00" value={m.rate || ''} onChange={e => handleUpdateMaterial(item.id, m.id, 'rate', Number(e.target.value))} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Cost</label>
                                    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                      {selectedCurrency.symbol} {Number(m.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* WBS Cost Summary */}
                      <div style={{ 
                        marginTop: '1rem', 
                        paddingTop: '0.75rem', 
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          padding: '1rem',
                          minWidth: '280px'
                        }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>WBS Cost Summary</h4>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Labour Cost:</span>
                            <span style={{ fontWeight: 600 }}>{selectedCurrency.symbol} {item.labours.reduce((sum, l) => sum + Number(l.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Material Cost:</span>
                            <span style={{ fontWeight: 600 }}>{selectedCurrency.symbol} {item.materials.reduce((sum, m) => sum + Number(m.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            <strong>WBS Total:</strong>
                            <strong>{selectedCurrency.symbol} {(item.labours.reduce((sum, l) => sum + Number(l.amount || 0), 0) + item.materials.reduce((sum, m) => sum + Number(m.amount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. TERMS & CONDITIONS */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <FileText size={18} color="var(--accent-primary)" />
                <span>5. Terms & Conditions</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleAddCustomTerm}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={14} /> Add Custom Term
              </Button>
            </div>

            {/* Template Multi-select Badges */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Available Master Terms Templates:</label>
              <MultiSelectDropdown
                options={termsTemplates.map(tpl => ({ value: tpl.template_id, label: tpl.template_name }))}
                selectedValues={selectedTermsTemplateIds}
                onChange={handleTermsTemplatesChange}
                placeholder="Select Terms Templates..."
              />
            </div>

            {/* Terms List */}
            {termsSnapshots.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No terms selected. Click any template above or "+ Add Custom Term".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {termsSnapshots.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <input
                        className="form-input"
                        style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}
                        value={t.title}
                        onChange={(e) => handleUpdateTerm(idx, 'title', e.target.value)}
                        placeholder="Clause Title"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(idx)}
                        style={{
                          padding: '0.3rem 0.5rem',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={t.description}
                      onChange={(e) => handleUpdateTerm(idx, 'description', e.target.value)}
                      placeholder="Clause Description..."
                      style={{ resize: 'vertical', fontSize: '0.82rem' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. DOCUMENTS & ATTACHMENTS */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Paperclip size={18} color="var(--teal)" />
                <span>6. Supporting Documents ({documentsList.length})</span>
              </div>
              <label
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Upload size={14} /> Upload Files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {documentsList.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <Upload size={20} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                <p>No documents uploaded.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Supports PDF, Excel, Word, and Image files.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {documentsList.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {doc.file_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Uploaded'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: STICKY FINANCIAL SUMMARY ───────────────────── */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <DollarSign size={18} color="var(--success)" />
              <span>Financial Summary</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Labour Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedCurrency.symbol} {calculations.labourSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Material Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedCurrency.symbol} {calculations.materialSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-color)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                <span>Net Subtotal:</span>
                <span>
                  {selectedCurrency.symbol} {calculations.netSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Discount Input */}
              <div style={{ paddingTop: '0.4rem' }}>
                <FormInput
                  label={`Discount (${selectedCurrency.symbol})`}
                  type="number"
                  placeholder="0.00"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                />
              </div>

              {/* Tax Master Multi-Selection */}
              <div style={{ paddingTop: '0.4rem' }}>
                <label className="form-label">Applicable Taxes (from Master):</label>
                <MultiSelectDropdown
                options={taxesList.map(tax => ({ value: tax.tax_id, label: `${tax.tax_name} (${tax.tax_percentage}%)` }))}
                selectedValues={selectedTaxIds}
                onChange={(vals) => setSelectedTaxIds(vals.map(Number))}
                placeholder="Select Taxes..."
              />
              </div>

              {/* Detailed Calculated Taxes */}
              {calculations.taxDetails.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '0.4rem' }}>
                  {calculations.taxDetails.map((td) => (
                    <div key={td.tax_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                         <span>{td.tax_name}</span>
                         <input
                           type="number"
                           className="form-input"
                           style={{ width: '60px', padding: '0.1rem 0.25rem', height: 'auto', fontSize: '0.75rem' }}
                           value={td.tax_percentage}
                           onChange={(e) => setCustomTaxRates(prev => ({ ...prev, [td.tax_id]: Number(e.target.value) }))}
                         />
                         <span>%</span>
                      </div>
                      <span>
                        {selectedCurrency.symbol} {td.calculated_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Grand Total */}
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.85rem',
                  borderTop: '2px solid var(--accent-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Grand Total
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                    Currency: {selectedCurrency.currency_code}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}
                >
                  {selectedCurrency.symbol} {calculations.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons inside sidebar for desktop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
              <Button
                variant="primary"
                onClick={() => handleSubmit('pending_approval')}
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Send size={16} /> {isEditMode ? 'Update & Submit' : 'Save & Submit'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSubmit('pending_approval', true)}
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center', borderColor: '#3b82f6', color: '#3b82f6' }}
              >
                <Mail size={16} /> {isEditMode ? 'Update & Send Email' : 'Save & Send Email'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Save size={16} /> Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM ACTION BAR ─────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border-color)',
          padding: '0.85rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 40,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
            Cancel
          </Button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }} className="hide-mobile">
            All updates calculate in real-time.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
            <Save size={16} /> Save Draft
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit('pending_approval', true)} disabled={isSubmitting} style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
            <Mail size={16} /> {isEditMode ? 'Update & Send Email' : 'Save & Send Email'}
          </Button>
          <Button variant="primary" onClick={() => handleSubmit('pending_approval')} disabled={isSubmitting}>
            <Send size={16} /> {isEditMode ? 'Update & Submit' : 'Save & Submit'}
          </Button>
        </div>
      </div>

      {/* ── QUICK CUSTOMER CREATION MODAL ────────────────────────────── */}
      <Modal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} color="var(--accent-primary)" />
            <span>Quick Register Customer</span>
          </div>
        }
      >
        <form onSubmit={handleQuickCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <FormInput
            label="Customer / Company Name"
            placeholder="e.g. Al Habtoor Group LLC"
            value={quickCustomerData.customer_name}
            onChange={(e) => setQuickCustomerData({ ...quickCustomerData, customer_name: e.target.value })}
            required
          />

          <FormInput
            label="Contact Person"
            placeholder="Primary contact person name"
            value={quickCustomerData.contact_person}
            onChange={(e) => setQuickCustomerData({ ...quickCustomerData, contact_person: e.target.value })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormInput
              label="Contact Phone"
              placeholder="+971 50 123 4567"
              value={quickCustomerData.contact_number}
              onChange={(e) => setQuickCustomerData({ ...quickCustomerData, contact_number: e.target.value })}
            />
            <FormInput
              label="Email Address"
              type="email"
              placeholder="client@company.com"
              value={quickCustomerData.email}
              onChange={(e) => setQuickCustomerData({ ...quickCustomerData, email: e.target.value })}
            />
          </div>

          <FormInput
            label="Address / Location"
            placeholder="Business Bay, Dubai, UAE"
            value={quickCustomerData.address}
            onChange={(e) => setQuickCustomerData({ ...quickCustomerData, address: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsQuickCustomerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreatingCustomer}>
              {isCreatingCustomer ? 'Saving...' : 'Save & Select'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
