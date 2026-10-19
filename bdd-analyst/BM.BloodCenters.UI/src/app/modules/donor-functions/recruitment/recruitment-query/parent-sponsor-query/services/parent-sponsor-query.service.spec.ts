import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ParentSponsorQueryService } from './parent-sponsor-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ShowDriveDataOption } from '../models/parent-sponsor-query.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ParentSponsorQueryService', () => {
  let loginServiceSpy: any;
  let service: ParentSponsorQueryService;
  let apiService: jasmine.SpyObj<ApiService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let loginService: jasmine.SpyObj<LoginService>;

  const mockChapterId = 'DAL';
  const mockUserName = 'testuser';

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    const headerServiceSpy = createMockHeaderService({ chapterId: signal('DAL') });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    loginServiceSpy.getStoredUsername.and.returnValue(mockUserName);

    TestBed.configureTestingModule({
      providers: [
        ParentSponsorQueryService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });

    service = TestBed.inject(ParentSponsorQueryService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
  });


  describe('getParentSponsorsLookup', () => {
    it('should fetch parent sponsors successfully', (done) => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          { sponsorId: 'SPON001', sponsorName: 'Test Sponsor 1' },
          { sponsorId: 'SPON002', sponsorName: 'Test Sponsor 2' }
        ]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getParentSponsorsLookup().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.data);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should fetch parent sponsors with search text', (done) => {
      const mockResponse = {
        success: true,
        data: [{ sponsorId: 'SPON001', sponsorName: 'Test Sponsor' }]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getParentSponsorsLookup('Test').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(apiService.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should include chapterId in request params', (done) => {
      const mockResponse = { success: true, data: [] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getParentSponsorsLookup().subscribe({
        next: () => {
          const callArgs = apiService.get.calls.mostRecent().args;
          expect(callArgs[1]?.params?.get('chapterId')).toBe(mockChapterId);
          done();
        }
      });
    });




  });

  describe('getParentSponsorInfo', () => {
    const sponsorId = 'SPON001';

    it('should fetch parent sponsor info successfully', (done) => {
      const mockResponse = {
        success: true,
        item: {
          sponsorId: 'SPON001',
          sponsorName: 'Test Sponsor',
          address: '123 Main St, Dallas, TX 75001',
          phone: '(214) 555-1234'
        }
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getParentSponsorInfo(sponsorId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse.item);
          expect(result?.sponsorId).toBe('SPON001');
          expect(result?.address).toBe('123 Main St, Dallas, TX 75001');
          done();
        }
      });
    });



    it('should handle non-404 errors', (done) => {
      const error = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => error));

      service.getParentSponsorInfo(sponsorId).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });
    });

    it('should include chapterId in request params', (done) => {
      const mockResponse = { success: true, item: null };
      apiService.get.and.returnValue(of(mockResponse));

      service.getParentSponsorInfo(sponsorId).subscribe({
        next: () => {
          const callArgs = apiService.get.calls.mostRecent().args;
          expect(callArgs[1]?.params?.get('chapterId')).toBe(mockChapterId);
          done();
        }
      });
    });
  });

  describe('getConstituentSponsors', () => {
    const baseRequest = {
      parentSponsorId: 'SPON001',
      showDriveData: ShowDriveDataOption.No
    };

    it('should fetch constituent sponsors in simple mode', (done) => {
      const mockResponse = {
        success: true,
        item: {
          data: [
            { constituentSponsor: 'Child Sponsor 1', sponsorId: 'CHILD001', recruiter: 'J.Smith' },
            { constituentSponsor: 'Child Sponsor 2', sponsorId: 'CHILD002', recruiter: null }
          ],
          total: 2
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getConstituentSponsors(25, 0, baseRequest).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(2);
          expect(result.total).toBe(2);
          expect(result.totals).toBeUndefined();
          done();
        }
      });
    });

    it('should fetch constituent sponsors with statistics in detailed mode', (done) => {
      const request = {
        ...baseRequest,
        showDriveData: ShowDriveDataOption.Yes
      };

      // historicalProjDeferrals is DEFRT value from VALID_PARAMETERS (user-configured)
      // Same value displayed for ALL sponsors
      const deferralRate = 18; // e.g., 18% configured in System Parameters
      const mockResponse = {
        success: true,
        item: {
          data: [
            {
              constituentSponsor: 'Child Sponsor 1',
              sponsorId: 'CHILD001',
              recruiter: 'J.Smith',
              donorBase: 500,
              drives: 10,
              historicalPenetration: 25.5,
              actualDraw: 125,
              historicalProjDeferrals: deferralRate // DEFRT from System Parameters
            }
          ],
          total: 1,
          totals: {
            totalSponsors: 1,
            totalDonorBase: 500,
            totalDrives: 10,
            totalHistoricalPenetration: 25.5,
            totalActualDraw: 125,
            totalHistoricalProjDeferrals: deferralRate // Same DEFRT value
          }
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getConstituentSponsors(25, 0, request).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totals).toBeDefined();
          expect(result.totals?.totalDrives).toBe(10);
          expect(result.totals?.totalHistoricalProjDeferrals).toBe(deferralRate);
          done();
        }
      });
    });

    it('should include chapterId and userName in request body', (done) => {
      const mockResponse = { success: true, item: { data: [], total: 0 } };
      apiService.post.and.returnValue(of(mockResponse));

      service.getConstituentSponsors(25, 0, baseRequest).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          const requestBody = callArgs[1];
          expect(requestBody.chapterId).toBe(mockChapterId);
          expect(requestBody.loggedInUserName).toBe(mockUserName);
          done();
        }
      });
    });

    it('should handle 404 with success=true (no data found)', (done) => {
      const error = { status: 404, error: { success: true } };
      apiService.post.and.returnValue(throwError(() => error));

      service.getConstituentSponsors(25, 0, baseRequest).subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          expect(result.total).toBe(0);
          expect(result.totals).toBeUndefined();
          done();
        }
      });
    });

    it('should handle server errors', (done) => {
      const error = { status: 500, message: 'Server error' };
      apiService.post.and.returnValue(throwError(() => error));

      service.getConstituentSponsors(25, 0, baseRequest).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          done();
        }
      });
    });

    it('should pass pagination parameters correctly', (done) => {
      const mockResponse = { success: true, item: { data: [], total: 0 } };
      apiService.post.and.returnValue(of(mockResponse));

      const take = 50;
      const skip = 100;

      service.getConstituentSponsors(take, skip, baseRequest).subscribe({
        next: () => {
          const callArgs = apiService.post.calls.mostRecent().args;
          const url = callArgs[0];
          expect(url).toContain(`/${take}/${skip}`);
          done();
        }
      });
    });


  });
});
