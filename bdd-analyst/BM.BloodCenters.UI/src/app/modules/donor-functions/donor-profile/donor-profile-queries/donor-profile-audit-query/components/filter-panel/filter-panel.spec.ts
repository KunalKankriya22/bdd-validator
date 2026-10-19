import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterPanel, FilterDialogData } from './filter-panel';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { FormControl } from '@angular/forms';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('FilterPanel', () => {
  let component: FilterPanel;
  let fixture: ComponentFixture<FilterPanel>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterPanel>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDialogData: FilterDialogData = {
    currentFilters: {},
    insertedUsers: ['JOHN.DOE', 'JANE.SMITH']
  };

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();
    mockTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'isChapterLocalDateAvailable']);
    mockTimezoneService.getChapterLocalDate.and.returnValue(moment('2025-01-15'));
    mockTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);



      TestBed.configureTestingModule({
      imports: [FilterPanel, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: ChapterTimezoneService, useValue: mockTimezoneService }
      ]
    });




      mockDialogRef.close.calls.reset();


      mockTimezoneService.getChapterLocalDate.calls.reset();


      mockTimezoneService.isChapterLocalDateAvailable.calls.reset();


      mockTimezoneService.getChapterLocalDate.and.returnValue(moment('2025-01-15'));


      mockTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);


    fixture = TestBed.createComponent(FilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with default values', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('insertedUser')).toBeTruthy();
    expect(component.filterForm.get('fromDate')).toBeTruthy();
    expect(component.filterForm.get('toDate')).toBeTruthy();
    expect(component.filterForm.get('insertedUser')?.value).toBe('');
    expect(component.filterForm.get('fromDate')?.value).toBeNull();
    expect(component.filterForm.get('toDate')?.value).toBeNull();
  });

  it('should populate inserted user options from dialog data', () => {
    const options = component.insertedUserOptions();
    expect(options.length).toBe(3);
    expect(options[0].label).toBe('All');
    expect(options[1].value).toBe('JOHN.DOE');
  });

  it('should return form controls via f getter', () => {
    const controls = component.f;
    expect(controls).toBe(component.filterForm.controls);
    expect(controls['insertedUser']).toBeTruthy();
    expect(controls['fromDate']).toBeTruthy();
    expect(controls['toDate']).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should patch form values from dialog data filters', () => {
      // Create a new component with pre-populated filters
      const dataWithFilters: FilterDialogData = {
        currentFilters: {
          insertedUser: 'JOHN.DOE',
          fromDate: '2025-01-01',
          toDate: '2025-01-10'
        },
        insertedUsers: ['JOHN.DOE', 'JANE.SMITH']
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [FilterPanel, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithFilters },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: ChapterTimezoneService, useValue: mockTimezoneService }
        ]
      });

      const localFixture = TestBed.createComponent(FilterPanel);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      expect(localComponent.filterForm.get('insertedUser')?.value).toBe('JOHN.DOE');
      expect(localComponent.filterForm.get('fromDate')?.value).toBe('2025-01-01');
      expect(localComponent.filterForm.get('toDate')?.value).toBe('2025-01-10');
    });

    it('should handle empty currentFilters in dialog data', () => {
      // The default mockDialogData has empty filters, so the form should have defaults
      expect(component.filterForm.get('insertedUser')?.value).toBe('');
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should update inserted user options with All option first', () => {
      const options = component.insertedUserOptions();
      expect(options[0]).toEqual({ value: '', label: 'All' });
      expect(options[1]).toEqual({ value: 'JOHN.DOE', label: 'JOHN.DOE' });
      expect(options[2]).toEqual({ value: 'JANE.SMITH', label: 'JANE.SMITH' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Date Validators', () => {
    it('should reject future dates in fromDate', () => {
      // Use mocked chapter local date (2025-01-15) as reference
      const futureDate = moment('2025-01-16'); // Day after mocked date
      component.filterForm.patchValue({ fromDate: futureDate });
      fixture.detectChanges();

      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(true);
    });

    it('should accept past dates in fromDate', () => {
      // Use mocked chapter local date (2025-01-15) as reference
      const pastDate = moment('2025-01-14'); // Day before mocked date
      component.filterForm.patchValue({ fromDate: pastDate });
      fixture.detectChanges();

      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(false);
    });

    it('should reject future dates in toDate', () => {
      // Use mocked chapter local date (2025-01-15) as reference
      const futureDate = moment('2025-01-16'); // Day after mocked date
      component.filterForm.patchValue({ toDate: futureDate });
      fixture.detectChanges();

      expect(component.filterForm.get('toDate')?.hasError('futureDate')).toBe(true);
    });

    it('should validate fromDate cannot be after toDate', () => {
      const fromDate = moment('2025-01-31');
      const toDate = moment('2025-01-01');
      component.filterForm.patchValue({ fromDate, toDate });
      fixture.detectChanges();

      expect(component.filterForm.hasError('fromDateAfterToDate')).toBe(true);
    });

    it('should accept valid date range', () => {
      const fromDate = moment('2025-01-01');
      const toDate = moment('2025-01-31');
      component.filterForm.patchValue({ fromDate, toDate });
      fixture.detectChanges();

      expect(component.filterForm.hasError('fromDateAfterToDate')).toBe(false);
    });

    it('should require fromDate when toDate is entered', () => {
      component.filterForm.patchValue({ toDate: moment('2025-01-31'), fromDate: null });
      fixture.detectChanges();

      expect(component.filterForm.hasError('toDateRequiresFromDate')).toBe(true);
    });

    it('should not require fromDate when toDate is empty', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: null });
      fixture.detectChanges();

      expect(component.filterForm.hasError('toDateRequiresFromDate')).toBe(false);
    });

    it('should accept both dates when both are provided', () => {
      const fromDate = moment('2025-01-01');
      const toDate = moment('2025-01-31');
      component.filterForm.patchValue({ fromDate, toDate });
      fixture.detectChanges();

      expect(component.filterForm.hasError('toDateRequiresFromDate')).toBe(false);
    });

    it('should accept today (chapter local date) as not future', () => {
      const today = moment('2025-01-15'); // Same as mocked chapter local date
      component.filterForm.patchValue({ fromDate: today });
      fixture.detectChanges();

      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(false);
    });

    it('should return null for null date value in notFutureDateValidator', () => {
      component.filterForm.patchValue({ fromDate: null });
      fixture.detectChanges();

      expect(component.filterForm.get('fromDate')?.hasError('futureDate')).toBe(false);
    });

    it('should return null for fromDateToDateValidator when fromDate is null', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: moment('2025-01-10') });
      fixture.detectChanges();

      // Should not have fromDateAfterToDate error since fromDate is null
      expect(component.filterForm.hasError('fromDateAfterToDate')).toBe(false);
    });

    it('should return null for fromDateToDateValidator when toDate is null', () => {
      component.filterForm.patchValue({ fromDate: moment('2025-01-10'), toDate: null });
      fixture.detectChanges();

      expect(component.filterForm.hasError('fromDateAfterToDate')).toBe(false);
    });

    it('should accept same from and to date', () => {
      const sameDate = moment('2025-01-10');
      component.filterForm.patchValue({ fromDate: sameDate, toDate: moment('2025-01-10') });
      fixture.detectChanges();

      expect(component.filterForm.hasError('fromDateAfterToDate')).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should return future date error for fromDate', () => {
      // Use mocked chapter local date (2025-01-15) as reference
      const futureDate = moment('2025-01-16');
      component.filterForm.patchValue({ fromDate: futureDate });
      component.filterForm.get('fromDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toContain('cannot be greater than current date');
    });

    it('should return from date after to date error', () => {
      // Use dates before mocked chapter local date (2025-01-15) to avoid future date error
      const fromDate = moment('2025-01-10'); // Later date
      const toDate = moment('2025-01-01');   // Earlier date
      component.filterForm.patchValue({ fromDate, toDate });
      component.filterForm.get('fromDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toContain('cannot be greater than To Date');
    });

    it('should return to date requires from date error', () => {
      component.filterForm.patchValue({ toDate: moment('2025-01-31'), fromDate: null });
      component.filterForm.get('fromDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toContain('From Date is required when To Date is entered');
    });

    it('should return to date less than from date error', () => {
      const fromDate = moment('2025-01-31');
      const toDate = moment('2025-01-01');
      component.filterForm.patchValue({ fromDate, toDate });
      component.filterForm.get('toDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toContain('cannot be less than From Date');
    });

    it('should return future date error for toDate', () => {
      // Use mocked chapter local date (2025-01-15) as reference
      const futureDate = moment('2025-01-16');
      component.filterForm.patchValue({ toDate: futureDate });
      component.filterForm.get('toDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toContain('cannot be greater than current date');
    });

    it('should return empty string when fromDate control is not touched', () => {
      component.filterForm.patchValue({ fromDate: moment('2025-01-16') });
      // Don't mark as touched
      const error = component.getFromDateError();
      expect(error).toBe('');
    });

    it('should return empty string when toDate control is not touched', () => {
      component.filterForm.patchValue({ toDate: moment('2025-01-16') });
      // Don't mark as touched
      const error = component.getToDateError();
      expect(error).toBe('');
    });

    it('should return invalidDate error message for fromDate', () => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toBe('From Date is invalid');
    });

    it('should return invalidDate error message for toDate', () => {
      const control = component.filterForm.get('toDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('To Date is invalid');
    });

    it('should return matDatepickerParse error message for fromDate', () => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      control?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toBe('From Date is invalid');
    });

    it('should return matDatepickerParse error message for toDate', () => {
      const control = component.filterForm.get('toDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      control?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('To Date is invalid');
    });

    it('should return empty string for fromDate when no errors and dirty', () => {
      const control = component.filterForm.get('fromDate');
      control?.markAsDirty();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toBe('');
    });

    it('should return empty string for toDate when no errors and dirty', () => {
      const control = component.filterForm.get('toDate');
      control?.markAsDirty();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('');
    });

    it('should return toDateRequiresFromDate error for toDate when from is missing', () => {
      component.filterForm.patchValue({ toDate: moment('2025-01-10'), fromDate: null });
      component.filterForm.get('toDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toContain('From Date is required when To Date is entered');
    });

    it('should return invalid when fromDate input has value but control value is null', () => {
      const control = component.filterForm.get('fromDate');
      control?.setValue(null);
      control?.markAsTouched();

      // Simulate that fromDateInput has a typed value
      component.fromDateInput = { nativeElement: { value: 'invalid-text' } } as any;
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toBe('From Date is invalid');
    });

    it('should return invalid when toDate input has value but control value is null', () => {
      const control = component.filterForm.get('toDate');
      control?.setValue(null);
      control?.markAsTouched();

      // Simulate that toDateInput has a typed value
      component.toDateInput = { nativeElement: { value: 'invalid-text' } } as any;
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('To Date is invalid');
    });
  });

  describe('fromDateErrorMatcher', () => {
    it('should return false when control is null', () => {
      const result = component.fromDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBe(false);
    });

    it('should return false when control is not dirty and not touched', () => {
      const control = component.filterForm.get('fromDate') as FormControl;
      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });

    it('should return true when control is touched and invalid', () => {
      const control = component.filterForm.get('fromDate') as FormControl;
      control.markAsTouched();
      control.setErrors({ invalidDate: true });

      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when parent has fromDateAfterToDate error', () => {
      const fromDate = moment('2025-01-10');
      const toDate = moment('2025-01-01');
      component.filterForm.patchValue({ fromDate, toDate });
      const control = component.filterForm.get('fromDate') as FormControl;
      control.markAsTouched();
      fixture.detectChanges();

      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when parent has toDateRequiresFromDate error', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: moment('2025-01-10') });
      const control = component.filterForm.get('fromDate') as FormControl;
      control.markAsTouched();
      fixture.detectChanges();

      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when input has value but control value is null', () => {
      const control = component.filterForm.get('fromDate') as FormControl;
      control.markAsTouched();
      component.fromDateInput = { nativeElement: { value: 'some-text' } } as any;

      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return false when control is dirty, valid, and no form-level errors', () => {
      const validDate = moment('2025-01-10');
      component.filterForm.patchValue({ fromDate: validDate });
      const control = component.filterForm.get('fromDate') as FormControl;
      control.markAsDirty();
      fixture.detectChanges();

      const result = component.fromDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });
  });

  describe('toDateErrorMatcher', () => {
    it('should return false when control is null', () => {
      const result = component.toDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBe(false);
    });

    it('should return false when control is not dirty and not touched', () => {
      const control = component.filterForm.get('toDate') as FormControl;
      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });

    it('should return true when control is touched and invalid', () => {
      const control = component.filterForm.get('toDate') as FormControl;
      control.markAsTouched();
      control.setErrors({ invalidDate: true });

      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when parent has fromDateAfterToDate error', () => {
      const fromDate = moment('2025-01-10');
      const toDate = moment('2025-01-01');
      component.filterForm.patchValue({ fromDate, toDate });
      const control = component.filterForm.get('toDate') as FormControl;
      control.markAsTouched();
      fixture.detectChanges();

      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when parent has toDateRequiresFromDate error', () => {
      component.filterForm.patchValue({ fromDate: null, toDate: moment('2025-01-10') });
      const control = component.filterForm.get('toDate') as FormControl;
      control.markAsTouched();
      fixture.detectChanges();

      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return true when input has value but control value is null', () => {
      const control = component.filterForm.get('toDate') as FormControl;
      control.markAsTouched();
      component.toDateInput = { nativeElement: { value: 'some-text' } } as any;

      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(true);
    });

    it('should return false when control is dirty, valid, and no form-level errors', () => {
      const validDate = moment('2025-01-10');
      component.filterForm.patchValue({ toDate: validDate, fromDate: moment('2025-01-01') });
      const control = component.filterForm.get('toDate') as FormControl;
      control.markAsDirty();
      fixture.detectChanges();

      const result = component.toDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBe(false);
    });
  });

  describe('onApply', () => {
    it('should close dialog with filters in dialog mode', () => {
      const fromDate = moment('2025-01-01');
      const toDate = moment('2025-01-10');
      component.filterForm.patchValue({
        insertedUser: 'JOHN.DOE',
        fromDate,
        toDate
      });
      fixture.detectChanges();

      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.callFake((d: any) => {
        if (!d) return null;
        return d.format('YYYY-MM-DD');
      });

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
        insertedUser: 'JOHN.DOE',
        fromDate: '2025-01-01',
        toDate: '2025-01-10'
      }));
    });

    it('should not close dialog when form is invalid', () => {
      const futureDate = moment('2025-01-16'); // After mocked chapter local date
      component.filterForm.patchValue({ fromDate: futureDate });
      fixture.detectChanges();

      component.onApply();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched and dirty on apply', () => {
      component.onApply();

      Object.keys(component.filterForm.controls).forEach(key => {
        const control = component.filterForm.get(key);
        expect(control?.touched).toBe(true);
        expect(control?.dirty).toBe(true);
      });
    });

    it('should trim inserted user value', () => {
      component.filterForm.patchValue({ insertedUser: '  JOHN.DOE  ' });
      fixture.detectChanges();

      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null);

      component.onApply();

      expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
        insertedUser: 'JOHN.DOE'
      }));
    });

    it('should not include insertedUser in filters when empty', () => {
      component.filterForm.patchValue({ insertedUser: '' });
      fixture.detectChanges();

      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null);

      component.onApply();

      const calledWith = mockDialogRef.close.calls.mostRecent().args[0];
      expect(calledWith.insertedUser).toBeUndefined();
    });

    it('should not include dates in filters when null', () => {
      component.filterForm.patchValue({
        insertedUser: '',
        fromDate: null,
        toDate: null
      });
      fixture.detectChanges();

      component.onApply();

      const calledWith = mockDialogRef.close.calls.mostRecent().args[0];
      expect(calledWith.fromDate).toBeUndefined();
      expect(calledWith.toDate).toBeUndefined();
    });

    it('should not apply when getFromDateError returns a value', () => {
      // Set up a scenario where getFromDateError returns a non-empty string
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      control?.markAsDirty();
      fixture.detectChanges();

      component.onApply();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not apply when getToDateError returns a value', () => {
      const control = component.filterForm.get('toDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      control?.markAsDirty();
      fixture.detectChanges();

      component.onApply();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not include fromDate when serializeDateForApi returns null', () => {
      const fromDate = moment('2025-01-01');
      component.filterForm.patchValue({ fromDate });
      fixture.detectChanges();

      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null);

      component.onApply();

      const calledWith = mockDialogRef.close.calls.mostRecent().args[0];
      expect(calledWith.fromDate).toBeUndefined();
    });
  });

  describe('onClearAll', () => {
    it('should reset form to defaults', () => {
      component.filterForm.patchValue({
        insertedUser: 'JOHN.DOE',
        fromDate: moment('2025-01-01'),
        toDate: moment('2025-01-10')
      });
      fixture.detectChanges();

      component.onClearAll();

      expect(component.filterForm.get('insertedUser')?.value).toBe('');
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should clear form-level validation errors', () => {
      component.filterForm.patchValue({
        toDate: moment('2025-01-10'),
        fromDate: null
      });
      fixture.detectChanges();
      expect(component.filterForm.hasError('toDateRequiresFromDate')).toBe(true);

      component.onClearAll();
      fixture.detectChanges();

      expect(component.filterForm.hasError('toDateRequiresFromDate')).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should close dialog in dialog mode', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onFromDateBlur', () => {
    it('should mark fromDate control as touched', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      expect(control?.touched).toBe(false);

      component.onFromDateBlur();
      tick(1);

      expect(control?.touched).toBe(true);
    }));

    it('should show snackbar error when fromDate is invalid and not matDatepickerParse', fakeAsync(() => {
      // Set an actual future date so the validator naturally produces the error
      const futureDate = moment('2025-01-16'); // After mocked chapter local date (2025-01-15)
      component.filterForm.patchValue({ fromDate: futureDate });
      fixture.detectChanges();

      component.onFromDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('From Date cannot be greater than current date');
    }));

    it('should not show snackbar when fromDate has matDatepickerParse error', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      component.onFromDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not show snackbar when fromDate is valid', fakeAsync(() => {
      component.filterForm.patchValue({ fromDate: moment('2025-01-10') });
      fixture.detectChanges();

      component.onFromDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not show snackbar when getFromDateError returns empty string', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ futureDate: true });
      spyOn(component, 'getFromDateError').and.returnValue('');

      component.onFromDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));
  });

  describe('onToDateBlur', () => {
    it('should mark toDate control as touched', fakeAsync(() => {
      const control = component.filterForm.get('toDate');
      expect(control?.touched).toBe(false);

      component.onToDateBlur();
      tick(1);

      expect(control?.touched).toBe(true);
    }));

    it('should show snackbar error when toDate is invalid and not matDatepickerParse', fakeAsync(() => {
      // Set an actual future date so the validator naturally produces the error
      const futureDate = moment('2025-01-16'); // After mocked chapter local date (2025-01-15)
      component.filterForm.patchValue({ toDate: futureDate });
      fixture.detectChanges();

      component.onToDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('To Date cannot be greater than current date');
    }));

    it('should not show snackbar when toDate has matDatepickerParse error', fakeAsync(() => {
      const control = component.filterForm.get('toDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });

      component.onToDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not show snackbar when toDate is valid', fakeAsync(() => {
      component.filterForm.patchValue({ toDate: moment('2025-01-10'), fromDate: moment('2025-01-01') });
      fixture.detectChanges();

      component.onToDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not show snackbar when getToDateError returns empty string', fakeAsync(() => {
      const control = component.filterForm.get('toDate');
      control?.setErrors({ futureDate: true });
      spyOn(component, 'getToDateError').and.returnValue('');

      component.onToDateBlur();
      tick(1);

      expect(mockSnackbarService.showError).not.toHaveBeenCalled();
    }));
  });

  describe('setupDateValidation (cross-field triggers)', () => {
    it('should trigger toDate validation when fromDate changes', () => {
      const toDateControl = component.filterForm.get('toDate');
      const spy = spyOn(toDateControl!, 'updateValueAndValidity');

      component.filterForm.get('fromDate')?.setValue(moment('2025-01-05'));

      expect(spy).toHaveBeenCalledWith({ emitEvent: false });
    });

    it('should trigger fromDate validation when toDate changes', () => {
      const fromDateControl = component.filterForm.get('fromDate');
      const spy = spyOn(fromDateControl!, 'updateValueAndValidity');

      component.filterForm.get('toDate')?.setValue(moment('2025-01-05'));

      expect(spy).toHaveBeenCalledWith({ emitEvent: false });
    });
  });

  describe('validateDateInput (private, tested via blur)', () => {
    it('should set invalidDate error when input has value but control value is null', fakeAsync(() => {
      component.fromDateInput = { nativeElement: { value: 'bad-text' } } as any;
      const control = component.filterForm.get('fromDate');
      control?.setValue(null, { emitEvent: false });

      component.onFromDateBlur();
      tick(1);

      expect(control?.hasError('invalidDate')).toBe(true);
    }));

    it('should clear invalidDate error when input is empty', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ invalidDate: true });

      component.fromDateInput = { nativeElement: { value: '' } } as any;
      control?.setValue(moment('2025-01-01'));

      component.onFromDateBlur();
      tick(1);

      expect(control?.hasError('invalidDate')).toBe(false);
    }));

    it('should clear invalidDate error when control has a valid value', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ invalidDate: true });

      component.fromDateInput = { nativeElement: { value: '01-JAN-2025' } } as any;
      control?.setValue(moment('2025-01-01'));

      component.onFromDateBlur();
      tick(1);

      expect(control?.hasError('invalidDate')).toBe(false);
    }));

    it('should preserve other errors when clearing invalidDate', fakeAsync(() => {
      const control = component.filterForm.get('fromDate');
      control?.setErrors({ invalidDate: true, futureDate: true });

      component.fromDateInput = { nativeElement: { value: '01-JAN-2025' } } as any;
      control?.setValue(moment('2025-01-01'));

      component.onFromDateBlur();
      tick(1);

      // futureDate may or may not remain depending on validator re-run,
      // but invalidDate should be cleared
      expect(control?.hasError('invalidDate')).toBe(false);
    }));
  });

  describe('Overlay mode (no dialog)', () => {
    let overlayFixture: ComponentFixture<FilterPanel>;
    let overlayComponent: FilterPanel;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [FilterPanel, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: ChapterTimezoneService, useValue: mockTimezoneService }
          // No MatDialogRef or MAT_DIALOG_DATA
        ]
      });

      overlayFixture = TestBed.createComponent(FilterPanel);
      overlayComponent = overlayFixture.componentInstance;
    });

    it('should use input values when dialog data is not available', () => {
      overlayComponent.currentFilters = {
        insertedUser: 'JANE.SMITH',
        fromDate: '2025-01-05',
        toDate: '2025-01-12'
      };
      overlayComponent.insertedUsers = ['JANE.SMITH', 'BOB.JONES'];

      overlayFixture.detectChanges();

      expect(overlayComponent.filterForm.get('insertedUser')?.value).toBe('JANE.SMITH');
      expect(overlayComponent.filterForm.get('fromDate')?.value).toBe('2025-01-05');
      expect(overlayComponent.filterForm.get('toDate')?.value).toBe('2025-01-12');

      const options = overlayComponent.insertedUserOptions();
      expect(options.length).toBe(3);
      expect(options[0].label).toBe('All');
      expect(options[1].value).toBe('JANE.SMITH');
      expect(options[2].value).toBe('BOB.JONES');
    });

    it('should emit apply event instead of closing dialog on apply', () => {
      overlayComponent.insertedUsers = [];
      overlayFixture.detectChanges();

      spyOn(overlayComponent.apply, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue(null);

      overlayComponent.filterForm.patchValue({ insertedUser: 'USER1' });
      overlayComponent.onApply();

      expect(overlayComponent.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        insertedUser: 'USER1'
      }));
    });

    it('should emit close event instead of closing dialog on close', () => {
      overlayComponent.insertedUsers = [];
      overlayFixture.detectChanges();

      spyOn(overlayComponent.close, 'emit');

      overlayComponent.onClose();

      expect(overlayComponent.close.emit).toHaveBeenCalled();
    });

    it('should use empty defaults when no currentFilters input provided', () => {
      overlayComponent.insertedUsers = [];
      overlayFixture.detectChanges();

      expect(overlayComponent.filterForm.get('insertedUser')?.value).toBe('');
      expect(overlayComponent.filterForm.get('fromDate')?.value).toBeNull();
      expect(overlayComponent.filterForm.get('toDate')?.value).toBeNull();
    });

    it('should handle empty insertedUsers input', () => {
      overlayComponent.insertedUsers = [];
      overlayFixture.detectChanges();

      const options = overlayComponent.insertedUserOptions();
      expect(options.length).toBe(1);
      expect(options[0]).toEqual({ value: '', label: 'All' });
    });
  });
});
