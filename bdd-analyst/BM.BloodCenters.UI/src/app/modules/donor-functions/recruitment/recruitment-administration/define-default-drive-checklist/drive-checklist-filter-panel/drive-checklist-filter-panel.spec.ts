import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Observable } from 'rxjs';

import { DriveChecklistFilterPanel } from './drive-checklist-filter-panel';
import { DefineDefaultDriveChecklistService } from '../services/define-default-drive-checklist.service';
import { DriveChecklistFilterValue, DriveChecklistFilterLov } from '../models/define-default-drive-checklist.model';

describe('DriveChecklistFilterPanel', () => {
  let component: DriveChecklistFilterPanel;
  let fixture: ComponentFixture<DriveChecklistFilterPanel>;
  let mockService: jasmine.SpyObj<DefineDefaultDriveChecklistService>;

  const mockFilterOptions: DriveChecklistFilterLov = {
    timeline: [
      { key: 'Before Drive', value: 'BD' },
      { key: 'After Drive', value: 'AD' },
      { key: 'On Drive Date', value: 'DD' },
      { key: 'After Creation', value: 'CD' }
    ]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDefaultDriveChecklistService', [
      'getDriveChecklistFilters'
    ]);

    mockService.getDriveChecklistFilters.and.returnValue(of(mockFilterOptions));



      TestBed.configureTestingModule({
imports: [
        DriveChecklistFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DefineDefaultDriveChecklistService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getDriveChecklistFilters.calls.reset();


      mockService.getDriveChecklistFilters.and.returnValue(of(mockFilterOptions));


    fixture = TestBed.createComponent(DriveChecklistFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load filter options from service on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getDriveChecklistFilters).toHaveBeenCalled();
      expect(component.timelineOptions.length).toBe(4);
      expect(component.timelineOptions[0]).toEqual({ key: 'Before Drive', value: 'BD' });
    }));

    it('should populate form with current filters when provided', fakeAsync(() => {
      const currentFilters: DriveChecklistFilterValue = {
        condition: 'LE',
        noOfDays: 30,
        timeline: 'BD,AD'
      };
      component.currentFilters = currentFilters;

      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('condition')?.value).toBe('LE');
      expect(component.filterForm.get('noOfDays')?.value).toBe(30);
      expect(component.filterForm.get('timeline')?.value).toEqual(['BD', 'AD']);
    }));

    it('should handle empty timeline in current filters', fakeAsync(() => {
      const currentFilters: DriveChecklistFilterValue = {
        condition: 'EQ',
        noOfDays: 10,
        timeline: null
      };
      component.currentFilters = currentFilters;

      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('timeline')?.value).toEqual([]);
    }));
  });

  describe('Form Interactions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update condition field', () => {
      component.filterForm.patchValue({ condition: 'EQ' });
      expect(component.filterForm.get('condition')?.value).toBe('EQ');
    });

    it('should update noOfDays field', () => {
      component.filterForm.patchValue({ noOfDays: 45 });
      expect(component.filterForm.get('noOfDays')?.value).toBe(45);
    });

    it('should handle multiple timeline selections', () => {
      component.filterForm.patchValue({ timeline: ['BD', 'AD', 'DD'] });
      expect(component.filterForm.get('timeline')?.value).toEqual(['BD', 'AD', 'DD']);
    });

    it('should allow clearing individual form fields', () => {
      component.filterForm.patchValue({
        condition: 'LE',
        noOfDays: 20,
        timeline: ['BD']
      });

      component.filterForm.patchValue({ noOfDays: null });
      expect(component.filterForm.get('noOfDays')?.value).toBeNull();
    });
  });

  describe('Apply Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));


    it('should convert timeline array to comma-separated string', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        condition: 'LE',
        noOfDays: 15,
        timeline: ['BD', 'DD', 'CD']
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.timeline).toBe('BD,DD,CD');
    });




    it('should apply filters with all fields empty', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        condition: null,
        noOfDays: null,
        timeline: []
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        condition: null,
        noOfDays: null,
        timeline: null
      });
    });
  });

  describe('Clear Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset form when clear is clicked', () => {
      component.filterForm.patchValue({
        condition: 'LE',
        noOfDays: 25,
        timeline: ['BD', 'AD']
      });

      component.onClear();

      expect(component.filterForm.get('condition')?.value).toBeNull();
      expect(component.filterForm.get('noOfDays')?.value).toBeNull();
      expect(component.filterForm.get('timeline')?.value).toBeNull();
    });

  });

  describe('Close Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));


    it('should not modify form when close is clicked', () => {
      component.filterForm.patchValue({
        condition: 'GE',
        noOfDays: 30,
        timeline: ['BD']
      });

      const formValueBefore = component.filterForm.value;
      component.onClose();
      const formValueAfter = component.filterForm.value;

      expect(formValueBefore).toEqual(formValueAfter);
    });
  });

  describe('Condition Options', () => {

    it('should have GE option with ≥ label', () => {
      const geOption = component.conditionOptions.find(opt => opt.value === 'GE');
      expect(geOption).toBeDefined();
      expect(geOption?.label).toBe('≥');
    });

    it('should have LE option with ≤ label', () => {
      const leOption = component.conditionOptions.find(opt => opt.value === 'LE');
      expect(leOption).toBeDefined();
      expect(leOption?.label).toBe('≤');
    });

    it('should have EQ option with = label', () => {
      const eqOption = component.conditionOptions.find(opt => opt.value === 'EQ');
      expect(eqOption).toBeDefined();
      expect(eqOption?.label).toBe('=');
    });
  });

  describe('Error Handling', () => {
    it('should handle service error gracefully', fakeAsync(() => {
      mockService.getDriveChecklistFilters.and.returnValue(
        throwError(() => new Error('Service error'))
      );

      spyOn(console, 'error');
      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error loading filter options:', jasmine.any(Error));
      expect(component.isLoadingFilters).toBeFalse();
    }));

    it('should handle empty timeline response', fakeAsync(() => {
      mockService.getDriveChecklistFilters.and.returnValue(of({ timeline: [] }));

      fixture.detectChanges();
      tick();

      expect(component.timelineOptions).toEqual([]);
    }));

    it('should handle null response', fakeAsync(() => {
      mockService.getDriveChecklistFilters.and.returnValue(of(null as any));

      fixture.detectChanges();
      tick();

      expect(component.timelineOptions).toEqual([]);
    }));
  });
  describe('isClearDisabled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when no field has a value', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: null,
        timeline: []
      });

      expect(component.isClearDisabled).toBeTrue();
    });

    it('should return false when condition has a value', () => {
      component.filterForm.patchValue({
        condition: 'GE',
        noOfDays: null,
        timeline: []
      });

      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when noOfDays has a value', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: 10,
        timeline: []
      });

      expect(component.isClearDisabled).toBeFalse();
    });

    it('should return false when timeline has a value', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: null,
        timeline: ['BD']
      });

      expect(component.isClearDisabled).toBeFalse();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when no field has a value', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: null,
        timeline: []
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return true when noOfDays is provided but condition is not', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: 10,
        timeline: []
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when noOfDays and condition are both provided', () => {
      component.filterForm.patchValue({
        condition: 'GE',
        noOfDays: 10,
        timeline: []
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when only timeline has a value', () => {
      component.filterForm.patchValue({
        condition: null,
        noOfDays: null,
        timeline: ['BD']
      });

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('Timeline Parsing', () => {
    it('should parse single timeline value', fakeAsync(() => {
      component.currentFilters = {
        condition: null,
        noOfDays: null,
        timeline: 'BD'
      };

      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('timeline')?.value).toEqual(['BD']);
    }));

    it('should parse multiple timeline values', fakeAsync(() => {
      component.currentFilters = {
        condition: null,
        noOfDays: null,
        timeline: 'BD,AD,DD'
      };

      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('timeline')?.value).toEqual(['BD', 'AD', 'DD']);
    }));

    it('should handle timeline values with spaces', fakeAsync(() => {
      component.currentFilters = {
        condition: null,
        noOfDays: null,
        timeline: 'BD , AD , DD'
      };

      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('timeline')?.value).toEqual(['BD', 'AD', 'DD']);
    }));
  });
});
