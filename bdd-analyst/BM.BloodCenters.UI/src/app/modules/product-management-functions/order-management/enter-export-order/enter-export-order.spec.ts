import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject, Observable } from 'rxjs';

import { EnterExportOrderComponent } from './enter-export-order';
import { ExportOrderApiService } from './services/export-order-api.service';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderItemDto,
  StandingOrderItemDto
} from './models/export-order.model';

describe('EnterExportOrderComponent', () => {
  let component: EnterExportOrderComponent;
  let fixture: ComponentFixture<EnterExportOrderComponent>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;

  const mockOrderResult: ExportOrderDto = {
    orderNo: 'EX001',
    chapterId: 'CH1',
    customerId: 'CUST1',
    estArrivalTime: '2026-01-15',
    insertDate: '2026-01-01',
    insertUserId: 'user1',
    items: [
      {
        orderNo: 'EX001', itemNo: 1, productType: 'RBC', bloodType: 'OP',
        bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 10,
        unitPrice: 100, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0
      }
    ]
  };

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

  const mockItem: CreateExportOrderItemDto = {
    itemNo: 1,
    productType: 'RBC',
    bloodType: 'OP',
    bloodTypeDesc: 'O Positive',
    tier: 1,
    requiredQty: 10,
    unitPrice: 100
  };

  const apiService = jasmine.createSpyObj<ExportOrderApiService>('ExportOrderApiService', [
    'createOrder', 'addOrderItem', 'deleteOrderItem', 'updateOrder',
    'getOpenOrderItems', 'getProductTypesLookup', 'getOrderCharges',
    'deleteOrder', 'getOrderItems'
  ]);

  function resetSpies(): void {
    apiService.createOrder.calls.reset();
    apiService.addOrderItem.calls.reset();
    apiService.deleteOrderItem.calls.reset();
    apiService.updateOrder.calls.reset();
    apiService.getOpenOrderItems.calls.reset();
    apiService.getProductTypesLookup.calls.reset();
    apiService.getOrderCharges.calls.reset();
    apiService.deleteOrder.calls.reset();
    apiService.getOrderItems.calls.reset();

    apiService.createOrder.and.returnValue(of(mockOrderResult));
    apiService.addOrderItem.and.returnValue(of(mockOrderItems));
    apiService.deleteOrderItem.and.returnValue(of(true));
    apiService.updateOrder.and.returnValue(of({}));
    apiService.getOpenOrderItems.and.returnValue(of([]));
    apiService.getProductTypesLookup.and.returnValue(of([]));
    apiService.getOrderCharges.and.returnValue(of([]));
    apiService.deleteOrder.and.returnValue(of(true));
    apiService.getOrderItems.and.returnValue(of([]));
  }

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        EnterExportOrderComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService }
      ]
    });

    fixture = TestBed.createComponent(EnterExportOrderComponent);
    component = fixture.componentInstance;

    dialogOpenSpy = spyOn((component as any).dialog, 'open');
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Signal defaults
  // ---------------------------------------------------------------------------
  describe('signal defaults', () => {
    it('should have currentStep default to 1', () => {
      expect(component.currentStep()).toBe(1);
    });

    it('should have loading default to false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have saving default to false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should have isStep1Valid default to false', () => {
      expect(component.isStep1Valid()).toBeFalse();
    });

    it('should have orderData default to empty object', () => {
      expect(component.orderData()).toEqual({});
    });

    it('should have orderItems default to empty array', () => {
      expect(component.orderItems()).toEqual([]);
    });

    it('should have orderNotes default to empty string', () => {
      expect(component.orderNotes()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------
  describe('ngOnInit', () => {
    it('should execute without error', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      spyOn(destroy$, 'next');
      spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroy$.next).toHaveBeenCalled();
      expect(destroy$.complete).toHaveBeenCalled();
    });

    it('should cancel pending API subscriptions after destroy', () => {
      const subject = new Subject<ExportOrderDto>();
      apiService.createOrder.and.returnValue(subject.asObservable());
      component.orderData.set({ customerId: 'CUST1' });

      component.onItemAdded(mockItem);
      expect(component.saving()).toBeTrue();

      component.ngOnDestroy();

      // Emit after destroy - should not reach the subscriber
      subject.next(mockOrderResult);
      // saving stays true because the subscriber was destroyed before it could set it false
      expect(component.saving()).toBeTrue();
    });
  });

  // ---------------------------------------------------------------------------
  // resetForm
  // ---------------------------------------------------------------------------
  describe('resetForm', () => {
    it('should reset currentStep to 1', () => {
      component.currentStep.set(2);
      component.resetForm();
      expect(component.currentStep()).toBe(1);
    });

    it('should reset orderData to empty object', () => {
      component.orderData.set({ customerId: 'CUST1', orderNo: 'EX001' });
      component.resetForm();
      expect(component.orderData()).toEqual({});
    });

    it('should reset orderItems to empty array', () => {
      component.orderItems.set(mockOrderItems);
      component.resetForm();
      expect(component.orderItems()).toEqual([]);
    });

    it('should reset orderNotes to empty string', () => {
      component.orderNotes.set('Some notes');
      component.resetForm();
      expect(component.orderNotes()).toBe('');
    });

    it('should reset isStep1Valid to false', () => {
      component.isStep1Valid.set(true);
      component.resetForm();
      expect(component.isStep1Valid()).toBeFalse();
    });

    it('should emit customerChanged with false', () => {
      spyOn(component.customerChanged, 'emit');
      component.resetForm();
      expect(component.customerChanged.emit).toHaveBeenCalledWith(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onStep1FormDataChange
  // ---------------------------------------------------------------------------
  describe('onStep1FormDataChange', () => {
    it('should update orderData signal with provided data', () => {
      const data: Partial<ExportOrderDto> = { customerId: 'CUST1', orderedBy: 'John' };
      component.onStep1FormDataChange(data);
      expect(component.orderData()).toEqual(data);
    });

    it('should emit customerChanged with true when customerId is present', () => {
      spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({ customerId: 'CUST1' });
      expect(component.customerChanged.emit).toHaveBeenCalledWith(true);
    });

    it('should emit customerChanged with false when customerId is empty', () => {
      spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({ customerId: '' });
      expect(component.customerChanged.emit).toHaveBeenCalledWith(false);
    });

    it('should emit customerChanged with false when customerId is undefined', () => {
      spyOn(component.customerChanged, 'emit');
      component.onStep1FormDataChange({});
      expect(component.customerChanged.emit).toHaveBeenCalledWith(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onStep1ValidityChange
  // ---------------------------------------------------------------------------
  describe('onStep1ValidityChange', () => {
    it('should set isStep1Valid to true', () => {
      component.onStep1ValidityChange(true);
      expect(component.isStep1Valid()).toBeTrue();
    });

    it('should set isStep1Valid to false', () => {
      component.isStep1Valid.set(true);
      component.onStep1ValidityChange(false);
      expect(component.isStep1Valid()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // goToStep2
  // ---------------------------------------------------------------------------
  describe('goToStep2', () => {
    it('should set currentStep to 2 when step1 is valid', () => {
      component.isStep1Valid.set(true);
      component.goToStep2();
      expect(component.currentStep()).toBe(2);
    });

    it('should not change currentStep when step1 is invalid', () => {
      component.isStep1Valid.set(false);
      component.goToStep2();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // goToStep1
  // ---------------------------------------------------------------------------
  describe('goToStep1', () => {
    it('should set currentStep to 1', () => {
      component.currentStep.set(2);
      component.goToStep1();
      expect(component.currentStep()).toBe(1);
    });

    it('should remain on step 1 when already on step 1', () => {
      component.currentStep.set(1);
      component.goToStep1();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // onItemAdded — create order with first item (no orderNo)
  // ---------------------------------------------------------------------------
  describe('onItemAdded (createOrderWithFirstItem)', () => {
    it('should call createOrder when no orderNo exists', () => {
      component.orderData.set({ customerId: 'CUST1', priority: 'R', orderedBy: 'John', contractId: 'C1', orderMode: 'PU', consigneeId: 'CON1', payeeId: 'PAY1' });

      component.onItemAdded(mockItem);

      expect(apiService.createOrder).toHaveBeenCalledWith(jasmine.objectContaining({
        customerId: 'CUST1',
        orderType: 'EX',
        orderClass: 'R',
        orderedBy: 'John',
        contractId: 'C1',
        orderMode: 'PU',
        consigneeId: 'CON1',
        payeeId: 'PAY1',
        items: [mockItem]
      }));
    });

    it('should set saving to true during createOrder call', () => {
      const subject = new Subject<ExportOrderDto>();
      apiService.createOrder.and.returnValue(subject.asObservable());
      component.orderData.set({ customerId: 'CUST1' });

      component.onItemAdded(mockItem);
      expect(component.saving()).toBeTrue();
    });

    it('should set saving to false on createOrder success', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should update orderData with orderNo and estArrivalTime on success', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);

      expect(component.orderData().orderNo).toBe('EX001');
      expect(component.orderData().estArrivalTime).toBe('2026-01-15');
    });

    it('should set orderItems from result on success', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.orderItems()).toEqual(mockOrderResult.items!);
    });

    it('should emit orderCreated with orderNo on success', () => {
      spyOn(component.orderCreated, 'emit');
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.orderCreated.emit).toHaveBeenCalledWith('EX001');
    });

    it('should emit itemsChanged on success', () => {
      spyOn(component.itemsChanged, 'emit');
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.itemsChanged.emit).toHaveBeenCalled();
    });

    it('should handle empty orderNo in result', () => {
      apiService.createOrder.and.returnValue(of({ ...mockOrderResult, orderNo: '' }));
      spyOn(component.orderCreated, 'emit');
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.orderCreated.emit).toHaveBeenCalledWith('');
    });

    it('should handle null result items', () => {
      apiService.createOrder.and.returnValue(of({ ...mockOrderResult, items: undefined } as any));
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.orderItems()).toEqual([]);
    });

    it('should handle null result', () => {
      apiService.createOrder.and.returnValue(of(null as any));
      spyOn(component.orderCreated, 'emit');
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.orderCreated.emit).toHaveBeenCalledWith('');
      expect(component.orderItems()).toEqual([]);
    });

    it('should use empty string defaults when orderData fields are missing', () => {
      component.orderData.set({});
      component.onItemAdded(mockItem);
      expect(apiService.createOrder).toHaveBeenCalledWith(jasmine.objectContaining({
        customerId: '',
        orderClass: '',
        orderedBy: '',
        contractId: '',
        orderMode: '',
        consigneeId: '',
        payeeId: ''
      }));
    });

    it('should set saving to false on createOrder error', () => {
      apiService.createOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should show error snackbar on createOrder error', () => {
      apiService.createOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to create export order. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onItemAdded — add item to existing order (orderNo exists)
  // ---------------------------------------------------------------------------
  describe('onItemAdded (addOrderItem)', () => {
    beforeEach(() => {
      component.orderData.set({ orderNo: 'EX001', customerId: 'CUST1' });
    });

    it('should call addOrderItem when orderNo exists', () => {
      component.onItemAdded(mockItem);
      expect(apiService.addOrderItem).toHaveBeenCalledWith('EX001', mockItem);
    });

    it('should not call createOrder when orderNo exists', () => {
      component.onItemAdded(mockItem);
      expect(apiService.createOrder).not.toHaveBeenCalled();
    });

    it('should set saving to true during addOrderItem call', () => {
      const subject = new Subject<ExportOrderItemDto[]>();
      apiService.addOrderItem.and.returnValue(subject.asObservable());

      component.onItemAdded(mockItem);
      expect(component.saving()).toBeTrue();
    });

    it('should set saving to false on success', () => {
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should merge items using bloodTypeDesc from server when available', () => {
      const serverItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], bloodTypeDesc: 'Server Desc' }
      ];
      apiService.addOrderItem.and.returnValue(of(serverItems));

      component.onItemAdded(mockItem);

      expect(component.orderItems()[0].bloodTypeDesc).toBe('Server Desc');
    });

    it('should use existing bloodTypeDesc when server does not provide one', () => {
      const existingItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], bloodTypeDesc: 'Existing Desc' }
      ];
      component.orderItems.set(existingItems);

      const serverItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], bloodTypeDesc: '' }
      ];
      apiService.addOrderItem.and.returnValue(of(serverItems));

      component.onItemAdded(mockItem);

      expect(component.orderItems()[0].bloodTypeDesc).toBe('Existing Desc');
    });

    it('should use item bloodTypeDesc for matching itemNo when server and existing have none', () => {
      component.orderItems.set([]);
      const serverItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], itemNo: 1, bloodTypeDesc: '' }
      ];
      apiService.addOrderItem.and.returnValue(of(serverItems));

      const itemWithDesc: CreateExportOrderItemDto = { ...mockItem, itemNo: 1, bloodTypeDesc: 'From Item' };
      component.onItemAdded(itemWithDesc);

      expect(component.orderItems()[0].bloodTypeDesc).toBe('From Item');
    });

    it('should not use item bloodTypeDesc for non-matching itemNo', () => {
      component.orderItems.set([]);
      const serverItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], itemNo: 99, bloodTypeDesc: '' }
      ];
      apiService.addOrderItem.and.returnValue(of(serverItems));

      const itemWithDesc: CreateExportOrderItemDto = { ...mockItem, itemNo: 1, bloodTypeDesc: 'From Item' };
      component.onItemAdded(itemWithDesc);

      expect(component.orderItems()[0].bloodTypeDesc).toBeFalsy();
    });

    it('should handle null allItems from server', () => {
      apiService.addOrderItem.and.returnValue(of(null as any));

      component.onItemAdded(mockItem);
      expect(component.orderItems()).toEqual([]);
    });

    it('should emit itemsChanged on success', () => {
      spyOn(component.itemsChanged, 'emit');
      component.onItemAdded(mockItem);
      expect(component.itemsChanged.emit).toHaveBeenCalled();
    });

    it('should set saving to false on error', () => {
      apiService.addOrderItem.and.returnValue(throwError(() => new Error('fail')));
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should show error snackbar on addOrderItem error', () => {
      apiService.addOrderItem.and.returnValue(throwError(() => new Error('fail')));
      component.onItemAdded(mockItem);
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to add item. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onItemAddedExtra
  // ---------------------------------------------------------------------------
  describe('onItemAddedExtra', () => {
    it('should update the last item with extra data', () => {
      component.orderItems.set([...mockOrderItems]);
      component.onItemAddedExtra({ attribGroup: 'CMV', attribCode: 'POS' });

      const items = component.orderItems();
      expect(items[items.length - 1].attribGroup).toBe('CMV');
      expect(items[items.length - 1].attribCode).toBe('POS');
    });

    it('should not modify other items', () => {
      component.orderItems.set([...mockOrderItems]);
      component.onItemAddedExtra({ attribGroup: 'CMV' });

      const items = component.orderItems();
      expect(items[0].attribGroup).toBeUndefined();
    });

    it('should not modify items when array is empty', () => {
      component.orderItems.set([]);
      component.onItemAddedExtra({ attribGroup: 'CMV' });
      expect(component.orderItems()).toEqual([]);
    });

    it('should handle partial extra data', () => {
      component.orderItems.set([{ ...mockOrderItems[0] }]);
      component.onItemAddedExtra({ attribGroup: 'CMV' });
      expect(component.orderItems()[0].attribGroup).toBe('CMV');
      expect(component.orderItems()[0].attribCode).toBeUndefined();
    });

    it('should handle empty extra object', () => {
      component.orderItems.set([{ ...mockOrderItems[0] }]);
      const originalItem = { ...component.orderItems()[0] };
      component.onItemAddedExtra({});

      expect(component.orderItems()[0].productType).toBe(originalItem.productType);
    });
  });

  // ---------------------------------------------------------------------------
  // onItemDeleted
  // ---------------------------------------------------------------------------
  describe('onItemDeleted', () => {
    it('should call deleteOrderItem API when orderNo exists', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(apiService.deleteOrderItem).toHaveBeenCalledWith('EX001', 1);
    });

    it('should remove item from orderItems on successful API delete', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(component.orderItems().length).toBe(1);
      expect(component.orderItems()[0].itemNo).toBe(2);
    });

    it('should emit itemsChanged after successful API delete', () => {
      spyOn(component.itemsChanged, 'emit');
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(component.itemsChanged.emit).toHaveBeenCalled();
    });

    it('should remove item locally when no orderNo exists', () => {
      component.orderData.set({});
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(apiService.deleteOrderItem).not.toHaveBeenCalled();
      expect(component.orderItems().length).toBe(1);
      expect(component.orderItems()[0].itemNo).toBe(2);
    });

    it('should emit itemsChanged when deleting locally without orderNo', () => {
      spyOn(component.itemsChanged, 'emit');
      component.orderData.set({});
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(component.itemsChanged.emit).toHaveBeenCalled();
    });

    it('should not remove any items when itemNo does not match', () => {
      component.orderData.set({});
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(999);

      expect(component.orderItems().length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // onSubmitOrder
  // ---------------------------------------------------------------------------
  describe('onSubmitOrder', () => {
    it('should show error snackbar when there are no items', () => {
      component.orderItems.set([]);
      component.onSubmitOrder();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Please add at least one product item.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should not open dialog when there are no items', () => {
      component.orderItems.set([]);
      component.onSubmitOrder();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open confirm dialog when items exist', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      component.orderItems.set([...mockOrderItems]);

      component.onSubmitOrder();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(dialogArgs[1]).toEqual(jasmine.objectContaining({
        width: '500px',
        disableClose: true
      }));
    });

    it('should call releaseOrder when dialog is confirmed', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onSubmitOrder();

      expect(apiService.updateOrder).toHaveBeenCalledWith('EX001', { orderStatus: 'RL' });
    });

    it('should not call releaseOrder when dialog is canceled', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onSubmitOrder();

      expect(apiService.updateOrder).not.toHaveBeenCalled();
    });

    it('should not call releaseOrder when dialog is dismissed (null)', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(null) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onSubmitOrder();

      expect(apiService.updateOrder).not.toHaveBeenCalled();
    });

    it('should not call releaseOrder when dialog is dismissed (undefined)', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onSubmitOrder();

      expect(apiService.updateOrder).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // releaseOrder (via onSubmitOrder -> confirmed)
  // ---------------------------------------------------------------------------
  describe('releaseOrder', () => {
    beforeEach(() => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderItems.set([...mockOrderItems]);
    });

    it('should not call updateOrder when no orderNo exists', () => {
      component.orderData.set({});
      component.onSubmitOrder();
      expect(apiService.updateOrder).not.toHaveBeenCalled();
    });

    it('should set saving to true during release', () => {
      const subject = new Subject<any>();
      apiService.updateOrder.and.returnValue(subject.asObservable());
      component.orderData.set({ orderNo: 'EX001' });

      component.onSubmitOrder();

      expect(component.saving()).toBeTrue();
    });

    it('should set saving to false on release success', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.onSubmitOrder();
      expect(component.saving()).toBeFalse();
    });

    it('should show success snackbar with order number on release success', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.onSubmitOrder();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Order Number EX001 is Printing',
        'DISMISS',
        jasmine.objectContaining({ duration: 8000 })
      );
    });

    it('should reset form after successful release', () => {
      spyOn(component, 'resetForm').and.callThrough();
      component.orderData.set({ orderNo: 'EX001' });
      component.onSubmitOrder();
      expect(component.resetForm).toHaveBeenCalled();
    });

    it('should set saving to false on release error', () => {
      apiService.updateOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });
      component.onSubmitOrder();
      expect(component.saving()).toBeFalse();
    });

    it('should show error snackbar on release error', () => {
      apiService.updateOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });
      component.onSubmitOrder();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to release order. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onOpenOrders
  // ---------------------------------------------------------------------------
  describe('onOpenOrders', () => {
    it('should not call API when customerId is absent', () => {
      component.orderData.set({});
      component.onOpenOrders();
      expect(apiService.getOpenOrderItems).not.toHaveBeenCalled();
    });

    it('should not call API when customerId is empty string', () => {
      component.orderData.set({ customerId: '' });
      component.onOpenOrders();
      expect(apiService.getOpenOrderItems).not.toHaveBeenCalled();
    });

    it('should call getOpenOrderItems with customerId', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onOpenOrders();
      expect(apiService.getOpenOrderItems).toHaveBeenCalledWith('CUST1');
    });

    it('should open dialog with mapped order data', () => {
      const mockItems = [{
        orderNo: 'EX001', itemNo: 1, productType: 'RBC',
        bloodTypeDesc: 'O Positive', bloodType: 'OP',
        requiredQty: 10, qtyShort: 2, tier: 1,
        insertDate: '2026-01-01', hoursElapsed: 24
      }];
      apiService.getOpenOrderItems.and.returnValue(of(mockItems));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(dialogArgs[1]).toEqual(jasmine.objectContaining({
        width: '950px',
        height: '100vh',
        panelClass: 'right-panel-dialog'
      }));
      const data = dialogArgs[1].data;
      expect(data.customerId).toBe('CUST1');
      expect(data.orders.length).toBe(1);
      expect(data.orders[0]).toEqual(jasmine.objectContaining({
        orderNumber: 'EX001',
        item: 1,
        product: 'RBC',
        abORh: 'O Positive',
        quantityRequired: 10,
        quantityShort: 2,
        tierOrder: 1,
        date: '2026-01-01',
        hours: 24
      }));
    });

    it('should use bloodType when bloodTypeDesc is absent', () => {
      const mockItems = [{
        orderNo: 'EX001', itemNo: 1, productType: 'RBC',
        bloodType: 'OP', requiredQty: 10,
        tier: 1, insertDate: '2026-01-01'
      }];
      apiService.getOpenOrderItems.and.returnValue(of(mockItems));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders[0].abORh).toBe('OP');
    });

    it('should use "--" when both bloodTypeDesc and bloodType are absent', () => {
      const mockItems = [{
        orderNo: 'EX001', itemNo: 1, productType: 'RBC',
        requiredQty: 10, tier: 1, insertDate: '2026-01-01'
      }];
      apiService.getOpenOrderItems.and.returnValue(of(mockItems));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders[0].abORh).toBe('--');
    });

    it('should default qtyShort to 0 when not provided', () => {
      const mockItems = [{
        orderNo: 'EX001', itemNo: 1, productType: 'RBC',
        bloodType: 'OP', requiredQty: 10, tier: 1, insertDate: '2026-01-01'
      }];
      apiService.getOpenOrderItems.and.returnValue(of(mockItems));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders[0].quantityShort).toBe(0);
    });

    it('should default hoursElapsed to 0 when not provided', () => {
      const mockItems = [{
        orderNo: 'EX001', itemNo: 1, productType: 'RBC',
        bloodType: 'OP', requiredQty: 10, tier: 1, insertDate: '2026-01-01'
      }];
      apiService.getOpenOrderItems.and.returnValue(of(mockItems));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders[0].hours).toBe(0);
    });

    it('should handle API error gracefully (catchError returns empty array)', () => {
      apiService.getOpenOrderItems.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders).toEqual([]);
    });

    it('should handle null items from API', () => {
      apiService.getOpenOrderItems.and.returnValue(of(null as any));
      component.orderData.set({ customerId: 'CUST1' });

      component.onOpenOrders();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.orders).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // onQueryStocks
  // ---------------------------------------------------------------------------
  describe('onQueryStocks', () => {
    it('should call getProductTypesLookup', () => {
      apiService.getProductTypesLookup.and.returnValue(of([{ code: 'RBC', description: 'Red Blood Cells' }]));
      component.onQueryStocks();
      expect(apiService.getProductTypesLookup).toHaveBeenCalled();
    });

    it('should open inventory dialog with products and apiService', () => {
      const products = [{ code: 'RBC', description: 'Red Blood Cells' }];
      apiService.getProductTypesLookup.and.returnValue(of(products));

      component.onQueryStocks();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(dialogArgs[1]).toEqual(jasmine.objectContaining({
        width: '750px',
        height: '100vh',
        panelClass: 'right-panel-dialog'
      }));
      const data = dialogArgs[1].data;
      expect(data.products).toEqual(products);
      expect(data.apiService).toBe(apiService);
    });
  });

  // ---------------------------------------------------------------------------
  // onCharges
  // ---------------------------------------------------------------------------
  describe('onCharges', () => {
    it('should show error snackbar when no orderNo exists', () => {
      component.orderData.set({});
      component.onCharges();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Please create the order first before adding charges.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should not call getOrderCharges when no orderNo exists', () => {
      component.orderData.set({});
      component.onCharges();
      expect(apiService.getOrderCharges).not.toHaveBeenCalled();
    });

    it('should call getOrderCharges with orderNo', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.onCharges();
      expect(apiService.getOrderCharges).toHaveBeenCalledWith('EX001');
    });

    it('should open charges dialog with charges and apiService', () => {
      const charges = [{ chargeCode: 'DEL', amount: 50 }];
      apiService.getOrderCharges.and.returnValue(of(charges));
      component.orderData.set({ orderNo: 'EX001' });

      component.onCharges();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(dialogArgs[1]).toEqual(jasmine.objectContaining({
        width: '800px',
        height: '100vh',
        panelClass: 'right-panel-dialog'
      }));
      const data = dialogArgs[1].data;
      expect(data.orderNo).toBe('EX001');
      expect(data.charges).toEqual(charges);
      expect(data.apiService).toBe(apiService);
    });

    it('should handle API error gracefully (catchError returns empty array)', () => {
      apiService.getOrderCharges.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });

      component.onCharges();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.charges).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // componentId uniqueness
  // ---------------------------------------------------------------------------
  describe('componentId', () => {
    it('should have a component ID prefixed with enter-export-order-', () => {
      expect((component as any).componentId).toMatch(/^enter-export-order-\d+$/);
    });
  });

  // ---------------------------------------------------------------------------
  // EventEmitter outputs
  // ---------------------------------------------------------------------------
  describe('outputs', () => {
    it('should have customerChanged output', () => {
      expect(component.customerChanged).toBeDefined();
    });

    it('should have orderCreated output', () => {
      expect(component.orderCreated).toBeDefined();
    });

    it('should have itemsChanged output', () => {
      expect(component.itemsChanged).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // canDeactivate
  // ---------------------------------------------------------------------------
  describe('canDeactivate', () => {
    it('should allow navigation when no order exists', () => {
      component.orderData.set({});
      expect(component.canDeactivate()).toBe(true);
    });

    it('should allow navigation when order has items', () => {
      component.orderData.set({ orderNo: 'ORD001' } as any);
      component.orderItems.set([{ itemNo: 1 } as any]);
      expect(component.canDeactivate()).toBe(true);
    });

    it('should prompt when order exists with no items', () => {
      component.orderData.set({ orderNo: 'ORD001' } as any);
      component.orderItems.set([]);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      apiService.deleteOrder.and.returnValue(of(true));
      const result = component.canDeactivate();
      expect(result).toBeInstanceOf(Observable);
    });

    it('should return true when user confirms cancel', (done) => {
      component.orderData.set({ orderNo: 'ORD001' } as any);
      component.orderItems.set([]);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      apiService.deleteOrder.and.returnValue(of(true));
      const result = component.canDeactivate();
      (result as Observable<boolean>).subscribe(val => {
        expect(val).toBeTrue();
        expect(apiService.deleteOrder).toHaveBeenCalledWith('ORD001');
        done();
      });
    });

    it('should return false when user cancels dialog', (done) => {
      component.orderData.set({ orderNo: 'ORD001' } as any);
      component.orderItems.set([]);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      const result = component.canDeactivate();
      (result as Observable<boolean>).subscribe(val => {
        expect(val).toBeFalse();
        expect(apiService.deleteOrder).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return true even if deleteOrder fails', (done) => {
      component.orderData.set({ orderNo: 'ORD001' } as any);
      component.orderItems.set([]);
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      apiService.deleteOrder.and.returnValue(throwError(() => new Error('fail')));
      const result = component.canDeactivate();
      (result as Observable<boolean>).subscribe(val => {
        expect(val).toBeTrue();
        done();
      });
    });

    it('should allow navigation when orderNo is undefined', () => {
      component.orderData.set({ customerId: 'CUST1' });
      expect(component.canDeactivate()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // standing order integration
  // ---------------------------------------------------------------------------
  describe('standing order integration', () => {
    const mockStandingItems: StandingOrderItemDto[] = [
      { productType: 'RBC', productTypeDesc: 'Red Blood Cells', bloodType: 'OP', bloodTypeDesc: 'O Positive', tier: 1, requiredQty: 5, subOk: 'Y', attribGroup: '', attribCode: '' },
      { productType: 'PLT', productTypeDesc: 'Platelets', bloodType: 'AP', bloodTypeDesc: 'A Positive', tier: 2, requiredQty: 3, subOk: 'N', attribGroup: '', attribCode: '' }
    ];

    it('should show confirmation dialog when items found', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

      component.onStandingOrderItemsFound(mockStandingItems);

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.data.title).toBe('Standing Order Items');
      expect(dialogConfig.data.message).toContain('2 standing order item(s) found');
    });

    it('should not show dialog when no items found', () => {
      component.onStandingOrderItemsFound([]);
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should apply items when confirmed with existing order', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      apiService.addOrderItem.and.returnValue(of([]));
      apiService.getOrderItems.and.returnValue(of(mockOrderItems));

      component.onStandingOrderItemsFound(mockStandingItems);

      expect(apiService.addOrderItem).toHaveBeenCalled();
    });

    it('should skip items when cancelled', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      apiService.addOrderItem.calls.reset();

      component.onStandingOrderItemsFound(mockStandingItems);

      expect(apiService.addOrderItem).not.toHaveBeenCalled();
    });

    it('should create order when applying items without existing order', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ customerId: 'CUST1' });

      component.onStandingOrderItemsFound(mockStandingItems);

      // Should call createOrder since no orderNo exists
      expect(apiService.createOrder).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // COD flag
  // ---------------------------------------------------------------------------
  describe('COD flag', () => {
    it('should include codFlag in create order DTO', () => {
      component.orderData.set({ customerId: 'CUST1', codFlag: 'Y' });
      component.onItemAdded(mockItem);

      const calledWith = apiService.createOrder.calls.mostRecent().args[0];
      expect(calledWith.codFlag).toBe('Y');
    });

    it('should default codFlag to N when not set', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onItemAdded(mockItem);

      const calledWith = apiService.createOrder.calls.mostRecent().args[0];
      expect(calledWith.codFlag).toBe('N');
    });
  });

  // ---------------------------------------------------------------------------
  // price and contract flags
  // ---------------------------------------------------------------------------
  describe('price and contract flags', () => {
    it('should update priceChangeFlag signal', () => {
      component.onPriceChangeFlagChange('Y');
      expect(component.priceChangeFlag()).toBe('Y');
    });

    it('should update priceChangeFlag to null', () => {
      component.onPriceChangeFlagChange(null);
      expect(component.priceChangeFlag()).toBeNull();
    });

    it('should update contractSubstituteFlag signal', () => {
      component.onContractSubstituteFlagChange('N');
      expect(component.contractSubstituteFlag()).toBe('N');
    });

    it('should update contractSubstituteFlag to null', () => {
      component.onContractSubstituteFlagChange(null);
      expect(component.contractSubstituteFlag()).toBeNull();
    });

    it('should have priceChangeFlag default to null', () => {
      expect(component.priceChangeFlag()).toBeNull();
    });

    it('should have contractSubstituteFlag default to null', () => {
      expect(component.contractSubstituteFlag()).toBeNull();
    });
  });
});
