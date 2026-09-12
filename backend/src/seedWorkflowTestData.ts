import { dbPool } from './config/db';
import { migrate } from './migrate';

export async function seedWorkflowTestData() {
  console.log('--- STARTING SEED FOR WORKFLOW TEST DATA ---');
  await migrate();

  // 1. Ensure 5 Master Disciplines exist
  const masterWbs = [
    { code: 'WBS-CIVIL', name: 'Civil Works', desc: 'Excavation, grading, and concrete foundations' },
    { code: 'WBS-ELEC', name: 'Electrical Works', desc: 'Cable trenching, wiring, panel setup, and earthing' },
    { code: 'WBS-MECH', name: 'Mechanical Works', desc: 'Tracker installation and module mounting structures' },
    { code: 'WBS-INST', name: 'Installation', desc: 'Solar panel mounting and inverter connections' },
    { code: 'WBS-TEST', name: 'Testing & Commissioning', desc: 'String testing, grid sync, and safety checks' },
  ];

  const wbsIdMap: Record<string, number> = {};

  for (const item of masterWbs) {
    const [existing]: any = await dbPool.query(
      `SELECT id FROM work_breakdown_structures WHERE wbs_code = ? AND deleted_at IS NULL`,
      [item.code]
    );

    if (existing.length > 0) {
      wbsIdMap[item.code] = existing[0].id;
    } else {
      const [res]: any = await dbPool.query(
        `INSERT INTO work_breakdown_structures (wbs_code, wbs_name) VALUES (?, ?)`,
        [item.code, item.name]
      );
      wbsIdMap[item.code] = res.insertId;
    }
  }
  console.log('Master Disciplines ready:', wbsIdMap);

  // 2. Create or Reset Test Project
  const projectCode = 'PRJ-2026-60';
  const projectName = 'Pune Solar Farm Installation';
  const [projRows]: any = await dbPool.query(
    `SELECT project_id FROM projects WHERE project_code LIKE '%PRJ-2026-60%' OR project_id = 1004 LIMIT 1`
  );

  let projectId: number;
  if (projRows && projRows.length > 0) {
    projectId = projRows[0].project_id;
    await dbPool.query(
      `UPDATE projects SET 
         note = 'End-to-End Solar Farm Installation Project',
         project_date = '2026-03-01',
         budget_amount = 500000.00,
         status = 'in-progress'
       WHERE project_id = ?`,
      [projectId]
    );
  } else {
    const [res]: any = await dbPool.query(
      `INSERT INTO projects (project_code, project_name, note, project_date, budget_amount, status)
       VALUES (?, ?, 'End-to-End Solar Farm Installation Project', '2026-03-01', 500000.00, 'in-progress')`,
      [projectCode, projectName]
    );
    projectId = res.insertId;
  }
  console.log(`Project ready: ID ${projectId} - ${projectName}`);

  // 3. Create Project WBS entries for the 5 disciplines
  const pwbsAllocations = [
    { code: 'WBS-CIVIL', hours: 100, budget: 100000 },
    { code: 'WBS-ELEC', hours: 100, budget: 120000 },
    { code: 'WBS-MECH', hours: 100, budget: 100000 },
    { code: 'WBS-INST', hours: 100, budget: 90000 },
    { code: 'WBS-TEST', hours: 100, budget: 90000 },
  ];

  const pwbsIdMap: Record<string, number> = {};

  for (const alloc of pwbsAllocations) {
    const masterId = wbsIdMap[alloc.code];
    const [existingPwbs]: any = await dbPool.query(
      `SELECT id FROM project_wbs WHERE project_id = ? AND wbs_id = ? AND deleted_at IS NULL`,
      [projectId, masterId]
    );

    if (existingPwbs.length > 0) {
      pwbsIdMap[alloc.code] = existingPwbs[0].id;
      await dbPool.query(
        `UPDATE project_wbs SET start_date = '2026-03-01', end_date = '2026-03-31', total_hours = ?, budget_amount = ? WHERE id = ?`,
        [alloc.hours, alloc.budget, existingPwbs[0].id]
      );
    } else {
      const [res]: any = await dbPool.query(
        `INSERT INTO project_wbs (project_id, wbs_id, start_date, end_date, total_hours, budget_amount)
         VALUES (?, ?, '2026-03-01', '2026-03-31', ?, ?)`,
        [projectId, masterId, alloc.hours, alloc.budget]
      );
      pwbsIdMap[alloc.code] = res.insertId;
    }
  }
  console.log('Project WBS mapped:', pwbsIdMap);

  // 4. Create Tasks under Disciplines
  const taskDefinitions = [
    { name: 'Excavation & Foundation', wbsCode: 'WBS-CIVIL', estHrs: 60, budget: 60000, status: 'in-progress' },
    { name: 'Concrete Slab Pouring', wbsCode: 'WBS-CIVIL', estHrs: 40, budget: 40000, status: 'pending' },
    { name: 'Cable Trenching', wbsCode: 'WBS-ELEC', estHrs: 50, budget: 60000, status: 'in-progress' },
    { name: 'Panel Wiring & Distribution', wbsCode: 'WBS-ELEC', estHrs: 50, budget: 60000, status: 'pending' },
    { name: 'Steel Structure Assembly', wbsCode: 'WBS-MECH', estHrs: 100, budget: 100000, status: 'pending' },
    { name: 'Solar Inverter Mounting', wbsCode: 'WBS-INST', estHrs: 100, budget: 90000, status: 'pending' },
    { name: 'Grid Synchronization Test', wbsCode: 'WBS-TEST', estHrs: 100, budget: 90000, status: 'pending' },
  ];

  const taskIdMap: Record<string, number> = {};

  for (const tDef of taskDefinitions) {
    const pwId = pwbsIdMap[tDef.wbsCode];
    const [existingTask]: any = await dbPool.query(
      `SELECT task_id FROM tasks WHERE project_id = ? AND task_name = ? AND is_deleted = 0`,
      [projectId, tDef.name]
    );

    if (existingTask.length > 0) {
      taskIdMap[tDef.name] = existingTask[0].task_id;
      await dbPool.query(
        `UPDATE tasks SET wbs_id = ?, estimated_hours = ?, budget_amount = ?, status = ?, required_worker_count = 2 WHERE task_id = ?`,
        [pwId, tDef.estHrs, tDef.budget, tDef.status, existingTask[0].task_id]
      );
    } else {
      const [res]: any = await dbPool.query(
        `INSERT INTO tasks (project_id, wbs_id, task_name, description, required_worker_count, estimated_hours, budget_amount, start_date, target_date, status)
         VALUES (?, ?, ?, 'Test task description', 2, ?, ?, '2026-03-01', '2026-03-31', ?)`,
        [projectId, pwId, tDef.name, tDef.estHrs, tDef.budget, tDef.status]
      );
      taskIdMap[tDef.name] = res.insertId;
    }
  }
  console.log('Tasks mapped:', taskIdMap);

  // 5. Ensure Employees & Labours exist
  const [empRows]: any = await dbPool.query(`SELECT employee_id FROM employees LIMIT 2`);
  let emp1Id = empRows[0]?.employee_id || 1;
  let emp2Id = empRows[1]?.employee_id || emp1Id;

  // Insert or fetch Labours
  const [labour1Res]: any = await dbPool.query(
    `SELECT labour_id FROM labours WHERE name = 'Ramesh Kumar'`
  );
  let labour1Id: number;
  if (labour1Res.length > 0) {
    labour1Id = labour1Res[0].labour_id;
  } else {
    const [r]: any = await dbPool.query(
      `INSERT INTO labours (name, contact_number, aadhar_id, labour_type) VALUES ('Ramesh Kumar', '9876543210', '123456789012', 'direct_labour')`
    );
    labour1Id = r.insertId;
  }

  const [labour2Res]: any = await dbPool.query(
    `SELECT labour_id FROM labours WHERE name = 'Suresh Patel'`
  );
  let labour2Id: number;
  if (labour2Res.length > 0) {
    labour2Id = labour2Res[0].labour_id;
  } else {
    const [r]: any = await dbPool.query(
      `INSERT INTO labours (name, contact_number, aadhar_id, labour_type) VALUES ('Suresh Patel', '9876543211', '123456789013', 'contractor')`
    );
    labour2Id = r.insertId;
  }
  console.log(`Labours ready: ID ${labour1Id} (Direct), ID ${labour2Id} (Contractor)`);

  // Clean test logs for this test project to ensure repeatable verification
  await dbPool.query(`DELETE FROM timesheets WHERE project_id = ?`, [projectId]);
  await dbPool.query(`DELETE FROM labour_work_logs WHERE project_id = ?`, [projectId]);

  // 6. Log Timesheets for Employees
  const taskC1Id = taskIdMap['Excavation & Foundation'];
  const taskE1Id = taskIdMap['Cable Trenching'];
  const pwCivilId = pwbsIdMap['WBS-CIVIL'];
  const pwElecId = pwbsIdMap['WBS-ELEC'];

  await dbPool.query(
    `INSERT INTO timesheets (project_id, wbs_id, task_id, employee_id, log_date, working_hours, comment)
     VALUES (?, ?, ?, ?, '2026-03-05', 8.00, 'Excavation supervision Day 1'),
            (?, ?, ?, ?, '2026-03-06', 8.00, 'Excavation supervision Day 2'),
            (?, ?, ?, ?, '2026-03-05', 8.00, 'Cable trenching setup')`,
    [
      projectId, pwCivilId, taskC1Id, emp1Id,
      projectId, pwCivilId, taskC1Id, emp1Id,
      projectId, pwElecId, taskE1Id, emp2Id,
    ]
  );
  console.log('Logged employee timesheets: 24 total employee hours.');

  // 7. Log Labour Work Logs
  const [lwl1]: any = await dbPool.query(
    `INSERT INTO labour_work_logs (labour_id, project_id, wbs_id, task_id, work_date, total_working_hours, rate_type, rate, amount, work_description, work_status, payment_status)
     VALUES (?, ?, ?, ?, '2026-03-05', 8.00, 'hourly', 200.00, 1600.00, 'Foundation digging', 'completed', 'pending')`,
    [labour1Id, projectId, pwCivilId, taskC1Id]
  );
  const log1Id = lwl1.insertId;

  const [lwl2]: any = await dbPool.query(
    `INSERT INTO labour_work_logs (labour_id, project_id, wbs_id, task_id, work_date, total_working_hours, rate_type, rate, amount, work_description, work_status, payment_status)
     VALUES (?, ?, ?, ?, '2026-03-06', 8.00, 'hourly', 250.00, 2000.00, 'Foundation reinforcement', 'completed', 'pending')`,
    [labour2Id, projectId, pwCivilId, taskC1Id]
  );
  const log2Id = lwl2.insertId;

  const [lwl3]: any = await dbPool.query(
    `INSERT INTO labour_work_logs (labour_id, project_id, wbs_id, task_id, work_date, total_working_hours, rate_type, rate, amount, work_description, work_status, payment_status)
     VALUES (?, ?, ?, ?, '2026-03-06', 10.00, 'hourly', 300.00, 3000.00, 'Cable trenching heavy duty', 'completed', 'paid')`,
    [labour2Id, projectId, pwElecId, taskE1Id]
  );
  const log3Id = lwl3.insertId;
  console.log(`Logged labour work logs: Log IDs ${log1Id}, ${log2Id}, ${log3Id}`);

  // 8. Create Labour Payment Record for Paid Log 3
  const [payRes]: any = await dbPool.query(
    `INSERT INTO labour_payments (payment_code, labour_id, project_id, payment_date, total_hours, total_amount, payment_method, status, remarks)
     VALUES ('PAY-TEST-001', ?, ?, '2026-03-07', 10.00, 3000.00, 'bank_transfer', 'paid', 'Settlement for cable trenching log')
     ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount)`,
    [labour2Id, projectId]
  );
  const paymentId = payRes.insertId || payRes.id;

  if (paymentId) {
    await dbPool.query(`INSERT IGNORE INTO labour_payment_items (payment_id, work_log_id, amount) VALUES (?, ?, 3000.00)`, [paymentId, log3Id]);
  }
  console.log('Labour payment record verified.');
  console.log('--- WORKFLOW TEST DATA SEEDED SUCCESSFULLY ---');

  return {
    projectId,
    pwbsIdMap,
    taskIdMap,
    labour1Id,
    labour2Id,
    log1Id,
    log2Id,
    log3Id,
    paymentId,
  };
}
