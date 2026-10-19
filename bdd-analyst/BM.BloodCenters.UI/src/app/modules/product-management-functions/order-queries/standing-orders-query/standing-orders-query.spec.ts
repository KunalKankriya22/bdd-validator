import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { StandingOrdersQueryComponent } from './standing-orders-query';
import { StandingOrdersQueryApiService } from './services/standing-orders-query-api.service';
import { StandingOrderDto, StandingOrderItemDto } from './models/standing-orders-query.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('StandingOrdersQueryComponent', () => {
  let component: StandingOrdersQueryComponent;
  let fixture: ComponentFixture<StandingOrdersQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<StandingOrdersQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockWeekDays = [
    { code: 'SUN', name: 'SUNDAY', dayNumber: 1 },
    { code: 'MON', name: 'MONDAY', dayNumber: 2 },
    { code: 'TUE', name: 'TUESDAY', dayNumber: 3 },
    { code: 'WED', name: 'WEDNESDAY', dayNumber: 4 },
    { code: 'THU', name: 'THURSDAY', dayNumber: 5 },
    { code: 'FRI', name: 'FRIDAY', dayNumber: 6 },
    { code: 'SAT', name: 'SATURDAY', dayNumber: 7 },
  ];

  const mockCustomerTypes = [
    { code: 'RG', description: 'Regular Customer' },
    { code: 'EX', description: 'Export Customer' },
    { code: 'DI', description: 'Discard Customer' },
  ];

  const mockCustomers = [
    { customerId: 'DAL-RG0001', customerName: 'Parkland Hospital', customerType: 'RG' },
    { customerId: 'DAL-RG0002', customerName: 'Guam Memorial Hospital', customerType: 'RG' },
    { customerId: 'DAL-EX0001', customerName: 'Export Lab Inc', customerType: 'EX' },
  ];

  const mockSearchResults: StandingOrderDto[] = [
    {
      customerName: 'Parkland Hospital', weekDay: 'MON', weekDayFull: 'Monday',
      contractId: 'RG0001-001', consigneeId: 'PAR-CS0001',
      effDate: '2025-05-03T00:00:00', termDate: null, chapterId: 'DAL', items: [],
    },
    {
      customerName: 'Parkland Hospital', weekDay: 'FRI', weekDayFull: 'Friday',
      contractId: 'RG0001-001', consigneeId: 'PAR-CS0001',
      effDate: '2025-05-06T00:00:00', termDate: null, chapterId: 'DAL', items: [],
    },
    {
      customerName: 'Guam Memorial Hospital', weekDay: 'MON', weekDayFull: 'Monday',
      contractId: 'RG0002-001', consigneeId: 'GUA-CS0001',
      effDate: '2025-05-07T00:00:00', termDate: null, chapterId: 'DAL', items: [],
    },
  ];

  const mockDetailItems: StandingOrderItemDto[] = [
    {
      itemNo: 1, weekDay: 'FRI', weekDayFull: 'Friday', productType: 'RBC',
      productName: 'Red Blood Cells', aboRh: 'O Pos', tier: 1, qty: 5, minQty: 2,
      effDate: '2011-06-03T00:00:00', termDate: null, attributes: [],
    },
    {
      itemNo: 2, weekDay: 'FRI', weekDayFull: 'Friday', productType: 'PLT',
      productName: 'Platelets Random', aboRh: 'O Pos', tier: 1, qty: 5, minQty: 2,
      effDate: '2011-06-03T00:00:00', termDate: null, attributes: [],
    },
    {
      itemNo: 3, weekDay: 'FRI', weekDayFull: 'Friday', productType: 'FFP',
      productName: 'FRESH FROZEN PLASMA', aboRh: 'O Pos', tier: 1, qty: 5, minQty: 2,
      effDate: '2011-06-03T00:00:00', termDate: null,
      attributes: [{ attributeGroup: 'Alert', attributeCode: 'CMV', attributeDescription: 'CMV Negative' }],
    },
  ];

  const apiResponse = <T>(data: T) => ({
    success: true, message: '', statusCode: 200, data: data as any,
  });

  const apiErrorResponse = (message: string) => ({
    success: false, message, statusCode: 400, data: [] as any,
  });

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('StandingOrdersQueryApiService', [
      'searchOrders', 'getOrderItems', 'getWeekDays', 'getCustomerTypes', 'getCustomers',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
      headerConfig: signal({ user: { name: 'Test User', id: 'TEST1', role: 'User' } }),
    });

    apiServiceSpy.getWeekDays.and.returnValue(of(apiResponse(mockWeekDays)));
    apiServiceSpy.getCustomerTypes.and.returnValue(of(apiResponse(mockCustomerTypes)));
    apiServiceSpy.getCustomers.and.returnValue(of(apiResponse(mockCustomers)));
    apiServiceSpy.searchOrders.and.returnValue(of(apiResponse(mockSearchResults)));
    apiServiceSpy.getOrderItems.and.returnValue(of(apiResponse(mockDetailItems)));



      TestBed.configureTestingModule({
      imports: [StandingOrdersQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StandingOrdersQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });
      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      apiServiceSpy.getWeekDays.and.returnValue(of(apiResponse(mockWeekDays)));


      apiServiceSpy.getCustomerTypes.and.returnValue(of(apiResponse(mockCustomerTypes)));


      apiServiceSpy.getCustomers.and.returnValue(of(apiResponse(mockCustomers)));


      apiServiceSpy.searchOrders.and.returnValue(of(apiResponse(mockSearchResults)));


      apiServiceSpy.getOrderItems.and.returnValue(of(apiResponse(mockDetailItems)));


    fixture = TestBed.createComponent(StandingOrdersQueryComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load all three lookups on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getWeekDays).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getCustomerTypes).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getCustomers).toHaveBeenCalledTimes(1);
    });

    it('should have empty results on init', () => {
      fixture.detectChanges();
      expect(component.orders).toEqual([]);
      expect(component.hasSearched).toBeFalse();
      expect(component.showDetail).toBeFalse();
    });

    it('should initialize customer name as "--"', () => {
      fixture.detectChanges();
      expect(component.customerName()).toBe('--');
    });







    it('should handle weekday lookup API error gracefully', fakeAsync(() => {
      apiServiceSpy.getWeekDays.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingWeekDays).toBeFalse();
      expect(component.weekDayOptions().length).toBe(0);
    }));

    it('should handle customer type lookup API error gracefully', fakeAsync(() => {
      apiServiceSpy.getCustomerTypes.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingCustomerTypes).toBeFalse();
      expect(component.customerTypeOptions().length).toBe(0);
    }));

    it('should handle customer lookup API error gracefully', fakeAsync(() => {
      apiServiceSpy.getCustomers.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingCustomers).toBeFalse();
      expect(component.customerOptions().length).toBe(0);
    }));

    it('should not populate weekDayOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getWeekDays.and.returnValue(of({ success: false, message: 'Error', statusCode: 400, data: [] as any }));
      fixture.detectChanges();
      tick();
      expect(component.weekDayOptions().length).toBe(0);
    }));

    it('should not populate customerTypeOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getCustomerTypes.and.returnValue(of({ success: false, message: 'Error', statusCode: 400, data: [] as any }));
      fixture.detectChanges();
      tick();
      expect(component.customerTypeOptions().length).toBe(0);
    }));

    it('should not populate customerOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getCustomers.and.returnValue(of({ success: false, message: 'Error', statusCode: 400, data: [] as any }));
      fixture.detectChanges();
      tick();
      expect(component.customerOptions().length).toBe(0);
    }));
  });

  describe('Cascading Dropdowns', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reload customers when customer type changes', fakeAsync(() => {
      component.filterForm.get('customerType')?.setValue('RG');
      tick();
      expect(apiServiceSpy.getCustomers).toHaveBeenCalledWith('RG');
    }));

    it('should reload all customers when customer type is cleared', fakeAsync(() => {
      component.filterForm.get('customerType')?.setValue('RG');
      tick();
      component.filterForm.get('customerType')?.setValue('');
      tick();
      expect(apiServiceSpy.getCustomers).toHaveBeenCalledWith(undefined);
    }));

    it('should reset customer ID when customer type changes', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'DAL-RG0001' });
      component.filterForm.get('customerType')?.setValue('EX');
      tick();
      expect(component.filterForm.get('customerId')?.value).toBe('');
    }));

    it('should reset customer name when customer type changes', fakeAsync(() => {
      component.filterForm.get('customerId')?.setValue('DAL-RG0001');
      tick();
      component.filterForm.get('customerType')?.setValue('EX');
      tick();
      expect(component.customerName()).toBe('--');
    }));

    it('should set customer name when customer ID is selected', fakeAsync(() => {
      component.filterForm.get('customerId')?.setValue('DAL-RG0001');
      tick();
      expect(component.customerName()).toBe('Parkland Hospital');
    }));

    it('should reset customer name when customer ID is cleared', fakeAsync(() => {
      component.filterForm.get('customerId')?.setValue('DAL-RG0001');
      tick();
      component.filterForm.get('customerId')?.setValue('');
      tick();
      expect(component.customerName()).toBe('--');
    }));

    it('should show "--" when selected customer is not found in options', fakeAsync(() => {
      component.filterForm.get('customerId')?.setValue('UNKNOWN-ID');
      tick();
      expect(component.customerName()).toBe('--');
    }));
  });

  describe('Search / Retrieve', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call searchOrders with no filters when nothing selected', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalledWith({});
    }));

    it('should call searchOrders with weekDay filter', fakeAsync(() => {
      component.filterForm.patchValue({ weekDay: 'FRI' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalledWith({ weekDay: 'FRI' });
    }));

    it('should call searchOrders with all filters', fakeAsync(() => {
      component.filterForm.patchValue({ weekDay: 'MON', customerType: 'RG', customerId: 'DAL-RG0001' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalledWith({
        weekDay: 'MON', customerType: 'RG', customerId: 'DAL-RG0001',
      });
    }));



    it('should set hasSearched to true after retrieve', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.hasSearched).toBeTrue();
    }));

    it('should reset isLoading after API call completes', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should show error on search API failure', fakeAsync(() => {
      apiServiceSpy.searchOrders.and.returnValue(throwError(() => ({ status: 500 })));
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.orders).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));

    it('should show error when search returns success=false with a message', fakeAsync(() => {
      apiServiceSpy.searchOrders.and.returnValue(of({ success: false, message: 'Not found', statusCode: 400, data: [] as any }));
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Not found');
      expect(component.orders).toEqual([]);
    }));

    it('should use default message when search returns success=false with null message', fakeAsync(() => {
      apiServiceSpy.searchOrders.and.returnValue(of({ success: false, message: null as any, statusCode: 400, data: [] as any }));
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve data.');
    }));

    it('should call searchOrders with customerType filter only', fakeAsync(() => {
      component.filterForm.patchValue({ customerType: 'RG' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalledWith({ customerType: 'RG' });
    }));

    it('should call searchOrders with customerId filter only', fakeAsync(() => {
      component.filterForm.patchValue({ customerId: 'DAL-RG0001' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.searchOrders).toHaveBeenCalledWith({ customerId: 'DAL-RG0001' });
    }));

    it('should treat null response.data as empty array on successful search', fakeAsync(() => {
      apiServiceSpy.searchOrders.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null as any }));
      component.onRetrieve();
      tick();
      expect(component.orders).toEqual([]);
    }));
  });

  describe('Detail View', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should switch to detail view on eye icon click', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      expect(component.showDetail).toBeTrue();
      expect(component.selectedOrder).toBe(mockSearchResults[1]);
    }));

    it('should call getOrderItems with correct params', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      expect(apiServiceSpy.getOrderItems).toHaveBeenCalledWith('RG0001-001', 'PAR-CS0001', 'FRI');
    }));

    it('should populate detail items from API', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      expect(component.detailItems.length).toBe(3);
      expect(component.detailItems[0].productType).toBe('RBC');
      expect(component.detailItems[2].productType).toBe('FFP');
    }));





    it('should reset isLoadingDetail after API call completes', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(component.isLoadingDetail).toBeFalse();
    }));

    it('should show error on detail API failure', fakeAsync(() => {
      apiServiceSpy.getOrderItems.and.returnValue(throwError(() => ({ status: 500 })));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.detailItems).toEqual([]);
      expect(component.isLoadingDetail).toBeFalse();
    }));

    it('should show error when getOrderItems returns success=false with a message', fakeAsync(() => {
      apiServiceSpy.getOrderItems.and.returnValue(of({ success: false, message: 'No items found', statusCode: 400, data: [] as any }));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No items found');
      expect(component.detailItems).toEqual([]);
      expect(component.detailRows).toEqual([]);
      expect(component.isLoadingDetail).toBeFalse();
    }));

    it('should use default message when getOrderItems success=false and null message', fakeAsync(() => {
      apiServiceSpy.getOrderItems.and.returnValue(of({ success: false, message: null as any, statusCode: 400, data: [] as any }));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve order items.');
    }));

    it('should treat null response.data as empty array for detail items', fakeAsync(() => {
      apiServiceSpy.getOrderItems.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null as any }));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(component.detailItems).toEqual([]);
    }));

    it('should return to master view on back', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[0]);
      tick();
      component.onBackToMaster();
      expect(component.showDetail).toBeFalse();
      expect(component.selectedOrder).toBeNull();
      expect(component.detailItems).toEqual([]);
    }));
  });

  describe('Clear', () => {
    it('should reset all fields and results', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ weekDay: 'MON', customerType: 'RG', customerId: 'DAL-RG0001' });
      component.orders = mockSearchResults;
      component.hasSearched = true;
      component.showDetail = true;
      component.detailItems = mockDetailItems;

      component.onClear();

      expect(component.filterForm.get('weekDay')?.value).toBe('');
      expect(component.filterForm.get('customerType')?.value).toBe('');
      expect(component.filterForm.get('customerId')?.value).toBe('');
      expect(component.customerName()).toBe('--');
      expect(component.orders).toEqual([]);
      expect(component.hasSearched).toBeFalse();
      expect(component.showDetail).toBeFalse();
      expect(component.selectedOrder).toBeNull();
      expect(component.detailItems).toEqual([]);
    }));
  });

  describe('hasAnyFieldValue', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return false when no filters set', () => {
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when weekDay is set', () => {
      component.filterForm.patchValue({ weekDay: 'MON' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when customerType is set', () => {
      component.filterForm.patchValue({ customerType: 'RG' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when customerId is set', () => {
      component.filterForm.patchValue({ customerId: 'DAL-RG0001' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });
  describe('Attribute Value Extraction', () => {
    it('should return attribute group from first attribute', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      // detailRows[2] = FFP item (mockDetailItems[2]) with one attribute
      expect(component.detailRows[2].attributeGroup).toBe('Alert');
    }));

    it('should return attribute code from first attribute', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      expect(component.detailRows[2].attributeCode).toBe('CMV');
    }));

    it('should return attribute description from first attribute', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      expect(component.detailRows[2].attributeDescription).toBe('CMV Negative');
    }));

    it('should return empty string when no attributes', fakeAsync(() => {
      component.onViewDetail(mockSearchResults[1]);
      tick();
      // detailRows[0] = RBC item (mockDetailItems[0]) with no attributes
      expect(component.detailRows[0].attributeGroup).toBe('');
      expect(component.detailRows[0].attributeCode).toBe('');
      expect(component.detailRows[0].attributeDescription).toBe('');
    }));
  });

  describe('Search Filtering', () => {
    beforeEach(() => fixture.detectChanges());



    it('should return all weekdays when search is empty', fakeAsync(() => {
      component.weekDaySearchCtrl.setValue('');
      tick();
      expect(component.filteredWeekDays().length).toBe(7);
    }));









    it('should return empty when no matches', fakeAsync(() => {
      component.customerSearchCtrl.setValue('ZZZZZ');
      tick();
      expect(component.filteredCustomers().length).toBe(0);
    }));

    it('should filter weekDays by code match', fakeAsync(() => {
      component.weekDaySearchCtrl.setValue('SUN');
      tick();
      expect(component.filteredWeekDays().length).toBe(1);
      expect(component.filteredWeekDays()[0].code).toBe('SUN');
    }));

    it('should filter weekDays by name match', fakeAsync(() => {
      component.weekDaySearchCtrl.setValue('monday');
      tick();
      expect(component.filteredWeekDays().length).toBe(1);
      expect(component.filteredWeekDays()[0].code).toBe('MON');
    }));

    it('should return all customer types when search is empty', fakeAsync(() => {
      component.customerTypeSearchCtrl.setValue('');
      tick();
      expect(component.filteredCustomerTypes().length).toBe(3);
    }));

    it('should filter customer types by code', fakeAsync(() => {
      component.customerTypeSearchCtrl.setValue('RG');
      tick();
      expect(component.filteredCustomerTypes().length).toBe(1);
      expect(component.filteredCustomerTypes()[0].code).toBe('RG');
    }));

    it('should filter customer types by description', fakeAsync(() => {
      component.customerTypeSearchCtrl.setValue('Export');
      tick();
      expect(component.filteredCustomerTypes().some(r => r.code === 'EX')).toBeTrue();
    }));

    it('should return all customers when search is empty', fakeAsync(() => {
      component.customerSearchCtrl.setValue('');
      tick();
      expect(component.filteredCustomers().length).toBe(3);
    }));

    it('should filter customers by customerId', fakeAsync(() => {
      component.customerSearchCtrl.setValue('DAL-RG0001');
      tick();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].customerId).toBe('DAL-RG0001');
    }));

    it('should filter customers by customerName', fakeAsync(() => {
      component.customerSearchCtrl.setValue('Export Lab');
      tick();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].customerId).toBe('DAL-EX0001');
    }));
  });

  describe('Chapter Changes', () => {
    it('should clear and reload all lookups on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ weekDay: 'MON', customerType: 'RG' });
      component.hasSearched = true;

      apiServiceSpy.getWeekDays.calls.reset();
      apiServiceSpy.getCustomerTypes.calls.reset();
      apiServiceSpy.getCustomers.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('weekDay')?.value).toBe('');
      expect(component.filterForm.get('customerType')?.value).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(apiServiceSpy.getWeekDays).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getCustomerTypes).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getCustomers).toHaveBeenCalled();
    }));
  });

  describe('formatDate', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return a formatted string for a valid ISO date', () => {
      expect(component.formatDate('2025-05-03T00:00:00')).toBe('03-MAY-2025');
    });

    it('should return "-" for null input', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined input', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update pageSize and pageIndex on onPageChange', () => {
      component.orders = [...mockSearchResults];
      component.onPageChange({ pageSize: 5, pageIndex: 0, length: 3 } as PageEvent);
      expect(component.pageSize).toBe(5);
      expect(component.pageIndex).toBe(0);
      expect(component.paginatedOrders.length).toBe(3);
    });

    it('should return correct slice for second page', () => {
      component.orders = Array.from({ length: 15 }, (_, i) => ({ ...mockSearchResults[0], contractId: `C-${i}` }));
      component.onPageChange({ pageSize: 10, pageIndex: 1, length: 15 } as PageEvent);
      expect(component.paginatedOrders.length).toBe(5);
      expect(component.paginatedOrders[0].contractId).toBe('C-10');
    });
  });

  describe('FlattenToRows - multiple attributes', () => {
    beforeEach(() => fixture.detectChanges());

    it('should create one row per attribute when item has multiple attributes', fakeAsync(() => {
      const itemWithTwoAttrs: StandingOrderItemDto = {
        itemNo: 1, weekDay: 'MON', weekDayFull: 'Monday',
        productType: 'RBC', productName: 'Red Blood Cells', aboRh: 'O Pos',
        tier: 1, qty: 3, minQty: 1,
        effDate: '2025-01-01T00:00:00', termDate: null,
        attributes: [
          { attributeGroup: 'Alert', attributeCode: 'CMV', attributeDescription: 'CMV Negative' },
          { attributeGroup: 'Special', attributeCode: 'IRR', attributeDescription: 'Irradiated' },
        ],
      };
      apiServiceSpy.getOrderItems.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [itemWithTwoAttrs] }));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(component.detailRows.length).toBe(2);
      expect(component.detailRows[0].attributeCode).toBe('CMV');
      expect(component.detailRows[1].attributeCode).toBe('IRR');
    }));

    it('should preserve base item fields across all attribute rows', fakeAsync(() => {
      const item: StandingOrderItemDto = {
        itemNo: 5, weekDay: 'MON', weekDayFull: 'Monday',
        productType: 'FFP', productName: 'Fresh Frozen Plasma', aboRh: 'A Pos',
        tier: 2, qty: 10, minQty: 5,
        effDate: '2025-06-01T00:00:00', termDate: '2025-12-31T00:00:00',
        attributes: [
          { attributeGroup: 'G1', attributeCode: 'C1', attributeDescription: 'Desc1' },
          { attributeGroup: 'G2', attributeCode: 'C2', attributeDescription: 'Desc2' },
        ],
      };
      apiServiceSpy.getOrderItems.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [item] }));
      component.onViewDetail(mockSearchResults[0]);
      tick();
      expect(component.detailRows[0].itemNo).toBe(5);
      expect(component.detailRows[1].itemNo).toBe(5);
      expect(component.detailRows[0].productType).toBe('FFP');
      expect(component.detailRows[1].productType).toBe('FFP');
    }));
  });

  describe('Lifecycle', () => {
    it('should call next and complete on destroy$ when ngOnDestroy is called', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
