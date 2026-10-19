import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RegistrationHoldsFilterPanel } from './registration-holds-filter-panel';
import { RegistrationHoldsMappingFilterValue } from '../models/registration-holds-mapping.model';

describe('RegistrationHoldsFilterPanel', () => {
  let component: RegistrationHoldsFilterPanel;
  let fixture: ComponentFixture<RegistrationHoldsFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        RegistrationHoldsFilterPanel,
        ReactiveFormsModule,
        FormsModule,
        HttpClientTestingModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(RegistrationHoldsFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Form Initialization', () => {

    it('should have period options defined with only After and Before', () => {
      expect(component.periodOptions).toBeDefined();
      expect(component.periodOptions.length).toBe(2);
      expect(component.periodOptions.map(p => p.value)).toEqual(['After', 'Before']);
    });
  });

  describe('Apply Filters', () => {
    it('should emit filter values when apply is called', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeTruthy();
        expect(filters.effectiveDatePeriod).toBe('After');
        expect(filters.terminationDate).toBeNull();
        expect(filters.terminationDatePeriod).toBeNull();
        done();
      });

      component.onApply();
    });

    it('should emit both date filters when both are filled', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeTruthy();
        expect(filters.effectiveDatePeriod).toBe('After');
        expect(filters.terminationDate).toBeTruthy();
        expect(filters.terminationDatePeriod).toBe('Before');
        done();
      });

      component.onApply();
    });

    it('should emit filter values with only effective date', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-01-15')
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeTruthy();
        expect(filters.effectiveDatePeriod).toBe('Before');
        done();
      });

      component.onApply();
    });


    it('should emit close event when close is called', (done) => {
      component.close.subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      component.onClose();
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filter values', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    });

  });

  describe('Form Validation', () => {
    it('should allow effective date to be optional', () => {
      component.filterForm.get('effectiveDate')?.setValue(null);
      expect(component.filterForm.get('effectiveDate')?.valid).toBe(true);
    });

    it('should allow termination date to be optional', () => {
      component.filterForm.get('terminationDate')?.setValue(null);
      expect(component.filterForm.get('terminationDate')?.valid).toBe(true);
    });

    it('should accept valid After operator value', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.filterForm.get('effectiveDatePeriod')?.valid).toBe(true);
    });

    it('should accept valid Before operator value', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.filterForm.get('terminationDatePeriod')?.valid).toBe(true);
    });

    it('should require period when date is selected', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-01-15'));
      component.filterForm.get('effectiveDatePeriod')?.setValue(null);
      component.filterForm.get('effectiveDatePeriod')?.markAsTouched();

      // The component uses custom validation - check the error message
      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');
    });
  });

  describe('Period Options', () => {
    it('should have After option available', () => {
      expect(component.periodOptions.find(p => p.value === 'After')).toBeDefined();
    });

    it('should have Before option available', () => {
      expect(component.periodOptions.find(p => p.value === 'Before')).toBeDefined();
    });

    it('should not have On option available', () => {
      expect(component.periodOptions.find(p => p.value === 'On')).toBeUndefined();
    });

    it('should change effective date period', () => {
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
    });

    it('should change termination date period', () => {
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });
  });

  describe('Input property handling', () => {
    it('should populate form with current filter values', () => {
      const currentFilters: RegistrationHoldsMappingFilterValue = {
        effectiveDate: '2024-01-15',
        effectiveDatePeriod: 'Before',
        terminationDate: '2024-12-31',
        terminationDatePeriod: 'After'
      };

      component.currentFilters = currentFilters;
      component.ngOnInit();

      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('Before');
      expect(component.filterForm.get('terminationDate')?.value).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('After');
    });


    it('should handle partial current filters', () => {
      const partialFilters: RegistrationHoldsMappingFilterValue = {
        effectiveDate: '2024-01-15',
        effectiveDatePeriod: 'After',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.currentFilters = partialFilters;
      component.ngOnInit();

      expect(component.filterForm.get('effectiveDate')?.value).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('Filter Combinations', () => {
    it('should apply filter with only effective date and period', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: null,
        terminationDate: null
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeTruthy();
        expect(filters.effectiveDatePeriod).toBe('After');
        expect(filters.terminationDate).toBeNull();
        done();
      });

      component.onApply();
    });

    it('should apply filter with only termination date and period', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeNull();
        expect(filters.terminationDate).toBeTruthy();
        expect(filters.terminationDatePeriod).toBe('Before');
        done();
      });

      component.onApply();
    });

    it('should apply filter with both dates', (done) => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-15'),
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      });

      component.apply.subscribe((filters: RegistrationHoldsMappingFilterValue) => {
        expect(filters.effectiveDate).toBeTruthy();
        expect(filters.effectiveDatePeriod).toBe('After');
        expect(filters.terminationDate).toBeTruthy();
        expect(filters.terminationDatePeriod).toBe('Before');
        done();
      });

      component.onApply();
    });
  });

  describe('Error Helpers', () => {
    it('should return error message when period is required', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date('2024-01-15'));
      component.filterForm.get('effectiveDatePeriod')?.markAsTouched();
      component.filterForm.get('effectiveDatePeriod')?.updateValueAndValidity();

      expect(component.getEffectiveDatePeriodError()).toBe('Period is required');
    });

  });
});
