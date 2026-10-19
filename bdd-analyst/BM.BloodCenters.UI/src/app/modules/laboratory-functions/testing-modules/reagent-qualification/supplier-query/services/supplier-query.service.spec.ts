import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SupplierQueryService } from './supplier-query.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  SupplierLookup,
  SupplierQueryResult,
  SupplierQuerySearchRequest,
  SuppliersLookupResponse,
  SupplierQuerySearchResponse
} from '../models/supplier-query.model';

describe('SupplierQueryService', () => {
  let service: SupplierQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSuppliers: SupplierLookup[] = [
    { supplierCode: '1', supplierName: 'ORTHO' },
    { supplierCode: '2', supplierName: 'ABBOTT' }
  ];

  const mockResults: SupplierQueryResult[] = [
    {
      reagentId: 'R001',
      testId: 'ABID',
      testDesc: 'Antibody Identification',
      reagentCode: 'ABRGT',
      reagentName: 'Antibody ID',
      supplierCode: '1',
      receivedBy: 'JDoe',
      receivedDate: '2001-08-16',
      expiryDate: '2001-08-16',
      noOfTests: 100,
      remainingTests: 50,
      lotNumber: '',
      kitLotNumber: '',
      rejectReasonCode: '',
      rejectReasonDesc: ''
    },
    {
      reagentId: 'R002',
      testId: 'ABIT',
      testDesc: 'Antibody Identification',
      reagentCode: 'ABRGT',
      reagentName: 'Antibody ID',
      supplierCode: '1',
      receivedBy: 'JSmith',
      receivedDate: '2001-08-17',
      expiryDate: '2001-08-17',
      noOfTests: 200,
      remainingTests: 150,
      lotNumber: 'LOT123',
      kitLotNumber: 'KIT456',
      rejectReasonCode: '',
      rejectReasonDesc: ''
    }
  ];

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SupplierQueryService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(SupplierQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getSuppliersLookup', () => {
    it('should fetch suppliers lookup successfully', (done) => {
      const mockResponse: SuppliersLookupResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockSuppliers
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSuppliersLookup().subscribe({
        next: (suppliers) => {
          expect(suppliers).toEqual(mockSuppliers);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.SUPPLIERS_DROPDOWN);
          done();
        }
      });
    });

    it('should return empty array when response data is null', (done) => {
      const mockResponse: SuppliersLookupResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getSuppliersLookup().subscribe({
        next: (suppliers) => {
          expect(suppliers).toEqual([]);
          done();
        }
      });
    });

    it('should handle error when fetching suppliers fails', (done) => {
      const mockError = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getSuppliersLookup().subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });
  });

  describe('searchSupplierQuery', () => {
    const mockRequest: SupplierQuerySearchRequest = {
      supplierCode: '1',
      dateStart: '2001-08-01',
      dateEnd: '2001-08-31'
    };

    it('should search supplier query successfully', (done) => {
      const mockResponse: SupplierQuerySearchResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResults,
        total: 2
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchSupplierQuery(mockRequest).subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockResults);
          expect(response.total).toBe(2);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.SEARCH,
            mockRequest
          );
          done();
        }
      });
    });


    it('should handle error when search fails', (done) => {
      const mockError = { status: 400, message: 'Bad request' };
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.searchSupplierQuery(mockRequest).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should search with optional parameters', (done) => {
      const requestWithSort: SupplierQuerySearchRequest = {
        supplierCode: '1',
        sortColumn: 'receivedDate',
        sortOrder: 'D',
        take: 10,
        skip: 0
      };

      const mockResponse: SupplierQuerySearchResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResults,
        total: 2
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchSupplierQuery(requestWithSort).subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockResults);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.SEARCH,
            requestWithSort
          );
          done();
        }
      });
    });
  });

  describe('getReagentById', () => {
    const mockReagent: SupplierQueryResult = {
      reagentId: 'R123',
      testId: 'ABID',
      testDesc: 'Antibody Identification',
      reagentCode: 'ABRGT',
      reagentName: 'Antibody ID',
      supplierCode: '1',
      receivedBy: 'JDoe',
      receivedDate: '2001-08-16',
      expiryDate: '2001-08-16',
      noOfTests: 100,
      remainingTests: 50,
      lotNumber: 'LOT123',
      kitLotNumber: 'KIT456',
      rejectReasonCode: '',
      rejectReasonDesc: ''
    };

    it('should fetch reagent by ID successfully', (done) => {
      const reagentId = 'R123';
      const mockResponse = {
        data: mockReagent
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getReagentById(reagentId).subscribe({
        next: (reagent) => {
          expect(reagent).toEqual(mockReagent);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.SUPPLIER_QUERY.GET_BY_ID(reagentId)
          );
          done();
        }
      });
    });

    it('should handle error when fetching reagent by ID fails', (done) => {
      const reagentId = 'R123';
      const mockError = { status: 404, message: 'Not found' };
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getReagentById(reagentId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

  });
});
