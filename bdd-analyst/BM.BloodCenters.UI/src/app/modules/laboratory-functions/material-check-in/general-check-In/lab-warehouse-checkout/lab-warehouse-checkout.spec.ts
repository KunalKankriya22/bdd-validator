import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { LabWarehouseCheckoutComponent } from './lab-warehouse-checkout';
import { LabWarehouseCheckoutApiService } from './services/lab-warehouse-checkout-api.service';
import { CloseBatchDialogComponent } from './close-batch-dialog/close-batch-dialog';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChangeChapterWarehouseService } from '../../../../system-administration/change-chapter/services/change-chapter-warehouse.service';
import { createMockHeaderService, createMockMatDialog, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  BatchIdLovDto,
  ReturnResult,
  LabWarehouseCheckoutDto,
  ValidProductDto,
  LabWarehouseCheckoutUnit,
  ValidateUnitResponseDto,
  ValidateProductResponseDto
} from './models/lab-warehouse-checkout.model';

describe('LabWarehouseCheckoutComponent', () => {
  let component: LabWarehouseCheckoutComponent;
  let fixture: ComponentFixture<LabWarehouseCheckoutComponent>;
  let apiService: jasmine.SpyObj<LabWarehouseCheckoutApiService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;
  let headerServiceSpy: any;
  let changeChapterServiceSpy: any;

  const mockCheckoutData: LabWarehouseCheckoutDto[] = [
    {
      batchId: 'BATCH001',
      unitId: '1234567',
      productCode: 'E009X00',
      receiveWarehouse: 'B',
      chapterId: 'CHAP01',
      collectionDate: '2025-01-11T00:00:00',
      productDescription: 'Red Blood Cells [AS54]'
    },
    {
      batchId: 'BATCH001',
      unitId: '7654321',
      productCode: 'E009X00',
      receiveWarehouse: 'B',
      chapterId: 'CHAP01',
      collectionDate: '2025-01-12T00:00:00',
      productDescription: 'Fresh Frozen Plasma'
    }
  ];

  const mockApiResponse: ReturnResult<LabWarehouseCheckoutDto> = {
    success: true,
    statusCode: 200,
    message: 'Data retrieved successfully',
    data: mockCheckoutData,
    total: 2
  };

  const mockValidProducts: ValidProductDto[] = [
    { productCode: 'E009X00', productDescription: 'Red Blood Cells [AS54]', aliquot: '00' },
    { productCode: 'FFPXXXVA', productDescription: 'Fresh Frozen Plasma', aliquot: 'VA' }
  ];

  const mockBatchIdLov: BatchIdLovDto[] = [
    {
      batchId: 'BATCH001',
      batchName: 'Test Batch',
      toWarehouse: 'WH002',
      toWarehouseName: 'Warehouse 2',
      checkoutTemp: 4,
      createDate: '2025-01-10T08:00:00',
      createUser: 'testuser'
    }
  ];

  beforeEach(() => {
    apiService = jasmine.createSpyObj('LabWarehouseCheckoutApiService', [
      'getCheckoutRecords',
      'createCheckout',
      'deleteCheckout',
      'getValidProducts',
      'getBatchIdLov',
      'closeBatch',
      'validateUnit',
      'validateProduct'
    ]);
    dialog = createMockMatDialog();
    snackBar = createMockMatSnackBar();

    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });

    headerServiceSpy = createMockHeaderService();

    changeChapterServiceSpy = jasmine.createSpyObj('ChangeChapterWarehouseService', ['getWarehousesByChapter']);

    TestBed.configureTestingModule({
      imports: [
        LabWarehouseCheckoutComponent,
        ReactiveFormsModule,
        MatDialogModule,
        MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LabWarehouseCheckoutApiService, useValue: apiService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChangeChapterWarehouseService, useValue: changeChapterServiceSpy },
      ]
    });
  
    chapterChanged$ = new Subject<void>();
    changeChapterServiceSpy.getWarehousesByChapter.and.returnValue(of([]));

    // Set default return values
    apiService.getValidProducts.and.returnValue(of([]));
    apiService.getBatchIdLov.and.returnValue(of([]));
    apiService.getCheckoutRecords.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: [],
      total: 0
    }));
    apiService.createCheckout.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: [mockCheckoutData[0]]
    }));
    apiService.deleteCheckout.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Success',
      data: [true]
    }));
    apiService.closeBatch.and.returnValue(of({
      success: true,
      statusCode: 200,
      message: 'Batch closed',
      data: [{}]
    } as ReturnResult<object>));
    apiService.validateUnit.and.returnValue(of({
      status: 'OK',
      hasComponents: false,
      products: [],
      warnings: []
    } as ValidateUnitResponseDto));
    apiService.validateProduct.and.returnValue(of({
      status: 'OK',
      warnings: []
    } as ValidateProductResponseDto));

    fixture = TestBed.createComponent(LabWarehouseCheckoutComponent);
    component = fixture.componentInstance;

    // MatDialog and MatSnackBar are provided by their Angular Material modules inside
    // the standalone component's imports, shadowing the TestBed root-level providers.
    // Direct field override is the only reliable way to inject spies for these.
    (component as any).dialog = dialog;
    (component as any).snackBar = snackBar;
  });

  it('should initialize forms on ngOnInit', () => {
    component.ngOnInit();
    expect(component.filterForm).toBeDefined();
    expect(component.unitEntryForm).toBeDefined();
    expect(component.filterForm.get('batchId')).toBeDefined();
    expect(component.unitEntryForm.get('productCode')).toBeDefined();
  });

  it('should mark sendToWarehouse as required in filter form', () => {
    component.ngOnInit();
    const warehouseControl = component.filterForm.get('sendToWarehouse');
    expect(warehouseControl?.hasError('required')).toBeTruthy();

    warehouseControl?.setValue('WH002');
    expect(warehouseControl?.hasError('required')).toBeFalsy();
  });

  it('should mark checkoutTemp as required in filter form', () => {
    component.ngOnInit();
    const tempControl = component.filterForm.get('checkoutTemp');
    expect(tempControl?.hasError('required')).toBeTruthy();

    tempControl?.setValue(4);
    expect(tempControl?.hasError('required')).toBeFalsy();
  });

  it('should validate checkoutTemp pattern', () => {
    component.ngOnInit();
    const tempControl = component.filterForm.get('checkoutTemp');
    tempControl?.setValue('abc');
    expect(tempControl?.hasError('pattern')).toBeTruthy();

    tempControl?.setValue(4.00);
    expect(tempControl?.hasError('pattern')).toBeFalsy();
  });

  it('should mark send to warehouse as required in filter form', () => {
    component.ngOnInit();
    const warehouseControl = component.filterForm.get('sendToWarehouse');
    expect(warehouseControl?.hasError('required')).toBeTruthy();

    warehouseControl?.setValue('B');
    expect(warehouseControl?.hasError('required')).toBeFalsy();
  });

  it('should load batch ID LOV on ngOnInit', () => {
    apiService.getBatchIdLov.and.returnValue(of(mockBatchIdLov));
    component.ngOnInit();

    expect(apiService.getBatchIdLov).toHaveBeenCalled();
    expect(component.batchIdLov().length).toBe(1);
    expect(component.filteredBatchIds().length).toBe(1);
  });

  it('should load product options when unit ID is validated via postValidate', () => {
    component.ngOnInit();
    apiService.validateUnit.and.returnValue(of({
      status: 'OK',
      hasComponents: true,
      products: mockValidProducts,
      warnings: []
    } as ValidateUnitResponseDto));

    const mockEvent = {
      data: { parsedUnitId: '1234567' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };
    component.onPostValidate(mockEvent as any);

    expect(apiService.validateUnit).toHaveBeenCalledWith({ unitId: '1234567', overrides: [] });
    expect(component.productOptions().length).toBe(2);
    expect(component.filteredProductOptions().length).toBe(2);
  });


  it('should set isWholeUnit when no products returned for unit', () => {
    component.ngOnInit();
    apiService.validateUnit.and.returnValue(of({
      status: 'OK',
      hasComponents: false,
      products: [],
      warnings: []
    } as ValidateUnitResponseDto));

    const mockEvent = {
      data: { parsedUnitId: '1234567' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };
    component.onPostValidate(mockEvent as any);

    expect(component.isWholeUnit()).toBeTruthy();
    expect(mockEvent.confirm).toHaveBeenCalled();
  });

  it('should retrieve batch units when RETRIEVE button clicked', () => {
    component.ngOnInit();
    apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.onRetrieve();

    expect(apiService.getCheckoutRecords).toHaveBeenCalled();
    expect(component.units().length).toBe(2);
    expect(component.batchRetrieved()).toBeTruthy();

    const firstUnit = component.units()[0];
    expect(firstUnit.collectionDate).toBe('11-JAN-2025');
    expect(firstUnit.productDescription).toBe('Red Blood Cells [AS54]');
  });



  it('should add unit to batch when form is valid', fakeAsync(() => {
    component.ngOnInit();
    const createResponse: ReturnResult<LabWarehouseCheckoutDto> = {
      success: true,
      statusCode: 200,
      message: 'Unit added successfully',
      data: [mockCheckoutData[0]]
    };

    apiService.createCheckout.and.returnValue(of(createResponse));
    apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.filterForm.get('sendToWarehouse')?.setValue('B');
    component.currentUnitId.set('1234567');
    component.unitEntryForm.get('productCode')?.enable();
    component.unitEntryForm.get('productCode')?.setValue('E009X00');

    component.onAddUnit();
    tick();

    expect(apiService.createCheckout).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Unit added to batch successfully',
      'Close',
      jasmine.objectContaining({
        panelClass: ['success-snackbar']
      })
    );
  }));



  it('should populate batch form fields when batch selected from LOV', () => {
    component.ngOnInit();
    component.batchIdLov.set(mockBatchIdLov);

    component.onBatchIdSelected('BATCH001');

    expect(component.filterForm.get('sendToWarehouse')?.value).toBe('WH002');
    expect(component.filterForm.get('checkoutTemp')?.value).toBe(4);
    expect(component.batchDate()).toBe('10-JAN-2025');
    expect(component.batchCreatedBy()).toBe('testuser');
  });

  it('should show confirmation dialog when deleting unit', () => {
    component.ngOnInit();
    const mockUnit: LabWarehouseCheckoutUnit = {
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    };

    const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
    dialog.open.and.returnValue(dialogRefSpy);

    component.onDeleteUnit(mockUnit);

    expect(dialog.open).toHaveBeenCalledWith(
      CloseBatchDialogComponent,
      jasmine.objectContaining({
        width: '400px',
        data: jasmine.objectContaining({
          title: 'Confirm Delete'
        })
      })
    );
  });

  it('should delete unit when confirmed', fakeAsync(() => {
    component.ngOnInit();
    const mockUnit: LabWarehouseCheckoutUnit = {
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    };

    const deleteResponse: ReturnResult<boolean> = {
      success: true,
      statusCode: 200,
      message: 'Deleted successfully',
      data: [true]
    };

    const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
    dialog.open.and.returnValue(dialogRefSpy);
    apiService.deleteCheckout.and.returnValue(of(deleteResponse));
    apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

    component.onDeleteUnit(mockUnit);
    tick();

    expect(apiService.deleteCheckout).toHaveBeenCalledWith('BATCH001', '1234567', 'E009X00');
  }));

  it('should handle error when delete API fails', fakeAsync(() => {
    component.ngOnInit();
    const mockUnit: LabWarehouseCheckoutUnit = {
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    };

    const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
    dialog.open.and.returnValue(dialogRefSpy);
    apiService.deleteCheckout.and.returnValue(throwError(() => new Error('Delete failed')));

    component.onDeleteUnit(mockUnit);
    tick();

    // Auth interceptor handles error display
    expect(component.isLoading()).toBeFalsy();
  }));




  it('should call closeBatch API when close batch confirmed', fakeAsync(() => {
    component.ngOnInit();
    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.units.set([{
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    }]);

    const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
    dialog.open.and.returnValue(dialogRefSpy);

    component.onCloseBatch();
    tick();

    expect(apiService.closeBatch).toHaveBeenCalledWith('BATCH001');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Batch BATCH001 closed. Checkout slip has been generated.',
      'Close',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  }));

  it('should clear all fields when CLEAR ALL clicked', () => {
    component.ngOnInit();
    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.units.set([{
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    }]);

    component.clearAll();

    expect(component.filterForm.get('batchId')?.value).toBeNull();
    expect(component.units().length).toBe(0);
    expect(component.batchRetrieved()).toBeFalsy();
  });



  it('should handle API error when retrieving batch', fakeAsync(() => {
    component.ngOnInit();
    apiService.getCheckoutRecords.and.returnValue(throwError(() => new Error('API Error')));

    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.onRetrieve();
    tick();

    // Auth interceptor handles error display
    expect(component.isRetrieving()).toBeFalsy();
    expect(component.units().length).toBe(0);
  }));

  it('should handle API error when adding unit', fakeAsync(() => {
    component.ngOnInit();
    apiService.createCheckout.and.returnValue(throwError(() => ({ status: 400, error: { errorResponse: { message: 'Duplicate entry' } } })));

    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.filterForm.get('sendToWarehouse')?.setValue('B');
    component.currentUnitId.set('1234567');
    component.unitEntryForm.get('productCode')?.enable();
    component.unitEntryForm.get('productCode')?.setValue('E009X00');

    component.onAddUnit();
    tick();

    // Auth interceptor handles error display
    expect(component.isAddingUnit()).toBeFalsy();
  }));

  it('should have all required accessibility attributes', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const buttons = compiled.querySelectorAll('button[aria-label]');
    expect(buttons.length).toBeGreaterThan(0);

    const inputs = compiled.querySelectorAll('input[aria-label]');
    expect(inputs.length).toBeGreaterThan(0);

    const selects = compiled.querySelectorAll('mat-select[aria-label]');
    expect(selects.length).toBeGreaterThan(0);

    const requiredFields = compiled.querySelectorAll('[required]');
    expect(requiredFields.length).toBeGreaterThan(0);
  });

  it('should compute hasUnits correctly', () => {
    expect(component.hasUnits()).toBeFalsy();

    component.units.set([{
      sequence: 1,
      unitId: '1234567',
      collectionDate: '11-JAN-2025',
      productCode: 'E009X00',
      productDescription: 'Red Blood Cells [AS54]',
      batchId: 'BATCH001'
    }]);

    expect(component.hasUnits()).toBeTruthy();
  });

  it('should return correct error message for required field', () => {
    component.ngOnInit();
    const msg = component.getErrorMessage(component.filterForm, 'sendToWarehouse');
    expect(msg).toBe('Send to Warehouse is required');
  });

  it('should return correct error message for pattern field', () => {
    component.ngOnInit();
    component.filterForm.get('checkoutTemp')?.setValue('abc');
    component.filterForm.get('checkoutTemp')?.markAsTouched();
    const msg = component.getErrorMessage(component.filterForm, 'checkoutTemp');
    expect(msg).toBe('Temperature is not a valid number (e.g. 4.00)');
  });

  it('should filter batch IDs by search term', () => {
    component.ngOnInit();
    component.batchIdLov.set(mockBatchIdLov);
    component.filteredBatchIds.set(mockBatchIdLov);

    component.batchSearchControl.setValue('BATCH001');

    expect(component.filteredBatchIds().length).toBe(1);
  });

  it('should reset unit entry state after successful add', fakeAsync(() => {
    component.ngOnInit();
    apiService.createCheckout.and.returnValue(of({
      success: true, statusCode: 200, message: 'Success', data: [mockCheckoutData[0]]
    }));
    apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

    component.filterForm.get('batchId')?.setValue('BATCH001');
    component.filterForm.get('sendToWarehouse')?.setValue('B');
    component.currentUnitId.set('1234567');
    component.unitEntryForm.get('productCode')?.enable();
    component.unitEntryForm.get('productCode')?.setValue('E009X00');

    component.onAddUnit();
    tick();

    expect(component.currentUnitId()).toBeNull();
    expect(component.productOptions().length).toBe(0);
    expect(component.filteredProductOptions().length).toBe(0);
    expect(component.productSearchControl.value).toBe('');
  }));

  describe('Product Search', () => {
    it('should initialize filteredProductOptions as empty', () => {
      expect(component.filteredProductOptions().length).toBe(0);
    });

    it('should populate filteredProductOptions when products are loaded', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        hasComponents: true,
        products: mockValidProducts,
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onPostValidate(mockEvent as any);

      expect(component.filteredProductOptions().length).toBe(2);
    });



    it('should show all products when search term is cleared', () => {
      component.ngOnInit();
      component.productOptions.set(mockValidProducts);
      component.filteredProductOptions.set(mockValidProducts);
      component.productSearchControl.setValue('E009');

      component.productSearchControl.setValue('');

      expect(component.filteredProductOptions().length).toBe(2);
    });

  });

  describe('Product Validation', () => {
    it('should validate product with collDate', fakeAsync(() => {
      component.ngOnInit();
      const mockProduct: ValidProductDto = {
        productCode: 'E0701VA0',
        productDescription: 'Test Product',
        aliquot: 'A0'
      };

      component.unitValidation.set({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: true,
        products: [mockProduct],
        warnings: []
      });
      component.currentUnitId.set('W123425070650');

      apiService.validateProduct.and.returnValue(of({
        status: 'OK',
        warnings: []
      } as ValidateProductResponseDto));

      component.onProductSelected(mockProduct);
      tick();

      expect(apiService.validateProduct).toHaveBeenCalledWith({
        unitId: 'W123425070650',
        productCode: 'E0701VA0',
        collDate: '2025-09-19',
        overrides: []
      });
    }));

    it('should format collDate as YYYY-MM-DD for API', fakeAsync(() => {
      component.ngOnInit();
      const mockProduct: ValidProductDto = {
        productCode: 'E0701VA0',
        productDescription: 'Test Product',
        aliquot: 'A0'
      };

      component.unitValidation.set({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: true,
        products: [mockProduct],
        warnings: []
      });
      component.currentUnitId.set('W123425070650');

      apiService.validateProduct.and.returnValue(of({
        status: 'OK',
        warnings: []
      } as ValidateProductResponseDto));

      component.onProductSelected(mockProduct);
      tick();

      const call = apiService.validateProduct.calls.mostRecent();
      expect(call.args[0].collDate).toBe('2025-09-19');
    }));

    it('should handle product validation ERROR status', fakeAsync(() => {
      component.ngOnInit();
      const mockProduct: ValidProductDto = {
        productCode: 'E0701VA0',
        productDescription: 'Test Product',
        aliquot: 'A0'
      };

      component.unitValidation.set({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: true,
        products: [mockProduct],
        warnings: []
      });
      component.currentUnitId.set('W123425070650');

      apiService.validateProduct.and.returnValue(of({
        status: 'ERROR',
        warnings: [{ code: '0244', message: 'All components already in transit' }]
      } as ValidateProductResponseDto));

      component.onProductSelected(mockProduct);
      tick();

      // Should set loading to false and not proceed
      expect(component.isLoading()).toBeFalsy();
    }));
  });

  describe('Unit Validation - hasComponents scenarios', () => {
    it('should reject unit when hasComponents=true but products.length=0 (ERROR 0244)', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: true,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: 'W123425070650' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(mockEvent.reject).toHaveBeenCalledWith('All components already in transit or not in this warehouse');
    });

    it('should show product dropdown when hasComponents=true and products.length>0', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: true,
        products: mockValidProducts,
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: 'W123425070650' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(component.isWholeUnit()).toBeFalsy();
      expect(component.productOptions().length).toBe(2);
      expect(component.unitEntryForm.get('productCode')?.enabled).toBeTruthy();
    });

    it('should set whole-unit mode when hasComponents=false', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        collDate: '2025-09-19T00:00:00',
        hasComponents: false,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: 'W123425070650' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(component.isWholeUnit()).toBeTruthy();
      expect(component.productOptions().length).toBe(0);
      expect(component.unitEntryForm.get('productCode')?.disabled).toBeTruthy();
    });
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnInit();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── isRetrieveDisabled getter ────────────────────────────────────────────────

  describe('isRetrieveDisabled', () => {
    it('should return true when filterForm is not initialized', () => {
      // filterForm is undefined before ngOnInit
      (component as any).filterForm = undefined as any;
      expect(component.isRetrieveDisabled).toBeTruthy();
    });

    it('should return true when sendToWarehouse is invalid', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('');
      component.filterForm.get('checkoutTemp')?.setValue(4);
      expect(component.isRetrieveDisabled).toBeTruthy();
    });

    it('should return true when checkoutTemp is invalid', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      component.filterForm.get('checkoutTemp')?.setValue(null);
      expect(component.isRetrieveDisabled).toBeTruthy();
    });

    it('should return true when isRetrieving is true', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      component.filterForm.get('checkoutTemp')?.setValue(4);
      component.isRetrieving.set(true);
      expect(component.isRetrieveDisabled).toBeTruthy();
    });

    it('should return false when form is valid and not retrieving', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      component.filterForm.get('checkoutTemp')?.setValue(4);
      component.isRetrieving.set(false);
      expect(component.isRetrieveDisabled).toBeFalsy();
    });
  });

  // ── isClearAllDisabled getter ────────────────────────────────────────────────

  describe('isClearAllDisabled', () => {
    it('should return true when filterForm is not initialized', () => {
      (component as any).filterForm = undefined as any;
      expect(component.isClearAllDisabled).toBeTruthy();
    });

    it('should return true when all fields are empty', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');
      component.filterForm.get('sendToWarehouse')?.setValue('');
      component.filterForm.get('checkoutTemp')?.setValue(null);
      component.filterForm.get('remarks')?.setValue('');
      expect(component.isClearAllDisabled).toBeTruthy();
    });

    it('should return false when batchId has a value', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      expect(component.isClearAllDisabled).toBeFalsy();
    });

    it('should return false when sendToWarehouse has a value', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      expect(component.isClearAllDisabled).toBeFalsy();
    });

    it('should return false when checkoutTemp has a value', () => {
      component.ngOnInit();
      component.filterForm.get('checkoutTemp')?.setValue(4);
      expect(component.isClearAllDisabled).toBeFalsy();
    });

    it('should return false when remarks has a value', () => {
      component.ngOnInit();
      component.filterForm.get('remarks')?.setValue('Some remark');
      expect(component.isClearAllDisabled).toBeFalsy();
    });

    it('should return true when checkoutTemp is empty string', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');
      component.filterForm.get('sendToWarehouse')?.setValue('');
      component.filterForm.get('checkoutTemp')?.setValue('');
      component.filterForm.get('remarks')?.setValue('');
      expect(component.isClearAllDisabled).toBeTruthy();
    });
  });

  // ── Computed signals ─────────────────────────────────────────────────────────

  describe('computed signals', () => {
    it('showProductDropdown should be true when not whole unit and products exist', () => {
      component.isWholeUnit.set(false);
      component.productOptions.set(mockValidProducts);
      expect(component.showProductDropdown()).toBeTruthy();
    });

    it('showProductDropdown should be false when whole unit', () => {
      component.isWholeUnit.set(true);
      component.productOptions.set(mockValidProducts);
      expect(component.showProductDropdown()).toBeFalsy();
    });

    it('showProductDropdown should be false when no products', () => {
      component.isWholeUnit.set(false);
      component.productOptions.set([]);
      expect(component.showProductDropdown()).toBeFalsy();
    });

    it('isExistingBatch should return true when batchId has value', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      expect(component.isExistingBatch()).toBeTruthy();
    });

    it('isExistingBatch should return false when batchId is empty', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');
      expect(component.isExistingBatch()).toBeFalsy();
    });
  });

  // ── subscribeToSendToWarehouse ───────────────────────────────────────────────

  describe('subscribeToSendToWarehouse', () => {
    it('should set sendToWarehouseLabel when warehouse selected', () => {
      component.ngOnInit();
      component.warehouses.set([
        { warehouseId: 'WH002', warehouseName: 'Warehouse 2' }
      ]);

      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      expect(component.sendToWarehouseLabel()).toBe('WH002 - Warehouse 2');
    });

    it('should clear sendToWarehouseLabel when warehouse cleared', () => {
      component.ngOnInit();
      component.warehouses.set([
        { warehouseId: 'WH002', warehouseName: 'Warehouse 2' }
      ]);

      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      expect(component.sendToWarehouseLabel()).toBe('WH002 - Warehouse 2');

      component.filterForm.get('sendToWarehouse')?.setValue('');
      expect(component.sendToWarehouseLabel()).toBeNull();
    });

    it('should use warehouseId as label when warehouse not found in LOV', () => {
      component.ngOnInit();
      component.warehouses.set([]);

      component.filterForm.get('sendToWarehouse')?.setValue('UNKNOWN_WH');
      expect(component.sendToWarehouseLabel()).toBe('UNKNOWN_WH');
    });
  });

  // ── loadWarehouses ───────────────────────────────────────────────────────────

  describe('loadWarehouses', () => {
    it('should load warehouses excluding current warehouse', () => {
      const warehouseData = [
        { warehouseId: 'WH01', warehouseName: 'Current Warehouse' },
        { warehouseId: 'WH02', warehouseName: 'Other Warehouse' },
        { warehouseId: 'WH03', warehouseName: 'Third Warehouse' }
      ];
      changeChapterServiceSpy.getWarehousesByChapter.and.returnValue(of(warehouseData));

      component.ngOnInit();

      // WH01 is the current warehouse from mock header service
      expect(component.warehouses().length).toBe(2);
      expect(component.warehouses().find(w => w.warehouseId === 'WH01')).toBeUndefined();
      expect(component.filteredWarehouses().length).toBe(2);
    });

    it('should handle error when loading warehouses', () => {
      changeChapterServiceSpy.getWarehousesByChapter.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.ngOnInit();

      // Should not crash; warehouses remain empty
      expect(component.warehouses().length).toBe(0);
    });
  });

  // ── loadBatchIdLov error ─────────────────────────────────────────────────────

  describe('loadBatchIdLov', () => {
    it('should handle error when loading batch IDs', () => {
      apiService.getBatchIdLov.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.ngOnInit();

      // Should not crash
      expect(component.batchIdLov().length).toBe(0);
    });
  });

  // ── subscribeToChapterChange ─────────────────────────────────────────────────

  describe('subscribeToChapterChange', () => {
    it('should reload warehouses and batch IDs and clear all on chapter change', () => {
      const chapterChangedSubject = new Subject<void>();
      headerServiceSpy.chapterChanged$ = chapterChangedSubject.asObservable();

      changeChapterServiceSpy.getWarehousesByChapter.and.returnValue(of([]));
      apiService.getBatchIdLov.and.returnValue(of([]));

      component.ngOnInit();

      // Set some state that should be cleared
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'BATCH001'
      }]);

      // Trigger chapter change
      chapterChangedSubject.next();

      expect(component.filterForm.get('batchId')?.value).toBeNull();
      expect(component.units().length).toBe(0);
      // loadWarehouses and loadBatchIdLov are called during ngOnInit + once more on chapter change
      expect(changeChapterServiceSpy.getWarehousesByChapter.calls.count()).toBe(2);
      expect(apiService.getBatchIdLov.calls.count()).toBe(2);
    });
  });

  // ── onBatchIdSelected edge cases ────────────────────────────────────────────

  describe('onBatchIdSelected edge cases', () => {
    it('should do nothing when batch not found in LOV', () => {
      component.ngOnInit();
      component.batchIdLov.set(mockBatchIdLov);

      component.onBatchIdSelected('NONEXISTENT');

      // Form values should remain as initialized
      expect(component.filterForm.get('sendToWarehouse')?.value).toBe('');
    });

    it('should set empty batchDate when createDate is falsy', () => {
      component.ngOnInit();
      const batchNoDate: BatchIdLovDto[] = [{
        batchId: 'BATCH002',
        batchName: 'No Date Batch',
        toWarehouse: 'WH003',
        toWarehouseName: 'Warehouse 3',
        checkoutTemp: 5,
        createDate: '',
        createUser: 'user2'
      }];
      component.batchIdLov.set(batchNoDate);

      component.onBatchIdSelected('BATCH002');

      expect(component.batchDate()).toBe('');
      expect(component.batchCreatedBy()).toBe('user2');
      expect(component.filterForm.get('sendToWarehouse')?.value).toBe('WH003');
      expect(component.filterForm.get('checkoutTemp')?.value).toBe(5);
      expect(component.filterForm.get('remarks')?.value).toBe('No Date Batch');
    });

    it('should set empty batchCreatedBy when createUser is falsy', () => {
      component.ngOnInit();
      const batchNoUser: BatchIdLovDto[] = [{
        batchId: 'BATCH003',
        batchName: '',
        toWarehouse: 'WH004',
        toWarehouseName: 'Warehouse 4',
        checkoutTemp: null,
        createDate: '2025-03-15T10:00:00',
        createUser: ''
      }];
      component.batchIdLov.set(batchNoUser);

      component.onBatchIdSelected('BATCH003');

      expect(component.batchCreatedBy()).toBe('');
      expect(component.filterForm.get('remarks')?.value).toBe('');
    });
  });

  // ── onRetrieve edge cases ────────────────────────────────────────────────────

  describe('onRetrieve edge cases', () => {
    it('should return early when batchId is empty', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');

      component.onRetrieve();

      expect(apiService.getCheckoutRecords).not.toHaveBeenCalled();
    });

    it('should show info message when response is success but no data', () => {
      component.ngOnInit();
      apiService.getCheckoutRecords.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [],
        total: 0
      }));

      component.filterForm.get('batchId')?.setValue('BATCH_EMPTY');
      component.onRetrieve();

      expect(component.units().length).toBe(0);
      expect(snackBar.open).toHaveBeenCalledWith(
        'No units found for this batch',
        'Close',
        jasmine.objectContaining({ panelClass: ['info-snackbar'] })
      );
      expect(component.batchRetrieved()).toBeTruthy();
    });

    it('should not show info message when response is not successful', () => {
      component.ngOnInit();
      apiService.getCheckoutRecords.and.returnValue(of({
        success: false,
        statusCode: 400,
        message: 'Error',
        data: [],
        total: 0
      }));

      component.filterForm.get('batchId')?.setValue('BATCH_ERR');
      component.onRetrieve();

      expect(component.units().length).toBe(0);
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('should handle response data with missing productDescription', () => {
      component.ngOnInit();
      apiService.getCheckoutRecords.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [{
          batchId: 'B1', unitId: 'U1', productCode: 'PC1',
          chapterId: 'CH1', collectionDate: null as any
        }],
        total: 1
      }));

      component.filterForm.get('batchId')?.setValue('B1');
      component.onRetrieve();

      expect(component.units().length).toBe(1);
      expect(component.units()[0].productDescription).toBe('');
      expect(component.units()[0].collectionDate).toBe('');
    });
  });

  // ── onAddUnit edge cases ─────────────────────────────────────────────────────

  describe('onAddUnit edge cases', () => {
    it('should return early when batchId is empty', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');
      component.currentUnitId.set('1234567');

      component.onAddUnit();

      expect(apiService.createCheckout).not.toHaveBeenCalled();
    });

    it('should return early when unitId is null', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.currentUnitId.set(null);

      component.onAddUnit();

      expect(apiService.createCheckout).not.toHaveBeenCalled();
    });

    it('should return early when not whole unit and no product selected', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.currentUnitId.set('1234567');
      component.isWholeUnit.set(false);
      component.unitEntryForm.get('productCode')?.setValue(null);

      component.onAddUnit();

      expect(apiService.createCheckout).not.toHaveBeenCalled();
    });

    it('should send undefined productCode for whole-unit checkout', fakeAsync(() => {
      component.ngOnInit();
      apiService.createCheckout.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success', data: [mockCheckoutData[0]]
      }));
      apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.currentUnitId.set('1234567');
      component.isWholeUnit.set(true);

      component.onAddUnit();
      tick();

      const createArg = apiService.createCheckout.calls.mostRecent().args[0];
      expect(createArg.productCode).toBeUndefined();
      expect(createArg.unitId).toBe('1234567');
      expect(createArg.batchId).toBe('BATCH001');
    }));

    it('should send selectedProduct productCode for component checkout', fakeAsync(() => {
      component.ngOnInit();
      apiService.createCheckout.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success', data: [mockCheckoutData[0]]
      }));
      apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.currentUnitId.set('1234567');
      component.isWholeUnit.set(false);
      component.selectedProduct.set(mockValidProducts[0]);
      component.unitEntryForm.get('productCode')?.enable();
      component.unitEntryForm.get('productCode')?.setValue('E009X00');

      component.onAddUnit();
      tick();

      const createArg = apiService.createCheckout.calls.mostRecent().args[0];
      expect(createArg.productCode).toBe('E009X00');
    }));

    it('should not show success snackbar when response.success is false', fakeAsync(() => {
      component.ngOnInit();
      apiService.createCheckout.and.returnValue(of({
        success: false, statusCode: 400, message: 'Failed', data: []
      }));

      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.currentUnitId.set('1234567');
      component.isWholeUnit.set(true);

      component.onAddUnit();
      tick();

      expect(snackBar.open).not.toHaveBeenCalled();
      expect(component.isAddingUnit()).toBeFalsy();
    }));
  });

  // ── onCloseBatch edge cases ──────────────────────────────────────────────────

  describe('onCloseBatch edge cases', () => {
    it('should return early when batchId is empty', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('');
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'B1'
      }]);

      component.onCloseBatch();

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should return early when no units', () => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.units.set([]);

      component.onCloseBatch();

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should not close batch when dialog canceled', fakeAsync(() => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'BATCH001'
      }]);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
      dialog.open.and.returnValue(dialogRefSpy);

      component.onCloseBatch();
      tick();

      expect(apiService.closeBatch).not.toHaveBeenCalled();
    }));

    it('should handle closeBatch API error', fakeAsync(() => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'BATCH001'
      }]);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialog.open.and.returnValue(dialogRefSpy);
      apiService.closeBatch.and.returnValue(throwError(() => new Error('Close failed')));

      component.onCloseBatch();
      tick();

      expect(component.isClosingBatch()).toBeFalsy();
    }));

    it('should not show success when closeBatch response.success is false', fakeAsync(() => {
      component.ngOnInit();
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'BATCH001'
      }]);

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialog.open.and.returnValue(dialogRefSpy);
      apiService.closeBatch.and.returnValue(of({
        success: false, statusCode: 500, message: 'Error', data: [{}]
      } as ReturnResult<object>));

      component.onCloseBatch();
      tick();

      expect(snackBar.open).not.toHaveBeenCalled();
      expect(component.isClosingBatch()).toBeFalsy();
    }));
  });

  // ── onDeleteUnit edge cases ─────────────────────────────────────────────────

  describe('onDeleteUnit edge cases', () => {
    it('should not call deleteCheckout when dialog canceled', fakeAsync(() => {
      component.ngOnInit();
      const mockUnit: LabWarehouseCheckoutUnit = {
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'B1'
      };

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
      dialog.open.and.returnValue(dialogRefSpy);

      component.onDeleteUnit(mockUnit);
      tick();

      expect(apiService.deleteCheckout).not.toHaveBeenCalled();
    }));

    it('should show success snackbar after successful delete', fakeAsync(() => {
      component.ngOnInit();
      const mockUnit: LabWarehouseCheckoutUnit = {
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'B1'
      };

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialog.open.and.returnValue(dialogRefSpy);
      apiService.deleteCheckout.and.returnValue(of({
        success: true, statusCode: 200, message: 'Deleted', data: [true]
      }));
      apiService.getCheckoutRecords.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success', data: [], total: 0
      }));

      component.onDeleteUnit(mockUnit);
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Unit removed from batch', 'Close',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));
  });

  // ── onPostValidate edge cases ───────────────────────────────────────────────

  describe('onPostValidate edge cases', () => {
    it('should return early when isLoading is true', () => {
      component.ngOnInit();
      component.isLoading.set(true);

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(apiService.validateUnit).not.toHaveBeenCalled();
    });

    it('should reject with error message on unit validation ERROR status', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'ERROR',
        hasComponents: false,
        products: [],
        warnings: [{ code: '0001', message: 'Unit not found' }]
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit not found');
      expect(mockEvent.confirm).not.toHaveBeenCalled();
    });

    it('should reject with default message when ERROR has no warnings', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'ERROR',
        hasComponents: false,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
    });

    it('should show warning dialog on WARNING status and retry with overrides on override', fakeAsync(() => {
      component.ngOnInit();
      const warnings = [{ code: 'W001', message: 'Temp mismatch' }];

      // First call returns WARNING, second call returns OK
      apiService.validateUnit.and.returnValues(
        of({
          status: 'WARNING',
          hasComponents: false,
          products: [],
          warnings
        } as ValidateUnitResponseDto),
        of({
          status: 'OK',
          hasComponents: false,
          products: [],
          warnings: []
        } as ValidateUnitResponseDto)
      );

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['W001'] }));
      dialog.open.and.returnValue(dialogRefSpy);

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);
      tick();

      // Should open the warning dialog
      expect(dialog.open).toHaveBeenCalled();
      // unitOverrides should be updated
      expect(component.unitOverrides()).toContain('W001');
      // validateUnit should be called a second time with overrides
      expect(apiService.validateUnit.calls.count()).toBe(2);
    }));

    it('should reject when user cancels warning dialog', fakeAsync(() => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'WARNING',
        hasComponents: false,
        products: [],
        warnings: [{ code: 'W001', message: 'Temp mismatch' }]
      } as ValidateUnitResponseDto));

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      dialog.open.and.returnValue(dialogRefSpy);

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Validation canceled');
    }));

    it('should reject on API error with error message', fakeAsync(() => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);
      tick();

      expect(component.isLoading()).toBeFalsy();
      expect(mockEvent.reject).toHaveBeenCalledWith('Server error');
    }));

    it('should reject with default message when API error has no message', fakeAsync(() => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(
        throwError(() => ({}))
      );

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should set collectionDate from response collDate', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        collDate: '2025-06-15T00:00:00',
        hasComponents: false,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(component.collectionDate()).toBe('15-JUN-2025');
    });

    it('should set collectionDate to null when collDate is empty', () => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        collDate: '',
        hasComponents: false,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      expect(component.collectionDate()).toBeNull();
    });

    it('should reset product state before validating', () => {
      component.ngOnInit();
      // Pre-set product state
      component.productOptions.set(mockValidProducts);
      component.filteredProductOptions.set(mockValidProducts);
      component.selectedProduct.set(mockValidProducts[0]);

      apiService.validateUnit.and.returnValue(of({
        status: 'OK',
        hasComponents: false,
        products: [],
        warnings: []
      } as ValidateUnitResponseDto));

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);

      // Product state should be reset before validation response handled
      expect(component.selectedProduct()).toBeNull();
    });
  });

  // ── onProductSelected edge cases ────────────────────────────────────────────

  describe('onProductSelected edge cases', () => {
    it('should return early when product is null', () => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');

      component.onProductSelected(null);

      expect(apiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should return early when product has no productCode', () => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');

      component.onProductSelected({ productCode: '', productDescription: 'Test', aliquot: '' });

      expect(apiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should return early when currentUnitId is null', () => {
      component.ngOnInit();
      component.currentUnitId.set(null);

      component.onProductSelected(mockValidProducts[0]);

      expect(apiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should handle product validation API error', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.unitValidation.set({
        status: 'OK', collDate: '2025-01-10T00:00:00',
        hasComponents: true, products: mockValidProducts, warnings: []
      });

      apiService.validateProduct.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.onProductSelected(mockValidProducts[0]);
      tick();

      expect(component.isLoading()).toBeFalsy();
    }));

    it('should send empty collDate when unitValidation has no collDate', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.unitValidation.set({
        status: 'OK', collDate: '',
        hasComponents: true, products: mockValidProducts, warnings: []
      });

      apiService.validateProduct.and.returnValue(of({
        status: 'OK', warnings: []
      } as ValidateProductResponseDto));

      component.onProductSelected(mockValidProducts[0]);
      tick();

      const call = apiService.validateProduct.calls.mostRecent();
      expect(call.args[0].collDate).toBe('');
    }));

    it('should send empty collDate when unitValidation is null', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.unitValidation.set(null);

      apiService.validateProduct.and.returnValue(of({
        status: 'OK', warnings: []
      } as ValidateProductResponseDto));

      component.onProductSelected(mockValidProducts[0]);
      tick();

      const call = apiService.validateProduct.calls.mostRecent();
      expect(call.args[0].collDate).toBe('');
    }));
  });

  // ── handleProductValidationResponse WARNING ─────────────────────────────────

  describe('handleProductValidationResponse WARNING', () => {
    it('should show warning dialog and retry with overrides on override', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.unitValidation.set({
        status: 'OK', collDate: '2025-01-10T00:00:00',
        hasComponents: true, products: mockValidProducts, warnings: []
      });

      const warningResponse: ValidateProductResponseDto = {
        status: 'WARNING',
        warnings: [{ code: 'PW001', message: 'Product temp warning' }]
      };

      // First call returns WARNING, second returns OK
      apiService.validateProduct.and.returnValues(
        of(warningResponse),
        of({ status: 'OK', warnings: [] } as ValidateProductResponseDto)
      );

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['PW001'] }));
      dialog.open.and.returnValue(dialogRefSpy);

      component.onProductSelected(mockValidProducts[0]);
      tick();

      expect(dialog.open).toHaveBeenCalled();
      expect(component.productOverrides()).toContain('PW001');
      // validateProduct called twice: first WARNING, then retry with overrides
      expect(apiService.validateProduct.calls.count()).toBe(2);
    }));

    it('should reset product selection when user cancels warning dialog', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.unitValidation.set({
        status: 'OK', collDate: '2025-01-10T00:00:00',
        hasComponents: true, products: mockValidProducts, warnings: []
      });

      apiService.validateProduct.and.returnValue(of({
        status: 'WARNING',
        warnings: [{ code: 'PW001', message: 'Product temp warning' }]
      } as ValidateProductResponseDto));

      const dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      dialog.open.and.returnValue(dialogRefSpy);

      component.onProductSelected(mockValidProducts[0]);
      tick();

      expect(component.selectedProduct()).toBeNull();
    }));

    it('should set productValidation and call onAddUnit when product validation OK', fakeAsync(() => {
      component.ngOnInit();
      component.currentUnitId.set('1234567');
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.unitValidation.set({
        status: 'OK', collDate: '2025-01-10T00:00:00',
        hasComponents: true, products: mockValidProducts, warnings: []
      });

      const okResponse: ValidateProductResponseDto = {
        status: 'OK', warnings: [], productDescription: 'Test'
      };
      apiService.validateProduct.and.returnValue(of(okResponse));
      apiService.createCheckout.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: [mockCheckoutData[0]]
      }));
      apiService.getCheckoutRecords.and.returnValue(of(mockApiResponse));

      component.onProductSelected(mockValidProducts[0]);
      tick();

      // onAddUnit is called (via handleProductValidationResponse), which resets productValidation
      // so we verify the downstream effect: createCheckout was called
      expect(apiService.createCheckout).toHaveBeenCalled();
      // productCode should have been set on the form before onAddUnit ran
      expect(snackBar.open).toHaveBeenCalledWith(
        'Unit added to batch successfully', 'Close',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));
  });

  // ── showWarningDialog edge cases ────────────────────────────────────────────

  describe('showWarningDialog edge cases', () => {
    it('should call callback with false when dialog returns null result', fakeAsync(() => {
      component.ngOnInit();
      apiService.validateUnit.and.returnValue(of({
        status: 'WARNING',
        hasComponents: false,
        products: [],
        warnings: [{ code: 'W001', message: 'Warning' }]
      } as ValidateUnitResponseDto));

      // Dialog returns null (e.g., backdrop click)
      const dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialog.open.and.returnValue(dialogRefSpy);

      const mockEvent = {
        data: { parsedUnitId: '1234567' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onPostValidate(mockEvent as any);
      tick();

      // null result should trigger callback(false, []) which leads to reject
      expect(mockEvent.reject).toHaveBeenCalledWith('Validation canceled');
    }));
  });

  // ── Search filters ──────────────────────────────────────────────────────────

  describe('search filters', () => {
    it('should filter warehouses by search term', () => {
      component.ngOnInit();
      component.warehouses.set([
        { warehouseId: 'WH01', warehouseName: 'Alpha Warehouse' },
        { warehouseId: 'WH02', warehouseName: 'Beta Warehouse' }
      ]);
      component.filteredWarehouses.set(component.warehouses());

      component.warehouseSearchControl.setValue('Alpha');
      expect(component.filteredWarehouses().length).toBe(1);
      expect(component.filteredWarehouses()[0].warehouseId).toBe('WH01');
    });

    it('should show all warehouses when search term cleared', () => {
      component.ngOnInit();
      component.warehouses.set([
        { warehouseId: 'WH01', warehouseName: 'Alpha Warehouse' },
        { warehouseId: 'WH02', warehouseName: 'Beta Warehouse' }
      ]);
      component.filteredWarehouses.set(component.warehouses());

      component.warehouseSearchControl.setValue('Alpha');
      expect(component.filteredWarehouses().length).toBe(1);

      component.warehouseSearchControl.setValue('');
      expect(component.filteredWarehouses().length).toBe(2);
    });

    it('should filter warehouses by warehouseId', () => {
      component.ngOnInit();
      component.warehouses.set([
        { warehouseId: 'WH01', warehouseName: 'Warehouse One' },
        { warehouseId: 'WH02', warehouseName: 'Warehouse Two' }
      ]);

      component.warehouseSearchControl.setValue('WH02');
      expect(component.filteredWarehouses().length).toBe(1);
      expect(component.filteredWarehouses()[0].warehouseName).toBe('Warehouse Two');
    });

    it('should filter products by productCode', () => {
      component.ngOnInit();
      component.productOptions.set(mockValidProducts);

      component.productSearchControl.setValue('E009');
      expect(component.filteredProductOptions().length).toBe(1);
      expect(component.filteredProductOptions()[0].productCode).toBe('E009X00');
    });

    it('should filter products by productDescription', () => {
      component.ngOnInit();
      component.productOptions.set(mockValidProducts);

      component.productSearchControl.setValue('Plasma');
      expect(component.filteredProductOptions().length).toBe(1);
      expect(component.filteredProductOptions()[0].productCode).toBe('FFPXXXVA');
    });

    it('should filter batch IDs by batchName', () => {
      component.ngOnInit();
      component.batchIdLov.set(mockBatchIdLov);

      component.batchSearchControl.setValue('Test Batch');
      expect(component.filteredBatchIds().length).toBe(1);
    });

    it('should handle null search term', () => {
      component.ngOnInit();
      component.batchIdLov.set(mockBatchIdLov);

      component.batchSearchControl.setValue(null as any);
      expect(component.filteredBatchIds().length).toBe(1);
    });
  });

  // ── Pagination and sorting ──────────────────────────────────────────────────

  describe('pagination and sorting', () => {
    it('should update page index and size on page change', () => {
      component.ngOnInit();
      component.onUnitsPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.unitsPageIndex).toBe(2);
      expect(component.unitsPageSize).toBe(50);
    });

    it('should sort units ascending', () => {
      component.ngOnInit();
      component.units.set([
        { sequence: 2, unitId: 'B', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' },
        { sequence: 1, unitId: 'A', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' }
      ]);

      component.onUnitsSortChange({ column: 'unitId', direction: 'A' });

      expect(component.units()[0].unitId).toBe('A');
      expect(component.units()[1].unitId).toBe('B');
    });

    it('should sort units descending', () => {
      component.ngOnInit();
      component.units.set([
        { sequence: 1, unitId: 'A', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' },
        { sequence: 2, unitId: 'B', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' }
      ]);

      component.onUnitsSortChange({ column: 'unitId', direction: 'D' });

      expect(component.units()[0].unitId).toBe('B');
      expect(component.units()[1].unitId).toBe('A');
    });

    it('should not sort units when direction is default', () => {
      component.ngOnInit();
      component.units.set([
        { sequence: 2, unitId: 'B', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' },
        { sequence: 1, unitId: 'A', collectionDate: '', productCode: '', productDescription: '', batchId: 'B1' }
      ]);

      component.onUnitsSortChange({ column: 'unitId', direction: 'default' });

      // Order should not change
      expect(component.units()[0].unitId).toBe('B');
    });

    it('should handle sort with equal values', () => {
      component.ngOnInit();
      component.units.set([
        { sequence: 1, unitId: 'A', collectionDate: '', productCode: 'P1', productDescription: '', batchId: 'B1' },
        { sequence: 2, unitId: 'A', collectionDate: '', productCode: 'P2', productDescription: '', batchId: 'B1' }
      ]);

      component.onUnitsSortChange({ column: 'unitId', direction: 'A' });

      // Both have unitId 'A', order should remain stable (return 0)
      expect(component.units()[0].sequence).toBe(1);
      expect(component.units()[1].sequence).toBe(2);
    });

    it('should update sort config in table config', () => {
      component.ngOnInit();

      component.onUnitsSortChange({ column: 'sequence', direction: 'D' });

      expect(component.unitsTableConfig.sortConfig).toEqual({
        column: 'sequence',
        direction: 'D'
      });
    });
  });

  // ── getErrorMessage edge cases ──────────────────────────────────────────────

  describe('getErrorMessage edge cases', () => {
    it('should return empty string for non-existent field', () => {
      component.ngOnInit();
      const msg = component.getErrorMessage(component.filterForm, 'nonExistentField');
      expect(msg).toBe('');
    });

    it('should return empty string for field with no errors', () => {
      component.ngOnInit();
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      const msg = component.getErrorMessage(component.filterForm, 'sendToWarehouse');
      expect(msg).toBe('');
    });

    it('should use fieldName as label when not found in labels map', () => {
      component.ngOnInit();
      // Create a form with a custom field that has a required validator
      const { FormGroup: FG, FormControl: FC, Validators: V } = require('@angular/forms');
      const customForm = new FG({ customField: new FC('', V.required) });
      const msg = component.getErrorMessage(customForm, 'customField');
      expect(msg).toBe('customField is required');
    });
  });

  // ── clearAll comprehensive ──────────────────────────────────────────────────

  describe('clearAll comprehensive', () => {
    it('should reset all state including search controls and signals', () => {
      component.ngOnInit();
      // Set up state
      component.filterForm.get('batchId')?.setValue('BATCH001');
      component.filterForm.get('sendToWarehouse')?.setValue('WH002');
      component.filterForm.get('checkoutTemp')?.setValue(4);
      component.filterForm.get('remarks')?.setValue('Some remarks');
      component.batchDate.set('10-JAN-2025');
      component.batchCreatedBy.set('testuser');
      component.sendToWarehouseLabel.set('WH002 - Warehouse 2');
      component.currentUnitId.set('1234567');
      component.collectionDate.set('11-JAN-2025');
      component.isWholeUnit.set(true);
      component.productOptions.set(mockValidProducts);
      component.filteredProductOptions.set(mockValidProducts);
      component.selectedProduct.set(mockValidProducts[0]);
      component.unitValidation.set({ status: 'OK', hasComponents: false, products: [], warnings: [] });
      component.productValidation.set({ status: 'OK', warnings: [] });
      component.unitOverrides.set(['W001']);
      component.productOverrides.set(['PW001']);
      component.units.set([{
        sequence: 1, unitId: '123', collectionDate: '', productCode: 'P1',
        productDescription: '', batchId: 'B1'
      }]);
      component.batchRetrieved.set(true);

      component.clearAll();

      expect(component.filterForm.get('batchId')?.value).toBeNull();
      expect(component.filterForm.get('sendToWarehouse')?.value).toBeNull();
      expect(component.filterForm.get('checkoutTemp')?.value).toBeNull();
      expect(component.filterForm.get('remarks')?.value).toBeNull();
      expect(component.batchDate()).toBe('');
      expect(component.batchCreatedBy()).toBe('');
      expect(component.sendToWarehouseLabel()).toBeNull();
      expect(component.currentUnitId()).toBeNull();
      expect(component.collectionDate()).toBeNull();
      expect(component.isWholeUnit()).toBeFalsy();
      expect(component.productOptions().length).toBe(0);
      expect(component.filteredProductOptions().length).toBe(0);
      expect(component.selectedProduct()).toBeNull();
      expect(component.unitValidation()).toBeNull();
      expect(component.productValidation()).toBeNull();
      expect(component.unitOverrides().length).toBe(0);
      expect(component.productOverrides().length).toBe(0);
      expect(component.units().length).toBe(0);
      expect(component.batchRetrieved()).toBeFalsy();
    });

    it('should reset filteredBatchIds to full batchIdLov', () => {
      component.ngOnInit();
      component.batchIdLov.set(mockBatchIdLov);
      component.filteredBatchIds.set([]);

      component.clearAll();

      expect(component.filteredBatchIds().length).toBe(mockBatchIdLov.length);
    });

    it('should reset filteredWarehouses to full warehouses', () => {
      component.ngOnInit();
      const warehouses = [
        { warehouseId: 'WH01', warehouseName: 'W1' },
        { warehouseId: 'WH02', warehouseName: 'W2' }
      ];
      component.warehouses.set(warehouses);
      component.filteredWarehouses.set([]);

      component.clearAll();

      expect(component.filteredWarehouses().length).toBe(2);
    });
  });

  // ── resetUnitEntry ──────────────────────────────────────────────────────────

  describe('resetUnitEntry (via clearAll)', () => {
    it('should clear unitIdField when available', () => {
      component.ngOnInit();
      component.unitIdField = { clear: jasmine.createSpy('clear') } as any;
      component.currentUnitId.set('123');

      component.clearAll();

      expect(component.unitIdField.clear).toHaveBeenCalled();
    });

    it('should not throw when unitIdField is undefined', () => {
      component.ngOnInit();
      (component as any).unitIdField = undefined;

      expect(() => component.clearAll()).not.toThrow();
    });
  });

  // ── buildUnitsTableConfig ───────────────────────────────────────────────────

  describe('buildUnitsTableConfig', () => {
    it('should set up table columns correctly', () => {
      component.ngOnInit();

      expect(component.unitsTableConfig).toBeDefined();
      expect(component.unitsTableConfig.columns.length).toBe(5);
      expect(component.unitsTableConfig.columns[0].key).toBe('sequence');
      expect(component.unitsTableConfig.columns[1].key).toBe('unitId');
      expect(component.unitsTableConfig.columns[2].key).toBe('collectionDate');
      expect(component.unitsTableConfig.columns[3].key).toBe('productCode');
      expect(component.unitsTableConfig.columns[4].key).toBe('productDescription');
    });

    it('should set default pagination settings', () => {
      component.ngOnInit();

      expect(component.unitsTableConfig.pagination!.pageSize).toBe(25);
      expect(component.unitsTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.unitsTableConfig.stickyHeader).toBeTruthy();
    });

    it('should set empty message for table', () => {
      component.ngOnInit();

      expect(component.unitsTableConfig.emptyMessage).toBe('No units have been added to this batch yet.');
    });
  });
});
