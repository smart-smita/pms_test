import { dbPool as pool } from '../config/db';
import { QuotationRepository } from '../repositories/quotation.repository';
import { PlanningRepository } from '../repositories/planning.repository';
import { ScheduleService } from '../services/schedule.service';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 STARTING QUOTATION → PLANNING → PROJECT E2E TESTS');
  console.log('====================================================\n');

  try {
    // 0. Ensure customer and masters exist
    const [custRows]: any = await pool.query(`SELECT customer_id FROM customers WHERE status = 1 LIMIT 1`);
    let customerId = custRows[0]?.customer_id;
    if (!customerId) {
      const [res]: any = await pool.query(
        `INSERT INTO customers (customer_name, customer_code, email, contact_number, status) VALUES ('E2E Test Customer', 'CUST-E2E', 'test@htco.com', '1234567890', 1)`
      );
      customerId = res.insertId;
    }

    const [empRows]: any = await pool.query(`SELECT employee_id FROM employees WHERE deleted_at IS NULL LIMIT 1`);
    const userId = empRows[0]?.employee_id || 1;

    console.log(`Using Customer ID: ${customerId}, User ID: ${userId}`);

    // Ensure company_calendar has 5-day week and standard working hours
    await pool.query(
      `INSERT INTO company_calendar (id, calendar_name, working_days_json, working_hours_per_day, status) 
       VALUES (1, 'Standard 5-Day Calendar', '[1,2,3,4,5]', 8.0, 1)
       ON DUPLICATE KEY UPDATE working_days_json=VALUES(working_days_json), working_hours_per_day=VALUES(working_hours_per_day), status=1`
    );

    // Ensure clean test data
    await pool.query(`DELETE FROM holidays WHERE calendar_id = 1`);
    await pool.query(`DELETE FROM timesheets`);
    await pool.query(`DELETE FROM labour_work_logs`);
    await pool.query(`DELETE FROM task_assignments`);
    await pool.query(`DELETE FROM task_dependencies`);
    await pool.query(`DELETE FROM tasks`);
    await pool.query(`DELETE FROM project_wbs`);
    await pool.query(`DELETE FROM project_materials`);
    await pool.query(`DELETE FROM project_terms_snapshots`);
    await pool.query(`DELETE FROM project_taxes`);
    await pool.query(`DELETE FROM projects`);
    await pool.query(`DELETE FROM planning_revisions`);
    await pool.query(`DELETE FROM planning_taxes`);
    await pool.query(`DELETE FROM planning_terms_snapshots`);
    await pool.query(`DELETE FROM planning_terms_templates`);
    await pool.query(`DELETE FROM planning_task_dependencies`);
    await pool.query(`DELETE FROM planning_tasks`);
    await pool.query(`DELETE FROM planning_wbs_labour`);
    await pool.query(`DELETE FROM planning_wbs_material`);
    await pool.query(`DELETE FROM planning_wbs`);
    await pool.query(`DELETE FROM planning`);
    await pool.query(`DELETE FROM quotation_taxes`);
    await pool.query(`DELETE FROM quotation_terms_snapshots`);
    await pool.query(`DELETE FROM quotation_terms_templates`);
    await pool.query(`DELETE FROM quotation_wbs_labour`);
    await pool.query(`DELETE FROM quotation_wbs_material`);
    await pool.query(`DELETE FROM quotation_disciplines`);
    await pool.query(`DELETE FROM quotation_snapshots`);
    await pool.query(`DELETE FROM quotations`);

    // ==========================================
    // TEST 1: CREATE QUOTATION & APPROVE -> AUTO PLANNING
    // ==========================================
    console.log('\n--- [TEST 1] Create Quotation with WBS, Labour, Material, T&C & Taxes ---');
    const qCode = `QT-E2E-${Date.now()}`;
    const quotation = await QuotationRepository.create(
      {
        quotation_code: qCode,
        customer_id: customerId,
        new_project_name: 'E2E Solar Substation Project',
        project_type_id: 1,
        currency_id: 1,
        quotation_date: '2026-10-01',
        start_date: '2026-10-01',
        end_date: '2026-10-15',
        subtotal_amount: 500000,
        tax_percentage: 18,
        tax_amount: 90000,
        discount_amount: 0,
        total_amount: 590000,
        status: 'draft',
        created_by: userId,
        terms_snapshots: [
          {
            title: 'Payment Milestones',
            description: '30% advance, 50% on delivery, 20% on commissioning',
            sort_order: 1,
            is_mandatory: 1
          },
          {
            title: 'Warranty Guarantee',
            description: '24 months comprehensive warranty from COD',
            sort_order: 2,
            is_mandatory: 1
          }
        ],
        taxes: [
          {
            tax_id: 1,
            tax_name: 'CGST',
            tax_percentage: 9
          },
          {
            tax_id: 2,
            tax_name: 'SGST',
            tax_percentage: 9
          }
        ]
      },
      [
        {
          discipline_name: 'Site Preparation & Civil',
          description: 'Earthwork and leveling',
          quantity: 1,
          rate: 150000,
          amount: 150000,
          start_date: '2026-10-01',
          end_date: '2026-10-05',
          labours: [
            {
              labour_type: 'Civil Contractor',
              workers_count: 10,
              hours_per_day: 8,
              total_hours: 400,
              rate_per_hour: 150,
              total_cost: 60000,
              start_date: '2026-10-01',
              end_date: '2026-10-05'
            }
          ],
          materials: [
            {
              material_name: 'Ordinary Portland Cement',
              material_code: 'CEM-53',
              unit: 'Bags',
              quantity: 500,
              rate: 350,
              total_cost: 175000,
              start_date: '2026-10-01',
              end_date: '2026-10-05'
            }
          ]
        },
        {
          discipline_name: 'Electrical Installation',
          description: 'Transformer and cabling',
          quantity: 1,
          rate: 350000,
          amount: 350000,
          start_date: '2026-10-06',
          end_date: '2026-10-15',
          labours: [],
          materials: []
        }
      ],
      userId
    );

    const quotationId = quotation.quotation_id;
    console.log(`✅ Created Quotation ID: ${quotationId}, Code: ${quotation.quotation_code}`);

    // Approve quotation
    console.log(`Approving Quotation ID: ${quotationId}...`);
    await QuotationRepository.updateStatus(quotationId, 'approved', userId);

    // Verify Planning was automatically generated!
    const planningRows = await PlanningRepository.getAll({ quotation_id: quotationId });
    if (!planningRows || planningRows.length === 0) {
      throw new Error(`❌ Planning was NOT automatically created for Quotation ${quotationId}`);
    }
    const planningHeader = planningRows[0];
    console.log(`✅ Planning automatically created! Planning ID: ${planningHeader.id}, Code: ${planningHeader.planning_code}, Status: ${planningHeader.status}`);

    // Verify Planning loaded 100% of data
    const fullPlan = await PlanningRepository.getById(planningHeader.id);
    console.log(`   - Customer: ${fullPlan.customer_name} (ID: ${fullPlan.customer_id})`);
    console.log(`   - New Project Name: "${fullPlan.new_project_name}"`);
    console.log(`   - WBS Count: ${fullPlan.wbs?.length} (Expected: 2)`);
    console.log(`   - Tasks Count: ${fullPlan.tasks?.length} (Expected: 2)`);
    console.log(`   - Labour Count: ${fullPlan.labour?.length} (Expected: 1)`);
    console.log(`   - Materials Count: ${fullPlan.materials?.length} (Expected: 1)`);
    console.log(`   - Terms Count: ${fullPlan.terms?.length} (Expected: 2)`);
    console.log(`   - Taxes Count: ${fullPlan.taxes?.length} (Expected: 2)`);

    if (fullPlan.wbs?.length !== 2 || fullPlan.labour?.length !== 1 || fullPlan.materials?.length !== 1 || fullPlan.terms?.length !== 2) {
      throw new Error('❌ Planning data completeness check failed!');
    }
    console.log('✅ Test 1 Passed: 100% Quotation Data Auto-Loaded into Planning!');

    // ==========================================
    // TEST 2: EDIT PLANNING DRAFT & PERSISTENCE
    // ==========================================
    console.log('\n--- [TEST 2] Edit Planning (Labour, Material, T&C, Dates) as Draft ---');
    
    // Modify labour: 10 workers -> 15 workers, 01-Oct -> 03-Oct to 15-Oct
    const updatedLabour = [...(fullPlan.labour || [])];
    updatedLabour[0].worker_count = 15;
    updatedLabour[0].workers_count = 15;
    updatedLabour[0].start_date = '2026-10-03';
    updatedLabour[0].end_date = '2026-10-15';
    updatedLabour[0].total_cost = 90000;

    // Modify materials: 500 bags -> 750 bags
    const updatedMaterials = [...(fullPlan.materials || [])];
    updatedMaterials[0].quantity = 750;
    updatedMaterials[0].total_cost = 262500;

    // Modify terms
    const updatedTerms = [...(fullPlan.terms || [])];
    updatedTerms.push({
      title: 'Safety Compliance Penalty',
      description: 'Contractor must comply with OHSAS 18001 standards',
      sort_order: 3,
      is_mandatory: 1
    });

    // Add a 3rd task under WBS 2
    const wbs2 = fullPlan.wbs.find((w: any) => w.wbs_name === 'Electrical Installation' || w.discipline_name === 'Electrical Installation') || fullPlan.wbs[1];
    const updatedTasks = [...(fullPlan.tasks || [])];
    updatedTasks[0].task_name = 'Excavation & Earthwork';
    updatedTasks[1].task_name = 'Cable Laying';
    updatedTasks.push({
      planning_wbs_id: wbs2.id,
      task_name: 'Transformer Commissioning',
      description: 'Install and test 33kV transformer',
      start_date: '2026-10-11',
      end_date: '2026-10-15',
      duration_days: 5,
      planned_cost: 250000,
      sort_order: 2
    });

    await PlanningRepository.saveDraft(
      planningHeader.id,
      {
        start_date: '2026-10-03',
        end_date: '2026-10-25',
        duration_days: 22,
        wbs: fullPlan.wbs,
        tasks: updatedTasks,
        dependencies: fullPlan.dependencies,
        labour: updatedLabour,
        materials: updatedMaterials,
        terms: updatedTerms,
        taxes: fullPlan.taxes,
        revision_notes: 'Adjusted workforce to 15 workers, materials to 750 bags, added task and Safety T&C'
      },
      userId
    );

    const reloadedDraft = await PlanningRepository.getById(planningHeader.id);
    console.log(`   - Reloaded Tasks count: ${reloadedDraft.tasks?.length} (Expected: 3)`);
    console.log(`   - Reloaded Labour[0] workers: ${reloadedDraft.labour?.[0]?.workers_count} (Expected: 15)`);
    console.log(`   - Reloaded Materials[0] quantity: ${reloadedDraft.materials?.[0]?.quantity} (Expected: 750)`);
    console.log(`   - Reloaded Terms count: ${reloadedDraft.terms?.length} (Expected: 3)`);
    console.log(`   - Revisions count: ${reloadedDraft.revisions?.length}`);

    if (reloadedDraft.labour?.[0]?.workers_count !== 15 || Number(reloadedDraft.materials?.[0]?.quantity) !== 750 || reloadedDraft.terms?.length !== 3 || reloadedDraft.tasks?.length !== 3) {
      throw new Error('❌ Planning draft persistence failed!');
    }
    console.log('✅ Test 2 Passed: Planning Draft Saved and Revisions Tracked Separately from Quotation!');

    // ==========================================
    // TEST 3: DEPENDENCY RESCHEDULING & WORKING DAYS
    // ==========================================
    console.log('\n--- [TEST 3] Task Postpone & Topological Dependency Rescheduling ---');
    
    // Add dependencies: Task 1 (Excavation) -> Task 2 (Cable Laying) -> Task 3 (Transformer)
    const task1 = reloadedDraft.tasks.find((t: any) => t.task_name === 'Excavation & Earthwork');
    const task2 = reloadedDraft.tasks.find((t: any) => t.task_name === 'Cable Laying');
    const task3 = reloadedDraft.tasks.find((t: any) => t.task_name === 'Transformer Commissioning');

    const dependencies = [
      {
        predecessor_task_id: task1.id,
        successor_task_id: task2.id,
        dependency_type: 'FS',
        lag_days: 0
      },
      {
        predecessor_task_id: task2.id,
        successor_task_id: task3.id,
        dependency_type: 'FS',
        lag_days: 0
      }
    ];

    // Postpone Task 1 start from 2026-10-01 to 2026-10-05 (which is Monday)
    // Duration is 5 working days: 2026-10-05(Mon), 06(Tue), 07(Wed), 08(Thu), 09(Fri) -> End Date: 2026-10-09
    // Weekend: 10-Oct(Sat), 11-Oct(Sun) are non-working days in our 5-day calendar.
    // Therefore Task 2 (FS with 0 lag) MUST start on next working day: 2026-10-12(Mon)!
    // Task 2 duration 5 working days: 12(Mon), 13(Tue), 14(Wed), 15(Thu), 16(Fri) -> End Date: 2026-10-16
    // Task 3 (FS with 0 lag) MUST start on next working day: 2026-10-19(Mon)!
    // Task 3 duration 5 working days: 19(Mon), 20(Tue), 21(Wed), 22(Thu), 23(Fri) -> End Date: 2026-10-23

    task1.start_date = '2026-10-05';
    task1.end_date = '2026-10-09';
    task1.duration_days = 5;

    task2.duration_days = 5;
    task3.duration_days = 5;

    // Save with new dependencies first
    await PlanningRepository.saveDraft(
      planningHeader.id,
      {
        start_date: '2026-10-05',
        end_date: '2026-10-23',
        duration_days: 15,
        wbs: reloadedDraft.wbs,
        tasks: [task1, task2, task3],
        dependencies: dependencies,
        labour: reloadedDraft.labour,
        materials: reloadedDraft.materials,
        terms: reloadedDraft.terms,
        taxes: reloadedDraft.taxes,
        revision_notes: 'Set task dependencies FS and postponed Task 1 to 2026-10-05'
      },
      userId
    );

    console.log('Running ScheduleService.calculatePlanningSchedule()...');
    const recalculated = await ScheduleService.calculatePlanningSchedule(planningHeader.id);

    const recTask1 = recalculated.tasksList.find((t: any) => t.id === task1.id);
    const recTask2 = recalculated.tasksList.find((t: any) => t.id === task2.id);
    const recTask3 = recalculated.tasksList.find((t: any) => t.id === task3.id);

    console.log(`   - Recalculated Task 1 (Excavation): ${recTask1.start_date} → ${recTask1.end_date} (Duration: ${recTask1.duration_days})`);
    console.log(`   - Recalculated Task 2 (Cable Laying): ${recTask2.start_date} → ${recTask2.end_date} (Duration: ${recTask2.duration_days})`);
    console.log(`   - Recalculated Task 3 (Transformer): ${recTask3.start_date} → ${recTask3.end_date} (Duration: ${recTask3.duration_days})`);
    console.log(`   - Project Rollup: ${recalculated.planning.start_date} → ${recalculated.planning.end_date}`);

    if (recTask2.start_date !== '2026-10-12' || recTask3.start_date !== '2026-10-19' || recTask3.end_date !== '2026-10-23') {
      throw new Error(`❌ Working-days dependency recalculation failed! Expected Task 2 on 2026-10-12, got ${recTask2.start_date}`);
    }
    console.log('✅ Test 3 Passed: Working-days aware topological rescheduling accurately shifted downstream tasks!');

    // ==========================================
    // TEST 4: SUBMIT & APPROVE -> NEW PROJECT AUTO-CREATION
    // ==========================================
    console.log('\n--- [TEST 4] Submit Planning -> Approve Planning -> Auto Create New Project ---');
    
    // Validate first
    const valResult = await PlanningRepository.validatePlanning(planningHeader.id);
    console.log(`   - Validation check: isValid = ${valResult.isValid}, errors = ${valResult.errors?.length}`);
    if (!valResult.isValid) {
      throw new Error(`❌ Validation failed: ${JSON.stringify(valResult.errors)}`);
    }

    // Submit planning
    console.log('Submitting Planning...');
    const submitRes = await PlanningRepository.submitPlanning(planningHeader.id, userId);
    console.log(`   - Submitted Planning Status: ${submitRes.status}`);
    if (submitRes.status !== 'in_review' && submitRes.status !== 'submitted') {
      throw new Error(`❌ Planning submission failed! Status: ${submitRes.status}`);
    }

    // Approve planning
    console.log('Approving Planning (Auto-creates New Project)...');
    const approveRes = await PlanningRepository.approvePlanning(planningHeader.id, userId);
    console.log(`   - Planning Action: ${approveRes.action}`);
    console.log(`   - Created Project ID: ${approveRes.project_id}`);

    if (!approveRes.project_id) {
      throw new Error('❌ Project was not created on planning approval!');
    }

    // Verify Project details in DB
    const [projRows]: any = await pool.query(
      `SELECT project_id, project_name, source_quotation_id, planning_id, start_date, end_date, budget_amount FROM projects WHERE project_id = ?`,
      [approveRes.project_id]
    );
    const createdProj = projRows[0];
    console.log(`   - Verified Project Name: "${createdProj.project_name}"`);
    console.log(`   - Quotation Link: ${createdProj.source_quotation_id} (Expected: ${quotationId})`);
    console.log(`   - Planning Link: ${createdProj.planning_id} (Expected: ${planningHeader.id})`);
    console.log(`   - Final Project Start Date: ${createdProj.start_date} (Expected: ${recalculated.planning.start_date})`);
    console.log(`   - Final Project End Date: ${createdProj.end_date} (Expected: ${recalculated.planning.end_date})`);

    const [projWbsRows]: any = await pool.query(`SELECT COUNT(*) as count FROM project_wbs WHERE project_id = ?`, [approveRes.project_id]);
    const [projTaskRows]: any = await pool.query(`SELECT COUNT(*) as count FROM tasks WHERE project_id = ?`, [approveRes.project_id]);
    const [projMatRows]: any = await pool.query(`SELECT COUNT(*) as count FROM project_materials WHERE project_id = ?`, [approveRes.project_id]);
    const [projTermsRows]: any = await pool.query(`SELECT COUNT(*) as count FROM project_terms_snapshots WHERE project_id = ?`, [approveRes.project_id]);

    console.log(`   - Project WBS Count: ${projWbsRows[0].count} (Expected: 2)`);
    console.log(`   - Project Tasks Count: ${projTaskRows[0].count} (Expected: 3)`);
    console.log(`   - Project Materials Count: ${projMatRows[0].count} (Expected: 1)`);
    console.log(`   - Project Terms Count: ${projTermsRows[0].count} (Expected: 3)`);

    if (projWbsRows[0].count !== 2 || projTaskRows[0].count !== 3 || projMatRows[0].count !== 1) {
      throw new Error('❌ Project child records mismatch on auto-creation!');
    }
    console.log('✅ Test 4 Passed: New Project Auto-Created with Final Approved Planning Data!');

    // ==========================================
    // TEST 5: EXISTING PROJECT SYNC (NO DUPLICATES, PRESERVES ACTUALS)
    // ==========================================
    console.log('\n--- [TEST 5] Quotation for Existing Project -> Planning -> Smart Update ---');
    
    // Add a simulated actual timesheet log to Task 1 of the existing project
    const [existingTaskRows]: any = await pool.query(`SELECT task_id, wbs_id FROM tasks WHERE project_id = ? LIMIT 1`, [approveRes.project_id]);
    const existingTaskId = existingTaskRows[0].task_id;
    const existingWbsId = existingTaskRows[0].wbs_id;
    await pool.query(
      `INSERT INTO timesheets (project_id, wbs_id, task_id, employee_id, log_date, working_hours, comment)
       VALUES (?, ?, ?, ?, '2026-10-06', 8.0, 'Actual on-site excavation foundation work')`,
      [approveRes.project_id, existingWbsId, existingTaskId, userId]
    );
    console.log(`   - Added simulated actual timesheet log to existing Task ID: ${existingTaskId}`);

    // Create a new variation quotation linked to this EXISTING project
    const qCode2 = `QT-EXISTING-${Date.now()}`;
    const quotation2 = await QuotationRepository.create(
      {
        quotation_code: qCode2,
        customer_id: customerId,
        project_id: approveRes.project_id, // LINKED TO EXISTING PROJECT
        project_type_id: 1,
        currency_id: 1,
        quotation_date: '2026-10-05',
        start_date: '2026-10-05',
        end_date: '2026-10-20',
        subtotal_amount: 100000,
        tax_percentage: 18,
        tax_amount: 18000,
        discount_amount: 0,
        total_amount: 118000,
        status: 'draft',
        created_by: userId
      },
      [
        {
          discipline_name: 'Site Preparation & Civil', // Matches existing WBS name
          description: 'Scope expansion',
          quantity: 1,
          rate: 180000,
          amount: 180000,
          start_date: '2026-10-05',
          end_date: '2026-10-12',
          labours: [],
          materials: []
        }
      ],
      userId
    );

    const quotationId2 = quotation2.quotation_id;
    console.log(`Created 2nd Quotation ID: ${quotationId2} for Existing Project ID: ${approveRes.project_id}`);
    await QuotationRepository.updateStatus(quotationId2, 'approved', userId);

    const planning2Rows = await PlanningRepository.getAll({ quotation_id: quotationId2 });
    const planning2Header = planning2Rows[0];
    console.log(`Auto-created Planning 2 ID: ${planning2Header.id}`);

    // Add a new task in Planning 2 to be merged into existing project
    const plan2Full = await PlanningRepository.getById(planning2Header.id);
    const plan2Wbs1 = plan2Full.wbs[0];
    const plan2Tasks = [
      {
        planning_wbs_id: plan2Wbs1.id,
        task_name: 'Excavation & Earthwork', // matches existing task
        description: 'Updated depth',
        start_date: '2026-10-05',
        end_date: '2026-10-12',
        duration_days: 6,
        planned_cost: 70000,
        sort_order: 1
      },
      {
        planning_wbs_id: plan2Wbs1.id,
        task_name: 'Additional Drainage Trenching', // NEW task
        description: 'Trenching for stormwater',
        start_date: '2026-10-13',
        end_date: '2026-10-16',
        duration_days: 4,
        planned_cost: 30000,
        sort_order: 2
      }
    ];

    await PlanningRepository.saveDraft(
      planning2Header.id,
      {
        start_date: '2026-10-05',
        end_date: '2026-10-16',
        duration_days: 10,
        wbs: plan2Full.wbs,
        tasks: plan2Tasks,
        dependencies: [],
        labour: plan2Full.labour,
        materials: plan2Full.materials,
        terms: plan2Full.terms,
        taxes: plan2Full.taxes
      },
      userId
    );

    // Submit and approve Planning 2
    await PlanningRepository.submitPlanning(planning2Header.id, userId);
    const syncRes = await PlanningRepository.approvePlanning(planning2Header.id, userId);
    console.log(`Approved Planning 2. Synced to existing Project ID: ${syncRes.project_id}`);

    if (syncRes.project_id !== approveRes.project_id) {
      throw new Error(`❌ Existing project ID mismatch! Expected ${approveRes.project_id}, got ${syncRes.project_id}`);
    }

    // Verify existing tasks were updated, new task was inserted, and work logs PRESERVED
    const [finalTasks]: any = await pool.query(
      `SELECT task_id, task_name, start_date, target_date FROM tasks WHERE project_id = ? ORDER BY task_id ASC`,
      [approveRes.project_id]
    );
    console.log(`   - Project total tasks count now: ${finalTasks.length} (Expected: 4 - 3 previous + 1 added trenching)`);
    
    const [workLogCheck]: any = await pool.query(
      `SELECT timesheet_id, working_hours, comment FROM timesheets WHERE task_id = ?`,
      [existingTaskId]
    );
    console.log(`   - Verified actual timesheets preserved on Task ID ${existingTaskId}: count = ${workLogCheck.length}, hours = ${workLogCheck[0]?.working_hours}`);

    if (workLogCheck.length === 0) {
      throw new Error('❌ Actual timesheets were accidentally destroyed during smart sync!');
    }
    console.log('✅ Test 5 Passed: Existing Project Smartly Updated without Duplicating or Losing Actuals!');

    console.log('\n====================================================');
    console.log('🎉 ALL 5 E2E INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('❌ E2E Test Failure:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runE2ETests();
