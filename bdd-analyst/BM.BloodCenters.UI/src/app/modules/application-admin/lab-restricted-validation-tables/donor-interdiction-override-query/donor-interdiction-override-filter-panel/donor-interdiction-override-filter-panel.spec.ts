import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { DonorInterdictionOverrideFilterPanel } from './donor-interdiction-override-filter-panel';
import { DonorInterdictionOverrideFilterValue } from '../models/donor-interdiction-override-query.model';
import { LookupDto } from '../services/valid-donor-override-api.service';

describe('DonorInterdictionOverrideFilterPanel', () => {
  let component: DonorInterdictionOverrideFilterPanel;
  let fixture: ComponentFixture<DonorInterdictionOverrideFilterPanel>;

  const mockCueOptions: LookupDto[] = [
    { code: 'A', description: 'Accept' },
    { code: 'R', description: 'Reject' }
  ];

  const mockTypeOptions: LookupDto[] = [
    { code: 'H', description: 'Hold' },
    { code: 'N', description: 'None' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DonorInterdictionOverrideFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonorInterdictionOverrideFilterPanel);
    component = fixture.componentInstance;
    component.cueOptions = mockCueOptions;
    component.typeOptions = mockTypeOptions;
    fixture.detectChanges();


    });

  describe('ngOnInit', () => {
    it('should initialize form with default values when no current filters', () => {
      component.currentFilters = null;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.filterForm.get('cue')?.value).toBeNull();
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });


    it('should set up value change listeners', (done) => {
      component.ngOnInit();

      // Set a date to trigger the valueChanges listener
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01')
      });

      setTimeout(() => {
        // The listener should have been called
        expect(component.filterForm.get('effectiveDate')?.touched).toBe(true);
        done();
      }, 10);
    });
  });

  describe('onApply', () => {


    it('should emit only non-null filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        cue: null,
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.cue).toBeNull();
      expect(emittedValue.type).toBe('H');
      expect(emittedValue.effectiveDatePeriod).toBeNull();
      expect(emittedValue.effectiveDate).toBeNull();
    });
  });
  describe('periodOptions', () => {
    it('should have correct period options', () => {
      expect(component.periodOptions).toEqual(['After', 'Before']);
    });
  });

  describe('Input properties', () => {
    it('should accept cueOptions input', () => {
      component.cueOptions = mockCueOptions;
      expect(component.cueOptions).toEqual(mockCueOptions);
    });

    it('should accept typeOptions input', () => {
      component.typeOptions = mockTypeOptions;
      expect(component.typeOptions).toEqual(mockTypeOptions);
    });

    it('should accept currentFilters input', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.currentFilters = filters;
      expect(component.currentFilters).toEqual(filters);
    });
  });

  describe('validateEffectivePeriod', () => {




    it('should set effectivePeriodRequired to false when period is set after date', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date('2025-01-01'),
        effectiveDatePeriod: null
      });
      component.validateEffectivePeriod();
      expect(component.effectivePeriodRequired).toBe(true);

      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before'
      });
      component.validateEffectivePeriod();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
    });
  });

  describe('validateTerminationPeriod', () => {




    it('should set terminationPeriodRequired to false when period is set after date', () => {
      component.filterForm.patchValue({
        terminationDate: new Date('2025-12-31'),
        terminationDatePeriod: null
      });
      component.validateTerminationPeriod();
      expect(component.terminationPeriodRequired).toBe(true);

      component.filterForm.patchValue({
        terminationDatePeriod: 'After'
      });
      component.validateTerminationPeriod();

      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      // Reset state before each test
      component.effectivePeriodRequired = false;
      component.terminationPeriodRequired = false;
      component.effectiveDateRequired = false;
      component.terminationDateRequired = false;
      component.filterForm.patchValue({
        cue: 'A',
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
      component.filterForm.get('effectiveDate')?.setErrors(null);
      component.filterForm.get('terminationDate')?.setErrors(null);
    });

    it('should return true when effectivePeriodRequired is true', () => {
      component.effectivePeriodRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationPeriodRequired is true', () => {
      component.terminationPeriodRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effectiveDateRequired is true', () => {
      component.effectiveDateRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when terminationDateRequired is true', () => {
      component.terminationDateRequired = true;

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effective date has invalid format', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date has invalid format', () => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when effective date has matDatepickerParse error', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when termination date has matDatepickerParse error', () => {
      component.filterForm.get('terminationDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when no filters are set', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when at least one filter is set and there are no errors', () => {
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when type is set', () => {
      component.filterForm.patchValue({
        cue: null,
        type: 'H'
      });

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effective date with period is set', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2025-01-01')
      });
      component.validateEffectivePeriod();
      fixture.detectChanges();

      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when only effective date period is set without date', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        effectiveDatePeriod: 'After',
        effectiveDate: null
      });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only effective date is set without period', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        effectiveDatePeriod: null,
        effectiveDate: new Date('2025-01-01')
      });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only termination date period is set without date', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        terminationDatePeriod: 'Before',
        terminationDate: null
      });

      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when only termination date is set without period', () => {
      component.filterForm.patchValue({
        cue: null,
        type: null,
        terminationDatePeriod: null,
        terminationDate: new Date('2025-12-31')
      });

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    it('should initialize cue search control', () => {
      expect(component.cueSearchControl).toBeDefined();
      expect(component.cueSearchControl.value).toBe('');
    });

    it('should initialize type search control', () => {
      expect(component.typeSearchControl).toBeDefined();
      expect(component.typeSearchControl.value).toBe('');
    });

    it('should initialize all cue options', () => {
      expect(component.allCueOptions).toEqual(mockCueOptions);
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
    });

    it('should initialize all type options', () => {
      expect(component.allTypeOptions).toEqual(mockTypeOptions);
      expect(component.filteredTypeOptions).toEqual(mockTypeOptions);
    });



    it('should show all cue options when search is cleared', fakeAsync(() => {
      component.cueSearchControl.setValue('A');
      tick(300);
      expect(component.filteredCueOptions.length).toBe(1);

      component.cueSearchControl.setValue('');
      tick(300);
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
    }));

    it('should show all type options when search is cleared', fakeAsync(() => {
      component.typeSearchControl.setValue('H');
      tick(300);
      expect(component.filteredTypeOptions.length).toBe(1);

      component.typeSearchControl.setValue('');
      tick(300);
      expect(component.filteredTypeOptions).toEqual(mockTypeOptions);
    }));





    it('should reset search controls on clear', () => {
      component.cueSearchControl.setValue('A');
      component.typeSearchControl.setValue('H');

      component.onClear();

      expect(component.cueSearchControl.value).toBe('');
      expect(component.typeSearchControl.value).toBe('');
      expect(component.filteredCueOptions).toEqual(mockCueOptions);
      expect(component.filteredTypeOptions).toEqual(mockTypeOptions);
    });

    it('should return empty array when search has no matches', fakeAsync(() => {
      component.cueSearchControl.setValue('XYZ');
      tick(300);

      expect(component.filteredCueOptions.length).toBe(0);
    }));

  });

  describe('Date input handlers', () => {


    it('should restore invalid text on blur for effective date', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['effectiveDateRawInput'] = 'invalid-date';

      component.onEffectiveDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('invalid-date');
        done();
      }, 10);
    });

    it('should restore invalid text on blur for termination date', (done) => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      component['terminationDateRawInput'] = 'invalid-date';

      component.onTerminationDateBlur(inputElement);

      setTimeout(() => {
        expect(inputElement.value).toBe('invalid-date');
        done();
      }, 10);
    });
  });
});
