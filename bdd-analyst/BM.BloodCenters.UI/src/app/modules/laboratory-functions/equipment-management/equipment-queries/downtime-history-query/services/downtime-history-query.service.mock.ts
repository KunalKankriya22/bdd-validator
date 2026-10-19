import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  DowntimeHistoryResponse,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup,
  DowntimeHistoryParamsDto
} from '../models/downtime-history-query.model';

/**
 * Mock Service for Downtime History Query
 * Use this when backend is not available
 *
 * To enable: In downtime-history-query.ts, change providers to:
 * providers: [{ provide: DowntimeHistoryQueryService, useClass: DowntimeHistoryQueryServiceMock }]
 */
@Injectable()
export class DowntimeHistoryQueryServiceMock {

  /**
   * Mock equipment types data
   */
  private mockEquipmentTypes: EquipmentTypeLookup[] = [
    { code: 'CENT', description: 'Centrifuge' },
    { code: 'FRZR', description: 'Freezer' },
    { code: 'REFR', description: 'Refrigerator' },
    { code: 'INCB', description: 'Incubator' },
    { code: 'STRL', description: 'Sterilizer' },
    { code: 'SEAL', description: 'Tube Sealer' }
  ];

  /**
   * Mock equipment IDs by type
   */
  private mockEquipmentIds: { [key: string]: EquipmentIdLookup[] } = {
    'CENT': [
      { code: '9ABC', description: '9ABC - EQ-000230' },
      { code: '0001', description: '0001 - 000000001' },
      { code: '0002', description: '0002 - 000000002' },
      { code: '0003', description: '0003 - 000000003' }
    ],
    'FRZR': [
      { code: 'F001', description: 'F001 - 000000010' },
      { code: 'F002', description: 'F002 - 000000011' }
    ],
    'REFR': [
      { code: 'R001', description: 'R001 - 000000020' }
    ],
    'INCB': [
      { code: 'I001', description: 'I001 - 000000030' },
      { code: 'I002', description: 'I002 - 000000031' }
    ]
  };

  /**
   * Mock downtime history data
   */
  private mockDowntimeHistory = [
    {
      eventReference: 'DT-000001',
      equipType: 'CENT',
      equipId: '9ABC',
      equipReference: 'EQ-000230',
      equipStatus: 'NEW',
      downtimeCode: 'MAIN',
      downtimeDescription: 'Routine Maintenance',
      downtimeStart: '2024-04-09T14:01:00',
      downtimeEnd: '2024-04-12T07:00:00',
      downtimeFlag: 'N',
      serviceType: 'BASIC',
      serviceTypeDescription: 'Routine Service',
      servicePerson: 'Tanya Miller',
      serviceCompany: null,
      serviceStart: '2024-04-09T14:15:00',
      serviceEnd: '2024-04-09T17:45:00',
      scheduledEvent: 'Y',
      qcReference: null
    },
    {
      eventReference: 'DT-000002',
      equipType: 'CENT',
      equipId: '9ABC',
      equipReference: 'EQ-000230',
      equipStatus: 'NEW',
      downtimeCode: 'REPAR',
      downtimeDescription: 'Repairs',
      downtimeStart: '2024-04-14T21:00:00',
      downtimeEnd: '2024-04-15T22:00:00',
      downtimeFlag: 'Y',
      serviceCode: 'REPAR',
      serviceDescription: 'Service call repairs',
      servicePerson: 'George Smith',
      serviceCompany: null,
      serviceStart: '2024-04-14T21:00:00',
      serviceEnd: '2024-04-15T22:00:00',
      scheduledEvent: 'Y',
      qcReference: null
    },
    {
      eventReference: 'DT-000003',
      equipType: 'CENT',
      equipId: '0001',
      equipReference: '000000001',
      equipStatus: 'IN',
      downtimeCode: 'EMERG',
      downtimeDescription: 'Emergency Repair',
      downtimeStart: '2024-05-10T08:30:00',
      downtimeEnd: '2024-05-10T18:00:00',
      downtimeFlag: 'N',
      serviceCode: 'EMERG',
      serviceDescription: 'Emergency Service',
      servicePerson: 'John Davis',
      serviceCompany: 'TechServ Inc',
      serviceStart: '2024-05-10T09:00:00',
      serviceEnd: '2024-05-10T17:30:00',
      scheduledEvent: 'N',
      qcReference: null
    },
    {
      eventReference: 'DT-000004',
      equipType: 'FRZR',
      equipId: 'F001',
      equipReference: '000000010',
      equipStatus: 'IN',
      downtimeCode: 'CALIB',
      downtimeDescription: 'Calibration',
      downtimeStart: '2024-03-15T10:00:00',
      downtimeEnd: '2024-03-15T14:00:00',
      downtimeFlag: 'Y',
      serviceCode: 'CALIB',
      serviceDescription: 'Calibration Check',
      servicePerson: 'Sarah Wilson',
      serviceCompany: null,
      serviceStart: '2024-03-15T10:15:00',
      serviceEnd: '2024-03-15T13:45:00',
      scheduledEvent: 'Y',
      qcReference: 'QC-2024-001'
    },
    {
      eventReference: 'DT-000005',
      equipType: 'REFR',
      equipId: 'R001',
      equipReference: '000000020',
      equipStatus: 'IN',
      downtimeCode: 'CLEAN',
      downtimeDescription: 'Deep Cleaning',
      downtimeStart: '2024-02-20T07:00:00',
      downtimeEnd: '2024-02-20T11:00:00',
      downtimeFlag: 'Y',
      serviceCode: null,
      serviceDescription: null,
      servicePerson: null,
      serviceCompany: null,
      serviceStart: null,
      serviceEnd: null,
      scheduledEvent: 'Y',
      qcReference: null
    },
    {
      eventReference: 'DT-000006',
      equipType: 'CENT',
      equipId: '0002',
      equipReference: '000000002',
      equipStatus: 'IN',
      downtimeCode: 'UPGRD',
      downtimeDescription: 'System Upgrade',
      downtimeStart: '2024-06-01T00:00:00',
      downtimeEnd: '2024-06-01T08:00:00',
      downtimeFlag: 'Y',
      serviceCode: 'UPGRD',
      serviceDescription: 'Software Upgrade',
      servicePerson: 'Tech Support',
      serviceCompany: 'Manufacturer Inc',
      serviceStart: '2024-06-01T01:00:00',
      serviceEnd: '2024-06-01T07:30:00',
      scheduledEvent: 'Y',
      qcReference: null
    },
    {
      eventReference: 'DT-000007',
      equipType: 'INCB',
      equipId: 'I001',
      equipReference: '000000030',
      equipStatus: 'IN',
      downtimeCode: 'INSP',
      downtimeDescription: 'Quality Inspection',
      downtimeStart: '2024-01-10T09:00:00',
      downtimeEnd: '2024-01-10T12:00:00',
      downtimeFlag: 'N',
      serviceCode: null,
      serviceDescription: null,
      servicePerson: null,
      serviceCompany: null,
      serviceStart: null,
      serviceEnd: null,
      scheduledEvent: 'Y',
      qcReference: 'QC-2024-002'
    },
    {
      eventReference: 'DT-000008',
      equipType: 'CENT',
      equipId: '9ABC',
      equipReference: 'EQ-000230',
      equipStatus: 'NEW',
      downtimeCode: 'POWER',
      downtimeDescription: 'Power Outage',
      downtimeStart: '2024-03-22T16:30:00',
      downtimeEnd: '2024-03-22T19:45:00',
      downtimeFlag: 'N',
      serviceCode: null,
      serviceDescription: null,
      servicePerson: null,
      serviceCompany: null,
      serviceStart: null,
      serviceEnd: null,
      scheduledEvent: 'N',
      qcReference: null
    }
  ];

