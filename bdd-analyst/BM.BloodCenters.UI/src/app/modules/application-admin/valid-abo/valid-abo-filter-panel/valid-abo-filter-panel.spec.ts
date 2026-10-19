import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import moment from 'moment';

import { ValidAboFilterPanel } from './valid-abo-filter-panel';
import { ValidAboService } from '../services/valid-abo.service';
import { ValidAboFilterLov } from '../models/valid-abo.model';

interface ReturnResult<T> {
  Success?: boolean;
  Message?: string;
  Error?: string;
  StatusCode?: number;
  Data?: T[];
  Item?: T;
  Total?: number;
}

describe('ValidAboFilterPanel', () => {
  let component: ValidAboFilterPanel;
  let fixture: ComponentFixture<ValidAboFilterPanel>;
  let mockService: jasmine.SpyObj<ValidAboService>;

  // Helper to format date in local timezone (matches component's formatDate)
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Use dynamic dates for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const mockFilterData: ValidAboFilterLov = {
    intendedUse: ['RG-Default', 'EM-Emergency', 'AO-Autologous', 'AB-Biohazardous'],
    unitScheme: ['ISBT128', 'Codabar'],
    transfusionStatus: ['Transfusable', 'Not Transfusable', 'Biohazard', 'Manufacturing', 'HOLD']
  };

  const mockFilterResponse: ReturnResult<ValidAboFilterLov> = {
    Success: true,
    Data: [mockFilterData]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidAboService', [
      'getValidAboFilters'
    ]);
    mockService.getValidAboFilters.and.returnValue(of(mockFilterResponse));



      TestBed.configureTestingModule({
      imports: [
        ValidAboFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ValidAboService, useValue: mockService }
      ]
    });


    


      mockService.getValidAboFilters.calls.reset();


      mockService.getValidAboFilters.and.returnValue(of(mockFilterResponse));


    fixture = TestBed.createComponent(ValidAboFilterPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize the form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('intendedUse')?.value).toBeNull();
      expect(component.filterForm.get('unitScheme')?.value).toBeNull();
      expect(component.filterForm.get('transfusionStatus')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });



    it('should populate filter options from service response', () => {
      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual(['RG-Default', 'EM-Emergency', 'AO-Autologous', 'AB-Biohazardous']);
      expect(component.unitSchemeOptions).toEqual(['ISBT128', 'Codabar']);
      expect(component.transfusionStatusOptions).toEqual(['Transfusable', 'Not Transfusable', 'Biohazard', 'Manufacturing', 'HOLD']);
    });

    it('should handle empty data array in response', () => {
      const emptyResponse: ReturnResult<ValidAboFilterLov> = {
        Success: true,
        Data: []
      };
      mockService.getValidAboFilters.and.returnValue(of(emptyResponse));

      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual([]);
      // unitScheme and transfusionStatus are FE enums — always populated
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });

    it('should handle undefined data in response', () => {
      const undefinedDataResponse: ReturnResult<ValidAboFilterLov> = {
        Success: true,
        Data: undefined
      };
      mockService.getValidAboFilters.and.returnValue(of(undefinedDataResponse));

      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual([]);
      // unitScheme and transfusionStatus are FE enums — always populated
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });

    it('should handle missing properties in data', () => {
      const incompleteData: ValidAboFilterLov = {
        intendedUse: [],
        unitScheme: [],
        transfusionStatus: []
      };
      const incompleteResponse: ReturnResult<ValidAboFilterLov> = {
        Success: true,
        Data: [incompleteData]
      };
      mockService.getValidAboFilters.and.returnValue(of(incompleteResponse));

      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual([]);
      // unitScheme and transfusionStatus are FE enums — always populated
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });

    it('should handle partial filter options', () => {
      const partialData: ValidAboFilterLov = {
        intendedUse: ['RG-Default'],
        unitScheme: [],
        transfusionStatus: ['Transfusable', 'Not Transfusable']
      };
      const partialResponse: ReturnResult<ValidAboFilterLov> = {
        Success: true,
        Data: [partialData]
      };
      mockService.getValidAboFilters.and.returnValue(of(partialResponse));

      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual(['RG-Default']);
      // unitScheme and transfusionStatus are FE enums — not affected by API response
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });

    it('should initialize form with current filters if provided', () => {
      component.currentFilters = {
        intendedUse: 'RG-Default',
        unitScheme: 'ISBT128',
        transfusionStatus: 'Transfusable',
        effectiveDateFrom: formatLocalDate(tomorrow),
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      fixture.detectChanges();

      expect(component.filterForm.get('intendedUse')?.value).toBe('RG-Default');
      expect(component.filterForm.get('unitScheme')?.value).toBe('ISBT128');
      expect(component.filterForm.get('transfusionStatus')?.value).toBe('Transfusable');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      const effectiveDate = component.filterForm.get('effectiveDate')?.value;
      expect(effectiveDate).toBeTruthy();
    });

    it('should handle partial current filters', () => {
      component.currentFilters = {
        intendedUse: 'RG-Default',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      fixture.detectChanges();

      expect(component.filterForm.get('intendedUse')?.value).toBe('RG-Default');
      expect(component.filterForm.get('unitScheme')?.value).toBeNull();
      expect(component.filterForm.get('transfusionStatus')?.value).toBeNull();
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form value when intendedUse is selected', () => {
      component.filterForm.get('intendedUse')?.setValue('RG-Default');

      expect(component.filterForm.get('intendedUse')?.value).toBe('RG-Default');
    });

    it('should update form value when unitScheme is selected', () => {
      component.filterForm.get('unitScheme')?.setValue('ISBT128');

      expect(component.filterForm.get('unitScheme')?.value).toBe('ISBT128');
    });

    it('should update form value when transfusionStatus is selected', () => {
      component.filterForm.get('transfusionStatus')?.setValue('Transfusable');

      expect(component.filterForm.get('transfusionStatus')?.value).toBe('Transfusable');
    });

    it('should update form value when date fields are set', () => {
      component.filterForm.get('effectiveDate')?.setValue(tomorrow);

      expect(component.filterForm.get('effectiveDate')?.value).toEqual(tomorrow);
    });

    it('should allow multiple form fields to be set', () => {
      component.filterForm.patchValue({
        intendedUse: 'EM-Emergency',
        unitScheme: 'Codabar',
        transfusionStatus: 'Not Transfusable',
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: 'Before',
        terminationDate: nextWeek
      });

      expect(component.filterForm.value).toEqual({
        intendedUse: 'EM-Emergency',
        unitScheme: 'Codabar',
        transfusionStatus: 'Not Transfusable',
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: 'Before',
        terminationDate: nextWeek
      });
    });
  });

  describe('onApply()', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should format dates when applying filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        intendedUse: 'RG-Default',
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: 'Before',
        terminationDate: nextWeek
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        intendedUse: 'RG-Default',
        unitScheme: null,
        transfusionStatus: null,
        effectiveDateFrom: formatLocalDate(tomorrow),
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: formatLocalDate(nextWeek)
      });
    });
  });


  describe('Template Bindings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should render all mat-select fields', () => {
      const selects = fixture.nativeElement.querySelectorAll('mat-select');
      expect(selects.length).toBeGreaterThanOrEqual(3);
    });

    it('should render date picker fields', () => {
      const datepickers = fixture.nativeElement.querySelectorAll('input[matInput]');
      expect(datepickers.length).toBeGreaterThanOrEqual(2);  // effectiveDate & terminationDate
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper ARIA attributes on section', () => {
      const section = fixture.nativeElement.querySelector('section');
      expect(section.getAttribute('role')).toBe('dialog');
      expect(section.getAttribute('aria-modal')).toBe('false');
      expect(section.getAttribute('aria-labelledby')).toBe('filter-title');
    });

    it('should have heading with correct id', () => {
      const heading = fixture.nativeElement.querySelector('#filter-title');
      expect(heading).toBeTruthy();
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with success false', () => {
      const failureResponse: ReturnResult<ValidAboFilterLov> = {
        Success: false,
        Message: 'Failed to load filters',
        Data: []
      };
      mockService.getValidAboFilters.and.returnValue(of(failureResponse));

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      expect(component.intendedUseOptions).toEqual([]);
      // unitScheme and transfusionStatus are FE enums — always populated
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });



    it('should handle multiple filter items in data array (use first one)', () => {
      const multipleData: ValidAboFilterLov[] = [
        {
          intendedUse: ['RG-Default', 'EM-Emergency'],
          unitScheme: ['ISBT128'],
          transfusionStatus: ['Transfusable']
        },
        {
          intendedUse: ['AO-Autologous'],
          unitScheme: ['Codabar'],
          transfusionStatus: ['HOLD']
        }
      ];
      const multipleResponse: ReturnResult<ValidAboFilterLov> = {
        Success: true,
        Data: multipleData
      };
      mockService.getValidAboFilters.and.returnValue(of(multipleResponse));

      fixture.detectChanges();

      expect(component.intendedUseOptions).toEqual(['RG-Default', 'EM-Emergency']);
      // unitScheme and transfusionStatus are FE enums — not affected by API response
      expect(component.unitSchemeOptions.length).toBe(2);
      expect(component.transfusionStatusOptions.length).toBe(5);
    });

    it('should handle date formatting edge cases', () => {
      fixture.detectChanges();  // Initialize component first
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: 'After',
        terminationDate: nextWeek
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        effectiveDateFrom: formatLocalDate(tomorrow),
        terminationDateFrom: formatLocalDate(nextWeek)
      }));
    });
  });
});
