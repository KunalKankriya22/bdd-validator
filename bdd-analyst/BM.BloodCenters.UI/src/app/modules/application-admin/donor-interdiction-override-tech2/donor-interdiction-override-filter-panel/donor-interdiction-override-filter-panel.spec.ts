import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';
import { DonorInterdictionOverrideFilterPanel } from './donor-interdiction-override-filter-panel';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';

describe('DonorInterdictionOverrideFilterPanel', () => {
  let component: DonorInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<DonorInterdictionOverrideFilterPanel>;

  const mockCueOptions = [
    { code: 'A', display: 'A - Ambiguous' },
    { code: 'B', display: 'B - Block' },
    { code: 'C', display: 'C - Clear' }
  ];

  const mockTypeOptions = [
    { code: 'A', display: 'A - Type A' },
    { code: 'B', display: 'B - Type B' },
    { code: 'C', display: 'C - Type C' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DonorInterdictionOverrideFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonorInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;
    component.cueOptions = mockCueOptions;
    component.typeOptions = mockTypeOptions;


    });

  describe('Component Initialization', () => {



    it('should have apply and close event emitters', () => {
      expect(component.apply).toBeDefined();
      expect(component.close).toBeDefined();
    });

    it('should accept cueOptions input', () => {
      fixture.detectChanges();
      expect(component.cueOptions).toEqual(mockCueOptions);
      expect(component.cueOptions.length).toBe(3);
    });

    it('should accept typeOptions input', () => {
      fixture.detectChanges();
      expect(component.typeOptions).toEqual(mockTypeOptions);
      expect(component.typeOptions.length).toBe(3);
    });
  });

  describe('Donor Decision Code (Cue) Filtering', () => {
    it('should populate form with donor decision code filter', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
    });


    it('should display all cue options', () => {
      fixture.detectChanges();
      expect(component.cueOptions.length).toBe(3);
      expect(component.cueOptions[0].code).toBe('A');
      expect(component.cueOptions[0].display).toBe('A - Ambiguous');
    });


    it('should handle different cue codes', () => {
      fixture.detectChanges();

      component.filterForm.patchValue({ donorDecisionCode: 'C' });
      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('C');
    });
  });

  describe('Type Filtering', () => {
    it('should populate form with type filter', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        interType: 'A'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('interType')?.value).toBe('A');
    });


    it('should display all type options', () => {
      fixture.detectChanges();
      expect(component.typeOptions.length).toBe(3);
      expect(component.typeOptions[0].code).toBe('A');
      expect(component.typeOptions[0].display).toBe('A - Type A');
    });

  });

  describe('Date Filtering with Period', () => {


    it('should emit effective date as ISO string on apply', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodEffDate: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(typeof emittedValue.effectiveDate).toBe('string');
      expect(emittedValue.periodEffDate).toBe('after');
    });

    it('should emit termination date as ISO string on apply', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate,
        periodTermDate: 'before'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDate).toBeDefined();
      expect(typeof emittedValue.terminationDate).toBe('string');
      expect(emittedValue.periodTermDate).toBe('before');
    });

    it('should convert moment dates to UTC correctly', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const testDate = moment(new Date(year, month, day));
      const utcDate = component['convertToUTCDate'](testDate.toDate());

      expect(utcDate).toBeDefined();
      expect(utcDate?.getUTCFullYear()).toBe(year);
      expect(utcDate?.getUTCMonth()).toBe(month);
      expect(utcDate?.getUTCDate()).toBe(day);
      expect(utcDate?.getUTCHours()).toBe(0);
      expect(utcDate?.getUTCMinutes()).toBe(0);
      expect(utcDate?.getUTCSeconds()).toBe(0);
    });

    it('should convert moment.Moment objects to UTC correctly', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const testMoment = moment(new Date(year, month, day));
      const utcDate = component['convertToUTCDate'](testMoment);

      expect(utcDate).toBeDefined();
      expect(utcDate?.getUTCFullYear()).toBe(year);
      expect(utcDate?.getUTCMonth()).toBe(month);
      expect(utcDate?.getUTCDate()).toBe(day);
      expect(utcDate?.getUTCHours()).toBe(0);
      expect(utcDate?.getUTCMinutes()).toBe(0);
      expect(utcDate?.getUTCSeconds()).toBe(0);
    });

    it('should convert regular Date objects to UTC correctly', () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day = now.getDate();

      const testDate = new Date(year, month, day);
      const utcDate = component['convertToUTCDate'](testDate);

      expect(utcDate).toBeDefined();
      expect(utcDate?.getUTCFullYear()).toBe(year);
      expect(utcDate?.getUTCMonth()).toBe(month);
      expect(utcDate?.getUTCDate()).toBe(day);
    });


    it('should not emit date period if no date is selected', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({
        effectiveDate: null,
        periodEffDate: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeUndefined();
      expect(emittedValue.periodEffDate).toBe('after');
    });

    it('should handle effective date with "before" period', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodEffDate: 'before'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodEffDate).toBe('before');
    });

    it('should handle termination date with "after" period', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate,
        periodTermDate: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodTermDate).toBe('after');
    });
  });

  describe('Multiple Filters', () => {
    it('should populate form with multiple filters', () => {
      const testDate = new Date().toISOString();
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'B',
        effectiveDate: testDate,
        periodEffDate: 'after'
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
      expect(component.filterForm.get('interType')?.value).toBe('B');
      expect(component.filterForm.get('effectiveDate')?.value instanceof Date).toBe(true);
      expect(component.filterForm.get('periodEffDate')?.value).toBe('after');
    });


    it('should emit all date filters when both are set', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const effectiveDate = new Date();
      const terminationDate = new Date();

      component.filterForm.patchValue({
        effectiveDate: effectiveDate,
        periodEffDate: 'after',
        terminationDate: terminationDate,
        periodTermDate: 'before'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.periodEffDate).toBe('after');
      expect(emittedValue.terminationDate).toBeDefined();
      expect(emittedValue.periodTermDate).toBe('before');
    });

    it('should combine all filter types correctly', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const effectiveDate = new Date();

      component.filterForm.patchValue({
        donorDecisionCode: 'B',
        interType: 'A',
        effectiveDate: effectiveDate,
        periodEffDate: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCode).toBe('B');
      expect(emittedValue.interType).toBe('A');
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.periodEffDate).toBe('after');
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all filter values', () => {
      fixture.detectChanges();

      const testDate1 = new Date();
      const testDate2 = new Date();

      // Set some values
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        interType: 'A',
        effectiveDate: testDate1,
        periodEffDate: 'after',
        terminationDate: testDate2,
        periodTermDate: 'before'
      });

      // Clear all
      component.onClearAll();

      // Verify all values are reset
      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('periodEffDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('periodTermDate')?.value).toBeNull();
    });


    it('should clear form even when some fields are already empty', () => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        effectiveDate: testDate
      });

      component.onClearAll();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });
  describe('Apply Functionality', () => {

    it('should only emit non-empty filter values', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        interType: '', // Empty, should not be emitted
        effectiveDate: null // Null, should not be emitted
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCode).toBe('A');
      expect(emittedValue.interType).toBeUndefined();
      expect(emittedValue.effectiveDate).toBeUndefined();
    });

    it('should emit empty object when no filters are set', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(Object.keys(emittedValue).length).toBe(0);
    });

    it('should apply filters without closing panel', () => {
      spyOn(component.apply, 'emit');
      spyOn(component.close, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  describe('Current Filters Population', () => {

    it('should handle undefined current filters', () => {
      component.currentFilters = undefined as any;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
    });

    it('should populate partial filter values', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
        // Other fields are not set
      };

      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should repopulate form when currentFilters changes', () => {
      fixture.detectChanges();

      const initialFilters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };
      component.currentFilters = initialFilters;
      component.ngOnInit();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');

      const newFilters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'B',
        interType: 'B'
      };
      component.currentFilters = newFilters;
      component.ngOnInit();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('B');
      expect(component.filterForm.get('interType')?.value).toBe('B');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings for date periods', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({
        periodEffDate: '',
        periodTermDate: ''
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodEffDate).toBeUndefined();
      expect(emittedValue.periodTermDate).toBeUndefined();
    });

    it('should handle form with all empty values on apply', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(Object.keys(emittedValue).length).toBe(0);
    });


    it('should handle malformed date strings gracefully', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        effectiveDate: 'invalid-date'
      };

      component.currentFilters = filters;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty cueOptions array', () => {
      component.cueOptions = [];
      fixture.detectChanges();

      expect(component.cueOptions.length).toBe(0);
      expect(() => component.onApply()).not.toThrow();
    });

    it('should handle empty typeOptions array', () => {
      component.typeOptions = [];
      fixture.detectChanges();

      expect(component.typeOptions.length).toBe(0);
      expect(() => component.onApply()).not.toThrow();
    });

    it('should preserve time as midnight in UTC conversion', () => {
      const now = new Date();
      const testDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30, 0); // Afternoon time
      const testMoment = moment(testDate);
      const utcDate = component['convertToUTCDate'](testMoment.toDate());

      expect(utcDate?.getUTCHours()).toBe(0);
      expect(utcDate?.getUTCMinutes()).toBe(0);
      expect(utcDate?.getUTCSeconds()).toBe(0);
    });
  });

  describe('Form Validation', () => {
    it('should allow form submission with valid values', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        interType: 'A',
        effectiveDate: testDate,
        periodEffDate: 'after'
      });

      expect(component.filterForm.valid).toBe(true);
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalled();
    });

    it('should allow empty form submission', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      expect(component.filterForm.valid).toBe(true);
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalled();
    });
  });

  describe('Date Period Options', () => {
    it('should handle "after" period correctly', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({
        periodEffDate: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodEffDate).toBe('after');
    });

    it('should handle "before" period correctly', () => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      component.filterForm.patchValue({
        periodTermDate: 'before'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.periodTermDate).toBe('before');
    });
  });

  describe('Period Validation', () => {
    it('should set effectivePeriodRequired when date is set without period', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
    }));


    it('should set terminationPeriodRequired when date is set without period', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate
      });
      tick();

      expect(component.terminationPeriodRequired).toBe(true);
    }));




    it('should clear effectiveDateRequired when date is entered', fakeAsync(() => {
      fixture.detectChanges();

      component.filterForm.patchValue({
        periodEffDate: 'after'
      });
      tick();
      expect(component.effectiveDateRequired).toBe(true);

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
      });
      tick();

      expect(component.effectiveDateRequired).toBe(false);
      expect(component.effectivePeriodRequired).toBe(false);
    }));

    it('should clear terminationDateRequired when date is entered', fakeAsync(() => {
      fixture.detectChanges();

      component.filterForm.patchValue({
        periodTermDate: 'before'
      });
      tick();
      expect(component.terminationDateRequired).toBe(true);

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate
      });
      tick();

      expect(component.terminationDateRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
    }));


  });
  describe('Invalid Date Input Handling', () => {
    it('should store raw input when typing in effective date field', fakeAsync(() => {
      fixture.detectChanges();

      const mockEvent = {
        target: { value: 'invalid-date-text' }
      } as any;

      component.onEffectiveDateInput(mockEvent);
      tick();

      expect(component['effectiveDateRawInput']).toBe('invalid-date-text');
    }));

    it('should store raw input when typing in termination date field', fakeAsync(() => {
      fixture.detectChanges();

      const mockEvent = {
        target: { value: 'invalid-date-text' }
      } as any;

      component.onTerminationDateInput(mockEvent);
      tick();

      expect(component['terminationDateRawInput']).toBe('invalid-date-text');
    }));



    it('should not set error if input is empty', fakeAsync(() => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = '';

      const mockEvent = {
        target: mockInput
      } as any;

      component.onEffectiveDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should restore raw input on blur when no valid date', fakeAsync(() => {
      fixture.detectChanges();
      component['effectiveDateRawInput'] = 'invalid-date-text';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-date-text');
    }));

    it('should restore termination raw input on blur when no valid date', fakeAsync(() => {
      fixture.detectChanges();
      component['terminationDateRawInput'] = 'invalid-date-text';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-date-text');
    }));

    it('should not restore input on blur if control has valid value', fakeAsync(() => {
      fixture.detectChanges();
      component['effectiveDateRawInput'] = 'invalid-date-text';

      const validDate = new Date();
      component.filterForm.patchValue({ effectiveDate: validDate });

      const mockInput = document.createElement('input');
      const formattedDate = validDate.toLocaleDateString();
      mockInput.value = formattedDate;

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe(formattedDate);
    }));

    it('should not restore input on blur if input already has value', fakeAsync(() => {
      fixture.detectChanges();
      component['effectiveDateRawInput'] = 'old-invalid';

      const mockInput = document.createElement('input');
      mockInput.value = 'current-value';

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('current-value');
    }));
  });
  describe('Clear All with Raw Input', () => {

    it('should reset all validation flags on clearAll', () => {
      fixture.detectChanges();
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.effectiveDateRequired = true;
      component.terminationDateRequired = true;

      component.onClearAll();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });
  });

  describe('Value Changes Subscriptions with setTimeout', () => {
    it('should trigger validation after setTimeout for effective date', fakeAsync(() => {
      fixture.detectChanges();
      const validateSpy = spyOn(component, 'validateEffectivePeriod').and.callThrough();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
      });

      // Should not be called immediately
      expect(validateSpy).not.toHaveBeenCalled();

      // Should be called after tick
      tick();
      expect(validateSpy).toHaveBeenCalled();
    }));

    it('should trigger validation after setTimeout for termination date', fakeAsync(() => {
      fixture.detectChanges();
      const validateSpy = spyOn(component, 'validateTerminationPeriod').and.callThrough();

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate
      });

      // Should not be called immediately
      expect(validateSpy).not.toHaveBeenCalled();

      // Should be called after tick
      tick();
      expect(validateSpy).toHaveBeenCalled();
    }));

  });

  describe('Advanced Validation Scenarios', () => {


    it('should handle multiple validation errors simultaneously', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodTermDate: 'before'
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
      expect(component.terminationDateRequired).toBe(true);
      expect(component.isApplyDisabled).toBe(true);
    }));

  });

  describe('Date and Period Combinations', () => {



    it('should handle "before" period correctly', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodEffDate: 'before'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
    }));
  });

  describe('Search Functionality', () => {
    it('should initialize cue search control', () => {
      fixture.detectChanges();
      expect(component.cueSearchControl).toBeDefined();
      expect(component.cueSearchControl.value).toBe('');
    });

    it('should initialize type search control', () => {
      fixture.detectChanges();
      expect(component.typeSearchControl).toBeDefined();
      expect(component.typeSearchControl.value).toBe('');
    });

    it('should initialize all cue options', () => {
      fixture.detectChanges();
      expect(component.allCueOptions).toEqual(mockCueOptions);
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
    });

    it('should initialize all type options', () => {
      fixture.detectChanges();
      expect(component.allTypeOptions).toEqual(mockTypeOptions);
      expect(component.filteredTypeOptions).toEqual(mockTypeOptions);
    });



    it('should show all cue options when search is cleared', fakeAsync(() => {
      fixture.detectChanges();

      component.cueSearchControl.setValue('Ambiguous');
      tick(300);
      expect(component.filteredCueOptions.length).toBe(1);

      component.cueSearchControl.setValue('');
      tick(300);
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
    }));

    it('should show all type options when search is cleared', fakeAsync(() => {
      fixture.detectChanges();

      component.typeSearchControl.setValue('Type A');
      tick(300);
      expect(component.filteredTypeOptions.length).toBe(1);

      component.typeSearchControl.setValue('');
      tick(300);
      expect(component.filteredTypeOptions.length).toBe(mockTypeOptions.length);
    }));




    it('should reset search controls on clear all', () => {
      fixture.detectChanges();

      component.cueSearchControl.setValue('A');
      component.typeSearchControl.setValue('Type A');

      component.onClearAll();

      expect(component.cueSearchControl.value).toBe('');
      expect(component.typeSearchControl.value).toBe('');
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
      expect(component.filteredTypeOptions).toEqual(mockTypeOptions);
    });



    it('should not call markForCheck when cue filter results length stays the same', fakeAsync(() => {
      fixture.detectChanges();

      // First search to set a baseline - matches 2 results ('A - Ambiguous' and 'C - Clear')
      component.cueSearchControl.setValue('a');
      tick(300);

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      // Search again with a term that still matches the same 2 results
      component.cueSearchControl.setValue('c');
      tick(300);

      // markForCheck should not be called because length didn't change (still 2 results)
      expect(cdrSpy).not.toHaveBeenCalled();
    }));


    it('should not call markForCheck when type filter results length stays the same', fakeAsync(() => {
      fixture.detectChanges();

      // First search to set a baseline - matches 2 results ('Type B' and 'Type C')
      component.typeSearchControl.setValue('Type B');
      tick(300);

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      // Clear search to return to all 3 options, but spy was set AFTER first search
      // So we need a different approach - search for something that matches same number
      component.typeSearchControl.setValue('Type C');
      tick(300);

      // markForCheck should not be called because length didn't change (both searches match 1 result)
      expect(cdrSpy).not.toHaveBeenCalled();
    }));

    it('should call markForCheck when clearing cue search changes result count', fakeAsync(() => {
      fixture.detectChanges();

      // First narrow down results
      component.cueSearchControl.setValue('Ambiguous');
      tick(300);
      expect(component.filteredCueOptions.length).toBe(1);

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      // Clear search - this should change length from 1 to 3
      component.cueSearchControl.setValue('');
      tick(300);

      expect(cdrSpy).toHaveBeenCalled();
      expect(component.filteredCueOptions.length).toBe(3);
    }));

    it('should call markForCheck when clearing type search changes result count', fakeAsync(() => {
      fixture.detectChanges();

      // First narrow down results
      component.typeSearchControl.setValue('Type A');
      tick(300);
      expect(component.filteredTypeOptions.length).toBe(1);

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      // Clear search - this should change length from 1 to 3
      component.typeSearchControl.setValue('');
      tick(300);

      expect(cdrSpy).toHaveBeenCalled();
      expect(component.filteredTypeOptions.length).toBe(3);
    }));
  });

  describe('Additional Invalid Date Handling', () => {
    it('should not set error for empty date input', fakeAsync(() => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = '';

      const mockEvent = {
        target: mockInput
      } as any;

      component.onEffectiveDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should not set error for whitespace-only date input', fakeAsync(() => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = '   ';

      const mockEvent = {
        target: mockInput
      } as any;

      component.onEffectiveDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('effectiveDate');
      // Whitespace gets trimmed to empty string, so no error is set
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should handle invalid termination date input with whitespace', fakeAsync(() => {
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = '  invalid  ';

      const mockEvent = {
        target: mockInput
      } as any;

      component.onTerminationDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));
  });

  describe('Form State Management', () => {
    it('should maintain form state after failed apply attempt', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
        // Missing period
      });
      tick();

      expect(component.isApplyDisabled).toBe(true);

      // User adds period
      component.filterForm.patchValue({
        periodEffDate: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(testDate);
    }));

    it('should apply filters with cue and valid date/period combination', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        effectiveDate: testDate,
        periodEffDate: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCode).toBe('A');
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.periodEffDate).toBe('after');
    }));

    it('should handle clearing date after both date and period were set', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodEffDate: 'after'
      });
      tick();
      expect(component.isApplyDisabled).toBe(false);

      // Clear date
      component.filterForm.patchValue({
        effectiveDate: null
      });
      tick();

      expect(component.effectiveDateRequired).toBe(true);
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should handle clearing period after both date and period were set', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        periodEffDate: 'after'
      });
      tick();
      expect(component.isApplyDisabled).toBe(false);

      // Clear period
      component.filterForm.patchValue({
        periodEffDate: null
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
      expect(component.isApplyDisabled).toBe(true);
    }));
  });

  describe('Edge Cases for Both Date Fields', () => {
    it('should correctly validate when switching between date fields', fakeAsync(() => {
      fixture.detectChanges();

      const testDate = new Date();

      // Set effective date without period
      component.filterForm.patchValue({
        effectiveDate: testDate
      });
      tick();
      expect(component.effectivePeriodRequired).toBe(true);

      // Add period
      component.filterForm.patchValue({
        periodEffDate: 'after'
      });
      tick();
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.isApplyDisabled).toBe(false);

      // Now set termination date without period
      component.filterForm.patchValue({
        terminationDate: testDate
      });
      tick();
      expect(component.terminationPeriodRequired).toBe(true);
      expect(component.isApplyDisabled).toBe(true);
    }));

  });
});
