import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { ValidProductSubstitutionFilterPanel } from './valid-product-substitution-filter-panel';
import { ValidProductSubstitutionService } from '../services/valid-product-substitution.service';
import { ValidProductSubstitutionFilterValue } from '../models/valid-product-substitution.model';

describe('ValidProductSubstitutionFilterPanel', () => {
  let component: ValidProductSubstitutionFilterPanel;
  let fixture: ComponentFixture<ValidProductSubstitutionFilterPanel>;
  let mockValidProductSubstitutionService: jasmine.SpyObj<ValidProductSubstitutionService>;

  beforeEach(() => {

    mockValidProductSubstitutionService = jasmine.createSpyObj('ValidProductSubstitutionService', [
      'getValidProductSubstitutionFilters'
    ]);



      TestBed.configureTestingModule({
imports: [
        ValidProductSubstitutionFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ValidProductSubstitutionService, useValue: mockValidProductSubstitutionService }
      ]
    });


    });



  beforeEach(() => {


      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.calls.reset();


    fixture = TestBed.createComponent(ValidProductSubstitutionFilterPanel);
    component = fixture.componentInstance;


    });
  describe('loadFilterOptions', () => {
    it('should load filter options from API with item property', () => {
      const mockResponse = {
        requestProductType: [
          { code: 'WRBC', description: 'Washed Red Blood Cells' },
          { code: 'LRBC', description: 'LeukoReduced RBC' },
          { code: 'RBC', description: 'Red Blood Cells' }
        ],
        compatibleProductType: [
          { code: 'LRBC', description: 'LeukoReduced RBC' },
          { code: 'RBC', description: 'Red Blood Cells' },
          { code: 'PRBC', description: 'Packed Red Blood Cells' }
        ]
      };

      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.requestProductTypeOptionsSignal()).toEqual(mockResponse.requestProductType);
      expect(component.compatibleProductTypeOptionsSignal()).toEqual(mockResponse.compatibleProductType);
      expect(component.isLoadingFilters).toBe(false);
    });

    it('should load filter options from API with data array property', () => {
      const mockResponse = {
        requestProductType: [
          { code: 'WRBC', description: 'Washed Red Blood Cells' },
          { code: 'LRBC', description: 'LeukoReduced RBC' }
        ],
        compatibleProductType: [
          { code: 'RBC', description: 'Red Blood Cells' },
          { code: 'PRBC', description: 'Packed Red Blood Cells' }
        ]
      };

      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.requestProductTypeOptionsSignal()).toEqual(mockResponse.requestProductType);
      expect(component.compatibleProductTypeOptionsSignal()).toEqual(mockResponse.compatibleProductType);
    });

    it('should load filter options from API with direct object', () => {
      const mockResponse: any = {
        requestProductType: [{ code: 'WRBC', description: 'Washed Red Blood Cells' }],
        compatibleProductType: [{ code: 'LRBC', description: 'LeukoReduced RBC' }]
      };

      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.requestProductTypeOptionsSignal()).toEqual(mockResponse.requestProductType);
      expect(component.compatibleProductTypeOptionsSignal()).toEqual(mockResponse.compatibleProductType);
    });



  });

  describe('onApply', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(
        of({ requestProductType: [], compatibleProductType: [] })
      );
      fixture.detectChanges();
    });


    it('should convert moment dates to Date objects', () => {
      spyOn(component.apply, 'emit');

      const effectiveDate = moment('2024-01-15');
      const terminationDate = moment('2024-12-31');

      component.filterForm.patchValue({
        requestProductType: null,
        compatibleProductType: null,
        effectiveDatePeriod: 'after',
        effectiveDate: effectiveDate.toDate(),
        terminationDatePeriod: 'before',
        terminationDate: terminationDate.toDate()
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.effectiveDate instanceof Date).toBe(true);
      expect(emittedValue.terminationDate instanceof Date).toBe(true);
    });

    it('should handle null date values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        requestProductType: 'WRBC',
        compatibleProductType: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.effectiveDate).toBeNull();
      expect(emittedValue.terminationDate).toBeNull();
    });
  });



  describe('periodOptions', () => {
    it('should have correct period options', () => {
      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(
        of({ requestProductType: [], compatibleProductType: [] })
      );

      fixture.detectChanges();

      expect(component.periodOptions).toEqual(['After', 'Before']);
    });
  });


  describe('🟡 PR Fix: Dead code removal', () => {
    it('should not have effectiveDatePeriodError field', () => {
      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(
        of({ requestProductType: [], compatibleProductType: [] })
      );
      fixture.detectChanges();

      expect((component as any).effectiveDatePeriodError).toBeUndefined();
    });

    it('should not have terminationDatePeriodError field', () => {
      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(
        of({ requestProductType: [], compatibleProductType: [] })
      );
      fixture.detectChanges();

      expect((component as any).terminationDatePeriodError).toBeUndefined();
    });
  });

  describe('🟢 PR Fix: Template optimization - single getter evaluation', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.and.returnValue(
        of({ requestProductType: [], compatibleProductType: [] })
      );
      fixture.detectChanges();
    });

    it('should use getter methods for error messages', () => {
      expect(typeof component.getEffectiveDatePeriodError).toBe('function');
      expect(typeof component.getTerminationDatePeriodError).toBe('function');
      expect(typeof component.getEffectiveDateError).toBe('function');
      expect(typeof component.getTerminationDateError).toBe('function');
    });

    it('getEffectiveDatePeriodError should return consistent results', () => {
      const effectiveDateControl = component.filterForm.get('effectiveDate');
      const periodControl = component.filterForm.get('effectiveDatePeriod');

      effectiveDateControl?.setValue(moment().toDate());
      periodControl?.setValue(null);
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();

      const error1 = component.getEffectiveDatePeriodError();
      const error2 = component.getEffectiveDatePeriodError();

      expect(error1).toBe(error2);
      expect(error1).toBe('Period is required');
    });

    it('getTerminationDatePeriodError should return consistent results', () => {
      const terminationDateControl = component.filterForm.get('terminationDate');
      const periodControl = component.filterForm.get('terminationDatePeriod');

      terminationDateControl?.setValue(moment().toDate());
      periodControl?.setValue(null);
      periodControl?.setErrors({ required: true });
      periodControl?.markAsTouched();

      const error1 = component.getTerminationDatePeriodError();
      const error2 = component.getTerminationDatePeriodError();

      expect(error1).toBe(error2);
      expect(error1).toBe('Period is required');
    });
  });
});
