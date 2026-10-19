import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ChapterFilterPanel, ChapterFilterValue } from './chapter-filter-panel';

describe('ChapterFilterPanel', () => {
  let component: ChapterFilterPanel;
  let fixture: ComponentFixture<ChapterFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChapterFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(ChapterFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when effectivePeriod is set', () => {
      component.filterForm.patchValue({ effectivePeriod: 'after' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when effective period error exists', () => {
      component.hasEffectivePeriodError = true;
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when termination period error exists', () => {
      component.hasTerminationPeriodError = true;
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when date has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      component.filterForm.patchValue({ effectivePeriod: 'after' });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter values when form is valid', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        effectivePeriod: 'after',
        effectiveDate: testDate,
        terminationPeriod: null,
        terminationDate: null
      });
      tick();

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          effectivePeriod: 'after',
          effectiveDate: testDate
        })
      );
    }));

    it('should not emit when form has errors', fakeAsync(() => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectivePeriod: null
      });
      tick();

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onClear', () => {
    it('should reset form and clear error flags', () => {
      component.filterForm.patchValue({
        effectivePeriod: 'after',
        effectiveDate: new Date(),
        terminationPeriod: 'before',
        terminationDate: new Date()
      });
      component.hasEffectivePeriodError = true;
      component.hasTerminationPeriodError = true;

      component.onClear();

      expect(component.filterForm.value.effectivePeriod).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationPeriod).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
      expect(component.hasEffectivePeriodError).toBeFalse();
      expect(component.hasTerminationPeriodError).toBeFalse();
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
    it('should set hasEffectivePeriodError when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectivePeriod: null });
      tick();

      expect(component.hasEffectivePeriodError).toBeTrue();
    }));

    it('should clear hasEffectivePeriodError when period is selected', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectivePeriod: 'after' });
      tick();

      expect(component.hasEffectivePeriodError).toBeFalse();
    }));

    it('should set hasTerminationPeriodError when date is set without period', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationPeriod: null });
      tick();

      expect(component.hasTerminationPeriodError).toBeTrue();
    }));
  });

  describe('currentFilters input', () => {
    it('should populate form from currentFilters on init', () => {
      const testFilters: ChapterFilterValue = {
        effectivePeriod: 'before',
        effectiveDate: new Date('2025-01-01'),
        terminationPeriod: null,
        terminationDate: null
      };

      component.currentFilters = testFilters;
      component.ngOnInit();

      expect(component.filterForm.value.effectivePeriod).toBe('before');
      expect(component.filterForm.value.effectiveDate).toEqual(new Date('2025-01-01'));
    });
  });
});
