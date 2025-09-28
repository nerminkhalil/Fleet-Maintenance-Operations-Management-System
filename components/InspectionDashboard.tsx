import React, { useMemo } from 'react';
import { Vehicle, Inspection } from '../types';
import { TruckIcon, CalendarIcon, CheckCircleIcon, WrenchIcon } from './icons';
import { formatTimestamp } from '../utils/time';
import StatCard from './StatCard';

interface InspectionDashboardProps {
    vehicles: Vehicle[];
    inspections: Inspection[];
    onStartInspection: (vehicleId: string) => void;
}

const RECENT_THRESHOLD_DAYS = 7;

const InspectionDashboard: React.FC<InspectionDashboardProps> = ({ vehicles, inspections, onStartInspection }) => {
    const { inspectedRecently, pendingInspection, recentInspectionsList } = useMemo(() => {
        const threshold = Date.now() - RECENT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
        const latestInspectionsMap = new Map<string, Inspection>();

        inspections.forEach(inspection => {
            const existing = latestInspectionsMap.get(inspection.vehicleId);
            if (!existing || inspection.createdAt > existing.createdAt) {
                latestInspectionsMap.set(inspection.vehicleId, inspection);
            }
        });

        const inspected: Vehicle[] = [];
        const pending: { vehicle: Vehicle; lastInspection?: Inspection }[] = [];

        vehicles.forEach(vehicle => {
            const lastInspection = latestInspectionsMap.get(vehicle.id);
            if (lastInspection && lastInspection.createdAt >= threshold) {
                inspected.push(vehicle);
            } else {
                pending.push({ vehicle, lastInspection });
            }
        });
        
        pending.sort((a, b) => {
            const timeA = a.lastInspection?.createdAt ?? 0;
            const timeB = b.lastInspection?.createdAt ?? 0;
            return timeA - timeB; // Oldest/never inspected first
        });

        const recentList = inspections
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

        return {
            inspectedRecently: inspected,
            pendingInspection: pending,
            recentInspectionsList: recentList
        };
    }, [vehicles, inspections]);

    return (
        <div className="content-container p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Vehicle Inspection Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                <StatCard
                    title={`Vehicles Inspected (Last ${RECENT_THRESHOLD_DAYS} Days)`}
                    value={inspectedRecently.length}
                    icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600" />}
                    colorClass="bg-emerald-100 dark:bg-emerald-900/50"
                />
                <StatCard
                    title="Vehicles Pending Inspection"
                    value={pendingInspection.length}
                    icon={<TruckIcon className="w-6 h-6 text-red-600" />}
                    colorClass="bg-red-100 dark:bg-red-900/50"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Pending Inspection ({pendingInspection.length})</h3>
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                        {pendingInspection.length > 0 ? (
                            pendingInspection.map(({ vehicle, lastInspection }) => (
                                <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{vehicle.id}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Last Inspected: {lastInspection ? new Date(lastInspection.createdAt).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onStartInspection(vehicle.id)}
                                        className="btn btn-primary inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md"
                                        title={`Start inspection for ${vehicle.id}`}
                                    >
                                        <WrenchIcon className="w-4 h-4" />
                                        Inspect
                                    </button>
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg h-full">
                                <CheckCircleIcon className="w-10 h-10 text-emerald-500 mb-2" />
                                <p className="font-semibold text-gray-700 dark:text-gray-300">All vehicles are up-to-date!</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">No pending inspections.</p>
                             </div>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentInspectionsList.length > 0 ? (
                            recentInspectionsList.map(inspection => (
                                <div key={inspection.id} className="flex items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full mr-3">
                                        <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{inspection.vehicleId}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{formatTimestamp(inspection.createdAt)}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic truncate">
                                            "{inspection.notes || 'No new damage noted.'}"
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 text-gray-500 dark:text-gray-400">No inspections recorded yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InspectionDashboard;
