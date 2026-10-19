import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ServiceHistoryQueryService } from './service-history-query.service';
import {
  ServiceHistoryModel,
  ServiceHistoryResponse,
  ServiceHistoryParamsDto,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from '../models/service-history-query.model';
import { API } from '@core/constants/api.constants';

describe('ServiceHistoryQueryService', () => {
  let service: ServiceHistoryQueryService;
  let httpMock: HttpTestingController;

  const mockServiceHistory: ServiceHistoryModel = {
    eventReference: 'EVT-001',
    equipType: 'CENT',
    equipId: 'CENT-001',
    equipReference: 'REF-001',
    equipStatus: 'IN',
    serviceDescription: 'Routine maintenance',
    serviceStart: '2025-01-01T10:00:00',
    serviceEnd: '2025-01-01T12:00:00',
    downtimeFlag: 'Y',
    scheduledEvent: 'Y',
    downtimeCode: 'MAINT',
    downtimeDescription: 'Maintenance',
    serviceCode: 'PREV',
    servicePerson: 'John Doe',
    serviceCompany: 'Service Co',
    qcReference: 'QC-001'
  };

  const mockServiceHistoryResponse: ServiceHistoryResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [mockServiceHistory],
    total: 1
  };

  const mockEquipmentTypes: EquipmentTypeLookup[] = [
    { equipType: 'CENT', equipTypeDescription: 'Centrifuge' },
    { equipType: 'FRDG', equipTypeDescription: 'Refrigerator' },
    { equipType: 'INCB', equipTypeDescription: 'Incubator' }
  ];

  const mockEquipmentIds: EquipmentIdLookup[] = [
    { equipId: 'CENT-001', equipReference: 'REF-001', serviceDates: '2025-01-01 to 2025-01-05' },
    { equipId: 'CENT-002', equipReference: 'REF-002', serviceDates: '2025-01-10 to 2025-01-15' }
  ];

  const mockEquipmentReferences: EquipmentReferenceLookup[] = [
    { equipReference: 'REF-001', serviceDates: '2025-01-01 to 2025-01-05' },
    { equipReference: 'REF-002', serviceDates: '2025-01-10 to 2025-01-15' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServiceHistoryQueryService]
    });
    service = TestBed.inject(ServiceHistoryQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  describe('getServiceHistory', () => {
    it('should fetch service history with POST request', () => {
      const params: ServiceHistoryParamsDto = {
        equipmentType: 'CENT',
        equipmentId: 'CENT-001'
      };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
        expect(response.data?.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockServiceHistoryResponse);
    });

    it('should include equipmentType in request body', () => {
      const params: ServiceHistoryParamsDto = { equipmentType: 'CENT' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.equipmentType).toBe('CENT');
      req.flush(mockServiceHistoryResponse);
    });

    it('should include equipmentId in request body', () => {
      const params: ServiceHistoryParamsDto = { equipmentId: 'CENT-001' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.equipmentId).toBe('CENT-001');
      req.flush(mockServiceHistoryResponse);
    });

    it('should include equipmentReference in request body', () => {
      const params: ServiceHistoryParamsDto = { equipmentReference: 'REF-001' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.equipmentReference).toBe('REF-001');
      req.flush(mockServiceHistoryResponse);
    });

    it('should include startDate in request body', () => {
      const params: ServiceHistoryParamsDto = { startDate: '2025-01-01T00:00:00Z' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.startDate).toBe('2025-01-01T00:00:00Z');
      req.flush(mockServiceHistoryResponse);
    });

    it('should include endDate in request body', () => {
      const params: ServiceHistoryParamsDto = { endDate: '2025-01-31T23:59:59Z' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.endDate).toBe('2025-01-31T23:59:59Z');
      req.flush(mockServiceHistoryResponse);
    });

    it('should include sortColumn in request body', () => {
      const params: ServiceHistoryParamsDto = { sortColumn: 'serviceStart' };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body.sortColumn).toBe('serviceStart');
      req.flush(mockServiceHistoryResponse);
    });


    it('should include multiple parameters in request body', () => {
      const params: ServiceHistoryParamsDto = {
        equipmentType: 'CENT',
        equipmentId: 'CENT-001',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        sortColumn: 'serviceStart',
        sortDirection: 'D'
      };

      service.getServiceHistory(params).subscribe(response => {
        expect(response).toEqual(mockServiceHistoryResponse);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      expect(req.request.body).toEqual(params);
      req.flush(mockServiceHistoryResponse);
    });


    it('should map response correctly', () => {
      service.getServiceHistory({}).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Success');
        expect(response.statusCode).toBe(200);
        expect(response.data?.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      req.flush(mockServiceHistoryResponse);
    });



  });

  describe('getEquipmentTypes', () => {
    it('should fetch equipment types', () => {
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockEquipmentTypes
      };

      service.getEquipmentTypes().subscribe(types => {
        expect(types).toEqual(mockEquipmentTypes);
        expect(types.length).toBe(3);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });


    it('should handle empty equipment types response', () => {
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: []
      };

      service.getEquipmentTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_TYPES);
      req.flush(apiResponse);
    });

    it('should handle network error gracefully', () => {
      spyOn(console, 'error');

      service.getEquipmentTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_TYPES);
      req.error(new ProgressEvent('Network error'));

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getEquipmentIds', () => {
    it('should fetch equipment IDs for a specific type', () => {
      const equipmentType = 'CENT';
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockEquipmentIds
      };

      service.getEquipmentIds(equipmentType).subscribe(ids => {
        expect(ids).toEqual(mockEquipmentIds);
        expect(ids.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_IDS('CENT'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });


    it('should handle empty equipment IDs response', () => {
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: []
      };

      service.getEquipmentIds('CENT').subscribe(ids => {
        expect(ids).toEqual([]);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_IDS('CENT'));
      req.flush(apiResponse);
    });

    it('should encode special characters in equipment type', () => {
      service.getEquipmentIds('TYPE&SPECIAL').subscribe(ids => {
        expect(ids).toEqual(mockEquipmentIds);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_IDS('TYPE&SPECIAL'));
      req.flush({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockEquipmentIds
      });
    });
  });

  describe('getEquipmentReferences', () => {
    it('should fetch equipment references for a specific type and ID', () => {
      const equipmentType = 'CENT';
      const equipmentId = 'CENT-001';
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockEquipmentReferences
      };

      service.getEquipmentReferences(equipmentType, equipmentId).subscribe(refs => {
        expect(refs).toEqual(mockEquipmentReferences);
        expect(refs.length).toBe(2);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_REFERENCES('CENT', 'CENT-001'));
      expect(req.request.method).toBe('GET');
      req.flush(apiResponse);
    });


    it('should handle empty equipment references response', () => {
      const apiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: []
      };

      service.getEquipmentReferences('CENT', 'CENT-001').subscribe(refs => {
        expect(refs).toEqual([]);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_REFERENCES('CENT', 'CENT-001'));
      req.flush(apiResponse);
    });

    it('should include both equipmentType and equipmentId parameters', () => {
      service.getEquipmentReferences('FRDG', 'FRDG-005').subscribe(refs => {
        expect(refs).toEqual(mockEquipmentReferences);
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_REFERENCES('FRDG', 'FRDG-005'));
      req.flush({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockEquipmentReferences
      });
    });
  });

  describe('validateEquipmentType', () => {
    it('should validate equipment type successfully', () => {
      const validationResponse = {
        success: true,
        message: 'Valid equipment type',
        data: { equipmentType: 'CENT' }
      };

      service.validateEquipmentType('CENT').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Valid equipment type');
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_TYPE &&
        request.params.get('equipmentType') === 'CENT'
      );
      expect(req.request.method).toBe('GET');
      req.flush(validationResponse);
    });

  });

  describe('validateEquipment', () => {
    it('should validate equipment successfully', () => {
      const validationResponse = {
        success: true,
        message: 'Valid equipment',
        data: { equipmentType: 'CENT', equipmentId: 'CENT-001' }
      };

      service.validateEquipment('CENT', 'CENT-001').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Valid equipment');
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT &&
        request.params.get('equipmentType') === 'CENT' &&
        request.params.get('equipmentId') === 'CENT-001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(validationResponse);
    });

  });

  describe('validateEquipmentReference', () => {
    it('should validate equipment reference successfully', () => {
      const validationResponse = {
        success: true,
        message: 'Valid equipment reference',
        data: { equipmentType: 'CENT', equipmentId: 'CENT-001', equipmentReference: 'REF-001' }
      };

      service.validateEquipmentReference('CENT', 'CENT-001', 'REF-001').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Valid equipment reference');
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_REFERENCE &&
        request.params.get('equipmentType') === 'CENT' &&
        request.params.get('equipmentId') === 'CENT-001' &&
        request.params.get('equipmentReference') === 'REF-001'
      );
      expect(req.request.method).toBe('GET');
      req.flush(validationResponse);
    });

  });

  describe('Error Handling', () => {
    it('should log error messages for getServiceHistory', () => {
      spyOn(console, 'error');

      service.getServiceHistory({}).subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching service history:',
            jasmine.any(Object)
          );
        }
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.GET_SERVICE_HISTORY);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should log error messages for getEquipmentTypes', () => {
      spyOn(console, 'error');

      service.getEquipmentTypes().subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching equipment types:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_TYPES);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should log error messages for getEquipmentIds', () => {
      spyOn(console, 'error');

      service.getEquipmentIds('CENT').subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching equipment IDs:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_IDS('CENT'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should log error messages for getEquipmentReferences', () => {
      spyOn(console, 'error');

      service.getEquipmentReferences('CENT', 'CENT-001').subscribe(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error fetching equipment references:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(API.SERVICE_HISTORY_QUERY.EQUIPMENT_REFERENCES('CENT', 'CENT-001'));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle error for validateEquipmentType and return failure', () => {
      spyOn(console, 'error');

      service.validateEquipmentType('CENT').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Validation failed');
        expect(console.error).toHaveBeenCalledWith(
          'Error validating equipment type:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_TYPE
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle error for validateEquipment and return failure', () => {
      spyOn(console, 'error');

      service.validateEquipment('CENT', 'CENT-001').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Validation failed');
        expect(console.error).toHaveBeenCalledWith(
          'Error validating equipment:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle error for validateEquipmentReference and return failure', () => {
      spyOn(console, 'error');

      service.validateEquipmentReference('CENT', 'CENT-001', 'REF-001').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Validation failed');
        expect(console.error).toHaveBeenCalledWith(
          'Error validating equipment reference:',
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(request =>
        request.url === API.SERVICE_HISTORY_QUERY.VALIDATE_EQUIPMENT_REFERENCE
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
