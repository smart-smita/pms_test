import { dbPool } from '../src/config/db';

async function run() {
  console.log('--- Starting Labour and Document Extensions Migration ---');

  // 1. Add assigned_project_id to labours
  try {
    await dbPool.query(`ALTER TABLE labours ADD COLUMN assigned_project_id INT DEFAULT NULL AFTER contractor_id`);
    console.log('Added assigned_project_id to labours');
  } catch (err: any) {
    console.log('assigned_project_id note:', err.message);
  }

  // 2. Add foreign key for assigned_project_id
  try {
    await dbPool.query(`ALTER TABLE labours ADD CONSTRAINT fk_labour_assigned_project FOREIGN KEY (assigned_project_id) REFERENCES projects(project_id) ON DELETE SET NULL`);
    console.log('Added fk_labour_assigned_project');
  } catch (err: any) {
    console.log('fk note:', err.message);
  }

  // 3. Add department to employees if missing
  try {
    await dbPool.query(`ALTER TABLE employees ADD COLUMN department VARCHAR(100) DEFAULT NULL AFTER role_id`);
    console.log('Added department to employees');
  } catch (err: any) {
    console.log('department note:', err.message);
  }

  // 4. Update entity_documents
  try {
    await dbPool.query(`ALTER TABLE entity_documents ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 1 AFTER status`);
    console.log('Added is_current to entity_documents');
  } catch (err: any) {
    console.log('is_current note:', err.message);
  }

  try {
    await dbPool.query(`ALTER TABLE entity_documents ADD COLUMN replaced_by_id INT DEFAULT NULL AFTER is_current`);
    console.log('Added replaced_by_id to entity_documents');
  } catch (err: any) {
    console.log('replaced_by_id note:', err.message);
  }

  try {
    await dbPool.query(`ALTER TABLE entity_documents ADD COLUMN notes TEXT DEFAULT NULL AFTER replaced_by_id`);
    console.log('Added notes to entity_documents');
  } catch (err: any) {
    console.log('notes note:', err.message);
  }

  // Update status enum of entity_documents to include expiring_soon if not present
  try {
    await dbPool.query(`ALTER TABLE entity_documents MODIFY COLUMN status ENUM('active', 'expiring_soon', 'expired', 'archived') NOT NULL DEFAULT 'active'`);
    console.log('Updated status enum of entity_documents');
  } catch (err: any) {
    console.log('status enum note:', err.message);
  }

  // 5. Expand document_types
  const docTypes = [
    { type_code: 'LABOUR_CONTRACT', type_name: 'Labour Contract', applies_to: 'labour', has_expiry: 1, has_number: 1, has_issue_date: 1 },
    { type_code: 'OTHER_GOV_DOC', type_name: 'Other Government Document', applies_to: 'all', has_expiry: 1, has_number: 1, has_issue_date: 1 },
    { type_code: 'OTHER', type_name: 'Other Document', applies_to: 'all', has_expiry: 0, has_number: 0, has_issue_date: 0 },
  ];

  for (const dt of docTypes) {
    try {
      await dbPool.query(
        `INSERT INTO document_types (type_code, type_name, applies_to, has_expiry, has_number, has_issue_date, is_required, status)
         VALUES (?, ?, ?, ?, ?, ?, 0, 1)
         ON DUPLICATE KEY UPDATE type_name = VALUES(type_name), applies_to = VALUES(applies_to), has_expiry = VALUES(has_expiry)`,
        [dt.type_code, dt.type_name, dt.applies_to, dt.has_expiry, dt.has_number, dt.has_issue_date]
      );
      console.log(`Inserted / Updated doc type: ${dt.type_code}`);
    } catch (err: any) {
      console.log(`Doc type error ${dt.type_code}:`, err.message);
    }
  }

  // 6. Clean empty strings in UNIQUE columns of labours
  try {
    await dbPool.query(`UPDATE labours SET aadhar_id = NULL WHERE aadhar_id = ''`);
    await dbPool.query(`UPDATE labours SET emreads_id = NULL WHERE emreads_id = ''`);
    await dbPool.query(`UPDATE labours SET contact_number = NULL WHERE contact_number = ''`);
    console.log('Cleaned empty strings in labours');
  } catch (err: any) {
    console.log('Clean note:', err.message);
  }

  console.log('--- Migration Finished Successfully ---');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
