import { Vehicle } from '../types';

const vehicleIdList = [
  'HD-105', 'HD-106', 'TP-419', 'HD-107', 'HD-108', 'FB-505', 'TP-404', 'TP-420', 'FB-506',
  'HD-102', 'HD-116', 'FB-503', 'HD-114', 'HD-138', 'TP-407', 'HD-139', 'HD-109', 'HD-103',
  'HD-101', 'TP-403', 'HD-112', 'TP-405', 'FB-509', 'TP-401', 'SL-301', 'FB-501', 'TP-406',
  'HD-113', 'FB-510', 'FB-508', 'FB-507', 'HD-104', 'FB-504', 'FB-502', 'TP-402', 'HD-111',
  'HD-117', 'HD-133', 'SL-304', 'HD-135', 'HD-119', 'HD-136', 'HD-122', 'HD-127', 'HD-125',
  'HD-121', 'HD-118', 'HD-124', 'HD-132', 'HD-120', 'HD-131', 'FB-518', 'HD-134', 'SL-302',
  'HD-115', 'HD-130', 'FB-527', 'HD-137', 'HD-128', 'FB-526', 'HD-129', 'FB-523', 'HD-126',
  'TP-416', 'FB-517', 'FB-520', 'HD-141', 'FB-521', 'HD-142', 'HD-140', 'SL-303', 'TP-409',
  'FB-511', 'TP-410', 'TP-415', 'TP-414', 'TP-408', 'FB-513', 'FB-516', 'FB-515', 'FB-528',
  'FB-522', 'SL-305', 'FB-525', 'FB-514', 'FB-524', 'FB-519', 'TP-422', 'FB-532', 'TP-418',
  'TP-417', 'FB-530', 'TP-425', 'TP-421', 'TP-424', 'TP-423', 'TP-411', 'FB-531', 'HD-110'
];

export const initialVehicleData: Vehicle[] = vehicleIdList
    .map(id => ({
        id,
        currentKilometers: 0,
        lastEngineServiceKm: 0,
        lastTransmissionServiceKm: 0,
    }))
    .sort((a, b) => {
        const prefixOrder: Record<string, number> = { 'HD': 1, 'TP': 2, 'FB': 3, 'SL': 4 };
        const [prefixA, numAStr] = a.id.split('-');
        const [prefixB, numBStr] = b.id.split('-');
        const orderA = prefixOrder[prefixA] || 99;
        const orderB = prefixOrder[prefixB] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return parseInt(numAStr, 10) - parseInt(numBStr, 10);
    });
