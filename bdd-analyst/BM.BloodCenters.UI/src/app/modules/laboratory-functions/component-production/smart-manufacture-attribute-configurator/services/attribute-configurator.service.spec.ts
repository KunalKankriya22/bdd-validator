import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AttributeConfiguratorService } from './attribute-configurator.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  AttributeConfigDto,
  SaveAttributeConfigRequest,
  FunctionNameOption,
  LabProductTypeOption,
  AttributeClassOption,
  AttributeCodeOption,
  ModifierOption,
} from '../models/attribute-configurator.model';

describe('AttributeConfiguratorService', () => {
  let service: AttributeConfiguratorService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockBackendItem = {
    chapterId: 'CH001',
    productType: 'PLT',
    productTypeDesc: 'Platelets',
    attribClass: 'ABO',
    attribCode: 'A001',
    attribModifier: 'MOD1',
    effDate: '2024-01-01',
    termDate: '2024-12-31',
    fcnName: 'COMPONENT',
    modifiedDate: '2024-06-15',
    lastModifiedBy: 'admin',
    insertDate: '2024-01-01',
    insertUser: 'creator',
  };

  const mockBackendItemNullTermDate = {
    ...mockBackendItem,
    termDate: null,
  };

  const expectedFrontendItem: AttributeConfigDto = {
    chapterId: 'CH001',
    functionName: 'COMPONENT',
    labProductType: 'PLT',
    productDescription: 'Platelets',
    attributeClass: 'ABO',
    attributeCode: 'A001',
    modifier: 'MOD1',
    effectiveDate: '2024-01-01',
    terminationDate: '2024-12-31',
    insertUser: 'creator',
    insertDate: '2024-01-01',
    lastModifiedBy: 'admin',
    modifiedDate: '2024-06-15',
  };

  const expectedFrontendItemNullTermDate: AttributeConfigDto = {
    ...expectedFrontendItem,
    terminationDate: null,
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AttributeConfiguratorService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(AttributeConfiguratorService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAttributeConfigurations', () => {
    it('should map backend data to frontend model', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.data[0]).toEqual(expectedFrontendItem);
          expect(result.total).toBe(1);
          done();
        },
      });
    });

    it('should use default take=25 and skip=0', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.LIST(25, 0),
            { fcnName: 'COMPONENT' }
          );
          done();
        },
      });
    });

    it('should pass custom take and skip values', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT', 50, 10).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.LIST(50, 10),
            { fcnName: 'COMPONENT' }
          );
          done();
        },
      });
    });

    it('should include trimmed searchKeyword in payload', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT', 25, 0, '  PLT  ').subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.LIST(25, 0),
            { fcnName: 'COMPONENT', searchKeyword: 'PLT' }
          );
          done();
        },
      });
    });

    it('should not include searchKeyword when empty after trim', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT', 25, 0, '   ').subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.LIST(25, 0),
            { fcnName: 'COMPONENT' }
          );
          done();
        },
      });
    });

    it('should handle empty data array', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
      });
    });

    it('should return {data:[], total:0} on error', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Server error')));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
      });
    });
  });

  describe('transformBackendToFrontend (via getAttributeConfigurations)', () => {
    it('should map all backend fields to frontend model correctly', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: (result) => {
          const item = result.data[0];
          expect(item.chapterId).toBe('CH001');
          expect(item.functionName).toBe('COMPONENT');
          expect(item.labProductType).toBe('PLT');
          expect(item.productDescription).toBe('Platelets');
          expect(item.attributeClass).toBe('ABO');
          expect(item.attributeCode).toBe('A001');
          expect(item.modifier).toBe('MOD1');
          expect(item.effectiveDate).toBe('2024-01-01');
          expect(item.terminationDate).toBe('2024-12-31');
          expect(item.insertUser).toBe('creator');
          expect(item.insertDate).toBe('2024-01-01');
          expect(item.lastModifiedBy).toBe('admin');
          expect(item.modifiedDate).toBe('2024-06-15');
          done();
        },
      });
    });

    it('should map null termDate to null terminationDate', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBackendItemNullTermDate],
        error: null,
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAttributeConfigurations('COMPONENT').subscribe({
        next: (result) => {
          expect(result.data[0].terminationDate).toBeNull();
          done();
        },
      });
    });
  });

  describe('getById', () => {
    it('should return transformed first item from response', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getById('CH001', 'PLT', 'COMPONENT').subscribe({
        next: (result) => {
          expect(result).toEqual(expectedFrontendItem);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.GET_BY_ID('CH001', 'PLT', 'COMPONENT', undefined, undefined)
          );
          done();
        },
      });
    });

    it('should pass attribClass and attribCode when provided', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getById('CH001', 'PLT', 'COMPONENT', 'ABO', 'A001').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.ATTRIBUTE_CONFIG.GET_BY_ID('CH001', 'PLT', 'COMPONENT', 'ABO', 'A001')
          );
          done();
        },
      });
    });

    it('should return null when data array is empty', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getById('CH001', 'PLT', 'COMPONENT').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Not found')));

      service.getById('CH001', 'PLT', 'COMPONENT').subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
      });
    });
  });

  describe('create', () => {
    const saveRequest: SaveAttributeConfigRequest = {
      functionName: 'COMPONENT',
      labProductType: 'PLT',
      attributeClass: 'ABO',
      attributeCode: 'A001',
      modifier: 'MOD1',
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31',
    };

    it('should map frontend payload to backend fields and return transformed data on success', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          expect(result.message).toBe('Created');
          expect(result.data).toEqual(expectedFrontendItem);
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.ATTRIBUTE_CONFIG.CREATE);
          expect(callArgs[1]).toEqual({
            productType: 'PLT',
            fcnName: 'COMPONENT',
            attribClass: 'ABO',
            attribCode: 'A001',
            attribModifier: 'MOD1',
            effDate: '2024-01-01',
            termDate: '2024-12-31',
          });
          done();
        },
      });
    });

    it('should map null terminationDate to null termDate in payload', (done) => {
      const requestNoTerm: SaveAttributeConfigRequest = {
        ...saveRequest,
        terminationDate: null,
      };
      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: [mockBackendItemNullTermDate],
        error: null,
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(requestNoTerm).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1];
          expect(payload.termDate).toBeNull();
          done();
        },
      });
    });

    it('should pass through error response when success is false', (done) => {
      const errorResponse = {
        success: false,
        errorCode: 'DUPLICATE',
        error: 'Record already exists',
        message: 'Duplicate entry',
        statusCode: 409,
      };
      apiServiceSpy.post.and.returnValue(of(errorResponse));

      service.create(saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('DUPLICATE');
          expect(result.error).toBe('Record already exists');
          done();
        },
      });
    });

    it('should return null data when response data is empty', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeNull();
          done();
        },
      });
    });

    it('should return null data when response data is null', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: null,
        error: null,
        total: 0,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.create(saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeNull();
          done();
        },
      });
    });
  });

  describe('update', () => {
    const saveRequest: SaveAttributeConfigRequest = {
      functionName: 'COMPONENT',
      labProductType: 'PLT',
      attributeClass: 'ABO',
      attributeCode: 'A001',
      modifier: 'MOD1',
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31',
    };

    it('should include original fields for composite key', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest, 'ABO', 'A001').subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.originalProductType).toBe('PLT');
          expect(payload.originalFcnName).toBe('COMPONENT');
          expect(payload.originalAttribClass).toBe('ABO');
          expect(payload.originalAttribCode).toBe('A001');
          done();
        },
      });
    });

    it('should default originalAttribClass and originalAttribCode to empty string when not provided', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.originalAttribClass).toBe('');
          expect(payload.originalAttribCode).toBe('');
          done();
        },
      });
    });

    it('should add T00:00:00 to dates without time component', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.effDate).toBe('2024-01-01T00:00:00');
          expect(payload.termDate).toBe('2024-12-31T00:00:00');
          done();
        },
      });
    });

    it('should pass through dates that already have time component', (done) => {
      const requestWithTime: SaveAttributeConfigRequest = {
        ...saveRequest,
        effectiveDate: '2024-01-01T10:30:00',
        terminationDate: '2024-12-31T23:59:59',
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', requestWithTime).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.effDate).toBe('2024-01-01T10:30:00');
          expect(payload.termDate).toBe('2024-12-31T23:59:59');
          done();
        },
      });
    });

    it('should handle null terminationDate in formatDateWithTime', (done) => {
      const requestNullTerm: SaveAttributeConfigRequest = {
        ...saveRequest,
        terminationDate: null,
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItemNullTermDate],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', requestNullTerm).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.termDate).toBeNull();
          done();
        },
      });
    });

    it('should map frontend fields to backend fields in payload', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.productType).toBe('PLT');
          expect(payload.fcnName).toBe('COMPONENT');
          expect(payload.attribClass).toBe('ABO');
          expect(payload.attribCode).toBe('A001');
          expect(payload.attribModifier).toBe('MOD1');
          expect(apiServiceSpy.put.calls.mostRecent().args[0]).toBe(API.ATTRIBUTE_CONFIG.UPDATE);
          done();
        },
      });
    });

    it('should default modifier to empty string when null', (done) => {
      const requestNoModifier: SaveAttributeConfigRequest = {
        ...saveRequest,
        modifier: null,
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', requestNoModifier).subscribe({
        next: () => {
          const payload = apiServiceSpy.put.calls.mostRecent().args[1];
          expect(payload.attribModifier).toBe('');
          done();
        },
      });
    });

    it('should return transformed data on success', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [mockBackendItem],
        error: null,
        total: 1,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          expect(result.message).toBe('Updated');
          expect(result.data).toEqual(expectedFrontendItem);
          done();
        },
      });
    });

    it('should pass through error response when success is false', (done) => {
      const errorResponse = {
        success: false,
        errorCode: 'CONFLICT',
        error: 'Update conflict',
        message: 'Record was modified by another user',
        statusCode: 409,
      };
      apiServiceSpy.put.and.returnValue(of(errorResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(false);
          expect(result.errorCode).toBe('CONFLICT');
          done();
        },
      });
    });

    it('should return null data when response data is empty', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: [],
        error: null,
        total: 0,
      };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.update('PLT', 'COMPONENT', saveRequest).subscribe({
        next: (result: any) => {
          expect(result.success).toBe(true);
          expect(result.data).toBeNull();
          done();
        },
      });
    });
  });

  describe('getFunctionNames', () => {
    it('should return function name options', (done) => {
      const mockOptions: FunctionNameOption[] = [
        { code: 'COMPONENT', description: 'Component Production' },
      ];
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: mockOptions, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFunctionNames().subscribe({
        next: (result) => {
          expect(result).toEqual(mockOptions);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ATTRIBUTE_CONFIG.FUNCTION_NAMES);
          done();
        },
      });
    });

    it('should return empty array when data is null', (done) => {
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: null, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFunctionNames().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getFunctionNames().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getLabProductTypes', () => {
    it('should return lab product type options', (done) => {
      const mockOptions: LabProductTypeOption[] = [
        { productType: 'PLT', productTypeDesc: 'Platelets' },
      ];
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: mockOptions, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getLabProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockOptions);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ATTRIBUTE_CONFIG.PRODUCT_TYPES);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getLabProductTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getAttributeClasses', () => {
    it('should return attribute class options', (done) => {
      const mockOptions: AttributeClassOption[] = [
        { code: 'ABO', codeDesc: 'ABO Group' },
      ];
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: mockOptions, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeClasses().subscribe({
        next: (result) => {
          expect(result).toEqual(mockOptions);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ATTRIBUTE_CONFIG.ATTRIBUTE_CLASSES);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getAttributeClasses().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getAttributeCodes', () => {
    it('should return attribute code options', (done) => {
      const mockOptions: AttributeCodeOption[] = [
        { code: 'A001', codeDesc: 'Code A001' },
      ];
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: mockOptions, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAttributeCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(mockOptions);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ATTRIBUTE_CONFIG.ATTRIBUTE_CODES);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getAttributeCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });

  describe('getModifiers', () => {
    it('should return modifier options', (done) => {
      const mockOptions: ModifierOption[] = [
        { code: 'MOD1', codeDesc: 'Modifier 1' },
      ];
      const mockResponse = { success: true, statusCode: 200, message: 'Success', data: mockOptions, error: null };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getModifiers().subscribe({
        next: (result) => {
          expect(result).toEqual(mockOptions);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(API.ATTRIBUTE_CONFIG.ATTRIBUTE_MODIFIERS);
          done();
        },
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server error')));

      service.getModifiers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });
  });
});
