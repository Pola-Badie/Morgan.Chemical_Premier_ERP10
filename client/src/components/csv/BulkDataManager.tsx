
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  RefreshCw
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export default function BulkDataManager() {
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>('products');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', activeTab);

      const response = await fetch('/api/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Import failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.progress) {
                  setImportProgress(data.progress);
                }
                if (data.result) {
                  setImportResult(data.result);
                }
              } catch (e) {
                // Ignore invalid JSON lines
              }
            }
          }
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${importResult?.imported || 0} records`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/bulk-export?type=${activeTab}&format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `${activeTab} data exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`/api/bulk-template?type=${activeTab}`);
      if (!response.ok) throw new Error('Template download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Template download failed",
        description: "Could not download template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bulk Data Management</h1>
          <p className="text-muted-foreground">Import and export data in bulk</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import {activeTab}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Step 1: Download Template</Label>
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Step 2: Upload CSV File</Label>
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    {selectedFile ? (
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Drop CSV file here or click to browse</p>
                        <p className="text-sm text-muted-foreground">
                          {isDragActive ? 'Drop the file here' : 'Supports CSV files up to 10MB'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Import Progress</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}

                {importResult && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Import completed: {importResult.imported} records imported, {importResult.failed} failed
                      {importResult.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              • {error}
                            </div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              ... and {importResult.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importing...' : `Import ${activeTab}`}
                </Button>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export {activeTab}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </Button>
                    <Button
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export as Excel
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Export includes all {activeTab} data with current filters applied.
                    Large datasets may take a few moments to process.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Quick Actions</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                      className="w-full"
                    >
                      {isExporting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? 'Exporting...' : `Export All ${activeTab}`}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Import Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">File Requirements:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• CSV format only</li>
                    <li>• Maximum file size: 10MB</li>
                    <li>• UTF-8 encoding</li>
                    <li>• First row must contain headers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Validation:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Required fields must be filled</li>
                    <li>• Duplicate entries will be skipped</li>
                    <li>• Invalid data will be reported</li>
                    <li>• Existing records will be updated</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
