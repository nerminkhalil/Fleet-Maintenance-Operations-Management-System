
export enum TicketSection {
  Mechanical = 'Mechanical Section',
  SheetMetal = 'Sheet Metal Sections',
  Tires = 'Tires Section',
  Cleaning = 'Cleaning Section',
}

export enum TicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  AwaitingParts = 'Awaiting Parts', // Waiting for Spares Admin
  AwaitingWarehouse = 'Awaiting Warehouse', // Waiting for Warehouse
  PendingConfirmation = 'Pending Confirmation',
  Closed = 'Closed'
}

export enum TicketPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface SparePart {
  location: string;
  sapCode: string;
  materialDescription: string;
  descriptionAr?: string;
  dept: string;
  uom: string;
  balanceOnSap: number;
}

export type PartRequestStatus = 'pending' | 'admin_approved' | 'issued' | 'rejected' | 'none' | 'warehouse_completed';

export interface PartRequest {
  serial: string;
  parts: Record<string, number>; // key: sapCode, value: quantity
  status: PartRequestStatus;
  requestedAt: number;
  adminResolvedAt?: number;
  warehouseResolvedAt?: number; // Time parts were issued
  warehouseCompletedAt?: number; // Time handover was completed
}

export interface Ticket {
  id: string;
  serial: string;
  vehicleId: string;
  issue: string;
  reportedBy: string;
  section: TicketSection;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: number; // timestamp
  kilometers: number;
  location?: string; // GPS coordinates
  startedAt?: number; // timestamp
  closedAt?: number; // timestamp (work completed by maintenance)
  confirmedAt?: number; // timestamp (work confirmed by operations)
  assignedTo?: string[]; // Names of assigned technicians
  partRequest?: PartRequest;
  workDoneNotes?: string;
}

export interface Vehicle {
  id: string; // e.g., 'HD-105'
  currentKilometers: number;
  lastEngineServiceKm: number;
  lastTransmissionServiceKm: number;
}

export interface VehicleImageSet {
  front?: string; // Base64 data URL
  back?: string;
  left?: string;
  right?: string;
}

export interface Inspection {
  id: string; // timestamp
  vehicleId: string;
  createdAt: number;
  images: VehicleImageSet;
  notes: string;
}

export enum View {
  Operations = 'operations',
  Maintenance = 'maintenance',
  SparesAdmin = 'sparesAdmin',
  Warehouse = 'warehouse',
  Admin = 'admin',
  Inspection = 'inspection',
  SuperAdmin = 'superAdmin',
}

export type HistoryFilterType = 'vehicle' | 'technician' | 'driver' | 'category' | 'date';

export enum UserRole {
  Operations = 'Operations',
  Maintenance = 'Maintenance',
  Inspection = 'Inspection',
  SparesAdmin = 'Spares Admin',
  Warehouse = 'Warehouse',
  Admin = 'Admin',
  SuperAdmin = 'Super Admin',
}

export interface User {
  id: string; // Employee ID
  name: string;
  role: UserRole;
}

export interface Notification {
  id: string;
  userId: string;
  ticketId: string;
  ticketSerial: string;
  message: string;
  createdAt: number;
  read: boolean;
}