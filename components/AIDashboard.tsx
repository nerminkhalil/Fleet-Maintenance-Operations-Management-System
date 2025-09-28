import React, { useState, useCallback } from 'react';
import type { GoogleGenAI } from "@google/genai";
import { Ticket } from '../types';
import { SparklesIcon } from './icons';

interface AIDashboardProps {
  tickets: Ticket[];
  ai: GoogleGenAI;
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

        // Use regex for robust bolding
        const processLine = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-700 dark:text-gray-300">$1</strong>');

        if (line.startsWith('### ')) {
            flushList(`ul-before-h3-${i}`);
            elements.push(<h3 key={i} className="text-xl font-bold text-gray-800 dark:text-white mt-6 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2" dangerouslySetInnerHTML={{ __html: processLine(line.substring(4)) }} />);
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: processLine(line.substring(2)) }} />);
        } else {
            flushList(`ul-before-p-${i}`);
            if (line) { // Only add non-empty paragraphs
                elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: processLine(line) }} />);
            }
        }
    });

    flushList('ul-end'); // Flush any remaining list items at the end

    return <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">{elements}</div>;
};


const AIDashboard: React.FC<AIDashboardProps> = ({ tickets, ai }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    const allTicketsData = JSON.stringify(tickets.map(t => ({
        ticketSerial: t.serial,
        vehicleId: t.vehicleId,
        reportedIssue: t.issue,
        maintenanceSection: t.section,
        status: t.status,
        priority: t.priority,
        dateCreated: new Date(t.createdAt).toISOString(),
        dateClosed: t.closedAt ? new Date(t.closedAt).toISOString() : null,
        resolutionNotes: t.workDoneNotes,
        partsUsed: t.partRequest?.parts ? Object.keys(t.partRequest.parts) : [],
    })), null, 2);

    const prompt = `Your Core Mission

You are FleetHealth AI, a mission-critical advisor for fleet managers with 25+ years of experience in commercial vehicle analytics. Your expertise is in converting complex fleet data—including live telemetry, maintenance history, and trouble tickets—into clear, actionable intelligence. Your core mission is to empower managers with insights that drive proactive decisions, ensuring maximum fleet uptime, cost optimization, and operational excellence. You must prioritize the most impactful insights, presenting them first for rapid consumption.

Input Data & Context

The user will provide a comprehensive dataset that you must analyze. This data will include:

- **Ticket & Work Order History**: A full history of maintenance tickets, including descriptions of issues, resolutions, and outcomes. This is the primary source of data for your analysis.
- **Context**: The provided data does not include live telemetry, specific fault codes, labor hours, costs, or operational history like routes and load data. Your analysis must be grounded solely in the ticket data provided below.

Here is the full dataset in JSON format:
${allTicketsData}

Analytical Directives & Persona

Expert Persona: Maintain the persona of a seasoned fleet management expert. Use professional, concise language. Support all recommendations with data-driven reasoning.

Dynamic Analysis: You must be capable of generating a full, detailed report.

Contextual Focus: The user has requested a general fleet health analysis.

Actionable Intelligence: Every insight you provide must include specific, actionable steps or recommendations for the fleet manager.

Efficiency: Do not include sections where no relevant data or issues are found. Keep the report focused on what is most important.

Output Structure & Format

Use clear Markdown headings to structure your response. Lead with the most critical information, then provide detailed analysis and strategic recommendations.

### 📊 Fleet Health Overview

**Overall Fleet Health:** [Score/100, e.g., 85/100] – [Status, e.g., Excellent, Fair]

**Trend:** [Direction, e.g., Improving, Declining]

**Key Insight:** [A concise, single-sentence summary of the most important finding, e.g., "Recurring transmission issues are the primary driver of unscheduled downtime."]

### 🚨 Urgent Action Required
(Only include if vehicles need immediate attention. You must reference ticket history to identify critical issues based on patterns of high-priority tickets or repeated unresolved issues.)

**Vehicle ID:** [Vehicle identifier]

**Primary Concern:** [Main issue, e.g., "Repeated high-priority tickets for the braking system."]

**Business Impact:** [Consequences, e.g., "High risk of safety incidents and unscheduled downtime."]

**Recommendation:** [Specific, clear action, e.g., "Immediately schedule this vehicle for a comprehensive diagnostic of the braking system. Review past resolutions for tickets [list serials] to identify ineffective repairs."]

### 📈 Detailed Analytics

**Maintenance Cost Analysis:** (As cost data is unavailable, focus on the frequency of repairs as a proxy for cost). Break down repair frequency trends, identify vehicles with the most tickets, and highlight budget impacts in terms of repeated maintenance.

**Recurring Issue Patterns:** Highlight systemic problems, model-specific failures (e.g., recurring issues in HD-series vs FB-series trucks), and age-related degradation. Use work ticket history to identify common themes across the fleet.

**Uptime & Performance:** (As direct uptime data is unavailable, use the number of 'Open' and 'In Progress' tickets as a proxy for downtime). Report on fleet availability, downtime hotspots, and operational impact. Correlate downtime with specific historical repair events and ticket closures.

### 🎯 Strategic Recommendations

**Short-Term Actions (0-30 days):** Specific, actionable steps for resource allocation and immediate issue resolution, informed by ticket history and current data.

**Long-Term Strategy (3+ months):** Recommendations for preventive maintenance, fleet lifecycle management, and budget planning based on all historical trends.

### 💡 Management Insights

**Efficiency Opportunities:** Highlight specific areas for workflow or process improvements identified from analyzing ticket resolution times (time between 'createdAt' and 'closedAt') and repeated repair attempts on similar issues.

**Risk Mitigation:** Identify single points of failure (e.g., a critical truck that is prone to issues) and strategies to prevent cascading issues, using historical fault data to predict future risks.
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      setAnalysisResult(response.text);

    } catch (e) {
      console.error("AI Analysis Error:", e);
      setError("An error occurred while analyzing the fleet data. The AI may be unavailable or the data could not be processed. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [tickets, ai]);

  return (
    <div className="content-container p-6 rounded-xl shadow-lg">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
            AI Fleet Health Dashboard
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-wait inline-flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
             <>
                <SparklesIcon />
                Analyze Fleet Health
             </>
          )}
        </button>
      </div>

      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-sm">{error}</p>}

      {!isLoading && !analysisResult && (
        <div className="text-center py-8 px-4 text-gray-500 dark:text-gray-400">
            <p>Click "Analyze Fleet Health" to get AI-powered insights on recurring vehicle issues.</p>
        </div>
      )}
      
      {analysisResult && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <MarkdownRenderer content={analysisResult} />
        </div>
      )}
    </div>
  );
};

export default AIDashboard;