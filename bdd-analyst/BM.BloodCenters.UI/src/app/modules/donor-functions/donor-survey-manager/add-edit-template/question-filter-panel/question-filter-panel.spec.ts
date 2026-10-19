import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { QuestionFilterPanel, QuestionFilterValue } from './question-filter-panel';

describe('QuestionFilterPanel', () => {
  let component: QuestionFilterPanel;
  let fixture: ComponentFixture<QuestionFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuestionFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(QuestionFilterPanel);
    component = fixture.componentInstance;
    component.responseTypeOptions = ['S', 'M', 'C', 'R'];
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      sex: null,
      responseType: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });
  });

  it('should have response type labels defined', () => {
    expect(component.responseTypeLabels).toEqual({
      S: 'Single',
      M: 'Multiple',
      C: 'Comment',
      R: 'Ranking'
    });
  });

  describe('hasChanges tracking', () => {
    it('should start with hasChanges false', () => {
      expect(component.hasChanges).toBeFalse();
    });

    it('should set hasChanges to true when form value changes', fakeAsync(() => {
      component.filterForm.patchValue({ sex: 'M' });
      tick();

      expect(component.hasChanges).toBeTrue();
    }));
  });

  describe('onApply', () => {
    it('should emit apply with filter values when form is valid', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        sex: 'M',
        responseType: 'S'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sex: 'M',
          responseType: 'S'
        })
      );
    });

    it('should not emit when form is invalid', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({ effDate: testDate, effDatePeriod: null });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));

    it('should clear effDatePeriod when effDate is null', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ sex: 'F', effDate: null, effDatePeriod: 'after' });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effDatePeriod: null
        })
      );
    });

    it('should reset hasChanges after successful apply', () => {
      component.filterForm.patchValue({ sex: 'M' });
      component.hasChanges = true;

      component.onApply();

      expect(component.hasChanges).toBeFalse();
    });
  });

  describe('onClear', () => {
    it('should reset form and emit clearAll with empty filters', () => {
      spyOn(component.clearAll, 'emit');

      component.filterForm.patchValue({ sex: 'M', responseType: 'S' });

      component.onClear();

      expect(component.filterForm.value.sex).toBeNull();
      expect(component.filterForm.value.responseType).toBeNull();
      expect(component.hasChanges).toBeFalse();
      expect(component.hasActiveFilters).toBeFalse();
      expect(component.clearAll.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sex: null,
          responseType: null
        })
      );
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('date period validation', () => {
    it('should report effDatePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({ effDate: new Date(), effDatePeriod: null });

      expect(component.effDatePeriodRequired).toBeTrue();
    });

    it('should not report effDatePeriodRequired when both are set', () => {
      component.filterForm.patchValue({ effDate: new Date(), effDatePeriod: 'after' });

      expect(component.effDatePeriodRequired).toBeFalse();
    });

    it('should report termDatePeriodRequired when date is set without period', () => {
      component.filterForm.patchValue({ termDate: new Date(), termDatePeriod: null });

      expect(component.termDatePeriodRequired).toBeTrue();
    });
  });

  describe('error message helpers', () => {
    it('should return empty string for getEffDatePeriodError when not touched', () => {
      expect(component.getEffDatePeriodError()).toBe('');
    });

    it('should return period required error when touched and invalid', fakeAsync(() => {
      const control = component.filterForm.get('effDatePeriod');
      component.filterForm.patchValue({ effDate: new Date() });
      tick();

      control?.markAsTouched();
      control?.updateValueAndValidity();

      expect(component.getEffDatePeriodError()).toBe('Period is required');
    }));
  });

  describe('currentFilters input', () => {
    it('should populate form from currentFilters on init', () => {
      const filters: QuestionFilterValue = {
        sex: 'F',
        responseType: 'M',
        effDatePeriod: null,
        effDate: null,
        termDatePeriod: null,
        termDate: null
      };

      component.currentFilters = filters;
      component.ngOnInit();

      expect(component.filterForm.value.sex).toBe('F');
      expect(component.filterForm.value.responseType).toBe('M');
    });
  });
});
