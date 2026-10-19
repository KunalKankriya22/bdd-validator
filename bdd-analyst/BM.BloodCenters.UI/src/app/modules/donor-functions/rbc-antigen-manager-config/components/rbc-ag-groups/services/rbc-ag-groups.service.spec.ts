import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RbcAgGroupsService } from './rbc-ag-groups.service';
import {
  ApiResult,
  RbcAgGroupApiModel,
  RbcAgGroupCreateRequest,
  RbcAgGroupUpdateRequest,
  RbcAgGroupBatchUpdateRequest,
  RbcAgGroupFilterOption,
  RbcAgGroupLookupItem,
  RbcAgGroupSearchRequest,
} from '../models/rbc-ag-groups.model';

describe('RbcAgGroupsService', () => {
  let service: RbcAgGroupsService;
  let httpMock: HttpTestingController;

  const mockApiModel: RbcAgGroupApiModel = {
    auditKey: 1,
    antigenGroup: 'RH',
    antigenGrpDispOrder: 1,
    serAgTestId: 'D',
    serTestDispOrder: 1,
    molAgTestId: 'RHD*01',
    molTestDispOrder: 1,
    effDate: '2023-06-09T00:00:00',
    termDate: null,
    insertDate: '2023-01-01T00:00:00',
    insertUser: 'admin',
    programId: 'TEST',
  };

  const mockApiResult = <T>(data: T[], total = data.length): ApiResult<T> => ({
    success: true,
    message: 'OK',
    error: null,
    errorCode: null,
    statusCode: 200,
    data,
    item: null,
    total,
  });

  const successResult: ApiResult<null> = {
    success: true,
    message: '1 record(s) updated successfully',
    error: null,
    errorCode: null,
    statusCode: 200,
    data: null,
    item: null,
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RbcAgGroupsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service  = TestBed.inject(RbcAgGroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── search ──────────────────────────────────────────────────────────────────

  describe('search()', () => {
    const request: RbcAgGroupSearchRequest = {
      antigenGroup: 'RH',
      displayOrder: 1,
      showTerminated: 'N',
      chapterLocalDate: null,
    };

    it('should POST to search endpoint and map rows', (done) => {
      service.search(25, 0, request).subscribe({
        next: ({ data, total }) => {
          expect(total).toBe(1);
          expect(data.length).toBe(1);

          const row = data[0];
          expect(row.auditKey).toBe(1);
          expect(row.serologicalTest).toBe('D');
          expect(row.serologicalSeq).toBe(1);
          expect(row.molecularTest).toBe('RHD*01');
          expect(row.molecularSeq).toBe(1);
          expect(row.effectiveDate).toBe('09-JUN-2023');
          expect(row.terminationDate).toBe('');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/search-sort-filter/25/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockApiResult([mockApiModel]));
    });


    it('should format termDate when present', (done) => {
      service.search(25, 0, request).subscribe({
        next: ({ data }) => {
          expect(data[0].terminationDate).toBe('31-DEC-2024');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/search-sort-filter/25/0');
      req.flush(mockApiResult([{ ...mockApiModel, termDate: '2024-12-31T00:00:00' }]));
    });


  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const payload: RbcAgGroupCreateRequest[] = [{
      antigenGroup: 'RH',
      antigenGrpDispOrder: 1,
      serAgTestId: 'D',
      serTestDispOrder: 1,
      molAgTestId: 'RHD*01',
      molTestDispOrder: 1,
      effDate: '2023-06-09T00:00:00',
      termDate: null,
    }];

    it('should POST to create endpoint', (done) => {
      service.create(payload).subscribe({
        next: (res) => { expect(res.success).toBeTrue(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(successResult);
    });

  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update()', () => {
    const payload: RbcAgGroupUpdateRequest[] = [{
      auditKey: 1,
      antigenGroup: 'RH',
      antigenGrpDispOrder: 1,
      serAgTestId: 'D',
      serTestDispOrder: 1,
      molAgTestId: 'RHD*01',
      molTestDispOrder: 1,
      effDate: '2023-06-09T00:00:00',
      termDate: null,
    }];

    it('should PUT to update endpoint', (done) => {
      service.update(payload).subscribe({
        next: (res) => { expect(res.success).toBeTrue(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(successResult);
    });

  });

  // ── batchUpdate ─────────────────────────────────────────────────────────────

  describe('batchUpdate()', () => {
    const payload: RbcAgGroupBatchUpdateRequest = {
      antigenGroup: 'RH',
      antigenGrpDispOrder: 1,
      termDate: null,
      records: [
        { auditKey: 1, serAgTestId: 'D', serTestDispOrder: 1, molAgTestId: 'RHD*01', molTestDispOrder: 1 },
        { auditKey: null, serAgTestId: 'C', serTestDispOrder: 2, molAgTestId: null, molTestDispOrder: null },
      ],
    };

    it('should PUT to batch-update endpoint', (done) => {
      service.batchUpdate(payload).subscribe({
        next: (res) => { expect(res.success).toBeTrue(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/batch-update');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...successResult, message: '2 record(s) updated successfully', total: 2 });
    });

  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should DELETE the record by auditKey', (done) => {
      service.delete(42).subscribe({
        next: (res) => { expect(res.success).toBeTrue(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/42');
      expect(req.request.method).toBe('DELETE');
      req.flush(successResult);
    });

  });

  // ── getFilterOptions ────────────────────────────────────────────────────────

  describe('getFilterOptions()', () => {
    it('should GET and map to AntigenGroupOption[]', (done) => {
      const raw: RbcAgGroupFilterOption[] = [
        { antigenGroup: 'RH', antigenGrpDispOrder: 1 },
        { antigenGroup: 'KELL', antigenGrpDispOrder: 2 },
      ];

      service.getFilterOptions().subscribe({
        next: (opts) => {
          expect(opts.length).toBe(2);
          expect(opts[0]).toEqual({ name: 'RH', displayOrder: 1 });
          expect(opts[1]).toEqual({ name: 'KELL', displayOrder: 2 });
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/filter-options');
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResult(raw));
    });
  });

  // ── lookups ─────────────────────────────────────────────────────────────────

  describe('lookupAntigenGroups()', () => {
    it('should GET and map to string[]', (done) => {
      const raw: RbcAgGroupLookupItem[] = [{ value: 'RH' }, { value: 'KELL' }];

      service.lookupAntigenGroups().subscribe({
        next: (vals) => {
          expect(vals).toEqual(['RH', 'KELL']);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/lookups/antigen-groups');
      req.flush(mockApiResult(raw));
    });
  });

  describe('lookupSerTestIds()', () => {
    it('should GET and map to string[]', (done) => {
      const raw: RbcAgGroupLookupItem[] = [{ value: 'D' }, { value: 'C' }];

      service.lookupSerTestIds().subscribe({
        next: (vals) => {
          expect(vals).toEqual(['D', 'C']);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/lookups/ser-test-ids');
      req.flush(mockApiResult(raw));
    });
  });

  describe('lookupMolTestIds()', () => {
    it('should GET and map to string[]', (done) => {
      const raw: RbcAgGroupLookupItem[] = [{ value: 'RHD*01' }];

      service.lookupMolTestIds().subscribe({
        next: (vals) => {
          expect(vals).toEqual(['RHD*01']);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/lookups/mol-test-ids');
      req.flush(mockApiResult(raw));
    });
  });

  // ── checkGroupExists ────────────────────────────────────────────────────────

  describe('checkGroupExists()', () => {
    it('should return true when group exists', (done) => {
      service.checkGroupExists('RH').subscribe({
        next: (exists) => { expect(exists).toBeTrue(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/check-group-exists');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ antigenGroup: 'RH' });
      req.flush({ ...mockApiResult([]), item: true });
    });

    it('should return false when group does not exist', (done) => {
      service.checkGroupExists('UNKNOWN').subscribe({
        next: (exists) => { expect(exists).toBeFalse(); done(); },
      });

      const req = httpMock.expectOne('/api/v1/rbc-ag-groups/check-group-exists');
      req.flush({ ...mockApiResult([]), item: false });
    });
  });
});
