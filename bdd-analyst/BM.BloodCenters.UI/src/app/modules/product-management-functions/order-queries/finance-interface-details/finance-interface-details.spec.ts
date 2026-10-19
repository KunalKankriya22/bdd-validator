import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FinanceInterfaceDetailsComponent } from './finance-interface-details';
import { FinanceInterfaceDetailsApiService } from './services/finance-interface-details-api.service';
import {
  OrderLookupDto,
  InsertDateLookupDto,
  FinanceInterfaceHeaderDto,
  FinanceInterfaceDetailDto,
  FinanceInterfaceResponseDto,
  ReturnResult,
} from './models/finance-interface-details.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('FinanceInterfaceDetailsComponent', () => {
  let component: FinanceInterfaceDetailsComponent;
  let fixture: ComponentFixture<FinanceInterfaceDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<FinanceInterfaceDetailsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockOrders: OrderLookupDto[] = [
    { orderNo: '25289-0016', customerName: 'Parkland Hospital', insertDate: '2025-10-16T13:13:44' },
    { orderNo: '25287-0016', customerName: 'Parkland Hospital', insertDate: '2025-10-15T17:16:28' },
    { orderNo: '25100-0020', customerName: 'Guam Memorial Hospital', insertDate: '2025-10-14T09:00:00' },
  ];

  const mockInsertDates: InsertDateLookupDto[] = [
    { insertDateDisplay: '10-15-2025 14:13:44', insertDateUtc: '2025-10-16T13:13:44', insertDateLocal: '2025-10-15T14:13:44' },
    { insertDateDisplay: '10-14-2025 10:30:00', insertDateUtc: '2025-10-15T09:30:00', insertDateLocal: '2025-10-14T10:30:00' },
  ];

  const mockHeader: FinanceInterfaceHeaderDto = {
    recordType: '1',
    fiCompanyNo: '02',
    orderNo: '25289-0016',
    arAccount: '8827233',
    invDesc: 'SH101525RE0016',
    insertDate: '10-15-2025 14:13:44',
    orderDate: '10-15-2025 08:30',
    shipDate: '10-15-2025 09:45',
    interfaceDate: '--',
  };

  const mockDetails: FinanceInterfaceDetailDto[] = [
    {
      recordType: '2', fiCompanyNo: '02', orderNo: '25289-0016', arAccount: '8827233',
      itemId: 'B9009', tranType: 'DB', insertDate: '10-15-2025 14:13:44',
      shipDate: '10-15-2025 10:30', interfaceDate: '--', orderQty: 1, shipQty: 1,
      stdPrice: 25.0, returnAdviceId: '--', priceSchedule: '0',
      text1: '--', text2: '', lineDesc1: 'Blood Container/shipper', lineDesc2: '',
    },
    {
      recordType: '2', fiCompanyNo: '02', orderNo: '25289-0016', arAccount: '8827233',
      itemId: 'B9010', tranType: 'DB', insertDate: '10-15-2025 14:13:44',
      shipDate: '10-15-2025 10:30', interfaceDate: '--', orderQty: 1, shipQty: 1,
      stdPrice: 25.0, returnAdviceId: '--', priceSchedule: '0',
      text1: '--', text2: '', lineDesc1: 'Blood Delivery', lineDesc2: '',
    },
    {
      recordType: '2', fiCompanyNo: '02', orderNo: '25289-0016', arAccount: '8827233',
      itemId: 'F04250-01', tranType: 'DB', insertDate: '10-15-2025 14:13:44',
      shipDate: '10-15-2025 10:30', interfaceDate: '--', orderQty: 1, shipQty: 1,
      stdPrice: 375.0, returnAdviceId: '--', priceSchedule: '--',
      text1: '--', text2: 'E0385V00-00 O Pos', lineDesc1: 'W633325090852', lineDesc2: '',
    },
  ];

  const mockSearchResponse: FinanceInterfaceResponseDto = {
    header: mockHeader,
    details: mockDetails,
    totalDetailCount: 3,
    customerName: 'Parkland Hospital',
  };

  const listResponse = <T>(data: T[]): ReturnResult<T> => ({
    success: true, message: '', statusCode: 200, data,
  });

  const itemResponse = <T>(item: T): ReturnResult<T> => ({
    success: true, message: '', statusCode: 200, item,
  });

  const errorResponse = <T>(message: string, errorCode = ''): ReturnResult<T> => ({
    success: false, message, statusCode: 400,
    errorCode,
    errorResponse: { errorCode, error: message },
  });

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('FinanceInterfaceDetailsApiService', [
      'getOrders', 'getInsertDates', 'search',
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

    apiServiceSpy.getOrders.and.returnValue(of(listResponse(mockOrders)));
    apiServiceSpy.getInsertDates.and.returnValue(of(listResponse(mockInsertDates)));
    apiServiceSpy.search.and.returnValue(of(itemResponse(mockSearchResponse)));



      TestBed.configureTestingModule({
      imports: [FinanceInterfaceDetailsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FinanceInterfaceDetailsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });
      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      apiServiceSpy.getOrders.and.returnValue(of(listResponse(mockOrders)));


      apiServiceSpy.getInsertDates.and.returnValue(of(listResponse(mockInsertDates)));


      apiServiceSpy.search.and.returnValue(of(itemResponse(mockSearchResponse)));


    fixture = TestBed.createComponent(FinanceInterfaceDetailsComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load orders on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getOrders).toHaveBeenCalledTimes(1);
    });



    it('should have empty results on init', () => {
      fixture.detectChanges();
      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
      expect(component.hasSearched).toBeFalse();
    });

    it('should initialize customer description as "--"', () => {
      fixture.detectChanges();
      expect(component.customerDescription()).toBe('--');
    });



    it('should handle orders lookup API error gracefully', fakeAsync(() => {
      apiServiceSpy.getOrders.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingOrders).toBeFalse();
      expect(component.orderNoOptions().length).toBe(0);
    }));
  });

  describe('Cascading Dropdowns', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load insert dates when order is selected', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      expect(apiServiceSpy.getInsertDates).toHaveBeenCalledWith('25289-0016');
    }));

    it('should set customer description when order is selected', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      expect(component.customerDescription()).toBe('Parkland Hospital');
    }));

    it('should reset insert date when order changes', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      tick();
      component.filterForm.get('orderNo')?.setValue('25100-0020');
      tick();
      expect(component.filterForm.get('insertDateUtc')?.value).toBe('');
      expect(apiServiceSpy.getInsertDates).toHaveBeenCalledWith('25100-0020');
    }));

    it('should reset customer description when order is cleared', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      component.filterForm.get('orderNo')?.setValue('');
      tick();
      expect(component.customerDescription()).toBe('--');
    }));

    it('should clear insert date options when order is cleared', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      component.filterForm.get('orderNo')?.setValue('');
      tick();
      expect(component.insertDateOptions()).toEqual([]);
    }));



    it('should handle insert dates API error gracefully', fakeAsync(() => {
      apiServiceSpy.getInsertDates.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      expect(component.isLoadingInsertDates).toBeFalse();
      expect(component.insertDateOptions().length).toBe(0);
    }));

    it('should show "--" when selected order is not found in options', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('UNKNOWN-ORDER');
      tick();
      expect(component.customerDescription()).toBe('--');
    }));
  });

  describe('Auto-Search on Insert Date Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should trigger search when insert date is selected and order is set', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016' });
      tick();
      component.filterForm.get('insertDateUtc')?.setValue('2025-10-16T13:13:44');
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith({
        orderNo: '25289-0016',
        insertDateUtc: '2025-10-16T13:13:44',
      });
    }));


  });

  describe('Search / Retrieve', () => {
    beforeEach(() => fixture.detectChanges());





    it('should call search with correct request body', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith({
        orderNo: '25289-0016',
        insertDateUtc: '2025-10-16T13:13:44',
      });
    }));

    it('should populate header record from response.item', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.headerRecord()).toEqual(mockHeader);
    }));



    it('should update customer description from search response', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.customerDescription()).toBe('Parkland Hospital');
    }));

    it('should set hasSearched to true after retrieve', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.hasSearched).toBeTrue();
    }));

    it('should reset isLoading after API call completes', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.isLoading).toBeFalse();
    }));



    it('should show error on search API failure', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));



    it('should handle response with null item', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({ success: true, message: '', statusCode: 200 } as any));
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
    }));

    it('should handle response with null header in item', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(itemResponse({
        header: null, details: [], totalDetailCount: 0, customerName: '--',
      })));
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(component.headerRecord()).toBeNull();
    }));

    it('should return early without calling API when orderNo is missing', fakeAsync(() => {
      apiServiceSpy.search.calls.reset();
      component.filterForm.patchValue({ orderNo: '', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).not.toHaveBeenCalled();
    }));

    it('should return early without calling API when insertDateUtc is missing', fakeAsync(() => {
      apiServiceSpy.search.calls.reset();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).not.toHaveBeenCalled();
    }));

    it('should show error from errorResponse when response.success is false', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of(errorResponse('Bad request', 'ERR_001')));
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Bad request');
      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
    }));

    it('should show message when response.success is false and no errorResponse', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({
        success: false, message: 'Something went wrong', statusCode: 400,
      } as any));
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Something went wrong');
    }));
  });

  describe('Record Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
    }));



    it('should show correct display text for first record', () => {
      expect(component.currentDetailDisplay()).toBe('Record Type 1 of 3');
    });

    it('should not allow navigating previous from first record', () => {
      expect(component.canNavigatePrev()).toBeFalse();
    });

    it('should allow navigating next from first record', () => {
      expect(component.canNavigateNext()).toBeTrue();
    });

    it('should navigate to next record', () => {
      component.onNextRecord();
      expect(component.currentDetailIndex()).toBe(1);
      expect(component.currentDetail()?.itemId).toBe('B9010');
      expect(component.currentDetailDisplay()).toBe('Record Type 2 of 3');
    });



    it('should not go below index 0', () => {
      component.onPreviousRecord();
      expect(component.currentDetailIndex()).toBe(0);
    });



    it('should not allow navigating next from last record', () => {
      component.currentDetailIndex.set(2);
      expect(component.canNavigateNext()).toBeFalse();
    });

    it('should allow navigating previous from last record', () => {
      component.currentDetailIndex.set(2);
      expect(component.canNavigatePrev()).toBeTrue();
    });

    it('should show correct display text for last record', () => {
      component.currentDetailIndex.set(2);
      expect(component.currentDetailDisplay()).toBe('Record Type 3 of 3');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
    }));

    it('should navigate next on ArrowRight key', () => {
      component.onArrowRight();
      expect(component.currentDetailIndex()).toBe(1);
    });

    it('should navigate previous on ArrowLeft key', () => {
      component.onNextRecord();
      component.onArrowLeft();
      expect(component.currentDetailIndex()).toBe(0);
    });

    it('should not navigate on ArrowRight when no results', () => {
      component.detailRecords.set([]);
      component.hasSearched = false;
      component.onArrowRight();
      expect(component.currentDetailIndex()).toBe(0);
    });

    it('should not navigate on ArrowLeft when no results', () => {
      component.detailRecords.set([]);
      component.hasSearched = false;
      component.onArrowLeft();
      expect(component.currentDetailIndex()).toBe(0);
    });

    it('should not go past last record on ArrowRight', () => {
      component.currentDetailIndex.set(2);
      component.onArrowRight();
      expect(component.currentDetailIndex()).toBe(2);
    });

    it('should stay at first record on ArrowLeft', () => {
      component.currentDetailIndex.set(0);
      component.onArrowLeft();
      expect(component.currentDetailIndex()).toBe(0);
    });
  });

  describe('Clear', () => {
    it('should reset all fields and results', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      component.currentDetailIndex.set(2);

      component.onClear();

      expect(component.filterForm.get('orderNo')?.value).toBe('');
      expect(component.filterForm.get('insertDateUtc')?.value).toBe('');
      expect(component.customerDescription()).toBe('--');
      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
      expect(component.currentDetailIndex()).toBe(0);
      expect(component.hasSearched).toBeFalse();
    }));


  });

  describe('hasAnyFieldValue', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return false when no filters set', () => {
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when orderNo is set', () => {
      component.filterForm.patchValue({ orderNo: '25289-0016' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when insertDateUtc is set', () => {
      component.filterForm.patchValue({ insertDateUtc: '2025-10-16T13:13:44' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when both are set', () => {
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('displayValue', () => {






    it('should return "--" for empty string', () => {
      expect(component.displayValue('')).toBe('--');
    });

    it('should return string for number value', () => {
      expect(component.displayValue(25)).toBe('25');
    });

    it('should return "0" for zero', () => {
      expect(component.displayValue(0)).toBe('0');
    });

    it('should return pre-formatted date string as-is', () => {
      expect(component.displayValue('10-15-2025 14:13:44')).toBe('10-15-2025 14:13:44');
    });

    it('should return "--" for "--" (null placeholder from API)', () => {
      expect(component.displayValue('--')).toBe('--');
    });

    it('should return "--" for null', () => {
      expect(component.displayValue(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.displayValue(undefined)).toBe('--');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => fixture.detectChanges());

    it('should convert date-time to DD-MMM-YYYY, HH:mm format', () => {
      expect(component.formatDate('10-15-2025 14:13:44')).toBe('15-OCT-2025, 14:13');
    });

    it('should convert date-only to DD-MMM-YYYY format', () => {
      expect(component.formatDate('10-15-2025')).toBe('15-OCT-2025');
    });

    it('should convert February date correctly', () => {
      expect(component.formatDate('02-12-2025 09:30:00')).toBe('12-FEB-2025, 09:30');
    });

    it('should convert December date correctly', () => {
      expect(component.formatDate('12-25-2025')).toBe('25-DEC-2025');
    });





    it('should return "--" for "--" placeholder', () => {
      expect(component.formatDate('--')).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatDate('')).toBe('--');
    });

    it('should return original value for unparseable string', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should handle January (month boundary)', () => {
      expect(component.formatDate('01-05-2025 08:00:00')).toBe('05-JAN-2025, 08:00');
    });

    it('should convert date with HH:mm time (no seconds) to DD-MMM-YYYY, HH:mm format', () => {
      expect(component.formatDate('10-15-2025 08:30')).toBe('15-OCT-2025, 08:30');
    });

    it('should return original value for invalid month (13)', () => {
      expect(component.formatDate('13-15-2025')).toBe('13-15-2025');
    });

    it('should return original value for month 0', () => {
      expect(component.formatDate('00-15-2025')).toBe('00-15-2025');
    });
  });

  describe('Search Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should return all orders when search is empty', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('');
      tick();
      expect(component.filteredOrderNos().length).toBe(3);
    }));

    it('should return empty when no orders match', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('ZZZZZ');
      tick();
      expect(component.filteredOrderNos().length).toBe(0);
    }));

    it('should be case-insensitive for order search', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('PARKLAND');
      tick();
      expect(component.filteredOrderNos().length).toBe(2);
    }));

    it('should filter insert dates by search text', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('25289-0016');
      tick();
      component.insertDateSearchCtrl.setValue('10-15');
      tick();
      const filtered = component.filteredInsertDates();
      expect(filtered.length).toBe(1);
      expect(filtered[0].insertDateDisplay).toContain('10-15');
    }));

    it('should update orderNoSearch signal when orderNoSearchCtrl value changes', fakeAsync(() => {
      component.orderNoSearchCtrl.setValue('test-search');
      tick();
      expect(component.orderNoSearch()).toBe('test-search');
    }));

    it('should update insertDateSearch signal when insertDateSearchCtrl value changes', fakeAsync(() => {
      component.insertDateSearchCtrl.setValue('10-15');
      tick();
      expect(component.insertDateSearch()).toBe('10-15');
    }));
  });

  describe('Chapter Changes', () => {
    it('should clear and reload orders on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016' });
      component.hasSearched = true;
      apiServiceSpy.getOrders.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('orderNo')?.value).toBe('');
      expect(component.filterForm.get('insertDateUtc')?.value).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(apiServiceSpy.getOrders).toHaveBeenCalledTimes(1);
    }));

    it('should clear results on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();

      chapterChangedSubject.next();
      tick();

      expect(component.headerRecord()).toBeNull();
      expect(component.detailRecords()).toEqual([]);
      expect(component.customerDescription()).toBe('--');
    }));

    it('should handle multiple consecutive chapter changes properly', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      apiServiceSpy.getOrders.calls.reset();

      chapterChangedSubject.next();
      tick();
      expect(component.hasSearched).toBeFalse();
      expect(component.headerRecord()).toBeNull();
      expect(apiServiceSpy.getOrders).toHaveBeenCalledTimes(1);

      apiServiceSpy.getOrders.calls.reset();
      chapterChangedSubject.next();
      tick();
      expect(apiServiceSpy.getOrders).toHaveBeenCalledTimes(1);
      expect(component.filterForm.get('orderNo')?.value).toBe('');
    }));
  });

  describe('Computed Signals', () => {
    it('should return null for currentDetail when no records', () => {
      fixture.detectChanges();
      expect(component.currentDetail()).toBeNull();
    });



    it('should return false for canNavigatePrev when no records', () => {
      fixture.detectChanges();
      expect(component.canNavigatePrev()).toBeFalse();
    });

    it('should return false for canNavigateNext when no records', () => {
      fixture.detectChanges();
      expect(component.canNavigateNext()).toBeFalse();
    });
  });

  describe('Page Header Effect', () => {
    it('should update headerConfig when pageHeaderData emits a value', fakeAsync(() => {
      fixture.detectChanges();
      (pageHeaderServiceSpy.pageHeaderData as any).set({ title: 'Finance Interface', subtitle: 'View details' });
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.title).toBe('Finance Interface');
      expect(component.headerConfig.subtitle).toBe('View details');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Finance Interface');
    }));

    it('should use default subtitle when pageHeaderData has no subtitle', fakeAsync(() => {
      fixture.detectChanges();
      (pageHeaderServiceSpy.pageHeaderData as any).set({ title: 'Finance Interface' });
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.subtitle).toBe('View financial interface logs and transaction mapping details.');
    }));
  });

  describe('Lifecycle', () => {
    it('should complete destroy subject on ngOnDestroy without errors', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('DOM Rendering (Gap Fixes)', () => {
    it('should include customer name in order options data for dropdown display', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const options = component.filteredOrderNos();
      const parklandOption = options.find(o => o.orderNo === '25289-0016');
      expect(parklandOption).toBeTruthy();
      expect(parklandOption!.customerName).toBe('Parkland Hospital');
      const guamOption = options.find(o => o.orderNo === '25100-0020');
      expect(guamOption).toBeTruthy();
      expect(guamOption!.customerName).toBe('Guam Memorial Hospital');
    }));

    it('should display Detail Count in header section after search', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      const fieldLabels = fixture.debugElement.queryAll(By.css('.finance-interface-details__field-label'));
      const detailCountLabel = fieldLabels.find(el => el.nativeElement.textContent.trim() === 'Detail Count');
      expect(detailCountLabel).toBeTruthy();
      const detailCountValue = detailCountLabel!.parent!.query(By.css('.finance-interface-details__field-value'));
      expect(detailCountValue.nativeElement.textContent.trim()).toBe('3');
    }));

    it('should display dates with time in header after search', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ orderNo: '25289-0016', insertDateUtc: '2025-10-16T13:13:44' });
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      const fieldLabels = fixture.debugElement.queryAll(By.css('.finance-interface-details__field-label'));
      const orderDateLabel = fieldLabels.find(el => el.nativeElement.textContent.trim() === 'Order Date');
      expect(orderDateLabel).toBeTruthy();
      const orderDateValue = orderDateLabel!.parent!.query(By.css('.finance-interface-details__field-value'));
      expect(orderDateValue.nativeElement.textContent.trim()).toBe('15-OCT-2025, 08:30');

      const shipDateLabel = fieldLabels.find(el => el.nativeElement.textContent.trim() === 'Ship Date');
      expect(shipDateLabel).toBeTruthy();
      const shipDateValue = shipDateLabel!.parent!.query(By.css('.finance-interface-details__field-value'));
      expect(shipDateValue.nativeElement.textContent.trim()).toBe('15-OCT-2025, 09:45');
    }));
  });
});
