import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { DateFieldValidationUtility } from './date-field-validation.utility';
import moment from 'moment';

describe('DateFieldValidationUtility', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  describe('getMinDate()', () => {
    it('should return today at start of day', () => {
      const minDate = DateFieldValidationUtility.getMinDate();
      const today = moment().startOf('day');

      expect(minDate.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
      expect(minDate.hours()).toBe(0);
      expect(minDate.minutes()).toBe(0);
      expect(minDate.seconds()).toBe(0);
    });
  });

  describe('effectiveDateNotPastValidator()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null, [DateFieldValidationUtility.effectiveDateNotPastValidator()]]
      });
    });


    it('should return error for past date', () => {
      const pastDate = moment().subtract(1, 'days');
      form.patchValue({ effectiveDate: pastDate });
      expect(form.get('effectiveDate')?.hasError('effectiveDatePast')).toBe(true);
    });

    it('should return null for today', () => {
      const today = moment().startOf('day');
      form.patchValue({ effectiveDate: today });
      expect(form.get('effectiveDate')?.errors).toBeNull();
    });


  });

  describe('dateRangeValidator()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null],
        terminationDate: [null]
      }, {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      });
    });



    it('should return error when termination date is before effective date', () => {
      form.patchValue({
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(2, 'days')
      });
      expect(form.hasError('dateRangeInvalid')).toBe(true);
    });




    it('should ignore time components when comparing dates', () => {
      const date1 = moment().hours(9).minutes(30);
      const date2 = moment().hours(17).minutes(45);

      form.patchValue({
        effectiveDate: date1,
        terminationDate: date2
      });
      expect(form.hasError('dateRangeInvalid')).toBe(false);
    });
  });

  describe('getEffectiveDateErrorMessage()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null, [
          Validators.required,
          DateFieldValidationUtility.effectiveDateNotPastValidator()
        ]]
      }, {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      });
    });



    it('should return past date error message', () => {
      const pastDate = moment().subtract(1, 'days');
      form.patchValue({ effectiveDate: pastDate });
      form.get('effectiveDate')?.markAsTouched();

      const message = DateFieldValidationUtility.getEffectiveDateErrorMessage(
        form.get('effectiveDate'),
        form.errors
      );
      expect(message).toBe('Effective date cannot be past date');
    });

    it('should not return date range error message on effective date', () => {
      form = fb.group({
        effectiveDate: [moment().add(5, 'days')],
        terminationDate: [moment().add(2, 'days')]
      }, {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      });

      form.get('effectiveDate')?.markAsTouched();
      const message = DateFieldValidationUtility.getEffectiveDateErrorMessage(
        form.get('effectiveDate'),
        form.errors
      );
      expect(message).toBe('');
    });

  });

  describe('getTerminationDateErrorMessage()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null],
        terminationDate: [null]
      }, {
        validators: [DateFieldValidationUtility.dateRangeValidator()]
      });
    });


    it('should return date range error message', () => {
      form.patchValue({
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(2, 'days')
      });
      form.get('terminationDate')?.markAsTouched();

      const message = DateFieldValidationUtility.getTerminationDateErrorMessage(
        form.get('terminationDate'),
        form.errors
      );
      expect(message).toBe('Termination Date must be greater than or equal to Effective Date');
    });

  });

  describe('effectiveDateFilter()', () => {

    it('should return false for past date', () => {
      const pastDate = moment().subtract(1, 'days');
      expect(DateFieldValidationUtility.effectiveDateFilter(pastDate)).toBe(false);
    });

    it('should return true for today', () => {
      const today = moment().startOf('day');
      expect(DateFieldValidationUtility.effectiveDateFilter(today)).toBe(true);
    });

    it('should return true for future date', () => {
      const futureDate = moment().add(1, 'days');
      expect(DateFieldValidationUtility.effectiveDateFilter(futureDate)).toBe(true);
    });
  });

  describe('createTerminationDateFilter()', () => {


    it('should return false for date before effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      const filter = DateFieldValidationUtility.createTerminationDateFilter(effectiveDate);
      const beforeDate = moment().add(2, 'days');
      expect(filter(beforeDate)).toBe(false);
    });

    it('should return true for date equal to effective date', () => {
      const effectiveDate = moment();
      const filter = DateFieldValidationUtility.createTerminationDateFilter(effectiveDate);
      const sameDate = effectiveDate.clone();
      expect(filter(sameDate)).toBe(true);
    });

    it('should return true for date after effective date', () => {
      const effectiveDate = moment();
      const filter = DateFieldValidationUtility.createTerminationDateFilter(effectiveDate);
      const afterDate = moment().add(5, 'days');
      expect(filter(afterDate)).toBe(true);
    });

  });

  describe('isPastDate()', () => {

    it('should return true for past date', () => {
      const pastDate = moment().subtract(1, 'days');
      expect(DateFieldValidationUtility.isPastDate(pastDate)).toBe(true);
    });

    it('should return false for today', () => {
      const today = moment().startOf('day');
      expect(DateFieldValidationUtility.isPastDate(today)).toBe(false);
    });

    it('should return false for future date', () => {
      const futureDate = moment().add(1, 'days');
      expect(DateFieldValidationUtility.isPastDate(futureDate)).toBe(false);
    });

  });

  describe('isValidEffectiveDate()', () => {

    it('should return false for past date in add mode', () => {
      const pastDate = moment().subtract(1, 'days');
      expect(DateFieldValidationUtility.isValidEffectiveDate(pastDate, 'add')).toBe(false);
    });

    it('should return true for past date in edit mode', () => {
      const pastDate = moment().subtract(1, 'days');
      expect(DateFieldValidationUtility.isValidEffectiveDate(pastDate, 'edit')).toBe(true);
    });

    it('should return true for today in add mode', () => {
      const today = moment().startOf('day');
      expect(DateFieldValidationUtility.isValidEffectiveDate(today, 'add')).toBe(true);
    });

    it('should return true for future date in add mode', () => {
      const futureDate = moment().add(1, 'days');
      expect(DateFieldValidationUtility.isValidEffectiveDate(futureDate, 'add')).toBe(true);
    });
  });

  describe('isValidDateRange()', () => {


    it('should return false when termination is before effective', () => {
      const effectiveDate = moment().add(5, 'days');
      const terminationDate = moment().add(2, 'days');
      expect(DateFieldValidationUtility.isValidDateRange(effectiveDate, terminationDate)).toBe(false);
    });

    it('should return true when termination equals effective', () => {
      const date = moment();
      expect(DateFieldValidationUtility.isValidDateRange(date, date.clone())).toBe(true);
    });

    it('should return true when termination is after effective', () => {
      const effectiveDate = moment();
      const terminationDate = moment().add(5, 'days');
      expect(DateFieldValidationUtility.isValidDateRange(effectiveDate, terminationDate)).toBe(true);
    });

  });

  describe('setupAddModeValidators()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null],
        terminationDate: [null]
      });
    });

    it('should set effectiveDateNotPastValidator on effective date', () => {
      DateFieldValidationUtility.setupAddModeValidators(form);

      const pastDate = moment().subtract(1, 'days');
      form.patchValue({ effectiveDate: pastDate });

      expect(form.get('effectiveDate')?.hasError('effectiveDatePast')).toBe(true);
    });


    it('should clear validators on termination date', () => {
      form.get('terminationDate')?.setValidators([Validators.required]);
      DateFieldValidationUtility.setupAddModeValidators(form);

      form.patchValue({ terminationDate: null });
      expect(form.get('terminationDate')?.errors).toBeNull();
    });
  });

  describe('setupEditModeValidators()', () => {
    beforeEach(() => {
      form = fb.group({
        effectiveDate: [null, [DateFieldValidationUtility.effectiveDateNotPastValidator()]],
        terminationDate: [null]
      });
    });

    it('should clear past date validator from effective date', () => {
      DateFieldValidationUtility.setupEditModeValidators(form);

      const pastDate = moment().subtract(1, 'days');
      form.patchValue({ effectiveDate: pastDate }, { emitEvent: false });

      expect(form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalsy();
    });

    it('should disable effective date field in edit mode', () => {
      expect(form.get('effectiveDate')?.enabled).toBe(true);

      DateFieldValidationUtility.setupEditModeValidators(form);

      expect(form.get('effectiveDate')?.disabled).toBe(true);
      expect(form.get('effectiveDate')?.enabled).toBe(false);
    });

    it('should clear validators on termination date', () => {
      form.get('terminationDate')?.setValidators([Validators.required]);
      DateFieldValidationUtility.setupEditModeValidators(form);

      form.patchValue({ terminationDate: null });
      expect(form.get('terminationDate')?.errors).toBeNull();
    });
  });

  describe('editModeTerminationDateValidator()', () => {
    let control: FormControl;
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const tomorrow = moment().add(1, 'days').startOf('day');

    describe('when original termination date is in the past', () => {
      const originalPastDate = yesterday.format('YYYY-MM-DD');

      beforeEach(() => {
        control = new FormControl(null, [
          DateFieldValidationUtility.editModeTerminationDateValidator(originalPastDate)
        ]);
      });

      it('should allow the original past date without error', () => {
        control.setValue(yesterday);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

      it('should show error when manually changing to a DIFFERENT past date', () => {
        const differentPastDate = moment().subtract(2, 'days');
        control.setValue(differentPastDate);
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });

      it('should allow changing to a future date', () => {
        control.setValue(tomorrow);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

      it('should allow changing to today', () => {
        control.setValue(today);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });
    });

    describe('when original termination date is in the future', () => {
      const originalFutureDate = tomorrow.format('YYYY-MM-DD');

      beforeEach(() => {
        control = new FormControl(null, [
          DateFieldValidationUtility.editModeTerminationDateValidator(originalFutureDate)
        ]);
      });

      it('should allow the original future date', () => {
        control.setValue(tomorrow);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

      it('should show error when manually changing to a past date', () => {
        control.setValue(yesterday);
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });

      it('should allow changing to a different future date', () => {
        const differentFutureDate = moment().add(5, 'days');
        control.setValue(differentFutureDate);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

      it('should allow changing to today', () => {
        control.setValue(today);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });
    });

    describe('when original termination date is null', () => {
      beforeEach(() => {
        control = new FormControl(null, [
          DateFieldValidationUtility.editModeTerminationDateValidator(null)
        ]);
      });

      it('should show error when manually entering a past date', () => {
        control.setValue(yesterday);
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });

      it('should allow entering a future date', () => {
        control.setValue(tomorrow);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

      it('should allow entering today', () => {
        control.setValue(today);
        expect(control.hasError('terminationDatePast')).toBeFalsy();
        expect(control.errors).toBeNull();
      });

    });

    describe('edge cases', () => {
      beforeEach(() => {
        control = new FormControl(null, [
          DateFieldValidationUtility.editModeTerminationDateValidator(null)
        ]);
      });



      it('should handle moment object correctly', () => {
        control.setValue(yesterday);
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });

      it('should handle Date object correctly', () => {
        control.setValue(yesterday.toDate());
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });

      it('should handle string date correctly', () => {
        control.setValue(yesterday.format('YYYY-MM-DD'));
        expect(control.hasError('terminationDatePast')).toBeTruthy();
      });
    });
  });

  describe('fromToDateRangeValidator()', () => {
    beforeEach(() => {
      form = fb.group({
        fromDate: [null],
        toDate: [null]
      }, {
        validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
      });
    });



    it('should return error when toDate is before fromDate', () => {
      form.patchValue({
        fromDate: moment().add(5, 'days'),
        toDate: moment().add(2, 'days')
      });
      expect(form.hasError('dateRangeInvalid')).toBe(true);
    });




    it('should ignore time components when comparing dates', () => {
      const date1 = moment().hours(17).minutes(30);
      const date2 = moment().hours(9).minutes(45);

      form.patchValue({
        fromDate: date1,
        toDate: date2
      });
      // Same day, different times - should be valid (treated as same day)
      expect(form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should work with custom field names', () => {
      const customForm = fb.group({
        startDate: [null as moment.Moment | null],
        endDate: [null as moment.Moment | null]
      }, {
        validators: [DateFieldValidationUtility.fromToDateRangeValidator('startDate', 'endDate')]
      });

      customForm.patchValue({
        startDate: moment().add(5, 'days'),
        endDate: moment().add(2, 'days')
      });
      expect(customForm.hasError('dateRangeInvalid')).toBe(true);
    });
  });

  describe('getDateErrorMessage()', () => {
    beforeEach(() => {
      form = fb.group({
        fromDate: [null],
        toDate: [null]
      }, {
        validators: [DateFieldValidationUtility.fromToDateRangeValidator('fromDate', 'toDate')]
      });
    });



    it('should return required message when control has required error', () => {
      const requiredForm = fb.group({
        fromDate: [null, [Validators.required]]
      });
      const control = requiredForm.get('fromDate');
      control?.markAsTouched();

      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        null,
        'From Date'
      );
      expect(result).toBe('From Date is required');
    });




    it('should return range error message when dateRangeInvalid and rangeErrorMessage provided', () => {
      form.patchValue({
        fromDate: moment().add(5, 'days'),
        toDate: moment().add(2, 'days')
      });
      const control = form.get('toDate');
      control?.markAsTouched();

      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        form.errors,
        'To Date',
        'To Date must be on or after From Date'
      );
      expect(result).toBe('To Date must be on or after From Date');
    });

    it('should not return range error when rangeErrorMessage is not provided', () => {
      form.patchValue({
        fromDate: moment().add(5, 'days'),
        toDate: moment().add(2, 'days')
      });
      const control = form.get('fromDate');
      control?.markAsTouched();

      // No rangeErrorMessage provided for From Date
      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        form.errors,
        'From Date'
      );
      expect(result).toBe('');
    });

    it('should prioritize control-level errors over form-level errors', () => {
      const control = form.get('toDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        { dateRangeInvalid: true },
        'To Date',
        'To Date must be on or after From Date'
      );
      // Control-level error should be returned first
      expect(result).toBe('To Date is invalid');
    });

    it('should work with dirty control (not just touched)', () => {
      const control = form.get('fromDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsDirty();

      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        null,
        'From Date'
      );
      expect(result).toBe('From Date is invalid');
    });

    it('should work with custom field labels', () => {
      const control = form.get('fromDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      const result = DateFieldValidationUtility.getDateErrorMessage(
        control,
        null,
        'Start Date'
      );
      expect(result).toBe('Start Date is invalid');
    });
  });

  describe('getEndDateCrossFieldError()', () => {
    let control: FormControl;

    beforeEach(() => {
      control = new FormControl(null);
    });


    it('should return correct error message for terminationDatePast error', () => {
      control.setErrors({ terminationDatePast: true });
      control.markAsTouched();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        null
      );
      expect(result).toBe('Termination Date cannot be past date');
    });


    it('should return correct error message for matDatepickerParse error', () => {
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        null
      );
      expect(result).toBe('Termination Date is invalid');
    });

    it('should return correct error message for matDatepickerMin error when formErrors provided', () => {
      control.setErrors({ matDatepickerMin: { min: moment() } });
      control.markAsTouched();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        { dateRangeInvalid: true }
      );
      expect(result).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return matDatepickerMin error even when formErrors is null', () => {
      control.setErrors({ matDatepickerMin: { min: moment() } });
      control.markAsTouched();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        null  // formErrors is null means this field was not last changed
      );
      expect(result).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should work with custom labels', () => {
      control.setErrors({ terminationDatePast: true });
      control.markAsTouched();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'End Date',
        'Start Date',
        null
      );
      expect(result).toBe('End Date cannot be past date');
    });

    it('should work with dirty control (not just touched)', () => {
      control.setErrors({ terminationDatePast: true });
      control.markAsDirty();

      const result = DateFieldValidationUtility.getEndDateCrossFieldError(
        control,
        'Termination Date',
        'Effective Date',
        null
      );
      expect(result).toBe('Termination Date cannot be past date');
    });

  });

  describe('setChapterTimezoneService', () => {
    it('should set the service', () => {
      const mockService = { isChapterLocalDateAvailable: () => false, getChapterLocalDate: () => moment() } as any;
      DateFieldValidationUtility.setChapterTimezoneService(mockService);
      // Verify it doesn't throw
      expect(DateFieldValidationUtility.getMinDate()).toBeTruthy();
    });

    afterEach(() => {
      // Reset to avoid polluting other tests
      DateFieldValidationUtility['chapterTimezoneService'] = null;
    });
  });

  describe('getChapterLocalDateForInsert', () => {
    it('should return a Date object', () => {
      const result = DateFieldValidationUtility.getChapterLocalDateForInsert();
      expect(result instanceof Date).toBeTrue();
    });

    it('should use chapter service when available', () => {
      const mockDate = moment('2025-06-15');
      const mockService = { isChapterLocalDateAvailable: () => true, getChapterLocalDate: () => mockDate } as any;
      DateFieldValidationUtility.setChapterTimezoneService(mockService);
      const result = DateFieldValidationUtility.getChapterLocalDateForInsert();
      expect(result instanceof Date).toBeTrue();
      DateFieldValidationUtility['chapterTimezoneService'] = null;
    });
  });

  describe('getChapterLocalDateForInsertISO', () => {
    it('should return an ISO string', () => {
      const result = DateFieldValidationUtility.getChapterLocalDateForInsertISO();
      expect(result).toContain('T');
      expect(result.endsWith('Z')).toBeTrue();
    });
  });

  describe('validDateValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, [DateFieldValidationUtility.validDateValidator()]);
      expect(control.errors).toBeNull();
    });
    it('should return null for valid date', () => {
      const control = new FormControl(moment(), [DateFieldValidationUtility.validDateValidator()]);
      expect(control.errors).toBeNull();
    });
    it('should return invalidDate for invalid date', () => {
      const control = new FormControl(moment('invalid'), [DateFieldValidationUtility.validDateValidator()]);
      expect(control.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('terminationDateNotPastValidator', () => {
    it('should return null for null value', () => {
      const control = new FormControl(null, [DateFieldValidationUtility.terminationDateNotPastValidator()]);
      expect(control.errors).toBeNull();
    });
    it('should return error for past date', () => {
      const control = new FormControl(moment().subtract(1, 'days'), [DateFieldValidationUtility.terminationDateNotPastValidator()]);
      expect(control.hasError('terminationDatePast')).toBeTrue();
    });
    it('should return null for today', () => {
      const control = new FormControl(moment().startOf('day'), [DateFieldValidationUtility.terminationDateNotPastValidator()]);
      expect(control.errors).toBeNull();
    });
    it('should return null for invalid date (let validDateValidator handle)', () => {
      const control = new FormControl(moment('invalid'), [DateFieldValidationUtility.terminationDateNotPastValidator()]);
      expect(control.hasError('terminationDatePast')).toBeFalse();
    });
  });

  describe('serializeDateForApi', () => {
    it('should return null for null', () => {
      expect(DateFieldValidationUtility.serializeDateForApi(null)).toBeNull();
    });
    it('should return null for undefined', () => {
      expect(DateFieldValidationUtility.serializeDateForApi(undefined)).toBeNull();
    });
    it('should return YYYY-MM-DD for moment', () => {
      const result = DateFieldValidationUtility.serializeDateForApi(moment('2025-03-14'));
      expect(result).toBe('2025-03-14');
    });
    it('should return YYYY-MM-DD for Date', () => {
      const date = new Date(2025, 2, 14);
      const result = DateFieldValidationUtility.serializeDateForApi(date);
      expect(result).toBe('2025-03-14');
    });
  });

  describe('formatDateForUI', () => {
    it('should return empty for null', () => {
      expect(DateFieldValidationUtility.formatDateForUI(null)).toBe('');
    });
    it('should return empty for undefined', () => {
      expect(DateFieldValidationUtility.formatDateForUI(undefined)).toBe('');
    });
    it('should return empty for invalid date', () => {
      expect(DateFieldValidationUtility.formatDateForUI(moment('invalid'))).toBe('');
    });
    it('should format date as DD-MMM-YYYY uppercase', () => {
      const result = DateFieldValidationUtility.formatDateForUI(moment('2026-03-18'));
      expect(result).toBe('18-MAR-2026');
    });
    it('should format Date object', () => {
      const result = DateFieldValidationUtility.formatDateForUI(new Date(2026, 2, 18));
      expect(result).toBe('18-MAR-2026');
    });
  });

  describe('formatDateWithDay', () => {
    it('should return empty for null', () => {
      expect(DateFieldValidationUtility.formatDateWithDay(null)).toBe('');
    });
    it('should return empty for invalid', () => {
      expect(DateFieldValidationUtility.formatDateWithDay('invalid')).toBe('');
    });
    it('should format date with day name', () => {
      const result = DateFieldValidationUtility.formatDateWithDay(moment('2025-01-06'));
      expect(result).toContain('06-JAN-2025');
      expect(result).toContain('Monday');
    });
  });

  describe('formatDateTimeForUI', () => {
    it('should return empty for null', () => {
      expect(DateFieldValidationUtility.formatDateTimeForUI(null)).toBe('');
    });
    it('should return empty for invalid', () => {
      expect(DateFieldValidationUtility.formatDateTimeForUI('invalid')).toBe('');
    });
    it('should format date+time', () => {
      const result = DateFieldValidationUtility.formatDateTimeForUI(moment('2026-01-15T14:30:00'));
      expect(result).toContain('15-JAN-2026');
      expect(result).toContain('14:30');
    });
  });

  describe('formatDateTimeWithMeridiem', () => {
    it('should return empty for null', () => {
      expect(DateFieldValidationUtility.formatDateTimeWithMeridiem(null)).toBe('');
    });
    it('should return empty for invalid', () => {
      expect(DateFieldValidationUtility.formatDateTimeWithMeridiem('invalid')).toBe('');
    });
    it('should format date+time with AM/PM', () => {
      const result = DateFieldValidationUtility.formatDateTimeWithMeridiem(moment('2026-04-04T14:30:00'));
      expect(result).toContain('04-APR-2026');
      expect(result).toContain('PM');
    });
  });

  describe('crossFieldDateRangeValidator', () => {
    it('should return null for non-FormGroup', () => {
      const control = new FormControl(null);
      const validator = DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end');
      expect(validator(control)).toBeNull();
    });
    it('should return null when controls not found', () => {
      const fg = fb.group({ other: [null] });
      const validator = DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end');
      expect(validator(fg)).toBeNull();
    });
    it('should return null when dates are null', () => {
      const fg = fb.group({ start: [null], end: [null] }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end')] });
      expect(fg.errors).toBeNull();
    });
    it('should return null when end >= start', () => {
      const fg = fb.group({ start: [moment()], end: [moment().add(1, 'day')] }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end')] });
      expect(fg.errors).toBeNull();
    });
    it('should return error when start > end', () => {
      const fg = fb.group({ start: [moment().add(5, 'days')], end: [moment()] }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end')] });
      expect(fg.hasError('dateRangeInvalid')).toBeTrue();
    });
    it('should return null for invalid dates', () => {
      const fg = fb.group({ start: [moment('invalid')], end: [moment()] }, { validators: [DateFieldValidationUtility.crossFieldDateRangeValidator('start', 'end')] });
      expect(fg.errors).toBeNull();
    });
  });

  describe('getStartDateCrossFieldError', () => {
    it('should return empty for null control', () => {
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(null, 'Start', 'End')).toBe('');
    });
    it('should return empty for untouched control', () => {
      const control = new FormControl(null);
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Start', 'End')).toBe('');
    });
    it('should return required message', () => {
      const control = new FormControl(null);
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Effective Date', 'Termination Date')).toBe('Effective Date is required');
    });
    it('should return range error', () => {
      const control = new FormControl(moment());
      control.markAsTouched();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Effective Date', 'Termination Date', { dateRangeInvalid: true })).toBe('Effective Date must be less than or equal to Termination Date');
    });
    it('should return past date error', () => {
      const control = new FormControl(moment());
      control.setErrors({ effectiveDatePast: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Effective Date', 'Termination Date')).toBe('Effective Date cannot be past date');
    });
    it('should return invalid for invalidDateFormat', () => {
      const control = new FormControl(null);
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getStartDateCrossFieldError(control, 'Start', 'End')).toBe('Start is invalid');
    });
  });

  describe('handleStartDateInput', () => {
    it('should do nothing for null control', () => {
      expect(() => DateFieldValidationUtility.handleStartDateInput('test', null)).not.toThrow();
    });
    it('should set required error for empty input', () => {
      const control = new FormControl('');
      DateFieldValidationUtility.handleStartDateInput('', control);
      expect(control.hasError('required')).toBeTrue();
      expect(control.value).toBeNull();
    });
    it('should set required for whitespace input', () => {
      const control = new FormControl('');
      DateFieldValidationUtility.handleStartDateInput('  ', control);
      expect(control.hasError('required')).toBeTrue();
    });
    it('should mark touched and dirty for non-empty input', () => {
      const control = new FormControl('test');
      DateFieldValidationUtility.handleStartDateInput('test', control);
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });
    it('should set invalidDate when input present but control value is null', () => {
      const control = new FormControl(null);
      DateFieldValidationUtility.handleStartDateInput('bad-date', control);
      expect(control.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('handleEndDateInput', () => {
    it('should do nothing for null control', () => {
      expect(() => DateFieldValidationUtility.handleEndDateInput('test', null)).not.toThrow();
    });
    it('should clear errors for empty input (add mode)', () => {
      const control = new FormControl('');
      control.setErrors({ someError: true });
      DateFieldValidationUtility.handleEndDateInput('', control, false);
      expect(control.errors).toBeNull();
      expect(control.pristine).toBeTrue();
      expect(control.untouched).toBeTrue();
    });
    it('should mark dirty for empty input in edit mode', () => {
      const control = new FormControl('');
      DateFieldValidationUtility.handleEndDateInput('', control, true);
      expect(control.dirty).toBeTrue();
    });
    it('should set invalidDate when input present but control value is null', () => {
      const control = new FormControl(null);
      DateFieldValidationUtility.handleEndDateInput('bad-date', control);
      expect(control.hasError('invalidDate')).toBeTrue();
    });
    it('should mark touched and dirty for non-empty input', () => {
      const control = new FormControl('valid');
      DateFieldValidationUtility.handleEndDateInput('valid', control);
      expect(control.touched).toBeTrue();
      expect(control.dirty).toBeTrue();
    });
  });

  describe('clearOptionalDateErrors', () => {
    it('should clear errors on empty control', () => {
      const frm = fb.group({ terminationDate: [null] });
      frm.get('terminationDate')!.markAsTouched();
      frm.get('terminationDate')!.setErrors({ someError: true });
      DateFieldValidationUtility.clearOptionalDateErrors(frm, 'terminationDate');
      expect(frm.get('terminationDate')!.errors).toBeNull();
      expect(frm.get('terminationDate')!.untouched).toBeTrue();
    });
    it('should NOT clear errors on non-empty control', () => {
      const frm = fb.group({ terminationDate: [moment()] });
      frm.get('terminationDate')!.setErrors({ someError: true });
      DateFieldValidationUtility.clearOptionalDateErrors(frm, 'terminationDate');
      expect(frm.get('terminationDate')!.hasError('someError')).toBeTrue();
    });
  });

  describe('createDateErrorStateMatcher', () => {
    it('should return false when control is null', () => {
      const matcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => 'error');
      expect(matcher.isErrorState(null, null as any)).toBeFalse();
    });
    it('should return false when control is untouched and pristine', () => {
      const matcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => 'error');
      const control = new FormControl('');
      expect(matcher.isErrorState(control, null as any)).toBeFalse();
    });
    it('should return true when touched and error exists', () => {
      const matcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => 'error');
      const control = new FormControl('');
      control.markAsTouched();
      expect(matcher.isErrorState(control, null as any)).toBeTrue();
    });
    it('should return false when touched but no error', () => {
      const matcher = DateFieldValidationUtility.createDateErrorStateMatcher(() => '');
      const control = new FormControl('');
      control.markAsTouched();
      expect(matcher.isErrorState(control, null as any)).toBeFalse();
    });
  });

  describe('effectiveDateFilter - null', () => {
    it('should return true for null', () => {
      expect(DateFieldValidationUtility.effectiveDateFilter(null)).toBeTrue();
    });
  });

  describe('createTerminationDateFilter - null effective date', () => {
    it('should return true for any date when effective is null', () => {
      const filter = DateFieldValidationUtility.createTerminationDateFilter(null);
      expect(filter(moment())).toBeTrue();
    });
    it('should return true for null date', () => {
      const filter = DateFieldValidationUtility.createTerminationDateFilter(moment());
      expect(filter(null)).toBeTrue();
    });
  });

  describe('isPastDate - null', () => {
    it('should return false for null', () => {
      expect(DateFieldValidationUtility.isPastDate(null)).toBeFalse();
    });
  });

  describe('isValidEffectiveDate - null', () => {
    it('should return false for null in add mode', () => {
      expect(DateFieldValidationUtility.isValidEffectiveDate(null, 'add')).toBeFalse();
    });
    it('should return false for null in edit mode', () => {
      expect(DateFieldValidationUtility.isValidEffectiveDate(null, 'edit')).toBeFalse();
    });
  });

  describe('isValidDateRange - nulls', () => {
    it('should return true when both null', () => {
      expect(DateFieldValidationUtility.isValidDateRange(null, null)).toBeTrue();
    });
    it('should return true when effective null', () => {
      expect(DateFieldValidationUtility.isValidDateRange(null, moment())).toBeTrue();
    });
  });

  describe('getEffectiveDateError convenience', () => {
    it('should return error from form', () => {
      const frm = fb.group({ effectiveDate: [null, [Validators.required]] });
      frm.get('effectiveDate')!.markAsTouched();
      const result = DateFieldValidationUtility.getEffectiveDateError(frm);
      expect(result).toBe('Effective Date is required');
    });
    it('should work with effDate naming', () => {
      const frm = fb.group({ effDate: [null, [Validators.required]] });
      frm.get('effDate')!.markAsTouched();
      const result = DateFieldValidationUtility.getEffectiveDateError(frm);
      expect(result).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError convenience', () => {
    it('should return empty when no errors', () => {
      const frm = fb.group({ terminationDate: [moment()] });
      frm.get('terminationDate')!.markAsTouched();
      const result = DateFieldValidationUtility.getTerminationDateError(frm);
      expect(result).toBe('');
    });
    it('should work with termDate naming', () => {
      const frm = fb.group({ termDate: [null] });
      frm.get('termDate')!.setErrors({ terminationDatePast: true });
      frm.get('termDate')!.markAsTouched();
      const result = DateFieldValidationUtility.getTerminationDateError(frm);
      expect(result).toBe('Termination date cannot be past date');
    });
  });

  describe('getEffectiveDateErrorMessage - additional errors', () => {
    it('should return empty for null control', () => {
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(null)).toBe('');
    });
    it('should return empty for untouched', () => {
      const control = new FormControl(null);
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(control)).toBe('');
    });
    it('should return required message', () => {
      const control = new FormControl(null);
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(control)).toBe('Effective Date is required');
    });
    it('should return invalid for matDatepickerParse', () => {
      const control = new FormControl(null);
      control.setErrors({ matDatepickerParse: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(control)).toBe('Effective date is invalid');
    });
    it('should return invalid for invalidDateFormat', () => {
      const control = new FormControl(null);
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(control)).toBe('Effective date is invalid');
    });
    it('should return invalid for invalidDate', () => {
      const control = new FormControl(null);
      control.setErrors({ invalidDate: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getEffectiveDateErrorMessage(control)).toBe('Effective date is invalid');
    });
  });

  describe('getTerminationDateErrorMessage - additional errors', () => {
    it('should return empty for null control', () => {
      expect(DateFieldValidationUtility.getTerminationDateErrorMessage(null)).toBe('');
    });
    it('should return invalid for invalidDateFormat', () => {
      const control = new FormControl(null);
      control.setErrors({ invalidDateFormat: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getTerminationDateErrorMessage(control)).toBe('Termination date is invalid');
    });
    it('should return invalid for invalidDate', () => {
      const control = new FormControl(null);
      control.setErrors({ invalidDate: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getTerminationDateErrorMessage(control)).toBe('Termination date is invalid');
    });
    it('should return range error for matDatepickerMin', () => {
      const control = new FormControl(null);
      control.setErrors({ matDatepickerMin: true });
      control.markAsTouched();
      expect(DateFieldValidationUtility.getTerminationDateErrorMessage(control, { dateRangeInvalid: true })).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('createEffectiveDateFilter', () => {
    it('should return true for null date', () => {
      const filter = DateFieldValidationUtility.createEffectiveDateFilter('UTC');
      expect(filter(null)).toBeTrue();
    });
    it('should return false for past date', () => {
      const filter = DateFieldValidationUtility.createEffectiveDateFilter('UTC');
      expect(filter(moment().subtract(1, 'day'))).toBeFalse();
    });
    it('should return true for future date', () => {
      const filter = DateFieldValidationUtility.createEffectiveDateFilter('UTC');
      expect(filter(moment().add(1, 'day'))).toBeTrue();
    });
  });

  describe('dateRangeValidator with alternate field names', () => {
    it('should work with effDate/termDate names', () => {
      const frm = fb.group({
        effDate: [moment().add(5, 'days')],
        termDate: [moment()]
      }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
      expect(frm.hasError('dateRangeInvalid')).toBeTrue();
    });
    it('should work with effDateTime/termDateTime names', () => {
      const frm = fb.group({
        effDateTime: [moment().add(5, 'days')],
        termDateTime: [moment()]
      }, { validators: [DateFieldValidationUtility.dateRangeValidator()] });
      expect(frm.hasError('dateRangeInvalid')).toBeTrue();
    });
  });

  describe('setupAddModeValidators with alternate names', () => {
    it('should work with effDate/termDate names', () => {
      const frm = fb.group({ effDate: [null], termDate: [null] });
      DateFieldValidationUtility.setupAddModeValidators(frm);
      const pastDate = moment().subtract(1, 'days');
      frm.patchValue({ effDate: pastDate });
      expect(frm.get('effDate')?.hasError('effectiveDatePast')).toBeTrue();
    });
  });

  describe('setupEditModeValidators with alternate names', () => {
    it('should work with effDate/termDate names', () => {
      const frm = fb.group({ effDate: [moment()], termDate: [null] });
      DateFieldValidationUtility.setupEditModeValidators(frm);
      expect(frm.get('effDate')?.disabled).toBeTrue();
    });
  });
});
