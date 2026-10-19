import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SetDriveDateIdService } from './set-drive-date-id.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  UserDriveAccessDto,
  DriveListItemDto,
  DriveDetailDto,
  SetDriveContextDto,
  ApiResponse
} from '../models/set-drive-date-id.model';

describe('SetDriveDateIdService', () => {
  let service: SetDriveDateIdService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  const mockUserAccessResponse: ApiResponse<UserDriveAccessDto> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: {
      hasDriveBkAccess: true,
      chapterLocalDate: '2026-05-03',
      minDate: '2026-01-01',
      maxDate: '2026-12-31'
    }
  };

  const mockDrivesResponse: ApiResponse<DriveListItemDto[]> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        driveId: 'DRV0172876',
        driveDate: new Date('2026-05-03'),
        sponsorName: 'BROOKE ARMY MEDICAL CENTER'
      },
      {
        driveId: 'DRV0172877',
        driveDate: new Date('2026-05-03'),
        sponsorName: 'ARMY RESERVE CENTER'
      }
    ]
  };

  const mockDriveDetailResponse: ApiResponse<DriveDetailDto> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: {
      driveId: 'DRV0172876',
      driveDate: new Date('2026-05-03'),
      sponsorName: 'BROOKE ARMY MEDICAL CENTER',
      status: 'CNFRM',
      chapterId: 'CH001'
    }
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        SetDriveDateIdService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(SetDriveDateIdService);
  });

  describe('getUserDriveAccess', () => {

    it('should return user access data', (done) => {
      mockApiService.get.and.returnValue(of(mockUserAccessResponse));

      service.getUserDriveAccess().subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data).toBeDefined();
          expect(response.data?.hasDriveBkAccess).toBeTrue();
          expect(response.data?.chapterLocalDate).toBe('2026-05-03');
          expect(response.data?.minDate).toBe('2026-01-01');
          expect(response.data?.maxDate).toBe('2026-12-31');
          done();
        },
        error: done.fail
      });
    });

    it('should handle error from API', (done) => {
      const errorResponse = { error: 'Access denied', status: 403 };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getUserDriveAccess().subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should log error on failure', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Server error' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getUserDriveAccess().subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith('getUserDriveAccess failed:', errorResponse);
          done();
        }
      });
    });
  });

  describe('getDrivesForDate', () => {
    it('should call API with correct endpoint and date parameter', (done) => {
      const driveDate = '2026-05-03';
      mockApiService.get.and.returnValue(of(mockDrivesResponse));

      service.getDrivesForDate(driveDate).subscribe({
        next: (response) => {
          expect(mockApiService.get).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.DRIVES,
            jasmine.objectContaining({
              params: jasmine.any(Object)
            })
          );

          // Verify the params contain the driveDate
          const callArgs = mockApiService.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params?.get('driveDate')).toBe(driveDate);

          expect(response).toEqual(mockDrivesResponse);
          done();
        },
        error: done.fail
      });
    });

    it('should return list of drives', (done) => {
      const driveDate = '2026-05-03';
      mockApiService.get.and.returnValue(of(mockDrivesResponse));

      service.getDrivesForDate(driveDate).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data).toBeDefined();
          expect(response.data?.length).toBe(2);
          expect(response.data?.[0].driveId).toBe('DRV0172876');
          expect(response.data?.[0].sponsorName).toBe('BROOKE ARMY MEDICAL CENTER');
          done();
        },
        error: done.fail
      });
    });


    it('should handle error from API', (done) => {
      const errorResponse = { error: { message: 'No drives available' } };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getDrivesForDate('2026-05-03').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should log error on failure', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Database error' };
      mockApiService.get.and.returnValue(throwError(() => errorResponse));

      service.getDrivesForDate('2026-05-03').subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith('getDrivesForDate failed:', errorResponse);
          done();
        }
      });
    });

    it('should handle different date formats', (done) => {
      mockApiService.get.and.returnValue(of(mockDrivesResponse));

      service.getDrivesForDate('2026-12-31').subscribe({
        next: () => {
          const callArgs = mockApiService.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params?.get('driveDate')).toBe('2026-12-31');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('validateDriveContext', () => {
    const dto: SetDriveContextDto = {
      driveDate: '2026-05-03',
      driveId: 'DRV0172876'
    };

    it('should call API with correct endpoint and data', (done) => {
      mockApiService.post.and.returnValue(of(mockDriveDetailResponse));

      service.validateDriveContext(dto).subscribe({
        next: (response) => {
          expect(mockApiService.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.VALIDATE,
            dto
          );
          expect(response).toEqual(mockDriveDetailResponse);
          done();
        },
        error: done.fail
      });
    });

    it('should return drive detail data on success', (done) => {
      mockApiService.post.and.returnValue(of(mockDriveDetailResponse));

      service.validateDriveContext(dto).subscribe({
        next: (response) => {
          expect(response.success).toBeTrue();
          expect(response.data).toBeDefined();
          expect(response.data?.driveId).toBe('DRV0172876');
          expect(response.data?.sponsorName).toBe('BROOKE ARMY MEDICAL CENTER');
          expect(response.data?.status).toBe('CNFRM');
          expect(response.data?.chapterId).toBe('CH001');
          done();
        },
        error: done.fail
      });
    });


    it('should handle generic error from backend', (done) => {
      const errorResponse = { error: { message: 'Server error' } };
      mockApiService.post.and.returnValue(throwError(() => errorResponse));

      service.validateDriveContext(dto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should log error on failure', (done) => {
      spyOn(console, 'error');
      const errorResponse = { error: 'Validation failed' };
      mockApiService.post.and.returnValue(throwError(() => errorResponse));

      service.validateDriveContext(dto).subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith('validateDriveContext failed:', errorResponse);
          done();
        }
      });
    });

    it('should validate with different drive IDs', (done) => {
      const differentDto: SetDriveContextDto = {
        driveDate: '2026-06-15',
        driveId: 'DRV0199999'
      };
      mockApiService.post.and.returnValue(of(mockDriveDetailResponse));

      service.validateDriveContext(differentDto).subscribe({
        next: () => {
          expect(mockApiService.post).toHaveBeenCalledWith(
            API.DONOR_FUNCTIONS.SET_DRIVE_DATE_AND_ID.VALIDATE,
            differentDto
          );
          done();
        },
        error: done.fail
      });
    });

    it('should handle network timeout error', (done) => {
      const timeoutError = { error: 'Request timeout', status: 408 };
      mockApiService.post.and.returnValue(throwError(() => timeoutError));

      service.validateDriveContext(dto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(408);
          done();
        }
      });
    });
  });

  describe('Service Integration', () => {
    it('should handle multiple sequential calls', (done) => {
      mockApiService.get.and.returnValue(of(mockUserAccessResponse));
      mockApiService.post.and.returnValue(of(mockDriveDetailResponse));

      // First call: getUserDriveAccess
      service.getUserDriveAccess().subscribe({
        next: () => {
          // Second call: getDrivesForDate
          mockApiService.get.and.returnValue(of(mockDrivesResponse));
          service.getDrivesForDate('2026-05-03').subscribe({
            next: () => {
              // Third call: validateDriveContext
              service.validateDriveContext({
                driveDate: '2026-05-03',
                driveId: 'DRV0172876'
              }).subscribe({
                next: () => {
                  expect(mockApiService.get).toHaveBeenCalledTimes(2);
                  expect(mockApiService.post).toHaveBeenCalledTimes(1);
                  done();
                },
                error: done.fail
              });
            },
            error: done.fail
          });
        },
        error: done.fail
      });
    });
  });
});
