import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CancelDriveService } from './cancel-drive.service';
import { ApiService } from '@shared/services/api.service';
import {
  DriveForCancellationDto,
  DriveCancellationDetailsDto,
  CancelReasonCodeDto,
  DriveLookupDto,
  CancelDriveResultDto,
  CancelDriveApiResponse,
  SearchDrivesQueryDto,
  CancelDriveRequestDto,
} from '../models/cancel-drive.model';

const mockSearchResponse: CancelDriveApiResponse<DriveForCancellationDto[]> = {
  success: true,
  message: 'Drives retrieved successfully.',
  statusCode: 200,
  data: [
    {
      driveId: 'DRV001',
      driveDate: '2026-06-15T00:00:00Z',
      sponsorName: 'Red Cross',
      locationName: 'City Hall',
      status: 'CNFRM',
      programId: 'MCIFIXDR',
    },
  ],
  total: 1,
};

const mockDetailsResponse: CancelDriveApiResponse<DriveCancellationDetailsDto> = {
  success: true,
  message: 'Drive details retrieved successfully.',
  statusCode: 200,
  data: {
    driveId: 'DRV001',
    driveDate: '2026-06-15T00:00:00Z',
    status: 'CNFRM',
    locationId: 'LOC01',
    locationName: 'City Hall',
    recruiterId: 'REC01',
    recruiterName: 'Jane Smith',
    driveType: 'FIX',
    driveTypeDesc: 'Fixed Drive',
    driveCategory: 'COM',
    driveCategoryDesc: 'Community',
    openDriveInd: 'N',
    scheduleStartTime: '2026-06-15T08:00:00',
    scheduleEndTime: '2026-06-15T16:00:00',
    scheduleStupBkdownTime: '30',
    sponsors: [{ sponsorId: 'SP001', sponsorName: 'Red Cross', projectedShow: 50, projectedDraw: 45 }],
    totalProjectedShow: 50,
    totalProjectedDraw: 45,
    canBeCancelled: true,
    hasPiggybackGroups: false,
  },
};

const mockCancelReasonCodes: CancelDriveApiResponse<CancelReasonCodeDto[]> = {
  success: true,
  message: 'Cancel reason codes retrieved successfully.',
  statusCode: 200,
  data: [
    { code: 'WTH', description: 'Weather' },
    { code: 'LOW', description: 'Low Appointment Count' },
    { code: 'OTH', description: 'Other' },
  ],
};

const mockDrivesLookup: CancelDriveApiResponse<DriveLookupDto[]> = {
  success: true,
  message: 'Drives retrieved successfully.',
  statusCode: 200,
  data: [{ driveId: 'DRV001', driveDate: '2026-06-15T00:00:00Z', sponsorName: 'Red Cross' }],
};

const mockCancelResult: CancelDriveApiResponse<CancelDriveResultDto> = {
  success: true,
  message: 'Drive cancelled successfully.',
  statusCode: 200,
  data: {
    driveId: 'DRV001',
    cancelUser: 'jdoe',
    cancelDate: '2026-05-25T10:30:00Z',
    status: 'CANCL',
    staffScheduleDetailsDeleted: 3,
    driveVehiclesDeleted: 1,
    alertCreated: true,
  },
};

