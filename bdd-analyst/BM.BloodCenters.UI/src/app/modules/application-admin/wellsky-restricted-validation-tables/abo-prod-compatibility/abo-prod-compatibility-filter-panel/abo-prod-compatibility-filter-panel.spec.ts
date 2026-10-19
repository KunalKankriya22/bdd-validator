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

import { ABOProdCompatibilityFilterPanel } from './abo-prod-compatibility-filter-panel';
import { ABOProdCompatibilityService } from '../services/abo-prod-compatibility.service';
import { ABOProdCompatibilityFilterValue } from '../models/abo-prod-compatibility.model';

describe('ABOProdCompatibilityFilterPanel', () => {
  let component: ABOProdCompatibilityFilterPanel;
  let fixture: ComponentFixture<ABOProdCompatibilityFilterPanel>;
  let mockService: jasmine.SpyObj<ABOProdCompatibilityService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ABOProdCompatibilityService', [
      'getABOProdCompatibilityFilters'
    ]);



      TestBed.configureTestingModule({
imports: [
        ABOProdCompatibilityFilterPanel,
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
        { provide: ABOProdCompatibilityService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getABOProdCompatibilityFilters.calls.reset();


    fixture = TestBed.createComponent(ABOProdCompatibilityFilterPanel);
    component = fixture.componentInstance;


    });

  describe('ngOnInit', () => {

    it('should initialize form with current filter values from effectiveDateAfter', () => {
      const tomorrow = moment().add(1, 'day').toDate();
      const nextWeek = moment().add(7, 'days').toDate();

      const currentFilters: ABOProdCompatibilityFilterValue = {
        inventoryProductType: 'RBC',
        effectiveDateAfter: tomorrow.toISOString(),
        effectiveDateBefore: null,
        terminationDateAfter: null,
        terminationDateBefore: nextWeek.toISOString()
      };

      component.currentFilters = currentFilters;

      mockService.getABOProdCompatibilityFilters.and.returnValue(
        of([{ productType: 'RBC', description: 'Red Blood Cells' }])
      );

      fixture.detectChanges();

      expect(component.filterForm.get('productType')?.value).toBe('RBC');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });


  });

  describe('loadFilterOptions', () => {
    it('should load filter options from API', () => {
      const mockResponse = [
        { productType: 'RBC', description: 'Red Blood Cells' },
        { productType: 'PLASMA', description: 'Plasma' },
        { productType: 'PLT', description: 'Platelets' }
      ];

      mockService.getABOProdCompatibilityFilters.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual(mockResponse);
      expect(component.isLoadingFilters).toBe(false);
    });

    it('should handle empty filter options', () => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.productTypeOptionsSignal()).toEqual([]);
    });

  });

  describe('onApply', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should emit apply event with form values for after period', () => {
      spyOn(component.apply, 'emit');

      const tomorrow = moment().add(1, 'day').toDate();

      component.filterForm.patchValue({
        productType: 'RBC',
        effectiveDatePeriod: 'After',
        effectiveDate: tomorrow,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalled();
      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.inventoryProductType).toBe('RBC');
      expect(emittedValue.effectiveDateAfter).toBeTruthy();
      expect(emittedValue.effectiveDateBefore).toBeNull();
    });

    it('should emit apply event with form values for before period', () => {
      spyOn(component.apply, 'emit');

      const yesterday = moment().subtract(1, 'day').toDate();

      component.filterForm.patchValue({
        productType: 'PLASMA',
        effectiveDatePeriod: 'Before',
        effectiveDate: yesterday,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.inventoryProductType).toBe('PLASMA');
      expect(emittedValue.effectiveDateAfter).toBeNull();
      expect(emittedValue.effectiveDateBefore).toBeTruthy();
    });

    it('should handle null date values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        productType: 'RBC',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];

      expect(emittedValue.effectiveDateAfter).toBeNull();
      expect(emittedValue.effectiveDateBefore).toBeNull();
      expect(emittedValue.terminationDateAfter).toBeNull();
      expect(emittedValue.terminationDateBefore).toBeNull();
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();
    });


    it('should clear all validation errors when onClear is called', () => {
      const tomorrow = moment().add(1, 'day').toDate();

      // Set up some validation errors
      component.filterForm.patchValue({
        effectiveDate: tomorrow,
        effectiveDatePeriod: null,
        terminationDate: tomorrow,
        terminationDatePeriod: null
      });

      // Verify errors are set
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeTruthy();

      // Clear the form
      component.onClear();

      // All errors should be cleared
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });


  describe('Effective Date Period Validation', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should set error on effectiveDatePeriod when effectiveDate is selected without period', () => {
      const tomorrow = moment().add(1, 'day').toDate();

      component.filterForm.patchValue({
        effectiveDate: tomorrow,
        effectiveDatePeriod: null
      });

      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeTruthy();
      expect(effectiveDatePeriodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on effectiveDatePeriod when period is selected', () => {
      const tomorrow = moment().add(1, 'day').toDate();

      component.filterForm.patchValue({
        effectiveDate: tomorrow,
        effectiveDatePeriod: null
      });

      // Error should be set
      let effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeTruthy();

      // Now select a period
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After'
      });

      effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeNull();
    });

    it('should clear error on effectiveDatePeriod when effectiveDate is cleared', () => {
      const tomorrow = moment().add(1, 'day').toDate();

      component.filterForm.patchValue({
        effectiveDate: tomorrow,
        effectiveDatePeriod: null
      });

      // Error should be set
      let effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeTruthy();

      // Now clear the date
      component.filterForm.patchValue({
        effectiveDate: null
      });

      effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeNull();
    });

  });

  describe('Termination Date Period Validation', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should set error on terminationDatePeriod when terminationDate is selected without period', () => {
      const nextWeek = moment().add(7, 'days').toDate();

      component.filterForm.patchValue({
        terminationDate: nextWeek,
        terminationDatePeriod: null
      });

      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeTruthy();
      expect(terminationDatePeriodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on terminationDatePeriod when period is selected', () => {
      const nextWeek = moment().add(7, 'days').toDate();

      component.filterForm.patchValue({
        terminationDate: nextWeek,
        terminationDatePeriod: null
      });

      // Error should be set
      let terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeTruthy();

      // Now select a period
      component.filterForm.patchValue({
        terminationDatePeriod: 'Before'
      });

      terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeNull();
    });

    it('should clear error on terminationDatePeriod when terminationDate is cleared', () => {
      const nextWeek = moment().add(7, 'days').toDate();

      component.filterForm.patchValue({
        terminationDate: nextWeek,
        terminationDatePeriod: null
      });

      // Error should be set
      let terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeTruthy();

      // Now clear the date
      component.filterForm.patchValue({
        terminationDate: null
      });

      terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeNull();
    });

  });


  describe('🟡 PR Fix: Dead code removal', () => {
    it('should not have effectiveDatePeriodError field', () => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();

      expect((component as any).effectiveDatePeriodError).toBeUndefined();
    });

    it('should not have terminationDatePeriodError field', () => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();

      expect((component as any).terminationDatePeriodError).toBeUndefined();
    });
  });

  describe('🟢 PR Fix: Template optimization - single getter evaluation', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
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

      const error1 = component.getTerminationDatePeriodError();
      const error2 = component.getTerminationDatePeriodError();

      expect(error1).toBe(error2);
      expect(error1).toBe('Period is required');
    });
  });

  describe('hasFilterChanged - Apply button enablement', () => {
    beforeEach(() => {
      mockService.getABOProdCompatibilityFilters.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return false when no filters have changed', () => {
      expect(component.hasFilterChanged()).toBe(false);
    });

    it('should return true when productType changes', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      expect(component.hasFilterChanged()).toBe(true);
    });

    it('should return false when ONLY effectiveDatePeriod changes (without date)', () => {
      component.filterForm.patchValue({ effectiveDatePeriod: 'After' });
      expect(component.hasFilterChanged()).toBe(false);
    });

    it('should return true when effectiveDate changes', () => {
      const tomorrow = moment().add(1, 'day');
      component.filterForm.patchValue({ effectiveDate: tomorrow });
      expect(component.hasFilterChanged()).toBe(true);
    });

    it('should return true when effectiveDatePeriod changes WITH a date', () => {
      const tomorrow = moment().add(1, 'day');
      component.filterForm.patchValue({
        effectiveDate: tomorrow,
        effectiveDatePeriod: 'After'
      });
      expect(component.hasFilterChanged()).toBe(true);
    });

    it('should return false when ONLY terminationDatePeriod changes (without date)', () => {
      component.filterForm.patchValue({ terminationDatePeriod: 'Before' });
      expect(component.hasFilterChanged()).toBe(false);
    });

    it('should return true when terminationDate changes', () => {
      const nextWeek = moment().add(7, 'days');
      component.filterForm.patchValue({ terminationDate: nextWeek });
      expect(component.hasFilterChanged()).toBe(true);
    });

    it('should return true when terminationDatePeriod changes WITH a date', () => {
      const nextWeek = moment().add(7, 'days');
      component.filterForm.patchValue({
        terminationDate: nextWeek,
        terminationDatePeriod: 'Before'
      });
      expect(component.hasFilterChanged()).toBe(true);
    });






  });
});
