import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ManageSpecialDriveComponent } from './manage-special-drive';
import { SpecialDriveService } from './services/special-drive.service';
import { CancelDriveService } from './services/cancel-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SpecialDriveDto } from './models/special-drive.model';

const mockDrive: SpecialDriveDto = {
  driveId: 'SD001',
  chapterId: 'CH01',
  driveDate: '2025-06-15',
  driveType: 'S',
  driveTypeDescription: 'Special',
  driveCategory: 'A',
  driveCategoryDescription: 'Category A',
  status: 'CNFRM',
  sponsorName: 'Test Sponsor',
  locationId: 'LOC001',
  locationName: 'Test Location',
  recruiterId: 'REC001',
  recruiterName: 'Test Recruiter',
  scheduleStartTime: '2025-06-15T09:00:00',
  scheduleEndTime: '2025-06-15T17:00:00',
  programId: 'PROG001',
  sponsors: [{ driveId: 'SD001', chapterId: 'CH01', sponsorId: 'SP001', projectedShow: 100, projectedDraw: 80 }],
  resources: [],
  notes: []
};

const mockCancelResult = {
  driveId: 'SD001',
  cancelUser: 'user',
  cancelDate: '2025-06-15',
  status: 'CANCL',
  staffScheduleDetailsDeleted: 0,
  driveVehiclesDeleted: 0,
  alertCreated: false
};

