
import React, { useState, useEffect, useMemo } from 'react';
import { SparePart } from '../types';
import { PlusCircleIcon } from './icons';
import { formatTimestamp } from '../utils/time';

interface SparePartManagerProps {
  spareParts: SparePart[];
  inventoryLastUpdated: number;
  onAddPart: (part: SparePart) => void;
  onUpdatePart: (part: SparePart) => void;
}

const SparePartManager: React.FC<SparePartManagerProps> = ({ spareParts, inventoryLastUpdated, onAddPart, onUpdatePart }) => {
  const initialNewPartState: SparePart = {
    location: '',
    sapCode: '',
    materialDescription: '',
    descriptionAr: '',
    dept: '',
    uom: '',
    balanceOnSap: 0,
  };
  const [newPart, setNewPart] = useState<SparePart>(initialNewPartState);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SparePart>>({});
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPart(prev => ({ ...prev, [name]: name === 'balanceOnSap' ? parseInt(value, 10) || 0 : value }));
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.sapCode || !newPart.materialDescription) {
        setError('SAP Code and Material Description are required.');
        return;
    }
    if(spareParts.some(p => p.sapCode.toLowerCase() === newPart.sapCode.toLowerCase())) {
        setError('An item with this SAP Code already exists.');
        return;
    }
    onAddPart(newPart);
    setNewPart(initialNewPartState);
    setError('');
  };

  const handleEdit = (part: SparePart) => {
    setEditingCode(part.sapCode);
    setEditData({ ...part });
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: name === 'balanceOnSap' ? parseInt(value, 10) || 0 : value }));
  };

  const handleSave = (sapCode: string) => {
    if(editData.materialDescription && editData.balanceOnSap !== undefined) {
      onUpdatePart(editData as SparePart);
      setEditingCode(null);
    }
  };
  
  const sortedSpareParts = useMemo(() => {
    return [...spareParts].sort((a, b) => a.sapCode.localeCompare(b.sapCode));
  }, [spareParts]);

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Spare Parts Inventory</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
            Last Updated: {formatTimestamp(inventoryLastUpdated)}
        </span>
      </div>
      
      {/* Add New Part Form */}
      <details className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">Add New Part Manually</summary>
        <form onSubmit={handleAddPart} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">SAP Code</label><input type="text" name="sapCode" value={newPart.sapCode} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Material Description</label><input type="text" name="materialDescription" value={newPart.materialDescription} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">Arabic Description</label><input type="text" name="descriptionAr" value={newPart.descriptionAr} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md" dir="rtl"/></div>
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">Location</label><input type="text" name="location" value={newPart.location} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">Dept</label><input type="text" name="dept" value={newPart.dept} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">UOM</label><input type="text" name="uom" value={newPart.uom} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>
            <div className="md:col-span-1"><label className="block text-sm font-medium mb-1">Balance on SAP</label><input type="number" name="balanceOnSap" value={newPart.balanceOnSap} onChange={handleInputChange} className="mt-1 block w-full input-style rounded-md"/></div>

            <div className="md:col-span-4 flex justify-end">
                <button type="submit" className="h-10 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <PlusCircleIcon className="w-5 h-5 mr-2"/> Add Part
                </button>
            </div>
            {error && <p className="text-red-500 text-sm col-span-full">{error}</p>}
        </form>
      </details>

      {/* Inventory Table */}
      <div className="overflow-x-auto max-h-[32rem]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Location</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">SAP Code</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Material Description</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Dept</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">UOM</th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Balance on SAP</th>
              <th className="px-3 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedSpareParts.map(part => (
              <tr key={part.sapCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingCode === part.sapCode ? (
                  <>
                    <td className="px-3 py-2"><input type="text" name="location" value={editData.location || ''} onChange={handleEditChange} className="input-style rounded-md w-24"/></td>
                    <td className="px-3 py-2 text-sm font-medium">{part.sapCode}</td>
                    <td className="px-3 py-2">
                        <input type="text" name="materialDescription" value={editData.materialDescription || ''} onChange={handleEditChange} className="input-style rounded-md w-full mb-1"/>
                        <input type="text" name="descriptionAr" value={editData.descriptionAr || ''} onChange={handleEditChange} className="input-style rounded-md w-full" dir="rtl"/>
                    </td>
                    <td className="px-3 py-2"><input type="text" name="dept" value={editData.dept || ''} onChange={handleEditChange} className="input-style rounded-md w-24"/></td>
                    <td className="px-3 py-2"><input type="text" name="uom" value={editData.uom || ''} onChange={handleEditChange} className="input-style rounded-md w-16"/></td>
                    <td className="px-3 py-2"><input type="number" name="balanceOnSap" value={editData.balanceOnSap || 0} onChange={handleEditChange} className="input-style rounded-md w-20"/></td>
                    <td className="px-3 py-2 text-right text-sm">
                      <button onClick={() => handleSave(part.sapCode)} className="text-green-600 hover:text-green-900 mr-3 font-semibold">Save</button>
                      <button onClick={() => setEditingCode(null)} className="text-gray-600 hover:text-gray-900 font-semibold">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{part.location}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">{part.sapCode}</td>
                    <td className="px-3 py-2 text-sm">
                        <div className="text-gray-800 dark:text-gray-200">{part.materialDescription}</div>
                        {part.descriptionAr && <div className="text-xs text-gray-500 dark:text-gray-400 italic" dir="rtl">{part.descriptionAr}</div>}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{part.dept}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{part.uom}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{part.balanceOnSap}</td>
                    <td className="px-3 py-2 text-right text-sm">
                      <button onClick={() => handleEdit(part)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(SparePartManager);
