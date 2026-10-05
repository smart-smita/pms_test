import { dbPool, testDbConnection } from '../config/db';
import { WbsTemplateRepository } from '../repositories/wbsTemplate.repository';

async function runTest() {
  console.log('--- Starting Multi-Project-Type WBS Template Verification ---');
  await testDbConnection();

  const repo = new WbsTemplateRepository();

  // 1. Get existing project types
  const [ptRows]: any = await dbPool.execute(`SELECT type_id, type_name FROM project_types LIMIT 4`);
  if (ptRows.length < 2) {
    console.log('Creating sample project types for test...');
    await dbPool.execute(`INSERT IGNORE INTO project_types (type_code, type_name) VALUES ('APT', 'Apartment'), ('VIL', 'Villa'), ('OFF', 'Office'), ('COM', 'Community')`);
  }
  const [projectTypes]: any = await dbPool.execute(`SELECT type_id, type_name FROM project_types LIMIT 4`);
  console.log('Using Project Types:', projectTypes.map((p: any) => `${p.type_name} (ID: ${p.type_id})`));

  const aptId = projectTypes[0].type_id;
  const vilId = projectTypes[1]?.type_id || aptId;
  const offId = projectTypes[2]?.type_id || aptId;

  // 2. Create WBS Template
  const code = await repo.generateCode();
  const templateId = await repo.create({
    template_code: code,
    template_name: 'Building Construction (E2E Test)',
    description: 'Comprehensive multi-project-type template structure',
    status: 1,
  });
  console.log(`✅ Created Template ID: ${templateId}, Code: ${code}`);

  // 3. Associate Multiple Project Types
  await repo.setTemplateProjectTypes(templateId, [aptId, vilId, offId]);
  console.log(`✅ Associated Project Types [${aptId}, ${vilId}, ${offId}] to Template`);

  // 4. Add WBS Hierarchy under Apartment
  // Apartment -> Civil Works
  const cwId = await repo.createDetail({
    template_id: templateId,
    project_type_id: aptId,
    wbs_name: 'Civil Works',
    wbs_code: 'APT-CW',
    sort_order: 0,
  });

  // Apartment -> Electrical Works
  const ewId = await repo.createDetail({
    template_id: templateId,
    project_type_id: aptId,
    wbs_name: 'Electrical Works',
    wbs_code: 'APT-EW',
    sort_order: 1,
  });

  // Apartment -> Plumbing Works
  const pwId = await repo.createDetail({
    template_id: templateId,
    project_type_id: aptId,
    wbs_name: 'Plumbing Works',
    wbs_code: 'APT-PW',
    sort_order: 2,
  });

  // Apartment -> Plumbing Works -> Pipe Installation (Child)
  const piId = await repo.createDetail({
    template_id: templateId,
    project_type_id: aptId,
    parent_id: pwId,
    wbs_name: 'Pipe Installation',
    wbs_code: 'APT-PW-PI',
    sort_order: 0,
  });

  // Apartment -> Plumbing Works -> Drainage (Child)
  const drId = await repo.createDetail({
    template_id: templateId,
    project_type_id: aptId,
    parent_id: pwId,
    wbs_name: 'Drainage',
    wbs_code: 'APT-PW-DR',
    sort_order: 1,
  });

  // 5. Add WBS Hierarchy under Villa
  // Villa -> Civil Works
  await repo.createDetail({
    template_id: templateId,
    project_type_id: vilId,
    wbs_name: 'Civil Works',
    wbs_code: 'VIL-CW',
    sort_order: 0,
  });
  // Villa -> Electrical Works
  await repo.createDetail({
    template_id: templateId,
    project_type_id: vilId,
    wbs_name: 'Electrical Works',
    wbs_code: 'VIL-EW',
    sort_order: 1,
  });
  // Villa -> Plumbing Works
  await repo.createDetail({
    template_id: templateId,
    project_type_id: vilId,
    wbs_name: 'Plumbing Works',
    wbs_code: 'VIL-PW',
    sort_order: 2,
  });

  console.log('✅ Added WBS hierarchies for Apartment and Villa');

  // 6. Test findById
  const fetched = await repo.findById(templateId);
  console.log(`✅ findById Result:`, {
    name: fetched?.template_name,
    project_types_count: fetched?.project_types?.length,
    details_count: fetched?.details?.length,
  });

  // 7. Test findDetails for specific project type (Apartment)
  const aptDetails = await repo.findDetails(templateId, aptId);
  console.log(`✅ findDetails for Apartment returned ${aptDetails.length} items (expected 5 items)`);
  if (aptDetails.length !== 5) {
    throw new Error(`Expected 5 details for Apartment, got ${aptDetails.length}`);
  }

  // 8. Test findDetails for Villa
  const vilDetails = await repo.findDetails(templateId, vilId);
  console.log(`✅ findDetails for Villa returned ${vilDetails.length} items (expected 3 items)`);
  if (vilDetails.length !== 3) {
    throw new Error(`Expected 3 details for Villa, got ${vilDetails.length}`);
  }

  // 9. Test Duplicate
  const dupId = await repo.duplicate(templateId);
  const dupFetched = await repo.findById(dupId);
  console.log(`✅ Duplicated Template ID: ${dupId}, Details Count: ${dupFetched?.details?.length}`);
  if (dupFetched?.details?.length !== fetched?.details?.length) {
    throw new Error('Duplicate detail counts do not match!');
  }

  // 10. Clean up duplicate
  await repo.softDelete(dupId);
  console.log(`✅ Cleaned up duplicate template`);

  console.log('🎉 ALL MULTI-PROJECT-TYPE WBS TEMPLATE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
