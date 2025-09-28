import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Vehicle, Ticket, SparePart, Inspection } from '../types';
import MaintenanceHistory from './MaintenanceHistory';
import DailyLogExporter from './DailyLogExporter';
import TechnicianManager from './TechnicianManager';
import InspectionDashboard from './InspectionDashboard';
import AIDashboard from './AIDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminViewProps {
  ai: GoogleGenAI;
  vehicles: Vehicle[];
  tickets: Ticket[];
  spareParts: SparePart[];
  technicians: string[];
  inspections: Inspection[];
  onStartInspection: (vehicleId: string) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddTechnician: (technician: string) => void;
  onUpdateTechnician: (oldTechnician: string, newTechnician: string) => void;
  onDeleteTechnician: (technician: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  ai, vehicles, tickets, spareParts, technicians, inspections,
  onUpdateVehicle, onAddTechnician, onUpdateTechnician, onDeleteTechnician, onStartInspection
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setEditData({
      currentKilometers: vehicle.currentKilometers,
      lastEngineServiceKm: vehicle.lastEngineServiceKm,
      lastTransmissionServiceKm: vehicle.lastTransmissionServiceKm,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = () => {
    if (editingId) {
      const vehicleToUpdate = vehicles.find(v => v.id === editingId);
      if (vehicleToUpdate) {
        onUpdateVehicle({ ...vehicleToUpdate, ...editData });
      }
      setEditingId(null);
      setEditData({});
    }
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  return (
    <div className="space-y-12">
        <AIDashboard tickets={tickets} ai={ai} />
        <AnalyticsDashboard tickets={tickets} />
        <InspectionDashboard
          vehicles={vehicles}
          inspections={inspections}
          onStartInspection={onStartInspection}
        />
        <DailyLogExporter tickets={tickets} spareParts={spareParts} />
        <TechnicianManager
          technicians={technicians}
          onAddTechnician={onAddTechnician}
          onUpdateTechnician={onUpdateTechnician}
          onDeleteTechnician={onDeleteTechnician}
        />
        <div className="content-container p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Vehicle Fleet Management</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Set the initial kilometer readings for your fleet here. This data is used to automatically generate preventative maintenance tickets.
        </p>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vehicle ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Engine Service KM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Transmission Service KM</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {vehicles.map(vehicle => (
                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{vehicle.id}</td>
                    {editingId === vehicle.id ? (
                        <>
                            <td className="px-6 py-4"><input type="number" name="currentKilometers" value={editData.currentKilometers || 0} onChange={handleEditChange} className="input-style rounded-md w-32"/></td>
                            <td className="px-6 py-4"><input type="number" name="lastEngineServiceKm" value={editData.lastEngineServiceKm || 0} onChange={handleEditChange} className="input-style rounded-md w-40"/></td>
                            <td className="px-6 py-4"><input type="number" name="lastTransmissionServiceKm" value={editData.lastTransmissionServiceKm || 0} onChange={handleEditChange} className="input-style rounded-md w-48"/></td>
                        </>
                    ) : (
                        <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.currentKilometers.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.lastEngineServiceKm.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{vehicle.lastTransmissionServiceKm.toLocaleString()}</td>
                        </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingId === vehicle.id ? (
                            <>
                                <button onClick={handleSave} className="text-green-600 hover:text-green-900 dark:hover:text-green-400 mr-3 font-semibold">Save</button>
                                <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 font-semibold">Cancel</button>
                            </>
                        ) : (
                            <button onClick={() => handleEdit(vehicle)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-semibold">Edit</button>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
        <MaintenanceHistory
            allTickets={tickets}
            vehicles={vehicles}
            spareParts={spareParts}
            technicians={technicians}
            availableFilters={['vehicle', 'technician', 'driver', 'category', 'date']}
        />
    </div>
  );
};

export default React.memo(AdminView);