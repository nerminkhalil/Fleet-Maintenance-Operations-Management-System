import React, { useMemo, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Ticket, View, TicketSection, SparePart, Vehicle, TicketStatus, TicketPriority, User } from '../types';
import NewTicketForm from './NewTicketForm';
import TicketList from './TicketList';
import MaintenanceHistory from './MaintenanceHistory';

interface OperationsViewProps {
  tickets: Ticket[];
  spareParts: SparePart[];
  vehicles: Vehicle[];
  technicians: string[];
  currentUser: User;
  ai: GoogleGenAI;
  createTicket: (vehicleId: string, issue: string, reportedBy: string, section: TicketSection, kilometers: number, priority: TicketPriority, location?: string) => void;
  onConfirmTicket: (id: string) => void;
}

const OperationsView: React.FC<OperationsViewProps> = ({ tickets, spareParts, vehicles, technicians, currentUser, ai, createTicket, onConfirmTicket }) => {
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  
  const { openTickets, closedTickets } = useMemo(() => {
    const open: Ticket[] = [];
    const closed: Ticket[] = [];
    for (const ticket of tickets) {
      if (ticket.status === TicketStatus.Closed) {
        closed.push(ticket);
      } else {
        open.push(ticket);
      }
    }

    const priorityOrder: Record<TicketPriority, number> = {
      [TicketPriority.High]: 1,
      [TicketPriority.Medium]: 2,
      [TicketPriority.Low]: 3,
    };

    open.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
        }
        return b.createdAt - a.createdAt; // Default/secondary sort
    });

    return { openTickets: open, closedTickets: closed };
  }, [tickets, sortBy]);

  return (
    <div className="space-y-12">
      <MaintenanceHistory
        allTickets={tickets}
        vehicles={vehicles}
        spareParts={spareParts}
        technicians={technicians}
        availableFilters={['vehicle', 'driver', 'category', 'date']}
      />
      <NewTicketForm vehicles={vehicles} createTicket={createTicket} currentUser={currentUser} ai={ai} />
      
      <div className="space-y-12">
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Open Tickets</h2>
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
              tickets={openTickets} 
              title="" 
              currentView={View.Operations}
              spareParts={spareParts}
              technicians={technicians}
              onStartWork={() => {}} // No-op for this view
              onCloseTicket={(id, notes) => {}} // No-op for this view
              onConfirmTicket={onConfirmTicket}
            />
        </div>
        <TicketList 
          tickets={closedTickets} 
          title="Closed Tickets" 
          currentView={View.Operations}
          spareParts={spareParts}
          technicians={technicians}
          isHistoryView={true}
          onStartWork={() => {}} // No-op for this view
          onCloseTicket={(id, notes) => {}} // No-op for this view
        />
      </div>
    </div>
  );
};

export default React.memo(OperationsView);