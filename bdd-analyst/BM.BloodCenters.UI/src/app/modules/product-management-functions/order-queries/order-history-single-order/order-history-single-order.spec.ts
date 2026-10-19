import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';

import { OrderHistorySingleOrderComponent } from './order-history-single-order';
import { OrderHistorySingleOrderApiService } from './services/order-history-single-order-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  OrderHistoryDto,
  OrderItemDto,
  OrderSearchResultDto,
  ReturnResult,
} from './models/order-history-single-order.model';
import { OrderedAttributesAntigensDialogComponent } from './dialogs/ordered-attributes-antigens-dialog/ordered-attributes-antigens-dialog';
import { ShippedProductsDialogComponent } from './dialogs/shipped-products-dialog/shipped-products-dialog';
import { ShippedAttributesAntigensDialogComponent } from './dialogs/shipped-attributes-antigens-dialog/shipped-attributes-antigens-dialog';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('OrderHistorySingleOrderComponent', () => {
  let component: OrderHistorySingleOrderComponent;
  let fixture: ComponentFixture<OrderHistorySingleOrderComponent>;
  let apiServiceSpy: jasmine.SpyObj<OrderHistorySingleOrderApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<any>;

  const mockSearchResults: OrderSearchResultDto[] = [
    { orderNo: 'ORD-001', customerId: 'CUST-01', customerName: 'Hospital A' },
    { orderNo: 'ORD-002', customerId: 'CUST-02', customerName: 'Hospital B' },
  ];

  const mockItem: OrderItemDto = {
    itemNo: 1,
    productType: 'Red Blood Cells',
    aboRh: 'O+',
    required: 5,
    allocated: 3,
    canceled: 0,
    status: 'Partial',
    hasNotes: true,
  };

  const mockItemNoNotes: OrderItemDto = {
    itemNo: 2,
    productType: 'Platelets',
    aboRh: 'A-',
    required: 2,
    allocated: 2,
    canceled: 0,
    status: 'Complete',
    hasNotes: false,
  };

  const mockOrderHistory: OrderHistoryDto = {
    orderNo: 'ORD-001',
    orderedBy: 'Dr. Smith',
    customerId: 'CUST-01',
    customerName: 'Hospital A',
    priority: 'Urgent',
    type: 'Standard',
    status: 'Open',
    estArrivalTime: '2025-03-15T09:30:00',
    items: [mockItem, mockItemNoNotes],
    history: [
      { actionFunction: 'Created', dateTime: '2025-03-01T08:00:00', userName: 'admin' },
      { actionFunction: 'Updated', dateTime: '2025-03-02T10:30:00', userName: 'nurse1' },
    ],
    orderNotes: [{ note: 'Urgent order' }],
  };

  const mockOrderNoItems: OrderHistoryDto = {
    orderNo: 'ORD-003',
    customerId: 'CUST-03',
    items: [],
    history: [],
    orderNotes: [],
  };

  const successSearchResponse: ReturnResult<OrderSearchResultDto[]> = {
    success: true,
    message: '',
    statusCode: 200,
    item: mockSearchResults as any,
  };

  const successOrderResponse: ReturnResult<OrderHistoryDto> = {
    success: true,
    message: '',
    statusCode: 200,
    item: mockOrderHistory,
  };

  const failedOrderResponse: ReturnResult<OrderHistoryDto> = {
    success: false,
    message: 'Order not found',
    statusCode: 404,
    errorResponse: { errorCode: '404', error: 'Order not found' },
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('OrderHistorySingleOrderApiService', [
      'searchOrders',
      'getOrderHistory',
      'getItemNotes',
      'getOrderedAttributesAntigens',
      'getShippedProducts',
      'getShippedAttributesAntigens',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    chapterChanged$ = new Subject<any>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    apiServiceSpy.searchOrders.and.returnValue(of(successSearchResponse));

    TestBed.configureTestingModule({
      imports: [OrderHistorySingleOrderComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: OrderHistorySingleOrderApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });

    fixture = TestBed.createComponent(OrderHistorySingleOrderComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should not have searched initially', () => {
      fixture.detectChanges();
      expect(component.hasSearched).toBeFalse();
    });

    it('should not be loading initially', () => {
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    });

    it('should have null orderData initially', () => {
      fixture.detectChanges();
      expect(component.orderData()).toBeNull();
    });

    it('should have null selectedItem initially', () => {
      fixture.detectChanges();
      expect(component.selectedItem()).toBeNull();
    });

    it('should have empty itemNotes initially', () => {
      fixture.detectChanges();
      expect(component.itemNotes()).toEqual([]);
    });

    it('should load orders on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalled();
    });

    it('should set up orderNo search ctrl subscription', fakeAsync(() => {
      fixture.detectChanges();
      component.orderNoSearchCtrl.setValue('test');
      tick();
      expect(component.orderNoSearch()).toBe('test');
    }));

    it('should set up orderNo value change subscription to auto-retrieve', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(of({ success: true, message: '', statusCode: 200, item: [] as any }));
      component.filterForm.get('orderNo')?.setValue('ORD-001');
      tick();
      expect(apiServiceSpy.getOrderHistory).toHaveBeenCalledWith('ORD-001');
    }));

    it('should clear results when orderNo changes to empty', fakeAsync(() => {
      fixture.detectChanges();
      component.orderData.set(mockOrderHistory);
      component.hasSearched = true;
      component.filterForm.get('orderNo')?.setValue('');
      tick();
      expect(component.orderData()).toBeNull();
      expect(component.hasSearched).toBeFalse();
    }));
  });

  describe('Order Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate orderNoOptions on successful search', () => {
      expect(component.orderNoOptions()).toEqual(mockSearchResults);
    });

    it('should handle empty search results', () => {
      apiServiceSpy.searchOrders.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );
      (component as any).loadOrders();
      expect(component.orderNoOptions()).toEqual([]);
    });

    it('should handle search API error', () => {
      apiServiceSpy.searchOrders.and.returnValue(throwError(() => new Error('Network error')));
      (component as any).loadOrders();
      expect(component.isLoadingOrders).toBeFalse();
    });

    it('should handle null response item in loadOrders', () => {
      apiServiceSpy.searchOrders.and.returnValue(of({
        success: true, message: '', statusCode: 200, item: null as any,
      }));
      (component as any).loadOrders();
      expect(component.orderNoOptions()).toEqual([]);
    });

    it('should handle unsuccessful search response', () => {
      apiServiceSpy.searchOrders.and.returnValue(of({
        success: false, message: 'Error', statusCode: 500, item: null as any,
      }));
      (component as any).loadOrders();
      expect(component.isLoadingOrders).toBeFalse();
    });

    it('should set isLoadingOrders to true during load', () => {
      expect(component.isLoadingOrders).toBeFalse();
    });
  });

  describe('Filtered Order Numbers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all options when search is empty', () => {
      component.orderNoSearch.set('');
      expect(component.filteredOrderNos()).toEqual(mockSearchResults);
    });

    it('should filter by orderNo', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('ORD-001');
      tick();
      const filtered = component.filteredOrderNos();
      expect(filtered.length).toBe(1);
      expect(filtered[0].orderNo).toBe('ORD-001');
    }));

    it('should filter by customerId', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('CUST-02');
      tick();
      const filtered = component.filteredOrderNos();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('CUST-02');
    }));

    it('should filter by customerName', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('Hospital A');
      tick();
      const filtered = component.filteredOrderNos();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerName).toBe('Hospital A');
    }));

    it('should return empty array when no match found', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('ZZZZZ');
      tick();
      expect(component.filteredOrderNos().length).toBe(0);
    }));

    it('should be case-insensitive', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('hospital b');
      tick();
      const filtered = component.filteredOrderNos();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerName).toBe('Hospital B');
    }));
  });

  describe('Order Retrieval', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load order history on retrieve', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [{ note: 'Test note' }] as any }),
      );

      component.onRetrieve('ORD-001');

      expect(apiServiceSpy.getOrderHistory).toHaveBeenCalledWith('ORD-001');
      expect(component.orderData()).toEqual(mockOrderHistory);
      expect(component.isLoading).toBeFalse();
      expect(component.hasSearched).toBeTrue();
    });

    it('should populate "by" field from order response', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );

      component.onRetrieve('ORD-001');

      expect(component.filterForm.get('by')?.value).toBe('Dr. Smith');
    });

    it('should select first item when order has items', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [{ note: 'Note' }] as any }),
      );

      component.onRetrieve('ORD-001');

      expect(component.selectedItem()).toEqual(mockItem);
    });

    it('should not select any item when order has no items', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of({
        success: true, message: '', statusCode: 200, item: mockOrderNoItems,
      }));

      component.onRetrieve('ORD-003');

      expect(component.selectedItem()).toBeNull();
    });

    it('should not patch "by" when orderedBy is empty', () => {
      const orderNoBy = { ...mockOrderHistory, orderedBy: '' };
      apiServiceSpy.getOrderHistory.and.returnValue(of({
        success: true, message: '', statusCode: 200, item: orderNoBy,
      }));
      apiServiceSpy.getItemNotes.and.returnValue(of({ success: true, message: '', statusCode: 200, item: [] as any }));

      component.onRetrieve('ORD-001');

      expect(component.filterForm.get('by')?.value).toBe('');
    });

    it('should show error on failed response with errorResponse', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(failedOrderResponse));

      component.onRetrieve('ORD-FAIL');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order not found');
      expect(component.orderData()).toBeNull();
    });

    it('should show error on failed response with message only', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of({
        success: false, message: 'Some error', statusCode: 400,
      }));

      component.onRetrieve('ORD-FAIL');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some error');
    });

    it('should use fallback message when response has no errorResponse or message', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of({
        success: false, message: '', statusCode: 500,
      }));

      component.onRetrieve('ORD-999');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve order history.');
    });

    it('should show error on API exception', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(throwError(() => ({ status: 500 })));

      component.onRetrieve('ORD-ERR');

      expect(component.isLoading).toBeFalse();
      expect(component.orderData()).toBeNull();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should set isLoading to true at start of retrieve', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(of({ success: true, message: '', statusCode: 200, item: [] as any }));

      component.isLoading = false;
      component.onRetrieve('ORD-001');

      expect(component.hasSearched).toBeTrue();
    });

    it('should reset selectedItem and itemNotes before retrieve', () => {
      component.selectedItem.set(mockItem);
      component.itemNotes.set([{ note: 'old' }]);

      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(of({ success: true, message: '', statusCode: 200, item: [] as any }));

      component.onRetrieve('ORD-001');

      expect(component.orderData()).toBeTruthy();
    });
  });

  describe('Item Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set selectedItem when selectItem is called', () => {
      component.selectItem(mockItem);
      expect(component.selectedItem()).toEqual(mockItem);
    });

    it('should load notes for items with hasNotes=true', () => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [{ note: 'A note' }] as any }),
      );

      component.selectItem(mockItem);

      expect(apiServiceSpy.getItemNotes).toHaveBeenCalledWith('ORD-001', 1);
      expect(component.notesPanelVisible()).toBeTrue();
    });

    it('should clear notes for items without notes', () => {
      component.selectItem(mockItemNoNotes);

      expect(component.itemNotes()).toEqual([]);
      expect(apiServiceSpy.getItemNotes).not.toHaveBeenCalled();
      expect(component.notesPanelVisible()).toBeFalse();
    });

    it('should handle notes API error gracefully', () => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getItemNotes.and.returnValue(throwError(() => new Error('Network error')));

      component.selectItem(mockItem);

      expect(component.isLoadingNotes).toBeFalse();
      expect(component.itemNotes()).toEqual([]);
    });

    it('should handle unsuccessful notes response', () => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: false, message: 'Error', statusCode: 500 }),
      );

      component.selectItem(mockItem);

      expect(component.itemNotes()).toEqual([]);
    });

    it('should set showingOrderNotes to false when selecting item', () => {
      component.showingOrderNotes.set(true);
      component.selectItem(mockItem);
      expect(component.showingOrderNotes()).toBeFalse();
    });

    it('should not load notes when orderData is null', () => {
      component.orderData.set(null);
      const itemWithNotes: OrderItemDto = { ...mockItem, hasNotes: true };
      component.selectItem(itemWithNotes);
      expect(apiServiceSpy.getItemNotes).not.toHaveBeenCalled();
    });

    it('should set notes from array response', () => {
      component.orderData.set(mockOrderHistory);
      const mockNotes = [{ note: 'Note 1' }, { note: 'Note 2' }];
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: mockNotes as any }),
      );

      component.selectItem(mockItem);

      expect(component.itemNotes().length).toBe(2);
    });

    it('should handle non-array item notes response', () => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: null as any }),
      );

      component.selectItem(mockItem);

      expect(component.itemNotes()).toEqual([]);
    });
  });

  describe('Show Order Notes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle showOrderNotes on - show panel', () => {
      component.showingOrderNotes.set(false);
      component.notesPanelVisible.set(false);

      component.showOrderNotes();

      expect(component.showingOrderNotes()).toBeTrue();
      expect(component.notesPanelVisible()).toBeTrue();
    });

    it('should toggle showOrderNotes off - hide panel', () => {
      component.showingOrderNotes.set(true);
      component.notesPanelVisible.set(true);

      component.showOrderNotes();

      expect(component.showingOrderNotes()).toBeFalse();
      expect(component.notesPanelVisible()).toBeFalse();
    });

    it('should show panel when showingOrderNotes is true but panel not visible', () => {
      component.showingOrderNotes.set(true);
      component.notesPanelVisible.set(false);

      component.showOrderNotes();

      expect(component.showingOrderNotes()).toBeTrue();
      expect(component.notesPanelVisible()).toBeTrue();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and clear results', () => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);
      component.hasSearched = true;

      component.onClear();

      expect(component.filterForm.get('orderNo')?.value).toBe('');
      expect(component.filterForm.get('by')?.value).toBe('');
      expect(component.orderData()).toBeNull();
      expect(component.selectedItem()).toBeNull();
      expect(component.itemNotes()).toEqual([]);
      expect(component.hasSearched).toBeFalse();
    });

    it('should reset orderNoSearchCtrl', () => {
      component.orderNoSearchCtrl.setValue('test');
      component.onClear();
      expect(component.orderNoSearchCtrl.value).toBe('');
    });

    it('should reset orderNoSearch signal', () => {
      component.orderNoSearch.set('test');
      component.onClear();
      expect(component.orderNoSearch()).toBe('');
    });

    it('should reset notesPanelVisible', () => {
      component.notesPanelVisible.set(true);
      component.onClear();
      expect(component.notesPanelVisible()).toBeFalse();
    });

    it('should reset showingOrderNotes', () => {
      component.showingOrderNotes.set(true);
      component.onClear();
      expect(component.showingOrderNotes()).toBeFalse();
    });
  });

  describe('hasAnyFieldValue', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form is empty', () => {
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when orderNo has value', () => {
      component.filterForm.patchValue({ orderNo: 'ORD-001' }, { emitEvent: false });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when by has value', () => {
      component.filterForm.patchValue({ by: 'Dr. Smith' }, { emitEvent: false });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when both have values', () => {
      component.filterForm.patchValue({ orderNo: 'ORD-001', by: 'Dr. Smith' }, { emitEvent: false });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('onSelectOpenedChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset search ctrl on select closed', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('test');
      tick();
      component.onSelectOpenedChange(false);
      expect(component.orderNoSearchCtrl.value).toBe('');
    }));

    it('should not reset search ctrl on select opened', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('test');
      tick();
      component.onSelectOpenedChange(true);
      expect(component.orderNoSearchCtrl.value).toBe('test');
    }));
  });

  describe('Utility Methods', () => {
    it('should return "--" for null values', () => {
      expect(component.displayValue(null)).toBe('--');
    });

    it('should return "--" for undefined values', () => {
      expect(component.displayValue(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.displayValue('')).toBe('--');
    });

    it('should convert number to string', () => {
      expect(component.displayValue(42)).toBe('42');
    });

    it('should return string value as-is', () => {
      expect(component.displayValue('hello')).toBe('hello');
    });

    it('should convert zero to string', () => {
      expect(component.displayValue(0)).toBe('0');
    });

    it('should format valid date-time strings', () => {
      const result = component.formatDateTime('2025-03-01T09:30:00');
      expect(result).toBe('1-MAR-2025, 09:30');
    });

    it('should format date with midnight time', () => {
      const result = component.formatDateTime('2025-01-15T00:00:00');
      expect(result).toBe('15-JAN-2025, 00:00');
    });

    it('should return "--" for null date', () => {
      expect(component.formatDateTime(null)).toBe('--');
    });

    it('should return "--" for undefined date', () => {
      expect(component.formatDateTime(undefined)).toBe('--');
    });

    it('should return "--" for empty string date', () => {
      expect(component.formatDateTime('')).toBe('--');
    });

    it('should return original for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Open Ordered Attributes/Antigens Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog on success', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { itemNo: 1, attributes: [{ group: 'G', code: 'C' }], antigens: [{ id: 'A1' }] },
      }));

      component.openOrderedAttributesAntigens();
      tick();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        OrderedAttributesAntigensDialogComponent,
        jasmine.objectContaining({ width: '750px' }),
      );
    }));

    it('should pass correct data to dialog', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { itemNo: 1, attributes: [{ group: 'G', code: 'C' }], antigens: [] },
      }));

      component.openOrderedAttributesAntigens();
      tick();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.itemNo).toBe(1);
      expect(dialogData.attributes.length).toBe(1);
    }));

    it('should handle null attributes/antigens in response', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { itemNo: 1, attributes: null, antigens: null },
      }));

      component.openOrderedAttributesAntigens();
      tick();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.attributes).toEqual([]);
      expect(dialogData.antigens).toEqual([]);
    }));

    it('should show error when API returns success=false', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: false, message: 'No data', statusCode: 404,
      }));
      component.openOrderedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No data');
    }));

    it('should show error with errorResponse.error when available', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: false, message: 'Msg', statusCode: 404,
        errorResponse: { errorCode: '404', error: 'Custom error' },
      }));
      component.openOrderedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom error');
    }));

    it('should use fallback message when no error info', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(of({
        success: false, message: '', statusCode: 404,
      }));
      component.openOrderedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No data found.');
    }));

    it('should show error when API throws', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(mockItem);

      apiServiceSpy.getOrderedAttributesAntigens.and.returnValue(throwError(() => ({ status: 500 })));
      component.openOrderedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should not open dialog when orderData is null', () => {
      component.orderData.set(null);
      component.openOrderedAttributesAntigens();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not open dialog when selectedItem is null', () => {
      component.orderData.set(mockOrderHistory);
      component.selectedItem.set(null);
      component.openOrderedAttributesAntigens();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Open Shipped Products Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog on success', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);

      apiServiceSpy.getShippedProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { products: [{ unitId: 'U1', product: 'P1', expirationDate: '', shipment: 'S1' }] },
      }));
      component.openShippedProducts();
      tick();
      expect(dialogSpy.open).toHaveBeenCalledWith(
        ShippedProductsDialogComponent,
        jasmine.objectContaining({ width: '850px' }),
      );
    }));

    it('should handle null products in response', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);

      apiServiceSpy.getShippedProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { products: null },
      }));
      component.openShippedProducts();
      tick();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.records).toEqual([]);
    }));

    it('should show error when API returns success=false', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedProducts.and.returnValue(of({
        success: false, message: 'No shipped products', statusCode: 404,
      }));
      component.openShippedProducts();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No shipped products');
    }));

    it('should show error with errorResponse.error when available', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedProducts.and.returnValue(of({
        success: false, message: '', statusCode: 500,
        errorResponse: { errorCode: '500', error: 'Server error' },
      }));
      component.openShippedProducts();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should show error when API throws', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedProducts.and.returnValue(throwError(() => ({ status: 500 })));
      component.openShippedProducts();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should not open dialog when orderData is null', () => {
      component.orderData.set(null);
      component.openShippedProducts();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Open Shipped Attributes/Antigens Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog on success', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { antigens: [{ unitId: 'U1', product: 'P', testId: 'T', result: 'R' }], attributes: [] },
      }));
      component.openShippedAttributesAntigens();
      tick();
      expect(dialogSpy.open).toHaveBeenCalledWith(
        ShippedAttributesAntigensDialogComponent,
        jasmine.objectContaining({ width: '950px' }),
      );
    }));

    it('should handle null antigens/attributes in response', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { antigens: null, attributes: null },
      }));
      component.openShippedAttributesAntigens();
      tick();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.antigens).toEqual([]);
      expect(dialogData.attributes).toEqual([]);
    }));

    it('should show error when API returns success=false with errorResponse', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: false, message: '', statusCode: 404,
        errorResponse: { errorCode: '404', error: 'No data found' },
      }));
      component.openShippedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No data found');
    }));

    it('should show error with message when no errorResponse', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: false, message: 'Error msg', statusCode: 500,
      }));
      component.openShippedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error msg');
    }));

    it('should use fallback when no error info', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: false, message: '', statusCode: 500,
      }));
      component.openShippedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No data found.');
    }));

    it('should show error when API throws', fakeAsync(() => {
      component.orderData.set(mockOrderHistory);
      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(throwError(() => ({ status: 500 })));
      component.openShippedAttributesAntigens();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should not open dialog when orderData is null', () => {
      component.orderData.set(null);
      component.openShippedAttributesAntigens();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Chapter Change', () => {
    it('should clear data and reload orders when chapter changes', () => {
      fixture.detectChanges();
      component.orderData.set(mockOrderHistory);
      component.hasSearched = true;
      chapterChanged$.next({});

      expect(component.orderData()).toBeNull();
      expect(component.hasSearched).toBeFalse();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalled();
    });

    it('should reset selectedItem on chapter change', () => {
      fixture.detectChanges();
      component.selectedItem.set(mockItem);
      chapterChanged$.next({});

      expect(component.selectedItem()).toBeNull();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show empty state before search', () => {
      const emptyState = fixture.nativeElement.querySelector('.empty-state-title');
      expect(emptyState?.textContent).toContain('No Results to Display');
    });

    it('should show "No Results Found" after search with no results', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(failedOrderResponse));
      component.onRetrieve('ORD-NONE');
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state-title');
      expect(emptyState?.textContent).toContain('No Results Found');
    });

    it('should display order data after successful retrieve', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );
      component.onRetrieve('ORD-001');
      fixture.detectChanges();

      const sectionTitle = fixture.nativeElement.querySelector('.order-history__section-title');
      expect(sectionTitle?.textContent).toContain('Ordered Products');
    });

    it('should display status field in retrieve card', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );
      component.onRetrieve('ORD-001');
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.order-history__info-label');
      const labelTexts = Array.from(labels).map((l: any) => l.textContent.trim());
      expect(labelTexts).toContain('Status');
    });

    it('should display audit trail entries', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );
      component.onRetrieve('ORD-001');
      fixture.detectChanges();

      const auditTitle = fixture.nativeElement.querySelectorAll('.order-history__section-title');
      const titles = Array.from(auditTitle).map((t: any) => t.textContent.trim());
      expect(titles).toContain('Audit Trail');
    });

    it('should have a clear all button', () => {
      const clearBtn = fixture.nativeElement.querySelector('.btn-clear');
      expect(clearBtn).toBeTruthy();
      expect(clearBtn.textContent.trim()).toContain('CLEAR ALL');
    });

    it('should render order items in table', () => {
      apiServiceSpy.getOrderHistory.and.returnValue(of(successOrderResponse));
      apiServiceSpy.getItemNotes.and.returnValue(
        of({ success: true, message: '', statusCode: 200, item: [] as any }),
      );
      component.onRetrieve('ORD-001');
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('.data-table tbody tr');
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Header Config Effect', () => {
    it('should update headerConfig when pageHeaderData emits', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Some subtitle',
      });
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Order History');
      expect(component.headerConfig.subtitle).toBe('Some subtitle');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Order History');
    }));

    it('should use default subtitle when pageHeaderData subtitle is empty', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: '',
      });
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.subtitle).toBe(
        'Track the complete fulfillment life cycle and audit trail for an individual order.',
      );
    }));

    it('should disable action buttons when no order data', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      component.orderData.set(null);
      fixture.detectChanges();
      tick();

      const actions = component.headerConfig.actions!;
      expect(actions.length).toBe(3);
      expect(actions[0].disabled).toBeTrue();
      expect(actions[1].disabled).toBeTrue();
      expect(actions[2].disabled).toBeTrue();
    }));

    it('should enable action buttons when order data exists', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      component.orderData.set(mockOrderHistory);
      fixture.detectChanges();
      tick();

      const actions = component.headerConfig.actions!;
      expect(actions[0].disabled).toBeFalse();
      expect(actions[1].disabled).toBeFalse();
      expect(actions[2].disabled).toBeFalse();
    }));

    it('should call openOrderedAttributesAntigens from action onClick', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      component.orderData.set(mockOrderHistory);
      fixture.detectChanges();
      tick();

      spyOn(component, 'openOrderedAttributesAntigens');
      component.headerConfig.actions![0].onClick!();
      expect(component.openOrderedAttributesAntigens).toHaveBeenCalled();
    }));

    it('should call openShippedProducts from action onClick', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      component.orderData.set(mockOrderHistory);
      fixture.detectChanges();
      tick();

      apiServiceSpy.getShippedProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { products: [] },
      }));
      component.headerConfig.actions![1].onClick!();
      expect(apiServiceSpy.getShippedProducts).toHaveBeenCalled();
    }));

    it('should call openShippedAttributesAntigens from action onClick', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      component.orderData.set(mockOrderHistory);
      fixture.detectChanges();
      tick();

      apiServiceSpy.getShippedAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: { antigens: [], attributes: [] },
      }));
      component.headerConfig.actions![2].onClick!();
      expect(apiServiceSpy.getShippedAttributesAntigens).toHaveBeenCalled();
    }));

    it('should not update headerConfig when pageHeaderData is null', fakeAsync(() => {
      const initialConfig = { ...component.headerConfig };
      (pageHeaderServiceSpy.pageHeaderData as any).set(null);
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe(initialConfig.title);
    }));

    it('should have correct action labels', fakeAsync(() => {
      (pageHeaderServiceSpy.pageHeaderData as any).set({
        title: 'Order History',
        subtitle: 'Sub',
      });
      fixture.detectChanges();
      tick();

      const actions = component.headerConfig.actions!;
      expect(actions[0].label).toBe('ORDERED ATTRIBUTES/ANTIGENS');
      expect(actions[1].label).toBe('SHIPPED PRODUCTS');
      expect(actions[2].label).toBe('SHIPPED ATTRIBUTES/ANTIGENS');
    }));
  });

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
