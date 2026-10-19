import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  ServiceHistoryResponse,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup,
  ServiceHistoryParamsDto
} from '../models/service-history-query.model';

/**
 * Mock Service for Service History Query
 * Use this when backend is not available
 *
 * To enable: In service-history-query.ts, change providers to:
 * providers: [{ provide: ServiceHistoryQueryService, useClass: ServiceHistoryQueryServiceMock }]
 */
@Injectable()
export class ServiceHistoryQueryServiceMock {

  /**
   * Mock equipment types data
   */
  private mockEquipmentTypes: EquipmentTypeLookup[] = [
    { equipType: 'CENT', equipTypeDescription: 'Centrifuge' },
    { equipType: 'FRZR', equipTypeDescription: 'Freezer' },
    { equipType: 'REFR', equipTypeDescription: 'Refrigerator' },
    { equipType: 'INCB', equipTypeDescription: 'Incubator' },
    { equipType: 'STRL', equipTypeDescription: 'Sterilizer' },
    { equipType: 'SEAL', equipTypeDescription: 'Tube Sealer' }
  ];

  /**
   * Mock equipment IDs by type
   */
  private mockEquipmentIds: { [key: string]: EquipmentIdLookup[] } = {
    'CENT': [
      { equipId: '9ABC', equipReference: 'EQ-000230', serviceDates: 'Service from: 05-MAR-2018 to: Present' },
      { equipId: '0001', equipReference: '000000001', serviceDates: 'Service from: 01-JAN-2020 to: Present' },
      { equipId: '0002', equipReference: '000000002', serviceDates: 'Service from: 15-MAR-2021 to: Present' },
      { equipId: '0003', equipReference: '000000003', serviceDates: 'Service from: 10-JUN-2022 to: 20-DEC-2023' }
    ],
    'FRZR': [
      { equipId: 'F001', equipReference: '000000010', serviceDates: 'Service from: 05-FEB-2019 to: Present' },
      { equipId: 'F002', equipReference: '000000011', serviceDates: 'Service from: 12-AUG-2020 to: Present' }
    ],
    'REFR': [
      { equipId: 'R001', equipReference: '000000020', serviceDates: 'Service from: 01-APR-2021 to: Present' }
    ],
    'INCB': [
      { equipId: 'I001', equipReference: '000000030', serviceDates: 'Service from: 15-SEP-2020 to: Present' },
      { equipId: 'I002', equipReference: '000000031', serviceDates: 'Not yet in service' }
    ]
  };

  /**
   * Mock service history data
   */
  private mockServiceHistory = [
    {
      eventReference: 'EVT000001',
      equipType: 'CENT',
      equipId: '9ABC',
      equipReference: 'EQ-000230',
      equipStatus: 'IN',
      serviceDescription: 'Routine Service',
      serviceStart: '2018-03-05T10:15:00',
      serviceEnd: '2018-03-05T17:45:00',
      downtimeFlag: 'Y',
      scheduledDate: '2025-11-01T00:00:00'
    },
    {
      eventReference: 'EVT000002',
      equipType: 'CENT',
      equipId: '0001',
      equipReference: '000000001',
      equipStatus: 'IN',
      serviceDescription: 'Calibration Check',
      serviceStart: '2024-02-20T14:00:00',
      serviceEnd: '2024-02-20T16:30:00',
      downtimeFlag: 'N',
      scheduledDate: '2024-03-15T00:00:00'
    },
    {
      eventReference: 'EVT000003',
      equipType: 'CENT',
      equipId: '0001',
      equipReference: '000000001',
      equipStatus: 'IN',
      serviceDescription: 'Emergency Repair - Belt Replacement',
      serviceStart: '2024-03-10T09:00:00',
      serviceEnd: '2024-03-10T17:45:00',
      downtimeFlag: 'Y',
      scheduledDate: null
    },
    {
      eventReference: 'EVT000004',
      equipType: 'FRZR',
      equipId: 'F001',
      equipReference: '000000010',
      equipStatus: 'IN',
      serviceDescription: 'Temperature Calibration',
      serviceStart: '2024-01-05T08:00:00',
      serviceEnd: '2024-01-05T10:00:00',
      downtimeFlag: 'N',
      scheduledDate: '2024-01-05T00:00:00'
    },
    {
      eventReference: 'EVT000005',
      equipType: 'REFR',
      equipId: 'R001',
      equipReference: '000000020',
      equipStatus: 'IN',
      serviceDescription: 'Preventive Maintenance',
      serviceStart: '2024-02-12T11:00:00',
      serviceEnd: '2024-02-12T13:30:00',
      downtimeFlag: 'Y',
      scheduledDate: '2024-02-12T00:00:00'
    }
  ];

  /**
   * Get service history records
   */
  getServiceHistory(params: ServiceHistoryParamsDto): Observable<ServiceHistoryResponse> {
    console.log('[MOCK] getServiceHistory called with params:', params);

    // Filter mock data based on params
    let filteredData = [...this.mockServiceHistory];

    if (params.equipmentType) {
      filteredData = filteredData.filter(h => h.equipType === params.equipmentType);
    }

    if (params.equipmentId) {
      filteredData = filteredData.filter(h => h.equipId === params.equipmentId);
    }

    if (params.equipmentReference) {
      filteredData = filteredData.filter(h => h.equipReference === params.equipmentReference);
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

    return of({
      success: true,
      message: 'Service history retrieved successfully',
      statusCode: 200,
      data: filteredData,
      total: filteredData.length
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
    const equipment = ids.find(e => e.equipId === equipmentId);

    if (equipment) {
      return of([{
        equipReference: equipment.equipReference,
        serviceDates: equipment.serviceDates
      }]).pipe(delay(400));
    }

    return of([]).pipe(delay(400));
  }

  /**
   * Validate equipment type
   */
  validateEquipmentType(equipmentType: string): Observable<{ success: boolean; message?: string; data?: any }> {
    console.log('[MOCK] validateEquipmentType called for:', equipmentType);
    const exists = this.mockEquipmentTypes.some(t => t.equipType === equipmentType);

    return of({
      success: exists,
      message: exists ? 'Equipment type is valid' : 'Invalid equipment type',
      data: exists ? equipmentType : null
    }).pipe(delay(200));
  }

  /**
   * Validate equipment
   */
  validateEquipment(equipmentType: string, equipmentId: string): Observable<{ success: boolean; message?: string; data?: any }> {
    console.log('[MOCK] validateEquipment called for:', equipmentType, equipmentId);
    const ids = this.mockEquipmentIds[equipmentType] || [];
    const exists = ids.some(e => e.equipId === equipmentId);

    return of({
      success: exists,
      message: exists ? 'Equipment is valid' : 'Invalid equipment',
      data: exists ? { equipmentType, equipmentId } : null
    }).pipe(delay(200));
  }

  /**
   * Validate equipment reference
   */
  validateEquipmentReference(
    equipmentType: string,
    equipmentId: string,
    equipmentReference: string
  ): Observable<{ success: boolean; message?: string; data?: any }> {
    console.log('[MOCK] validateEquipmentReference called for:', equipmentType, equipmentId, equipmentReference);
    const ids = this.mockEquipmentIds[equipmentType] || [];
    const exists = ids.some(e => e.equipId === equipmentId && e.equipReference === equipmentReference);

    return of({
      success: exists,
      message: exists ? 'Equipment reference is valid' : 'Invalid equipment reference',
      data: exists ? { equipmentType, equipmentId, equipmentReference } : null
    }).pipe(delay(200));
  }
}
