import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ResourceStatusQueryFilterPanel } from './resource-status-query-filter-panel';
import { ResourceStatusQueryFilterValue } from '../models/resource-status-query.model';

describe('ResourceStatusQueryFilterPanel', () => {
  let component: ResourceStatusQueryFilterPanel;
  let fixture: ComponentFixture<ResourceStatusQueryFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResourceStatusQueryFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceStatusQueryFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null criticalInd', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('criticalInd')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      component.currentFilters = { criticalInd: 'Y' };
      fixture.detectChanges();

      expect(component.filterForm.get('criticalInd')?.value).toBe('Y');
    });

    it('should have criticalOptions with Yes and No', () => {
      fixture.detectChanges();

      expect(component.criticalOptions).toEqual([
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ criticalInd: 'Y' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({ criticalInd: 'Y' });
    });

    it('should emit null criticalInd for empty value', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ criticalInd: '' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({ criticalInd: null });
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.setErrors({ someError: true });
      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form on clear', () => {
      component.filterForm.patchValue({ criticalInd: 'Y' });

      component.onClear();

      expect(component.filterForm.get('criticalInd')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when criticalInd is null', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when criticalInd is Y', () => {
      component.filterForm.patchValue({ criticalInd: 'Y' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when criticalInd is N', () => {
      component.filterForm.patchValue({ criticalInd: 'N' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when form is invalid', () => {
      component.filterForm.setErrors({ someError: true });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null currentFilters', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('criticalInd')?.value).toBeNull();
    });

    it('should not throw when applying multiple times', () => {
      fixture.detectChanges();
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ criticalInd: 'Y' });
      component.onApply();
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledTimes(2);
    });
  });
});
