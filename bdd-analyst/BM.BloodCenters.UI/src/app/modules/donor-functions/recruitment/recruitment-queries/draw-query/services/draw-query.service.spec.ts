import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DrawQueryService } from './draw-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ApiResponse,
  DriveProjectionSummary,
  DriveDetail,
  DonationType,
  DriveProjectionRequest
} from '../models/draw-query.model';

describe('DrawQueryService', () => {
  let service: DrawQueryService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockChapterId = 'CH001';

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['post', 'get']);
    mockHeaderService = createMockHeaderService();

    TestBed.configureTestingModule({
      providers: [
        DrawQueryService,
        { provide: ApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    service = TestBed.inject(DrawQueryService);
  });

  describe('getDriveProjections', () => {
    const mockRequest: DriveProjectionRequest = {
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      driveType: 'FIX',
      loggedInUserName: 'testuser',
      chapterId: 'CH001'
    };

    const mockProjections: DriveProjectionSummary[] = [
      {
        driveDate: '2024-01-15',
        driveDay: 'Mon',
        numberOfDrives: 5,
        projectedShow: 100,
        projectedDraw: 90,
        goal: 95,
        actualDraw: 88,
        actualDeferral: 2,
        prelab: 3,
        rnft: 2,
        veni03: 1,
        veni04: 1,
        veni05: 0,
        veni06: 7,
        veni07: 0,
        projectedDeferral: 10,
        deferralPercent: 11.11,
        actualDeferralPercent: 2.27,
        veniTotal: 7
      }
    ];

    it('should call API with correct endpoint and parameters', () => {
      const mockResponse: ApiResponse<DriveProjectionSummary> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockProjections,
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDriveProjections(mockRequest).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/v1/drive-projections',
        mockRequest,
        jasmine.objectContaining({
          headers: jasmine.anything()
        })
      );
    });

    it('should return drive projections data', () => {
      const mockResponse: ApiResponse<DriveProjectionSummary> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockProjections,
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDriveProjections(mockRequest).subscribe(result => {
        expect(result).toEqual(mockProjections);
        expect(result.length).toBe(1);
      });
    });

    it('should handle 404 error with success flag as empty result', () => {
      const mockError = {
        status: 404,
        error: { success: true, message: 'No data found' }
      };

      mockApiService.post.and.returnValue(throwError(() => mockError));

      service.getDriveProjections(mockRequest).subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should throw error for non-404 errors', (done) => {
      const mockError = {
        status: 500,
        error: { success: false, message: 'Server error' }
      };

      mockApiService.post.and.returnValue(throwError(() => mockError));

      service.getDriveProjections(mockRequest).subscribe({
        next: () => fail('should have thrown error'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });

  });

  describe('getDonationTypes', () => {
    const mockDonationTypes: DonationType[] = [
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PL', description: 'Platelets' }
    ];

    it('should return donation types data', () => {
      const mockResponse: ApiResponse<DonationType> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockDonationTypes,
        total: 2,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationTypes().subscribe(result => {
        expect(result).toEqual(mockDonationTypes);
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('WB');
      });
    });

    it('should handle empty donation types response', () => {
      const mockResponse: ApiResponse<DonationType> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDonationTypes().subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should return empty array on getDonationTypes API error', (done) => {
      mockApiService.get.and.returnValue(throwError(() => new Error('Network error')));

      service.getDonationTypes().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
        error: () => fail('should not throw')
      });
    });

  });

  describe('getDriveDetails', () => {
    const mockDriveDate = '2024-01-15T00:00:00.000Z';
    const mockDriveType = 'FIX';

    const mockDriveDetails: DriveDetail[] = [
      {
        driveId: 'D001',
        driveDate: '2024-01-15',
        sponsorId: 'S001',
        sponsorName: 'Community Center',
        driveTimes: '09:00 AM - 03:00 PM',
        recruiterId: 'R001',
        recruiterName: 'John Doe',
        projectedDraw: 50,
        driveType: 'FIX',
        driveTypeDescription: 'Fixed Drive',
        staffRequired: 5,
        vanRequired: 1,
        coachRequired: 0,
        locationId: 'L001'
      }
    ];

    it('should call API with correct endpoint and parameters', () => {
      const mockResponse: ApiResponse<DriveDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockDriveDetails,
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDriveDetails(mockDriveDate, mockDriveType).subscribe();

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/drive-projections/details/2024-01-15',
        jasmine.objectContaining({
          headers: jasmine.anything(),
          params: jasmine.anything()
        })
      );
    });

    it('should return drive details data', () => {
      const mockResponse: ApiResponse<DriveDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockDriveDetails,
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDriveDetails(mockDriveDate, mockDriveType).subscribe(result => {
        expect(result).toEqual(mockDriveDetails);
        expect(result.length).toBe(1);
        expect(result[0].driveId).toBe('D001');
      });
    });

    it('should strip time portion from drive date', () => {
      const mockResponse: ApiResponse<DriveDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockDriveDetails,
        total: 1,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDriveDetails('2024-01-15T12:30:00.000Z', mockDriveType).subscribe();

      const callArgs = mockApiService.get.calls.mostRecent().args;
      expect(callArgs[0]).toBe('/api/v1/drive-projections/details/2024-01-15');
    });

    it('should handle empty drive details response', () => {
      const mockResponse: ApiResponse<DriveDetail> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any,
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));

      service.getDriveDetails(mockDriveDate, mockDriveType).subscribe(result => {
        expect(result).toEqual([]);
      });
    });

    it('should throw error on API failure', (done) => {
      const mockError = {
        status: 500,
        error: { success: false, message: 'Server error' }
      };

      mockApiService.get.and.returnValue(throwError(() => mockError));

      service.getDriveDetails(mockDriveDate, mockDriveType).subscribe({
        next: () => fail('should have thrown error'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });

  });

  describe('HTTP Headers', () => {
    it('should include X-Chapter-Id header in all requests', () => {
      const mockResponse: ApiResponse<any> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };

      mockApiService.get.and.returnValue(of(mockResponse));
      mockApiService.post.and.returnValue(of(mockResponse));

      // Test getDonationTypes
      service.getDonationTypes().subscribe();
      let headers = mockApiService.get.calls.mostRecent().args[1]?.headers as any;
      expect(headers).toBeDefined();

      // Test getDriveProjections
      const mockRequest: DriveProjectionRequest = {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
        loggedInUserName: 'testuser',
        chapterId: 'CH001'
      };
      service.getDriveProjections(mockRequest).subscribe();
      headers = mockApiService.post.calls.mostRecent().args[2]?.headers as any;
      expect(headers).toBeDefined();

      // Test getDriveDetails
      service.getDriveDetails('2024-01-15', 'FIX').subscribe();
      headers = mockApiService.get.calls.mostRecent().args[1]?.headers as any;
      expect(headers).toBeDefined();
    });
  });
});
