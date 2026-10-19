import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SpecialOrderAllocationService } from './special-order-allocation.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  SpecialOrderAllocationDto,
  SpecialOrderAllocationQueryDto,
  CreateSpecialOrderAllocationRequestDto,
  UpdateSpecialOrderAllocationRequestDto,
  OrderItemDto,
  AllocatedUnitDto,
  ApiResponse
} from '../models/special-order-allocation.model';

describe('SpecialOrderAllocationService', () => {
  let service: SpecialOrderAllocationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpecialOrderAllocationService]
    });

    service = TestBed.inject(SpecialOrderAllocationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllocations', () => {
    it('should retrieve allocations with pagination', () => {
      const mockResponse: ApiResponse<SpecialOrderAllocationDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          {
            pickSlipId: '12345',
            itemNo: 1,
            unitId: 'W633318030402-H',
            productCode: 'E0385V00',
            quantity: 1,
            chapterId: 'CH01',
            status: 'ACTIVE',
            effDate: '2025-03-01',
            termDate: null,
            insertDate: '2025-03-01T08:00:00Z',
            insertUser: 'testuser',
            orderNo: '240500017',
            abo: 'O',
            rh: '+',
            expirationDate: '2025-03-01',
            collectionDate: '2025-02-01'
          }
        ],
        total: 1
      };

      const filters: SpecialOrderAllocationQueryDto = {
        pickSlipId: '12345'
      };

      service.getAllocations(10, 0, filters).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].unitId).toBe('W633318030402-H');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.SEARCH(10, 0)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(filters);
      req.flush(mockResponse);
    });
  });

  describe('getAllocationById', () => {
    it('should retrieve a single allocation by ID', () => {
      const mockResponse: ApiResponse<SpecialOrderAllocationDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          {
            pickSlipId: '12345',
            itemNo: 1,
            unitId: 'W633318030402-H',
            productCode: 'E0385V00',
            quantity: 1,
            chapterId: 'CH01',
            status: 'ACTIVE',
            effDate: '2025-03-01',
            termDate: null,
            insertDate: '2025-03-01T08:00:00Z',
            insertUser: 'testuser',
            orderNo: '240500017',
            abo: 'O',
            rh: '+',
            expirationDate: '2025-03-01',
            collectionDate: '2025-02-01'
          }
        ]
      };

      service.getAllocationById('12345', 1, 'W633318030402-H').subscribe(allocation => {
        expect(allocation).toBeTruthy();
        expect(allocation!.unitId).toBe('W633318030402-H');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.GET_BY_ID('12345', 1, 'W633318030402-H')}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('getOrderItems', () => {
    it('should retrieve order items with pagination', () => {
      const mockResponse: ApiResponse<OrderItemDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          {
            orderNo: '240500017',
            itemNo: 1,
            productCode: 'WB-H',
            quantity: 1,
            quantityAllocated: 0,
            chapterId: 'CH01',
            itemStatus: 'Ordered',
            abo: 'O',
            rh: '+',
            effDate: null,
            termDate: null,
            specialInstructions: null,
            substitutionFlag: 'Y',
            groupCode: null,
            attributeCode: null,
            antigenCodes: 'K',
            productDescription: 'Whole Blood'
          }
        ],
        total: 1
      };

      service.getOrderItems('240500017', 10, 0).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].productCode).toBe('WB-H');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ORDER_ITEMS('240500017', 10, 0)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createAllocation', () => {
    it('should create a new allocation', () => {
      const createRequest: CreateSpecialOrderAllocationRequestDto = {
        pickSlipId: '12345',
        itemNo: 1,
        unitId: 'W633318030402-H',
        productCode: 'E0385V00',
        quantity: 1,
        orderNo: '240500017'
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: []
      };

      service.createAllocation(createRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.statusCode).toBe(201);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.CREATE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });
  });

  describe('updateAllocation', () => {
    it('should update an existing allocation', () => {
      const updateRequest: UpdateSpecialOrderAllocationRequestDto = {
        unitId: 'W633318030402-H',
        productCode: 'E0385V00',
        quantity: 2
      };

      const mockResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: []
      };

      service.updateAllocation('12345', 1, 'W633318030402-H', updateRequest).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.UPDATE('12345', 1, 'W633318030402-H')}`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });
  });

  describe('deleteAllocation', () => {

    it('should return false when deletion fails', () => {
      const mockResponse: ApiResponse<boolean> = {
        success: true,
        statusCode: 200,
        message: 'Not deleted',
        data: []
      };

      service.deleteAllocation('99999', 1, 'INVALID', '9999').subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.DELETE('99999', 1, 'INVALID', '9999')}`
      );
      req.flush(mockResponse);
    });
  });

  describe('getAllocatedUnits', () => {
    it('should retrieve allocated units for a specific item', () => {
      const mockResponse: ApiResponse<AllocatedUnitDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          {
            itemNo: 1,
            unitId: 'W633318030402-H',
            productCode: 'E0385V00',
            productType: 'RBC',
            productStatus: 'AL',
            bloodType: 'OP',
            aliquot: '00',
            abo: 'O',
            rh: '+',
            expirationDate: '2025-03-01',
            collectionDate: '2025-02-01'
          }
        ]
      };

      service.getAllocatedUnits('12345', 1).subscribe((units: AllocatedUnitDto[]) => {
        expect(units.length).toBe(1);
        expect(units[0].itemNo).toBe(1);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}${API.SPECIAL_ORDER_ALLOCATION.ALLOCATED_UNITS('12345', 1)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