describe('CancelDriveService', () => {
  let service: CancelDriveService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CancelDriveService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(CancelDriveService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDrives', () => {
    it('should return drives data and total on success', (done) => {
      apiService.post.and.returnValue(of(mockSearchResponse));
      const query: SearchDrivesQueryDto = { take: 25, skip: 0, sponsorName: 'Red Cross' };

      service.searchDrives(query).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.data[0].driveId).toBe('DRV001');
        expect(result.total).toBe(1);
        done();
      });
    });

    it('should pass query body to API', () => {
      apiService.post.and.returnValue(of(mockSearchResponse));
      const query: SearchDrivesQueryDto = { take: 10, skip: 0, driveId: 'DRV001' };

      service.searchDrives(query).subscribe();

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringMatching('/cancel-drives/search'),
        query
      );
    });


  });

  describe('getDriveDetails', () => {
    it('should return drive details on success', (done) => {
      apiService.get.and.returnValue(of(mockDetailsResponse));

      service.getDriveDetails('DRV001').subscribe(details => {
        expect(details.driveId).toBe('DRV001');
        expect(details.canBeCancelled).toBeTrue();
        expect(details.hasPiggybackGroups).toBeFalse();
        expect(details.sponsors.length).toBe(1);
        done();
      });
    });

    it('should reject with error when driveId is empty', (done) => {
      service.getDriveDetails('').subscribe({
        error: err => {
          expect(err.message).toBe('Drive ID is required');
          done();
        },
      });
    });

    it('should call API with encoded driveId', () => {
      apiService.get.and.returnValue(of(mockDetailsResponse));

      service.getDriveDetails('DRV 001').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringMatching('DRV%20001')
      );
    });

    it('should propagate 404 errors', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 404 })));

      service.getDriveDetails('NOTFOUND').subscribe({
        error: err => {
          expect(err.status).toBe(404);
          done();
        },
      });
    });
  });

  describe('getCancelReasonCodes', () => {
    it('should return array of reason codes', (done) => {
      apiService.get.and.returnValue(of(mockCancelReasonCodes));

      service.getCancelReasonCodes().subscribe(codes => {
        expect(codes.length).toBe(3);
        expect(codes[0].code).toBe('WTH');
        expect(codes[0].description).toBe('Weather');
        done();
      });
    });


    it('should call the correct endpoint', () => {
      apiService.get.and.returnValue(of(mockCancelReasonCodes));

      service.getCancelReasonCodes().subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringMatching('/cancel-drives/cancel-reason-codes')
      );
    });
  });

  describe('getDrivesLookup', () => {

    it('should append driveId query param when provided', () => {
      apiService.get.and.returnValue(of(mockDrivesLookup));

      service.getDrivesLookup('DRV001').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringMatching('driveId=DRV001')
      );
    });

    it('should append driveDate query param when provided', () => {
      apiService.get.and.returnValue(of(mockDrivesLookup));

      service.getDrivesLookup(undefined, '2026-06-15').subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringMatching('driveDate=2026-06-15')
      );
    });

    it('should call base endpoint without query string when no params', () => {
      apiService.get.and.returnValue(of(mockDrivesLookup));

      service.getDrivesLookup().subscribe();

      expect(apiService.get).toHaveBeenCalledWith(
        jasmine.stringMatching('/drives-lookup$')
      );
    });
  });

  describe('cancelDrive', () => {
    const request: CancelDriveRequestDto = {
      cancelReasonCode: 'WTH',
      cancelReason: 'Severe weather forecast',
      confirmCancellation: true,
    };

    it('should return cancellation result on success', (done) => {
      apiService.post.and.returnValue(of(mockCancelResult));

      service.cancelDrive('DRV001', request).subscribe(result => {
        expect(result.driveId).toBe('DRV001');
        expect(result.status).toBe('CANCL');
        expect(result.alertCreated).toBeTrue();
        expect(result.staffScheduleDetailsDeleted).toBe(3);
        done();
      });
    });

    it('should reject with error when driveId is empty', (done) => {
      service.cancelDrive('', request).subscribe({
        error: err => {
          expect(err.message).toBe('Drive ID is required');
          done();
        },
      });
    });

    it('should call the correct cancel endpoint with driveId', () => {
      apiService.post.and.returnValue(of(mockCancelResult));

      service.cancelDrive('DRV001', request).subscribe();

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringMatching('DRV001/cancel'),
        request
      );
    });


    it('should trim whitespace from driveId before calling API', () => {
      apiService.post.and.returnValue(of(mockCancelResult));

      service.cancelDrive('  DRV001  ', request).subscribe();

      expect(apiService.post).toHaveBeenCalledWith(
        jasmine.stringMatching('DRV001/cancel'),
        request
      );
    });
  });
});
