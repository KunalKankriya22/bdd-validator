import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { FormGroupDirective } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

import { CustomerConsigneeProductDetailsComponent } from './customer-consignee-product-details.component';
import { CustomerConsigneeProductDetailsApiService } from './services/customer-consignee-product-details-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CustomerConsigneeProductDetailsDto } from './models/customer-consignee-product-details.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CustomerConsigneeProductDetailsComponent', () => {
  let component: CustomerConsigneeProductDetailsComponent;
  let fixture: ComponentFixture<CustomerConsigneeProductDetailsComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerConsigneeProductDetailsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChanged$: Subject<void>;

  const mockCustomers = [
    { customerId: 'C001', name: 'Customer 1' },
    { customerId: 'C002', name: 'Customer 2' }
  ];

  const mockConsignees = [
    { consigneeId: 'CON001', name: 'Consignee 1' },
    { consigneeId: 'CON002', name: 'Consignee 2' }
  ];

  const mockData: CustomerConsigneeProductDetailsDto[] = [
    {
      customerId: 'C001',
      customerName: 'Customer 1',
      consigneeId: 'CON001',
      consigneeName: 'Consignee 1',
      productType: 'TYPE1',
      productCode: 'P001',
      effDate: '2026-01-01',
      termDate: null
    },
    {
      customerId: 'C001',
      customerName: 'Customer 1',
      consigneeId: 'CON001',
      consigneeName: 'Consignee 1',
      productType: 'TYPE2',
      productCode: 'P002',
      effDate: '2026-02-01',
      termDate: '2026-12-31'
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CustomerConsigneeProductDetailsApiService', [
      'getCustomerConsigneeProductDetails',
      'getCustomers',
      'getConsigneesByCustomer'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);

    apiServiceSpy.getCustomers.and.returnValue(of(mockCustomers));
    apiServiceSpy.getConsigneesByCustomer.and.returnValue(of(mockConsignees));
    apiServiceSpy.getCustomerConsigneeProductDetails.and.returnValue(
      of({ data: mockData, total: mockData.length })
    );



      TestBed.configureTestingModule({
imports: [CustomerConsigneeProductDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerConsigneeProductDetailsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });


    });



  beforeEach(() => {

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      apiServiceSpy.getCustomers.and.returnValue(of(mockCustomers));


      apiServiceSpy.getConsigneesByCustomer.and.returnValue(of(mockConsignees));





    fixture = TestBed.createComponent(CustomerConsigneeProductDetailsComponent);
    component = fixture.componentInstance;


    });

  // ── Initialization ──────────────────────────────────────────────────────

  describe('Initialization', () => {


    it('should not load data until retrieve is clicked', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).not.toHaveBeenCalled();
      expect(component.hasRetrievedData).toBeFalse();
    });




    it('should initialize searchCardForm with customerId and consigneeId controls', () => {
      expect(component.searchCardForm.get('customerId')).toBeTruthy();
      expect(component.searchCardForm.get('consigneeId')).toBeTruthy();
    });



    it('should handle customer load error gracefully', () => {
      apiServiceSpy.getCustomers.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(component.isLoadingCustomers).toBeFalse();
    });
  });

  // ── Search Card ─────────────────────────────────────────────────────────

  describe('Search Card', () => {
    it('should disable retrieve when no customer selected', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve when customer is selected', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should disable retrieve when loading', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.isLoading = true;
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable clear all when no customer and no retrieved data', () => {
      expect(component.isClearAllDisabled).toBeTrue();
    });

    it('should enable clear all when customer is selected', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should enable clear all when data has been retrieved', () => {
      component.hasRetrievedData = true;
      expect(component.isClearAllDisabled).toBeFalse();
    });

    it('should load consignees when customer changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      expect(apiServiceSpy.getConsigneesByCustomer).toHaveBeenCalledWith('C001');
    }));

    it('should clear consignee when customer changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('consigneeId')?.setValue('CON001');
      component.searchCardForm.get('customerId')?.setValue('C002');
      tick();
      expect(component.searchCardForm.get('consigneeId')?.value).toBeNull();
    }));

    it('should handle consignee load error gracefully', fakeAsync(() => {
      apiServiceSpy.getConsigneesByCustomer.and.returnValue(throwError(() => new Error('Error')));
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      expect(component.isLoadingConsignees).toBeFalse();
    }));

  });

  // ── Clear All Search ────────────────────────────────────────────────────

  describe('Clear All Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all state on clear all click', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.hasRetrievedData = true;
      component.dataSource = mockData;
      component.searchKeyword = 'test';
      component.appliedFilters = { effectiveDate: '2026-01-01', effectivePeriod: 'After' };
      component.hasError = true;

      component.onClearAllSearch();

      expect(component.searchCardForm.get('customerId')?.value).toBeNull();
      expect(component.hasRetrievedData).toBeFalse();
      expect(component.dataSource.length).toBe(0);
      expect(component.searchKeyword).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.hasError).toBeFalse();
    });

    it('should close side panel on clear all', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.onClearAllSearch();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  // ── Data Loading ────────────────────────────────────────────────────────

  describe('Data Loading', () => {

    it('should clear error state when loading starts', () => {
      component.hasError = true;
      component.loadData();
      expect(component.hasError).toBeFalse();
    });

    it('should populate dataSource after retrieve', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      fixture.detectChanges();
      component.onRetrieve();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBeFalse();
      expect(component.hasRetrievedData).toBeTrue();
    }));


    it('should reset page index to 0 on retrieve', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      fixture.detectChanges();
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };

      component.onRetrieve();
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));


    it('should display error code in message when available', fakeAsync(() => {
      apiServiceSpy.getCustomerConsigneeProductDetails.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { errorCode: '1234', error: 'Custom error' }
          }
        }))
      );

      component.loadData();
      tick();

      expect(component.errorMessage).toContain('1234');
      expect(component.errorMessage).toContain('Custom error');
    }));

    it('should use default error message when no error details provided', fakeAsync(() => {
      apiServiceSpy.getCustomerConsigneeProductDetails.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.loadData();
      tick();

      expect(component.errorMessage).toContain('Failed to load customer consignee product details');
    }));

    it('should update total records from response', fakeAsync(() => {
      apiServiceSpy.getCustomerConsigneeProductDetails.and.returnValue(
        of({ data: mockData, total: 100 })
      );

      component.loadData();
      tick();

      expect(component.tableConfig.pagination?.totalRecords).toBe(100);
    }));

    it('should use data length when total is 0', fakeAsync(() => {
      apiServiceSpy.getCustomerConsigneeProductDetails.and.returnValue(
        of({ data: mockData, total: 0 })
      );

      component.loadData();
      tick();

      expect(component.tableConfig.pagination?.totalRecords).toBe(mockData.length);
    }));


    it('should pass search keyword in query', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.searchKeyword = 'TYPE1';

      component.loadData();
      tick();

      const query = apiServiceSpy.getCustomerConsigneeProductDetails.calls.mostRecent().args[0];
      expect(query.searchKeyword).toBe('TYPE1');
    }));

    it('should calculate skip based on pagination', fakeAsync(() => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageSize: 25, pageIndex: 2 }
      };

      component.loadData();
      tick();

      const skip = apiServiceSpy.getCustomerConsigneeProductDetails.calls.mostRecent().args[2];
      expect(skip).toBe(50);
    }));


  });

  // ── Search ──────────────────────────────────────────────────────────────

  describe('Search Functionality', () => {
    it('should update searchKeyword and reload data on search', fakeAsync(() => {
      component.onSearch('TYPE1');
      tick();

      expect(component.searchKeyword).toBe('TYPE1');
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).toHaveBeenCalled();
    }));


    it('should handle empty search keyword', fakeAsync(() => {
      component.searchKeyword = 'previous';
      component.onSearch('');
      tick();

      expect(component.searchKeyword).toBe('');
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).toHaveBeenCalled();
    }));
  });

  // ── Pagination ──────────────────────────────────────────────────────────
  // ── Sorting ─────────────────────────────────────────────────────────────

  describe('Sorting', () => {

    it('should reset page index on sort change', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 },
        sortConfig: { column: 'productType', direction: 'default' }
      };

      component.onSortChange({ column: 'productType', direction: 'default' as const });

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });


    it('should update sort column when sorting a different column', () => {
      component.tableConfig.sortConfig = { column: 'productType', direction: 'A' };

      component.onSortChange({ column: 'effDate', direction: 'default' as const });

      expect(component.tableConfig.sortConfig?.column).toBe('effDate');
    });
  });

  // ── Row Actions ─────────────────────────────────────────────────────────

  describe('Row Actions', () => {
    it('should open side panel in edit mode on edit action', () => {
      const row = mockData[0];
      component.onRowAction({ action: 'edit', row });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(row);
    });

    it('should not open side panel for unknown actions', () => {
      const row = mockData[0];
      component.onRowAction({ action: 'unknown', row });

      expect(component.sidePanelOpen).toBeFalse();
    });

  });

  // ── Add New Record ──────────────────────────────────────────────────────

  describe('Add New Record', () => {
    it('should open side panel in add mode with customer context', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.searchCardForm.get('consigneeId')?.setValue('CON001');

      component.addNewRecord();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData?.customerId).toBe('C001');
      expect(component.sidePanelData?.consigneeId).toBe('CON001');
    });

    it('should set empty customerId when none selected', () => {
      component.addNewRecord();

      expect(component.sidePanelData?.customerId).toBe('');
    });

  });

  // ── Filter Panel ────────────────────────────────────────────────────────

  describe('Filter Panel', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  // ── Filter Chips ────────────────────────────────────────────────────────

  describe('Filter Chips', () => {

    it('should create filter chips for both date filters', () => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2026-12-31'
      };

      component['updateFilterChips']();

      expect(component.filterChips.length).toBe(2);
    });



    it('should remove effective date filter chip', () => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2026-12-31'
      };

      component.onRemoveFilterChip('effectiveDate');

      expect(component.appliedFilters?.effectiveDate).toBeUndefined();
      expect(component.appliedFilters?.effectivePeriod).toBeUndefined();
      expect(component.appliedFilters?.terminationDate).toBe('2026-12-31');
    });

    it('should remove termination date filter chip', () => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2026-12-31'
      };

      component.onRemoveFilterChip('terminationDate');

      expect(component.appliedFilters?.terminationDate).toBeUndefined();
      expect(component.appliedFilters?.terminationPeriod).toBeUndefined();
      expect(component.appliedFilters?.effectiveDate).toBe('2026-01-01');
    });

    it('should not throw when removing chip with null filters', () => {
      component.appliedFilters = null;
      expect(() => component.onRemoveFilterChip('effectiveDate')).not.toThrow();
    });





  });

  // ── Save Success ────────────────────────────────────────────────────────
  // ── Computed Signals ────────────────────────────────────────────────────

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return all customers when search is empty', fakeAsync(() => {
      component.customerSearchCtrl.setValue('');
      tick();

      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(2);
    }));



    it('should return customer name when customer is selected', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();

      expect(component.selectedCustomerName()).toBe('Customer 1');
    }));


    it('should return only customerId for selectedCustomerDisplay', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();

      expect(component.selectedCustomerDisplay()).toBe('C001');
    }));


    it('should return formatted consignee display with name', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('consigneeId')?.setValue('CON001');
      tick();

      const display = component.selectedConsigneeDisplay();
      expect(display).toContain('CON001');
      expect(display).toContain('Consignee 1');
    }));
  });

  // ── Truncation Checks ──────────────────────────────────────────────────

  describe('Truncation Checks', () => {
    it('should set isCustomerTruncated based on element dimensions', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkCustomerTruncation(el);
      expect(component.isCustomerTruncated).toBeTrue();
    });

    it('should set isCustomerTruncated false when not truncated', () => {
      const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.checkCustomerTruncation(el);
      expect(component.isCustomerTruncated).toBeFalse();
    });

    it('should set isConsigneeTruncated based on element dimensions', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkConsigneeTruncation(el);
      expect(component.isConsigneeTruncated).toBeTrue();
    });

    it('should set isCustomerDescTruncated based on element dimensions', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkCustomerDescTruncation(el);
      expect(component.isCustomerDescTruncated).toBeTrue();
    });
  });

  // ── Date Formatting ─────────────────────────────────────────────────────

  describe('Date Formatting', () => {
    it('should format valid date in column value formatter', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatted = effDateCol?.valueFormatter?.('2026-01-15', {} as any);
      expect(formatted).toMatch(/15-JAN-2026/);
    });

    it('should return "--" for empty date value', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatted = effDateCol?.valueFormatter?.('', {} as any);
      expect(formatted).toBe('--');
    });


    it('should return "--" for empty product type/code', () => {
      const productTypeCol = component.tableConfig.columns.find(c => c.key === 'productType');
      const formatted = productTypeCol?.valueFormatter?.('', {} as any);
      expect(formatted).toBe('--');
    });

    it('should return value for non-empty product type', () => {
      const productTypeCol = component.tableConfig.columns.find(c => c.key === 'productType');
      const formatted = productTypeCol?.valueFormatter?.('TYPE1', {} as any);
      expect(formatted).toBe('TYPE1');
    });
  });

  // ── Chapter Change ──────────────────────────────────────────────────────

  describe('Chapter Change', () => {
    it('should clear all and reload customers on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.hasRetrievedData = true;
      component.dataSource = mockData;
      chapterChanged$.next();
      tick();

      expect(component.hasRetrievedData).toBeTrue();
      expect(component.dataSource.length).toBe(mockData.length);
      expect(apiServiceSpy.getCustomers).toHaveBeenCalled();
    }));
  });

  // ── Pagination ──────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('should update page size and index on page change', fakeAsync(() => {
      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 200 });
      tick();

      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).toHaveBeenCalled();
    }));

    it('should calculate correct skip value for page 3 with pageSize 25', fakeAsync(() => {
      component.onPageChange({ pageSize: 25, pageIndex: 3, length: 100 });
      tick();

      const skip = apiServiceSpy.getCustomerConsigneeProductDetails.calls.mostRecent().args[2];
      expect(skip).toBe(75);
    }));
  });

  // ── Sort Direction Cycling ─────────────────────────────────────────────

  describe('Sort Direction Cycling', () => {
    it('should cycle from default to A', () => {
      component.tableConfig.sortConfig = { column: 'productType', direction: 'default' };
      component.onSortChange({ column: 'productType', direction: 'default' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should cycle from A to D', () => {
      component.tableConfig.sortConfig = { column: 'productType', direction: 'A' };
      component.onSortChange({ column: 'productType', direction: 'A' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
    });

    it('should cycle from D to default', () => {
      component.tableConfig.sortConfig = { column: 'productType', direction: 'D' };
      component.onSortChange({ column: 'productType', direction: 'D' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });
  });

  // ── Side Panel ─────────────────────────────────────────────────────────

  describe('Side Panel', () => {
    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on save success', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.onSaveSuccess();
      tick();
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).toHaveBeenCalled();
    }));
  });

  // ── Clear All Filters ──────────────────────────────────────────────────

  describe('Clear All Filters', () => {
    it('should clear applied filters and reload data', fakeAsync(() => {
      component.appliedFilters = {
        effectivePeriod: 'After',
        effectiveDate: '2026-01-01'
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'test' }];

      component.onClearAllFilters();
      tick();

      expect(component.appliedFilters).toEqual({});
      expect(component.filterChips.length).toBe(0);
      expect(apiServiceSpy.getCustomerConsigneeProductDetails).toHaveBeenCalled();
    }));
  });

  // ── Computed Signal Edge Cases ─────────────────────────────────────────

  describe('Computed Signal Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter customers by search term', fakeAsync(() => {
      component.customerSearchCtrl.setValue('Customer 1');
      tick();

      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('C001');
    }));

    it('should return empty string for selectedCustomerName when no customer selected', () => {
      expect(component.selectedCustomerName()).toBe('');
    });

    it('should return empty string for selectedCustomerDisplay when no customer selected', () => {
      expect(component.selectedCustomerDisplay()).toBe('');
    });

    it('should return empty string for selectedConsigneeDisplay when no consignee selected', () => {
      expect(component.selectedConsigneeDisplay()).toBe('');
    });

    it('should return customerId when customer not found in options', fakeAsync(() => {
      component.customerOptions.set([]);
      component.searchCardForm.get('customerId')?.setValue('UNKNOWN');
      tick();
      expect(component.selectedCustomerDisplay()).toBe('UNKNOWN');
    }));

    it('should return consigneeId only when consignee not found in options', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.consigneeOptions.set([]);
      component.searchCardForm.get('consigneeId')?.setValue('UNKNOWN');
      tick();
      expect(component.selectedConsigneeDisplay()).toBe('UNKNOWN');
    }));

    it('should filter consignees by search term', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.consigneeSearchCtrl.setValue('Consignee 1');
      tick();

      const filtered = component.filteredConsigneeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].consigneeId).toBe('CON001');
    }));
  });

  // ── Date Formatting Edge Cases ─────────────────────────────────────────

  describe('Date Formatting Edge Cases', () => {
    it('should return original value for invalid date', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatted = effDateCol?.valueFormatter?.('not-a-date', {} as any);
      expect(formatted).toBe('not-a-date');
    });

    it('should return "--" for null date value', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      const formatted = termDateCol?.valueFormatter?.(null as any, {} as any);
      expect(formatted).toBe('--');
    });
  });

  // ── Search resets pagination ───────────────────────────────────────────

  describe('Search Pagination Reset', () => {
    it('should reset page index to 0 on search', fakeAsync(() => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };

      component.onSearch('TYPE1');
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));
  });

  // ── Add New Record Edge Cases ──────────────────────────────────────────

  describe('Add New Record Edge Cases', () => {
    it('should set consigneeId to null when none selected (customerId uses empty string, consigneeId uses null per source)', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.addNewRecord();

      expect(component.sidePanelData?.consigneeId).toBeNull();
    });
  });

  // ── Destroy ─────────────────────────────────────────────────────────────
});
