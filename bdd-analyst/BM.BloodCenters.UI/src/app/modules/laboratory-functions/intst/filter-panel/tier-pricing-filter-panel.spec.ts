import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TierPricingFilterPanel } from './tier-pricing-filter-panel';
import { TierPricingFilterValue, CustomerFilterOption, ProductTypeFilterOption } from '../models/customer-product-tier-pricing.model';

describe('TierPricingFilterPanel', () => {
  let component: TierPricingFilterPanel;
  let fixture: ComponentFixture<TierPricingFilterPanel>;

  const mockCustomerOptions: CustomerFilterOption[] = [
    { id: 'CUST1', name: 'Test Hospital' },
    { id: 'CUST2', name: 'Memorial Clinic' },
    { id: 'CUST3', name: 'Regional Center' },
  ];

  const mockProductTypeOptions: ProductTypeFilterOption[] = [
    { code: 'RBC', desc: 'Red Blood Cells' },
    { code: 'PLT', desc: 'Platelets' },
    { code: 'FFP', desc: null },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TierPricingFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TierPricingFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
    });

    it('should populate form from currentFilters input', () => {
      component.currentFilters = { customerId: 'CUST1', productType: 'RBC' };
      fixture.detectChanges();
      expect(component.filterForm.get('customerId')?.value).toBe('CUST1');
      expect(component.filterForm.get('productType')?.value).toBe('RBC');
    });

    it('should set customer and product type options signals from input', () => {
      component.customerOptions = mockCustomerOptions;
      component.productTypeOptions = mockProductTypeOptions;
      fixture.detectChanges();
      expect(component.filteredCustomerOptions().length).toBe(3);
      expect(component.filteredProductTypeOptions().length).toBe(3);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should emit filter values on apply', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ customerId: 'CUST1' });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith({ customerId: 'CUST1', productType: null });
    });

    it('should emit null values for empty selections', () => {
      spyOn(component.apply, 'emit');
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalledWith({ customerId: null, productType: null });
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({ customerId: 'CUST1', productType: 'RBC' });
      component.onClear();
      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onClose();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('hasActiveFilters', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return false when no filters set', () => {
      expect(component.hasActiveFilters).toBeFalse();
    });

    it('should return true when customerId is set', () => {
      component.filterForm.patchValue({ customerId: 'CUST1' });
      expect(component.hasActiveFilters).toBeTrue();
    });

    it('should return true when productType is set', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      expect(component.hasActiveFilters).toBeTrue();
    });

    it('should return false when form is null/undefined', () => {
      (component as any).filterForm = undefined;
      expect(component.hasActiveFilters).toBeFalse();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.customerOptions = mockCustomerOptions;
      component.productTypeOptions = mockProductTypeOptions;
      fixture.detectChanges();
    });

    it('should filter customer options by ID search term', fakeAsync(() => {
      component.customerIdSearchCtrl.setValue('CUST1');
      tick();
      expect(component.filteredCustomerOptions().length).toBe(1);
      expect(component.filteredCustomerOptions()[0].id).toBe('CUST1');
    }));

    it('should filter customer options by name search term', fakeAsync(() => {
      component.customerIdSearchCtrl.setValue('memorial');
      tick();
      expect(component.filteredCustomerOptions().length).toBe(1);
      expect(component.filteredCustomerOptions()[0].id).toBe('CUST2');
    }));

    it('should filter product types by code search term', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('RBC');
      tick();
      expect(component.filteredProductTypeOptions().length).toBe(1);
      expect(component.filteredProductTypeOptions()[0].code).toBe('RBC');
    }));

    it('should filter product types by description', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('platelets');
      tick();
      expect(component.filteredProductTypeOptions().length).toBe(1);
      expect(component.filteredProductTypeOptions()[0].code).toBe('PLT');
    }));

    it('should show all options when search is empty', fakeAsync(() => {
      component.customerIdSearchCtrl.setValue('');
      tick();
      expect(component.filteredCustomerOptions().length).toBe(3);
    }));

    it('should show all product type options when search is empty', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('');
      tick();
      expect(component.filteredProductTypeOptions().length).toBe(3);
    }));

    it('should be case insensitive for customer search', fakeAsync(() => {
      component.customerIdSearchCtrl.setValue('cust');
      tick();
      expect(component.filteredCustomerOptions().length).toBe(3);
    }));

    it('should handle product type with null desc when filtering', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('FFP');
      tick();
      expect(component.filteredProductTypeOptions().length).toBe(1);
      expect(component.filteredProductTypeOptions()[0].code).toBe('FFP');
    }));
  });

  describe('Display Getters', () => {
    beforeEach(() => {
      component.customerOptions = mockCustomerOptions;
      component.productTypeOptions = mockProductTypeOptions;
      fixture.detectChanges();
    });

    it('should return empty string when no customer selected', () => {
      expect(component.selectedCustomerIdDisplay).toBe('');
    });

    it('should return id and name when customer option is found', () => {
      component.filterForm.patchValue({ customerId: 'CUST1' });
      expect(component.selectedCustomerIdDisplay).toBe('CUST1 - Test Hospital');
    });

    it('should return just the id when customer option is not found', () => {
      component.filterForm.patchValue({ customerId: 'UNKNOWN' });
      expect(component.selectedCustomerIdDisplay).toBe('UNKNOWN');
    });

    it('should return empty string when no product type selected', () => {
      expect(component.selectedProductTypeDisplay).toBe('');
    });

    it('should return code and description when product type option with desc is found', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      expect(component.selectedProductTypeDisplay).toBe('RBC - Red Blood Cells');
    });

    it('should return just code when product type has no desc', () => {
      component.filterForm.patchValue({ productType: 'FFP' });
      expect(component.selectedProductTypeDisplay).toBe('FFP');
    });

    it('should return just code when product type option not found', () => {
      component.filterForm.patchValue({ productType: 'UNKNOWN' });
      expect(component.selectedProductTypeDisplay).toBe('UNKNOWN');
    });
  });

  describe('onSelectOpenedChange', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear search control when select is closed', () => {
      component.customerIdSearchCtrl.setValue('CUST');
      component.onSelectOpenedChange(component.customerIdSearchCtrl, false);
      expect(component.customerIdSearchCtrl.value).toBe('');
    });

    it('should not clear search control when select is opened', () => {
      component.customerIdSearchCtrl.setValue('CUST');
      component.onSelectOpenedChange(component.customerIdSearchCtrl, true);
      expect(component.customerIdSearchCtrl.value).toBe('CUST');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
