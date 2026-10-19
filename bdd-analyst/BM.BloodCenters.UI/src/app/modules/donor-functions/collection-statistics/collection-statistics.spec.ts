import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';

import { CollectionStatistics } from './collection-statistics';
import { CollectionStatisticsService } from '@shared/services/collection-statistics.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { SnackbarService } from '@shared/services/snackbar.service';

const mockDonationTypes = [
  { code: 'WB', description: 'Whole Blood' },
  { code: 'PLT', description: 'Platelet' },
];

const mockProcedureCodes = [
  { code: 'P001', description: 'Standard Draw' },
  { code: 'P002', description: 'Apheresis' },
];

const mockDailyStatistics = [
  { collectionDate: '2026-05-10T00:00:00', collectionDay: 'SUN', actualDraw: 95, actualDeferral: 3 },
  { collectionDate: '2026-05-11T00:00:00', collectionDay: 'MON', actualDraw: 48, actualDeferral: 1 },
];

const mockReport = {
  fromDate: '2026-05-10T00:00:00',
  toDate: '2026-05-11T00:00:00',
  totalDraws: 143,
  totalDeferrals: 4,
  totalProcedures: 0,
  dailyStatistics: mockDailyStatistics,
  procedureStatistics: [],
};

const mockDateDetail = {
  totalVeniCount: 2,
  totalDeferralCount: 1,
  venipunctureStatistics: [{ veniCode: 'V1', veniDesc: 'Left Arm', veniCount: 2 }],
  deferralStatistics: [{ interCode: 'D1', originatedFrom: 'Pre', description: 'Low Iron', defCount: 1 }],
};

const mockUnits = [
  {
    unitId: 'U001', displayUnitId: 'U001', donationType: 'WB', procedureCode: 'P001',
    attrib01: 'Y', attrib02: null, attrib03: null, attrib04: null,
    attrib05: null, attrib06: null, attrib07: null, attrib08: null,
  },
];

