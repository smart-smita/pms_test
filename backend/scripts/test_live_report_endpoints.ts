import { generateAccessToken } from '../src/config/jwt';
import http from 'http';

function makeRequest(path: string, token: string): Promise<{ status: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function verifyLiveEndpoints() {
  console.log('--- VERIFYING LIVE HTTP REPORT ENDPOINTS (PORT 5000) ---');

  // Generate Admin Token
  const token = generateAccessToken({
    employee_id: 1,
    role_id: 1,
    role_name: 'Admin',
    name: 'Super Admin',
  } as any);

  const reportTypes = [
    'purchased-vs-ordered',
    'qc-inspection',
    'stock-on-hand',
    'project-usage',
    'remaining-requirement',
    'purchase-vs-consumption',
    'stock-movement',
  ];

  for (const rt of reportTypes) {
    const res = await makeRequest(`/api/v1/procurement/reports/${rt}?page=1&limit=5`, token);
    if (res.status !== 200) {
      console.error(`✗ FAILED ${rt} with status ${res.status}:`, res.body);
      process.exit(1);
    }
    const json = JSON.parse(res.body);
    console.log(`✓ HTTP 200: /api/v1/procurement/reports/${rt}`);
    console.log(`  Items: ${json.data.items?.length}, Total: ${json.data.total}`);
    console.log(`  Ledger Totals:`, JSON.stringify(json.data.totals));
  }

  // Verify CSV streaming export
  console.log('\nTesting CSV streaming export endpoint...');
  const csvRes = await makeRequest('/api/v1/procurement/reports/purchased-vs-ordered/export?format=csv', token);
  if (csvRes.status !== 200 || !csvRes.headers['content-type']?.includes('text/csv')) {
    console.error('✗ CSV export failed:', csvRes.status, csvRes.headers);
    process.exit(1);
  }
  console.log(`✓ HTTP 200: CSV Export OK (Content-Type: ${csvRes.headers['content-type']}, length: ${csvRes.body.length})`);

  // Verify PDF tabular export
  console.log('\nTesting PDF tabular export endpoint...');
  const pdfRes = await makeRequest('/api/v1/procurement/reports/purchased-vs-ordered/export?format=pdf', token);
  if (pdfRes.status !== 200 || !pdfRes.headers['content-type']?.includes('application/pdf')) {
    console.error('✗ PDF export failed:', pdfRes.status, pdfRes.headers);
    process.exit(1);
  }
  console.log(`✓ HTTP 200: PDF Export OK (Content-Type: ${pdfRes.headers['content-type']}, length: ${pdfRes.body.length})`);

  console.log('\n=== ALL PHASE 7 REPORT ENDPOINTS & EXPORTS LIVE & VERIFIED! ===');
  process.exit(0);
}

verifyLiveEndpoints().catch((err) => {
  console.error('Error running live verification:', err);
  process.exit(1);
});
