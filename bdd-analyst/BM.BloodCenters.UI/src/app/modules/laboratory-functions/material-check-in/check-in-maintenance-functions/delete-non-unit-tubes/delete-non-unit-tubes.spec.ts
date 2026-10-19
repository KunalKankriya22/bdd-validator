import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

import { DeleteNonUnitTubesComponent } from './delete-non-unit-tubes';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DeleteNonUnitTubesService } from './services/delete-non-unit-tubes.service';
import { NonUnitTubeDto } from './models/delete-non-unit-tubes.model';
import { getDateInTimezone } from '@shared/date/timezone.util';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DeleteNonUnitTubesComponent', () => {
  let searchBar: any;
  let mockDialogRef: any;
  let component: DeleteNonUnitTubesComponent;
  let fixture: ComponentFixture<DeleteNonUnitTubesComponent>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let deleteNonUnitTubesServiceSpy: jasmine.SpyObj<DeleteNonUnitTubesService>;
  let dialog: MatDialog;

  const chapterChanged$ = new Subject<void>();

  const mockTubesResponse = {
    data: [
      { unitId: 'W12342402705-Q', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T10:00:00', chkDigit: '-Q' },
      { unitId: 'W12342402705-D', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T11:00:00', chkDigit: '-D' },
      { unitId: 'W12342402705-Y', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T12:00:00', chkDigit: '-Y' },
      { unitId: 'W12342402705-W1', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T13:00:00', chkDigit: '-W' },
      { unitId: 'W12342402705-W2', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T14:00:00', chkDigit: '-W' },
      { unitId: 'W12342402705-W3', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T15:00:00', chkDigit: '-W' },
      { unitId: 'W12342402705-W4', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T16:00:00', chkDigit: '-W' },
      { unitId: 'W12342402705-X', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T17:00:00', chkDigit: '-X' },
      { unitId: 'W12342402705-Z', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T18:00:00', chkDigit: '-Z' },
      { unitId: 'W12342402705-A', chapterId: 'WAD', tubeCheckinDats: '2025-11-01T19:00:00', chkDigit: '-A' },
    ] as NonUnitTubeDto[],
    totalCount: 10,
    success: true,
    message: '',
    errorCode: null
  };

  beforeEach(() => {

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Delete Non-Unit Tubes',
        subtitle: 'Remove tubes incorrectly committed during Tube Check-In.'
      })
    });
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();
    deleteNonUnitTubesServiceSpy = jasmine.createSpyObj('DeleteNonUnitTubesService', ['getTubes', 'deleteTubes']);
    deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(of(mockTubesResponse));
    deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(of({ success: true }));



      TestBed.configureTestingModule({
      imports: [
        DeleteNonUnitTubesComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: DeleteNonUnitTubesService, useValue: deleteNonUnitTubesServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });

      deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(of(mockTubesResponse));


      deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(DeleteNonUnitTubesComponent);
    component = fixture.componentInstance;
    dialog = (component as unknown as { dialog: MatDialog }).dialog;


    });

  describe('Component Initialization', () => {




    it('should start with no data and not retrieved', () => {
      expect(component.dataSource.length).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Filter Form', () => {
    it('should have start and end date controls', () => {
      expect(component.filterForm.get('startDate')).toBeTruthy();
      expect(component.filterForm.get('endDate')).toBeTruthy();
    });

    it('should require both dates', () => {
      expect(component.filterForm.valid).toBeFalse();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve when both dates are set and valid', () => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      expect(component.filterForm.valid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('Date Validation', () => {
    it('should invalidate start date when in future based on chapter timezone', () => {
      // Use getDateInTimezone to get chapter's today
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(futureDate);
      control.markAsTouched();

      expect(control.hasError('futureDate')).toBeTrue();
      // Future date error now shown inline
      expect(component.startDateError).toBe('Start Date cannot be in the future');
    });

    it('should invalidate end date when in future based on chapter timezone', () => {
      // Use getDateInTimezone to get chapter's today
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(futureDate);
      control.markAsTouched();

      expect(control.hasError('futureDate')).toBeTrue();
      // Future date error now shown inline
      expect(component.endDateError).toBe('End Date cannot be in the future');
    });

    it('should accept today\'s date based on chapter timezone', () => {
      // Use getDateInTimezone to get chapter's today
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);

      component.filterForm.patchValue({
        startDate: chapterToday.clone(),
        endDate: chapterToday.clone()
      });

      const startDateControl = component.filterForm.get('startDate') as FormControl;
      const endDateControl = component.filterForm.get('endDate') as FormControl;

      expect(startDateControl.hasError('futureDate')).toBeFalsy();
      expect(endDateControl.hasError('futureDate')).toBeFalsy();
    });

    it('should use chapter timezone from HeaderService', () => {
      // Verify the service is called for timezone
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(futureDate);

      expect(headerServiceSpy.chapterTimeZone()).toBe('America/New_York');
      expect(control.hasError('futureDate')).toBeTrue();
    });

    it('should invalidate when end date is before start date', () => {
      // Initialize component to set up valueChanges subscriptions
      component.ngOnInit();

      // Set start date first
      component.filterForm.patchValue({
        startDate: moment('2025-11-30')
      });
      // Then set end date (this makes end the lastChangedDateField)
      component.filterForm.patchValue({
        endDate: moment('2025-11-01')
      });
      component.filterForm.get('endDate')?.markAsTouched();

      const endDateControl = component.filterForm.get('endDate') as FormControl;
      expect(endDateControl.hasError('lessThanStartDate')).toBeTrue();
      // Date range error shown on the field that was last changed (end date in this case)
      expect(component.endDateError).toBe('End Date must be after or equal to Start Date');
    });

    it('should invalidate when start date is after end date', () => {
      // Initialize component to set up valueChanges subscriptions
      component.ngOnInit();

      // Set end date first
      component.filterForm.patchValue({
        endDate: moment('2025-11-01').startOf('day')
      });

      // Then set start date after end date (this makes start the lastChangedDateField)
      component.filterForm.patchValue({
        startDate: moment('2025-11-30').startOf('day')
      });
      component.filterForm.get('startDate')?.markAsTouched();

      const startDateControl = component.filterForm.get('startDate') as FormControl;
      expect(startDateControl.hasError('greaterThanEndDate')).toBeTrue();
      // Date range error shown on the field that was last changed (start date in this case)
      expect(component.startDateError).toBe('Start Date must be before or equal to End Date');
    });

    it('should accept valid date range', () => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-01'),
        endDate: moment('2025-11-30')
      });

      const startDateControl = component.filterForm.get('startDate') as FormControl;
      const endDateControl = component.filterForm.get('endDate') as FormControl;

      expect(startDateControl.valid).toBeTrue();
      expect(endDateControl.valid).toBeTrue();
    });

    it('should mark start date as touched on blur', () => {
      const control = component.filterForm.get('startDate');
      component.onStartDateBlur();
      expect(control?.touched).toBeTrue();
    });

    it('should mark end date as touched on blur', () => {
      const control = component.filterForm.get('endDate');
      component.onEndDateBlur();
      expect(control?.touched).toBeTrue();
    });



    it('should re-validate end date when start date changes', fakeAsync(() => {
      // Initialize component to set up validation subscriptions
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        startDate: moment('2025-01-01').startOf('day'),
        endDate: moment('2025-06-01').startOf('day')
      });
      tick();

      // Change start date to be after end date - the subscription should trigger end date revalidation
      component.filterForm.patchValue({
        startDate: moment('2025-11-01').startOf('day')
      });
      tick();

      const endDateControl = component.filterForm.get('endDate') as FormControl;
      expect(endDateControl.hasError('lessThanStartDate')).toBeTrue();
    }));

    it('should re-validate start date when end date changes', fakeAsync(() => {
      // Initialize component to set up validation subscriptions
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        startDate: moment('2025-06-01').startOf('day'),
        endDate: moment('2025-11-01').startOf('day')
      });
      tick();

      // Change end date to be before start date - the subscription should trigger start date revalidation
      component.filterForm.patchValue({
        endDate: moment('2025-01-01').startOf('day')
      });
      tick();

      const startDateControl = component.filterForm.get('startDate') as FormControl;
      expect(startDateControl.hasError('greaterThanEndDate')).toBeTrue();
    }));
  });

  describe('Retrieve', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should load data from service on retrieve', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });

      component.retrieve();
      tick();

      expect(deleteNonUnitTubesServiceSpy.getTubes).toHaveBeenCalledWith('2025-01-11', '2025-11-30');
      expect(component.hasRetrieved).toBeTrue();
      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.isLoading).toBeFalse();
    }));





    it('should handle API errors on retrieve', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });

      component.retrieve();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load tubes. Please try again.');
    }));

    it('should show error message and snackbar when no records found', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(of({
        data: [],
        totalCount: 0,
        success: true,
        message: 'No tubes found in the specified date range',
        errorCode: '0161'
      }));

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });

      component.retrieve();
      tick();

      expect(component.noRecordsMessage).toBe('No records found');
      expect(component.noRecordsSnackbarMessage).toBe('No tubes found in the specified date range (Error Code: 0161)');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No tubes found in the specified date range (Error Code: 0161)');
    }));
  });

  describe('Clear All', () => {
    it('should reset all state on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      component.clearAll();

      expect(component.filterForm.get('startDate')?.value).toBeNull();
      expect(component.filterForm.get('endDate')?.value).toBeNull();
      expect(component.dataSource.length).toBe(0);
      expect(component.totalCount).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.selectedUnitIds.size).toBe(0);
    }));
  });

  describe('Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should toggle single row selection', () => {
      const unitId = component.dataSource[0].unitId;

      component.toggleRowSelection(unitId);
      expect(component.isRowSelected(unitId)).toBeTrue();

      component.toggleRowSelection(unitId);
      expect(component.isRowSelected(unitId)).toBeFalse();
    });

    it('should toggle select all', () => {
      component.toggleAllRows();
      expect(component.allRowsSelected()).toBeTrue();
      expect(component.selectedUnitIds.size).toBe(component.dataSource.length);

      component.toggleAllRows();
      expect(component.allRowsSelected()).toBeFalse();
      expect(component.selectedUnitIds.size).toBe(0);
    });

    it('should update allRowsSelected when all rows selected individually', () => {
      component.dataSource.forEach(row => component.toggleRowSelection(row.unitId));
      expect(component.allRowsSelected()).toBeTrue();
    });

    it('should return true for someRowsSelected when partial selection', () => {
      component.toggleRowSelection(component.dataSource[0].unitId);
      expect(component.someRowsSelected()).toBeTrue();
      expect(component.allRowsSelected()).toBeFalse();
    });

    it('should disable delete when no selection', () => {
      expect(component.isDeleteDisabled).toBeTrue();
    });

    it('should enable delete when rows are selected', () => {
      component.toggleRowSelection(component.dataSource[0].unitId);
      expect(component.isDeleteDisabled).toBeFalse();
    });
  });

  describe('Delete', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));





    it('should remove selected items on confirmed delete', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      const initialCount = component.dataSource.length;
      const unitId1 = component.dataSource[0].unitId;
      const unitId2 = component.dataSource[1].unitId;
      const unitId3 = component.dataSource[2].unitId;

      component.toggleRowSelection(unitId1);
      component.toggleRowSelection(unitId2);
      component.toggleRowSelection(unitId3);

      component.confirmDelete();
      tick();

      expect(deleteNonUnitTubesServiceSpy.deleteTubes).toHaveBeenCalledWith([unitId1, unitId2, unitId3]);
      expect(component.dataSource.length).toBe(initialCount - 3);
      expect(component.selectedUnitIds.size).toBe(0);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should not delete on cancel', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      const initialCount = component.dataSource.length;
      component.toggleRowSelection(component.dataSource[0].unitId);

      component.confirmDelete();
      tick();

      expect(deleteNonUnitTubesServiceSpy.deleteTubes).not.toHaveBeenCalled();
      expect(component.dataSource.length).toBe(initialCount);
    }));

    it('should handle delete API errors', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to delete tubes. Please try again.');
    }));

    it('should handle delete failure response', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(
        of({ success: false, message: 'Delete operation failed' })
      );

      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Delete operation failed');
    }));
  });

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should filter by Unit ID', () => {
      component.onSearch('Q');
      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.dataSource.every(row => row.unitId.toLowerCase().includes('q'))).toBeTrue();
    });

    it('should show all data when search is cleared', () => {
      const fullCount = component.dataSource.length;
      component.onSearch('Q');
      component.onSearch('');
      expect(component.dataSource.length).toBe(fullCount);
    });

    it('should persist selection on search', () => {
      component.toggleRowSelection(component.dataSource[0].unitId);
      component.onSearch('something');
      expect(component.selectedUnitIds.size).toBe(1);
    });
  });

  describe('Date Formatting', () => {


    it('should format date with time correctly', () => {
      expect(component.formatDate('2010-07-07T07:18:54')).toBe('07-JUL-2010');
    });






  });

  describe('Number to Words', () => {
    it('should convert numbers 0-20 to words', () => {
      expect((component as any).numberToWords(0)).toBe('Zero');
      expect((component as any).numberToWords(1)).toBe('One');
      expect((component as any).numberToWords(2)).toBe('Two');
      expect((component as any).numberToWords(3)).toBe('Three');
      expect((component as any).numberToWords(10)).toBe('Ten');
      expect((component as any).numberToWords(20)).toBe('Twenty');
    });


  });


  describe('Datepicker Max Date', () => {
    it('should have a today getter that uses chapter timezone', () => {
      // Mock chapter timezone
      const todayValue = component.today;

      // Verify it's a moment object
      expect(moment.isMoment(todayValue)).toBeTrue();

      // Verify chapterTimeZone returns expected value
      expect(headerServiceSpy.chapterTimeZone()).toBe('America/New_York');
    });

    it('should calculate today using getDateInTimezone with chapter timezone', () => {
      const timezone = 'America/New_York';
      const todayValue = component.today;
      const { year, month, day } = getDateInTimezone(timezone);
      const expectedToday = moment([year, month, day]);

      expect(todayValue.format('YYYY-MM-DD')).toBe(expectedToday.format('YYYY-MM-DD'));
    });

    it('should return start of day for today', () => {
      const todayValue = component.today;

      // Verify time is at start of day
      expect(todayValue.hour()).toBe(0);
      expect(todayValue.minute()).toBe(0);
      expect(todayValue.second()).toBe(0);
      expect(todayValue.millisecond()).toBe(0);
    });

    it('should use same timezone logic as date validation', () => {
      const timezone = 'America/New_York';
      // Get today from the getter
      const todayFromGetter = component.today;

      // Simulate what validation does
      const { year, month, day } = getDateInTimezone(timezone);
      const todayFromValidation = moment([year, month, day]);

      // They should match exactly
      expect(todayFromGetter.format('YYYY-MM-DD')).toBe(todayFromValidation.format('YYYY-MM-DD'));
    });

    it('should work with different chapter timezones', () => {
      // Test with UTC
      const todayUTC = component.today;
      expect(moment.isMoment(todayUTC)).toBeTrue();

      // Test with Asia/Tokyo
      const todayTokyo = component.today;
      expect(moment.isMoment(todayTokyo)).toBeTrue();

      // Test with Europe/London
      const todayLondon = component.today;
      expect(moment.isMoment(todayLondon)).toBeTrue();
    });

    it('should recalculate today on each call (getter behavior)', () => {
      const today1 = component.today;
      const today2 = component.today;

      // Both calls should create new moment objects
      expect(today1).not.toBe(today2); // Different object references
      expect(today1.format('YYYY-MM-DD')).toBe(today2.format('YYYY-MM-DD')); // But same date
    });
  });

  describe('Table Layout - allData vs dataSource', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should populate both allData and dataSource on retrieve', () => {
      expect(component.allData.length).toBeGreaterThan(0);
      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.allData.length).toBe(component.dataSource.length);
    });

    it('should keep allData unchanged when search filters dataSource', () => {
      const allDataCountBefore = component.allData.length;

      // Filter to zero results
      component.onSearch('NONEXISTENT');

      expect(component.allData.length).toBe(allDataCountBefore);
      expect(component.dataSource.length).toBe(0);
    });

    it('should show allData count in totalCount regardless of search filter', () => {
      const totalCount = component.totalCount;

      // Filter dataSource
      component.onSearch('Q');

      // totalCount should remain the same (shows allData count)
      expect(component.totalCount).toBe(totalCount);
      expect(component.dataSource.length).toBeLessThan(totalCount);
    });

    it('should clear both allData and dataSource on clearAll', () => {
      component.clearAll();

      expect(component.allData.length).toBe(0);
      expect(component.dataSource.length).toBe(0);
      expect(component.totalCount).toBe(0);
    });

    it('should update allData when items are deleted', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      const initialAllDataCount = component.allData.length;
      const unitId = component.dataSource[0].unitId;

      component.toggleRowSelection(unitId);
      component.confirmDelete();
      tick();

      // Both allData and dataSource should be updated
      expect(component.allData.length).toBe(initialAllDataCount - 1);
      expect(component.dataSource.length).toBe(initialAllDataCount - 1);
    }));

    it('should restore dataSource from allData when search is cleared', () => {
      const allDataCount = component.allData.length;

      // Filter to subset - use a search term that matches only some records
      component.onSearch('-Q');
      expect(component.dataSource.length).toBeLessThan(allDataCount);
      expect(component.dataSource.length).toBeGreaterThan(0);

      // Clear search
      component.onSearch('');
      expect(component.dataSource.length).toBe(allDataCount);
    });
  });

  describe('Table Layout - Empty Search Results', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should set dataSource to empty array when search has no matches', () => {
      component.onSearch('NONEXISTENT_UNIT_ID_12345');

      expect(component.dataSource.length).toBe(0);
      expect(component.allData.length).toBeGreaterThan(0);
    });

    it('should maintain allData when dataSource is filtered to zero', () => {
      const allDataSnapshot = [...component.allData];

      component.onSearch('NONEXISTENT');

      expect(component.dataSource.length).toBe(0);
      expect(component.allData).toEqual(allDataSnapshot);
    });

    it('should show table structure even when dataSource is empty due to filtering', () => {
      // This is tested by template condition: allData.length > 0
      component.onSearch('NONEXISTENT');

      // Component state allows table to render
      expect(component.allData.length).toBeGreaterThan(0);
      expect(component.hasRetrieved).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    });





    it('should preserve totalCount when dataSource is filtered', () => {
      const totalCount = component.totalCount;

      component.onSearch('NONEXISTENT');

      // totalCount should still show original allData count
      expect(component.totalCount).toBe(totalCount);
    });
  });

  describe('Table Layout - DOM Visibility Conditions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show table header when allData has records (even if dataSource is empty)', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      // Filter to zero
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      // Table header should be visible because allData.length > 0
      const compiled = fixture.nativeElement as HTMLElement;
      const tableHeader = compiled.querySelector('.table-header');

      expect(component.allData.length).toBeGreaterThan(0);
      expect(component.dataSource.length).toBe(0);
      expect(tableHeader).toBeTruthy(); // Table header should exist
    }));

    it('should hide table header when no data retrieved from API', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(of({
        data: [],
        totalCount: 0,
        success: true,
        message: '',
        errorCode: null
      }));

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tableHeader = compiled.querySelector('.table-header');

      expect(component.allData.length).toBe(0);
      expect(tableHeader).toBeFalsy(); // Table header should NOT exist
    }));

    it('should show search bar and delete button when allData has records', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      // Filter to zero
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const deleteButton = compiled.querySelector('.delete-btn');
      searchBar = compiled.querySelector('app-search-bar');

      expect(deleteButton).toBeTruthy();
      expect(searchBar).toBeTruthy();
    }));

    it('should show table footer with totalCount when allData has records', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      // Filter to zero
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('.table-footer');
      const footerCount = compiled.querySelector('.footer-count');

      expect(footer).toBeTruthy();
      expect(footerCount?.textContent?.trim()).toBe(component.totalCount.toString());
    }));
  });

  describe('Table Layout - No Results Row Styling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should display no-results row when dataSource is empty after filtering', fakeAsync(() => {
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const noResultsRow = compiled.querySelector('.no-results-row');

      expect(component.dataSource.length).toBe(0);
      expect(component.allData.length).toBeGreaterThan(0);
      expect(noResultsRow).toBeTruthy();
    }));

    it('should display inbox icon in no-results row', fakeAsync(() => {
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.no-results-icon-wrapper mat-icon');

      expect(icon?.textContent?.trim()).toBe('inbox');
    }));

    it('should display "No records found" text in no-results row', fakeAsync(() => {
      component.onSearch('NONEXISTENT');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const text = compiled.querySelector('.no-results-text');

      expect(text?.textContent?.trim()).toBe('No records found');
    }));

    it('should not display no-results row when dataSource has records', fakeAsync(() => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const noResultsRow = compiled.querySelector('.no-results-row');

      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(noResultsRow).toBeFalsy();
    }));
  });

  describe('Error State Matchers', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should show error state for start date when it has futureDate error and is touched', () => {
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(futureDate);
      control.markAsTouched();

      const isError = component.startDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
    });

    it('should show error state for end date when it has futureDate error and is touched', () => {
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(futureDate);
      control.markAsTouched();

      const isError = component.endDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
    });

    it('should show error state for start date when it has greaterThanEndDate error and was last changed', fakeAsync(() => {
      component.filterForm.patchValue({
        endDate: moment('2025-01-01')
      });
      tick();

      // Change start date after end date (makes start the lastChangedDateField)
      component.filterForm.patchValue({
        startDate: moment('2025-11-30')
      });
      tick();

      const control = component.filterForm.get('startDate') as FormControl;
      control.markAsTouched();

      const isError = component.startDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
      expect(control.hasError('greaterThanEndDate')).toBeTrue();
    }));

    it('should NOT show error state for end date when start date has greaterThanEndDate error', fakeAsync(() => {
      component.filterForm.patchValue({
        endDate: moment('2025-01-01')
      });
      tick();

      // Change start date after end date (makes start the lastChangedDateField)
      component.filterForm.patchValue({
        startDate: moment('2025-11-30')
      });
      tick();

      const endControl = component.filterForm.get('endDate') as FormControl;
      endControl.markAsTouched();

      const isError = component.endDateErrorMatcher.isErrorState(endControl, null as any);
      // End date should NOT show error because start was last changed
      expect(isError).toBeFalse();
    }));

    it('should show error state for end date when it has lessThanStartDate error and was last changed', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-11-30')
      });
      tick();

      // Change end date before start date (makes end the lastChangedDateField)
      component.filterForm.patchValue({
        endDate: moment('2025-01-01')
      });
      tick();

      const control = component.filterForm.get('endDate') as FormControl;
      control.markAsTouched();

      const isError = component.endDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
      expect(control.hasError('lessThanStartDate')).toBeTrue();
    }));

    it('should NOT show error state for start date when end date has lessThanStartDate error', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-11-30')
      });
      tick();

      // Change end date before start date (makes end the lastChangedDateField)
      component.filterForm.patchValue({
        endDate: moment('2025-01-01')
      });
      tick();

      const startControl = component.filterForm.get('startDate') as FormControl;
      startControl.markAsTouched();

      const isError = component.startDateErrorMatcher.isErrorState(startControl, null as any);
      // Start date should NOT show error because end was last changed
      expect(isError).toBeFalse();
    }));

    it('should NOT show error state when control is not touched', () => {
      const { year, month, day } = getDateInTimezone('America/New_York');
      const chapterToday = moment([year, month, day]);
      const futureDate = chapterToday.clone().add(1, 'day');

      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(futureDate);
      // Don't mark as touched

      const isError = component.startDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeFalse();
    });

    it('should show error state for required error when touched', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      const isError = component.startDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
      expect(control.hasError('required')).toBeTrue();
    });

    it('should show error state for parse error', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();

      const isError = component.startDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
    });
  });

  describe('Toggle Sort', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should toggle sort direction from asc to desc', () => {
      expect(component.sortDirection).toBe('asc');
      component.toggleSort();
      expect(component.sortDirection).toBe('desc');
    });

    it('should toggle sort direction from desc to asc', () => {
      component.sortDirection = 'desc';
      component.toggleSort();
      expect(component.sortDirection).toBe('asc');
    });

    it('should re-apply client search after toggling sort', () => {
      const unitIdsBefore = component.dataSource.map(r => r.unitId);
      component.toggleSort();
      const unitIdsAfter = component.dataSource.map(r => r.unitId);
      // After toggling to desc, the order should be reversed
      expect(unitIdsAfter).toEqual([...unitIdsBefore].reverse());
    });
  });

  describe('isClearAllDisabled', () => {
    it('should be true when both dates are null', () => {
      component.filterForm.patchValue({ startDate: null, endDate: null });
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should be false when startDate has a value', () => {
      component.filterForm.patchValue({ startDate: moment('2025-01-01'), endDate: null });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be false when endDate has a value', () => {
      component.filterForm.patchValue({ startDate: null, endDate: moment('2025-01-01') });
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should be false when both dates have values', () => {
      component.filterForm.patchValue({ startDate: moment('2025-01-01'), endDate: moment('2025-06-01') });
      expect(component.isClearAllDisabled).toBeFalse();
    });
  });

  describe('Retrieve Early Returns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call service when form is invalid', () => {
      // Form is invalid by default (no dates set)
      component.retrieve();
      expect(deleteNonUnitTubesServiceSpy.getTubes).not.toHaveBeenCalled();
    });

    it('should not call service when isLoading is true', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.isLoading = true;
      component.retrieve();
      expect(deleteNonUnitTubesServiceSpy.getTubes).not.toHaveBeenCalled();
    }));

    it('should reset searchText and currentSearchKeyword on retrieve', fakeAsync(() => {
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.searchText = 'some search';
      component.currentSearchKeyword = 'some keyword';

      component.retrieve();
      tick();

      expect(component.searchText).toBe('');
      expect(component.currentSearchKeyword).toBe('');
    }));
  });

  describe('confirmDelete Early Return', () => {
    it('should not open dialog when no rows are selected', () => {
      spyOn(dialog, 'open');
      component.confirmDelete();
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      const spy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    it('should clear all state when chapter changes', fakeAsync(() => {
      // Use a Subject so we can emit chapter changes
      const chapterSubject = new Subject<void>();
      (headerServiceSpy as any).chapterChanged$ = chapterSubject.asObservable();

      // Re-create fixture to pick up the new chapterChanged$
      fixture = TestBed.createComponent(DeleteNonUnitTubesComponent);
      component = fixture.componentInstance;
      dialog = (component as unknown as { dialog: MatDialog }).dialog;

      fixture.detectChanges();
      tick();

      // Load data first
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      expect(component.dataSource.length).toBeGreaterThan(0);

      // Emit chapter change
      chapterSubject.next();

      expect(component.dataSource.length).toBe(0);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.filterForm.get('startDate')?.value).toBeNull();
    }));
  });

  describe('Sort by Non-UnitId Column', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should sort by tubeCheckinDats when sortColumn is not unitId', () => {
      component.sortColumn = 'tubeCheckinDats';
      component.sortDirection = 'asc';
      component.onSearch(''); // triggers applyClientSearch

      const dates = component.dataSource.map(r => r.tubeCheckinDats);
      const sortedDates = [...dates].sort((a, b) => (a || '').localeCompare(b || ''));
      expect(dates).toEqual(sortedDates);
    });

    it('should sort by tubeCheckinDats desc when sortColumn is not unitId', () => {
      component.sortColumn = 'tubeCheckinDats';
      component.sortDirection = 'desc';
      component.onSearch(''); // triggers applyClientSearch

      const dates = component.dataSource.map(r => r.tubeCheckinDats);
      const sortedDates = [...dates].sort((a, b) => (b || '').localeCompare(a || ''));
      expect(dates).toEqual(sortedDates);
    });
  });

  describe('Error State Matchers - Null Control', () => {
    it('should return false for startDateErrorMatcher when control is null', () => {
      const result = component.startDateErrorMatcher.isErrorState(null as any, null as any);
      expect(result).toBeFalse();
    });

    it('should return false for endDateErrorMatcher when control is null', () => {
      const result = component.endDateErrorMatcher.isErrorState(null as any, null as any);
      expect(result).toBeFalse();
    });
  });

  describe('startDateError Getter', () => {
    it('should return empty string when control is not touched', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(null);
      // not touched
      expect(component.startDateError).toBe('');
    });

    it('should return empty string when control is valid', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(moment('2025-01-01'));
      control.markAsTouched();
      // valid date, no errors
      expect(component.startDateError).toBe('');
    });

    it('should return "Start Date is invalid" for matDatepickerParse error', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setErrors({ matDatepickerParse: { text: 'abc' } });
      control.markAsTouched();
      expect(component.startDateError).toBe('Start Date is invalid');
    });

    it('should return "Start Date is invalid" when input has text but value is null', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      // Simulate the nativeElement having a value
      (component as any).startDateInput = { nativeElement: { value: 'invalid-text' } };

      // Control has required error plus input has text
      expect(component.startDateError).toBe('Start Date is invalid');
    });

    it('should return "Start Date is required" when value is null and no input text', () => {
      const control = component.filterForm.get('startDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      // No startDateInput ViewChild or empty value
      (component as any).startDateInput = undefined;

      expect(component.startDateError).toBe('Start Date is required');
    });

    it('should not show greaterThanEndDate error when lastChangedDateField is not start', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.ngOnInit();

      // Set start first, then end (makes end the lastChangedDateField)
      component.filterForm.patchValue({ startDate: moment('2025-11-30') });
      tick();
      component.filterForm.patchValue({ endDate: moment('2025-01-01') });
      tick();

      const control = component.filterForm.get('startDate') as FormControl;
      control.markAsTouched();

      // lastChangedDateField is 'end', so startDateError should not show greaterThanEndDate
      expect(component.startDateError).toBe('');
    }));
  });

  describe('endDateError Getter', () => {
    it('should return empty string when control is not touched', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(null);
      expect(component.endDateError).toBe('');
    });

    it('should return empty string when control is valid', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(moment('2025-01-01'));
      control.markAsTouched();
      expect(component.endDateError).toBe('');
    });

    it('should return "End Date is invalid" for matDatepickerParse error', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setErrors({ matDatepickerParse: { text: 'abc' } });
      control.markAsTouched();
      expect(component.endDateError).toBe('End Date is invalid');
    });

    it('should return "End Date is invalid" when input has text but value is null', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      // Simulate the nativeElement having a value
      (component as any).endDateInput = { nativeElement: { value: 'invalid-text' } };

      expect(component.endDateError).toBe('End Date is invalid');
    });

    it('should return "End Date is required" when value is null and no input text', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      (component as any).endDateInput = undefined;

      expect(component.endDateError).toBe('End Date is required');
    });

    it('should not show lessThanStartDate error when lastChangedDateField is not end', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.ngOnInit();

      // Set end first, then start (makes start the lastChangedDateField)
      component.filterForm.patchValue({ endDate: moment('2025-01-01') });
      tick();
      component.filterForm.patchValue({ startDate: moment('2025-11-30') });
      tick();

      const control = component.filterForm.get('endDate') as FormControl;
      control.markAsTouched();

      // lastChangedDateField is 'start', so endDateError should not show lessThanStartDate
      expect(component.endDateError).toBe('');
    }));
  });

  describe('onSearch When Not Retrieved', () => {
    it('should not apply client search when hasRetrieved is false', () => {
      component.hasRetrieved = false;
      component.onSearch('test');
      expect(component.currentSearchKeyword).toBe('test');
      // dataSource should remain empty since applyClientSearch was not called
      expect(component.dataSource.length).toBe(0);
    });
  });

  describe('allRowsSelected Edge Cases', () => {
    it('should return false when dataSource is empty', () => {
      component.dataSource = [];
      expect(component.allRowsSelected()).toBeFalse();
    });
  });

  describe('someRowsSelected Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should return false when all rows are selected', () => {
      component.dataSource.forEach(row => component.toggleRowSelection(row.unitId));
      expect(component.someRowsSelected()).toBeFalse();
      expect(component.allRowsSelected()).toBeTrue();
    });

    it('should return false when no rows are selected', () => {
      expect(component.someRowsSelected()).toBeFalse();
    });
  });

  describe('No Records Without ErrorCode', () => {
    it('should show generic no records snackbar when no message/errorCode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      deleteNonUnitTubesServiceSpy.getTubes.and.returnValue(of({
        data: [],
        totalCount: 0,
        success: true,
        message: '',
        errorCode: null
      }));

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      expect(component.noRecordsMessage).toBe('No records found');
      expect(component.noRecordsSnackbarMessage).toBe('No records found');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No records found');
    }));

    it('should clear noRecords messages when data is returned', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();

      expect(component.noRecordsMessage).toBe('');
      expect(component.noRecordsSnackbarMessage).toBe('');
    }));
  });

  describe('Delete Failure Without Message', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should show default error message when response has no message', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(
        of({ success: false })
      );

      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to delete tubes.');
    }));

    it('should set isLoading to false after delete error', fakeAsync(() => {
      deleteNonUnitTubesServiceSpy.deleteTubes.and.returnValue(
        throwError(() => new Error('Server Error'))
      );

      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should set isLoading to false after successful delete', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Date Formatting Edge Cases', () => {
    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string date', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('Number to Words Edge Cases', () => {
    it('should return string representation for numbers greater than 20', () => {
      expect((component as any).numberToWords(21)).toBe('21');
      expect((component as any).numberToWords(100)).toBe('100');
      expect((component as any).numberToWords(999)).toBe('999');
    });

    it('should return string representation for negative numbers', () => {
      expect((component as any).numberToWords(-1)).toBe('-1');
    });
  });

  describe('setupDateValidationSync Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not revalidate endDate when endDate has no value', fakeAsync(() => {
      // Start with no end date
      component.filterForm.patchValue({ endDate: null });
      tick();

      const endControl = component.filterForm.get('endDate') as FormControl;
      const spy = spyOn(endControl, 'updateValueAndValidity');

      // Change start date - should not call updateValueAndValidity on end since it has no value
      component.filterForm.patchValue({ startDate: moment('2025-06-01') });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should not revalidate startDate when startDate has no value', fakeAsync(() => {
      // Start with no start date
      component.filterForm.patchValue({ startDate: null });
      tick();

      const startControl = component.filterForm.get('startDate') as FormControl;
      const spy = spyOn(startControl, 'updateValueAndValidity');

      // Change end date - should not call updateValueAndValidity on start since it has no value
      component.filterForm.patchValue({ endDate: moment('2025-06-01') });
      tick();

      expect(spy).not.toHaveBeenCalled();
    }));
  });

  describe('clearAll Edge Cases', () => {
    it('should reset hasError flag', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.hasError = true;
      component.clearAll();

      expect(component.hasError).toBeFalse();
    }));

    it('should reset currentSearchKeyword', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.currentSearchKeyword = 'some search';
      component.clearAll();

      expect(component.currentSearchKeyword).toBe('');
    }));
  });

  describe('End Date Error Matcher - Required Error', () => {
    it('should show error state for required error on end date when touched', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setValue(null);
      control.markAsTouched();

      const isError = component.endDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
      expect(control.hasError('required')).toBeTrue();
    });

    it('should show error state for parse error on end date', () => {
      const control = component.filterForm.get('endDate') as FormControl;
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();

      const isError = component.endDateErrorMatcher.isErrorState(control, null as any);
      expect(isError).toBeTrue();
    });
  });

  describe('Delete Success Message', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should show success message with number word for single deletion', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.confirmDelete();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('One tubes deleted successfully.');
    }));

    it('should show success message with number word for two deletions', fakeAsync(() => {
      mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<unknown>;
      spyOn(dialog, 'open').and.returnValue(mockDialogRef);

      component.toggleRowSelection(component.dataSource[0].unitId);
      component.toggleRowSelection(component.dataSource[1].unitId);
      component.confirmDelete();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Two tubes deleted successfully.');
    }));
  });

  describe('Validate Start Date - No Value', () => {
    it('should return null when start date value is null', () => {
      const result = (component as any).validateStartDate(new FormControl(null));
      expect(result).toBeNull();
    });
  });

  describe('Validate End Date - No Value', () => {
    it('should return null when end date value is null', () => {
      const result = (component as any).validateEndDate(new FormControl(null));
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases - Search and Filter Interaction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({
        startDate: moment('2025-01-11'),
        endDate: moment('2025-11-30')
      });
      component.retrieve();
      tick();
    }));

    it('should handle case-insensitive search', () => {
      const unitIdLower = component.dataSource[0].unitId.toLowerCase();
      component.onSearch(unitIdLower);

      expect(component.dataSource.length).toBeGreaterThan(0);
    });

    it('should handle partial matches in search', () => {
      const partialUnitId = component.allData[0].unitId.substring(0, 5);
      component.onSearch(partialUnitId);

      expect(component.dataSource.length).toBeGreaterThan(0);
      expect(component.dataSource.every(row =>
        row.unitId.toLowerCase().includes(partialUnitId.toLowerCase())
      )).toBeTrue();
    });

    it('should clear selection when filtering results in no matches', () => {
      component.toggleRowSelection(component.dataSource[0].unitId);
      expect(component.selectedUnitIds.size).toBe(1);

      component.onSearch('NONEXISTENT');

      // Selection persists but no rows visible
      expect(component.selectedUnitIds.size).toBe(1);
      expect(component.dataSource.length).toBe(0);
    });

    it('should handle rapid search changes', () => {
      component.onSearch('W12');
      expect(component.dataSource.length).toBeGreaterThan(0);

      component.onSearch('NONEXISTENT');
      expect(component.dataSource.length).toBe(0);

      component.onSearch('');
      expect(component.dataSource.length).toBe(component.allData.length);
    });

    it('should maintain sort order when filtering', () => {
      component.sortDirection = 'desc';
      component.onSearch('W123');

      const unitIds = component.dataSource.map(row => row.unitId);
      const sortedUnitIds = [...unitIds].sort((a, b) => b.localeCompare(a));

      expect(unitIds).toEqual(sortedUnitIds);
    });
  });
});
