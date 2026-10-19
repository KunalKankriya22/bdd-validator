import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CheckInBatchFilterPanel } from './check-in-batch-filter-panel';
import { CheckInBatchFilterValue } from '../models/modify-check-in-batch.model';
import moment from 'moment';

describe('CheckInBatchFilterPanel', () => {
  let component: CheckInBatchFilterPanel;
  let fixture: ComponentFixture<CheckInBatchFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CheckInBatchFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckInBatchFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null default values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('checkinUserId')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('shippedDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('shippedDate')?.value).toBeNull();
      expect(component.filterForm.get('receivedDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('receivedDate')?.value).toBeNull();
      expect(component.filterForm.get('qcDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('qcDate')?.value).toBeNull();
      expect(component.filterForm.get('batchDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('batchDate')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      const filters: CheckInBatchFilterValue = {
        checkinUserId: 'USER1',
        productType: 'RBC'
      };
      component.currentFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('checkinUserId')?.value).toBe('USER1');
      expect(component.filterForm.get('productType')?.value).toBe('RBC');
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply when form has valid data', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ checkinUserId: 'USER1' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ checkinUserId: 'USER1' })
      );
    });

    it('should not emit when apply is disabled (no filters set)', () => {
      spyOn(component.apply, 'emit');

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should include date filters only when both date and period are set', () => {
      spyOn(component.apply, 'emit');

      const testDate = moment('2025-01-15');
      component.filterForm.patchValue({
        shippedDate: testDate,
        shippedDatePeriod: 'After'
      });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          shippedDatePeriod: 'After'
        })
      );
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        checkinUserId: 'USER1',
        productType: 'RBC',
        shippedDatePeriod: 'After'
      });

      component.onClearAll();

      expect(component.filterForm.get('checkinUserId')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('shippedDatePeriod')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when no filters are set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when checkinUserId is set', () => {
      component.filterForm.patchValue({ checkinUserId: 'USER1' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when date is set without period', () => {
      component.filterForm.patchValue({
        shippedDate: moment(),
        shippedDatePeriod: null
      });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when period is set without date', () => {
      component.filterForm.patchValue({
        shippedDate: null,
        shippedDatePeriod: 'After'
      });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Product Type Search', () => {
    beforeEach(() => {
      component.productTypeOptions = [
        { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { productType: 'PLT', productTypeDesc: 'Platelets' }
      ] as any;
      fixture.detectChanges();
    });

    it('should filter product type options by search term', () => {
      component.productTypeFilterCtrl.setValue('RBC');

      expect(component.filteredProductTypeOptions.length).toBe(1);
      expect(component.filteredProductTypeOptions[0].productType).toBe('RBC');
    });

    it('should show all options when search is cleared', () => {
      component.productTypeFilterCtrl.setValue('');

      expect(component.filteredProductTypeOptions.length).toBe(2);
    });
  });

  describe('Date Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return shipped date invalid error', () => {
      const control = component.filterForm.get('shippedDate');
      control?.setErrors({ invalidDate: true });

      expect(component.getShippedDateError()).toBe('Shipped Date is invalid');
    });

    it('should return period required error for shipped date', () => {
      const control = component.filterForm.get('shippedDatePeriod');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getShippedDatePeriodError()).toBe('Period is required');
    });

    it('should return empty string when no errors', () => {
      expect(component.getShippedDateError()).toBe('');
      expect(component.getShippedDatePeriodError()).toBe('');
    });
  });
});
