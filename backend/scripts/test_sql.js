const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gaptm'
  });

  try {
    let sql = `
      SELECT 
        p.project_id,
        p.project_name,
        p.project_code,
        c.customer_name,
        COALESCE((SELECT SUM(total_amount) FROM quotations WHERE project_id = p.project_id AND status='approved'), 0) AS contract_value,
        COALESCE((SELECT SUM(total_amount) FROM invoices WHERE project_id = p.project_id), 0) AS invoice_value,
        COALESCE((SELECT SUM(total_amount) FROM invoices WHERE project_id = p.project_id AND status IN ('paid', 'partially_paid')), 0) AS collected_value,
        COALESCE((SELECT SUM(budget_amount) FROM tasks WHERE project_id = p.project_id), 0) AS planned_cost,
        COALESCE((SELECT SUM(amount) FROM labour_work_logs WHERE project_id = p.project_id AND (is_deleted = 0 OR is_deleted IS NULL)), 0) AS actual_labour_cost,
        COALESCE((SELECT SUM(actual_cost) FROM material_logs WHERE project_id = p.project_id), 0) AS actual_material_cost
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      WHERE (p.is_deleted = 0 OR p.is_deleted IS NULL)
    `;
    const [rows] = await connection.execute(sql);
    console.log("Success", rows.length);
  } catch (error) {
    console.error('SQL Error:', error.message);
  } finally {
    await connection.end();
  }
}

main();
