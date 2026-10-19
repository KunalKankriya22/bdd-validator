import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EligiblePlasmaCellLossService } from './eligible-plasma-cell-loss.service';
import { LoginService } from '@shared/services/login.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  EligiblePlasmaCellLossRecord,
  EligiblePlasmaCellLossRecordDetail,
  AddEligiblePlasmaCellLossRequest,
  UpdateEligiblePlasmaCellLossRequest,
  ValidateDuplicateRequest,
  ValidateDuplicateResponse,
  ApiResponse,
  FilterOptions,
  PaginatedResponse
} from '../models/eligible-plasma-cell-loss.model';

describe('EligiblePlasmaCellLossService', () => {
  let service: EligiblePlasmaCellLossService;
  let httpMock: HttpTestingController;
  let loginService: jasmine.SpyObj<LoginService>;

  const mockRecord: EligiblePlasmaCellLossRecord = {
    cellType: 'PLASM',
    description: 'Plasma',
    minWeight: 110,
    maxWeight: 174,
    auditKey: '20492205',
    maxLoss: 12000,
    period: 365,
    effectiveDate: '2001-01-02T00:00:00',
    terminationDate: null
  };

  const mockRecordDetail: EligiblePlasmaCellLossRecordDetail = {
    cellType: 'PLASM',
    description: '',
    minWeight: 100,
    maxWeight: 1000,
    auditKey: '36862732',
    maxLoss: 90,
    period: 365,
    effectiveDate: '2026-02-16T16:31:34',
    terminationDate: '2026-02-17T04:57:00'
  };

  beforeEach(() => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EligiblePlasmaCellLossService,
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });
    service = TestBed.inject(EligiblePlasmaCellLossService);
    httpMock = TestBed.inject(HttpTestingController);
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFilterOptions', () => {
    it('should fetch filter options', () => {
      const mockFilterOptions: FilterOptions = {
        cellTypes: [
          { value: 'PLASM', label: 'Plasma' },
          { value: 'RBC', label: 'Red Blood Cell' }
        ],
        statusOptions: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      };

      service.getFilterOptions().subscribe((options) => {
        expect(options).toEqual(mockFilterOptions);
        expect(options.cellTypes.length).toBe(2);
        expect(options.statusOptions.length).toBe(2);
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('filter-options')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterOptions);
    });

    it('should handle error when fetching filter options', () => {
      const consoleSpy = spyOn(console, 'error');

      service.getFilterOptions().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith('Error fetching filter options:', jasmine.anything());
        }
      });

      const req = httpMock.expectOne(
        (request) => request.url.includes('filter-options')
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRecords', () => {
    it('should get all records', () => {
      const mockRecords: EligiblePlasmaCellLossRecord[] = [mockRecord];

      service.getRecords().subscribe((records) => {
        expect(records).toEqual(mockRecords);
        if (Array.isArray(records)) {
          expect(records.length).toBe(1);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_RECORDS);
      expect(req.request.method).toBe('GET');
      req.flush(mockRecords);
    });

    it('should send cellType query parameter when provided', () => {
      service.getRecords({ cellType: 'PLASM' }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && request.params.get('cellType') === 'PLASM'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockRecord]);
    });

    it('should send status query parameter when provided', () => {
      service.getRecords({ status: 'active' }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && request.params.get('status') === 'active'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockRecord]);
    });

    it('should send searchText query parameter when provided', () => {
      service.getRecords({ searchText: 'plasma' }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && request.params.get('searchText') === 'plasma'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockRecord]);
    });

    it('should send chapterId query parameter when provided', () => {
      service.getRecords({ chapterId: 'WAD' }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && request.params.get('chapterId') === 'WAD'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockRecord]);
    });

    it('should send sort query parameter when provided', () => {
      service.getRecords({ sort: 'cellType_asc' }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && request.params.get('sort') === 'cellType_asc'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockRecord]);
    });

    it('should send skip and take query parameters when provided', () => {
      service.getRecords({ skip: 10, take: 25 }).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('get-records') &&
          request.params.get('skip') === '10' &&
          request.params.get('take') === '25'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ records: [mockRecord], totalCount: 50 });
    });

    it('should send skip=0 and take=0 as valid parameters', () => {
      service.getRecords({ skip: 0, take: 0 }).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('get-records') &&
          request.params.get('skip') === '0' &&
          request.params.get('take') === '0'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ records: [], totalCount: 0 });
    });

    it('should not send skip parameter when it is null', () => {
      service.getRecords({ skip: null }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && !request.params.has('skip')
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should not send take parameter when it is undefined', () => {
      service.getRecords({ take: undefined }).subscribe();

      const req = httpMock.expectOne(
        (request) => request.url.includes('get-records') && !request.params.has('take')
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should send all query parameters together when provided', () => {
      service.getRecords({
        cellType: 'RBC',
        status: 'active',
        searchText: 'test',
        chapterId: 'DAL',
        sort: 'effectiveDate_desc',
        skip: 0,
        take: 10
      }).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('get-records') &&
          request.params.get('cellType') === 'RBC' &&
          request.params.get('status') === 'active' &&
          request.params.get('searchText') === 'test' &&
          request.params.get('chapterId') === 'DAL' &&
          request.params.get('sort') === 'effectiveDate_desc' &&
          request.params.get('skip') === '0' &&
          request.params.get('take') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ records: [mockRecord], totalCount: 1 });
    });

    it('should not send falsy string params (null/undefined)', () => {
      service.getRecords({
        cellType: null,
        status: undefined,
        searchText: null,
        chapterId: undefined,
        sort: null
      } as any).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('get-records') &&
          !request.params.has('cellType') &&
          !request.params.has('status') &&
          !request.params.has('searchText') &&
          !request.params.has('chapterId') &&
          !request.params.has('sort')
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should return PaginatedResponse when response has records and totalCount', () => {
      const paginatedResponse = {
        records: [mockRecord],
        totalCount: 50
      };

      service.getRecords({ skip: 0, take: 10 }).subscribe((result) => {
        const paginated = result as PaginatedResponse<EligiblePlasmaCellLossRecord>;
        expect(paginated.records).toEqual([mockRecord]);
        expect(paginated.totalCount).toBe(50);
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush(paginatedResponse);
    });

    it('should map wrapped response with data and total to PaginatedResponse', () => {
      const wrappedResponse = {
        data: [mockRecord],
        total: 100
      };

      service.getRecords().subscribe((result) => {
        const paginated = result as PaginatedResponse<EligiblePlasmaCellLossRecord>;
        expect(paginated.records).toEqual([mockRecord]);
        expect(paginated.totalCount).toBe(100);
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush(wrappedResponse);
    });

    it('should return data array when wrapped response has data but no total', () => {
      const wrappedResponse = {
        data: [mockRecord]
      };

      service.getRecords().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([mockRecord]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush(wrappedResponse);
    });

    it('should return empty array for unexpected response format', () => {
      const consoleSpy = spyOn(console, 'warn');

      service.getRecords().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Unexpected response format, returning empty array');
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush({ someUnexpectedField: 'value' });
    });

    it('should return empty array for null response', () => {
      const consoleSpy = spyOn(console, 'warn');

      service.getRecords().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush(null);
    });

    it('should handle error when fetching records', () => {
      const consoleSpy = spyOn(console, 'error');

      service.getRecords().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching eligible plasma cell loss records:',
            jasmine.anything()
          );
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error when fetching records', () => {
      const consoleSpy = spyOn(console, 'error');

      service.getRecords().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('get-records'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getRecordByAuditKey', () => {
    it('should get record by audit key', () => {
      const auditKey = '36862732';

      service.getRecordByAuditKey(auditKey).subscribe((record) => {
        expect(record).toEqual(mockRecordDetail);
        expect(record.auditKey).toBe(auditKey);
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_BY_AUDIT_KEY(auditKey)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecordDetail);
    });

    it('should extract item from wrapped response', () => {
      const auditKey = '36862732';
      const wrappedResponse = {
        success: true,
        message: 'Record found',
        item: mockRecordDetail
      };

      service.getRecordByAuditKey(auditKey).subscribe((record) => {
        expect(record).toEqual(mockRecordDetail);
        expect(record.auditKey).toBe(auditKey);
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_BY_AUDIT_KEY(auditKey)
      );
      expect(req.request.method).toBe('GET');
      req.flush(wrappedResponse);
    });

    it('should handle error when fetching record by audit key', () => {
      const auditKey = '36862732';
      const consoleSpy = spyOn(console, 'error');

      service.getRecordByAuditKey(auditKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching record by audit key:',
            jasmine.anything()
          );
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_BY_AUDIT_KEY(auditKey)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error when record not found', () => {
      const auditKey = 'nonexistent';
      const consoleSpy = spyOn(console, 'error');

      service.getRecordByAuditKey(auditKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.GET_BY_AUDIT_KEY(auditKey)
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('addRecord', () => {
    const addRequest: AddEligiblePlasmaCellLossRequest = {
      cellType: 'PLASM',
      fromWeight: 300,
      toWeight: 3000,
      maximumLoss: 79,
      daysBetween: 55,
      effDate: '2026-02-17T17:34:08.723Z',
      termDate: '2026-02-17T17:34:08.723Z',
      chapterId: 'WAD',
      programId: 'ABCDS'
    };

    it('should add a new record', () => {
      const mockResponse: ApiResponse = {
        message: 'Eligible plasma cell loss record created successfully.'
      };

      service.addRecord(addRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.message).toContain('created successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.ADD_RECORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(addRequest);
      req.flush(mockResponse);
    });

    it('should handle 400 error when adding a record', () => {
      service.addRecord(addRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.ADD_RECORD);
      expect(req.request.method).toBe('POST');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 500 error when adding a record', () => {
      service.addRecord(addRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.ADD_RECORD);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should send request with null termDate', () => {
      const requestWithNullTerm: AddEligiblePlasmaCellLossRequest = {
        ...addRequest,
        termDate: null
      };

      const mockResponse: ApiResponse = {
        message: 'Eligible plasma cell loss record created successfully.'
      };

      service.addRecord(requestWithNullTerm).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.ADD_RECORD);
      expect(req.request.body.termDate).toBeNull();
      req.flush(mockResponse);
    });
  });

  describe('updateRecord', () => {
    const auditKey = '36862732';
    const updateRequest: UpdateEligiblePlasmaCellLossRequest = {
      cellType: 'RBC',
      fromWeight: 500,
      toWeight: 1000,
      maximumLoss: 90,
      daysBetween: 20,
      effDate: '2026-02-17T17:35:34.351Z',
      termDate: '2026-02-17T17:35:34.351Z',
      chapterId: 'TRP',
      programId: 'string'
    };

    it('should update an existing record', () => {
      const mockResponse: ApiResponse = {
        message: 'Eligible plasma cell loss record updated successfully.'
      };

      service.updateRecord(auditKey, updateRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.message).toContain('updated successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.UPDATE_RECORD(auditKey));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });

    it('should handle error when updating a record', () => {
      const consoleSpy = spyOn(console, 'error');

      service.updateRecord(auditKey, updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith('Error updating record:', jasmine.anything());
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.UPDATE_RECORD(auditKey));
      expect(req.request.method).toBe('PUT');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error when updating a non-existent record', () => {
      const nonExistentKey = 'nonexistent';
      const consoleSpy = spyOn(console, 'error');

      service.updateRecord(nonExistentKey, updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.UPDATE_RECORD(nonExistentKey)
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by audit key', () => {
      const auditKey = '20492204';
      const mockResponse: ApiResponse = {
        message: 'Eligible plasma cell loss record deleted successfully.'
      };

      service.deleteRecord(auditKey).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.message).toContain('deleted successfully');
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.DELETE_RECORD(auditKey)
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when deleting a record', () => {
      const auditKey = '20492204';
      const consoleSpy = spyOn(console, 'error');

      service.deleteRecord(auditKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith('Error deleting record:', jasmine.anything());
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.DELETE_RECORD(auditKey)
      );
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error when deleting a non-existent record', () => {
      const auditKey = 'nonexistent';
      const consoleSpy = spyOn(console, 'error');

      service.deleteRecord(auditKey).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.DELETE_RECORD(auditKey)
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('validateDuplicate', () => {
    it('should validate duplicate record', () => {
      const validateRequest: ValidateDuplicateRequest = {
        cellType: 'RBC',
        effDate: '2026-02-17T17:38:56.765Z',
        chapterId: 'DAL',
        excludeAuditKey: 'string'
      };

      const mockResponse: ValidateDuplicateResponse = {
        isDuplicate: false,
        message: 'No duplicate record found.'
      };

      service.validateDuplicate(validateRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.isDuplicate).toBe(false);
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.VALIDATE_DUPLICATE
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validateRequest);
      req.flush(mockResponse);
    });

    it('should return true when duplicate exists', () => {
      const validateRequest: ValidateDuplicateRequest = {
        cellType: 'PLASM',
        effDate: '2026-02-17T17:38:56.765Z',
        chapterId: 'DAL'
      };

      const mockResponse: ValidateDuplicateResponse = {
        isDuplicate: true,
        message: 'Duplicate record found.'
      };

      service.validateDuplicate(validateRequest).subscribe((response) => {
        expect(response.isDuplicate).toBe(true);
        expect(response.message).toContain('Duplicate');
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.VALIDATE_DUPLICATE
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle error when validating duplicate', () => {
      const validateRequest: ValidateDuplicateRequest = {
        cellType: 'RBC',
        effDate: '2026-02-17T17:38:56.765Z',
        chapterId: 'DAL'
      };
      const consoleSpy = spyOn(console, 'error');

      service.validateDuplicate(validateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(consoleSpy).toHaveBeenCalledWith('Error validating duplicate:', jasmine.anything());
        }
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.VALIDATE_DUPLICATE
      );
      expect(req.request.method).toBe('POST');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should send request without excludeAuditKey when not provided', () => {
      const validateRequest: ValidateDuplicateRequest = {
        cellType: 'PLASM',
        effDate: '2026-02-17T17:38:56.765Z',
        chapterId: 'WAD'
      };

      service.validateDuplicate(validateRequest).subscribe((response) => {
        expect(response.isDuplicate).toBe(false);
      });

      const req = httpMock.expectOne(
        API.APPLICATION_ADMIN.ELIGIBLE_PLASMA_CELL_LOSS.VALIDATE_DUPLICATE
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(validateRequest);
      expect(req.request.body.excludeAuditKey).toBeUndefined();
      req.flush({ isDuplicate: false, message: 'No duplicate found' });
    });
  });
});
