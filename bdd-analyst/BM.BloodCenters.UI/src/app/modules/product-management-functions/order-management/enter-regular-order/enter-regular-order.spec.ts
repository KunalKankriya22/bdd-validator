import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EnterRegularOrderComponent } from './enter-regular-order';
import { RegularOrderApiService } from './services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError, Subject } from 'rxjs';

describe('EnterRegularOrderComponent', () => {
  let apiSpy: any;
  let component: EnterRegularOrderComponent;
  let fixture: ComponentFixture<EnterRegularOrderComponent>;
  let apiService: jasmine.SpyObj<RegularOrderApiService>;

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'createOrder', 'addOrderItem', 'deleteOrderItem', 'getOpenOrderItems',
      'getProductTypesLookup', 'getOrderCharges', 'getOrderNotes', 'saveOrderNotes',
      'updateOrder', 'getCustomersLookup', 'getOrderModesLookup', 'getOrderClassesLookup',
      'getCustomerById', 'getConsignees', 'getContacts', 'getContracts',
      'getBloodTypesLookup', 'getTiersLookup', 'getAttributeGroupsLookup',
      'getAttributeCodesLookup', 'getChargeCodesLookup', 'getSalutationsLookup',
      'getContactTypes', 'addOrderCharge', 'deleteOrderCharge',
      'getInventorySummary', 'getInventoryTiers', 'deleteOrder', 'getOrder',
      'getOrderItems', 'getOpenOrders', 'getStandingOrderItems'
    ]);
    apiSpy.getCustomersLookup.and.returnValue(of([]));
    apiSpy.getOrderModesLookup.and.returnValue(of([]));
    apiSpy.getOrderClassesLookup.and.returnValue(of([]));
    apiSpy.getProductTypesLookup.and.returnValue(of([]));
    apiSpy.getAttributeGroupsLookup.and.returnValue(of([]));
    apiSpy.getContracts.and.returnValue(of([]));
    apiSpy.getStandingOrderItems.and.returnValue(of([]));
    apiSpy.deleteOrder.and.returnValue(of(true));



      TestBed.configureTestingModule({
      imports: [
        EnterRegularOrderComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        { provide: RegularOrderApiService, useValue: apiSpy }
      ]
    });


    


      apiSpy.createOrder.calls.reset();


      apiSpy.addOrderItem.calls.reset();


      apiSpy.deleteOrderItem.calls.reset();


      apiSpy.getOpenOrderItems.calls.reset();


      apiSpy.getProductTypesLookup.calls.reset();


      apiSpy.getOrderCharges.calls.reset();


      apiSpy.getOrderNotes.calls.reset();


      apiSpy.saveOrderNotes.calls.reset();


      apiSpy.updateOrder.calls.reset();


      apiSpy.getCustomersLookup.calls.reset();


      apiSpy.getOrderModesLookup.calls.reset();


      apiSpy.getOrderClassesLookup.calls.reset();


      apiSpy.getCustomerById.calls.reset();


      apiSpy.getConsignees.calls.reset();


      apiSpy.getContacts.calls.reset();


      apiSpy.getContracts.calls.reset();


      apiSpy.getBloodTypesLookup.calls.reset();


      apiSpy.getTiersLookup.calls.reset();


      apiSpy.getAttributeGroupsLookup.calls.reset();


      apiSpy.getAttributeCodesLookup.calls.reset();


      apiSpy.getChargeCodesLookup.calls.reset();


      apiSpy.getSalutationsLookup.calls.reset();


      apiSpy.getContactTypes.calls.reset();


      apiSpy.addOrderCharge.calls.reset();


      apiSpy.deleteOrderCharge.calls.reset();


      apiSpy.getInventorySummary.calls.reset();


      apiSpy.getInventoryTiers.calls.reset();


      apiSpy.deleteOrder.calls.reset();


      apiSpy.getOrder.calls.reset();


      apiSpy.getOrderItems.calls.reset();


      apiSpy.getOpenOrders.calls.reset();


      apiSpy.getStandingOrderItems.calls.reset();


      apiSpy.getCustomersLookup.and.returnValue(of([]));


      apiSpy.getOrderModesLookup.and.returnValue(of([]));


      apiSpy.getOrderClassesLookup.and.returnValue(of([]));


      apiSpy.getProductTypesLookup.and.returnValue(of([]));


      apiSpy.getAttributeGroupsLookup.and.returnValue(of([]));


      apiSpy.getContracts.and.returnValue(of([]));


      apiSpy.getStandingOrderItems.and.returnValue(of([]));


      apiSpy.deleteOrder.and.returnValue(of(true));

    fixture = TestBed.createComponent(EnterRegularOrderComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(RegularOrderApiService) as jasmine.SpyObj<RegularOrderApiService>;
    fixture.detectChanges();


    });


  it('should initialize at step 1', () => {
    expect(component.currentStep()).toBe(1);
  });





  it('should not allow step 2 when step 1 is invalid', () => {
    component.isStep1Valid.set(false);
    component.goToStep2();
    expect(component.currentStep()).toBe(1);
  });

  it('should go to step 2 when order already has orderNo', () => {
    component.isStep1Valid.set(true);
    component.orderData.set({ orderNo: '25001-0001', customerId: 'TEST' });
    component.goToStep2();
    expect(component.currentStep()).toBe(2);
  });

  it('should go back to step 1', () => {
    component.currentStep.set(2);
    component.goToStep1();
    expect(component.currentStep()).toBe(1);
  });

  it('should reset form on resetForm', () => {
    component.currentStep.set(2);
    component.orderData.set({ customerId: 'TEST' });
    component.orderItems.set([{ orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);

    component.resetForm();

    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
    expect(component.orderItems().length).toBe(0);
  });

  it('should update order data on step 1 form data change', () => {
    const testData = { customerId: 'DAL-RG0001', customerName: 'Parkland Hospital' };
    component.onStep1FormDataChange(testData);
    expect(component.orderData()).toEqual(testData);
  });



  it('should create order with first item when no orderNo', () => {
    component.orderData.set({ customerId: 'TEST' });
    const mockResult = { orderNo: '25001-0001', items: [{ orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }] };
    apiService.createOrder.and.returnValue(of(mockResult as any));

    const newItem = { itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2 };
    component.onItemAdded(newItem);

    expect(apiService.createOrder).toHaveBeenCalled();
    expect(component.orderData().orderNo).toBe('25001-0001');
    expect(component.orderItems().length).toBe(1);
  });

  // ── onStep1ValidityChange ──

  it('should set isStep1Valid on validity change', () => {
    component.onStep1ValidityChange(true);
    expect(component.isStep1Valid()).toBe(true);

    component.onStep1ValidityChange(false);
    expect(component.isStep1Valid()).toBe(false);
  });

  // ── onStep1FormDataChange without customerId ──

  it('should disable action buttons when customerId is missing', () => {
    component.onStep1FormDataChange({});
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(true);
    expect(actions.find(a => a.label === 'QUERY STOCKS')!.disabled).toBe(true);
  });

  it('should enable action buttons when customerId is present', () => {
    component.onStep1FormDataChange({ customerId: 'CUST1' });
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
    expect(actions.find(a => a.label === 'QUERY STOCKS')!.disabled).toBe(false);
  });

  // ── onSpCustomerChanged / onSpOrderCreated / onExCustomerChanged / onExOrderCreated / onItemsChanged ──

  it('should update button states on onSpCustomerChanged', () => {
    component.onSpCustomerChanged(true);
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
  });

  it('should disable buttons when onSpCustomerChanged called with false', () => {
    component.onSpCustomerChanged(false);
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(true);
  });

  it('should update button states on onSpOrderCreated', () => {
    component.onSpOrderCreated('SP-001');
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
  });

  it('should update button states on onExCustomerChanged', () => {
    component.onExCustomerChanged(true);
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
  });

  it('should disable buttons when onExCustomerChanged called with false', () => {
    component.onExCustomerChanged(false);
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(true);
  });

  it('should update button states on onExOrderCreated', () => {
    component.onExOrderCreated('EX-001');
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
  });

  it('should update button states on onItemsChanged', () => {
    component.onItemsChanged();
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(false);
  });

  // ── CHARGES button disabled state based on items ──

  it('should enable CHARGES button when regular order has items', () => {
    component.activeTab.set(0);
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);
    component.onStep1FormDataChange({ customerId: 'CUST1' });
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'CHARGES')!.disabled).toBe(false);
  });

  it('should disable CHARGES button when regular order has no items', () => {
    component.activeTab.set(0);
    component.orderItems.set([]);
    component.onStep1FormDataChange({ customerId: 'CUST1' });
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'CHARGES')!.disabled).toBe(true);
  });

  // ── createOrderWithFirstItem error path ──

  it('should show snackbar on createOrder failure', () => {
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    component.orderData.set({ customerId: 'TEST' });
    apiService.createOrder.and.returnValue(throwError(() => new Error('fail')));

    component.onItemAdded({ itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1 });

    expect(snackBarInstance.open).toHaveBeenCalledWith('Failed to create order. Please try again.', 'DISMISS', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
    expect(component.saving()).toBe(false);
  });

  it('should handle createOrder result with no items gracefully', () => {
    component.orderData.set({ customerId: 'TEST' });
    apiService.createOrder.and.returnValue(of({ orderNo: 'O1' } as any));

    component.onItemAdded({ itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1 });

    expect(component.orderData().orderNo).toBe('O1');
    expect(component.orderItems()).toEqual([]);
  });

  // ── onItemAdded with existing orderNo (addOrderItem path) ──

  it('should add item to existing order via addOrderItem', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: '25001-0001' });
    component.orderItems.set([{ orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);
    const serverItems = [
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
      { orderNo: '25001-0001', itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 3, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ];
    apiService.addOrderItem.and.returnValue(of(serverItems as any));

    component.onItemAdded({ itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 3 });

    expect(apiService.addOrderItem).toHaveBeenCalledWith('25001-0001', jasmine.objectContaining({ itemNo: 2 }));
    expect(component.orderItems().length).toBe(2);
    expect(component.saving()).toBe(false);
  });

  it('should merge bloodTypeDesc from existing items when adding', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', bloodTypeDesc: 'A Positive', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);
    const serverItems = [
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ];
    apiService.addOrderItem.and.returnValue(of(serverItems as any));

    component.onItemAdded({ itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 1 });

    expect(component.orderItems()[0].bloodTypeDesc).toBe('A Positive');
  });

  it('should show snackbar on addOrderItem failure', () => {
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    component.orderData.set({ customerId: 'TEST', orderNo: '25001-0001' });
    apiService.addOrderItem.and.returnValue(throwError(() => new Error('fail')));

    component.onItemAdded({ itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 1 });

    expect(snackBarInstance.open).toHaveBeenCalledWith('Failed to add item. Please try again.', 'DISMISS', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
    expect(component.saving()).toBe(false);
  });

  // ── onItemAddedExtra ──

  it('should update last item with extra attributes', () => {
    component.orderItems.set([
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
      { orderNo: 'O1', itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);

    component.onItemAddedExtra({ attribGroup: 'CMV', attribCode: 'NEG' });

    const items = component.orderItems();
    expect(items[1].attribGroup).toBe('CMV');
    expect(items[1].attribCode).toBe('NEG');
    expect(items[0].attribGroup).toBeUndefined();
  });

  it('should not modify items when list is empty', () => {
    component.orderItems.set([]);
    component.onItemAddedExtra({ attribGroup: 'CMV', attribCode: 'NEG' });
    expect(component.orderItems().length).toBe(0);
  });

  // ── onItemDeleted ──

  it('should call deleteOrderItem API when orderNo exists', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    component.orderItems.set([
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
      { orderNo: 'O1', itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    apiService.deleteOrderItem.and.returnValue(of(undefined as any));

    component.onItemDeleted(1);

    expect(apiService.deleteOrderItem).toHaveBeenCalledWith('O1', 1);
    expect(component.orderItems().length).toBe(1);
    expect(component.orderItems()[0].itemNo).toBe(2);
  });

  it('should remove item locally when no orderNo', () => {
    component.orderData.set({ customerId: 'TEST' });
    component.orderItems.set([
      { orderNo: '', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);

    component.onItemDeleted(1);

    expect(apiService.deleteOrderItem).not.toHaveBeenCalled();
    expect(component.orderItems().length).toBe(0);
  });

  // ── onSubmitOrder ──

  it('should show snackbar when submitting with no items', () => {
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    component.orderItems.set([]);

    component.onSubmitOrder();

    expect(snackBarInstance.open).toHaveBeenCalledWith('Please add at least one product item.', 'DISMISS', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
  });

  it('should open confirm dialog and release order when confirmed', () => {
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiService.updateOrder.and.returnValue(of({} as any));

    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);

    component.onSubmitOrder();

    expect(dialogInstance.open).toHaveBeenCalled();
    expect(apiService.updateOrder).toHaveBeenCalledWith('O1', { orderStatus: 'RL' });
    expect(snackBarInstance.open).toHaveBeenCalledWith('Order Number O1 is Printing', 'DISMISS', jasmine.objectContaining({ duration: 8000 }));
    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
  });

  it('should not release order when dialog is cancelled', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(false) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);

    component.onSubmitOrder();

    expect(apiService.updateOrder).not.toHaveBeenCalled();
  });

  it('should show error snackbar when releaseOrder fails', () => {
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiService.updateOrder.and.returnValue(throwError(() => new Error('fail')));

    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);

    component.onSubmitOrder();

    expect(snackBarInstance.open).toHaveBeenCalledWith('Failed to release order. Please try again.', 'DISMISS', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
    expect(component.saving()).toBe(false);
  });

  // ── onOpenOrders ──

  it('should fetch open orders and open dialog for regular tab', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1' });
    apiService.getOpenOrderItems.and.returnValue(of([
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodTypeDesc: 'A+', requiredQty: 2, qtyShort: 0, tier: 1, insertDate: '2025-01-01', hoursElapsed: 5 }
    ]));

    component.onOpenOrders();

    expect(apiService.getOpenOrderItems).toHaveBeenCalledWith('CUST1');
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should not open orders dialog when no customerId', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({});

    component.onOpenOrders();

    expect(apiService.getOpenOrderItems).not.toHaveBeenCalled();
    expect(dialogInstance.open).not.toHaveBeenCalled();
  });

  it('should delegate to specialOrderComponent on activeTab 1', () => {
    component.activeTab.set(1);
    const mockSpecial = { onOpenOrders: jasmine.createSpy('onOpenOrders') } as any;
    (component as any).specialOrderComponent = mockSpecial;

    component.onOpenOrders();

    expect(mockSpecial.onOpenOrders).toHaveBeenCalled();
    expect(apiService.getOpenOrderItems).not.toHaveBeenCalled();
  });

  it('should delegate to exportOrderComponent on activeTab 2', () => {
    component.activeTab.set(2);
    const mockExport = { onOpenOrders: jasmine.createSpy('onOpenOrders') } as any;
    (component as any).exportOrderComponent = mockExport;

    component.onOpenOrders();

    expect(mockExport.onOpenOrders).toHaveBeenCalled();
    expect(apiService.getOpenOrderItems).not.toHaveBeenCalled();
  });

  it('should handle getOpenOrderItems error gracefully via catchError', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1' });
    apiService.getOpenOrderItems.and.returnValue(throwError(() => new Error('fail')));

    component.onOpenOrders();

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  // ── onQueryStocks ──

  it('should fetch product types and open inventory dialog for regular tab', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    apiService.getProductTypesLookup.and.returnValue(of([{ code: 'RBC', description: 'Red Blood Cells' }]));

    component.onQueryStocks();

    expect(apiService.getProductTypesLookup).toHaveBeenCalled();
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should delegate to specialOrderComponent onQueryStocks on activeTab 1', () => {
    component.activeTab.set(1);
    const mockSpecial = { onQueryStocks: jasmine.createSpy('onQueryStocks') } as any;
    (component as any).specialOrderComponent = mockSpecial;

    component.onQueryStocks();

    expect(mockSpecial.onQueryStocks).toHaveBeenCalled();
    expect(apiService.getProductTypesLookup).not.toHaveBeenCalled();
  });

  it('should delegate to exportOrderComponent onQueryStocks on activeTab 2', () => {
    component.activeTab.set(2);
    const mockExport = { onQueryStocks: jasmine.createSpy('onQueryStocks') } as any;
    (component as any).exportOrderComponent = mockExport;

    component.onQueryStocks();

    expect(mockExport.onQueryStocks).toHaveBeenCalled();
    expect(apiService.getProductTypesLookup).not.toHaveBeenCalled();
  });

  // ── onCharges ──

  it('should fetch charges and open dialog when orderNo exists', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    apiService.getOrderCharges.and.returnValue(of([]));

    component.onCharges();

    expect(apiService.getOrderCharges).toHaveBeenCalledWith('O1');
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should show snackbar when onCharges called without orderNo', () => {
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1' });

    component.onCharges();

    expect(snackBarInstance.open).toHaveBeenCalledWith('Please create the order first before adding charges.', 'DISMISS', jasmine.objectContaining({ panelClass: ['error-snackbar'] }));
  });

  it('should delegate to specialOrderComponent onCharges on activeTab 1', () => {
    component.activeTab.set(1);
    const mockSpecial = { onCharges: jasmine.createSpy('onCharges') } as any;
    (component as any).specialOrderComponent = mockSpecial;

    component.onCharges();

    expect(mockSpecial.onCharges).toHaveBeenCalled();
    expect(apiService.getOrderCharges).not.toHaveBeenCalled();
  });

  it('should delegate to exportOrderComponent onCharges on activeTab 2', () => {
    component.activeTab.set(2);
    const mockExport = { onCharges: jasmine.createSpy('onCharges') } as any;
    (component as any).exportOrderComponent = mockExport;

    component.onCharges();

    expect(mockExport.onCharges).toHaveBeenCalled();
    expect(apiService.getOrderCharges).not.toHaveBeenCalled();
  });

  it('should handle getOrderCharges error gracefully via catchError', () => {
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    apiService.getOrderCharges.and.returnValue(throwError(() => new Error('fail')));

    component.onCharges();

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  // ── onAddNotes ──

  it('should fetch notes from API when orderNo exists and open dialog', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    apiService.getOrderNotes.and.returnValue(of({ note: 'Existing note' } as any));

    component.onAddNotes();

    expect(apiService.getOrderNotes).toHaveBeenCalledWith('O1');
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should open dialog with local notes when no orderNo', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1' });
    component.orderNotes.set('Local note');

    component.onAddNotes();

    expect(apiService.getOrderNotes).not.toHaveBeenCalled();
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should save notes via API when dialog returns result and orderNo exists', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of('Updated note') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    apiService.getOrderNotes.and.returnValue(of({ note: 'Old note' } as any));
    apiService.saveOrderNotes.and.returnValue(of({} as any));

    component.onAddNotes();

    expect(component.orderNotes()).toBe('Updated note');
    expect(apiService.saveOrderNotes).toHaveBeenCalledWith('O1', 'Updated note');
  });

  it('should store notes locally when dialog returns result and no orderNo', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of('New note') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1' });

    component.onAddNotes();

    expect(component.orderNotes()).toBe('New note');
    expect(apiService.saveOrderNotes).not.toHaveBeenCalled();
  });

  it('should not update notes when dialog returns null', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1' });
    component.orderNotes.set('Existing');

    component.onAddNotes();

    expect(component.orderNotes()).toBe('Existing');
  });

  it('should not update notes when dialog returns undefined', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(undefined) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1' });
    component.orderNotes.set('Existing');

    component.onAddNotes();

    expect(component.orderNotes()).toBe('Existing');
  });

  it('should handle getOrderNotes error and fall back to local notes', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    component.orderNotes.set('Fallback note');
    apiService.getOrderNotes.and.returnValue(throwError(() => new Error('fail')));

    component.onAddNotes();

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  // ── ngOnDestroy ──

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySubject = (component as any).destroy$ as Subject<void>;
    let completed = false;
    destroySubject.subscribe({ complete: () => completed = true });

    component.ngOnDestroy();

    expect(completed).toBe(true);
  });

  // ── chapterChanged$ subscription ──

  it('should reset form when chapter changes', () => {
    const headerService = TestBed.inject(HeaderService);
    component.currentStep.set(2);
    component.orderData.set({ customerId: 'OLD' });
    component.orderItems.set([{ orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);

    (headerService as any).chapterChangedSubject.next();

    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
    expect(component.orderItems().length).toBe(0);
  });

  // ── resetForm button state ──

  it('should disable all action buttons on resetForm', () => {
    component.onStep1FormDataChange({ customerId: 'CUST1' });
    component.resetForm();
    const actions = component.headerConfig.actions!;
    expect(actions.find(a => a.label === 'OPEN ORDERS')!.disabled).toBe(true);
    expect(actions.find(a => a.label === 'QUERY STOCKS')!.disabled).toBe(true);
    expect(actions.find(a => a.label === 'CHARGES')!.disabled).toBe(true);
  });

  // ── resetForm clears orderNotes and isStep1Valid ──

  it('should clear orderNotes and isStep1Valid on resetForm', () => {
    component.orderNotes.set('Some notes');
    component.isStep1Valid.set(true);

    component.resetForm();

    expect(component.orderNotes()).toBe('');
    expect(component.isStep1Valid()).toBe(false);
  });

  // ── onItemAdded sets saving flag during request ──

  it('should set saving to true while creating order', () => {
    component.orderData.set({ customerId: 'TEST' });
    const subj = new Subject<any>();
    apiService.createOrder.and.returnValue(subj.asObservable());

    component.onItemAdded({ itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1 });
    expect(component.saving()).toBe(true);

    subj.next({ orderNo: 'O1', items: [] });
    subj.complete();
    expect(component.saving()).toBe(false);
  });

  it('should set saving to true while adding item to existing order', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    const subj = new Subject<any>();
    apiService.addOrderItem.and.returnValue(subj.asObservable());

    component.onItemAdded({ itemNo: 2, productType: 'PLT', bloodType: 'O-', tier: 1, requiredQty: 1 });
    expect(component.saving()).toBe(true);

    subj.next([]);
    subj.complete();
    expect(component.saving()).toBe(false);
  });

  // ── elementId helper ──

  it('should generate unique element IDs', () => {
    const id = (component as any).elementId('test-field');
    expect(id).toContain('enter-regular-order-');
    expect(id).toContain('-test-field');
  });

  // ── Open orders maps items correctly ──

  it('should map API items to open orders dialog data format', () => {
    const dialogInstance = (component as any).dialog;
    let dialogData: any;
    spyOn(dialogInstance, 'open').and.callFake((_comp: any, config: any) => {
      dialogData = config.data;
      return { afterClosed: () => of(null) } as any;
    });
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1' });
    apiService.getOpenOrderItems.and.returnValue(of([
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', bloodTypeDesc: 'A Positive', requiredQty: 5, qtyShort: 2, tier: 1, insertDate: '2025-01-01', hoursElapsed: 12 }
    ]));

    component.onOpenOrders();

    expect(dialogData.customerId).toBe('CUST1');
    expect(dialogData.orders.length).toBe(1);
    expect(dialogData.orders[0].orderNumber).toBe('O1');
    expect(dialogData.orders[0].abORh).toBe('A Positive');
    expect(dialogData.orders[0].quantityRequired).toBe(5);
    expect(dialogData.orders[0].quantityShort).toBe(2);
    expect(dialogData.orders[0].hours).toBe(12);
  });

  it('should default abORh to -- when no bloodType fields', () => {
    const dialogInstance = (component as any).dialog;
    let dialogData: any;
    spyOn(dialogInstance, 'open').and.callFake((_comp: any, config: any) => {
      dialogData = config.data;
      return { afterClosed: () => of(null) } as any;
    });
    component.activeTab.set(0);
    component.orderData.set({ customerId: 'CUST1' });
    apiService.getOpenOrderItems.and.returnValue(of([
      { orderNo: 'O1', itemNo: 1, productType: 'RBC', requiredQty: 1, tier: 1, insertDate: '2025-01-01' }
    ]));

    component.onOpenOrders();

    expect(dialogData.orders[0].abORh).toBe('--');
  });

  // ── headerConfig initial values ──

  it('should have correct initial headerConfig', () => {
    expect(component.headerConfig.title).toBe('Manage Orders');
    expect(component.headerConfig.breadcrumbs!.length).toBe(2);
    expect(component.headerConfig.actions!.length).toBe(3);
  });

  // ── activeTab signal ──

  it('should initialize activeTab to 0', () => {
    expect(component.activeTab()).toBe(0);
  });

  // ── goToStep2 sets step to 2 when valid ──

  it('should navigate to step 2 when step 1 is valid and no orderNo', () => {
    component.isStep1Valid.set(true);
    component.orderData.set({ customerId: 'CUST1' });
    component.goToStep2();
    expect(component.currentStep()).toBe(2);
  });

  // ── addOrderItem with null allItems ──

  it('should handle null allItems from addOrderItem', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    apiService.addOrderItem.and.returnValue(of(null as any));

    component.onItemAdded({ itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1 });

    expect(component.orderItems()).toEqual([]);
  });

  // ── onAddNotes with empty note from API ──

  it('should fall back to local notes when API returns no note', () => {
    const dialogInstance = (component as any).dialog;
    let dialogData: any;
    spyOn(dialogInstance, 'open').and.callFake((_comp: any, config: any) => {
      dialogData = config.data;
      return { afterClosed: () => of(null) } as any;
    });
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    component.orderNotes.set('Local note');
    apiService.getOrderNotes.and.returnValue(of({} as any));

    component.onAddNotes();

    expect(dialogData.notes).toBe('Local note');
  });

  // ── onAddNotes saves empty string ──

  it('should allow saving empty string as notes', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of('') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    component.orderData.set({ customerId: 'CUST1', orderNo: 'O1' });
    apiService.getOrderNotes.and.returnValue(of({ note: 'Old' } as any));
    apiService.saveOrderNotes.and.returnValue(of({} as any));

    component.onAddNotes();

    expect(component.orderNotes()).toBe('');
    expect(apiService.saveOrderNotes).toHaveBeenCalledWith('O1', '');
  });

  // ── Gap #5: Standing orders ──

  it('should call getStandingOrderItems when customer, contract, and consignee selected', () => {
    apiSpy.getContracts.and.returnValue(of([{ code: 'CTR1', description: 'Contract 1', substituteFlag: 'Y' }]));
    apiSpy.getStandingOrderItems.and.returnValue(of([]));

    component.onStep1FormDataChange({ customerId: 'CUST1', contractId: 'CTR1', consigneeId: 'CON1' });

    expect(apiSpy.getStandingOrderItems).toHaveBeenCalledWith('CUST1', 'CTR1', 'CON1');
  });

  it('should show confirmation dialog when standing order items found', () => {
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(false) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiSpy.getContracts.and.returnValue(of([{ code: 'CTR1', description: 'Contract 1' }]));
    apiSpy.getStandingOrderItems.and.returnValue(of([
      { productType: 'RBC', bloodType: 'A+', requiredQty: 5, tier: 1 }
    ]));

    component.onStep1FormDataChange({ customerId: 'CUST1', contractId: 'CTR1', consigneeId: 'CON1' });

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should not call getStandingOrderItems when no contract selected', () => {
    component.onStep1FormDataChange({ customerId: 'CUST1', consigneeId: 'CON1' });

    expect(apiSpy.getStandingOrderItems).not.toHaveBeenCalled();
  });

  // ── Gap #15: Orphan cleanup ──

  it('should cancel order on resetForm when orderNo exists', () => {
    apiSpy.deleteOrder.and.returnValue(of(true));
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });

    component.resetForm();

    expect(apiSpy.deleteOrder).toHaveBeenCalledWith('O1');
  });

  it('should not cancel order on resetForm when no orderNo', () => {
    apiSpy.deleteOrder.calls.reset();
    component.orderData.set({ customerId: 'TEST' });

    component.resetForm();

    expect(apiSpy.deleteOrder).not.toHaveBeenCalled();
  });

  // ── Gap #1: Customer and consignee pass-through ──

  it('should set selectedCustomerId from onStep1FormDataChange', () => {
    component.onStep1FormDataChange({ customerId: 'CUST-001' });
    expect(component.selectedCustomerId()).toBe('CUST-001');
  });

  it('should set selectedConsigneeId from onStep1FormDataChange', () => {
    component.onStep1FormDataChange({ customerId: 'CUST-001', consigneeId: 'CON-001' });
    expect(component.selectedConsigneeId()).toBe('CON-001');
  });

  // ── Gap #4: Contract substitute flag ──

  it('should update contractSubstituteFlag when contract changes', () => {
    apiSpy.getContracts.and.returnValue(of([
      { code: 'CTR1', description: 'Contract 1', substituteFlag: 'Y' }
    ]));

    component.onStep1FormDataChange({ customerId: 'CUST1', contractId: 'CTR1' });

    expect(component.contractSubstituteFlag()).toBe('Y');
  });

  // ── Signal initialization ──

  it('should initialize selectedCustomerId signal to empty string', () => {
    expect(component.selectedCustomerId()).toBe('');
  });

  it('should initialize selectedConsigneeId signal to empty string', () => {
    expect(component.selectedConsigneeId()).toBe('');
  });

  it('should initialize contractSubstituteFlag signal to empty string', () => {
    expect(component.contractSubstituteFlag()).toBe('');
  });

  // ── Signal updates on form data change ──

  it('should update selectedCustomerId when customer changes via onStep1FormDataChange', () => {
    component.onStep1FormDataChange({ customerId: 'CUST-A' });
    expect(component.selectedCustomerId()).toBe('CUST-A');

    component.onStep1FormDataChange({ customerId: 'CUST-B' });
    expect(component.selectedCustomerId()).toBe('CUST-B');
  });

  // ── beforeunload handler ──

  it('should have beforeunload handler when order in progress', () => {
    component.orderData.set({ customerId: 'TEST', orderNo: 'O1' });
    const event = { preventDefault: jasmine.createSpy('preventDefault'), returnValue: '' } as any;

    component.onBeforeUnload(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not prevent beforeunload when no order in progress', () => {
    component.orderData.set({});
    const event = { preventDefault: jasmine.createSpy('preventDefault'), returnValue: '' } as any;

    component.onBeforeUnload(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // ── Signals cleared on resetForm ──

  it('should clear selectedCustomerId, selectedConsigneeId, and contractSubstituteFlag on resetForm', () => {
    component.selectedCustomerId.set('CUST-001');
    component.selectedConsigneeId.set('CON-001');
    component.contractSubstituteFlag.set('Y');

    component.resetForm();

    expect(component.selectedCustomerId()).toBe('');
    expect(component.selectedConsigneeId()).toBe('');
    expect(component.contractSubstituteFlag()).toBe('');
  });

});
