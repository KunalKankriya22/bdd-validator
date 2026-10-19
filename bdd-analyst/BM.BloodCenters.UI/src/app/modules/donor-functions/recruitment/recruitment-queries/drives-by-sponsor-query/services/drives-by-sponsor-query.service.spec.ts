import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DrivesBySponsorQueryService } from './drives-by-sponsor-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../../../core/constants/api.constants';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DrivesBySponsorQueryService', () => {
  let service: DrivesBySponsorQueryService;
  let httpMock: HttpTestingController;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    mockHeaderService = createMockHeaderService({ chapterId: signal('DAL') });
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    mockLoginService.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DrivesBySponsorQueryService,
        ApiService,
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });

    service = TestBed.inject(DrivesBySponsorQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  describe('getSponsorsLookup', () => {
    it('should fetch sponsors successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { code: 'SPON001', description: 'Sponsor One' },
          { code: 'SPON002', description: 'Sponsor Two' }
        ],
        total: 2,
        errorResponse: { errorCode: '', error: '' }
      };

      service.getSponsorsLookup().subscribe({
        next: (sponsors) => {
          expect(sponsors.length).toBe(2);
          expect(sponsors[0].code).toBe('SPON001');
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url === API.RECRUITMENT.SPONSOR_DRIVES.SPONSORS_LOOKUP
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('chapterId')).toBe('DAL');
      req.flush(mockResponse);
    });


  });

  describe('searchSponsorDrives', () => {
    it('should search sponsor drives successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          drives: [
            {
              driveId: 'DRV001',
              driveDate: '2026-04-01T00:00:00',
              driveType: 'M',
              locationDescription: 'Test Location',
              status: 'CNFRM',
              projectedShow: 50,
              projectedDraw: 40,
              actualCredits: 35,
              actualDraw: 35,
              deferralCount: 5,
              deferralPercentage: 12.5,
              scheduleStartTime: '2026-04-01T09:00:00',
              scheduleEndTime: '2026-04-01T17:00:00'
            }
          ],
          skip: 0,
          take: 25,
          totalRecords: 1,
          totalProjectedShow: 50,
          totalProjectedDraw: 40,
          totalActualCredits: 35,
          totalActualDraw: 35,
          totalDeferralCount: 5,
          otherCredits: 0,
          otherDraws: 0
        },
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      service.searchSponsorDrives(25, 0, {
        sponsorId: 'SPON001',
        status: 'CNFRM'
      }).subscribe({
        next: (result) => {
          expect(result.drives.length).toBe(1);
          expect(result.total).toBe(1);
          expect(result.totals.totalRecords).toBe(1);
          expect(result.totals.totalProjectedShow).toBe(50);
          done();
        }
      });

      const req = httpMock.expectOne(
        API.RECRUITMENT.SPONSOR_DRIVES.SEARCH(25, 0)
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sponsorId).toBe('SPON001');
      expect(req.request.body.status).toBe('CNFRM');
      expect(req.request.body.chapterId).toBe('DAL');
      expect(req.request.body.loggedInUserName).toBe('testuser');
      req.flush(mockResponse);
    });

    it('should handle 404 with success=true (no data)', (done) => {
      const mockEmptyResponse = {
        success: true,
        message: 'No data found',
        statusCode: 200,
        item: {
          drives: [],
          skip: 0,
          take: 25,
          totalRecords: 0,
          totalProjectedShow: 0,
          totalProjectedDraw: 0,
          totalActualCredits: 0,
          totalActualDraw: 0,
          totalDeferralCount: 0,
          otherCredits: 0,
          otherDraws: 0
        },
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      service.searchSponsorDrives(25, 0, {
        sponsorId: 'SPON999',
        status: 'CNFRM'
      }).subscribe({
        next: (result) => {
          expect(result.drives.length).toBe(0);
          expect(result.total).toBe(0);
          expect(result.totals.totalRecords).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(
        API.RECRUITMENT.SPONSOR_DRIVES.SEARCH(25, 0)
      );
      req.flush(mockEmptyResponse);
    });




  });
});
