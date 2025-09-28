import React, { useState, useCallback } from 'react';
import { SparePart } from '../types';

declare const XLSX: any; // From the CDN script

interface InventoryImporterProps {
  onImport: (parts: SparePart[]) => void;
}

const InventoryImporter: React.FC<InventoryImporterProps> = ({ onImport }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage('');
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (!json || json.length === 0) {
            throw new Error("The Excel sheet appears to be empty or could not be read.");
        }

        const expectedHeaders = [
            'location', 'sap code', 'material description', 'arabic description',
            'dept', 'uom', 'balance on sap'
        ];
        const requiredHeaders = ['sap code', 'material description', 'balance on sap'];

        const actualHeaders = Object.keys(json[0] as any);
        const headerMap: { [key: string]: string } = {};
        const normalizedActualHeaders = actualHeaders.map(h => ({ original: h, normalized: h.toLowerCase().trim() }));

        expectedHeaders.forEach(expected => {
            const found = normalizedActualHeaders.find(actual => actual.normalized === expected);
            if (found) {
                headerMap[expected] = found.original;
            }
        });
        
        const missingHeaders = requiredHeaders.filter(h => !headerMap[h]);
        if (missingHeaders.length > 0) {
            throw new Error(`Invalid Excel format. Missing required columns: ${missingHeaders.join(', ')}`);
        }

        const importedParts: SparePart[] = json
          .map((row: any, index: number) => {
            const sapCode = String(row[headerMap['sap code']] || '').trim();
            if (!sapCode) return null; // Skip rows without a SAP code

            const balanceOnSap = Number(row[headerMap['balance on sap']] || 0);
            if(isNaN(balanceOnSap)){
                 throw new Error(`Invalid number found for 'balance on sap' in row ${index + 2} for SAP code ${sapCode}. Please check the data.`);
            }

            const part: SparePart = {
                location: String(row[headerMap['location']] || ''),
                sapCode,
                materialDescription: String(row[headerMap['material description']] || ''),
                dept: String(row[headerMap['dept']] || ''),
                uom: String(row[headerMap['uom']] || ''),
                balanceOnSap,
            };

            const arabicDescHeader = headerMap['arabic description'];
            // Only add descriptionAr if the column exists and the cell is not empty
            if (arabicDescHeader && row[arabicDescHeader]) {
                part.descriptionAr = String(row[arabicDescHeader]);
            }

            return part;
          })
          .filter((p): p is SparePart => p !== null);
        
        onImport(importedParts);
        setMessage(`Successfully imported ${importedParts.length} spare parts.`);

      } catch (err: any) {
        setError(`Failed to process file: ${err.message}`);
        console.error(err);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsLoading(false);
        event.target.value = '';
    }
    reader.readAsArrayBuffer(file);
  }, [onImport]);

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Import Inventory from Excel</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select an Excel file (.xlsx, .xls) to replace the current inventory. The file must contain the following columns: 
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">Location</code>,
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">SAP code</code>,
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">material description</code>,
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">arabic description</code> (optional),
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">dept</code>,
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">uom</code>,
        <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded mx-1">balance on sap</code>.
         Column order and capitalization do not matter.
      </p>
      
      <div className="flex items-center space-x-4">
        <label htmlFor="inventory-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          {isLoading ? 'Processing...' : 'Choose File'}
          <input 
            id="inventory-upload" 
            name="inventory-upload" 
            type="file" 
            className="sr-only" 
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>
        {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
};

export default InventoryImporter;