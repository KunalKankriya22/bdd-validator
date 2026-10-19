import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FilterSystemParameter } from './filter-system-parameter';

describe('FilterSystemParameter', () => {
  let component: FilterSystemParameter;
  let fixture: ComponentFixture<FilterSystemParameter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSystemParameter, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSystemParameter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize filter form on init', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('parameter')).toBeTruthy();
    expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('effectiveDate')).toBeTruthy();
    expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('terminationDate')).toBeTruthy();
  });




  describe('effectiveDatePeriodError', () => {
    it('should be empty when no date is set', () => {
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should show error when date is set but period is not', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: null });
      component['validateEffectiveDatePeriod']();
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should be empty when both date and period are set', () => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectiveDatePeriod: 'After' });
      component['validateEffectiveDatePeriod']();
      expect(component.effectiveDatePeriodError).toBe('');
    });
  });

  describe('terminationDatePeriodError', () => {
    it('should be empty when no date is set', () => {
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should show error when date is set but period is not', () => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationDatePeriod: null });
      component['validateTerminationDatePeriod']();
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });
  });
  describe('onApply', () => {

    it('should set error when date is provided without period', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: new Date()
      });
      // Trigger validation manually since patchValue sets formChanged via valueChanges
      component['validateEffectiveDatePeriod']();
      expect(component.effectiveDatePeriodError).toBe('Period is required');
      // isApplyDisabled should be true due to validation errors, so apply should not emit
      expect(component.isApplyDisabled).toBe(true);
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });
});
