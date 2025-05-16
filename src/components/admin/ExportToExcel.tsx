
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportToExcelProps {
  data: any[];
  filename?: string;
  sheetName?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

const ExportToExcel = ({
  data,
  filename = 'export',
  sheetName = 'Sheet1',
  buttonVariant = 'outline'
}: ExportToExcelProps) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async () => {
    if (!data || data.length === 0) {
      console.error('No data to export');
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Convert to Blob
      const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(dataBlob, `${filename}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Button 
      variant={buttonVariant} 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting || !data || data.length === 0}
      className="flex items-center gap-1"
    >
      <Download className="h-4 w-4 mr-1" />
      {isExporting ? 'Exporting...' : 'Export to Excel'}
    </Button>
  );
};

export default ExportToExcel;
