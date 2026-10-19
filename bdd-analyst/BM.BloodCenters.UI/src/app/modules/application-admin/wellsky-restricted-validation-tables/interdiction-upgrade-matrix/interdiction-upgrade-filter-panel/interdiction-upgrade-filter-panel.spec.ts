import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { InterdictionUpgradeFilterPanel } from './interdiction-upgrade-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormControl } from '@angular/forms';
import { of } from 'rxjs';
import { InterdictionUpgradeMatrixFilterValue } from '../models/interdiction-upgrade-matrix.model';

describe('InterdictionUpgradeFilterPanel', () => {
  let component: InterdictionUpgradeFilterPanel;
  let fixture: ComponentFixture<InterdictionUpgradeFilterPanel>;

  const mockFilterLov = {
    sourceInterdiction: ['SRC001', 'SRC002', 'SRC003'],
    existingInterdiction: ['EXT001', 'EXT002', 'EXT003'],
    actionInterdiction: ['ACT001', 'ACT002', 'ACT003'],
    action: ['P', 'R']
  };

  const mockInterdictionCodes = [
    { interCode: 'SRC001', interDesc: 'Source 1' },
    { interCode: 'SRC002', interDesc: 'Source 2' },
    { interCode: 'SRC003', interDesc: 'Source 3' },
    { interCode: 'EXT001', interDesc: 'Existing 1' },
    { interCode: 'EXT002', interDesc: 'Existing 2' },
    { interCode: 'EXT003', interDesc: 'Existing 3' },
    { interCode: 'ACT001', interDesc: 'Action 1' },
    { interCode: 'ACT002', interDesc: 'Action 2' },
    { interCode: 'ACT003', interDesc: 'Action 3' }
  ];

  const mockCurrentFilters: InterdictionUpgradeMatrixFilterValue = {
    sourceInterdiction: 'SRC001',
    existingInterdiction: 'EXT001',
    actionInterdiction: 'ACT001',
    action: 'P'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InterdictionUpgradeFilterPanel]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterdictionUpgradeFilterPanel);
    component = fixture.componentInstance;
  });

  function setupFilterInputsAndPopulate(): void {
    component.filterLov = mockFilterLov as any;
    component.interdictionCodes = mockInterdictionCodes;
    fixture.detectChanges();
    component.populateFilterOptions();
  }

  describe('Component Initialization', () => {
    it('should initialize with empty arrays for options', () => {
      expect(component.sourceInterdictionOptions).toEqual([]);
      expect(component.existingInterdictionOptions).toEqual([]);
      expect(component.actionInterdictionOptions).toEqual([]);
      expect(component.actionOptions).toEqual([]);
    });

    it('should initialize filtered options arrays as empty', () => {
      expect(component.filteredSourceOptions).toEqual([]);
      expect(component.filteredExistingOptions).toEqual([]);
      expect(component.filteredActionInterdictionOptions).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should initialize form with currentFilters values', () => {
      component.currentFilters = mockCurrentFilters;
      fixture.detectChanges();

      expect(component.filterForm.get('sourceInterdiction')?.value).toBe('SRC001');
      expect(component.filterForm.get('existingInterdiction')?.value).toBe('EXT001');
      expect(component.filterForm.get('actionInterdiction')?.value).toBe('ACT001');
      expect(component.filterForm.get('action')?.value).toBe('Place');
    });
  });

  describe('populateFilterOptions', () => {
    it('should populate filter options from inputs', () => {
      setupFilterInputsAndPopulate();

      expect(component.sourceInterdictionOptions.length).toBe(3);
      expect(component.sourceInterdictionOptions[0].interCode).toBe('SRC001');
      expect(component.existingInterdictionOptions.length).toBe(3);
      expect(component.actionInterdictionOptions.length).toBe(3);
    });

    it('should map action values from P/R to Place/Release', () => {
      setupFilterInputsAndPopulate();

      expect(component.actionOptions).toEqual(['Place', 'Release']);
    });

    it('should initialize filtered options with all options after loading', () => {
      setupFilterInputsAndPopulate();

      expect(component.filteredSourceOptions.length).toBe(3);
      expect(component.filteredExistingOptions.length).toBe(3);
      expect(component.filteredActionInterdictionOptions.length).toBe(3);
    });

    it('should handle null filterLov gracefully', () => {
      component.filterLov = null;
      fixture.detectChanges();
      component.populateFilterOptions();

      expect(component.sourceInterdictionOptions).toEqual([]);
      expect(component.existingInterdictionOptions).toEqual([]);
      expect(component.actionInterdictionOptions).toEqual([]);
      expect(component.actionOptions).toEqual([]);
    });

    it('should handle empty arrays in filterLov', () => {
      component.filterLov = {
        sourceInterdiction: [],
        existingInterdiction: [],
        actionInterdiction: [],
        action: []
      } as any;
      fixture.detectChanges();
      component.populateFilterOptions();

      expect(component.sourceInterdictionOptions).toEqual([]);
      expect(component.existingInterdictionOptions).toEqual([]);
      expect(component.actionInterdictionOptions).toEqual([]);
      expect(component.actionOptions).toEqual([]);
    });

    it('should set isLoadingFilters to false after populating', () => {
      setupFilterInputsAndPopulate();

      expect(component.isLoadingFilters).toBe(false);
    });
  });

  describe('Search Controls', () => {
    beforeEach(() => {
      setupFilterInputsAndPopulate();
    });

    it('should filter sourceInterdictionOptions when sourceSearchControl value changes', fakeAsync(() => {
      component.sourceSearchControl.setValue('SRC');
      tick();

      expect(component.filteredSourceOptions.length).toBe(3);
    }));

    it('should filter case-insensitively', fakeAsync(() => {
      component.sourceSearchControl.setValue('src001');
      tick();

      expect(component.filteredSourceOptions.length).toBe(1);
      expect(component.filteredSourceOptions[0].interCode).toBe('SRC001');
    }));

    it('should filter existingInterdictionOptions independently', fakeAsync(() => {
      component.existingSearchControl.setValue('EXT');
      tick();

      expect(component.filteredExistingOptions.length).toBe(3);
    }));

    it('should filter actionInterdictionOptions independently', fakeAsync(() => {
      component.actionInterdictionSearchControl.setValue('ACT');
      tick();

      expect(component.filteredActionInterdictionOptions.length).toBe(3);
    }));
  });

  describe('Action Mapping', () => {
    it('should map P to Place', () => {
      const result = component['mapBackendActionToFrontend']('P');
      expect(result).toBe('Place');
    });

    it('should map R to Release', () => {
      const result = component['mapBackendActionToFrontend']('R');
      expect(result).toBe('Release');
    });

    it('should return original value for unknown action', () => {
      const result = component['mapBackendActionToFrontend']('X');
      expect(result).toBe('X');
    });

    it('should map Place to P', () => {
      const result = component['mapFrontendActionToBackend']('Place');
      expect(result).toBe('P');
    });

    it('should map Release to R', () => {
      const result = component['mapFrontendActionToBackend']('Release');
      expect(result).toBe('R');
    });

    it('should return original value for unknown frontend action', () => {
      const result = component['mapFrontendActionToBackend']('Unknown');
      expect(result).toBe('Unknown');
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should map action from frontend to backend format', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'Release'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        action: 'R'
      }));
    });

    it('should handle empty string as null for action', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: ''
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        action: null
      }));
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true (disabled) when form is empty', () => {
      component.filterForm.patchValue({
        sourceInterdiction: null,
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false (enabled) when form has values', () => {
      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: 'Place'
      });

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false (enabled) when form has at least one filter value', () => {
      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      });

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true (disabled) after clear all when no filters selected', () => {
      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        action: 'Place'
      });

      component.onClear();

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Filter Form Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get filter form value correctly', () => {
      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'Place'
      });

      const formValue = component.filterForm.value;

      expect(formValue.sourceInterdiction).toBe('SRC001');
      expect(formValue.existingInterdiction).toBe('EXT001');
      expect(formValue.actionInterdiction).toBe('ACT001');
      expect(formValue.action).toBe('Place');
    });
  });

  describe('Template Rendering - ngx-mat-select-search', () => {
    it('should render mat-select with ngx-mat-select-search', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const matSelects = compiled.querySelectorAll('mat-select');
      expect(matSelects.length).toBeGreaterThan(0);
    }));
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      setupFilterInputsAndPopulate();
    });

    it('should allow selecting and applying filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        action: 'Place'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        sourceInterdiction: 'SRC001',
        action: 'P'
      }));
    });

    it('should allow clearing and reselecting filters', () => {
      component.filterForm.patchValue({
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001'
      });

      component.onClear();

      expect(component.filterForm.get('sourceInterdiction')?.value).toBeNull();
      expect(component.filterForm.get('existingInterdiction')?.value).toBeNull();

      component.filterForm.patchValue({
        sourceInterdiction: 'SRC002'
      });

      expect(component.filterForm.get('sourceInterdiction')?.value).toBe('SRC002');
    });
  });
});
