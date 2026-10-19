import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { FormGroupDirective } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

import { EnterCustomerTierPricingComponent } from './enter-customer-tier-pricing.component';
import { EnterCustomerTierPricingApiService } from './services/enter-customer-tier-pricing-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  CustomerTierPricingDto,
  CustomerLOV,
  ProductTypeLOV,
  DropdownValuesResponse,
} from './models/enter-customer-tier-pricing.model';

describe('EnterCustomerTierPricingComponent', () => {
  let component: EnterCustomerTierPricingComponent;
  let fixture: ComponentFixture<EnterCustomerTierPricingComponent>;
  let apiService: Record<string, jest.Mock>;
  let loggingService: Record<string, jest.Mock>;
  let snackbarService: Record<string, jest.Mock>;
  let headerService: { chapterChanged$: Subject<void> };
  let pageHeaderService: Record<string, any>;
  let overlayMock: Record<string, jest.Mock>;
  let chapterChanged$: Subject<void>;

  const mockCustomers: CustomerLOV[] = [
    { customerId: 'C001', customerName: 'Customer One', phoneNo: '555-1234' },
    { customerId: 'C002', customerName: 'Customer Two', phoneNo: '555-5678' },
  ];

  const mockProductTypes: ProductTypeLOV[] = [
    {
      productTypeId: 'PT001',
      productTypeDesc: 'Red Blood Cells',
      lifeSpan: 42,
      lifeSpanIndicator: 'Days',
      standardPrice: 250.50,
    },
    {
      productTypeId: 'PT002',
      productTypeDesc: 'Platelets',
      lifeSpan: 5,
      lifeSpanIndicator: 'Days',
      standardPrice: 600.00,
    },
  ];

  const mockDropdownResponse: DropdownValuesResponse = {
    customers: mockCustomers,
    productTypes: mockProductTypes,
  };

  const mockStandardRow: CustomerTierPricingDto = {
    customer: 'STANDARD',
    tier: 1,
    minimumAge: 0,
    maximumAge: 10,
    tierDay: 10,
    unitPrice: 250.50,
    effectiveDate: '2026-01-01',
    terminationDate: null,
  };

  const mockCustomerRow: CustomerTierPricingDto = {
    customer: 'C001',
    tier: 1,
    minimumAge: 0,
    maximumAge: 10,
    tierDay: 10,
    unitPrice: 275.00,
    effectiveDate: '2026-01-01',
    terminationDate: '2026-12-31',
  };

  const mockData: CustomerTierPricingDto[] = [mockStandardRow, mockCustomerRow];

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();

    apiService = {
      getDropdownValues: jest.fn().mockReturnValue(of(mockDropdownResponse)),
      searchCustomerTierPricing: jest.fn().mockReturnValue(of({ data: mockData, total: mockData.length })),
      deleteCustomerTierPricing: jest.fn().mockReturnValue(of({ success: true, message: 'Deleted', total: 0 })),
      getCustomerTierPricing: jest.fn().mockReturnValue(of({ data: mockData, total: mockData.length })),
      createCustomerTierPricing: jest.fn().mockReturnValue(of({ success: true, message: 'Created', total: 0 })),
      updateCustomerTierPricing: jest.fn().mockReturnValue(of({ success: true, message: 'Updated', total: 0 })),
    };

    loggingService = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };

    snackbarService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    };

    headerService = {
      chapterChanged$,
    };

    pageHeaderService = {
      pageHeaderData: jest.fn().mockReturnValue(null),
      getTitle: jest.fn().mockReturnValue(undefined),
      getSubtitle: jest.fn().mockReturnValue(undefined),
    };

    overlayMock = {
      create: jest.fn(),
      position: jest.fn().mockReturnValue({
        flexibleConnectedTo: jest.fn().mockReturnValue({
          withPositions: jest.fn().mockReturnValue({
            withPush: jest.fn().mockReturnValue({}),
          }),
        }),
      }),
      scrollStrategies: { reposition: jest.fn() } as any,
    };

    await TestBed.configureTestingModule({
      imports: [EnterCustomerTierPricingComponent, NoopAnimationsModule],
      providers: [
        { provide: EnterCustomerTierPricingApiService, useValue: apiService },
        { provide: LoggingService, useValue: loggingService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: HeaderService, useValue: headerService },
        { provide: PageHeaderService, useValue: pageHeaderService },
        { provide: Overlay, useValue: overlayMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterCustomerTierPricingComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ──────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize searchCardForm with customerId and productType controls', () => {
      expect(component.searchCardForm.get('customerId')).toBeTruthy();
      expect(component.searchCardForm.get('productType')).toBeTruthy();
    });

    it('should require customerId and productType validators', () => {
      const customerIdCtrl = component.searchCardForm.get('customerId')!;
      const productTypeCtrl = component.searchCardForm.get('productType')!;

      customerIdCtrl.setValue(null);
      productTypeCtrl.setValue(null);

      expect(customerIdCtrl.hasError('required')).toBe(true);
      expect(productTypeCtrl.hasError('required')).toBe(true);
    });

    it('should call loadDropdownValues, subscribeToSearchCardChanges, subscribeToChapterChanges on ngOnInit', () => {
      const loadDropdownSpy = jest.spyOn(component as any, 'loadDropdownValues');
      const searchCardSpy = jest.spyOn(component as any, 'subscribeToSearchCardChanges');
      const chapterSpy = jest.spyOn(component as any, 'subscribeToChapterChanges');

      component.ngOnInit();

      expect(loadDropdownSpy).toHaveBeenCalled();
      expect(searchCardSpy).toHaveBeenCalled();
      expect(chapterSpy).toHaveBeenCalled();
    });

    it('should not load data until retrieve is clicked', () => {
      fixture.detectChanges();
      expect(apiService.searchCustomerTierPricing).not.toHaveBeenCalled();
      expect(component.hasRetrievedData).toBe(false);
    });

    it('should populate dropdown options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.customerOptions().length).toBe(2);
      expect(component.productTypeOptions().length).toBe(2);
      expect(component.isLoadingCustomers).toBe(false);
      expect(component.isLoadingProductTypes).toBe(false);
    }));

    it('should handle dropdown load error gracefully', fakeAsync(() => {
      apiService.getDropdownValues.mockReturnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      tick();

      expect(component.customerOptions()).toEqual([]);
      expect(component.productTypeOptions()).toEqual([]);
      expect(component.isLoadingCustomers).toBe(false);
      expect(component.isLoadingProductTypes).toBe(false);
    }));
  });

  // ── Computed Signals ────────────────────────────────────────────────────

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('filteredCustomerOptions should return all customers when search is empty', () => {
      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(2);
    });

    it('filteredCustomerOptions should filter by customerId', fakeAsync(() => {
      component.customerSearchCtrl.setValue('C001');
      tick();

      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('C001');
    }));

    it('filteredCustomerOptions should filter by customerName', fakeAsync(() => {
      component.customerSearchCtrl.setValue('Two');
      tick();

      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('C002');
    }));

    it('filteredCustomerOptions should filter by phoneNo (phone search)', fakeAsync(() => {
      component.customerSearchCtrl.setValue('5678');
      tick();

      const filtered = component.filteredCustomerOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('C002');
    }));

    it('filteredProductTypeOptions should return all when search is empty', () => {
      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(2);
    });

    it('filteredProductTypeOptions should filter by productTypeId', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('PT002');
      tick();

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productTypeId).toBe('PT002');
    }));

    it('filteredProductTypeOptions should filter by productTypeDesc', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('Platelet');
      tick();

      const filtered = component.filteredProductTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productTypeDesc).toBe('Platelets');
    }));

    it('selectedCustomerName should return empty string when no customer selected', () => {
      expect(component.selectedCustomerName()).toBe('');
    });

    it('selectedCustomerName should return customer name when selected', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();

      expect(component.selectedCustomerName()).toBe('Customer One');
    }));

    it('selectedLifeSpan should return empty string when no product type selected', () => {
      expect(component.selectedLifeSpan()).toBe('');
    });

    it('selectedLifeSpan should return formatted lifespan when product type selected', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      expect(component.selectedLifeSpan()).toBe('42 Days');
    }));

    it('selectedStandardPrice should return empty string when no product type selected', () => {
      expect(component.selectedStandardPrice()).toBe('');
    });

    it('selectedStandardPrice should return formatted price when product type selected', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      expect(component.selectedStandardPrice()).toBe('250.50');
    }));
  });

  // ── Search Card ─────────────────────────────────────────────────────────

  describe('Search Card', () => {
    it('should disable retrieve when no customer selected', () => {
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should disable retrieve when no productType selected', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('should enable retrieve when both fields selected', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      expect(component.isRetrieveDisabled).toBe(false);
    }));

    it('should disable retrieve when isLoading is true', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();
      component.isLoading = true;

      expect(component.isRetrieveDisabled).toBe(true);
    }));

    it('should disable retrieve when already retrieved with current search', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();
      component.retrievedWithCurrentSearch = true;

      expect(component.isRetrieveDisabled).toBe(true);
    }));

    it('should disable clear all when no customer, no product type, and no retrieved data', () => {
      expect(component.isClearAllDisabled).toBe(true);
    });

    it('should enable clear all when customer is selected', () => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      expect(component.isClearAllDisabled).toBe(false);
    });

    it('should enable clear all when hasRetrievedData is true', () => {
      component.hasRetrievedData = true;
      expect(component.isClearAllDisabled).toBe(false);
    });

    it('should reset productType when customer changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      component.searchCardForm.get('customerId')?.setValue('C002');
      tick();

      expect(component.searchCardForm.get('productType')?.value).toBeNull();
      expect(component.selectedProductTypeId()).toBeNull();
    }));

    it('should reset retrievedWithCurrentSearch when customer changes', fakeAsync(() => {
      fixture.detectChanges();
      component.retrievedWithCurrentSearch = true;
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();

      expect(component.retrievedWithCurrentSearch).toBe(false);
    }));

    it('should reset retrievedWithCurrentSearch when productType changes', fakeAsync(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.retrievedWithCurrentSearch = true;
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      expect(component.retrievedWithCurrentSearch).toBe(false);
    }));
  });

  // ── onRetrieve ──────────────────────────────────────────────────────────

  describe('onRetrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark form as touched', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      component.onRetrieve();
      tick();

      expect(component.searchCardForm.get('customerId')?.touched).toBe(true);
      expect(component.searchCardForm.get('productType')?.touched).toBe(true);
    }));

    it('should not call loadData when form is incomplete', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(apiService.searchCustomerTierPricing).not.toHaveBeenCalled();
    }));

    it('should call loadData when form is valid', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();

      component.onRetrieve();
      tick();

      expect(apiService.searchCustomerTierPricing).toHaveBeenCalled();
      expect(component.hasRetrievedData).toBe(true);
      expect(component.retrievedWithCurrentSearch).toBe(true);
    }));

    it('should reset page index to 0 on retrieve', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 },
      };

      component.onRetrieve();
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));
  });

  // ── onClearAllSearch ────────────────────────────────────────────────────

  describe('onClearAllSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all state', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      tick();
      component.searchCardForm.get('productType')?.setValue('PT001');
      tick();
      component.hasRetrievedData = true;
      component.dataSource = mockData;
      component.hasError = true;

      component.onClearAllSearch();

      expect(component.selectedCustomerId()).toBeNull();
      expect(component.selectedProductTypeId()).toBeNull();
      expect(component.hasRetrievedData).toBe(false);
      expect(component.retrievedWithCurrentSearch).toBe(false);
      expect(component.dataSource.length).toBe(0);
      expect(component.hasError).toBe(false);
      expect(component.filterChips.length).toBe(0);
    }));

    it('should close side panel on clear all', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockCustomerRow;

      component.onClearAllSearch();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should reset currentFilters to empty', () => {
      component.currentFilters.set({ effectiveDate: '2026-01-01', effectiveDatePeriod: 'After' });
      component.onClearAllSearch();

      const f = component.currentFilters();
      expect(f.effectiveDate).toBeUndefined();
      expect(f.effectiveDatePeriod).toBeUndefined();
    });
  });

  // ── Data Loading (loadData) ─────────────────────────────────────────────

  describe('loadData', () => {
    it('should set isLoading to true and clear error state', () => {
      component.hasError = true;
      component.loadData();
      expect(component.hasError).toBe(false);
    });

    it('should populate dataSource on success', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.searchCardForm.get('productType')?.setValue('PT001');

      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBe(false);
    }));

    it('should update total records from response', fakeAsync(() => {
      apiService.searchCustomerTierPricing.mockReturnValue(
        of({ data: mockData, total: 100 })
      );

      component.loadData();
      tick();

      expect(component.tableConfig.pagination?.totalRecords).toBe(100);
    }));

    it('should pass filter request when filters are active', fakeAsync(() => {
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.searchCardForm.get('productType')?.setValue('PT001');
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      component.loadData();
      tick();

      const filterArg = apiService.searchCustomerTierPricing.mock.calls[0][2];
      expect(filterArg.effectiveDatePeriod).toBe('After');
      expect(filterArg.effectiveDate).toBe('2026-01-01');
      expect(filterArg.terminationDatePeriod).toBe('Before');
      expect(filterArg.terminationDate).toBe('2026-12-31');
    }));

    it('should handle error with errorCode in nested errorResponse', fakeAsync(() => {
      apiService.searchCustomerTierPricing.mockReturnValue(
        throwError(() => ({
          error: {
            errorResponse: { errorCode: '1234', error: 'Custom error' },
          },
        }))
      );

      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toContain('1234');
      expect(component.errorMessage).toContain('Custom error');
      expect(loggingService.error).toHaveBeenCalled();
      expect(snackbarService.showError).toHaveBeenCalled();
    }));

    it('should handle error with errorCode at body level', fakeAsync(() => {
      apiService.searchCustomerTierPricing.mockReturnValue(
        throwError(() => ({
          error: { errorCode: 'ERR500', error: 'Server error' },
        }))
      );

      component.loadData();
      tick();

      expect(component.errorMessage).toContain('ERR500');
      expect(component.errorMessage).toContain('Server error');
    }));

    it('should use default error message when no error details', fakeAsync(() => {
      apiService.searchCustomerTierPricing.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      component.loadData();
      tick();

      expect(component.errorMessage).toContain('Failed to load tier pricing');
    }));

    it('should use body.message as fallback error message', fakeAsync(() => {
      apiService.searchCustomerTierPricing.mockReturnValue(
        throwError(() => ({
          error: { message: 'Something went wrong' },
        }))
      );

      component.loadData();
      tick();

      expect(component.errorMessage).toBe('Something went wrong');
    }));
  });

  // ── editRecord ──────────────────────────────────────────────────────────

  describe('editRecord', () => {
    it('should set mode to "add" for STANDARD rows', () => {
      component.editRecord(mockStandardRow);

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toEqual(mockStandardRow);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should set mode to "edit" for customer rows', () => {
      component.editRecord(mockCustomerRow);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockCustomerRow);
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  // ── hasStandardRows ─────────────────────────────────────────────────────

  describe('hasStandardRows', () => {
    it('should return true when dataSource contains a STANDARD row', () => {
      component.dataSource = mockData;
      expect(component.hasStandardRows()).toBe(true);
    });

    it('should return false when dataSource has no STANDARD rows', () => {
      component.dataSource = [mockCustomerRow];
      expect(component.hasStandardRows()).toBe(false);
    });

    it('should return false when dataSource is empty', () => {
      component.dataSource = [];
      expect(component.hasStandardRows()).toBe(false);
    });
  });

  // ── openAddPanel ────────────────────────────────────────────────────────

  describe('openAddPanel', () => {
    it('should open the side panel with first STANDARD row', () => {
      component.dataSource = mockData;
      component.openAddPanel();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toEqual(mockStandardRow);
    });

    it('should not open side panel if no STANDARD row exists', () => {
      component.dataSource = [mockCustomerRow];
      component.openAddPanel();

      expect(component.sidePanelOpen).toBe(false);
    });
  });

  // ── deleteRecord ────────────────────────────────────────────────────────

  describe('deleteRecord', () => {
    let confirmSpy: jest.SpyInstance;

    beforeEach(() => {
      fixture.detectChanges();
      component.searchCardForm.get('customerId')?.setValue('C001');
      component.searchCardForm.get('productType')?.setValue('PT001');
    });

    afterEach(() => {
      confirmSpy?.mockRestore();
    });

    it('should not call API when user cancels confirm', () => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      component.deleteRecord(mockCustomerRow);

      expect(apiService.deleteCustomerTierPricing).not.toHaveBeenCalled();
    });

    it('should call deleteCustomerTierPricing when user confirms', fakeAsync(() => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteRecord(mockCustomerRow);
      tick();

      expect(apiService.deleteCustomerTierPricing).toHaveBeenCalledWith('C001', 'PT001', 1);
      expect(snackbarService.showSuccess).toHaveBeenCalled();
    }));

    it('should reload data after successful delete', fakeAsync(() => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteRecord(mockCustomerRow);
      tick();

      expect(apiService.searchCustomerTierPricing).toHaveBeenCalled();
    }));

    it('should close side panel after successful delete', fakeAsync(() => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      component.sidePanelOpen = true;

      component.deleteRecord(mockCustomerRow);
      tick();

      expect(component.sidePanelOpen).toBe(false);
    }));

    it('should show error snackbar on delete failure', fakeAsync(() => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      apiService.deleteCustomerTierPricing.mockReturnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );

      component.deleteRecord(mockCustomerRow);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Delete failed');
    }));

    it('should use default error message when delete error has no message', fakeAsync(() => {
      confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      apiService.deleteCustomerTierPricing.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      component.deleteRecord(mockCustomerRow);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Failed to delete tier pricing. Please try again.'
      );
    }));
  });

  // ── onRowAction ─────────────────────────────────────────────────────────

  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      const editSpy = jest.spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockCustomerRow });
      expect(editSpy).toHaveBeenCalledWith(mockCustomerRow);
    });

    it('should call deleteRecord for delete action', () => {
      const deleteSpy = jest.spyOn(component, 'deleteRecord');
      component.onRowAction({ action: 'delete', row: mockCustomerRow });
      expect(deleteSpy).toHaveBeenCalledWith(mockCustomerRow);
    });

    it('should not call any method for unknown action', () => {
      const editSpy = jest.spyOn(component, 'editRecord');
      const deleteSpy = jest.spyOn(component, 'deleteRecord');

      component.onRowAction({ action: 'unknown', row: mockCustomerRow });

      expect(editSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  // ── onSaveSuccess ───────────────────────────────────────────────────────

  describe('onSaveSuccess', () => {
    it('should call loadData', () => {
      const loadDataSpy = jest.spyOn(component, 'loadData');
      component.onSaveSuccess();
      expect(loadDataSpy).toHaveBeenCalled();
    });
  });

  // ── Filter Panel / Chips ────────────────────────────────────────────────

  describe('Filter Panel', () => {
    it('buildFilterChips should create chip for effective date filter', () => {
      const chips = component.buildFilterChips({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
      });

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('effectiveDate');
      expect(chips[0].label).toContain('Effective Date');
    });

    it('buildFilterChips should create chip for termination date filter', () => {
      const chips = component.buildFilterChips({
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('terminationDate');
      expect(chips[0].label).toContain('Termination Date');
    });

    it('buildFilterChips should create two chips for both date filters', () => {
      const chips = component.buildFilterChips({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      expect(chips.length).toBe(2);
    });

    it('buildFilterChips should return empty array when no filters', () => {
      const chips = component.buildFilterChips({});
      expect(chips.length).toBe(0);
    });

    it('buildFilterChips should use >= symbol for After period', () => {
      const chips = component.buildFilterChips({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-06-15',
      });

      expect(chips[0].label).toContain('≥');
    });

    it('buildFilterChips should use <= symbol for Before period', () => {
      const chips = component.buildFilterChips({
        effectiveDatePeriod: 'Before',
        effectiveDate: '2026-06-15',
      });

      expect(chips[0].label).toContain('≤');
    });

    it('onRemoveFilterChip should remove effectiveDate filter and reload', fakeAsync(() => {
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      component.onRemoveFilterChip('effectiveDate');
      tick();

      const f = component.currentFilters();
      expect(f.effectiveDate).toBeUndefined();
      expect(f.effectiveDatePeriod).toBeUndefined();
      expect(f.terminationDate).toBe('2026-12-31');
      expect(apiService.searchCustomerTierPricing).toHaveBeenCalled();
    }));

    it('onRemoveFilterChip should remove terminationDate filter and reload', fakeAsync(() => {
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31',
      });

      component.onRemoveFilterChip('terminationDate');
      tick();

      const f = component.currentFilters();
      expect(f.terminationDate).toBeUndefined();
      expect(f.terminationDatePeriod).toBeUndefined();
      expect(f.effectiveDate).toBe('2026-01-01');
    }));

    it('clearAllFilters should reset filters, chips, and reload', fakeAsync(() => {
      component.currentFilters.set({
        effectiveDatePeriod: 'After',
        effectiveDate: '2026-01-01',
      });
      component.filterChips = [{ key: 'effectiveDate', label: 'test', value: '2026-01-01', removable: true }];

      component.clearAllFilters();
      tick();

      const f = component.currentFilters();
      expect(f.effectiveDate).toBeUndefined();
      expect(component.filterChips.length).toBe(0);
      expect(apiService.searchCustomerTierPricing).toHaveBeenCalled();
    }));

    it('hasActiveFilters should return false when no filters set', () => {
      component.currentFilters.set({});
      expect(component.hasActiveFilters).toBe(false);
    });

    it('hasActiveFilters should return true when effectiveDate is set', () => {
      component.currentFilters.set({ effectiveDate: '2026-01-01' });
      expect(component.hasActiveFilters).toBe(true);
    });

    it('hasActiveFilters should return true when terminationDate is set', () => {
      component.currentFilters.set({ terminationDate: '2026-12-31' });
      expect(component.hasActiveFilters).toBe(true);
    });
  });

  // ── Pagination & Sorting ────────────────────────────────────────────────

  describe('Pagination and Sorting', () => {
    it('onPageChange should update pagination and call loadData', fakeAsync(() => {
      const loadDataSpy = jest.spyOn(component, 'loadData');
      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 });
      tick();

      expect(component.tableConfig.pagination?.pageSize).toBe(50);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(loadDataSpy).toHaveBeenCalled();
    }));

    it('onSortChange should cycle sort direction default -> A -> D -> default', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'tier', direction: 'default' },
      };

      component.onSortChange({ column: 'tier', direction: 'default' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');

      component.onSortChange({ column: 'tier', direction: 'A' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');

      component.onSortChange({ column: 'tier', direction: 'D' as const });
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('onSortChange should reset page index to 0', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 },
        sortConfig: { column: 'tier', direction: 'default' },
      };

      component.onSortChange({ column: 'tier', direction: 'default' as const });

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  // ── Chapter Change ──────────────────────────────────────────────────────

  describe('Chapter Change', () => {
    it('should clear all and reload dropdown values on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.hasRetrievedData = true;
      component.dataSource = mockData;
      apiService.getDropdownValues.mockClear();

      chapterChanged$.next();
      tick();

      expect(component.hasRetrievedData).toBe(false);
      expect(component.dataSource.length).toBe(0);
      expect(apiService.getDropdownValues).toHaveBeenCalled();
    }));
  });

  // ── Truncation Checks ──────────────────────────────────────────────────

  describe('Truncation Checks', () => {
    it('should set isCustomerTruncated to true when scrollWidth > clientWidth', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkCustomerTruncation(el);
      expect(component.isCustomerTruncated).toBe(true);
    });

    it('should set isCustomerTruncated to false when not truncated', () => {
      const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.checkCustomerTruncation(el);
      expect(component.isCustomerTruncated).toBe(false);
    });

    it('should set isCustomerNameTruncated based on element dimensions', () => {
      const el = { scrollWidth: 300, clientWidth: 100 } as HTMLElement;
      component.checkCustomerNameTruncation(el);
      expect(component.isCustomerNameTruncated).toBe(true);
    });

    it('should set isProductTypeTruncated based on element dimensions', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkProductTypeTruncation(el);
      expect(component.isProductTypeTruncated).toBe(true);
    });
  });

  // ── Date Formatting via Table Column ────────────────────────────────────

  describe('Date Formatting', () => {
    it('should format valid date in effectiveDate column', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      const formatted = col?.valueFormatter?.('2026-01-15', {} as any);
      expect(formatted).toMatch(/15-JAN-2026/);
    });

    it('should return "--" for null date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      const formatted = col?.valueFormatter?.(null as any, {} as any);
      expect(formatted).toBe('--');
    });

    it('should format unitPrice column with dollar sign', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitPrice');
      const formatted = col?.valueFormatter?.(250.5, {} as any);
      expect(formatted).toBe('$250.50');
    });

    it('should return "--" for null unitPrice', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'unitPrice');
      const formatted = col?.valueFormatter?.(null as any, {} as any);
      expect(formatted).toBe('--');
    });
  });

  // ── Side Panel ──────────────────────────────────────────────────────────

  describe('Side Panel', () => {
    it('closeSidePanel should set sidePanelOpen to false and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockCustomerRow;

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  // ── Table Row Action Visibility ─────────────────────────────────────────

  describe('Table Row Action Visibility', () => {
    it('delete action should be hidden for STANDARD rows', () => {
      const deleteAction = component.tableConfig.rowActions?.find(a => a.action === 'delete');
      expect(deleteAction?.visible?.(mockStandardRow)).toBe(false);
    });

    it('delete action should be visible for customer rows', () => {
      const deleteAction = component.tableConfig.rowActions?.find(a => a.action === 'delete');
      expect(deleteAction?.visible?.(mockCustomerRow)).toBe(true);
    });
  });

  // ── Destroy ─────────────────────────────────────────────────────────────

  describe('Destroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
