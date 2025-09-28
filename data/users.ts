import { User, UserRole } from '../types';

export const initialUsers: User[] = [
    { id: 'superadmin01', name: 'Super Admin User', role: UserRole.SuperAdmin },
    { id: 'admin01', name: 'Admin User', role: UserRole.Admin },
    { id: 'ops01', name: 'Fleet Operations User', role: UserRole.Operations },
    { id: 'maint01', name: 'Maintenance User', role: UserRole.Maintenance },
    { id: 'insp01', name: 'Vehicle Inspector User', role: UserRole.Inspection },
    { id: 'spares01', name: 'Spares Admin User', role: UserRole.SparesAdmin },
    { id: 'wh01', name: 'Warehouse User', role: UserRole.Warehouse },
];