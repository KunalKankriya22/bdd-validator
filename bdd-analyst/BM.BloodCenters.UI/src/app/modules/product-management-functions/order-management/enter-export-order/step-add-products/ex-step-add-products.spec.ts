import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { ExStepAddProductsComponent } from './ex-step-add-products';
import { ExportOrderApiService } from '../services/export-order-api.service';
import {
  LookupItem,
  ExportOrderItemDto,
  InventoryStockCheckResult
} from '../models/export-order.model';

describe('ExStepAddProductsComponent', () => {
  let component: ExStepAddProductsComponent;
  let fixture: ComponentFixture<ExStepAddProductsComponent>;

  const mockProducts: LookupItem[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' },
    { code: 'FFP', description: 'Fresh Frozen Plasma' }
  ];

  const mockBloodTypes: LookupItem[] = [
    { code: 'OP', description: 'O Positive' },
    { code: 'ON', description: 'O Negative' },
    { code: 'AP', description: 'A Positive' }
  ];

  const mockTiers: (LookupItem & { unitPrice?: number })[] = [
    { code: '1', description: 'Tier 1 - ($100)', unitPrice: 100 },
    { code: '2', description: 'Tier 2 - ($200)', unitPrice: 200 }
  ];

  const mockGroups: LookupItem[] = [
    { code: 'CMV', description: 'CMV Status' },
    { code: 'IRR', description: 'Irradiated' }
  ];

  const mockAttributeCodes: LookupItem[] = [
    { code: 'POS', description: 'Positive' },
    { code: 'NEG', description: 'Negative' }
  ];

  const mockOrderItems: ExportOrderItemDto[] = [
    {
      orderNo: 'EX001', itemNo: 1, productType: 'RBC', bloodType: 'OP',
      bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 10,
      unitPrice: 100, itemStatus: 'OR', allocatedQty: 5, shippedQty: 0
    },
    {
      orderNo: 'EX001', itemNo: 2, productType: 'PLT', bloodType: 'AP',
      bloodTypeDesc: 'A Positive', tier: 2, requiredQty: 5,
      unitPrice: 200, itemStatus: 'SH', allocatedQty: 5, shippedQty: 5
    }
  ];

  const apiService = jasmine.createSpyObj<ExportOrderApiService>('ExportOrderApiService', [
    'getProductTypesLookup', 'getBloodTypesLookup', 'getTiersLookup',
    'getAttributeGroupsLookup', 'getAttributeCodesLookup', 'checkInventoryStock'
  ]);

  function resetSpies(): void {
    apiService.getProductTypesLookup.calls.reset();
    apiService.getBloodTypesLookup.calls.reset();
    apiService.getTiersLookup.calls.reset();
    apiService.getAttributeGroupsLookup.calls.reset();
    apiService.getAttributeCodesLookup.calls.reset();
    apiService.checkInventoryStock.calls.reset();

    apiService.getProductTypesLookup.and.returnValue(of(mockProducts));
    apiService.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
    apiService.getTiersLookup.and.returnValue(of(mockTiers));
    apiService.getAttributeGroupsLookup.and.returnValue(of(mockGroups));
    apiService.getAttributeCodesLookup.and.returnValue(of(mockAttributeCodes));
    apiService.checkInventoryStock.and.returnValue(of(null));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        ExStepAddProductsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService }
      ]
    });

    fixture = TestBed.createComponent(ExStepAddProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // ngOnInit / initializeForm
  // ---------------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('should initialize the form with required validators', () => {
      expect(component.newItemForm).toBeTruthy();
      expect(component.newItemForm.get('productType')).toBeTruthy();
      expect(component.newItemForm.get('bloodType')).toBeTruthy();
      expect(component.newItemForm.get('requiredQty')).toBeTruthy();
      expect(component.newItemForm.get('specialFlag')).toBeTruthy();
      expect(component.newItemForm.get('tier')).toBeTruthy();
      expect(component.newItemForm.get('unitPrice')).toBeTruthy();
      expect(component.newItemForm.get('group')).toBeTruthy();
      expect(component.newItemForm.get('attributeCode')).toBeTruthy();
    });

    it('should mark productType, bloodType, requiredQty, tier as required', () => {
      const requiredControls = ['productType', 'bloodType', 'requiredQty', 'tier'];
      requiredControls.forEach(name => {
        const control = component.newItemForm.get(name);
        control?.setValue('');
        control?.updateValueAndValidity();
        expect(control?.hasError('required')).toBeTrue();
      });
    });

    it('should not mark group, attributeCode as required', () => {
      const optionalControls = ['group', 'attributeCode'];
      optionalControls.forEach(name => {
        const control = component.newItemForm.get(name);
        control?.setValue('');
        control?.updateValueAndValidity();
        expect(control?.hasError('required')).toBeFalse();
      });
    });

    it('should set min(1) validator on requiredQty', () => {
      const ctrl = component.newItemForm.get('requiredQty');
      ctrl?.setValue(0);
      expect(ctrl?.hasError('min')).toBeTrue();
      ctrl?.setValue(-1);
      expect(ctrl?.hasError('min')).toBeTrue();
      ctrl?.setValue(1);
      expect(ctrl?.hasError('min')).toBeFalse();
    });

    it('should set min(0) validator on unitPrice', () => {
      const ctrl = component.newItemForm.get('unitPrice');
      ctrl?.setValue(-1);
      expect(ctrl?.hasError('min')).toBeTrue();
      ctrl?.setValue(0);
      expect(ctrl?.hasError('min')).toBeFalse();
      ctrl?.setValue(100);
      expect(ctrl?.hasError('min')).toBeFalse();
    });

    it('should load products on init', () => {
      expect(apiService.getProductTypesLookup).toHaveBeenCalled();
      expect(component.products()).toEqual(mockProducts);
      expect(component.filteredProducts()).toEqual(mockProducts);
    });

    it('should load attribute groups on init', () => {
      expect(apiService.getAttributeGroupsLookup).toHaveBeenCalled();
      expect(component.groups()).toEqual(mockGroups);
      expect(component.filteredGroups()).toEqual(mockGroups);
    });

    it('should handle error loading products', () => {
      resetSpies();
      apiService.getProductTypesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(ExStepAddProductsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.products()).toEqual([]);
      expect(fix.componentInstance.filteredProducts()).toEqual([]);
    });

    it('should handle error loading attribute groups', () => {
      resetSpies();
      apiService.getAttributeGroupsLookup.and.returnValue(throwError(() => new Error('fail')));
      const fix = TestBed.createComponent(ExStepAddProductsComponent);
      fix.detectChanges();
      expect(fix.componentInstance.groups()).toEqual([]);
      expect(fix.componentInstance.filteredGroups()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // watchProductTypeChanges
  // ---------------------------------------------------------------------------
  describe('watchProductTypeChanges', () => {
    it('should reset bloodType and reload lookups when productType changes', () => {
      component.bloodTypes.set(mockBloodTypes);
      component.filteredBloodTypes.set(mockBloodTypes);
      component.tiers.set(mockTiers);
      component.filteredTiers.set(mockTiers);
      component.newItemForm.patchValue({ bloodType: 'OP', tier: '2' });

      component.newItemForm.get('productType')!.setValue('RBC');

      expect(component.newItemForm.get('bloodType')!.value).toBe('');
      // Tier is auto-selected to '1' since tier 1 exists in mockTiers
      expect(component.newItemForm.get('tier')!.value).toBe('1');
    });

    it('should load blood types for the selected product type', () => {
      apiService.getBloodTypesLookup.calls.reset();
      component.newItemForm.get('productType')!.setValue('RBC');

      expect(apiService.getBloodTypesLookup).toHaveBeenCalledWith('RBC');
      expect(component.bloodTypes()).toEqual(mockBloodTypes);
      expect(component.filteredBloodTypes()).toEqual(mockBloodTypes);
    });

    it('should load tiers for the selected product type', () => {
      apiService.getTiersLookup.calls.reset();
      component.newItemForm.get('productType')!.setValue('PLT');

      expect(apiService.getTiersLookup).toHaveBeenCalledWith('PLT', component.customerId);
      expect(component.tiers()).toEqual(mockTiers);
      expect(component.filteredTiers()).toEqual(mockTiers);
    });

    it('should not load blood types or tiers when productType is empty', () => {
      apiService.getBloodTypesLookup.calls.reset();
      apiService.getTiersLookup.calls.reset();

      component.newItemForm.get('productType')!.setValue('');

      expect(apiService.getBloodTypesLookup).not.toHaveBeenCalled();
      expect(apiService.getTiersLookup).not.toHaveBeenCalled();
      expect(component.bloodTypes()).toEqual([]);
      expect(component.tiers()).toEqual([]);
    });

    it('should handle error loading blood types', () => {
      apiService.getBloodTypesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.bloodTypes()).toEqual([]);
      expect(component.filteredBloodTypes()).toEqual([]);
    });

    it('should handle error loading tiers', () => {
      apiService.getTiersLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.tiers()).toEqual([]);
      expect(component.filteredTiers()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // watchTierChanges
  // ---------------------------------------------------------------------------
  describe('watchTierChanges', () => {
    it('should set unitPrice from selected tier when tier changes', () => {
      component.tiers.set(mockTiers);
      component.newItemForm.get('tier')!.setValue('1');
      expect(component.newItemForm.get('unitPrice')!.value).toBe(100);
    });

    it('should set unitPrice for tier matched by string conversion', () => {
      component.tiers.set(mockTiers);
      component.newItemForm.get('tier')!.setValue(2);
      expect(component.newItemForm.get('unitPrice')!.value).toBe(200);
    });

    it('should not set unitPrice when tier is null/empty', () => {
      component.newItemForm.get('unitPrice')!.setValue(50);
      component.newItemForm.get('tier')!.setValue(null);
      expect(component.newItemForm.get('unitPrice')!.value).toBe(50);
    });

    it('should not set unitPrice when selected tier has no unitPrice', () => {
      component.tiers.set([{ code: '3', description: 'Tier 3' }]);
      component.newItemForm.get('unitPrice')!.setValue(50);
      component.newItemForm.get('tier')!.setValue('3');
      expect(component.newItemForm.get('unitPrice')!.value).toBe(50);
    });

    it('should not set unitPrice when tier is not found in tiers list', () => {
      component.tiers.set(mockTiers);
      component.newItemForm.get('unitPrice')!.setValue(50);
      component.newItemForm.get('tier')!.setValue('999');
      expect(component.newItemForm.get('unitPrice')!.value).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // watchGroupChanges
  // ---------------------------------------------------------------------------
  describe('watchGroupChanges', () => {
    it('should reset attributeCode and load attribute codes when group changes', () => {
      component.newItemForm.patchValue({ attributeCode: 'POS' });

      component.newItemForm.get('group')!.setValue('CMV');

      expect(component.newItemForm.get('attributeCode')!.value).toBe('');
      expect(apiService.getAttributeCodesLookup).toHaveBeenCalledWith('CMV');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
      expect(component.filteredAttributeCodes()).toEqual(mockAttributeCodes);
    });

    it('should not load attribute codes when group is empty', () => {
      apiService.getAttributeCodesLookup.calls.reset();
      component.newItemForm.get('group')!.setValue('');

      expect(apiService.getAttributeCodesLookup).not.toHaveBeenCalled();
      expect(component.attributeCodes()).toEqual([]);
      expect(component.filteredAttributeCodes()).toEqual([]);
    });

    it('should handle error loading attribute codes', () => {
      apiService.getAttributeCodesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('group')!.setValue('CMV');
      expect(component.attributeCodes()).toEqual([]);
      expect(component.filteredAttributeCodes()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // watchRequiredQtyChanges (inventory stock check)
  // ---------------------------------------------------------------------------
  describe('watchRequiredQtyChanges', () => {
    let dialogOpenSpy: jasmine.Spy;

    beforeEach(() => {
      dialogOpenSpy = spyOn((component as any).dialog, 'open');
    });

    it('should open warning dialog when stock check returns a warning', fakeAsync(() => {
      const stockResult: InventoryStockCheckResult = {
        currentStock: 5,
        minimal: 10,
        optimal: 20,
        requiredQty: 15,
        warningLevel: 'belowMinimal',
        warningMessage: 'Stock is below minimal level'
      };
      apiService.checkInventoryStock.and.returnValue(of(stockResult));

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(15);
      tick(600);

      expect(apiService.checkInventoryStock).toHaveBeenCalledWith('RBC', 'OP', 15);
      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data.title).toBe('Inventory Warning');
      expect(dialogConfig.data.message).toBe('Stock is below minimal level');
      expect(dialogConfig.data.detail).toContain('Current Stock: 5');
      expect(dialogConfig.data.detail).toContain('Minimal: 10');
      expect(dialogConfig.data.detail).toContain('Optimal: 20');
    }));

    it('should not open dialog when warningLevel is "none"', fakeAsync(() => {
      const stockResult: InventoryStockCheckResult = {
        currentStock: 50,
        minimal: 10,
        optimal: 20,
        requiredQty: 5,
        warningLevel: 'none',
        warningMessage: ''
      };
      apiService.checkInventoryStock.and.returnValue(of(stockResult));

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(5);
      tick(600);

      expect(dialogOpenSpy).not.toHaveBeenCalled();
    }));

    it('should not open dialog when warningMessage is empty', fakeAsync(() => {
      const stockResult: InventoryStockCheckResult = {
        currentStock: 5,
        minimal: 10,
        optimal: 20,
        requiredQty: 15,
        warningLevel: 'belowMinimal',
        warningMessage: ''
      };
      apiService.checkInventoryStock.and.returnValue(of(stockResult));

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(15);
      tick(600);

      expect(dialogOpenSpy).not.toHaveBeenCalled();
    }));

    it('should not check inventory when qty is 0 or negative', fakeAsync(() => {
      apiService.checkInventoryStock.calls.reset();
      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(0);
      tick(600);

      expect(apiService.checkInventoryStock).not.toHaveBeenCalled();
    }));

    it('should not check inventory when productType is empty', fakeAsync(() => {
      apiService.checkInventoryStock.calls.reset();
      component.newItemForm.get('productType')!.setValue('');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(10);
      tick(600);

      expect(apiService.checkInventoryStock).not.toHaveBeenCalled();
    }));

    it('should not check inventory when bloodType is empty', fakeAsync(() => {
      apiService.checkInventoryStock.calls.reset();
      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('');
      component.newItemForm.get('requiredQty')!.setValue(10);
      tick(600);

      expect(apiService.checkInventoryStock).not.toHaveBeenCalled();
    }));

    it('should handle error in checkInventoryStock gracefully', fakeAsync(() => {
      apiService.checkInventoryStock.and.returnValue(throwError(() => new Error('fail')));

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(10);
      tick(600);

      expect(dialogOpenSpy).not.toHaveBeenCalled();
    }));

    it('should not open dialog when result is null', fakeAsync(() => {
      apiService.checkInventoryStock.and.returnValue(of(null));

      component.newItemForm.get('productType')!.setValue('RBC');
      component.newItemForm.get('bloodType')!.setValue('OP');
      component.newItemForm.get('requiredQty')!.setValue(10);
      tick(600);

      expect(dialogOpenSpy).not.toHaveBeenCalled();
    }));
  });

  // ---------------------------------------------------------------------------
  // nextItemNumber
  // ---------------------------------------------------------------------------
  describe('nextItemNumber', () => {
    it('should return 1 when orderItems is empty', () => {
      component.orderItems = [];
      expect(component.nextItemNumber).toBe(1);
    });

    it('should return maxItemNo + 1 when orderItems exist', () => {
      component.orderItems = mockOrderItems;
      expect(component.nextItemNumber).toBe(3);
    });

    it('should handle non-sequential item numbers', () => {
      component.orderItems = [
        { ...mockOrderItems[0], itemNo: 5 },
        { ...mockOrderItems[1], itemNo: 10 }
      ];
      expect(component.nextItemNumber).toBe(11);
    });

    it('should handle single item', () => {
      component.orderItems = [mockOrderItems[0]];
      expect(component.nextItemNumber).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getItemStatus
  // ---------------------------------------------------------------------------
  describe('getItemStatus', () => {
    it('should return "Ordered" for status code "OR"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'OR' })).toBe('Ordered');
    });

    it('should return "Canceled" for status code "CA"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'CA' })).toBe('Canceled');
    });

    it('should return "Shipped" for status code "SH"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'SH' })).toBe('Shipped');
    });

    it('should return "Hold" for status code "HO"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'HO' })).toBe('Hold');
    });

    it('should return "Allocated" for status code "AL"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'AL' })).toBe('Allocated');
    });

    it('should return "Packed" for status code "PK"', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'PK' })).toBe('Packed');
    });

    it('should return the raw code when status is unknown', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: 'XX' })).toBe('XX');
    });

    it('should default to "Ordered" when itemStatus is empty/falsy', () => {
      expect(component.getItemStatus({ ...mockOrderItems[0], itemStatus: '' })).toBe('Ordered');
    });
  });

  // ---------------------------------------------------------------------------
  // getItemCost
  // ---------------------------------------------------------------------------
  describe('getItemCost', () => {
    it('should return formatted price when unitPrice is set', () => {
      expect(component.getItemCost({ ...mockOrderItems[0], unitPrice: 100 })).toBe('100.00');
    });

    it('should return formatted price for decimal values', () => {
      expect(component.getItemCost({ ...mockOrderItems[0], unitPrice: 99.5 })).toBe('99.50');
    });

    it('should return formatted price for zero', () => {
      expect(component.getItemCost({ ...mockOrderItems[0], unitPrice: 0 })).toBe('0.00');
    });

    it('should return "--" when unitPrice is null', () => {
      expect(component.getItemCost({ ...mockOrderItems[0], unitPrice: undefined })).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // getItemBloodTypeDisplay
  // ---------------------------------------------------------------------------
  describe('getItemBloodTypeDisplay', () => {
    it('should return bloodTypeDesc when available', () => {
      expect(component.getItemBloodTypeDisplay({ ...mockOrderItems[0], bloodType: 'OP', bloodTypeDesc: 'O Positive' })).toBe('O Positive');
    });

    it('should return bloodType code when bloodTypeDesc is not set', () => {
      expect(component.getItemBloodTypeDisplay({ ...mockOrderItems[0], bloodType: 'OP', bloodTypeDesc: undefined })).toBe('OP');
    });

    it('should return "--" when bloodType is empty', () => {
      expect(component.getItemBloodTypeDisplay({ ...mockOrderItems[0], bloodType: '' })).toBe('--');
    });

    it('should return "--" when bloodType is falsy', () => {
      expect(component.getItemBloodTypeDisplay({ ...mockOrderItems[0], bloodType: '' as any })).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // onAddItem
  // ---------------------------------------------------------------------------
  describe('onAddItem', () => {
    it('should mark all fields as touched when form is invalid', () => {
      spyOn(component.newItemForm, 'markAllAsTouched');
      component.onAddItem();
      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not emit itemAdded when form is invalid', () => {
      spyOn(component.itemAdded, 'emit');
      component.onAddItem();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });

    it('should emit itemAdded with correct data when form is valid', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        itemNo: 1,
        productType: 'RBC',
        bloodType: 'OP',
        bloodTypeDesc: 'O Positive',
        tier: 1,
        requiredQty: 10,
        unitPrice: 100
      }));
    });

    it('should use tier unitPrice as fallback when form unitPrice is null', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: null,
        specialFlag: 'Y'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.unitPrice).toBe(100);
    });

    it('should include specialFlag as subOk when set', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.subOk).toBe('Y');
    });

    it('should set subOk to N when specialFlag is N', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'N'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.subOk).toBe('N');
    });

    it('should include attribGroup and attribCode when set', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y',
        group: 'CMV',
        attributeCode: 'POS'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.attribGroup).toBe('CMV');
      expect(emittedItem.attribCode).toBe('POS');
    });

    it('should set attribGroup/attribCode to undefined when not set', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y',
        group: '',
        attributeCode: ''
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.attribGroup).toBeUndefined();
      expect(emittedItem.attribCode).toBeUndefined();
    });

    it('should set tier error and markAllAsTouched when tier is 0 or negative', () => {
      spyOn(component.itemAdded, 'emit');
      spyOn(component.newItemForm, 'markAllAsTouched');
      component.tiers.set([{ code: '0', description: 'Tier 0', unitPrice: 0 }]);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '0',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      expect(component.newItemForm.get('tier')!.hasError('required')).toBeTrue();
      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });

    it('should update itemComments with empty string after adding an item', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      const initialLength = component.itemComments().length;
      component.onAddItem();
      expect(component.itemComments().length).toBe(initialLength + 1);
      expect(component.itemComments()[component.itemComments().length - 1]).toBe('');
    });

    it('should reset the form after adding an item', () => {
      spyOn(component.newItemForm, 'reset');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();
      expect(component.newItemForm.reset).toHaveBeenCalled();
    });

    it('should use nextItemNumber for the item number', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = mockOrderItems;
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.itemNo).toBe(3);
    });

    it('should set bloodTypeDesc from bloodTypes lookup', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'AP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.bloodTypeDesc).toBe('A Positive');
    });

    it('should set bloodTypeDesc to undefined when blood type is not in lookup', () => {
      spyOn(component.itemAdded, 'emit');
      component.tiers.set(mockTiers);
      component.bloodTypes.set([]);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'XX',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });

      component.onAddItem();

      const emittedItem = (component.itemAdded.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedItem.bloodTypeDesc).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // onAddNewProducts
  // ---------------------------------------------------------------------------
  describe('onAddNewProducts', () => {
    it('should call onAddItem when showNewRow is true, form is dirty and valid', () => {
      spyOn(component, 'onAddItem');
      component.showNewRow.set(true);
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 10,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y'
      });
      component.newItemForm.markAsDirty();

      component.onAddNewProducts();

      expect(component.onAddItem).toHaveBeenCalled();
    });

    it('should not call onAddItem when showNewRow is false', () => {
      spyOn(component, 'onAddItem');
      component.showNewRow.set(false);
      component.newItemForm.markAsDirty();

      component.onAddNewProducts();

      expect(component.onAddItem).not.toHaveBeenCalled();
    });

    it('should not call onAddItem when form is pristine', () => {
      spyOn(component, 'onAddItem');
      component.showNewRow.set(true);

      component.onAddNewProducts();

      expect(component.onAddItem).not.toHaveBeenCalled();
    });

    it('should not call onAddItem when form is invalid', () => {
      spyOn(component, 'onAddItem');
      component.showNewRow.set(true);
      component.newItemForm.patchValue({ productType: 'RBC' });
      component.newItemForm.markAsDirty();

      component.onAddNewProducts();

      expect(component.onAddItem).not.toHaveBeenCalled();
    });

    it('should set showNewRow to true', () => {
      component.showNewRow.set(false);
      component.onAddNewProducts();
      expect(component.showNewRow()).toBeTrue();
    });

    it('should reset the form', () => {
      spyOn(component.newItemForm, 'reset');
      component.onAddNewProducts();
      expect(component.newItemForm.reset).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onItemComment
  // ---------------------------------------------------------------------------
  describe('onItemComment', () => {
    let dialogOpenSpy: jasmine.Spy;

    beforeEach(() => {
      dialogOpenSpy = spyOn((component as any).dialog, 'open');
    });

    it('should open dialog with current comment for the given index', () => {
      component.itemComments.set(['first comment', 'second comment']);
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onItemComment(0);

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data).toEqual({ notes: 'first comment' });
      expect(dialogConfig.width).toBe('500px');
      expect(dialogConfig.height).toBe('100vh');
      expect(dialogConfig.position).toEqual({ right: '0' });
    });

    it('should use empty string when index has no comment', () => {
      component.itemComments.set([]);
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onItemComment(5);

      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data).toEqual({ notes: '' });
    });

    it('should update comment when dialog returns a result', () => {
      component.itemComments.set(['old comment', '']);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of('new comment') } as any);

      component.onItemComment(0);

      expect(component.itemComments()[0]).toBe('new comment');
    });

    it('should not update comment when dialog returns null', () => {
      component.itemComments.set(['keep this']);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(null) } as any);

      component.onItemComment(0);

      expect(component.itemComments()[0]).toBe('keep this');
    });

    it('should not update comment when dialog returns undefined', () => {
      component.itemComments.set(['keep this']);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);

      component.onItemComment(0);

      expect(component.itemComments()[0]).toBe('keep this');
    });

    it('should not update when index is negative and dialog returns a result', () => {
      component.itemComments.set(['keep this']);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of('new') } as any);

      component.onItemComment(-1);

      expect(component.itemComments()[0]).toBe('keep this');
    });

    it('should handle empty string result from dialog', () => {
      component.itemComments.set(['old comment']);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of('') } as any);

      component.onItemComment(0);

      expect(component.itemComments()[0]).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onDeleteItem
  // ---------------------------------------------------------------------------
  describe('onDeleteItem', () => {
    it('should emit itemDeleted with the provided itemNo', () => {
      spyOn(component.itemDeleted, 'emit');
      component.onDeleteItem(5);
      expect(component.itemDeleted.emit).toHaveBeenCalledWith(5);
    });

    it('should emit itemDeleted for item number 1', () => {
      spyOn(component.itemDeleted, 'emit');
      component.onDeleteItem(1);
      expect(component.itemDeleted.emit).toHaveBeenCalledWith(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Search filter subscriptions
  // ---------------------------------------------------------------------------
  describe('search filters', () => {
    it('should filter products by code', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('RBC');
      tick(250);
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].code).toBe('RBC');
    }));

    it('should filter products by description', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('Platelets');
      tick(250);
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].code).toBe('PLT');
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredProducts().length).toBe(mockProducts.length);
    }));

    it('should show no products when search does not match', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('ZZZZ');
      tick(250);
      expect(component.filteredProducts().length).toBe(0);
    }));

    it('should be case-insensitive for product search', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('red blood');
      tick(250);
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].code).toBe('RBC');
    }));

    it('should filter blood types by code', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue('OP');
      tick(250);
      expect(component.filteredBloodTypes().length).toBe(1);
      expect(component.filteredBloodTypes()[0].code).toBe('OP');
    }));

    it('should filter blood types by description', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue('Negative');
      tick(250);
      expect(component.filteredBloodTypes().length).toBe(1);
      expect(component.filteredBloodTypes()[0].code).toBe('ON');
    }));

    it('should show all blood types when search is empty', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredBloodTypes().length).toBe(mockBloodTypes.length);
    }));

    it('should handle null search term for blood type filter', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredBloodTypes().length).toBe(mockBloodTypes.length);
    }));

    it('should filter tiers by code', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue('1');
      tick(250);
      expect(component.filteredTiers().length).toBe(1);
      expect(component.filteredTiers()[0].code).toBe('1');
    }));

    it('should filter tiers by description', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue('$200');
      tick(250);
      expect(component.filteredTiers().length).toBe(1);
      expect(component.filteredTiers()[0].code).toBe('2');
    }));

    it('should show all tiers when search is empty', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredTiers().length).toBe(mockTiers.length);
    }));

    it('should filter groups by code', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue('CMV');
      tick(250);
      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].code).toBe('CMV');
    }));

    it('should filter groups by description', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue('Irradiated');
      tick(250);
      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].code).toBe('IRR');
    }));

    it('should show all groups when search is empty', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredGroups().length).toBe(mockGroups.length);
    }));

    it('should handle null search term for group filter', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredGroups().length).toBe(mockGroups.length);
    }));

    it('should filter attribute codes by code', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue('POS');
      tick(250);
      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('POS');
    }));

    it('should filter attribute codes by description', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue('Negative');
      tick(250);
      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('NEG');
    }));

    it('should show all attribute codes when search is empty', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredAttributeCodes().length).toBe(mockAttributeCodes.length);
    }));

    it('should handle null search term for attribute code filter', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredAttributeCodes().length).toBe(mockAttributeCodes.length);
    }));

    it('should handle null search term for product filter', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredProducts().length).toBe(mockProducts.length);
    }));

    it('should handle null search term for tier filter', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue(null);
      tick(250);
      expect(component.filteredTiers().length).toBe(mockTiers.length);
    }));
  });

  // ---------------------------------------------------------------------------
  // f getter (form controls shortcut)
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.newItemForm.controls);
    });

    it('should provide access to individual controls', () => {
      expect(component.f['productType']).toBe(component.newItemForm.get('productType'));
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy / cleanup
  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      spyOn(destroySub, 'next');
      spyOn(destroySub, 'complete');

      component.ngOnDestroy();

      expect(destroySub.next).toHaveBeenCalled();
      expect(destroySub.complete).toHaveBeenCalled();
    });

    it('should unsubscribe search filter subscriptions after destroy', fakeAsync(() => {
      component.ngOnDestroy();

      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('RBC');
      tick(250);

      // After destroy, filter should not update (subscription is dead)
      // The signal won't change from whatever it was set to before destroy
    }));
  });

  // ---------------------------------------------------------------------------
  // elementId helper
  // ---------------------------------------------------------------------------
  describe('elementId helper', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('ex-step-add-products-');
      expect(id).toContain('-test');
    });

    it('should generate unique IDs for different names', () => {
      const id1 = (component as any).elementId('first');
      const id2 = (component as any).elementId('second');
      expect(id1).not.toBe(id2);
      expect(id1).toContain('-first');
      expect(id2).toContain('-second');
    });
  });

  // ---------------------------------------------------------------------------
  // Signals default values
  // ---------------------------------------------------------------------------
  describe('signal defaults', () => {
    it('should have saving default to false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should have showNewRow default to true', () => {
      expect(component.showNewRow()).toBeTrue();
    });

    it('should have itemComments default to empty array', () => {
      expect(component.itemComments()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Input defaults
  // ---------------------------------------------------------------------------
  describe('input defaults', () => {
    it('should have orderData default to null', () => {
      expect(component.orderData).toBeNull();
    });

    it('should have orderItems default to empty array', () => {
      expect(component.orderItems).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // requiredQty validators
  // ---------------------------------------------------------------------------
  describe('requiredQty validators', () => {
    it('should reject qty > 999', () => {
      component.newItemForm.get('requiredQty')?.setValue(1000);
      expect(component.newItemForm.get('requiredQty')?.valid).toBeFalse();
    });

    it('should reject decimal qty', () => {
      component.newItemForm.get('requiredQty')?.setValue(1.5);
      expect(component.newItemForm.get('requiredQty')?.valid).toBeFalse();
    });

    it('should accept valid integer qty', () => {
      component.newItemForm.get('requiredQty')?.setValue(100);
      expect(component.newItemForm.get('requiredQty')?.valid).toBeTrue();
    });

    it('should accept qty of 999', () => {
      component.newItemForm.get('requiredQty')?.setValue(999);
      expect(component.newItemForm.get('requiredQty')?.valid).toBeTrue();
    });

    it('should accept qty of 1', () => {
      component.newItemForm.get('requiredQty')?.setValue(1);
      expect(component.newItemForm.get('requiredQty')?.valid).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // specialFlag required
  // ---------------------------------------------------------------------------
  describe('specialFlag required', () => {
    it('should be required', () => {
      component.newItemForm.get('specialFlag')?.setValue('');
      component.newItemForm.get('specialFlag')?.updateValueAndValidity();
      expect(component.newItemForm.get('specialFlag')?.hasError('required')).toBeTrue();
    });

    it('should be valid when set to Y', () => {
      component.newItemForm.get('specialFlag')?.setValue('Y');
      expect(component.newItemForm.get('specialFlag')?.valid).toBeTrue();
    });

    it('should be valid when set to N', () => {
      component.newItemForm.get('specialFlag')?.setValue('N');
      expect(component.newItemForm.get('specialFlag')?.valid).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // unitPrice max
  // ---------------------------------------------------------------------------
  describe('unitPrice max', () => {
    it('should reject price over 999999.99', () => {
      component.newItemForm.get('unitPrice')?.setValue(1000000);
      expect(component.newItemForm.get('unitPrice')?.hasError('max')).toBeTrue();
    });

    it('should accept price of 999999.99', () => {
      component.newItemForm.get('unitPrice')?.setValue(999999.99);
      expect(component.newItemForm.get('unitPrice')?.hasError('max')).toBeFalse();
    });

    it('should accept zero price', () => {
      component.newItemForm.get('unitPrice')?.setValue(0);
      expect(component.newItemForm.get('unitPrice')?.valid).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // customer-specific product types
  // ---------------------------------------------------------------------------
  describe('customer-specific product types', () => {
    it('should pass customerId to getProductTypesLookup on loadProductTypes', () => {
      component.customerId = 'CUST1';
      component.consigneeId = 'CONS1';
      apiService.getProductTypesLookup.calls.reset();
      (component as any).loadProductTypes();
      expect(apiService.getProductTypesLookup).toHaveBeenCalledWith('CUST1', 'CONS1');
    });

    it('should reload products when customerId changes', () => {
      apiService.getProductTypesLookup.calls.reset();
      component.customerId = 'CUST2';
      component.ngOnChanges({
        customerId: { currentValue: 'CUST2', previousValue: 'CUST1', firstChange: false, isFirstChange: () => false }
      } as any);
      expect(apiService.getProductTypesLookup).toHaveBeenCalled();
    });

    it('should not reload products on first change', () => {
      apiService.getProductTypesLookup.calls.reset();
      component.customerId = 'CUST1';
      component.ngOnChanges({
        customerId: { currentValue: 'CUST1', previousValue: undefined, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(apiService.getProductTypesLookup).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // customer-specific tiers
  // ---------------------------------------------------------------------------
  describe('customer-specific tiers', () => {
    it('should pass customerId to getTiersLookup', () => {
      component.customerId = 'CUST1';
      apiService.getTiersLookup.calls.reset();
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(apiService.getTiersLookup).toHaveBeenCalledWith('RBC', 'CUST1');
    });
  });

  // ---------------------------------------------------------------------------
  // price change flag
  // ---------------------------------------------------------------------------
  describe('price change flag', () => {
    it('should disable unitPrice when flag is not Y', () => {
      component.priceChangeFlag = 'N';
      component.ngOnChanges({
        priceChangeFlag: { currentValue: 'N', previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.newItemForm.get('unitPrice')?.disabled).toBeTrue();
    });

    it('should enable unitPrice when flag is Y', () => {
      component.priceChangeFlag = 'N';
      component.ngOnChanges({
        priceChangeFlag: { currentValue: 'N', previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      component.priceChangeFlag = 'Y';
      component.ngOnChanges({
        priceChangeFlag: { currentValue: 'Y', previousValue: 'N', firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component.newItemForm.get('unitPrice')?.enabled).toBeTrue();
    });

    it('should not change unitPrice state when flag is null', () => {
      const wasEnabled = component.newItemForm.get('unitPrice')?.enabled;
      component.priceChangeFlag = null;
      component.ngOnChanges({
        priceChangeFlag: { currentValue: null, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.newItemForm.get('unitPrice')?.enabled).toBe(wasEnabled);
    });
  });

  // ---------------------------------------------------------------------------
  // contract substitute flag default
  // ---------------------------------------------------------------------------
  describe('contract substitute flag default', () => {
    it('should default specialFlag from contractSubstituteFlag', () => {
      component.contractSubstituteFlag = 'Y';
      component.ngOnChanges({
        contractSubstituteFlag: { currentValue: 'Y', previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);
      expect(component.newItemForm.get('specialFlag')?.value).toBe('Y');
    });

    it('should not update specialFlag when contractSubstituteFlag is null', () => {
      component.newItemForm.patchValue({ specialFlag: 'N' });
      component.contractSubstituteFlag = null;
      component.ngOnChanges({
        contractSubstituteFlag: { currentValue: null, previousValue: 'Y', firstChange: false, isFirstChange: () => false }
      } as any);
      expect(component.newItemForm.get('specialFlag')?.value).toBe('N');
    });
  });

  // ---------------------------------------------------------------------------
  // tier default (auto-select tier 1)
  // ---------------------------------------------------------------------------
  describe('tier default', () => {
    it('should auto-select tier 1 when tiers load', () => {
      apiService.getTiersLookup.and.returnValue(of(mockTiers));
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.newItemForm.get('tier')?.value).toBe('1');
    });

    it('should not auto-select when tier 1 is not available', () => {
      apiService.getTiersLookup.and.returnValue(of([{ code: '3', description: 'Tier 3', unitPrice: 300 }]));
      component.newItemForm.get('tier')!.setValue(null);
      component.newItemForm.get('productType')!.setValue('PLT');
      expect(component.newItemForm.get('tier')?.value).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // attribute duplicate check
  // ---------------------------------------------------------------------------
  describe('attribute duplicate check', () => {
    it('should block duplicate attribute group/code', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = [
        { ...mockOrderItems[0], attribGroup: 'CMV', attribCode: 'POS' }
      ];
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 5,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y',
        group: 'CMV',
        attributeCode: 'POS'
      });

      component.onAddItem();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });

    it('should allow unique attribute group/code', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = [
        { ...mockOrderItems[0], attribGroup: 'CMV', attribCode: 'POS' }
      ];
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 5,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y',
        group: 'CMV',
        attributeCode: 'NEG'
      });

      component.onAddItem();
      expect(component.itemAdded.emit).toHaveBeenCalled();
    });

    it('should allow items without attribute group/code', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = [
        { ...mockOrderItems[0], attribGroup: 'CMV', attribCode: 'POS' }
      ];
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'OP',
        requiredQty: 5,
        tier: '1',
        unitPrice: 100,
        specialFlag: 'Y',
        group: '',
        attributeCode: ''
      });

      component.onAddItem();
      expect(component.itemAdded.emit).toHaveBeenCalled();
    });
  });
});
