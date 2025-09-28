

import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Ticket, TicketStatus, View, SparePart, Vehicle, TicketPriority, Inspection } from '../types';
import TicketList from './TicketList';
import MaintenanceHistory from './MaintenanceHistory';
import StatCard from './StatCard';
import { WrenchIcon, ArchiveBoxIcon, CubeIcon, ClipboardListIcon } from './icons';


interface MaintenanceViewProps {
  ai: GoogleGenAI;
  tickets: Ticket[];
  spareParts: SparePart[];
  vehicles: Vehicle[];
  technicians: string[];
  inventoryLastUpdated: number;
  inspections: Inspection[];
  onStartWork: (id: string) => void;
  onCloseTicket: (id: string, workDoneNotes: string) => void;
  onAssignTechnicians: (id: string, technicians: string[]) => void;
  onRequestParts: (id: string, parts: Record<string, number>) => void;
  onNoPartsRequired: (id: string) => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ ai, tickets, spareParts, vehicles, technicians, inventoryLastUpdated, inspections, onStartWork, onCloseTicket, onAssignTechnicians, onRequestParts, onNoPartsRequired }) => {
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [activeFilter, setActiveFilter] = useState<TicketStatus | null>(null);
  
  const { activeTickets, closedTickets, stats } = useMemo(() => {
    let active: Ticket[] = [];
    const closed: Ticket[] = [];
    const statusCounts: Record<string, number> = {
        [TicketStatus.InProgress]: 0,
        [TicketStatus.AwaitingParts]: 0,
        [TicketStatus.AwaitingWarehouse]: 0,
        [TicketStatus.Open]: 0,
    };

    for (const ticket of tickets) {
      if (ticket.status === TicketStatus.Closed) {
        closed.push(ticket);
      } else {
        active.push(ticket);
        if (ticket.status in statusCounts) {
          statusCounts[ticket.status]++;
        }
      }
    }
    
    if (activeFilter) {
      if(activeFilter === TicketStatus.AwaitingParts || activeFilter === TicketStatus.AwaitingWarehouse) {
        // Special case for combined "Awaiting" statuses if needed in future, but for now they are separate
        active = active.filter(ticket => ticket.status === activeFilter);
      } else {
        active = active.filter(ticket => ticket.status === activeFilter);
      }
    }

    const statusOrder: Record<string, number> = {
      [TicketStatus.InProgress]: 1,
      [TicketStatus.AwaitingParts]: 2,
      [TicketStatus.AwaitingWarehouse]: 3,
      [TicketStatus.PendingConfirmation]: 4,
      [TicketStatus.Open]: 5,
    };

    const priorityOrder: Record<TicketPriority, number> = {
      [TicketPriority.High]: 1,
      [TicketPriority.Medium]: 2,
      [TicketPriority.Low]: 3,
    };

    active.sort((a, b) => {
      const orderA = statusOrder[a.status];
      const orderB = statusOrder[b.status];
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      if (sortBy === 'priority') {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
      }
      
      return b.createdAt - a.createdAt; 
    });

    return { activeTickets: active, closedTickets: closed, stats: statusCounts };
  }, [tickets, sortBy, activeFilter]);
  
  const handleFilterClick = (status: TicketStatus) => {
    setActiveFilter(prev => prev === status ? null : status);
  }

  return (
    <div className="space-y-12">
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="In Progress" 
                value={stats[TicketStatus.InProgress]} 
                icon={<WrenchIcon className="w-6 h-6 text-yellow-600" />}
                colorClass="bg-yellow-100 dark:bg-yellow-900/50"
                onClick={() => handleFilterClick(TicketStatus.InProgress)}
                isActive={activeFilter === TicketStatus.InProgress}
            />
            <StatCard 
                title="Awaiting Parts" 
                value={stats[TicketStatus.AwaitingParts]} 
                icon={<ArchiveBoxIcon className="w-6 h-6 text-yellow-600" />}
                colorClass="bg-yellow-100 dark:bg-yellow-900/50"
                onClick={() => handleFilterClick(TicketStatus.AwaitingParts)}
                isActive={activeFilter === TicketStatus.AwaitingParts}
            />
            <StatCard 
                title="Awaiting Warehouse" 
                value={stats[TicketStatus.AwaitingWarehouse]}
                icon={<CubeIcon className="w-6 h-6 text-yellow-600" />}
                colorClass="bg-yellow-100 dark:bg-yellow-900/50"
                onClick={() => handleFilterClick(TicketStatus.AwaitingWarehouse)}
                isActive={activeFilter === TicketStatus.AwaitingWarehouse}
            />
            <StatCard 
                title="New & Unassigned" 
                value={stats[TicketStatus.Open]}
                icon={<ClipboardListIcon className="w-6 h-6 text-red-600" />}
                colorClass="bg-red-100 dark:bg-red-900/50"
                onClick={() => handleFilterClick(TicketStatus.Open)}
                isActive={activeFilter === TicketStatus.Open}
            />
        </div>

      <MaintenanceHistory
        allTickets={tickets}
        vehicles={vehicles}
        spareParts={spareParts}
        technicians={technicians}
        availableFilters={['vehicle', 'technician', 'category', 'date']}
      />

      <div>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {activeFilter ? `Open Tickets: ${activeFilter}` : 'All Open Tickets'}
              </h2>
              <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
                  <button 
                      onClick={() => setSortBy('date')}
                      className={`px-3 py-1 text-sm rounded-md ${sortBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                      Date
                  </button>
                  <button 
                      onClick={() => setSortBy('priority')}
                      className={`px-3 py-1 text-sm rounded-md ${sortBy === 'priority' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                      Priority
                  </button>
              </div>
          </div>
          <TicketList
            tickets={activeTickets}
            title=""
            currentView={View.Maintenance}
            spareParts={spareParts}
            technicians={technicians}
            inventoryLastUpdated={inventoryLastUpdated}
            inspections={inspections}
            onStartWork={onStartWork}
            onCloseTicket={onCloseTicket}
            onAssignTechnicians={onAssignTechnicians}
            onRequestParts={onRequestParts}
            onNoPartsRequired={onNoPartsRequired}
            ai={ai}
            allTickets={tickets}
          />
      </div>
      
      <TicketList
        tickets={closedTickets}
        title="Closed Tickets"
        currentView={View.Maintenance}
        spareParts={spareParts}
        technicians={technicians}
        isHistoryView={true}
        onStartWork={() => {}} // No-op for closed tickets
        onCloseTicket={() => {}} // No-op for closed tickets
      />
    </div>
  );
};

export default React.memo(MaintenanceView);