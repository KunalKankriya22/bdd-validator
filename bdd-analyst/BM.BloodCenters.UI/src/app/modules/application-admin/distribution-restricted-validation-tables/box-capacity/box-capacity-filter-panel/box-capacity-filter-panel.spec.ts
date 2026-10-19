import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { BoxCapacityFilterPanel } from './box-capacity-filter-panel';
import { BoxCapacityService } from '../services/box-capacity.service';
import { BoxCapacityFilterValue } from '../models/box-capacity.model';

describe('BoxCapacityFilterPanel', () => {
  let component: BoxCapacityFilterPanel;
  let fixture: ComponentFixture<BoxCapacityFilterPanel>;
  let mockService: jasmine.SpyObj<BoxCapacityService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('BoxCapacityService', ['getBoxCapacityFilters']);
    mockService.getBoxCapacityFilters.and.returnValue(of({
      item: {
        boxTypes: ['26', '33', '50'],
        inventoryProdTypes: ['CRYO', 'FFP', 'PLASMA']
      }
    }));



      TestBed.configureTestingModule({
      imports: [
        BoxCapacityFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BoxCapacityService, useValue: mockService }
      ]
    });


    


      mockService.getBoxCapacityFilters.calls.reset();


    fixture = TestBed.createComponent(BoxCapacityFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });






  it('should handle filter options loading error', () => {
    mockService.getBoxCapacityFilters.and.returnValue(throwError(() => new Error('API Error')));

    component.ngOnInit();

    expect(component.boxTypeOptions).toEqual([]);
    expect(component.inventoryProductTypeOptions).toEqual([]);
    expect(component.isLoadingFilters).toBe(false);
  });





  it('should clear form on onClear', () => {
    component.filterForm.patchValue({
      boxType: '26',
      inventoryProductType: 'CRYO',
      capacityRange: 'Over',
      capacity: 20,
      effectiveDatePeriod: 'After',
      terminationDatePeriod: 'Before'
    });

    component.onClear();

    expect(component.filterForm.value.boxType).toBeNull();
    expect(component.filterForm.value.inventoryProductType).toBeNull();
    expect(component.filterForm.value.capacityRange).toBeNull();
    expect(component.filterForm.value.capacity).toBeNull();
    expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
    expect(component.filterForm.value.terminationDatePeriod).toBeNull();
  });

  describe('Capacity Range Validation', () => {
    it('should set error on capacityRange when capacity value is entered without range', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        capacity: 20,
        capacityRange: null
      });

      const capacityRangeControl = component.filterForm.get('capacityRange');
      expect(capacityRangeControl?.errors).toBeTruthy();
      expect(capacityRangeControl?.hasError('required')).toBe(true);
    });

    it('should clear error on capacityRange when range is selected', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        capacity: 20,
        capacityRange: null
      });

      // Error should be set
      let capacityRangeControl = component.filterForm.get('capacityRange');
      expect(capacityRangeControl?.errors).toBeTruthy();

      // Now select a range
      component.filterForm.patchValue({
        capacityRange: 'Over'
      });

      capacityRangeControl = component.filterForm.get('capacityRange');
      expect(capacityRangeControl?.errors).toBeNull();
    });

    it('should clear error on capacityRange when capacity is cleared', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        capacity: 20,
        capacityRange: null
      });

      // Error should be set
      let capacityRangeControl = component.filterForm.get('capacityRange');
      expect(capacityRangeControl?.errors).toBeTruthy();

      // Now clear capacity
      component.filterForm.patchValue({
        capacity: null
      });

      capacityRangeControl = component.filterForm.get('capacityRange');
      expect(capacityRangeControl?.errors).toBeNull();
    });




  });

  describe('Effective Date Period Validation', () => {
    it('should set error on effectiveDatePeriod when effectiveDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: null
      });

      const effectiveDatePeriodControl = component.filterForm.get('effectiveDatePeriod');
      expect(effectiveDatePeriodControl?.errors).toBeTruthy();
      expect(effectiveDatePeriodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on effectiveDatePeriod when period is selected', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
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
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
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
    it('should set error on terminationDatePeriod when terminationDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });

      const terminationDatePeriodControl = component.filterForm.get('terminationDatePeriod');
      expect(terminationDatePeriodControl?.errors).toBeTruthy();
      expect(terminationDatePeriodControl?.hasError('required')).toBe(true);
    });

    it('should clear error on terminationDatePeriod when period is selected', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
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
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
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
  describe('Form initialization with current filters', () => {
    it('should initialize with null when no current filters provided', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.value.boxType).toBeNull();
      expect(component.filterForm.value.inventoryProductType).toBeNull();
      expect(component.filterForm.value.capacityRange).toBeNull();
      expect(component.filterForm.value.capacity).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
    });

    it('should initialize with null period types when no current filters', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
      expect(component.filterForm.value.terminationDatePeriod).toBeNull();
    });

    it('should preserve all filter values on init', () => {
      const effectiveDate = new Date('2024-01-01');
      const terminationDate = new Date('2024-12-31');

      component.currentFilters = {
        boxType: '26',
        inventoryProductType: 'CRYO',
        capacityRange: 'Over',
        capacity: 20,
        effectiveDatePeriod: 'Before',
        effectiveDate: effectiveDate,
        terminationDatePeriod: 'After',
        terminationDate: terminationDate
      };

      component.ngOnInit();

      expect(component.filterForm.value.boxType).toBe('26');
      expect(component.filterForm.value.inventoryProductType).toBe('CRYO');
      expect(component.filterForm.value.capacityRange).toBe('Over');
      expect(component.filterForm.value.capacity).toBe(20);
      expect(component.filterForm.value.effectiveDatePeriod).toBe('Before');
      expect(component.filterForm.value.terminationDatePeriod).toBe('After');
    });
  });

  describe('Clear validation errors on clear', () => {
    it('should clear all validation errors when onClear is called', () => {
      component.ngOnInit();

      // Set up some validation errors
      component.filterForm.patchValue({
        capacity: 20,
        capacityRange: null,
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: null,
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });

      // Verify errors are set
      expect(component.filterForm.get('capacityRange')?.errors).toBeTruthy();
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeTruthy();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeTruthy();

      // Clear the form
      component.onClear();

      // All errors should be cleared
      expect(component.filterForm.get('capacityRange')?.errors).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });
  describe('Capacity Input Validation', () => {








    it('should set value to null when input is cleared', () => {
      const inputEl = { value: '', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;

      component.onCapacityInput(event);

      expect(component.filterForm.get('capacity')?.value).toBeNull();
    });


  });

  describe('getCapacityError', () => {
    it('should return overflow message when showCapacityOverflowError is true', () => {
      component.showCapacityOverflowError = true;
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });

    it('should return min error message for negative capacity', () => {
      component.filterForm.get('capacity')?.setValue(-1);
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });

    it('should return max error message for capacity over 9999', () => {
      component.filterForm.get('capacity')?.setValue(10000);
      expect(component.getCapacityError()).toBe('Value must be between 0 and 9999.');
    });




  });

  describe('isApplyDisabled with capacity errors', () => {


    it('should not be disabled when capacity is valid', () => {
      component.filterForm.patchValue({
        boxType: '26',
        capacity: 100,
        capacityRange: 'Over'
      });

      expect(component.isApplyDisabled).toBe(false);
    });


  });

  describe('onClear with capacity overflow', () => {
    it('should clear showCapacityOverflowError on clear', () => {
      component.showCapacityOverflowError = true;
      component.onClear();
      expect(component.showCapacityOverflowError).toBe(false);
    });

    it('should clear capacity errors on clear', () => {
      component.filterForm.get('capacity')?.setValue(-1);
      expect(component.filterForm.get('capacity')?.errors).toBeTruthy();

      component.onClear();

      expect(component.filterForm.get('capacity')?.errors).toBeNull();
    });
  });
});
