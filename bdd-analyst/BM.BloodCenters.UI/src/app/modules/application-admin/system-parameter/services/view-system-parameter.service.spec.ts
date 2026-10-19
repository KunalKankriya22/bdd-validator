import { TestBed } from '@angular/core/testing';
import { ViewSystemParameterService } from './view-system-parameter.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  SystemParameterModel,
  SystemParameterParamsDto,
  SystemParameterCreateDto,
  SystemParameterUpdateDto
} from '../interfaces/view-system-parameter.interface';

describe('ViewSystemParameterService', () => {
  let service: ViewSystemParameterService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSystemParameter: SystemParameterModel = {
    parameterCode: 'PARAM1',
    chapterId: 'CH01',
    parameterType: 'STRING',
    parameterValue: 'value1',
    description: 'Test parameter',
    effectiveDate: '2024-01-01',
    terminationDate: null,
    programId: 'PROG1',
    insertUser: 'admin'
  };

  const mockSystemParameter2: SystemParameterModel = {
    parameterCode: 'PARAM2',
    chapterId: 'CH02',
    parameterType: 'NUMBER',
    parameterValue: '42',
    description: 'Another parameter',
    effectiveDate: '2024-06-01',
    terminationDate: '2025-12-31',
    programId: 'PROG2',
    insertUser: 'user1'
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        ViewSystemParameterService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ViewSystemParameterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSystemParameters', () => {
    it('should call apiService.post with correct endpoint', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getSystemParameters(10, 0, {}).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalled();
      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[0]).toContain('/10/0');
    });

    it('should build endpoint with take and skip values', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getSystemParameters(25, 50, {}).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[0]).toContain('/25/50');
    });

    it('should pass params as the request body', () => {
      const params: SystemParameterParamsDto = {
        searchKeyword: 'test',
        sortOrder: 'asc',
        parameterFilter: 'PARAM1'
      };
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getSystemParameters(10, 0, params).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1]).toEqual(params);
    });

    it('should map response data and total correctly', (done) => {
      const mockResponse = {
        data: [mockSystemParameter, mockSystemParameter2],
        total: 2
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getSystemParameters(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([mockSystemParameter, mockSystemParameter2]);
        expect(result.totalRecords).toBe(2);
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({ total: 5 }));

      service.getSystemParameters(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: null, total: 3 }));

      service.getSystemParameters(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(3);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [mockSystemParameter] }));

      service.getSystemParameters(10, 0, {}).subscribe(result => {
        expect(result.data).toEqual([mockSystemParameter]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: null }));

      service.getSystemParameters(10, 0, {}).subscribe(result => {
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should propagate errors from apiService', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.getSystemParameters(10, 0, {}).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should handle params with date filters', () => {
      const params: SystemParameterParamsDto = {
        effectiveDateFrom: '2024-01-01',
        effectiveDateTo: '2024-12-31',
        terminationDateFrom: '2025-01-01',
        terminationDateTo: '2025-12-31'
      };
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getSystemParameters(10, 0, params).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1]).toEqual(params);
    });

    it('should handle empty params object', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getSystemParameters(10, 0, {}).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1]).toEqual({});
    });
  });

  describe('createSystemParameter', () => {
    it('should call apiService.post with correct endpoint', () => {
      const payload: SystemParameterCreateDto = {
        parameterCode: 'NEW_PARAM',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'newValue',
        description: 'New parameter',
        effectiveDate: '2024-01-01',
        programId: 'PROG1',
        insertUser: 'admin'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.createSystemParameter(payload).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalled();
    });

    it('should pass the payload as the request body', () => {
      const payload: SystemParameterCreateDto = {
        parameterCode: 'NEW_PARAM',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'newValue',
        description: 'New parameter',
        effectiveDate: '2024-01-01',
        programId: 'PROG1',
        insertUser: 'admin'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.createSystemParameter(payload).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1]).toEqual(payload);
    });

    it('should return the response on success', (done) => {
      const payload: SystemParameterCreateDto = {
        parameterCode: 'NEW_PARAM',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'newValue',
        description: 'New parameter',
        effectiveDate: '2024-01-01',
        programId: 'PROG1',
        insertUser: 'admin'
      };
      const mockResponse = { success: true, message: 'Created' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.createSystemParameter(payload).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should propagate errors from apiService', (done) => {
      const payload: SystemParameterCreateDto = {
        parameterCode: 'NEW_PARAM',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'newValue',
        description: 'New parameter',
        effectiveDate: '2024-01-01',
        programId: 'PROG1',
        insertUser: 'admin'
      };
      const mockError = { status: 400, message: 'Bad Request' };
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.createSystemParameter(payload).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should handle payload with optional terminationDate', () => {
      const payload: SystemParameterCreateDto = {
        parameterCode: 'NEW_PARAM',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'newValue',
        description: 'New parameter',
        effectiveDate: '2024-01-01',
        terminationDate: '2025-12-31',
        programId: 'PROG1',
        insertUser: 'admin'
      };
      apiServiceSpy.post.and.returnValue(of({ success: true }));

      service.createSystemParameter(payload).subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1].terminationDate).toBe('2025-12-31');
    });
  });

  describe('updateSystemParameter', () => {
    it('should call apiService.put with correct endpoint', () => {
      apiServiceSpy.put.and.returnValue(of({}));

      service.updateSystemParameter('P1', {} as any).subscribe();

      expect(apiServiceSpy.put).toHaveBeenCalled();
      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[0]).toContain('P1');
    });

    it('should build endpoint with parameterCode', () => {
      apiServiceSpy.put.and.returnValue(of({}));

      service.updateSystemParameter('MY_PARAM', {} as any).subscribe();

      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[0]).toContain('/MY_PARAM');
    });

    it('should pass the payload as the request body', () => {
      const payload: SystemParameterUpdateDto = {
        parameterCode: 'P1',
        chapterId: 'CH01',
        parameterType: 'STRING',
        parameterValue: 'updatedValue',
        description: 'Updated parameter',
        effectiveDate: '2024-01-01',
        programId: 'PROG1',
        insertUser: 'admin',
        originalParameterType: 'NUMBER'
      };
      apiServiceSpy.put.and.returnValue(of({ success: true }));

      service.updateSystemParameter('P1', payload).subscribe();

      const callArgs = apiServiceSpy.put.calls.mostRecent().args;
      expect(callArgs[1]).toEqual(payload);
    });

    it('should return the response on success', (done) => {
      const mockResponse = { success: true, message: 'Updated' };
      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateSystemParameter('P1', {} as any).subscribe(result => {
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should propagate errors from apiService', (done) => {
      const mockError = { status: 404, message: 'Not Found' };
      apiServiceSpy.put.and.returnValue(throwError(() => mockError));

      service.updateSystemParameter('INVALID', {} as any).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should handle 500 server error', (done) => {
      const mockError = { status: 500, message: 'Internal Server Error' };
      apiServiceSpy.put.and.returnValue(throwError(() => mockError));

      service.updateSystemParameter('P1', {} as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getParameterLookup', () => {
    it('should call apiService.post with correct endpoint using large take value', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.getParameterLookup().subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalled();
      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[0]).toContain('/10000/0');
    });

    it('should pass empty object as request body', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.getParameterLookup().subscribe();

      const callArgs = apiServiceSpy.post.calls.mostRecent().args;
      expect(callArgs[1]).toEqual({});
    });

    it('should map response data to ParameterOption array', (done) => {
      const mockResponse = {
        data: [mockSystemParameter, mockSystemParameter2]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ parameterCode: 'PARAM1', description: 'Test parameter' });
        expect(result[1]).toEqual({ parameterCode: 'PARAM2', description: 'Another parameter' });
        done();
      });
    });

    it('should deduplicate items by parameterCode', (done) => {
      const duplicate: SystemParameterModel = {
        ...mockSystemParameter,
        chapterId: 'CH99',
        parameterValue: 'different'
      };
      const mockResponse = {
        data: [mockSystemParameter, duplicate, mockSystemParameter2]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(2);
        const codes = result.map(r => r.parameterCode);
        expect(codes).toContain('PARAM1');
        expect(codes).toContain('PARAM2');
        done();
      });
    });

    it('should keep the first occurrence when deduplicating', (done) => {
      const duplicate: SystemParameterModel = {
        ...mockSystemParameter,
        description: 'Duplicate description'
      };
      const mockResponse = {
        data: [mockSystemParameter, duplicate]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].description).toBe('Test parameter');
        done();
      });
    });

    it('should sort results alphabetically by parameterCode', (done) => {
      const paramZ: SystemParameterModel = {
        ...mockSystemParameter,
        parameterCode: 'ZEBRA',
        description: 'Z param'
      };
      const paramA: SystemParameterModel = {
        ...mockSystemParameter,
        parameterCode: 'ALPHA',
        description: 'A param'
      };
      const paramM: SystemParameterModel = {
        ...mockSystemParameter,
        parameterCode: 'MIDDLE',
        description: 'M param'
      };
      const mockResponse = {
        data: [paramZ, paramA, paramM]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].parameterCode).toBe('ALPHA');
        expect(result[1].parameterCode).toBe('MIDDLE');
        expect(result[2].parameterCode).toBe('ZEBRA');
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      apiServiceSpy.post.and.returnValue(of({}));

      service.getParameterLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default data to empty array when response.data is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: null }));

      service.getParameterLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response data is empty', (done) => {
      apiServiceSpy.post.and.returnValue(of({ data: [] }));

      service.getParameterLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should only include parameterCode and description in output', (done) => {
      const mockResponse = {
        data: [mockSystemParameter]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(1);
        const keys = Object.keys(result[0]);
        expect(keys).toEqual(['parameterCode', 'description']);
        done();
      });
    });

    it('should propagate errors from apiService', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.getParameterLookup().subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          done();
        }
      });
    });

    it('should handle single item without duplicates', (done) => {
      const mockResponse = {
        data: [mockSystemParameter]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].parameterCode).toBe('PARAM1');
        expect(result[0].description).toBe('Test parameter');
        done();
      });
    });

    it('should handle multiple duplicates of the same parameterCode', (done) => {
      const dup1: SystemParameterModel = { ...mockSystemParameter, parameterValue: 'val1' };
      const dup2: SystemParameterModel = { ...mockSystemParameter, parameterValue: 'val2' };
      const dup3: SystemParameterModel = { ...mockSystemParameter, parameterValue: 'val3' };
      const mockResponse = { data: [dup1, dup2, dup3] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getParameterLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].parameterCode).toBe('PARAM1');
        done();
      });
    });
  });
});
