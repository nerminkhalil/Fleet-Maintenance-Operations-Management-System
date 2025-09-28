import React from 'react';
import { Vehicle, Ticket, User } from '../types';
import UserManager from './UserManager';
import HistoricalDataImporter from './HistoricalDataImporter';

interface SuperAdminViewProps {
  vehicles: Vehicle[];
  tickets: Ticket[];
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddHistoricalTicket: (ticketData: Omit<Ticket, 'id' | 'serial' | 'status' | 'priority' | 'closedAt' | 'confirmedAt'>) => void;
}

const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  vehicles, tickets, users,
  onAddUser, onUpdateUser, onDeleteUser,
  onAddHistoricalTicket
}) => {
  return (
    <div className="space-y-12">
      <HistoricalDataImporter 
        vehicles={vehicles} 
        tickets={tickets} 
        onAddHistoricalTicket={onAddHistoricalTicket} 
      />
      <UserManager
        users={users}
        onAddUser={onAddUser}
        onUpdateUser={onUpdateUser}
        onDeleteUser={onDeleteUser}
      />
    </div>
  );
};

export default React.memo(SuperAdminView);