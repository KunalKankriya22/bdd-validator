import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MultipleDriveSelectionQueryService } from './multiple-drive-selection-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import {
  MultipleDriveSelectionLookups,
  MultipleDriveFilterRequest
} from '../models/multiple-drive-selection-query.model';
import { API } from '../../../../../../core/constants/api.constants';

describe('MultipleDriveSelectionQueryService', () => {
  let service: MultipleDriveSelectionQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let chapterIdSpy: jasmine.Spy;

  const emptyLookups: MultipleDriveSelectionLookups = {
    select: [],
    facility: [],
    status: [],
    sponsors: [],
    zipCode: [],
    sponsorCategory: [],
    territory: [],
    procedure: [],
    driveCategory: [],
    fixedDrive: []
  };

  const fullLookups: MultipleDriveSelectionLookups = {
    ...emptyLookups,
    facility: [{ code: 'F1', description: 'Facility 1' }]
  };

  beforeEach(() => {
    chapterIdSpy = jasmine.createSpy('chapterId').and.returnValue('CH99');
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        MultipleDriveSelectionQueryService,
        { provide: ApiService, useValue: mockApiService },
        {
          provide: HeaderService,
          useValue: { chapterId: chapterIdSpy }
        }
      ]
    });

    service = TestBed.inject(MultipleDriveSelectionQueryService);
  });

  describe('getLookups', () => {
    it('should map item from response', (done) => {
      mockApiService.get.and.returnValue(
        of({
          success: true,
          statusCode: 200,
          item: fullLookups,
          data: null,
          total: null
        })
      );

      service.getLookups().subscribe((lookups) => {
        expect(lookups).toEqual(fullLookups);
        expect(mockApiService.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MULTIPLE_DRIVE_SELECTION_LOOKUPS('CH99')
        );
        done();
      });
    });

    it('should return empty lookups when item is missing', (done) => {
      mockApiService.get.and.returnValue(
        of({
          success: true,
          statusCode: 200,
          item: undefined as any,
          data: null,
          total: null
        })
      );

      service.getLookups().subscribe((lookups) => {
        expect(lookups).toEqual(emptyLookups);
        done();
      });
    });

    it('should return empty lookups when response is null', (done) => {
      mockApiService.get.and.returnValue(of(null as any));

      service.getLookups().subscribe((lookups) => {
        expect(lookups).toEqual(emptyLookups);
        done();
      });
    });

    it('should return empty lookups when item is null', (done) => {
      mockApiService.get.and.returnValue(
        of({
          success: true,
          statusCode: 200,
          item: null as any,
          data: null,
          total: null
        })
      );

      service.getLookups().subscribe((lookups) => {
        expect(lookups).toEqual(emptyLookups);
        done();
      });
    });

    it('should propagate HTTP errors for component error handling', (done) => {
      const err = { status: 500 };
      mockApiService.get.and.returnValue(throwError(() => err));

      service.getLookups().subscribe({
        next: () => fail('expected error'),
        error: (e) => {
          expect(e).toEqual(err);
          done();
        }
      });
    });

    it('should call headerService.chapterId to build endpoint', (done) => {
      mockApiService.get.and.returnValue(
        of({ success: true, statusCode: 200, item: fullLookups, data: null, total: null })
      );

      service.getLookups().subscribe(() => {
        expect(chapterIdSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('searchDrives', () => {
    const baseFilters: MultipleDriveFilterRequest = {
      fromDate: '2026-01-01T00:00:00',
      toDate: '2026-01-31T00:00:00',
      searchKeyword: '',
      facility: []
    };

    it('should post cleaned filters and map data and total', (done) => {
      mockApiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          error: null,
          errorCode: null,
          statusCode: 200,
          data: [{ driveId: 'D1' }],
          item: null,
          total: 1
        })
      );

      service.searchDrives(25, 0, baseFilters).subscribe((res) => {
        expect(res.data).toEqual([{ driveId: 'D1' }]);
        expect(res.total).toBe(1);
        expect(mockApiService.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.MULTIPLE_DRIVE_SELECTION_QUERY('CH99', 25, 0),
          jasmine.objectContaining({
            fromDate: baseFilters.fromDate,
            toDate: baseFilters.toDate
          })
        );
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['searchKeyword']).toBeUndefined();
        expect(body['facility']).toBeUndefined();
        done();
      });
    });

    it('should default data to empty array when response data is null', (done) => {
      mockApiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          error: null,
          errorCode: null,
          statusCode: 200,
          data: null as any,
          item: null,
          total: null as any
        })
      );

      service.searchDrives(10, 0, baseFilters).subscribe((res) => {
        expect(res.data).toEqual([]);
        expect(res.total).toBe(0);
        done();
      });
    });

    it('should default data to empty array when response data is undefined', (done) => {
      mockApiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          error: null,
          errorCode: null,
          statusCode: 200,
          data: undefined as any,
          item: null,
          total: undefined as any
        })
      );

      service.searchDrives(10, 0, baseFilters).subscribe((res) => {
        expect(res.data).toEqual([]);
        expect(res.total).toBe(0);
        done();
      });
    });

    it('should treat 404 with success true as empty result', (done) => {
      const err = { status: 404, error: { success: true } };
      mockApiService.post.and.returnValue(throwError(() => err));

      service.searchDrives(10, 0, baseFilters).subscribe({
        next: (res) => {
          expect(res.data).toEqual([]);
          expect(res.total).toBe(0);
          done();
        },
        error: () => fail('expected success with empty result')
      });
    });

    it('should rethrow 404 errors when success is not true', (done) => {
      const err = { status: 404, error: { success: false } };
      mockApiService.post.and.returnValue(throwError(() => err));

      service.searchDrives(10, 0, baseFilters).subscribe({
        next: () => fail('expected error'),
        error: (e) => {
          expect(e).toBe(err);
          done();
        }
      });
    });

    it('should rethrow 404 errors when error.success is missing', (done) => {
      const err = { status: 404, error: null };
      mockApiService.post.and.returnValue(throwError(() => err));

      service.searchDrives(10, 0, baseFilters).subscribe({
        next: () => fail('expected error'),
        error: (e) => {
          expect(e).toBe(err);
          done();
        }
      });
    });

    it('should rethrow other errors', (done) => {
      const err = { status: 500 };
      mockApiService.post.and.returnValue(throwError(() => err));

      service.searchDrives(10, 0, baseFilters).subscribe({
        error: (e) => {
          expect(e).toBe(err);
          done();
        }
      });
    });

    it('should call headerService.chapterId to build endpoint', (done) => {
      mockApiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          error: null,
          errorCode: null,
          statusCode: 200,
          data: [],
          item: null,
          total: 0
        })
      );

      service.searchDrives(10, 0, baseFilters).subscribe(() => {
        expect(chapterIdSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('cleanFilterRequest (via searchDrives)', () => {
    beforeEach(() => {
      mockApiService.post.and.returnValue(
        of({
          success: true,
          message: '',
          error: null,
          errorCode: null,
          statusCode: 200,
          data: [],
          item: null,
          total: 0
        })
      );
    });

    it('should always keep fromDate and toDate', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-03-01T00:00:00',
        toDate: '2026-03-31T00:00:00'
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['fromDate']).toBe('2026-03-01T00:00:00');
        expect(body['toDate']).toBe('2026-03-31T00:00:00');
        done();
      });
    });

    it('should remove null values from filters', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        sponsorCategory: null as any,
        procedure: null as any
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['sponsorCategory']).toBeUndefined();
        expect(body['procedure']).toBeUndefined();
        done();
      });
    });

    it('should remove undefined values from filters', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        sort: undefined,
        fixedDrive: undefined
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['sort']).toBeUndefined();
        expect(body['fixedDrive']).toBeUndefined();
        done();
      });
    });

    it('should remove empty string values from filters', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        searchKeyword: '',
        sponsorCategory: ''
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['searchKeyword']).toBeUndefined();
        expect(body['sponsorCategory']).toBeUndefined();
        done();
      });
    });

    it('should remove empty arrays from filters', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        facility: [],
        status: [],
        territory: []
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['facility']).toBeUndefined();
        expect(body['status']).toBeUndefined();
        expect(body['territory']).toBeUndefined();
        done();
      });
    });

    it('should keep non-empty string values', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        searchKeyword: 'blood drive',
        sponsorCategory: 'CAT1',
        procedure: 'PROC1',
        fixedDrive: 'Y'
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['searchKeyword']).toBe('blood drive');
        expect(body['sponsorCategory']).toBe('CAT1');
        expect(body['procedure']).toBe('PROC1');
        expect(body['fixedDrive']).toBe('Y');
        done();
      });
    });

    it('should keep non-empty arrays', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        facility: ['F1', 'F2'],
        status: ['ACTIVE'],
        sponsors: ['SP1']
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['facility']).toEqual(['F1', 'F2']);
        expect(body['status']).toEqual(['ACTIVE']);
        expect(body['sponsors']).toEqual(['SP1']);
        done();
      });
    });

    it('should keep numeric values including zero', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-01-01T00:00:00',
        toDate: '2026-01-31T00:00:00',
        minimumProjectDraw: 0,
        maximumProjectDraw: 100,
        minimumTravelTime: 15
      };

      service.searchDrives(10, 0, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(body['minimumProjectDraw']).toBe(0);
        expect(body['maximumProjectDraw']).toBe(100);
        expect(body['minimumTravelTime']).toBe(15);
        done();
      });
    });

    it('should handle a mix of valid and invalid filter values', (done) => {
      const filters: MultipleDriveFilterRequest = {
        fromDate: '2026-02-01T00:00:00',
        toDate: '2026-02-28T00:00:00',
        searchKeyword: 'test',
        sort: '',
        facility: ['F1'],
        status: [],
        sponsors: null as any,
        sponsorCategory: undefined,
        minimumProjectDraw: 5
      };

      service.searchDrives(20, 10, filters).subscribe(() => {
        const body = mockApiService.post.calls.mostRecent().args[1] as Record<string, unknown>;
        // Required fields always present
        expect(body['fromDate']).toBe('2026-02-01T00:00:00');
        expect(body['toDate']).toBe('2026-02-28T00:00:00');
        // Non-empty values kept
        expect(body['searchKeyword']).toBe('test');
        expect(body['facility']).toEqual(['F1']);
        expect(body['minimumProjectDraw']).toBe(5);
        // Empty/null/undefined removed
        expect(body['sort']).toBeUndefined();
        expect(body['status']).toBeUndefined();
        expect(body['sponsors']).toBeUndefined();
        expect(body['sponsorCategory']).toBeUndefined();
        done();
      });
    });
  });
});
