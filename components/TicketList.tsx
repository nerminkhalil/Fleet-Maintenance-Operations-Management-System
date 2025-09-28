

import React from 'react';
import type { GoogleGenAI } from "@google/genai";
import { Ticket, View, SparePart, Inspection } from '../types';
import TicketCard from './TicketCard';

interface TicketListProps {
  tickets: Ticket[];
  title: string;
  currentView: View;
  spareParts: SparePart[];
  technicians: string[];
  inventoryLastUpdated?: number;
  isHistoryView?: boolean;
  ai?: GoogleGenAI;
  allTickets?: Ticket[];
  inspections?: Inspection[];
  onStartWork: (id: string) => void;
  onCloseTicket: (id: string, workDoneNotes: string) => void;
  onConfirmTicket?: (id: string) => void;
  onAssignTechnicians?: (id: string, technicians: string[]) => void;
  onRequestParts?: (id: string, parts: Record<string, number>) => void;
  onNoPartsRequired?: (id: string) => void;
  onApproveRequest?: (id: string) => void;
  onRejectRequest?: (id: string) => void;
  onIssueParts?: (id: string) => void;
  onRejectPartsByWarehouse?: (id: string) => void;
  onCompleteHandover?: (id: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ 
    tickets, title, currentView, spareParts, technicians, inventoryLastUpdated, isHistoryView = false, ai, allTickets, inspections,
    onStartWork, onCloseTicket, onConfirmTicket, onAssignTechnicians, onRequestParts, onNoPartsRequired, 
    onApproveRequest, onRejectRequest, onIssueParts, onRejectPartsByWarehouse, onCompleteHandover
}) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No tickets to display.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            currentView={currentView}
            spareParts={spareParts}
            technicians={technicians}
            inventoryLastUpdated={inventoryLastUpdated}
            isHistoryView={isHistoryView}
            ai={ai}
            allTickets={allTickets}
            inspections={inspections}
            onStartWork={onStartWork}
            onCloseTicket={onCloseTicket}
            onConfirmTicket={onConfirmTicket}
            onAssignTechnicians={onAssignTechnicians}
            onRequestParts={onRequestParts}
            onNoPartsRequired={onNoPartsRequired}
            onApproveRequest={onApproveRequest}
            onRejectRequest={onRejectRequest}
            onIssueParts={onIssueParts}
            onRejectPartsByWarehouse={onRejectPartsByWarehouse}
            onCompleteHandover={onCompleteHandover}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TicketList);