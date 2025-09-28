import React, { useState } from 'react';
import { Ticket, SparePart } from '../types';
import { DocumentDownloadIcon } from './icons';

declare const XLSX: any;

interface ReplenishmentReportProps {
  tickets: Ticket[];
  spareParts: SparePart[];
}

interface ReportRow {
  sapCode: string;
  materialDescription: string;
  descriptionAr?: string;
  consumed: number;
  currentStock: number;
}

const ReplenishmentReport: React.FC<ReplenishmentReportProps> = ({ tickets, spareParts }) => {
    const today = new Date();
    // Default to last month
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
    const [selectedMonth, setSelectedMonth] = useState(`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`);
    const [reportData, setReportData] = useState<ReportRow[] | null>(null);

    const handleGenerateReport = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

        const consumption: Record<string, number> = {};

        tickets.forEach(ticket => {
            if (
                ticket.partRequest &&
                ticket.partRequest.warehouseResolvedAt &&
                ticket.partRequest.warehouseResolvedAt >= startDate.getTime() &&
                ticket.partRequest.warehouseResolvedAt <= endDate.getTime() &&
                (ticket.partRequest.status === 'issued' || ticket.partRequest.status === 'warehouse_completed')
            ) {
                Object.entries(ticket.partRequest.parts).forEach(([sapCode, quantity]) => {
                    consumption[sapCode] = (consumption[sapCode] || 0) + quantity;
                });
            }
        });

        const sparePartsMap = new Map(spareParts.map(p => [p.sapCode, p]));
        
        const data: ReportRow[] = Object.entries(consumption).map(([sapCode, consumed]) => {
            const part = sparePartsMap.get(sapCode);
            return {
                sapCode,
                materialDescription: part?.materialDescription || 'Unknown Part',
                descriptionAr: part?.descriptionAr,
                consumed,
                currentStock: part?.balanceOnSap ?? 0
            };
        }).sort((a,b) => a.sapCode.localeCompare(b.sapCode));

        setReportData(data);
    };
    
    const handleExportExcel = () => {
        if (!reportData || reportData.length === 0) return;

        const dataToExport = reportData.map(row => ({
            'SAP Code': row.sapCode,
            'Material Description': row.materialDescription,
            'Arabic Description': row.descriptionAr || '',
            'Quantity Consumed': row.consumed,
            'Current Stock': row.currentStock
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Replenishment Report');

        // Auto-size columns
        const colWidths = Object.keys(dataToExport[0]).map(key => ({ wch: Math.max(key.length, ...dataToExport.map(r => String(r[key as keyof typeof r] || '').length)) + 2 }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `Replenishment_Report_${selectedMonth}.xlsx`);
    };

    return (
        <div className="content-container p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Monthly Replenishment Report</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate a report of all spare parts consumed in a given month to create a replenishment request.
            </p>
            <div className="flex items-end gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Month</label>
                    <input
                        type="month"
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    />
                </div>
                <button
                    onClick={handleGenerateReport}
                    className="btn btn-primary h-10 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md"
                >
                    Generate Report
                </button>
                 {reportData && reportData.length > 0 && (
                    <button
                        onClick={handleExportExcel}
                        className="btn btn-secondary h-10 inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md"
                    >
                         <DocumentDownloadIcon className="w-5 h-5 mr-2" />
                        Export to Excel
                    </button>
                )}
            </div>

            {reportData !== null && (
                <div>
                    {reportData.length > 0 ? (
                         <div className="overflow-x-auto max-h-[32rem]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">SAP Code</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Material Description</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Quantity Consumed</th>
                                        <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Current Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {reportData.map(item => (
                                        <tr key={item.sapCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-200">{item.sapCode}</td>
                                            <td className="px-3 py-2 text-sm">
                                                <div className="text-gray-800 dark:text-gray-200">{item.materialDescription}</div>
                                                {item.descriptionAr && <div className="text-xs text-gray-500 dark:text-gray-400 italic" dir="rtl">{item.descriptionAr}</div>}
                                            </td>
                                            <td className="px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400">{item.consumed}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{item.currentStock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No parts were consumed during the selected month.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReplenishmentReport;
