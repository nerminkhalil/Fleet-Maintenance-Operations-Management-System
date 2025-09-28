import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Vehicle, Inspection, VehicleImageSet, TicketSection, TicketPriority } from '../types';
import { CameraIcon, PlusCircleIcon, CheckCircleIcon, SparklesIcon, DocumentDownloadIcon } from './icons';
import { formatTimestamp } from '../utils/time';
import InspectionDashboard from './InspectionDashboard';

declare const html2canvas: any;

interface InspectionViewProps {
    ai: GoogleGenAI;
    vehicles: Vehicle[];
    inspections: Inspection[];
    createInspection: (vehicleId: string, images: VehicleImageSet, notes: string) => void;
    createTicket: (vehicleId: string, issue: string, reportedBy: string, section: TicketSection, kilometers: number, priority: TicketPriority, location?: string) => void;
    initialVehicleId?: string;
    onClearInitialVehicleId?: () => void;
}

interface ImageCaptureBoxProps {
  label: string;
  side: keyof VehicleImageSet;
  onImageCapture: (side: keyof VehicleImageSet, file: File) => void;
  imageSrc?: string;
  disabled?: boolean;
}

const ImageCaptureBox: React.FC<ImageCaptureBoxProps> = ({ label, side, onImageCapture, imageSrc, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if(!disabled) inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageCapture(side, file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      {imageSrc ? (
        <img src={imageSrc} alt={`${label} view`} className={`w-full h-48 object-cover rounded-md mb-2 ${!disabled ? 'cursor-pointer' : ''}`} onClick={handleClick} />
      ) : (
        <div className={`w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center mb-2 ${!disabled ? 'cursor-pointer' : ''}`} onClick={handleClick}>
          <CameraIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Capture {label}</p>
        </div>
      )}
       <span className="absolute top-2 right-2 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full">{label}</span>
    </div>
  );
};

const InspectionDisplay: React.FC<{inspection: Inspection | null, title: string}> = ({ inspection, title }) => {
    const sides: (keyof VehicleImageSet)[] = ['front', 'back', 'left', 'right'];
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl h-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
            {inspection ? (
                <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Conducted on: {formatTimestamp(inspection.createdAt)}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {sides.map(side => (
                           <div key={side} className="relative">
                               {inspection.images[side] ? (
                                   <img src={inspection.images[side]} alt={`${side} view`} className="w-full h-32 object-cover rounded-md bg-gray-200 dark:bg-gray-700" />
                               ) : (
                                   <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No Image</div>
                               )}
                               <span className="absolute top-2 right-2 bg-black/50 text-white text-xs capitalize font-semibold px-2 py-1 rounded-full">{side}</span>
                           </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Observations:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                            {inspection.notes || 'No observations were noted.'}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    No previous inspection data found for this vehicle.
                </div>
            )}
        </div>
    );
};


const InspectionView: React.FC<InspectionViewProps> = ({ ai, vehicles, inspections, createInspection, createTicket, initialVehicleId, onClearInitialVehicleId }) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [currentImages, setCurrentImages] = useState<VehicleImageSet>({});
    const [currentNotes, setCurrentNotes] = useState('');
    const [justInspected, setJustInspected] = useState<Inspection | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inspectionFormRef = useRef<HTMLDivElement>(null);
    
    const [globalAiAnalysis, setGlobalAiAnalysis] = useState<string>('');
    const [isGlobalComparing, setIsGlobalComparing] = useState<boolean>(false);
    const [globalCompareError, setGlobalCompareError] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const analysisReportRef = useRef<HTMLDivElement>(null);


    const latestInspectionForSelectedVehicle = useMemo(() => {
        if (!selectedVehicleId) return null;
        return inspections
            .filter(insp => insp.vehicleId === selectedVehicleId)
            .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
    }, [selectedVehicleId, inspections]);
    
    const isAllImagesCaptured = useMemo(() => {
        return !!(currentImages.front && currentImages.back && currentImages.left && currentImages.right);
    }, [currentImages]);

    const handleVehicleSelect = (vehicleId: string) => {
        setSelectedVehicleId(vehicleId);
        setCurrentImages({});
        setCurrentNotes('');
        setJustInspected(null);
        setGlobalAiAnalysis('');
        setIsGlobalComparing(false);
        setGlobalCompareError('');
    };

    const localStartInspection = useCallback((vehicleId: string) => {
        handleVehicleSelect(vehicleId);
        setTimeout(() => {
            inspectionFormRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    useEffect(() => {
        if (initialVehicleId && onClearInitialVehicleId) {
            localStartInspection(initialVehicleId);
            onClearInitialVehicleId();
        }
    }, [initialVehicleId, onClearInitialVehicleId, localStartInspection]);

    const handleImageCapture = useCallback((side: keyof VehicleImageSet, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === 'string') {
                setCurrentImages(prev => ({ ...prev, [side]: e.target.result }));
            }
        };
        reader.readAsDataURL(file);
    }, []);
    
    const handleGlobalCompare = useCallback(async () => {
        if (!ai || !latestInspectionForSelectedVehicle || !isAllImagesCaptured) return;
    
        setIsGlobalComparing(true);
        setGlobalAiAnalysis('');
        setGlobalCompareError('');
    
        try {
            const base64ToPart = (dataUrl: string) => {
                const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
                if (!match) throw new Error('Invalid data URL');
                return {
                    inlineData: {
                        mimeType: match[1],
                        data: match[2]
                    }
                };
            };
            
            const oldDate = new Date(latestInspectionForSelectedVehicle.createdAt).toISOString().split('T')[0];
            const newDate = new Date().toISOString().split('T')[0];
    
            const prompt = `You are TruckVision AI, a mission-critical visual analysis partner for fleet managers. Your expertise is in commercial vehicle inspection, focusing on Mercedes-Benz MB3, MB4, and MB5 trucks. Your role is to perform high-precision comparative analysis between two images of the same truck from different inspection dates. Your mission is to provide clear, actionable insights that prioritize safety and operational integrity.

1. EXPERT DIRECTIVES & CONTEXT

Input: You will be provided with two images of a truck: Image 1 (Previous Inspection) and Image 2 (Current Inspection).

Primary Objective: Your sole purpose is to identify and report significant, actionable changes between the two images.

Focus on Impact: Differentiate between cosmetic variations (e.g., dirt, lighting, angle differences) and genuine, high-impact changes (damage, wear, missing parts). You must ignore minor, irrelevant visual noise.

Prioritize Safety: All findings with a potential safety or regulatory impact (DOT, FMCSA) must be flagged with the highest priority.

2. VISUAL ANALYSIS METHODOLOGY

Your analysis must be systematic and thorough:

Image Alignment: Account for differences in angle, lighting, and zoom to ensure a fair comparison.

Systematic Scan: Analyze the truck section by section (Front, Rear, Left Side, Right Side, etc.).

Change Detection: Identify pixel-level changes and structural differences that indicate new damage or deterioration.

Severity Calibration: Assess the severity of each finding on a scale appropriate for commercial vehicle standards.

Contextual Evaluation: Consider whether changes are due to normal wear and tear or require immediate intervention.

3. OUTPUT FORMAT & STRUCTURE

Use clear Markdown headings to structure your response. Only include sections for which you have significant findings.

### 📊 Inspection Comparison Summary

Overall Assessment: [Significant Changes Found / Minor Changes Found / No Notable Changes Found]

Safety Impact: [Critical / High / Medium / Low / None]

Recommended Action: [e.g., Immediate Repair, Schedule Maintenance, Monitor, Document Only]

Inspection Period: [Comparison between ${oldDate} and ${newDate}]

### 🚨 High-Priority Findings
(Only include this section if there are critical safety or operational issues.)

Issue: [e.g., "New, significant crack in the windshield."]

Location: [e.g., "Passenger side, lower corner."]

Risk: [e.g., "Compromises structural integrity and driver visibility, a regulatory violation."]

Action: [e.g., "Immediately ground the vehicle and schedule for windshield replacement."]

### 📋 Detailed Findings
(Group all other findings by location.)

#### Front View

Finding: [e.g., "New dent on the lower-left bumper."]

Type: Dent

Severity: Medium

Probable Cause: Impact

Action: Monitor for now, schedule for repair at next service interval.

Finding: [e.g., "Increased scuffing on the grille."]

Type: Wear

Severity: Low

Progression: Worsening

Action: Document for a trend analysis.

#### Left Side View

Finding: [e.g., "Visible deterioration of the tire sidewall on the front-left tire."]

Type: Wear

Severity: High

Progression: Worsening since previous inspection

Action: Recommend immediate tire replacement due to safety risk.

(Repeat this format for other sides if changes are found: #### Right Side View, #### Rear View)

### 💡 Expert Analysis & Limitations

Analysis Insights: [Briefly explain any patterns or trends, e.g., "The new damage pattern suggests a consistent issue with navigating tight loading docks."]

Confidence Level: [e.g., "High confidence. Findings are clear and unambiguous."]

Limitations: [Document any factors that affected the analysis, e.g., "Analysis of the rear is limited due to poor lighting in the current photo."]

Follow-up Recommendation: [e.g., "Recommend a physical inspection to confirm the severity of the tire sidewall issue."]

CRITICAL REMINDER: Your analysis directly impacts vehicle safety, operational efficiency, and maintenance costs. Focus on findings that are truly important for a fleet manager to act on. Every finding must be accurate, actionable, and prioritized by actual risk.
`;
            
            const parts: any[] = [{ text: prompt }];
            const sides: (keyof VehicleImageSet)[] = ['front', 'back', 'left', 'right'];

            for (const side of sides) {
                const oldImg = latestInspectionForSelectedVehicle.images[side];
                const newImg = currentImages[side];
                if (oldImg && newImg) {
                    parts.push({ text: `Image 1 (Previous Inspection - ${side}):` });
                    parts.push(base64ToPart(oldImg));
                    parts.push({ text: `Image 2 (Current Inspection - ${side}):` });
                    parts.push(base64ToPart(newImg));
                } else {
                    throw new Error(`Missing image data for comparison on side: ${side}`);
                }
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts },
            });
    
            setGlobalAiAnalysis(response.text);
    
        } catch (e) {
            console.error('AI comparison error:', e);
            setGlobalCompareError('Failed to get AI analysis. Please try again.');
        } finally {
            setIsGlobalComparing(false);
        }
    }, [ai, latestInspectionForSelectedVehicle, currentImages, isAllImagesCaptured]);

    const handleDownloadReport = useCallback(async () => {
        if (!analysisReportRef.current || !latestInspectionForSelectedVehicle) return;

        setIsDownloading(true);
        setGlobalCompareError('');
        
        try {
            const { jsPDF } = (window as any).jspdf;
            const canvas = await html2canvas(analysisReportRef.current, { 
                scale: 2,
                useCORS: true,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            // Header
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.setTextColor('#002D8A');
            pdf.text('Inspection Comparison Report', 15, 20);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            pdf.setTextColor('#333333');
            
            const oldDate = new Date(latestInspectionForSelectedVehicle.createdAt).toLocaleDateString();
            const newDate = new Date().toLocaleDateString();

            pdf.text(`Vehicle ID: ${selectedVehicleId}`, 15, 30);
            pdf.text(`Comparison Period: ${oldDate} to ${newDate}`, 15, 35);
            
            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, 40, pdfWidth - 15, 40);

            const contentWidth = pdfWidth - 30;
            const imgOriginalWidth = canvas.width;
            const imgOriginalHeight = canvas.height;
            const aspectRatio = imgOriginalWidth / imgOriginalHeight;
            let imgHeightInPdf = contentWidth / aspectRatio;
            
            pdf.addImage(imgData, 'PNG', 15, 45, contentWidth, imgHeightInPdf);
            
            pdf.save(`Inspection_Report_${selectedVehicleId}_${newDate.replace(/\//g, '-')}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            setGlobalCompareError("Sorry, there was an error creating the PDF report.");
        } finally {
            setIsDownloading(false);
        }
    }, [selectedVehicleId, latestInspectionForSelectedVehicle]);

    const handleSaveInspection = () => {
        if (!selectedVehicleId) return;
        setIsSubmitting(true);
        createInspection(selectedVehicleId, currentImages, currentNotes);
        
        setJustInspected({
            id: 'temp-' + Date.now(),
            createdAt: Date.now(),
            vehicleId: selectedVehicleId,
            images: currentImages,
            notes: currentNotes,
        });
        setIsSubmitting(false);
    };

    const handleCreateDamageTicket = () => {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle || !justInspected?.notes) return;
        
        const issueDescription = `Damage noted during vehicle inspection:\n${justInspected.notes}`;
        
        createTicket(
            vehicle.id,
            issueDescription,
            'Warehouse Manager',
            TicketSection.SheetMetal,
            vehicle.currentKilometers > 0 ? vehicle.currentKilometers : 1, // Ensure KM is not 0
            TicketPriority.Medium
        );

        handleVehicleSelect(''); 
    };
    
    const isInspectionComplete = Object.keys(currentImages).length === 4;

    return (
        <div className="space-y-8">
             <InspectionDashboard
                vehicles={vehicles}
                inspections={inspections}
                onStartInspection={localStartInspection}
            />

            <div ref={inspectionFormRef} className="content-container p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Conduct New Inspection</h2>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedVehicleId 
                        ? `Now inspecting vehicle: ${selectedVehicleId}. Compare with the previous inspection and record any new findings.`
                        : "Select a vehicle from the dashboard above or the dropdown below to begin an inspection."}
                </p>

                <div className="max-w-md mb-6">
                    <label htmlFor="vehicle-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Vehicle</label>
                    <select
                        id="vehicle-select"
                        value={selectedVehicleId}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        disabled={!!justInspected}
                    >
                        <option value="" disabled={!!selectedVehicleId}>-- Choose a Vehicle --</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                    </select>
                </div>
            

                {selectedVehicleId && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <InspectionDisplay 
                            inspection={latestInspectionForSelectedVehicle}
                            title="Previous Inspection"
                        />

                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                            {justInspected ? (
                                <div className="text-center bg-emerald-100 dark:bg-emerald-900/50 p-6 rounded-lg h-full flex flex-col justify-center">
                                    <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Inspection Saved!</h4>
                                    {justInspected.notes && justInspected.notes.trim() !== '' ? (
                                        <>
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
                                                Observations were logged. You can now create a maintenance ticket.
                                            </p>
                                            <button 
                                                onClick={handleCreateDamageTicket}
                                                className="btn btn-primary mt-6 inline-flex items-center gap-2 self-center"
                                            >
                                                <PlusCircleIcon />
                                                Create Damage Ticket
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
                                            No new damage was observed.
                                        </p>
                                    )}
                                    <button 
                                        onClick={() => handleVehicleSelect('')}
                                        className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                    >
                                        Start New Inspection
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">Current Inspection</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['front', 'back', 'left', 'right'] as (keyof VehicleImageSet)[]).map(side => (
                                            <ImageCaptureBox
                                                key={side}
                                                label={side.charAt(0).toUpperCase() + side.slice(1)}
                                                side={side}
                                                onImageCapture={handleImageCapture}
                                                imageSrc={currentImages[side]}
                                                disabled={!!justInspected}
                                            />
                                        ))}
                                    </div>
                                    
                                    {isAllImagesCaptured && latestInspectionForSelectedVehicle && !justInspected && (
                                        <div className="mt-4 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <button
                                                onClick={handleGlobalCompare}
                                                disabled={isGlobalComparing}
                                                className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md"
                                            >
                                                <SparklesIcon className="w-5 h-5" />
                                                {isGlobalComparing ? 'Analyzing All Sides...' : 'Compare All Sides with AI'}
                                            </button>
                                             {isGlobalComparing && (
                                                <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-300 mt-2">
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 2000/svg">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>AI is checking for new damage... This may take a moment.</span>
                                                </div>
                                            )}
                                             {globalCompareError && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{globalCompareError}</p>
                                            )}
                                            {globalAiAnalysis && (
                                                <div className="mt-4 text-left">
                                                    <div ref={analysisReportRef} className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                        <MarkdownRenderer content={globalAiAnalysis} />
                                                    </div>
                                                    <div className="text-center mt-4">
                                                        <button
                                                            onClick={handleDownloadReport}
                                                            disabled={isDownloading}
                                                            className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md"
                                                        >
                                                            <DocumentDownloadIcon className="w-5 h-5" />
                                                            {isDownloading ? 'Generating PDF...' : 'Download Report'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isInspectionComplete && (
                                        <p className="text-center text-sm text-yellow-600 dark:text-yellow-400 mt-4 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-md">
                                            All 4 photos must be captured before the inspection can be saved or analyzed.
                                        </p>
                                    )}
                                    <div>
                                        <label htmlFor="inspection-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observations / New Damage</label>
                                        <textarea
                                            id="inspection-notes"
                                            rows={4}
                                            value={currentNotes}
                                            onChange={(e) => setCurrentNotes(e.target.value)}
                                            placeholder="Note any new scratches, dents, or other damage here. If there is no new damage, leave this blank."
                                            className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveInspection}
                                            disabled={!isInspectionComplete || isSubmitting}
                                            className="btn btn-secondary inline-flex items-center justify-center py-2 px-5 text-sm font-medium rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save Inspection'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = (key: string) => {
        if (listItems.length > 0) {
            elements.push(<ul key={key} className="space-y-1 list-disc list-inside pl-4">{listItems}</ul>);
            listItems = [];
        }
    };

    const lines = content.split('\n');

    lines.forEach((line, i) => {
        const processLine = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>');
        
        if (line.startsWith('### ')) {
            flushList(`ul-before-h3-${i}`);
            elements.push(<h4 key={i} className="text-lg font-bold text-gray-800 dark:text-white mt-4 mb-2" dangerouslySetInnerHTML={{ __html: processLine(line.substring(4)) }} />);
        } else if (line.startsWith('#### ')) {
            flushList(`ul-before-h4-${i}`);
            elements.push(<h5 key={i} className="text-md font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processLine(line.substring(5)) }} />);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            listItems.push(<li key={i} className="ml-2" dangerouslySetInnerHTML={{ __html: processLine(line.substring(2)) }} />);
        } else {
            flushList(`ul-before-p-${i}`);
            if (line.trim()) {
                elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: processLine(line) }} />);
            }
        }
    });
    flushList('ul-end');
    return <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">{elements}</div>;
};

export default InspectionView;