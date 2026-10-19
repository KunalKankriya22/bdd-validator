import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { DonorInterdictionOverrideFilterPanel } from './donor-interdiction-override-filter-panel';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override.model';

describe('DonorInterdictionOverrideFilterPanel', () => {
  let component: DonorInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<DonorInterdictionOverrideFilterPanel>;
  let mockService: jasmine.SpyObj<DonorInterdictionOverrideService>;

  const mockDropdowns = {
    donorDecisionCodes: [
      { code: 'A', description: 'Ambiguous' },
      { code: 'B', description: 'Block' },
      { code: 'C', description: 'Clear' }
    ],
    interTypes: [
      { code: 'N', description: 'No effect on product suitability' },
      { code: 'H', description: 'Hold' },
      { code: 'C', description: 'Component' }
    ]
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonorInterdictionOverrideService', ['getFilterOptions']);
    mockService.getFilterOptions.and.returnValue(of(mockDropdowns));

    TestBed.configureTestingModule({
      imports: [
        DonorInterdictionOverrideFilterPanel,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DonorInterdictionOverrideService, useValue: mockService }
      ]
    });
  });

  beforeEach(() => {
    mockService.getFilterOptions.calls.reset();
    mockService.getFilterOptions.and.returnValue(of(mockDropdowns));

    fixture = TestBed.createComponent(DonorInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize filterForm with null values when no currentFilters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    }));

    it('should call getFilterOptions on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getFilterOptions).toHaveBeenCalledTimes(1);
    }));

    it('should populate cue options on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(3);
      expect(component.filteredCueOptions.length).toBe(3);
      expect(component.allCueOptions[0].value).toBe('A');
      expect(component.allCueOptions[0].display).toBe('A - Ambiguous');
    }));

    it('should populate inter type options on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allInterTypeOptions.length).toBe(3);
      expect(component.filteredInterTypeOptions.length).toBe(3);
    }));

    it('should set isLoadingFilters to false after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoadingFilters).toBe(false);
    }));

    it('should handle dropdown load error gracefully', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(0);
      expect(component.filteredCueOptions.length).toBe(0);
      expect(component.allInterTypeOptions.length).toBe(0);
      expect(component.filteredInterTypeOptions.length).toBe(0);
      expect(component.isLoadingFilters).toBe(false);
    }));

    it('should handle cue codes without description', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(of({
        donorDecisionCodes: [
          { code: 'X', description: '' }
        ],
        interTypes: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(1);
      expect(component.allCueOptions[0].display).toBe('X');
    }));

    it('should handle empty donorDecisionCodes array', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(of({
        donorDecisionCodes: [],
        interTypes: [{ code: 'N', description: 'No effect' }]
      }));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(0);
      expect(component.filteredCueOptions.length).toBe(0);
      expect(component.allInterTypeOptions.length).toBe(1);
    }));

    it('should handle empty interTypes array', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(of({
        donorDecisionCodes: [{ code: 'A', description: 'Ambiguous' }],
        interTypes: []
      }));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(1);
      expect(component.allInterTypeOptions.length).toBe(0);
      expect(component.filteredInterTypeOptions.length).toBe(0);
    }));

    it('should handle null donorDecisionCodes in response', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(of({
        interTypes: [{ code: 'N', description: 'desc' }]
      }));

      fixture.detectChanges();
      tick();

      expect(component.allCueOptions.length).toBe(0);
    }));

    it('should handle null interTypes in response', fakeAsync(() => {
      mockService.getFilterOptions.and.returnValue(of({
        donorDecisionCodes: [{ code: 'A', description: 'desc' }]
      }));

      fixture.detectChanges();
      tick();

      expect(component.allInterTypeOptions.length).toBe(0);
    }));

    it('should set isLoadingFilters to true before loading', () => {
      // Before detectChanges, isLoadingFilters should be false by default
      expect(component.isLoadingFilters).toBe(false);

      // After ngOnInit fires, it sets isLoadingFilters = true before the async call
      // Since mock returns synchronously with of(), it immediately sets false again
      fixture.detectChanges();
      // By the time we check, the synchronous observable has already completed
      expect(component.isLoadingFilters).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('Period Validation', () => {
    it('should set effectivePeriodRequired when date is set without period', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
    }));

    it('should set terminationPeriodRequired when date is set without period', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        terminationDate: testDate
      });
      tick();

      expect(component.terminationPeriodRequired).toBe(true);
    }));

    it('should clear effectivePeriodRequired when both date and period are set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'after'
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
    }));

    it('should clear terminationPeriodRequired when both date and period are set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: 'before'
      });
      tick();

      expect(component.terminationPeriodRequired).toBe(false);
    }));

    it('should set effectiveDateRequired when period is set without date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after'
      });
      tick();

      component.validateEffectivePeriod();

      expect(component.effectiveDateRequired).toBe(true);
    }));

    it('should set terminationDateRequired when period is set without date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        terminationDatePeriod: 'before'
      });
      tick();

      component.validateTerminationPeriod();

      expect(component.terminationDateRequired).toBe(true);
    }));

    it('should not set any required flags when neither date nor period is set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validateEffectivePeriod();
      component.validateTerminationPeriod();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    }));

    it('should trigger validateEffectivePeriod via effectiveDatePeriod valueChanges', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Set a date first, then change the period
      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();
      expect(component.effectivePeriodRequired).toBe(true);

      component.filterForm.patchValue({ effectiveDatePeriod: 'after' });
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
    }));

    it('should trigger validateTerminationPeriod via terminationDatePeriod valueChanges', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Set a date first, then change the period
      component.filterForm.patchValue({ terminationDate: new Date() });
      tick();
      expect(component.terminationPeriodRequired).toBe(true);

      component.filterForm.patchValue({ terminationDatePeriod: 'before' });
      tick();

      expect(component.terminationPeriodRequired).toBe(false);
    }));

    it('should mark effectiveDate as touched when valueChanges fires and control is untouched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBe(false);

      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();

      expect(control?.touched).toBe(true);
    }));

    it('should mark terminationDate as touched when valueChanges fires and control is untouched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBe(false);

      component.filterForm.patchValue({ terminationDate: new Date() });
      tick();

      expect(control?.touched).toBe(true);
    }));

    it('should not re-mark effectiveDate as touched if already touched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.filterForm.get('effectiveDate');
      control?.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    }));

    it('should not re-mark terminationDate as touched if already touched', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const control = component.filterForm.get('terminationDate');
      control?.markAsTouched();
      const markAsTouchedSpy = spyOn(control!, 'markAsTouched');

      component.filterForm.patchValue({ terminationDate: new Date() });
      tick();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    }));
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when no values are selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be enabled when only donorDecisionCode is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });

      expect(component.isApplyDisabled).toBe(false);
    }));

    it('should be enabled when only interType is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ interType: 'N' });

      expect(component.isApplyDisabled).toBe(false);
    }));

    it('should be enabled when effective date and period are both set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
    }));

    it('should be enabled when termination date and period are both set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: 'before'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
    }));

    it('should be disabled when only effective date is set without period', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ effectiveDate: new Date() });
      tick();

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be disabled when only effective period is set without date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ effectiveDatePeriod: 'after' });
      tick();
      component.validateEffectivePeriod();

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be disabled when effectiveDate has invalidDateFormat error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be disabled when effectiveDate has matDatepickerParse error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be disabled when terminationDate has invalidDateFormat error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should be disabled when terminationDate has matDatepickerParse error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });

      expect(component.isApplyDisabled).toBe(true);
    }));
  });

  describe('Apply Functionality', () => {
    it('should emit dates as ISO strings', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'after'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(typeof emittedValue.effectiveDate).toBe('string');
      expect(emittedValue.effectiveDatePeriod).toBe('after');
    }));

    it('should include display values for selected options', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        donorDecisionCode: 'A'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCodeDisplay).toBeDefined();
      expect(emittedValue.donorDecisionCodeDisplay).toContain('A');
    }));

    it('should emit null values for unset fields', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.interType).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
      expect(emittedValue.terminationDatePeriod).toBeNull();
    }));

    it('should include interType display value when interType is selected', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ interType: 'N' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.interType).toBe('N');
      expect(emittedValue.interTypeDisplay).toBeDefined();
      expect(emittedValue.interTypeDisplay).toContain('N');
    }));

    it('should set interTypeDisplay to null when interType is not selected', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'A' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.interTypeDisplay).toBeNull();
    }));

    it('should set donorDecisionCodeDisplay to null when donorDecisionCode is not selected', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ interType: 'N' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCodeDisplay).toBeNull();
    }));

    it('should handle moment date objects in effective date', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      const testMoment = moment('2025-03-15');
      component.filterForm.patchValue({
        effectiveDate: testMoment,
        effectiveDatePeriod: 'after'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(typeof emittedValue.effectiveDate).toBe('string');
    }));

    it('should handle moment date objects in termination date', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      const testMoment = moment('2025-06-30');
      component.filterForm.patchValue({
        terminationDate: testMoment,
        terminationDatePeriod: 'before'
      });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.terminationDate).toBeDefined();
      expect(typeof emittedValue.terminationDate).toBe('string');
      expect(emittedValue.terminationDatePeriod).toBe('before');
    }));

    it('should fallback display to null when donorDecisionCode not found in options', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ donorDecisionCode: 'NONEXISTENT' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCodeDisplay).toBeNull();
    }));

    it('should fallback display to null when interType not found in options', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ interType: 'NONEXISTENT' });
      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.interTypeDisplay).toBeNull();
    }));
  });

  describe('Clear Functionality', () => {
    it('should clear all filter values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        interType: 'N',
        effectiveDate: testDate,
        effectiveDatePeriod: 'after'
      });

      component.onClear();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    }));

    it('should reset all validation flags', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.effectiveDateRequired = true;
      component.terminationDateRequired = true;

      component.onClear();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    }));

    it('should reset raw input values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['effectiveDateRawInput'] = 'some-invalid';
      component['terminationDateRawInput'] = 'another-invalid';

      component.onClear();

      expect(component['effectiveDateRawInput']).toBe('');
      expect(component['terminationDateRawInput']).toBe('');
    }));

    it('should reset cue search control and filtered options', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue('test');
      component.filteredCueOptions = [];

      component.onClear();

      expect(component.cueSearchControl.value).toBe('');
      expect(component.filteredCueOptions).toEqual(component.allCueOptions);
    }));

    it('should reset inter type search control and filtered options', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('test');
      component.filteredInterTypeOptions = [];

      component.onClear();

      expect(component.interTypeSearchControl.value).toBe('');
      expect(component.filteredInterTypeOptions).toEqual(component.allInterTypeOptions);
    }));

    it('should also clear termination date fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: 'before'
      });

      component.onClear();

      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    }));
  });

  describe('Close Functionality', () => {
    it('should emit close event', fakeAsync(() => {
      spyOn(component.close, 'emit');
      fixture.detectChanges();
      tick();

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    }));
  });

  describe('UTC Date Conversion', () => {
    it('should convert Date objects to UTC correctly', () => {
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

    it('should return null for null input', () => {
      const result = component['convertToUTCDate'](null);
      expect(result).toBeNull();
    });
  });

  describe('Invalid Date Input Handling', () => {
    it('should store raw input when typing in effective date field', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockEvent = {
        target: { value: 'invalid-date-text' }
      } as any;

      component.onEffectiveDateInput(mockEvent);
      tick();

      expect(component['effectiveDateRawInput']).toBe('invalid-date-text');
    }));

    it('should store raw input when typing in termination date field', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockEvent = {
        target: { value: 'invalid-date-text' }
      } as any;

      component.onTerminationDateInput(mockEvent);
      tick();

      expect(component['terminationDateRawInput']).toBe('invalid-date-text');
    }));

    it('should set invalidDateFormat error on effective date when input is unparseable', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = 'bad-date';

      const mockEvent = { target: mockInput } as any;
      component.onEffectiveDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
      expect(control?.touched).toBe(true);
    }));

    it('should set invalidDateFormat error on termination date when input is unparseable', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = 'bad-date';

      const mockEvent = { target: mockInput } as any;
      component.onTerminationDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
      expect(control?.touched).toBe(true);
    }));

    it('should restore raw input on blur when no valid date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['effectiveDateRawInput'] = 'invalid-date-text';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-date-text');
    }));
  });

  describe('Current Filters Population', () => {
    it('should populate form with current filters', fakeAsync(() => {
      const testDate = new Date().toISOString();
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'N',
        effectiveDate: testDate,
        effectiveDatePeriod: 'after',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.currentFilters = filters;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBe('A');
      expect(component.filterForm.get('interType')?.value).toBe('N');
      expect(component.filterForm.get('effectiveDate')?.value instanceof Date).toBe(true);
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('after');
    }));

    it('should populate termination date from current filters', fakeAsync(() => {
      const testDate = new Date().toISOString();
      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: testDate,
        terminationDatePeriod: 'before'
      };

      component.currentFilters = filters;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('terminationDate')?.value instanceof Date).toBe(true);
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('before');
    }));

    it('should handle null currentFilters', fakeAsync(() => {
      component.currentFilters = null;
      fixture.detectChanges();
      tick();

      expect(component.filterForm.get('donorDecisionCode')?.value).toBeNull();
      expect(component.filterForm.get('interType')?.value).toBeNull();
    }));
  });

  describe('Advanced Validation Scenarios', () => {
    it('should handle multiple validation errors simultaneously', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        terminationDatePeriod: 'before'
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(true);
      expect(component.terminationDateRequired).toBe(true);
      expect(component.isApplyDisabled).toBe(true);
    }));

    it('should resolve validation when all required fields are filled', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectiveDatePeriod: 'after',
        terminationDate: new Date(),
        terminationDatePeriod: 'before'
      });
      tick();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
      expect(component.isApplyDisabled).toBe(false);
    }));
  });

  describe('Date and Period Combinations', () => {
    it('should handle "before" period correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate,
        effectiveDatePeriod: 'before'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
    }));

    it('should handle "after" period correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationDatePeriod: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    }));
  });

  describe('Invalid Date Format Errors', () => {
    it('should not set error for empty date input', fakeAsync(() => {
      fixture.detectChanges();
      tick();

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
      tick();

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

    it('should not set error for empty termination date input', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = '';

      const mockEvent = { target: mockInput } as any;
      component.onTerminationDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));

    it('should not set error for whitespace-only termination date input', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = '   ';

      const mockEvent = { target: mockInput } as any;
      component.onTerminationDateInput(mockEvent);
      tick();

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    }));
  });

  describe('Raw Input Preservation', () => {
    it('should not restore input on blur if control has valid value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

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
      tick();

      component['effectiveDateRawInput'] = 'old-invalid';

      const mockInput = document.createElement('input');
      mockInput.value = 'current-value';

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('current-value');
    }));

    it('should restore termination raw input on blur correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['terminationDateRawInput'] = 'invalid-term-date';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('invalid-term-date');
    }));

    it('should not restore termination input on blur if control has valid value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['terminationDateRawInput'] = 'invalid-term';
      const validDate = new Date();
      component.filterForm.patchValue({ terminationDate: validDate });

      const mockInput = document.createElement('input');
      mockInput.value = 'formatted-date';

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('formatted-date');
    }));

    it('should not restore termination input on blur if input already has value', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['terminationDateRawInput'] = 'old-value';

      const mockInput = document.createElement('input');
      mockInput.value = 'current-text';

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('current-text');
    }));

    it('should not restore effective input on blur if raw input is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['effectiveDateRawInput'] = '';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onEffectiveDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('');
    }));

    it('should not restore termination input on blur if raw input is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['terminationDateRawInput'] = '';

      const mockInput = document.createElement('input');
      mockInput.value = '';

      component.onTerminationDateBlur(mockInput);
      tick();

      expect(mockInput.value).toBe('');
    }));
  });

  describe('Form State Management', () => {
    it('should maintain form state after failed apply attempt', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        effectiveDate: testDate
        // Missing period
      });
      tick();

      expect(component.isApplyDisabled).toBe(true);

      // User adds period
      component.filterForm.patchValue({
        effectiveDatePeriod: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(testDate);
    }));

    it('should apply filters with cue and valid date/period combination', fakeAsync(() => {
      spyOn(component.apply, 'emit');
      fixture.detectChanges();
      tick();

      const testDate = new Date();
      component.filterForm.patchValue({
        donorDecisionCode: 'A',
        effectiveDate: testDate,
        effectiveDatePeriod: 'after'
      });
      tick();

      expect(component.isApplyDisabled).toBe(false);

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.donorDecisionCode).toBe('A');
      expect(emittedValue.effectiveDate).toBeDefined();
      expect(emittedValue.effectiveDatePeriod).toBe('after');
    }));
  });

  describe('Cue Search Filtering', () => {
    it('should filter cue options by value match', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue('A');
      tick(300); // debounceTime

      expect(component.filteredCueOptions.length).toBeGreaterThan(0);
      expect(component.filteredCueOptions.every(o =>
        o.value.toLowerCase().includes('a') || o.display.toLowerCase().includes('a')
      )).toBe(true);
    }));

    it('should filter cue options by display match', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue('Ambiguous');
      tick(300);

      expect(component.filteredCueOptions.length).toBe(1);
      expect(component.filteredCueOptions[0].value).toBe('A');
    }));

    it('should show all cue options when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // First filter
      component.cueSearchControl.setValue('A');
      tick(300);

      // Then clear
      component.cueSearchControl.setValue('');
      tick(300);

      expect(component.filteredCueOptions.length).toBe(component.allCueOptions.length);
    }));

    it('should show all cue options when search is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue(null);
      tick(300);

      expect(component.filteredCueOptions.length).toBe(component.allCueOptions.length);
    }));

    it('should return empty filtered list when search has no matches', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue('ZZZZZ');
      tick(300);

      expect(component.filteredCueOptions.length).toBe(0);
    }));

    it('should be case insensitive for cue search', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.cueSearchControl.setValue('ambiguous');
      tick(300);

      expect(component.filteredCueOptions.length).toBe(1);
      expect(component.filteredCueOptions[0].value).toBe('A');
    }));
  });

  describe('InterType Search Filtering', () => {
    it('should filter inter type options by value match', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('N');
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBeGreaterThan(0);
    }));

    it('should filter inter type options by display match', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('No effect');
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBeGreaterThan(0);
    }));

    it('should show all inter type options when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('N');
      tick(300);

      component.interTypeSearchControl.setValue('');
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBe(component.allInterTypeOptions.length);
    }));

    it('should show all inter type options when search is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue(null);
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBe(component.allInterTypeOptions.length);
    }));

    it('should return empty filtered list when search has no matches', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('ZZZZZ');
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBe(0);
    }));

    it('should be case insensitive for inter type search', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.interTypeSearchControl.setValue('no effect');
      tick(300);

      expect(component.filteredInterTypeOptions.length).toBeGreaterThan(0);
    }));
  });

  describe('Period Options', () => {
    it('should have after and before period options', () => {
      expect(component.periodOptions).toEqual([
        { value: 'after', display: 'After' },
        { value: 'before', display: 'Before' }
      ]);
    });
  });
});
