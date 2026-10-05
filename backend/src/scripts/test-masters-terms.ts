import { MasterService, generateMasterShortCode } from '../services/master.service';
import { TermsTemplateService } from '../services/termsTemplate.service';

async function testMastersAndTerms() {
  console.log('--- Testing Short Code Generation ---');
  console.log('Residential Villa ->', generateMasterShortCode('Residential Villa'));
  console.log('Civil Engineering Works ->', generateMasterShortCode('Civil Engineering Works'));
  console.log('United Arab Emirates Dirham ->', generateMasterShortCode('United Arab Emirates Dirham'));
  console.log('Value Added Tax ->', generateMasterShortCode('Value Added Tax'));

  console.log('\n--- Testing Duplicate Terms Template Prevention ---');
  try {
    const list = await TermsTemplateService.getAll();
    if (list.length > 0) {
      const first = list[0];
      console.log(`Attempting to create duplicate template with existing name: "${first.template_name}"`);
      try {
        await TermsTemplateService.create({
          template_name: first.template_name,
          description: 'Duplicate test',
          status: 1,
          items: []
        });
        console.error('FAIL: Duplicate template was allowed!');
      } catch (err: any) {
        console.log('PASS: Correctly rejected duplicate template:', err.message);
      }
    } else {
      console.log('Creating initial template...');
      await TermsTemplateService.create({
        template_name: 'Standard Construction Terms',
        description: 'Test template',
        status: 1,
        items: []
      });
      console.log('Attempting to create duplicate...');
      try {
        await TermsTemplateService.create({
          template_name: 'Standard Construction Terms',
          description: 'Duplicate',
          status: 1,
          items: []
        });
        console.error('FAIL: Duplicate template was allowed!');
      } catch (err: any) {
        console.log('PASS: Correctly rejected duplicate template:', err.message);
      }
    }
  } catch (err: any) {
    console.error('Error in terms templates check:', err.message);
  }

  process.exit(0);
}

testMastersAndTerms();
