import React, { useState, useMemo } from 'react';
import { Vehicle, Ticket, TicketSection } from '../types';
import { PlusCircleIcon } from './icons';

interface HistoricalDataImporterProps {
  vehicles: Vehicle[];
  tickets: Ticket[];
  onAddHistoricalTicket: (ticketData: Omit<Ticket, 'id' | 'serial' | 'status' | 'priority' | 'closedAt' | 'confirmedAt'>) => void;
}

const HistoricalDataImporter: React.FC<HistoricalDataImporterProps> = ({ vehicles, tickets, onAddHistoricalTicket }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [workDoneNotes, setWorkDoneNotes] = useState('');
  const [section, setSection] = useState<TicketSection>(TicketSection.Mechanical);
  const [repairDate, setRepairDate] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [error, setError] = useState('');

  const historicalTicketsForVehicle = useMemo(() => {
    if (!selectedVehicleId) return [];
    return tickets
      .filter(t => t.vehicleId === selectedVehicleId && t.issue.startsWith('HISTORICAL:'))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tickets, selectedVehicleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(kilometers, 10);
    if (!selectedVehicleId || !issue || !workDoneNotes || !section || !repairDate || !kilometers || isNaN(km)) {
      setError('All fields are required.');
      return;
    }

    onAddHistoricalTicket({
      vehicleId: selectedVehicleId,
      issue: `HISTORICAL: ${issue}`,
      workDoneNotes,
      section,
      createdAt: new Date(repairDate).getTime(),
      kilometers: km,
      reportedBy: 'Historical Data',
    });
    
    // Clear form
    setIssue('');
    setWorkDoneNotes('');
    setRepairDate('');
    setKilometers('');
    setError('');
  };

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Historical Maintenance Data Import</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Add past maintenance records for your vehicles here. This data is crucial for training the AI to provide more accurate diagnostics and predictions.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Add New Historical Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="vehicle-select-historical" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle ID</label>
              <select id="vehicle-select-historical" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="input-style w-full">
                <option value="">-- Select a Vehicle --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
              </select>
            </div>
            {selectedVehicleId && (
              <>
                <div>
                    <label htmlFor="repairDate" className="block text-sm font-medium">Date of Repair</label>
                    <input type="date" id="repairDate" value={repairDate} onChange={e => setRepairDate(e.target.value)} className="input-style w-full"/>
                </div>
                <div>
                    <label htmlFor="kilometers-historical" className="block text-sm font-medium">Kilometers at time of repair</label>
                    <input type="number" id="kilometers-historical" value={kilometers} onChange={e => setKilometers(e.target.value)} className="input-style w-full"/>
                </div>
                <div>
                    <label htmlFor="section-historical" className="block text-sm font-medium">Section</label>
                    <select id="section-historical" value={section} onChange={e => setSection(e.target.value as TicketSection)} className="input-style w-full">
                        {Object.values(TicketSection).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                  <label htmlFor="issue-historical" className="block text-sm font-medium">Issue / Reason for Repair</label>
                  <textarea id="issue-historical" value={issue} onChange={e => setIssue(e.target.value)} rows={3} className="input-style w-full"></textarea>
                </div>
                <div>
                  <label htmlFor="workDone-historical" className="block text-sm font-medium">Work Done Notes</label>
                  <textarea id="workDone-historical" value={workDoneNotes} onChange={e => setWorkDoneNotes(e.target.value)} rows={4} className="input-style w-full"></textarea>
                </div>
                 {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end">
                  <button type="submit" className="btn btn-primary inline-flex items-center gap-2">
                    <PlusCircleIcon /> Add Historical Record
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Imported Records for {selectedVehicleId || '...'}
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {historicalTicketsForVehicle.length > 0 ? (
              historicalTicketsForVehicle.map(ticket => (
                <div key={ticket.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{new Date(ticket.createdAt).toLocaleDateString()}: <span className="font-normal">{ticket.issue.replace('HISTORICAL: ', '')}</span></p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-semibold">Work Done:</span> {ticket.workDoneNotes}
                    </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-4 text-gray-500 dark:text-gray-400">
                {selectedVehicleId ? 'No historical data has been added for this vehicle yet.' : 'Select a vehicle to view its imported history.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalDataImporter;
