import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { CcExStepEditProductsComponent } from './cc-ex-step-edit-products';
import { ExportOrderApiService } from '../../enter-export-order/services/export-order-api.service';
import {
  ExportOrderItemDto,
  LookupItem
} from '../../enter-export-order/models/export-order.model';

describe('CcExStepEditProductsComponent', () => {
  let component: CcExStepEditProductsComponent;
  let fixture: ComponentFixture<CcExStepEditProductsComponent>;
  let dialogOpenSpy: jasmine.Spy;

  const mockProducts: LookupItem[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' }
  ];

  const mockBloodTypes: LookupItem[] = [
    { code: 'OP', description: 'O Positive' },
    { code: 'AP', description: 'A Positive' }
  ];

  const mockTiers: (LookupItem & { unitPrice?: number })[] = [
    { code: '1', description: 'Tier 1', unitPrice: 100 },
    { code: '2', description: 'Tier 2', unitPrice: 200 }
  ];

  const mockGroups: LookupItem[] = [
    { code: 'CMV', description: 'CMV Status' },
    { code: 'HBS', description: 'HBS Antigen' }
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
    'getProductTypesLookup', 'getAttributeGroupsLookup', 'getBloodTypesLookup',
    'getTiersLookup', 'getAttributeCodesLookup'
  ]);

  function resetSpies(): void {
    apiService.getProductTypesLookup.calls.reset();
    apiService.getAttributeGroupsLookup.calls.reset();
    apiService.getBloodTypesLookup.calls.reset();
    apiService.getTiersLookup.calls.reset();
    apiService.getAttributeCodesLookup.calls.reset();

    apiService.getProductTypesLookup.and.returnValue(of(mockProducts));
    apiService.getAttributeGroupsLookup.and.returnValue(of(mockGroups));
    apiService.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
    apiService.getTiersLookup.and.returnValue(of(mockTiers));
    apiService.getAttributeCodesLookup.and.returnValue(of(mockAttributeCodes));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        CcExStepEditProductsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService }
      ]
    });

    fixture = TestBed.createComponent(CcExStepEditProductsComponent);
    component = fixture.componentInstance;

    dialogOpenSpy = spyOn((component as any).dialog, 'open');

    fixture.detectChanges();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required validators', () => {
    expect(component.newItemForm).toBeTruthy();
    expect(component.f['productType']).toBeTruthy();
    expect(component.f['bloodType']).toBeTruthy();
    expect(component.f['requiredQty']).toBeTruthy();
    expect(component.f['specialFlag']).toBeTruthy();
    expect(component.f['tier']).toBeTruthy();
    expect(component.f['group']).toBeTruthy();
    expect(component.f['attributeCode']).toBeTruthy();

    // Required fields should be invalid when empty
    expect(component.f['productType'].valid).toBeFalse();
    expect(component.f['bloodType'].valid).toBeFalse();
    expect(component.f['requiredQty'].valid).toBeFalse();
    expect(component.f['specialFlag'].valid).toBeFalse();
    expect(component.f['tier'].valid).toBeFalse();
  });

  it('should load product types on init', () => {
    expect(apiService.getProductTypesLookup).toHaveBeenCalled();
    expect(component.products()).toEqual(mockProducts);
    expect(component.filteredProducts()).toEqual(mockProducts);
  });

  it('should load attribute groups on init', () => {
    expect(apiService.getAttributeGroupsLookup).toHaveBeenCalled();
    expect(component.groups()).toEqual(mockGroups);
    expect(component.filteredGroups()).toEqual(mockGroups);
  });

  it('should handle product types load error', () => {
    resetSpies();
    apiService.getProductTypesLookup.and.returnValue(throwError(() => new Error('fail')));

    const fixture2 = TestBed.createComponent(CcExStepEditProductsComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.products()).toEqual([]);
    expect(component2.filteredProducts()).toEqual([]);
  });

  it('should handle attribute groups load error', () => {
    resetSpies();
    apiService.getAttributeGroupsLookup.and.returnValue(throwError(() => new Error('fail')));

    const fixture2 = TestBed.createComponent(CcExStepEditProductsComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.groups()).toEqual([]);
    expect(component2.filteredGroups()).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Product type cascading
  // ---------------------------------------------------------------------------
  describe('product type cascading', () => {
    it('should load blood types when product type changes', () => {
      component.newItemForm.patchValue({ productType: 'RBC' });

      expect(apiService.getBloodTypesLookup).toHaveBeenCalledWith('RBC');
      expect(component.bloodTypes()).toEqual(mockBloodTypes);
      expect(component.filteredBloodTypes()).toEqual(mockBloodTypes);
    });

    it('should load tiers when product type changes', () => {
      component.newItemForm.patchValue({ productType: 'RBC' });

      expect(apiService.getTiersLookup).toHaveBeenCalledWith('RBC', undefined);
      expect(component.tiers()).toEqual(mockTiers);
      expect(component.filteredTiers()).toEqual(mockTiers);
    });

    it('should auto-select tier 1 if available', () => {
      component.newItemForm.patchValue({ productType: 'RBC' });

      expect(component.newItemForm.get('tier')!.value).toBe('1');
    });

    it('should clear blood types and tiers when product type cleared', () => {
      // First set a product type to load blood types and tiers
      component.newItemForm.patchValue({ productType: 'RBC' });
      expect(component.bloodTypes().length).toBeGreaterThan(0);
      expect(component.tiers().length).toBeGreaterThan(0);

      // Now clear product type
      component.newItemForm.patchValue({ productType: '' });

      expect(component.bloodTypes()).toEqual([]);
      expect(component.filteredBloodTypes()).toEqual([]);
      expect(component.tiers()).toEqual([]);
      expect(component.filteredTiers()).toEqual([]);
    });

    it('should handle blood types load error', () => {
      apiService.getBloodTypesLookup.and.returnValue(throwError(() => new Error('fail')));

      component.newItemForm.patchValue({ productType: 'RBC' });

      expect(component.bloodTypes()).toEqual([]);
      expect(component.filteredBloodTypes()).toEqual([]);
    });

    it('should handle tiers load error', () => {
      apiService.getTiersLookup.and.returnValue(throwError(() => new Error('fail')));

      component.newItemForm.patchValue({ productType: 'RBC' });

      expect(component.tiers()).toEqual([]);
      expect(component.filteredTiers()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Group cascading
  // ---------------------------------------------------------------------------
  describe('group cascading', () => {
    it('should load attribute codes when group changes', () => {
      component.newItemForm.patchValue({ group: 'CMV' });

      expect(apiService.getAttributeCodesLookup).toHaveBeenCalledWith('CMV');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
      expect(component.filteredAttributeCodes()).toEqual(mockAttributeCodes);
    });

    it('should clear attribute codes when group cleared', () => {
      // First set a group to load attribute codes
      component.newItemForm.patchValue({ group: 'CMV' });
      expect(component.attributeCodes().length).toBeGreaterThan(0);

      // Now clear group
      component.newItemForm.patchValue({ group: '' });

      expect(component.attributeCodes()).toEqual([]);
      expect(component.filteredAttributeCodes()).toEqual([]);
    });

    it('should handle attribute codes load error', () => {
      apiService.getAttributeCodesLookup.and.returnValue(throwError(() => new Error('fail')));

      component.newItemForm.patchValue({ group: 'CMV' });

      expect(component.attributeCodes()).toEqual([]);
      expect(component.filteredAttributeCodes()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // nextItemNumber
  // ---------------------------------------------------------------------------
  describe('nextItemNumber', () => {
    it('should return 1 when no items', () => {
      component.orderItems = [];
      expect(component.nextItemNumber).toBe(1);
    });

    it('should return max itemNo + 1', () => {
      component.orderItems = mockOrderItems;
      expect(component.nextItemNumber).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Status helpers
  // ---------------------------------------------------------------------------
  describe('getItemStatus', () => {
    it('should return Ordered for status OR', () => {
      expect(component.getItemStatus({ itemStatus: 'OR' } as ExportOrderItemDto)).toBe('Ordered');
    });

    it('should return Canceled for status CA', () => {
      expect(component.getItemStatus({ itemStatus: 'CA' } as ExportOrderItemDto)).toBe('Canceled');
    });

    it('should return Shipped for status SH', () => {
      expect(component.getItemStatus({ itemStatus: 'SH' } as ExportOrderItemDto)).toBe('Shipped');
    });

    it('should return code when status not found', () => {
      expect(component.getItemStatus({ itemStatus: 'XX' } as ExportOrderItemDto)).toBe('XX');
    });

    it('should default to Ordered when itemStatus is null/undefined', () => {
      expect(component.getItemStatus({ itemStatus: undefined } as any)).toBe('Ordered');
      expect(component.getItemStatus({ itemStatus: null } as any)).toBe('Ordered');
      expect(component.getItemStatus({} as any)).toBe('Ordered');
    });
  });

  // ---------------------------------------------------------------------------
  // getStatusClass
  // ---------------------------------------------------------------------------
  describe('getStatusClass', () => {
    it('should return status-or for OR', () => {
      expect(component.getStatusClass({ itemStatus: 'OR' } as ExportOrderItemDto)).toBe('status-or');
    });

    it('should return status-ca for CA', () => {
      expect(component.getStatusClass({ itemStatus: 'CA' } as ExportOrderItemDto)).toBe('status-ca');
    });
  });

  // ---------------------------------------------------------------------------
  // getItemBloodTypeDisplay
  // ---------------------------------------------------------------------------
  describe('getItemBloodTypeDisplay', () => {
    it('should return bloodTypeDesc when available', () => {
      expect(component.getItemBloodTypeDisplay({ bloodType: 'OP', bloodTypeDesc: 'O Positive' } as ExportOrderItemDto)).toBe('O Positive');
    });

    it('should return bloodType when desc not available', () => {
      expect(component.getItemBloodTypeDisplay({ bloodType: 'OP', bloodTypeDesc: undefined } as any)).toBe('OP');
    });

    it('should return -- when no bloodType', () => {
      expect(component.getItemBloodTypeDisplay({ bloodType: '' } as ExportOrderItemDto)).toBe('--');
      expect(component.getItemBloodTypeDisplay({ bloodType: undefined } as any)).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // getItemCost
  // ---------------------------------------------------------------------------
  describe('getItemCost', () => {
    it('should format unit price to 2 decimal places', () => {
      expect(component.getItemCost({ unitPrice: 100 } as ExportOrderItemDto)).toBe('100.00');
      expect(component.getItemCost({ unitPrice: 99.9 } as ExportOrderItemDto)).toBe('99.90');
    });

    it('should return -- when no unitPrice', () => {
      expect(component.getItemCost({ unitPrice: undefined } as any)).toBe('--');
      expect(component.getItemCost({ unitPrice: null } as any)).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // getSubOkDisplay
  // ---------------------------------------------------------------------------
  describe('getSubOkDisplay', () => {
    it('should return Yes for Y', () => {
      expect(component.getSubOkDisplay('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.getSubOkDisplay('N')).toBe('No');
    });

    it('should return -- for undefined', () => {
      expect(component.getSubOkDisplay(undefined)).toBe('--');
    });
  });

  // ---------------------------------------------------------------------------
  // isItemEditable
  // ---------------------------------------------------------------------------
  describe('isItemEditable', () => {
    it('should return true for OR status', () => {
      expect(component.isItemEditable({ itemStatus: 'OR' } as ExportOrderItemDto)).toBeTrue();
    });

    it('should return false for CA status', () => {
      expect(component.isItemEditable({ itemStatus: 'CA' } as ExportOrderItemDto)).toBeFalse();
    });

    it('should return false for SH status', () => {
      expect(component.isItemEditable({ itemStatus: 'SH' } as ExportOrderItemDto)).toBeFalse();
    });

    it('should return false for CL status', () => {
      expect(component.isItemEditable({ itemStatus: 'CL' } as ExportOrderItemDto)).toBeFalse();
    });

    it('should return false for DL status', () => {
      expect(component.isItemEditable({ itemStatus: 'DL' } as ExportOrderItemDto)).toBeFalse();
    });

    it('should return true when itemStatus is undefined (defaults to OR)', () => {
      expect(component.isItemEditable({ itemStatus: undefined } as any)).toBeTrue();
      expect(component.isItemEditable({} as any)).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // onAddItem
  // ---------------------------------------------------------------------------
  describe('onAddItem', () => {
    function fillFormValid(): void {
      // Set up tiers and blood types first by triggering product type change
      component.newItemForm.patchValue({ productType: 'RBC' });
      // Now set remaining fields
      component.newItemForm.patchValue({
        bloodType: 'OP',
        requiredQty: 10,
        specialFlag: 'Y',
        tier: '1'
      });
    }

    it('should emit itemAdded when form is valid', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = [];
      fillFormValid();

      component.onAddItem();

      expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        itemNo: 1,
        productType: 'RBC',
        bloodType: 'OP',
        tier: 1,
        requiredQty: 10,
        unitPrice: 100,
        subOk: 'Y'
      }));
    });

    it('should not emit when form is invalid', () => {
      spyOn(component.itemAdded, 'emit');
      // Leave form empty / invalid
      component.onAddItem();
      expect(component.itemAdded.emit).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form invalid', () => {
      spyOn(component.newItemForm, 'markAllAsTouched');
      component.onAddItem();
      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should reset form after add', () => {
      spyOn(component.newItemForm, 'reset');
      spyOn(component.itemAdded, 'emit');
      component.orderItems = [];
      fillFormValid();

      component.onAddItem();

      expect(component.newItemForm.reset).toHaveBeenCalled();
    });

    it('should calculate correct nextItemNumber in emitted item', () => {
      spyOn(component.itemAdded, 'emit');
      component.orderItems = mockOrderItems; // max itemNo = 2
      fillFormValid();

      component.onAddItem();

      expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        itemNo: 3
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // onAddNewProducts
  // ---------------------------------------------------------------------------
  describe('onAddNewProducts', () => {
    it('should show new row when not visible', () => {
      component.showNewRow.set(false);
      component.onAddNewProducts();
      expect(component.showNewRow()).toBeTrue();
    });

    it('should submit form when new row visible and form valid and dirty', () => {
      spyOn(component.itemAdded, 'emit');
      component.showNewRow.set(true);
      component.orderItems = [];

      // Set up cascading lookups
      component.newItemForm.patchValue({ productType: 'RBC' });
      component.newItemForm.patchValue({
        bloodType: 'OP',
        requiredQty: 10,
        specialFlag: 'Y',
        tier: '1'
      });
      component.newItemForm.markAsDirty();

      component.onAddNewProducts();

      expect(component.itemAdded.emit).toHaveBeenCalled();
    });

    it('should mark touched when row visible and form invalid and dirty', () => {
      component.showNewRow.set(true);
      component.newItemForm.markAsDirty();
      // Form is invalid because required fields are empty
      spyOn(component.newItemForm, 'markAllAsTouched');

      component.onAddNewProducts();

      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
    });

    it('should reset form when showing new row', () => {
      spyOn(component.newItemForm, 'reset');
      component.showNewRow.set(false);

      component.onAddNewProducts();

      expect(component.newItemForm.reset).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onDiscardNewRow
  // ---------------------------------------------------------------------------
  describe('onDiscardNewRow', () => {
    it('should hide new row', () => {
      component.showNewRow.set(true);
      component.onDiscardNewRow();
      expect(component.showNewRow()).toBeFalse();
    });

    it('should reset form', () => {
      spyOn(component.newItemForm, 'reset');
      component.onDiscardNewRow();
      expect(component.newItemForm.reset).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // hasPendingItem
  // ---------------------------------------------------------------------------
  describe('hasPendingItem', () => {
    it('should return true when showNewRow and form dirty', () => {
      component.showNewRow.set(true);
      component.newItemForm.markAsDirty();
      expect(component.hasPendingItem()).toBeTrue();
    });

    it('should return false when showNewRow false', () => {
      component.showNewRow.set(false);
      component.newItemForm.markAsDirty();
      expect(component.hasPendingItem()).toBeFalse();
    });

    it('should return false when form not dirty', () => {
      component.showNewRow.set(true);
      component.newItemForm.markAsPristine();
      expect(component.hasPendingItem()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // tryFlushPendingItem
  // ---------------------------------------------------------------------------
  describe('tryFlushPendingItem', () => {
    it('should return true when no pending item', () => {
      component.showNewRow.set(false);
      expect(component.tryFlushPendingItem()).toBeTrue();
    });

    it('should return true and submit when form valid', () => {
      spyOn(component.itemAdded, 'emit');
      component.showNewRow.set(true);
      component.orderItems = [];

      // Fill form with valid data
      component.newItemForm.patchValue({ productType: 'RBC' });
      component.newItemForm.patchValue({
        bloodType: 'OP',
        requiredQty: 10,
        specialFlag: 'Y',
        tier: '1'
      });
      component.newItemForm.markAsDirty();

      expect(component.tryFlushPendingItem()).toBeTrue();
      expect(component.itemAdded.emit).toHaveBeenCalled();
    });

    it('should return false when form invalid', () => {
      component.showNewRow.set(true);
      component.newItemForm.markAsDirty();
      // Form is invalid because required fields are empty
      expect(component.tryFlushPendingItem()).toBeFalse();
    });

    it('should mark all touched when form invalid', () => {
      spyOn(component.newItemForm, 'markAllAsTouched');
      component.showNewRow.set(true);
      component.newItemForm.markAsDirty();

      component.tryFlushPendingItem();

      expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onCancelItem
  // ---------------------------------------------------------------------------
  describe('onCancelItem', () => {
    const testItem: ExportOrderItemDto = {
      orderNo: 'EX001', itemNo: 1, productType: 'RBC', bloodType: 'OP',
      bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 10,
      unitPrice: 100, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0
    };

    it('should open confirm dialog', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onCancelItem(testItem);

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(dialogArgs[1]).toEqual(jasmine.objectContaining({
        width: '420px',
        disableClose: true
      }));
      expect(dialogArgs[1].data.title).toBe('Cancel Item');
      expect(dialogArgs[1].data.message).toContain('item 1');
      expect(dialogArgs[1].data.message).toContain('RBC');
    });

    it('should emit itemCanceled when confirmed', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      spyOn(component.itemCanceled, 'emit');

      component.onCancelItem(testItem);

      expect(component.itemCanceled.emit).toHaveBeenCalledWith(1);
    });

    it('should not emit when dialog cancelled', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      spyOn(component.itemCanceled, 'emit');

      component.onCancelItem(testItem);

      expect(component.itemCanceled.emit).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onDeleteItem
  // ---------------------------------------------------------------------------
  describe('onDeleteItem', () => {
    it('should emit itemDeleted', () => {
      spyOn(component.itemDeleted, 'emit');
      component.onDeleteItem(5);
      expect(component.itemDeleted.emit).toHaveBeenCalledWith(5);
    });
  });

  // ---------------------------------------------------------------------------
  // Search filters (fakeAsync)
  // ---------------------------------------------------------------------------
  describe('search filters', () => {
    it('should filter products by code', fakeAsync(() => {
      component.productSearchCtrl.setValue('RBC');
      tick(250);

      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RBC');
    }));

    it('should filter blood types by description', fakeAsync(() => {
      // First load blood types by setting product type
      component.newItemForm.patchValue({ productType: 'RBC' });
      tick(250);

      component.bloodTypeSearchCtrl.setValue('Positive');
      tick(250);

      const filtered = component.filteredBloodTypes();
      expect(filtered.length).toBe(2); // Both 'O Positive' and 'A Positive'
      expect(filtered.every(bt => bt.description.includes('Positive'))).toBeTrue();
    }));

    it('should filter groups by code', fakeAsync(() => {
      component.groupSearchCtrl.setValue('CMV');
      tick(250);

      const filtered = component.filteredGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CMV');
    }));

    it('should show all products when search empty', fakeAsync(() => {
      // First filter to reduce results
      component.productSearchCtrl.setValue('RBC');
      tick(250);
      expect(component.filteredProducts().length).toBe(1);

      // Clear the search
      component.productSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredProducts()).toEqual(mockProducts);
    }));
  });

  // ---------------------------------------------------------------------------
  // f getter
  // ---------------------------------------------------------------------------
  describe('f getter', () => {
    it('should return form controls', () => {
      const controls = component.f;
      expect(controls['productType']).toBe(component.newItemForm.controls['productType']);
      expect(controls['bloodType']).toBe(component.newItemForm.controls['bloodType']);
      expect(controls['requiredQty']).toBe(component.newItemForm.controls['requiredQty']);
      expect(controls['specialFlag']).toBe(component.newItemForm.controls['specialFlag']);
      expect(controls['tier']).toBe(component.newItemForm.controls['tier']);
      expect(controls['group']).toBe(component.newItemForm.controls['group']);
      expect(controls['attributeCode']).toBe(component.newItemForm.controls['attributeCode']);
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      spyOn(destroy$, 'next');
      spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroy$.next).toHaveBeenCalled();
      expect(destroy$.complete).toHaveBeenCalled();
    });
  });
});
