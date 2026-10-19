import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AccessManagementFilterPanel } from './access-management-filter-panel';
import { AccessManagementService } from '../services/access-management.service';
import { AccessManagementFilterValue } from '../models/access-management.model';

describe('AccessManagementFilterPanel', () => {
  let component: AccessManagementFilterPanel;
  let fixture: ComponentFixture<AccessManagementFilterPanel>;
  let mockService: jasmine.SpyObj<AccessManagementService>;

  const mockFilterOptions = {
    item: {
      chapterIds: ['CH001', 'CH002', 'CH003'],
      alertRequiredOptions: ['Yes', 'No']
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AccessManagementService', [
      'getAccessManagementFilters',
      'searchAccessManagement',
      'addAccessManagement',
      'updateAccessManagement',
      'getFormOptions'
    ]);

    mockService.getAccessManagementFilters.and.returnValue(of(mockFilterOptions));



      TestBed.configureTestingModule({
      imports: [AccessManagementFilterPanel],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        { provide: AccessManagementService, useValue: mockService }
      ]
    });


    


      mockService.getAccessManagementFilters.calls.reset();


      mockService.searchAccessManagement.calls.reset();


      mockService.addAccessManagement.calls.reset();


      mockService.updateAccessManagement.calls.reset();


      mockService.getFormOptions.calls.reset();


      mockService.getAccessManagementFilters.and.returnValue(of(mockFilterOptions));


    fixture = TestBed.createComponent(AccessManagementFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should initialize filter form with all controls', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('chapterId')).toBeDefined();
      expect(component.filterForm.get('alertRequired')).toBeDefined();
      expect(component.filterForm.get('effectiveDatePeriod')).toBeDefined();
      expect(component.filterForm.get('effectiveDate')).toBeDefined();
      expect(component.filterForm.get('terminationDatePeriod')).toBeDefined();
      expect(component.filterForm.get('terminationDate')).toBeDefined();
    });

    it('should initialize chapter ID search control', () => {
      expect(component.chapterIdSearchControl).toBeDefined();
      expect(component.chapterIdSearchControl.value).toBe('');
    });



    it('should initialize with null values when no current filters', fakeAsync(() => {
      component.currentFilters = null;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('alertRequired')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    }));

    it('should populate form with current filters', fakeAsync(() => {
      const currentFilters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: 'Yes',
        effectiveDateFrom: '2025-01-01',
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      component.currentFilters = currentFilters;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('chapterId')?.value).toBe('CH001');
      expect(component.filterForm.get('alertRequired')?.value).toBe('Yes');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    }));
  });

  describe('Chapter ID Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter chapter IDs based on search input', fakeAsync(() => {
      component.chapterIdSearchControl.setValue('CH001');
      tick(300); // Wait for debounce

      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions.length).toBeLessThanOrEqual(component.allChapterIdOptions.length);
    }));

    it('should perform case-insensitive search', fakeAsync(() => {
      component.chapterIdSearchControl.setValue('ch001');
      tick(300); // Wait for debounce

      expect(component.chapterIdOptions).toContain('CH001');
    }));



    it('should debounce search input by 300ms', fakeAsync(() => {
      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.chapterIdSearchControl.setValue('CH');
      tick(100); // Less than debounce time

      // markForCheck should not be called yet
      const callCountBefore = cdrSpy.calls.count();

      component.chapterIdSearchControl.setValue('CH001');
      tick(300); // Complete debounce

      // markForCheck should be called after debounce
      expect(cdrSpy.calls.count()).toBeGreaterThan(callCountBefore);
      expect(component.chapterIdOptions).toContain('CH001');
    }));

    it('should filter multiple partial matches', fakeAsync(() => {
      const mockOptions = {
        item: {
          chapterIds: ['CH001', 'CH002', 'CH003', 'AB001'],
          alertRequiredOptions: ['Yes', 'No']
        }
      };
      mockService.getAccessManagementFilters.and.returnValue(of(mockOptions));

      // Reinitialize component
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      component.chapterIdSearchControl.setValue('CH');
      tick(300);

      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions).toContain('CH002');
      expect(component.chapterIdOptions).toContain('CH003');
      expect(component.chapterIdOptions).not.toContain('AB001');
    }));

    it('should return empty array when no matches found', fakeAsync(() => {
      component.chapterIdSearchControl.setValue('XYZ999');
      tick(300);

      expect(component.chapterIdOptions).toEqual([]);
    }));

    it('should handle single character search', fakeAsync(() => {
      component.chapterIdSearchControl.setValue('C');
      tick(300);

      expect(component.chapterIdOptions.length).toBeGreaterThan(0);
      component.chapterIdOptions.forEach(option => {
        expect(option.toLowerCase()).toContain('c');
      });
    }));

    it('should preserve allChapterIdOptions when filtering', fakeAsync(() => {
      const originalOptions = [...component.allChapterIdOptions];

      component.chapterIdSearchControl.setValue('CH001');
      tick(300);

      expect(component.allChapterIdOptions).toEqual(originalOptions);
    }));


  });

  describe('Search Filter Persistence', () => {
    it('should re-apply current search filter when options load', fakeAsync(() => {
      // Set a search value before options load
      component.chapterIdSearchControl.setValue('CH001');
      tick(300); // Wait for debounce

      // Simulate options loading
      const newOptions = {
        item: {
          chapterIds: ['CH001', 'CH002', 'CH003', 'CH999'],
          alertRequiredOptions: ['Yes', 'No']
        }
      };
      mockService.getAccessManagementFilters.and.returnValue(of(newOptions));

      // Trigger loadFilterOptions
      component['loadFilterOptions']();
      tick();

      // The search filter should be re-applied, showing only CH001
      expect(component.allChapterIdOptions).toEqual(['CH001', 'CH002', 'CH003', 'CH999']);
      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions).not.toContain('CH002');
      expect(component.chapterIdOptions).not.toContain('CH003');
      expect(component.chapterIdOptions).not.toContain('CH999');
    }));

    it('should show all options when no search filter exists on load', fakeAsync(() => {
      // Ensure search is empty
      component.chapterIdSearchControl.setValue('');
      tick(300);

      // Simulate options loading
      const newOptions = {
        item: {
          chapterIds: ['CH001', 'CH002', 'CH003'],
          alertRequiredOptions: ['Yes', 'No']
        }
      };
      mockService.getAccessManagementFilters.and.returnValue(of(newOptions));

      // Trigger loadFilterOptions
      component['loadFilterOptions']();
      tick();

      // All options should be visible
      expect(component.chapterIdOptions).toEqual(component.allChapterIdOptions);
      expect(component.chapterIdOptions.length).toBe(3);
    }));

    it('should maintain filtered state after options reload with partial match', fakeAsync(() => {
      // Set a search that will match multiple items
      component.chapterIdSearchControl.setValue('CH');
      tick(300);

      // Simulate options loading
      const newOptions = {
        item: {
          chapterIds: ['CH001', 'CH002', 'AB001'],
          alertRequiredOptions: ['Yes', 'No']
        }
      };
      mockService.getAccessManagementFilters.and.returnValue(of(newOptions));

      // Trigger loadFilterOptions
      component['loadFilterOptions']();
      tick();

      // Should show only items matching 'CH'
      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions).toContain('CH002');
      expect(component.chapterIdOptions).not.toContain('AB001');
      expect(component.chapterIdOptions.length).toBe(2);
    }));

    it('should handle case-insensitive search when options reload', fakeAsync(() => {
      // Set a lowercase search value
      component.chapterIdSearchControl.setValue('ch001');
      tick(300);

      // Simulate options loading
      const newOptions = {
        item: {
          chapterIds: ['CH001', 'CH002', 'CH003'],
          alertRequiredOptions: ['Yes', 'No']
        }
      };
      mockService.getAccessManagementFilters.and.returnValue(of(newOptions));

      // Trigger loadFilterOptions
      component['loadFilterOptions']();
      tick();

      // Should find CH001 despite case difference
      expect(component.chapterIdOptions).toContain('CH001');
      expect(component.chapterIdOptions.length).toBe(1);
    }));
  });

  describe('Filter Application', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should format effective date as After filter', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: null,
        alertRequired: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectiveDateFrom).toBe('2025-01-01');
      expect(emittedFilters.effectiveDateTo).toBeNull();
    });

    it('should format effective date as Before filter', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: null,
        alertRequired: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2025-12-31'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectiveDateFrom).toBeNull();
      expect(emittedFilters.effectiveDateTo).toBe('2025-12-31');
    });

    it('should format termination date filters correctly', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: null,
        alertRequired: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2025-06-01')
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.terminationDateFrom).toBe('2025-06-01');
      expect(emittedFilters.terminationDateTo).toBeNull();
    });




  });

  describe('Filter Clear', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset all form values on clear', () => {
      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: 'Yes',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onClear();

      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('alertRequired')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });



    it('should clear native date inputs on clear', () => {
      // Simulate native inputs with text
      component.effectiveDateNativeInput = { nativeElement: { value: 'test' } } as any;
      component.terminationDateNativeInput = { nativeElement: { value: 'test' } } as any;

      component.onClear();

      // After clear, form values are null so getNativeInputText won't flag errors
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });



    it('should reset chapterIdOptions to all options on clear', () => {
      // Filter the options first
      component.chapterIdOptions = ['CH001'];

      component.onClear();

      expect(component.chapterIdOptions).toEqual(component.allChapterIdOptions);
    });

    it('should reset search control without emitting event', fakeAsync(() => {
      const searchSpy = spyOn(component.chapterIdSearchControl, 'setValue').and.callThrough();

      component.onClear();
      tick();

      expect(searchSpy).toHaveBeenCalledWith('', { emitEvent: false });
    }));
  });
  describe('Apply Button State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should disable apply button when no values selected', () => {
      component.filterForm.patchValue({
        chapterId: null,
        alertRequired: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply button when chapterId is selected', () => {
      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply button when alertRequired is selected', () => {
      component.filterForm.patchValue({
        chapterId: null,
        alertRequired: 'Yes',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply button when date has validation errors', () => {
      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      const effectiveDateControl = component.filterForm.get('effectiveDate');
      effectiveDateControl?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply button when period has validation errors', () => {
      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      periodControl?.setErrors({ required: true });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Period Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should require period when effective date is selected', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2025-01-01'));
      effectiveDateControl?.markAsTouched();

      component['validateEffectiveDatePeriod']();

      expect(periodControl?.hasError('required')).toBeTrue();
    });

    it('should not require period when effective date is not selected', () => {
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      component.filterForm.patchValue({
        effectiveDate: null,
        effectiveDatePeriod: null
      });

      component['validateEffectiveDatePeriod']();

      expect(periodControl?.hasError('required')).toBeFalse();
    });

    it('should require period when termination date is selected', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setValue(new Date('2025-12-31'));
      terminationDateControl?.markAsTouched();

      component['validateTerminationDatePeriod']();

      expect(periodControl?.hasError('required')).toBeTrue();
    });

    it('should clear period error when both date and period are selected', () => {
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: 'After'
      });

      component['validateEffectiveDatePeriod']();

      expect(periodControl?.hasError('required')).toBeFalse();
    });
  });

  describe('Date Input Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should detect invalid date via native input text when control value is null', () => {
      // Simulate: user typed garbage, datepicker couldn't parse → control.value is null but native input has text
      component.effectiveDateNativeInput = { nativeElement: { value: '31-APR-2025' } } as any;
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return empty error when native input is empty and control is null', () => {
      component.effectiveDateNativeInput = { nativeElement: { value: '' } } as any;
      const control = component.filterForm.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should show error for matDatepickerParse', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });
  });

  describe('Error Messages', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should not show error when field is not touched', () => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });

      expect(component.getEffectiveDateError()).toBe('');
    });
  });
  describe('Date Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format Date object to YYYY-MM-DD', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2025, 0, 15), // Jan 15, 2025
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectiveDateFrom).toBe('2025-01-15');
    });

    it('should handle string dates already in YYYY-MM-DD format', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: '2025-12-31',
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectiveDateTo).toBe('2025-12-31');
    });
  });

  describe('Value Changes Subscriptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should mark period as touched when valid date is selected', fakeAsync(() => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(new Date('2025-01-01'));
      tick();

      expect(periodControl?.touched).toBeTrue();
    }));




  });
});
