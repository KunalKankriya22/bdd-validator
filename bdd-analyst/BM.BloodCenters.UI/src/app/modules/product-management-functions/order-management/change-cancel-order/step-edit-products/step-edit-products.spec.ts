import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { CcStepEditProductsComponent } from './step-edit-products';
import { RegularOrderApiService } from '../../enter-regular-order/services/regular-order-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { OrderItemDto, LookupItem } from '../../enter-regular-order/models/regular-order.model';

describe('CcStepEditProductsComponent', () => {
  let component: CcStepEditProductsComponent;
  let fixture: ComponentFixture<CcStepEditProductsComponent>;

  const mockProducts: LookupItem[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' },
    { code: 'FFP', description: 'Fresh Frozen Plasma' }
  ];

  const mockBloodTypes: LookupItem[] = [
    { code: 'A+', description: 'A Positive' },
    { code: 'O-', description: 'O Negative' }
  ];

  const mockTiers: (LookupItem & { unitPrice?: number })[] = [
    { code: '1', description: 'Tier 1', unitPrice: 100 },
    { code: '2', description: 'Tier 2', unitPrice: 200 }
  ];

  const mockGroups: LookupItem[] = [
    { code: 'GRP1', description: 'Group 1' },
    { code: 'GRP2', description: 'Group 2' }
  ];

  const mockAttributeCodes: LookupItem[] = [
    { code: 'AC1', description: 'Attr Code 1' },
    { code: 'AC2', description: 'Attr Code 2' }
  ];

  // Create spy objects ONCE so the same references are used across tests.
  // Angular TestBed caches injected providers, so reusing the same objects
  // ensures the component always uses our spies.
  const apiService = jasmine.createSpyObj<RegularOrderApiService>('RegularOrderApiService', [
    'getProductTypesLookup', 'getBloodTypesLookup', 'getTiersLookup',
    'getAttributeGroupsLookup', 'getAttributeCodesLookup',
    'getItemNotes', 'saveItemNotes'
  ]);
  const snackbarService = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSuccess', 'showError']);
  const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

  function makeItem(overrides: Partial<OrderItemDto> = {}): OrderItemDto {
    return {
      orderNo: '25001-0001',
      itemNo: 1,
      productType: 'RBC',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      tier: 1,
      requiredQty: 5,
      unitPrice: 100,
      itemStatus: 'OR',
      allocatedQty: 0,
      shippedQty: 0,
      ...overrides
    };
  }

  beforeEach(() => {
    // Reset all spy call counts and set default return values
    apiService.getProductTypesLookup.calls.reset();
    apiService.getBloodTypesLookup.calls.reset();
    apiService.getTiersLookup.calls.reset();
    apiService.getAttributeGroupsLookup.calls.reset();
    apiService.getAttributeCodesLookup.calls.reset();
    apiService.getItemNotes.calls.reset();
    apiService.saveItemNotes.calls.reset();
    snackbarService.showSuccess.calls.reset();
    snackbarService.showError.calls.reset();
    dialog.open.calls.reset();

    apiService.getProductTypesLookup.and.returnValue(of(mockProducts));
    apiService.getAttributeGroupsLookup.and.returnValue(of(mockGroups));
    apiService.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
    apiService.getTiersLookup.and.returnValue(of(mockTiers));
    apiService.getAttributeCodesLookup.and.returnValue(of(mockAttributeCodes));
    apiService.getItemNotes.and.returnValue(of({ note: 'test note' }));
    apiService.saveItemNotes.and.returnValue(of({ success: true }));

    TestBed.configureTestingModule({
      imports: [
        CcStepEditProductsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: RegularOrderApiService, useValue: apiService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: MatDialog, useValue: dialog }
      ]
    });

    fixture = TestBed.createComponent(CcStepEditProductsComponent);
    component = fixture.componentInstance;
    // Directly assign mocks to bypass TestBed DI caching for standalone components
    (component as any).dialog = dialog;
    (component as any).snackbarService = snackbarService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit ──

  describe('ngOnInit', () => {
    it('should initialize the form with required validators', () => {
      expect(component.newItemForm).toBeTruthy();
      expect(component.newItemForm.get('productType')).toBeTruthy();
      expect(component.newItemForm.get('bloodType')).toBeTruthy();
      expect(component.newItemForm.get('requiredQty')).toBeTruthy();
      expect(component.newItemForm.get('specialFlag')).toBeTruthy();
      expect(component.newItemForm.get('tier')).toBeTruthy();
      expect(component.newItemForm.get('group')).toBeTruthy();
      expect(component.newItemForm.get('attributeCode')).toBeTruthy();
    });

    it('should load product types lookup on init', () => {
      expect(apiService.getProductTypesLookup).toHaveBeenCalled();
      expect(component.products()).toEqual(mockProducts);
      expect(component.filteredProducts()).toEqual(mockProducts);
    });

    it('should load attribute groups lookup on init', () => {
      expect(apiService.getAttributeGroupsLookup).toHaveBeenCalled();
      expect(component.groups()).toEqual(mockGroups);
      expect(component.filteredGroups()).toEqual(mockGroups);
    });

    it('should handle error loading product types', () => {
      apiService.getProductTypesLookup.and.returnValue(throwError(() => new Error('fail')));
      const fixture2 = TestBed.createComponent(CcStepEditProductsComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.products()).toEqual([]);
    });

    it('should handle error loading attribute groups', () => {
      apiService.getAttributeGroupsLookup.and.returnValue(throwError(() => new Error('fail')));
      const fixture2 = TestBed.createComponent(CcStepEditProductsComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.groups()).toEqual([]);
    });
  });

  // ── ngOnChanges ──

  describe('ngOnChanges', () => {
    it('should set itemComments when orderItems changes with noteId', () => {
      component.orderItems = [
        makeItem({ noteId: 42 }),
        makeItem({ itemNo: 2, noteId: undefined })
      ];
      component.ngOnChanges({
        orderItems: new SimpleChange(null, component.orderItems, true)
      });
      expect(component.itemComments()).toEqual(['__has_note__', '']);
    });

    it('should not set itemComments when orderItems is null', () => {
      component.orderItems = null as any;
      component.ngOnChanges({
        orderItems: new SimpleChange(null, null, true)
      });
      expect(component.itemComments()).toBeTruthy();
    });

    it('should ignore changes to other inputs', () => {
      const before = component.itemComments();
      component.ngOnChanges({
        isReadOnly: new SimpleChange(false, true, false)
      });
      expect(component.itemComments()).toEqual(before);
    });
  });

  // ── ngOnDestroy ──

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and updateSubjects', () => {
      const item = makeItem();
      component.onFieldChange(item, 'requiredQty', { target: { value: '10' } } as any);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  // ── Form initialization ──

  describe('form validation', () => {
    it('should be invalid when empty', () => {
      expect(component.newItemForm.invalid).toBeTrue();
    });

    it('should be valid when all required fields are filled', () => {
      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });
      expect(component.newItemForm.valid).toBeTrue();
    });

    it('should be invalid when requiredQty is 0', () => {
      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 0,
        specialFlag: 'Y',
        tier: '1'
      });
      expect(component.newItemForm.invalid).toBeTrue();
    });

    it('should be invalid when requiredQty is negative', () => {
      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: -1,
        specialFlag: 'Y',
        tier: '1'
      });
      expect(component.newItemForm.invalid).toBeTrue();
    });
  });

  // ── f getter ──

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.newItemForm.controls);
    });
  });

  // ── nextItemNumber ──

  describe('nextItemNumber', () => {
    it('should return 1 when orderItems is empty', () => {
      component.orderItems = [];
      expect(component.nextItemNumber).toBe(1);
    });

    it('should return max itemNo + 1', () => {
      component.orderItems = [
        makeItem({ itemNo: 3 }),
        makeItem({ itemNo: 1 }),
        makeItem({ itemNo: 5 })
      ];
      expect(component.nextItemNumber).toBe(6);
    });

    it('should return 2 when single item with itemNo 1', () => {
      component.orderItems = [makeItem({ itemNo: 1 })];
      expect(component.nextItemNumber).toBe(2);
    });
  });

  // ── getItemStatus ──

  describe('getItemStatus', () => {
    it('should return "Ordered" for status OR', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'OR' }))).toBe('Ordered');
    });

    it('should return "Canceled" for status CA', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'CA' }))).toBe('Canceled');
    });

    it('should return "Shipped" for status SH', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'SH' }))).toBe('Shipped');
    });

    it('should return "Hold" for status HO', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'HO' }))).toBe('Hold');
    });

    it('should return "Allocated" for status AL', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'AL' }))).toBe('Allocated');
    });

    it('should return "Packed" for status PK', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'PK' }))).toBe('Packed');
    });

    it('should return "Closed" for status CL', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'CL' }))).toBe('Closed');
    });

    it('should return "Back Ordered" for status BO', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'BO' }))).toBe('Back Ordered');
    });

    it('should return "Unfilled" for status UF', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'UF' }))).toBe('Unfilled');
    });

    it('should return "Delivered" for status DL', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'DL' }))).toBe('Delivered');
    });

    it('should return "System Canceled" for status SY', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'SY' }))).toBe('System Canceled');
    });

    it('should default to "Ordered" when itemStatus is empty/falsy', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: '' }))).toBe('Ordered');
    });

    it('should return the code as-is for unknown status codes', () => {
      expect(component.getItemStatus(makeItem({ itemStatus: 'ZZ' }))).toBe('ZZ');
    });
  });

  // ── getStatusClass ──

  describe('getStatusClass', () => {
    it('should return "status-or" for OR status', () => {
      expect(component.getStatusClass(makeItem({ itemStatus: 'OR' }))).toBe('status-or');
    });

    it('should return "status-ca" for CA status', () => {
      expect(component.getStatusClass(makeItem({ itemStatus: 'CA' }))).toBe('status-ca');
    });

    it('should default to "status-or" when itemStatus is empty', () => {
      expect(component.getStatusClass(makeItem({ itemStatus: '' }))).toBe('status-or');
    });

    it('should lowercase the status code', () => {
      expect(component.getStatusClass(makeItem({ itemStatus: 'SH' }))).toBe('status-sh');
    });
  });

  // ── getItemBloodTypeDisplay ──

  describe('getItemBloodTypeDisplay', () => {
    it('should return "--" when bloodType is empty', () => {
      expect(component.getItemBloodTypeDisplay(makeItem({ bloodType: '' }))).toBe('--');
    });

    it('should return bloodTypeDesc when available', () => {
      expect(component.getItemBloodTypeDisplay(makeItem({ bloodType: 'A+', bloodTypeDesc: 'A Positive' }))).toBe('A Positive');
    });

    it('should return bloodType code when bloodTypeDesc is missing', () => {
      expect(component.getItemBloodTypeDisplay(makeItem({ bloodType: 'A+', bloodTypeDesc: undefined }))).toBe('A+');
    });

    it('should return "--" when bloodType is null-ish', () => {
      expect(component.getItemBloodTypeDisplay(makeItem({ bloodType: undefined as any }))).toBe('--');
    });
  });

  // ── getSubOkDisplay ──

  describe('getSubOkDisplay', () => {
    it('should return "Yes" for "Y"', () => {
      expect(component.getSubOkDisplay('Y')).toBe('Yes');
    });

    it('should return "No" for "N"', () => {
      expect(component.getSubOkDisplay('N')).toBe('No');
    });

    it('should return "--" for undefined', () => {
      expect(component.getSubOkDisplay(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.getSubOkDisplay('')).toBe('--');
    });

    it('should return "--" for other values', () => {
      expect(component.getSubOkDisplay('X')).toBe('--');
    });
  });

  // ── isItemEditable ──

  describe('isItemEditable', () => {
    it('should return true for OR status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'OR' }))).toBeTrue();
    });

    it('should return true for HO status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'HO' }))).toBeTrue();
    });

    it('should return true for AL status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'AL' }))).toBeTrue();
    });

    it('should return true for PK status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'PK' }))).toBeTrue();
    });

    it('should return true for BO status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'BO' }))).toBeTrue();
    });

    it('should return true for UF status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'UF' }))).toBeTrue();
    });

    it('should return false for CA status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'CA' }))).toBeFalse();
    });

    it('should return false for SH status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'SH' }))).toBeFalse();
    });

    it('should return false for CL status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'CL' }))).toBeFalse();
    });

    it('should return false for SY status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'SY' }))).toBeFalse();
    });

    it('should return false for DL status', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: 'DL' }))).toBeFalse();
    });

    it('should default to OR when itemStatus is empty', () => {
      expect(component.isItemEditable(makeItem({ itemStatus: '' }))).toBeTrue();
    });
  });

  // ── isItemFullyEditable ──

  describe('isItemFullyEditable', () => {
    it('should return true when OR status and allocatedQty is 0', () => {
      expect(component.isItemFullyEditable(makeItem({ itemStatus: 'OR', allocatedQty: 0 }))).toBeTrue();
    });

    it('should return false when OR status but allocatedQty > 0', () => {
      expect(component.isItemFullyEditable(makeItem({ itemStatus: 'OR', allocatedQty: 3 }))).toBeFalse();
    });

    it('should return false when status is not OR', () => {
      expect(component.isItemFullyEditable(makeItem({ itemStatus: 'AL', allocatedQty: 0 }))).toBeFalse();
    });

    it('should return true when status is empty (defaults to OR) and allocatedQty is 0', () => {
      expect(component.isItemFullyEditable(makeItem({ itemStatus: '', allocatedQty: 0 }))).toBeTrue();
    });
  });

  // ── isQtyOnlyEditable ──

  describe('isQtyOnlyEditable', () => {
    it('should return true when editable but not fully editable (AL status)', () => {
      expect(component.isQtyOnlyEditable(makeItem({ itemStatus: 'AL', allocatedQty: 0 }))).toBeTrue();
    });

    it('should return true when OR status but has allocations', () => {
      expect(component.isQtyOnlyEditable(makeItem({ itemStatus: 'OR', allocatedQty: 2 }))).toBeTrue();
    });

    it('should return false when fully editable', () => {
      expect(component.isQtyOnlyEditable(makeItem({ itemStatus: 'OR', allocatedQty: 0 }))).toBeFalse();
    });

    it('should return false when not editable at all (CA status)', () => {
      expect(component.isQtyOnlyEditable(makeItem({ itemStatus: 'CA', allocatedQty: 0 }))).toBeFalse();
    });
  });

  // ── onAddItem ──

  describe('onAddItem', () => {
    it('should not emit when form is invalid', () => {
      let emitted = false;
      component.itemAdded.subscribe(() => emitted = true);
      component.onAddItem();
      expect(emitted).toBeFalse();
    });

    it('should mark all fields as touched when form is invalid', () => {
      const spy = spyOn(component.newItemForm, 'markAllAsTouched');
      component.onAddItem();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit itemAdded and reset form when valid', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1',
        group: 'GRP1',
        attributeCode: 'AC1'
      });

      let emittedValue: any = null;
      component.itemAdded.subscribe(v => emittedValue = v);
      const resetSpy = spyOn(component.newItemForm, 'reset');
      component.onAddItem();

      expect(emittedValue).toEqual(jasmine.objectContaining({
        itemNo: 1,
        productType: 'RBC',
        bloodType: 'A+',
        bloodTypeDesc: 'A Positive',
        tier: 1,
        requiredQty: 5,
        unitPrice: 100,
        subOk: 'Y',
        attribGroup: 'GRP1',
        attribCode: 'AC1'
      }));
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should set unitPrice to 0 when tier is not found', () => {
      component.tiers.set([]);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '999'
      });

      let emittedValue: any = null;
      component.itemAdded.subscribe(v => emittedValue = v);
      component.onAddItem();

      expect(emittedValue).toEqual(jasmine.objectContaining({ unitPrice: 0 }));
    });

    it('should handle null tier value by not emitting (form invalid)', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: null
      });

      let emitted = false;
      component.itemAdded.subscribe(() => emitted = true);
      component.onAddItem();
      expect(emitted).toBeFalse();
    });

    it('should update itemComments when adding item', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];
      component.itemComments.set([]);

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });

      component.onAddItem();
      expect(component.itemComments()).toEqual(['']);
    });

    it('should calculate nextItemNumber correctly from existing items', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [makeItem({ itemNo: 3 }), makeItem({ itemNo: 7 })];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });

      let emittedValue: any = null;
      component.itemAdded.subscribe(v => emittedValue = v);
      component.onAddItem();

      expect(emittedValue).toEqual(jasmine.objectContaining({ itemNo: 8 }));
    });

    it('should set bloodTypeDesc to undefined when no matching blood type found', () => {
      component.tiers.set(mockTiers);
      component.bloodTypes.set([]);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'X-',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });

      let emittedValue: any = null;
      component.itemAdded.subscribe(v => emittedValue = v);
      component.onAddItem();

      expect(emittedValue.bloodTypeDesc).toBeUndefined();
    });
  });

  // ── onAddNewProducts ──

  describe('onAddNewProducts', () => {
    it('should show new row when not already showing', () => {
      component.showNewRow.set(false);
      component.onAddNewProducts();
      expect(component.showNewRow()).toBeTrue();
    });

    it('should reset form when showing new row', () => {
      component.showNewRow.set(false);
      const spy = spyOn(component.newItemForm, 'reset');
      component.onAddNewProducts();
      expect(spy).toHaveBeenCalled();
    });

    it('should call onAddItem when showing, form is dirty and valid', () => {
      component.showNewRow.set(true);
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });
      component.newItemForm.markAsDirty();

      let emitted = false;
      component.itemAdded.subscribe(() => emitted = true);
      component.onAddNewProducts();
      expect(emitted).toBeTrue();
    });

    it('should mark form touched and return when showing, dirty but invalid', () => {
      component.showNewRow.set(true);
      component.newItemForm.patchValue({ productType: 'RBC' });
      component.newItemForm.markAsDirty();

      const spy = spyOn(component.newItemForm, 'markAllAsTouched');
      component.onAddNewProducts();
      expect(spy).toHaveBeenCalled();
    });

    it('should do nothing extra when showing but form is pristine', () => {
      component.showNewRow.set(true);
      let emitted = false;
      component.itemAdded.subscribe(() => emitted = true);
      component.onAddNewProducts();
      expect(emitted).toBeFalse();
    });
  });

  // ── onDiscardNewRow ──

  describe('onDiscardNewRow', () => {
    it('should hide new row and reset form', () => {
      component.showNewRow.set(true);
      const spy = spyOn(component.newItemForm, 'reset');
      component.onDiscardNewRow();
      expect(component.showNewRow()).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── hasPendingItem ──

  describe('hasPendingItem', () => {
    it('should return true when showNewRow is true and form is dirty', () => {
      component.showNewRow.set(true);
      component.newItemForm.markAsDirty();
      expect(component.hasPendingItem()).toBeTrue();
    });

    it('should return false when showNewRow is false', () => {
      component.showNewRow.set(false);
      component.newItemForm.markAsDirty();
      expect(component.hasPendingItem()).toBeFalse();
    });

    it('should return false when form is pristine', () => {
      component.showNewRow.set(true);
      expect(component.hasPendingItem()).toBeFalse();
    });
  });

  // ── tryFlushPendingItem ──

  describe('tryFlushPendingItem', () => {
    it('should return true when showNewRow is false', () => {
      component.showNewRow.set(false);
      expect(component.tryFlushPendingItem()).toBeTrue();
    });

    it('should return true when form is not dirty', () => {
      component.showNewRow.set(true);
      expect(component.tryFlushPendingItem()).toBeTrue();
    });

    it('should call onAddItem and return true when form is dirty and valid', () => {
      component.showNewRow.set(true);
      component.tiers.set(mockTiers);
      component.bloodTypes.set(mockBloodTypes);
      component.orderItems = [];

      component.newItemForm.patchValue({
        productType: 'RBC',
        bloodType: 'A+',
        requiredQty: 5,
        specialFlag: 'Y',
        tier: '1'
      });
      component.newItemForm.markAsDirty();

      let emitted = false;
      component.itemAdded.subscribe(() => emitted = true);
      expect(component.tryFlushPendingItem()).toBeTrue();
      expect(emitted).toBeTrue();
    });

    it('should mark touched and return false when dirty but invalid', () => {
      component.showNewRow.set(true);
      component.newItemForm.patchValue({ productType: 'RBC' });
      component.newItemForm.markAsDirty();

      const spy = spyOn(component.newItemForm, 'markAllAsTouched');
      expect(component.tryFlushPendingItem()).toBeFalse();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── watchProductTypeChanges ──

  describe('watchProductTypeChanges (via form control)', () => {
    it('should load blood types and tiers when productType changes to a value', () => {
      apiService.getBloodTypesLookup.calls.reset();
      apiService.getTiersLookup.calls.reset();

      component.newItemForm.get('productType')!.setValue('RBC');

      expect(apiService.getBloodTypesLookup).toHaveBeenCalledWith('RBC');
      expect(apiService.getTiersLookup).toHaveBeenCalledWith('RBC');
      expect(component.bloodTypes()).toEqual(mockBloodTypes);
      expect(component.filteredBloodTypes()).toEqual(mockBloodTypes);
      expect(component.tiers()).toEqual(mockTiers);
      expect(component.filteredTiers()).toEqual(mockTiers);
    });

    it('should reset bloodType and tier when productType changes', () => {
      component.newItemForm.patchValue({ bloodType: 'A+', tier: '1' });
      component.newItemForm.get('productType')!.setValue('PLT');

      expect(component.newItemForm.get('bloodType')!.value).toBe('');
      expect(component.newItemForm.get('tier')!.value).toBeNull();
    });

    it('should clear blood types and tiers when productType is empty', () => {
      component.bloodTypes.set(mockBloodTypes);
      component.tiers.set(mockTiers);

      component.newItemForm.get('productType')!.setValue('');

      expect(component.bloodTypes()).toEqual([]);
      expect(component.filteredBloodTypes()).toEqual([]);
      expect(component.tiers()).toEqual([]);
      expect(component.filteredTiers()).toEqual([]);
    });

    it('should handle error loading blood types on productType change', () => {
      apiService.getBloodTypesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.bloodTypes()).toEqual([]);
    });

    it('should handle error loading tiers on productType change', () => {
      apiService.getTiersLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('productType')!.setValue('RBC');
      expect(component.tiers()).toEqual([]);
    });
  });

  // ── watchGroupChanges ──

  describe('watchGroupChanges (via form control)', () => {
    it('should load attribute codes when group changes to a value', () => {
      apiService.getAttributeCodesLookup.calls.reset();
      component.newItemForm.get('group')!.setValue('GRP1');

      expect(apiService.getAttributeCodesLookup).toHaveBeenCalledWith('GRP1');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
      expect(component.filteredAttributeCodes()).toEqual(mockAttributeCodes);
    });

    it('should reset attributeCode when group changes', () => {
      component.newItemForm.patchValue({ attributeCode: 'AC1' });
      component.newItemForm.get('group')!.setValue('GRP2');
      expect(component.newItemForm.get('attributeCode')!.value).toBe('');
    });

    it('should clear attribute codes when group is empty', () => {
      component.attributeCodes.set(mockAttributeCodes);
      component.newItemForm.get('group')!.setValue('');
      expect(component.attributeCodes()).toEqual([]);
      expect(component.filteredAttributeCodes()).toEqual([]);
    });

    it('should handle error loading attribute codes on group change', () => {
      apiService.getAttributeCodesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.newItemForm.get('group')!.setValue('GRP1');
      expect(component.attributeCodes()).toEqual([]);
    });
  });

  // ── onProductTypeChange (inline edit for existing items) ──

  describe('onProductTypeChange', () => {
    it('should emit itemUpdated with productType', () => {
      const item = makeItem({ itemNo: 3 });
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onProductTypeChange(item, 'PLT');

      expect(emittedValue).toEqual({ itemNo: 3, dto: { productType: 'PLT' } });
    });

    it('should load blood types and tiers when value is truthy', () => {
      apiService.getBloodTypesLookup.calls.reset();
      apiService.getTiersLookup.calls.reset();

      component.onProductTypeChange(makeItem(), 'PLT');

      expect(apiService.getBloodTypesLookup).toHaveBeenCalledWith('PLT');
      expect(apiService.getTiersLookup).toHaveBeenCalledWith('PLT');
    });

    it('should not load lookups when value is empty', () => {
      apiService.getBloodTypesLookup.calls.reset();
      apiService.getTiersLookup.calls.reset();

      component.onProductTypeChange(makeItem(), '');

      expect(apiService.getBloodTypesLookup).not.toHaveBeenCalled();
      expect(apiService.getTiersLookup).not.toHaveBeenCalled();
    });

    it('should handle error loading blood types', () => {
      apiService.getBloodTypesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.onProductTypeChange(makeItem(), 'PLT');
      expect(component.bloodTypes()).toEqual([]);
    });

    it('should handle error loading tiers', () => {
      apiService.getTiersLookup.and.returnValue(throwError(() => new Error('fail')));
      component.onProductTypeChange(makeItem(), 'PLT');
      expect(component.tiers()).toEqual([]);
    });
  });

  // ── onBloodTypeChange ──

  describe('onBloodTypeChange', () => {
    it('should emit itemUpdated with bloodType and bloodTypeDesc', () => {
      component.bloodTypes.set(mockBloodTypes);
      const item = makeItem({ itemNo: 2 });
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);

      component.onBloodTypeChange(item, 'A+');

      expect(emittedValue).toEqual({
        itemNo: 2,
        dto: { bloodType: 'A+', bloodTypeDesc: 'A Positive' }
      });
    });

    it('should set bloodTypeDesc to undefined when blood type not found', () => {
      component.bloodTypes.set([]);
      const item = makeItem({ itemNo: 2 });
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);

      component.onBloodTypeChange(item, 'Z-');

      expect(emittedValue).toEqual({
        itemNo: 2,
        dto: { bloodType: 'Z-', bloodTypeDesc: undefined }
      });
    });
  });

  // ── onFieldChange ──

  describe('onFieldChange', () => {
    it('should not emit when value is NaN', fakeAsync(() => {
      let emitted = false;
      component.itemUpdated.subscribe(() => emitted = true);
      component.onFieldChange(makeItem(), 'requiredQty', { target: { value: 'abc' } } as any);
      tick(600);
      expect(emitted).toBeFalse();
    }));

    it('should not emit when value is 0', fakeAsync(() => {
      let emitted = false;
      component.itemUpdated.subscribe(() => emitted = true);
      component.onFieldChange(makeItem(), 'requiredQty', { target: { value: '0' } } as any);
      tick(600);
      expect(emitted).toBeFalse();
    }));

    it('should not emit when value is negative', fakeAsync(() => {
      let emitted = false;
      component.itemUpdated.subscribe(() => emitted = true);
      component.onFieldChange(makeItem(), 'requiredQty', { target: { value: '-1' } } as any);
      tick(600);
      expect(emitted).toBeFalse();
    }));

    it('should debounce and emit update for valid qty', fakeAsync(() => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onFieldChange(makeItem({ itemNo: 10 }), 'requiredQty', { target: { value: '15' } } as any);

      tick(500);
      expect(emittedValue).toEqual({ itemNo: 10, dto: { requiredQty: 15 } });
    }));

    it('should use same debounce subject for same itemNo', fakeAsync(() => {
      const emitted: any[] = [];
      component.itemUpdated.subscribe(v => emitted.push(v));
      const item = makeItem({ itemNo: 10 });

      component.onFieldChange(item, 'requiredQty', { target: { value: '10' } } as any);
      tick(200);
      component.onFieldChange(item, 'requiredQty', { target: { value: '20' } } as any);
      tick(500);

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toEqual({ itemNo: 10, dto: { requiredQty: 20 } });
    }));
  });

  // ── onSubOkChange ──

  describe('onSubOkChange', () => {
    it('should emit itemUpdated with subOk value', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onSubOkChange(makeItem({ itemNo: 3 }), 'Y');

      expect(emittedValue).toEqual({ itemNo: 3, dto: { subOk: 'Y' } });
    });

    it('should emit undefined subOk when value is empty', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onSubOkChange(makeItem({ itemNo: 3 }), '');

      expect(emittedValue).toEqual({ itemNo: 3, dto: { subOk: undefined } });
    });
  });

  // ── onAttribGroupChange ──

  describe('onAttribGroupChange', () => {
    it('should emit itemUpdated with attribGroup and clear attribCode', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onAttribGroupChange(makeItem({ itemNo: 2 }), 'GRP1');

      expect(emittedValue).toEqual({
        itemNo: 2,
        dto: { attribGroup: 'GRP1', attribCode: undefined }
      });
    });

    it('should load attribute codes when value is truthy', () => {
      apiService.getAttributeCodesLookup.calls.reset();
      component.onAttribGroupChange(makeItem(), 'GRP1');

      expect(apiService.getAttributeCodesLookup).toHaveBeenCalledWith('GRP1');
      expect(component.attributeCodes()).toEqual(mockAttributeCodes);
      expect(component.filteredAttributeCodes()).toEqual(mockAttributeCodes);
    });

    it('should not load attribute codes when value is empty', () => {
      apiService.getAttributeCodesLookup.calls.reset();
      component.onAttribGroupChange(makeItem(), '');

      expect(apiService.getAttributeCodesLookup).not.toHaveBeenCalled();
    });

    it('should emit undefined attribGroup when value is empty', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onAttribGroupChange(makeItem({ itemNo: 5 }), '');

      expect(emittedValue).toEqual({
        itemNo: 5,
        dto: { attribGroup: undefined, attribCode: undefined }
      });
    });

    it('should handle error loading attribute codes', () => {
      apiService.getAttributeCodesLookup.and.returnValue(throwError(() => new Error('fail')));
      component.onAttribGroupChange(makeItem(), 'GRP1');
      expect(component.attributeCodes()).toEqual([]);
    });
  });

  // ── onAttribCodeChange ──

  describe('onAttribCodeChange', () => {
    it('should emit itemUpdated with attribCode', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onAttribCodeChange(makeItem({ itemNo: 4 }), 'AC1');

      expect(emittedValue).toEqual({ itemNo: 4, dto: { attribCode: 'AC1' } });
    });

    it('should emit undefined attribCode when value is empty', () => {
      let emittedValue: any = null;
      component.itemUpdated.subscribe(v => emittedValue = v);
      component.onAttribCodeChange(makeItem({ itemNo: 4 }), '');

      expect(emittedValue).toEqual({ itemNo: 4, dto: { attribCode: undefined } });
    });
  });

  // ── onDeleteItem ──

  describe('onDeleteItem', () => {
    it('should emit itemDeleted with the item number', () => {
      let emittedValue: any = null;
      component.itemDeleted.subscribe(v => emittedValue = v);
      component.onDeleteItem(5);
      expect(emittedValue).toBe(5);
    });
  });

  // ── onItemComment ──

  describe('onItemComment', () => {
    it('should return early when index is negative', () => {
      component.onItemComment(-1);
      expect(apiService.getItemNotes).not.toHaveBeenCalled();
    });

    it('should return early when item does not exist at index', () => {
      component.orderItems = [];
      component.onItemComment(0);
      expect(apiService.getItemNotes).not.toHaveBeenCalled();
    });

    it('should return early when orderData has no orderNo', () => {
      component.orderItems = [makeItem()];
      component.orderData = {};
      component.onItemComment(0);
      expect(apiService.getItemNotes).not.toHaveBeenCalled();
    });

    it('should fetch notes, open dialog, and save when result returned', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };
      component.itemComments.set(['']);

      const dialogAfterClosed = new Subject<string>();
      apiService.getItemNotes.and.callFake(() => of({ note: 'existing note' }));
      apiService.saveItemNotes.and.callFake(() => of({ success: true }));
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      expect(apiService.getItemNotes).toHaveBeenCalledWith('25001-0001', 2);
      expect(dialog.open).toHaveBeenCalled();

      dialogAfterClosed.next('new comment');
      dialogAfterClosed.complete();

      expect(apiService.saveItemNotes).toHaveBeenCalledWith('25001-0001', 2, 'new comment');
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Item comment saved successfully');
      expect(component.itemComments()[0]).toBe('new comment');
    });

    it('should not save when dialog returns null', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };

      apiService.getItemNotes.and.callFake(() => of({ note: 'test note' }));
      apiService.saveItemNotes.calls.reset();

      const dialogAfterClosed = new Subject<any>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      dialogAfterClosed.next(null);
      dialogAfterClosed.complete();

      expect(apiService.saveItemNotes).not.toHaveBeenCalled();
    });

    it('should not save when dialog returns undefined', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };

      apiService.getItemNotes.and.callFake(() => of({ note: 'test note' }));
      apiService.saveItemNotes.calls.reset();

      const dialogAfterClosed = new Subject<any>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      dialogAfterClosed.next(undefined);
      dialogAfterClosed.complete();

      expect(apiService.saveItemNotes).not.toHaveBeenCalled();
    });

    it('should show error snackbar when saveItemNotes fails', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };
      component.itemComments.set(['']);

      apiService.getItemNotes.and.callFake(() => of({ note: 'test note' }));
      apiService.saveItemNotes.and.callFake(() => throwError(() => new Error('save failed')));

      const dialogAfterClosed = new Subject<string>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      dialogAfterClosed.next('updated comment');
      dialogAfterClosed.complete();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to save item comment');
      expect(snackbarService.showSuccess).not.toHaveBeenCalled();
    });

    it('should handle getItemNotes returning null noteData', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };

      apiService.getItemNotes.and.callFake(() => of(null));

      const dialogAfterClosed = new Subject<any>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      expect(dialog.open).toHaveBeenCalled();
      const dialogConfig = dialog.open.calls.mostRecent().args[1]!;
      expect(dialogConfig.data).toEqual({ notes: '' });

      dialogAfterClosed.complete();
    });

    it('should handle getItemNotes error gracefully', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };

      apiService.getItemNotes.and.callFake(() => throwError(() => new Error('fetch failed')));

      const dialogAfterClosed = new Subject<any>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      // catchError returns of(null), so dialog should still open with empty note
      expect(dialog.open).toHaveBeenCalled();

      dialogAfterClosed.complete();
    });

    it('should pad itemComments array when index exceeds current length', () => {
      const item = makeItem({ itemNo: 5 });
      component.orderItems = [makeItem({ itemNo: 1 }), makeItem({ itemNo: 2 }), item];
      component.orderData = { orderNo: '25001-0001' };
      component.itemComments.set([]);

      apiService.getItemNotes.and.callFake(() => of({ note: '' }));
      apiService.saveItemNotes.and.callFake(() => of({ success: true }));

      const dialogAfterClosed = new Subject<string>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(2);

      dialogAfterClosed.next('comment at index 2');
      dialogAfterClosed.complete();

      const comments = component.itemComments();
      expect(comments.length).toBe(3);
      expect(comments[0]).toBe('');
      expect(comments[1]).toBe('');
      expect(comments[2]).toBe('comment at index 2');
    });

    it('should save empty string result and update comment', () => {
      const item = makeItem({ itemNo: 2 });
      component.orderItems = [item];
      component.orderData = { orderNo: '25001-0001' };
      component.itemComments.set(['existing']);

      apiService.getItemNotes.and.callFake(() => of({ note: 'existing' }));
      apiService.saveItemNotes.and.callFake(() => of({ success: true }));

      const dialogAfterClosed = new Subject<string>();
      dialog.open.and.callFake(() => ({ afterClosed: () => dialogAfterClosed.asObservable() }) as any);

      component.onItemComment(0);

      // Empty string is a valid result (not null/undefined)
      dialogAfterClosed.next('');
      dialogAfterClosed.complete();

      expect(apiService.saveItemNotes).toHaveBeenCalledWith('25001-0001', 2, '');
      expect(component.itemComments()[0]).toBe('');
    });
  });

  // ── onCancelItem ──

  describe('onCancelItem', () => {
    it('should open confirm dialog and emit itemCanceled when confirmed', () => {
      const afterClosedSubject = new Subject<boolean>();
      dialog.open.and.callFake(() => ({ afterClosed: () => afterClosedSubject.asObservable() }) as any);

      let emittedValue: any = null;
      component.itemCanceled.subscribe(v => emittedValue = v);
      component.onCancelItem(makeItem({ itemNo: 7 }));

      expect(dialog.open).toHaveBeenCalled();

      afterClosedSubject.next(true);
      afterClosedSubject.complete();

      expect(emittedValue).toBe(7);
    });

    it('should not emit itemCanceled when dialog is dismissed', () => {
      const afterClosedSubject = new Subject<boolean>();
      dialog.open.and.callFake(() => ({ afterClosed: () => afterClosedSubject.asObservable() }) as any);

      let emitted = false;
      component.itemCanceled.subscribe(() => emitted = true);
      component.onCancelItem(makeItem({ itemNo: 7 }));

      afterClosedSubject.next(false);
      afterClosedSubject.complete();

      expect(emitted).toBeFalse();
    });

    it('should not emit itemCanceled when dialog returns undefined', () => {
      const afterClosedSubject = new Subject<any>();
      dialog.open.and.callFake(() => ({ afterClosed: () => afterClosedSubject.asObservable() }) as any);

      let emitted = false;
      component.itemCanceled.subscribe(() => emitted = true);
      component.onCancelItem(makeItem({ itemNo: 7 }));

      afterClosedSubject.next(undefined);
      afterClosedSubject.complete();

      expect(emitted).toBeFalse();
    });
  });

  // ── subscribeToSearchFilters ──

  describe('search filter controls', () => {
    it('should filter products by code', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('rbc');
      tick(200);

      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RBC');
    }));

    it('should filter products by description', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('plasma');
      tick(200);

      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('FFP');
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('');
      tick(200);

      expect(component.filteredProducts().length).toBe(3);
    }));

    it('should show all products when search is null', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue(null);
      tick(200);

      expect(component.filteredProducts().length).toBe(3);
    }));

    it('should filter blood types by code', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue('a+');
      tick(200);

      expect(component.filteredBloodTypes().length).toBe(1);
      expect(component.filteredBloodTypes()[0].code).toBe('A+');
    }));

    it('should filter blood types by description', fakeAsync(() => {
      component.bloodTypes.set(mockBloodTypes);
      component.bloodTypeSearchCtrl.setValue('negative');
      tick(200);

      expect(component.filteredBloodTypes().length).toBe(1);
      expect(component.filteredBloodTypes()[0].code).toBe('O-');
    }));

    it('should filter tiers by description', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue('tier 1');
      tick(200);

      expect(component.filteredTiers().length).toBe(1);
      expect(component.filteredTiers()[0].code).toBe('1');
    }));

    it('should filter tiers by code', fakeAsync(() => {
      component.tiers.set(mockTiers);
      component.tierSearchCtrl.setValue('2');
      tick(200);

      expect(component.filteredTiers().length).toBe(1);
      expect(component.filteredTiers()[0].code).toBe('2');
    }));

    it('should filter groups by code', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue('grp1');
      tick(200);

      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].code).toBe('GRP1');
    }));

    it('should filter groups by description', fakeAsync(() => {
      component.groups.set(mockGroups);
      component.groupSearchCtrl.setValue('group 2');
      tick(200);

      expect(component.filteredGroups().length).toBe(1);
      expect(component.filteredGroups()[0].code).toBe('GRP2');
    }));

    it('should filter attribute codes by code', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue('ac1');
      tick(200);

      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('AC1');
    }));

    it('should filter attribute codes by description', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeCodeSearchCtrl.setValue('attr code 2');
      tick(200);

      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].code).toBe('AC2');
    }));

    it('should return empty array when no matches', fakeAsync(() => {
      component.products.set(mockProducts);
      component.productSearchCtrl.setValue('zzzzz');
      tick(200);

      expect(component.filteredProducts().length).toBe(0);
    }));
  });

  // ── Signals initial state ──

  describe('signal initial states', () => {
    it('should have saving as false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should have showNewRow as false', () => {
      expect(component.showNewRow()).toBeFalse();
    });
  });

  // ── componentId uniqueness ──

  describe('componentId', () => {
    it('should have a unique componentId', () => {
      const fixture2 = TestBed.createComponent(CcStepEditProductsComponent);
      fixture2.detectChanges();
      expect((component as any).componentId).not.toBe((fixture2.componentInstance as any).componentId);
    });
  });

  // ── elementId helper ──

  describe('elementId', () => {
    it('should generate element IDs based on componentId', () => {
      const id = (component as any).elementId('test-field');
      expect(id).toContain('cc-step-edit-products-');
      expect(id).toContain('-test-field');
    });
  });
});
