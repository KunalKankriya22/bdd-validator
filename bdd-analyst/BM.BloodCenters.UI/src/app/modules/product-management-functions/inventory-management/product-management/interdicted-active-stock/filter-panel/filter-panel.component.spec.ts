import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { InterdictedFilterPanel } from './filter-panel.component';
import { InterdictedFilterValue, InventoryClassOption, ProductTypeOption } from '../models/interdicted-active-stock.model';

const MOCK_CLASSES: InventoryClassOption[] = [
  { code: 'REG', description: 'Regular' },
  { code: 'AUTO', description: 'Autologous' },
];

const MOCK_TYPES: ProductTypeOption[] = [
  { productType: 'RBC', description: 'Red Blood Cells' },
  { productType: 'PLT', description: 'Platelets' },
];

describe('InterdictedFilterPanel', () => {
  let component: InterdictedFilterPanel;
  let fixture: ComponentFixture<InterdictedFilterPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        InterdictedFilterPanel,
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
      ],
      providers: [FormBuilder],
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(InterdictedFilterPanel);
    component = fixture.componentInstance;
    component.inventoryClasses = MOCK_CLASSES;
    component.productTypes = MOCK_TYPES;
    fixture.detectChanges();


    });


  it('should initialise filteredInventoryClasses from input', () => {
    expect(component.filteredInventoryClasses).toEqual(MOCK_CLASSES);
  });

  it('should initialise filteredProductTypes from input', () => {
    expect(component.filteredProductTypes).toEqual(MOCK_TYPES);
  });



  describe('isApplyDisabled', () => {


    it('should be false when a value differs from currentFilters', () => {
      component.currentFilters = { inventoryClass: 'AUTO' };
      component.filterForm.patchValue({ inventoryClass: 'REG' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be true when values match currentFilters', () => {
      component.currentFilters = { inventoryClass: 'REG', productType: 'RBC' };
      component.filterForm.patchValue({ inventoryClass: 'REG', productType: 'RBC' });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('selectedInventoryClassDescription', () => {
    it('should return description for selected inventory class', () => {
      component.filterForm.patchValue({ inventoryClass: 'REG' });
      expect(component.selectedInventoryClassDescription).toBe('Regular');
    });

    it('should return empty string when no inventory class selected', () => {
      expect(component.selectedInventoryClassDescription).toBe('');
    });
  });

  describe('selectedProductTypeDescription', () => {
    it('should return description for selected product type', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      expect(component.selectedProductTypeDescription).toBe('Red Blood Cells');
    });

    it('should return empty string when no product type selected', () => {
      expect(component.selectedProductTypeDescription).toBe('');
    });
  });

  describe('isClearDisabled', () => {
    it('should be true when form is empty', () => {
      expect(component.isClearDisabled).toBeTrue();
    });

    it('should be false when any value is set', () => {
      component.filterForm.patchValue({ inventoryClass: 'REG' });
      expect(component.isClearDisabled).toBeFalse();
    });
  });

  describe('onApply()', () => {




    it('should not include null values in emitted object', () => {
      const spy = spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ inventoryClass: null, productType: 'PLT' });
      component.onApply();
      const emitted = spy.calls.mostRecent().args[0] as InterdictedFilterValue;
      expect(emitted.inventoryClass).toBeUndefined();
      expect(emitted.productType).toBe('PLT');
    });
  });

  describe('onClear()', () => {
    it('should reset form and search controls', () => {
      component.filterForm.patchValue({ inventoryClass: 'REG', productType: 'RBC' });
      component.inventoryClassSearchControl.setValue('test');
      component.productTypeSearchControl.setValue('test');
      component.onClear();
      expect(component.filterForm.value.inventoryClass).toBeNull();
      expect(component.filterForm.value.productType).toBeNull();
      expect(component.inventoryClassSearchControl.value).toBe('');
      expect(component.productTypeSearchControl.value).toBe('');
    });
  });
  describe('inventoryClassSearchControl filtering', () => {
    it('should restore all classes on empty search', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('xyz');
      tick(0);
      component.inventoryClassSearchControl.setValue('');
      tick(0);
      expect(component.filteredInventoryClasses.length).toBe(MOCK_CLASSES.length);
    }));

    it('should filter inventoryClasses by matching search term', fakeAsync(() => {
      component.inventoryClassSearchControl.setValue('reg');
      tick(0);
      expect(component.filteredInventoryClasses.length).toBe(1);
      expect(component.filteredInventoryClasses[0].code).toBe('REG');
    }));
  });

  describe('productTypeSearchControl filtering', () => {
    it('should filter productTypes by matching search term', fakeAsync(() => {
      component.productTypeSearchControl.setValue('red');
      tick(0);
      expect(component.filteredProductTypes.length).toBe(1);
      expect(component.filteredProductTypes[0].productType).toBe('RBC');
    }));

    it('should restore all types on empty search', fakeAsync(() => {
      component.productTypeSearchControl.setValue('red');
      tick(0);
      component.productTypeSearchControl.setValue('');
      tick(0);
      expect(component.filteredProductTypes.length).toBe(MOCK_TYPES.length);
    }));
  });

  describe('onClose()', () => {
    it('should emit the close event', () => {
      const spy = spyOn(component.close, 'emit');
      component.onClose();
      expect(spy).toHaveBeenCalled();
    });
  });
});
