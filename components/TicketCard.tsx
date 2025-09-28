


import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { GoogleGenAI } from "@google/genai";
import { Ticket, TicketStatus, View, PartRequestStatus, SparePart, TicketPriority, Inspection } from '../types';
import { formatTimestamp, formatDuration } from '../utils/time';
import { ClockIcon, CheckCircleIcon, UserGroupIcon, PrinterIcon, GaugeIcon, PencilIcon, LocationMarkerIcon, TruckIcon, UserCircleIcon, CalendarIcon, SearchIcon, SparklesIcon } from './icons';


interface TicketCardProps {
  ticket: Ticket;
  currentView: View;
  spareParts: SparePart[];
  technicians: string[];
  inventoryLastUpdated?: number;
  isHistoryView?: boolean;
  ai?: GoogleGenAI;
  allTickets?: Ticket[];
  inspections?: Inspection[];
  onStartWork: (id: string) => void;
  onCloseTicket: (id:string, workDoneNotes: string) => void;
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

const statusStyles: { [key in TicketStatus]: { banner: string, text: string, border: string } } = {
  [TicketStatus.Open]: { banner: 'bg-red-500', text: 'text-red-800 dark:text-red-200', border: 'border-red-500' },
  [TicketStatus.InProgress]: { banner: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' },
  [TicketStatus.AwaitingParts]: { banner: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' },
  [TicketStatus.AwaitingWarehouse]: { banner: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' },
  [TicketStatus.PendingConfirmation]: { banner: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500' },
  [TicketStatus.Closed]: { banner: 'bg-emerald-500', text: 'text-green-800 dark:text-green-200', border: 'border-emerald-500' },
};

const priorityBorderStyles: { [key in TicketPriority]: string } = {
  [TicketPriority.High]: 'border-l-4 border-red-500',
  [TicketPriority.Medium]: 'border-l-4 border-yellow-500',
  [TicketPriority.Low]: 'border-l-4 border-emerald-500',
};

const priorityStyles: { [key in TicketPriority]: { bg: string, text: string } } = {
  [TicketPriority.High]: { bg: 'bg-red-500', text: 'text-white' },
  [TicketPriority.Medium]: { bg: 'bg-yellow-500', text: 'text-white' },
  [TicketPriority.Low]: { bg: 'bg-emerald-500', text: 'text-white' },
};

const PartRequestStatusPill: React.FC<{status: PartRequestStatus}> = ({status}) => {
    const statusText: Record<PartRequestStatus, string> = {
        pending: 'Pending Admin',
        admin_approved: 'Pending Warehouse',
        issued: 'Issued - Pending Handover',
        rejected: 'Rejected',
        none: 'No Parts Required',
        warehouse_completed: 'Parts Handover Complete'
    }
    const styles: Record<PartRequestStatus, string> = {
        pending: 'bg-yellow-200 text-yellow-800',
        admin_approved: 'bg-cyan-200 text-cyan-800',
        issued: 'bg-blue-200 text-blue-800',
        rejected: 'bg-red-200 text-red-800',
        none: 'bg-gray-200 text-gray-800',
        warehouse_completed: 'bg-green-200 text-green-800'
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[status]}`}>{statusText[status]}</span>
}

const TicketDetail: React.FC<{icon: React.ReactNode, label: string, value: string | React.ReactNode}> = ({ icon, label, value }) => (
    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
        <span className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400">{icon}</span>
        <span className="font-semibold mr-1">{label}:</span>
        <span className="break-all">{value}</span>
    </div>
);

const TicketCard: React.FC<TicketCardProps> = ({ 
    ticket, currentView, spareParts, technicians, inventoryLastUpdated, isHistoryView = false, ai, allTickets, inspections,
    onStartWork, onCloseTicket, onConfirmTicket, onAssignTechnicians, onRequestParts, onNoPartsRequired, 
    onApproveRequest, onRejectRequest, onIssueParts, onRejectPartsByWarehouse, onCompleteHandover
}) => {
    const { banner } = statusStyles[ticket.status];
    const priorityStyle = priorityStyles[ticket.priority];
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
    const [isRequestingParts, setIsRequestingParts] = useState(false);
    const [partQuantities, setPartQuantities] = useState<Record<string, number>>({});
    const [partSearch, setPartSearch] = useState('');
    const [isFinishingWork, setIsFinishingWork] = useState(false);
    const [workNotes, setWorkNotes] = useState('');
    const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
    const [suggestion, setSuggestion] = useState('');
    const [suggestionError, setSuggestionError] = useState('');
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedTechnicians(ticket.assignedTo || []);
    }, [ticket.assignedTo]);

    const hasCompletedInspection = useMemo(() => {
        // If inspections aren't passed (e.g., in other views), default to true to not break the UI.
        // The check should only apply in the maintenance view where the prop is available.
        if (!inspections) return true; 

        // An inspection must exist for this vehicle, and it must have been created AFTER the ticket was created.
        return inspections.some(
            (insp) => insp.vehicleId === ticket.vehicleId && insp.createdAt >= ticket.createdAt
        );
    }, [inspections, ticket.vehicleId, ticket.createdAt]);


    const filteredSpareParts = useMemo(() => {
        if (!partSearch) {
            return spareParts;
        }
        const searchTerm = partSearch.toLowerCase();
        return spareParts.filter(part => 
            part.sapCode.toLowerCase().includes(searchTerm) ||
            part.materialDescription.toLowerCase().includes(searchTerm) ||
            (part.descriptionAr && part.descriptionAr.toLowerCase().includes(searchTerm))
        );
    }, [spareParts, partSearch]);

    const handleGetSuggestion = useCallback(async () => {
        if (!ai || !allTickets) return;

        setIsFetchingSuggestion(true);
        setSuggestion('');
        setSuggestionError('');

        const vehicleHistory = allTickets
            .filter(t => t.vehicleId === ticket.vehicleId && t.id !== ticket.id && (t.issue || t.workDoneNotes))
            .sort((a, b) => a.createdAt - b.createdAt)
            .map(({ serial, issue, section, workDoneNotes, kilometers, createdAt, partRequest }) => {
                const partsReplaced = partRequest?.parts && Object.keys(partRequest.parts).length > 0
                    ? Object.keys(partRequest.parts).join(', ')
                    : 'N/A';
                
                return {
                    ticketSerial: serial,
                    date: new Date(createdAt).toISOString().split('T')[0],
                    kilometersAtEvent: kilometers,
                    reportedIssue: issue,
                    maintenanceSection: section,
                    resolutionNotes: workDoneNotes || 'N/A',
                    partsReplaced: partsReplaced
                };
            });
        
        const vehicleHistoryString = vehicleHistory.length > 0 ? JSON.stringify(vehicleHistory, null, 2) : '[]';

        const vehicleProfileString = `
- Truck Model: ${ticket.vehicleId} (Model is inferred from vehicle ID. Example: MB3, MB4, MB5 series)
- Year: Not available in system
- Mileage: ${ticket.kilometers.toLocaleString()} km
- VIN: Not available in system`;

        const telematicsDataString = "Telematics data (operating patterns, usage conditions) is not available in the current system.";

        const currentIssueString = `
- Symptoms / Issue: "${ticket.issue}"
- Diagnostic Trouble Codes (DTCs): Not provided in this ticket.
- Technician Observations: Captured in the 'Symptoms / Issue' field above.`;

        const prompt = `# FLEET MECHANIC AI DIAGNOSTIC PROMPT (Mercedes-Benz MB3/MB4/MB5 Expert Edition) - Data-Integrated Version

You are FleetMechanic AI, a commercial fleet diagnostic assistant with over 20 years' expertise in Mercedes-Benz MB3, MB4, and MB5 trucks. Your core role is to power the fleet app's Diagnosis Results tab, analyzing current issues using the comprehensive vehicle data already available in the system.

## AVAILABLE DATA CONTEXT
The system automatically provides you with:
- **Vehicle Profile**: ${vehicleProfileString}
- **Maintenance History / Ticket History**: A complete JSON array of service records, parts replacements, and intervals is provided below.
${vehicleHistoryString}
- **Telematics Data**: ${telematicsDataString}
- **Current Issue**: ${currentIssueString}

## CORE BEHAVIOR
* **Leverage Existing Data**: Use maintenance history and ticket patterns to inform diagnosis - don't ask for information already in the system
* **Pattern Recognition**: Identify correlations between current symptoms and historical maintenance/issues
* **Confidence Scoring**: Provide 1-10 confidence scores based on data correlation strength
* **Safety Priority**: Flag immediate hazards and driving restrictions first
* **Mercedes Expertise**: Apply MB3/MB4/MB5 specific knowledge and common failure patterns
* **Explainable Logic**: Show how historical data, current symptoms, and Mercedes expertise connect

## ENHANCED DIAGNOSTIC PROCESS
1. **Historical Analysis**: Review maintenance patterns and previous similar issues
2. **Symptom Correlation**: Connect current DTCs/symptoms with known MB truck patterns
3. **Maintenance Impact Assessment**: Evaluate if recent services relate to current issue
4. **Predictive Assessment**: Use ticket history to predict likely failure progression
5. **Mercedes-Specific Logic**: Apply model-specific failure modes and diagnostic procedures

## DIAGNOSTIC ANALYSIS FORMAT

**🔧 DIAGNOSTIC ANALYSIS**

**PRIMARY DIAGNOSIS:** [Most likely cause]
**Confidence:** [X/10]
**Historical Evidence:** [What maintenance/ticket history supports this diagnosis]
**Mercedes Logic:** [MB3/MB4/MB5 specific failure pattern or technical bulletin reference]
**Data Correlation:** [How current symptoms match historical patterns]

**SECONDARY DIAGNOSIS:** [Alternative cause]
**Confidence:** [X/10]
**Historical Evidence:** [Supporting data from vehicle history]
**Mercedes Logic:** [Alternative MB-specific reasoning]

**TERTIARY DIAGNOSIS:** [Third possibility if confidence >4/10]
**Confidence:** [X/10]
**Reasoning:** [Less likely but historically possible for this vehicle/model]

**🔍 DIAGNOSTIC TESTS NEEDED**
* [Primary test based on maintenance history - e.g., "Given injector service 3 months ago, test injector balance rates"]
* [Secondary verification based on ticket patterns]
* [Mercedes Star Diagnostic specific procedures for this model/mileage]

**⚠️ SAFETY ASSESSMENT**
* [Immediate hazards based on symptom severity and historical failure modes]
* [Driving restrictions until diagnosis confirmed]
* [Escalation triggers if issue worsens]

**🛠️ NEXT STEPS**
1. **Immediate Action:** [Based on safety assessment and historical urgency patterns]
2. **Diagnostic Workflow:** [Step-by-step technician process prioritized by data confidence]
3. **Parts Consideration:** [Likely components based on maintenance intervals and failure history]
4. **Complexity:** [Simple/Moderate/Complex - factor in previous similar repairs]

**💡 MAINTENANCE INSIGHTS**
* **Historical Connection:** [How recent maintenance relates to current issue]
* **Preventive Opportunity:** [What this diagnosis reveals about upcoming maintenance needs]
* **Pattern Alert:** [If this represents a recurring issue requiring root cause analysis]
* **Predictive Maintenance:** [Recommended monitoring or proactive replacements]

**📊 DATA-DRIVEN CONFIDENCE FACTORS**
* **Maintenance History Match:** [X/10] - How well symptoms align with service patterns
* **Ticket Pattern Match:** [X/10] - Similarity to previous resolved issues
* **Mercedes Technical Match:** [X/10] - Alignment with known MB3/MB4/MB5 issues
* **Overall System Confidence:** [Average of above factors]

## MERCEDES-SPECIFIC INTEGRATION RULES
* **Reference Maintenance Intervals**: Use actual service history vs. recommended intervals
* **Leverage Ticket Resolutions**: If similar issue was resolved before, reference that solution
* **Model-Specific Priorities**: MB3 (focus on emissions systems), MB4 (transmission/drivetrain), MB5 (advanced electronics)
* **Telematics Integration**: Use operating pattern data to validate diagnostic theories
* **Progressive Diagnosis**: If multiple similar tickets exist, suggest root cause investigation

## EXPERT OPERATIONAL GUIDELINES
* **No Redundant Questions**: Never ask for data already in the system
* **Data Validation**: If historical data seems inconsistent with current symptoms, flag for verification
* **Efficiency Focus**: Prioritize diagnostics that leverage existing maintenance work
* **Learning Integration**: Reference successful past resolutions for similar configurations
* **Escalation Triggers**: Automatically suggest specialist consultation for recurring complex issues

**INTEGRATION REMINDER:** Your role is to synthesize the wealth of existing fleet data with current diagnostic needs. Use the complete vehicle history as your foundation, not a starting point for questions. Every diagnosis should demonstrate how historical patterns, current symptoms, and Mercedes expertise converge to create the most accurate, efficient repair path.
`;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setSuggestion(response.text);

        } catch (e) {
            console.error("AI suggestion error:", e);
            setSuggestionError("Failed to get AI suggestion. Please check the connection or try again later.");
        } finally {
            setIsFetchingSuggestion(false);
        }
    }, [ai, allTickets, ticket]);
    
    const handleAssign = () => {
        onAssignTechnicians?.(ticket.id, selectedTechnicians);
        setIsAssigning(false);
    };

    const handlePartQuantityChange = (sapCode: string, quantity: number) => {
        setPartQuantities(prev => {
            const newQuantities = { ...prev };
            if (quantity > 0) {
                newQuantities[sapCode] = quantity;
            } else {
                delete newQuantities[sapCode];
            }
            return newQuantities;
        });
    };

    const handleRequestPartsSubmit = () => {
        onRequestParts?.(ticket.id, partQuantities);
        setIsRequestingParts(false);
        setPartQuantities({});
        setPartSearch('');
    };

    const handleFinishWork = () => {
        if (!workNotes.trim()) {
            alert('Please provide notes on the work that was done.');
            return;
        }
        onCloseTicket(ticket.id, workNotes);
        setIsFinishingWork(false);
        setWorkNotes('');
    }

    const printTicket = () => {
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        if (printWindow) {
            const cardContent = cardRef.current?.innerHTML;
            printWindow.document.write('<html><head><title>Print Ticket</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>body { font-family: sans-serif; margin: 20px; } .no-print { display: none; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(cardContent || '');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { // Allow content to load before printing
                printWindow.print();
            }, 500);
        }
    }
    
    const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
        const elements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];

        const flushList = (key: string) => {
            if (listItems.length > 0) {
                elements.push(<ul key={key} className="space-y-1 list-disc list-inside">{listItems}</ul>);
                listItems = [];
            }
        };

        const lines = content.split('\n');

        lines.forEach((line, i) => {
            line = line.trim();
            const processLine = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-700 dark:text-gray-300">$1</strong>');
            
            if (line.startsWith('**🔧 DIAGNOSTIC ANALYSIS**')) {
                 flushList(`ul-before-h-diag-${i}`);
                 elements.push(<h4 key={i} className="text-base font-bold text-gray-800 dark:text-white mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processLine(line.replace('**🔧 DIAGNOSTIC ANALYSIS**', '🔧 Diagnostic Analysis')) }} />);
            } else if (line.startsWith('**') && line.endsWith('**')) {
                 flushList(`ul-before-h-bold-${i}`);
                 elements.push(<h5 key={i} className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processLine(line) }} />);
            } else if (line.startsWith('* ') || line.startsWith('- ')) {
                listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: processLine(line.substring(2)) }} />);
            } else {
                flushList(`ul-before-p-${i}`);
                if (line) {
                    elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: processLine(line) }} />);
                }
            }
        });
        flushList('ul-end');
        return <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">{elements}</div>;
    };

    const totalDuration = ticket.closedAt ? formatDuration(ticket.closedAt - ticket.createdAt) : formatDuration(Date.now() - ticket.createdAt);
    const workDuration = ticket.startedAt && ticket.closedAt ? formatDuration(ticket.closedAt - ticket.startedAt) : (ticket.startedAt ? formatDuration(Date.now() - ticket.startedAt) : 'Not Started');

    return (
        <div ref={cardRef} className={`content-container rounded-xl shadow-lg flex flex-col h-full overflow-hidden ${priorityBorderStyles[ticket.priority]}`}>
            <div className={`${banner} text-white p-3 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>{ticket.priority}</span>
                    <h3 className="font-bold text-lg">{ticket.serial}</h3>
                </div>
                <span className="text-sm font-medium">{ticket.status}</span>
            </div>
            <div className="p-5 flex-grow">
                <p className="text-base text-gray-800 dark:text-gray-100 font-semibold mb-3">{ticket.issue}</p>
                <div className="space-y-2">
                   <TicketDetail icon={<TruckIcon />} label="Vehicle" value={ticket.vehicleId} />
                   <TicketDetail icon={<UserCircleIcon />} label="Reported by" value={ticket.reportedBy} />
                   <TicketDetail icon={<PencilIcon />} label="Section" value={ticket.section} />
                   <TicketDetail icon={<GaugeIcon />} label="Kilometers" value={ticket.kilometers.toLocaleString()} />
                   <TicketDetail icon={<CalendarIcon />} label="Created" value={formatTimestamp(ticket.createdAt)} />
                   {ticket.location && <TicketDetail icon={<LocationMarkerIcon />} label="Location" value={ticket.location} />}
                </div>

                {isHistoryView && ticket.workDoneNotes && (
                     <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Work Done Notes</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ticket.workDoneNotes}</p>
                    </div>
                )}

                {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                     <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"><UserGroupIcon /> Assigned Technicians</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                           {ticket.assignedTo.map(t => <li key={t}>{t}</li>)}
                        </ul>
                    </div>
                )}
                 
                {ticket.partRequest && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Part Request Status</h4>
                        <div className="mt-2">
                            <PartRequestStatusPill status={ticket.partRequest.status} />
                        </div>
                        {Object.keys(ticket.partRequest.parts).length > 0 && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <ul className="list-disc list-inside">
                                {Object.entries(ticket.partRequest.parts).map(([sap, qty]) => {
                                    const part = spareParts.find(p => p.sapCode === sap);
                                    return <li key={sap}>{part?.materialDescription || sap} (Qty: {qty})</li>
                                })}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TIME TRACKING SECTION --- */}
                {ticket.status !== TicketStatus.Open && !isHistoryView && (
                     <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Time Open:</span>
                            <span className="text-gray-600 dark:text-gray-400">{totalDuration}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Work Duration:</span>
                            <span className="text-gray-600 dark:text-gray-400">{workDuration}</span>
                         </div>
                    </div>
                )}

                {isHistoryView && ticket.closedAt && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Time to Complete:</span>
                            <span className="text-gray-600 dark:text-gray-400">{formatDuration(ticket.closedAt - ticket.createdAt)}</span>
                         </div>
                         {ticket.startedAt && (
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Work Duration:</span>
                                <span className="text-gray-600 dark:text-gray-400">{formatDuration(ticket.closedAt - ticket.startedAt)}</span>
                            </div>
                         )}
                    </div>
                )}


                {/* --- ACTION BUTTONS --- */}
                {!isHistoryView && (
                    <>
                        {/* --- OPERATIONS VIEW ACTIONS --- */}
                        {currentView === View.Operations && ticket.status === TicketStatus.PendingConfirmation && onConfirmTicket && (
                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <button
                                    onClick={() => onConfirmTicket(ticket.id)}
                                    className="btn btn-secondary w-full flex justify-center items-center gap-2"
                                >
                                    <CheckCircleIcon/> Confirm Work Completion
                                </button>
                            </div>
                        )}
                        {/* --- MAINTENANCE VIEW ACTIONS --- */}
                        {currentView === View.Maintenance && ticket.status === TicketStatus.Open && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div title={!hasCompletedInspection ? 'A vehicle inspection must be completed for this ticket before starting work.' : ''} className="flex-1">
                                        <button
                                            onClick={() => onStartWork(ticket.id)}
                                            disabled={!hasCompletedInspection}
                                            className="btn btn-secondary w-full justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Start Work
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                      <button onClick={() => setIsAssigning(true)} className="btn btn-primary w-full justify-center">
                                          Assign Technician
                                      </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentView === View.Maintenance && ticket.status === TicketStatus.InProgress && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <button onClick={() => setIsFinishingWork(true)} className="btn btn-secondary flex-1 justify-center">Finish Work</button>
                                     <button onClick={() => setIsAssigning(true)} className="btn btn-primary flex-1 justify-center">Re-assign</button>
                                     {(!ticket.partRequest || ticket.partRequest.status === 'rejected') && (
                                         <div className="flex-1">
                                            <button onClick={() => setIsRequestingParts(true)} className="btn bg-blue-600 hover:bg-blue-700 text-white w-full justify-center">Request Parts</button>
                                         </div>
                                     )}
                                </div>
                            </div>
                        )}
                        
                        {/* --- SPARES ADMIN VIEW ACTIONS --- */}
                        {currentView === View.SparesAdmin && ticket.partRequest?.status === 'pending' && (
                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => onApproveRequest?.(ticket.id)} className="btn btn-secondary flex-1 justify-center">Approve</button>
                                    <button onClick={() => onRejectRequest?.(ticket.id)} className="btn bg-red-600 hover:bg-red-700 text-white flex-1 justify-center">Reject</button>
                                </div>
                            </div>
                        )}

                        {/* --- WAREHOUSE VIEW ACTIONS --- */}
                        {currentView === View.Warehouse && ticket.partRequest?.status === 'admin_approved' && (
                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <div className="flex gap-2">
                                    <button onClick={() => onIssueParts?.(ticket.id)} className="btn btn-secondary flex-1 justify-center">Issue Parts</button>
                                    <button onClick={() => onRejectPartsByWarehouse?.(ticket.id)} className="btn bg-red-600 hover:bg-red-700 text-white flex-1 justify-center">Reject (No Stock)</button>
                                </div>
                            </div>
                        )}
                         {currentView === View.Warehouse && ticket.partRequest?.status === 'issued' && (
                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <h4 className="font-semibold mb-2">Actions</h4>
                                <button onClick={() => onCompleteHandover?.(ticket.id)} className="btn btn-secondary w-full justify-center">Complete Handover</button>
                            </div>
                        )}
                        
                        {/* AI Diagnostic Assistant */}
                        {currentView === View.Maintenance && ticket.status !== TicketStatus.Closed && (
                             <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <details>
                                    <summary className="font-semibold cursor-pointer flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                        <SparklesIcon /> AI Diagnostic Assistant
                                    </summary>
                                    <div className="mt-2 pl-2">
                                        {!suggestion && (
                                            <button 
                                                onClick={handleGetSuggestion} 
                                                disabled={isFetchingSuggestion}
                                                className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 text-sm px-3 py-1.5"
                                            >
                                                {isFetchingSuggestion ? 'Analyzing...' : 'Get Diagnosis'}
                                            </button>
                                        )}
                                        {isFetchingSuggestion && <p className="text-sm text-gray-500">Analyzing vehicle history...</p>}
                                        {suggestionError && <p className="text-sm text-red-500">{suggestionError}</p>}
                                        {suggestion && (
                                            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                <MarkdownRenderer content={suggestion} />
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>
                        )}
                    </>
                )}

            </div>
            {!isHistoryView && (
                 <div className="p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 flex justify-end no-print">
                    <button onClick={printTicket} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs">
                        <PrinterIcon className="w-4 h-4" />
                        Print
                    </button>
                </div>
            )}

            {/* --- MODALS --- */}
            {isAssigning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Assign Technicians to {ticket.serial}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {technicians.map(tech => (
                                <label key={tech} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedTechnicians.includes(tech)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTechnicians(prev => [...prev, tech]);
                                            } else {
                                                setSelectedTechnicians(prev => prev.filter(t => t !== tech));
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{tech}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setIsAssigning(false)} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                            <button onClick={handleAssign} className="btn btn-primary">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isRequestingParts && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold">Request Spare Parts for {ticket.serial}</h3>
                             {inventoryLastUpdated && <span className="text-xs text-gray-500">Inventory as of: {new Date(inventoryLastUpdated).toLocaleTimeString()}</span>}
                        </div>
                        <div className="relative mb-4">
                            <input 
                                type="text"
                                placeholder="Search by SAP code or name..."
                                value={partSearch}
                                onChange={(e) => setPartSearch(e.target.value)}
                                className="input-style w-full pl-10"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="text-gray-400" />
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">SAP Code</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Stock</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredSpareParts.map(part => (
                                        <tr key={part.sapCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-3 py-2 text-sm">{part.materialDescription}</td>
                                            <td className="px-3 py-2 text-sm font-mono">{part.sapCode}</td>
                                            <td className={`px-3 py-2 text-sm font-semibold ${part.balanceOnSap < 5 ? 'text-red-500' : ''}`}>{part.balanceOnSap}</td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={part.balanceOnSap}
                                                    value={partQuantities[part.sapCode] || ''}
                                                    onChange={(e) => handlePartQuantityChange(part.sapCode, parseInt(e.target.value, 10))}
                                                    className="input-style w-20 text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => { onNoPartsRequired?.(ticket.id); setIsRequestingParts(false); }} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">No Parts Required</button>
                            <button onClick={() => setIsRequestingParts(false)} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                            <button onClick={handleRequestPartsSubmit} className="btn btn-primary" disabled={Object.keys(partQuantities).length === 0}>Submit Request</button>
                        </div>
                    </div>
                </div>
            )}
             {isFinishingWork && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-4">Finish Work on {ticket.serial}</h3>
                        <p className="text-sm mb-2">Please provide a summary of the work done. This will be sent to Fleet Operations for confirmation.</p>
                        <textarea
                            rows={5}
                            value={workNotes}
                            onChange={(e) => setWorkNotes(e.target.value)}
                            className="input-style w-full"
                            placeholder="e.g., Replaced brake pads and resurfaced rotors. Vehicle tested and is now safe for operation."
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsFinishingWork(false)} className="btn bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                            <button onClick={handleFinishWork} className="btn btn-primary">Complete Work</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(TicketCard);
