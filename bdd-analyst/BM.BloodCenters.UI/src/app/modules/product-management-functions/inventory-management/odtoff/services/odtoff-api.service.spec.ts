import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OdtoffApiService } from './odtoff-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PickSlipDropdownDto,
  PickSlipSummaryDto,
  PickSlipProductDto,
  RemoveProductRequestDto,
  ProductRemovalResultDto,
  ApiResponse,
} from '../models/odtoff.model';

describe('OdtoffApiService', () => {
  let service: OdtoffApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockActivePickSlipsResponse: ApiResponse<PickSlipDropdownDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [
      { pickSlipId: 'PO001', insertDate: '2026-05-30T10:00:00', productCount: 5 },
      { pickSlipId: 'PO002', insertDate: '2026-05-29T14:30:00', productCount: 3 },
    ],
  };

  const mockPickSlipSummaryResponse: ApiResponse<PickSlipSummaryDto> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    item: {
      pickSlipId: 'PO001',
      insertDate: '2026-05-30T10:00:00',
      totalProducts: 10,
      outdateProducts: 8,
      cancelledProducts: 2,
      pickSlipStatus: 'OP',
    },
  };

  const mockPickSlipProductsResponse: ApiResponse<PickSlipProductDto[]> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [
      {
        unitId: 'U123456',
        checkDigit: 'K',
        productCode: 'P12345',
        productType: 'RBC',
        productDescription: 'Red Blood Cells',
        aboRh: 'O+',
        expirationDate: '2026-06-15T00:00:00',
        productStatus: 'OD',
        productStatusDescription: 'Outdated',
        aliquot: null,
        bloodType: 'Whole Blood',
        collectionDate: '2026-05-01T00:00:00',
      },
    ],
  };

  const mockRemoveProductResponse: ApiResponse<ProductRemovalResultDto> = {
    success: true,
    statusCode: 200,
    message: 'Product removed successfully',
    item: {
      unitId: 'U123456',
      productCode: 'P12345',
      productType: 'RBC',
      aboRh: 'O+',
      expirationDate: '2026-06-15T00:00:00',
      pickSlipAutoClosed: false,
      message: 'Product removed successfully',
    },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        OdtoffApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(OdtoffApiService);
  });

  describe('getActivePickSlips', () => {
    it('should fetch and return active pick slips data', () => {
      apiServiceSpy.get.and.returnValue(of(mockActivePickSlipsResponse));

      service.getActivePickSlips().subscribe((data) => {
        expect(data.length).toBe(2);
        expect(data[0].pickSlipId).toBe('PO001');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ODTOFF.ACTIVE_PICK_SLIPS);
    });

    it('should return empty array when response has no data', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, statusCode: 200, message: 'No data' }));

      service.getActivePickSlips().subscribe((data) => {
        expect(data).toEqual([]);
      });
    });

    it('should propagate error from getActivePickSlips', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      service.getActivePickSlips().subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });

  });

  describe('getPickSlipSummary', () => {
    it('should fetch pick slip summary by ID', () => {
      apiServiceSpy.get.and.returnValue(of(mockPickSlipSummaryResponse));

      service.getPickSlipSummary('PO001').subscribe((response) => {
        expect(response.item?.pickSlipId).toBe('PO001');
        expect(response.item?.pickSlipStatus).toBe('OP');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ODTOFF.PICK_SLIP_SUMMARY('PO001'));
    });

    it('should propagate error from getPickSlipSummary', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      service.getPickSlipSummary('PO001').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });
  });

  describe('getPickSlipProducts', () => {
    it('should fetch and return products data', () => {
      apiServiceSpy.get.and.returnValue(of(mockPickSlipProductsResponse));

      service.getPickSlipProducts('PO001').subscribe((data) => {
        expect(data.length).toBe(1);
        expect(data[0].productStatus).toBe('OD');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ODTOFF.PICK_SLIP_PRODUCTS('PO001'));
    });

    it('should propagate error from getPickSlipProducts', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      service.getPickSlipProducts('PO001').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });
  });

  describe('getPickSlipProductsPaged', () => {
    it('should fetch paginated products with take and skip', () => {
      const pagedResponse: ApiResponse<PickSlipProductDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockPickSlipProductsResponse.data![0]],
        total: 50,
      };
      apiServiceSpy.get.and.returnValue(of(pagedResponse));

      service.getPickSlipProductsPaged('PO001', 25, 0).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.data?.length).toBe(1);
        expect(response.total).toBe(50);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.ODTOFF.PICK_SLIP_PRODUCTS_PAGED('PO001', 25, 0),
      );
    });

    it('should propagate error from getPickSlipProductsPaged', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Network error')));
      service.getPickSlipProductsPaged('PO001', 25, 0).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });

  });

  describe('removeProduct', () => {
    it('should post removal request and return response', () => {
      apiServiceSpy.post.and.returnValue(of(mockRemoveProductResponse));

      const request: RemoveProductRequestDto = {
        pickSlipId: 'PO001',
        unitId: 'U123456',
        productCode: 'P12345',
      };

      service.removeProduct(request).subscribe((response) => {
        expect(response.success).toBeTrue();
        expect(response.item?.pickSlipAutoClosed).toBeFalse();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(API.ODTOFF.REMOVE_PRODUCT, request);
    });

    it('should handle auto-close scenario', () => {
      const autoCloseResponse = {
        ...mockRemoveProductResponse,
        item: { ...mockRemoveProductResponse.item!, pickSlipAutoClosed: true },
      };
      apiServiceSpy.post.and.returnValue(of(autoCloseResponse));

      const request: RemoveProductRequestDto = {
        pickSlipId: 'PO001',
        unitId: 'U123456',
        productCode: 'P12345',
      };

      service.removeProduct(request).subscribe((response) => {
        expect(response.item?.pickSlipAutoClosed).toBeTrue();
      });
    });

    it('should propagate error from removeProduct', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));
      const request: RemoveProductRequestDto = {
        pickSlipId: 'PO001',
        unitId: 'U123456',
        productCode: 'P12345',
      };
      service.removeProduct(request).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
    });

  });
});
