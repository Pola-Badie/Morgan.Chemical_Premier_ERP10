import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CSVExport, CSVImport } from '@/components/csv';

interface CSVContextProps<T extends Record<string, any>> {
  setCSVData: (data: T[]) => void;
  setCSVOptions: (options: CSVOptions<T>) => void;
  clearCSV: () => void;
}

export interface CSVOptions<T extends Record<string, any>> {
  filename?: string;
  headers?: string[];
  customHeaders?: Record<string, string>;
  onImport?: (data: Record<string, string>[]) => void;
  exportButtonText?: string;
  importButtonText?: string;
  requiredColumns?: string[];
  validateRow?: (row: Record<string, string>) => boolean | string;
  disabled?: boolean;
  showStorageDropdown?: boolean;
  storageLocations?: string[];
  onStorageFilter?: (location: string | null) => T[];
}

export const CSVContext = createContext<CSVContextProps<any> | null>(null);

export function useCSV<T extends Record<string, any>>(): CSVContextProps<T> {
  const context = useContext(CSVContext);
  if (!context) {
    throw new Error('useCSV must be used within a CSVProvider');
  }
  return context as CSVContextProps<T>;
}

interface CSVProviderProps {
  children: ReactNode;
}

export const CSVProvider: React.FC<CSVProviderProps> = ({ children }) => {
  const [csvData, setCSVData] = useState<any[]>([]);
  const [csvOptions, setCSVOptions] = useState<CSVOptions<any>>({});
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Find the container for the CSV buttons
    const csvContainer = document.getElementById('csv-import-export-container');
    if (csvContainer) {
      setContainer(csvContainer);
    }
  }, []);

  const clearCSV = () => {
    setCSVData([]);
    setCSVOptions({});
  };

  // Create the CSV buttons to be rendered in the header
  const csvButtons = (
    <>
      {csvOptions.onImport && container && (
        createPortal(
          <CSVImport
            onImport={csvOptions.onImport}
            buttonText={csvOptions.importButtonText}
            requiredColumns={csvOptions.requiredColumns}
            validateRow={csvOptions.validateRow}
            className="text-xs"
          />,
          container
        )
      )}
      {csvData.length > 0 && container && (
        createPortal(
          <CSVExport
            data={csvData}
            filename={csvOptions.filename}
            headers={csvOptions.headers}
            customHeaders={csvOptions.customHeaders}
            buttonText={csvOptions.exportButtonText}
            className="text-xs"
            disabled={csvOptions.disabled}
            showStorageDropdown={csvOptions.showStorageDropdown}
            storageLocations={csvOptions.storageLocations}
            onStorageFilter={csvOptions.onStorageFilter}
          />,
          container
        )
      )}
    </>
  );

  return (
    <CSVContext.Provider value={{ setCSVData, setCSVOptions, clearCSV }}>
      {children}
      {csvButtons}
    </CSVContext.Provider>
  );
};