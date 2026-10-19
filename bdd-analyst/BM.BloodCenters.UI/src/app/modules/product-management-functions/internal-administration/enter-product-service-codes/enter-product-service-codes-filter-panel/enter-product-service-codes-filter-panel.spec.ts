import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EnterProductServiceCodesFilterPanel } from './enter-product-service-codes-filter-panel';
import {
  FilterValue,
  ProductCodeLOV,
  InventoryProductTypeLOV,
  ProductionProductTypeLOV,
  ServiceCodeLOV
} from '../models/enter-product-service-codes.model';

describe('EnterProductServiceCodesFilterPanel', () => {
  let component: EnterProductServiceCodesFilterPanel;
  let fixture: ComponentFixture<EnterProductServiceCodesFilterPanel>;

  const mockProductCodes: ProductCodeLOV[] = [
    { productCode: 'PC001', productDesc: 'Whole Blood' },
    { productCode: 'PC002', productDesc: 'Red Cells' },
    { productCode: 'PC003', productDesc: 'Platelets' }
  ];

  const mockInvProductTypes: InventoryProductTypeLOV[] = [
    { productType: 'INV01', productTypeDesc: 'Blood Products' },
    { productType: 'INV02', productTypeDesc: 'Plasma Products' },
    { productType: 'INV03', productTypeDesc: 'Tissue' }
  ];

  const mockProductionProductTypes: ProductionProductTypeLOV[] = [
    { productType: 'PROD01' },
    { productType: 'PROD02' },
    { productType: 'PROD03' }
  ];

  const mockServiceCodes: ServiceCodeLOV[] = [
    { serviceCode: 'SVC001' },
    { serviceCode: 'SVC002' },
    { serviceCode: 'SVC003' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EnterProductServiceCodesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(EnterProductServiceCodesFilterPanel);
    component = fixture.componentInstance;
  });

  // --- Form Initialization ---

  describe('Form Initialization', () => {
    it('should initialize filterForm with 4 controls defaulting to null', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('productCode')?.value).toBeNull();
      expect(component.filterForm.get('invProductType')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('serviceCode')?.value).toBeNull();
    });

    it('should populate form controls from currentFilters input', () => {
      component.currentFilters = {
        productCode: 'PC001',
        invProductType: 'INV01',
        productType: 'PROD01',
        serviceCode: 'SVC001'
      };

      fixture.detectChanges();

      expect(component.filterForm.get('productCode')?.value).toBe('PC001');
      expect(component.filterForm.get('invProductType')?.value).toBe('INV01');
      expect(component.filterForm.get('productType')?.value).toBe('PROD01');
      expect(component.filterForm.get('serviceCode')?.value).toBe('SVC001');
    });

    it('should handle null currentFilters gracefully', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('productCode')?.value).toBeNull();
      expect(component.filterForm.get('invProductType')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('serviceCode')?.value).toBeNull();
    });

    it('should have filterForm defined after ngOnInit', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('productCode')).toBeTruthy();
      expect(component.filterForm.get('invProductType')).toBeTruthy();
      expect(component.filterForm.get('productType')).toBeTruthy();
      expect(component.filterForm.get('serviceCode')).toBeTruthy();
    });
  });

  // --- Input Setters ---

  describe('Input Setters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should copy productCodeOptions to filteredProductCodeOptions', () => {
      component.productCodeOptions = mockProductCodes;

      expect(component.filteredProductCodeOptions).toEqual(mockProductCodes);
      expect(component.filteredProductCodeOptions).not.toBe(mockProductCodes);
    });

    it('should copy inventoryProductTypeOptions to filteredInvProductTypeOptions', () => {
      component.inventoryProductTypeOptions = mockInvProductTypes;

      expect(component.filteredInvProductTypeOptions).toEqual(mockInvProductTypes);
      expect(component.filteredInvProductTypeOptions).not.toBe(mockInvProductTypes);
    });

    it('should copy productionProductTypeOptions to filteredProductTypeOptions', () => {
      component.productionProductTypeOptions = mockProductionProductTypes;

      expect(component.filteredProductTypeOptions).toEqual(mockProductionProductTypes);
      expect(component.filteredProductTypeOptions).not.toBe(mockProductionProductTypes);
    });

    it('should copy serviceCodeOptions to filteredServiceCodeOptions', () => {
      component.serviceCodeOptions = mockServiceCodes;

      expect(component.filteredServiceCodeOptions).toEqual(mockServiceCodes);
      expect(component.filteredServiceCodeOptions).not.toBe(mockServiceCodes);
    });
  });

  // --- Search Subscriptions ---

  describe('Search Subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter productCodeOptions by code and description', () => {
      component.productCodeOptions = mockProductCodes;

      component.productCodeSearchCtrl.setValue('whole');
      expect(component.filteredProductCodeOptions).toEqual([
        { productCode: 'PC001', productDesc: 'Whole Blood' }
      ]);

      component.productCodeSearchCtrl.setValue('PC002');
      expect(component.filteredProductCodeOptions).toEqual([
        { productCode: 'PC002', productDesc: 'Red Cells' }
      ]);
    });

    it('should filter inventoryProductTypeOptions by type and description', () => {
      component.inventoryProductTypeOptions = mockInvProductTypes;

      component.invProductTypeSearchCtrl.setValue('plasma');
      expect(component.filteredInvProductTypeOptions).toEqual([
        { productType: 'INV02', productTypeDesc: 'Plasma Products' }
      ]);

      component.invProductTypeSearchCtrl.setValue('INV03');
      expect(component.filteredInvProductTypeOptions).toEqual([
        { productType: 'INV03', productTypeDesc: 'Tissue' }
      ]);
    });

    it('should filter productionProductTypeOptions by type', () => {
      component.productionProductTypeOptions = mockProductionProductTypes;

      component.productTypeSearchCtrl.setValue('PROD02');
      expect(component.filteredProductTypeOptions).toEqual([
        { productType: 'PROD02' }
      ]);

      component.productTypeSearchCtrl.setValue('PROD');
      expect(component.filteredProductTypeOptions.length).toBe(3);
    });

    it('should filter serviceCodeOptions by code', () => {
      component.serviceCodeOptions = mockServiceCodes;

      component.serviceCodeSearchCtrl.setValue('SVC001');
      expect(component.filteredServiceCodeOptions).toEqual([
        { serviceCode: 'SVC001' }
      ]);

      component.serviceCodeSearchCtrl.setValue('SVC');
      expect(component.filteredServiceCodeOptions.length).toBe(3);
    });
  });

  // --- isApplyDisabled ---

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when all fields are empty', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when one field is set', () => {
      component.filterForm.patchValue({ productCode: 'PC001' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when multiple fields are set', () => {
      component.filterForm.patchValue({
        productCode: 'PC001',
        serviceCode: 'SVC001'
      });
      expect(component.isApplyDisabled).toBe(false);
    });
  });

  // --- onApply ---

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit only non-empty filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        productCode: 'PC001',
        invProductType: null,
        productType: null,
        serviceCode: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        productCode: 'PC001'
      });
    });

    it('should not include null fields in emitted value', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        productCode: null,
        invProductType: 'INV01',
        productType: null,
        serviceCode: 'SVC002'
      });

      component.onApply();

      const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as FilterValue;
      expect(emittedValue.productCode).toBeUndefined();
      expect(emittedValue.invProductType).toBe('INV01');
      expect(emittedValue.productType).toBeUndefined();
      expect(emittedValue.serviceCode).toBe('SVC002');
    });

    it('should emit all 4 fields when all are set', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        productCode: 'PC001',
        invProductType: 'INV01',
        productType: 'PROD01',
        serviceCode: 'SVC001'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        productCode: 'PC001',
        invProductType: 'INV01',
        productType: 'PROD01',
        serviceCode: 'SVC001'
      });
    });
  });

  // --- onClearAll ---

  describe('onClearAll', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set up initial state
      component.productCodeOptions = mockProductCodes;
      component.inventoryProductTypeOptions = mockInvProductTypes;
      component.productionProductTypeOptions = mockProductionProductTypes;
      component.serviceCodeOptions = mockServiceCodes;

      component.filterForm.patchValue({
        productCode: 'PC001',
        invProductType: 'INV01',
        productType: 'PROD01',
        serviceCode: 'SVC001'
      });
    });

    it('should reset form controls to null', () => {
      component.onClearAll();

      expect(component.filterForm.get('productCode')?.value).toBeNull();
      expect(component.filterForm.get('invProductType')?.value).toBeNull();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('serviceCode')?.value).toBeNull();
    });

    it('should clear search controls', () => {
      component.productCodeSearchCtrl.setValue('test');
      component.invProductTypeSearchCtrl.setValue('test');
      component.productTypeSearchCtrl.setValue('test');
      component.serviceCodeSearchCtrl.setValue('test');

      component.onClearAll();

      expect(component.productCodeSearchCtrl.value).toBe('');
      expect(component.invProductTypeSearchCtrl.value).toBe('');
      expect(component.productTypeSearchCtrl.value).toBe('');
      expect(component.serviceCodeSearchCtrl.value).toBe('');
    });

    it('should restore filtered arrays to full options', () => {
      // First filter to reduce the arrays
      component.productCodeSearchCtrl.setValue('PC001');
      component.invProductTypeSearchCtrl.setValue('INV01');
      component.productTypeSearchCtrl.setValue('PROD01');
      component.serviceCodeSearchCtrl.setValue('SVC001');

      expect(component.filteredProductCodeOptions.length).toBe(1);

      component.onClearAll();

      expect(component.filteredProductCodeOptions).toEqual(mockProductCodes);
      expect(component.filteredInvProductTypeOptions).toEqual(mockInvProductTypes);
      expect(component.filteredProductTypeOptions).toEqual(mockProductionProductTypes);
      expect(component.filteredServiceCodeOptions).toEqual(mockServiceCodes);
    });

    it('should emit empty object via apply', () => {
      spyOn(component.apply, 'emit');

      component.onClearAll();

      expect(component.apply.emit).toHaveBeenCalledWith({});
    });
  });

  // --- onClose / ngOnDestroy ---

  describe('onClose and ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event when onClose is called', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should not throw when ngOnDestroy is called', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
