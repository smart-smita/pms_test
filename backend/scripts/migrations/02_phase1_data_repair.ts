import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export async function up(db: PoolConnection) {
  console.log('--- Starting Data Repair ---');

  // 1. Backfill customer_id on projects from client_name
  const [custUpdate]: any = await db.query(`
    UPDATE projects p
    JOIN customers c ON TRIM(p.client_name) = TRIM(c.customer_name)
    SET p.customer_id = c.customer_id
    WHERE p.customer_id IS NULL AND p.client_name IS NOT NULL AND p.client_name != '';
  `);
  console.log(`✅ Backfilled customer_id for ${custUpdate.affectedRows} projects.`);

  // 2. Normalise WBS references to project_wbs.id
  // In the legacy system, wbs_id sometimes referred to work_breakdown_structures.id (the master)
  // instead of project_wbs.id (the project-specific instance).
  // We identify these by joining on project_id and the master wbs_id.

  const tablesWithWbs = [
    { name: 'tasks', alias: 't', hasProjectId: true },
    { name: 'timesheets', alias: 'ts', hasProjectId: true },
    { name: 'labour_work_logs', alias: 'l', hasProjectId: true },
  ];

  for (const table of tablesWithWbs) {
    try {
      // Only update rows where wbs_id does NOT currently match a valid project_wbs.id
      // but DOES match a master wbs_id used in that project.
      const [updateRes]: any = await db.query(`
        UPDATE ${table.name} ${table.alias}
        JOIN project_wbs pw ON ${table.alias}.project_id = pw.project_id AND ${table.alias}.wbs_id = pw.wbs_id
        SET ${table.alias}.wbs_id = pw.id
        WHERE ${table.alias}.wbs_id NOT IN (
          SELECT id FROM project_wbs WHERE project_id = ${table.alias}.project_id
        );
      `);
      console.log(`✅ Normalised wbs_id in ${table.name}: ${updateRes.affectedRows} rows updated.`);
    } catch (e: any) {
      console.warn(`⚠️ Failed to normalise ${table.name}: ${e.message}`);
    }
  }

  // 3. Clean WBS-TEMP-* duplicates only where unreferenced
  // Step 1: Find WBS-TEMP-% that are not used in project_wbs
  try {
    const [delRes]: any = await db.query(`
      DELETE FROM work_breakdown_structures
      WHERE wbs_code LIKE 'WBS-TEMP-%'
      AND id NOT IN (SELECT wbs_id FROM project_wbs)
      AND id NOT IN (SELECT wbs_id FROM quotations WHERE wbs_id IS NOT NULL);
    `);
    console.log(`✅ Cleaned up ${delRes.affectedRows} orphaned WBS-TEMP records.`);
  } catch (e: any) {
    console.warn(`⚠️ Failed to clean WBS-TEMP codes: ${e.message}`);
  }

  console.log('--- Data Repair Complete ---');
}
