import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, onClick, isActive }) => {
  const interactiveClasses = onClick 
    ? 'cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1' 
    : '';
  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : '';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`bg-white dark:bg-gray-800 flex items-center p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full text-left ${interactiveClasses} ${activeClasses}`}
    >
      <div className={`p-3 rounded-lg mr-4 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </button>
  );
};

export default React.memo(StatCard);