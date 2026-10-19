import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InstrumentResultsFilterComponent } from './instrument-results-filter';
import { InstrumentResultFilter } from '../../models/instrument-test-results.model';

describe('InstrumentResultsFilterComponent', () => {
  let component: InstrumentResultsFilterComponent;
  let fixture: ComponentFixture<InstrumentResultsFilterComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<InstrumentResultsFilterComponent>>;

  const effDate  = new Date('2026-01-15');
  const termDate = new Date('2026-06-30');

  async function setup(data: InstrumentResultFilter | null = null): Promise<void> {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [InstrumentResultsFilterComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentResultsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  /* ── Constructor / form initialization ─────────────────── */

  describe('when opened with no existing filters', () => {
    beforeEach(async () => setup(null));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise all form controls to null', () => {
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should initialise error strings to empty', () => {
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should have apply disabled when form is empty (no date values)', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  /* ── ngOnInit with data ────────────────────────────────── */

  describe('when opened with existing filter data', () => {
    const existingFilters: InstrumentResultFilter = {
      effectiveDate: effDate,
      effectiveDatePeriod: 'AFTER',
      terminationDate: termDate,
      terminationDatePeriod: 'BEFORE',
    };

    beforeEach(async () => setup(existingFilters));

    it('should pre-fill effectiveDate from dialog data', () => {
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(effDate);
    });

    it('should pre-fill effectiveDatePeriod from dialog data', () => {
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
    });

    it('should pre-fill terminationDate from dialog data', () => {
      expect(component.filterForm.get('terminationDate')?.value).toEqual(termDate);
    });

    it('should pre-fill terminationDatePeriod from dialog data', () => {
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
    });

    it('should have apply initially disabled (form not yet changed by user)', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply after any field change', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should run validation on init when data is provided', () => {
      // Both date+period are set, so no errors
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('when opened with partial data (date without period)', () => {
    const partialFilters: InstrumentResultFilter = {
      effectiveDate: effDate,
      effectiveDatePeriod: null,
      terminationDate: null,
      terminationDatePeriod: null,
    };

    beforeEach(async () => setup(partialFilters));

    it('should set effectiveDatePeriodError when date set without period on init', () => {
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should not set terminationDatePeriodError when no termination date on init', () => {
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  /* ── validateEffectiveDatePeriod (via valueChanges) ────── */

  describe('effectiveDate period validation', () => {
    beforeEach(async () => setup(null));

    it('should set effectiveDatePeriodError when effectiveDate set without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should set required error on effectiveDatePeriod control', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      const ctrl = component.filterForm.get('effectiveDatePeriod');
      expect(ctrl?.hasError('required')).toBeTrue();
      expect(ctrl?.touched).toBeTrue();
    });

    it('should clear effectiveDatePeriodError when period is also set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear errors on effectiveDatePeriod control when valid', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      const ctrl = component.filterForm.get('effectiveDatePeriod');
      expect(ctrl?.errors).toBeNull();
    });

    it('should clear error when effectiveDate is removed', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      component.filterForm.get('effectiveDate')?.setValue(null);
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should mark effectiveDate as touched on value change', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.touched).toBeFalse();
      ctrl?.setValue(effDate);
      expect(ctrl?.touched).toBeTrue();
    });
  });

  /* ── validateTerminationDatePeriod (via valueChanges) ─── */

  describe('terminationDate period validation', () => {
    beforeEach(async () => setup(null));

    it('should set terminationDatePeriodError when terminationDate set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should set required error on terminationDatePeriod control', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      const ctrl = component.filterForm.get('terminationDatePeriod');
      expect(ctrl?.hasError('required')).toBeTrue();
      expect(ctrl?.touched).toBeTrue();
    });

    it('should clear terminationDatePeriodError when period is also set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear errors on terminationDatePeriod control when valid', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      const ctrl = component.filterForm.get('terminationDatePeriod');
      expect(ctrl?.errors).toBeNull();
    });

    it('should clear error when terminationDate is removed', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.terminationDatePeriodError).toBe('Period is required');
      component.filterForm.get('terminationDate')?.setValue(null);
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should mark terminationDate as touched on value change', () => {
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.touched).toBeFalse();
      ctrl?.setValue(termDate);
      expect(ctrl?.touched).toBeTrue();
    });
  });

  /* ── formChanged flag via valueChanges subscriptions ───── */

  describe('formChanged tracking', () => {
    beforeEach(async () => setup(null));

    it('should set formChanged when effectiveDatePeriod changes', () => {
      expect(component['formChanged']).toBeFalse();
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when terminationDatePeriod changes', () => {
      expect(component['formChanged']).toBeFalse();
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when effectiveDate changes', () => {
      expect(component['formChanged']).toBeFalse();
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component['formChanged']).toBeTrue();
    });

    it('should set formChanged when terminationDate changes', () => {
      expect(component['formChanged']).toBeFalse();
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component['formChanged']).toBeTrue();
    });
  });

  /* ── isApplyDisabled ───────────────────────────────────── */

  describe('isApplyDisabled', () => {
    beforeEach(async () => setup(null));

    it('should return true when form is empty', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when only period is set without a date', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when only effectiveDate is set (period required)', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effectiveDate and period are both set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when terminationDate and period are both set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when terminationDatePeriod is set but terminationDate is null', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      // terminationDate is null -> termIncomplete = true
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when hasValidationErrors is true', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  /* ── hasValidationErrors ───────────────────────────────── */

  describe('hasValidationErrors', () => {
    beforeEach(async () => setup(null));

    it('should return true when effectiveDatePeriod is invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when terminationDatePeriod is invalid', () => {
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return true when both period controls are invalid', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      expect(component.hasValidationErrors).toBeTrue();
    });

    it('should return false when no period controls are invalid', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });
  });

  /* ── onApply() ─────────────────────────────────────────── */

  describe('onApply()', () => {
    beforeEach(async () => setup(null));

    it('should close dialog with filter data when form is valid', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null,
      });
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDate: effDate,
          effectiveDatePeriod: 'AFTER',
          terminationDate: null,
          terminationDatePeriod: null,
        })
      );
    });

    it('should not close dialog when apply is disabled (empty form)', () => {
      component.onApply();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when apply is disabled due to date errors', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      component.onApply();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should pass Date objects through toLocalDate when applying', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDate: termDate,
        terminationDatePeriod: 'AFTER',
      });
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDate: effDate,
          effectiveDatePeriod: 'BEFORE',
          terminationDate: termDate,
          terminationDatePeriod: 'AFTER',
        })
      );
    });

    it('should pass moment-like objects through toLocalDate when datepicker errors are cleared', () => {
      const momentLike = { toDate: () => effDate, isValid: () => true };
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('effectiveDate')?.setValue(momentLike);
      // MatDatepicker adds matDatepickerParse for non-native values; clear it
      // to simulate a valid datepicker selection (toLocalDate is tested directly
      // in its own suite; here we verify the onApply pipeline)
      component.filterForm.get('effectiveDate')?.setErrors(null);
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectiveDate: effDate,
          effectiveDatePeriod: 'AFTER',
        })
      );
    });

    it('should set null terminationDate when terminationDate form value is falsy', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null,
      });
      component.onApply();
      const args = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(args.terminationDate).toBeNull();
    });
  });

  /* ── toLocalDate() via private access ──────────────────── */

  describe('toLocalDate() via private access', () => {
    beforeEach(async () => setup(null));

    it('should return the Date object directly', () => {
      expect((component as any).toLocalDate(effDate)).toEqual(effDate);
    });

    it('should call toDate() on moment-like objects', () => {
      const momentLike = { toDate: () => termDate };
      expect((component as any).toLocalDate(momentLike)).toEqual(termDate);
    });

    it('should return undefined for null', () => {
      expect((component as any).toLocalDate(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect((component as any).toLocalDate(undefined)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect((component as any).toLocalDate('')).toBeUndefined();
    });

    it('should return undefined for non-date non-moment values', () => {
      expect((component as any).toLocalDate('not-a-date')).toBeUndefined();
    });

    it('should return undefined for a plain number', () => {
      expect((component as any).toLocalDate(42)).toBeUndefined();
    });

    it('should return undefined for a plain object without toDate', () => {
      expect((component as any).toLocalDate({ foo: 'bar' })).toBeUndefined();
    });
  });

  /* ── onClear() ─────────────────────────────────────────── */

  describe('onClear()', () => {
    beforeEach(async () => setup(null));

    it('should reset all form controls to null', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      component.onClear();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

    it('should clear effectiveDatePeriodError', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      component.onClear();
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should clear terminationDatePeriodError', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.terminationDatePeriodError).toBe('Period is required');
      component.onClear();
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear raw input strings', () => {
      component['effectiveDateRawInput'] = 'some-input';
      component['terminationDateRawInput'] = 'other-input';
      component.onClear();
      expect(component['effectiveDateRawInput']).toBe('');
      expect(component['terminationDateRawInput']).toBe('');
    });

    it('should clear errors on period controls', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      component.onClear();
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });

  /* ── closeDialog() ─────────────────────────────────────── */

  describe('closeDialog()', () => {
    beforeEach(async () => setup(null));

    it('should call dialogRef.close() without arguments', () => {
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  /* ── onEffectiveDateInput() ────────────────────────────── */

  describe('onEffectiveDateInput()', () => {
    beforeEach(async () => setup(null));

    it('should store raw input and set invalidDate error when control has no parsed value', () => {
      const input = document.createElement('input');
      input.value = 'invalid-date';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('invalid-date');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.touched).toBeTrue();
      expect(ctrl?.dirty).toBeTrue();
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should store raw input but not set errors when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should not set invalidDate error when control already has a parsed value', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      const input = document.createElement('input');
      input.value = '15-JAN-2026';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('15-JAN-2026');
      const ctrl = component.filterForm.get('effectiveDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should store raw input for whitespace-only input without setting errors', () => {
      const input = document.createElement('input');
      input.value = '   ';
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component['effectiveDateRawInput']).toBe('   ');
      const ctrl = component.filterForm.get('effectiveDate');
      // Whitespace-only trims to empty, so the if branch is not entered
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });
  });

  /* ── onEffectiveDateBlur() ─────────────────────────────── */

  describe('onEffectiveDateBlur()', () => {
    beforeEach(async () => setup(null));

    it('should restore raw input on blur when control has no value and input is empty', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'some-raw-input';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('some-raw-input');
    }));

    it('should not restore raw input when control has a value', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component['effectiveDateRawInput'] = 'some-raw-input';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when effectiveDateRawInput is empty', fakeAsync(() => {
      component['effectiveDateRawInput'] = '';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when input already has a value', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'raw-input';
      const input = document.createElement('input');
      input.value = 'existing-value';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('existing-value');
    }));
  });

  /* ── onTerminationDateInput() ──────────────────────────── */

  describe('onTerminationDateInput()', () => {
    beforeEach(async () => setup(null));

    it('should store raw input and set invalidDate error when control has no parsed value', () => {
      const input = document.createElement('input');
      input.value = 'bad-date';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('bad-date');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.touched).toBeTrue();
      expect(ctrl?.dirty).toBeTrue();
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });

    it('should store raw input but not set errors when input is empty', () => {
      const input = document.createElement('input');
      input.value = '';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });

    it('should not set invalidDate error when control already has a parsed value', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      const input = document.createElement('input');
      input.value = '30-JUN-2026';
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component['terminationDateRawInput']).toBe('30-JUN-2026');
      const ctrl = component.filterForm.get('terminationDate');
      expect(ctrl?.hasError('invalidDate')).toBeFalse();
    });
  });

  /* ── onTerminationDateBlur() ───────────────────────────── */

  describe('onTerminationDateBlur()', () => {
    beforeEach(async () => setup(null));

    it('should restore raw input on blur when control has no value and input is empty', fakeAsync(() => {
      component['terminationDateRawInput'] = 'raw-term-input';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('raw-term-input');
    }));

    it('should not restore raw input when control has a value', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component['terminationDateRawInput'] = 'raw-term-input';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when terminationDateRawInput is empty', fakeAsync(() => {
      component['terminationDateRawInput'] = '';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('');
    }));

    it('should not restore when input already has a value', fakeAsync(() => {
      component['terminationDateRawInput'] = 'raw-input';
      const input = document.createElement('input');
      input.value = 'existing-value';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('existing-value');
    }));
  });

  /* ── Cross-field interaction edge cases ────────────────── */

  describe('cross-field interaction edge cases', () => {
    beforeEach(async () => setup(null));

    it('should allow both effective and termination filters simultaneously', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: termDate,
        terminationDatePeriod: 'BEFORE',
      });
      expect(component.isApplyDisabled).toBeFalse();
      expect(component.hasValidationErrors).toBeFalse();
    });

    it('should disable apply when one pair is complete but other has only period', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: 'BEFORE',
      });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply after clearing an incomplete pair', () => {
      // Set complete effective pair
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      // Add incomplete termination (just period)
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeTrue();
      // Clear the incomplete pair
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      expect(component.isApplyDisabled).toBeFalse();
    });
  });
});
