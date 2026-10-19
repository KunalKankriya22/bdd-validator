import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperatorFilterPanel } from './operator-filter-panel';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { ValidOperatorFilterValue, ValueStyle } from '../models/define-operators.model';

describe('OperatorFilterPanel', () => {
  let component: OperatorFilterPanel;
  let fixture: ComponentFixture<OperatorFilterPanel>;

  // Helper function to get future date
  const getFutureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [OperatorFilterPanel],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(OperatorFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {



    it('should have periodOptions defined', () => {
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions.map(o => o.value)).toEqual(['BEFORE', 'AFTER']);
    });
  });

  describe('ngOnInit', () => {

    it('should populate form from currentFilters', () => {
      component.currentFilters = {
        valueStyle: 'S',
        effectiveDate: getFutureDate(30).toISOString(),
        effectiveDatePeriod: 'AFTER',
        terminationDate: getFutureDate(365).toISOString(),
        terminationDatePeriod: 'BEFORE'
      };

      fixture.detectChanges();

      expect(component.filterForm.get('valueStyle')?.value).toBe('S');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('BEFORE');
      // Date fields should be moment objects (converted from ISO string)
      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
      expect(component.filterForm.get('termDate')?.value).toBeTruthy();
    });

    it('should handle partial currentFilters', () => {
      component.currentFilters = {
        valueStyle: 'R',
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: null,
        terminationDatePeriod: null
      };

      fixture.detectChanges();

      expect(component.filterForm.get('valueStyle')?.value).toBe('R');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should emit null for empty filter fields', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.first().args[0] as ValidOperatorFilterValue;
      expect(emittedValue.valueStyle).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
      expect(emittedValue.terminationDatePeriod).toBeNull();
    });

    it('should convert date to ISO string on apply', () => {
      spyOn(component.apply, 'emit');

      const testDate = getFutureDate(30);
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'AFTER'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.first().args[0] as ValidOperatorFilterValue;
      expect(emittedValue.effectiveDate).toBeTruthy();
      expect(typeof emittedValue.effectiveDate).toBe('string');
      expect(emittedValue.effectiveDatePeriod).toBe('AFTER');
    });
  });



  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no fields are filled', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when valueStyle is selected', () => {
      component.filterForm.patchValue({
        valueStyle: 'S'
      });

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when only effective date period is selected', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER'
      });
      component.validateEffectivePeriod();

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only effective date is selected', () => {
      component.filterForm.patchValue({
        effectiveDate: getFutureDate(30)
      });
      component.validateEffectivePeriod();

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when both effective date and period are selected', () => {
      component.filterForm.patchValue({
        effectiveDate: getFutureDate(30),
        effectiveDatePeriod: 'AFTER'
      });
      component.validateEffectivePeriod();

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when only termination date period is selected', () => {
      component.filterForm.patchValue({
        terminationDatePeriod: 'BEFORE'
      });
      component.validateTerminationPeriod();

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only termination date is selected', () => {
      component.filterForm.patchValue({
        termDate: getFutureDate(365)
      });
      component.validateTerminationPeriod();

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when both termination date and period are selected', () => {
      component.filterForm.patchValue({
        termDate: getFutureDate(365),
        terminationDatePeriod: 'BEFORE'
      });
      component.validateTerminationPeriod();

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when effective date has invalid format', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      effectiveDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date has invalid format', () => {
      const termDateControl = component.filterForm.get('termDate');
      termDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectivePeriodRequired is true', () => {
      component.effectivePeriodRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDateRequired is true', () => {
      component.effectiveDateRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationPeriodRequired is true', () => {
      component.terminationPeriodRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDateRequired is true', () => {
      component.terminationDateRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls', () => {
      component.filterForm.patchValue({
        valueStyle: 'S',
        effectiveDate: new Date(),
        effectiveDatePeriod: 'BEFORE',
        termDate: new Date(),
        terminationDatePeriod: 'AFTER'
      });

      component.onClear();

      expect(component.filterForm.get('valueStyle')?.value).toBeFalsy();
      expect(component.filterForm.get('effectiveDate')?.value).toBeFalsy();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeFalsy();
      expect(component.filterForm.get('termDate')?.value).toBeFalsy();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeFalsy();
    });

    it('should reset all validation flags', () => {
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
});
