import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { StepAddProductsComponent } from './step-add-products';
import { RegularOrderApiService } from '../services/regular-order-api.service';
import { EnterCommentsDialogComponent } from '../dialogs/enter-comments-dialog/enter-comments-dialog';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { OrderItemDto, LookupItem, InventoryStockCheckResult } from '../models/regular-order.model';

describe('StepAddProductsComponent', () => {
  let component: StepAddProductsComponent;
  let fixture: ComponentFixture<StepAddProductsComponent>;
  let apiService: jasmine.SpyObj<RegularOrderApiService>;

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
    { code: '1', description: 'Tier 1 - 0-3 days ($150)', unitPrice: 150 },
    { code: '2', description: 'Tier 2 - 4-7 days ($120)', unitPrice: 120 }
  ];

  const mockGroups: LookupItem[] = [
    { code: 'AG1', description: 'Antigen Group 1' },
    { code: 'AG2', description: 'Antigen Group 2' }
  ];

  const mockAttributeCodes: LookupItem[] = [
    { code: 'CMV', description: 'CMV Negative' },
    { code: 'IRR', description: 'Irradiated' }
  ];

  const mockOrderItem: OrderItemDto = {
    orderNo: '25001-0001',
    itemNo: 1,
    productType: 'RBC',
    productTypeDesc: 'Red Blood Cells',
    bloodType: 'A+',
    bloodTypeDesc: 'A Positive',
    tier: 1,
    requiredQty: 5,
    unitPrice: 150,
    itemStatus: 'OR',
    allocatedQty: 0,
    shippedQty: 0,
    subOk: 'Y',
    attribGroup: 'AG1',
    attribCode: 'CMV',
    attribDesc: 'CMV Negative'
  };

  /** Helper: sets form values for a valid new item, setting productType first to allow the watcher to fire. */
  function setValidFormValues(overrides: Record<string, any> = {}): void {
    const defaults: Record<string, any> = {
      productType: 'RBC',
      bloodType: 'A+',
      requiredQty: 5,
      tier: '1',
      specialFlag: 'Y',
      group: '',
      attributeCode: ''
    };
    const values = { ...defaults, ...overrides };

    // Set productType first so the watcher fires and resets bloodType/tier.
    // After the watcher fires, the API mocks set bloodTypes/tiers signals.
    component.newItemForm.get('productType')!.setValue(values.productType);

    // Then set remaining values.
    component.newItemForm.patchValue({
      bloodType: values.bloodType,
      requiredQty: values.requiredQty,
      tier: values.tier,
      specialFlag: values.specialFlag,
      group: values.group,
      attributeCode: values.attributeCode
    });
  }

  /** Helper: returns the component's private dialog instance and spies on open. */
  function spyOnDialog(): jasmine.Spy {
    const dialogInstance = (component as any).dialog;
    return spyOn(dialogInstance, 'open');
  }

  beforeEach(() => {
    apiService = jasmine.createSpyObj('RegularOrderApiService', [
      'getProductTypesLookup',
      'getBloodTypesLookup',
      'getTiersLookup',
      'getAttributeGroupsLookup',
      'getAttributeCodesLookup',
      'checkInventoryStock'
    ]);

    apiService.getProductTypesLookup.and.returnValue(of(mockProducts));
    apiService.getAttributeGroupsLookup.and.returnValue(of(mockGroups));
    apiService.getBloodTypesLookup.and.returnValue(of(mockBloodTypes));
    apiService.getTiersLookup.and.returnValue(of(mockTiers));
    apiService.getAttributeCodesLookup.and.returnValue(of(mockAttributeCodes));
    apiService.checkInventoryStock.and.returnValue(of(null));

    TestBed.configureTestingModule({
      imports: [
        StepAddProductsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: RegularOrderApiService, useValue: apiService }
      ]
    });

    fixture = TestBed.createComponent(StepAddProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation & Initialization ──

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize newItemForm with correct controls and validators', () => {
    expect(component.newItemForm).toBeTruthy();
    expect(component.newItemForm.get('productType')).toBeTruthy();
    expect(component.newItemForm.get('bloodType')).toBeTruthy();
    expect(component.newItemForm.get('requiredQty')).toBeTruthy();
    expect(component.newItemForm.get('specialFlag')).toBeTruthy();
    expect(component.newItemForm.get('tier')).toBeTruthy();
    expect(component.newItemForm.get('group')).toBeTruthy();
    expect(component.newItemForm.get('attributeCode')).toBeTruthy();
  });

  it('should require productType, bloodType, requiredQty, and tier', () => {
    const form = component.newItemForm;
    form.patchValue({ productType: '', bloodType: '', requiredQty: null, tier: '' });
    expect(form.get('productType')!.hasError('required')).toBe(true);
    expect(form.get('bloodType')!.hasError('required')).toBe(true);
    expect(form.get('requiredQty')!.hasError('required')).toBe(true);
    expect(form.get('tier')!.hasError('required')).toBe(true);
  });

  it('should validate requiredQty minimum value of 1', () => {
    component.newItemForm.get('requiredQty')!.setValue(0);
    expect(component.newItemForm.get('requiredQty')!.hasError('min')).toBe(true);

    component.newItemForm.get('requiredQty')!.setValue(-1);
    expect(component.newItemForm.get('requiredQty')!.hasError('min')).toBe(true);

    component.newItemForm.get('requiredQty')!.setValue(1);
    expect(component.newItemForm.get('requiredQty')!.hasError('min')).toBe(false);
  });

  it('should not require specialFlag, group, or attributeCode', () => {
    const form = component.newItemForm;
    form.patchValue({ specialFlag: '', group: '', attributeCode: '' });
    expect(form.get('specialFlag')!.valid).toBe(true);
    expect(form.get('group')!.valid).toBe(true);
    expect(form.get('attributeCode')!.valid).toBe(true);
  });

  it('should set showNewRow to true initially', () => {
    expect(component.showNewRow()).toBe(true);
  });

  it('should set saving to false initially', () => {
    expect(component.saving()).toBe(false);
  });

  it('should initialize itemComments as empty array', () => {
    expect(component.itemComments()).toEqual([]);
  });

  // ── Lookup loading on init ──

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

  it('should handle product types lookup error gracefully', () => {
    apiService.getProductTypesLookup.and.returnValue(throwError(() => new Error('API error')));

    const fixture2 = TestBed.createComponent(StepAddProductsComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.products()).toEqual([]);
    expect(component2.filteredProducts()).toEqual([]);
  });

  it('should handle attribute groups lookup error gracefully', () => {
    apiService.getAttributeGroupsLookup.and.returnValue(throwError(() => new Error('API error')));

    const fixture2 = TestBed.createComponent(StepAddProductsComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.groups()).toEqual([]);
    expect(component2.filteredGroups()).toEqual([]);
  });

  // ── watchProductTypeChanges ──

  it('should load blood types and tiers when productType changes', () => {
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
    // Tier is auto-selected to '1' when tiers load (Gap #16)
    expect(component.newItemForm.get('tier')!.value).toBe('1');
  });

  it('should clear blood types and tiers when productType is set to empty', () => {
    component.newItemForm.get('productType')!.setValue('RBC');
    expect(component.bloodTypes().length).toBeGreaterThan(0);

    component.newItemForm.get('productType')!.setValue('');

    expect(component.bloodTypes()).toEqual([]);
    expect(component.filteredBloodTypes()).toEqual([]);
    expect(component.tiers()).toEqual([]);
    expect(component.filteredTiers()).toEqual([]);
  });

  it('should handle blood types lookup error on product type change', () => {
    apiService.getBloodTypesLookup.and.returnValue(throwError(() => new Error('API error')));
    component.newItemForm.get('productType')!.setValue('RBC');
    expect(component.bloodTypes()).toEqual([]);
  });

  it('should handle tiers lookup error on product type change', () => {
    apiService.getTiersLookup.and.returnValue(throwError(() => new Error('API error')));
    component.newItemForm.get('productType')!.setValue('RBC');
    expect(component.tiers()).toEqual([]);
  });

  // ── watchGroupChanges ──

  it('should load attribute codes when group changes', () => {
    component.newItemForm.get('group')!.setValue('AG1');

    expect(apiService.getAttributeCodesLookup).toHaveBeenCalledWith('AG1');
    expect(component.attributeCodes()).toEqual(mockAttributeCodes);
    expect(component.filteredAttributeCodes()).toEqual(mockAttributeCodes);
  });

  it('should reset attributeCode when group changes', () => {
    component.newItemForm.patchValue({ attributeCode: 'CMV' });
    component.newItemForm.get('group')!.setValue('AG2');

    expect(component.newItemForm.get('attributeCode')!.value).toBe('');
  });

  it('should clear attribute codes when group is set to empty', () => {
    component.newItemForm.get('group')!.setValue('AG1');
    expect(component.attributeCodes().length).toBeGreaterThan(0);

    component.newItemForm.get('group')!.setValue('');

    expect(component.attributeCodes()).toEqual([]);
    expect(component.filteredAttributeCodes()).toEqual([]);
  });

  it('should handle attribute codes lookup error on group change', () => {
    apiService.getAttributeCodesLookup.and.returnValue(throwError(() => new Error('API error')));
    component.newItemForm.get('group')!.setValue('AG1');
    expect(component.attributeCodes()).toEqual([]);
  });

  // ── watchRequiredQtyChanges (inventory stock check) ──

  it('should check inventory stock when requiredQty, productType, and bloodType are set', fakeAsync(() => {
    const stockResult: InventoryStockCheckResult = {
      currentStock: 10,
      minimal: 5,
      optimal: 20,
      requiredQty: 15,
      warningLevel: 'belowOptimal',
      warningMessage: 'Below optimal stock level'
    };
    apiService.checkInventoryStock.and.returnValue(of(stockResult));

    const dialogOpenSpy = spyOnDialog();

    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(15);

    tick(500);

    expect(apiService.checkInventoryStock).toHaveBeenCalledWith('RBC', 'A+', 15);
    expect(dialogOpenSpy).toHaveBeenCalledWith(ConfirmActionDialogComponent, jasmine.objectContaining({
      width: '420px',
      disableClose: true,
      data: jasmine.objectContaining({
        title: 'Inventory Warning',
        message: 'Below optimal stock level'
      })
    }));

    discardPeriodicTasks();
  }));

  it('should not open dialog when warning level is none', fakeAsync(() => {
    const stockResult: InventoryStockCheckResult = {
      currentStock: 100,
      minimal: 5,
      optimal: 20,
      requiredQty: 2,
      warningLevel: 'none',
      warningMessage: ''
    };
    apiService.checkInventoryStock.and.returnValue(of(stockResult));

    const dialogOpenSpy = spyOnDialog();

    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(2);

    tick(500);

    expect(dialogOpenSpy).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should not check inventory when requiredQty is 0 or negative', fakeAsync(() => {
    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(0);

    tick(500);

    expect(apiService.checkInventoryStock).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should not check inventory when productType is empty', fakeAsync(() => {
    component.newItemForm.get('productType')!.setValue('');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(5);

    tick(500);

    expect(apiService.checkInventoryStock).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should not check inventory when bloodType is empty', fakeAsync(() => {
    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('');
    component.newItemForm.get('requiredQty')!.setValue(5);

    tick(500);

    expect(apiService.checkInventoryStock).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should handle inventory stock check API error gracefully', fakeAsync(() => {
    apiService.checkInventoryStock.and.returnValue(throwError(() => new Error('API error')));

    const dialogOpenSpy = spyOnDialog();

    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(5);

    tick(500);

    expect(dialogOpenSpy).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should not open dialog when stock check result is null', fakeAsync(() => {
    apiService.checkInventoryStock.and.returnValue(of(null));

    const dialogOpenSpy = spyOnDialog();

    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(5);

    tick(500);

    expect(dialogOpenSpy).not.toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  // ── nextItemNumber ──

  it('should return 1 when orderItems is empty', () => {
    component.orderItems = [];
    expect(component.nextItemNumber).toBe(1);
  });

  it('should return max item number + 1', () => {
    component.orderItems = [
      { ...mockOrderItem, itemNo: 1 },
      { ...mockOrderItem, itemNo: 3 },
      { ...mockOrderItem, itemNo: 2 }
    ];
    expect(component.nextItemNumber).toBe(4);
  });

  it('should handle single item in orderItems', () => {
    component.orderItems = [{ ...mockOrderItem, itemNo: 5 }];
    expect(component.nextItemNumber).toBe(6);
  });

  // ── getItemStatus ──

  it('should return "Ordered" for status code "OR"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'OR' })).toBe('Ordered');
  });

  it('should return "Canceled" for status code "CA"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'CA' })).toBe('Canceled');
  });

  it('should return "Shipped" for status code "SH"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'SH' })).toBe('Shipped');
  });

  it('should return "Hold" for status code "HO"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'HO' })).toBe('Hold');
  });

  it('should return "Allocated" for status code "AL"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'AL' })).toBe('Allocated');
  });

  it('should return "Packed" for status code "PK"', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'PK' })).toBe('Packed');
  });

  it('should default to "Ordered" when itemStatus is falsy', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: '' })).toBe('Ordered');
  });

  it('should return the raw code for unknown status codes', () => {
    expect(component.getItemStatus({ ...mockOrderItem, itemStatus: 'XX' })).toBe('XX');
  });

  // ── getItemCost ──

  it('should calculate cost as unitPrice * requiredQty', () => {
    expect(component.getItemCost({ ...mockOrderItem, unitPrice: 150, requiredQty: 5 })).toBe('750.00');
  });

  it('should return "--" when unitPrice is null', () => {
    expect(component.getItemCost({ ...mockOrderItem, unitPrice: undefined, requiredQty: 5 })).toBe('--');
  });

  it('should return "--" when requiredQty is 0', () => {
    expect(component.getItemCost({ ...mockOrderItem, unitPrice: 150, requiredQty: 0 })).toBe('--');
  });

  it('should handle unitPrice of 0 with valid requiredQty', () => {
    expect(component.getItemCost({ ...mockOrderItem, unitPrice: 0, requiredQty: 5 })).toBe('0.00');
  });

  // ── getItemBloodType ──

  it('should return the blood type code', () => {
    expect(component.getItemBloodType({ ...mockOrderItem, bloodType: 'A+' })).toBe('A+');
  });

  it('should return "--" when bloodType is empty', () => {
    expect(component.getItemBloodType({ ...mockOrderItem, bloodType: '' })).toBe('--');
  });

  // ── getItemBloodTypeDisplay ──

  it('should return bloodTypeDesc when both bloodType and bloodTypeDesc exist', () => {
    expect(component.getItemBloodTypeDisplay({ ...mockOrderItem, bloodType: 'A+', bloodTypeDesc: 'A Positive' })).toBe('A Positive');
  });

  it('should return bloodType when bloodTypeDesc is missing', () => {
    expect(component.getItemBloodTypeDisplay({ ...mockOrderItem, bloodType: 'A+', bloodTypeDesc: undefined })).toBe('A+');
  });

  it('should return "--" when bloodType is empty for display', () => {
    expect(component.getItemBloodTypeDisplay({ ...mockOrderItem, bloodType: '' })).toBe('--');
  });

  // ── onAddItem ──

  it('should not emit when form is invalid', () => {
    spyOn(component.itemAdded, 'emit');
    component.newItemForm.patchValue({ productType: '', bloodType: '', requiredQty: null, tier: '' });
    component.onAddItem();
    expect(component.itemAdded.emit).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    spyOn(component.newItemForm, 'markAllAsTouched');
    component.newItemForm.patchValue({ productType: '', bloodType: '', requiredQty: null, tier: '' });
    component.onAddItem();
    expect(component.newItemForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should not emit when tier is 0 or negative', () => {
    spyOn(component.itemAdded, 'emit');

    setValidFormValues({ tier: '0' });
    component.onAddItem();
    expect(component.itemAdded.emit).not.toHaveBeenCalled();
    expect(component.newItemForm.get('tier')!.hasError('required')).toBe(true);
  });

  it('should emit itemAdded with correct data when form is valid', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({
      specialFlag: 'Y',
      group: 'AG1',
      attributeCode: 'CMV'
    });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      itemNo: 1,
      productType: 'RBC',
      bloodType: 'A+',
      bloodTypeDesc: 'A Positive',
      tier: 1,
      requiredQty: 5,
      unitPrice: 150,
      subOk: 'Y',
      attribGroup: 'AG1',
      attribCode: 'CMV'
    }));
  });

  it('should set unitPrice from selected tier', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({ tier: '2', requiredQty: 3 });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      unitPrice: 120
    }));
  });

  it('should set unitPrice to 0 when tier is not found in tiers list', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({ tier: '99', requiredQty: 3 });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      unitPrice: 0
    }));
  });

  it('should append an empty string to itemComments on successful add', () => {
    component.orderItems = [];
    setValidFormValues();

    component.onAddItem();

    expect(component.itemComments()).toEqual(['']);
  });

  it('should reset form after successful add', () => {
    component.orderItems = [];
    setValidFormValues();

    const resetSpy = spyOn(component.newItemForm, 'reset');
    component.onAddItem();

    expect(resetSpy).toHaveBeenCalled();
  });

  it('should set subOk to undefined when specialFlag is empty', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({ specialFlag: '' });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      subOk: undefined
    }));
  });

  it('should set attribGroup and attribCode to undefined when group and attributeCode are empty', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({ group: '', attributeCode: '' });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      attribGroup: undefined,
      attribCode: undefined
    }));
  });

  // ── onAddNewProducts ──

  it('should add the current item if showNewRow is true, form is dirty and valid', () => {
    spyOn(component, 'onAddItem');
    component.showNewRow.set(true);

    setValidFormValues();
    component.newItemForm.markAsDirty();

    component.onAddNewProducts();

    expect(component.onAddItem).toHaveBeenCalled();
    expect(component.showNewRow()).toBe(true);
  });

  it('should not add item if showNewRow is false', () => {
    spyOn(component, 'onAddItem');
    component.showNewRow.set(false);

    setValidFormValues();
    component.newItemForm.markAsDirty();

    component.onAddNewProducts();

    expect(component.onAddItem).not.toHaveBeenCalled();
  });

  it('should not add item if form is pristine', () => {
    spyOn(component, 'onAddItem');
    component.showNewRow.set(true);

    setValidFormValues();
    component.newItemForm.markAsPristine();

    component.onAddNewProducts();

    expect(component.onAddItem).not.toHaveBeenCalled();
  });

  it('should not add item if form is invalid', () => {
    spyOn(component, 'onAddItem');
    component.showNewRow.set(true);
    component.newItemForm.patchValue({ productType: '' });
    component.newItemForm.markAsDirty();

    component.onAddNewProducts();

    expect(component.onAddItem).not.toHaveBeenCalled();
  });

  it('should always set showNewRow to true', () => {
    component.showNewRow.set(false);
    component.onAddNewProducts();
    expect(component.showNewRow()).toBe(true);
  });

  it('should always reset form', () => {
    spyOn(component.newItemForm, 'reset');
    component.onAddNewProducts();
    expect(component.newItemForm.reset).toHaveBeenCalled();
  });

  // ── onItemComment ──

  it('should open comments dialog with correct data', () => {
    component.itemComments.set(['First comment', 'Second comment']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    const dialogOpenSpy = spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(0);

    expect(dialogOpenSpy).toHaveBeenCalledWith(EnterCommentsDialogComponent, jasmine.objectContaining({
      width: '500px',
      height: '100vh',
      panelClass: 'right-panel-dialog',
      data: { notes: 'First comment' }
    }));

    afterClosedSubject.next(null);
    afterClosedSubject.complete();
  });

  it('should use empty string for comment when index has no comment', () => {
    component.itemComments.set([]);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    const dialogOpenSpy = spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(0);

    expect(dialogOpenSpy).toHaveBeenCalledWith(EnterCommentsDialogComponent, jasmine.objectContaining({
      data: { notes: '' }
    }));

    afterClosedSubject.next(null);
    afterClosedSubject.complete();
  });

  it('should update comment when dialog returns a result', () => {
    component.itemComments.set(['Old comment', '']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(0);
    afterClosedSubject.next('Updated comment');
    afterClosedSubject.complete();

    expect(component.itemComments()[0]).toBe('Updated comment');
  });

  it('should not update comment when dialog returns null', () => {
    component.itemComments.set(['Existing comment']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(0);
    afterClosedSubject.next(null);
    afterClosedSubject.complete();

    expect(component.itemComments()[0]).toBe('Existing comment');
  });

  it('should not update comment when dialog returns undefined', () => {
    component.itemComments.set(['Existing comment']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(0);
    afterClosedSubject.next(undefined);
    afterClosedSubject.complete();

    expect(component.itemComments()[0]).toBe('Existing comment');
  });

  it('should use empty string for new item comment (index -1)', () => {
    component.itemComments.set(['Some comment']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    const dialogOpenSpy = spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(-1);

    expect(dialogOpenSpy).toHaveBeenCalledWith(EnterCommentsDialogComponent, jasmine.objectContaining({
      data: { notes: '' }
    }));

    afterClosedSubject.next(null);
    afterClosedSubject.complete();
  });

  it('should not update comments when index is negative and dialog returns result', () => {
    component.itemComments.set(['Existing comment']);

    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() } as MatDialogRef<any>;
    spyOnDialog().and.returnValue(mockDialogRef);

    component.onItemComment(-1);
    afterClosedSubject.next('New comment');
    afterClosedSubject.complete();

    // Comments should remain unchanged since index is negative
    expect(component.itemComments()).toEqual(['Existing comment']);
  });

  // ── onDeleteItem ──

  it('should emit itemDeleted with the item number', () => {
    spyOn(component.itemDeleted, 'emit');
    component.onDeleteItem(3);
    expect(component.itemDeleted.emit).toHaveBeenCalledWith(3);
  });

  // ── Search filter subscriptions ──

  it('should filter products by code when search term is entered', fakeAsync(() => {
    component.products.set(mockProducts);
    component.productSearchCtrl.setValue('rbc');
    tick(200);
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].code).toBe('RBC');
    discardPeriodicTasks();
  }));

  it('should filter products by description', fakeAsync(() => {
    component.products.set(mockProducts);
    component.productSearchCtrl.setValue('platelet');
    tick(200);
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].code).toBe('PLT');
    discardPeriodicTasks();
  }));

  it('should show all products when search term is empty', fakeAsync(() => {
    component.products.set(mockProducts);
    component.productSearchCtrl.setValue('');
    tick(200);
    expect(component.filteredProducts().length).toBe(3);
    discardPeriodicTasks();
  }));

  it('should filter blood types by code', fakeAsync(() => {
    component.bloodTypes.set(mockBloodTypes);
    component.bloodTypeSearchCtrl.setValue('a+');
    tick(200);
    expect(component.filteredBloodTypes().length).toBe(1);
    expect(component.filteredBloodTypes()[0].code).toBe('A+');
    discardPeriodicTasks();
  }));

  it('should filter blood types by description', fakeAsync(() => {
    component.bloodTypes.set(mockBloodTypes);
    component.bloodTypeSearchCtrl.setValue('negative');
    tick(200);
    expect(component.filteredBloodTypes().length).toBe(1);
    expect(component.filteredBloodTypes()[0].code).toBe('O-');
    discardPeriodicTasks();
  }));

  it('should filter tiers by search term', fakeAsync(() => {
    component.tiers.set(mockTiers);
    component.tierSearchCtrl.setValue('tier 1');
    tick(200);
    expect(component.filteredTiers().length).toBe(1);
    expect(component.filteredTiers()[0].code).toBe('1');
    discardPeriodicTasks();
  }));

  it('should filter groups by code', fakeAsync(() => {
    component.groups.set(mockGroups);
    component.groupSearchCtrl.setValue('ag1');
    tick(200);
    expect(component.filteredGroups().length).toBe(1);
    expect(component.filteredGroups()[0].code).toBe('AG1');
    discardPeriodicTasks();
  }));

  it('should filter attribute codes by description', fakeAsync(() => {
    component.attributeCodes.set(mockAttributeCodes);
    component.attributeCodeSearchCtrl.setValue('irradiated');
    tick(200);
    expect(component.filteredAttributeCodes().length).toBe(1);
    expect(component.filteredAttributeCodes()[0].code).toBe('IRR');
    discardPeriodicTasks();
  }));

  it('should show all attribute codes when search is null', fakeAsync(() => {
    component.attributeCodes.set(mockAttributeCodes);
    component.attributeCodeSearchCtrl.setValue(null);
    tick(200);
    expect(component.filteredAttributeCodes().length).toBe(2);
    discardPeriodicTasks();
  }));

  it('should return empty when no products match search', fakeAsync(() => {
    component.products.set(mockProducts);
    component.productSearchCtrl.setValue('XYZ_NO_MATCH');
    tick(200);
    expect(component.filteredProducts().length).toBe(0);
    discardPeriodicTasks();
  }));

  // ── f getter ──

  it('should return form controls via f getter', () => {
    expect(component.f).toBe(component.newItemForm.controls);
  });

  // ── elementId helper ──

  it('should generate element IDs with component prefix', () => {
    const id = (component as any).elementId('productType');
    expect(id).toContain('step-add-products-');
    expect(id).toContain('-productType');
  });

  // ── ngOnDestroy ──

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ── Inputs and Outputs ──

  it('should have orderData input defaulting to null', () => {
    expect(component.orderData).toBeNull();
  });

  it('should have orderItems input defaulting to empty array', () => {
    expect(component.orderItems).toEqual([]);
  });

  it('should have itemAdded output', () => {
    expect(component.itemAdded).toBeTruthy();
  });

  it('should have itemAddedExtra output', () => {
    expect(component.itemAddedExtra).toBeTruthy();
  });

  it('should have itemDeleted output', () => {
    expect(component.itemDeleted).toBeTruthy();
  });

  it('should have commentRequested output', () => {
    expect(component.commentRequested).toBeTruthy();
  });

  // ── Edge case: bloodTypeDesc lookup ──

  it('should set bloodTypeDesc from bloodTypes lookup when matching', () => {
    spyOn(component.itemAdded, 'emit');
    component.orderItems = [];
    setValidFormValues({ bloodType: 'O-' });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      bloodTypeDesc: 'O Negative'
    }));
  });

  it('should set bloodTypeDesc to undefined when bloodType not found in lookup', () => {
    spyOn(component.itemAdded, 'emit');
    component.bloodTypes.set([]);
    component.orderItems = [];
    setValidFormValues({ bloodType: 'AB-' });

    component.onAddItem();

    expect(component.itemAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      bloodTypeDesc: undefined
    }));
  });

  // ── Inventory warning dialog detail text ──

  it('should include current stock, minimal, and optimal in warning dialog detail', fakeAsync(() => {
    const stockResult: InventoryStockCheckResult = {
      currentStock: 8,
      minimal: 10,
      optimal: 25,
      requiredQty: 15,
      warningLevel: 'belowMinimal',
      warningMessage: 'Stock below minimal'
    };
    apiService.checkInventoryStock.and.returnValue(of(stockResult));

    const dialogOpenSpy = spyOnDialog();

    component.newItemForm.get('productType')!.setValue('RBC');
    component.newItemForm.get('bloodType')!.setValue('A+');
    component.newItemForm.get('requiredQty')!.setValue(15);

    tick(500);

    expect(dialogOpenSpy).toHaveBeenCalledWith(ConfirmActionDialogComponent, jasmine.objectContaining({
      data: jasmine.objectContaining({
        detail: 'Current Stock: 8 | Minimal: 10 | Optimal: 25',
        confirmText: 'OK'
      })
    }));

    discardPeriodicTasks();
  }));

  // ── Search filter with items that have null code or description ──

  it('should handle products with null code in search filter', fakeAsync(() => {
    component.products.set([
      { code: null as any, description: 'Test' },
      { code: 'RBC', description: null as any }
    ]);
    component.productSearchCtrl.setValue('test');
    tick(200);
    expect(component.filteredProducts().length).toBe(1);
    discardPeriodicTasks();
  }));

  it('should handle tiers search with null values', fakeAsync(() => {
    component.tiers.set([
      { code: null as any, description: null as any, unitPrice: 100 }
    ]);
    component.tierSearchCtrl.setValue('test');
    tick(200);
    expect(component.filteredTiers().length).toBe(0);
    discardPeriodicTasks();
  }));

  it('should handle groups search with null values', fakeAsync(() => {
    component.groups.set([
      { code: null as any, description: 'Group desc' }
    ]);
    component.groupSearchCtrl.setValue('group');
    tick(200);
    expect(component.filteredGroups().length).toBe(1);
    discardPeriodicTasks();
  }));

  // ── Gap #3: positiveIntegerValidator for requiredQty ──

  it('should use positiveIntegerValidator for requiredQty', () => {
    const control = component.newItemForm.get('requiredQty')!;
    control.setValue(1.5);
    expect(control.hasError('notInteger')).toBe(true);
  });

  it('should reject decimal quantity values', () => {
    const control = component.newItemForm.get('requiredQty')!;
    control.setValue(2.5);
    expect(control.valid).toBe(false);
    expect(control.hasError('notInteger')).toBe(true);
  });

  it('should reject quantity greater than 999', () => {
    const control = component.newItemForm.get('requiredQty')!;
    control.setValue(1000);
    expect(control.valid).toBe(false);
    expect(control.hasError('outOfRange')).toBe(true);
  });

  it('should reject quantity of 0', () => {
    const control = component.newItemForm.get('requiredQty')!;
    control.setValue(0);
    expect(control.valid).toBe(false);
    expect(control.hasError('outOfRange')).toBe(true);
  });

  it('should accept valid integer quantities (1-999)', () => {
    const control = component.newItemForm.get('requiredQty')!;
    control.setValue(1);
    expect(control.valid).toBe(true);
    control.setValue(500);
    expect(control.valid).toBe(true);
    control.setValue(999);
    expect(control.valid).toBe(true);
  });

  // ── Gap #1: customerId pass-through to getProductTypesLookup ──

  it('should pass customerId to getProductTypesLookup', () => {
    apiService.getProductTypesLookup.calls.reset();
    component.customerId = 'CUST-001';
    component.ngOnChanges({
      customerId: { currentValue: 'CUST-001', previousValue: '', firstChange: false, isFirstChange: () => false } as any
    });
    expect(apiService.getProductTypesLookup).toHaveBeenCalledWith('CUST-001', '');
  });

  it('should reload products when customerId changes (ngOnChanges)', () => {
    apiService.getProductTypesLookup.calls.reset();
    const newProducts = [{ code: 'WB', description: 'Whole Blood' }];
    apiService.getProductTypesLookup.and.returnValue(of(newProducts));

    component.customerId = 'CUST-002';
    component.consigneeId = 'CON-001';
    component.ngOnChanges({
      customerId: { currentValue: 'CUST-002', previousValue: 'CUST-001', firstChange: false, isFirstChange: () => false } as any
    });

    expect(apiService.getProductTypesLookup).toHaveBeenCalledWith('CUST-002', 'CON-001');
    expect(component.products()).toEqual(newProducts);
  });

  // ── Gap #4: contractSubstituteFlag ──

  it('should default specialFlag from contractSubstituteFlag', () => {
    component.contractSubstituteFlag = 'Y';
    component.showNewRow.set(false);
    component.onAddNewProducts();
    expect(component.newItemForm.get('specialFlag')!.value).toBe('Y');
  });

  it('should reset specialFlag to contractSubstituteFlag after adding item', () => {
    component.contractSubstituteFlag = 'N';
    component.orderItems = [];
    setValidFormValues({ specialFlag: 'Y' });

    component.onAddItem();

    expect(component.newItemForm.get('specialFlag')!.value).toBe('N');
  });

  // ── Gap #16: Auto-select tier 1 ──

  it('should auto-select tier 1 when tiers load', () => {
    apiService.getTiersLookup.and.returnValue(of(mockTiers));
    component.newItemForm.get('productType')!.setValue('RBC');
    expect(component.newItemForm.get('tier')!.value).toBe('1');
  });
});
