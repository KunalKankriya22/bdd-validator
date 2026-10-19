import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BoxDetailsService } from './box-details.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  BoxSearchParams,
  BoxesReadyForShipmentParams,
  PaginatedResponse,
  BoxSearchResult,
  ApiResponse,
  OpenBoxPaginatedResponse,
  BoxesReadyForShipmentResponse,
  BoxDetails,
} from '../models/box-details.model';

describe('BoxDetailsService', () => {
  let service: BoxDetailsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPaginatedResponse: PaginatedResponse<BoxSearchResult> = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 25, totalPages: 0 },
  };

  const mockOpenBoxResponse: ApiResponse<OpenBoxPaginatedResponse> = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: { items: [], totalCount: 0, totalOpenBoxes: 0, pageNumber: 1, pageSize: 25, totalPages: 0 },
  };

  const mockBoxDetails: ApiResponse<BoxDetails> = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: {
      boxId: 'BOX001',
      chapterId: 'CH01',
      boxType: 'DRY',
      boxTypeDescription: 'Dry Ice',
      boxStatus: 'O',
      boxStatusDescription: 'Open',
      packedBy: 'USER1',
      packedDate: '2026-01-01T00:00:00Z',
      temperature: null,
      minTemp: null,
      maxTemp: null,
      shipmentNo: null,
      customerId: 'CUST01',
      customerName: 'Test Hospital',
      consigneeId: null,
      consigneeName: null,
      warehouseId: null,
      creationDate: '2026-01-01T00:00:00Z',
      closedDate: null,
      productGrouping: null,
      productGroupingDescription: null,
      mfgProductType: null,
      mfgProductVolume: null,
      products: [],
    },
  };

  const mockReadyResponse: BoxesReadyForShipmentResponse = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: [],
    totalCount: 0,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        BoxDetailsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(BoxDetailsService);
  });

  describe('searchBoxes', () => {
    it('should call SEARCH endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockPaginatedResponse));
      const params: BoxSearchParams = { pageNumber: 1, pageSize: 25 };

      service.searchBoxes(params).subscribe((res) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.BOX_DETAILS.SEARCH,
          jasmine.any(Object)
        );
        expect(res.data.items).toEqual([]);
        done();
      });
    });

    it('should include optional params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockPaginatedResponse));
      const params: BoxSearchParams = {
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
        status: 'O',
        searchTerm: 'BOX123',
        showDiscardAndMfgCustomer: true,
        pageNumber: 2,
        pageSize: 50,
        sortColumn: 'boxId',
        sortOrder: 'ASC',
      };

      service.searchBoxes(params).subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const httpParams = callArgs[1]!.params!;
        expect(httpParams.get('fromDate')).toBe('2026-01-01');
        expect(httpParams.get('toDate')).toBe('2026-01-31');
        expect(httpParams.get('status')).toBe('O');
        expect(httpParams.get('searchTerm')).toBe('BOX123');
        expect(httpParams.get('showDiscardAndMfgCustomer')).toBe('true');
        expect(httpParams.get('pageNumber')).toBe('2');
        expect(httpParams.get('pageSize')).toBe('50');
        expect(httpParams.get('sortColumn')).toBe('boxId');
        expect(httpParams.get('sortOrder')).toBe('ASC');
        done();
      });
    });
  });

  describe('searchOpenBoxes', () => {
    it('should call SEARCH_OPEN endpoint and extract data', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOpenBoxResponse));
      const params: BoxSearchParams = { pageNumber: 1, pageSize: 25 };

      service.searchOpenBoxes(params).subscribe((res) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.BOX_DETAILS.SEARCH_OPEN,
          jasmine.any(Object)
        );
        expect(res.items).toEqual([]);
        done();
      });
    });

    it('should include all optional params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockOpenBoxResponse));
      const params: BoxSearchParams = {
        fromDate: '2026-01-01',
        toDate: '2026-01-31',
        searchTerm: 'BOX001',
        showDiscardAndMfgCustomer: true,
        pageNumber: 2,
        pageSize: 50,
        sortColumn: 'boxId',
        sortOrder: 'ASC',
      };

      service.searchOpenBoxes(params).subscribe(() => {
        const httpParams = apiServiceSpy.get.calls.mostRecent().args[1]!.params!;
        expect(httpParams.get('fromDate')).toBe('2026-01-01');
        expect(httpParams.get('toDate')).toBe('2026-01-31');
        expect(httpParams.get('searchTerm')).toBe('BOX001');
        expect(httpParams.get('showDiscardAndMfgCustomer')).toBe('true');
        expect(httpParams.get('pageNumber')).toBe('2');
        expect(httpParams.get('pageSize')).toBe('50');
        expect(httpParams.get('sortColumn')).toBe('boxId');
        expect(httpParams.get('sortOrder')).toBe('ASC');
        done();
      });
    });
  });

  describe('getBoxDetails', () => {
    it('should call GET_BY_ID endpoint and extract data', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockBoxDetails));

      service.getBoxDetails('BOX001').subscribe((res) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.BOX_DETAILS.GET_BY_ID('BOX001'),
          jasmine.any(Object)
        );
        expect(res.boxId).toBe('BOX001');
        done();
      });
    });

    it('should include productSortColumn and productSortOrder when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockBoxDetails));

      service.getBoxDetails('BOX001', 'UnitId', 'DESC').subscribe(() => {
        const httpParams = apiServiceSpy.get.calls.mostRecent().args[1]!.params!;
        expect(httpParams.get('productSortColumn')).toBe('UnitId');
        expect(httpParams.get('productSortOrder')).toBe('DESC');
        done();
      });
    });

    it('should not include sort params when not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockBoxDetails));

      service.getBoxDetails('BOX001').subscribe(() => {
        const httpParams = apiServiceSpy.get.calls.mostRecent().args[1]!.params!;
        expect(httpParams.get('productSortColumn')).toBeNull();
        expect(httpParams.get('productSortOrder')).toBeNull();
        done();
      });
    });
  });

  describe('getBoxesReadyForShipment', () => {
    it('should call GET_ALL endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReadyResponse));
      const params: BoxesReadyForShipmentParams = { sortOrder: 'ASC', take: 25, skip: 0 };

      service.getBoxesReadyForShipment(params).subscribe((res) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.BOXES_READY_FOR_SHIPMENT.GET_ALL,
          jasmine.any(Object)
        );
        expect(res.data).toEqual([]);
        done();
      });
    });

    it('should include filter params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReadyResponse));
      const params: BoxesReadyForShipmentParams = {
        sortOrder: 'DESC',
        take: 100,
        skip: 50,
        searchTerm: 'BOX',
        priority: 'HIGH',
        consigneeName: 'Hospital A',
        packedByName: 'User1',
      };

      service.getBoxesReadyForShipment(params).subscribe(() => {
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        const httpParams = callArgs[1]!.params!;
        expect(httpParams.get('sortOrder')).toBe('DESC');
        expect(httpParams.get('take')).toBe('100');
        expect(httpParams.get('skip')).toBe('50');
        expect(httpParams.get('searchTerm')).toBe('BOX');
        expect(httpParams.get('priority')).toBe('HIGH');
        expect(httpParams.get('consigneeName')).toBe('Hospital A');
        expect(httpParams.get('packedByName')).toBe('User1');
        done();
      });
    });
  });
});