  /**
   * Get downtime history records
   */
  getDowntimeHistory(params: DowntimeHistoryParamsDto, take: number = 1000, skip: number = 0): Observable<DowntimeHistoryResponse> {
    console.log('[MOCK] getDowntimeHistory called with params:', params, 'take:', take, 'skip:', skip);

    // Filter mock data based on params
    let filteredData = [...this.mockDowntimeHistory];

    if (params.equipmentType) {
      filteredData = filteredData.filter(h => h.equipType === params.equipmentType);
    }

    if (params.equipmentId) {
      filteredData = filteredData.filter(h => h.equipId === params.equipmentId);
    }

    if (params.equipmentReference) {
      filteredData = filteredData.filter(h => h.equipReference === params.equipmentReference);
    }

    // Filter by date range if provided
    if (params.startDate) {
      const startDate = new Date(params.startDate);
      filteredData = filteredData.filter(h => {
        const downtimeStart = new Date(h.downtimeStart!);
        return downtimeStart >= startDate;
      });
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate);
      filteredData = filteredData.filter(h => {
        const downtimeStart = new Date(h.downtimeStart!);
        return downtimeStart <= endDate;
      });
    }

    // Sort if requested
    if (params.sortColumn && params.sortDirection) {
      filteredData.sort((a: any, b: any) => {
        const aVal = a[params.sortColumn!];
        const bVal = b[params.sortColumn!];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return params.sortDirection === 'D' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const totalRecords = filteredData.length;
    const paginatedData = filteredData.slice(skip, skip + take);

    return of({
      success: true,
      message: 'Downtime history retrieved successfully',
      statusCode: 200,
      data: paginatedData,
      total: totalRecords
    }).pipe(delay(800)); // Simulate network delay
  }

  /**
   * Get equipment types for dropdown
   */
  getEquipmentTypes(): Observable<EquipmentTypeLookup[]> {
    console.log('[MOCK] getEquipmentTypes called');
    return of(this.mockEquipmentTypes).pipe(delay(300));
  }

  /**
   * Get equipment IDs for a specific type
   */
  getEquipmentIds(equipmentType: string): Observable<EquipmentIdLookup[]> {
    console.log('[MOCK] getEquipmentIds called for type:', equipmentType);
    const ids = this.mockEquipmentIds[equipmentType] || [];
    return of(ids).pipe(delay(400));
  }

  /**
   * Get equipment references
   */
  getEquipmentReferences(equipmentType: string, equipmentId: string): Observable<EquipmentReferenceLookup[]> {
    console.log('[MOCK] getEquipmentReferences called for type/id:', equipmentType, equipmentId);

    const ids = this.mockEquipmentIds[equipmentType] || [];
    const equipment = ids.find(e => e.code === equipmentId);

    if (equipment) {
      return of([{
        code: equipment.code,
        description: equipment.description
      }]).pipe(delay(400));
    }

    return of([]).pipe(delay(400));
  }
}
