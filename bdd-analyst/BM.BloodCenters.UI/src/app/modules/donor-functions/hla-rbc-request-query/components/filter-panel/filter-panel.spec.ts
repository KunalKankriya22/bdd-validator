import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HlaRbcFilterPanel } from './filter-panel';

describe('HlaRbcFilterPanel', () => {
  let component: HlaRbcFilterPanel;
  let fixture: ComponentFixture<HlaRbcFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlaRbcFilterPanel, NoopAnimationsModule, ReactiveFormsModule]
    });

    // Override template to prevent mat-select CVA from interfering with form reset
    TestBed.overrideTemplate(HlaRbcFilterPanel, '<div></div>');

    fixture = TestBed.createComponent(HlaRbcFilterPanel);
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
      level: null,
      pattern: '',
      abo: '',
      antigens: ''
    });
  });

  it('should default mode to donors', () => {
    expect(component.mode).toBe('donors');
  });

  describe('onApply', () => {
    it('should emit filtersApplied with populated values', () => {
      spyOn(component.filtersApplied, 'emit');

      component.filterForm.patchValue({
        showGradeThrough: 'A',
        grades: ['G1', 'G2'],
        level: 3,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        showGradeThrough: 'A',
        grades: ['G1', 'G2'],
        level: 3,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });
    });

    it('should emit undefined for empty/null fields', () => {
      spyOn(component.filtersApplied, 'emit');

      component.filterForm.patchValue({
        showGradeThrough: '',
        grades: [],
        level: null,
        pattern: '',
        abo: '',
        antigens: ''
      });

      component.onApply();

      expect(component.filtersApplied.emit).toHaveBeenCalledWith({
        showGradeThrough: undefined,
        grades: undefined,
        level: undefined,
        pattern: undefined,
        abo: undefined,
        antigens: undefined
      });
    });
  });

  describe('onClearAll', () => {
    it('should reset the form and search controls', () => {
      component.filterForm.patchValue({
        showGradeThrough: 'A',
        grades: ['G1'],
        level: 2,
        pattern: 'P1',
        abo: 'O+',
        antigens: 'Ag1'
      });
      component.gradeSearchControl.setValue('search');

      component.onClearAll();
      fixture.detectChanges();

      expect(component.filterForm.get('showGradeThrough')?.value).toBe('');
      expect(component.filterForm.get('grades')?.value).toEqual([]);
      expect(component.filterForm.get('level')?.value).toBeNull();
      expect(component.gradeSearchControl.value).toBe('');
      expect(component.aboSearchControl.value).toBe('');
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
        showGradeThrough: 'B',
        grades: ['G3'],
        level: 5,
        pattern: 'P2',
        abo: 'A-',
        antigens: 'Ag2'
      });

      expect(component.filterForm.value.showGradeThrough).toBe('B');
      expect(component.filterForm.value.grades).toEqual(['G3']);
      expect(component.filterForm.value.level).toBe(5);
    });

    it('should handle null/undefined values gracefully', () => {
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
      component.levelOptions = [1, 2, 10];
      component.patternOptions = ['Pat1', 'Pat2'];
      component.aboOptions = ['O+', 'A-'];
      component.antigenOptions = ['Ag1', 'Ag2'];
    });

    it('should return all options when search is empty', () => {
      component.gradeSearchControl.setValue('');
      expect(component.filteredGradeOptions.length).toBe(2);
    });

    it('should filter grade options by search term', () => {
      component.gradeSearchControl.setValue('alp');
      expect(component.filteredGradeOptions.length).toBe(1);
      expect(component.filteredGradeOptions[0].label).toBe('Alpha');
    });

    it('should filter level options by search term', () => {
      component.levelSearchControl.setValue('1');
      expect(component.filteredLevelOptions).toEqual([1, 10]);
    });

    it('should filter pattern options by search term', () => {
      component.patternSearchControl.setValue('pat1');
      expect(component.filteredPatternOptions).toEqual(['Pat1']);
    });
  });
});
