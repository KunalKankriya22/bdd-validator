import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { VistaInterfaceStatusComponent } from './vista-interface-status';
import { VistaInterfaceStatusService } from '../../services/vista-interface-status.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { VistaInterfaceStatusDto } from '../../models/vista-interface-status.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('VistaInterfaceStatusComponent', () => {
  let component: any;
  let fixture: ComponentFixture<VistaInterfaceStatusComponent>;
  let vistaServiceSpy: jasmine.SpyObj<VistaInterfaceStatusService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockData: VistaInterfaceStatusDto[] = [
    {
      transactionId: 'TRX001',
      driveDate: '2025-01-15T00:00:00',
      driveId: 'DRV001',
      donorId: 'DON123',
      name: 'Doe, John',
      donationType: 'WBL',
      procedureCode: '450',
      idpProcStatus: 'R',
      statusDescription: 'Registered',
      lkupUpdtBy: 'USER01',
      lkupUpdtTime: '2025-01-15T09:00:00',
      hlthUpdtBy: null,
      hlthUpdtTime: null,
      phyUpdtBy: null,
      phyUpdtTime: null,
      phelobUpdtBy: null,
      phelobUpdtTime: null,
      printDate: null
    },
    {
      transactionId: 'TRX002',
      driveDate: '2025-01-15T00:00:00',
      driveId: 'DRV001',
      donorId: 'DON456',
      name: 'Smith, Jane',
      donationType: 'PLT',
      procedureCode: '465',
      idpProcStatus: 'P',
      statusDescription: 'Processed',
      lkupUpdtBy: 'USER02',
      lkupUpdtTime: '2025-01-15T10:00:00',
      hlthUpdtBy: null,
      hlthUpdtTime: null,
      phyUpdtBy: null,
      phyUpdtTime: null,
      phelobUpdtBy: null,
      phelobUpdtTime: null,
      printDate: null
    }
  ];

  beforeEach(() => {
    vistaServiceSpy = jasmine.createSpyObj('VistaInterfaceStatusService', [
      'getAll',
      'getById',
      'updateStatus',
      'bulkUpdateStatus',
      'getStatusOptions',
      'getEditableStatusOptions',
      'isValidStatusTransition',
      'getDrivesLov'
    ]);

    snackbarServiceSpy = createMockSnackbarService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'chapterChanged$']);
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2025-01-15'));
    (chapterTimezoneServiceSpy as any).chapterChanged$ = of(void 0);
    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    // Default mock implementations
    vistaServiceSpy.getAll.and.returnValue(of({
      success: true,
      message: 'Data retrieved successfully',
      statusCode: 200,
      data: mockData,
      total: 2
    }));

    vistaServiceSpy.getStatusOptions.and.returnValue([
      { value: '', label: 'All' },
      { value: 'P', label: 'Pending' },
      { value: 'C', label: 'Completed' },
      { value: 'R', label: 'Registered' },
      { value: 'W', label: 'Working' },
      { value: 'S', label: 'Sent' },
      { value: 'ER', label: 'Error in Receiving' },
      { value: 'NR', label: 'Never Received' },
      { value: 'X', label: 'Cancel' }
    ]);

    vistaServiceSpy.getEditableStatusOptions.and.returnValue([
      { value: 'P', label: 'Pending' },
      { value: 'X', label: 'Cancel' }
    ]);

    vistaServiceSpy.isValidStatusTransition.and.returnValue(true);

    vistaServiceSpy.getDrivesLov.and.returnValue(of([]));

    vistaServiceSpy.bulkUpdateStatus.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [VistaInterfaceStatusComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: VistaInterfaceStatusService, useValue: vistaServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    vistaServiceSpy.getAll.calls.reset();
    vistaServiceSpy.getById.calls.reset();
    vistaServiceSpy.updateStatus.calls.reset();
    vistaServiceSpy.bulkUpdateStatus.calls.reset();
    vistaServiceSpy.getStatusOptions.calls.reset();
    vistaServiceSpy.getEditableStatusOptions.calls.reset();
    vistaServiceSpy.isValidStatusTransition.calls.reset();
    vistaServiceSpy.getDrivesLov.calls.reset();
    chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2025-01-15'));
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    vistaServiceSpy.isValidStatusTransition.and.returnValue(true);
    vistaServiceSpy.getDrivesLov.and.returnValue(of([]));
    vistaServiceSpy.bulkUpdateStatus.and.returnValue(of([]));

    fixture = TestBed.createComponent(VistaInterfaceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should load status options on init', () => {
      expect(vistaServiceSpy.getStatusOptions).toHaveBeenCalled();
      expect(component.statusOptions.length).toBe(9);
    });
  });

  describe('Data Loading', () => {
    it('should load data on valid form submission', () => {
      component.filterForm.patchValue({
        driveFromDate: moment('2025-01-01'),
        driveToDate: moment('2025-01-15'),
        status: 'R'
      });

      component.onRetrieve();

      expect(vistaServiceSpy.getAll).toHaveBeenCalled();
      expect(component.data().length).toBe(2);
      expect(component.totalCount()).toBe(2);
      expect(component.hasSearched()).toBeTrue();
    });

    it('should handle API errors gracefully', () => {
      vistaServiceSpy.getAll.and.returnValue(
        throwError(() => ({ error: { message: 'API Error' } }))
      );

      component.filterForm.patchValue({
        driveFromDate: moment('2025-01-01'),
        driveToDate: moment('2025-01-15')
      });

      component.onRetrieve();

      expect(component.error()).toBe('API Error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('API Error');
    });
  });

  describe('Clear All Functionality', () => {
    it('should reset form to chapter local date and clear data', () => {
      component.filterForm.patchValue({
        driveFromDate: moment('2025-01-01'),
        driveToDate: moment('2025-01-15')
      });

      component.data.set(mockData);
      component.hasSearched.set(true);

      component.onClearAll();

      // Should reset to chapter local date, not null
      expect(component.filterForm.get('driveFromDate')?.value.format('YYYY-MM-DD')).toBe('2025-01-15');
      expect(component.filterForm.get('driveToDate')?.value.format('YYYY-MM-DD')).toBe('2025-01-15');
      expect(component.data().length).toBe(0);
      expect(component.hasSearched()).toBeFalse();
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload data when refresh is clicked', () => {
      component.filterForm.patchValue({
        driveFromDate: moment('2025-01-01'),
        driveToDate: moment('2025-01-15'),
        status: 'R'
      });

      component.onRetrieve();
      expect(vistaServiceSpy.getAll).toHaveBeenCalledTimes(1);

      component.onRefresh();
      expect(vistaServiceSpy.getAll).toHaveBeenCalledTimes(2);
    });

    it('should show error if refresh is clicked before retrieve', () => {
      component.onRefresh();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please retrieve data first before refreshing');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.data.set(mockData);
    });

    it('should enter edit mode on CHANGE STATUS click', () => {
      component.onChangeStatus();

      expect(component.editMode()).toBeTrue();
      expect(component.editedStatuses().size).toBe(0);
    });

    it('should exit edit mode on CANCEL', () => {
      component.editMode.set(true);
      component.editedStatuses.set(new Map([['TRX001', 'X']]));

      component.onCancel();

      expect(component.editMode()).toBeFalse();
      expect(component.editedStatuses().size).toBe(0);
    });

    it('should track status changes', () => {
      component.editMode.set(true);

      component.onStatusChange('TRX001', 'X');

      expect(component.editedStatuses().get('TRX001')).toBe('X');
      expect(component.hasChanges()).toBeTrue();
    });

    it('should remove change if reverted to original', () => {
      component.editMode.set(true);

      component.onStatusChange('TRX001', 'X');
      expect(component.editedStatuses().has('TRX001')).toBeTrue();

      component.onStatusChange('TRX001', 'R');
      expect(component.editedStatuses().has('TRX001')).toBeFalse();
    });
  });

  describe('Save Status Changes', () => {
    beforeEach(() => {
      component.data.set(mockData);
      component.editMode.set(true);
    });

    it('should save status changes', () => {
      const updates = new Map([['TRX001', 'X' as 'X']]);
      component.editedStatuses.set(updates);

      component.onSave();

      expect(vistaServiceSpy.bulkUpdateStatus).toHaveBeenCalledWith(updates);
    });

    it('should reload data after successful save', () => {
      vistaServiceSpy.bulkUpdateStatus.and.returnValue(of([{
        success: true,
        message: 'Updated',
        statusCode: 200,
        data: { transactionId: 'TRX001', idpProcStatus: 'X' }
      }]));

      component.filterForm.patchValue({
        driveFromDate: moment('2025-01-01'),
        driveToDate: moment('2025-01-15')
      });

      component.editedStatuses.set(new Map([['TRX001', 'X']]));

      component.onSave();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Status updated successfully');
      expect(component.editMode()).toBeFalse();
    });

    it('should handle error 23009', () => {
      vistaServiceSpy.bulkUpdateStatus.and.returnValue(
        throwError(() => ({ error: { errorCode: '23009' } }))
      );

      component.editedStatuses.set(new Map([['TRX001', 'P']]));

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Cannot change status from Registered to Pending'
      );
    });
  });

  describe('Accessibility', () => {
    it('should generate unique IDs across instances', () => {
      const fixture2 = TestBed.createComponent(VistaInterfaceStatusComponent);
      const component2: any = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
    });
  });
});
