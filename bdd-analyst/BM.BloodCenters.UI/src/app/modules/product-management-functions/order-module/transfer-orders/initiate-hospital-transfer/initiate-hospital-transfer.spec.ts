import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  createMockSnackbarService,
  createMockHeaderService,
} from '@shared/testing/common-mocks';
import {
  PageHeaderWithBreadcrumbStub,
  FilterChipsStub,
} from '@shared/testing/component-stubs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { FilterChips } from '@shared/components/filter-chips/filter-chips';
import { InitiateHospitalTransferComponent } from './initiate-hospital-transfer';
import { InitiateHospitalTransferApiService } from './services/initiate-hospital-transfer-api.service';
import { InitiateHospitalTransferFilterPanel } from './initiate-hospital-transfer-filter-panel';
import { OrderItemDto } from './models/initiate-hospital-transfer.model';

@Component({ selector: 'app-initiate-hospital-transfer-filter-panel', template: '', standalone: true })
class FilterPanelStub {
  @Input() currentFilters: any;
  @Input() options: any;
  @Output() apply = new EventEmitter();
  @Output() clear = new EventEmitter();
  @Output() close = new EventEmitter();
}

@Component({ selector: 'app-search-bar', template: '', standalone: true })
class SearchBarStubLocal {
  @Input() config: any;
  @Output() search = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();
}

