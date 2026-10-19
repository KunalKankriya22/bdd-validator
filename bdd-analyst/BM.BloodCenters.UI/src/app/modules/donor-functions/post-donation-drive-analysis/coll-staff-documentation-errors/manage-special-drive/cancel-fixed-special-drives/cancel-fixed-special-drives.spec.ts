import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

import { CancelFixedSpecialDrivesComponent } from './cancel-fixed-special-drives';
import { CancelDriveService } from '../services/cancel-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DriveForCancellationDto,
  DriveCancellationDetailsDto,
  CancelReasonCodeDto,
  DriveLookupDto,
} from '../models/cancel-drive.model';

const MOCK_DRIVES: DriveForCancellationDto[] = [
  {
    driveId: 'DRV001',
    driveDate: '2026-06-15T00:00:00Z',
    sponsorName: 'Red Cross',
    locationName: 'City Hall',
    status: 'CNFRM',
    programId: 'MCIFIXDR',
  },
  {
    driveId: 'DRV002',
    driveDate: '2026-07-10T00:00:00Z',
    sponsorName: 'Community Center',
    locationName: 'Town Library',
    status: 'HOLD',
    programId: 'MCICRTFX',
  },
];

const MOCK_DETAILS: DriveCancellationDetailsDto = {
  driveId: 'DRV001',
  driveDate: '2026-06-15T00:00:00Z',
  status: 'CNFRM',
  locationName: 'City Hall',
  recruiterName: 'Jane Smith',
  driveTypeDesc: 'Fixed Drive',
  driveCategoryDesc: 'Community',
  scheduleStartTime: '2026-06-15T08:00:00',
  scheduleEndTime: '2026-06-15T16:00:00',
  sponsors: [{ sponsorId: 'SP001', sponsorName: 'Red Cross', projectedShow: 50, projectedDraw: 45 }],
  totalProjectedShow: 50,
  totalProjectedDraw: 45,
  canBeCancelled: true,
  hasPiggybackGroups: false,
};

const MOCK_DETAILS_PIGGYBACK: DriveCancellationDetailsDto = {
  ...MOCK_DETAILS,
  driveId: 'DRV002',
  hasPiggybackGroups: true,
  canBeCancelled: false,
};

const MOCK_CODES: CancelReasonCodeDto[] = [
  { code: 'WTH', description: 'Weather' },
  { code: 'LOW', description: 'Low Appointment Count' },
  { code: 'OTH', description: 'Other' },
];

const MOCK_LOOKUP: DriveLookupDto[] = [
  { driveId: 'DRV001', sponsorName: 'Red Cross' },
  { driveId: 'DRV002', sponsorName: 'Community Center' },
];

