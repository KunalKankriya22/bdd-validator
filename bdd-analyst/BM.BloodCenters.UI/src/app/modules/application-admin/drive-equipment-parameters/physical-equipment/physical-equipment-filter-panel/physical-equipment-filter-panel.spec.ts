import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { PhysicalEquipmentFilterPanel } from './physical-equipment-filter-panel';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('PhysicalEquipmentFilterPanel', () => {
  let component: PhysicalEquipmentFilterPanel;
  let fixture: ComponentFixture<PhysicalEquipmentFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhysicalEquipmentFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [provideHttpClient()]
    });

    fixture = TestBed.createComponent(PhysicalEquipmentFilterPanel);
    component = fixture.componentInstance;
    component.currentFilters = {};
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults when no currentFilters', () => {
    expect(component.form.value.effDatePeriod).toBeNull();
    expect(component.form.value.effDate).toBeNull();
    expect(component.form.value.termDatePeriod).toBeNull();
    expect(component.form.value.termDate).toBeNull();
  });

  describe('determinePeriod via currentFilters', () => {
    it('should set effDatePeriod to AFTER when effDateFrom is provided', () => {
      component.currentFilters = { effDateFrom: '2025-01-01' };
      component.ngOnInit();

      expect(component.form.value.effDatePeriod).toBe('AFTER');
    });

    it('should set termDatePeriod to BEFORE when termDateTo is provided', () => {
      component.currentFilters = { termDateTo: '2025-12-31' };
      component.ngOnInit();

      expect(component.form.value.termDatePeriod).toBe('BEFORE');
    });
  });

  describe('isApplyDisabled', () => {
    it('should return true when no dates are set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when date format errors exist', () => {
      component.form.get('effDate')?.setErrors({ invalidDateFormat: true });
      component.form.get('effDate')?.markAsTouched();

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with effDateFrom when period is AFTER', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2025-06-15');

      const testDate = new Date('2025-06-15');
      component.form.patchValue({
        effDatePeriod: 'AFTER',
        effDate: testDate
      });
      tick();

      // Manually set formChanged to true since we patched values
      (component as any).formChanged = true;

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ effDateFrom: '2025-06-15' })
      );
    }));

    it('should emit apply with effDateTo when period is BEFORE', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.returnValue('2025-06-15');

      const testDate = new Date('2025-06-15');
      component.form.patchValue({
        effDatePeriod: 'BEFORE',
        effDate: testDate
      });
      tick();

      (component as any).formChanged = true;

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ effDateTo: '2025-06-15' })
      );
    }));

    it('should not emit when isApplyDisabled is true', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset form and error messages', fakeAsync(() => {
      component.form.patchValue({
        effDatePeriod: 'AFTER',
        effDate: new Date(),
        termDatePeriod: 'BEFORE',
        termDate: new Date()
      });
      tick();

      component.onClearAll();

      expect(component.form.value.effDatePeriod).toBeNull();
      expect(component.form.value.effDate).toBeNull();
      expect(component.form.value.termDatePeriod).toBeNull();
      expect(component.form.value.termDate).toBeNull();
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    }));
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('date period validation', () => {
    it('should set effectiveDatePeriodError when date is set without period', fakeAsync(() => {
      component.form.patchValue({ effDate: new Date(), effDatePeriod: null });
      tick();

      expect(component.effectiveDatePeriodError).toBe('Period is required');
    }));

    it('should clear effectiveDatePeriodError when both date and period are set', fakeAsync(() => {
      component.form.patchValue({ effDate: new Date(), effDatePeriod: 'AFTER' });
      tick();

      expect(component.effectiveDatePeriodError).toBe('');
    }));
  });
});
