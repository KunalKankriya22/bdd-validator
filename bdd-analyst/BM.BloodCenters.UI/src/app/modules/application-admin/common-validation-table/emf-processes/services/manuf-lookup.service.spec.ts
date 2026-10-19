import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { ManufLookupService } from './manuf-lookup.service';

describe('ManufLookupService', () => {
  let service: ManufLookupService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ManufLookupService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(ManufLookupService);
  });

  describe('getTableNames', () => {
    const mockTables = ['UNITS', 'DONORS', 'PRODUCTS', 'TESTS'];

    it('should fetch table names successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockTables,
        total: 4
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getTableNames().subscribe({
        next: (result) => {
          expect(result).toEqual(mockTables);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should filter tables by search term', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockTables,
        total: 4
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getTableNames('DON').subscribe({
        next: (result) => {
          expect(result).toEqual(['DONORS']);
          done();
        }
      });
    });

    it('should perform case-insensitive search', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockTables,
        total: 4
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getTableNames('units').subscribe({
        next: (result) => {
          expect(result).toEqual(['UNITS']);
          done();
        }
      });
    });

    it('should return empty array when search term does not match', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockTables,
        total: 4
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getTableNames('NONEXISTENT').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });


  });

  describe('getColumnNames', () => {
    const mockColumns = [
      { tableName: 'UNITS', columnName: 'DIN' },
      { tableName: 'UNITS', columnName: 'BAG_CODE' },
      { tableName: 'UNITS', columnName: 'PRODUCT_CODE' }
    ];

    it('should fetch column names successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockColumns,
        total: 3
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getColumnNames('UNITS').subscribe({
        next: (result) => {
          expect(result).toEqual(['DIN', 'BAG_CODE', 'PRODUCT_CODE']);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle empty column list', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getColumnNames('EMPTY_TABLE').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });


  });

  describe('getMappingNames', () => {
    const mockMappings = [
      { mappingName: 'MAPPING1' },
      { mappingName: 'MAPPING2' },
      { mappingName: 'MAPPING3' }
    ];

    it('should fetch mapping names successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockMappings,
        total: 3
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getMappingNames('TEST_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual(['MAPPING1', 'MAPPING2', 'MAPPING3']);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle empty mapping list', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getMappingNames('NEW_PROC').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });


  });

  describe('getProcessCodes', () => {
    const mockProcessCodes = [
      { processCode: 'PROC1' },
      { processCode: 'PROC2' },
      { processCode: 'PROC3' }
    ];

    it('should fetch process codes successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockProcessCodes,
        total: 3
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual(['PROC1', 'PROC2', 'PROC3']);
          expect(mockApiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle empty process codes list', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getProcessCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });


  });

  describe('validateTableName', () => {
    const mockTables = ['UNITS', 'DONORS', 'PRODUCTS'];

    it('should return true for valid table name', (done) => {
      const mockResponse = {
        success: true,
        data: mockTables,
        error: null,
        message: '',
        statusCode: 200,
        total: 3
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateTableName('UNITS').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(true);
          done();
        }
      });
    });

    it('should return false for invalid table name', (done) => {
      const mockResponse = {
        success: true,
        data: mockTables,
        error: null,
        message: '',
        statusCode: 200,
        total: 3
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateTableName('INVALID_TABLE').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });


    it('should return false for empty table name', (done) => {
      service.validateTableName('').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(mockApiService.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle API errors and return false', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.validateTableName('UNITS').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });
  });

  describe('validateColumnName', () => {
    const mockColumns = [
      { tableName: 'UNITS', columnName: 'DIN' },
      { tableName: 'UNITS', columnName: 'BAG_CODE' }
    ];

    it('should return true for valid column name', (done) => {
      const mockResponse = {
        success: true,
        data: mockColumns,
        error: null,
        message: '',
        statusCode: 200,
        total: 2
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateColumnName('UNITS', 'DIN').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(true);
          done();
        }
      });
    });

    it('should return false for invalid column name', (done) => {
      const mockResponse = {
        success: true,
        data: mockColumns,
        error: null,
        message: '',
        statusCode: 200,
        total: 2
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateColumnName('UNITS', 'INVALID_COLUMN').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });


    it('should return false for empty table name', (done) => {
      service.validateColumnName('', 'DIN').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(mockApiService.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return false for empty column name', (done) => {
      service.validateColumnName('UNITS', '').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(mockApiService.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle API errors and return false', (done) => {
      const error = new Error('Network Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.validateColumnName('UNITS', 'DIN').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });
  });

  describe('validateFunctionName', () => {
    it('should return true for valid function name', (done) => {
      const mockResponse = {
        success: true,
        data: [true],
        error: null,
        message: '',
        statusCode: 200,
        total: 1
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateFunctionName('PROC_DONOR').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(true);
          done();
        }
      });
    });

    it('should return false for invalid function name', (done) => {
      const mockResponse = {
        success: true,
        data: [false],
        error: null,
        message: '',
        statusCode: 200,
        total: 1
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.validateFunctionName('NONEXISTENT').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });

    it('should return false for empty function name', (done) => {
      service.validateFunctionName('').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(mockApiService.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should handle API errors and return false', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.validateFunctionName('PROC_DONOR').subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          done();
        }
      });
    });
  });
});
