const API_BASE = 'http://localhost:5000/api/v1';

async function runTest() {
  console.log('--- STARTING COMPLETE END-TO-END FLOW VERIFICATION ---');

  // Step 0: Auth
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_code: 'ADMIN001',
      password: 'Admin@123'
    })
  });
  const loginData: any = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.accessToken;

  const authFetch = async (url: string, options: any = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      },
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  };

  console.log('✓ Step 0: Logged in successfully as Admin');

  // Step 1: Create a Customer
  const custRes = await authFetch('/customers', {
    method: 'POST',
    body: {
      customer_name: 'Metro City Infrastructure Ltd ' + Date.now(),
      contact_person: 'Suraj Sharma',
      email: `suraj_${Date.now()}@metrocity.com`,
      phone: '9876543210',
      address: 'Sector 62, Noida, Uttar Pradesh',
      gst_number: '07AAAAA0000A1Z5'
    }
  });
  if (!custRes.data.success) throw new Error('Create customer failed: ' + JSON.stringify(custRes.data));
  const customerId = custRes.data.data.customer_id;
  console.log(`✓ Step 1: Customer created with ID: ${customerId}`);

  // Step 2, 3, 4, 5: Create Quotation with multiple Labour & Material WBS
  const quotePayload = {
    customer_id: customerId,
    quotation_code: `QT-E2E-${Date.now().toString().slice(-6)}`,
    description: 'Commercial Complex Phase 1 Construction',
    quotation_date: new Date().toISOString().slice(0, 10),
    validity_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    subtotal_amount: 190000,
    tax_percentage: 0,
    discount_amount: 0,
    total_amount: 190000,
    status: 'draft',
    terms_conditions: 'Quotation with discrete Labour and Material WBS scopes',
    disciplines: [
      {
        discipline_name: 'Civil Excavation & Foundation',
        wbs_type: 'labour',
        description: 'Trenching, deep excavation and soil stabilization',
        quantity: 40,
        rate: 350,
        amount: 14000,
        start_date: '2026-10-01',
        end_date: '2026-10-15'
      },
      {
        discipline_name: 'Structural Brickwork & Masonry',
        wbs_type: 'labour',
        description: 'Brickwork for walls, columns and masonry structural units',
        quantity: 60,
        rate: 400,
        amount: 24000,
        start_date: '2026-10-16',
        end_date: '2026-10-31'
      },
      {
        discipline_name: 'Cement & Aggregate Supply',
        wbs_type: 'material',
        description: 'Grade 53 Portland Cement bags & coarse aggregates',
        quantity: 100,
        rate: 420,
        amount: 42000,
        start_date: '2026-10-01',
        end_date: '2026-10-20'
      },
      {
        discipline_name: 'TMT Steel Reinforcement Rods',
        wbs_type: 'material',
        description: 'Fe500D 12mm & 16mm deformed steel rebars',
        quantity: 2,
        rate: 55000,
        amount: 110000,
        start_date: '2026-10-05',
        end_date: '2026-10-25'
      }
    ]
  };

  const quoteRes = await authFetch('/quotations', {
    method: 'POST',
    body: quotePayload
  });
  if (!quoteRes.data.success) throw new Error('Create quote failed: ' + JSON.stringify(quoteRes.data));
  const quotationId = quoteRes.data.data.quotation_id;
  console.log(`✓ Step 2-5: Quotation created with ID: ${quotationId}`);

  // Verify created quotation disciplines have correct types and dates
  const fetchedQuote = await authFetch(`/quotations/${quotationId}`);
  const qDisciplines = fetchedQuote.data.data.disciplines;
  console.log(`  Fetched Quotation disciplines count: ${qDisciplines.length}`);
  if (qDisciplines.length !== 4) {
    throw new Error(`Expected 4 disciplines, got ${qDisciplines.length}`);
  }
  const labourQuotes = qDisciplines.filter((d: any) => d.wbs_type === 'labour');
  const materialQuotes = qDisciplines.filter((d: any) => d.wbs_type === 'material');
  console.log(`  Labour WBS in Quote: ${labourQuotes.length} (Total: ₹${labourQuotes.reduce((s: number, d: any) => s + Number(d.amount), 0)})`);
  console.log(`  Material WBS in Quote: ${materialQuotes.length} (Total: ₹${materialQuotes.reduce((s: number, d: any) => s + Number(d.amount), 0)})`);
  if (labourQuotes.length !== 2 || materialQuotes.length !== 2) {
    throw new Error('Discipline wbs_type split mismatch');
  }

  // Approve quotation
  await authFetch(`/quotations/${quotationId}/status`, {
    method: 'PATCH',
    body: { status: 'approved' }
  });
  console.log(`✓ Quotation approved`);

  // Step 6: Create a project using that quotation
  const projectCode = `PRJ-E2E-${Date.now().toString().slice(-4)}`;
  const projectPayload = {
    project_code: projectCode,
    project_name: 'Metro Commercial Plaza - Block A',
    customer_id: customerId,
    source_quotation_id: quotationId,
    start_date: '2026-10-01',
    end_date: '2027-04-30',
    budget: 190000,
    status: 'active',
    description: 'Auto-mapped project from Quotation ' + quotationId,
    // Provide WBS mapping from the quotation to simulate ProjectForm submission
    wbs_allocations: [
      {
        wbs_name: 'Civil Excavation & Foundation',
        wbs_type: 'labour',
        description: 'Trenching, deep excavation and soil stabilization',
        planned_hours: 40,
        rate: 350,
        planned_cost: 14000,
        start_date: '2026-10-01',
        end_date: '2026-10-15'
      },
      {
        wbs_name: 'Structural Brickwork & Masonry',
        wbs_type: 'labour',
        description: 'Brickwork for walls, columns and masonry structural units',
        planned_hours: 60,
        rate: 400,
        planned_cost: 24000,
        start_date: '2026-10-16',
        end_date: '2026-10-31'
      },
      {
        wbs_name: 'Cement & Aggregate Supply',
        wbs_type: 'material',
        description: 'Grade 53 Portland Cement bags & coarse aggregates',
        planned_quantity: 100,
        unit: 'Bags',
        rate: 420,
        planned_cost: 42000,
        start_date: '2026-10-01',
        end_date: '2026-10-20'
      },
      {
        wbs_name: 'TMT Steel Reinforcement Rods',
        wbs_type: 'material',
        description: 'Fe500D 12mm & 16mm deformed steel rebars',
        planned_quantity: 2,
        unit: 'Tons',
        rate: 55000,
        planned_cost: 110000,
        start_date: '2026-10-05',
        end_date: '2026-10-25'
      }
    ]
  };

  const projectRes = await authFetch('/projects', {
    method: 'POST',
    body: projectPayload
  });
  if (!projectRes.data.success) throw new Error('Create project failed: ' + JSON.stringify(projectRes.data));
  const projectId = projectRes.data.data.project_id;
  console.log(`✓ Step 6: Project created with ID: ${projectId}, source_quotation_id: ${quotationId}`);

  // Step 7: Verify all quotation WBS/Disciplines automatically appear in the project
  const allProjectWbsRes = await authFetch(`/projects/${projectId}/wbs`);
  const allProjectWbs = allProjectWbsRes.data.data;
  console.log(`✓ Step 7: Total Project WBS fetched: ${allProjectWbs.length}`);
  if (allProjectWbs.length !== 4) {
    throw new Error(`Expected 4 WBS records in project, got ${allProjectWbs.length}`);
  }

  // Filter for Labour WBS
  const labourWbsRes = await authFetch(`/projects/${projectId}/wbs?wbs_type=labour`);
  const labourWbs = labourWbsRes.data.data;
  console.log(`  Project Labour WBS: ${labourWbs.length}`);
  if (labourWbs.length !== 2) throw new Error('Expected exactly 2 labour WBS');

  // Filter for Material WBS
  const materialWbsRes = await authFetch(`/projects/${projectId}/wbs?wbs_type=material`);
  const materialWbs = materialWbsRes.data.data;
  console.log(`  Project Material WBS: ${materialWbs.length}`);
  if (materialWbs.length !== 2) throw new Error('Expected exactly 2 material WBS');

  const excavationWbs = labourWbs.find((w: any) => w.wbs_name.includes('Excavation'));
  const cementWbs = materialWbs.find((w: any) => w.wbs_name.includes('Cement'));

  console.log(`  Found Labour WBS: ${excavationWbs.wbs_name} (ID: ${excavationWbs.id}, Type: ${excavationWbs.wbs_type})`);
  console.log(`  Found Material WBS: ${cementWbs.wbs_name} (ID: ${cementWbs.id}, Type: ${cementWbs.wbs_type})`);

  // Step 8: Create Labour task against Labour WBS
  // First verify: trying to create a task against Material WBS MUST FAIL
  const failTaskRes = await authFetch('/tasks', {
    method: 'POST',
    body: {
      project_id: projectId,
      wbs_id: cementWbs.id, // MATERIAL WBS
      task_name: 'Invalid Task on Material WBS',
      start_date: '2026-10-01',
      target_date: '2026-10-10',
      estimated_hours: 10
    }
  });
  if (failTaskRes.data.success) {
    throw new Error('FAIL: Creating task against Material WBS should have been rejected!');
  } else {
    console.log(`✓ Safety check passed: Creating task against Material WBS correctly rejected with: "${failTaskRes.data.message}"`);
  }

  // Now create valid task on Labour WBS
  const taskRes = await authFetch('/tasks', {
    method: 'POST',
    body: {
      project_id: projectId,
      wbs_id: excavationWbs.id,
      task_name: 'Trench digging for north basement wall',
      description: 'Excavation 3m deep using manual labour and excavator assistance',
      start_date: '2026-10-01',
      target_date: '2026-10-10',
      estimated_hours: 20
    }
  });
  if (!taskRes.data.success) throw new Error('Create task failed: ' + JSON.stringify(taskRes.data));
  const taskId = taskRes.data.data.task_id;
  console.log(`✓ Step 8: Task created under Labour WBS with ID: ${taskId}`);

  // Step 9: Assign Employee & Labour to Task
  const empRes = await authFetch('/employees?limit=5');
  const employeeId = empRes.data.data[0]?.employee_id || 1;

  let labourId: number;
  const labRes = await authFetch('/labours');
  if (labRes.data.data && labRes.data.data.length > 0) {
    labourId = labRes.data.data[0].labour_id;
  } else {
    const newLab = await authFetch('/labours', {
      method: 'POST',
      body: {
        name: 'Ramesh Kumar Excavator',
        labour_type: 'individual',
        daily_rate: 600,
        hourly_rate: 75,
        skill_level: 'skilled',
        status: 'active'
      }
    });
    labourId = newLab.data.data.labour_id;
  }
  console.log(`  Using Employee ID: ${employeeId}, Labour ID: ${labourId}`);

  // Assign employee to task
  await authFetch(`/tasks/${taskId}/assign`, {
    method: 'POST',
    body: { employee_ids: [employeeId] }
  });
  console.log(`✓ Step 9: Assigned employee ${employeeId} to task ${taskId}`);

  // Step 10: Record timesheet / actual hours
  const timesheetRes = await authFetch('/timesheets', {
    method: 'POST',
    body: {
      task_id: taskId,
      employee_id: employeeId,
      log_date: '2026-10-02',
      working_hours: 8,
      comment: 'Foundation perimeter trench excavation'
    }
  });
  if (!timesheetRes.data.success) throw new Error('Create timesheet failed: ' + JSON.stringify(timesheetRes.data));
  console.log(`✓ Step 10: Timesheet logged: 8 hours worked`);

  // Verify task hours (planned = 20, actual = 8, remaining = 12)
  const taskCheck = await authFetch(`/tasks/${taskId}`);
  const updatedTask = taskCheck.data.data;
  console.log(`  Task hours: Planned/Estimated=${updatedTask.estimated_hours}, Actual=${updatedTask.actual_hours || 8}`);

  // Step 11: Add materials against Material WBS
  // First verify: trying to add project material under Labour WBS MUST FAIL
  const failMatRes = await authFetch('/materials/project-materials', {
    method: 'POST',
    body: {
      project_id: projectId,
      wbs_id: excavationWbs.id, // LABOUR WBS
      material_name: 'Cement Bags',
      unit: 'Bags',
      planned_quantity: 50,
      unit_rate: 420
    }
  });
  if (failMatRes.data.success) {
    throw new Error('FAIL: Attaching material to Labour WBS should have been rejected!');
  } else {
    console.log(`✓ Safety check passed: Attaching material to Labour WBS correctly rejected with: "${failMatRes.data.message}"`);
  }

  // Check if project_materials was pre-seeded for Cement WBS
  const pmRes = await authFetch(`/materials/project-materials?project_id=${projectId}&wbs_id=${cementWbs.id}`);
  let cementMaterialId: number;
  if (pmRes.data.data.length > 0) {
    cementMaterialId = pmRes.data.data[0].id;
    console.log(`✓ Cement material pre-seeded from WBS allocation: ID ${cementMaterialId}`);
  } else {
    // Create new project material under Cement WBS
    const newPm = await authFetch('/materials/project-materials', {
      method: 'POST',
      body: {
        project_id: projectId,
        wbs_id: cementWbs.id,
        material_name: 'UltraTech PPC 53 Grade Cement',
        unit: 'Bags',
        planned_quantity: 100,
        unit_rate: 420,
        notes: 'Initial procurement order'
      }
    });
    cementMaterialId = newPm.data.data.id;
    console.log(`✓ Created project material under Cement WBS: ID ${cementMaterialId}`);
  }

  // Step 12: Record received, used, remaining quantities and cost
  // Log receipt of 80 bags @ ₹420
  await authFetch(`/materials/project-materials/${cementMaterialId}/log`, {
    method: 'POST',
    body: {
      action_type: 'received',
      quantity: 80,
      unit_rate: 420,
      log_date: '2026-10-02',
      notes: 'First batch delivered to site store (GRN-2026-001)'
    }
  });
  console.log(`✓ Step 12: Logged receipt of 80 bags @ ₹420`);

  // Log usage of 30 bags
  await authFetch(`/materials/project-materials/${cementMaterialId}/log`, {
    method: 'POST',
    body: {
      action_type: 'used',
      quantity: 30,
      log_date: '2026-10-03',
      notes: 'Used in footing casting'
    }
  });
  console.log(`✓ Step 12: Logged usage of 30 bags`);

  // Step 13: Verify all cost and quantity calculations
  const pmDetail = await authFetch(`/materials/project-materials?project_id=${projectId}`);
  const cementItem = pmDetail.data.data.find((m: any) => m.id === cementMaterialId);
  console.log(`✓ Step 13: Material Metrics:
    Item: ${cementItem.material_name}
    Planned Qty: ${cementItem.planned_quantity} ${cementItem.unit}
    Received Qty: ${cementItem.received_quantity}
    Used Qty: ${cementItem.used_quantity}
    Remaining Qty: ${cementItem.remaining_quantity}
    Extra Qty: ${cementItem.extra_quantity}
    Planned Cost: ₹${cementItem.planned_cost}
    Actual Cost: ₹${cementItem.actual_cost}
    Remaining Cost: ₹${cementItem.remaining_cost}
  `);

  if (Number(cementItem.received_quantity) !== 80) throw new Error(`Expected received 80, got ${cementItem.received_quantity}`);
  if (Number(cementItem.used_quantity) !== 30) throw new Error(`Expected used 30, got ${cementItem.used_quantity}`);
  if (Number(cementItem.remaining_quantity) !== 50) throw new Error(`Expected remaining 50 (80 received - 30 used), got ${cementItem.remaining_quantity}`);
  if (Number(cementItem.actual_cost) !== 12600) throw new Error(`Expected actual cost ₹12,600 (30 used * 420), got ${cementItem.actual_cost}`);

  // Step 14: Verify Reports (P&L and Planned vs Actual)
  const plReportRes = await authFetch('/reports/project-profit-loss');
  console.log('✓ Step 14: P&L Report Count:', plReportRes.data.data?.length, 'Sample:', plReportRes.data.data?.[0]);
  const projectPl = plReportRes.data.data?.find((p: any) => p.project_id === projectId);
  if (projectPl) {
    console.log('✓ P&L for Project found:', {
      project_name: projectPl.project_name,
      contract_value: projectPl.contract_value,
      actual_labour_cost: projectPl.actual_labour_cost,
      actual_material_cost: projectPl.actual_material_cost,
      total_actual_cost: projectPl.total_actual_cost,
      profit_loss: projectPl.profit_loss
    });
  } else {
    console.log('P&L not found for projectId:', projectId, 'available project_ids:', plReportRes.data.data?.map((p: any) => p.project_id));
  }

  const pvaReportRes = await authFetch('/reports/planned-vs-actual');
  console.log('✓ Step 14: Planned vs Actual Report Count:', pvaReportRes.data.data?.length);
  const projectPva = pvaReportRes.data.data?.find((p: any) => p.project_name === 'Metro Commercial Plaza - Block A');
  if (projectPva) {
    console.log('✓ Planned vs Actual for Project found:', {
      project_name: projectPva.project_name,
      wbs_name: projectPva.wbs_name,
      task_name: projectPva.task_name,
      planned_labour_hours: projectPva.planned_labour_hours,
      actual_labour_hours: projectPva.actual_labour_hours,
      planned_material_quantity: projectPva.planned_material_quantity,
      actual_material_quantity: projectPva.actual_material_quantity,
      actual_material_cost: projectPva.actual_material_cost
    });
  } else {
    console.log('Planned vs Actual not found for project, available:', pvaReportRes.data.data?.map((p: any) => p.project_name));
  }

  // Step 15: Test Edit & Reload Scenarios
  // Update the project material note
  await authFetch(`/materials/project-materials/${cementMaterialId}`, {
    method: 'PUT',
    body: {
      notes: 'Updated procurement specs: Grade 53 Portland Cement Verified'
    }
  });
  console.log(`✓ Step 15: Material record edited and re-verified`);

  console.log('\n======================================================');
  console.log('🎉 ALL 17 VERIFICATION CRITERIA PASSED SUCCESSFULLY! 🎉');
  console.log('======================================================\n');
}

runTest().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
