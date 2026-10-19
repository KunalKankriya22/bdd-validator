import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { TestMessageMappingService } from './test-message-mapping.service';
import { ApiService } from '@shared/services/api.service';
import {
  TestMessageMappingCreateDto,
  TestMessageMappingUpdateDto,
  TestMessageMappingListBody,
} from '../models/test-message-mapping.model';

describe('TestMessageMappingService', () => {
  let service: TestMessageMappingService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TestMessageMappingService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(TestMessageMappingService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── getTestMessageMappings ───────────────────────────────────────────

  describe('getTestMessageMappings', () => {
    const body: TestMessageMappingListBody = { ltTestId: 'LT001', sort: 'A' };

    it('should return data and total from a normal response', (done) => {
      const mockResponse = {
        data: [
          { ltTestId: 'LT001', resultCode: 'N', displyTestId: 'DT001' },
          { ltTestId: 'LT002', resultCode: 'P', displyTestId: 'DT002' },
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getTestMessageMappings(body).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should fall back total to data.length when total is not provided', (done) => {
      const mockResponse = {
        data: [
          { ltTestId: 'LT001', resultCode: 'N', displyTestId: 'DT001' },
        ]
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getTestMessageMappings(body).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should return empty data when response is null/falsy', (done) => {
      apiService.post.and.returnValue(of(null) as any);

      service.getTestMessageMappings(body).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should default data to empty array when response.data is missing', (done) => {
      apiService.post.and.returnValue(of({ total: 5 }) as any);

      service.getTestMessageMappings(body).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(5);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Server error');
      apiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getTestMessageMappings(body).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching test message mapping data:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── getTestIdLookups ────────────────────────────────────────────────

  describe('getTestIdLookups', () => {
    it('should fetch test ID lookup values', (done) => {
      const mockResponse = [
        { code: 'LT001', description: 'Test 001' },
        { code: 'LT002', description: 'Test 002' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when response is not an array', (done) => {
      apiService.get.and.returnValue(of({ unexpected: true }) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Network error');
      apiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getTestIdLookups().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching test ID lookups:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── getMessageTypeLookups ───────────────────────────────────────────

  describe('getMessageTypeLookups', () => {
    it('should fetch message type lookup values', (done) => {
      const mockResponse = [
        { code: 'MSG1', description: 'Message Type 1' },
        { code: 'MSG2', description: 'Message Type 2' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getMessageTypeLookups().subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when response is not an array', (done) => {
      apiService.get.and.returnValue(of('unexpected string') as any);

      service.getMessageTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null) as any);

      service.getMessageTypeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Lookup error');
      apiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getMessageTypeLookups().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching message type lookups:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── getResultCodeLookups ────────────────────────────────────────────

  describe('getResultCodeLookups', () => {
    it('should fetch result code lookup values without ltTestId', (done) => {
      const mockResponse = [
        { code: 'N', description: 'Negative' },
        { code: 'P', description: 'Positive' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getResultCodeLookups().subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should fetch result code lookup values with ltTestId', (done) => {
      const mockResponse = [
        { code: 'N', description: 'Negative' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getResultCodeLookups('LT001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(apiService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should return empty array when response is not an array', (done) => {
      apiService.get.and.returnValue(of({ data: 'wrong' }) as any);

      service.getResultCodeLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      apiService.get.and.returnValue(of(null) as any);

      service.getResultCodeLookups('LT001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Result code error');
      apiService.get.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.getResultCodeLookups().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching result code lookups:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── createRecord ────────────────────────────────────────────────────

  describe('createRecord', () => {
    it('should create a new test message mapping', (done) => {
      const newRecord: TestMessageMappingCreateDto = {
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DT001',
        antibodyFlag: 'N',
        messageDesc: 'Test Message',
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = { success: true, message: 'Created successfully' };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.createRecord(newRecord).subscribe(result => {
        expect(result.success).toBe(true);
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const newRecord: TestMessageMappingCreateDto = {
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DT001',
        effDate: '2024-01-01T00:00:00Z',
      };
      const error = new Error('Create failed');
      apiService.post.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.createRecord(newRecord).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error creating test message mapping:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── updateRecord ────────────────────────────────────────────────────

  describe('updateRecord', () => {
    it('should update an existing test message mapping', (done) => {
      const updateData: TestMessageMappingUpdateDto = {
        resultCode: 'P',
        displyTestId: 'DT001',
        antibodyFlag: 'Y',
        messageDesc: 'Updated Message',
        effDate: '2024-06-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = { success: true, message: 'Updated successfully' };
      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateRecord('LT001', 'N', 'DT001', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const updateData: TestMessageMappingUpdateDto = {
        resultCode: 'P',
        displyTestId: 'DT001',
        effDate: '2024-06-01T00:00:00Z',
      };
      const error = new Error('Update failed');
      apiService.put.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.updateRecord('LT001', 'N', 'DT001', updateData).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error updating test message mapping:',
            error
          );
          done();
        }
      });
    });
  });

  // ─── deleteRecord ────────────────────────────────────────────────────

  describe('deleteRecord', () => {
    it('should delete a test message mapping', (done) => {
      const mockResponse = { success: true, message: 'Deleted successfully' };
      apiService.delete.and.returnValue(of(mockResponse) as any);

      service.deleteRecord('LT001', 'N', 'DT001').subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate errors via catchError', (done) => {
      const error = new Error('Delete failed');
      apiService.delete.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      service.deleteRecord('LT001', 'N', 'DT001').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(console.error).toHaveBeenCalledWith(
            'Error deleting test message mapping:',
            error
          );
          done();
        }
      });
    });
  });
});
