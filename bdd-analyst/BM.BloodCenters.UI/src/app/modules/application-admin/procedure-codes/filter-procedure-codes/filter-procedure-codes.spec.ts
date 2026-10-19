import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FilterProcedureCodesComponent } from './filter-procedure-codes';
import { ProcedureCodeApiService } from '../services/procedure-code-api.service';
import { ProcedureCodeFilter } from '../models/procedure-code.model';
import moment from 'moment';

describe('FilterProcedureCodesComponent', () => {
  let component: FilterProcedureCodesComponent;
  let fixture: ComponentFixture<FilterProcedureCodesComponent>;
  let mockApiService: jasmine.SpyObj<ProcedureCodeApiService>;

  const mockDropdownResponse = {
    procedureCodes: ['WB', 'RBC', 'PLT'],
    deferralDays: [1, 2, 7, 14, 28, 56, 112]
  };

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('ProcedureCodeApiService', ['getProcedureCodeDropdowns']);
    mockApiService.getProcedureCodeDropdowns.and.returnValue(of(mockDropdownResponse));



      TestBed.configureTestingModule({
      imports: [FilterProcedureCodesComponent],
      providers: [
        { provide: ProcedureCodeApiService, useValue: mockApiService },
        provideAnimations(),
        provideHttpClient(),
      ],
    });


    


      mockApiService.getProcedureCodeDropdowns.calls.reset();


      mockApiService.getProcedureCodeDropdowns.and.returnValue(of(mockDropdownResponse));


    fixture = TestBed.createComponent(FilterProcedureCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize form with default values when no current filters', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('procedureCode')?.value).toBeNull();
    expect(component.filterForm.get('deferralDays')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
  });

  it('should initialize form with current filters when provided', () => {
    const futureDate = moment().add(1, 'year').toISOString();
    const filters: ProcedureCodeFilter = {
      procedureCode: 'WB',
      deferralDays: 56,
      effDate: futureDate,
      effDatePeriod: 'after'
    };

    component.currentFilters = filters;
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.filterForm.get('procedureCode')?.value).toBe('WB');
    expect(component.filterForm.get('deferralDays')?.value).toBe(56);
    expect(component.filterForm.get('effDatePeriod')?.value).toBe('after');
  });



  it('should include deferral days with value 0', () => {
    const responseWithZero = {
      procedureCodes: ['WB'],
      deferralDays: [0, 1, 7]
    };
    mockApiService.getProcedureCodeDropdowns.and.returnValue(of(responseWithZero));

    const testComponent = TestBed.createComponent(FilterProcedureCodesComponent).componentInstance;
    testComponent.ngOnInit();
    fixture.detectChanges();

    expect(testComponent.allDeferralDaysOptions).toContain(0);
    expect(testComponent.filteredDeferralDaysOptions).toContain(0);
  });

  it('should populate both all and filtered options on load', () => {
    expect(component.allProcedureCodeOptions).toEqual(component.filteredProcedureCodeOptions);
    expect(component.allDeferralDaysOptions).toEqual(component.filteredDeferralDaysOptions);
  });





  it('should emit apply event with effective date and period filters', () => {
    spyOn(component.apply, 'emit');
    const futureDate = moment().add(1, 'year').toDate();
    component.filterForm.patchValue({
      effDate: futureDate,
      effDatePeriod: 'after'
    });
    component.onApply();

    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.effDatePeriod).toBe('after');
    expect(emittedValue.effDate).toBeDefined();
  });





  describe('Period Validation', () => {
    it('should require period when effective date is selected', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({ effDate: futureDate });
      component.validateEffPeriod();

      expect(component.effPeriodRequired).toBeTrue();
    });

    it('should not require period when effective date is not selected', () => {
      component.filterForm.patchValue({ effDate: null });
      component.validateEffPeriod();

      expect(component.effPeriodRequired).toBeFalse();
    });

    it('should require period when termination date is selected', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({ termDate: futureDate });
      component.validateTermPeriod();

      expect(component.termPeriodRequired).toBeTrue();
    });

    it('should not require period when termination date is not selected', () => {
      component.filterForm.patchValue({ termDate: null });
      component.validateTermPeriod();

      expect(component.termPeriodRequired).toBeFalse();
    });

    it('should not require period when both date and period are selected', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({
        effDate: futureDate,
        effDatePeriod: 'after'
      });
      component.validateEffPeriod();

      expect(component.effPeriodRequired).toBeFalse();
    });
  });

  describe('Default Values', () => {
    it('should use null as default for procedureCode, not empty string', () => {
      const testComponent = TestBed.createComponent(FilterProcedureCodesComponent).componentInstance;
      testComponent.ngOnInit();
      fixture.detectChanges();

      expect(testComponent.filterForm.get('procedureCode')?.value).toBeNull();
      expect(testComponent.filterForm.get('procedureCode')?.value).not.toBe('');
    });


  });

  describe('Apply Button State', () => {
    it('should disable apply when no filters are selected', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when procedure code is selected', () => {
      component.filterForm.patchValue({ procedureCode: 'WB' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should enable apply when deferral days is selected', () => {
      component.filterForm.patchValue({ deferralDays: 56 });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply when period is required but not selected', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({ effDate: futureDate });
      component.validateEffPeriod();

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when date and period are both selected', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({
        effDate: futureDate,
        effDatePeriod: 'after'
      });
      component.validateEffPeriod();

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('Date Input Handlers', () => {
    it('should store raw input text when user types in effective date field', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.onEffDateInput(event);

      expect(component['effDateRawInput']).toBe('invalid-date');
    });

    it('should store raw input text when user types in termination date field', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.onTermDateInput(event);

      expect(component['termDateRawInput']).toBe('invalid-date');
    });

    it('should mark effective date control as touched and dirty when input has value', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.onEffDateInput(event);

      const control = component.filterForm.get('effDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should mark termination date control as touched and dirty when input has value', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.onTermDateInput(event);

      const control = component.filterForm.get('termDate');
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should set invalidDate error when effective date input is invalid', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.filterForm.get('effDate')?.setValue(null);
      component.onEffDateInput(event);

      const control = component.filterForm.get('effDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    });

    it('should set invalidDate error when termination date input is invalid', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'invalid-date';
      const event = { target: inputElement } as any;

      component.filterForm.get('termDate')?.setValue(null);
      component.onTermDateInput(event);

      const control = component.filterForm.get('termDate');
      expect(control?.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('Date Blur Handlers', () => {
    it('should restore raw input text on effective date blur when date is invalid', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['effDateRawInput'] = 'invalid-date';
      component.filterForm.get('effDate')?.setValue(null);

      component.onEffDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('invalid-date');
        done();
      }, 10);
    });

    it('should restore raw input text on termination date blur when date is invalid', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['termDateRawInput'] = 'invalid-date';
      component.filterForm.get('termDate')?.setValue(null);

      component.onTermDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('invalid-date');
        done();
      }, 10);
    });

    it('should not restore text on effective date blur when date is valid', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '11-JAN-2027';
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.get('effDate')?.setValue(futureDate);

      component.onEffDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('11-JAN-2027');
        done();
      }, 10);
    });

    it('should not restore text on termination date blur when date is valid', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '11-JAN-2027';
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.get('termDate')?.setValue(futureDate);

      component.onTermDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('11-JAN-2027');
        done();
      }, 10);
    });

    it('should not restore text on effective date blur when raw input is empty', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['effDateRawInput'] = '';
      component.filterForm.get('effDate')?.setValue(null);

      component.onEffDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('');
        done();
      }, 10);
    });

    it('should not restore text on termination date blur when raw input is empty', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['termDateRawInput'] = '';
      component.filterForm.get('termDate')?.setValue(null);

      component.onTermDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('');
        done();
      }, 10);
    });
  });

  describe('Date Format Validation in Apply Button', () => {
    it('should disable apply when effective date has invalidDateFormat error', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when effective date has matDatepickerParse error', () => {
      component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when effective date has invalidDate error', () => {
      component.filterForm.get('effDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when termination date has invalidDateFormat error', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when termination date has matDatepickerParse error', () => {
      component.filterForm.get('termDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should disable apply when termination date has invalidDate error', () => {
      component.filterForm.get('termDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when dates are valid and other fields are filled', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({
        effDate: futureDate,
        effDatePeriod: 'after'
      });
      component.filterForm.get('effDate')?.setErrors(null);
      component.filterForm.get('termDate')?.setErrors(null);
      component.validateEffPeriod();

      expect(component.isApplyDisabled).toBeFalse();
    });
  });

  describe('UTC Date Conversion', () => {
    it('should convert moment date to UTC date correctly', () => {
      spyOn(component.apply, 'emit');
      const testDate = moment('2027-06-15', 'YYYY-MM-DD');
      component.filterForm.patchValue({
        effDate: testDate,
        effDatePeriod: 'after'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      const emittedDate = new Date(emittedValue.effDate);
      expect(emittedDate.getUTCFullYear()).toBe(2027);
      expect(emittedDate.getUTCMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(emittedDate.getUTCDate()).toBe(15);
      expect(emittedDate.getUTCHours()).toBe(0);
      expect(emittedDate.getUTCMinutes()).toBe(0);
      expect(emittedDate.getUTCSeconds()).toBe(0);
    });

    it('should convert regular Date object to UTC date correctly', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date(2027, 5, 15); // June 15, 2027 (local time)
      component.filterForm.patchValue({
        effDate: testDate,
        effDatePeriod: 'after'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      const emittedDate = new Date(emittedValue.effDate);
      expect(emittedDate.getUTCFullYear()).toBe(2027);
      expect(emittedDate.getUTCMonth()).toBe(5); // June
      expect(emittedDate.getUTCDate()).toBe(15);
      expect(emittedDate.getUTCHours()).toBe(0);
      expect(emittedDate.getUTCMinutes()).toBe(0);
      expect(emittedDate.getUTCSeconds()).toBe(0);
    });

    it('should handle null dates in onApply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        procedureCode: 'WB',
        effDate: null,
        termDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effDate).toBeUndefined();
      expect(emittedValue.termDate).toBeUndefined();
    });

    it('should convert both effective and termination dates to UTC', () => {
      spyOn(component.apply, 'emit');
      const effDate = moment('2027-01-01', 'YYYY-MM-DD');
      const termDate = new Date(2027, 11, 31); // December 31, 2027

      component.filterForm.patchValue({
        effDate: effDate,
        effDatePeriod: 'after',
        termDate: termDate,
        termDatePeriod: 'before'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      const emittedEffDate = new Date(emittedValue.effDate);
      const emittedTermDate = new Date(emittedValue.termDate);

      expect(emittedEffDate.getUTCFullYear()).toBe(2027);
      expect(emittedEffDate.getUTCMonth()).toBe(0); // January
      expect(emittedEffDate.getUTCDate()).toBe(1);

      expect(emittedTermDate.getUTCFullYear()).toBe(2027);
      expect(emittedTermDate.getUTCMonth()).toBe(11); // December
      expect(emittedTermDate.getUTCDate()).toBe(31);
    });
  });

  describe('Procedure Code Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should be case-insensitive when filtering procedure codes', (done) => {
      component.allProcedureCodeOptions = ['WB', 'RBC', 'PLT'];
      component.filteredProcedureCodeOptions = [...component.allProcedureCodeOptions];

      component.procedureCodeSearchControl.setValue('wb');

      setTimeout(() => {
        expect(component.filteredProcedureCodeOptions).toContain('WB');
        done();
      }, 350);
    });

    it('should show all procedure codes when search is empty', (done) => {
      component.allProcedureCodeOptions = ['WB', 'RBC', 'PLT'];
      component.filteredProcedureCodeOptions = [];

      component.procedureCodeSearchControl.setValue('');

      setTimeout(() => {
        expect(component.filteredProcedureCodeOptions.length).toBe(3);
        done();
      }, 350);
    });

    it('should show all procedure codes when search is null', (done) => {
      component.allProcedureCodeOptions = ['WB', 'RBC', 'PLT'];
      component.filteredProcedureCodeOptions = [];

      component.procedureCodeSearchControl.setValue(null);

      setTimeout(() => {
        expect(component.filteredProcedureCodeOptions.length).toBe(3);
        done();
      }, 350);
    });
  });

  describe('Deferral Days Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should filter deferral days with partial match', (done) => {
      component.allDeferralDaysOptions = [1, 2, 7, 14, 28, 56, 112];
      component.filteredDeferralDaysOptions = [...component.allDeferralDaysOptions];

      component.deferralDaysSearchControl.setValue('1');

      setTimeout(() => {
        expect(component.filteredDeferralDaysOptions).toContain(1);
        expect(component.filteredDeferralDaysOptions).toContain(14);
        expect(component.filteredDeferralDaysOptions).toContain(112);
        done();
      }, 350);
    });

    it('should show all deferral days when search is empty', (done) => {
      component.allDeferralDaysOptions = [1, 2, 7, 14];
      component.filteredDeferralDaysOptions = [];

      component.deferralDaysSearchControl.setValue('');

      setTimeout(() => {
        expect(component.filteredDeferralDaysOptions.length).toBe(4);
        done();
      }, 350);
    });

    it('should show all deferral days when search is null', (done) => {
      component.allDeferralDaysOptions = [1, 2, 7, 14];
      component.filteredDeferralDaysOptions = [];

      component.deferralDaysSearchControl.setValue(null);

      setTimeout(() => {
        expect(component.filteredDeferralDaysOptions.length).toBe(4);
        done();
      }, 350);
    });
  });

  describe('Period Selection Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear effPeriodRequired when period is selected after date', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({ effDate: futureDate });
      component.validateEffPeriod();
      expect(component.effPeriodRequired).toBeTrue();

      component.filterForm.patchValue({ effDatePeriod: 'after' });
      component.validateEffPeriod();
      expect(component.effPeriodRequired).toBeFalse();
    });

    it('should clear termPeriodRequired when period is selected after date', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({ termDate: futureDate });
      component.validateTermPeriod();
      expect(component.termPeriodRequired).toBeTrue();

      component.filterForm.patchValue({ termDatePeriod: 'before' });
      component.validateTermPeriod();
      expect(component.termPeriodRequired).toBeFalse();
    });

    it('should not require period when date is cleared', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({
        effDate: futureDate,
        effDatePeriod: null
      });
      component.validateEffPeriod();
      expect(component.effPeriodRequired).toBeTrue();

      component.filterForm.patchValue({ effDate: null });
      component.validateEffPeriod();
      expect(component.effPeriodRequired).toBeFalse();
    });
  });

  describe('Apply Filter with Multiple Criteria', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit all selected filters', () => {
      spyOn(component.apply, 'emit');
      const futureDate = moment().add(1, 'year').toDate();

      component.filterForm.patchValue({
        procedureCode: 'WB',
        deferralDays: 56,
        effDate: futureDate,
        effDatePeriod: 'after',
        termDate: moment().add(2, 'years').toDate(),
        termDatePeriod: 'before'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.procedureCode).toBe('WB');
      expect(emittedValue.deferralDays).toBe(56);
      expect(emittedValue.effDatePeriod).toBe('after');
      expect(emittedValue.termDatePeriod).toBe('before');
      expect(emittedValue.effDate).toBeDefined();
      expect(emittedValue.termDate).toBeDefined();
    });

    it('should not emit undefined values for optional filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        procedureCode: 'WB',
        deferralDays: null,
        effDate: null,
        termDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.procedureCode).toBe('WB');
      expect(emittedValue.deferralDays).toBeUndefined();
      expect(emittedValue.effDate).toBeUndefined();
      expect(emittedValue.termDate).toBeUndefined();
    });
  });

  describe('Clear All Filters Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls to default values', () => {
      const futureDate = moment().add(1, 'year').toDate();
      component.filterForm.patchValue({
        procedureCode: 'WB',
        deferralDays: 56,
        effDate: futureDate,
        effDatePeriod: 'after',
        termDate: futureDate,
        termDatePeriod: 'before'
      });

      component.onClearAll();

      expect(component.filterForm.get('procedureCode')?.value).toBeNull();
      expect(component.filterForm.get('deferralDays')?.value).toBeNull();
      expect(component.filterForm.get('effDate')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDate')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    });

    it('should clear all validation errors', () => {
      component.filterForm.get('effDatePeriod')?.setErrors({ required: true });
      component.filterForm.get('termDatePeriod')?.setErrors({ required: true });

      component.onClearAll();

      expect(component.filterForm.get('effDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.errors).toBeNull();
    });



    it('should reset period required flags', () => {
      component.effPeriodRequired = true;
      component.termPeriodRequired = true;

      component.onClearAll();

      expect(component.effPeriodRequired).toBeFalse();
      expect(component.termPeriodRequired).toBeFalse();
    });
  });

  describe('Dropdown Loading Error Handling', () => {
    beforeEach(() => {
      mockApiService.getProcedureCodeDropdowns.and.returnValue(
        throwError(() => new Error('API Error'))
      );
    });

    it('should handle API error gracefully when loading dropdowns', () => {
      spyOn(console, 'error');
      const testComponent = TestBed.createComponent(FilterProcedureCodesComponent).componentInstance;
      testComponent.ngOnInit();
      fixture.detectChanges();

      expect(testComponent.allProcedureCodeOptions).toEqual([]);
      expect(testComponent.filteredProcedureCodeOptions).toEqual([]);
      expect(testComponent.allDeferralDaysOptions).toEqual([]);
      expect(testComponent.filteredDeferralDaysOptions).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Dropdown API Integration', () => {


    it('should transform API response to populate dropdown options', () => {
      expect(component.allProcedureCodeOptions).toEqual(['WB', 'RBC', 'PLT']);
      expect(component.allDeferralDaysOptions).toEqual([1, 2, 7, 14, 28, 56, 112]);
    });

    it('should set filtered options equal to all options initially', () => {
      expect(component.filteredProcedureCodeOptions).toEqual(component.allProcedureCodeOptions);
      expect(component.filteredDeferralDaysOptions).toEqual(component.allDeferralDaysOptions);
    });

    it('should handle empty response arrays', () => {
      const emptyResponse = {
        procedureCodes: [],
        deferralDays: []
      };
      mockApiService.getProcedureCodeDropdowns.and.returnValue(of(emptyResponse));

      const testComponent = TestBed.createComponent(FilterProcedureCodesComponent).componentInstance;
      testComponent.ngOnInit();
      fixture.detectChanges();

      expect(testComponent.allProcedureCodeOptions).toEqual([]);
      expect(testComponent.filteredProcedureCodeOptions).toEqual([]);
      expect(testComponent.allDeferralDaysOptions).toEqual([]);
      expect(testComponent.filteredDeferralDaysOptions).toEqual([]);
    });

    it('should receive procedure codes as strings from API service', () => {
      component.allProcedureCodeOptions.forEach(code => {
        expect(typeof code).toBe('string');
      });
    });

    it('should receive deferral days as numbers from API service', () => {
      component.allDeferralDaysOptions.forEach(days => {
        expect(typeof days).toBe('number');
      });
    });
  });

  describe('Component Lifecycle', () => {


    it('should setup search functionality on init', () => {
      expect(component.procedureCodeSearchControl).toBeDefined();
      expect(component.deferralDaysSearchControl).toBeDefined();
    });
  });
});
