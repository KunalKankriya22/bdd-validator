import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NtResultsService } from './nt-results.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  CreateNtBatchRequestDto,
  AddUnitToNtBatchRequestDto,
  NtBatchDto,
  ValidTestDto,
  TestGroupDto,
  TestGroupValidationDto,
  AddUnitResponseDto,
  ApiSingleResponse,
  ApiDataResponse
} from '../models/nt-results.model';

describe('NtResultsService', () => {
  let service: NtResultsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockBatch: NtBatchDto = {
    tbId: '062126-NT1001',
    testChapterId: '0001',
    groupTestId: null,
    userId: 'USER01',
    insertDats: '2026-06-21T14:30:00Z',
    firstUnitId: null,
    lastUnitId: null,
    repeatFlag: 'N',
    startWorkNumber: '5000',
    details: [
      { tbId: '062126-NT1001', testChapterId: '0001', testId: 'ABORH', testType: 'A', testingLabCode: null }
    ]
  };

  const mockAddUnitResponse: AddUnitResponseDto = {
    unitId: 'W123418031302',
    tbId: '062126-NT1001',
    collDate: '2026-06-20',
    testsProcessed: 1,
    testsAutoScheduled: 0
  };

  const mockValidTest: ValidTestDto = {
    testId: 'ABORH',
    testDesc: 'ABO/Rh Typing',
    testGroup: 'BLOOD',
    antigenFlag: 'N',
    autoSchedule: 'Y',
    effDate: '2020-01-01',
    termDate: null
  };

  const mockTestGroup: TestGroupDto = {
    code: 'VIRAL',
    codeDesc: 'Viral Marker Tests',
    effDate: '2020-01-01',
    termDate: null
  };

  const mockTestGroupValidation: TestGroupValidationDto = {
    code: 'VIRAL',
    codeDesc: 'Viral Marker Tests',
    activeTestCount: 5
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        NtResultsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(NtResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createBatch', () => {
    it('should create a batch with test IDs', (done) => {
      const request: CreateNtBatchRequestDto = { testIds: ['ABORH', 'HBC'] };
      const apiResponse: ApiSingleResponse<NtBatchDto> = {
        success: true, statusCode: 201, message: 'Created', item: mockBatch
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.createBatch(request).subscribe({
        next: batch => {
          expect(batch).toEqual(mockBatch);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.CREATE_BATCH, request
          );
          done();
        },
        error: done.fail
      });
    });

    it('should create a batch with groupTestId', (done) => {
      const request: CreateNtBatchRequestDto = { groupTestId: 'GRP001' };
      const apiResponse: ApiSingleResponse<NtBatchDto> = {
        success: true, statusCode: 201, message: 'Created', item: mockBatch
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.createBatch(request).subscribe({
        next: batch => {
          expect(batch).toEqual(mockBatch);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when create batch fails', (done) => {
      const request: CreateNtBatchRequestDto = { testIds: ['ABORH'] };
      const error = { statusCode: 500, message: 'Internal Server Error' };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.createBatch(request).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('addUnitToBatch', () => {
    it('should add unit to batch', (done) => {
      const batchId = '062126-NT1001';
      const request: AddUnitToNtBatchRequestDto = { unitId: 'W123418031302', tbId: batchId };
      const apiResponse: ApiSingleResponse<AddUnitResponseDto> = {
        success: true, statusCode: 200, message: 'OK', item: mockAddUnitResponse
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.addUnitToBatch(batchId, request).subscribe({
        next: response => {
          expect(response.testsProcessed).toBe(1);
          done();
        },
        error: done.fail
      });
    });

    it('should call the correct API endpoint with batchId', (done) => {
      const batchId = '062126-NT1001';
      const request: AddUnitToNtBatchRequestDto = { unitId: 'W123418031302', tbId: batchId };
      const apiResponse: ApiSingleResponse<AddUnitResponseDto> = {
        success: true, statusCode: 200, message: 'OK', item: mockAddUnitResponse
      };

      apiServiceSpy.post.and.returnValue(of(apiResponse));

      service.addUnitToBatch(batchId, request).subscribe({
        next: response => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.ADD_UNIT(batchId), request
          );
          expect(response).toEqual(mockAddUnitResponse);
          done();
        },
        error: done.fail
      });
    });

    it('should handle error on unit not checked in', (done) => {
      const batchId = '062126-NT1001';
      const request: AddUnitToNtBatchRequestDto = { unitId: 'INVALID', tbId: batchId };
      const error = { statusCode: 400, errorResponse: { error: 'Unit has not been checked-in' } };

      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.addUnitToBatch(batchId, request).subscribe({
        next: () => done.fail('should error'),
        error: err => {
          expect(err.statusCode).toBe(400);
          done();
        }
      });
    });
  });

  describe('getValidTests', () => {
    it('should return valid tests without filter', (done) => {
      const mockTests: ValidTestDto[] = [mockValidTest];
      const apiResponse: ApiDataResponse<ValidTestDto> = {
        success: true, statusCode: 200, message: 'OK', data: mockTests
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidTests().subscribe({
        next: tests => {
          expect(tests).toEqual(mockTests);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_TESTS(undefined)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should filter by test group', (done) => {
      const apiResponse: ApiDataResponse<ValidTestDto> = {
        success: true, statusCode: 200, message: 'OK', data: []
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidTests('VIRAL').subscribe({
        next: tests => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_TESTS('VIRAL')
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse: ApiDataResponse<ValidTestDto> = {
        success: true, statusCode: 200, message: 'OK', data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidTests().subscribe({
        next: tests => {
          expect(tests).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      const apiResponse = {
        success: true, statusCode: 200, message: 'OK'
      } as ApiDataResponse<ValidTestDto>;

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getValidTests().subscribe({
        next: tests => {
          expect(tests).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when getValidTests fails', (done) => {
      const error = { statusCode: 500, message: 'Server Error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getValidTests().subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getTestById', () => {
    it('should return a test by ID', (done) => {
      const testId = 'ABORH';
      const apiResponse: ApiSingleResponse<ValidTestDto> = {
        success: true, statusCode: 200, message: 'OK', item: mockValidTest
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getTestById(testId).subscribe({
        next: test => {
          expect(test).toEqual(mockValidTest);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_TEST(testId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when test not found', (done) => {
      const testId = 'NONEXISTENT';
      const error = { statusCode: 404, message: 'Test not found' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTestById(testId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('getTestGroups', () => {
    it('should return test groups', (done) => {
      const mockGroups: TestGroupDto[] = [mockTestGroup];
      const apiResponse: ApiDataResponse<TestGroupDto> = {
        success: true, statusCode: 200, message: 'OK', data: mockGroups
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getTestGroups().subscribe({
        next: groups => {
          expect(groups).toEqual(mockGroups);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_TEST_GROUPS
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when data is null', (done) => {
      const apiResponse: ApiDataResponse<TestGroupDto> = {
        success: true, statusCode: 200, message: 'OK', data: null as any
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getTestGroups().subscribe({
        next: groups => {
          expect(groups).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array when data is undefined', (done) => {
      const apiResponse = {
        success: true, statusCode: 200, message: 'OK'
      } as ApiDataResponse<TestGroupDto>;

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getTestGroups().subscribe({
        next: groups => {
          expect(groups).toEqual([]);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when getTestGroups fails', (done) => {
      const error = { statusCode: 500, message: 'Server Error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getTestGroups().subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('validateTestGroup', () => {
    it('should validate a test group by code', (done) => {
      const code = 'VIRAL';
      const apiResponse: ApiSingleResponse<TestGroupValidationDto> = {
        success: true, statusCode: 200, message: 'OK', item: mockTestGroupValidation
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.validateTestGroup(code).subscribe({
        next: validation => {
          expect(validation).toEqual(mockTestGroupValidation);
          expect(validation.activeTestCount).toBe(5);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_TEST_GROUP_VALIDATE(code)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when validation fails', (done) => {
      const code = 'INVALID';
      const error = { statusCode: 404, message: 'Test group not found' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.validateTestGroup(code).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });

  describe('getBatches', () => {
    it('should return batches with default pagination', (done) => {
      const mockBatches: NtBatchDto[] = [mockBatch];
      const apiResponse: ApiDataResponse<NtBatchDto> = {
        success: true, statusCode: 200, message: 'OK', data: mockBatches, total: 1
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getBatches().subscribe({
        next: result => {
          expect(result.data).toEqual(mockBatches);
          expect(result.total).toBe(1);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_BATCHES(25, 0)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return batches with custom pagination', (done) => {
      const mockBatches: NtBatchDto[] = [mockBatch];
      const apiResponse: ApiDataResponse<NtBatchDto> = {
        success: true, statusCode: 200, message: 'OK', data: mockBatches, total: 50
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getBatches(10, 20).subscribe({
        next: result => {
          expect(result.data).toEqual(mockBatches);
          expect(result.total).toBe(50);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_BATCHES(10, 20)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array and zero total when data and total are null', (done) => {
      const apiResponse: ApiDataResponse<NtBatchDto> = {
        success: true, statusCode: 200, message: 'OK', data: null as any, total: null as any
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getBatches().subscribe({
        next: result => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should return empty array and zero total when data and total are undefined', (done) => {
      const apiResponse = {
        success: true, statusCode: 200, message: 'OK'
      } as ApiDataResponse<NtBatchDto>;

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getBatches().subscribe({
        next: result => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when getBatches fails', (done) => {
      const error = { statusCode: 500, message: 'Server Error' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getBatches().subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getBatchById', () => {
    it('should return a batch by ID', (done) => {
      const batchId = '062126-NT1001';
      const apiResponse: ApiSingleResponse<NtBatchDto> = {
        success: true, statusCode: 200, message: 'OK', item: mockBatch
      };

      apiServiceSpy.get.and.returnValue(of(apiResponse));

      service.getBatchById(batchId).subscribe({
        next: batch => {
          expect(batch).toEqual(mockBatch);
          expect(batch.tbId).toBe('062126-NT1001');
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY.ENTER_NT_RESULTS.GET_BATCH(batchId)
          );
          done();
        },
        error: done.fail
      });
    });

    it('should propagate error when batch not found', (done) => {
      const batchId = 'NONEXISTENT';
      const error = { statusCode: 404, message: 'Batch not found' };

      apiServiceSpy.get.and.returnValue(throwError(() => error));

      service.getBatchById(batchId).subscribe({
        next: () => done.fail('should have errored'),
        error: err => {
          expect(err.statusCode).toBe(404);
          done();
        }
      });
    });
  });
});