describe('ManageSpecialDriveComponent', () => {
  let component: ManageSpecialDriveComponent;
  let fixture: ComponentFixture<ManageSpecialDriveComponent>;
  let driveServiceSpy: jasmine.SpyObj<SpecialDriveService>;
  let cancelDriveServiceSpy: jasmine.SpyObj<CancelDriveService>;
  // Resolved from the component's environment injector — same instance the component uses.
  let dialog: MatDialog;
  let snackBar: MatSnackBar;

  beforeEach(() => {

    driveServiceSpy = jasmine.createSpyObj('SpecialDriveService', [
      'searchDrives', 'getDriveById'
    ]);
    driveServiceSpy.searchDrives.and.returnValue(of({ data: [mockDrive], total: 1 }));
    driveServiceSpy.getDriveById.and.returnValue(of(mockDrive));

    cancelDriveServiceSpy = jasmine.createSpyObj('CancelDriveService', ['cancelDrive']);
    cancelDriveServiceSpy.cancelDrive.and.returnValue(of(mockCancelResult));

    const headerServiceStub = {
      chapterId: signal('CH01'),
      chapterTimeZone: signal('America/New_York'),
      chapterChanged$: of(null)
    };

    const pageHeaderServiceStub = {
      pageHeaderData: signal(null),
      getTitle: () => undefined,
      getSubtitle: () => undefined
    };



      TestBed.configureTestingModule({
      imports: [
        ManageSpecialDriveComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SpecialDriveService, useValue: driveServiceSpy },
        { provide: CancelDriveService, useValue: cancelDriveServiceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
        Overlay,
        provideRouter([])
      ]
    });


    


      driveServiceSpy.searchDrives.calls.reset();


      driveServiceSpy.getDriveById.calls.reset();


      cancelDriveServiceSpy.cancelDrive.calls.reset();


      driveServiceSpy.searchDrives.and.returnValue(of({ data: [mockDrive], total: 1 }));


      driveServiceSpy.getDriveById.and.returnValue(of(mockDrive));


      cancelDriveServiceSpy.cancelDrive.and.returnValue(of(mockCancelResult));


    fixture = TestBed.createComponent(ManageSpecialDriveComponent);
    component = fixture.componentInstance;

    // Standalone components register providers from their `imports` in an environment
    // injector that sits closer to the component than the TestBed root injector.
    // fixture.debugElement.injector resolves through that same hierarchy, so we always
    // get the exact instance the component itself receives — unlike TestBed.inject().
    dialog = fixture.debugElement.injector.get(MatDialog);
    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(snackBar, 'open');

    fixture.detectChanges();


    });


  it('should load drives on init', () => {
    expect(driveServiceSpy.searchDrives).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
    expect(component.totalRecords).toBe(1);
  });

  describe('getStatusClass', () => {
    it('should return confirmed class for CNFRM', () => {
      expect(component.getStatusClass('CNFRM')).toBe('status-badge--confirmed');
    });

    it('should return cancelled class for CANCL', () => {
      expect(component.getStatusClass('CANCL')).toBe('status-badge--cancelled');
    });

    it('should return hold class for HOLD', () => {
      expect(component.getStatusClass('HOLD')).toBe('status-badge--hold');
    });




  });

  describe('getStatusLabel', () => {
    it('should return Confirmed for CNFRM', () => {
      expect(component.getStatusLabel('CNFRM')).toBe('Confirmed');
    });

    it('should return Cancelled for CANCL', () => {
      expect(component.getStatusLabel('CANCL')).toBe('Cancelled');
    });

    it('should return Hold for HOLD', () => {
      expect(component.getStatusLabel('HOLD')).toBe('Hold');
    });

    it('should return the status itself for unknown values', () => {
      expect(component.getStatusLabel('OTHER')).toBe('OTHER');
    });
  });

  describe('row expansion', () => {


    it('should expand all rows', () => {
      component.toggleAllRows();
      expect(component.allRowsExpanded).toBeTrue();
      expect(component.isRowExpanded(0)).toBeTrue();
    });

    it('should collapse all rows', () => {
      component.toggleAllRows();
      component.toggleAllRows();
      expect(component.allRowsExpanded).toBeFalse();
      expect(component.isRowExpanded(0)).toBeFalse();
    });
  });
  describe('side panel', () => {
    it('should open add form when createDrive is called', () => {
      component.createDrive();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should close side panel and reset state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockDrive;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should close panel, reset state and reload data on save success', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockDrive;
      driveServiceSpy.searchDrives.calls.reset();
      component.onSaveSuccess();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(driveServiceSpy.searchDrives).toHaveBeenCalled();
    });
  });

  describe('editDrive', () => {
    it('should load full drive details and open side panel in edit mode', () => {
      component.editDrive(mockDrive);
      expect(driveServiceSpy.getDriveById).toHaveBeenCalledWith(mockDrive.driveId, mockDrive.chapterId);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelData).toEqual(mockDrive);
    });


  });

  describe('duplicateDrive', () => {
    it('should load full drive details and open side panel in duplicate mode', () => {
      component.duplicateDrive(mockDrive);
      expect(driveServiceSpy.getDriveById).toHaveBeenCalledWith(mockDrive.driveId, mockDrive.chapterId);
      expect(component.sidePanelMode).toBe('duplicate');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelData).toEqual(mockDrive);
    });


  });

  describe('cancelDrive', () => {
    it('should send empty string for cancelReason when comments are not provided', () => {
      spyOn(dialog, 'open').and.returnValue(
        { afterClosed: () => of({ cancelCode: 'CNAVL', comments: '' }) } as any
      );
      component.cancelDrive(mockDrive);
      expect(cancelDriveServiceSpy.cancelDrive).toHaveBeenCalledWith(
        mockDrive.driveId,
        { cancelReasonCode: 'CNAVL', cancelReason: '', confirmCancellation: true }
      );
    });

    it('should send provided comments as cancelReason', () => {
      spyOn(dialog, 'open').and.returnValue(
        { afterClosed: () => of({ cancelCode: 'CNAVL', comments: 'Not available' }) } as any
      );
      component.cancelDrive(mockDrive);
      expect(cancelDriveServiceSpy.cancelDrive).toHaveBeenCalledWith(
        mockDrive.driveId,
        { cancelReasonCode: 'CNAVL', cancelReason: 'Not available', confirmCancellation: true }
      );
    });






  });

  describe('onRowAction', () => {
    it('should call editDrive for edit action', () => {
      spyOn(component, 'editDrive');
      component.onRowAction('edit', mockDrive);
      expect(component.editDrive).toHaveBeenCalledWith(mockDrive);
    });

    it('should call duplicateDrive for duplicate action', () => {
      spyOn(component, 'duplicateDrive');
      component.onRowAction('duplicate', mockDrive);
      expect(component.duplicateDrive).toHaveBeenCalledWith(mockDrive);
    });

    it('should call cancelDrive for cancel action', () => {
      spyOn(component, 'cancelDrive');
      component.onRowAction('cancel', mockDrive);
      expect(component.cancelDrive).toHaveBeenCalledWith(mockDrive);
    });

    it('should close action menu before dispatching action', () => {
      spyOn(component, 'editDrive');
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;
      component.onRowAction('edit', mockDrive);
      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });
  });

  describe('action menu', () => {
    it('should close action menu', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;
      component.closeActionMenu();
      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });
  });

  describe('expanded row helpers', () => {


    it('should format time correctly', () => {
      const formatted = component.getFormattedTime(mockDrive);
      expect(formatted).toContain('AM');
      expect(formatted).toContain('PM');
    });

    it('should return N/A for missing time', () => {
      expect(component.getFormattedTime({ ...mockDrive, scheduleStartTime: '', scheduleEndTime: '' })).toBe('N/A');
    });

    it('should compute staff required', () => {
      const drive = { ...mockDrive, resources: [{ resourceCode: 'STAFF', numberRequired: 3 } as any] };
      expect(component.getStaffRequired(drive)).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should set error state on load failure', () => {
      driveServiceSpy.searchDrives.and.returnValue(throwError(() => new Error('Network error')));
      component.loadData();
      expect(component.hasError).toBeTrue();
    });
  });
});