describe('CollectionStatistics', () => {
  let component: CollectionStatistics;
  let fixture: ComponentFixture<CollectionStatistics>;
  let serviceSpy: jasmine.SpyObj<CollectionStatisticsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CollectionStatistics>>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('CollectionStatisticsService', [
      'loadLovs', 'getReport', 'getDateDetail', 'getUnits',
    ]);
    snackBarSpy = createMockMatSnackBar();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.loadLovs.and.returnValue(of({ donationTypes: mockDonationTypes, procedureCodes: mockProcedureCodes }));
    serviceSpy.getReport.and.returnValue(of(mockReport));
    serviceSpy.getDateDetail.and.returnValue(of(mockDateDetail));
    serviceSpy.getUnits.and.returnValue(of(mockUnits));



      TestBed.configureTestingModule({
      imports: [CollectionStatistics, NoopAnimationsModule],
      providers: [
        { provide: CollectionStatisticsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    });


    


      serviceSpy.loadLovs.calls.reset();


      serviceSpy.getReport.calls.reset();


      serviceSpy.getDateDetail.calls.reset();


      serviceSpy.getUnits.calls.reset();


      dialogRefSpy.close.calls.reset();


      serviceSpy.loadLovs.and.returnValue(of({ donationTypes: mockDonationTypes, procedureCodes: mockProcedureCodes }));


      serviceSpy.getReport.and.returnValue(of(mockReport));


      serviceSpy.getDateDetail.and.returnValue(of(mockDateDetail));


      serviceSpy.getUnits.and.returnValue(of(mockUnits));


    fixture = TestBed.createComponent(CollectionStatistics);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should initialize form with option A and empty dates', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('option')?.value).toBe('A');
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.filterForm.get('procedureCode')?.value).toEqual([]);
      expect(component.filterForm.get('donationType')?.value).toEqual([]);
    });

    it('should load LOVs on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.loadLovs).toHaveBeenCalled();
      expect(component.donationTypes).toEqual(mockDonationTypes);
      expect(component.procedureCodes).toEqual(mockProcedureCodes);
    }));

  });

  describe('Form Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should be invalid when dates are missing', () => {
      expect(component.filterForm.invalid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be valid when option and both dates are set', () => {
      component.filterForm.patchValue({ fromDate: moment('2026-05-01'), toDate: moment('2026-05-31') });
      expect(component.filterForm.valid).toBeTrue();
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should have date range error when to date is before from date', () => {
      component.filterForm.patchValue({ fromDate: moment('2026-05-31'), toDate: moment('2026-05-01') });
      fixture.detectChanges();
      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('Data Retrieval', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ fromDate: moment('2026-05-10'), toDate: moment('2026-05-11') });
    });


    it('should call getReport and load daily statistics', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getReport).toHaveBeenCalled();
      expect(component.dailyStatistics.length).toBe(2);
      expect(component.totalDraws).toBe(143);
      expect(component.totalDeferrals).toBe(4);
      expect(component.hasData).toBeTrue();
    }));

    it('should auto-select first row and load detail after retrieve', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getDateDetail).toHaveBeenCalled();
      expect(serviceSpy.getUnits).toHaveBeenCalled();
      expect(component.selectedRow).toEqual(mockDailyStatistics[0]);
      expect(component.venipunctureStatistics.length).toBe(1);
      expect(component.unitRows.length).toBe(1);
    }));
  });

  describe('Row Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ fromDate: moment('2026-05-10'), toDate: moment('2026-05-11') });
      component.onRetrieve();
      tick();
    }));

    it('should not reload detail when same row selected', fakeAsync(() => {
      const callCount = serviceSpy.getDateDetail.calls.count();
      component.onDailyRowClick(mockDailyStatistics[0]);
      tick();
      expect(serviceSpy.getDateDetail.calls.count()).toBe(callCount);
    }));

    it('should load detail for new row', fakeAsync(() => {
      component.onDailyRowClick(mockDailyStatistics[1]);
      tick();
      expect(component.selectedRow).toEqual(mockDailyStatistics[1]);
    }));

    it('isRowSelected should return true for selected row', () => {
      expect(component.selectedRow?.collectionDate).toBe(mockDailyStatistics[0].collectionDate);
    });
  });

  describe('Clear', () => {
    it('should reset form and clear data on onClear', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ fromDate: moment('2026-05-10'), toDate: moment('2026-05-11') });
      component.onRetrieve();
      tick();

      component.onClear();
      expect(component.hasData).toBeFalse();
      expect(component.dailyStatistics.length).toBe(0);
      expect(component.selectedRow).toBeNull();
      expect(component.filterForm.get('option')?.value).toBe('A');
    }));
  });

  describe('Date Formatting', () => {
    it('should format ISO date as DD-MMM-YYYY', () => {
      expect(component.formatDisplayDate('2026-05-10T00:00:00')).toBe('10-MAY-2026');
    });


  });

  describe('ngOnDestroy', () => {
    it('should clear dateBlurTimer and complete destroy$', fakeAsync(() => {
      fixture.detectChanges();
      const mockInput = { value: 'invalid' } as HTMLInputElement;
      component.onDateBlur('fromDate', mockInput);
      component.ngOnDestroy();
      tick(1000);
      expect(component.filterForm.get('fromDate')?.hasError('invalidDateFormat')).toBeFalse();
    }));

    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      fixture.detectChanges();
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('selectedProcedureCodeDescription', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return "-" when no codes selected', () => {
      component.filterForm.get('procedureCode')?.setValue([]);
      expect(component.selectedProcedureCodeDescription).toBe('-');
    });

    it('should return description for single code', () => {
      component.filterForm.get('procedureCode')?.setValue(['P001']);
      expect(component.selectedProcedureCodeDescription).toBe('Standard Draw');
    });

    it('should return count for multiple codes', () => {
      component.filterForm.get('procedureCode')?.setValue(['P001', 'P002']);
      expect(component.selectedProcedureCodeDescription).toBe('2 selected');
    });

    it('should return "-" when single code is not found in lookup', () => {
      component.filterForm.get('procedureCode')?.setValue(['UNKNOWN']);
      expect(component.selectedProcedureCodeDescription).toBe('-');
    });
  });

  describe('selectedDonationTypeDescription', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return "-" when no codes selected', () => {
      component.filterForm.get('donationType')?.setValue([]);
      expect(component.selectedDonationTypeDescription).toBe('-');
    });

    it('should return description for single code', () => {
      component.filterForm.get('donationType')?.setValue(['WB']);
      expect(component.selectedDonationTypeDescription).toBe('Whole Blood');
    });

    it('should return count for multiple codes', () => {
      component.filterForm.get('donationType')?.setValue(['WB', 'PLT']);
      expect(component.selectedDonationTypeDescription).toBe('2 selected');
    });

    it('should return "-" when single code is not found in lookup', () => {
      component.filterForm.get('donationType')?.setValue(['UNKNOWN']);
      expect(component.selectedDonationTypeDescription).toBe('-');
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should return true when isLoadingData is true even if form is valid', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ fromDate: moment('2026-05-01'), toDate: moment('2026-05-31') });
      component.isLoadingData = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('formatDay', () => {
    it('should return full day names for all abbreviations', () => {
      expect(component.formatDay('MON')).toBe('Monday');
      expect(component.formatDay('TUE')).toBe('Tuesday');
      expect(component.formatDay('WED')).toBe('Wednesday');
      expect(component.formatDay('THU')).toBe('Thursday');
      expect(component.formatDay('FRI')).toBe('Friday');
      expect(component.formatDay('SAT')).toBe('Saturday');
      expect(component.formatDay('SUN')).toBe('Sunday');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatDay('')).toBe('');
    });

    it('should return the original value for unknown abbreviation', () => {
      expect(component.formatDay('XYZ')).toBe('XYZ');
    });

    it('should handle lowercase input', () => {
      expect(component.formatDay('mon')).toBe('Monday');
    });
  });

  describe('onDateBlur', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set invalidDateFormat error when input has value but control is null', fakeAsync(() => {
      const mockInput = { value: 'invalid-date' } as HTMLInputElement;
      component.filterForm.get('fromDate')?.setValue(null);
      component.onDateBlur('fromDate', mockInput);
      tick(100);
      expect(component.filterForm.get('fromDate')?.hasError('invalidDateFormat')).toBeTrue();
    }));

    it('should not set error when input value is empty', fakeAsync(() => {
      const mockInput = { value: '' } as HTMLInputElement;
      component.onDateBlur('fromDate', mockInput);
      tick(100);
      expect(component.filterForm.get('fromDate')?.hasError('invalidDateFormat')).toBeFalse();
    }));

    it('should clear previous timer on consecutive calls', fakeAsync(() => {
      const mockInput1 = { value: 'bad1' } as HTMLInputElement;
      const mockInput2 = { value: '' } as HTMLInputElement;
      component.filterForm.get('fromDate')?.setValue(null);
      component.onDateBlur('fromDate', mockInput1);
      component.onDateBlur('fromDate', mockInput2);
      tick(100);
      expect(component.filterForm.get('fromDate')?.hasError('invalidDateFormat')).toBeFalse();
    }));
  });

  describe('getFromDateError and getToDateError', () => {
    beforeEach(() => fixture.detectChanges());

    it('getFromDateError should return required message when touched and empty', () => {
      component.filterForm.get('fromDate')?.markAsTouched();
      expect(component.getFromDateError()).toBe('From Date is required');
    });

    it('getToDateError should return required message when touched and empty', () => {
      component.filterForm.get('toDate')?.markAsTouched();
      expect(component.getToDateError()).toBe('To Date is required');
    });

    it('getFromDateError should return invalid message for invalidDateFormat', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setErrors({ invalidDateFormat: true });
      ctrl.markAsTouched();
      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('getToDateError should return range error when dates are inverted', () => {
      component.filterForm.patchValue({
        fromDate: moment('2026-05-31'),
        toDate: moment('2026-05-01'),
      });
      component.filterForm.get('toDate')?.markAsTouched();
      expect(component.getToDateError()).toBe('To Date must be on or after From Date');
    });

    it('getFromDateError should return empty string when control is untouched', () => {
      expect(component.getFromDateError()).toBe('');
    });
  });

  describe('Search Subscriptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter procedure codes by code', () => {
      component.procCodeSearchControl.setValue('P002');
      expect(component.filteredProcedureCodes.length).toBe(1);
      expect(component.filteredProcedureCodes[0].code).toBe('P002');
    });

    it('should filter procedure codes by description', () => {
      component.procCodeSearchControl.setValue('apher');
      expect(component.filteredProcedureCodes.length).toBe(1);
      expect(component.filteredProcedureCodes[0].code).toBe('P002');
    });

    it('should show all procedure codes when search is cleared', () => {
      component.procCodeSearchControl.setValue('standard');
      component.procCodeSearchControl.setValue('');
      expect(component.filteredProcedureCodes.length).toBe(2);
    });

    it('should filter donation types by code', () => {
      component.donTypeSearchControl.setValue('PLT');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('PLT');
    });

    it('should filter donation types by description', () => {
      component.donTypeSearchControl.setValue('whole');
      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('WB');
    });

    it('should show all donation types when search is cleared', () => {
      component.donTypeSearchControl.setValue('PLT');
      component.donTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes.length).toBe(2);
    });
  });

  describe('loadRowDetail error handling', () => {
    it('should set isLoadingDetail to false on error', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
      });
      component.onRetrieve();
      tick();

      serviceSpy.getDateDetail.and.returnValue(throwError(() => new Error('detail error')));
      component.onDailyRowClick(mockDailyStatistics[1]);
      tick();
      expect(component.isLoadingDetail).toBeFalse();
    }));
  });

  describe('loadLovs error handling', () => {
    it('should set isLoadingLovs to false and enable controls on error', fakeAsync(() => {
      serviceSpy.loadLovs.and.returnValue(throwError(() => new Error('LOV error')));
      const errorFixture = TestBed.createComponent(CollectionStatistics);
      const errorComponent = errorFixture.componentInstance;
      errorFixture.detectChanges();
      tick();

      expect(errorComponent.isLoadingLovs).toBeFalse();
      expect(errorComponent.filterForm.get('procedureCode')?.enabled).toBeTrue();
      expect(errorComponent.filterForm.get('donationType')?.enabled).toBeTrue();
      errorFixture.destroy();
    }));
  });

  describe('formatDateForApi', () => {
    beforeEach(() => fixture.detectChanges());

    it('should format a moment object', () => {
      const result = (component as any).formatDateForApi(moment('2026-05-10'));
      expect(result).toBe('2026-05-10T00:00:00');
    });

    it('should format a Date object', () => {
      const result = (component as any).formatDateForApi(new Date(2026, 4, 10));
      expect(result).toBe('2026-05-10T00:00:00');
    });

    it('should return empty string for null', () => {
      expect((component as any).formatDateForApi(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect((component as any).formatDateForApi(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect((component as any).formatDateForApi('')).toBe('');
    });
  });

  describe('getErrorMessage', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return nested errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'nested error' } } };
      expect((component as any).getErrorMessage(error, 'fallback')).toBe('nested error');
    });

    it('should return error.message when no errorResponse', () => {
      const error = { error: { message: 'error msg' } };
      expect((component as any).getErrorMessage(error, 'fallback')).toBe('error msg');
    });

    it('should return top-level message when no nested error', () => {
      const error = { message: 'top level' };
      expect((component as any).getErrorMessage(error, 'fallback')).toBe('top level');
    });

    it('should return fallback when no message found', () => {
      expect((component as any).getErrorMessage({}, 'fallback')).toBe('fallback');
    });

    it('should return fallback for null error', () => {
      expect((component as any).getErrorMessage(null, 'fallback')).toBe('fallback');
    });
  });

  describe('showError', () => {
    it('should call snackbarService.showError which opens a snackbar', () => {
      fixture.detectChanges();
      const mockRef = { onAction: () => of(undefined), dismiss: jasmine.createSpy('dismiss') };
      snackBarSpy.open.and.returnValue(mockRef as any);
      (component as any).showError('test error');
      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(snackBarSpy.open.calls.mostRecent().args[0]).toBe('test error');
    });
  });

  describe('onRetrieve with filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
        donationType: ['WB', 'PLT'],
        procedureCode: ['P001'],
      });
    });

    it('should pass donationType and procedureCode filters to service', fakeAsync(() => {
      component.onRetrieve();
      tick();
      const callArgs = serviceSpy.getReport.calls.mostRecent().args[0];
      expect(callArgs.donationTypes).toBe('WB,PLT');
      expect(callArgs.procedureCodes).toBe('P001');
    }));

    it('should not pass undefined filters when arrays are empty', fakeAsync(() => {
      component.filterForm.patchValue({ donationType: [], procedureCode: [] });
      component.onRetrieve();
      tick();
      const callArgs = serviceSpy.getReport.calls.mostRecent().args[0];
      expect(callArgs.donationTypes).toBeUndefined();
      expect(callArgs.procedureCodes).toBeUndefined();
    }));
  });

  describe('onRetrieve error handling', () => {
    it('should show error and stop loading on retrieve error', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
      });
      serviceSpy.getReport.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );
      const svc = (component as any).snackbarService;
      spyOn(svc, 'showError').and.stub();

      component.onRetrieve();
      tick();

      expect(component.isLoadingData).toBeFalse();
      expect(svc.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should not call getReport when form is invalid', () => {
      fixture.detectChanges();
      component.onRetrieve();
      expect(serviceSpy.getReport).not.toHaveBeenCalled();
    });

    it('should not call getReport when isLoadingData is true', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
      });
      component.isLoadingData = true;
      component.onRetrieve();
      expect(serviceSpy.getReport).not.toHaveBeenCalled();
    });
  });

  describe('fromDate value change auto-setting toDate', () => {
    it('should auto-set toDate when fromDate is set and toDate is empty', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.get('fromDate')?.setValue(moment('2026-05-10'));
      tick();
      const toDate = component.filterForm.get('toDate')?.value;
      expect(toDate).toBeTruthy();
      expect(toDate.format('YYYY-MM-DD')).toBe('2026-05-16');
    }));

    it('should not overwrite existing toDate', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.get('toDate')?.setValue(moment('2026-06-01'));
      component.filterForm.get('fromDate')?.setValue(moment('2026-05-10'));
      tick();
      const toDate = component.filterForm.get('toDate')?.value;
      expect(toDate.format('YYYY-MM-DD')).toBe('2026-06-01');
    }));
  });

  describe('formatDisplayDate edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatDisplayDate('')).toBe('');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatDisplayDate('not-a-date')).toBe('not-a-date');
    });

    it('should return empty string for null-like input', () => {
      expect(component.formatDisplayDate(null as any)).toBe('');
    });
  });

  describe('onRetrieve with empty report data', () => {
    it('should handle empty dailyStatistics without auto-selecting row', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
      });
      serviceSpy.getReport.and.returnValue(
        of({ dailyStatistics: [], totalDraws: 0, totalDeferrals: 0 }),
      );

      const detailCallsBefore = serviceSpy.getDateDetail.calls.count();
      component.onRetrieve();
      tick();

      expect(component.dailyStatistics.length).toBe(0);
      expect(serviceSpy.getDateDetail.calls.count()).toBe(detailCallsBefore);
      expect(component.hasData).toBeTrue();
    }));
  });

  describe('loadRowDetail with filters', () => {
    it('should pass filters to getDateDetail', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({
        fromDate: moment('2026-05-10'),
        toDate: moment('2026-05-11'),
        donationType: ['WB'],
        procedureCode: ['P001', 'P002'],
      });
      component.onRetrieve();
      tick();

      const callArgs = serviceSpy.getDateDetail.calls.mostRecent().args[0];
      expect(callArgs.donationTypes).toBe('WB');
      expect(callArgs.procedureCodes).toBe('P001,P002');
    }));
  });

  describe('isRowSelected behavior', () => {
    it('should have no selectedRow before retrieve', () => {
      fixture.detectChanges();
      expect(component.selectedRow).toBeNull();
    });
  });
});
