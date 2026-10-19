import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ValidRemoteTestingLabsFilterPanel } from './valid-remote-testing-labs-filter-panel';

describe('ValidRemoteTestingLabsFilterPanel', () => {
  let component: ValidRemoteTestingLabsFilterPanel;
  let fixture: ComponentFixture<ValidRemoteTestingLabsFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ValidRemoteTestingLabsFilterPanel, NoopAnimationsModule],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ValidRemoteTestingLabsFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should have periodOptions with AFTER and BEFORE', () => {
    expect(component.periodOptions.length).toBe(2);
    expect(component.periodOptions.map(o => o.value)).toEqual(['AFTER', 'BEFORE']);
  });

  describe('initializing with currentFilters', () => {
    it('should populate form when currentFilters is provided', async () => {
      component.currentFilters = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null,
      };
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
    });
  });

  describe('effDatePeriodRequired', () => {
    it('should be false when date is null', () => {
      component.filterForm.patchValue({ effectiveDate: null, effectiveDatePeriod: null });
      expect(component.effDatePeriodRequired).toBe(false);
    });

    it('should be true when date is set but period is null', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      expect(component.effDatePeriodRequired).toBe(true);
    });

    it('should be false when both date and period are set', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'AFTER' });
      expect(component.effDatePeriodRequired).toBe(false);
    });
  });

  describe('termDatePeriodRequired', () => {
    it('should be false when termination date is null', () => {
      component.filterForm.patchValue({ terminationDate: null, terminationDatePeriod: null });
      expect(component.termDatePeriodRequired).toBe(false);
    });

    it('should be true when termination date set but period null', () => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationDatePeriod: null });
      expect(component.termDatePeriodRequired).toBe(true);
    });
  });
  describe('onApply', () => {

    it('should set effectivePeriodRequired when date set but period missing', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null,
      });
      component.onApply();
      expect(component.effectivePeriodRequired).toBe(true);
    });

    it('should set terminationPeriodRequired when termination date set but period missing', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: null,
      });
      component.onApply();
      expect(component.terminationPeriodRequired).toBe(true);
    });

  });

  describe('onClear', () => {
    it('should reset form and clear error flags', () => {
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.filterForm.patchValue({ effectiveDatePeriod: 'AFTER' });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
    });
  });
  describe('getEffectiveDateError', () => {

    it('should return error message when matDatepickerParse error exists', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });
  });

  describe('getTerminationDateError', () => {

    it('should return error message when matDatepickerParse error exists', () => {
      const ctrl = component.filterForm.get('terminationDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when no errors', () => {
      const ctrl = component.filterForm.get('terminationDate');
      ctrl?.setValue(new Date());
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('getEffectiveDateError - no error', () => {
    it('should return empty string when no errors', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setValue(new Date());
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string when control not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      const closeSpy = jest.spyOn(component.close, 'emit');
      component.onClose();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('onApply with valid filters', () => {
    it('should emit apply event when form is valid with both date and period', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null,
      });
      component.onApply();
      expect(applySpy).toHaveBeenCalled();
    });

    it('should not emit when effective date set but period missing', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null,
      });
      component.onApply();
      expect(applySpy).not.toHaveBeenCalled();
    });

    it('should not emit when termination date set but period missing', () => {
      const applySpy = jest.spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: null,
      });
      component.onApply();
      expect(applySpy).not.toHaveBeenCalled();
    });
  });

  describe('value change subscriptions', () => {
    it('should clear effectivePeriodRequired when effective date changes', () => {
      component.effectivePeriodRequired = true;
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      expect(component.effectivePeriodRequired).toBe(false);
    });

    it('should clear effectivePeriodRequired when effective date period changes', () => {
      component.effectivePeriodRequired = true;
      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      expect(component.effectivePeriodRequired).toBe(false);
    });

    it('should clear terminationPeriodRequired when termination date changes', () => {
      component.terminationPeriodRequired = true;
      component.filterForm.get('terminationDate')?.setValue(new Date());
      expect(component.terminationPeriodRequired).toBe(false);
    });

    it('should clear terminationPeriodRequired when termination date period changes', () => {
      component.terminationPeriodRequired = true;
      component.filterForm.get('terminationDatePeriod')?.setValue('BEFORE');
      expect(component.terminationPeriodRequired).toBe(false);
    });
  });

  describe('isApplyDisabled', () => {
    it('should be true when form has not changed', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be false when form has changed with valid data', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date('2024-01-01'),
      });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be true when period required validation fails', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: null,
      });
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
