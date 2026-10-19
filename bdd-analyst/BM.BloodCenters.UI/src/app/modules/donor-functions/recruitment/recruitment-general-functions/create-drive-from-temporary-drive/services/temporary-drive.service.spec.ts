import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TemporaryDriveService } from './temporary-drive.service';
import { ApiService } from '@shared/services/api.service';
import { CreateDriveRequest, CalculateStaffRequest, CreateNoteRequest } from '../models/temporary-drive.model';
import { TemporaryDriveFilterValue } from '../models/temporary-drive-filter.model';

describe('TemporaryDriveService', () => {
  let service: TemporaryDriveService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        TemporaryDriveService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });
    service = TestBed.inject(TemporaryDriveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────────────────
  // getTemporaryDrives
  // ─────────────────────────────────────────────────────────
  describe('getTemporaryDrives', () => {
    it('should return mapped data and totalRecords on success', (done) => {
      // Arrange
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: [
          {
            tempdrId: 'TD001',
            driveDate: '2026-07-20',
            sponsorId: 'SP01',
            sponsorName: 'Red Cross',
            projectedShow: 100,
            projectedDraw: 80,
            driveType: 'Mobile',
            driveCategory: 'Community',
            contactPerson: 'John Doe',
            recruiter: 'Jane Smith',
            location: 'City Hall',
            scheduleStartTime: '08:00',
            scheduleEndTime: '16:00',
            staffReqd: 5,
            vanReqd: 2,
            coachReqd: 1,
            bedReqd: 10,
            suggestedDriveId: 'DRV-001'
          }
        ],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0].temporaryDriveId).toBe('TD001');
        expect(result.data[0].sponsorName).toBe('Red Cross');
        expect(result.data[0].projectedShow).toBe(100);
        expect(result.data[0].projectedDraw).toBe(80);
        expect(result.data[0].type).toBe('Mobile');
        expect(result.data[0].category).toBe('Community');
        expect(result.data[0].time).toBe('08:00–16:00');
        expect(result.data[0].staffReqd).toBe(5);
        expect(result.data[0].vanReqd).toBe(2);
        expect(result.data[0].coachReqd).toBe(1);
        expect(result.data[0].bedReqd).toBe(10);
        expect(result.data[0].suggestedDriveId).toBe('DRV-001');
        expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should pass chapterId as query param', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.getTemporaryDrives(10, 0, 'CH99').subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/temp/10/0');
        const params = callArgs[1].params;
        expect(params.get('chapterId')).toBe('CH99');
        done();
      });
    });

    it('should include all filter params when filters are provided', (done) => {
      // Arrange
      const driveDate = new Date('2026-08-01');
      const filters: TemporaryDriveFilterValue = {
        driveDate,
        sponsorId: 'SP05',
        driveType: 'Fixed',
        driveCategory: 'Corporate'
      };
      apiServiceSpy.get.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01', filters).subscribe(() => {
        // Assert
        const params = apiServiceSpy.get.calls.mostRecent().args[1].params;
        expect(params.get('chapterId')).toBe('CH01');
        expect(params.get('driveDate')).toBe(driveDate.toISOString());
        expect(params.get('sponsorId')).toBe('SP05');
        expect(params.get('driveType')).toBe('Fixed');
        expect(params.get('driveCategory')).toBe('Corporate');
        done();
      });
    });

    it('should not include filter params when filters are null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01', null).subscribe(() => {
        // Assert
        const params = apiServiceSpy.get.calls.mostRecent().args[1].params;
        expect(params.get('chapterId')).toBe('CH01');
        expect(params.has('driveDate')).toBeFalse();
        expect(params.has('sponsorId')).toBeFalse();
        expect(params.has('driveType')).toBeFalse();
        expect(params.has('driveCategory')).toBeFalse();
        done();
      });
    });

    it('should not include filter params for empty filter values', (done) => {
      // Arrange
      const filters: TemporaryDriveFilterValue = {
        driveDate: null,
        sponsorId: null,
        driveType: null,
        driveCategory: null
      };
      apiServiceSpy.get.and.returnValue(of({ data: [], total: 0 }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01', filters).subscribe(() => {
        // Assert
        const params = apiServiceSpy.get.calls.mostRecent().args[1].params;
        expect(params.has('driveDate')).toBeFalse();
        expect(params.has('sponsorId')).toBeFalse();
        expect(params.has('driveType')).toBeFalse();
        expect(params.has('driveCategory')).toBeFalse();
        done();
      });
    });

    it('should return empty data array when response.data is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: null, total: 0 }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should return empty data array when response.data is not an array', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: 'invalid', total: 5 }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data).toEqual([]);
        expect(result.totalRecords).toBe(5);
        done();
      });
    });

    it('should default totalRecords to 0 when response.total is missing', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.totalRecords).toBe(0);
        done();
      });
    });

    it('should map backend PascalCase fields correctly', (done) => {
      // Arrange
      const mockResponse = {
        data: [{
          TEMPDR_ID: 'TD-PASCAL',
          DRIVE_DATE: '2026-09-01',
          DRIVE_TYPE: 'Fixed',
          DRIVE_CATEGORY: 'School',
          RECRUITER: 'Bob',
          LOCATION: 'School Gym',
          SCHEDULE_START_TIME: '09:00',
          SCHEDULE_END_TIME: '14:00',
          STAFF_REQD: 3,
          VAN_REQD: 1,
          COACH_REQD: 0,
          BED_REQD: 6,
          SuggestedDriveId: 'DRV-PASCAL'
        }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data[0].temporaryDriveId).toBe('TD-PASCAL');
        expect(result.data[0].driveDate).toBe('2026-09-01');
        expect(result.data[0].type).toBe('Fixed');
        expect(result.data[0].category).toBe('School');
        expect(result.data[0].recruiter).toBe('Bob');
        expect(result.data[0].location).toBe('School Gym');
        expect(result.data[0].time).toBe('09:00–14:00');
        expect(result.data[0].staffReqd).toBe(3);
        expect(result.data[0].suggestedDriveId).toBe('DRV-PASCAL');
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server Error' })));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // getTemporaryDriveById
  // ─────────────────────────────────────────────────────────
  describe('getTemporaryDriveById', () => {
    it('should return mapped TemporaryDrive when response exists', (done) => {
      // Arrange
      const mockResponse = {
        tempdrId: 'TD-100',
        driveDate: '2026-07-25',
        sponsorId: 'SP10',
        sponsorName: 'Hospital Corp',
        projectedShow: 50,
        projectedDraw: 40,
        driveType: 'Fixed',
        driveCategory: 'Medical',
        contactPerson: 'Alice',
        recruiter: 'Bob',
        location: 'Main Hospital',
        scheduleStartTime: '10:00',
        scheduleEndTime: '15:00',
        staffReqd: 4,
        vanReqd: 0,
        coachReqd: 0,
        bedReqd: 8,
        suggestedDriveId: 'DRV-100'
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDriveById('TD-100').subscribe(result => {
        // Assert
        expect(result).not.toBeNull();
        expect(result!.temporaryDriveId).toBe('TD-100');
        expect(result!.sponsorName).toBe('Hospital Corp');
        expect(result!.type).toBe('Fixed');
        expect(result!.time).toBe('10:00–15:00');
        expect(result!.staffReqd).toBe(4);
        expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/donor-recruitment/drives/temp/TD-100');
        done();
      });
    });

    it('should return null when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getTemporaryDriveById('TD-MISSING').subscribe(result => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(undefined));

      // Act
      service.getTemporaryDriveById('TD-UNDEF').subscribe(result => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 404, message: 'Not Found' })));

      // Act
      service.getTemporaryDriveById('TD-INVALID').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // createDriveFromTemporary
  // ─────────────────────────────────────────────────────────
  describe('createDriveFromTemporary', () => {
    const buildRequest = (overrides?: Partial<CreateDriveRequest>): CreateDriveRequest => ({
      temporaryDriveId: 'TD-200',
      chapterId: 'CH01',
      driveDetails: {
        driveId: 'DRV-200',
        driveDate: new Date('2026-08-01'),
        driveType: 'Mobile',
        category: 'Community',
        openDrive: 'Y',
        recruiterId: 'REC01',
        recruiterName: 'Jane',
        contactName: 'John'
      },
      sponsorProjection: {
        sponsorId: 'SP01',
        sponsorName: 'Red Cross',
        locationId: 'LOC01',
        locationName: 'City Hall',
        projectedDraw: 80,
        projectedShow: 100,
        deferralPercent: 5,
        territoryId: 'T01',
        territory: 'North'
      },
      dateTime: {
        startDate: new Date('2026-08-01'),
        startTime: '08:00',
        endDate: new Date('2026-08-01'),
        endTime: '16:00',
        setupBreakdown: 30,
        travelTime: 60
      },
      resources: [{ resource: 'Staff', number: 5 }],
      staffSchedule: [{ name: 'Jane', selected: true }],
      notes: ['Note 1', 'Note 2'],
      ...overrides
    });

    it('should send POST with correct payload and return mapped response', (done) => {
      // Arrange
      const request = buildRequest();
      const mockResponse = {
        driveId: 'DRV-200',
        message: 'Drive confirmed successfully',
        resources: [{ resourceCode: 'STF', numberReqd: 5 }]
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createDriveFromTemporary(request).subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Drive confirmed successfully');
        expect(result.driveId).toBe('DRV-200');
        expect(result.resources!.length).toBe(1);
        done();
      });
    });

    it('should build payload with correct fields', (done) => {
      // Arrange
      const request = buildRequest();
      apiServiceSpy.post.and.returnValue(of({ driveId: 'DRV-200', message: 'OK' }));

      // Act
      service.createDriveFromTemporary(request).subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.post.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/temp/TD-200/confirm');
        const body = callArgs[1];
        expect(body.driveId).toBe('DRV-200');
        expect(body.status).toBe('CNFRM');
        expect(body.locationId).toBe('LOC01');
        expect(body.recruiterId).toBe('REC01');
        expect(body.driveCategory).toBe('Community');
        expect(body.driveType).toBe('Mobile');
        expect(body.notes).toEqual(['Note 1', 'Note 2']);
        const params = callArgs[2].params;
        expect(params.get('chapterId')).toBe('CH01');
        done();
      });
    });

    it('should set notes to null when notes array is empty', (done) => {
      // Arrange
      const request = buildRequest({ notes: [] });
      apiServiceSpy.post.and.returnValue(of({ driveId: 'DRV-200', message: 'OK' }));

      // Act
      service.createDriveFromTemporary(request).subscribe(() => {
        // Assert
        const body = apiServiceSpy.post.calls.mostRecent().args[1];
        expect(body.notes).toBeNull();
        done();
      });
    });

    it('should use empty string for temporaryDriveId when not provided', (done) => {
      // Arrange
      const request = buildRequest({ temporaryDriveId: undefined });
      apiServiceSpy.post.and.returnValue(of({ driveId: 'DRV-200', message: 'OK' }));

      // Act
      service.createDriveFromTemporary(request).subscribe(() => {
        // Assert
        const url = apiServiceSpy.post.calls.mostRecent().args[0];
        expect(url).toBe('/api/v1/donor-recruitment/drives/temp//confirm');
        done();
      });
    });

    it('should default message when response has no message', (done) => {
      // Arrange
      const request = buildRequest();
      apiServiceSpy.post.and.returnValue(of({ driveId: 'DRV-200' }));

      // Act
      service.createDriveFromTemporary(request).subscribe(result => {
        // Assert
        expect(result.message).toBe('Drive created successfully');
        done();
      });
    });

    it('should default resources to empty array when not in response', (done) => {
      // Arrange
      const request = buildRequest();
      apiServiceSpy.post.and.returnValue(of({ driveId: 'DRV-200', message: 'OK' }));

      // Act
      service.createDriveFromTemporary(request).subscribe(result => {
        // Assert
        expect(result.resources).toEqual([]);
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      const request = buildRequest();
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 409, message: 'Conflict' })));

      // Act
      service.createDriveFromTemporary(request).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(409);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // removeDrive
  // ─────────────────────────────────────────────────────────
  describe('removeDrive', () => {
    it('should send DELETE with correct URL and chapterId param', (done) => {
      // Arrange
      const mockResponse = { message: 'Drive deleted' };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      // Act
      service.removeDrive('TD-300', 'CH02').subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Drive deleted');
        const callArgs = apiServiceSpy.delete.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/temp/TD-300');
        expect(callArgs[1].params.get('chapterId')).toBe('CH02');
        done();
      });
    });

    it('should use default message when response has no message', (done) => {
      // Arrange
      apiServiceSpy.delete.and.returnValue(of({}));

      // Act
      service.removeDrive('TD-301', 'CH01').subscribe(result => {
        // Assert
        expect(result.success).toBeTrue();
        expect(result.message).toBe('Temporary drive removed successfully');
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.delete.and.returnValue(throwError(() => ({ status: 404, message: 'Not Found' })));

      // Act
      service.removeDrive('TD-INVALID', 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // getSuitableDates
  // ─────────────────────────────────────────────────────────
  describe('getSuitableDates', () => {
    it('should return mapped suitable dates on success', (done) => {
      // Arrange
      const mockResponse = [
        { dateStr: '2026-08-01', dayOfWeek: 'Saturday', status: 'Available', isSuitable: true },
        { dateStr: '2026-08-02', dayOfWeek: 'Sunday', status: 'Busy', isSuitable: false }
      ];
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getSuitableDates('2026-08-01', '2026-08-31', 'CH01').subscribe(result => {
        // Assert
        expect(result.length).toBe(2);
        expect(result[0].date).toBe('2026-08-01');
        expect(result[0].dayOfWeek).toBe('Saturday');
        expect(result[0].status).toBe('Available');
        expect(result[0].isSuitable).toBeTrue();
        expect(result[1].isSuitable).toBeFalsy();
        done();
      });
    });

    it('should pass fromDate, toDate, and chapterId as params', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of([]));

      // Act
      service.getSuitableDates('2026-09-01', '2026-09-30', 'CH05').subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/suitable-dates');
        const params = callArgs[1].params;
        expect(params.get('fromDate')).toBe('2026-09-01');
        expect(params.get('toDate')).toBe('2026-09-30');
        expect(params.get('chapterId')).toBe('CH05');
        done();
      });
    });

    it('should map PascalCase fields from backend', (done) => {
      // Arrange
      const mockResponse = [
        { DateStr: '2026-10-01', DayOfWeek: 'Thursday', Status: 'Open', IsSuitable: true }
      ];
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getSuitableDates('2026-10-01', '2026-10-31', 'CH01').subscribe(result => {
        // Assert
        expect(result[0].date).toBe('2026-10-01');
        expect(result[0].dayOfWeek).toBe('Thursday');
        expect(result[0].status).toBe('Open');
        expect(result[0].isSuitable).toBeTrue();
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getSuitableDates('2026-08-01', '2026-08-31', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server Error' })));

      // Act
      service.getSuitableDates('2026-08-01', '2026-08-31', 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // getPastDrives
  // ─────────────────────────────────────────────────────────
  describe('getPastDrives', () => {
    it('should return mapped past drives on success', (done) => {
      // Arrange
      const mockResponse = {
        message: 'OK',
        data: [
          {
            driveId: 'DRV-PAST-1',
            driveDate: '2026-06-01',
            projectedShow: 80,
            projectedDraw: 65,
            locationName: 'Community Center',
            actualShow: 75,
            actualDraw: 60,
            deferralPercentage: 8
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result.length).toBe(1);
        expect(result[0].driveId).toBe('DRV-PAST-1');
        expect(result[0].driveDate).toBe('2026-06-01');
        expect(result[0].projectedShow).toBe(80);
        expect(result[0].projectedDraw).toBe(65);
        expect(result[0].locationName).toBe('Community Center');
        expect(result[0].actualShow).toBe(75);
        expect(result[0].actualDraw).toBe(60);
        expect(result[0].deferralPercentage).toBe(8);
        done();
      });
    });

    it('should pass sponsorId and chapterId as params', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getPastDrives('SP99', 'CH10').subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/past-drives');
        const params = callArgs[1].params;
        expect(params.get('sponsorId')).toBe('SP99');
        expect(params.get('chapterId')).toBe('CH10');
        done();
      });
    });

    it('should map PascalCase fields from backend', (done) => {
      // Arrange
      const mockResponse = {
        data: [
          {
            DriveId: 'DRV-PC',
            DriveDate: '2026-05-15',
            ProjectedShow: 60,
            ProjectedDraw: 50,
            LocationName: 'School',
            ActualShow: 55,
            ActualDraw: 48,
            DeferralPercentage: 12
          }
        ]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result[0].driveId).toBe('DRV-PC');
        expect(result[0].driveDate).toBe('2026-05-15');
        expect(result[0].projectedShow).toBe(60);
        expect(result[0].projectedDraw).toBe(50);
        expect(result[0].locationName).toBe('School');
        expect(result[0].actualShow).toBe(55);
        expect(result[0].actualDraw).toBe(48);
        expect(result[0].deferralPercentage).toBe(12);
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ message: 'OK', data: null }));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is not an array', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ message: 'OK', data: 'invalid' }));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should default numeric fields to 0 when missing', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ driveId: 'DRV-EMPTY', driveDate: '2026-01-01' }]
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe(result => {
        // Assert
        expect(result[0].projectedShow).toBe(0);
        expect(result[0].projectedDraw).toBe(0);
        expect(result[0].actualShow).toBe(0);
        expect(result[0].actualDraw).toBe(0);
        expect(result[0].deferralPercentage).toBe(0);
        expect(result[0].locationName).toBe('');
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 503, message: 'Service Unavailable' })));

      // Act
      service.getPastDrives('SP01', 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(503);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // calculateStaff
  // ─────────────────────────────────────────────────────────
  describe('calculateStaff', () => {
    const mockRequest: CalculateStaffRequest = {
      projectedShow: 100,
      driveDate: '2026-08-15',
      scheduleStartTime: '08:00',
      scheduleEndDate: '2026-08-15',
      scheduleEndTime: '16:00',
      efficiencyRange: 12
    };

    it('should return response.data when wrapped in data envelope', (done) => {
      // Arrange
      const mockResponseData = {
        staffRequired: 5,
        totalHours: 40,
        efficiencyRange: 12,
        projectedShow: 100
      };
      apiServiceSpy.post.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResponseData
      }));

      // Act
      service.calculateStaff(mockRequest).subscribe(result => {
        // Assert
        expect(result.staffRequired).toBe(5);
        expect(result.totalHours).toBe(40);
        expect(result.efficiencyRange).toBe(12);
        expect(result.projectedShow).toBe(100);
        done();
      });
    });

    it('should send correct request body', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ data: {} }));

      // Act
      service.calculateStaff(mockRequest).subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.post.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/calculate-staff');
        expect(callArgs[1]).toEqual(mockRequest);
        done();
      });
    });

    it('should return raw response when data property is missing', (done) => {
      // Arrange
      const rawResponse = {
        staffRequired: 3,
        totalHours: 24,
        efficiencyRange: 10,
        projectedShow: 50
      };
      apiServiceSpy.post.and.returnValue(of(rawResponse));

      // Act
      service.calculateStaff(mockRequest).subscribe(result => {
        // Assert
        expect(result.staffRequired).toBe(3);
        expect(result.totalHours).toBe(24);
        done();
      });
    });

    it('should return raw response when response is falsy', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of(null));

      // Act
      service.calculateStaff(mockRequest).subscribe(result => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 400, message: 'Bad Request' })));

      // Act
      service.calculateStaff(mockRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(400);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // getDriveEstimatedResources
  // ─────────────────────────────────────────────────────────
  describe('getDriveEstimatedResources', () => {
    it('should return resource array from response.data', (done) => {
      // Arrange
      const mockResources = [
        { resourceCode: 'STF', resourceDesc: 'Staff', numberReqd: 5, sortSeq: 1 },
        { resourceCode: 'VAN', resourceDesc: 'Van', numberReqd: 2, sortSeq: 2 }
      ];
      apiServiceSpy.get.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: mockResources
      }));

      // Act
      service.getDriveEstimatedResources('DRV-500', 'CH01').subscribe(result => {
        // Assert
        expect(result.length).toBe(2);
        expect(result[0].resourceCode).toBe('STF');
        expect(result[0].numberReqd).toBe(5);
        expect(result[1].resourceCode).toBe('VAN');
        done();
      });
    });

    it('should pass driveId in URL and chapterId as param', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getDriveEstimatedResources('DRV-501', 'CH07').subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/DRV-501/resources');
        expect(callArgs[1].params.get('chapterId')).toBe('CH07');
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      // Act
      service.getDriveEstimatedResources('DRV-500', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is not an array', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: 'invalid' }));

      // Act
      service.getDriveEstimatedResources('DRV-500', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getDriveEstimatedResources('DRV-500', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500, message: 'Server Error' })));

      // Act
      service.getDriveEstimatedResources('DRV-500', 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // getDriveNotes
  // ─────────────────────────────────────────────────────────
  describe('getDriveNotes', () => {
    it('should return notes array from response.data', (done) => {
      // Arrange
      const mockNotes = [
        {
          noteId: 'N001',
          noteSequence: 1,
          note: 'First note',
          insertUser: 'admin',
          insertDate: '2026-07-10',
          programId: 'PROG1',
          chapterId: 'CH01'
        },
        {
          noteId: 'N002',
          noteSequence: 2,
          note: 'Second note',
          insertUser: 'user1',
          programId: 'PROG1',
          chapterId: 'CH01'
        }
      ];
      apiServiceSpy.get.and.returnValue(of({ message: 'OK', data: mockNotes }));

      // Act
      service.getDriveNotes('DRV-600', 'CH01').subscribe(result => {
        // Assert
        expect(result.length).toBe(2);
        expect(result[0].noteId).toBe('N001');
        expect(result[0].note).toBe('First note');
        expect(result[1].noteId).toBe('N002');
        done();
      });
    });

    it('should pass driveId in URL and chapterId as param', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      // Act
      service.getDriveNotes('DRV-601', 'CH09').subscribe(() => {
        // Assert
        const callArgs = apiServiceSpy.get.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/DRV-601/notes');
        expect(callArgs[1].params.get('chapterId')).toBe('CH09');
        done();
      });
    });

    it('should return empty array when response.data is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ message: 'OK', data: null }));

      // Act
      service.getDriveNotes('DRV-600', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null));

      // Act
      service.getDriveNotes('DRV-600', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response.data is not an array', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ data: 'not-array' }));

      // Act
      service.getDriveNotes('DRV-600', 'CH01').subscribe(result => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 403, message: 'Forbidden' })));

      // Act
      service.getDriveNotes('DRV-600', 'CH01').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(403);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // createDriveNote
  // ─────────────────────────────────────────────────────────
  describe('createDriveNote', () => {
    it('should send POST with correct URL and request body', (done) => {
      // Arrange
      const noteRequest: CreateNoteRequest = { note: 'Test note content', chapterId: 'CH01' };
      const mockResponse = { message: 'Note created successfully' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createDriveNote('DRV-700', noteRequest).subscribe(result => {
        // Assert
        expect(result.message).toBe('Note created successfully');
        const callArgs = apiServiceSpy.post.calls.mostRecent().args;
        expect(callArgs[0]).toBe('/api/v1/donor-recruitment/drives/DRV-700/notes');
        expect(callArgs[1]).toEqual(noteRequest);
        done();
      });
    });

    it('should return the raw response from the API', (done) => {
      // Arrange
      const noteRequest: CreateNoteRequest = { note: 'Another note', chapterId: 'CH02' };
      const mockResponse = { message: 'Created', noteId: 'N-NEW' };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.createDriveNote('DRV-701', noteRequest).subscribe(result => {
        // Assert
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should propagate API errors', (done) => {
      // Arrange
      const noteRequest: CreateNoteRequest = { note: 'Fail note', chapterId: 'CH01' };
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 422, message: 'Unprocessable Entity' })));

      // Act
      service.createDriveNote('DRV-700', noteRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          // Assert
          expect(error.status).toBe(422);
          done();
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // mapBackendToUI (tested indirectly via getTemporaryDrives)
  // ─────────────────────────────────────────────────────────
  describe('mapBackendToUI (private, tested indirectly)', () => {
    it('should default empty strings and zeros for missing fields', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ tempdrId: 'TD-SPARSE' }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        const drive = result.data[0];
        expect(drive.sponsorId).toBe('');
        expect(drive.sponsorName).toBe('');
        expect(drive.projectedShow).toBe(0);
        expect(drive.projectedDraw).toBe(0);
        expect(drive.type).toBe('Mobile');
        expect(drive.category).toBe('');
        expect(drive.contactPerson).toBe('');
        expect(drive.recruiter).toBe('');
        expect(drive.location).toBe('');
        expect(drive.staffReqd).toBe(0);
        expect(drive.vanReqd).toBe(0);
        expect(drive.coachReqd).toBe(0);
        expect(drive.bedReqd).toBe(0);
        done();
      });
    });
  });

  // ─────────────────────────────────────────────────────────
  // formatTime (private, tested indirectly via mapping)
  // ─────────────────────────────────────────────────────────
  describe('formatTime (private, tested indirectly)', () => {
    it('should return empty string when both start and end are missing', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ tempdrId: 'TD-NOTIME' }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data[0].time).toBe('');
        done();
      });
    });

    it('should use 00:00 default when only startTime is provided', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ tempdrId: 'TD-START', scheduleStartTime: '09:00' }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data[0].time).toBe('09:00–00:00');
        done();
      });
    });

    it('should use 00:00 default when only endTime is provided', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ tempdrId: 'TD-END', scheduleEndTime: '17:00' }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data[0].time).toBe('00:00–17:00');
        done();
      });
    });

    it('should format both start and end times with en-dash separator', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ tempdrId: 'TD-BOTH', scheduleStartTime: '08:30', scheduleEndTime: '15:45' }],
        total: 1
      };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getTemporaryDrives(25, 0, 'CH01').subscribe(result => {
        // Assert
        expect(result.data[0].time).toBe('08:30–15:45');
        done();
      });
    });
  });
});
