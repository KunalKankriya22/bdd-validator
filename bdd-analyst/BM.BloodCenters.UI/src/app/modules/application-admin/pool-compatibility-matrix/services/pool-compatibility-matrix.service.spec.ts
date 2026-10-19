import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PoolCompatibilityMatrixService } from './pool-compatibility-matrix.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  PoolCompatibilityMatrixModel,
  PoolCompatibilityMatrixParamsDto,
  PoolCompatibilityMatrixCreateDto,
  PoolCompatibilityMatrixUpdateDto,
  PoolCompatibilityMatrixBatchCreateDto,
  PoolCompatibilityMatrixBatchResponse,
  PoolCompatibilityMatrixResponse,
  ProductTypeOption,
  WorkOptionModel
} from '../models/pool-compatibility-matrix.model';

describe('PoolCompatibilityMatrixService', () => {
  let service: PoolCompatibilityMatrixService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockMatrixRecord: PoolCompatibilityMatrixModel = {
    chapterId: 'CH001',
    workOption: 'POOL',
    workOptionDescription: 'Pool',
    inventoryProductType: 'RBC',
    finishedInventoryProductType: 'PLT',
    effectiveDate: '2025-01-01T00:00:00',
    terminationDate: null,
    lastModifiedDate: '2025-06-01T10:00:00'
  };

  const mockProductTypes: ProductTypeOption[] = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLT', description: 'Platelets' }
  ];

  const mockWorkOptions: WorkOptionModel[] = [
    { code: 'POOL', description: 'Pool' },
    { code: 'SPLIT', description: 'Split' }
  ];

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        PoolCompatibilityMatrixService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(PoolCompatibilityMatrixService);
  });

  // --- Existing tests (preserved, updated to use spy pattern) ---

  it('should fetch pool compatibility matrix data', (done) => {
    const mockResponse: PoolCompatibilityMatrixResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      item: {
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 10
      },
      total: 0
    };

    mockApiService.post.and.returnValue(of(mockResponse));

    service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(response => {
      expect(response.data).toEqual([]);
      expect(response.totalRecords).toBe(0);
      done();
    });
  });

  it('should fetch inventory product types', (done) => {
    const mockData: ProductTypeOption[] = [
      { productType: 'RBC', description: 'Red Blood Cells' }
    ];

    mockApiService.get.and.returnValue(of(mockData));

    service.getInventoryProductTypes().subscribe(data => {
      expect(data).toEqual(mockData);
      done();
    });
  });

  it('should create pool compatibility matrix record', (done) => {
    const payload: PoolCompatibilityMatrixCreateDto = {
      workOption: 'POOL',
      inventoryProductType: 'RBC',
      finishedInventoryProductType: 'RBC',
      effectiveDate: '2028-06-01T00:00:00'
    };

    mockApiService.post.and.returnValue(of({}));

    service.createPoolCompatibilityMatrix(payload).subscribe(() => {
      expect(mockApiService.post).toHaveBeenCalledWith(
        API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_CREATE,
        payload
      );
      done();
    });
  });

  // --- New comprehensive tests ---

  describe('getPoolCompatibilityMatrix', () => {
    it('should call apiService.post with correct endpoint and params', (done) => {
      const params: PoolCompatibilityMatrixParamsDto = {
        searchItem: 'test',
        sortOrder: 'asc'
      };
      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: { data: [], totalCount: 0, page: 1, pageSize: 10 },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX(10, 0),
          params
        );
        done();
      });
    });

    it('should return data and totalRecords from response', (done) => {
      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: [mockMatrixRecord],
          totalCount: 50,
          page: 1,
          pageSize: 10
        },
        total: 50
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([mockMatrixRecord]);
        expect(result.totalRecords).toBe(50);
        done();
      });
    });

    it('should estimate totalCount when totalCount is 0 and data fills a full page', (done) => {
      const records: PoolCompatibilityMatrixModel[] = Array.from({ length: 10 }, (_, i) => ({
        ...mockMatrixRecord,
        chapterId: `CH${i}`
      }));

      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: records,
          totalCount: 0,
          page: 1,
          pageSize: 10
        },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      // take=10, skip=20 => totalCount = skip(20) + data.length(10) + take(10) = 40
      service.getPoolCompatibilityMatrix(10, 20, {}).subscribe(result => {
        expect(result.data.length).toBe(10);
        expect(result.totalRecords).toBe(40);
        done();
      });
    });

    it('should estimate totalCount when totalCount is 0 and data is a partial page', (done) => {
      const records: PoolCompatibilityMatrixModel[] = Array.from({ length: 3 }, (_, i) => ({
        ...mockMatrixRecord,
        chapterId: `CH${i}`
      }));

      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: records,
          totalCount: 0,
          page: 1,
          pageSize: 10
        },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      // take=10, skip=20, data.length=3 => totalCount = skip(20) + data.length(3) = 23
      service.getPoolCompatibilityMatrix(10, 20, {}).subscribe(result => {
        expect(result.data.length).toBe(3);
        expect(result.totalRecords).toBe(23);
        done();
      });
    });

    it('should not estimate totalCount when totalCount is non-zero', (done) => {
      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: [mockMatrixRecord],
          totalCount: 100,
          page: 1,
          pageSize: 10
        },
        total: 100
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(100);
        done();
      });
    });

    it('should handle null item in response gracefully', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: null,
        total: 0
      } as any;

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should handle undefined item in response gracefully', (done) => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 0
      } as any;

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should not estimate when totalCount is 0 and data is empty', (done) => {
      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: [],
          totalCount: 0,
          page: 1,
          pageSize: 10
        },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should pass different pagination parameters to correct endpoint', (done) => {
      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: { data: [], totalCount: 0, page: 3, pageSize: 25 },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(25, 50, {}).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX(25, 50),
          {}
        );
        done();
      });
    });

    it('should pass all filter parameters to API', (done) => {
      const params: PoolCompatibilityMatrixParamsDto = {
        searchItem: 'RBC',
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: '2025-12-31',
        terminationDateFrom: '2026-01-01',
        terminationDateTo: '2026-12-31',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        sortOrder: 'desc'
      };

      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: { data: [], totalCount: 0, page: 1, pageSize: 10 },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getPoolCompatibilityMatrix(10, 0, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          jasmine.objectContaining({
            searchItem: 'RBC',
            effectiveDateFrom: '2025-01-01',
            effectiveDateTo: '2025-12-31',
            terminationDateFrom: '2026-01-01',
            terminationDateTo: '2026-12-31',
            inventoryProductType: 'RBC',
            finishedInventoryProductType: 'PLT',
            sortOrder: 'desc'
          })
        );
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getPoolCompatibilityMatrix(10, 0, {}).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should estimate full-page totalCount with skip=0', (done) => {
      const records: PoolCompatibilityMatrixModel[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockMatrixRecord,
        chapterId: `CH${i}`
      }));

      const mockResponse: PoolCompatibilityMatrixResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        item: {
          data: records,
          totalCount: 0,
          page: 1,
          pageSize: 5
        },
        total: 0
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      // take=5, skip=0, data.length=5 => totalCount = 0 + 5 + 5 = 10
      service.getPoolCompatibilityMatrix(5, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(10);
        done();
      });
    });
  });

  describe('getInventoryProductTypes', () => {
    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getInventoryProductTypes().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_INVENTORY_TYPES
        );
        done();
      });
    });

    it('should return product type options', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getInventoryProductTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].productType).toBe('RBC');
        expect(result[1].description).toBe('Platelets');
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Inventory types API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getInventoryProductTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getFinishedProductTypes', () => {
    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFinishedProductTypes().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FINISHED_TYPES
        );
        done();
      });
    });

    it('should return finished product type options', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFinishedProductTypes().subscribe(result => {
        expect(result).toEqual(mockProductTypes);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Finished types API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFinishedProductTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getFilterInventoryProductTypes', () => {
    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFilterInventoryProductTypes().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FILTER_INVENTORY_TYPES
        );
        done();
      });
    });

    it('should return filter inventory product type options', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFilterInventoryProductTypes().subscribe(result => {
        expect(result).toEqual(mockProductTypes);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Filter inventory types API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFilterInventoryProductTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getFilterFinishedProductTypes', () => {
    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFilterFinishedProductTypes().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_FILTER_FINISHED_TYPES
        );
        done();
      });
    });

    it('should return filter finished product type options', (done) => {
      mockApiService.get.and.returnValue(of(mockProductTypes));

      service.getFilterFinishedProductTypes().subscribe(result => {
        expect(result).toEqual(mockProductTypes);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Filter finished types API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFilterFinishedProductTypes().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('getWorkOptions', () => {
    it('should call apiService.get with correct endpoint', (done) => {
      mockApiService.get.and.returnValue(of(mockWorkOptions));

      service.getWorkOptions().subscribe(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_WORK_OPTIONS
        );
        done();
      });
    });

    it('should return work option models', (done) => {
      mockApiService.get.and.returnValue(of(mockWorkOptions));

      service.getWorkOptions().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('POOL');
        expect(result[1].description).toBe('Split');
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Work options API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getWorkOptions().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('createPoolCompatibilityMatrix', () => {
    it('should call apiService.post with correct endpoint and payload', (done) => {
      const payload: PoolCompatibilityMatrixCreateDto = {
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        effectiveDate: '2025-01-01T00:00:00',
        terminationDate: '2025-12-31T00:00:00'
      };

      mockApiService.post.and.returnValue(of({ success: true }));

      service.createPoolCompatibilityMatrix(payload).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_CREATE,
          payload
        );
        done();
      });
    });

    it('should handle create without optional terminationDate', (done) => {
      const payload: PoolCompatibilityMatrixCreateDto = {
        workOption: 'SPLIT',
        inventoryProductType: 'PLT',
        finishedInventoryProductType: 'RBC',
        effectiveDate: '2025-06-01T00:00:00'
      };

      mockApiService.post.and.returnValue(of({ success: true }));

      service.createPoolCompatibilityMatrix(payload).subscribe(result => {
        expect(result).toEqual({ success: true });
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Create API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const payload: PoolCompatibilityMatrixCreateDto = {
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        effectiveDate: '2025-01-01T00:00:00'
      };

      service.createPoolCompatibilityMatrix(payload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('updatePoolCompatibilityMatrix', () => {
    it('should call apiService.put with correct endpoint and payload', (done) => {
      const payload: PoolCompatibilityMatrixUpdateDto = {
        chapterId: 'CH001',
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        originalInventoryProductType: 'WBC',
        originalFinishedInventoryProductType: 'RBC',
        effectiveDate: '2025-01-01T00:00:00',
        terminationDate: '2025-12-31T00:00:00'
      };

      mockApiService.put.and.returnValue(of({ success: true }));

      service.updatePoolCompatibilityMatrix(payload).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_UPDATE,
          payload
        );
        done();
      });
    });

    it('should return the update result', (done) => {
      const payload: PoolCompatibilityMatrixUpdateDto = {
        chapterId: 'CH001',
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        originalInventoryProductType: 'RBC',
        originalFinishedInventoryProductType: 'PLT',
        effectiveDate: '2025-01-01T00:00:00'
      };

      const mockResult = { success: true, message: 'Updated' };
      mockApiService.put.and.returnValue(of(mockResult));

      service.updatePoolCompatibilityMatrix(payload).subscribe(result => {
        expect(result).toEqual(mockResult);
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Update API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      const payload: PoolCompatibilityMatrixUpdateDto = {
        chapterId: 'CH001',
        workOption: 'POOL',
        inventoryProductType: 'RBC',
        finishedInventoryProductType: 'PLT',
        originalInventoryProductType: 'RBC',
        originalFinishedInventoryProductType: 'PLT',
        effectiveDate: '2025-01-01T00:00:00'
      };

      service.updatePoolCompatibilityMatrix(payload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('batchCreatePoolCompatibilityMatrix', () => {
    it('should call apiService.post with correct endpoint and payload', (done) => {
      const payload: PoolCompatibilityMatrixBatchCreateDto = {
        records: [
          {
            workOption: 'POOL',
            inventoryProductType: 'RBC',
            finishedInventoryProductType: 'PLT',
            effectiveDate: '2025-01-01T00:00:00'
          },
          {
            workOption: 'SPLIT',
            inventoryProductType: 'PLT',
            finishedInventoryProductType: 'RBC',
            effectiveDate: '2025-06-01T00:00:00'
          }
        ]
      };

      const mockBatchResponse: PoolCompatibilityMatrixBatchResponse = {
        totalRecords: 2,
        successCount: 2,
        failureCount: 0,
        results: [
          { index: 0, success: true, record: payload.records[0] },
          { index: 1, success: true, record: payload.records[1] }
        ],
        message: 'Batch create successful'
      };

      mockApiService.post.and.returnValue(of(mockBatchResponse));

      service.batchCreatePoolCompatibilityMatrix(payload).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.POOL_COMPATIBILITY_MATRIX_BATCH,
          payload
        );
        done();
      });
    });

    it('should return batch response with success and failure counts', (done) => {
      const payload: PoolCompatibilityMatrixBatchCreateDto = {
        records: [
          {
            workOption: 'POOL',
            inventoryProductType: 'RBC',
            finishedInventoryProductType: 'PLT',
            effectiveDate: '2025-01-01T00:00:00'
          }
        ]
      };

      const mockBatchResponse: PoolCompatibilityMatrixBatchResponse = {
        totalRecords: 1,
        successCount: 1,
        failureCount: 0,
        results: [
          { index: 0, success: true, record: payload.records[0] }
        ],
        message: 'All records created successfully'
      };

      mockApiService.post.and.returnValue(of(mockBatchResponse));

      service.batchCreatePoolCompatibilityMatrix(payload).subscribe(result => {
        expect(result.totalRecords).toBe(1);
        expect(result.successCount).toBe(1);
        expect(result.failureCount).toBe(0);
        expect(result.results.length).toBe(1);
        expect(result.results[0].success).toBeTrue();
        done();
      });
    });

    it('should handle partial batch failure', (done) => {
      const records: PoolCompatibilityMatrixCreateDto[] = [
        {
          workOption: 'POOL',
          inventoryProductType: 'RBC',
          finishedInventoryProductType: 'PLT',
          effectiveDate: '2025-01-01T00:00:00'
        },
        {
          workOption: 'SPLIT',
          inventoryProductType: 'PLT',
          finishedInventoryProductType: 'RBC',
          effectiveDate: '2025-06-01T00:00:00'
        }
      ];

      const payload: PoolCompatibilityMatrixBatchCreateDto = { records };

      const mockBatchResponse: PoolCompatibilityMatrixBatchResponse = {
        totalRecords: 2,
        successCount: 1,
        failureCount: 1,
        results: [
          { index: 0, success: true, record: records[0] },
          { index: 1, success: false, errorMessage: 'Duplicate record', record: records[1] }
        ],
        message: 'Partial success'
      };

      mockApiService.post.and.returnValue(of(mockBatchResponse));

      service.batchCreatePoolCompatibilityMatrix(payload).subscribe(result => {
        expect(result.successCount).toBe(1);
        expect(result.failureCount).toBe(1);
        expect(result.results[1].success).toBeFalse();
        expect(result.results[1].errorMessage).toBe('Duplicate record');
        done();
      });
    });

    it('should propagate errors from API', (done) => {
      const error = new Error('Batch create API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      const payload: PoolCompatibilityMatrixBatchCreateDto = {
        records: []
      };

      service.batchCreatePoolCompatibilityMatrix(payload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });
});
