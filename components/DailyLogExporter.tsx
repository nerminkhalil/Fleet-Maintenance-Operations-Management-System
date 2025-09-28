import React, { useState } from 'react';
import { Ticket, TicketStatus, SparePart } from '../types';
import { formatTimestamp, formatDuration } from '../utils/time';

declare const XLSX: any;

interface DailyLogExporterProps {
    tickets: Ticket[];
    spareParts: SparePart[];
}

const DailyLogExporter: React.FC<DailyLogExporterProps> = ({ tickets, spareParts }) => {
    // Get today's date in YYYY-MM-DD format, respecting the local timezone
    const getTodayString = () => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const adjustedToday = new Date(today.getTime() - (offset*60*1000));
        return adjustedToday.toISOString().split('T')[0];
    }
    
    const [selectedDate, setSelectedDate] = useState(getTodayString());

    const handleExport = () => {
        if (!selectedDate) {
            alert('Please select a date to export the log.');
            return;
        }

        const startOfDay = new Date(selectedDate + 'T00:00:00.000');
        const endOfDay = new Date(selectedDate + 'T23:59:59.999');

        const closedTicketsOnDate = tickets.filter(t => 
            t.status === TicketStatus.Closed &&
            t.closedAt &&
            t.closedAt >= startOfDay.getTime() &&
            t.closedAt <= endOfDay.getTime()
        );

        if (closedTicketsOnDate.length === 0) {
            alert(`No tickets were closed on ${selectedDate}.`);
            return;
        }

        const sparePartsMap = new Map(spareParts.map(p => [p.sapCode, p]));

        const logData = closedTicketsOnDate.map(ticket => {
            const timeToStart = ticket.startedAt ? formatDuration(ticket.startedAt - ticket.createdAt) : 'N/A';
            const jobTime = (ticket.startedAt && ticket.closedAt) ? formatDuration(ticket.closedAt - ticket.startedAt) : 'N/A';
            const confirmationDelay = (ticket.closedAt && ticket.confirmedAt) ? formatDuration(ticket.confirmedAt - ticket.closedAt) : 'N/A';

            const partsUsed = ticket.partRequest && Object.keys(ticket.partRequest.parts).length > 0
                ? Object.entries(ticket.partRequest.parts).map(([sapCode, quantity]) => {
                    const part = sparePartsMap.get(sapCode);
                    const description = part ? part.materialDescription : `Unknown (${sapCode})`;
                    return `${description} (Qty: ${quantity})`;
                  }).join('; ')
                : 'No Parts Required';

            return {
                'Ticket Serial': ticket.serial,
                'Vehicle ID': ticket.vehicleId,
                'Section': ticket.section,
                'Issue Reported': ticket.issue,
                'Reported By': ticket.reportedBy,
                'Kilometers': ticket.kilometers,
                'Assigned Technicians': ticket.assignedTo?.join(', ') || 'N/A',
                'Work Done Notes': ticket.workDoneNotes || 'N/A',
                'Parts Used': partsUsed,
                'Ticket Opened At': formatTimestamp(ticket.createdAt),
                'Work Started At': ticket.startedAt ? formatTimestamp(ticket.startedAt) : 'N/A',
                'Work Finished At': ticket.closedAt ? formatTimestamp(ticket.closedAt) : 'N/A',
                'Confirmation Time': ticket.confirmedAt ? formatTimestamp(ticket.confirmedAt) : 'N/A',
                'Time to Start Work': timeToStart,
                'Job Maintenance Time': jobTime,
                'Confirmation Delay': confirmationDelay,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(logData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Maintenance Log');

        // Auto-size columns for better readability
        const colWidths = Object.keys(logData[0]).map(key => {
            const maxLength = Math.max(
                ...logData.map(row => String(row[key as keyof typeof row] || '').length),
                key.length
            );
            return { wch: maxLength + 2 }; // +2 for a little padding
        });
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `Maintenance_Log_${selectedDate}.xlsx`);
    };

    return (
        <div className="content-container p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Daily Maintenance Log Export</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export a log of all tickets that were marked as "Closed" on a specific day. 
                The generated Excel file can be uploaded to Google Drive for record-keeping.
            </p>
            <div className="flex items-end gap-4">
                <div>
                    <label htmlFor="logDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
                    <input
                        type="date"
                        id="logDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    />
                </div>
                <button
                    onClick={handleExport}
                    className="btn btn-secondary inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md"
                >
                    Export Daily Log (.xlsx)
                </button>
            </div>
        </div>
    );
};

export default React.memo(DailyLogExporter);