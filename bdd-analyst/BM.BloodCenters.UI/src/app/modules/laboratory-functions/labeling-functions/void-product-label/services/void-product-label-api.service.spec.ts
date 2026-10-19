import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VoidProductLabelApiService } from './void-product-label-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  VoidProductLabelRequestDto,
  VoidProductLabelResponseDto,
  ComponentDetailsDto,
  OverrideCodeDto,
  ProductCodeDto,
  UnitComponentDto,
} from '../models/void-product-label.model';

describe('VoidProductLabelApiService', () => {
  let service: VoidProductLabelApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        VoidProductLabelApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(VoidProductLabelApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('search', () => {
    it('should call POST with correct endpoint and return data', (done) => {
      const mockData: ComponentDetailsDto[] = [
        {
          unitId: 'W123',
          productCode: 'E1100',
          productDescription: 'Product',
          systemLabelDecision: 'A',
          currentLabel: '62',
          testedAbo: 'A Pos',
          collDate: '2024-06-01',
        },
      ];
      apiServiceSpy.post.and.returnValue(
        of({ success: true, data: mockData, total: 1 })
      );

      service.search({ unitId: 'W123' }, 10, 0).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockData);
          expect(result.total).toBe(1);
          done();
        },
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.VOID_PRODUCT_LABEL.SEARCH(10, 0),
        { unitId: 'W123' }
      );
    });
  });
  describe('voidProductLabel', () => {
    const mockRequest: VoidProductLabelRequestDto = {
      unitId: 'W123',
      productCode: 'E1100',
      confirmUnitId: 'W123',
      aboLabel: 'Mq',
      expiryDate: '2024-07-15',
      collDate: '2024-06-01',
      holdReasonCode: 'MDR',
    };

    it('should call POST /void with correct data', (done) => {
      const mockResponse: VoidProductLabelResponseDto = {
        unitId: 'W123',
        productCode: 'E1100',
        componentPrefix: '00',
        oldAboLabel: 'A',
        newAboLabel: 'Mq',
        expiryDate: '2024-07-15',
        voidedDate: '2024-06-10',
        voidedBy: 'USER001',
        message: 'Success',
      };
      apiServiceSpy.post.and.returnValue(
        of({ success: true, item: mockResponse })
      );

      service.voidProductLabel(mockRequest).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          done();
        },
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.VOID_PRODUCT_LABEL.VOID,
        mockRequest
      );
    });
  });

  describe('getOverrideCodes', () => {
    it('should call GET and return codes array', (done) => {
      const mockCodes: OverrideCodeDto[] = [
        { code: 'MDR', description: 'Medical Director Reviewed' },
        { code: 'LAB', description: 'Lab Error' },
      ];
      apiServiceSpy.get.and.returnValue(
        of({ success: true, data: mockCodes })
      );

      service.getOverrideCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockCodes);
          expect(result.length).toBe(2);
          done();
        },
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.VOID_PRODUCT_LABEL.OVERRIDE_CODES
      );
    });

  });

  describe('getUnitComponents', () => {
    it('should call GET with correct unitId', (done) => {
      const mockComponents: UnitComponentDto[] = [
        {
          unitId: 'W123',
          productCode: 'E1100',
          productDescription: 'Product',
          currentLabel: '62',
          testedAbo: 'A Pos',
        },
      ];
      apiServiceSpy.get.and.returnValue(
        of({ success: true, data: mockComponents })
      );

      service.getUnitComponents('W123').subscribe({
        next: (result) => {
          expect(result).toEqual(mockComponents);
          done();
        },
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.VOID_PRODUCT_LABEL.UNIT_COMPONENTS('W123')
      );
    });
  });

  describe('getProductCodes', () => {
    it('should call GET and return product codes', (done) => {
      const mockCodes: ProductCodeDto[] = [
        { code: 'E1100', description: 'Product 1' },
        { code: 'E2200', description: 'Product 2' },
      ];
      apiServiceSpy.get.and.returnValue(
        of({ success: true, data: mockCodes })
      );

      service.getProductCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockCodes);
          done();
        },
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.VOID_PRODUCT_LABEL.PRODUCT_CODES
      );
    });
  });
});
