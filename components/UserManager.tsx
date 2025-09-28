import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UsersIcon, PlusCircleIcon } from './icons';

interface UserManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.Operations);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) {
      setError('User Name and ID are required.');
      return;
    }
    const newUser: User = { id: newId.trim(), name: newName.trim(), role: newRole };
    if (users.some(u => u.id.toLowerCase() === newUser.id.toLowerCase())) {
        setError('A user with this ID already exists.');
        return;
    }
    onAddUser(newUser);
    setNewName('');
    setNewId('');
    setNewRole(UserRole.Operations);
    setError('');
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({ ...user });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = () => {
    if (editingId && editData.name && editData.role) {
      onUpdateUser(editData as User);
      handleCancelEdit();
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
        <UsersIcon className="w-6 h-6" /> User Management
      </h2>
      
      <details className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300">Add New User</summary>
        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">User Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Jane Doe" className="mt-1 block w-full input-style rounded-md"/>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">User ID / Employee ID</label>
            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="e.g., 98765" className="mt-1 block w-full input-style rounded-md"/>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="mt-1 block w-full input-style rounded-md">
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <button type="submit" className="w-full h-10 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <PlusCircleIcon className="w-5 h-5 mr-2"/> Add User
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </details>

      <div className="overflow-x-auto max-h-[32rem]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {editingId === user.id ? (
                    <>
                        <td className="px-6 py-4"><input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} className="input-style rounded-md w-full"/></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.id}</td>
                        <td className="px-6 py-4">
                            <select name="role" value={editData.role || ''} onChange={handleEditChange} className="input-style rounded-md w-full">
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={handleSave} className="text-green-600 hover:text-green-900 dark:hover:text-green-400 mr-3 font-semibold">Save</button>
                            <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 font-semibold">Cancel</button>
                        </td>
                    </>
                ) : (
                    <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3 font-semibold">Edit</button>
                            <button onClick={() => { if(window.confirm('Are you sure you want to delete this user?')) onDeleteUser(user.id) }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-semibold">Delete</button>
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

export default UserManager;
