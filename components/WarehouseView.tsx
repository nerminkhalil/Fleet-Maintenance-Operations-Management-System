

import React, { useMemo } from 'react';
import { Ticket, View, SparePart } from '../types';
import TicketList from './TicketList';
import SparePartManager from './SparePartManager';
import InventoryImporter from './InventoryImporter';
import ReplenishmentReport from './ReplenishmentReport';
import StatCard from './StatCard';
import { CubeIcon, CheckCircleIcon } from './icons';

interface WarehouseViewProps {
  tickets: Ticket[];
  spareParts: SparePart[];
  technicians: string[];
  inventoryLastUpdated: number;
  onIssueParts: (id: string) => void;
  onRejectPartsByWarehouse: (id: string) => void;
  onCompleteHandover: (id: string) => void;
  onAddSparePart: (part: SparePart) => void;
  onUpdatePart: (part: SparePart) => void;
  onImportInventory: (parts: SparePart[]) => void;
}

const WarehouseView: React.FC<WarehouseViewProps> = ({ 
    tickets, spareParts, inventoryLastUpdated, onIssueParts, onRejectPartsByWarehouse, onCompleteHandover, 
    onAddSparePart, onUpdatePart, onImportInventory, technicians
}) => {
  const { warehouseQueueTickets, stats } = useMemo(() => {
    const queue = tickets.filter(
      (ticket) => ticket.partRequest && (ticket.partRequest.status === 'admin_approved' || ticket.partRequest.status === 'issued')
    );
    
    const calculatedStats = {
        toIssue: queue.filter(t => t.partRequest?.status === 'admin_approved').length,
        toHandover: queue.filter(t => t.partRequest?.status === 'issued').length,
    };
    
    return { warehouseQueueTickets: queue, stats: calculatedStats };
  }, [tickets]);

  return (
    <div className="space-y-12">
      <ReplenishmentReport tickets={tickets} spareParts={spareParts} />
      
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
            title="Part Requests to be Issued" 
            value={stats.toIssue} 
            icon={<CubeIcon className="w-6 h-6 text-yellow-600" />}
            colorClass="bg-yellow-100 dark:bg-yellow-900/50"
        />
        <StatCard 
            title="Handovers to Complete" 
            value={stats.toHandover} 
            icon={<CheckCircleIcon className="w-6 h-6 text-yellow-600" />}
            colorClass="bg-yellow-100 dark:bg-yellow-900/50"
        />
      </div>

      <InventoryImporter onImport={onImportInventory} />
      <SparePartManager 
        spareParts={spareParts}
        onAddPart={onAddSparePart}
        onUpdatePart={onUpdatePart}
        inventoryLastUpdated={inventoryLastUpdated}
      />
      <TicketList
        tickets={warehouseQueueTickets}
        title="Warehouse Queue"
        currentView={View.Warehouse}
        spareParts={spareParts}
        technicians={technicians}
        onStartWork={() => {}} // No-op
        onCloseTicket={(id, notes) => {}} // No-op
        onIssueParts={onIssueParts}
        onRejectPartsByWarehouse={onRejectPartsByWarehouse}
        onCompleteHandover={onCompleteHandover}
      />
    </div>
  );
};

export default React.memo(WarehouseView);