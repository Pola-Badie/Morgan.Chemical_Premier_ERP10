/**
 * Utility functions for CSV import and export
 */
import * as XLSX from 'xlsx';

/**
 * Converts data array to CSV string
 * @param data Array of objects to convert to CSV
 * @param headers Optional array of header values
 * @returns CSV string
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string => {
  if (!data || data.length === 0) {
    return '';
  }
  
  // If headers are not provided, use the keys of the first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create the header row
  const headerRow = csvHeaders.join(',');
  
  // Create the data rows
  const rows = data.map(item => {
    return csvHeaders.map(header => {
      // Convert value to string and handle special characters
      const cell = item[header] !== undefined && item[header] !== null
        ? String(item[header])
        : '';
      
      // Escape quotes and wrap in quotes if contains commas or quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Downloads a CSV file
 * @param csvContent CSV string content
 * @param filename Name of the file to download
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parses a CSV string into an array of objects
 * @param csvText CSV string to parse
 * @param hasHeader Whether the CSV has a header row
 * @returns Array of objects
 */
export const parseCSV = (
  csvText: string,
  hasHeader: boolean = true
): Record<string, string>[] => {
  if (!csvText) {
    return [];
  }
  
  // Split the CSV text into rows
  const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Parse CSV row, handling quoted fields
  const parseRow = (row: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = i < row.length - 1 ? row[i + 1] : '';
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quotes inside quotes - add a single quote
          field += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        fields.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    
    // Add the last field
    fields.push(field);
    return fields;
  };
  
  // Get headers and data
  const headers = hasHeader ? parseRow(rows[0]) : [];
  const startIndex = hasHeader ? 1 : 0;
  
  // Process data rows
  return rows.slice(startIndex).map(row => {
    const fields = parseRow(row);
    const obj: Record<string, string> = {};
    
    if (hasHeader) {
      // Map fields to headers
      headers.forEach((header, index) => {
        obj[header] = index < fields.length ? fields[index] : '';
      });
    } else {
      // Use numeric indices as keys
      fields.forEach((field, index) => {
        obj[`field${index}`] = field;
      });
    }
    
    return obj;
  });
};

/**
 * Reads a file as text
 * @param file File to read
 * @returns Promise that resolves with the file contents
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

/**
 * Reads an Excel file and converts it to JSON
 * @param file Excel file to read
 * @param sheetIndex Optional sheet index (defaults to first sheet)
 * @returns Promise that resolves with array of objects
 */
export const readExcelFile = (file: File, sheetIndex: number = 0): Promise<Record<string, string>[]> => {
  console.log('🔥 READ EXCEL FILE CALLED FOR:', file.name, 'size:', file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('🔥 EXCEL FILE READER ONLOAD TRIGGERED');
      try {
        if (!event.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }

        // Parse the Excel file with date handling enabled
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true, // Enable proper date parsing
          dateNF: 'yyyy-mm-dd'
        });
        
        // Get the first sheet or specified sheet
        const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No sheets found in Excel file'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON with header row and proper date formatting
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false // Ensures dates are formatted as strings
        }) as any[][];
        
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }
        
        // Get headers from first row
        const headers = jsonData[0] as string[];
        
        // Convert remaining rows to objects with proper date handling
        const result = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== '')) // Filter out empty rows
          .map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
              let value = row[index] !== undefined ? row[index] : '';
              
              // Handle Excel date fields specifically
              if (header && (
                header.toLowerCase().includes('date') || 
                header.toLowerCase().includes('expiry') ||
                header.toLowerCase().includes('expire')
              )) {
                // If it's still a number (Excel serial date), convert it
                if (typeof value === 'number' && value > 0) {
                  // Excel serial date to JavaScript Date
                  // Excel epoch starts at 1900-01-01, but has a leap year bug (day 60)
                  const excelEpoch = new Date(1900, 0, 1);
                  const jsDate = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
                  value = jsDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                } else if (value instanceof Date) {
                  // Already a Date object, format it
                  value = value.toISOString().split('T')[0];
                }
              }
              
              // Convert all values to strings and handle warehouse locations like "1A"
              obj[String(header)] = String(value);
            });
            return obj;
          });
        
        console.log('🔥 EXCEL PROCESSING COMPLETE:', result.length, 'rows extracted');
        console.log('🔥 FIRST FEW EXCEL ROWS:', result.slice(0, 3));
        resolve(result);
      } catch (error) {
        console.log('🔥 EXCEL PROCESSING ERROR:', error);
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Checks if a file is an Excel file
 * @param file File to check
 * @returns Boolean indicating if file is Excel format
 */
export const isExcelFile = (file: File): boolean => {
  const excelMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12'
  ];
  
  const excelExtensions = ['.xls', '.xlsx', '.xlsm'];
  
  return excelMimeTypes.includes(file.type) || 
         excelExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

/**
 * Reads a file (CSV or Excel) and converts it to JSON
 * @param file File to read
 * @param hasHeader Whether the file has a header row (for CSV)
 * @returns Promise that resolves with array of objects
 */
export const readDataFile = async (file: File, hasHeader: boolean = true): Promise<Record<string, string>[]> => {
  if (isExcelFile(file)) {
    return readExcelFile(file);
  } else {
    const csvText = await readFileAsText(file);
    return parseCSV(csvText, hasHeader);
  }
};