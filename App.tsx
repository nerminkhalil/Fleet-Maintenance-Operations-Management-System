import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Ticket, TicketStatus, View, TicketSection, PartRequest, SparePart, Vehicle, TicketPriority, Inspection, VehicleImageSet, User, UserRole, Notification } from './types';
import Header from './components/Header';
import OperationsView from './components/OperationsView';
import MaintenanceView from './components/MaintenanceView';
import SparesAdminView from './components/SparesAdminView';
import WarehouseView from './components/WarehouseView';
import AdminView from './components/AdminView';
import SuperAdminView from './components/SuperAdminView';
import InspectionView from './components/InspectionView';
import { initialSpareParts } from './data/spareParts';
import { initialVehicleData } from './data/vehicles';
import { initialTechnicians } from './data/technicians';
import { initialUsers } from './data/users';

const initialTickets: Ticket[] = [
     {
        id: '1',
        serial: 'TICKET-20231026-T800',
        vehicleId: 'HD-105',
        issue: 'Engine is making a rattling noise on startup.',
        reportedBy: 'Alice',
        section: TicketSection.Mechanical,
        status: TicketStatus.Open,
        priority: TicketPriority.High,
        createdAt: new Date('2023-10-26T08:00:00Z').getTime(),
        kilometers: 152345,
        assignedTo: [],
        location: 'Main Garage',
    },
    {
        id: '2',
        serial: 'TICKET-20231025-T430',
        vehicleId: 'FB-505',
        issue: 'Brake pads need replacement. Squealing sound when braking.',
        reportedBy: 'Bob',
        section: TicketSection.Mechanical,
        status: TicketStatus.InProgress,
        priority: TicketPriority.High,
        createdAt: new Date('2023-10-25T14:30:00Z').getTime(),
        startedAt: new Date('2023-10-26T09:15:00Z').getTime(),
        kilometers: 210112,
        assignedTo: ['Mohamed Gomaa Mohamed (73997)', 'Ahmed Emad Eldem Ahmed (162600)'],
    },
    {
        id: '7',
        serial: 'TICKET-20231026-T400',
        vehicleId: 'HD-117',
        issue: 'Suspension check required.',
        reportedBy: 'Grace',
        section: TicketSection.Mechanical,
        status: TicketStatus.InProgress,
        priority: TicketPriority.Medium,
        createdAt: new Date('2023-10-26T14:00:00Z').getTime(),
        startedAt: new Date('2023-10-26T14:15:00Z').getTime(),
        kilometers: 95480,
        assignedTo: ['Amr Ibrahim Hussien Mohamed Salam (379786)'],
        partRequest: {
            serial: 'REQ-7',
            parts: { 'ALT-010': 1 },
            status: 'issued',
            requestedAt: new Date('2023-10-26T14:30:00Z').getTime(),
            adminResolvedAt: new Date('2023-10-26T15:00:00Z').getTime(),
            warehouseResolvedAt: new Date('2023-10-26T15:10:00Z').getTime(),
        }
    },
    {
        id: '6',
        serial: 'TICKET-20231026-T100',
        vehicleId: 'HD-110',
        issue: 'Exhaust system inspection.',
        reportedBy: 'Frank',
        section: TicketSection.Mechanical,
        status: TicketStatus.AwaitingWarehouse,
        priority: TicketPriority.Low,
        createdAt: new Date('2023-10-26T11:00:00Z').getTime(),
        startedAt: new Date('2023-10-26T11:15:00Z').getTime(),
        kilometers: 189731,
        assignedTo: ['Hesham Mohamed Abd-Elhameed (126416)'],
        partRequest: {
            serial: 'REQ-6',
            parts: { 'OF-002': 2, 'AF-008': 1 },
            status: 'admin_approved',
            requestedAt: new Date('2023-10-26T11:30:00Z').getTime(),
            adminResolvedAt: new Date('2023-10-26T12:00:00Z').getTime(),
        }
    },
     {
        id: '4',
        serial: 'TICKET-20231023-T100',
        vehicleId: 'SL-301',
        issue: 'A/C is not cooling. Needs refrigerant check.',
        reportedBy: 'Charlie',
        section: TicketSection.Mechanical,
        status: TicketStatus.PendingConfirmation,
        priority: TicketPriority.Medium,
        createdAt: new Date('2023-10-23T11:00:00Z').getTime(),
        startedAt: new Date('2023-10-23T13:00:00Z').getTime(),
        closedAt: new Date('2023-10-23T15:30:00Z').getTime(),
        kilometers: 301255,
        assignedTo: ['Khaled Saber Ewas Abdelrazek (305371)'],
        workDoneNotes: 'Replaced AC compressor and recharged refrigerant. System now cools effectively.',
        partRequest: {
            serial: 'REQ-4',
            parts: { 'ACR-003': 1, 'ACC-004': 1 },
            status: 'warehouse_completed',
            requestedAt: new Date('2023-10-23T13:30:00Z').getTime(),
            adminResolvedAt: new Date('2023-10-23T14:00:00Z').getTime(),
            warehouseResolvedAt: new Date('2023-10-23T14:15:00Z').getTime(),
            warehouseCompletedAt: new Date('2023-10-23T14:25:00Z').getTime(),
        }
    },
    {
        id: '5',
        serial: 'TICKET-20231026-T000',
        vehicleId: 'HD-114',
        issue: 'Cracked windshield.',
        reportedBy: 'David',
        section: TicketSection.SheetMetal,
        status: TicketStatus.AwaitingParts,
        priority: TicketPriority.Medium,
        createdAt: new Date('2023-10-26T10:00:00Z').getTime(),
        startedAt: new Date('2023-10-26T10:15:00Z').getTime(),
        kilometers: 145889,
        assignedTo: ['Ahmed Rehan Ahmed Abdelrehem (148269)'],
        partRequest: {
            serial: 'REQ-5',
            parts: { 'WSH-005': 1 },
            status: 'pending',
            requestedAt: new Date('2023-10-26T10:30:00Z').getTime(),
        },
        location: 'Lat: 30.044420, Lon: 31.235712',
    },
    {
        id: '3',
        serial: 'TICKET-20231024-