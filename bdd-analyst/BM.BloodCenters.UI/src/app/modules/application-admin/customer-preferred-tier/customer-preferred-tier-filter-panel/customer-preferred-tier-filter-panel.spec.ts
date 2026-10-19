import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomerPreferredTierFilterPanelComponent } from './customer-preferred-tier-filter-panel';
import {
  CustomerPreferredTierFilterValue,
  ProductTypeDropdownDto
} from '../models/customer-preferred-tier.model';
import moment from 'moment';

describe('CustomerPreferredTierFilterPanelComponent', () => {
  let component: CustomerPreferredTierFilterPanelComponent;
  let fixture: ComponentFixture<CustomerPreferredTierFilterPanelComponent>;

  const mockProductTypes: ProductTypeDropdownDto[] = [
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productType: 'PLT', productTypeDesc: 'Platelets' }
  ] as ProductTypeDropdownDto[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CustomerPreferredTierFilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerPreferredTierFilterPanelComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDateFilter')?.value).toBeNull();
      expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('termDateFilter')?.value).toBeNull();
    });

    it('should populate form from appliedFilters input', () => {
      const filters: CustomerPreferredTierFilterValue = {
        productType: 'RBC',
        effDatePeriod: 'After',
        effDateFilter: '2025-01-15T12:00:00.000Z',
        termDatePeriod: null,
        termDateFilter: null
      };
      component.appliedFilters = filters;
      fixture.detectChanges();

      expect(component.filterForm.get('productType')?.value).toBe('RBC');
      expect(component.filterForm.get('effDatePeriod')?.value).toBe('After');
    });

    it('should set product type options signal from input', () => {
      component.productTypeOptions = mockProductTypes;
      fixture.detectChanges();

      expect(component.filteredProductTypeOptions().length).toBe(2);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit null when no filters are selected', () => {
      spyOn(component.applyFilters, 'emit');

      component.onApply();

      expect(component.applyFilters.emit).toHaveBeenCalledWith(null);
    });

    it('should emit filter values when product type is selected', () => {
      spyOn(component.applyFilters, 'emit');

      component.filterForm.patchValue({ productType: 'RBC' });
      component.onApply();

      expect(component.applyFilters.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        productType: 'RBC'
      }));
    });

    it('should emit date filters when both date and period are set', () => {
      spyOn(component.applyFilters, 'emit');

      const testDate = moment('2025-06-15');
      component.filterForm.patchValue({
        effDatePeriod: 'After',
        effDateFilter: testDate
      });

      component.onApply();

      const emittedValue = (component.applyFilters.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedValue.effDatePeriod).toBe('After');
      expect(emittedValue.effDateFilter).toBeTruthy();
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        productType: 'RBC',
        effDatePeriod: 'After',
        effDateFilter: moment()
      });

      component.onClear();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effDateFilter')?.value).toBeNull();
    });

    it('should emit null when clearing', () => {
      spyOn(component.applyFilters, 'emit');

      component.onClear();

      expect(component.applyFilters.emit).toHaveBeenCalledWith(null);
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');

      component.onClose();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Date Error Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for hasEffDateError when date set without period', () => {
      component.filterForm.patchValue({
        effDateFilter: moment(),
        effDatePeriod: null
      });

      expect(component.hasEffDateError()).toBeTrue();
    });

    it('should return true for hasEffDateError when period set without date', () => {
      component.filterForm.patchValue({
        effDateFilter: null,
        effDatePeriod: 'After'
      });

      expect(component.hasEffDateError()).toBeTrue();
    });

    it('should return false for hasEffDateError when both set', () => {
      component.filterForm.patchValue({
        effDateFilter: moment(),
        effDatePeriod: 'After'
      });

      expect(component.hasEffDateError()).toBeFalse();
    });

    it('should return period required error message', () => {
      component.filterForm.patchValue({
        effDateFilter: moment(),
        effDatePeriod: null
      });

      expect(component.getEffDateError()).toBe('Period is required');
    });

    it('should return date required error message for term date', () => {
      component.filterForm.patchValue({
        termDateFilter: null,
        termDatePeriod: 'Before'
      });

      expect(component.getTermDateError()).toBe('Termination Date is required');
    });
  });

  describe('hasFiltersSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no filters selected', () => {
      expect(component.hasFiltersSelected()).toBeFalse();
    });

    it('should return true when product type is selected and form is valid', () => {
      component.filterForm.patchValue({ productType: 'RBC' });

      expect(component.hasFiltersSelected()).toBeTrue();
    });
  });
});
