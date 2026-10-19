import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UpdateNumberOfBagsService } from './update-number-of-bags.service';
import { ApiService } from '@shared/services/api.service';
import {
  ValidateUnitData,
  ProductCode,
  ComponentPrefixItem,
  UpdateBagsRequest,
  ReturnResult,
} from '../models/update-number-of-bags.model';

describe('UpdateNumberOfBagsService', () => {
  let service: UpdateNumberOfBagsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnitData: ValidateUnitData = {
    unitId: 'TEST12345',
    collDate: '2026-05-25',
    codeScheme: 'C',
  };

  const mockValidateResponse: ReturnResult<ValidateUnitData> = {
    success: true,
    message: 'Unit validated successfully',
    error: null,
    errorCode: null,
    statusCode: 200,
    data: [mockUnitData],
    item: null,
    total: 1,
    errorResponse: {},
  };

  const mockProductCodes: ProductCode[] = [
    {
      productCode: 'PLAT001',
      productDesc: 'Platelets, Pheresis',
      productType: 'PLT',
    },
    {
      productCode: 'PLAT002',
      productDesc: 'Platelets, Leukoreduced',
      productType: 'PLT',
    },
  ];

  const mockComponentPrefixes: ComponentPrefixItem[] = [
    { componentPrefix: 'P1' },
    { componentPrefix: 'P2' },
  ];

  const mockUpdateResponse: ReturnResult<boolean> = {
    success: true,
    message: 'Record saved successfully',
    error: null,
    errorCode: '8010',
    statusCode: 200,
    data: [true],
    item: null,
    total: null,
    errorResponse: {},
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        UpdateNumberOfBagsService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(UpdateNumberOfBagsService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should validate unit via POST successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockValidateResponse));

      service.validateUnit({ unitId: 'TEST12345', processCode: '', isManualEntry: false }).subscribe({
        next: (response) => {
          expect(response).toEqual(mockValidateResponse);
          expect(response.data?.[0]?.codeScheme).toBe('C');
          done();
        },
        error: () => fail('should not error'),
      });
    });


  });

  describe('getProductCodes', () => {
    it('should fetch product codes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockProductCodes));

      service.getProductCodes('TEST12345', '2026-05-25', 'C').subscribe({
        next: (codes) => {
          expect(codes).toEqual(mockProductCodes);
          expect(codes.length).toBe(2);
          expect(codes[0].productCode).toBe('PLAT001');
          done();
        },
        error: () => fail('should not error'),
      });
    });


  });

  describe('getComponentPrefixes', () => {
    it('should fetch component prefixes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockComponentPrefixes));

      service.getComponentPrefixes('TEST12345', '2026-05-25', 'PLAT001', 'C').subscribe({
        next: (prefixes) => {
          expect(prefixes).toEqual(mockComponentPrefixes);
          expect(prefixes.length).toBe(2);
          expect(prefixes[0].componentPrefix).toBe('P1');
          done();
        },
        error: () => fail('should not error'),
      });
    });

    it('should return empty array when no prefixes available', (done) => {
      apiServiceSpy.get.and.returnValue(of([]));

      service.getComponentPrefixes('TEST12345', '2026-05-25', 'PLAT001', 'C').subscribe({
        next: (prefixes) => {
          expect(prefixes).toEqual([]);
          done();
        },
        error: () => fail('should not error'),
      });
    });

  });

  describe('updateBags', () => {
    it('should update bags via PUT successfully', (done) => {
      const request: UpdateBagsRequest = {
        unitId: 'TEST12345',
        productCode: 'PLAT001',
        componentPrefix: 'P1',
        bagsUsed: 3,
      };

      apiServiceSpy.put.and.returnValue(of(mockUpdateResponse));

      service.updateBags(request).subscribe({
        next: (response) => {
          expect(response).toEqual(mockUpdateResponse);
          expect(response.success).toBeTrue();
          expect(response.errorCode).toBe('8010');
          done();
        },
        error: () => fail('should not error'),
      });
    });

    it('should handle update error - bags exceed available', (done) => {
      const request: UpdateBagsRequest = {
        unitId: 'TEST12345',
        productCode: 'PLAT001',
        componentPrefix: 'P1',
        bagsUsed: 100,
      };

      const errorResponse = {
        error: {
          message: 'Requested bags exceed available count',
          errorCode: '0262',
        },
      };

      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.updateBags(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.error.errorCode).toBe('0262');
          done();
        },
      });
    });

    it('should handle update error - bags must be greater than zero', (done) => {
      const request: UpdateBagsRequest = {
        unitId: 'TEST12345',
        productCode: 'PLAT001',
        componentPrefix: 'P1',
        bagsUsed: 0,
      };

      const errorResponse = {
        error: {
          message: 'Number of bags must be greater than zero',
          errorCode: '5219',
        },
      };

      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.updateBags(request).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.error.errorCode).toBe('5219');
          done();
        },
      });
    });

  });
});
