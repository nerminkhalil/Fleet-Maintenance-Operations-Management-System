import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, User, UserRole, Notification } from '../types';
import { ClipboardListIcon, WrenchIcon, ArchiveBoxIcon, CubeIcon, CogIcon, CameraIcon, UserCircleIcon, UsersIcon, BellIcon } from './icons';
import { ArabianCementLogo } from './Logo';
import { formatTimeAgo } from '../utils/time';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
  allUsers: User[];
  notifications: Notification[];
  onSetCurrentUser: (userId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView, setCurrentView, currentUser, allUsers, notifications, 
  onSetCurrentUser, onMarkAsRead, onMarkAllAsRead 
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const baseButtonClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 dark:focus:ring-offset-gray-900";
  const activeButtonClasses = "bg-white/10 text-white ring-2 ring-white/20";
  const inactiveButtonClasses = "text-gray-300 hover:bg-white/5 hover:text-white";

  const viewPermissions: Record<View, UserRole[]> = {
    [View.Operations]: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations, UserRole.Inspection],
    [View.Maintenance]: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Maintenance],
    [View.Inspection]: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Operations, UserRole.Inspection],
    [View.SparesAdmin]: [UserRole.SuperAdmin, UserRole.Admin, UserRole.SparesAdmin],
    [View.Warehouse]: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Warehouse],
    [View.Admin]: [UserRole.SuperAdmin, UserRole.Admin],
    [View.SuperAdmin]: [UserRole.SuperAdmin],
  };

  const canView = (view: View) => viewPermissions[view].includes(currentUser.role);
  
  const userNotifications = useMemo(() => {
      return notifications
          .filter(n => n.userId === currentUser.id)
          .sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications, currentUser.id]);

  const unreadCount = useMemo(() => {
      return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setIsPopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  return (
    <header className="bg-[#002D8A] dark:bg-gray-900/70 dark:backdrop-blur-lg dark:border-b dark:border-gray-700/50 text-white p-4 shadow-lg no-print sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <ArabianCementLogo className="h-12 w-auto" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight hidden md:block">Fleet Maintenance Tracker</h1>
        </div>
        <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-1 bg-black/20 p-1 rounded-lg">
                {canView(View.Operations) && <button
                    onClick={() => setCurrentView(View.Operations)}
                    className={`${baseButtonClasses} ${currentView === View.Operations ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Fleet Operations"
                >
                    <ClipboardListIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Fleet Ops</span>
                </button>}
                {canView(View.Maintenance) && <button
                    onClick={() => setCurrentView(View.Maintenance)}
                    className={`${baseButtonClasses} ${currentView === View.Maintenance ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Maintenance"
                >
                    <WrenchIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Maintenance</span>
                </button>}
                {canView(View.Inspection) && <button
                    onClick={() => setCurrentView(View.Inspection)}
                    className={`${baseButtonClasses} ${currentView === View.Inspection ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Vehicle Inspection"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Inspection</span>
                </button>}
                {canView(View.SparesAdmin) && <button
                    onClick={() => setCurrentView(View.SparesAdmin)}
                    className={`${baseButtonClasses} ${currentView === View.SparesAdmin ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Spares Admin"
                >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Spares Admin</span>
                </button>}
                {canView(View.Warehouse) && <button
                    onClick={() => setCurrentView(View.Warehouse)}
                    className={`${baseButtonClasses} ${currentView === View.Warehouse ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Warehouse"
                >
                    <CubeIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Warehouse</span>
                </button>}
                {canView(View.Admin) && <button
                    onClick={() => setCurrentView(View.Admin)}
                    className={`${baseButtonClasses} ${currentView === View.Admin ? activeButtonClasses : inactiveButtonClasses}`}
                    title="Admin"
                >
                    <CogIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">Admin</span>
                </button>}
                {canView(View.SuperAdmin) && <button
                    onClick={() => setCurrentView(View.SuperAdmin)}
                    className={`${baseButtonClasses} ${currentView === View.SuperAdmin ? activeButtonClasses : inactiveButtonClasses}`}
                    title="System Admin"
                >
                    <UsersIcon className="w-5 h-5" />
                    <span className="hidden lg:inline">System Admin</span>
                </button>}
            </nav>
             <div ref={popoverRef} className="relative">
                <button 
                    onClick={() => setIsPopoverOpen(prev => !prev)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
                    aria-label="Toggle notifications"
                >
                    <BellIcon className="w-6 h-6"/>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#002D8A] dark:ring-gray-900" />
                    )}
                </button>
                {isPopoverOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                             <h4 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h4>
                             {unreadCount > 0 && (
                                <button onClick={onMarkAllAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all as read</button>
                             )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {userNotifications.length > 0 ? (
                                userNotifications.map(n => (
                                    <div 
                                        key={n.id}
                                        onClick={() => onMarkAsRead(n.id)}
                                        className={`p-3 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">No new notifications.</p>
                            )}
                        </div>
                    </div>
                )}
             </div>

            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                <UserCircleIcon className="w-5 h-5 ml-1.5 text-gray-300"/>
                <select 
                    value={currentUser.id}
                    onChange={(e) => onSetCurrentUser(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium border-none focus:ring-0 cursor-pointer"
                    aria-label="Select user"
                >
                    {allUsers.map(user => (
                        <option key={user.id} value={user.id} className="text-black">{user.name} ({user.role})</option>
                    ))}
                </select>
            </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);