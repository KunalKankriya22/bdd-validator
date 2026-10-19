import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DonorFilterPanel } from './donor-filter-panel';

describe('DonorFilterPanel', () => {
  let component: DonorFilterPanel;
  let fixture: ComponentFixture<DonorFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonorFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    // Override template to prevent mat-select CVA from interfering with form reset
    TestBed.overrideTemplate(DonorFilterPanel, '<div></div>');

    fixture = TestBed.createComponent(DonorFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.filterForm.value).toEqual({
      showGradeThrough: '',
      grades: [],
      level: null
    });
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when showGradeThrough is set', () => {
      component.filterForm.patchValue({ showGradeThrough: 'A' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when grades are selected', () => {
      component.filterForm.patchValue({ grades: ['G1'] });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when level is selected', () => {
      component.filterForm.patchValue({ level: 3 });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply', () => {
    it('should emit filtersApplied with populated values', () => {
      spyOn(component.filtersApplied, 'emit');

      component.filterForm.patchValue({
        showGradeThrough: 'B',
        grades: ['G1', 'G2'],
        level: 5
      });

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        showGradeThrough: 'B',
        grades: ['G1', 'G2'],
        level: 5
      });
    });

    it('should emit undefined for empty fields', () => {
      spyOn(component.filtersApplied, 'emit');

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        showGradeThrough: undefined,
        grades: undefined,
        level: undefined
      });
    });
  });

  describe('onClearAll', () => {
    it('should reset form and search controls', () => {
      component.filterForm.patchValue({
        showGradeThrough: 'A',
        grades: ['G1'],
        level: 2
      });
      component.gradeSearchControl.setValue('test');
      component.showGradeThroughSearchControl.setValue('test');

      component.onClearAll();
      fixture.detectChanges();

      expect(component.filterForm.get('showGradeThrough')?.value).toBe('');
      expect(component.filterForm.get('grades')?.value).toEqual([]);
      expect(component.filterForm.get('level')?.value).toBeNull();
      expect(component.gradeSearchControl.value).toBe('');
      expect(component.showGradeThroughSearchControl.value).toBe('');
    });
  });

  describe('onCancel', () => {
    it('should emit filtersCanceled', () => {
      spyOn(component.filtersCanceled, 'emit');

      component.onCancel();

      expect(component.filtersCanceled.emit).toHaveBeenCalled();
    });
  });

  describe('setFilters', () => {
    it('should patch form values from provided filter object', () => {
      component.setFilters({
        showGradeThrough: 'C',
        grades: ['G3'],
        level: 7
      });

      expect(component.filterForm.value.showGradeThrough).toBe('C');
      expect(component.filterForm.value.grades).toEqual(['G3']);
      expect(component.filterForm.value.level).toBe(7);
    });

    it('should handle missing properties with defaults', () => {
      component.setFilters({});

      expect(component.filterForm.value.showGradeThrough).toBe('');
      expect(component.filterForm.value.grades).toEqual([]);
      expect(component.filterForm.value.level).toBeNull();
    });
  });

  describe('filtered option getters', () => {
    beforeEach(() => {
      component.gradeOptions = [
        { value: 'A', label: 'Alpha' },
        { value: 'B', label: 'Beta' }
      ];
    });

    it('should return all grade options when search is empty', () => {
      component.gradeSearchControl.setValue('');
      expect(component.filteredGradeOptions.length).toBe(2);
    });

    it('should filter grade options by label', () => {
      component.gradeSearchControl.setValue('alp');
      expect(component.filteredGradeOptions.length).toBe(1);
      expect(component.filteredGradeOptions[0].label).toBe('Alpha');
    });

    it('should filter showGradeThrough options by label', () => {
      component.showGradeThroughSearchControl.setValue('beta');
      expect(component.filteredShowGradeThroughOptions.length).toBe(1);
      expect(component.filteredShowGradeThroughOptions[0].label).toBe('Beta');
    });
  });
});
