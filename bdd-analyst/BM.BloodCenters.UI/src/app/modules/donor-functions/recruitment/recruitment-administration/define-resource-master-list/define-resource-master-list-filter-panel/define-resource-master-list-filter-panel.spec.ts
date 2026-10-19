import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DefineResourceMasterListFilterPanel } from './define-resource-master-list-filter-panel';
import { DefineResourceMasterListFilterValue } from '../models/define-resource-master-list.model';

describe('DefineResourceMasterListFilterPanel', () => {
  let component: DefineResourceMasterListFilterPanel;
  let fixture: ComponentFixture<DefineResourceMasterListFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [DefineResourceMasterListFilterPanel, ReactiveFormsModule, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DefineResourceMasterListFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should initialize form with default values when no current filters', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('showTermination')?.value).toBe('No');
      expect(component.filterForm.get('critical')?.value).toBe('Both (Yes & No)');
      expect(component.filterForm.get('periodType1')?.value).toBe('After');
      expect(component.filterForm.get('periodType2')?.value).toBe('Before');
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize form with current filters when provided', () => {
      const currentFilters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        showTermination: 'Yes',
        critical: 'Yes',
        periodType1: 'On or After',
        effectiveDate: new Date('2024-01-01'),
        periodType2: 'On or Before',
        terminationDate: new Date('2024-12-31')
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('showTermination')?.value).toBe('Yes');
      expect(component.filterForm.get('critical')?.value).toBe('Yes');
      expect(component.filterForm.get('periodType1')?.value).toBe('On or After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(new Date('2024-01-01'));
      expect(component.filterForm.get('periodType2')?.value).toBe('On or Before');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(new Date('2024-12-31'));
    });

    it('should use default values for missing fields in current filters', () => {
      const currentFilters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        showTermination: 'Yes',
        critical: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      component.currentFilters = currentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('showTermination')?.value).toBe('Yes');
      expect(component.filterForm.get('critical')?.value).toBe('Both (Yes & No)');
      expect(component.filterForm.get('periodType1')?.value).toBe('After');
      expect(component.filterForm.get('periodType2')?.value).toBe('Before');
    });
  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      component.currentFilters = null;
      fixture.detectChanges();
    });


    it('should include current filter values not in form', () => {
      component.currentFilters = {
        resourceCode: 'STAFF',
        type: 'COACH',
        sequence: 5,
        showTermination: null,
        critical: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.resourceCode).toBe('STAFF');
      expect(emittedValue.type).toBe('COACH');
      expect(emittedValue.sequence).toBe(5);
    });

    it('should emit null for unset values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showTermination: null,
        critical: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.showTermination).toBeNull();
      expect(emittedValue.critical).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });

    it('should apply filters with only showTermination set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showTermination: 'Yes'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.showTermination).toBe('Yes');
    });

    it('should apply filters with only critical set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        critical: 'Yes'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.critical).toBe('Yes');
    });

    it('should apply filters with only effective date and period', () => {
      spyOn(component.apply, 'emit');

      const effectiveDate = new Date('2024-01-15');
      component.filterForm.patchValue({
        periodType1: 'On or After',
        effectiveDate: effectiveDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodType1).toBe('On or After');
      expect(emittedValue.effectiveDate).toBe(effectiveDate);
    });

    it('should apply filters with only termination date and period', () => {
      spyOn(component.apply, 'emit');

      const terminationDate = new Date('2024-12-31');
      component.filterForm.patchValue({
        periodType2: 'On or Before',
        terminationDate: terminationDate
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodType2).toBe('On or Before');
      expect(emittedValue.terminationDate).toBe(terminationDate);
    });
  });

  describe('Clear Filters', () => {
    beforeEach(() => {
      component.currentFilters = null;
      fixture.detectChanges();
    });


    it('should clear dates while keeping default period types', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('periodType1')?.value).toBe('After');
      expect(component.filterForm.get('periodType2')?.value).toBe('Before');
    });
  });
  describe('Form State Management', () => {
    beforeEach(() => {
      component.currentFilters = null;
      fixture.detectChanges();
    });


    it('should handle multiple filter combinations', () => {
      const testCases = [
        {
          showTermination: 'Yes',
          critical: 'Yes',
          periodType1: 'After',
          effectiveDate: new Date('2024-01-01'),
          periodType2: 'Before',
          terminationDate: null
        },
        {
          showTermination: 'No',
          critical: 'Both (Yes & No)',
          periodType1: 'On or After',
          effectiveDate: null,
          periodType2: 'On or Before',
          terminationDate: new Date('2024-12-31')
        },
        {
          showTermination: 'Yes',
          critical: 'No',
          periodType1: 'After',
          effectiveDate: new Date('2024-01-01'),
          periodType2: 'Before',
          terminationDate: new Date('2024-12-31')
        }
      ];

      testCases.forEach(testCase => {
        component.filterForm.patchValue(testCase);
        expect(component.filterForm.valid).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null current filters gracefully', () => {
      component.currentFilters = null;

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.filterForm).toBeDefined();
    });


    it('should preserve current filters when applying', () => {
      component.currentFilters = {
        resourceCode: 'STAFF',
        type: 'COACH',
        sequence: 10,
        showTermination: 'Yes',
        critical: 'No',
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };
      fixture.detectChanges();

      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        showTermination: 'No',
        critical: 'Yes'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.resourceCode).toBe('STAFF');
      expect(emittedValue.type).toBe('COACH');
      expect(emittedValue.sequence).toBe(10);
      expect(emittedValue.showTermination).toBe('No');
      expect(emittedValue.critical).toBe('Yes');
    });
  });
});
