import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InstrumentTestResultsFilterComponent } from './instrument-test-results-filter';
import { ValidInstrumentTestScheduleFilter } from '../../models/instrument-test-results.model';

describe('InstrumentTestResultsFilterComponent', () => {
  let component: InstrumentTestResultsFilterComponent;
  let fixture: ComponentFixture<InstrumentTestResultsFilterComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<InstrumentTestResultsFilterComponent>>;

  const effDate  = new Date('2026-01-15');
  const termDate = new Date('2026-06-30');

  async function setup(data: ValidInstrumentTestScheduleFilter | null = null): Promise<void> {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [InstrumentTestResultsFilterComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentTestResultsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /* ── No existing filter data ─────────────────────────────── */

  describe('when opened with no existing filters', () => {
    beforeEach(async () => setup(null));

    it('should initialise all date controls to null', () => {
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });


    it('should have apply disabled when only period is set without a date', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should have apply disabled when only effectiveDate is set (period required)', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should set effectiveDatePeriodError when effectiveDate set without period', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should clear effectiveDatePeriodError when period is also set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should enable apply once effectiveDate and period are both set', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply once terminationDate and period are both set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.isApplyDisabled).toBeFalse();
    });


    it('should reset all date controls to null on onClear()', () => {
      component.filterForm.get('effectiveDate')?.setValue(effDate);
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      component.onClear();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });





  });

  /* ── Pre-filled filter data ──────────────────────────────── */

  describe('when opened with existing filter data', () => {
    const existingFilters: ValidInstrumentTestScheduleFilter = {
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

    it('should clear all to null on onClear()', () => {
      component.onClear();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });
  });

  describe('onApply()', () => {
    beforeEach(async () => setup(null));

    it('should close dialog with filter data when form is valid', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      });
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: effDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      }));
    });

    it('should not close dialog when apply is disabled', () => {
      // Form is empty so isApplyDisabled is true
      component.onApply();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should pass Date objects through toLocalDate when applying', () => {
      component.filterForm.patchValue({
        effectiveDate: effDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDate: termDate,
        terminationDatePeriod: 'AFTER'
      });
      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDate: effDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDate: termDate,
        terminationDatePeriod: 'AFTER'
      }));
    });
  });

  describe('toLocalDate() via private access', () => {
    beforeEach(async () => setup(null));

    it('should return the Date object directly', () => {
      expect((component as any).toLocalDate(effDate)).toEqual(effDate);
    });

    it('should call toDate() on moment-like objects', () => {
      const momentLike = { toDate: () => termDate };
      expect((component as any).toLocalDate(momentLike)).toEqual(termDate);
    });

    it('should return undefined for falsy values', () => {
      expect((component as any).toLocalDate(null)).toBeUndefined();
    });

    it('should return undefined for non-date non-moment values', () => {
      expect((component as any).toLocalDate('not-a-date')).toBeUndefined();
    });
  });

  describe('closeDialog()', () => {
    beforeEach(async () => setup(null));

    it('should call dialogRef.close()', () => {
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

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
    });
  });

  describe('onEffectiveDateBlur()', () => {
    beforeEach(async () => setup(null));

    it('should restore raw input on blur when control has no value', fakeAsync(() => {
      component['effectiveDateRawInput'] = 'some-raw-input';
      const input = document.createElement('input');
      input.value = '';
      component.onEffectiveDateBlur(input);
      tick(1);
      expect(input.value).toBe('some-raw-input');
    }));
  });

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
  });

  describe('onTerminationDateBlur()', () => {
    beforeEach(async () => setup(null));

    it('should restore raw input on blur when control has no value', fakeAsync(() => {
      component['terminationDateRawInput'] = 'raw-term-input';
      const input = document.createElement('input');
      input.value = '';
      component.onTerminationDateBlur(input);
      tick(1);
      expect(input.value).toBe('raw-term-input');
    }));
  });

  describe('terminationDatePeriodError', () => {
    beforeEach(async () => setup(null));

    it('should show period error when terminationDate set without period', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear error when period is also set', () => {
      component.filterForm.get('terminationDate')?.setValue(termDate);
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

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

    it('should return false when no period controls are invalid', () => {
      expect(component.hasValidationErrors).toBeFalse();
    });
  });

  describe('isApplyDisabled with date errors', () => {
    beforeEach(async () => setup(null));

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
  });
});
