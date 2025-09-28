import React, { useMemo } from 'react';
import { Ticket, TicketStatus } from '../types';
import { formatDuration } from '../utils/time';
import { ChartBarIcon, ClockIcon, WrenchIcon, TruckIcon } from './icons';

interface AnalyticsDashboardProps {
  tickets: Ticket[];
}

const KPIPill: React.FC<{label: string, value: string | number, icon: React.ReactNode}> = ({label, value, icon}) => (
    <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
)

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ tickets }) => {

    const analytics = useMemo(() => {
        const closedTickets = tickets.filter(t => t.status === TicketStatus.Closed && t.startedAt && t.closedAt);
        
        // MTTR Calculation
        const totalRepairDuration = closedTickets.reduce((acc, t) => acc + (t.closedAt! - t.startedAt!), 0);
        const meanTimeToRepair = closedTickets.length > 0 ? totalRepairDuration / closedTickets.length : 0;

        // Top Problem Sections
        const sectionCounts = tickets.reduce((acc, t) => {
            acc[t.section] = (acc[t.section] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topSections = Object.entries(sectionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        // Top Problem Vehicles
        const vehicleCounts = tickets.reduce((acc, t) => {
            acc[t.vehicleId] = (acc[t.vehicleId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topVehicles = Object.entries(vehicleCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return {
            meanTimeToRepair: formatDuration(meanTimeToRepair),
            totalTickets: tickets.length,
            openTickets: tickets.filter(t => t.status !== TicketStatus.Closed).length,
            topSections,
            topVehicles
        };
    }, [tickets]);

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-emerald-500" />
            Fleet Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <KPIPill label="Mean Time To Repair (MTTR)" value={analytics.meanTimeToRepair} icon={<ClockIcon className="w-6 h-6 text-yellow-600"/>} />
            <KPIPill label="Total Tickets" value={analytics.totalTickets} icon={<WrenchIcon className="w-6 h-6 text-blue-600"/>} />
            <KPIPill label="Currently Open Tickets" value={analytics.openTickets} icon={<TruckIcon className="w-6 h-6 text-red-600"/>} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Top Problem Areas</h3>
                <div className="space-y-3">
                    {analytics.topSections.map(([section, count]) => (
                        <div key={section} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{section}</span>
                                <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-md">{count} tickets</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Most Active Vehicles</h3>
                <div className="space-y-3">
                    {analytics.topVehicles.map(([vehicleId, count]) => (
                        <div key={vehicleId} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{vehicleId}</span>
                                <span className="font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-md">{count} tickets</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    </div>
  );
};

export default AnalyticsDashboard;