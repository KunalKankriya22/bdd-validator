import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RecoveredPlasmaTestService } from './recovered-plasma-test.service';
import { ApiService } from '@shared/services/api.service';
import { RecoveredPlasmaTestCreateDto, RecoveredPlasmaTestUpdateDto } from '../models/recovered-plasma-test.model';
import { API } from 'src/app/core/constants/api.constants';

describe('RecoveredPlasmaTestService', () => {
  let service: RecoveredPlasmaTestService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RecoveredPlasmaTestService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(RecoveredPlasmaTestService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPlasmaTests', () => {
    it('should return data and total from a successful response', (done) => {
      const mockResponse = {
        data: [
          { testId: 'T001', effDate: '2024-01-01', termDate: null },
          { testId: 'T002', effDate: '2024-02-01', termDate: '2024-12-31' }
        ],
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests({ searchKeyword: null }).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].testId).toBe('T001');
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_LIST,
          { searchKeyword: null }
        );
        done();
      });
    });

    it('should return empty data and total 0 when response is null', (done) => {
      apiService.post.and.returnValue(of(null) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should return empty data and total 0 when response is undefined', (done) => {
      apiService.post.and.returnValue(of(undefined) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should default data to empty array when response.data is undefined', (done) => {
      const mockResponse = { total: 5 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(5);
        done();
      });
    });

    it('should use data.length as total when response.total is null', (done) => {
      const mockResponse = {
        data: [
          { testId: 'T001', effDate: '2024-01-01', termDate: null },
          { testId: 'T002', effDate: '2024-02-01', termDate: null },
          { testId: 'T003', effDate: '2024-03-01', termDate: null }
        ],
        total: null
      };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.total).toBe(3);
        expect(result.data.length).toBe(3);
        done();
      });
    });

    it('should use data.length as total when response.total is undefined', (done) => {
      const mockResponse = {
        data: [{ testId: 'T001', effDate: '2024-01-01', termDate: null }]
      };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should return total 0 when response.total is 0', (done) => {
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should pass filter body to the API call', (done) => {
      const body = {
        testId: 'T001',
        effDateAfter: '2024-01-01',
        effDateBefore: '2024-12-31',
        sort: 'testId'
      };
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse) as any);

      service.getPlasmaTests(body).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_LIST,
          body
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Network error');
      const consoleSpy = spyOn(console, 'error');
      apiService.post.and.returnValue(throwError(() => mockError));

      service.getPlasmaTests({}).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching plasma tests config data:', mockError);
          done();
        }
      });
    });
  });

  describe('getTestIdLookups', () => {
    it('should fetch test ID lookup values', (done) => {
      const mockResponse = [
        { code: 'T001', description: 'Test 001' },
        { code: 'T002', description: 'Test 002' }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return the array as-is when response is a valid array', (done) => {
      const mockResponse = [
        { code: 'T001', description: 'Test 001' },
        { code: 'T002', description: 'Test 002' },
        { code: 'T003', description: null }
      ];

      apiService.get.and.returnValue(of(mockResponse) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(3);
        expect(apiService.get).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.BARCODE_LOOKUP_TEST_IDS
        );
        done();
      });
    });

    it('should return empty array when response is not an array (object)', (done) => {
      apiService.get.and.returnValue(of({ data: [] }) as any);

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

    it('should return empty array when response is undefined', (done) => {
      apiService.get.and.returnValue(of(undefined) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is a string', (done) => {
      apiService.get.and.returnValue(of('not an array') as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return the array when response is an empty array', (done) => {
      apiService.get.and.returnValue(of([]) as any);

      service.getTestIdLookups().subscribe(result => {
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Server error');
      const consoleSpy = spyOn(console, 'error');
      apiService.get.and.returnValue(throwError(() => mockError));

      service.getTestIdLookups().subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching test ID lookups:', mockError);
          done();
        }
      });
    });
  });

  describe('createRecord', () => {
    it('should create a new recovered plasma test', (done) => {
      const newRecord: RecoveredPlasmaTestCreateDto = {
        testId: 'T001',
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

    it('should call apiService.post with the correct endpoint and data', (done) => {
      const newRecord: RecoveredPlasmaTestCreateDto = {
        testId: 'T_NEW',
        effDate: '2025-01-01T00:00:00Z',
        termDate: '2025-12-31T00:00:00Z'
      };

      apiService.post.and.returnValue(of({}) as any);

      service.createRecord(newRecord).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_ADD,
          newRecord
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const newRecord: RecoveredPlasmaTestCreateDto = {
        testId: 'T001',
        effDate: '2024-01-01T00:00:00Z',
        termDate: null
      };

      const mockError = new Error('Duplicate key');
      const consoleSpy = spyOn(console, 'error');
      apiService.post.and.returnValue(throwError(() => mockError));

      service.createRecord(newRecord).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error creating plasma tests config:', mockError);
          done();
        }
      });
    });
  });

  describe('updateRecord', () => {
    it('should update an existing recovered plasma test', (done) => {
      const updateData: RecoveredPlasmaTestUpdateDto = {
        effDate: '2024-06-01T00:00:00Z',
        termDate: null
      };

      const mockResponse = { success: true, message: 'Updated successfully' };
      apiService.put.and.returnValue(of(mockResponse) as any);

      service.updateRecord('T001', updateData).subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should call apiService.put with the correct endpoint and data', (done) => {
      const updateData: RecoveredPlasmaTestUpdateDto = {
        effDate: '2025-03-15T00:00:00Z',
        termDate: '2025-09-30T00:00:00Z'
      };

      apiService.put.and.returnValue(of({}) as any);

      service.updateRecord('T_XYZ', updateData).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_UPDATE('T_XYZ'),
          updateData
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const updateData: RecoveredPlasmaTestUpdateDto = {
        effDate: '2024-06-01T00:00:00Z',
        termDate: null
      };

      const mockError = new Error('Not found');
      const consoleSpy = spyOn(console, 'error');
      apiService.put.and.returnValue(throwError(() => mockError));

      service.updateRecord('T001', updateData).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error updating plasma tests config:', mockError);
          done();
        }
      });
    });
  });

  describe('deleteRecord', () => {
    it('should delete a recovered plasma test', (done) => {
      const mockResponse = { success: true, message: 'Deleted successfully' };
      apiService.delete.and.returnValue(of(mockResponse) as any);

      service.deleteRecord('T001').subscribe(result => {
        expect(result.success).toBe(true);
        expect(apiService.delete).toHaveBeenCalled();
        done();
      });
    });

    it('should call apiService.delete with the correct endpoint', (done) => {
      apiService.delete.and.returnValue(of({}) as any);

      service.deleteRecord('T_ABC').subscribe(() => {
        expect(apiService.delete).toHaveBeenCalledWith(
          API.APPLICATION_ADMIN.LABELING_CONFIGURATION.PLASMA_TESTS_DELETE('T_ABC')
        );
        done();
      });
    });

    it('should propagate error and log to console on failure', (done) => {
      const mockError = new Error('Forbidden');
      const consoleSpy = spyOn(console, 'error');
      apiService.delete.and.returnValue(throwError(() => mockError));

      service.deleteRecord('T001').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleSpy).toHaveBeenCalledWith('Error deleting plasma tests config:', mockError);
          done();
        }
      });
    });
  });
});
