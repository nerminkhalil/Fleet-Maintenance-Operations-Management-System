import React from 'react';

// Reverted to a working placeholder logo to fix application preview.
// This logo uses the requested blue and green theme.
export const ArabianCementLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 200 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 0 C -10 10, -10 30, 10 40 C 20 30, 20 10, 10 0 Z"
                fill="#009A44" // Emerald green for a leaf-like shape
            />
            <rect x="30" y="0" width="170" height="40" rx="3" fill="#002D8A" />
            <text x="38" y="25" fontFamily="sans-serif" fontSize="14" fill="white" fontWeight="bold">
                Fleet Maintenance
            </text>
        </svg>
    );
};
