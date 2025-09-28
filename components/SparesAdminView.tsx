


import React, { useMemo } from 'react';
import { Ticket, TicketStatus, View, SparePart } from '../types';
import TicketList from './TicketList';
import StatCard from './StatCard';
import { ArchiveBoxIcon } from './icons';

interface SparesAdminViewProps {
  tickets: Ticket[];
  spareParts: SparePart[];
  technicians: string[];
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

const SparesAdminView: React.FC<SparesAdminViewProps> = ({ tickets, spareParts, technicians, onApproveRequest, onRejectRequest }) => {
  const pendingApprovalTickets = useMemo(() => {
    return tickets.filter(
      (ticket) => ticket.status === TicketStatus.AwaitingParts && ticket.partRequest?.status === 'pending'
    );
  }, [tickets]);

  return (
    <div className="space-y-12">
       <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard 
              title="Requests Pending Approval" 
              value={pendingApprovalTickets.length} 
              icon={<ArchiveBoxIcon className="w-6 h-6 text-yellow-600" />}
              colorClass="bg-yellow-100 dark:bg-yellow-900/50"
          />
      </div>
      <TicketList
        tickets={pendingApprovalTickets}
        title="Pending Spare Parts Approval"
        currentView={View.SparesAdmin}
        spareParts={spareParts}
        technicians={technicians}
        onStartWork={() => {}} // No-op
        onCloseTicket={(id, notes) => {}} // No-op
        onApproveRequest={onApproveRequest}
        onRejectRequest={onRejectRequest}
      />
    </div>
  );
};

export default React.memo(SparesAdminView);