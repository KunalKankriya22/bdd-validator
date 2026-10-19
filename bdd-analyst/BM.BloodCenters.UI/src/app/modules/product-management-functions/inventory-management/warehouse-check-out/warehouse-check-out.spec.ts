import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { WarehouseCheckOut } from './warehouse-check-out';
import { WarehouseCheckOutApiService } from './services/warehouse-check-out-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ConfirmActionDialogData } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  WarehouseCheckOutBatchDto,
  WarehouseDropdownDto,
  CheckedOutUnitRow,
  ApiListResponse,
  UnitLookupDto,
} from './models/warehouse-check-out.model';

describe('WarehouseCheckOut', () => {
  let component: WarehouseCheckOut;
  let fixture: ComponentFixture<WarehouseCheckOut>;
  let mockApiService: jasmine.SpyObj<WarehouseCheckOutApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;
  let pageHeaderDataSignal: ReturnType<typeof signal>;

  const mockBatches: WarehouseCheckOutBatchDto[] = [
    {
      batchId: 'WHH0000149',
      toWarehouse: 'BCT',
      toWarehouseName: 'Blood Center Technologies',
      fromWarehouse: 'H',
      fromWarehouseName: 'Home Warehouse',
      checkoutTemp: -20,
      batchName: 'Awaiting further examination.',
      batchStatus: 'OPEN',
      createDate: '2025-01-10T00:00:00',
      createUser: 'LM1234',
      products: [
        { unitId: 'W1234-18-031310-Z', productCode: 'E0701V00', aliquot: null, collectionDate: '2025-01-10T00:00:00', expirationDate: '2025-01-11T13:16:00' },
      ],
    },
    {
      batchId: 'WHH0000150',
      toWarehouse: 'RMH',
      toWarehouseName: 'Regional Medical Hospital',
      fromWarehouse: 'H',
      fromWarehouseName: 'Home Warehouse',
      checkoutTemp: 4,
      batchName: 'Routine transfer.',
      batchStatus: 'OPEN',
      createDate: '2025-01-12T00:00:00',
      createUser: 'JD5678',
    },
  ];

  const mockWarehouses: WarehouseDropdownDto[] = [
    { code: 'H', description: 'Home Warehouse' },
    { code: 'BCT', description: 'Blood Center Technologies' },
    { code: 'RMH', description: 'Regional Medical Hospital' },
  ];

  const mockUnits: CheckedOutUnitRow[] = [
    { unitId: 'W1234-18-031310-Z', collectionDate: '10-JAN-2025', product: 'E0701V00', expirationDate: '11-JAN-2025  13:16' },
    { unitId: 'W1234-18-031309-Z', collectionDate: '10-JAN-2025', product: 'E0701V01', expirationDate: '11-JAN-2025  13:15' },
  ];

  const mockProducts: UnitLookupDto[] = [
    { productCode: 'E0385V00', aliquot: null, collectionDate: '2025-01-10T00:00:00', expirationDate: '2025-01-11T13:17:00' },
    { productCode: 'E0701V00', aliquot: null, collectionDate: '2025-01-10T00:00:00', expirationDate: '2025-01-11T13:16:00' },
  ];

  function makeSuccessResponse<T>(data: T[] = []): ApiListResponse<T> {
    return { success: true, message: '', statusCode: 200, data, errorResponse: { errorCode: '', error: '' } };
  }

  function makeFailureResponse<T>(message = 'Failed'): ApiListResponse<T> {
    return { success: false, message, statusCode: 400, data: [], errorResponse: { errorCode: '0001', error: message } };
  }

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('WarehouseCheckOutApiService', [
      'getBatches', 'getBatchById', 'getWarehouses', 'createBatch',
      'updateBatch', 'addProduct', 'removeProduct', 'lookupUnit', 'commitBatch',
    ]);

    chapterChanged$ = new Subject<void>();
    const mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('CH01'),
      getCurrentWarehouseId: jasmine.createSpy('getCurrentWarehouseId').and.returnValue('H'),
    };

    mockSnackbarService = createMockSnackbarService();
    mockDialog = createMockMatDialog();
    pageHeaderDataSignal = signal(undefined);

    mockApiService.getBatches.and.returnValue(of(mockBatches));
    mockApiService.getWarehouses.and.returnValue(of(mockWarehouses));
    mockApiService.getBatchById.and.returnValue(of(mockBatches[0]));
    mockApiService.lookupUnit.and.returnValue(of(mockProducts));

    TestBed.configureTestingModule({
      imports: [
        WarehouseCheckOut,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WarehouseCheckOutApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: { pageHeaderData: pageHeaderDataSignal, getTitle: () => '', getSubtitle: () => '' } },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
      ],
    }).overrideComponent(WarehouseCheckOut, {
      add: {
        providers: [
          { provide: MatDialog, useValue: mockDialog },
        ],
      },
    });

    fixture = TestBed.createComponent(WarehouseCheckOut);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Initialization ---

  describe('ngOnInit', () => {
    it('should initialize batchForm with expected controls', () => {
      expect(component.batchForm).toBeDefined();
      expect(component.batchForm.get('batchId')).toBeTruthy();
      expect(component.batchForm.get('sendTo')).toBeTruthy();
      expect(component.batchForm.get('temperature')).toBeTruthy();
      expect(component.batchForm.get('remarks')).toBeTruthy();
    });

    it('should initialize unitEntryForm with productCode control', () => {
      expect(component.unitEntryForm).toBeDefined();
      expect(component.unitEntryForm.get('productCode')).toBeTruthy();
    });

    it('should load batches on init', () => {
      expect(mockApiService.getBatches).toHaveBeenCalled();
      expect(component.batchOptions()).toEqual(mockBatches);
    });

    it('should load warehouses on init', () => {
      expect(mockApiService.getWarehouses).toHaveBeenCalled();
      expect(component.warehouseOptions()).toEqual(mockWarehouses);
    });

    it('should resolve warehouse label after batch retrieval', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onRetrieve();

      expect(component['resolvedWarehouseLabel']()).toBe('H - Home Warehouse');
    });

    it('should have empty warehouse label before retrieval', () => {
      const newFixture = TestBed.createComponent(WarehouseCheckOut);
      newFixture.detectChanges();

      expect(newFixture.componentInstance['resolvedWarehouseLabel']()).toBe('');
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // --- Constructor Effect ---

  describe('constructor effect', () => {
    it('should update pageHeaderConfig when pageHeaderData emits', () => {
      pageHeaderDataSignal.set({ title: 'Warehouse Check-Out', subtitle: 'Custom subtitle' });
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('Warehouse Check-Out');
      expect(component.pageHeaderConfig.subtitle).toBe('Custom subtitle');
      expect(component.pageHeaderConfig.breadcrumbs?.length).toBe(2);
    });

    it('should use default subtitle when pageHeaderData has no subtitle', () => {
      pageHeaderDataSignal.set({ title: 'Warehouse Check-Out', subtitle: '' });
      fixture.detectChanges();

      expect(component.pageHeaderConfig.subtitle).toContain('Check available products out of one warehouse');
    });
  });

  // --- Chapter Changed ---

  describe('chapterChanged$', () => {
    it('should reload data and clear form on chapter change', () => {
      mockApiService.getBatches.calls.reset();
      mockApiService.getWarehouses.calls.reset();

      chapterChanged$.next();

      expect(mockApiService.getBatches).toHaveBeenCalled();
      expect(mockApiService.getWarehouses).toHaveBeenCalled();
      expect(component.batchRetrieved()).toBe(false);
    });
  });

  // --- Data Loading Errors ---

  describe('data loading errors', () => {
    it('should show error snackbar when loadBatches fails', () => {
      mockApiService.getBatches.and.returnValue(throwError(() => new Error('fail')));
      const newFixture = TestBed.createComponent(WarehouseCheckOut);
      newFixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load batches.');
    });

    it('should show error snackbar when loadWarehouses fails', () => {
      mockApiService.getWarehouses.and.returnValue(throwError(() => new Error('fail')));
      const newFixture = TestBed.createComponent(WarehouseCheckOut);
      newFixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load warehouses.');
    });
  });

  // --- Batch Selection ---

  describe('batch selection via batchId valueChanges', () => {
    it('should populate form fields when batchId is selected', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      expect(component.batchForm.get('sendTo')?.value).toBe('BCT');
      expect(component.batchForm.get('temperature')?.value).toBe(-20);
      expect(component.batchForm.get('remarks')?.value).toBe('Awaiting further examination.');
    });

    it('should set selectedBatch signal when batchId is selected', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      expect(component.selectedBatch()).toBeTruthy();
      expect(component.selectedBatch()?.batchId).toBe('WHH0000149');
    });

    it('should not update selectedBatch when batch is not found', () => {
      component.batchForm.get('batchId')?.setValue('NONEXISTENT');

      expect(component.selectedBatch()).toBeNull();
    });

    it('should not trigger onBatchIdSelected when batchId is empty', () => {
      component.batchForm.get('batchId')?.setValue('');

      expect(component.selectedBatch()).toBeNull();
    });
  });

  // --- Search Filtering ---

  describe('search controls', () => {
    it('should filter batches by search term', () => {
      component.batchIdSearchCtrl.setValue('149');

      expect(component['filteredBatches']().length).toBe(1);
      expect(component['filteredBatches']()[0].batchId).toBe('WHH0000149');
    });

    it('should show all batches when search is cleared', () => {
      component.batchIdSearchCtrl.setValue('149');
      component.batchIdSearchCtrl.setValue('');

      expect(component['filteredBatches']().length).toBe(mockBatches.length);
    });

    it('should handle null batch search term', () => {
      component.batchIdSearchCtrl.setValue(null);

      expect(component['filteredBatches']().length).toBe(mockBatches.length);
    });

    it('should filter warehouses by code', () => {
      component.warehouseSearchCtrl.setValue('BCT');

      expect(component['filteredWarehouses']().length).toBe(1);
      expect(component['filteredWarehouses']()[0].code).toBe('BCT');
    });

    it('should filter warehouses by description', () => {
      component.warehouseSearchCtrl.setValue('Regional');

      expect(component['filteredWarehouses']().length).toBe(1);
      expect(component['filteredWarehouses']()[0].code).toBe('RMH');
    });

    it('should show all warehouses when search is cleared', () => {
      component.warehouseSearchCtrl.setValue('BCT');
      component.warehouseSearchCtrl.setValue('');

      expect(component['filteredWarehouses']().length).toBe(mockWarehouses.length);
    });

    it('should filter product options by productCode', () => {
      component['productOptions'].set([
        { productCode: 'E0385V00' },
        { productCode: 'E0701V00', productDesc: 'Platelets' },
      ]);

      component.productSearchControl.setValue('0385');

      expect(component['filteredProductOptions']().length).toBe(1);
      expect(component['filteredProductOptions']()[0].productCode).toBe('E0385V00');
    });

    it('should filter product options by productDesc', () => {
      component['productOptions'].set([
        { productCode: 'E0385V00', productDesc: 'Red Blood Cells' },
        { productCode: 'E0701V00', productDesc: 'Platelets' },
      ]);

      component.productSearchControl.setValue('platelet');

      expect(component['filteredProductOptions']().length).toBe(1);
      expect(component['filteredProductOptions']()[0].productCode).toBe('E0701V00');
    });

    it('should show all product options when search is cleared', () => {
      const opts = [{ productCode: 'E0385V00' }, { productCode: 'E0701V00' }];
      component['productOptions'].set(opts);

      component.productSearchControl.setValue('0385');
      component.productSearchControl.setValue('');

      expect(component['filteredProductOptions']().length).toBe(2);
    });
  });

  // --- productCode valueChanges ---

  describe('productCode valueChanges', () => {
    it('should populate dates when product code is selected', () => {
      component['unitProducts'].set(mockProducts);

      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      expect(component.collectionDate()).toBe('10-JAN-2025');
      expect(component.expirationDate()).toBe('11-JAN-2025  13:17');
    });

    it('should not update dates when product code is empty', () => {
      component.collectionDate.set('OLD-DATE');
      component['unitProducts'].set(mockProducts);

      component.unitEntryForm.get('productCode')?.setValue('');

      expect(component.collectionDate()).toBe('OLD-DATE');
    });

    it('should not update dates when product is not found in unitProducts', () => {
      component['unitProducts'].set(mockProducts);

      component.unitEntryForm.get('productCode')?.setValue('NONEXISTENT');

      expect(component.collectionDate()).toBe('');
    });
  });

  // --- getBatchDate / getCreatedBy ---

  describe('batch display helpers', () => {
    beforeEach(() => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
    });

    it('should return formatted batch date', () => {
      expect(component.getBatchDate()).toBe('10-JAN-2025');
    });

    it('should return createdBy', () => {
      expect(component.getCreatedBy()).toBe('LM1234');
    });

    it('should return "-" for batch date when no batch selected', () => {
      component.selectedBatch.set(null);
      expect(component.getBatchDate()).toBe('-');
    });

    it('should return "-" for createdBy when no batch selected', () => {
      component.selectedBatch.set(null);
      expect(component.getCreatedBy()).toBe('-');
    });

    it('should return "-" for createdBy when createUser is empty', () => {
      component.selectedBatch.set({ ...mockBatches[0], createUser: '' });
      expect(component.getCreatedBy()).toBe('-');
    });
  });

  // --- onBatchFieldBlur ---

  describe('onBatchFieldBlur', () => {
    it('should not call API when no batch is selected', () => {
      component.selectedBatch.set(null);

      component.onBatchFieldBlur();

      expect(mockApiService.updateBatch).not.toHaveBeenCalled();
    });

    it('should not call API when nothing changed', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onBatchFieldBlur();

      expect(mockApiService.updateBatch).not.toHaveBeenCalled();
    });

    it('should call updateBatch when temperature changes', () => {
      mockApiService.updateBatch.and.returnValue(of(makeSuccessResponse()));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.batchForm.get('temperature')?.setValue(5);
      component.onBatchFieldBlur();

      expect(mockApiService.updateBatch).toHaveBeenCalledWith('WHH0000149', {
        checkoutTemp: 5,
        batchName: 'Awaiting further examination.',
      });
    });

    it('should call updateBatch when remarks changes', () => {
      mockApiService.updateBatch.and.returnValue(of(makeSuccessResponse()));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.batchForm.get('remarks')?.setValue('Updated remarks');
      component.onBatchFieldBlur();

      expect(mockApiService.updateBatch).toHaveBeenCalledWith('WHH0000149', {
        checkoutTemp: -20,
        batchName: 'Updated remarks',
      });
    });

    it('should update selectedBatch on success', () => {
      mockApiService.updateBatch.and.returnValue(of(makeSuccessResponse()));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.batchForm.get('temperature')?.setValue(10);
      component.onBatchFieldBlur();

      expect(component.selectedBatch()?.checkoutTemp).toBe(10);
    });

    it('should show error snackbar on update failure', () => {
      mockApiService.updateBatch.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.batchForm.get('temperature')?.setValue(5);
      component.onBatchFieldBlur();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Update failed');
    });

    it('should show generic error message when no error message provided', () => {
      mockApiService.updateBatch.and.returnValue(throwError(() => ({})));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.batchForm.get('temperature')?.setValue(5);
      component.onBatchFieldBlur();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update batch.');
    });

    it('should detect remarks change from null batchName', () => {
      mockApiService.updateBatch.and.returnValue(of(makeSuccessResponse()));
      component.selectedBatch.set({ ...mockBatches[0], batchName: null });

      component.batchForm.patchValue({ remarks: 'New remark' }, { emitEvent: false });
      component.onBatchFieldBlur();

      expect(mockApiService.updateBatch).toHaveBeenCalled();
    });
  });

  // --- onRetrieve ---

  describe('onRetrieve', () => {
    it('should load batch by ID and populate units', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      mockApiService.getBatchById.calls.reset();

      component.onRetrieve();

      expect(mockApiService.getBatchById).toHaveBeenCalledWith('WHH0000149');
      expect(component.batchRetrieved()).toBe(true);
      expect(component.loading()).toBe(false);
      expect(component.units().length).toBe(1);
      expect(component.units()[0].product).toBe('E0701V00');
    });

    it('should populate form fields from retrieved batch', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onRetrieve();

      expect(component.batchForm.get('sendTo')?.value).toBe('BCT');
      expect(component.batchForm.get('temperature')?.value).toBe(-20);
    });

    it('should reset page index on retrieve', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 10, previousPageIndex: 1 });
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(component['currentPageIndex']()).toBe(0);
    });

    it('should do nothing when no batchId is set', () => {
      mockApiService.getBatchById.calls.reset();

      component.onRetrieve();

      expect(mockApiService.getBatchById).not.toHaveBeenCalled();
    });

    it('should show error snackbar on retrieve failure', () => {
      mockApiService.getBatchById.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(component.loading()).toBe(false);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Not found');
    });

    it('should show generic error message on retrieve failure without message', () => {
      mockApiService.getBatchById.and.returnValue(throwError(() => ({})));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to retrieve batch details.');
    });

    it('should set warehouse label without name when fromWarehouseName is empty', () => {
      const batchNoName = { ...mockBatches[0], fromWarehouseName: '' };
      mockApiService.getBatchById.and.returnValue(of(batchNoName));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(component['resolvedWarehouseLabel']()).toBe('H');
    });

    it('should handle batch with no products', () => {
      const batchNoProducts = { ...mockBatches[0], products: undefined };
      mockApiService.getBatchById.and.returnValue(of(batchNoProducts));
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(component.units()).toEqual([]);
      expect(component.totalUnits()).toBe(0);
    });

    it('should set loading to true while retrieving', () => {
      let loadingDuringCall = false;
      mockApiService.getBatchById.and.callFake(() => {
        loadingDuringCall = component.loading();
        return of(mockBatches[0]);
      });
      component.batchForm.get('batchId')?.setValue('WHH0000149');

      component.onRetrieve();

      expect(loadingDuringCall).toBe(true);
      expect(component.loading()).toBe(false);
    });
  });

  // --- onClearAll ---

  describe('onClearAll', () => {
    it('should reset batch form and state', () => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.batchRetrieved.set(true);
      component.units.set(mockUnits);
      component.totalUnits.set(mockUnits.length);

      component.onClearAll();

      expect(component.batchForm.get('batchId')?.value).toBeFalsy();
      expect(component.selectedBatch()).toBeNull();
      expect(component.batchRetrieved()).toBe(false);
      expect(component.units()).toEqual([]);
      expect(component.totalUnits()).toBe(0);
    });

    it('should reset page index', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 10, previousPageIndex: 2 });
      component.onClearAll();

      expect(component['currentPageIndex']()).toBe(0);
    });
  });

  // --- onAddNewBatch ---

  describe('onAddNewBatch', () => {
    it('should show error when sendTo is not selected', () => {
      component.onAddNewBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a "Send To" warehouse.');
      expect(mockApiService.createBatch).not.toHaveBeenCalled();
    });

    it('should create batch and reload on success', () => {
      mockApiService.createBatch.and.returnValue(of(makeSuccessResponse([{ batchId: 'WHH0000152' }])));
      component.batchForm.get('sendTo')?.setValue('BCT');
      component.batchForm.get('temperature')?.setValue(-20);
      component.batchForm.get('remarks')?.setValue('Test remarks');

      component.onAddNewBatch();

      expect(mockApiService.createBatch).toHaveBeenCalledWith({
        toWarehouse: 'BCT',
        checkoutTemp: -20,
        batchName: 'Test remarks',
      });
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Batch WHH0000152 created.');
      expect(mockApiService.getBatches).toHaveBeenCalled();
    });

    it('should pass null checkoutTemp and batchName when not provided', () => {
      mockApiService.createBatch.and.returnValue(of(makeSuccessResponse([{ batchId: 'WHH0000153' }])));
      component.batchForm.get('sendTo')?.setValue('BCT');

      component.onAddNewBatch();

      expect(mockApiService.createBatch).toHaveBeenCalledWith({
        toWarehouse: 'BCT',
        checkoutTemp: null,
        batchName: null,
      });
    });

    it('should show error snackbar on create failure', () => {
      mockApiService.createBatch.and.returnValue(throwError(() => ({ error: { message: 'Duplicate batch' } })));
      component.batchForm.get('sendTo')?.setValue('BCT');

      component.onAddNewBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Duplicate batch');
    });

    it('should show generic error on create failure without message', () => {
      mockApiService.createBatch.and.returnValue(throwError(() => ({})));
      component.batchForm.get('sendTo')?.setValue('BCT');

      component.onAddNewBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to create batch.');
    });

    it('should call onRetrieve after batch creation', () => {
      mockApiService.createBatch.and.returnValue(of(makeSuccessResponse([{ batchId: 'WHH0000152' }])));
      mockApiService.getBatchById.calls.reset();
      component.batchForm.get('sendTo')?.setValue('BCT');

      component.onAddNewBatch();

      expect(component.batchForm.get('batchId')?.value).toBe('WHH0000152');
      expect(mockApiService.getBatchById).toHaveBeenCalledWith('WHH0000152');
    });
  });

  // --- onPostValidate ---

  describe('onPostValidate', () => {
    it('should load unit products and set options', () => {
      const confirmSpy = jasmine.createSpy('confirm');

      component.onPostValidate({
        data: { parsedUnitId: 'W1234-18-031310-Z' } as any,
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      });

      expect(mockApiService.lookupUnit).toHaveBeenCalledWith('W1234-18-031310-Z');
      expect(component['productOptions']().length).toBe(2);
      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should auto-select product when only one product exists', () => {
      const singleProduct = [mockProducts[0]];
      mockApiService.lookupUnit.and.returnValue(of(singleProduct));

      component.onPostValidate({
        data: { parsedUnitId: 'W1234-18-031310-Z' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      });

      expect(component.unitEntryForm.get('productCode')?.value).toBe('E0385V00');
      expect(component.collectionDate()).toBe('10-JAN-2025');
      expect(component.expirationDate()).toBe('11-JAN-2025  13:17');
    });

    it('should reject and clear dependent fields on error', () => {
      mockApiService.lookupUnit.and.returnValue(throwError(() => new Error('not found')));
      const rejectSpy = jasmine.createSpy('reject');

      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025  13:17');
      component['productOptions'].set([{ productCode: 'E0385V00' }]);
      component['filteredProductOptions'].set([{ productCode: 'E0385V00' }]);
      component['unitProducts'].set(mockProducts);

      component.onPostValidate({
        data: { parsedUnitId: 'INVALID' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy,
      });

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found or invalid.');
      expect(component['parsedUnitId']()).toBeNull();
      expect(component.collectionDate()).toBe('');
      expect(component.expirationDate()).toBe('');
      expect(component['productOptions']()).toEqual([]);
      expect(component['filteredProductOptions']()).toEqual([]);
      expect(component['unitProducts']()).toEqual([]);
    });

    it('should not call unitIdField.clear() on lookup error', () => {
      mockApiService.lookupUnit.and.returnValue(throwError(() => ({ error: { message: 'Unit not available' } })));
      const mockUnitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') };
      component.unitIdField = mockUnitIdField as any;

      component.onPostValidate({
        data: { parsedUnitId: 'INVALID' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      });

      expect(mockUnitIdField.clear).not.toHaveBeenCalled();
    });

    it('should use error message from response when available', () => {
      mockApiService.lookupUnit.and.returnValue(throwError(() => ({ error: { message: 'Custom error msg' } })));
      const rejectSpy = jasmine.createSpy('reject');

      component.onPostValidate({
        data: { parsedUnitId: 'INVALID' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy,
      });

      expect(rejectSpy).toHaveBeenCalledWith('Custom error msg');
    });

    it('should clear date and product fields before loading', () => {
      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025');

      component.onPostValidate({
        data: { parsedUnitId: 'NEW-UNIT' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      });

      expect(component['parsedUnitId']()).toBe('NEW-UNIT');
    });

    it('should not call lookupUnit when parsedUnitId is empty', () => {
      mockApiService.lookupUnit.calls.reset();

      component.onPostValidate({
        data: { parsedUnitId: '' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      });

      expect(mockApiService.lookupUnit).not.toHaveBeenCalled();
    });

    it('should not call lookupUnit when parsedUnitId is null', () => {
      mockApiService.lookupUnit.calls.reset();

      component.onPostValidate({
        data: { parsedUnitId: null } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      });

      expect(mockApiService.lookupUnit).not.toHaveBeenCalled();
    });
  });

  // --- onAddProduct ---

  describe('onAddProduct', () => {
    it('should not call addUnitToBatch when no unitId', () => {
      component['parsedUnitId'].set(null);
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(mockApiService.addProduct).not.toHaveBeenCalled();
    });

    it('should not call addUnitToBatch when no productCode', () => {
      component['parsedUnitId'].set('W1234');

      component.onAddProduct();

      expect(mockApiService.addProduct).not.toHaveBeenCalled();
    });
  });

  // --- addUnitToBatch (triggered via onAddProduct) ---

  describe('addUnitToBatch', () => {
    beforeEach(() => {
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component['parsedUnitId'].set('W1234-18-031310-Z');
      component['unitProducts'].set(mockProducts);
      mockApiService.addProduct.and.returnValue(of(makeSuccessResponse()));
    });

    it('should call addProduct when productCode is selected with valid unitId', () => {
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');
      component.onAddProduct();

      expect(mockApiService.addProduct).toHaveBeenCalledWith('WHH0000149', {
        unitId: 'W1234-18-031310-Z',
        productCode: 'E0385V00',
      });
    });

    it('should prepend new row to units list on success', () => {
      component.units.set([...mockUnits]);
      component.totalUnits.set(mockUnits.length);
      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025  13:17');

      component.unitEntryForm.get('productCode')?.setValue('E0385V00');
      component.onAddProduct();

      expect(component.units()[0].unitId).toBe('W1234-18-031310-Z');
      expect(component.totalUnits()).toBe(mockUnits.length + 1);
    });

    it('should not add row when response.success is false', () => {
      mockApiService.addProduct.and.returnValue(of(makeFailureResponse('Product already in batch')));
      component.units.set([]);
      component.totalUnits.set(0);

      component.unitEntryForm.get('productCode')?.setValue('E0385V00');
      component.onAddProduct();

      expect(component.units().length).toBe(0);
      expect(component.totalUnits()).toBe(0);
    });

    it('should not call API when no batchId', () => {
      component.batchForm.get('batchId')?.setValue('');
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(mockApiService.addProduct).not.toHaveBeenCalled();
    });

    it('should prevent duplicate calls via addingUnit guard', () => {
      component['addingUnit'] = true;
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(mockApiService.addProduct).not.toHaveBeenCalled();
    });

    it('should show error snackbar on add failure', () => {
      mockApiService.addProduct.and.returnValue(throwError(() => ({ error: { message: 'Unit locked' } })));
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit locked');
      expect(component['addingUnit']).toBe(false);
    });

    it('should show generic error on add failure without message', () => {
      mockApiService.addProduct.and.returnValue(throwError(() => ({})));
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to add product to batch.');
    });

    it('should use dash for missing collection or expiration date', () => {
      component['unitProducts'].set([]);
      component.collectionDate.set('');
      component.expirationDate.set('');
      component.units.set([]);
      component.totalUnits.set(0);

      component.unitEntryForm.get('productCode')?.setValue('E0385V00');
      component.onAddProduct();

      expect(component.units()[0].collectionDate).toBe('-');
      expect(component.units()[0].expirationDate).toBe('-');
    });

    it('should reset addingUnit flag after error', () => {
      mockApiService.addProduct.and.returnValue(throwError(() => new Error('fail')));
      component.unitEntryForm.get('productCode')?.setValue('E0385V00');

      component.onAddProduct();

      expect(component['addingUnit']).toBe(false);
    });

    it('should capture dates before API call and include them in new row', () => {
      component['unitProducts'].set([]);
      component.collectionDate.set('15-FEB-2025');
      component.expirationDate.set('20-FEB-2025  08:00');
      component.units.set([]);
      component.totalUnits.set(0);

      component['addUnitToBatch']('U-DIRECT', 'P-DIRECT');

      expect(mockApiService.addProduct).toHaveBeenCalledWith('WHH0000149', {
        unitId: 'U-DIRECT',
        productCode: 'P-DIRECT',
      });
      expect(component.units()[0].collectionDate).toBe('15-FEB-2025');
      expect(component.units()[0].expirationDate).toBe('20-FEB-2025  08:00');
    });

    it('should handle null form control for batchId gracefully', () => {
      spyOn(component.batchForm, 'get').and.returnValue(null);

      component['addUnitToBatch']('U1', 'P1');

      expect(mockApiService.addProduct).not.toHaveBeenCalled();
    });
  });

  // --- clearUnitFields ---

  describe('clearUnitFields', () => {
    it('should reset all unit entry fields', () => {
      component['parsedUnitId'].set('W1234-18-031310-Z');
      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025  13:17');

      component.clearUnitFields();

      expect(component['parsedUnitId']()).toBeNull();
      expect(component.collectionDate()).toBe('');
      expect(component.expirationDate()).toBe('');
      expect(component['productOptions']()).toEqual([]);
      expect(component['unitProducts']()).toEqual([]);
    });

    it('should call unitIdField.clear() when unitIdField is available', () => {
      const mockUnitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') };
      component.unitIdField = mockUnitIdField as any;

      component.clearUnitFields();

      expect(mockUnitIdField.clear).toHaveBeenCalled();
    });

    it('should not throw when unitIdField is not available', () => {
      (component as any).unitIdField = undefined;

      expect(() => component.clearUnitFields()).not.toThrow();
    });
  });

  // --- clearUnitFieldsAndRefocus ---

  describe('clearUnitFieldsAndRefocus', () => {
    it('should clear fields and refocus unit ID field', fakeAsync(() => {
      const mockUnitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') };
      component.unitIdField = mockUnitIdField as any;

      component['clearUnitFieldsAndRefocus']();
      tick();

      expect(mockUnitIdField.clear).toHaveBeenCalled();
      expect(mockUnitIdField.focus).toHaveBeenCalled();
    }));

    it('should not throw when unitIdField is unavailable during refocus', fakeAsync(() => {
      (component as any).unitIdField = undefined;

      expect(() => {
        component['clearUnitFieldsAndRefocus']();
        tick();
      }).not.toThrow();
    }));
  });

  // --- onUnitIdCleared ---

  describe('onUnitIdCleared', () => {
    it('should clear unit fields', () => {
      component['parsedUnitId'].set('W1234');
      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025  13:17');
      component['productOptions'].set([{ productCode: 'E0385V00' }]);
      component['unitProducts'].set(mockProducts);

      component.onUnitIdCleared();

      expect(component['parsedUnitId']()).toBeNull();
      expect(component.collectionDate()).toBe('');
      expect(component.expirationDate()).toBe('');
      expect(component['productOptions']()).toEqual([]);
      expect(component['unitProducts']()).toEqual([]);
    });
  });

  // --- onCloseBatch ---

  describe('onCloseBatch', () => {
    it('should not open dialog when no batchId', () => {
      component.batchForm.get('batchId')?.setValue('');

      component.onCloseBatch();

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog with correct data', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(dialogRef);

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockDialog.open).toHaveBeenCalled();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data as ConfirmActionDialogData;
      expect(dialogData.title).toBe('Close the transfer batch?');
      expect(dialogData.confirmText).toBe('YES, CLOSE');
      expect(dialogData.cancelText).toBe('NO, GO BACK');
    });

    it('should commit batch when user confirms', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(of(makeSuccessResponse()));

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockApiService.commitBatch).toHaveBeenCalledWith('WHH0000149');
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Transfer batch closed.');
      expect(component.isClosingBatch()).toBe(false);
    });

    it('should not commit when user cancels dialog', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      mockDialog.open.and.returnValue(dialogRef);

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockApiService.commitBatch).not.toHaveBeenCalled();
    });
  });

  // --- executeCommit ---

  describe('executeCommit', () => {
    it('should show error when commit returns success=false', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(of(makeFailureResponse('Batch has no products')));

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Batch has no products');
      expect(component.isClosingBatch()).toBe(false);
    });

    it('should show generic error when commit returns success=false without message', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(of({ success: false, message: '', statusCode: 400, data: [], errorResponse: { errorCode: '', error: '' } }));

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to close batch.');
    });

    it('should show error snackbar on commit error', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
      expect(component.isClosingBatch()).toBe(false);
    });

    it('should show generic error on commit error without message', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(throwError(() => ({})));

      component.batchForm.get('batchId')?.setValue('WHH0000149');
      component.onCloseBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to close batch.');
    });

    it('should clear all and reload batches on successful commit', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      mockDialog.open.and.returnValue(dialogRef);
      mockApiService.commitBatch.and.returnValue(of(makeSuccessResponse()));

      component.batchRetrieved.set(true);
      component.batchForm.get('batchId')?.setValue('WHH0000149');
      mockApiService.getBatches.calls.reset();

      component.onCloseBatch();

      expect(component.batchRetrieved()).toBe(false);
      expect(mockApiService.getBatches).toHaveBeenCalled();
    });
  });

  // --- Table Events ---

  describe('onSortChange', () => {
    it('should update sort column and direction', () => {
      component.onSortChange({ column: 'product', direction: 'A' });

      expect(component['sortColumn']()).toBe('product');
      expect(component['sortDirection']()).toBe('A');
    });

    it('should reset page index on sort change', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 10, previousPageIndex: 2 });
      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component['currentPageIndex']()).toBe(0);
    });
  });

  describe('onPageChange', () => {
    it('should update page index and page size', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, previousPageIndex: 1 });

      expect(component['currentPageIndex']()).toBe(2);
      expect(component['currentPageSize']()).toBe(25);
    });
  });

  // --- tableData computed ---

  describe('tableData', () => {
    beforeEach(() => {
      component.units.set([...mockUnits]);
    });

    it('should return paginated data', () => {
      component['currentPageSize'].set(1);
      component['currentPageIndex'].set(0);

      expect(component.tableData().length).toBe(1);
    });

    it('should handle second page', () => {
      component['currentPageSize'].set(1);
      component['currentPageIndex'].set(1);

      const data = component.tableData();
      expect(data.length).toBe(1);
    });

    it('should sort by string column ascending', () => {
      component['sortColumn'].set('product');
      component['sortDirection'].set('A');

      const data = component.tableData();
      expect(data[0].product).toBe('E0701V00');
      expect(data[1].product).toBe('E0701V01');
    });

    it('should sort by string column descending', () => {
      component['sortColumn'].set('product');
      component['sortDirection'].set('D');

      const data = component.tableData();
      expect(data[0].product).toBe('E0701V01');
      expect(data[1].product).toBe('E0701V00');
    });

    it('should sort by date column', () => {
      component.units.set([
        { unitId: 'U1', collectionDate: '10-JAN-2025', product: 'P1', expirationDate: '12-JAN-2025  10:00' },
        { unitId: 'U2', collectionDate: '09-JAN-2025', product: 'P2', expirationDate: '11-JAN-2025  10:00' },
      ]);
      component['sortColumn'].set('expirationDate');
      component['sortDirection'].set('A');

      const data = component.tableData();
      expect(data[0].unitId).toBe('U2');
      expect(data[1].unitId).toBe('U1');
    });

    it('should sort by collectionDate column', () => {
      component.units.set([
        { unitId: 'U1', collectionDate: '11-JAN-2025', product: 'P1', expirationDate: '12-JAN-2025  10:00' },
        { unitId: 'U2', collectionDate: '09-JAN-2025', product: 'P2', expirationDate: '11-JAN-2025  10:00' },
      ]);
      component['sortColumn'].set('collectionDate');
      component['sortDirection'].set('A');

      const data = component.tableData();
      expect(data[0].unitId).toBe('U2');
    });

    it('should handle invalid dates in date sorting', () => {
      component.units.set([
        { unitId: 'U1', collectionDate: 'INVALID', product: 'P1', expirationDate: '-' },
        { unitId: 'U2', collectionDate: '09-JAN-2025', product: 'P2', expirationDate: '11-JAN-2025  10:00' },
      ]);
      component['sortColumn'].set('collectionDate');
      component['sortDirection'].set('A');

      expect(() => component.tableData()).not.toThrow();
    });

    it('should not sort when direction is default', () => {
      component['sortDirection'].set('default');
      const units = [...mockUnits];
      component.units.set(units);

      const data = component.tableData();
      expect(data[0].unitId).toBe(units[0].unitId);
    });

    it('should handle empty values in string sort', () => {
      component.units.set([
        { unitId: '', collectionDate: '', product: 'P1', expirationDate: '' },
        { unitId: 'U2', collectionDate: '09-JAN-2025', product: 'P2', expirationDate: '11-JAN-2025  10:00' },
      ]);
      component['sortColumn'].set('unitId');
      component['sortDirection'].set('A');

      expect(() => component.tableData()).not.toThrow();
    });
  });

  // --- tableConfig computed ---

  describe('tableConfig', () => {
    it('should define 4 columns', () => {
      const config = component.tableConfig();
      expect(config.columns.length).toBe(4);
      expect(config.columns.map((c) => c.key)).toEqual(['unitId', 'collectionDate', 'product', 'expirationDate']);
    });

    it('should show empty message before retrieval', () => {
      component.batchRetrieved.set(false);

      const config = component.tableConfig();
      expect(config.emptyMessage).toBe('No Results to Display');
      expect(config.emptySubMessage).toBe('Enter details to begin.');
      expect(config.showTableOnEmpty).toBe(false);
    });

    it('should show table on empty when batch is retrieved', () => {
      component.batchRetrieved.set(true);

      const config = component.tableConfig();
      expect(config.showTableOnEmpty).toBe(true);
      expect(config.emptyMessage).toBe('');
    });

    it('should include pagination config', () => {
      const config = component.tableConfig();
      expect(config.showPagination).toBe(true);
      expect(config.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should include sort config', () => {
      component['sortColumn'].set('product');
      component['sortDirection'].set('A');

      const config = component.tableConfig();
      expect(config.sortConfig?.column).toBe('product');
      expect(config.sortConfig?.direction).toBe('A');
    });

    it('should include unit count in header', () => {
      component.totalUnits.set(5);

      const config = component.tableConfig();
      expect(config.columns[0].header).toBe('Unit ID (5)');
    });
  });

  // --- formatDateTime ---

  describe('formatDateTime', () => {
    it('should format valid ISO date', () => {
      expect(component.formatDateTime('2025-01-11T13:17:00')).toBe('11-JAN-2025  13:17');
    });

    it('should return "-" for null', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });

    it('should return raw string for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });

    it('should return "-" for empty string', () => {
      expect(component.formatDateTime('')).toBe('-');
    });
  });

  // --- Template rendering ---

  describe('unit entry card rendering', () => {
    it('should render date values when batch is retrieved and dates are set', () => {
      component.batchRetrieved.set(true);
      component.collectionDate.set('10-JAN-2025');
      component.expirationDate.set('11-JAN-2025  13:16');
      fixture.detectChanges();

      const el = (fixture.nativeElement as HTMLElement);
      const readonlyValues = el.querySelectorAll('.filter-card--white .readonly-value');
      const texts = Array.from(readonlyValues).map((v) => v.textContent?.trim());
      expect(texts).toContain('10-JAN-2025');
      expect(texts).toContain('11-JAN-2025  13:16');
    });

    it('should render dash when dates are empty', () => {
      component.batchRetrieved.set(true);
      component.collectionDate.set('');
      component.expirationDate.set('');
      fixture.detectChanges();

      const el = (fixture.nativeElement as HTMLElement);
      const readonlyValues = el.querySelectorAll('.filter-card--white .readonly-value');
      const texts = Array.from(readonlyValues).map((v) => v.textContent?.trim());
      expect(texts).toContain('-');
    });

    it('should show press enter hint when expiration date is set', () => {
      component.batchRetrieved.set(true);
      component.expirationDate.set('11-JAN-2025  13:16');
      fixture.detectChanges();

      const el = (fixture.nativeElement as HTMLElement);
      const hint = el.querySelector('.field-hint--success');
      expect(hint?.textContent?.trim()).toBe('Press Enter to save');
    });

    it('should not show press enter hint when expiration date is empty', () => {
      component.batchRetrieved.set(true);
      component.expirationDate.set('');
      fixture.detectChanges();

      const el = (fixture.nativeElement as HTMLElement);
      const hint = el.querySelector('.field-hint--success');
      expect(hint).toBeNull();
    });
  });

  // --- pageHeaderConfig ---

  describe('pageHeaderConfig', () => {
    it('should have primary color for the action button', () => {
      expect(component.pageHeaderConfig.actions?.[0].color).toBe('primary');
    });

    it('should have ADD NEW BATCH action', () => {
      expect(component.pageHeaderConfig.actions?.[0].label).toBe('ADD NEW BATCH');
    });

    it('should call onAddNewBatch from action onClick', () => {
      const spy = spyOn(component, 'onAddNewBatch');
      component.pageHeaderConfig.actions?.[0].onClick?.();

      expect(spy).toHaveBeenCalled();
    });
  });
});
