import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UnitFilterPanel } from './unit-filter-panel';

describe('UnitFilterPanel', () => {
  let component: UnitFilterPanel;
  let fixture: ComponentFixture<UnitFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UnitFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    // Override template to prevent mat-select CVA from interfering with form reset
    TestBed.overrideTemplate(UnitFilterPanel, '<div></div>');

    fixture = TestBed.createComponent(UnitFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.filterForm.value).toEqual({
      grades: [],
      level: null,
      pattern: '',
      abo: '',
      antigens: ''
    });
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when grades are selected', () => {
      component.filterForm.patchValue({ grades: ['G1'] });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when level is set', () => {
      component.filterForm.patchValue({ level: 2 });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when pattern is set', () => {
      component.filterForm.patchValue({ pattern: 'P1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when abo is set', () => {
      component.filterForm.patchValue({ abo: 'O+' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when antigens is set', () => {
      component.filterForm.patchValue({ antigens: 'Ag1' });
      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('onApply', () => {
    it('should emit filtersApplied with populated values', () => {
      spyOn(component.filtersApplied, 'emit');

      component.filterForm.patchValue({
        grades: ['G1', 'G2'],
        level: 3,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        grades: ['G1', 'G2'],
        level: 3,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });
    });

    it('should emit undefined for empty fields', () => {
      spyOn(component.filtersApplied, 'emit');

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        grades: undefined,
        level: undefined,
        pattern: undefined,
        abo: undefined,
        antigens: undefined
      });
    });
  });

  describe('onClearAll', () => {
    it('should reset form and all search controls', () => {
      component.filterForm.patchValue({
        grades: ['G1'],
        level: 2,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });
      component.gradeSearchControl.setValue('search');
      component.aboSearchControl.setValue('search');

      component.onClearAll();
      fixture.detectChanges();

      expect(component.filterForm.get('grades')?.value).toEqual([]);
      expect(component.filterForm.get('level')?.value).toBeNull();
      expect(component.filterForm.get('pattern')?.value).toBe('');
      expect(component.gradeSearchControl.value).toBe('');
      expect(component.aboSearchControl.value).toBe('');
      expect(component.antigenSearchControl.value).toBe('');
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
        grades: ['G3'],
        level: 5,
        pattern: 'P2',
        abo: 'A-',
        antigens: 'Ag2'
      });

      expect(component.filterForm.value.grades).toEqual(['G3']);
      expect(component.filterForm.value.level).toBe(5);
      expect(component.filterForm.value.abo).toBe('A-');
    });
  });

  describe('filtered option getters', () => {
    beforeEach(() => {
      component.gradeOptions = [
        { value: 'A', label: 'Alpha' },
        { value: 'B', label: 'Beta' }
      ];
      component.levelOptions = [1, 2, 10];
      component.patternOptions = ['Pat1', 'Pat2'];
      component.aboOptions = ['O+', 'A-'];
      component.antigenOptions = ['Ag1', 'Ag2'];
    });

    it('should return all options when search is empty', () => {
      component.gradeSearchControl.setValue('');
      expect(component.filteredGradeOptions.length).toBe(2);
    });

    it('should filter options by search term', () => {
      component.aboSearchControl.setValue('O');
      expect(component.filteredAboOptions).toEqual(['O+']);
    });

    it('should filter antigen options by search term', () => {
      component.antigenSearchControl.setValue('ag1');
      expect(component.filteredAntigenOptions).toEqual(['Ag1']);
    });
  });
});
