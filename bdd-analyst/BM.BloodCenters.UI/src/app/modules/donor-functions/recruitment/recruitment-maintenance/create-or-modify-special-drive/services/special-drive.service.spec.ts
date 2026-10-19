import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SpecialDriveService } from './special-drive.service';
import { ApiService } from '../../../../../../shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import {
  SpecialDriveDto,
  ApiResponse,
  CreateSpecialDriveRequest,
  UpdateSpecialDriveRequest,
  RecreateSpecialDriveRequest,
  SpecialDriveSearchRequest,
  DriveCategoryLookup,
  DriveIdLookup,
  ResourceLookup,
  SponsorLookup,
  LocationLookup,
  RecruiterLookup,
  CancelCodeLookup
} from '../models/special-drive.model';

describe('SpecialDriveService', () => {
  let service: SpecialDriveService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SpecialDriveService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(SpecialDriveService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getDriveById - PascalCase/camelCase handling', () => {
    const driveId = 'DRV001';
    const chapterId = 'WAD';

    it('should handle camelCase response from backend', (done) => {
      const mockResponse: ApiResponse<SpecialDriveDto> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: {
          driveId: 'DRV001',
          chapterId: 'WAD',
          programId: 'MCICRTFX',
          driveDate: '2026-04-15',
          driveType: 'F',
          driveCategory: 'ROUTN',
          status: 'CNFRM',
          resources: [
            {
              driveId: 'DRV001',
              chapterId: 'WAD',
              resourceCode: 'VAN',
              resourceDescription: 'Van',
              numberRequired: 1
            }
          ],
          sponsors: [
            {
              driveId: 'DRV001',
              chapterId: 'WAD',
              sponsorId: 'SP001',
              sponsorName: 'Test Sponsor',
              projectedShow: 100,
              projectedDraw: 90,
              projDeferralRate: 10
            }
          ]
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          expect(drive.resources).toBeDefined();
          expect(drive.resources?.length).toBe(1);
          expect(drive.resources![0].resourceCode).toBe('VAN');
          expect(drive.resources![0].numberRequired).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponse);
    });

    it('should handle PascalCase response from backend and convert to camelCase', (done) => {
      const mockResponsePascalCase = {
        Success: true,
        StatusCode: 200,
        Message: 'Success',
        Item: {
          DriveId: 'DRV001',
          ChapterId: 'WAD',
          ProgramId: 'MCICRTFX',
          DriveDate: '2026-04-15',
          DriveType: 'F',
          DriveCategory: 'ROUTN',
          Status: 'CNFRM',
          Resources: [
            {
              DriveId: 'DRV001',
              ChapterId: 'WAD',
              ResourceCode: 'NURSE',
              ResourceDescription: 'Nurse',
              NumberRequired: 2
            }
          ],
          Sponsors: [
            {
              DriveId: 'DRV001',
              ChapterId: 'WAD',
              SponsorId: 'SP001',
              SponsorName: 'Test Sponsor',
              ProjectedShow: 100,
              ProjectedDraw: 90,
              ProjDeferralRate: 10
            }
          ],
          Notes: []
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          // Verify PascalCase was converted to camelCase
          expect(drive.resources).toBeDefined();
          expect(drive.resources?.length).toBe(1);
          expect(drive.resources![0].resourceCode).toBe('NURSE');
          expect(drive.resources![0].numberRequired).toBe(2);
          expect(drive.sponsors).toBeDefined();
          expect(drive.notes).toBeDefined();
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponsePascalCase);
    });

    it('should handle mixed PascalCase properties within resource array', (done) => {
      const mockResponseMixed = {
        success: true,
        statusCode: 200,
        Item: {
          driveId: 'DRV001',
          chapterId: 'WAD',
          programId: 'MCICRTFX',
          driveDate: '2026-04-15',
          driveType: 'F',
          driveCategory: 'ROUTN',
          status: 'CNFRM',
          Resources: [
            {
              DriveId: 'DRV001',
              ChapterId: 'WAD',
              ResourceCode: 'STAFF',
              ResourceDescription: 'Staff',
              NumberRequired: 5
            },
            {
              DriveId: 'DRV001',
              ChapterId: 'WAD',
              ResourceCode: 'VAN',
              ResourceDescription: 'Van',
              NumberRequired: 1
            }
          ]
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          expect(drive.resources).toBeDefined();
          expect(drive.resources?.length).toBe(2);

          // First resource
          expect(drive.resources![0].resourceCode).toBe('STAFF');
          expect(drive.resources![0].resourceDescription).toBe('Staff');
          expect(drive.resources![0].numberRequired).toBe(5);

          // Second resource
          expect(drive.resources![1].resourceCode).toBe('VAN');
          expect(drive.resources![1].resourceDescription).toBe('Van');
          expect(drive.resources![1].numberRequired).toBe(1);

          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponseMixed);
    });


    it('should throw error when item is not found in response', (done) => {
      const mockResponseNoItem = {
        success: false,
        statusCode: 404,
        message: 'Not found'
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('DRV001 not found');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponseNoItem);
    });

    it('should include chapterId as query parameter', () => {
      service.getDriveById(driveId, chapterId).subscribe();

      const req = httpTesting.expectOne(
        (request) =>
          request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId)) &&
          request.url.includes(`chapterId=${chapterId}`)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: {} });
    });

    // Zero-value bug fix tests
    it('should preserve 0 value in numberRequired field (camelCase response)', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          driveId: 'DRV001',
          chapterId: 'CH001',
          resources: [
            { resourceCode: 'STAFF', numberRequired: 0, resourceDescription: 'Staff Member' }
          ]
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          expect(drive.resources).toBeDefined();
          expect(drive.resources!.length).toBe(1);
          expect(drive.resources![0].numberRequired).toBe(0);
          expect(drive.resources![0].resourceCode).toBe('STAFF');
          done();
        },
        error: () => done.fail('Should not have errored')
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponse);
    });

    it('should preserve 0 value in numberRequired field (PascalCase response)', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          DriveId: 'DRV002',
          ChapterId: 'CH002',
          Resources: [
            { ResourceCode: 'VAN', NumberRequired: 0, ResourceDescription: 'Van' }
          ]
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          expect(drive.resources).toBeDefined();
          expect(drive.resources!.length).toBe(1);
          expect(drive.resources![0].numberRequired).toBe(0);
          expect(drive.resources![0].resourceCode).toBe('VAN');
          done();
        },
        error: () => done.fail('Should not have errored')
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponse);
    });

    it('should map sponsors and notes arrays correctly', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        item: {
          driveId: 'DRV003',
          chapterId: 'CH003',
          Sponsors: [
            { SponsorId: 'SP001', ProjectedShow: 100, ProjectedDraw: 80 }
          ],
          Notes: [
            { NoteId: 'N001', NoteSequence: 1, Note: 'Test note' }
          ]
        }
      };

      service.getDriveById(driveId, chapterId).subscribe({
        next: (drive) => {
          expect(drive.sponsors).toBeDefined();
          expect(drive.sponsors!.length).toBe(1);
          expect(drive.sponsors![0].sponsorId).toBe('SP001');
          expect(drive.sponsors![0].projectedShow).toBe(100);

          expect(drive.notes).toBeDefined();
          expect(drive.notes!.length).toBe(1);
          expect(drive.notes![0].noteId).toBe('N001');
          expect(drive.notes![0].note).toBe('Test note');
          done();
        },
        error: () => done.fail('Should not have errored')
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID(driveId))
      );
      req.flush(mockResponse);
    });
  });

  describe('getDefaultDeferralRate', () => {
    const url = API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DEFAULT_DEFERRAL_RATE;


    it('should fall back to 18 when response item is null', (done) => {
      service.getDefaultDeferralRate().subscribe({
        next: (rate) => {
          expect(rate).toBe(18);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(url);
      req.flush({ success: true, statusCode: 200, item: null });
    });

    it('should fall back to 18 when response item is undefined', (done) => {
      service.getDefaultDeferralRate().subscribe({
        next: (rate) => {
          expect(rate).toBe(18);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(url);
      req.flush({ success: true, statusCode: 200 });
    });

    it('should throw error when request fails', (done) => {
      service.getDefaultDeferralRate().subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DEFAULT_DEFERRAL_RATE_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(url);
      req.flush({ message: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getSpdrLimit', () => {
    const url = API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPDR_LIMIT;

    it('should return the SPDR_LIMIT value from response.item', (done) => {
      service.getSpdrLimit().subscribe({
        next: (limit) => {
          expect(limit).toBe(30);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(url);
      req.flush({ success: true, item: 30 });
    });

    it('should return 0 when response.item is null', (done) => {
      service.getSpdrLimit().subscribe({
        next: (limit) => {
          expect(limit).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(url);
      req.flush({ success: true, item: null });
    });

    it('should error when the API call fails', (done) => {
      service.getSpdrLimit().subscribe({
        next: () => done.fail('Expected an error'),
        error: (err) => {
          expect(err.code).toBe('SPDR_LIMIT_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(url);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDriveById - validation', () => {
    it('should error when driveId is empty', (done) => {
      service.getDriveById('', 'WAD').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.code).toBe('INVALID_DRIVE_ID'); done(); }
      });
    });

    it('should error when chapterId is empty', (done) => {
      service.getDriveById('DRV1', '').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.code).toBe('INVALID_CHAPTER_ID'); done(); }
      });
    });

    it('should propagate HTTP error from getDriveById', (done) => {
      service.getDriveById('DRV1', 'WAD').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e).toBeTruthy(); done(); }
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID('DRV1')));
      req.flush('fail', { status: 500, statusText: 'Error' });
    });

    it('should throw when response is null', (done) => {
      service.getDriveById('DRV1', 'WAD').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e).toBeTruthy(); done(); }
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.GET_BY_ID('DRV1')));
      req.flush(null);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // searchDrives
  // ──────────────────────────────────────────────────────────────
  describe('searchDrives', () => {
    const searchRequest: SpecialDriveSearchRequest = {
      chapterId: 'WAD',
      status: 'CNFRM'
    };

    it('should return data and total on success', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [
          { driveId: 'DRV001', chapterId: 'WAD', driveDate: '2026-04-15', driveType: 'F', driveCategory: 'ROUTN', status: 'CNFRM', programId: 'MCICRTFX' },
          { driveId: 'DRV002', chapterId: 'WAD', driveDate: '2026-04-16', driveType: 'I', driveCategory: 'ROUTN', status: 'CNFRM', programId: 'MCICRTFX' }
        ],
        total: 2
      };

      service.searchDrives(100, 0, searchRequest).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(2);
          expect(result.total).toBe(2);
          expect(result.data[0].driveId).toBe('DRV001');
          expect(result.data[1].driveId).toBe('DRV002');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(100, 0))
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchRequest);
      req.flush(mockResponse);
    });

    it('should clamp take to 500 when exceeding maximum', (done) => {
      service.searchDrives(1000, 0, searchRequest).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(500, 0))
      );
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should clamp skip to 0 when negative', (done) => {
      service.searchDrives(50, -10, searchRequest).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(50, 0))
      );
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should return error when request is null', (done) => {
      service.searchDrives(100, 0, null as any).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_REQUEST');
          expect(error.message).toBe('Search request is required');
          done();
        }
      });
    });

    it('should return empty data when response has no data', (done) => {
      service.searchDrives(100, 0, searchRequest).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(100, 0))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.searchDrives(100, 0, searchRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DRIVE_SEARCH_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(100, 0))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should throw when response is null', (done) => {
      service.searchDrives(10, 0, {} as any).subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.code).toBe('DRIVE_SEARCH_ERROR'); done(); }
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.SEARCH(10, 0)));
      req.flush(null);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // createDrive
  // ──────────────────────────────────────────────────────────────
  describe('createDrive', () => {
    const validRequest: CreateSpecialDriveRequest = {
      chapterId: 'WAD',
      driveDate: '2026-05-01',
      driveType: 'F',
      driveCategory: 'ROUTN',
      locationId: 'LOC001',
      recruiterId: 'REC001',
      sponsors: [
        { driveId: '', chapterId: 'WAD', sponsorId: 'SP001', sponsorName: 'Test Sponsor', projectedShow: 100, projectedDraw: 90, projDeferralRate: 10 }
      ],
      resources: [
        { driveId: '', chapterId: 'WAD', resourceCode: 'VAN', numberRequired: 1, sortSeq: 1 }
      ],
      notes: [
        { note: 'Test note', insertUser: 'user1', insertUserName: 'User One' }
      ]
    };

    it('should create a drive successfully', (done) => {
      const mockResponse: ApiResponse<SpecialDriveDto> = {
        success: true,
        statusCode: 201,
        message: 'Created',
        item: {
          driveId: 'DRV100',
          chapterId: 'WAD',
          driveDate: '2026-05-01',
          driveType: 'F',
          driveCategory: 'ROUTN',
          status: 'CNFRM',
          programId: 'MCICRTFX'
        }
      };

      service.createDrive(validRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item?.driveId).toBe('DRV100');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.CREATE)
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return error when request is null', (done) => {
      service.createDrive(null as any).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_REQUEST');
          expect(error.message).toBe('Drive creation request is required');
          done();
        }
      });
    });

    it('should return error when chapterId is missing', (done) => {
      const badRequest = { ...validRequest, chapterId: '' };
      service.createDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          done();
        }
      });
    });

    it('should return error when driveDate is missing', (done) => {
      const badRequest = { ...validRequest, driveDate: '' };
      service.createDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_DRIVE_DATE');
          done();
        }
      });
    });

    it('should return error when sponsors array is empty', (done) => {
      const badRequest = { ...validRequest, sponsors: [] };
      service.createDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_SPONSORS');
          expect(error.message).toBe('At least one sponsor is required');
          done();
        }
      });
    });

    it('should map request body to PascalCase DTO format', (done) => {
      service.createDrive(validRequest).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.CREATE)
      );
      const body = req.request.body;
      expect(body.ChapterId).toBe('WAD');
      expect(body.DriveDate).toBe('2026-05-01');
      expect(body.DriveType).toBe('F');
      expect(body.DriveCategory).toBe('ROUTN');
      expect(body.LocationId).toBe('LOC001');
      expect(body.RecruiterId).toBe('REC001');
      expect(body.Sponsors).toBeDefined();
      expect(body.Sponsors.length).toBe(1);
      expect(body.Sponsors[0].SponsorId).toBe('SP001');
      expect(body.Sponsors[0].ProjectedShow).toBe(100);
      expect(body.Resources).toBeDefined();
      expect(body.Resources.length).toBe(1);
      expect(body.Resources[0].ResourceCode).toBe('VAN');
      expect(body.Resources[0].NumberRequired).toBe(1);
      expect(body.Notes).toBeDefined();
      expect(body.Notes.length).toBe(1);
      expect(body.Notes[0].Note).toBe('Test note');
      req.flush({ success: true, item: { driveId: 'DRV100', chapterId: 'WAD', driveDate: '2026-05-01', driveType: 'F', driveCategory: 'ROUTN', status: 'CNFRM', programId: 'MCICRTFX' } });
    });

    it('should handle HTTP error on create', (done) => {
      service.createDrive(validRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DRIVE_CREATE_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.CREATE)
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // updateDrive
  // ──────────────────────────────────────────────────────────────
  describe('updateDrive', () => {
    const validRequest: UpdateSpecialDriveRequest = {
      driveId: 'DRV001',
      chapterId: 'WAD',
      driveDate: '2026-05-01',
      driveType: 'F',
      driveCategory: 'ROUTN',
      locationId: 'LOC001',
      recruiterId: 'REC001',
      auditKey: 42,
      status: 'CNFRM',
      sponsors: [
        { driveId: 'DRV001', chapterId: 'WAD', sponsorId: 'SP001', sponsorName: 'Test Sponsor', projectedShow: 100, projectedDraw: 90, projDeferralRate: 10 }
      ],
      resources: [
        { driveId: 'DRV001', chapterId: 'WAD', resourceCode: 'VAN', numberRequired: 2, sortSeq: 1 }
      ],
      notes: [
        { note: 'Updated note', insertUser: 'user1', insertUserName: 'User One' }
      ]
    };

    it('should update a drive successfully', (done) => {
      const mockResponse: ApiResponse<SpecialDriveDto> = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        item: {
          driveId: 'DRV001',
          chapterId: 'WAD',
          driveDate: '2026-05-01',
          driveType: 'F',
          driveCategory: 'ROUTN',
          status: 'CNFRM',
          programId: 'MCICRTFX'
        }
      };

      service.updateDrive(validRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item?.driveId).toBe('DRV001');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.UPDATE('DRV001'))
      );
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });

    it('should return error when request is null', (done) => {
      service.updateDrive(null as any).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_REQUEST');
          expect(error.message).toBe('Drive update request is required');
          done();
        }
      });
    });

    it('should return error when driveId is missing', (done) => {
      const badRequest = { ...validRequest, driveId: '' };
      service.updateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_DRIVE_ID');
          done();
        }
      });
    });

    it('should return error when chapterId is missing', (done) => {
      const badRequest = { ...validRequest, chapterId: '' };
      service.updateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          done();
        }
      });
    });

    it('should return error when auditKey is undefined', (done) => {
      const badRequest = { ...validRequest, auditKey: undefined as any };
      service.updateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_AUDIT_KEY');
          expect(error.message).toBe('Audit key is required for updates');
          done();
        }
      });
    });

    it('should return error when auditKey is null', (done) => {
      const badRequest = { ...validRequest, auditKey: null as any };
      service.updateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_AUDIT_KEY');
          done();
        }
      });
    });

    it('should map request body to PascalCase DTO format', (done) => {
      service.updateDrive(validRequest).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.UPDATE('DRV001'))
      );
      const body = req.request.body;
      expect(body.DriveId).toBe('DRV001');
      expect(body.ChapterId).toBe('WAD');
      expect(body.DriveDate).toBe('2026-05-01');
      expect(body.DriveType).toBe('F');
      expect(body.DriveCategory).toBe('ROUTN');
      expect(body.AuditKey).toBe(42);
      expect(body.Status).toBe('CNFRM');
      expect(body.Sponsors).toBeDefined();
      expect(body.Sponsors[0].SponsorId).toBe('SP001');
      expect(body.Resources).toBeDefined();
      expect(body.Resources[0].ResourceCode).toBe('VAN');
      expect(body.Resources[0].NumberRequired).toBe(2);
      expect(body.Notes).toBeDefined();
      expect(body.Notes[0].Note).toBe('Updated note');
      req.flush({ success: true, item: { driveId: 'DRV001', chapterId: 'WAD', driveDate: '2026-05-01', driveType: 'F', driveCategory: 'ROUTN', status: 'CNFRM', programId: 'MCICRTFX' } });
    });

    it('should handle HTTP error on update', (done) => {
      service.updateDrive(validRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DRIVE_UPDATE_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.UPDATE('DRV001'))
      );
      req.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // deleteDrive
  // ──────────────────────────────────────────────────────────────
  describe('deleteDrive', () => {
    it('should delete a drive successfully', (done) => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        statusCode: 200,
        message: 'Deleted'
      };

      service.deleteDrive('DRV001').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.DELETE('DRV001'))
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should return error when driveId is empty', (done) => {
      service.deleteDrive('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_DRIVE_ID');
          expect(error.message).toBe('Drive ID is required');
          done();
        }
      });
    });

    it('should return error when driveId is null', (done) => {
      service.deleteDrive(null as any).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_DRIVE_ID');
          done();
        }
      });
    });

    it('should include optional query params (chapterId, cancelReasonCode, cancelReason)', (done) => {
      service.deleteDrive('DRV001', 'WAD', 'NOSHOW', 'No one showed up').subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) =>
          request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.DELETE('DRV001')) &&
          request.params.get('chapterId') === 'WAD' &&
          request.params.get('cancelReasonCode') === 'NOSHOW' &&
          request.params.get('cancelReason') === 'No one showed up'
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should delete without optional params', (done) => {
      service.deleteDrive('D1').subscribe({
        next: () => done(),
        error: done.fail
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.DELETE('D1')));
      req.flush({ success: true });
    });

    it('should handle HTTP error on delete', (done) => {
      service.deleteDrive('DRV001').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.DELETE('DRV001'))
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // recreateDrive
  // ──────────────────────────────────────────────────────────────
  describe('recreateDrive', () => {
    const validRequest: RecreateSpecialDriveRequest = {
      sourceDriveId: 'DRV001',
      newDriveDate: '2026-06-01',
      chapterId: 'WAD'
    };

    it('should recreate a drive successfully', (done) => {
      const mockResponse: ApiResponse<SpecialDriveDto> = {
        success: true,
        statusCode: 201,
        message: 'Recreated',
        item: {
          driveId: 'DRV200',
          chapterId: 'WAD',
          driveDate: '2026-06-01',
          driveType: 'I',
          driveCategory: 'ROUTN',
          status: 'CNFRM',
          programId: 'MCICRTFX'
        }
      };

      service.recreateDrive(validRequest).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item?.driveId).toBe('DRV200');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.RECREATE)
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should return error when request is null', (done) => {
      service.recreateDrive(null as any).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_REQUEST');
          expect(error.message).toBe('Recreate drive request is required');
          done();
        }
      });
    });

    it('should return error when sourceDriveId is missing', (done) => {
      const badRequest = { ...validRequest, sourceDriveId: '' };
      service.recreateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_SOURCE_DRIVE_ID');
          done();
        }
      });
    });

    it('should return error when newDriveDate is missing', (done) => {
      const badRequest = { ...validRequest, newDriveDate: '' };
      service.recreateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_DRIVE_DATE');
          done();
        }
      });
    });

    it('should return error when chapterId is missing', (done) => {
      const badRequest = { ...validRequest, chapterId: '' };
      service.recreateDrive(badRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          done();
        }
      });
    });

    it('should map request body to PascalCase DTO format', (done) => {
      service.recreateDrive(validRequest).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.RECREATE)
      );
      const body = req.request.body;
      expect(body.SourceDriveId).toBe('DRV001');
      expect(body.DriveDate).toBe('2026-06-01');
      expect(body.ChapterId).toBe('WAD');
      req.flush({ success: true, item: { driveId: 'DRV200', chapterId: 'WAD', driveDate: '2026-06-01', driveType: 'I', driveCategory: 'ROUTN', status: 'CNFRM', programId: 'MCICRTFX' } });
    });

    it('should handle HTTP error on recreate', (done) => {
      service.recreateDrive(validRequest).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DRIVE_RECREATE_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.RECREATE)
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getDriveIds
  // ──────────────────────────────────────────────────────────────
  describe('getDriveIds', () => {
    const chapterId = 'WAD';

    it('should return drive IDs on success', (done) => {
      const mockData: DriveIdLookup[] = [
        { driveId: 'DRV001', driveDate: '2026-04-15', sponsorName: 'Sponsor A', driveType: 'F' },
        { driveId: 'DRV002', driveDate: '2026-04-16', sponsorName: 'Sponsor B', driveType: 'I' }
      ];

      service.getDriveIds(chapterId).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].driveId).toBe('DRV001');
          expect(result[1].driveId).toBe('DRV002');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS(chapterId))
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return error when chapterId is empty', (done) => {
      service.getDriveIds('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          expect(error.message).toBe('Chapter ID is required to load drive IDs');
          done();
        }
      });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getDriveIds(chapterId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS(chapterId))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.getDriveIds(chapterId).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('DRIVE_ID_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS(chapterId))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should throw when response is null', (done) => {
      service.getDriveIds('WAD').subscribe({
        next: () => done.fail('Should error'),
        error: (e) => { expect(e.code).toBe('DRIVE_ID_LOAD_ERROR'); done(); }
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_IDS('WAD')));
      req.flush(null);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getDriveCategories
  // ──────────────────────────────────────────────────────────────
  describe('getDriveCategories', () => {
    const url = API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.DRIVE_CATEGORIES;

    it('should return drive categories on success', (done) => {
      const mockData: DriveCategoryLookup[] = [
        { code: 'ROUTN', description: 'Routine' },
        { code: 'EMERG', description: 'Emergency' }
      ];

      service.getDriveCategories().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('ROUTN');
          expect(result[0].description).toBe('Routine');
          expect(result[1].code).toBe('EMERG');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getDriveCategories().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush({ success: true });
    });

    it('should throw error when response is null', (done) => {
      service.getDriveCategories().subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('CATEGORY_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush(null);
    });

    it('should handle HTTP error', (done) => {
      service.getDriveCategories().subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('CATEGORY_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getResources
  // ──────────────────────────────────────────────────────────────
  describe('getResources', () => {
    const chapterId = 'WAD';

    it('should return resources on success', (done) => {
      const mockData: ResourceLookup[] = [
        { code: 'VAN', description: 'Van', boxNumber: 1 },
        { code: 'NURSE', description: 'Nurse', boxNumber: 2 }
      ];

      service.getResources(chapterId).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('VAN');
          expect(result[0].description).toBe('Van');
          expect(result[1].code).toBe('NURSE');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RESOURCES(chapterId))
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return error when chapterId is empty', (done) => {
      service.getResources('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          expect(error.message).toBe('Chapter ID is required to load resources');
          done();
        }
      });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getResources(chapterId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RESOURCES(chapterId))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.getResources(chapterId).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('RESOURCE_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RESOURCES(chapterId))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getSponsors
  // ──────────────────────────────────────────────────────────────
  describe('getSponsors', () => {
    const chapterId = 'WAD';

    it('should return sponsors on success', (done) => {
      const mockData: SponsorLookup[] = [
        { sponsorId: 'SP001', name: 'Sponsor One' },
        { sponsorId: 'SP002', name: 'Sponsor Two' }
      ];

      service.getSponsors(chapterId, 'Sponsor', 100, 0).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].sponsorId).toBe('SP001');
          expect(result[0].name).toBe('Sponsor One');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(100, 0))
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.ChapterId).toBe('WAD');
      expect(req.request.body.SearchText).toBe('Sponsor');
      req.flush({ success: true, data: mockData });
    });

    it('should return sponsors with different pagination params', (done) => {
      service.getSponsors('WAD', 'test', 50, 10).subscribe({
        next: (sponsors) => { expect(sponsors.length).toBe(1); done(); },
        error: done.fail
      });
      const req = httpTesting.expectOne(r => r.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(50, 10)));
      expect(req.request.body.ChapterId).toBe('WAD');
      expect(req.request.body.SearchText).toBe('test');
      req.flush({ data: [{ sponsorId: 'S1' }] });
    });

    it('should return error when chapterId is empty', (done) => {
      service.getSponsors('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          done();
        }
      });
    });

    it('should return error when searchText is less than 3 characters', (done) => {
      service.getSponsors(chapterId, 'AB').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_SEARCH_TEXT');
          expect(error.message).toBe('Search text must be at least 3 characters');
          done();
        }
      });
    });

    it('should allow empty searchText', (done) => {
      service.getSponsors(chapterId, '').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(100, 0))
      );
      req.flush({ success: true, data: [] });
    });

    it('should clamp take to 500 when exceeding maximum', (done) => {
      service.getSponsors(chapterId, 'Test', 1000, 0).subscribe({
        next: () => done(),
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(500, 0))
      );
      req.flush({ success: true, data: [] });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getSponsors(chapterId, 'Test').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(100, 0))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.getSponsors(chapterId, 'Test').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('SPONSOR_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.SPONSORS(100, 0))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getLocations
  // ──────────────────────────────────────────────────────────────
  describe('getLocations', () => {
    const chapterId = 'WAD';

    it('should return locations on success', (done) => {
      const mockData: LocationLookup[] = [
        { locationId: 'LOC001', locationName: 'Main Center', locationType: 'FIXED' },
        { locationId: 'LOC002', locationName: 'Mobile Unit', locationType: 'MOBILE' }
      ];

      service.getLocations(chapterId).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].locationId).toBe('LOC001');
          expect(result[0].locationName).toBe('Main Center');
          expect(result[1].locationId).toBe('LOC002');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.LOCATIONS(chapterId))
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return error when chapterId is empty', (done) => {
      service.getLocations('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          expect(error.message).toBe('Chapter ID is required');
          done();
        }
      });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getLocations(chapterId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.LOCATIONS(chapterId))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.getLocations(chapterId).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('LOCATION_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.LOCATIONS(chapterId))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getRecruiters
  // ──────────────────────────────────────────────────────────────
  describe('getRecruiters', () => {
    const chapterId = 'WAD';

    it('should return recruiters on success', (done) => {
      const mockData: RecruiterLookup[] = [
        { employeeId: 'EMP001', employeeName: 'Jane Doe', employeeClassDescription: 'Recruiter' },
        { employeeId: 'EMP002', employeeName: 'John Smith', employeeClassDescription: 'Recruiter' }
      ];

      service.getRecruiters(chapterId).subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].employeeId).toBe('EMP001');
          expect(result[0].employeeName).toBe('Jane Doe');
          expect(result[1].employeeId).toBe('EMP002');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RECRUITERS(chapterId))
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return error when chapterId is empty', (done) => {
      service.getRecruiters('').subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('INVALID_CHAPTER_ID');
          expect(error.message).toBe('Chapter ID is required');
          done();
        }
      });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getRecruiters(chapterId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RECRUITERS(chapterId))
      );
      req.flush({ success: true });
    });

    it('should handle HTTP error', (done) => {
      service.getRecruiters(chapterId).subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('RECRUITER_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.RECRUITERS(chapterId))
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getCancelCodes
  // ──────────────────────────────────────────────────────────────
  describe('getCancelCodes', () => {
    const url = API.RECRUITMENT.SPECIAL_DRIVES.LOOKUPS.CANCEL_CODES;

    it('should return cancel codes on success', (done) => {
      const mockData: CancelCodeLookup[] = [
        { code: 'NOSHOW', description: 'No Show' },
        { code: 'WEATHER', description: 'Weather Related' }
      ];

      service.getCancelCodes().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].code).toBe('NOSHOW');
          expect(result[0].description).toBe('No Show');
          expect(result[1].code).toBe('WEATHER');
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockData });
    });

    it('should return empty array when response data is missing', (done) => {
      service.getCancelCodes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: done.fail
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush({ success: true });
    });

    it('should throw error when response is null', (done) => {
      service.getCancelCodes().subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('CANCEL_CODE_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush(null);
    });

    it('should handle HTTP error', (done) => {
      service.getCancelCodes().subscribe({
        next: () => done.fail('Should have errored'),
        error: (error) => {
          expect(error.code).toBe('CANCEL_CODE_LOAD_ERROR');
          done();
        }
      });

      const req = httpTesting.expectOne(
        (request) => request.url.includes(url)
      );
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
