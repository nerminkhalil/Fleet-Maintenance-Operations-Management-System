import React, { useState } from 'react';
import { UserGroupIcon, PlusCircleIcon } from './icons';

interface TechnicianManagerProps {
  technicians: string[];
  onAddTechnician: (technician: string) => void;
  onUpdateTechnician: (oldTechnician: string, newTechnician: string) => void;
  onDeleteTechnician: (technician: string) => void;
}

const parseTechnician = (techString: string): { name: string, id: string } => {
    const match = techString.match(/(.*) \((\d+)\)/);
    if (match) {
        return { name: match[1].trim(), id: match[2] };
    }
    return { name: techString, id: '' };
};

const TechnicianManager: React.FC<TechnicianManagerProps> = ({ technicians, onAddTechnician, onUpdateTechnician, onDeleteTechnician }) => {
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [editingTech, setEditingTech] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editId, setEditId] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) {
      setError('Both name and ID are required.');
      return;
    }
    const newTechnician = `${newName.trim()} (${newId.trim()})`;
    if (technicians.some(t => t.toLowerCase() === newTechnician.toLowerCase())) {
        setError('This technician already exists.');
        return;
    }
    onAddTechnician(newTechnician);
    setNewName('');
    setNewId('');
    setError('');
  };
  
  const handleEdit = (technician: string) => {
    setEditingTech(technician);
    const { name, id } = parseTechnician(technician);
    setEditName(name);
    setEditId(id);
  };
  
  const handleCancelEdit = () => {
    setEditingTech(null);
    setEditName('');
    setEditId('');
  };

  const handleSave = () => {
    if (!editName.trim() || !editId.trim() || !editingTech) return;
    const updatedTechnician = `${editName.trim()} (${editId.trim()})`;
     if (updatedTechnician !== editingTech && technicians.some(t => t.toLowerCase() === updatedTechnician.toLowerCase())) {
        alert('Another technician with this name and ID already exists.');
        return;
    }
    onUpdateTechnician(editingTech, updatedTechnician);
    handleCancelEdit();
  };

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
        <UserGroupIcon className="w-6 h-6" /> Technician Master Data
      </h2>
      
      <details className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">Add New Technician</summary>
        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Technician Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., John Doe" className="mt-1 block w-full input-style rounded-md"/>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Technician ID</label>
            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="e.g., 123456" className="mt-1 block w-full input-style rounded-md"/>
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full h-10 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <PlusCircleIcon className="w-5 h-5 mr-2"/> Add Technician
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </details>

      <div className="overflow-x-auto max-h-[32rem]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Technician Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {technicians.map(tech => (
              <tr key={tech} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingTech === tech ? (
                    <>
                        <td className="px-6 py-4"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-style rounded-md w-full"/></td>
                        <td className="px-6 py-4"><input type="text" value={editId} onChange={(e) => setEditId(e.target.value)} className="input-style rounded-md w-24"/></td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={handleSave} className="text-green-600 hover:text-green-900 dark:hover:text-green-400 mr-3 font-semibold">Save</button>
                            <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 font-semibold">Cancel</button>
                        </td>
                    </>
                ) : (
                    <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{parseTechnician(tech).name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parseTechnician(tech).id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEdit(tech)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3 font-semibold">Edit</button>
                            <button onClick={() => { if(window.confirm('Are you sure you want to delete this technician?')) onDeleteTechnician(tech) }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-semibold">Delete</button>
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

export default TechnicianManager;
