import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { EnterStandardTierPricingFilterPanel } from './filter-panel';
import { StandardTierPricingFilter } from '../models/standard-tier-pricing.model';

describe('EnterStandardTierPricingFilterPanel', () => {
  let component: EnterStandardTierPricingFilterPanel;
  let fixture: ComponentFixture<EnterStandardTierPricingFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterStandardTierPricingFilterPanel, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(EnterStandardTierPricingFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize filter form with correct controls', () => {
    fixture.detectChanges();
    expect(component.filterForm.get('unitPriceComparison')).toBeTruthy();
    expect(component.filterForm.get('unitPrice')).toBeTruthy();
    expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('effectiveDate')).toBeTruthy();
    expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('terminationDate')).toBeTruthy();
  });

  it('should initialize validation flags as false', () => {
    expect(component.unitPriceComparisonRequired).toBe(false);
    expect(component.unitPriceRequired).toBe(false);
    expect(component.effectivePeriodRequired).toBe(false);
    expect(component.terminationPeriodRequired).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should populate form from currentFilters signal', () => {
      const filters: StandardTierPricingFilter = {
        unitPriceComparison: 'below',
        unitPrice: 100,
        effectiveDatePeriod: 'after',
        effectiveDate: '2024-06-01',
        terminationDatePeriod: 'before',
        terminationDate: '2025-12-31'
      };
      component.currentFilters.set(filters);
      fixture.detectChanges();

      expect(component.filterForm.get('unitPriceComparison')?.value).toBe('below');
      expect(component.filterForm.get('unitPrice')?.value).toBe(100);
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('after');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('before');
    });

    it('should handle empty currentFilters', () => {
      component.currentFilters.set({});
      fixture.detectChanges();

      expect(component.filterForm.get('unitPriceComparison')?.value).toBeNull();
      expect(component.filterForm.get('unitPrice')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('validateUnitPrice', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set unitPriceComparisonRequired when price set but comparison missing', () => {
      component.filterForm.patchValue({ unitPrice: 100, unitPriceComparison: null });
      component.validateUnitPrice();
      expect(component.unitPriceComparisonRequired).toBe(true);
      expect(component.unitPriceRequired).toBe(false);
    });

    it('should set unitPriceRequired when comparison set but price missing', () => {
      component.filterForm.patchValue({ unitPriceComparison: 'below', unitPrice: null });
      component.validateUnitPrice();
      expect(component.unitPriceRequired).toBe(true);
      expect(component.unitPriceComparisonRequired).toBe(false);
    });

    it('should clear flags when both set', () => {
      component.filterForm.patchValue({ unitPriceComparison: 'above', unitPrice: 200 });
      component.validateUnitPrice();
      expect(component.unitPriceComparisonRequired).toBe(false);
      expect(component.unitPriceRequired).toBe(false);
    });

    it('should clear flags when both empty', () => {
      component.filterForm.patchValue({ unitPriceComparison: null, unitPrice: null });
      component.validateUnitPrice();
      expect(component.unitPriceComparisonRequired).toBe(false);
      expect(component.unitPriceRequired).toBe(false);
    });
  });

  describe('validateEffectivePeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set effectivePeriodRequired when date set but period missing', () => {
      component.filterForm.patchValue({ effectiveDate: moment('2024-06-01'), effectiveDatePeriod: null });
      component.validateEffectivePeriod();
      expect(component.effectivePeriodRequired).toBe(true);
    });

    it('should clear flag when both date and period set', () => {
      component.filterForm.patchValue({ effectiveDate: moment('2024-06-01'), effectiveDatePeriod: 'after' });
      component.validateEffectivePeriod();
      expect(component.effectivePeriodRequired).toBe(false);
    });

    it('should clear flag when both empty', () => {
      component.filterForm.patchValue({ effectiveDate: null, effectiveDatePeriod: null });
      component.validateEffectivePeriod();
      expect(component.effectivePeriodRequired).toBe(false);
    });
  });

  describe('validateTerminationPeriod', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set terminationPeriodRequired when date set but period missing', () => {
      component.filterForm.patchValue({ terminationDate: moment('2025-12-31'), terminationDatePeriod: null });
      component.validateTerminationPeriod();
      expect(component.terminationPeriodRequired).toBe(true);
    });

    it('should clear flag when both date and period set', () => {
      component.filterForm.patchValue({ terminationDate: moment('2025-12-31'), terminationDatePeriod: 'before' });
      component.validateTerminationPeriod();
      expect(component.terminationPeriodRequired).toBe(false);
    });

    it('should clear flag when both empty', () => {
      component.filterForm.patchValue({ terminationDate: null, terminationDatePeriod: null });
      component.validateTerminationPeriod();
      expect(component.terminationPeriodRequired).toBe(false);
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be true when form is empty', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when unitPriceComparisonRequired is set', () => {
      component.unitPriceComparisonRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when unitPriceRequired is set', () => {
      component.unitPriceRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when effectivePeriodRequired is set', () => {
      component.effectivePeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when terminationPeriodRequired is set', () => {
      component.terminationPeriodRequired = true;
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be false when a complete unit price filter pair is set', () => {
      component.filterForm.patchValue({ unitPriceComparison: 'below', unitPrice: 100 });
      component.unitPriceComparisonRequired = false;
      component.unitPriceRequired = false;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be false when a complete effective date filter pair is set', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'after', effectiveDate: moment('2024-01-01') });
      component.effectivePeriodRequired = false;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be false when a complete termination date filter pair is set', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'before', terminationDate: moment('2025-12-31') });
      component.terminationPeriodRequired = false;
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be true when only one part of a pair is set', () => {
      component.filterForm.patchValue({ unitPriceComparison: 'above', unitPrice: null });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input and set invalidDateFormat when value cannot be parsed', fakeAsync(() => {
      const event = { target: { value: 'bad-date' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      tick(0);

      expect((component as any).effectiveDateRawInput).toBe('bad-date');
      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));

    it('should not set error when input is empty whitespace', fakeAsync(() => {
      const event = { target: { value: '   ' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control value cleared', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '01-JAN-2024';
      const input = { value: '' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('01-JAN-2024');
    }));

    it('should not overwrite when input still has value', fakeAsync(() => {
      (component as any).effectiveDateRawInput = '01-JAN-2024';
      const input = { value: 'existing' } as HTMLInputElement;
      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('existing');
    }));
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should store raw input and set invalidDateFormat for unparseable date', fakeAsync(() => {
      const event = { target: { value: 'invalid' } } as unknown as Event;
      component.onTerminationDateInput(event);
      tick(0);

      expect((component as any).terminationDateRawInput).toBe('invalid');
      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should restore raw input when control value cleared', fakeAsync(() => {
      (component as any).terminationDateRawInput = '31-DEC-2025';
      const input = { value: '' } as HTMLInputElement;
      component.onTerminationDateBlur(input);
      tick(0);

      expect(input.value).toBe('31-DEC-2025');
    }));
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit complete unit price filter', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);

      component.filterForm.patchValue({ unitPriceComparison: 'below', unitPrice: 150 });
      component.onApply();

      expect(applySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitPriceComparison: 'below', unitPrice: 150 })
      );
    });

    it('should emit formatted effective date as YYYY-MM-DD', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2024-06-15')
      });
      component.onApply();

      expect(applySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ effectiveDatePeriod: 'after', effectiveDate: '2024-06-15' })
      );
    });

    it('should emit formatted termination date as YYYY-MM-DD', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);

      component.filterForm.patchValue({
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      });
      component.onApply();

      expect(applySpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ terminationDatePeriod: 'before', terminationDate: '2025-12-31' })
      );
    });

    it('should exclude incomplete filter pairs', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);

      component.filterForm.patchValue({
        unitPriceComparison: 'above',
        unitPrice: 200,
        effectiveDatePeriod: 'after',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: moment('2025-01-01')
      });
      component.onApply();

      const emitted = applySpy.calls.mostRecent().args[0] as StandardTierPricingFilter;
      expect(emitted.unitPriceComparison).toBe('above');
      expect(emitted.unitPrice).toBe(200);
      expect(emitted.effectiveDatePeriod).toBeUndefined();
      expect(emitted.effectiveDate).toBeUndefined();
      expect(emitted.terminationDatePeriod).toBeUndefined();
      expect(emitted.terminationDate).toBeUndefined();
    });

    it('should emit empty object when no complete pairs exist', () => {
      const applySpy = jasmine.createSpy('apply');
      component.apply.subscribe(applySpy);

      component.filterForm.patchValue({
        unitPriceComparison: null,
        unitPrice: null
      });
      component.onApply();

      expect(applySpy).toHaveBeenCalledWith({});
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        unitPriceComparison: 'below',
        unitPrice: 100,
        effectiveDatePeriod: 'after',
        effectiveDate: moment('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: moment('2025-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('unitPriceComparison')?.value).toBeNull();
      expect(component.filterForm.get('unitPrice')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should clear all validation flags', () => {
      component.unitPriceComparisonRequired = true;
      component.unitPriceRequired = true;
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;

      component.onClear();

      expect(component.unitPriceComparisonRequired).toBe(false);
      expect(component.unitPriceRequired).toBe(false);
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
    });

    it('should clear raw input tracking', () => {
      (component as any).effectiveDateRawInput = 'some-date';
      (component as any).terminationDateRawInput = 'another-date';

      component.onClear();

      expect((component as any).effectiveDateRawInput).toBe('');
      expect((component as any).terminationDateRawInput).toBe('');
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      fixture.detectChanges();
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      component.onCancel();

      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('cross-field validation via valueChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trigger validateUnitPrice when unitPriceComparison changes', () => {
      spyOn(component, 'validateUnitPrice');
      component.filterForm.get('unitPriceComparison')?.setValue('below');
      expect(component.validateUnitPrice).toHaveBeenCalled();
    });

    it('should trigger validateUnitPrice when unitPrice changes', () => {
      spyOn(component, 'validateUnitPrice');
      component.filterForm.get('unitPrice')?.setValue(100);
      expect(component.validateUnitPrice).toHaveBeenCalled();
    });

    it('should trigger validateEffectivePeriod when effectiveDatePeriod changes', fakeAsync(() => {
      spyOn(component, 'validateEffectivePeriod');
      component.filterForm.get('effectiveDatePeriod')?.setValue('after');
      expect(component.validateEffectivePeriod).toHaveBeenCalled();
    }));

    it('should trigger validateTerminationPeriod when terminationDatePeriod changes', fakeAsync(() => {
      spyOn(component, 'validateTerminationPeriod');
      component.filterForm.get('terminationDatePeriod')?.setValue('before');
      expect(component.validateTerminationPeriod).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
