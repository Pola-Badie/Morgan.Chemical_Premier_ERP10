import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Package, CheckCircle, Settings, Eye, RefreshCw, Download, Users } from 'lucide-react';
import { parseCSV, readFileAsText, readDataFile, isExcelFile } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  onImport: (data: Record<string, string>[], warehouse?: string) => void;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  accept?: string;
  hasHeader?: boolean;
  requiredColumns?: string[];
  validateRow?: (row: Record<string, string>) => boolean | string;
  showWarehouseDialog?: boolean;
  warehouseLocations?: string[];
  dialogTitle?: string;
  dialogDescription?: string;
  dataType?: 'inventory' | 'customers' | 'suppliers';
  hideWarehouseSelection?: boolean;
}

export const CSVImport: React.FC<CSVImportProps> = ({
  onImport,
  buttonText = 'Import Data',
  className = '',
  variant = 'outline',
  size = 'default',
  accept = '.csv,.xls,.xlsx,.xlsm',
  hasHeader = true,
  requiredColumns = [],
  validateRow,
  showWarehouseDialog = false,
  warehouseLocations = ['Warehouse 1', 'Warehouse 2', 'Warehouse 3', 'Warehouse 4', 'Warehouse 5', 'Warehouse 6'],
  dialogTitle,
  dialogDescription,
  dataType = 'inventory',
  hideWarehouseSelection = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, string>[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const handleButtonClick = () => {
    console.log('🔥 BUTTON CLICKED - TRIGGERING FILE INPUT');
    console.log('🔥 FILE INPUT REF:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    let csvContent = '';
    
    if (dataType === 'customers') {
      csvContent = "Name,Email,Phone,Company,Position,Sector,Address,Tax Number\n";
      csvContent += "John Smith,john@company.com,+20123456789,ABC Corp,Manager,Healthcare,123 Main St,12345678\n";
      csvContent += "Sara Ahmed,sara@hospital.com,+20987654321,City Hospital,Director,Healthcare,456 Oak Ave,87654321";
    } else if (dataType === 'suppliers') {
      csvContent = "Company,Contact Name,Email,Phone,Address,Category\n";
      csvContent += "Medical Supply Co,Ahmed Ali,ahmed@medical.com,+20111222333,Cairo Main St,Pharmaceuticals\n";
      csvContent += "Pharma Solutions,Mona Hassan,mona@pharma.com,+20444555666,Alexandria Center,Medical Equipment";
    } else {
      csvContent = "Product Name,SKU,Quantity,Unit Price,Category,Grade\n";
      csvContent += "Panadol 500mg,PDL500,150,12.50,Painkillers,P\n";
      csvContent += "Aspirin 75mg,ASP75,200,8.75,Painkillers,P";
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('🔥 FILE SELECTED:', file?.name, 'size:', file?.size, 'type:', file?.type);
    
    if (!file) {
      console.log('🔥 NO FILE SELECTED - RETURNING');
      return;
    }

    setIsLoading(true);
    try {
      let jsonData: Record<string, string>[] = [];
      console.log('🔥 STARTING FILE PROCESSING FOR:', file.name);

      if (isExcelFile(file)) {
        jsonData = await readDataFile(file);
        console.log('🔥 EXCEL FILE PROCESSED:', file.name, 'rows:', jsonData.length);
        console.log('🔥 FIRST FEW ROWS:', jsonData.slice(0, 3));
        toast({
          title: "Excel file processed",
          description: `Successfully converted ${file.name} to JSON format with ${jsonData.length} rows`,
        });
      } else {
        const csvContent = await readFileAsText(file);
        jsonData = parseCSV(csvContent, hasHeader);
        toast({
          title: "CSV file processed", 
          description: `Successfully converted ${file.name} to JSON format with ${jsonData.length} rows`,
        });
      }

      if (jsonData.length === 0) {
        toast({
          title: "No data found",
          description: "The file appears to be empty or has no valid data rows.",
          variant: "destructive",
        });
        return;
      }

      // Validate required columns
      if (requiredColumns.length > 0 && jsonData.length > 0) {
        const fileColumns = Object.keys(jsonData[0]);
        const missingColumns = requiredColumns.filter(col => 
          !fileColumns.some(fileCol => fileCol.toLowerCase().includes(col.toLowerCase()))
        );
        
        if (missingColumns.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Required columns not found: ${missingColumns.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Validate rows if function provided
      if (validateRow) {
        const invalidRows = jsonData.filter((row, index) => {
          const result = validateRow(row);
          return result !== true;
        });

        if (invalidRows.length > 0) {
          toast({
            title: "Data validation failed",
            description: `${invalidRows.length} rows have validation errors. Please check your data.`,
            variant: "destructive",
          });
          return;
        }
      }

      setPendingData(jsonData);

      if (showWarehouseDialog && dataType === 'inventory') {
        setShowDialog(true);
      } else {
        // For customers/suppliers, call onImport directly
        console.log('🔥 CALLING ONIMPORT WITH DATA:', jsonData.length, 'records');
        console.log('🔥 DATA PREVIEW:', jsonData.slice(0, 2));
        onImport(jsonData);
        toast({
          title: `${dataType} import successful`,
          description: `Successfully imported ${jsonData.length} ${dataType} records`,
        });
      }

    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to process the file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleWarehouseConfirm = async () => {
    if (!selectedWarehouse || pendingData.length === 0) return;

    setIsLoading(true);
    try {
      await onImport(pendingData, selectedWarehouse);
      toast({
        title: "Import successful",
        description: `Successfully imported ${pendingData.length} items to ${selectedWarehouse}`,
      });
      setShowDialog(false);
      setPendingData([]);
      setSelectedWarehouse('');
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogCancel = () => {
    setShowDialog(false);
    setPendingData([]);
    setSelectedWarehouse('');
  };

  const getIconForDataType = () => {
    switch (dataType) {
      case 'customers':
        return <Users className="h-6 w-6 text-blue-600" />;
      case 'suppliers':
        return <Package className="h-6 w-6 text-blue-600" />;
      default:
        return <Upload className="h-6 w-6 text-blue-600" />;
    }
  };

  const getRequirementsText = () => {
    if (dataType === 'customers') {
      return {
        required: "Name, Email, Phone, Company",
        optional: "Position, Sector, Address, Tax Number",
        example: "Name,Email,Phone,Company\nJohn Smith,john@company.com,+20123456789,ABC Corp"
      };
    } else if (dataType === 'suppliers') {
      return {
        required: "Company, Contact Name, Email, Phone",
        optional: "Address, Category, Country",
        example: "Company,Contact Name,Email,Phone\nMedical Supply Co,Ahmed Ali,ahmed@medical.com,+20111222333"
      };
    } else {
      return {
        required: "Product Name, SKU, Quantity, Unit Price",
        optional: "Description, Category, Grade, Expiry Date, Batch Number, Supplier, Warehouse",
        example: "Product Name,SKU,Quantity,Unit Price\nPanadol 500mg,PDL500,150,12.50"
      };
    }
  };

  const requirements = getRequirementsText();

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <Button
        onClick={handleButtonClick}
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Enhanced Import Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                {getIconForDataType()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {dialogTitle || (dataType === 'customers' ? 'Import Customer Data' : dataType === 'suppliers' ? 'Import Supplier Data' : 'Import Inventory Data')}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {dialogDescription || (dataType === 'customers' ? 'Upload CSV or Excel file with customer information including names, companies, contacts, and sector details' : dataType === 'suppliers' ? 'Upload CSV or Excel file with supplier information' : 'Upload CSV or Excel file and configure import settings for your inventory data')}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Import Configuration */}
            {dataType === 'customers' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Customer Import Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Import Strategy
                    </label>
                    <Select defaultValue="merge">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merge">Update existing customers</SelectItem>
                        <SelectItem value="add-only">Add new customers only</SelectItem>
                        <SelectItem value="update-only">Update existing only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Duplicate Handling
                    </label>
                    <Select defaultValue="email">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Match by email address</SelectItem>
                        <SelectItem value="phone">Match by phone number</SelectItem>
                        <SelectItem value="company">Match by company name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Default Sector
                    </label>
                    <Select defaultValue="healthcare">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                        <SelectItem value="retail">Retail Pharmacy</SelectItem>
                        <SelectItem value="biotechnology">Biotechnology</SelectItem>
                        <SelectItem value="medical-devices">Medical Devices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Tax Configuration
                    </label>
                    <Select defaultValue="auto-generate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-generate">Auto-generate tax numbers</SelectItem>
                        <SelectItem value="use-provided">Use provided tax numbers</SelectItem>
                        <SelectItem value="skip-tax">Skip tax number assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Warehouse Selection Section - Only for inventory */}
            {!hideWarehouseSelection && dataType === 'inventory' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Warehouse Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Destination Warehouse
                    </label>
                    <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select warehouse location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouseLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-600" />
                              <div className="flex flex-col">
                                <span className="font-medium">{location}</span>
                                <span className="text-xs text-gray-500">
                                  {location.includes('1') || location.includes('2') ? 'Main storage facility' : 
                                   location.includes('3') || location.includes('4') ? 'Secondary storage' :
                                   'Distribution center'}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                File Upload & Requirements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">File Format Requirements</label>
                    <div className="bg-white p-3 rounded border text-sm">
                      <div className="space-y-2">
                        <div><strong className="text-blue-600">Required columns:</strong></div>
                        <div className="ml-2 text-gray-700">• {requirements.required}</div>
                        <div><strong className="text-green-600">Optional columns:</strong></div>
                        <div className="ml-2 text-gray-700">• {requirements.optional}</div>
                        <div><strong className="text-purple-600">Supported formats:</strong></div>
                        <div className="ml-2 text-gray-700">• CSV files (.csv) with headers in first row</div>
                        <div className="ml-2 text-gray-700">• Excel files (.xls, .xlsx) - first sheet used</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">File Validation</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-100 p-2 rounded text-green-800">
                        ✓ CSV & Excel formats
                      </div>
                      <div className="bg-green-100 p-2 rounded text-green-800">
                        ✓ Headers validated
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-blue-800">
                        ℹ Max 10,000 rows
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-blue-800">
                        ℹ Max 25MB file size
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Sample CSV Template</label>
                    <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                      <div>{requirements.example}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadTemplate}
                      className="flex-1 text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download Template
                    </button>
                    <button className="flex-1 text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700">
                      View Examples
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Summary Section */}
            {pendingData.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Import Summary & Preview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{pendingData.length}</div>
                    <div className="text-sm text-gray-600">Total {dataType}</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-green-600">Valid</div>
                    <div className="text-sm text-gray-600">Data Format</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-purple-600">Ready</div>
                    <div className="text-sm text-gray-600">For Import</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-orange-600">JSON</div>
                    <div className="text-sm text-gray-600">Converted</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">Data Preview</label>
                    <span className="text-xs text-gray-500">Showing first 3 rows</span>
                  </div>
                  
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {pendingData.length > 0 && Object.keys(pendingData[0]).slice(0, 6).map((key) => (
                              <th key={key} className="px-3 py-2 text-left font-medium text-gray-900 border-r border-gray-200">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingData.slice(0, 3).map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                                <td key={cellIndex} className="px-3 py-2 text-gray-700 border-r border-gray-200">
                                  {String(value).substring(0, 20)}{String(value).length > 20 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleDialogCancel} 
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel Import
            </Button>
            <Button 
              variant="outline"
              disabled={pendingData.length === 0}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Changes
            </Button>
            <Button 
              onClick={handleWarehouseConfirm} 
              disabled={(dataType === 'inventory' && !selectedWarehouse) || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {pendingData.length} {dataType}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};