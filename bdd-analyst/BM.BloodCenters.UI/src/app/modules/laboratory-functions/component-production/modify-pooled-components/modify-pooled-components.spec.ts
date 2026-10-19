import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { ModifyPooledComponentsComponent } from './modify-pooled-components';
import { ModifyPooledComponentsService } from './services/modify-pooled-components.service';
import { ModifyPooledComponentsResponse } from './models/modify-pooled-components.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { provideRouter } from '@angular/router';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ModifyPooledComponentsComponent', () => {
  let component: ModifyPooledComponentsComponent;
  let fixture: ComponentFixture<ModifyPooledComponentsComponent>;
  let serviceSpy: jasmine.SpyObj<ModifyPooledComponentsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerService: HeaderService;

  const mockPoolDetails: ModifyPooledComponentsResponse = {
    unitId: 'W6333261234',
    productCode: 'E2940100',
    productDescription: 'Platelet Leuko Filtration',
    processCode: null,
    processDescription: null,
    newBag: null,
    catalogNumber: null,
    bagLotNumber: null,
    filterLotNumber: null,
    reagentName: null,
    manufacturer: null,
    reagentLotNumber: null,
    reagentExpirationDate: null,
    processDate: null,
    newProductCode: null,
    newProductDescription: null,
    poolWeight: null,
    poolVolume: null,
    codeScheme: 'I',
    collDate: new Date().toISOString(),
    poolExpiryDate: null,
    pooledAboRh: null,
    oldProductType: null,
    oldBagId: null,
    specificGravity: null,
    weightRequired: false,
    spTestRequired: false,
    isExpired: false,
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ModifyPooledComponentsService', [
      'getPoolDetails',
      'getProcessCodes',
      'getValidProductConversions',
      'getValidProducts',
      'getValidCatalogNumbers',
      'getValidLotNumbers',
      'getValidFilterLots',
      'getValidAbo',
      'save',
      'deriveProduct',
    ]);
    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();

    serviceSpy.getPoolDetails.and.returnValue(of(mockPoolDetails));
    serviceSpy.getProcessCodes.and.returnValue(of([]));
    serviceSpy.getValidProductConversions.and.returnValue(of([]));
    serviceSpy.getValidProducts.and.returnValue(of([]));
    serviceSpy.getValidCatalogNumbers.and.returnValue(of([]));
    serviceSpy.getValidLotNumbers.and.returnValue(of([]));
    serviceSpy.getValidFilterLots.and.returnValue(of([]));
    serviceSpy.getValidAbo.and.returnValue(of([{ code: 'OPOS', description: 'O POS POOL' }]));
    serviceSpy.deriveProduct.and.returnValue(of(null));



      TestBed.configureTestingModule({
      imports: [ModifyPooledComponentsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatDialogModule],
      providers: [
        provideRouter([]),
        { provide: ModifyPooledComponentsService, useValue: serviceSpy },
        PageHeaderService,
        HeaderService,
      ],
    })
      .overrideComponent(ModifyPooledComponentsComponent, {
        add: {
          providers: [
            { provide: MatSnackBar, useValue: snackBarSpy },
            { provide: MatDialog, useValue: dialogSpy },
          ],
        },
      });




      serviceSpy.getPoolDetails.calls.reset();
      serviceSpy.getProcessCodes.calls.reset();
      serviceSpy.getValidProductConversions.calls.reset();
      serviceSpy.getValidProducts.calls.reset();
      serviceSpy.getValidCatalogNumbers.calls.reset();
      serviceSpy.getValidLotNumbers.calls.reset();
      serviceSpy.getValidFilterLots.calls.reset();
      serviceSpy.getValidAbo.calls.reset();
      serviceSpy.save.calls.reset();
      serviceSpy.deriveProduct.calls.reset();

      serviceSpy.getPoolDetails.and.returnValue(of(mockPoolDetails));
      serviceSpy.getProcessCodes.and.returnValue(of([]));
      serviceSpy.getValidProductConversions.and.returnValue(of([]));
      serviceSpy.getValidProducts.and.returnValue(of([]));
      serviceSpy.getValidCatalogNumbers.and.returnValue(of([]));
      serviceSpy.getValidLotNumbers.and.returnValue(of([]));
      serviceSpy.getValidFilterLots.and.returnValue(of([]));
      serviceSpy.getValidAbo.and.returnValue(of([{ code: 'OPOS', description: 'O POS POOL' }]));
      serviceSpy.deriveProduct.and.returnValue(of(null));

    fixture = TestBed.createComponent(ModifyPooledComponentsComponent);
    component = fixture.componentInstance;
    headerService = TestBed.inject(HeaderService);
    fixture.detectChanges();
    });

  // ── Existing tests ──────────────────────────────────────────────

  it('should call getPoolDetails via postValidate', () => {
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getPoolDetails).toHaveBeenCalledWith('W6333261234');
    expect(mockEvent.confirm).toHaveBeenCalled();
  });

  it('should set pool details on successful postValidate', () => {
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.poolDetails()).toEqual(mockPoolDetails);
    expect(component.hasPoolDetails()).toBeTrue();
  });

  it('should reject postValidate on search error', () => {
    serviceSpy.getPoolDetails.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
    const mockEvent = {
      data: { parsedUnitId: 'INVALID', codeScheme: 'C' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.poolDetails()).toBeNull();
    expect(mockEvent.reject).toHaveBeenCalledWith('Not found');
  });

  function mockUnitIdFieldValid(): void {
    (component as any).unitIdField = { isValid: true, parsedUnitId: 'W6333261234', clear: jasmine.createSpy('clear') };
  }

  it('should call save after label verification succeeds', () => {
    mockUnitIdFieldValid();
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: 'Saved successfully.', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      unitId: 'W6333261234',
      processCode: 'PLT',
      newBag: 'Y',
      newProductCode: 'E2940100',
      processDate,
    });
    fixture.detectChanges();
    component.poolDetails.set(mockPoolDetails);

    component.onSave();

    expect(serviceSpy.save).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Saved successfully.',
      'DISMISS',
      jasmine.objectContaining({
        duration: 5000,
        panelClass: ['success-snackbar'],
      }),
    );
  });

  it('should update isNewBagY when newBag changes', () => {
    component.modifyForm.patchValue({ newBag: 'Y' });
    fixture.detectChanges();

    expect(component.isNewBagY).toBeTrue();

    component.modifyForm.patchValue({ newBag: 'N' });
    fixture.detectChanges();

    expect(component.isNewBagY).toBeFalse();
  });

  // ── Component creation ──────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ── ngOnInit / initializeForm ───────────────────────────────────

  it('should initialize modifyForm with expected controls on ngOnInit', () => {
    expect(component.modifyForm).toBeTruthy();
    const expectedControls = [
      'unitId', 'productCode', 'processCode', 'processDescription',
      'newBag', 'catalogNumber', 'bagLotNumber', 'filterLotNumber',
      'reagentName', 'manufacturer', 'reagentLotNumber', 'reagentExpirationDate',
      'processDate', 'newProductCode', 'newProductDescription', 'poolWeight', 'poolVolume',
    ];
    expectedControls.forEach(ctrl => {
      expect(component.modifyForm.get(ctrl)).toBeTruthy(`Missing control: ${ctrl}`);
    });
  });

  it('should have required validator on processCode', () => {
    const ctrl = component.modifyForm.get('processCode');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
  });

  it('should have required validator on newBag', () => {
    const ctrl = component.modifyForm.get('newBag');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
  });

  it('should have required validator on processDate', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setValue('');
    expect(ctrl?.hasError('required')).toBeTrue();
  });

  it('should have newProductCode disabled initially', () => {
    expect(component.modifyForm.get('newProductCode')?.disabled).toBeTrue();
  });

  it('should have processDescription disabled initially', () => {
    expect(component.modifyForm.get('processDescription')?.disabled).toBeTrue();
  });

  it('should have poolVolume disabled initially', () => {
    expect(component.modifyForm.get('poolVolume')?.disabled).toBeTrue();
  });

  // ── ngOnDestroy ─────────────────────────────────────────────────

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ── onUnitIdValidated ───────────────────────────────────────────

  it('should set poolCodeScheme on onUnitIdValidated', () => {
    component.onUnitIdValidated({ codeScheme: 'C' } as any);
    expect(component.poolCodeScheme()).toBe('C');
  });

  it('should set poolCodeScheme to I for ISBT', () => {
    component.onUnitIdValidated({ codeScheme: 'I' } as any);
    expect(component.poolCodeScheme()).toBe('I');
  });

  // ── onUnitIdCleared ─────────────────────────────────────────────

  it('should reset form on onUnitIdCleared', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    component.searchPerformed.set(true);

    component.onUnitIdCleared();

    expect(component.poolDetails()).toBeNull();
    expect(component.searchPerformed()).toBeFalse();
  });

  // ── onUnitIdPostValidate detailed branches ──────────────────────

  it('should enable newProductCode when codeScheme is C on postValidate success', () => {
    component.poolCodeScheme.set('C');
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'C' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.modifyForm.get('newProductCode')?.enabled).toBeTrue();
  });

  it('should show expiry warning snackbar when details.isExpired is true', () => {
    const expiredDetails = { ...mockPoolDetails, isExpired: true };
    serviceSpy.getPoolDetails.and.returnValue(of(expiredDetails));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Warn:9795: Product has already expired.',
      'DISMISS',
      jasmine.objectContaining({
        duration: 8000,
        panelClass: ['warning-snackbar'],
      }),
    );
  });

  it('should not show expiry warning when isExpired is false', () => {
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should set searchPerformed to true on postValidate', () => {
    component.searchPerformed.set(false);
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.searchPerformed()).toBeTrue();
  });

  it('should use errorResponse.error as fallback reject message', () => {
    serviceSpy.getPoolDetails.and.returnValue(
      throwError(() => ({ error: { errorResponse: { error: 'Custom error' } } })),
    );
    const mockEvent = {
      data: { parsedUnitId: 'INVALID', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(mockEvent.reject).toHaveBeenCalledWith('Custom error');
  });

  it('should use default fallback message when no error details', () => {
    serviceSpy.getPoolDetails.and.returnValue(throwError(() => ({ error: {} })));
    const mockEvent = {
      data: { parsedUnitId: 'INVALID', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(mockEvent.reject).toHaveBeenCalledWith('Pool not found');
  });

  it('should use default fallback when error is null', () => {
    serviceSpy.getPoolDetails.and.returnValue(throwError(() => null));
    const mockEvent = {
      data: { parsedUnitId: 'INVALID', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(mockEvent.reject).toHaveBeenCalledWith('Pool not found');
  });

  // ── loadDropdownsAfterSearch branches ───────────────────────────

  it('should load process codes and conversions when productCode exists', () => {
    const detailsWithProduct = { ...mockPoolDetails, productCode: 'E2940100' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithProduct));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getProcessCodes).toHaveBeenCalledWith('E2940100');
  });

  it('should load lot numbers when catalogNumber exists', () => {
    const detailsWithCatalog = { ...mockPoolDetails, catalogNumber: 'CAT001' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithCatalog));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getValidLotNumbers).toHaveBeenCalledWith('CAT001');
  });

  it('should load filter lots when oldProductType exists', () => {
    const detailsWithType = { ...mockPoolDetails, oldProductType: 'PLT' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithType));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getValidFilterLots).toHaveBeenCalledWith('PLT');
  });

  it('should not load lot numbers when catalogNumber is null', () => {
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getValidLotNumbers).not.toHaveBeenCalled();
  });

  it('should not load filter lots when oldProductType is null', () => {
    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(serviceSpy.getValidFilterLots).not.toHaveBeenCalled();
  });

  // ── loadValidProducts ───────────────────────────────────────────

  it('should patch productCode after valid products load when details have productCode', () => {
    const products = [{ productCode: 'E2940100', productDescription: 'Test' }];
    serviceSpy.getValidProducts.and.returnValue(of(products));
    const detailsWithProduct = { ...mockPoolDetails, productCode: 'E2940100' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithProduct));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.productCodes()).toEqual(products);
    expect(component.modifyForm.get('productCode')?.value).toBe('E2940100');
  });

  it('should set productCodes to empty on loadValidProducts error', () => {
    serviceSpy.getValidProducts.and.returnValue(throwError(() => new Error('fail')));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.productCodes()).toEqual([]);
  });

  // ── loadProcessCodes ────────────────────────────────────────────

  it('should patch processCode after process codes load', () => {
    const codes = [{ code: 'FLT', description: 'Filtration' }];
    serviceSpy.getProcessCodes.and.returnValue(of(codes));
    const detailsWithProcess = { ...mockPoolDetails, processCode: 'FLT' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithProcess));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.processCodes()).toEqual(codes);
  });

  it('should set processCodes to empty on loadProcessCodes error', () => {
    serviceSpy.getProcessCodes.and.returnValue(throwError(() => new Error('fail')));
    const detailsWithProduct = { ...mockPoolDetails, productCode: 'E2940100' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithProduct));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.processCodes()).toEqual([]);
  });

  // ── loadCatalogNumbers ──────────────────────────────────────────

  it('should patch catalogNumber after catalog numbers load', () => {
    const catalogs = [{ catalogNumber: 'CAT001' }];
    serviceSpy.getValidCatalogNumbers.and.returnValue(of(catalogs));
    const detailsWithCatalog = { ...mockPoolDetails, catalogNumber: 'CAT001' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithCatalog));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.catalogNumbers()).toEqual(catalogs);
  });

  it('should set catalogNumbers to empty on error', () => {
    serviceSpy.getValidCatalogNumbers.and.returnValue(throwError(() => new Error('fail')));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.catalogNumbers()).toEqual([]);
  });

  // ── loadLotNumbers ──────────────────────────────────────────────

  it('should patch bagLotNumber after lot numbers load', () => {
    const lots = [{ lotNumber: 'LOT001' }];
    serviceSpy.getValidLotNumbers.and.returnValue(of(lots));
    const detailsWithLot = { ...mockPoolDetails, catalogNumber: 'CAT001', bagLotNumber: 'LOT001' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithLot));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.lotNumbers()).toEqual(lots);
  });

  it('should set lotNumbers to empty on error', () => {
    serviceSpy.getValidLotNumbers.and.returnValue(throwError(() => new Error('fail')));
    const detailsWithCatalog = { ...mockPoolDetails, catalogNumber: 'CAT001' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithCatalog));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.lotNumbers()).toEqual([]);
  });

  // ── loadFilterLots ──────────────────────────────────────────────

  it('should patch filterLotNumber after filter lots load', () => {
    const lots = [{ lotNumber: 'FLT001' }];
    serviceSpy.getValidFilterLots.and.returnValue(of(lots));
    const detailsWithFilter = { ...mockPoolDetails, oldProductType: 'PLT', filterLotNumber: 'FLT001' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithFilter));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.filterLotNumbers()).toEqual(lots);
  });

  it('should set filterLotNumbers to empty on error', () => {
    serviceSpy.getValidFilterLots.and.returnValue(throwError(() => new Error('fail')));
    const detailsWithType = { ...mockPoolDetails, oldProductType: 'PLT' };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithType));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.filterLotNumbers()).toEqual([]);
  });

  // ── loadAboOptions ──────────────────────────────────────────────

  it('should set aboOptions to empty array on getValidAbo error', () => {
    serviceSpy.getValidAbo.and.returnValue(throwError(() => new Error('fail')));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.aboOptions()).toEqual([]);
  });

  // ── onProductCodeChange ─────────────────────────────────────────

  it('should load process codes and reset process fields on product code change', () => {
    component.poolDetails.set({ ...mockPoolDetails, oldProductType: 'PLT' });
    component.modifyForm.patchValue({ productCode: 'E2940200' });

    component.onProductCodeChange();

    expect(serviceSpy.getProcessCodes).toHaveBeenCalledWith('E2940200');
    expect(component.modifyForm.get('processCode')?.value).toBe('');
    expect(component.modifyForm.get('processDescription')?.value).toBe('');
  });

  it('should load filter lots when oldProductType exists on product code change', () => {
    component.poolDetails.set({ ...mockPoolDetails, oldProductType: 'PLT' });
    component.modifyForm.patchValue({ productCode: 'E2940200' });

    component.onProductCodeChange();

    expect(serviceSpy.getValidFilterLots).toHaveBeenCalledWith('PLT');
  });

  it('should not load process codes when productCode is empty', () => {
    component.modifyForm.patchValue({ productCode: '' });
    serviceSpy.getProcessCodes.calls.reset();

    component.onProductCodeChange();

    expect(serviceSpy.getProcessCodes).not.toHaveBeenCalled();
  });

  it('should reset processCodes signal on product code change', () => {
    component.processCodes.set([{ code: 'OLD', description: 'Old code' }]);
    component.poolDetails.set(mockPoolDetails);
    component.modifyForm.patchValue({ productCode: 'E2940200' });

    component.onProductCodeChange();

    expect(component.processCodes()).toEqual([]);
  });

  // ── onProcessCodeChange ─────────────────────────────────────────

  it('should update processDescription when process code is selected', () => {
    component.processCodes.set([
      { code: 'FLT', description: 'Filtration' },
      { code: 'IRR', description: 'Irradiation' },
    ]);
    component.modifyForm.patchValue({ processCode: 'FLT' });

    component.onProcessCodeChange();

    expect(component.modifyForm.getRawValue().processDescription).toBe('Filtration');
  });

  it('should set empty description when selected process has no description', () => {
    component.processCodes.set([{ code: 'FLT', description: null }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });

    component.onProcessCodeChange();

    expect(component.modifyForm.getRawValue().processDescription).toBe('');
  });

  it('should call deriveNewProductCode when codeScheme is I and processCode selected', () => {
    component.poolCodeScheme.set('I');
    component.poolDetails.set(mockPoolDetails);
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });

    component.onProcessCodeChange();

    expect(serviceSpy.deriveProduct).toHaveBeenCalled();
  });

  it('should not call deriveNewProductCode when codeScheme is C', () => {
    component.poolCodeScheme.set('C');
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });
    serviceSpy.deriveProduct.calls.reset();

    component.onProcessCodeChange();

    expect(serviceSpy.deriveProduct).not.toHaveBeenCalled();
  });

  it('should not call deriveNewProductCode when processCode is empty', () => {
    component.poolCodeScheme.set('I');
    component.modifyForm.patchValue({ processCode: '' });
    serviceSpy.deriveProduct.calls.reset();

    component.onProcessCodeChange();

    expect(serviceSpy.deriveProduct).not.toHaveBeenCalled();
  });

  // ── deriveNewProductCode ────────────────────────────────────────

  it('should set derived product code and description on success', () => {
    const derived = { targetProductCode: 'E2950100', productDescription: 'Derived Product' };
    serviceSpy.deriveProduct.and.returnValue(of(derived));
    component.poolCodeScheme.set('I');
    component.poolDetails.set({ ...mockPoolDetails, oldProductType: 'PLT' });
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });

    component.onProcessCodeChange();

    expect(component.modifyForm.getRawValue().newProductCode).toBe('E2950100');
    expect(component.modifyForm.getRawValue().newProductDescription).toBe('Derived Product');
    expect(component.validConversions()).toEqual([derived]);
  });

  it('should fall back to loadValidConversions when deriveProduct fails', () => {
    serviceSpy.deriveProduct.and.returnValue(throwError(() => new Error('fail')));
    serviceSpy.getValidProductConversions.calls.reset();
    component.poolCodeScheme.set('I');
    component.poolDetails.set({ ...mockPoolDetails, oldProductType: 'PLT' });
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });

    component.onProcessCodeChange();

    expect(serviceSpy.getValidProductConversions).toHaveBeenCalled();
  });

  it('should not derive when poolDetails has no productCode', () => {
    component.poolCodeScheme.set('I');
    component.poolDetails.set({ ...mockPoolDetails, productCode: '' });
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.modifyForm.patchValue({ processCode: 'FLT' });
    serviceSpy.deriveProduct.calls.reset();

    component.onProcessCodeChange();

    expect(serviceSpy.deriveProduct).not.toHaveBeenCalled();
  });

  // ── onNewBagChange ──────────────────────────────────────────────

  it('should disable catalog/lot/filter fields when newBag is N', () => {
    component.modifyForm.patchValue({ newBag: 'N' });
    component.onNewBagChange();

    expect(component.modifyForm.get('catalogNumber')?.disabled).toBeTrue();
    expect(component.modifyForm.get('bagLotNumber')?.disabled).toBeTrue();
    expect(component.modifyForm.get('filterLotNumber')?.disabled).toBeTrue();
  });

  it('should clear catalog/lot/filter values when newBag is N', () => {
    component.modifyForm.patchValue({
      newBag: 'N',
      catalogNumber: 'CAT001',
      bagLotNumber: 'LOT001',
      filterLotNumber: 'FLT001',
    });
    component.onNewBagChange();

    expect(component.modifyForm.get('catalogNumber')?.value).toBe('');
    expect(component.modifyForm.get('bagLotNumber')?.value).toBe('');
    expect(component.modifyForm.get('filterLotNumber')?.value).toBe('');
  });

  it('should enable catalog/lot/filter fields when newBag is Y', () => {
    // First disable them
    component.modifyForm.patchValue({ newBag: 'N' });
    component.onNewBagChange();

    // Then enable
    component.modifyForm.patchValue({ newBag: 'Y' });
    component.onNewBagChange();

    expect(component.modifyForm.get('catalogNumber')?.enabled).toBeTrue();
    expect(component.modifyForm.get('bagLotNumber')?.enabled).toBeTrue();
    expect(component.modifyForm.get('filterLotNumber')?.enabled).toBeTrue();
  });

  it('should add required validators on catalog/lot when newBag is Y', () => {
    component.modifyForm.patchValue({ newBag: 'Y' });
    component.onNewBagChange();

    component.modifyForm.get('catalogNumber')?.setValue('');
    component.modifyForm.get('bagLotNumber')?.setValue('');

    expect(component.modifyForm.get('catalogNumber')?.hasError('required')).toBeTrue();
    expect(component.modifyForm.get('bagLotNumber')?.hasError('required')).toBeTrue();
  });

  it('should clear validators on catalog/lot when newBag is N', () => {
    component.modifyForm.patchValue({ newBag: 'N' });
    component.onNewBagChange();

    expect(component.modifyForm.get('catalogNumber')?.hasError('required')).toBeFalse();
    expect(component.modifyForm.get('bagLotNumber')?.hasError('required')).toBeFalse();
  });

  // ── onCatalogNumberChange ───────────────────────────────────────

  it('should clear lot numbers and load new ones on catalog number change', () => {
    component.lotNumbers.set([{ lotNumber: 'OLD' }]);
    component.modifyForm.patchValue({ catalogNumber: 'CAT002' });
    serviceSpy.getValidLotNumbers.calls.reset();

    component.onCatalogNumberChange();

    expect(component.lotNumbers()).toEqual([]);
    expect(component.modifyForm.get('bagLotNumber')?.value).toBe('');
    expect(serviceSpy.getValidLotNumbers).toHaveBeenCalledWith('CAT002');
  });

  it('should not load lot numbers when catalog number is empty', () => {
    component.modifyForm.patchValue({ catalogNumber: '' });
    serviceSpy.getValidLotNumbers.calls.reset();

    component.onCatalogNumberChange();

    expect(serviceSpy.getValidLotNumbers).not.toHaveBeenCalled();
  });

  // ── loadValidConversions ────────────────────────────────────────

  it('should load valid conversions and set signal', () => {
    const conversions = [{ targetProductCode: 'E2950100', productDescription: 'New Prod' }];
    serviceSpy.getValidProductConversions.and.returnValue(of(conversions));
    component.poolDetails.set({ ...mockPoolDetails, codeScheme: 'I' });

    component.loadValidConversions();

    expect(serviceSpy.getValidProductConversions).toHaveBeenCalledWith('E2940100', 'I');
    expect(component.validConversions()).toEqual(conversions);
  });

  it('should pass codeScheme when available', () => {
    serviceSpy.getValidProductConversions.and.returnValue(of([]));
    component.poolDetails.set({ ...mockPoolDetails, codeScheme: 'C' });

    component.loadValidConversions();

    expect(serviceSpy.getValidProductConversions).toHaveBeenCalledWith('E2940100', 'C');
  });

  it('should pass undefined codeScheme when codeScheme is null', () => {
    serviceSpy.getValidProductConversions.and.returnValue(of([]));
    component.poolDetails.set({ ...mockPoolDetails, codeScheme: null });

    component.loadValidConversions();

    expect(serviceSpy.getValidProductConversions).toHaveBeenCalledWith('E2940100', undefined);
  });

  it('should return early when poolDetails is null for loadValidConversions', () => {
    component.poolDetails.set(null);
    serviceSpy.getValidProductConversions.calls.reset();

    component.loadValidConversions();

    expect(serviceSpy.getValidProductConversions).not.toHaveBeenCalled();
  });

  it('should return early when productCode is empty', () => {
    component.poolDetails.set({ ...mockPoolDetails, productCode: '' });
    serviceSpy.getValidProductConversions.calls.reset();

    component.loadValidConversions();

    expect(serviceSpy.getValidProductConversions).not.toHaveBeenCalled();
  });

  it('should set validConversions to empty on error', () => {
    serviceSpy.getValidProductConversions.and.returnValue(throwError(() => new Error('fail')));
    component.poolDetails.set(mockPoolDetails);

    component.loadValidConversions();

    expect(component.validConversions()).toEqual([]);
  });

  // ── onNewProductCodeChange ──────────────────────────────────────

  it('should update newProductDescription when new product code matches', () => {
    component.validConversions.set([
      { targetProductCode: 'E2950100', productDescription: 'New Prod' },
    ]);
    component.modifyForm.get('newProductCode')?.enable();
    component.modifyForm.patchValue({ newProductCode: 'E2950100' });

    component.onNewProductCodeChange();

    expect(component.modifyForm.getRawValue().newProductDescription).toBe('New Prod');
  });

  it('should not update description when no match found', () => {
    component.validConversions.set([
      { targetProductCode: 'E2950100', productDescription: 'New Prod' },
    ]);
    component.modifyForm.get('newProductCode')?.enable();
    component.modifyForm.patchValue({ newProductCode: 'NOMATCH', newProductDescription: 'existing' });

    component.onNewProductCodeChange();

    expect(component.modifyForm.getRawValue().newProductDescription).toBe('existing');
  });

  it('should set empty description when matched conversion has null description', () => {
    component.validConversions.set([
      { targetProductCode: 'E2950100', productDescription: null },
    ]);
    component.modifyForm.get('newProductCode')?.enable();
    component.modifyForm.patchValue({ newProductCode: 'E2950100' });

    component.onNewProductCodeChange();

    expect(component.modifyForm.getRawValue().newProductDescription).toBe('');
  });

  // ── onPoolWeightChange ──────────────────────────────────────────

  it('should calculate volume from weight and specific gravity', () => {
    component.poolDetails.set({ ...mockPoolDetails, specificGravity: 1.05 });

    const event = { target: { value: '210' } } as any;
    component.onPoolWeightChange(event);

    expect(component.modifyForm.getRawValue().poolVolume).toBe(200);
  });

  it('should clear volume when weight is NaN', () => {
    component.poolDetails.set({ ...mockPoolDetails, specificGravity: 1.05 });

    const event = { target: { value: 'abc' } } as any;
    component.onPoolWeightChange(event);

    expect(component.modifyForm.getRawValue().poolVolume).toBe('');
  });

  it('should clear volume when specificGravity is null', () => {
    component.poolDetails.set({ ...mockPoolDetails, specificGravity: null });

    const event = { target: { value: '210' } } as any;
    component.onPoolWeightChange(event);

    expect(component.modifyForm.getRawValue().poolVolume).toBe('');
  });

  it('should clear volume when specificGravity is 0', () => {
    component.poolDetails.set({ ...mockPoolDetails, specificGravity: 0 });

    const event = { target: { value: '210' } } as any;
    component.onPoolWeightChange(event);

    expect(component.modifyForm.getRawValue().poolVolume).toBe('');
  });

  it('should clear volume when poolDetails is null', () => {
    component.poolDetails.set(null);

    const event = { target: { value: '210' } } as any;
    component.onPoolWeightChange(event);

    expect(component.modifyForm.getRawValue().poolVolume).toBe('');
  });

  // ── onCancel ────────────────────────────────────────────────────

  it('should reset form on cancel', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    component.searchPerformed.set(true);

    component.onCancel();

    expect(component.poolDetails()).toBeNull();
    expect(component.searchPerformed()).toBeFalse();
  });

  // ── onSave ──────────────────────────────────────────────────────

  it('should show snackbar error when unitIdField is not valid', () => {
    (component as any).unitIdField = { isValid: false, clear: jasmine.createSpy('clear') };

    component.onSave();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Please enter and validate a Unit ID first',
      'Close',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['error-snackbar'],
      }),
    );
    expect(serviceSpy.save).not.toHaveBeenCalled();
  });

  it('should mark all as touched when form is invalid', () => {
    mockUnitIdFieldValid();
    component.modifyForm.patchValue({ processCode: '', newBag: '', processDate: '' });
    const spy = spyOn(component.modifyForm, 'markAllAsTouched');

    component.onSave();

    expect(spy).toHaveBeenCalled();
    expect(serviceSpy.save).not.toHaveBeenCalled();
  });

  it('should return early when poolDetails is null', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(null);
    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate: '01-JAN-2025 10:00',
    });

    component.onSave();

    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('should open label verification dialog on valid save', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should not call save when label verification dialog returns null', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const mockDialogRef = { afterClosed: () => of(null) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(serviceSpy.save).not.toHaveBeenCalled();
  });

  it('should use default success message when response message is empty', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Pooled component modified successfully.',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] }),
    );
  });

  it('should set loading to false after successful save', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: 'OK', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(component.loading()).toBeFalse();
  });

  // ── performSave error handling (409 expiry) ─────────────────────

  it('should show expiry warning dialog on 409 error', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockLabelDialogRef = { afterClosed: () => of(verificationResult) };
    const mockConfirmDialogRef = { afterClosed: () => of(false) };
    dialogSpy.open.and.returnValues(mockLabelDialogRef as any, mockConfirmDialogRef as any);
    serviceSpy.save.and.returnValue(throwError(() => ({ status: 409 })));

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(component.loading()).toBeFalse();
    // Second dialog call should be the confirm dialog
    expect(dialogSpy.open).toHaveBeenCalledTimes(2);
  });

  it('should retry save with confirmExpired=true when user confirms expiry dialog', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockLabelDialogRef = { afterClosed: () => of(verificationResult) };
    const mockConfirmDialogRef = { afterClosed: () => of(true) };
    dialogSpy.open.and.returnValues(mockLabelDialogRef as any, mockConfirmDialogRef as any);
    // First call returns 409, second call succeeds
    serviceSpy.save.and.returnValues(
      throwError(() => ({ status: 409 })),
      of({ success: true, message: 'OK', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(serviceSpy.save).toHaveBeenCalledTimes(2);
    const secondCallArgs = serviceSpy.save.calls.argsFor(1);
    expect(secondCallArgs[0].confirmExpired).toBeTrue();
  });

  it('should set loading to false on non-409 save error', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(throwError(() => ({ status: 500 })));

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect(component.loading()).toBeFalse();
  });

  // ── onSelectOpenedChange ────────────────────────────────────────

  it('should clear search control when select is closed', () => {
    const ctrl = new FormControl('search term');
    component.onSelectOpenedChange(ctrl, false);
    expect(ctrl.value).toBe('');
  });

  it('should not clear search control when select is opened', () => {
    const ctrl = new FormControl('search term');
    component.onSelectOpenedChange(ctrl, true);
    expect(ctrl.value).toBe('search term');
  });

  // ── resetForm ───────────────────────────────────────────────────

  it('should reset all signals and form on resetForm', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    component.poolCodeScheme.set('I');
    component.searchPerformed.set(true);
    component.processCodes.set([{ code: 'FLT', description: 'Filtration' }]);
    component.validConversions.set([{ targetProductCode: 'E2950100', productDescription: 'Test' }]);
    component.productCodes.set([{ productCode: 'E2940100', productDescription: 'Test' }]);
    component.catalogNumbers.set([{ catalogNumber: 'CAT001' }]);
    component.lotNumbers.set([{ lotNumber: 'LOT001' }]);
    component.filterLotNumbers.set([{ lotNumber: 'FLT001' }]);
    component.aboOptions.set([{ code: 'OPOS', description: 'O POS POOL' }]);

    component.onCancel();

    expect(component.poolDetails()).toBeNull();
    expect(component.poolCodeScheme()).toBeNull();
    expect(component.searchPerformed()).toBeFalse();
    expect(component.processCodes()).toEqual([]);
    expect(component.validConversions()).toEqual([]);
    expect(component.productCodes()).toEqual([]);
    expect(component.catalogNumbers()).toEqual([]);
    expect(component.lotNumbers()).toEqual([]);
    expect(component.filterLotNumbers()).toEqual([]);
    expect(component.aboOptions()).toEqual([]);
  });

  it('should disable newProductCode after reset', () => {
    mockUnitIdFieldValid();
    component.modifyForm.get('newProductCode')?.enable();

    component.onCancel();

    expect(component.modifyForm.get('newProductCode')?.disabled).toBeTrue();
  });

  it('should not double-reset when resettingForm flag is true', () => {
    mockUnitIdFieldValid();
    (component as any).resettingForm = true;
    const resetSpy = spyOn(component.modifyForm, 'reset');

    (component as any).resetForm();

    expect(resetSpy).not.toHaveBeenCalled();
    (component as any).resettingForm = false;
  });

  // ── isNewBagY getter ────────────────────────────────────────────

  it('should return true when newBag is Y', () => {
    component.modifyForm.patchValue({ newBag: 'Y' });
    expect(component.isNewBagY).toBeTrue();
  });

  it('should return false when newBag is N', () => {
    component.modifyForm.patchValue({ newBag: 'N' });
    expect(component.isNewBagY).toBeFalse();
  });

  it('should return false when newBag is empty', () => {
    component.modifyForm.patchValue({ newBag: '' });
    expect(component.isNewBagY).toBeFalse();
  });

  // ── patchFormWithDetails ────────────────────────────────────────

  it('should patch form with all detail fields', () => {
    const fullDetails: ModifyPooledComponentsResponse = {
      ...mockPoolDetails,
      productCode: 'E2940100',
      processCode: 'FLT',
      processDescription: 'Filtration',
      newBag: 'Y',
      catalogNumber: 'CAT001',
      bagLotNumber: 'LOT001',
      filterLotNumber: 'FLT001',
      reagentName: 'Reagent A',
      manufacturer: 'Mfg Corp',
      reagentLotNumber: 'RLOT001',
      reagentExpirationDate: '2025-12-31T00:00:00',
      processDate: '2025-01-15T10:30:00',
      newProductCode: 'E2950100',
      newProductDescription: 'New Product',
      poolWeight: 250,
      poolVolume: 238,
    };
    serviceSpy.getPoolDetails.and.returnValue(of(fullDetails));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    const rawValues = component.modifyForm.getRawValue();
    expect(rawValues.productCode).toBe('E2940100');
    expect(rawValues.reagentName).toBe('Reagent A');
    expect(rawValues.manufacturer).toBe('Mfg Corp');
    expect(rawValues.reagentLotNumber).toBe('RLOT001');
    expect(rawValues.poolWeight).toBe(250);
  });

  it('should set reagentExpirationDate as Date object', () => {
    const detailsWithDate = {
      ...mockPoolDetails,
      reagentExpirationDate: '2025-12-31T00:00:00',
    };
    serviceSpy.getPoolDetails.and.returnValue(of(detailsWithDate));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    const value = component.modifyForm.get('reagentExpirationDate')?.value;
    expect(value instanceof Date).toBeTrue();
  });

  it('should set reagentExpirationDate to null when not provided', () => {
    serviceSpy.getPoolDetails.and.returnValue(of(mockPoolDetails));

    const mockEvent = {
      data: { parsedUnitId: 'W6333261234', codeScheme: 'I' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };

    component.onUnitIdPostValidate(mockEvent as any);

    expect(component.modifyForm.get('reagentExpirationDate')?.value).toBeNull();
  });

  // ── validateProcessDate ─────────────────────────────────────────

  it('should return early when processDate has no value', () => {
    component.modifyForm.get('processDate')?.clearValidators();
    component.modifyForm.get('processDate')?.updateValueAndValidity();
    component.modifyForm.patchValue({ processDate: '' });
    component.validateProcessDate();
    // validateProcessDate should return early without setting custom errors
    expect(component.modifyForm.get('processDate')?.hasError('invalidFormat')).toBeFalse();
    expect(component.modifyForm.get('processDate')?.hasError('afterPoolExpiry')).toBeFalse();
    expect(component.modifyForm.get('processDate')?.hasError('beforePoolDate')).toBeFalse();
  });

  it('should set invalidFormat error for unparseable date', () => {
    component.modifyForm.patchValue({ processDate: 'invalid-date' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.hasError('invalidFormat')).toBeTrue();
  });

  it('should set afterPoolExpiry error when process date is after pool expiry', () => {
    component.poolDetails.set({
      ...mockPoolDetails,
      poolExpiryDate: '2025-01-01T00:00:00',
    });
    component.modifyForm.patchValue({ processDate: '15-JAN-2025 10:00' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.hasError('afterPoolExpiry')).toBeTrue();
  });

  it('should set beforePoolDate error when process date is before collection date', () => {
    component.poolDetails.set({
      ...mockPoolDetails,
      collDate: '2025-06-01T00:00:00',
      poolExpiryDate: '2025-12-31T00:00:00',
    });
    component.modifyForm.patchValue({ processDate: '15-JAN-2025 10:00' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.hasError('beforePoolDate')).toBeTrue();
  });

  it('should not set errors for valid date within range', () => {
    component.poolDetails.set({
      ...mockPoolDetails,
      collDate: '2025-01-01T00:00:00',
      poolExpiryDate: '2025-12-31T00:00:00',
    });
    component.modifyForm.patchValue({ processDate: '15-JUN-2025 10:00' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.errors).toBeNull();
  });

  it('should not check pool expiry when poolExpiryDate is null', () => {
    component.poolDetails.set({
      ...mockPoolDetails,
      poolExpiryDate: null,
      collDate: '2025-01-01T00:00:00',
    });
    component.modifyForm.patchValue({ processDate: '15-JUN-2025 10:00' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.hasError('afterPoolExpiry')).toBeFalse();
  });

  it('should not check collection date when collDate is null', () => {
    component.poolDetails.set({
      ...mockPoolDetails,
      collDate: null,
      poolExpiryDate: '2025-12-31T00:00:00',
    });
    component.modifyForm.patchValue({ processDate: '15-JUN-2025 10:00' });
    component.validateProcessDate();
    expect(component.modifyForm.get('processDate')?.hasError('beforePoolDate')).toBeFalse();
  });

  // ── getProcessDateError ─────────────────────────────────────────

  it('should return null when control has no errors', () => {
    component.modifyForm.get('processDate')?.setErrors(null);
    expect(component.getProcessDateError()).toBeNull();
  });

  it('should return null when control is not touched', () => {
    component.modifyForm.get('processDate')?.setErrors({ required: true });
    component.modifyForm.get('processDate')?.markAsUntouched();
    expect(component.getProcessDateError()).toBeNull();
  });

  it('should return required message', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setErrors({ required: true });
    ctrl?.markAsTouched();
    expect(component.getProcessDateError()).toBe('Process date is required');
  });

  it('should return invalidFormat message', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setErrors({ invalidFormat: true });
    ctrl?.markAsTouched();
    expect(component.getProcessDateError()).toBe('Invalid format. Use DD-MMM-YYYY HH:mm');
  });

  it('should return afterPoolExpiry message', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setErrors({ afterPoolExpiry: true });
    ctrl?.markAsTouched();
    expect(component.getProcessDateError()).toBe('Process date cannot be after pool expiry date');
  });

  it('should return beforePoolDate message', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setErrors({ beforePoolDate: true });
    ctrl?.markAsTouched();
    expect(component.getProcessDateError()).toBe('Process date cannot be before pool creation date');
  });

  it('should return null for unknown error type', () => {
    const ctrl = component.modifyForm.get('processDate');
    ctrl?.setErrors({ unknownError: true });
    ctrl?.markAsTouched();
    expect(component.getProcessDateError()).toBeNull();
  });

  // ── processDateErrorMatcher ─────────────────────────────────────

  it('should return false when control is null', () => {
    expect(component.processDateErrorMatcher.isErrorState(null)).toBeFalse();
  });

  it('should return true when control is invalid and touched', () => {
    expect(component.processDateErrorMatcher.isErrorState({
      invalid: true, touched: true, dirty: false,
    })).toBeTrue();
  });

  it('should return true when control is invalid and dirty', () => {
    expect(component.processDateErrorMatcher.isErrorState({
      invalid: true, touched: false, dirty: true,
    })).toBeTrue();
  });

  it('should return false when control is valid', () => {
    expect(component.processDateErrorMatcher.isErrorState({
      invalid: false, touched: true, dirty: true,
    })).toBeFalse();
  });

  it('should return false when control is invalid but untouched and not dirty', () => {
    expect(component.processDateErrorMatcher.isErrorState({
      invalid: true, touched: false, dirty: false,
    })).toBeFalse();
  });

  // ── Computed filters ────────────────────────────────────────────

  it('filteredProductCodes should return all items when search is empty', () => {
    component.productCodes.set([
      { productCode: 'E2940100', productDescription: 'Test' },
      { productCode: 'E2940200', productDescription: 'Test 2' },
    ]);
    expect(component.filteredProductCodes().length).toBe(2);
  });

  it('filteredProductCodes should filter by search term', () => {
    component.productCodes.set([
      { productCode: 'E2940100', productDescription: 'Test' },
      { productCode: 'X1234567', productDescription: 'Other' },
    ]);
    component.productCodeSearchCtrl.setValue('E294');
    expect(component.filteredProductCodes().length).toBe(1);
    expect(component.filteredProductCodes()[0].productCode).toBe('E2940100');
  });

  it('filteredProcessCodes should return all items when search is empty', () => {
    component.processCodes.set([
      { code: 'FLT', description: 'Filtration' },
      { code: 'IRR', description: 'Irradiation' },
    ]);
    expect(component.filteredProcessCodes().length).toBe(2);
  });

  it('filteredProcessCodes should filter by code', () => {
    component.processCodes.set([
      { code: 'FLT', description: 'Filtration' },
      { code: 'IRR', description: 'Irradiation' },
    ]);
    component.processCodeSearchCtrl.setValue('FLT');
    expect(component.filteredProcessCodes().length).toBe(1);
  });

  it('filteredProcessCodes should filter by description', () => {
    component.processCodes.set([
      { code: 'FLT', description: 'Filtration' },
      { code: 'IRR', description: 'Irradiation' },
    ]);
    component.processCodeSearchCtrl.setValue('irrad');
    expect(component.filteredProcessCodes().length).toBe(1);
    expect(component.filteredProcessCodes()[0].code).toBe('IRR');
  });

  it('filteredCatalogNumbers should filter by search term', () => {
    component.catalogNumbers.set([
      { catalogNumber: 'CAT001' },
      { catalogNumber: 'CAT002' },
      { catalogNumber: 'XYZ999' },
    ]);
    component.catalogNumberSearchCtrl.setValue('CAT');
    expect(component.filteredCatalogNumbers().length).toBe(2);
  });

  it('filteredLotNumbers should filter by search term', () => {
    component.lotNumbers.set([
      { lotNumber: 'LOT001' },
      { lotNumber: 'LOT002' },
      { lotNumber: 'XYZ999' },
    ]);
    component.bagLotNumberSearchCtrl.setValue('LOT');
    expect(component.filteredLotNumbers().length).toBe(2);
  });

  it('filteredFilterLotNumbers should filter by search term', () => {
    component.filterLotNumbers.set([
      { lotNumber: 'FLT001' },
      { lotNumber: 'FLT002' },
      { lotNumber: 'XYZ999' },
    ]);
    component.filterLotNumberSearchCtrl.setValue('FLT');
    expect(component.filteredFilterLotNumbers().length).toBe(2);
  });

  it('filteredValidConversions should filter by targetProductCode', () => {
    component.validConversions.set([
      { targetProductCode: 'E2950100', productDescription: 'Product A' },
      { targetProductCode: 'X1234567', productDescription: 'Product B' },
    ]);
    component.newProductCodeSearchCtrl.setValue('E295');
    expect(component.filteredValidConversions().length).toBe(1);
    expect(component.filteredValidConversions()[0].targetProductCode).toBe('E2950100');
  });

  it('filteredValidConversions should filter by productDescription', () => {
    component.validConversions.set([
      { targetProductCode: 'E2950100', productDescription: 'Product A' },
      { targetProductCode: 'X1234567', productDescription: 'Product B' },
    ]);
    component.newProductCodeSearchCtrl.setValue('Product B');
    expect(component.filteredValidConversions().length).toBe(1);
    expect(component.filteredValidConversions()[0].targetProductCode).toBe('X1234567');
  });

  // ── Search subscriptions ────────────────────────────────────────

  it('should set search signals from search control value changes', () => {
    component.productCodeSearchCtrl.setValue('test');
    expect((component as any).productCodeSearch()).toBe('test');

    component.processCodeSearchCtrl.setValue('proc');
    expect((component as any).processCodeSearch()).toBe('proc');

    component.catalogNumberSearchCtrl.setValue('cat');
    expect((component as any).catalogNumberSearch()).toBe('cat');

    component.bagLotNumberSearchCtrl.setValue('lot');
    expect((component as any).bagLotNumberSearch()).toBe('lot');

    component.filterLotNumberSearchCtrl.setValue('flt');
    expect((component as any).filterLotNumberSearch()).toBe('flt');

    component.newProductCodeSearchCtrl.setValue('new');
    expect((component as any).newProductCodeSearch()).toBe('new');
  });

  it('should set search signal to empty string when null value is emitted', () => {
    component.productCodeSearchCtrl.setValue(null);
    expect((component as any).productCodeSearch()).toBe('');
  });

  // ── Chapter changes subscription ───────────────────────────────

  it('should reset form when chapter changes', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    component.searchPerformed.set(true);

    (headerService as any).chapterChangedSubject = (headerService as any).chapterChangedSubject || new Subject<void>();
    headerService.chapterChanged$.subscribe(); // ensure subscription exists

    // Trigger chapter change
    (headerService as any).chapterChangedSubject.next();

    expect(component.poolDetails()).toBeNull();
    expect(component.searchPerformed()).toBeFalse();
  });

  // ── formatDateTimeForInput ──────────────────────────────────────

  it('should return empty string for null dateTime', () => {
    const result = (component as any).formatDateTimeForInput(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined dateTime', () => {
    const result = (component as any).formatDateTimeForInput(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty string dateTime', () => {
    const result = (component as any).formatDateTimeForInput('');
    expect(result).toBe('');
  });

  it('should return empty string for invalid date string', () => {
    const result = (component as any).formatDateTimeForInput('not-a-date');
    expect(result).toBe('');
  });

  it('should format valid date with uppercase month', () => {
    const result = (component as any).formatDateTimeForInput('2025-01-15T10:30:00');
    expect(result).toMatch(/15-JAN-2025 10:30/);
  });

  // ── parseDateTimeString ─────────────────────────────────────────

  it('should return null for empty string', () => {
    const result = (component as any).parseDateTimeString('');
    expect(result).toBeNull();
  });

  it('should return null for invalid format', () => {
    const result = (component as any).parseDateTimeString('2025-01-15');
    expect(result).toBeNull();
  });

  it('should parse valid DD-MMM-YYYY HH:mm string', () => {
    const result = (component as any).parseDateTimeString('15-Jan-2025 10:30');
    expect(result).toBeTruthy();
    expect(result.isValid()).toBeTrue();
  });

  // ── getChapterNow / getChapterNowFormatted ──────────────────────

  it('should return moment when timezone is UTC', () => {
    headerService.chapterTimeZone.set('UTC');
    const result = (component as any).getChapterNow();
    expect(result).toBeTruthy();
    expect(result.isValid()).toBeTrue();
  });

  it('should return moment when timezone is empty', () => {
    headerService.chapterTimeZone.set('');
    const result = (component as any).getChapterNow();
    expect(result).toBeTruthy();
    expect(result.isValid()).toBeTrue();
  });

  it('should return moment for valid timezone', () => {
    headerService.chapterTimeZone.set('America/New_York');
    const result = (component as any).getChapterNow();
    expect(result).toBeTruthy();
    expect(result.isValid()).toBeTrue();
  });

  it('should return moment for invalid timezone (catch branch)', () => {
    headerService.chapterTimeZone.set('Invalid/Timezone');
    const result = (component as any).getChapterNow();
    expect(result).toBeTruthy();
    expect(result.isValid()).toBeTrue();
  });

  it('should return formatted date string with uppercase month', () => {
    const result = (component as any).getChapterNowFormatted();
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Check for DD-MMM-YYYY HH:mm format with uppercase month
    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
  });

  // ── hasPoolDetails computed ─────────────────────────────────────

  it('should return false when poolDetails is null', () => {
    component.poolDetails.set(null);
    expect(component.hasPoolDetails()).toBeFalse();
  });

  it('should return true when poolDetails is set', () => {
    component.poolDetails.set(mockPoolDetails);
    expect(component.hasPoolDetails()).toBeTrue();
  });

  // ── headerConfig ────────────────────────────────────────────────

  it('should have default header config', () => {
    expect(component.headerConfig.title).toBe('Modify Pooled Components');
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
  });

  // ── Save request construction ───────────────────────────────────

  it('should construct save request with all form values', () => {
    mockUnitIdFieldValid();
    const detailsForSave = {
      ...mockPoolDetails,
      pooledAboRh: 'O+',
      poolExpiryDate: '2025-12-31T00:00:00',
      spTestRequired: true,
    };
    component.poolDetails.set(detailsForSave);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: 'OK', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
      reagentName: 'Reagent A',
      manufacturer: 'Corp',
      reagentLotNumber: 'RL001',
      poolWeight: 250,
    });
    component.modifyForm.get('newProductCode')?.enable();
    component.modifyForm.patchValue({ newProductCode: 'E2950100' });

    component.onSave();

    const request = serviceSpy.save.calls.mostRecent().args[0];
    expect(request.unitId).toBe('W6333261234');
    expect(request.processCode).toBe('FLT');
    expect(request.newBag).toBe('Y');
    expect(request.reagentName).toBe('Reagent A');
    expect(request.manufacturer).toBe('Corp');
    expect(request.reagentLotNumber).toBe('RL001');
    expect(request.poolWeight).toBe(250);
    expect(request.newProductCode).toBe('E2950100');
    expect(request.confirmExpired).toBeFalse();
    expect(request.verification).toEqual(verificationResult);
  });

  it('should pass label verification data to the dialog', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set({
      ...mockPoolDetails,
      pooledAboRh: 'O+',
      poolExpiryDate: '2025-12-31',
      spTestRequired: true,
    });
    component.aboOptions.set([{ code: 'OPOS', description: 'O POS POOL' }]);
    component.poolCodeScheme.set('I');

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
    expect(dialogData.poolId).toBe('W6333261234');
    expect(dialogData.isIsbt).toBeTrue();
    expect(dialogData.hasCmvNegative).toBeTrue();
    expect(dialogData.aboOptions).toEqual([{ code: 'OPOS', description: 'O POS POOL' }]);
  });

  // ── performSave with null details ───────────────────────────────

  it('should return early from performSave when poolDetails is null', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    // Set poolDetails to null AFTER the dialog opens but we intercept before save
    // Using a custom afterClosed that nulls details before returning
    const customDialogRef = {
      afterClosed: () => {
        component.poolDetails.set(null);
        return of(verificationResult);
      },
    };
    dialogSpy.open.and.returnValue(customDialogRef as any);

    component.onSave();

    expect(serviceSpy.save).not.toHaveBeenCalled();
  });

  // ── Save with reagentExpirationDate and processDate null ────────

  it('should handle null reagentExpirationDate in save request', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: 'OK', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
      reagentExpirationDate: null,
    });

    component.onSave();

    const request = serviceSpy.save.calls.mostRecent().args[0];
    expect(request.reagentExpirationDate).toBeNull();
  });

  // ── onSave with C code scheme ───────────────────────────────────

  it('should set isIsbt false when codeScheme is C', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    component.poolCodeScheme.set('C');

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
    expect(dialogData.isIsbt).toBeFalse();
  });

  // ── Save resets lastVerification ────────────────────────────────

  it('should clear lastVerification after successful save', () => {
    mockUnitIdFieldValid();
    component.poolDetails.set(mockPoolDetails);
    const verificationResult = {
      scannedUnitId: 'W6333261234',
      scannedAbo: 'OPOS',
      scannedProductCode: 'E2940100',
    };
    const mockDialogRef = { afterClosed: () => of(verificationResult) };
    dialogSpy.open.and.returnValue(mockDialogRef as any);
    serviceSpy.save.and.returnValue(
      of({ success: true, message: 'OK', statusCode: 200, data: null, item: null }),
    );

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const processDate = `${day}-${month}-${year} 10:00`;

    component.modifyForm.patchValue({
      processCode: 'FLT',
      newBag: 'Y',
      processDate,
    });

    component.onSave();

    expect((component as any).lastVerification).toBeNull();
  });
});
