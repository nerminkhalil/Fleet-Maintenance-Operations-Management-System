import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { PlusCircleIcon, LocationMarkerIcon, SparklesIcon, XCircleIcon } from './icons';
import { TicketSection, Vehicle, TicketPriority, User } from '../types';

interface NewTicketFormProps {
  vehicles: Vehicle[];
  createTicket: (vehicleId: string, issue: string, reportedBy: string, section: TicketSection, kilometers: number, priority: TicketPriority, location?: string) => void;
  currentUser: User;
  ai: GoogleGenAI;
}

const NewTicketForm: React.FC<NewTicketFormProps> = ({ vehicles, createTicket, currentUser, ai }) => {
  const [vehicleId, setVehicleId] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [issue, setIssue] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [section, setSection] = useState<TicketSection | ''>('');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.Medium);
  const [location, setLocation] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [error, setError] = useState('');

  const [aiInput, setAiInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isAiPopulated, setIsAiPopulated] = useState(false);

  useEffect(() => {
    setReportedBy(currentUser.name);
  }, [currentUser]);

  const groupedVehicles = useMemo(() => {
    return vehicles.reduce((acc, vehicle) => {
      const prefix = vehicle.id.split('-')[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(vehicle.id);
      return acc;
    }, {} as Record<string, string[]>);
  }, [vehicles]);

  const clearForm = () => {
    setVehicleId('');
    setKilometers('');
    setIssue('');
    setSection('');
    setPriority(TicketPriority.Medium);
    setLocation('');
    setError('');
    setAiInput('');
    setIsAiPopulated(false);
    setAiError('');
  };

  const handleParseWithAI = async () => {
    if (!aiInput.trim()) return;

    setIsParsing(true);
    setAiError('');

    const validVehicleIds = vehicles.map(v => v.id);
    const validSections = Object.values(TicketSection);
    const validPriorities = Object.values(TicketPriority);

    const schema = {
      type: Type.OBJECT,
      properties: {
        vehicleId: { type: Type.STRING, description: `The vehicle ID. It must be one of: ${validVehicleIds.join(', ')}` },
        issue: { type: Type.STRING, description: 'A detailed description of the reported problem.' },
        section: { type: Type.STRING, description: `The maintenance section. It must be one of: ${validSections.join(', ')}` },
        priority: { type: Type.STRING, description: `The priority level. It must be one of: ${validPriorities.join(', ')}.` },
        kilometers: { type: Type.NUMBER, description: 'The vehicle kilometers, if mentioned.' }
      },
      required: ["vehicleId", "issue", "section", "priority"]
    };

    const prompt = `
      You are an intelligent assistant for a fleet maintenance system. Parse the user's natural language input to create a structured maintenance ticket.
      Analyze the user's text and extract the required information according to the provided schema.
      - **vehicleId**: Find the vehicle ID mentioned in the text. It must be an exact match from the list of valid IDs.
      - **issue**: Capture the full description of the problem.
      - **section**: Infer the correct section based on keywords. Examples: 'engine', 'brakes', 'noise' -> Mechanical Section; 'dented', 'scratch', 'paint' -> Sheet Metal Sections; 'tire', 'flat' -> Tires Section; 'wash', 'clean' -> Cleaning Section.
      - **priority**: Infer the priority. Use 'High' for words like 'urgent', 'immediately', 'critical', 'breakdown'. Use 'Low' for routine checks or minor issues like 'check-up', 'wash'. Otherwise, default to 'Medium'.
      - **kilometers**: Extract the numerical value for the vehicle's kilometers if mentioned.

      User Input: "${aiInput}"
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      
      const parsedData = JSON.parse(response.text);

      if (parsedData.vehicleId && validVehicleIds.includes(parsedData.vehicleId)) {
          setVehicleId(parsedData.vehicleId);
      }
      if (parsedData.issue) setIssue(parsedData.issue);
      if (parsedData.section && validSections.includes(parsedData.section)) {
          setSection(parsedData.section);
      }
      if (parsedData.priority && validPriorities.includes(parsedData.priority)) {
          setPriority(parsedData.priority);
      }
      if (parsedData.kilometers) {
          setKilometers(String(parsedData.kilometers));
      }
      
      setIsAiPopulated(true);

    } catch (e) {
      console.error("AI Parsing Error:", e);
      setAiError("Could not parse the request. Please try rephrasing or fill the form manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
    }
    setIsFetchingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
            setIsFetchingLocation(false);
        },
        () => {
            setError('Unable to retrieve location. Please check your browser permissions.');
            setIsFetchingLocation(false);
        }
    );
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseInt(kilometers, 10);
    if (!vehicleId.trim() || !issue.trim() || !reportedBy.trim() || !section || !kilometers.trim() || isNaN(km) || km < 0) {
      setError('All fields are required and kilometers must be a valid positive number.');
      return;
    }
    createTicket(vehicleId, issue, reportedBy, section, km, priority, location);
    clearForm();
  };

  const isFormInvalid = !vehicleId.trim() || !issue.trim() || !section || !kilometers.trim();

  return (
    <div className="content-container p-6 rounded-xl shadow-lg mb-8">
        <div className="mb-8 p-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                <SparklesIcon /> AI Assistant Ticket Creator
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">Describe the issue in one sentence. The AI will parse it and fill out the form for you.</p>
            <div className="flex gap-2">
                <textarea
                    rows={2}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="e.g., The brakes on HD-105 are squealing loudly and it's urgent, kilometers are around 152,000"
                    className="input-style flex-grow"
                    disabled={isParsing}
                />
                <button
                    type="button"
                    onClick={handleParseWithAI}
                    disabled={isParsing || !aiInput.trim()}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 disabled:bg-indigo-400"
                >
                    {isParsing ? 'Parsing...' : 'Parse with AI'}
                </button>
            </div>
            {aiError && <p className="text-red-500 text-sm mt-2">{aiError}</p>}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
            <span className="bg-blue-500/10 p-2 rounded-lg">
                <PlusCircleIcon className="w-6 h-6 text-blue-500" />
            </span>
            Create New Maintenance Ticket
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle ID</label>
                    <select
                        id="vehicleId"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    >
                        <option value="" disabled>Select a vehicle</option>
                        {Object.entries(groupedVehicles).map(([prefix, codes]) => (
                            <optgroup key={prefix} label={`${prefix} Series`}>
                                {codes.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="kilometers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Kilometers</label>
                    <input
                        type="number"
                        id="kilometers"
                        value={kilometers}
                        onChange={(e) => setKilometers(e.target.value)}
                        placeholder="e.g., 125000"
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="reportedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reported By</label>
                    <input
                        type="text"
                        id="reportedBy"
                        value={reportedBy}
                        onChange={(e) => setReportedBy(e.target.value)}
                        placeholder="e.g., John Doe"
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        readOnly
                    />
                </div>
                 <div>
                    <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                    <select
                        id="section"
                        value={section}
                        onChange={(e) => setSection(e.target.value as TicketSection)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    >
                        <option value="" disabled>Select a section</option>
                        {Object.values(TicketSection).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                    >
                        {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>
            
             <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (Optional)</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                        type="text"
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Site Entrance or captured GPS coordinates"
                        className="input-style flex-1 block w-full min-w-0 rounded-none rounded-l-md py-2 px-3 sm:text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600/50 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-50 dark:hover:bg-gray-500/80 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        title="Capture Current GPS Location"
                    >
                        <LocationMarkerIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div>
                <label htmlFor="issue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Description</label>
                <textarea
                    id="issue"
                    rows={3}
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="input-style mt-1 block w-full rounded-md shadow-sm py-2 px-3 sm:text-sm"
                ></textarea>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
                 <button
                    type="button"
                    onClick={clearForm}
                    className="inline-flex justify-center items-center py-2 px-5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Clear
                </button>
                <button
                    type="submit"
                    className="btn btn-primary inline-flex justify-center items-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isFormInvalid}
                >
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Submit Ticket
                </button>
            </div>
        </form>
    </div>
  );
};

export default React.memo(NewTicketForm);