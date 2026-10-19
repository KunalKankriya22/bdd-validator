import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestSeriesConfigApiService } from './test-series-configuration-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  TestSeriesConfigDto,
  CreateTestSeriesConfigDto,
  UpdateTestSeriesConfigDto,
  TestSeriesConfigCompositeKey,
  ApiResponse,
} from '../models/test-series-configuration.model';

describe('TestSeriesConfigApiService', () => {
  let service: TestSeriesConfigApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockConfigDto: TestSeriesConfigDto = {
    testSeriesId: 'HIV',
    levelCode: 1,
    setNo: 1,
    testId: 'HIV-1/2',
    resultCode: 'R',
    scheduleTest: 'HIV 1 FA',
    cancelTest: 'HIV-1 WB',
    anotationCode: 'HIV-1 WB',
    finalFlag: 'Y',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    insertDate: '2024-01-01T00:00:00Z',
    insertUser: 'SYSTEM',
  };

  const mockApiResponse: ApiResponse<TestSeriesConfigDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: [mockConfigDto],
    total: 1,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestSeriesConfigApiService,
        { provide: ApiService, useValue: spy },
      ],
    });

    service = TestBed.inject(TestSeriesConfigApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAll', () => {
    it('should fetch all configurations with pagination', (done) => {
      apiServiceSpy.post.and.returnValue(
        jasmine.createSpyObj('Observable', ['pipe'])
      );

      const take = 25;
      const skip = 0;
      const query = { testSeriesId: 'HIV' };

      // We need to mock the pipe chain
      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next({ items: [mockConfigDto], totalRecords: 1 });
          },
        }),
      };

      apiServiceSpy.post.and.returnValue(mockObservable as never);

      service.getAll(take, skip, query).subscribe({
        next: (response) => {
          expect(response.items.length).toBe(1);
          expect(response.totalRecords).toBe(1);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.TEST_SERIES_CONFIG.LIST(take, skip),
            jasmine.objectContaining({ testSeriesId: 'HIV' })
          );
          done();
        },
      });
    });

    it('should handle empty query parameters', (done) => {
      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next({ items: [], totalRecords: 0 });
          },
        }),
      };

      apiServiceSpy.post.and.returnValue(mockObservable as never);

      service.getAll(25, 0, {}).subscribe({
        next: (response) => {
          expect(response.items.length).toBe(0);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.TEST_SERIES_CONFIG.LIST(25, 0),
            {}
          );
          done();
        },
      });
    });
  });

  describe('getById', () => {
    it('should fetch a single configuration by composite key', (done) => {
      const params: TestSeriesConfigCompositeKey = {
        testSeriesId: 'HIV',
        levelCode: 1,
        setNo: 1,
        testId: null,
      };

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockConfigDto);
          },
        }),
      };

      apiServiceSpy.get.and.returnValue(mockObservable as never);

      service.getById(params).subscribe({
        next: (data) => {
          expect(data).toEqual(mockConfigDto);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new configuration', (done) => {
      const createDto: CreateTestSeriesConfigDto = {
        testSeriesId: 'HIV',
        levelCode: 1,
        setNo: 1,
        resultCode: 'R',
        effDate: '2024-01-01',
      };

      const mockResponse: ApiResponse = {
        success: true,
        statusCode: 201,
        message: 'Record created successfully',
      };

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockResponse);
          },
        }),
      };

      apiServiceSpy.post.and.returnValue(mockObservable as never);

      service.create(createDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.statusCode).toBe(201);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.TEST_SERIES_CONFIG.CREATE,
            createDto
          );
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update an existing configuration', (done) => {
      const params: TestSeriesConfigCompositeKey = {
        testSeriesId: 'HIV',
        levelCode: 1,
        setNo: 1,
      };

      const updateDto: UpdateTestSeriesConfigDto = {
        levelCode: 2,
        effDate: '2024-06-01',
      };

      const mockResponse: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Record updated successfully',
      };

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockResponse);
          },
        }),
      };

      apiServiceSpy.put.and.returnValue(mockObservable as never);

      service.update(params, updateDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should soft delete a configuration', (done) => {
      const params: TestSeriesConfigCompositeKey = {
        testSeriesId: 'HIV',
        levelCode: 1,
        setNo: 1,
      };

      const mockResponse: ApiResponse = {
        success: true,
        statusCode: 200,
        message: 'Record deleted successfully',
      };

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockResponse);
          },
        }),
      };

      apiServiceSpy.delete.and.returnValue(mockObservable as never);

      service.delete(params).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(apiServiceSpy.delete).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('getTestSeriesDropdown', () => {
    it('should fetch test series dropdown options', (done) => {
      const mockDropdown = [
        { testSeriesId: 'HIV', description: 'Abbott PRISM HIV RR' },
        { testSeriesId: 'HCV', description: 'HCV Series' },
      ];

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockDropdown);
          },
        }),
      };

      apiServiceSpy.get.and.returnValue(mockObservable as never);

      service.getTestSeriesDropdown().subscribe({
        next: (options) => {
          expect(options.length).toBe(2);
          expect(options[0].testSeriesId).toBe('HIV');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_SERIES_CONFIG.TEST_SERIES_DROPDOWN
          );
          done();
        },
      });
    });
  });

  describe('getValidTests', () => {
    it('should fetch valid tests without filter', (done) => {
      const mockTests = [
        { testId: 'TEST001', testDesc: 'Test 1', testGroup: 'CNFRM' },
        { testId: 'TEST002', testDesc: 'Test 2', testGroup: 'SUPP' },
      ];

      const mockObservable = {
        pipe: jasmine.createSpy('pipe').and.returnValue({
          subscribe: (callbacks: { next: (data: unknown) => void }) => {
            callbacks.next(mockTests);
          },
        }),
      };

      apiServiceSpy.get.and.returnValue(mockObservable as never);

      service.getValidTests().subscribe({
        next: (tests) => {
          expect(tests.length).toBe(2);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.TEST_SERIES_CONFIG.VALID_TESTS
          );
          done();
        },
      });
    });

  });
});
