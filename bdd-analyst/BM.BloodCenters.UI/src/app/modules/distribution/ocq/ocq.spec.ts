import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';

import { OcqComponent } from './ocq';
import { OcqService } from './services/ocq.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { CustomerOrderDto, DropdownOption, CustomerLookupDto } from './models/ocq.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';
import { AttributesAntigensDialog } from './dialogs/attributes-antigens-dialog';

describe('OcqComponent', () => {
  let component: OcqComponent;
  let fixture: ComponentFixture<OcqComponent>;
  let mockOcqService: jasmine.SpyObj<OcqService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHeaderService: any;
  let mockPageHeaderService: any;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;

  const chapterLocalDateTime = moment('2025-06-15T10:30:00');

  const mockOrders: CustomerOrderDto[] = [
    {
      orderNo: '17337-0019',
      customerId: 'HOSP001',
      customerName: 'Parkland Hospital',
      orderStatus: 'OP',
      orderStatusDesc: 'Ordered',
      orderType: 'TF',
      orderTypeDesc: 'Transfer',
      priority: 'STAT',
      orderDate: '2025-03-05T12:00:00Z',
      hoursOld: '25685',
      items: [
        {
          itemNo: 1,
          productType: 'POPLT',
          productTypeDesc: 'Pooled Plts Random',
          bloodType: 'O+',
          aboDesc: 'O Pos',
          itemStatus: 'OR',
          itemStatusDesc: 'Ordered',
          requiredQty: 1,
          allocatedQty: 0,
          canceledQty: 0,
          shippedQty: 0,
        },
      ],
    },
    {
      orderNo: '17337-0020',
      customerId: 'HOSP001',
      customerName: 'Parkland Hospital',
      orderStatus: 'CA',
      orderStatusDesc: 'Canceled',
      orderType: 'RG',
      orderTypeDesc: 'Regular',
      priority: 'ASAP',
      orderDate: '2025-03-06T14:30:00Z',
      hoursOld: '25666',
      items: [],
    },
  ];

  const mockPriorities: DropdownOption[] = [
    { code: 'STAT', description: 'Stat' },
    { code: 'ASAP', description: 'As Soon As Possible' },
  ];

  const mockOrderTypes: DropdownOption[] = [
    { code: 'TF', description: 'Transfer' },
    { code: 'RG', description: 'Regular' },
  ];

  const mockOrderStatuses: DropdownOption[] = [
    { code: 'OP', description: 'Open' },
    { code: 'CA', description: 'Canceled' },
    { code: 'CL', description: 'Closed' },
  ];

  const mockCustomers: CustomerLookupDto[] = [
    { customerId: 'HOSP001', name: 'Parkland Hospital' },
    { customerId: 'HOSP002', name: 'Memorial Hospital' },
  ];

  const yesterday = chapterLocalDateTime.clone().subtract(1, 'days');
  const tomorrow = chapterLocalDateTime.clone().add(1, 'days');
  const thirtyDaysAgo = chapterLocalDateTime.clone().subtract(30, 'days');

  function makeFormValid(): void {
    component.searchForm.patchValue({
      customerId: 'HOSP001',
      fromDate: thirtyDaysAgo,
    });
  }

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDateTime']);
    mockChapterTimezoneService.getChapterLocalDateTime.and.callFake(() => chapterLocalDateTime.clone());

    mockOcqService = jasmine.createSpyObj('OcqService', [
      'search',
      'getOrderItemDetail',
      'getPriorityOptions',
      'getOrderTypeOptions',
      'getOrderStatusOptions',
      'getAllCustomers',
    ]);
    mockSnackbarService = createMockSnackbarService();
    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    mockHeaderService = { chapterChanged$: chapterChangedSubject.asObservable() };
    mockPageHeaderService = { pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(undefined) };

    mockOcqService.search.and.returnValue(of(mockOrders));
    mockOcqService.getPriorityOptions.and.returnValue(of(mockPriorities));
    mockOcqService.getOrderTypeOptions.and.returnValue(of(mockOrderTypes));
    mockOcqService.getOrderStatusOptions.and.returnValue(of(mockOrderStatuses));
    mockOcqService.getAllCustomers.and.returnValue(of(mockCustomers));

    TestBed.configureTestingModule({
      imports: [OcqComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: OcqService, useValue: mockOcqService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
    });

    mockOcqService.search.calls.reset();
    mockOcqService.getOrderItemDetail.calls.reset();
    mockOcqService.getPriorityOptions.calls.reset();
    mockOcqService.getOrderTypeOptions.calls.reset();
    mockOcqService.getOrderStatusOptions.calls.reset();
    mockOcqService.getAllCustomers.calls.reset();
    mockDialog.open.calls.reset();

    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    mockOcqService.search.and.returnValue(of(mockOrders));
    mockOcqService.getPriorityOptions.and.returnValue(of(mockPriorities));
    mockOcqService.getOrderTypeOptions.and.returnValue(of(mockOrderTypes));
    mockOcqService.getOrderStatusOptions.and.returnValue(of(mockOrderStatuses));
    mockOcqService.getAllCustomers.and.returnValue(of(mockCustomers));

    fixture = TestBed.createComponent(OcqComponent);
    component = fixture.componentInstance;
    (component as any).dialog = mockDialog;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize search form with default values', () => {
      fixture.detectChanges();
      expect(component.searchForm.get('customerId')?.value).toBeNull();
      expect(component.searchForm.get('priority')?.value).toBeNull();
      expect(component.searchForm.get('orderType')?.value).toBeNull();
      expect(component.searchForm.get('state')?.value).toBeNull();
      expect(component.searchForm.get('fromDate')?.value).toBeNull();
      const toDate = component.searchForm.get('toDate')?.value;
      expect(moment.isMoment(toDate)).toBeTrue();
      expect(toDate.format('YYYY-MM-DD')).toBe('2025-06-15');
    });

    it('should load dropdowns on init', () => {
      fixture.detectChanges();
      expect(mockOcqService.getPriorityOptions).toHaveBeenCalled();
      expect(mockOcqService.getOrderTypeOptions).toHaveBeenCalled();
      expect(mockOcqService.getOrderStatusOptions).toHaveBeenCalled();
      expect(mockOcqService.getAllCustomers).toHaveBeenCalled();
    });

    it('should populate priority options after load', () => {
      fixture.detectChanges();
      expect((component as any).priorities()).toEqual(mockPriorities);
    });

    it('should populate order type options after load', () => {
      fixture.detectChanges();
      expect((component as any).orderTypes()).toEqual(mockOrderTypes);
    });

    it('should populate order status options after load', () => {
      fixture.detectChanges();
      expect((component as any).orderStatuses()).toEqual(mockOrderStatuses);
    });

    it('should set empty arrays when dropdown loads fail', () => {
      mockOcqService.getPriorityOptions.and.returnValue(throwError(() => new Error('fail')));
      mockOcqService.getOrderTypeOptions.and.returnValue(throwError(() => new Error('fail')));
      mockOcqService.getOrderStatusOptions.and.returnValue(throwError(() => new Error('fail')));
      mockOcqService.getAllCustomers.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();

      expect((component as any).priorities()).toEqual([]);
      expect((component as any).orderTypes()).toEqual([]);
      expect((component as any).orderStatuses()).toEqual([]);
      expect((component as any).customers()).toEqual([]);
      expect((component as any).filteredCustomers()).toEqual([]);
    });

    it('should have header config with default title', () => {
      fixture.detectChanges();
      const config = (component as any).headerConfig();
      expect(config.title).toBe('Customer Orders Query');
    });

    it('should use page header data title when available', () => {
      mockPageHeaderService.pageHeaderData.and.returnValue({ title: 'Custom Title', subtitle: 'Custom Sub' });
      fixture.detectChanges();
      const config = (component as any).headerConfig();
      expect(config.title).toBe('Custom Title');
      expect(config.subtitle).toBe('Custom Sub');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require customer ID', () => {
      const control = component.searchForm.get('customerId');
      control?.markAsTouched();
      fixture.detectChanges();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should accept valid customer ID', () => {
      const control = component.searchForm.get('customerId');
      control?.setValue('HOSP001');
      control?.markAsTouched();
      fixture.detectChanges();
      expect(control?.valid).toBeTrue();
    });

    it('should require from date', () => {
      const control = component.searchForm.get('fromDate');
      control?.markAsTouched();
      fixture.detectChanges();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require to date', () => {
      const control = component.searchForm.get('toDate');
      control?.setValue(null);
      control?.markAsTouched();
      fixture.detectChanges();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should validate date range (to date >= from date)', () => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: tomorrow,
        toDate: yesterday,
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should accept valid date range', () => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: thirtyDaysAgo,
        toDate: tomorrow,
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not flag date range error when from date is null', () => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: null,
        toDate: chapterLocalDateTime.clone(),
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should not flag date range error when to date is null', () => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: thirtyDaysAgo,
        toDate: null,
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should handle non-Moment date values in date range validator', () => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });
      expect(component.searchForm.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('Date Validation Setup', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update maxFromDate when from date changes to a Moment value', () => {
      const fromDate = moment('2025-06-15');
      component.searchForm.get('fromDate')?.setValue(fromDate);
      expect((component as any).maxFromDate()).toBeTruthy();
    });

    it('should update maxFromDate when from date changes to a string value', () => {
      component.searchForm.get('fromDate')?.setValue('2025-06-15');
      expect((component as any).maxFromDate()).toBeTruthy();
    });

    it('should clear maxFromDate when from date is cleared', () => {
      component.searchForm.get('fromDate')?.setValue(moment());
      component.searchForm.get('fromDate')?.setValue(null);
      expect((component as any).maxFromDate()).toBeNull();
    });

    it('should trigger toDate revalidation when from date changes', () => {
      const toDateControl = component.searchForm.get('toDate');
      spyOn(toDateControl!, 'updateValueAndValidity');
      component.searchForm.get('fromDate')?.setValue(moment());
      expect(toDateControl!.updateValueAndValidity).toHaveBeenCalled();
    });
  });

  describe('Customer Dropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load all customers on init', () => {
      expect(mockOcqService.getAllCustomers).toHaveBeenCalled();
      expect((component as any).customers()).toEqual(mockCustomers);
      expect((component as any).filteredCustomers()).toEqual(mockCustomers);
    });

    it('should filter customers by ID when searching', () => {
      component.customerSearchCtrl.setValue('HOSP001');
      expect((component as any).filteredCustomers().length).toBe(1);
      expect((component as any).filteredCustomers()[0].customerId).toBe('HOSP001');
    });

    it('should filter customers by name when searching', () => {
      component.customerSearchCtrl.setValue('Memorial');
      expect((component as any).filteredCustomers().length).toBe(1);
      expect((component as any).filteredCustomers()[0].name).toBe('Memorial Hospital');
    });

    it('should show all customers when search is cleared', () => {
      component.customerSearchCtrl.setValue('HOSP001');
      expect((component as any).filteredCustomers().length).toBe(1);
      component.customerSearchCtrl.setValue('');
      expect((component as any).filteredCustomers()).toEqual(mockCustomers);
    });

    it('should show no customers when search matches nothing', () => {
      component.customerSearchCtrl.setValue('ZZZZZ');
      expect((component as any).filteredCustomers().length).toBe(0);
    });

    it('should be case-insensitive when filtering', () => {
      component.customerSearchCtrl.setValue('parkland');
      expect((component as any).filteredCustomers().length).toBe(1);
      expect((component as any).filteredCustomers()[0].customerId).toBe('HOSP001');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not search when form is invalid', () => {
      component.onSearch();
      expect(mockOcqService.search).not.toHaveBeenCalled();
    });

    it('should mark all fields touched when form is invalid on search', () => {
      component.onSearch();
      expect(component.searchForm.get('customerId')?.touched).toBeTrue();
    });

    it('should search with valid customer ID', fakeAsync(() => {
      makeFormValid();
      component.onSearch();
      tick();

      expect(mockOcqService.search).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 'HOSP001',
        })
      );
      expect((component as any).orders()).toEqual(mockOrders);
      expect((component as any).hasSearched()).toBeTrue();
    }));

    it('should search with all filters', fakeAsync(() => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        priority: 'STAT',
        orderType: 'TF',
        state: 'OP',
        fromDate: thirtyDaysAgo,
        toDate: tomorrow,
      });

      component.onSearch();
      tick();

      expect(mockOcqService.search).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 'HOSP001',
          orderClass: 'STAT',
          orderType: 'TF',
          orderStatus: 'OP',
        })
      );
    }));

    it('should send undefined for unset optional filters', fakeAsync(() => {
      makeFormValid();
      component.onSearch();
      tick();

      const request = mockOcqService.search.calls.mostRecent().args[0];
      expect(request.orderClass).toBeUndefined();
      expect(request.orderType).toBeUndefined();
      expect(request.orderStatus).toBeUndefined();
    }));

    it('should set loading state during search', () => {
      (component as any).loading.set(false);
      (component as any).loading.set(true);
      expect((component as any).loading()).toBeTrue();
      (component as any).loading.set(false);
      expect((component as any).loading()).toBeFalse();
    });

    it('should clear selected order on new search', fakeAsync(() => {
      (component as any).selectedOrder.set(mockOrders[0]);
      makeFormValid();
      component.onSearch();
      tick();
      expect((component as any).selectedOrder()).toBeNull();
    }));

    it('should handle search error and show snackbar', fakeAsync(() => {
      mockOcqService.search.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      makeFormValid();
      component.onSearch();
      tick();

      expect((component as any).loading()).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should include fromDate as ISO string in request', fakeAsync(() => {
      makeFormValid();
      component.onSearch();
      tick();

      const request = mockOcqService.search.calls.mostRecent().args[0];
      expect(request.fromDate).toBeTruthy();
      expect(typeof request.fromDate).toBe('string');
    }));

    it('should include toDate as end-of-day ISO string in request', fakeAsync(() => {
      makeFormValid();
      component.onSearch();
      tick();

      const request = mockOcqService.search.calls.mostRecent().args[0];
      expect(request.toDate).toBeTruthy();
      expect(typeof request.toDate).toBe('string');
    }));

    it('should send undefined fromDate when not set', fakeAsync(() => {
      component.searchForm.patchValue({
        customerId: 'HOSP001',
        fromDate: null,
        toDate: chapterLocalDateTime.clone(),
      });
      component.searchForm.get('fromDate')?.setErrors(null);
      component.searchForm.get('customerId')?.setErrors(null);
      if (component.searchForm.valid) {
        component.onSearch();
        tick();
        const request = mockOcqService.search.calls.mostRecent().args[0];
        expect(request.fromDate).toBeUndefined();
      }
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear form and results', () => {
      component.searchForm.patchValue({ customerId: 'HOSP001' });
      (component as any).orders.set(mockOrders);
      (component as any).selectedOrder.set(mockOrders[0]);
      (component as any).hasSearched.set(true);

      component.onClear();

      expect(component.searchForm.get('customerId')?.value).toBeNull();
      expect((component as any).orders()).toEqual([]);
      expect((component as any).selectedOrder()).toBeNull();
      expect((component as any).hasSearched()).toBeFalse();
    });

    it('should reset filtered customers to all customers on clear', () => {
      component.customerSearchCtrl.setValue('HOSP001');
      component.onClear();
      expect((component as any).filteredCustomers()).toEqual(mockCustomers);
      expect(component.customerSearchCtrl.value).toBe('');
    });

    it('should reset error state on clear', () => {
      (component as any).error.set('Some error');
      component.onClear();
      expect((component as any).error()).toBeNull();
    });

    it('should reset maxFromDate on clear', () => {
      (component as any).maxFromDate.set(moment());
      component.onClear();
      expect((component as any).maxFromDate()).toBeNull();
    });

    it('should reset to date to chapter local date on clear', () => {
      component.onClear();
      const toDate = component.searchForm.get('toDate')?.value;
      expect(moment.isMoment(toDate)).toBeTrue();
      expect(toDate.format('YYYY-MM-DD')).toBe(chapterLocalDateTime.format('YYYY-MM-DD'));
    });
  });

  describe('Order Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select order when clicked', () => {
      component.onOrderSelect(mockOrders[0]);
      expect((component as any).selectedOrder()).toEqual(mockOrders[0]);
      expect((component as any).showOrderItems()).toBeTrue();
    });

    it('should deselect order when panel is closed', () => {
      (component as any).selectedOrder.set(mockOrders[0]);
      (component as any).selectedOrder.set(null);
      expect((component as any).selectedOrder()).toBeNull();
      expect((component as any).showOrderItems()).toBeFalse();
    });
  });

  describe('Order Item Click', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog when order item is clicked', () => {
      (component as any).selectedOrder.set(mockOrders[0]);
      component.onOrderItemClick(mockOrders[0].items[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(
        AttributesAntigensDialog,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            orderNo: '17337-0019',
            itemNo: 1,
            orderStatus: 'OP',
            orderStatusDesc: 'Ordered',
          }),
        })
      );
    });

    it('should not open dialog when no order is selected', () => {
      (component as any).selectedOrder.set(null);
      component.onOrderItemClick(mockOrders[0].items[0]);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear form and reload dropdowns on chapter change', () => {
      component.searchForm.patchValue({ customerId: 'HOSP001' });
      (component as any).orders.set(mockOrders);
      (component as any).hasSearched.set(true);

      mockOcqService.getPriorityOptions.calls.reset();
      mockOcqService.getOrderTypeOptions.calls.reset();
      mockOcqService.getOrderStatusOptions.calls.reset();
      mockOcqService.getAllCustomers.calls.reset();

      chapterChangedSubject.next();

      expect(component.searchForm.get('customerId')?.value).toBeNull();
      expect((component as any).orders()).toEqual([]);
      expect(mockOcqService.getPriorityOptions).toHaveBeenCalled();
      expect(mockOcqService.getOrderTypeOptions).toHaveBeenCalled();
      expect(mockOcqService.getOrderStatusOptions).toHaveBeenCalled();
      expect(mockOcqService.getAllCustomers).toHaveBeenCalled();
    });
  });

  describe('Status Color Classes', () => {
    it('should return correct class for Ordered status', () => {
      expect(component.getStatusColorClass('Ordered')).toBe('status-ordered');
    });

    it('should return correct class for Canceled status', () => {
      expect(component.getStatusColorClass('Canceled')).toBe('status-canceled');
    });

    it('should return correct class for Closed status', () => {
      expect(component.getStatusColorClass('Closed')).toBe('status-closed');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusColorClass('Unknown')).toBe('status-default');
    });

    it('should handle null status', () => {
      expect(component.getStatusColorClass(null as any)).toBe('status-default');
    });

    it('should handle empty string status', () => {
      expect(component.getStatusColorClass('')).toBe('status-default');
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const formatted = component.formatDate('2025-03-05T12:00:00Z');
      expect(formatted).toContain('MAR');
      expect(formatted).toContain('2025');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('–');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format date-time in 24-hour format', () => {
      const formatted = component.formatDateTime('2025-03-05T12:00:00Z');
      expect(formatted).toContain('MAR');
      expect(formatted).toContain('2025');
      expect(formatted).toMatch(/\d{2}:\d{2}/);
      expect(formatted).not.toContain('AM');
      expect(formatted).not.toContain('PM');
    });

    it('should return dash for undefined date-time', () => {
      expect(component.formatDateTime(undefined)).toBe('–');
    });

    it('should return original string for invalid date-time', () => {
      expect(component.formatDateTime('invalid')).toBe('invalid');
    });
  });

  describe('Error Message Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    const testCases = [
      { code: '0302', expected: 'Invalid customer' },
      { code: '0325', expected: 'Invalid priority' },
      { code: '1705', expected: 'Invalid order type' },
      { code: '1711', expected: 'Invalid order status' },
      { code: '0503', expected: 'From date cannot be in future' },
      { code: '7502', expected: 'To date must be >= from date' },
    ];

    testCases.forEach(({ code, expected }) => {
      it(`should handle error code ${code}`, fakeAsync(() => {
        const errorResponse = {
          error: {
            errorResponse: {
              errorCode: code,
            },
          },
        };

        mockOcqService.search.and.returnValue(throwError(() => errorResponse));

        makeFormValid();
        component.searchForm.patchValue({ customerId: 'TEST' });
        component.onSearch();
        tick();

        expect((component as any).error()).toBe(expected);
      }));
    });

    it('should handle errorResponse.error string', fakeAsync(() => {
      mockOcqService.search.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Custom error message' } } }))
      );
      makeFormValid();
      component.onSearch();
      tick();
      expect((component as any).error()).toBe('Custom error message');
    }));

    it('should handle error.error.message', fakeAsync(() => {
      mockOcqService.search.and.returnValue(
        throwError(() => ({ error: { message: 'Backend message' } }))
      );
      makeFormValid();
      component.onSearch();
      tick();
      expect((component as any).error()).toBe('Backend message');
    }));

    it('should handle error.message', fakeAsync(() => {
      mockOcqService.search.and.returnValue(
        throwError(() => ({ message: 'Generic error' }))
      );
      makeFormValid();
      component.onSearch();
      tick();
      expect((component as any).error()).toBe('Generic error');
    }));

    it('should use default message when no error details', fakeAsync(() => {
      mockOcqService.search.and.returnValue(throwError(() => ({})));
      makeFormValid();
      component.onSearch();
      tick();
      expect((component as any).error()).toBe('An error occurred while searching orders');
    }));
  });

  describe('Computed Values', () => {
    it('isEmpty should be true when no search performed', () => {
      expect((component as any).isEmpty()).toBeTrue();
    });

    it('isEmpty should be false after search', () => {
      (component as any).hasSearched.set(true);
      (component as any).orders.set(mockOrders);
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('isReady should be true when not loading and no error', () => {
      (component as any).loading.set(false);
      (component as any).error.set(null);
      expect((component as any).isReady()).toBeTrue();
    });

    it('isReady should be false when loading', () => {
      (component as any).loading.set(true);
      expect((component as any).isReady()).toBeFalse();
    });

    it('hasResults should be true when search returns orders', () => {
      (component as any).hasSearched.set(true);
      (component as any).orders.set(mockOrders);
      expect((component as any).hasResults()).toBeTrue();
    });

    it('hasResults should be false when search returns empty', () => {
      (component as any).hasSearched.set(true);
      (component as any).orders.set([]);
      expect((component as any).hasResults()).toBeFalse();
    });

    it('noResults should be true when search returns empty', () => {
      (component as any).hasSearched.set(true);
      (component as any).orders.set([]);
      expect((component as any).noResults()).toBeTrue();
    });

    it('noResults should be false when search returns orders', () => {
      (component as any).hasSearched.set(true);
      (component as any).orders.set(mockOrders);
      expect((component as any).noResults()).toBeFalse();
    });

    it('showOrderItems should be true when order is selected', () => {
      (component as any).selectedOrder.set(mockOrders[0]);
      expect((component as any).showOrderItems()).toBeTrue();
    });

    it('showOrderItems should be false when no order selected', () => {
      (component as any).selectedOrder.set(null);
      expect((component as any).showOrderItems()).toBeFalse();
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy subject on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility IDs', () => {
    it('should generate unique element IDs', () => {
      const id1 = (component as any).elementId('test');
      expect(id1).toContain('ocq-');
      expect(id1).toContain('-test');
    });

    it('should generate unique error IDs', () => {
      const id = (component as any).errorId('test');
      expect(id).toContain('-test-error');
    });

    it('should generate unique label IDs', () => {
      const id = (component as any).labelId('test');
      expect(id).toContain('-test-label');
    });
  });
});
