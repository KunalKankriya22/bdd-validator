import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

import { FinduFilterPanelComponent } from './findu-filter-panel.component';
import { StatusFilterValue } from '../models/findu.models';

describe('FinduFilterPanelComponent', () => {
  let component: FinduFilterPanelComponent;
  let fixture: ComponentFixture<FinduFilterPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinduFilterPanelComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FinduFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {

    it('should initialize form with blank values when no current filters', () => {
      expect(component.filterForm.get('expired')?.value).toBe('');
      expect(component.filterForm.get('interdicted')?.value).toBe('');
      expect(component.filterForm.get('available')?.value).toBe('');
      expect(component.filterForm.get('labeled')?.value).toBe('');
      expect(component.filterForm.get('rejected')?.value).toBe('');
      expect(component.filterForm.get('tested')?.value).toBe('');
      expect(component.filterForm.get('shipped')?.value).toBe('');
    });


    it('should have 7 status filter fields only', () => {
      const formControls = Object.keys(component.filterForm.controls);
      expect(formControls.length).toBe(7);
      expect(formControls).toEqual([
        'expired', 'interdicted', 'available', 'labeled',
        'rejected', 'tested', 'shipped'
      ]);
    });
  });

  describe('Filter Actions', () => {

    it('should clear all status filters on clear', () => {
      component.filterForm.patchValue({
        expired: 'Y',
        available: 'Y',
        shipped: 'N'
      });

      component.onClear();
      fixture.detectChanges();

      expect(component.filterForm.get('expired')?.value).toBe('');
      expect(component.filterForm.get('available')?.value).toBe('');
      expect(component.filterForm.get('shipped')?.value).toBe('');
    });

    it('should emit applied filters on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        expired: 'Y',
        available: 'N'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        expired: 'Y',
        available: 'N',
        interdicted: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      }));
    });

    it('should emit null for empty filter values on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        expired: '',
        interdicted: '',
        available: '',
        labeled: '',
        rejected: '',
        tested: '',
        shipped: ''
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      });
    });

    it('should emit close event on close', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Pre-populate from currentFilters', () => {
    it('should initialize form with current filter values when provided', () => {
      const filtersFixture = TestBed.createComponent(FinduFilterPanelComponent);
      const filtersComponent = filtersFixture.componentInstance;
      filtersComponent.currentFilters = {
        expired: 'Y',
        interdicted: 'N',
        available: null,
        labeled: null,
        rejected: 'Y',
        tested: null,
        shipped: null
      };
      filtersFixture.detectChanges();

      expect(filtersComponent.filterForm.get('expired')?.value).toBe('Y');
      expect(filtersComponent.filterForm.get('interdicted')?.value).toBe('N');
      expect(filtersComponent.filterForm.get('rejected')?.value).toBe('Y');
      expect(filtersComponent.filterForm.get('available')?.value).toBe('');
    });

    it('should use empty string for null filter values', () => {
      const filtersFixture = TestBed.createComponent(FinduFilterPanelComponent);
      const filtersComponent = filtersFixture.componentInstance;
      filtersComponent.currentFilters = {
        expired: null,
        interdicted: null,
        available: null,
        labeled: null,
        rejected: null,
        tested: null,
        shipped: null
      };
      filtersFixture.detectChanges();

      expect(filtersComponent.filterForm.get('expired')?.value).toBe('');
      expect(filtersComponent.filterForm.get('shipped')?.value).toBe('');
    });
  });

  describe('Yes/No Options', () => {
    it('should have exactly 2 yes/no options', () => {
      expect(component.yesNoBlankOptions.length).toBe(2);
    });

    it('should have Y and N values', () => {
      const values = component.yesNoBlankOptions.map(o => o.value);
      expect(values).toEqual(['Y', 'N']);
    });

    it('should have Yes and No labels', () => {
      const labels = component.yesNoBlankOptions.map(o => o.label);
      expect(labels).toEqual(['Yes', 'No']);
    });
  });

  describe('Clear resets all fields', () => {
    it('should reset all 7 fields to empty string', () => {
      component.filterForm.patchValue({
        expired: 'Y',
        interdicted: 'N',
        available: 'Y',
        labeled: 'N',
        rejected: 'Y',
        tested: 'N',
        shipped: 'Y'
      });

      component.onClear();

      const controls = Object.keys(component.filterForm.controls);
      controls.forEach(key => {
        expect(component.filterForm.get(key)?.value).toBe('');
      });
    });

    it('should not emit apply event on clear', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ expired: 'Y' });
      component.onClear();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle applying when all fields are set', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        expired: 'Y',
        interdicted: 'N',
        available: 'Y',
        labeled: 'N',
        rejected: 'Y',
        tested: 'N',
        shipped: 'Y'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        expired: 'Y',
        interdicted: 'N',
        available: 'Y',
        labeled: 'N',
        rejected: 'Y',
        tested: 'N',
        shipped: 'Y'
      });
    });

    it('should handle partial filter values on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        expired: 'Y',
        interdicted: '',
        available: 'N'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.expired).toBe('Y');
      expect(emittedValue.interdicted).toBeNull();
      expect(emittedValue.available).toBe('N');
    });

    it('should handle repeated clear calls', () => {
      component.filterForm.patchValue({ expired: 'Y' });
      component.onClear();
      component.onClear();
      expect(component.filterForm.get('expired')?.value).toBe('');
    });

    it('should handle apply after clear', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ expired: 'Y' });
      component.onClear();
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.expired).toBeNull();
    });
  });
});
