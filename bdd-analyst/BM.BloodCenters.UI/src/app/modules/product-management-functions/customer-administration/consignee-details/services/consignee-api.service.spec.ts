import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { ConsigneeApiService } from './consignee-api.service';
import {
  ConsigneeDto,
  CreateConsigneeDto,
  UpdateConsigneeDto,
  ConsigneeQueryDto,
  ZoneLookup,
  StateLookup
} from '../models/consignee.model';

describe('ConsigneeApiService', () => {
  let service: ConsigneeApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockConsignee: ConsigneeDto = {
    consigneeId: 'CON001',
    customerId: 'CUST001',
    chapterId: 'CH01',
    name: 'Test Consignee',
    shortName: 'TESTCON',
    intFlag: 'N',
    address1: '123 Test St',
    address2: null,
    address3: null,
    city: 'Dallas',
    state: 'TX',
    zip: '75001',
    country: 'USA',
    phoneNo: '2145551234',
    phoneExt: null,
    faxNo: null,
    telexNo: null,
    intPhone: null,
    zone: 'Z1',
    zoneDescription: 'Zone 1',
    adLocation: null,
    outOfState: 'N',
    arShipToNo: null,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-05-26T10:30:00Z',
    programId: 'VSCONNEE'
  };

  const mockZones: ZoneLookup[] = [
    { code: 'Z1', description: 'Zone 1' },
    { code: 'Z2', description: 'Zone 2' }
  ];

  const mockStates: StateLookup[] = [
    { code: 'TX', description: 'Texas' },
    { code: 'CA', description: 'California' }
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ConsigneeApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(ConsigneeApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getConsigneesByCustomer', () => {
    it('should return consignees for a customer', (done: DoneFn) => {
      const customerId = 'CUST001';
      const query: ConsigneeQueryDto = { includeTerminated: 'N' };
      const apiResponse = {
        success: true,
        data: [mockConsignee],
        total: 1
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.getConsigneesByCustomer(customerId, query).subscribe(result => {
        expect(result.data).toEqual([mockConsignee]);
        expect(result.total).toBe(1);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.CONSIGNEE.LIST(customerId),
          query
        );
        done();
      });
    });


  });

  describe('getConsigneeById', () => {
    it('should return a single consignee', (done: DoneFn) => {
      const customerId = 'CUST001';
      const consigneeId = 'CON001';
      const apiResponse = {
        success: true,
        data: [mockConsignee]
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getConsigneeById(customerId, consigneeId).subscribe(result => {
        expect(result).toEqual(mockConsignee);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.CONSIGNEE.GET_BY_ID(customerId, consigneeId)
        );
        done();
      });
    });

  });

  describe('createConsignee', () => {
    it('should create a consignee', (done: DoneFn) => {
      const createDto: CreateConsigneeDto = {
        customerId: 'CUST001',
        name: 'New Consignee',
        shortName: 'NEWCON',
        address1: '456 New St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        country: 'USA',
        effDate: '2024-06-01'
      };

      const apiResponse = {
        success: true,
        statusCode: 201,
        message: 'Consignee created successfully',
        data: [{ consigneeId: 'CON002' }]
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.createConsignee(createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.data?.[0]?.consigneeId).toBe('CON002');
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.CONSIGNEE.CREATE,
          createDto
        );
        done();
      });
    });

  });

  describe('updateConsignee', () => {
    it('should update a consignee', (done: DoneFn) => {
      const customerId = 'CUST001';
      const consigneeId = 'CON001';
      const updateDto: UpdateConsigneeDto = {
        name: 'Updated Consignee',
        shortName: 'UPDCON',
        address1: '789 Updated St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        country: 'USA',
        effDate: '2024-01-01'
      };

      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Consignee updated successfully'
      };

      apiServiceSpy.put.and.returnValue(of(apiResponse));

      service.updateConsignee(customerId, consigneeId, updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          API.CONSIGNEE.UPDATE(customerId, consigneeId),
          updateDto
        );
        done();
      });
    });
  });

  describe('deleteConsignee', () => {
    it('should soft delete a consignee', (done: DoneFn) => {
      const customerId = 'CUST001';
      const consigneeId = 'CON001';

      const apiResponse = {
        success: true,
        statusCode: 200,
        message: 'Consignee deleted successfully',
        data: [true]
      };

      apiServiceSpy.delete.and.returnValue(of(apiResponse));

      service.deleteConsignee(customerId, consigneeId).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          API.CONSIGNEE.DELETE(customerId, consigneeId)
        );
        done();
      });
    });
  });

  describe('getZones', () => {
    it('should return zones', (done: DoneFn) => {
      const apiResponse = {
        success: true,
        data: mockZones
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getZones().subscribe(result => {
        expect(result).toEqual(mockZones);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.CONSIGNEE.LOOKUP_ZONES);
        done();
      });
    });

    it('should handle empty zones', (done: DoneFn) => {
      const apiResponse = { success: true, data: undefined };
      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getZones().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getStates', () => {
    it('should return states', (done: DoneFn) => {
      // The service now returns unwrapped array directly from customer-profile endpoint
      apiServiceSpy.get.and.returnValue(of(mockStates));

      service.getStates().subscribe(result => {
        expect(result).toEqual(mockStates);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.CUSTOMER_PROFILE.STATES);
        done();
      });
    });
  });

  // ── catchError paths ──────────────────────────────────────────────────────

  describe('catchError – getConsigneesByCustomer', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Network error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.getConsigneesByCustomer('CUST001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('catchError – getConsigneeById', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Not found');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getConsigneeById('CUST001', 'CON001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should return item field when data array is absent', (done: DoneFn) => {
      const apiResponse = { success: true, item: mockConsignee };
      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getConsigneeById('CUST001', 'CON001').subscribe(result => {
        expect(result).toEqual(mockConsignee);
        done();
      });
    });

    it('should return null when neither data nor item is present', (done: DoneFn) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.getConsigneeById('CUST001', 'CON001').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('catchError – createConsignee', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Create failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      const dto: CreateConsigneeDto = {
        customerId: 'CUST001',
        name: 'Test',
        shortName: 'TST',
        address1: '123 St',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        country: 'USA',
        effDate: '2024-01-01'
      };

      service.createConsignee(dto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('catchError – updateConsignee', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Update failed');
      apiServiceSpy.put.and.returnValue(throwError(() => error));

      const dto: UpdateConsigneeDto = {
        name: 'Test',
        shortName: 'TST',
        address1: '123 St',
        city: 'Dallas',
        state: 'TX',
        zip: '75001',
        country: 'USA',
        effDate: '2024-01-01'
      };

      service.updateConsignee('CUST001', 'CON001', dto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('catchError – deleteConsignee', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Delete failed');
      apiServiceSpy.delete.and.returnValue(throwError(() => error));

      service.deleteConsignee('CUST001', 'CON001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('catchError – getZones', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('Zones failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getZones().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should return array directly when API response is an array (Array.isArray branch)', (done: DoneFn) => {
      // Some endpoints return a plain array instead of a wrapped ReturnResult
      apiServiceSpy.get.and.returnValue(of(mockZones));

      service.getZones().subscribe(result => {
        expect(result).toEqual(mockZones);
        done();
      });
    });
  });

  describe('catchError – getStates', () => {
    it('should propagate errors from the API', (done: DoneFn) => {
      const error = new Error('States failed');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getStates().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });
});