describe('InitiateHospitalTransferComponent', () => {
  let component: InitiateHospitalTransferComponent;
  let fixture: ComponentFixture<InitiateHospitalTransferComponent>;
  let apiServiceSpy: jasmine.SpyObj<InitiateHospitalTransferApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let matDialog: MatDialog;
  let chapterChanged$: Subject<void>;

  const mockOrders = [
    { orderNo: 'ORD-001', consigneeId: 'C01', consigneeName: 'Hospital A' },
    { orderNo: 'ORD-002', consigneeId: 'C02', consigneeName: 'Hospital B' },
  ];

  const mockItems: OrderItemDto[] = [
    { itemNo: 1, product: 'RBC', description: 'Red Blood Cells', aboRh: 'A Positive', requiredQuantity: 10, allocatedQuantity: 5, remainingQuantity: 5, substitution: 'Y', status: 'BO' },
    { itemNo: 2, product: 'PLT', description: 'Platelets', aboRh: 'O Negative', requiredQuantity: 3, allocatedQuantity: 3, remainingQuantity: 0, substitution: 'N', status: 'BO' },
  ];

  const mockOrderDetails = {
    success: true,
    message: 'OK',
    statusCode: 200,
    item: {
      orderNo: 'ORD-001',
      consigneeId: 'C01',
      consigneeName: 'Hospital A',
      shipmentAge: 5,
      status: 'BO',
      priority: 'STAT',
      type: 'BO',
      items: mockItems,
    },
  };

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('InitiateHospitalTransferApiService', [
      'getOrders', 'getOrderDetails', 'getAttributesAntigens', 'findProducts', 'printTransferSlip',
    ]);
    apiServiceSpy.getOrders.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockOrders] } as any));
    apiServiceSpy.getOrderDetails.and.returnValue(of(mockOrderDetails as any));

    snackbarSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getCurrentMenuItem', 'getTitle', 'getSubtitle']);
    pageHeaderServiceSpy.pageHeaderData = signal(undefined);

    await TestBed.configureTestingModule({
      imports: [
        InitiateHospitalTransferComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatDialogModule,
      ],
      providers: [
        { provide: InitiateHospitalTransferApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    })
      .overrideComponent(InitiateHospitalTransferComponent, {
        remove: {
          imports: [
            PageHeaderWithBreadcrumb,
            FilterChips,
            InitiateHospitalTransferFilterPanel,
          ],
        },
        add: {
          imports: [
            PageHeaderWithBreadcrumbStub,
            FilterPanelStub,
            FilterChipsStub,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InitiateHospitalTransferComponent);
    component = fixture.componentInstance;
    matDialog = TestBed.inject(MatDialog);
  });

  afterEach(() => {
    matDialog.closeAll();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call loadOrders on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getOrders).toHaveBeenCalled();
    });

    it('should populate allOrderOptions on successful load', () => {
      fixture.detectChanges();
      expect(component.allOrderOptions.length).toBe(2);
    });

    it('should clear orders on API error', () => {
      apiServiceSpy.getOrders.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.allOrderOptions.length).toBe(0);
    });
  });

  describe('orderNo form control valueChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call getOrderDetails when order selected', fakeAsync(() => {
      apiServiceSpy.getOrderDetails.calls.reset();
      component.filterForm.get('orderNo')?.setValue('ORD-001');
      tick();
      expect(apiServiceSpy.getOrderDetails).toHaveBeenCalledWith('ORD-001');
    }));

    it('should set orderData header on successful response', fakeAsync(() => {
      component.filterForm.get('orderNo')?.setValue('ORD-001');
      tick();
      expect(component.orderData()).toBeTruthy();
      expect(component.orderData()?.orderNo).toBe('ORD-001');
    }));

    it('should show error when API fails', fakeAsync(() => {
      apiServiceSpy.getOrderDetails.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.get('orderNo')?.setValue('ORD-001');
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('chapterChanged$', () => {
    it('should clear all and reload orders on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getOrders.calls.reset();
      chapterChanged$.next();
      tick();
      expect(apiServiceSpy.getOrders).toHaveBeenCalled();
      expect(component.hasSearched).toBeFalse();
    }));
  });

  describe('onRetrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if form is invalid', () => {
      apiServiceSpy.getOrderDetails.calls.reset();
      component.onRetrieve();
      expect(component.isLoading).toBeFalse();
    });

    it('should set loading and hasSearched', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: 'ORD-001', shipmentAge: 5 });
      apiServiceSpy.getOrderDetails.calls.reset();
      component.onRetrieve();
      expect(component.hasSearched).toBeTrue();
      tick();
    }));

    it('should populate order data on success', fakeAsync(() => {
      component.filterForm.patchValue({ orderNo: 'ORD-001', shipmentAge: 5 });
      apiServiceSpy.getOrderDetails.calls.reset();
      component.onRetrieve();
      tick();
      expect(component.orderData()?.orderNo).toBe('ORD-001');
      expect(component.sortedItems.length).toBe(2);
      expect(component.filteredItems().length).toBe(2);
      expect(component.isLoading).toBeFalse();
    }));

    it('should show error on unsuccessful response', fakeAsync(() => {
      apiServiceSpy.getOrderDetails.and.returnValue(of({
        success: false, message: 'Not found', statusCode: 404,
      } as any));
      component.filterForm.patchValue({ orderNo: 'BAD', shipmentAge: 0 });
      component.onRetrieve();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(component.orderData()).toBeNull();
      expect(component.isLoading).toBeFalse();
    }));

    it('should show error on API exception', fakeAsync(() => {
      apiServiceSpy.getOrderDetails.and.returnValue(throwError(() => new Error('Server error')));
      component.filterForm.patchValue({ orderNo: 'ORD-001', shipmentAge: 5 });
      component.onRetrieve();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(component.orderData()).toBeNull();
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('onClearAll', () => {
    it('should reset all state', () => {
      fixture.detectChanges();
      component.hasSearched = true;
      component.orderData.set(mockOrderDetails.item as any);
      component.sortedItems = [...mockItems];
      component.filteredItems.set([...mockItems]);
      component.productSearchText = 'test';

      component.onClearAll();

      expect(component.filterForm.get('orderNo')?.value).toBeFalsy();
      expect(component.orderData()).toBeNull();
      expect(component.selectedItems.length).toBe(0);
      expect(component.sortedItems.length).toBe(0);
      expect(component.filteredItems().length).toBe(0);
      expect(component.productSearchText).toBe('');
      expect(component.hasSearched).toBeFalse();
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData.set(mockOrderDetails.item as any);
      component.sortedItems = [...mockItems];
    });

    it('should sort ascending by itemNo', () => {
      component.onSortChange({ column: 'itemNo', direction: 'A' });
      expect(component.sortedItems[0].itemNo).toBe(1);
    });

    it('should sort descending by itemNo', () => {
      component.onSortChange({ column: 'itemNo', direction: 'D' });
      expect(component.sortedItems[0].itemNo).toBe(2);
    });

    it('should reset to original order when direction is default', () => {
      component.onSortChange({ column: 'itemNo', direction: 'default' });
      expect(component.sortedItems.length).toBe(2);
    });
  });

  describe('isItemDone', () => {
    it('should return true when remainingQuantity is 0', () => {
      expect(component.isItemDone(mockItems[1])).toBeTrue();
    });

    it('should return false when remainingQuantity > 0', () => {
      expect(component.isItemDone(mockItems[0])).toBeFalse();
    });
  });

  describe('onSelectionChange', () => {
    it('should update selectedItems', () => {
      fixture.detectChanges();
      component.onSelectionChange([mockItems[0]]);
      expect(component.selectedItems.length).toBe(1);
      expect(component.selectedItems[0].itemNo).toBe(1);
    });

    it('should handle empty selection', () => {
      fixture.detectChanges();
      component.onSelectionChange([]);
      expect(component.selectedItems.length).toBe(0);
    });
  });

  describe('displayValue', () => {
    it('should return dash for null', () => {
      expect(component.displayValue(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.displayValue(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.displayValue('')).toBe('-');
    });

    it('should return string for valid value', () => {
      expect(component.displayValue('Active')).toBe('Active');
    });

    it('should return string for number', () => {
      expect(component.displayValue(42)).toBe('42');
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
      component.filterForm.patchValue({ orderNo: 'ORD-001' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('filter management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData.set(mockOrderDetails.item as any);
      component.sortedItems = [...mockItems];
    });

    it('toggleFilter should toggle filterOpen signal', () => {
      expect(component.filterOpen()).toBeFalse();
      component.toggleFilter();
      expect(component.filterOpen()).toBeTrue();
      component.toggleFilter();
      expect(component.filterOpen()).toBeFalse();
    });

    it('onApplyFilters should set filter signals and close panel', () => {
      component.onApplyFilters({ aboRh: 'A Positive', requiredQuantity: '10', allocatedQuantity: '', remainingQuantity: '' });
      expect(component.filterAboRh()).toBe('A Positive');
      expect(component.filterRequiredQty()).toBe('10');
      expect(component.filterOpen()).toBeFalse();
      expect(component.filteredItems().length).toBe(1);
    });

    it('onClearFilters should clear all filter signals', () => {
      component.filterAboRh.set('A Positive');
      component.onClearFilters();
      expect(component.filterAboRh()).toBe('');
      expect(component.filterOpen()).toBeFalse();
    });

    it('onRemoveFilterChip should clear specific filter', () => {
      component.filterAboRh.set('A Positive');
      component.onRemoveFilterChip('aboRh');
      expect(component.filterAboRh()).toBe('');
    });

    it('onRemoveFilterChip should handle requiredQuantity', () => {
      component.filterRequiredQty.set('10');
      component.onRemoveFilterChip('requiredQuantity');
      expect(component.filterRequiredQty()).toBe('');
    });

    it('onRemoveFilterChip should handle allocatedQuantity', () => {
      component.filterAllocatedQty.set('5');
      component.onRemoveFilterChip('allocatedQuantity');
      expect(component.filterAllocatedQty()).toBe('');
    });

    it('onRemoveFilterChip should handle remainingQuantity', () => {
      component.filterRemainingQty.set('5');
      component.onRemoveFilterChip('remainingQuantity');
      expect(component.filterRemainingQty()).toBe('');
    });
  });

  describe('product search', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.sortedItems = [...mockItems];
    });

    it('onProductSearch should filter by product text', () => {
      component.onProductSearch('RBC');
      expect(component.filteredItems().length).toBe(1);
      expect(component.filteredItems()[0].product).toBe('RBC');
    });

    it('onProductSearchCleared should reset search', () => {
      component.onProductSearch('RBC');
      component.onProductSearchCleared();
      expect(component.filteredItems().length).toBe(2);
    });

    it('should filter by description', () => {
      component.onProductSearch('Platelets');
      expect(component.filteredItems().length).toBe(1);
      expect(component.filteredItems()[0].product).toBe('PLT');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters', () => {
      fixture.detectChanges();
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('should return true when filters active', () => {
      fixture.detectChanges();
      component.filterAboRh.set('A Positive');
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  describe('filterChips computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when no filters', () => {
      expect(component.filterChips().length).toBe(0);
    });

    it('should include aboRh chip when set', () => {
      component.filterAboRh.set('A Positive');
      const chips = component.filterChips();
      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('aboRh');
    });

    it('should include all active filter chips', () => {
      component.filterAboRh.set('A+');
      component.filterRequiredQty.set('10');
      component.filterAllocatedQty.set('5');
      component.filterRemainingQty.set('5');
      expect(component.filterChips().length).toBe(4);
    });
  });

  describe('filterOptions computed', () => {
    it('should return unique sorted options from items', () => {
      fixture.detectChanges();
      component.orderData.set(mockOrderDetails.item as any);
      const options = component.filterOptions();
      expect(options.aboRhOptions).toContain('A Positive');
      expect(options.aboRhOptions).toContain('O Negative');
    });

    it('should return empty arrays when no order data', () => {
      fixture.detectChanges();
      const options = component.filterOptions();
      expect(options.aboRhOptions.length).toBe(0);
    });
  });

  describe('onViewAttributeAntigen', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData.set(mockOrderDetails.item as any);
    });

    it('should return early when no selection', () => {
      component.onViewAttributeAntigen();
      expect(apiServiceSpy.getAttributesAntigens).not.toHaveBeenCalled();
    });

    it('should call API and open dialog on success', fakeAsync(() => {
      const compDialog = (component as any).dialog;
      const dialogOpenSpy = spyOn(compDialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      apiServiceSpy.getAttributesAntigens.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: {
          orderNo: 'ORD-001', itemNo: 1, productType: 'RBC',
          attributes: [{ group: 'G1', attributeCode: 'A1', attributeDescription: 'Attr1' }],
          antigens: [{ antigenCode: 'AG1', antigenDescription: 'Anti1' }],
        },
      } as any));

      component.selectedItems = [mockItems[0]];
      component.onViewAttributeAntigen();
      tick();

      expect(apiServiceSpy.getAttributesAntigens).toHaveBeenCalledWith('ORD-001', 1);
      expect(dialogOpenSpy).toHaveBeenCalled();
    }));

    it('should show error when API returns failure', fakeAsync(() => {
      apiServiceSpy.getAttributesAntigens.and.returnValue(of({
        success: false, message: 'Not found', statusCode: 404,
      } as any));

      component.selectedItems = [mockItems[0]];
      component.onViewAttributeAntigen();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should show error when API throws', fakeAsync(() => {
      apiServiceSpy.getAttributesAntigens.and.returnValue(throwError(() => new Error('fail')));

      component.selectedItems = [mockItems[0]];
      component.onViewAttributeAntigen();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('onFindProducts', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.orderData.set(mockOrderDetails.item as any);
      component.filterForm.patchValue({ shipmentAge: 5 }, { emitEvent: false });
    });

    it('should return early when no selection', () => {
      component.onFindProducts();
      expect(apiServiceSpy.findProducts).not.toHaveBeenCalled();
    });

    it('should call API with shipmentAge and open dialog on success', fakeAsync(() => {
      const compDialog = (component as any).dialog;
      const dialogOpenSpy = spyOn(compDialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      apiServiceSpy.findProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: {
          itemNo: 1, productType: 'RBC', quantityNeed: 5,
          hospitalName: 'Test Hospital', contactPerson: 'John', phoneNumber: '123',
          quantityAvailable: 2,
          products: [
            { fromHospital: 'H1', unitId: 'U1', productCode: 'PC1', productType: 'RBC', aboRh: 'A+', expirationDate: '2026-03-05', transferSlipSelected: '' },
          ],
        },
      } as any));

      component.selectedItems = [mockItems[0]];
      component.onFindProducts();
      tick();

      expect(apiServiceSpy.findProducts).toHaveBeenCalledWith('ORD-001', 1, 5);
      expect(dialogOpenSpy).toHaveBeenCalled();
    }));

    it('should show error when no products available', fakeAsync(() => {
      apiServiceSpy.findProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: [],
      } as any));

      component.selectedItems = [mockItems[0]];
      component.onFindProducts();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should show error on API failure', fakeAsync(() => {
      apiServiceSpy.findProducts.and.returnValue(throwError(() => new Error('fail')));

      component.selectedItems = [mockItems[0]];
      component.onFindProducts();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should handle response with data array instead of item', fakeAsync(() => {
      const compDialog = (component as any).dialog;
      const dialogOpenSpy = spyOn(compDialog, 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      apiServiceSpy.findProducts.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        item: null,
        data: [
          { fromHospital: 'H1', unitId: 'U1', productCode: 'PC1', productType: 'RBC', aboRh: 'A+', expirationDate: '2026-03-05', transferSlipSelected: '', shippedTo: 'H1' },
        ],
      } as any));

      component.selectedItems = [mockItems[0]];
      component.onFindProducts();
      tick();

      expect(dialogOpenSpy).toHaveBeenCalled();
    }));
  });

  describe('applyFilters (via onApplyFilters)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.sortedItems = [...mockItems];
    });

    it('should filter by allocatedQuantity', () => {
      component.onApplyFilters({ aboRh: '', requiredQuantity: '', allocatedQuantity: '5', remainingQuantity: '' });
      expect(component.filteredItems().length).toBe(1);
      expect(component.filteredItems()[0].allocatedQuantity).toBe(5);
    });

    it('should filter by remainingQuantity', () => {
      component.onApplyFilters({ aboRh: '', requiredQuantity: '', allocatedQuantity: '', remainingQuantity: '0' });
      expect(component.filteredItems().length).toBe(1);
      expect(component.filteredItems()[0].itemNo).toBe(2);
    });

    it('should combine multiple filters', () => {
      component.onApplyFilters({ aboRh: 'A Positive', requiredQuantity: '10', allocatedQuantity: '', remainingQuantity: '' });
      expect(component.filteredItems().length).toBe(1);
      expect(component.filteredItems()[0].product).toBe('RBC');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