describe('CancelFixedSpecialDrivesComponent', () => {
  let serviceSpy: any;
  let component: CancelFixedSpecialDrivesComponent;
  let fixture: ComponentFixture<CancelFixedSpecialDrivesComponent>;
  let cancelDriveService: jasmine.SpyObj<CancelDriveService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let snackBar: MatSnackBar;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('CancelDriveService', [
      'searchDrives', 'getDriveDetails', 'getCancelReasonCodes', 'getDrivesLookup', 'cancelDrive',
    ]);
    const headerSpy = createMockHeaderService();

    serviceSpy.getCancelReasonCodes.and.returnValue(of(MOCK_CODES));
    serviceSpy.getDrivesLookup.and.returnValue(of(MOCK_LOOKUP));
    serviceSpy.searchDrives.and.returnValue(of({ data: MOCK_DRIVES, total: 2 }));
    serviceSpy.getDriveDetails.and.returnValue(of(MOCK_DETAILS));
    serviceSpy.cancelDrive.and.returnValue(of({
      driveId: 'DRV001', cancelUser: 'jdoe', cancelDate: '', status: 'CANCL',
      staffScheduleDetailsDeleted: 3, driveVehiclesDeleted: 1, alertCreated: false,
    }));



      TestBed.configureTestingModule({
imports: [
        CancelFixedSpecialDrivesComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CancelDriveService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerSpy },
      ],
    });


    });



  beforeEach(() => {

      serviceSpy.getCancelReasonCodes.and.returnValue(of(MOCK_CODES));


      serviceSpy.getDrivesLookup.and.returnValue(of(MOCK_LOOKUP));


      serviceSpy.searchDrives.and.returnValue(of({ data: MOCK_DRIVES, total: 2 }));


      serviceSpy.getDriveDetails.and.returnValue(of(MOCK_DETAILS));


      serviceSpy.cancelDrive.and.returnValue(of({
    }));


    cancelDriveService = TestBed.inject(CancelDriveService) as jasmine.SpyObj<CancelDriveService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(CancelFixedSpecialDrivesComponent);
    component = fixture.componentInstance;
    // MatSnackBarModule is in the component's standalone imports, so its instance lives
    // in the component's environment injector — get it here to spy on the actual instance.
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(snackBar, 'open');
    fixture.detectChanges();


    });

  describe('initialization', () => {
    it('should initialize search and cancel forms', () => {
      expect(component.searchForm).toBeTruthy();
      expect(component.cancelForm).toBeTruthy();
    });

    it('should load cancel reason codes on init', () => {
      expect(cancelDriveService.getCancelReasonCodes).toHaveBeenCalled();
      expect(component.cancelReasonCodes()).toEqual(MOCK_CODES);
      expect(component.filteredCancelReasonCodes()).toEqual(MOCK_CODES);
    });

    it('should load drives lookup on init', () => {
      expect(cancelDriveService.getDrivesLookup).toHaveBeenCalled();
      expect(component.drivesLookup()).toEqual(MOCK_LOOKUP);
      expect(component.filteredDrivesLookup()).toEqual(MOCK_LOOKUP);
    });


    it('should not have searched initially', () => {
      expect(component.hasSearched()).toBeFalse();
    });

    it('should have no selected drive initially', () => {
      expect(component.selectedDrive()).toBeNull();
    });

  });

  describe('onSearch()', () => {
    it('should call searchDrives with correct query', () => {
      component.searchForm.patchValue({ sponsorName: 'Red Cross' });
      component.onSearch();

      expect(cancelDriveService.searchDrives).toHaveBeenCalledWith(
        jasmine.objectContaining({ sponsorName: 'Red Cross', take: 25, skip: 0 })
      );
    });

    it('should set hasSearched to true after search', () => {
      component.onSearch();
      expect(component.hasSearched()).toBeTrue();
    });

    it('should populate drives signal with response data', fakeAsync(() => {
      component.onSearch();
      tick();
      expect(component.drives()).toEqual(MOCK_DRIVES);
      expect(component.totalDrives()).toBe(2);
    }));





    it('should omit empty filter fields from query', () => {
      component.searchForm.reset();
      component.onSearch();

      const callArg = cancelDriveService.searchDrives.calls.mostRecent().args[0];
      expect(callArg.sponsorName).toBeUndefined();
      expect(callArg.driveId).toBeUndefined();
      expect(callArg.locationId).toBeUndefined();
    });
  });

  describe('onClearSearch()', () => {


    it('should clear selectedDrive', () => {
      component['selectedDrive'].set(MOCK_DETAILS);
      component.onClearSearch();
      expect(component.selectedDrive()).toBeNull();
    });

    it('should set hasSearched to false', () => {
      component['hasSearched'].set(true);
      component.onClearSearch();
      expect(component.hasSearched()).toBeFalse();
    });
  });

  describe('onRowClick()', () => {
    it('should load drive details when a row is clicked', fakeAsync(() => {
      component.onRowClick(MOCK_DRIVES[0]);
      tick();
      expect(cancelDriveService.getDriveDetails).toHaveBeenCalledWith('DRV001');
      expect(component.selectedDrive()).toEqual(MOCK_DETAILS);
    }));




  });

  describe('canCancelDrive', () => {
    it('should be false when no drive is selected', () => {
      component['selectedDrive'].set(null);
      expect(component.canCancelDrive).toBeFalse();
    });

    it('should be false when drive has piggyback groups', () => {
      component['selectedDrive'].set(MOCK_DETAILS_PIGGYBACK);
      component.cancelForm.patchValue({ cancelReasonCode: 'WTH', cancelReason: 'Test' });
      expect(component.canCancelDrive).toBeFalse();
    });



    it('should be false when canBeCancelled is false', () => {
      component['selectedDrive'].set({ ...MOCK_DETAILS, canBeCancelled: false, hasPiggybackGroups: false });
      component.cancelForm.patchValue({ cancelReasonCode: 'WTH', cancelReason: 'Test' });
      expect(component.canCancelDrive).toBeFalse();
    });
  });

  describe('onCancelDrive()', () => {
    beforeEach(fakeAsync(() => {
      component['selectedDrive'].set(MOCK_DETAILS);
      component.cancelForm.patchValue({ cancelReasonCode: 'WTH', cancelReason: 'Severe weather forecast' });
      tick();
    }));

    it('should call cancelDrive with confirmCancellation true', fakeAsync(() => {
      component.onCancelDrive();
      tick();

      expect(cancelDriveService.cancelDrive).toHaveBeenCalledWith('DRV001', {
        cancelReasonCode: 'WTH',
        cancelReason: 'Severe weather forecast',
        confirmCancellation: true,
      });
    }));


    it('should mention alert when alertCreated is true', fakeAsync(() => {
      cancelDriveService.cancelDrive.and.returnValue(of({
        driveId: 'DRV001', cancelUser: 'jdoe', cancelDate: '', status: 'CANCL',
        staffScheduleDetailsDeleted: 0, driveVehiclesDeleted: 0, alertCreated: true,
      }));

      component.onCancelDrive();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringMatching('alert was generated'),
        'DISMISS',
        jasmine.anything()
      );
    }));





    it('should show generic error when API error has no message', fakeAsync(() => {
      cancelDriveService.cancelDrive.and.returnValue(throwError(() => ({})));

      component.onCancelDrive();
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error cancelling drive. Please try again.',
        'DISMISS',
        jasmine.anything()
      );
    }));
  });
  describe('onSortChange()', () => {


    it('should reset pageIndex to 0 on sort change', () => {
      component.pageIndex = 3;
      component.onSortChange({ column: 'driveDate', direction: 'A' });
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('formatDate()', () => {
    it('should format ISO date to DD-MON-YYYY', () => {
      const result = component.formatDate('2026-06-15T00:00:00Z');
      expect(result).toMatch(/15-JUN-2026/);
    });


  });

  describe('formatStatus()', () => {
    it('should map CNFRM to Confirmed', () => {
      expect(component.formatStatus('CNFRM')).toBe('Confirmed');
    });

    it('should map HOLD to Hold', () => {
      expect(component.formatStatus('HOLD')).toBe('Hold');
    });

    it('should map CANCL to Cancelled', () => {
      expect(component.formatStatus('CANCL')).toBe('Cancelled');
    });

    it('should return raw value for unknown status', () => {
      expect(component.formatStatus('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('cancel code search filtering', () => {


    it('should show all codes when search is cleared', () => {
      component.cancelCodeSearchCtrl.setValue('WTH');
      component.cancelCodeSearchCtrl.setValue('');
      expect(component.filteredCancelReasonCodes().length).toBe(MOCK_CODES.length);
    });
  });

  describe('drive ID LOV search filtering', () => {

    it('should show all drives when search is cleared', () => {
      component.driveIdSearchCtrl.setValue('DRV001');
      component.driveIdSearchCtrl.setValue('');
      expect(component.filteredDrivesLookup().length).toBe(MOCK_LOOKUP.length);
    });
  });

  describe('selectedCodeDescription', () => {
    it('should update description when cancel code is selected', () => {
      component['selectedDrive'].set(MOCK_DETAILS);
      component.cancelReasonCodes.set(MOCK_CODES);
      component.cancelForm.patchValue({ cancelReasonCode: 'WTH' });
      expect(component.selectedCodeDescription()).toBe('Weather');
    });

    it('should clear description when cancel code is cleared', () => {
      component['selectedDrive'].set(MOCK_DETAILS);
      component.cancelReasonCodes.set(MOCK_CODES);
      component.cancelForm.patchValue({ cancelReasonCode: 'WTH' });
      component.cancelForm.patchValue({ cancelReasonCode: null });
      expect(component.selectedCodeDescription()).toBe('');
    });
  });
});
