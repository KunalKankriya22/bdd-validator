import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DrivesService } from './drives.service';
import {
  DrivesModel,
  AddDriveRecordDto,
  UpdateDriveRecordDto,
  DrivesParamsDto,
  ChapterLookup,
  GroupSite,
  Drive,
  DriveType,
  DrivesFilterLov
} from '../models/drives.model';

describe('DrivesService', () => {
  let service: DrivesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DrivesService]
    });
    service = TestBed.inject(DrivesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── getDrives ───────────────────────────────────────────────────────

  it('should call getDrives and return drives data with new API structure', () => {
    const mockDrives: DrivesModel[] = [
      { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000', totalRecordsCount: 1 }
    ];

    const mockResponse = {
      success: true,
      message: 'Successfully fetched the drive details records',
      statusCode: 200,
      data: mockDrives,
      total: 1,
      errorResponse: { errorCode: '', error: '' }
    };

    service.getDrives(1, 10, { chapterId: 'WAD', type: 'F', driveId: '001' }).subscribe(result => {
      expect(result.data).toEqual(mockDrives);
      expect(result.totalRecords).toBe(1);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/10/0'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.driveType).toBe('F');
    expect(req.request.body.driveId).toBe('001');
    expect(req.request.body.chapterId).toBe('WAD');
    req.flush(mockResponse);
  });

  it('should include sort parameter when provided', () => {
    const mockDrives: DrivesModel[] = [
      { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000', totalRecordsCount: 1 }
    ];

    const mockResponse = {
      success: true,
      message: 'Successfully fetched the drive details records',
      statusCode: 200,
      data: mockDrives,
      total: 1,
      errorResponse: { errorCode: '', error: '' }
    };

    service.getDrives(1, 10, { chapterId: 'WAD', Sort: 'A' }).subscribe(result => {
      expect(result.data).toEqual(mockDrives);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/10/0'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.sort).toBe('A');
    req.flush(mockResponse);
  });

  it('should include searchKeyword, scheduleDate, and schedulePeriod when provided', () => {
    const mockDrives: DrivesModel[] = [
      { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000', totalRecordsCount: 1 }
    ];

    const mockResponse = {
      success: true,
      message: 'Successfully fetched the drive details records',
      statusCode: 200,
      data: mockDrives,
      total: 1,
      errorResponse: { errorCode: '', error: '' }
    };

    service.getDrives(1, 10, {
      chapterId: 'WAD',
      searchKeyword: 'test',
      scheduleDate: '15-Mar-2026',
      schedulePeriod: 'After'
    }).subscribe(result => {
      expect(result.data).toEqual(mockDrives);
      expect(result.totalRecords).toBe(1);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/10/0'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.searchKeyword).toBe('test');
    expect(req.request.body.scheduleDate).toBe('15-Mar-2026');
    expect(req.request.body.schedulePeriod).toBe('After');
    req.flush(mockResponse);
  });

  it('should calculate correct take and skip parameters', () => {
    const mockResponse = {
      success: true,
      message: 'Successfully fetched the drive details records',
      statusCode: 200,
      data: [],
      total: 0,
      errorResponse: { errorCode: '', error: '' }
    };

    // Page 3 with page size 25: skip should be (3-1)*25 = 50
    service.getDrives(3, 25, { chapterId: 'WAD' }).subscribe();

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/25/50'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should set null for missing optional getDrives params', () => {
    service.getDrives(1, 10, {}).subscribe(result => {
      expect(result.data).toEqual([]);
      expect(result.totalRecords).toBe(0);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/10/0'));
    expect(req.request.body.searchKeyword).toBeNull();
    expect(req.request.body.chapterId).toBeNull();
    expect(req.request.body.fromDate).toBeNull();
    expect(req.request.body.toDate).toBeNull();
    expect(req.request.body.driveType).toBeNull();
    expect(req.request.body.driveId).toBeNull();
    expect(req.request.body.siteId).toBeNull();
    expect(req.request.body.scheduleDate).toBeNull();
    expect(req.request.body.schedulePeriod).toBeNull();
    expect(req.request.body.sort).toBeNull();
    req.flush({ data: null, total: null });
  });

  it('should handle error from getDrives', () => {
    service.getDrives(1, 10, { chapterId: 'WAD' }).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/details/10/0'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ─── getDrivesFilters ────────────────────────────────────────────────

  describe('getDrivesFilters', () => {
    it('should call getDrivesFilters and return filter options', () => {
      const mockResponse = {
        success: true,
        data: [{ types: ['F', 'M'], drives: ['001', '002'] }],
        total: 1
      };

      service.getDrivesFilters().subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.data).toBeDefined();
      });

      const req = httpMock.expectOne(request => request.url.includes('/api/v1/admin/drives-filters'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error from getDrivesFilters', () => {
      service.getDrivesFilters().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/api/v1/admin/drives-filters'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── getChapterLookup ────────────────────────────────────────────────

  it('should call getChapterLookup and return chapter data', () => {
    const mockChapters = [
      { chapterId: 'WAD', chapterName: 'Washington' }
    ];

    service.getChapterLookup().subscribe(result => {
      expect(result.data).toEqual(mockChapters);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/chapters/lookup'));
    expect(req.request.method).toBe('GET');
    req.flush(mockChapters);
  });

  it('should return empty array when getChapterLookup response is null', () => {
    service.getChapterLookup().subscribe(result => {
      expect(result.data).toEqual([]);
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/chapters/lookup'));
    req.flush(null);
  });

  it('should handle error from getChapterLookup', () => {
    service.getChapterLookup().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(403);
      }
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/chapters/lookup'));
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
  });

  // ─── getTypeOptions ──────────────────────────────────────────────────

  describe('getTypeOptions', () => {
    it('should call getTypeOptions and return type data', () => {
      const mockResponse = {
        success: true,
        data: ['F', 'M', 'S'],
        total: 3
      };

      service.getTypeOptions().subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.data).toEqual(['F', 'M', 'S']);
      });

      const req = httpMock.expectOne(request => request.url.includes('/api/v1/admin/drives/types'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error from getTypeOptions', () => {
      service.getTypeOptions().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request => request.url.includes('/api/v1/admin/drives/types'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── getGroupSites ───────────────────────────────────────────────────

  it('should call getGroupSites without chapter filter and return all sites', () => {
    const mockSites = [
      { groupSiteId: '1000', siteName: 'Main Site', chapterId: 'WAD' }
    ];

    service.getGroupSites().subscribe(result => {
      expect(result.data).toEqual(mockSites);
      expect(result.total).toBe(1);
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/v1/drives/group-sites') && !request.url.includes('chapterId')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSites);
  });

  it('should call getGroupSites with chapterId filter', () => {
    const mockSites = [
      { groupSiteId: '1000', siteName: 'Main Site', chapterId: 'WAD' },
      { groupSiteId: '1001', siteName: 'Secondary Site', chapterId: 'WAD' }
    ];

    service.getGroupSites('WAD').subscribe(result => {
      expect(result.data).toEqual(mockSites);
      expect(result.total).toBe(2);
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/v1/drives/group-sites?chapterId=WAD')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSites);
  });

  it('should handle paginated response format from getGroupSites', () => {
    const mockResponse = {
      data: [
        { groupSiteId: '1000', siteName: 'Main Site', chapterId: 'WAD' }
      ],
      total: 100
    };

    service.getGroupSites('WAD').subscribe(result => {
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(100);
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/v1/drives/group-sites?chapterId=WAD')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle error from getGroupSites', () => {
    service.getGroupSites().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('/api/v1/drives/group-sites') && !request.url.includes('chapterId')
    );
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ─── getGroupSitesForFilter ──────────────────────────────────────────

  describe('getGroupSitesForFilter', () => {
    it('should call getGroupSitesForFilter and return filtered group sites', () => {
      const mockResponse = {
        success: true,
        data: [
          { groupSiteId: '1000', siteName: 'Main Site', chapterId: 'WAD' },
          { groupSiteId: '1001', siteName: 'Branch Site', chapterId: 'WAD' }
        ],
        total: 2
      };

      const params: DrivesParamsDto = {
        chapterId: 'WAD',
        fromDate: '2026-01-01',
        toDate: '2026-12-31'
      };

      service.getGroupSitesForFilter(params).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].groupSiteId).toBe('1000');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/group-sites-filtered-by-drives')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe('WAD');
      expect(req.request.body.fromDate).toBe('2026-01-01');
      expect(req.request.body.toDate).toBe('2026-12-31');
      req.flush(mockResponse);
    });

    it('should set null for missing optional params in getGroupSitesForFilter', () => {
      service.getGroupSitesForFilter({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/group-sites-filtered-by-drives')
      );
      expect(req.request.body.chapterId).toBeNull();
      expect(req.request.body.fromDate).toBeNull();
      expect(req.request.body.toDate).toBeNull();
      req.flush({ data: null, total: null });
    });

    it('should handle error from getGroupSitesForFilter', () => {
      service.getGroupSitesForFilter({ chapterId: 'WAD' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/group-sites-filtered-by-drives')
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── getDriveTypesForFilter ──────────────────────────────────────────

  describe('getDriveTypesForFilter', () => {
    it('should call getDriveTypesForFilter and return filtered drive types', () => {
      const mockResponse = {
        success: true,
        data: [
          { driveType: 'F', driveTypeDescription: 'Fixed' },
          { driveType: 'M', driveTypeDescription: 'Mobile' }
        ],
        total: 2
      };

      const params: DrivesParamsDto = {
        chapterId: 'WAD',
        fromDate: '2026-01-01',
        toDate: '2026-12-31'
      };

      service.getDriveTypesForFilter(params).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].driveType).toBe('F');
        expect(result.data[1].driveTypeDescription).toBe('Mobile');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-types-filtered-by-drives')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe('WAD');
      expect(req.request.body.fromDate).toBe('2026-01-01');
      expect(req.request.body.toDate).toBe('2026-12-31');
      req.flush(mockResponse);
    });

    it('should set null for missing optional params in getDriveTypesForFilter', () => {
      service.getDriveTypesForFilter({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-types-filtered-by-drives')
      );
      expect(req.request.body.chapterId).toBeNull();
      expect(req.request.body.fromDate).toBeNull();
      expect(req.request.body.toDate).toBeNull();
      req.flush({ data: null, total: null });
    });

    it('should handle error from getDriveTypesForFilter', () => {
      service.getDriveTypesForFilter({ chapterId: 'WAD' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-types-filtered-by-drives')
      );
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ─── getDrivesForFilter ──────────────────────────────────────────────

  describe('getDrivesForFilter', () => {
    it('should call getDrivesForFilter and return filtered drives', () => {
      const mockResponse = {
        success: true,
        data: [
          { drive: '001' },
          { drive: '002' }
        ],
        total: 2
      };

      const params: DrivesParamsDto = {
        chapterId: 'WAD',
        fromDate: '2026-01-01',
        toDate: '2026-12-31'
      };

      service.getDrivesForFilter(params).subscribe(result => {
        expect(result.data.length).toBe(2);
        expect(result.total).toBe(2);
        expect(result.data[0].drive).toBe('001');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-filter')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.chapterId).toBe('WAD');
      expect(req.request.body.fromDate).toBe('2026-01-01');
      expect(req.request.body.toDate).toBe('2026-12-31');
      req.flush(mockResponse);
    });

    it('should set null for missing optional params in getDrivesForFilter', () => {
      service.getDrivesForFilter({}).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-filter')
      );
      expect(req.request.body.chapterId).toBeNull();
      expect(req.request.body.fromDate).toBeNull();
      expect(req.request.body.toDate).toBeNull();
      req.flush({ data: null, total: null });
    });

    it('should handle error from getDrivesForFilter', () => {
      service.getDrivesForFilter({ chapterId: 'WAD' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(request =>
        request.url.includes('/api/v1/drives/drive-filter')
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── getGroupSiteById ────────────────────────────────────────────────

  describe('getGroupSiteById', () => {
    it('should call getGroupSiteById and return site details', () => {
      const mockSite = {
        groupSiteId: '1000',
        siteName: 'Test Site Description',
        chapterId: 'WAD'
      };

      service.getGroupSiteById('1000').subscribe(result => {
        expect(result).toEqual(mockSite);
        expect(result.siteName).toBe('Test Site Description');
      });

      const req = httpMock.expectOne('/api/v1/drives/group-sites/1000');
      expect(req.request.method).toBe('GET');
      req.flush(mockSite);
    });

    it('should handle error when fetching site by ID', () => {
      const errorMessage = 'Site not found';

      service.getGroupSiteById('9999').subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne('/api/v1/drives/group-sites/9999');
      expect(req.request.method).toBe('GET');
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('should call getGroupSiteById with correct URL parameter', () => {
      const groupSiteId = '5000';
      const mockSite = {
        groupSiteId: '5000',
        siteName: 'Another Site',
        chapterId: 'SEA'
      };

      service.getGroupSiteById(groupSiteId).subscribe(result => {
        expect(result.groupSiteId).toBe('5000');
        expect(result.chapterId).toBe('SEA');
      });

      const req = httpMock.expectOne(`/api/v1/drives/group-sites/${groupSiteId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSite);
    });
  });

  // ─── addDriveRecord ──────────────────────────────────────────────────

  it('should call addDriveRecord with correct payload', () => {
    const mockPayload: AddDriveRecordDto = {
      chapterId: 'WAD',
      driveType: 'F',
      driveId: '001',
      groupSiteId: '1000',
      description: 'Test',
      os: 'Y',
      scheduledDate: '28-Feb-2026'
    };

    service.addDriveRecord(mockPayload).subscribe(result => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/insert'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockPayload);
    req.flush({ success: true });
  });

  it('should handle error from addDriveRecord', () => {
    const mockPayload: AddDriveRecordDto = {
      chapterId: 'WAD',
      driveType: 'F',
      driveId: '001',
      groupSiteId: '1000',
      os: 'Y',
      scheduledDate: '28-Feb-2026'
    };

    service.addDriveRecord(mockPayload).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(409);
      }
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/insert'));
    req.flush('Duplicate record', { status: 409, statusText: 'Conflict' });
  });

  // ─── updateDriveRecord ───────────────────────────────────────────────

  it('should call updateDriveRecord with correct payload', () => {
    const mockPayload: UpdateDriveRecordDto = {
      chapterId: 'WAD',
      driveType: 'F',
      driveId: '001',
      groupSiteId: '1000',
      originalGroupSiteId: '1000',
      description: 'Updated',
      os: 'N',
      scheduledDate: '28-Feb-2026'
    };

    service.updateDriveRecord(mockPayload).subscribe(result => {
      expect(result).toBeTruthy();
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/update'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(mockPayload);
    req.flush({ success: true });
  });

  it('should handle error from updateDriveRecord', () => {
    const mockPayload: UpdateDriveRecordDto = {
      chapterId: 'WAD',
      driveType: 'F',
      driveId: '001',
      groupSiteId: '1000',
      originalGroupSiteId: '1000',
      description: 'Updated',
      os: 'N',
      scheduledDate: '28-Feb-2026'
    };

    service.updateDriveRecord(mockPayload).subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(422);
      }
    });

    const req = httpMock.expectOne(request => request.url.includes('/api/v1/drives/update'));
    req.flush('Validation failed', { status: 422, statusText: 'Unprocessable Entity' });
  });
});
