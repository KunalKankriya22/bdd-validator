import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { UnitComponentAttributesApiService } from './unit-component-attributes-api.service';
import {
  UnitAttributeDto,
  ComponentAttributeDto,
  CpqQueryAttributesResponseDto,
  CpqUnitValidationResponseDto,
  ApiResponse,
  ProductCodeLovDto,
} from '../models/unit-component-attributes.interface';

describe('UnitComponentAttributesApiService', () => {
  let service: UnitComponentAttributesApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockUnitAttribute: UnitAttributeDto = {
    attribCode: 'ATTR001',
    attribDesc: 'Test Attribute',
    attribGroup: 'LAB',
    attribType: 'A',
    insertDate: '2024-01-15T10:30:00Z',
    insertUserId: 'USER01'
  };

  const mockComponentAttribute: ComponentAttributeDto = {
    productCode: 'RBC001',
    attribCode: 'CATTR01',
    attribDesc: 'Component Attribute',
    attribGroup: 'COMP',
    insertDate: '2024-01-15T11:00:00Z',
    procDate: '2024-01-15T12:00:00Z',
    insertUserId: 'USER02'
  };

  const mockValidationResponse: ApiResponse<CpqUnitValidationResponseDto> = {
    success: true,
    statusCode: 200,
    message: 'Unit validated successfully.',
    data: {
      unitId: 'TEST12345',
      collectionDate: '2024-01-15T00:00:00Z',
      codeScheme: 'I'
    }
  };

  const mockQueryResponse: ApiResponse<CpqQueryAttributesResponseDto> = {
    success: true,
    statusCode: 200,
    message: 'Successfully retrieved 2 attribute(s).',
    data: {
      unitAttributes: [mockUnitAttribute],
      componentAttributes: [mockComponentAttribute],
      messages: []
    }
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        UnitComponentAttributesApiService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(UnitComponentAttributesApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('validateUnit', () => {
    it('should validate unit successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockValidationResponse));

      service.validateUnit('TEST12345').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.unitId).toBe('TEST12345');
          expect(response.data?.collectionDate).toBe('2024-01-15T00:00:00Z');
          expect(response.data?.codeScheme).toBe('I');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/validate-unit/TEST12345')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on validation failure', (done) => {
      const errorResponse = { error: { message: 'Unit not found' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.validateUnit('INVALID').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('queryAttributes', () => {
    it('should fetch attributes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockQueryResponse));

      service.queryAttributes({
        unitId: 'TEST12345',
        collDate: '2024-01-15T00:00:00Z',
        codeScheme: 'I'
      }).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.unitAttributes.length).toBe(1);
          expect(response.data?.componentAttributes.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/query')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should include productCode when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockQueryResponse));

      service.queryAttributes({
        unitId: 'TEST12345',
        collDate: '2024-01-15T00:00:00Z',
        codeScheme: 'I',
        productCode: 'RBC001'
      }).subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('productCode=RBC001')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on query failure', (done) => {
      const errorResponse = { error: { message: 'No attributes found' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.queryAttributes({
        unitId: 'TEST12345',
        collDate: '2024-01-15T00:00:00Z',
        codeScheme: 'I'
      }).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getProductCodes', () => {
    it('should fetch product codes successfully', (done) => {
      const mockProductCodes: ApiResponse<ProductCodeLovDto[]> = {
        success: true,
        statusCode: 200,
        message: 'Successfully retrieved 2 product code(s).',
        data: [
          { productCode: 'RBC001', productDesc: 'Red Blood Cells' },
          { productCode: 'PLT001', productDesc: 'Platelets' }
        ],
        total: 2
      };
      apiServiceSpy.get.and.returnValue(of(mockProductCodes));

      service.getProductCodes('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/product-codes')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on product codes failure', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getProductCodes('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getUnitAttributesPaginated', () => {
    it('should post query and return paginated unit attributes', (done) => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: [mockUnitAttribute], total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const queryDto = {
        unitId: 'TEST12345', collDate: '2024-01-15T00:00:00Z', codeScheme: 'I'
      };

      service.getUnitAttributesPaginated(25, 0, queryDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.length).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/unit-attributes/25/0'),
            queryDto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getUnitAttributesPaginated(25, 0, {
        unitId: 'TEST12345', collDate: '2024-01-15T00:00:00Z', codeScheme: 'I'
      }).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getUnitAttributesFilterOptions', () => {
    it('should fetch unit filter options successfully', (done) => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: { attribCodes: [{ code: 'A1', description: 'Attr 1' }], attribGroups: [], users: ['USER01'] }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getUnitAttributesFilterOptions('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.attribCodes.length).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/unit-attributes/filter-options')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getUnitAttributesFilterOptions('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getComponentAttributesPaginated', () => {
    it('should post query and return paginated component attributes', (done) => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: [mockComponentAttribute], total: 1
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      const queryDto = {
        unitId: 'TEST12345', collDate: '2024-01-15T00:00:00Z', codeScheme: 'I'
      };

      service.getComponentAttributesPaginated(25, 0, queryDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data?.length).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/component-attributes/25/0'),
            queryDto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.getComponentAttributesPaginated(25, 0, {
        unitId: 'TEST12345', collDate: '2024-01-15T00:00:00Z', codeScheme: 'I'
      }).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });

  describe('getComponentAttributesFilterOptions', () => {
    it('should fetch component filter options successfully', (done) => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: { productCodes: [], attribCodes: [], users: ['USER01'] }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getComponentAttributesFilterOptions('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('cpq-attributes/component-attributes/filter-options')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should include productCode when provided', (done) => {
      const mockResponse = {
        success: true, statusCode: 200, message: '',
        data: { productCodes: [], attribCodes: [], users: [] }
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getComponentAttributesFilterOptions('TEST12345', '2024-01-15T00:00:00Z', 'I', 'RBC001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('productCode=RBC001')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error on failure', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      apiServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getComponentAttributesFilterOptions('TEST12345', '2024-01-15T00:00:00Z', 'I').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });
  });
});
