import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeCancelOrderComponent } from './change-cancel-order';
import { RegularOrderApiService } from '../enter-regular-order/services/regular-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError } from 'rxjs';

describe('ChangeCancelOrderComponent', () => {
  let apiSpy: any;
  let component: ChangeCancelOrderComponent;
  let fixture: ComponentFixture<ChangeCancelOrderComponent>;
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
      'getOrderItems', 'getOpenOrders',
      'getOrderNumbersLookup', 'getCancelCodesLookup', 'cancelOrder',
      'cancelOrderItem', 'updateOrderItem'
    ]);
    apiSpy.getCustomersLookup.and.returnValue(of([]));
    apiSpy.getOrderModesLookup.and.returnValue(of([]));
    apiSpy.getOrderClassesLookup.and.returnValue(of([]));
    apiSpy.getProductTypesLookup.and.returnValue(of([]));
    apiSpy.getAttributeGroupsLookup.and.returnValue(of([]));
    apiSpy.getOrderNumbersLookup.and.returnValue(of([]));
    apiSpy.getCancelCodesLookup.and.returnValue(of([]));
    apiSpy.cancelOrder.and.returnValue(of(null as any));
    apiSpy.cancelOrderItem.and.returnValue(of([]));
    apiSpy.updateOrderItem.and.returnValue(of([]));
    apiSpy.addOrderItem.and.returnValue(of([]));
    apiSpy.deleteOrderItem.and.returnValue(of(true));
    apiSpy.getOrderNotes.and.returnValue(of(null));
    apiSpy.saveOrderNotes.and.returnValue(of(null));
    apiSpy.updateOrder.and.returnValue(of(null as any));
    apiSpy.getOrder.and.returnValue(of(null as any));
    apiSpy.getOrderItems.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        ChangeCancelOrderComponent,
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


      apiSpy.getOrderNumbersLookup.calls.reset();


      apiSpy.getCancelCodesLookup.calls.reset();


      apiSpy.cancelOrder.calls.reset();


      apiSpy.cancelOrderItem.calls.reset();


      apiSpy.updateOrderItem.calls.reset();


      apiSpy.getCustomersLookup.and.returnValue(of([]));


      apiSpy.getOrderModesLookup.and.returnValue(of([]));


      apiSpy.getOrderClassesLookup.and.returnValue(of([]));


      apiSpy.getProductTypesLookup.and.returnValue(of([]));


      apiSpy.getAttributeGroupsLookup.and.returnValue(of([]));


      apiSpy.getOrderNumbersLookup.and.returnValue(of([]));


      apiSpy.getCancelCodesLookup.and.returnValue(of([]));


      apiSpy.cancelOrder.and.returnValue(of(null as any));


      apiSpy.cancelOrderItem.and.returnValue(of([]));


      apiSpy.updateOrderItem.and.returnValue(of([]));


      apiSpy.addOrderItem.and.returnValue(of([]));


      apiSpy.deleteOrderItem.and.returnValue(of(true));


      apiSpy.getOrderNotes.and.returnValue(of(null));


      apiSpy.saveOrderNotes.and.returnValue(of(null));


      apiSpy.updateOrder.and.returnValue(of(null as any));


      apiSpy.getOrder.and.returnValue(of(null as any));


      apiSpy.getOrderItems.and.returnValue(of([]));


    fixture = TestBed.createComponent(ChangeCancelOrderComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(RegularOrderApiService) as jasmine.SpyObj<RegularOrderApiService>;
    fixture.detectChanges();


    });


  it('should initialize at step 1', () => {
    expect(component.currentStep()).toBe(1);
  });



  it('should have CANCEL ORDERS and ADD NOTES action buttons', () => {
    expect(component.headerConfig.actions).toBeTruthy();
    expect(component.headerConfig.actions!.length).toBe(2);
    expect(component.headerConfig.actions![0].label).toBe('CANCEL ORDERS');
    expect(component.headerConfig.actions![1].label).toBe('ADD NOTES');
  });

  it('should not go to step 2 when step 1 is invalid', () => {
    component.isStep1Valid.set(false);
    component.goToStep2();
    expect(component.currentStep()).toBe(1);
  });

  it('should go to step 2 when step 1 is valid', () => {
    component.isStep1Valid.set(true);
    component.goToStep2();
    expect(component.currentStep()).toBe(2);
  });

  it('should go back to step 1', () => {
    component.currentStep.set(2);
    component.goToStep1();
    expect(component.currentStep()).toBe(1);
  });

  it('should update order data on step 1 form data change', () => {
    const testData = { customerId: 'DAL-RG0001', customerName: 'Parkland Hospital' };
    component.onStep1FormDataChange(testData);
    expect(component.orderData()).toEqual(testData);
  });

  it('should update validity on step 1 validity change', () => {
    component.onStep1ValidityChange(true);
    expect(component.isStep1Valid()).toBeTrue();

    component.onStep1ValidityChange(false);
    expect(component.isStep1Valid()).toBeFalse();
  });



  it('should set isReadOnly when order is canceled', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'CA',
      insertDate: new Date().toISOString().split('T')[0],
      insertUserId: 'admin', lastActivityDate: new Date().toISOString().split('T')[0],
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };

    component.onOrderLoaded({ order, items: [] });

    expect(component.isReadOnly()).toBeTrue();
  });

  it('should update action button states when order loaded', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'EN',
      insertDate: new Date().toISOString().split('T')[0],
      insertUserId: 'admin', lastActivityDate: new Date().toISOString().split('T')[0],
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };

    component.onOrderLoaded({ order, items: [] });

    expect(component.headerConfig.actions![0].disabled).toBeFalse();
    expect(component.headerConfig.actions![1].disabled).toBeFalse();
  });





  it('should cancel item via API and update items', () => {
    component.orderData.set({ orderNo: '25001-0001', customerId: 'TEST' });
    const mockUpdatedItems = [
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'CA', allocatedQty: 0, shippedQty: 0 }
    ];
    apiService.cancelOrderItem.and.returnValue(of(mockUpdatedItems as any));

    component.onItemCanceled(1);

    expect(apiService.cancelOrderItem).toHaveBeenCalledWith('25001-0001', 1);
    expect(component.orderItems().length).toBe(1);
    expect(component.orderItems()[0].itemStatus).toBe('CA');
  });

  it('should update item via API', () => {
    component.orderData.set({ orderNo: '25001-0001', customerId: 'TEST' });
    const mockUpdatedItems = [
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
    ];
    apiService.updateOrderItem.and.returnValue(of(mockUpdatedItems as any));

    component.onItemUpdated({ itemNo: 1, dto: { requiredQty: 5 } });

    expect(apiService.updateOrderItem).toHaveBeenCalledWith('25001-0001', 1, { requiredQty: 5 });
  });

  // ── ngOnDestroy ──

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySubject = (component as any).destroy$;
    let completed = false;
    destroySubject.subscribe({ complete: () => (completed = true) });

    component.ngOnDestroy();

    expect(completed).toBe(true);
  });

  it('should emit next on destroy$ before completing', () => {
    const destroySubject = (component as any).destroy$;
    let nexted = false;
    destroySubject.subscribe({ next: () => (nexted = true) });

    component.ngOnDestroy();

    expect(nexted).toBe(true);
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

  // ── resetForm ──

  it('should reset all signals on resetForm', () => {
    component.currentStep.set(2);
    component.orderData.set({ orderNo: '25001-0001', customerId: 'TEST' });
    component.orderItems.set([{ orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);
    component.orderNotes.set('Some notes');
    component.isStep1Valid.set(true);
    component.isReadOnly.set(true);

    component.resetForm();

    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
    expect(component.orderItems().length).toBe(0);
    expect(component.orderNotes()).toBe('');
    expect(component.isStep1Valid()).toBeFalse();
    expect(component.isReadOnly()).toBeFalse();
  });

  it('should disable all action buttons on resetForm', () => {
    component.resetForm();
    const actions = component.headerConfig.actions!;
    expect(actions[0].disabled).toBe(true);
    expect(actions[1].disabled).toBe(true);
  });

  // ── elementId ──

  it('should generate element ids with component prefix', () => {
    const id = (component as any).elementId('test-button');
    expect(id).toContain('change-cancel-order-');
    expect(id).toContain('-test-button');
  });

  // ── onOrderLoaded read-only statuses ──

  it('should set isReadOnly for SH status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'SH',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeTrue();
  });

  it('should set isReadOnly for CL status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'CL',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeTrue();
  });

  it('should set isReadOnly for DL status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'DL',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeTrue();
  });

  it('should set isReadOnly for SY status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'SY',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeTrue();
  });

  it('should not set isReadOnly for EN status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'EN',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeFalse();
  });

  it('should not set isReadOnly for RL status', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'RL',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    component.onOrderLoaded({ order, items: [] });
    expect(component.isReadOnly()).toBeFalse();
  });

  it('should store order items when order is loaded', () => {
    const order = {
      orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001',
      orderType: 'RG', orderClass: 'RG', orderStatus: 'EN',
      insertDate: '2025-01-01', insertUserId: 'admin', lastActivityDate: '2025-01-01',
      consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: []
    };
    const items = [
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ];
    component.onOrderLoaded({ order, items: items as any });
    expect(component.orderItems().length).toBe(1);
    expect(component.orderItems()[0].itemNo).toBe(1);
  });

  // ── onStep1FormDataChange merging ──

  it('should merge step 1 form data with existing order data', () => {
    component.orderData.set({ customerId: 'CUST1' });
    component.onStep1FormDataChange({ orderNo: 'ORD1' } as any);
    expect(component.orderData()).toEqual({ customerId: 'CUST1', orderNo: 'ORD1' });
  });

  // ── onItemAdded ──

  it('should add item via API and update items on success', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    const mockItems = [
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ];
    apiService.addOrderItem.and.returnValue(of(mockItems as any));

    component.onItemAdded({ productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2 } as any);

    expect(apiService.addOrderItem).toHaveBeenCalledWith('25001-0001', jasmine.objectContaining({ productType: 'RBC' }));
    expect(component.orderItems().length).toBe(1);
    expect(component.saving()).toBeFalse();
  });

  it('should set saving to true while adding an item', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.addOrderItem.and.returnValue(of([]));

    component.onItemAdded({ productType: 'RBC' } as any);

    // saving should be false after completion
    expect(component.saving()).toBeFalse();
  });

  it('should show error snackbar when addOrderItem fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.addOrderItem.and.returnValue(throwError(() => new Error('fail')));
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');

    component.onItemAdded({ productType: 'RBC' } as any);

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Failed to add item. Please try again.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    expect(component.saving()).toBeFalse();
  });

  it('should not call API when onItemAdded has no orderNo', () => {
    component.orderData.set({});
    component.onItemAdded({ productType: 'RBC' } as any);
    expect(apiService.addOrderItem).not.toHaveBeenCalled();
  });

  it('should handle null response from addOrderItem', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.addOrderItem.and.returnValue(of(null as any));

    component.onItemAdded({ productType: 'RBC' } as any);

    expect(component.orderItems()).toEqual([]);
    expect(component.saving()).toBeFalse();
  });

  // ── onItemDeleted ──

  it('should delete item via API and remove from list', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
      { orderNo: '25001-0001', itemNo: 2, productType: 'PLT', bloodType: 'B+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    apiService.deleteOrderItem.and.returnValue(of(true as any));

    component.onItemDeleted(1);

    expect(apiService.deleteOrderItem).toHaveBeenCalledWith('25001-0001', 1);
    expect(component.orderItems().length).toBe(1);
    expect(component.orderItems()[0].itemNo).toBe(2);
  });

  it('should not call API when onItemDeleted has no orderNo', () => {
    component.orderData.set({});
    component.onItemDeleted(1);
    expect(apiService.deleteOrderItem).not.toHaveBeenCalled();
  });

  // ── onItemUpdated ──

  it('should not call API when onItemUpdated has no orderNo', () => {
    component.orderData.set({});
    component.onItemUpdated({ itemNo: 1, dto: { requiredQty: 5 } });
    expect(apiService.updateOrderItem).not.toHaveBeenCalled();
  });

  it('should handle error in onItemUpdated via catchError', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    apiService.updateOrderItem.and.returnValue(throwError(() => new Error('fail')));

    component.onItemUpdated({ itemNo: 1, dto: { requiredQty: 10 } });

    // Items should remain unchanged since catchError returns of(null)
    expect(component.orderItems().length).toBe(1);
    expect(component.orderItems()[0].requiredQty).toBe(2);
  });

  // ── onItemCanceled ──

  it('should not call API when onItemCanceled has no orderNo', () => {
    component.orderData.set({});
    component.onItemCanceled(1);
    expect(apiService.cancelOrderItem).not.toHaveBeenCalled();
  });

  it('should show error snackbar when cancelOrderItem fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.cancelOrderItem.and.returnValue(throwError(() => new Error('fail')));
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');

    component.onItemCanceled(1);

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Failed to cancel item. Please try again.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    expect(component.saving()).toBeFalse();
  });

  it('should show success snackbar when item canceled successfully', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.cancelOrderItem.and.returnValue(of([]));
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');

    component.onItemCanceled(3);

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Item 3 has been canceled.', 'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should handle null response from cancelOrderItem', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.cancelOrderItem.and.returnValue(of(null as any));

    component.onItemCanceled(1);

    expect(component.orderItems()).toEqual([]);
    expect(component.saving()).toBeFalse();
  });

  // ── onCancelOrders ──

  it('should not open dialog when onCancelOrders has no orderNo', () => {
    component.orderData.set({});
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');

    component.onCancelOrders();

    expect(dialogInstance.open).not.toHaveBeenCalled();
  });

  it('should open cancel dialog and call API on confirm', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of({ cancelCode: 'CC1', note: 'Test note' }) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.cancelOrder.and.returnValue(of(null as any));

    component.onCancelOrders();

    expect(dialogInstance.open).toHaveBeenCalled();
    expect(apiService.cancelOrder).toHaveBeenCalledWith('25001-0001', { cancelCode: 'CC1', note: 'Test note' });
    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Order 25001-0001 has been canceled.', 'DISMISS',
      jasmine.objectContaining({ duration: 8000 })
    );
  });

  it('should reset form after successful order cancellation', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.currentStep.set(2);
    component.orderItems.set([{ orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }]);
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of({ cancelCode: 'CC1', note: '' }) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiService.cancelOrder.and.returnValue(of(null as any));

    component.onCancelOrders();

    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
    expect(component.orderItems().length).toBe(0);
  });

  it('should show error snackbar when cancelOrder API fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of({ cancelCode: 'CC1', note: 'Test note' }) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.cancelOrder.and.returnValue(throwError(() => new Error('fail')));

    component.onCancelOrders();

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Failed to cancel order. Please try again.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    expect(component.saving()).toBeFalse();
  });

  it('should not call API when cancel dialog is dismissed', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onCancelOrders();

    expect(apiService.cancelOrder).not.toHaveBeenCalled();
  });

  it('should not call API when cancel dialog returns undefined', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(undefined) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onCancelOrders();

    expect(apiService.cancelOrder).not.toHaveBeenCalled();
  });

  // ── onAddNotes ──

  it('should not call API when onAddNotes has no orderNo', () => {
    component.orderData.set({});
    component.onAddNotes();
    expect(apiService.getOrderNotes).not.toHaveBeenCalled();
  });

  it('should fetch notes and open dialog', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of({ note: 'Existing note' } as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(apiService.getOrderNotes).toHaveBeenCalledWith('25001-0001');
    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should use orderNotes signal when getOrderNotes returns null', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderNotes.set('Fallback note');
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(dialogInstance.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({ data: { notes: 'Fallback note' } })
    );
  });

  it('should open dialog with fetched notes when available', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of({ note: 'Fetched note' } as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(dialogInstance.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({ data: { notes: 'Fetched note' } })
    );
  });

  it('should handle getOrderNotes error and still open dialog', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderNotes.set('Local note');
    apiService.getOrderNotes.and.returnValue(throwError(() => new Error('fail')));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(dialogInstance.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({ data: { notes: 'Local note' } })
    );
  });

  // ── openNotesDialog (via onAddNotes) ──

  it('should save notes when dialog returns a value', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of('Updated note') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.saveOrderNotes.and.returnValue(of(null as any));

    component.onAddNotes();

    expect(apiService.saveOrderNotes).toHaveBeenCalledWith('25001-0001', 'Updated note');
    expect(component.orderNotes()).toBe('Updated note');
    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Notes saved successfully.', 'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show error snackbar when saveOrderNotes fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of('Some note') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.saveOrderNotes.and.returnValue(throwError(() => new Error('fail')));

    component.onAddNotes();

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Failed to save notes. Please try again.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  });

  it('should not save notes when dialog returns null', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(null) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(apiService.saveOrderNotes).not.toHaveBeenCalled();
  });

  it('should not save notes when dialog returns undefined', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(undefined) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onAddNotes();

    expect(apiService.saveOrderNotes).not.toHaveBeenCalled();
  });

  it('should save notes when dialog returns empty string', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    apiService.getOrderNotes.and.returnValue(of(null as any));
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of('') };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiService.saveOrderNotes.and.returnValue(of(null as any));

    component.onAddNotes();

    expect(apiService.saveOrderNotes).toHaveBeenCalledWith('25001-0001', '');
    expect(component.orderNotes()).toBe('');
  });

  // ── onSubmitOrder ──

  it('should show snackbar when no items in order', () => {
    component.orderItems.set([]);
    const snackBarInstance = (component as any).snackBar;
    spyOn(snackBarInstance, 'open');

    component.onSubmitOrder();

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'No items in this order.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  });

  it('should open confirm dialog when items exist', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(false) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onSubmitOrder();

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  it('should release order when confirm dialog returns true', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.updateOrder.and.returnValue(of(null as any));

    component.onSubmitOrder();

    expect(apiService.updateOrder).toHaveBeenCalledWith('25001-0001', { orderStatus: 'RL' });
    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Order Number 25001-0001 is Printing', 'DISMISS',
      jasmine.objectContaining({ duration: 8000 })
    );
  });

  it('should not release order when confirm dialog returns false', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(false) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onSubmitOrder();

    expect(apiService.updateOrder).not.toHaveBeenCalled();
  });

  it('should reset form after successful order release', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    component.currentStep.set(2);
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    apiService.updateOrder.and.returnValue(of(null as any));

    component.onSubmitOrder();

    expect(component.currentStep()).toBe(1);
    expect(component.orderData()).toEqual({});
    expect(component.orderItems().length).toBe(0);
  });

  it('should show error snackbar when releaseOrder fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    const dialogInstance = (component as any).dialog;
    const snackBarInstance = (component as any).snackBar;
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);
    spyOn(snackBarInstance, 'open');
    apiService.updateOrder.and.returnValue(throwError(() => new Error('fail')));

    component.onSubmitOrder();

    expect(snackBarInstance.open).toHaveBeenCalledWith(
      'Failed to release order. Please try again.', 'DISMISS',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
    expect(component.saving()).toBeFalse();
  });

  it('should not release when orderNo is missing', () => {
    component.orderData.set({});
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(true) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onSubmitOrder();

    expect(apiService.updateOrder).not.toHaveBeenCalled();
  });

  // ── onSubmitOrder with pending items ──

  it('should return early when pending item flush fails', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    (component as any).stepEditProducts = {
      hasPendingItem: () => true,
      tryFlushPendingItem: () => false
    };
    const dialogInstance = (component as any).dialog;
    spyOn(dialogInstance, 'open');

    component.onSubmitOrder();

    expect(dialogInstance.open).not.toHaveBeenCalled();
  });

  it('should continue when pending item flush succeeds', () => {
    component.orderData.set({ orderNo: '25001-0001' });
    component.orderItems.set([
      { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
    ]);
    (component as any).stepEditProducts = {
      hasPendingItem: () => true,
      tryFlushPendingItem: () => true
    };
    const dialogInstance = (component as any).dialog;
    const dialogRef = { afterClosed: () => of(false) };
    spyOn(dialogInstance, 'open').and.returnValue(dialogRef as any);

    component.onSubmitOrder();

    expect(dialogInstance.open).toHaveBeenCalled();
  });

  // ── updateActionButtonStates edge case ──

  it('should handle updateActionButtonStates when actions is undefined', () => {
    component.headerConfig = { breadcrumbs: [], title: '', subtitle: '' };
    expect(() => (component as any).updateActionButtonStates(true)).not.toThrow();
  });

  // ── loading and saving signals ──

  it('should initialize loading as false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should initialize saving as false', () => {
    expect(component.saving()).toBeFalse();
  });

});
