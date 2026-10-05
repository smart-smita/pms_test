-- 09_quotation_wbs_details.sql
-- Create detailed labour and material tables for quotation WBS items (quotation_disciplines)

CREATE TABLE IF NOT EXISTS quotation_wbs_labour (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  quotation_discipline_id INT NOT NULL, -- references quotation_disciplines.id
  labour_id INT NULL,
  labour_name VARCHAR(255) NOT NULL,
  labour_type VARCHAR(100) NULL,
  hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
  FOREIGN KEY (quotation_discipline_id) REFERENCES quotation_disciplines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quotation_wbs_material (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  quotation_discipline_id INT NOT NULL, -- references quotation_disciplines.id
  material_id INT NULL,
  material_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(30) NULL,
  rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (quotation_id) REFERENCES quotations(quotation_id) ON DELETE CASCADE,
  FOREIGN KEY (quotation_discipline_id) REFERENCES quotation_disciplines(id) ON DELETE CASCADE
);
