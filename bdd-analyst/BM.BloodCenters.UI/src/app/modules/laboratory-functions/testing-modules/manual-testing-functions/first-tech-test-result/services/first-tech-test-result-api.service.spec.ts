import { TestBed } from '@angular/core/testing';
import { HttpContext, HttpParams } from '@angular/common/http';
import { of } from 'rxjs';

import { FirstTechTestResultApiService } from './first-tech-test-result-api.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

describe('FirstTechTestResultApiService', () => {
  let service: FirstTechTestResultApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockReturnResult = { success: true, statusCode: 200, message: 'OK', data: [] };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        FirstTechTestResultApiService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(FirstTechTestResultApiService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  // ---------------------------------------------------------------------------
  // getFilterOptions
  // ---------------------------------------------------------------------------
  describe('getFilterOptions', () => {
    it('should call GET with no params when none provided', (done) => {
      const mockResponse = { success: true, data: {} };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getFilterOptions().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.FILTER_OPTIONS,
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );

          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.keys().length).toBe(0);
          done();
        }
      });
    });

    it('should set tbId param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getFilterOptions({ tbId: 'TB001' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('tbId')).toBe('TB001');
          expect(params.keys().length).toBe(1);
          done();
        }
      });
    });

    it('should set testId param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getFilterOptions({ testId: 'HIV' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('testId')).toBe('HIV');
          done();
        }
      });
    });

    it('should set antigenFlag param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getFilterOptions({ antigenFlag: 'Y' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('antigenFlag')).toBe('Y');
          done();
        }
      });
    });

    it('should set all params when all provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getFilterOptions({ tbId: 'TB001', testId: 'HIV', antigenFlag: 'N' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('tbId')).toBe('TB001');
          expect(params.get('testId')).toBe('HIV');
          expect(params.get('antigenFlag')).toBe('N');
          expect(params.keys().length).toBe(3);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTbWsOptions
  // ---------------------------------------------------------------------------
  describe('getTbWsOptions', () => {
    it('should call GET to TB_WS_OPTIONS endpoint', (done) => {
      const mockResponse = { success: true, data: [{ tbId: 'TB001', insertDate: '2026-06-01', testId: 'HIV' }] };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTbWsOptions().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TB_WS_OPTIONS
          );
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTestIdOptions
  // ---------------------------------------------------------------------------
  describe('getTestIdOptions', () => {
    it('should call GET with no params when tbId is not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getTestIdOptions().subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TEST_ID_OPTIONS,
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );

          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.keys().length).toBe(0);
          done();
        }
      });
    });

    it('should set tbId param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getTestIdOptions('TB001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('tbId')).toBe('TB001');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTestKitOptions
  // ---------------------------------------------------------------------------
  describe('getTestKitOptions', () => {
    it('should call GET with no params when testId is not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getTestKitOptions().subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.TEST_KIT_OPTIONS,
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );

          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.keys().length).toBe(0);
          done();
        }
      });
    });

    it('should set testId param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getTestKitOptions('HIV').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('testId')).toBe('HIV');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTestResults
  // ---------------------------------------------------------------------------
  describe('getTestResults', () => {
    it('should use default take=1000 and skip=0 when not provided', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockReturnResult));

      service.getTestResults({ tbId: 'TB001', testId: 'HIV' } as any).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/1000/0`,
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    it('should use custom take and skip when provided', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockReturnResult));

      service.getTestResults({ tbId: 'TB001', testId: 'HIV', take: 50, skip: 10 } as any).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/50/10`,
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    it('should send correct body with chapterId set to null', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockReturnResult));

      service.getTestResults({
        tbId: 'TB001',
        testId: 'HIV',
        unitId: 'U001',
        resultCode: 'NEG'
      } as any).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body).toEqual({
            tbId: 'TB001',
            testId: 'HIV',
            unitId: 'U001',
            resultCode: 'NEG',
            chapterId: null
          });
          done();
        }
      });
    });

    it('should default body fields to null when criteria values are falsy', (done) => {
      apiServiceSpy.post.and.returnValue(of(mockReturnResult));

      service.getTestResults({} as any).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body).toEqual({
            tbId: null,
            testId: null,
            unitId: null,
            resultCode: null,
            chapterId: null
          });
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getTestResult
  // ---------------------------------------------------------------------------
  describe('getTestResult', () => {
    it('should call GET with correct URL containing tbId, testId, and tbSeqNo', (done) => {
      const mockResponse = { success: true, data: { tbId: 'TB001', testId: 'HIV', tbSeqNo: 1 } };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestResult('TB001', 'HIV', 1).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/TB001/HIV/1`
          );
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createTestResult
  // ---------------------------------------------------------------------------
  describe('createTestResult', () => {
    it('should POST request body to base URL', (done) => {
      const request = { tbId: 'TB001', testId: 'HIV', unitId: 'U001' };
      const mockResponse = { success: true, data: { tbId: 'TB001', testId: 'HIV', tbSeqNo: 1 } };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createTestResult(request as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE,
            request
          );
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateTestResult
  // ---------------------------------------------------------------------------
  describe('updateTestResult', () => {
    it('should PUT request body to URL with tbId, testId, and tbSeqNo', (done) => {
      const request = { resultCode: 'POS' };
      const mockResponse = { success: true };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateTestResult('TB001', 'HIV', 1, request as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/TB001/HIV/1`,
            request
          );
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteTestResult
  // ---------------------------------------------------------------------------
  describe('deleteTestResult', () => {
    it('should DELETE to URL with tbId, testId, and tbSeqNo', (done) => {
      const mockResponse = { success: true };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteTestResult('TB001', 'HIV', 1).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.delete).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/TB001/HIV/1`
          );
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getResultCodes
  // ---------------------------------------------------------------------------
  describe('getResultCodes', () => {
    it('should call GET with RESULT_CODES URL for the given testId', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getResultCodes('HIV').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.RESULT_CODES('HIV'),
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );

          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.keys().length).toBe(0);
          done();
        }
      });
    });

    it('should set antigenFlag param when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockReturnResult));

      service.getResultCodes('HIV', 'Y').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.RESULT_CODES('HIV'),
            jasmine.objectContaining({ params: jasmine.any(HttpParams) })
          );

          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('antigenFlag')).toBe('Y');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // saveResults
  // ---------------------------------------------------------------------------
  describe('saveResults', () => {
    it('should POST request to /save URL', (done) => {
      const request = { results: [{ unitId: 'U001', resultCode: 'NEG' }] };
      const mockResponse = { success: true, message: 'Saved' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveResults(request as any).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/save`,
            request,
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    it('should use HttpContext with SKIP_ERROR_TOAST set to true', (done) => {
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.saveResults({ results: [] } as any).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const options = callArgs[2] as any;
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          expect(options.context instanceof HttpContext).toBeTrue();
          expect(options.context.get(SKIP_ERROR_TOAST)).toBeTrue();
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateUnit
  // ---------------------------------------------------------------------------
  describe('validateUnit', () => {
    it('should call GET to validate-unit URL with unitId', (done) => {
      const mockResponse = { valid: true, unitId: 'U001' };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.validateUnit('U001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/validate-unit/U001`,
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    it('should use HttpContext with SKIP_ERROR_TOAST set to true', (done) => {
      apiServiceSpy.get.and.returnValue(of({ valid: true }));

      service.validateUnit('U001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const options = callArgs[1] as any;
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          expect(options.context instanceof HttpContext).toBeTrue();
          expect(options.context.get(SKIP_ERROR_TOAST)).toBeTrue();
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateBatch
  // ---------------------------------------------------------------------------
  describe('validateBatch', () => {
    it('should call GET to validate-batch URL with tbId', (done) => {
      const mockResponse = { success: true };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.validateBatch('TB001').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            `${API.LABORATORY_FUNCTIONS.FIRST_TECH_TEST_RESULT.BASE}/validate-batch/TB001`,
            jasmine.any(Object)
          );
          done();
        }
      });
    });

    it('should use HttpContext with SKIP_ERROR_TOAST set to true', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true }));

      service.validateBatch('TB001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const options = callArgs[1] as any;
          expect(options).toBeDefined();
          expect(options.context).toBeDefined();
          expect(options.context instanceof HttpContext).toBeTrue();
          expect(options.context.get(SKIP_ERROR_TOAST)).toBeTrue();
          done();
        }
      });
    });
  });
});
