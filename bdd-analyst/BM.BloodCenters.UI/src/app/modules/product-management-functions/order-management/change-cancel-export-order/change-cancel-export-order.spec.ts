import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';

import { ChangeCancelExportOrderComponent } from './change-cancel-export-order';
import { ExportOrderApiService } from '../enter-export-order/services/export-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  ExportOrderDto,
  ExportOrderItemDto,
  CreateExportOrderItemDto
} from '../enter-export-order/models/export-order.model';

describe('ChangeCancelExportOrderComponent', () => {
  let component: ChangeCancelExportOrderComponent;
  let fixture: ComponentFixture<ChangeCancelExportOrderComponent>;
  let dialogOpenSpy: jasmine.Spy;
  let snackBarOpenSpy: jasmine.Spy;

  const chapterChangedSubject = new Subject<void>();

  const mockOrder: ExportOrderDto = {
    orderNo: 'EX001',
    chapterId: 'CH1',
    customerId: 'CUST1',
    estArrivalTime: '2026-01-15',
    insertDate: '2026-01-01',
    insertUserId: 'user1',
    orderStatus: 'OR',
    items: []
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
    itemNo: 3,
    productType: 'RBC',
    bloodType: 'OP',
    bloodTypeDesc: 'O Positive',
    tier: 1,
    requiredQty: 10,
    unitPrice: 100
  };

  const apiService = jasmine.createSpyObj<ExportOrderApiService>('ExportOrderApiService', [
    'addOrderItem', 'deleteOrderItem', 'cancelOrderItem', 'updateOrder',
    'deleteOrder', 'getOrderNotes', 'saveOrderNotes', 'getOrderCharges'
  ]);

  function resetSpies(): void {
    apiService.addOrderItem.calls.reset();
    apiService.deleteOrderItem.calls.reset();
    apiService.cancelOrderItem.calls.reset();
    apiService.updateOrder.calls.reset();
    apiService.deleteOrder.calls.reset();
    apiService.getOrderNotes.calls.reset();
    apiService.saveOrderNotes.calls.reset();
    apiService.getOrderCharges.calls.reset();

    apiService.addOrderItem.and.returnValue(of(mockOrderItems));
    apiService.deleteOrderItem.and.returnValue(of(true));
    apiService.cancelOrderItem.and.returnValue(of(mockOrderItems));
    apiService.updateOrder.and.returnValue(of({}));
    apiService.deleteOrder.and.returnValue(of(true));
    apiService.getOrderNotes.and.returnValue(of({ note: '' }));
    apiService.saveOrderNotes.and.returnValue(of({}));
    apiService.getOrderCharges.and.returnValue(of([]));
  }

  const headerService = {
    chapterChanged$: chapterChangedSubject.asObservable(),
    chapterTimeZone: jasmine.createSpy().and.returnValue(null)
  };

  const pageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
    pageHeaderData: jasmine.createSpy().and.returnValue(undefined)
  });

  beforeEach(() => {
    resetSpies();

    TestBed.configureTestingModule({
      imports: [
        ChangeCancelExportOrderComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ExportOrderApiService, useValue: apiService },
        { provide: HeaderService, useValue: headerService },
        { provide: PageHeaderService, useValue: pageHeaderService }
      ]
    });

    fixture = TestBed.createComponent(ChangeCancelExportOrderComponent);
    component = fixture.componentInstance;

    dialogOpenSpy = spyOn((component as any).dialog, 'open');
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default signal values', () => {
    expect(component.currentStep()).toBe(1);
    expect(component.loading()).toBeFalse();
    expect(component.saving()).toBeFalse();
    expect(component.isStep1Valid()).toBeFalse();
    expect(component.isReadOnly()).toBeFalse();
    expect(component.orderData()).toEqual({});
    expect(component.orderItems()).toEqual([]);
    expect(component.orderNotes()).toBe('');
  });

  // ---------------------------------------------------------------------------
  // ngOnInit / ngOnDestroy
  // ---------------------------------------------------------------------------
  describe('ngOnInit / ngOnDestroy', () => {
    it('should execute ngOnInit without error', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should call next and complete on destroy$', () => {
      const destroy$ = (component as any).destroy$ as Subject<void>;
      spyOn(destroy$, 'next');
      spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroy$.next).toHaveBeenCalled();
      expect(destroy$.complete).toHaveBeenCalled();
    });

    it('should reset form on chapter change', () => {
      component.ngOnInit();
      spyOn(component, 'resetForm');

      chapterChangedSubject.next();

      expect(component.resetForm).toHaveBeenCalled();
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

    it('should reset isReadOnly to false', () => {
      component.isReadOnly.set(true);
      component.resetForm();
      expect(component.isReadOnly()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------------
  // onStep1FormDataChange / onStep1ValidityChange
  // ---------------------------------------------------------------------------
  describe('onStep1FormDataChange', () => {
    it('should update orderData signal with provided data', () => {
      const data: Partial<ExportOrderDto> = { customerId: 'CUST1', orderedBy: 'John' };
      component.onStep1FormDataChange(data);
      expect(component.orderData()).toEqual(data);
    });

    it('should merge with existing orderData', () => {
      component.orderData.set({ customerId: 'CUST1' });
      component.onStep1FormDataChange({ orderedBy: 'John' });
      expect(component.orderData()).toEqual(jasmine.objectContaining({
        customerId: 'CUST1',
        orderedBy: 'John'
      }));
    });
  });

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
  // onOrderLoaded
  // ---------------------------------------------------------------------------
  describe('onOrderLoaded', () => {
    it('should set orderData and orderItems on order loaded', () => {
      component.onOrderLoaded({ order: mockOrder, items: mockOrderItems });
      expect(component.orderData()).toEqual(mockOrder);
      expect(component.orderItems()).toEqual(mockOrderItems);
    });

    it('should set isReadOnly=true for status CA', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'CA' }, items: [] });
      expect(component.isReadOnly()).toBeTrue();
    });

    it('should set isReadOnly=true for status SH', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'SH' }, items: [] });
      expect(component.isReadOnly()).toBeTrue();
    });

    it('should set isReadOnly=true for status CL', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'CL' }, items: [] });
      expect(component.isReadOnly()).toBeTrue();
    });

    it('should set isReadOnly=true for status DL', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'DL' }, items: [] });
      expect(component.isReadOnly()).toBeTrue();
    });

    it('should set isReadOnly=false for status OR', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'OR' }, items: [] });
      expect(component.isReadOnly()).toBeFalse();
    });

    it('should set isReadOnly=false for status BO', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'BO' }, items: [] });
      expect(component.isReadOnly()).toBeFalse();
    });

    it('should set isReadOnly=false for status AL', () => {
      component.onOrderLoaded({ order: { ...mockOrder, orderStatus: 'AL' }, items: [] });
      expect(component.isReadOnly()).toBeFalse();
    });

    it('should enable action buttons after order loaded', () => {
      component.onOrderLoaded({ order: mockOrder, items: mockOrderItems });
      const actions = component.headerConfig.actions || [];
      actions.forEach(action => {
        expect(action.disabled).toBeFalse();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  describe('navigation', () => {
    it('goToStep2 should set currentStep to 2 when step1 is valid', () => {
      component.isStep1Valid.set(true);
      component.goToStep2();
      expect(component.currentStep()).toBe(2);
    });

    it('goToStep2 should not change step when step1 is invalid', () => {
      component.isStep1Valid.set(false);
      component.goToStep2();
      expect(component.currentStep()).toBe(1);
    });

    it('goToStep1 should set currentStep to 1', () => {
      component.currentStep.set(2);
      component.goToStep1();
      expect(component.currentStep()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // onItemAdded
  // ---------------------------------------------------------------------------
  describe('onItemAdded', () => {
    beforeEach(() => {
      component.orderData.set({ orderNo: 'EX001', customerId: 'CUST1' });
    });

    it('should call addOrderItem when orderNo exists', () => {
      component.onItemAdded(mockItem);
      expect(apiService.addOrderItem).toHaveBeenCalledWith('EX001', mockItem);
    });

    it('should set saving true during API call', () => {
      const subject = new Subject<ExportOrderItemDto[]>();
      apiService.addOrderItem.and.returnValue(subject.asObservable());

      component.onItemAdded(mockItem);
      expect(component.saving()).toBeTrue();
    });

    it('should set saving false on success', () => {
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should update orderItems on success', () => {
      component.onItemAdded(mockItem);
      expect(component.orderItems()).toEqual(mockOrderItems);
    });

    it('should not call API when no orderNo', () => {
      component.orderData.set({});
      component.onItemAdded(mockItem);
      expect(apiService.addOrderItem).not.toHaveBeenCalled();
    });

    it('should set saving false on error', () => {
      apiService.addOrderItem.and.returnValue(throwError(() => new Error('fail')));
      component.onItemAdded(mockItem);
      expect(component.saving()).toBeFalse();
    });

    it('should show error snackbar on error', () => {
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
  // onItemDeleted
  // ---------------------------------------------------------------------------
  describe('onItemDeleted', () => {
    it('should call deleteOrderItem API', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(apiService.deleteOrderItem).toHaveBeenCalledWith('EX001', 1);
    });

    it('should remove item from orderItems on success', () => {
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(component.orderItems().length).toBe(1);
      expect(component.orderItems()[0].itemNo).toBe(2);
    });

    it('should not call API when no orderNo', () => {
      component.orderData.set({});
      component.orderItems.set([...mockOrderItems]);

      component.onItemDeleted(1);

      expect(apiService.deleteOrderItem).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onItemCanceled
  // ---------------------------------------------------------------------------
  describe('onItemCanceled', () => {
    beforeEach(() => {
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);
    });

    it('should call cancelOrderItem API', () => {
      component.onItemCanceled(1);
      expect(apiService.cancelOrderItem).toHaveBeenCalledWith('EX001', 1);
    });

    it('should update orderItems on success', () => {
      const updatedItems: ExportOrderItemDto[] = [
        { ...mockOrderItems[0], itemStatus: 'CA' },
        mockOrderItems[1]
      ];
      apiService.cancelOrderItem.and.returnValue(of(updatedItems));

      component.onItemCanceled(1);

      expect(component.orderItems()).toEqual(updatedItems);
    });

    it('should show success snackbar on cancel success', () => {
      component.onItemCanceled(1);
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Item 1 has been canceled.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should fallback to deleteOrderItem on cancel error', () => {
      apiService.cancelOrderItem.and.returnValue(throwError(() => new Error('fail')));

      component.onItemCanceled(1);

      expect(apiService.deleteOrderItem).toHaveBeenCalledWith('EX001', 1);
    });

    it('should show error when both cancel and delete fail', () => {
      apiService.cancelOrderItem.and.returnValue(throwError(() => new Error('cancel fail')));
      apiService.deleteOrderItem.and.returnValue(throwError(() => new Error('delete fail')));

      component.onItemCanceled(1);

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to cancel item. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onReleaseOrder
  // ---------------------------------------------------------------------------
  describe('onReleaseOrder', () => {
    it('should show error snackbar when no items', () => {
      component.orderItems.set([]);
      component.onReleaseOrder();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'No items in this order.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should open confirm dialog when items exist', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should call updateOrder with RL status on confirm', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(apiService.updateOrder).toHaveBeenCalledWith('EX001', { orderStatus: 'RL' });
    });

    it('should show success snackbar after release', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Export Order Number EX001 is Printing',
        'DISMISS',
        jasmine.objectContaining({ duration: 8000 })
      );
    });

    it('should reset form after release', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      spyOn(component, 'resetForm').and.callThrough();
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(component.resetForm).toHaveBeenCalled();
    });

    it('should not release when dialog cancelled', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(apiService.updateOrder).not.toHaveBeenCalled();
    });

    it('should handle release error', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      apiService.updateOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });
      component.orderItems.set([...mockOrderItems]);

      component.onReleaseOrder();

      expect(component.saving()).toBeFalse();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to release order. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onCancelOrder
  // ---------------------------------------------------------------------------
  describe('onCancelOrder', () => {
    it('should not do anything when no orderNo', () => {
      component.orderData.set({});
      component.onCancelOrder();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open confirm dialog', () => {
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig).toEqual(jasmine.objectContaining({
        width: '500px',
        disableClose: true
      }));
    });

    it('should call deleteOrder on confirm', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(apiService.deleteOrder).toHaveBeenCalledWith('EX001');
    });

    it('should show success snackbar after cancel', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Export order EX001 has been canceled.',
        'DISMISS',
        jasmine.objectContaining({ duration: 8000 })
      );
    });

    it('should reset form after cancel', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      spyOn(component, 'resetForm').and.callThrough();
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(component.resetForm).toHaveBeenCalled();
    });

    it('should not call deleteOrder when dialog cancelled', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(false) } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(apiService.deleteOrder).not.toHaveBeenCalled();
    });

    it('should handle cancel order error', () => {
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(true) } as any);
      apiService.deleteOrder.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });

      component.onCancelOrder();

      expect(component.saving()).toBeFalse();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to cancel order. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onAddNotes
  // ---------------------------------------------------------------------------
  describe('onAddNotes', () => {
    it('should not do anything when no orderNo', () => {
      component.orderData.set({});
      component.onAddNotes();
      expect(apiService.getOrderNotes).not.toHaveBeenCalled();
    });

    it('should fetch notes and open dialog', () => {
      apiService.getOrderNotes.and.returnValue(of({ note: 'Existing note' }));
      const afterClosedSubject = new Subject<any>();
      dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onAddNotes();

      expect(apiService.getOrderNotes).toHaveBeenCalledWith('EX001');
      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig).toEqual(jasmine.objectContaining({
        width: '500px',
        height: '100vh',
        panelClass: 'right-panel-dialog'
      }));
      expect(dialogConfig.data.notes).toBe('Existing note');
    });

    it('should save notes on dialog close with result', () => {
      apiService.getOrderNotes.and.returnValue(of({ note: '' }));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of('New note text') } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onAddNotes();

      expect(apiService.saveOrderNotes).toHaveBeenCalledWith('EX001', 'New note text');
      expect(component.orderNotes()).toBe('New note text');
    });

    it('should not save when dialog returns null', () => {
      apiService.getOrderNotes.and.returnValue(of({ note: '' }));
      dialogOpenSpy.and.returnValue({ afterClosed: () => of(null) } as any);
      component.orderData.set({ orderNo: 'EX001' });

      component.onAddNotes();

      expect(apiService.saveOrderNotes).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onCharges
  // ---------------------------------------------------------------------------
  describe('onCharges', () => {
    it('should not do anything when no orderNo', () => {
      component.orderData.set({});
      component.onCharges();
      expect(apiService.getOrderCharges).not.toHaveBeenCalled();
    });

    it('should fetch charges and open dialog', () => {
      const charges = [{ chargeCode: 'DEL', amount: 50 }];
      apiService.getOrderCharges.and.returnValue(of(charges));
      component.orderData.set({ orderNo: 'EX001' });

      component.onCharges();

      expect(apiService.getOrderCharges).toHaveBeenCalledWith('EX001');
      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig).toEqual(jasmine.objectContaining({
        width: '800px',
        height: '100vh',
        panelClass: 'right-panel-dialog'
      }));
      const data = dialogConfig.data;
      expect(data.orderNo).toBe('EX001');
      expect(data.charges).toEqual(charges);
      expect(data.apiService).toBe(apiService);
    });

    it('should handle charges API error gracefully', () => {
      apiService.getOrderCharges.and.returnValue(throwError(() => new Error('fail')));
      component.orderData.set({ orderNo: 'EX001' });

      component.onCharges();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const data = dialogOpenSpy.calls.mostRecent().args[1].data;
      expect(data.charges).toEqual([]);
    });
  });
});
