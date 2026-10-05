export interface ExcelExportColumn {
  label: string;
  key?: string;
  accessor?: (row: any) => string | number | null | undefined;
  type?: 'string' | 'number' | 'currency' | 'date';
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelExportColumn[];
  data: any[];
}

export function exportToExcel({
  filename,
  sheetName = 'Sheet1',
  columns,
  data,
}: ExcelExportOptions) {
  if (!data || data.length === 0) return;

  const validColumns = columns.filter((c) => c.key || c.accessor);
  
  // Format as Excel XML Spreadsheet 2003 which opens seamlessly in Excel & Numbers without third-party dependencies
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#4F46E5"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="₹#,##0.00"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Date">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="yyyy-mm-dd"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName.replace(/[\\/?*\[\]]/g, '')}">
  <Table>`;

  // Define Columns
  validColumns.forEach(() => {
    xml += `\n   <Column ss:AutoFitWidth="1" ss:Width="120"/>`;
  });

  // Header Row
  xml += `\n   <Row ss:Height="24" ss:StyleID="Header">`;
  validColumns.forEach((col) => {
    xml += `\n    <Cell><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`;
  });
  xml += `\n   </Row>`;

  // Data Rows
  data.forEach((row) => {
    xml += `\n   <Row ss:Height="20">`;
    validColumns.forEach((col) => {
      let val: any = '';
      if (col.accessor) {
        val = col.accessor(row);
      } else if (col.key) {
        val = row[col.key];
      }

      if (val === null || val === undefined) {
        xml += `\n    <Cell><Data ss:Type="String"></Data></Cell>`;
      } else if (typeof val === 'number') {
        const style = col.type === 'currency' ? ' ss:StyleID="Currency"' : ' ss:StyleID="Number"';
        xml += `\n    <Cell${style}><Data ss:Type="Number">${val}</Data></Cell>`;
      } else {
        xml += `\n    <Cell><Data ss:Type="String">${escapeXml(String(val))}</Data></Cell>`;
      }
    });
    xml += `\n   </Row>`;
  });

  xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  let finalFilename = filename.replace(/\.(xlsx|xls|csv)$/, '');
  const dateStr = new Date().toISOString().split('T')[0];
  if (!finalFilename.endsWith(dateStr)) {
    finalFilename += `_${dateStr}`;
  }
  finalFilename += '.xls';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
