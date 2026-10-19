import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DriveDetailsQueryService } from './drive-details-query.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { HttpParams } from '@angular/common/http';
import { API } from '../../../../../../core/constants/api.constants';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import {
  DriveDetailsQueryFilters,
  DriveDetailsQueryResponse,
  DriveNote,
  LocationNote,
  DriveChecklistItem,
  DriveResourcesResponse,
  PickupScheduleItem,
  DriveSuppliesResponse,
  DriveProceduresResponse
} from '../models/drive-details-query.model';

describe('DriveDetailsQueryService', () => {
  let service: DriveDetailsQueryService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;

  const mockChapterId = 'CHAPTER001';
  const mockUserName = 'testuser';
  const mockDriveId = 'DRIVE001';

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    const headerSpy = createMockHeaderService();
    const loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DriveDetailsQueryService,
        { provide: ApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: LoginService, useValue: loginSpy }
      ]
    });

    service = TestBed.inject(DriveDetailsQueryService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginServiceSpy = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;

    loginServiceSpy.getStoredUsername.and.returnValue(mockUserName);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFilters', () => {
    const mockFilters: DriveDetailsQueryFilters = {
      selectOptions: [
        { value: 'A', label: 'All' },
        { value: 'P', label: 'Past' },
        { value: 'F', label: 'Future' }
      ],
      sponsors: [
        { sponsorId: 'SP001', name: 'Sponsor 1' },
        { sponsorId: 'SP002', name: 'Sponsor 2' }
      ],
      drives: [
        { driveId: 'DRV001', driveDate: '2024-01-15' },
        { driveId: 'DRV002', driveDate: '2024-01-16' }
      ]
    };

    it('should fetch filters successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockFilters }));

      service.getFilters().subscribe({
        next: (result) => {
          expect(result).toEqual(mockFilters);
          expect(apiServiceSpy.get).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return empty filters on error', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: null }));

      service.getFilters().subscribe({
        next: (result) => {
          expect(result.selectOptions).toEqual([]);
          expect(result.sponsors).toEqual([]);
          expect(result.drives).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockFilters }));

      service.getFilters().subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.FILTERS);
          done();
        }
      });
    });

    it('should include chapterId in params when present', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockFilters }));

      service.getFilters().subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId in params when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ item: mockFilters }));

      service.getFilters().subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getFilters().subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive details query filters:', mockError);
          done();
        }
      });
    });
  });

  describe('getDriveDetails', () => {
    const mockResponse: DriveDetailsQueryResponse = {
      driveDetails: {
        driveId: mockDriveId,
        sponsorId: 'SP001',
        sponsorName: 'Test Sponsor',
        recruiterId: 'REC001',
        recruiterName: 'John Doe',
        driveCoordinator: null,
        phoneNumber: '555-1234',
        status: 'Active',
        category: 'Mobile',
        type: 'Regular',
        sponsorCategory: null,
        territory: 'North',
        licensedDrive: 'Y',
        location: 'Main Office',
        address: '123 Main St',
        distance: 10.5,
        direction: 'N',
        facility: 'Hospital A',
        lastPeriod: null,
        lastModified: '2024-01-15',
        projectedShow: 100,
        actualShow: 95,
        projectedDraw: 80,
        actualDraw: 75,
        projectedDeferral: 10,
        actualDeferral: 8,
        scheduleStartTime: '08:00',
        actualStartTime: '08:15',
        scheduleEndTime: '16:00',
        actualEndTime: '15:45',
        scheduleSetupBreakdown: 30,
        actualSetupBreakdown: 25,
        projectedTravelTime: '30 min',
        actualTravelTime: '35 min',
        projectedCpu: 25.50,
        actualCpu: 26.00,
        projectedResources: 5,
        actualResources: 5,
        chapterId: mockChapterId,
        driveDate: '2024-01-15',
        locationId: 'LOC001',
        scheduleId: 'SCH001'
      },
      notes: [
        { userId: 'U001', userName: 'User 1', notes: 'Test note', noteSequence: 1, insertDate: '2024-01-15' }
      ]
    };

    it('should fetch drive details successfully', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: (result) => {
          expect(result.driveDetails).toBeTruthy();
          expect(result.driveDetails?.driveId).toBe(mockDriveId);
          expect(result.notes.length).toBe(1);
          done();
        }
      });
    });

    it('should return null driveDetails on 404', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ status: 404 })));

      service.getDriveDetails({ driveId: 'INVALID' }).subscribe({
        next: (result) => {
          expect(result.driveDetails).toBeNull();
          expect(result.notes).toEqual([]);
          done();
        }
      });
    });

    it('should handle non-404 error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.post.and.returnValue(throwError(() => mockError));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive details:', mockError);
          done();
        }
      });
    });

    it('should return null driveDetails and empty notes when response item is null', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: null }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: (result) => {
          expect(result.driveDetails).toBeNull();
          expect(result.notes).toEqual([]);
          done();
        }
      });
    });

    it('should return null driveDetails and empty notes when item fields are missing', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: {} }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: (result) => {
          expect(result.driveDetails).toBeNull();
          expect(result.notes).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint with POST', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.GET_DETAILS);
          done();
        }
      });
    });

    it('should include chapterId and loggedInUserName in request body', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.chapterId).toBeTruthy();
          expect(body.loggedInUserName).toBe(mockUserName);
          done();
        }
      });
    });

    it('should set chapterId to undefined when not available', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.chapterId).toBeUndefined();
          done();
        }
      });
    });

    it('should set loggedInUserName to undefined when not available', (done) => {
      loginServiceSpy.getStoredUsername.and.returnValue('');
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.loggedInUserName).toBeUndefined();
          done();
        }
      });
    });

    it('should serialize driveDate when provided', (done) => {
      const serializedDate = '2024-01-15';
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(serializedDate);
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId, driveDate: '2024-01-15' }).subscribe({
        next: () => {
          expect(DateFieldValidationUtility.serializeDateForApi).toHaveBeenCalled();
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.driveDate).toBe(serializedDate);
          done();
        }
      });
    });

    it('should set driveDate to undefined when not provided', (done) => {
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.driveDate).toBeUndefined();
          done();
        }
      });
    });

    it('should set driveDate to undefined when serializeDateForApi returns null', (done) => {
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null as any);
      apiServiceSpy.post.and.returnValue(of({ item: mockResponse }));

      service.getDriveDetails({ driveId: mockDriveId, driveDate: '2024-01-15' }).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          const body = callArgs[1];
          expect(body.driveDate).toBeUndefined();
          done();
        }
      });
    });
  });

  describe('getLocationNotes', () => {
    const mockNotes: LocationNote[] = [
      { locationId: 'LOC001', locationName: 'Main Office', userId: 'U001', userName: 'User 1', notes: 'Note 1', noteSequence: 1, insertDate: '2024-01-15' },
      { locationId: 'LOC001', locationName: 'Main Office', userId: 'U002', userName: 'User 2', notes: 'Note 2', noteSequence: 2, insertDate: '2024-01-16' }
    ];

    it('should fetch location notes successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockNotes }));

      service.getLocationNotes(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockNotes);
          expect(result.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty array on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getLocationNotes(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockNotes }));

      service.getLocationNotes(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.LOCATION_NOTES);
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockNotes }));

      service.getLocationNotes(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ data: mockNotes }));

      service.getLocationNotes(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getLocationNotes(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching location notes:', mockError);
          done();
        }
      });
    });
  });

  describe('getDriveChecklist', () => {
    const mockChecklist: DriveChecklistItem[] = [
      { action: 'ACTION1', description: 'Description 1', targetDate: '2024-01-15', user: 'User 1', actionDate: '2024-01-14', actionBy: 'Admin' },
      { action: 'ACTION2', description: 'Description 2', targetDate: '2024-01-16', user: 'User 2', actionDate: null, actionBy: null }
    ];

    it('should fetch drive checklist successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockChecklist }));

      service.getDriveChecklist(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockChecklist);
          expect(result.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty array on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getDriveChecklist(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockChecklist }));

      service.getDriveChecklist(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.CHECKLIST);
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockChecklist }));

      service.getDriveChecklist(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ data: mockChecklist }));

      service.getDriveChecklist(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getDriveChecklist(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive checklist:', mockError);
          done();
        }
      });
    });
  });

  describe('getDriveResources', () => {
    const mockResources: DriveResourcesResponse = {
      estimatedResources: [
        { resource: 'RES001', estimate: 5, actual: 4 },
        { resource: 'RES002', estimate: 3, actual: 3 }
      ],
      scheduledStaff: [
        { scheduledStaff: 'STAFF001', scheduledStaffName: 'John Doe', job: 'JOB1', jobDescription: 'Team Lead', teamLeaderPhone: '555-1234', teamLeaderPager: '555-9999' }
      ],
      actualStaff: [
        { actualStaff: 'STAFF001', actualStaffName: 'John Doe', job: 'JOB1', jobDescription: 'Team Lead' }
      ]
    };

    it('should fetch drive resources successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId).subscribe({
        next: (result) => {
          expect(result.estimatedResources.length).toBe(2);
          expect(result.scheduledStaff.length).toBe(1);
          expect(result.actualStaff.length).toBe(1);
          done();
        }
      });
    });

    it('should return empty arrays on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: null }));

      service.getDriveResources(mockDriveId).subscribe({
        next: (result) => {
          expect(result.estimatedResources).toEqual([]);
          expect(result.scheduledStaff).toEqual([]);
          expect(result.actualStaff).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.RESOURCES);
          done();
        }
      });
    });

    it('should include scheduleId in params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId, 'SCH001').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('scheduleId')).toBe('SCH001');
          done();
        }
      });
    });

    it('should not include scheduleId when not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('scheduleId')).toBeFalse();
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ item: mockResources }));

      service.getDriveResources(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getDriveResources(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive resources:', mockError);
          done();
        }
      });
    });
  });

  describe('getPickupSchedule', () => {
    const mockPickups: PickupScheduleItem[] = [
      { courier: 'COURIER1', time: '2024-01-15T10:00:00', driver: 'Driver 1' },
      { courier: 'COURIER2', time: '2024-01-15T14:00:00', driver: 'Driver 2' }
    ];

    it('should fetch pickup schedule successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockPickups }));

      service.getPickupSchedule(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockPickups);
          expect(result.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty array on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getPickupSchedule(mockDriveId).subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockPickups }));

      service.getPickupSchedule(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.PICKUP_SCHEDULE);
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockPickups }));

      service.getPickupSchedule(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ data: mockPickups }));

      service.getPickupSchedule(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getPickupSchedule(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching pickup schedule:', mockError);
          done();
        }
      });
    });
  });

  describe('getDriveSupplies', () => {
    const mockSupplies: DriveSuppliesResponse = {
      campaignId: 'CAMP001',
      campaignName: 'Test Campaign',
      campaignItems: [
        { item: 'ITEM001', description: 'Item 1', qty: 10 },
        { item: 'ITEM002', description: 'Item 2', qty: 20 }
      ],
      bags: [
        { bag: 'BAG001', description: 'Bag 1', qty: 5, aboDesc: 'O+' },
        { bag: 'BAG002', description: 'Bag 2', qty: 10, aboDesc: 'A+' }
      ]
    };

    it('should fetch drive supplies successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockSupplies }));

      service.getDriveSupplies(mockDriveId).subscribe({
        next: (result) => {
          expect(result.campaignId).toBe('CAMP001');
          expect(result.campaignItems.length).toBe(2);
          expect(result.bags.length).toBe(2);
          done();
        }
      });
    });

    it('should return empty supplies on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: null }));

      service.getDriveSupplies(mockDriveId).subscribe({
        next: (result) => {
          expect(result.campaignId).toBeNull();
          expect(result.campaignItems).toEqual([]);
          expect(result.bags).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockSupplies }));

      service.getDriveSupplies(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.SUPPLIES);
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockSupplies }));

      service.getDriveSupplies(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ item: mockSupplies }));

      service.getDriveSupplies(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getDriveSupplies(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive supplies:', mockError);
          done();
        }
      });
    });
  });

  describe('getDriveProcedures', () => {
    const mockProcedures: DriveProceduresResponse = {
      scheduled: [
        { procedure: 'PROC001', procedureDescription: 'Procedure 1', don: 'DON001', donDescription: 'Don Desc 1', draw: 5 },
        { procedure: 'PROC002', procedureDescription: 'Procedure 2', don: 'DON002', donDescription: 'Don Desc 2', draw: 3 }
      ],
      actual: [
        { procedure: 'PROC001', procedureDescription: 'Procedure 1', don: 'DON001', donDescription: 'Don Desc 1', draw: 4 }
      ]
    };

    it('should fetch drive procedures successfully', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockProcedures }));

      service.getDriveProcedures(mockDriveId).subscribe({
        next: (result) => {
          expect(result.scheduled.length).toBe(2);
          expect(result.actual.length).toBe(1);
          expect(result.scheduled[0].procedure).toBe('PROC001');
          expect(result.actual[0].draw).toBe(4);
          done();
        }
      });
    });

    it('should return empty arrays on empty response', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: null }));

      service.getDriveProcedures(mockDriveId).subscribe({
        next: (result) => {
          expect(result.scheduled).toEqual([]);
          expect(result.actual).toEqual([]);
          done();
        }
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockProcedures }));

      service.getDriveProcedures(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          expect(callArgs[0]).toBe(API.RECRUITMENT.DRIVE_DETAILS_QUERY.PROCEDURES);
          done();
        }
      });
    });

    it('should include driveId and chapterId in params', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockProcedures }));

      service.getDriveProcedures(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeTrue();
          done();
        }
      });
    });

    it('should not include chapterId when absent', (done) => {
      (headerServiceSpy as any).chapterId = signal('');
      apiServiceSpy.get.and.returnValue(of({ item: mockProcedures }));

      service.getDriveProcedures(mockDriveId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1].params as HttpParams;
          expect(params.get('driveId')).toBe(mockDriveId);
          expect(params.has('chapterId')).toBeFalse();
          done();
        }
      });
    });

    it('should handle API error and rethrow', (done) => {
      const mockError = { status: 500, message: 'Server Error' };
      spyOn(console, 'error');
      apiServiceSpy.get.and.returnValue(throwError(() => mockError));

      service.getDriveProcedures(mockDriveId).subscribe({
        error: (error) => {
          expect(error).toEqual(mockError);
          expect(console.error).toHaveBeenCalledWith('Error fetching drive procedures:', mockError);
          done();
        }
      });
    });
  });
});
