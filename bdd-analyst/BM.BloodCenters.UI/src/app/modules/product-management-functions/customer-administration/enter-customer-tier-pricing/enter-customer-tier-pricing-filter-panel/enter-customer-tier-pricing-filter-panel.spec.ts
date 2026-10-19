import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import moment from 'moment';

import { EnterCustomerTierPricingFilterPanel } from './enter-customer-tier-pricing-filter-panel';
import { CustomerTierPricingFilter } from '../models/enter-customer-tier-pricing.model';

describe('EnterCustomerTierPricingFilterPanel', () => {
  let component: EnterCustomerTierPricingFilterPanel;
  let fixture: ComponentFixture<EnterCustomerTierPricingFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterCustomerTierPricingFilterPanel, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterCustomerTierPricingFilterPanel);
    component = fixture.componentInstance;
  });

  // ── Creation ──────────────────────────────────────────────────────────

  describe('Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize filterForm with four controls', () => {
      expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
    });

    it('should start with all required flags false', () => {
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });
  });

  // ── ngOnInit ─────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should patch form when currentFilters has values', () => {
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-15',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(moment.isMoment(component.filterForm.get('effectiveDate')?.value)).toBe(true);
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(moment.isMoment(component.filterForm.get('terminationDate')?.value)).toBe(true);
    });

    it('should not patch form when currentFilters is empty', () => {
      component.currentFilters.set({});

      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should call validateEffectivePeriod when form has initial effective date values', () => {
      const spy = jest.spyOn(component, 'validateEffectivePeriod');
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-06-01',
      });

      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });

    it('should call validateTerminationPeriod when form has initial termination date values', () => {
      const spy = jest.spyOn(component, 'validateTerminationPeriod');
      component.currentFilters.set({
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });

    it('should subscribe to effectiveDate valueChanges and mark as touched', fakeAsync(() => {
      fixture.detectChanges();

      const control = component.filterForm.get('effectiveDate')!;
      control.setValue(moment('2026-03-01'));
      tick(0);

      expect(control.touched).toBe(true);
    }));

    it('should subscribe to terminationDate valueChanges and mark as touched', fakeAsync(() => {
      fixture.detectChanges();

      const control = component.filterForm.get('terminationDate')!;
      control.setValue(moment('2026-06-01'));
      tick(0);

      expect(control.touched).toBe(true);
    }));

    it('should validate effective period on effectiveDatePeriod change', fakeAsync(() => {
      fixture.detectChanges();
      const spy = jest.spyOn(component, 'validateEffectivePeriod');

      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      tick(0);

      expect(spy).toHaveBeenCalled();
    }));

    it('should validate termination period on terminationDatePeriod change', fakeAsync(() => {
      fixture.detectChanges();
      const spy = jest.spyOn(component, 'validateTerminationPeriod');

      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      tick(0);

      expect(spy).toHaveBeenCalled();
    }));
  });

  // ── validateEffectivePeriod ──────────────────────────────────────────

  describe('validateEffectivePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set effectivePeriodRequired when date is present but period is missing', () => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-01'));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBe(true);
      expect(component.effectiveDateRequired).toBe(false);
    });

    it('should set effectiveDateRequired when period is present but date is missing', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      component.filterForm.get('effectiveDate')?.setValue(null);

      component.validateEffectivePeriod();

      expect(component.effectiveDateRequired).toBe(true);
      expect(component.effectivePeriodRequired).toBe(false);
    });

    it('should clear both flags when both are present', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-01'));

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
    });

    it('should clear both flags when both are absent', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      component.filterForm.get('effectiveDate')?.setValue(null);

      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
    });
  });

  // ── validateTerminationPeriod ────────────────────────────────────────

  describe('validateTerminationPeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set terminationPeriodRequired when date is present but period is missing', () => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));
      component.filterForm.get('terminationDatePeriod')?.setValue(null);

      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBe(true);
      expect(component.terminationDateRequired).toBe(false);
    });

    it('should set terminationDateRequired when period is present but date is missing', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      component.filterForm.get('terminationDate')?.setValue(null);

      component.validateTerminationPeriod();

      expect(component.terminationDateRequired).toBe(true);
      expect(component.terminationPeriodRequired).toBe(false);
    });

    it('should clear both flags when both are present', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'));

      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });

    it('should clear both flags when both are absent', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue(null);
      component.filterForm.get('terminationDate')?.setValue(null);

      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });
  });

  // ── isApplyDisabled ──────────────────────────────────────────────────

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no fields are filled', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectivePeriodRequired is true', () => {
      component.effectivePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationPeriodRequired is true', () => {
      component.terminationPeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDateRequired is true', () => {
      component.effectiveDateRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDateRequired is true', () => {
      component.terminationDateRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDate has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has invalidDateFormat error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only effective date is set without period', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: moment('2026-01-01'),
      });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only effective period is set without date', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: null,
      });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when effective date and period are both set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-01-01'),
      });
      // Clear the required flags since both are filled
      component.effectivePeriodRequired = false;
      component.effectiveDateRequired = false;

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when termination date and period are both set', () => {
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });
      component.terminationPeriodRequired = false;
      component.terminationDateRequired = false;

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when both effective and termination pairs are set', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });
      component.effectivePeriodRequired = false;
      component.effectiveDateRequired = false;
      component.terminationPeriodRequired = false;
      component.terminationDateRequired = false;

      expect(component.isApplyDisabled).toBe(false);
    });
  });

  // ── onEffectiveDateInput ─────────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input value', () => {
      const event = { target: { value: '15-JAN-2026' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      expect((component as any).effectiveDateRawInput).toBe('15-JAN-2026');
    });

    it('should set invalidDateFormat error when control has no value but input has text', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(null, { emitEvent: false });
      const event = { target: { value: 'invalid' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
      expect(control?.touched).toBe(true);
    }));

    it('should not set error when input is empty whitespace', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(null, { emitEvent: false });
      const event = { target: { value: '   ' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));

    it('should not set error when control already has a value', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'), { emitEvent: false });
      const event = { target: { value: '15-JAN-2026' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));
  });

  // ── onEffectiveDateBlur ──────────────────────────────────────────────

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control has no value and input was cleared', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '15-JAN-2026';
      component.filterForm.get('effectiveDate')?.setValue(null, { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('15-JAN-2026');
    }));

    it('should not restore when control has a value', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '15-JAN-2026';
      component.filterForm.get('effectiveDate')?.setValue(moment('2026-01-15'), { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('');
    }));

    it('should not restore when raw input is empty', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '';
      component.filterForm.get('effectiveDate')?.setValue(null, { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('');
    }));

    it('should not restore when input still has text', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '15-JAN-2026';
      component.filterForm.get('effectiveDate')?.setValue(null, { emitEvent: false });

      const input = { value: 'some text' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('some text');
    }));
  });

  // ── onTerminationDateInput ───────────────────────────────────────────

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input value', () => {
      const event = { target: { value: '31-DEC-2026' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect((component as any).terminationDateRawInput).toBe('31-DEC-2026');
    });

    it('should set invalidDateFormat error when control has no value but input has text', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(null, { emitEvent: false });
      const event = { target: { value: 'bad-date' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
      expect(control?.touched).toBe(true);
    }));

    it('should not set error when input is whitespace only', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(null, { emitEvent: false });
      const event = { target: { value: '  ' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));

    it('should not set error when control already has a value', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'), { emitEvent: false });
      const event = { target: { value: '31-DEC-2026' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));
  });

  // ── onTerminationDateBlur ────────────────────────────────────────────

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control has no value and input was cleared', fakeAsync(() => {
      (component as any).terminationDateRawInput = '31-DEC-2026';
      component.filterForm.get('terminationDate')?.setValue(null, { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(0);

      expect(input.value).toBe('31-DEC-2026');
    }));

    it('should not restore when control has a value', fakeAsync(() => {
      (component as any).terminationDateRawInput = '31-DEC-2026';
      component.filterForm.get('terminationDate')?.setValue(moment('2026-12-31'), { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(0);

      expect(input.value).toBe('');
    }));

    it('should not restore when raw input is empty', fakeAsync(() => {
      (component as any).terminationDateRawInput = '';
      component.filterForm.get('terminationDate')?.setValue(null, { emitEvent: false });

      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(0);

      expect(input.value).toBe('');
    }));
  });

  // ── onApply ──────────────────────────────────────────────────────────

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters with formatted effective date when both effective fields are filled', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-01-15'),
      });

      component.onApply();

      expect(emitSpy).toHaveBeenCalledWith({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-15',
      });
    });

    it('should emit filters with formatted termination date when both termination fields are filled', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });

      component.onApply();

      expect(emitSpy).toHaveBeenCalledWith({
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });
    });

    it('should emit both date filters when all four fields are filled', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });

      component.onApply();

      expect(emitSpy).toHaveBeenCalledWith({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });
    });

    it('should emit empty object when no pairs are complete', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2026-12-31'),
      });

      component.onApply();

      expect(emitSpy).toHaveBeenCalledWith({});
    });

    it('should not include effective filter when only period is set without date', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        effectiveDate: null,
      });

      component.onApply();

      const emitted = emitSpy.mock.calls[0][0] as CustomerTierPricingFilter;
      expect(emitted.effectiveDatePeriod).toBeUndefined();
      expect(emitted.effectiveDate).toBeUndefined();
    });

    it('should not include termination filter when only date is set without period', () => {
      const emitSpy = jest.fn();
      component.apply.subscribe(emitSpy);

      component.filterForm.patchValue({
        terminationDatePeriod: null,
        terminationDate: moment('2026-12-31'),
      });

      component.onApply();

      const emitted = emitSpy.mock.calls[0][0] as CustomerTierPricingFilter;
      expect(emitted.terminationDatePeriod).toBeUndefined();
      expect(emitted.terminationDate).toBeUndefined();
    });
  });

  // ── onClear ──────────────────────────────────────────────────────────

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2026-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2026-12-31'),
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should clear raw input values', () => {
      (component as any).effectiveDateRawInput = '15-JAN-2026';
      (component as any).terminationDateRawInput = '31-DEC-2026';

      component.onClear();

      expect((component as any).effectiveDateRawInput).toBe('');
      expect((component as any).terminationDateRawInput).toBe('');
    });

    it('should reset all required flags to false', () => {
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.effectiveDateRequired = true;
      component.terminationDateRequired = true;

      component.onClear();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });
  });

  // ── onCancel ─────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      fixture.detectChanges();
      const emitSpy = jest.fn();
      component.cancel.subscribe(emitSpy);

      component.onCancel();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const nextSpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
