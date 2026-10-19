import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EquipmentEventApiService } from './equipment-event-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  EquipmentEventDto,
  CreateEquipmentEventRequestDto,
  UpdateEquipmentEventRequestDto,
  EquipmentEventQueryDto
} from '../models/equipment-event.model';

describe('EquipmentEventApiService', () => {
  let service: EquipmentEventApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEventDto: EquipmentEventDto = {
    eventReference: 'EQE0001234',
    equipReference: 'EQ-ABC123',
    downtimeFlag: 'Y',
    downtimeCode: 'MAINT',
    downtimeDescription: 'Scheduled Maintenance',
    downtimeStart: '2026-05-31T08:00:00Z',
    downtimeEnd: '2026-05-31T12:00:00Z',
    serviceCode: 'PM',
    serviceDescription: 'Preventive Maintenance',
    servicePerson: 'John Smith',
    serviceCompany: 'ABC Service Co',
    serviceStart: '2026-05-31T08:00:00Z',
    serviceEnd: '2026-05-31T12:00:00Z',
    insertDate: '2026-05-30T14:30:00Z',
    insertUser: 'JSMITH'
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EquipmentEventApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(EquipmentEventApiService);
  });

  describe('getEventById', () => {
    it('should return full API response', (done) => {
      const mockResponse = {
        success: true,
        data: mockEventDto
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEventById('EQE0001234').subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.data).toEqual(mockEventDto);
        expect(apiServiceSpy.get).toHaveBeenCalled();
        done();
      });
    });


  });

  describe('getEventsByEquipment', () => {
    it('should get events by equipment reference', (done) => {
      const mockResponse = {
        success: true,
        data: [mockEventDto],
        totalCount: 1
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getEventsByEquipment('EQ-ABC123').subscribe(result => {
        expect(result.data).toEqual([mockEventDto]);
        expect(result.totalCount).toBe(1);
        expect(apiServiceSpy.get).toHaveBeenCalled();
        done();
      });
    });

  });

  describe('createEvent', () => {
    it('should return full API response on create', (done) => {
      const createDto: CreateEquipmentEventRequestDto = {
        equipReference: 'EQ-ABC123',
        downtimeFlag: 'Y',
        downtimeCode: 'MAINT',
        downtimeStart: '2026-05-31T08:00:00Z',
        downtimeEnd: '2026-05-31T12:00:00Z'
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Equipment event created successfully',
        data: [{ eventReference: 'EQE0001235' }]
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createEvent(createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Equipment event created successfully');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(jasmine.any(String), createDto);
        done();
      });
    });

  });

  describe('updateEvent', () => {
    it('should return full API response on update', (done) => {
      const updateDto: UpdateEquipmentEventRequestDto = {
        downtimeFlag: 'N',
        servicePerson: 'Jane Doe'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Equipment event updated successfully'
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateEvent('EQE0001234', updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Equipment event updated successfully');
        expect(apiServiceSpy.put).toHaveBeenCalledWith(jasmine.any(String), updateDto);
        done();
      });
    });

  });

  describe('deleteEvent', () => {
    it('should return full API response on delete', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Equipment event deleted successfully'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteEvent('EQE0001234').subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Equipment event deleted successfully');
        expect(apiServiceSpy.delete).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('searchEvents', () => {
    it('should search events with pagination', (done) => {
      const queryParams: EquipmentEventQueryDto = {
        equipReference: 'EQ-ABC123',
        fromDate: '2026-05-01',
        toDate: '2026-05-31'
      };

      const mockResponse = {
        success: true,
        data: [mockEventDto],
        totalCount: 1
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchEvents(10, 0, queryParams).subscribe(result => {
        expect(result.data).toEqual([mockEventDto]);
        expect(result.totalRecords).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(jasmine.any(String), queryParams);
        done();
      });
    });

  });

  describe('LOV endpoints', () => {
    it('should get equipment types', (done) => {
      const mockTypes = [{ code: 'VIST', description: 'Vista' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockTypes }));

      service.getEquipmentTypes().subscribe(result => {
        expect(result).toEqual(mockTypes);
        done();
      });
    });

    it('should get equipment list by type', (done) => {
      const mockList = [{ equipmentId: '001', equipReference: 'EQ-001' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockList }));

      service.getEquipmentList('VIST').subscribe(result => {
        expect(result).toEqual(mockList as any);
        done();
      });
    });

    it('should get downtime codes', (done) => {
      const mockCodes = [{ code: 'REPAR', description: 'Repair' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCodes }));

      service.getDowntimeCodes().subscribe(result => {
        expect(result).toEqual(mockCodes);
        done();
      });
    });

    it('should get service codes', (done) => {
      const mockCodes = [{ code: 'FIX', description: 'General Repair' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, data: mockCodes }));

      service.getServiceCodes().subscribe(result => {
        expect(result).toEqual(mockCodes);
        done();
      });
    });
  });
});
