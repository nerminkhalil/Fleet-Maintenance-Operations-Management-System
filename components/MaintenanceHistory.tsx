
import React, { useState, useMemo } from 'react';
import { Ticket, TicketSection, Vehicle, SparePart, View, HistoryFilterType } from '../types';
import TicketList from './TicketList';
import { FilterIcon, XCircleIcon } from './icons';

interface MaintenanceHistoryProps {
  allTickets: Ticket[];
  vehicles: Vehicle[];
  spareParts: SparePart[];
  technicians: string[];
  availableFilters: HistoryFilterType[];
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ allTickets, vehicles, spareParts, technicians, availableFilters }) => {
  const [filters, setFilters] = useState({
    vehicleId: '',
    technician: '',
    reportedBy: '',
    section: '',
    date: '',
  });
  const [filteredTickets, setFilteredTickets] = useState<Ticket[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    let results = [...allTickets];

    if (filters.vehicleId) {
      results = results.filter(t => t.vehicleId === filters.vehicleId);
    }
    if (filters.technician) {
      results = results.filter(t => t.assignedTo?.includes(filters.technician));
    }
    if (filters.reportedBy) {
        results = results.filter(t => t.reportedBy === filters.reportedBy);
    }
    if (filters.section) {
      results = results.filter(t => t.section === filters.section);
    }
    if (filters.date) {
      const startOfDay = new Date(filters.date + 'T00:00:00');
      const endOfDay = new Date(filters.date + 'T23:59:59.999');

      results = results.filter(t => {
          const ticketDate = new Date(t.createdAt);
          return ticketDate >= startOfDay && ticketDate <= endOfDay;
      });
    }
    
    // Sort results by creation date, newest first
    results.sort((a, b) => b.createdAt - a.createdAt);
    
    setFilteredTickets(results);
    setShowFilters(false);
  };

  const handleClear = () => {
    setFilters({ vehicleId: '', technician: '', reportedBy: '', section: '', date: '' });
    setFilteredTickets(null);
  };

  const allTechnicians = useMemo(() => technicians, [technicians]);
  const allDrivers = useMemo(() => {
    const driverSet = new Set(allTickets.map(t => t.reportedBy).filter(Boolean));
    return Array.from(driverSet).sort();
  }, [allTickets]);

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Search Maintenance History</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <FilterIcon />
          <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableFilters.includes('vehicle') && (
              <div>
                <label htmlFor="vehicleIdFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle ID</label>
                <select id="vehicleIdFilter" name="vehicleId" value={filters.vehicleId} onChange={handleFilterChange} className="input-style rounded-md mt-1 block w-full">
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                </select>
              </div>
            )}
            {availableFilters.includes('driver') && (
              <div>
                <label htmlFor="driverFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Driver Name</label>
                <select id="driverFilter" name="reportedBy" value={filters.reportedBy} onChange={handleFilterChange} className="input-style rounded-md mt-1 block w-full">
                    <option value="">All Drivers</option>
                    {allDrivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                </select>
              </div>
            )}
            {availableFilters.includes('technician') && (
              <div>
                <label htmlFor="technicianFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technician</label>
                <select id="technicianFilter" name="technician" value={filters.technician} onChange={handleFilterChange} className="input-style rounded-md mt-1 block w-full">
                  <option value="">All Technicians</option>
                  {allTechnicians.map(tech => <option key={tech} value={tech}>{tech}</option>)}
                </select>
              </div>
            )}
            {availableFilters.includes('category') && (
              <div>
                <label htmlFor="sectionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select id="sectionFilter" name="section" value={filters.section} onChange={handleFilterChange} className="input-style rounded-md mt-1 block w-full">
                  <option value="">All Categories</option>
                  {Object.values(TicketSection).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {availableFilters.includes('date') && (
              <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" id="dateFilter" name="date" value={filters.date} onChange={handleFilterChange} className="input-style rounded-md mt-1 block w-full"/>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-300 text-gray-800 hover:bg-gray-400">
                <XCircleIcon />
                Clear
            </button>
            <button onClick={handleSearch} className="btn btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg">
                <FilterIcon />
                Search
            </button>
          </div>
        </div>
      )}

      {filteredTickets !== null && (
        <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Search Results ({filteredTickets.length} found)
            </h3>
            {filteredTickets.length > 0 ? (
                <TicketList 
                    tickets={filteredTickets} 
                    title="" 
                    currentView={View.Maintenance} 
                    spareParts={spareParts}
                    technicians={technicians}
                    isHistoryView={true}
                    onStartWork={() => {}}
                    onCloseTicket={() => {}}
                />
            ) : (
                <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tickets found matching your criteria.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default React.memo(MaintenanceHistory);