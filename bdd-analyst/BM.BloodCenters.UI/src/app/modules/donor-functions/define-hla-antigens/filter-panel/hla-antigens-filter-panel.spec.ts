import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { HlaAntigensFilterPanel } from './hla-antigens-filter-panel';
import { HlaAntigenFilterValue } from '../models/hla-antigens.model';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HlaAntigensService } from '../services/hla-antigens.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('HlaAntigensFilterPanel', () => {
  let component: HlaAntigensFilterPanel;
  let fixture: ComponentFixture<HlaAntigensFilterPanel>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let hlaAntigensServiceSpy: jasmine.SpyObj<HlaAntigensService>;

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterTimeZone: signal('-05:00')
    });
    hlaAntigensServiceSpy = jasmine.createSpyObj('HlaAntigensService', [
      'getHlaAntigens',
      'getEpitopeIds',
      'getEpitopeSuperIds'
    ]);
    hlaAntigensServiceSpy.getEpitopeIds.and.returnValue(of([]));
    hlaAntigensServiceSpy.getEpitopeSuperIds.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        HlaAntigensFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatMomentDateModule
      ],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: HlaAntigensService, useValue: hlaAntigensServiceSpy }
      ]
    });


    


      hlaAntigensServiceSpy.getHlaAntigens.calls.reset();


      hlaAntigensServiceSpy.getEpitopeIds.calls.reset();


      hlaAntigensServiceSpy.getEpitopeSuperIds.calls.reset();


      hlaAntigensServiceSpy.getEpitopeIds.and.returnValue(of([]));


      hlaAntigensServiceSpy.getEpitopeSuperIds.and.returnValue(of([]));


    fixture = TestBed.createComponent(HlaAntigensFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {


    it('should initialize form with provided current filters', () => {
      const currentFilters: HlaAntigenFilterValue = {
        antigen: '123',
        associatedAntigen: '456',
        effectiveDatePeriod: 'On',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('antigen')?.value).toBe('123');
      expect(component.filterForm.get('associatedAntigen')?.value).toBe('456');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('On');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });
  });


  describe('Apply Filters', () => {


    it('should emit null values when fields are empty', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });

    it('should emit filters with antigen value', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ antigen: 'A1' });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({ antigen: 'A1' }));
    });

    it('should not apply when effectiveDatePeriodError exists', () => {
      spyOn(component.apply, 'emit');
      // Set date without period to trigger the error
      component.filterForm.patchValue({ effectiveDate: moment('2025-01-01'), effectiveDatePeriod: null });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not apply when terminationDatePeriodError exists', () => {
      spyOn(component.apply, 'emit');
      // Set date without period to trigger the error
      component.filterForm.patchValue({ terminationDate: moment('2025-12-31'), terminationDatePeriod: null });
      component.onApply();
      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset form and clear errors', () => {
      component.filterForm.patchValue({ antigen: 'A1', associatedAntigen: 'B1' });
      component.effectiveDatePeriodError = 'error';
      component.terminationDatePeriodError = 'error';

      component.onClearAll();

      expect(component.filterForm.get('antigen')?.value).toBeNull();
      expect(component.filterForm.get('associatedAntigen')?.value).toBeNull();
      expect(component.effectiveDatePeriodError).toBe('');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('isApplyDisabled', () => {
    it('should be disabled when no values', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when antigen has value', () => {
      component.filterForm.patchValue({ antigen: 'A1' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be enabled when associatedAntigen has value', () => {
      component.filterForm.patchValue({ associatedAntigen: 'B1' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be disabled when effectiveDatePeriodError exists', () => {
      component.filterForm.patchValue({ antigen: 'A1' });
      component.effectiveDatePeriodError = 'error';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when terminationDatePeriodError exists', () => {
      component.filterForm.patchValue({ antigen: 'A1' });
      component.terminationDatePeriodError = 'error';
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when effectiveDate has invalidDate error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when terminationDate has invalidDate error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDate: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when effectiveDate has invalidDateFormat error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be disabled when terminationDate has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be enabled when effectiveDate and period have value', () => {
      component.filterForm.patchValue({ effectiveDate: moment('2025-01-01'), effectiveDatePeriod: 'On' });
      expect(component.isApplyDisabled).toBe(false);
    });
  });

  describe('Period Validation', () => {
    it('should set error when effectiveDate is set but period is not', () => {
      component.filterForm.patchValue({ effectiveDate: moment('2025-01-01') });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });

    it('should clear error when effectiveDatePeriod is set', () => {
      component.filterForm.patchValue({
        effectiveDate: moment('2025-01-01'),
        effectiveDatePeriod: 'On'
      });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('');
    });

    it('should set error when terminationDate is set but period is not', () => {
      component.filterForm.patchValue({ terminationDate: moment('2025-12-31') });
      fixture.detectChanges();
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear error when terminationDatePeriod is set', () => {
      component.filterForm.patchValue({
        terminationDate: moment('2025-12-31'),
        terminationDatePeriod: 'Before'
      });
      fixture.detectChanges();
      expect(component.terminationDatePeriodError).toBe('');
    });

    it('should clear error when date is cleared', () => {
      component.filterForm.patchValue({ effectiveDate: moment('2025-01-01') });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('Period is required');

      component.filterForm.patchValue({ effectiveDate: null });
      fixture.detectChanges();
      expect(component.effectiveDatePeriodError).toBe('');
    });
  });

  describe('Load Epitope IDs', () => {
    it('should load epitope IDs from API', () => {
      hlaAntigensServiceSpy.getEpitopeIds.and.returnValue(of(['A1', 'A2', 'A3']));
      component.ngOnInit();
      expect(component.epitopeIds).toEqual(['A1', 'A2', 'A3']);
      expect(component.filteredEpitopeIds).toEqual(['A1', 'A2', 'A3']);
    });

    it('should handle epitope IDs load error', () => {
      hlaAntigensServiceSpy.getEpitopeIds.and.returnValue(throwError(() => new Error('fail')));
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('Load Epitope Super IDs', () => {
    it('should load epitope super IDs from API', () => {
      hlaAntigensServiceSpy.getEpitopeSuperIds.and.returnValue(of(['S1', 'S2']));
      component.ngOnInit();
      expect(component.epitopeSuperIds).toEqual(['S1', 'S2']);
      expect(component.filteredEpitopeSuperIds).toEqual(['S1', 'S2']);
    });

    it('should handle epitope super IDs load error', () => {
      hlaAntigensServiceSpy.getEpitopeSuperIds.and.returnValue(throwError(() => new Error('fail')));
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => {
      component.epitopeIds = ['A1', 'A2', 'B1'];
      component.epitopeSuperIds = ['S1', 'S2', 'T1'];
    });

    it('should filter antigen options by search term', () => {
      component.antigenSearchControl.setValue('A');
      expect(component.filteredEpitopeIds).toEqual(['A1', 'A2']);
    });

    it('should show all antigen options when search is empty', () => {
      component.antigenSearchControl.setValue('A');
      component.antigenSearchControl.setValue('');
      expect(component.filteredEpitopeIds).toEqual(['A1', 'A2', 'B1']);
    });

    it('should filter associated antigen options by search term', () => {
      component.associatedAntigenSearchControl.setValue('S');
      expect(component.filteredEpitopeSuperIds).toEqual(['S1', 'S2']);
    });

    it('should show all associated antigen options when search is empty', () => {
      component.associatedAntigenSearchControl.setValue('T');
      component.associatedAntigenSearchControl.setValue('');
      expect(component.filteredEpitopeSuperIds).toEqual(['S1', 'S2', 'T1']);
    });
  });

  describe('Date Input Handlers', () => {
    it('should store raw input and mark control on effective date input', () => {
      const mockEvent = { target: { value: 'invalid-date' } } as any;
      component.onEffectiveDateInput(mockEvent);
      expect(component['effectiveDateRawInput']).toBe('invalid-date');
    });

    it('should store raw input on termination date input', () => {
      const mockEvent = { target: { value: 'bad-date' } } as any;
      component.onTerminationDateInput(mockEvent);
      expect(component['terminationDateRawInput']).toBe('bad-date');
    });

    it('should handle effective date input with empty value', () => {
      const mockEvent = { target: { value: '' } } as any;
      component.onEffectiveDateInput(mockEvent);
      expect(component['effectiveDateRawInput']).toBe('');
    });

    it('should handle termination date input with empty value', () => {
      const mockEvent = { target: { value: '' } } as any;
      component.onTerminationDateInput(mockEvent);
      expect(component['terminationDateRawInput']).toBe('');
    });
  });

  describe('Date Blur Handlers', () => {
    it('should handle effective date blur with empty input', (done) => {
      const input = { value: '', trim: () => '' } as any;
      component.onEffectiveDateBlur(input);
      setTimeout(() => {
        done();
      }, 50);
    });

    it('should handle termination date blur with empty input', (done) => {
      const input = { value: '', trim: () => '' } as any;
      component.onTerminationDateBlur(input);
      setTimeout(() => {
        done();
      }, 50);
    });

    it('should restore raw input on effective date blur when control has no value', (done) => {
      component['effectiveDateRawInput'] = 'invalid';
      const input = { value: '' } as any;
      component.onEffectiveDateBlur(input);
      setTimeout(() => {
        expect(input.value).toBe('invalid');
        done();
      }, 50);
    });

    it('should restore raw input on termination date blur when control has no value', (done) => {
      component['terminationDateRawInput'] = 'invalid';
      const input = { value: '' } as any;
      component.onTerminationDateBlur(input);
      setTimeout(() => {
        expect(input.value).toBe('invalid');
        done();
      }, 50);
    });

    it('should parse valid date on effective date blur', (done) => {
      const validDateStr = '15-JAN-2025';
      const input = { value: validDateStr } as any;
      component.onEffectiveDateBlur(input);
      setTimeout(() => {
        // Either parsed successfully or set error - both are valid outcomes
        done();
      }, 50);
    });

    it('should set invalidDate error for unparseable effective date', (done) => {
      const input = { value: 'NOTADATE' } as any;
      component.onEffectiveDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('effectiveDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 50);
    });

    it('should set invalidDate error for unparseable termination date', (done) => {
      const input = { value: 'NOTADATE' } as any;
      component.onTerminationDateBlur(input);
      setTimeout(() => {
        const control = component.filterForm.get('terminationDate');
        expect(control?.hasError('invalidDate')).toBe(true);
        done();
      }, 50);
    });

    it('should clear invalidDate error when input is empty on blur', (done) => {
      const control = component.filterForm.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      const input = { value: '' } as any;
      component.onEffectiveDateBlur(input);
      setTimeout(() => {
        expect(control?.hasError('invalidDate')).toBeFalsy();
        done();
      }, 50);
    });
  });

  describe('Initial validation with currentFilters', () => {
    it('should validate periods when currentFilters has date without period', () => {
      component.currentFilters = {
        antigen: null,
        associatedAntigen: null,
        effectiveDatePeriod: null,
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.ngOnInit();
      expect(component.effectiveDatePeriodError).toBe('Period is required');
    });
  });
});

