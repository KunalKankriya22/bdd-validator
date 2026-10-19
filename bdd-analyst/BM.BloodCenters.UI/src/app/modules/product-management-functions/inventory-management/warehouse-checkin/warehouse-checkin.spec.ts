import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { WarehouseCheckIn } from './warehouse-checkin';
import { WarehouseCheckInApiService } from './services/warehouse-checkin-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ValidateAllResponseDto, UnitProductDto, LocationLookupOption } from './models/warehouse-checkin.model';
import { TranslateService } from '@ngx-translate/core';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const VALID_VALIDATE_RESPONSE: ValidateAllResponseDto = {
  isValid: true,
  currentWarehouse: 'W1',
  stockState: 'TR',
  batchId: 'BATCH001',
  batchStatus: 'TRANS',
  destinationWarehouse: 'W2',
  collectionDate: '2026-05-25T00:00:00Z',
  productClass: 'Regular',
  tempInRange: true,
  warnings: [],
};

const MOCK_CHECK_IN_RESPONSE = {
  success: true,
  unitId: 'W633300000001',
  productCode: '69101000',
  stockState: 'AV',
  batchId: 'BATCH001',
  locationId: 'W2502001028',
  receiveDate: '2026-05-30T00:00:00Z',
  receiveUser: 'NITOR1',
  batchReconciled: false,
  message: 'Unit checked in successfully',
};

const MOCK_UNIT_PRODUCT: UnitProductDto = {
  productCode: '69101000',
  collDate: '2026-05-25T00:00:00Z',
  expDate: '2026-06-10T00:00:00Z',
  productType: 'RBC',
  inventoryClass: 'Regular',
  warehouseId: 'W1',
  bloodType: 'O+',
  storageClass: 'REF',
};

const MOCK_UNIT_PRODUCT_2: UnitProductDto = {
  productCode: '69102000',
  collDate: '2026-05-26T00:00:00Z',
  expDate: '2026-06-11T00:00:00Z',
  productType: 'PLT',
  inventoryClass: 'Special',
  warehouseId: 'W1',
  bloodType: 'A+',
  storageClass: 'FRZ',
};

const MOCK_DEVICE_OPTIONS: LocationLookupOption[] = [
  { value: '10', label: 'Device 10', deviceType: 'C' },
  { value: '20', label: 'Device 20', deviceType: 'F' },
];

const MOCK_RACK_OPTIONS: LocationLookupOption[] = [
  { value: '08', label: 'Rack 08' },
  { value: '09', label: 'Rack 09' },
];

const MOCK_TRAY_OPTIONS: LocationLookupOption[] = [
  { value: 'T001', label: 'Tray T001' },
  { value: 'T002', label: 'Tray T002' },
];

const MOCK_WAREHOUSE_OPTIONS: LocationLookupOption[] = [
  { value: 'W2', label: 'Home Warehouse' },
  { value: 'W3', label: 'Remote Warehouse' },
];

// ---------------------------------------------------------------------------
// Helper: build a mock UnitIdPostValidateEvent
// ---------------------------------------------------------------------------
function buildPostValidateEvent(parsedUnitId: string): UnitIdPostValidateEvent {
  return {
    data: {
      parsedUnitId,
      checkDigit: null,
      codeScheme: 'I' as const,
      manualUnitId: '',
      codabarUnitScheme: null,
      entryMode: 'S' as const,
      barcodeType: 'CODE128' as const,
      chapterScheme: 'I' as const,
    },
    confirm: jasmine.createSpy('confirm'),
    reject: jasmine.createSpy('reject'),
  };
}

// ---------------------------------------------------------------------------
// Helper: build a spy for HeaderService
// ---------------------------------------------------------------------------
function buildHeaderSpy() {
  const spy = jasmine.createSpyObj<HeaderService>(
    'HeaderService',
    ['getCurrentWarehouseId', 'getCurrentChapterId']
  );
  // warehouseId is a signal — expose as a plain function for computed()
  (spy as any).warehouseId = jasmine.createSpy('warehouseId').and.returnValue('W2');
  (spy as any).chapterChanged$ = EMPTY;
  spy.getCurrentWarehouseId.and.returnValue('W2');
  spy.getCurrentChapterId.and.returnValue('WAD');
  return spy;
}

// ---------------------------------------------------------------------------
// Helper: build a spy for PageHeaderService
// ---------------------------------------------------------------------------
function buildPageHeaderSpy() {
  return {
    pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
    getTitle: jasmine.createSpy('getTitle').and.returnValue(''),
  } as unknown as PageHeaderService;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('WarehouseCheckIn', () => {
  let component: WarehouseCheckIn;
  let fixture: ComponentFixture<WarehouseCheckIn>;
  let apiSpy: jasmine.SpyObj<WarehouseCheckInApiService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj<WarehouseCheckInApiService>(
      'WarehouseCheckInApiService',
      ['validateAll', 'checkIn', 'getUnitProducts', 'getChapterWarehouses', 'getLocationLookup']
    );
    // Safe defaults so tests that don't care about these calls don't throw
    apiSpy.getChapterWarehouses.and.returnValue(of([]));
    apiSpy.getUnitProducts.and.returnValue(of([]));
    apiSpy.getLocationLookup.and.returnValue(of([]));

    headerSpy = buildHeaderSpy();
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    // Dialog open returns a ref whose afterClosed emits false by default
    (dialogSpy.open as jasmine.Spy).and.returnValue({ afterClosed: () => of({ override: false }) });

    const translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.returnValue('');
    translateSpy.get.and.returnValue(of(''));



      TestBed.configureTestingModule({
      imports: [WarehouseCheckIn, NoopAnimationsModule],
      providers: [
        { provide: WarehouseCheckInApiService, useValue: apiSpy },
        { provide: HeaderService,              useValue: headerSpy },
        { provide: PageHeaderService,          useValue: buildPageHeaderSpy() },
        { provide: MatSnackBar,                useValue: snackBarSpy },
        { provide: MatDialog,                  useValue: dialogSpy },
        { provide: TranslateService,           useValue: translateSpy },
      ],
    })
    .overrideComponent(WarehouseCheckIn, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MatDialog,   useValue: dialogSpy },
        ],
      },
    });






    fixture = TestBed.createComponent(WarehouseCheckIn);
    component = fixture.componentInstance;


    });

  // =========================================================================
  // Initialization
  // =========================================================================

  describe('Initialization', () => {


    it('should start with checkInTemp = null', () => {
      fixture.detectChanges();
      expect(component.checkInTemp()).toBeNull();
    });

    it('should start with empty scannedUnits and isEmpty = true', () => {
      fixture.detectChanges();
      expect(component.scannedUnits()).toEqual([]);
      expect(component.isEmpty()).toBeTrue();
    });

    it('should initialise scanForm with productCode, deviceNumber, rackNumber, trayNumber controls', () => {
      fixture.detectChanges();
      expect(component.scanForm.get('productCode')).toBeTruthy();
      expect(component.scanForm.get('deviceNumber')).toBeTruthy();
      expect(component.scanForm.get('rackNumber')).toBeTruthy();
      expect(component.scanForm.get('trayNumber')).toBeTruthy();
    });

    it('should initialise tempForm with a required checkInTemp control', () => {
      fixture.detectChanges();
      component.tempForm.get('checkInTemp')?.markAsTouched();
      expect(component.tempForm.get('checkInTemp')?.valid).toBeFalse();
    });



    it('canScan should be false until temperature is set', () => {
      fixture.detectChanges();
      expect(component.canScan()).toBeFalse();
      component.tempForm.patchValue({ checkInTemp: -20 });
      component.onTempChange();
      expect(component.canScan()).toBeTrue();
    });

    it('canCommit should be false until validationInfo.isValid is true', () => {
      fixture.detectChanges();
      expect(component.canCommit()).toBeFalse();
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
      expect(component.canCommit()).toBeTrue();
    });
  });

  // =========================================================================
  // Temperature
  // =========================================================================

  describe('Temperature Management', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update checkInTemp signal when temperature changes', () => {
      component.tempForm.patchValue({ checkInTemp: 4 });
      component.onTempChange();
      expect(component.checkInTemp()).toBe(4);
    });

    it('should re-run validateAll when temperature changes with unit + product already set', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      component['parsedUnitId'].set('W633300000001');
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });

      component.tempForm.patchValue({ checkInTemp: -20 });
      component.onTempChange();
      tick();

      expect(apiSpy.validateAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitId: 'W633300000001', productCode: '69101000', temperature: -20 })
      );
    }));



    it('should clear checkInTemp and scannedUnits on CLEAR', () => {
      component['scannedUnits'].set([{
        unitId: 'W633300000001', collectionDate: '25-MAY-2026',
        product: '69101000', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1',
        deviceNumber: '50', rackNumber: '20', trayNumber: '1028', sequence: 1,
      }]);
      component.tempForm.patchValue({ checkInTemp: -20 });
      component.onClearTemp();

      expect(component.checkInTemp()).toBeNull();
      expect(component.scannedUnits()).toEqual([]);
    });

    it('should reset productCode to empty string on CLEAR', () => {
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      component.onClearTemp();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    });
  });

  // =========================================================================
  // Consolidated validation (validateAll)
  // =========================================================================

  describe('runValidateAll', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call validateAll with unitId, productCode, and current temperature', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      component['checkInTemp'].set(-20);

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      // toHaveBeenCalledOnceWith + jasmine.objectContaining doesn't work in Jest
      // due to JSON.stringify comparison; split into two assertions instead.
      expect(apiSpy.validateAll).toHaveBeenCalledTimes(1);
      expect(apiSpy.validateAll).toHaveBeenCalledWith(
        expect.objectContaining({ unitId: 'W633300000001', productCode: '69101000', temperature: -20 })
      );
    }));

    it('should set validationInfo on valid response', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(component.validationInfo()?.isValid).toBeTrue();
      // The component uses the receiving warehouse (headerService.getCurrentWarehouseId)
      // not the source warehouse from the validate response.
      expect(component.validationInfo()?.warehouseId).toBe('W2');
      expect(component.validationInfo()?.class).toBe('Regular');
    }));

    it('should mark validationInfo invalid and open dialog on error response (0313)', fakeAsync(() => {
      const errorResponse = { ...VALID_VALIDATE_RESPONSE, isValid: false, errorCode: '0313', errorMessage: 'Unit not found in active products' };
      apiSpy.validateAll.and.returnValue(of(errorResponse));

      component['parsedUnitId'].set('BADUNIT');
      component['runValidateAll']('BADUNIT', '69101000');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.validationInfo()?.isValid).toBeFalsy();
    }));

    it('should mark validationInfo invalid and open dialog on error 3728', fakeAsync(() => {
      const quarantineResponse = { ...VALID_VALIDATE_RESPONSE, isValid: false, errorCode: '3728', errorMessage: 'Unit is already in quarantine' };
      apiSpy.validateAll.and.returnValue(of(quarantineResponse));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.validationInfo()?.isValid).toBeFalsy();
    }));





    it('should set validating = false on API error', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(throwError(() => ({ message: 'Network error' })));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(component.validating()).toBeFalse();
    }));

    it('should include temperature = null when no temp is set', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(apiSpy.validateAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ temperature: null })
      );
    }));
  });

  // =========================================================================
  // Commit (checkIn)
  // =========================================================================

  describe('onCommit', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Put the component in a commitable state
      component['parsedUnitId'].set('W633300000001');
      component['checkInTemp'].set(-20);
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
      component.scanForm.patchValue(
        { productCode: '69101000', deviceNumber: '', rackNumber: '', trayNumber: '' },
        { emitEvent: false }
      );
    });



    it('should call checkIn with correct unitId, productCode, and receiveTemp', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();

      expect(apiSpy.checkIn).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitId: 'W633300000001', productCode: '69101000', receiveTemp: -20 })
      );
    }));




    it('should increment successCount on success', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();

      expect(component.successCount()).toBe(1);
    }));

    it('should clear parsedUnitId and productCode after success', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();

      expect(component['parsedUnitId']()).toBeNull();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    }));




    it('should show batch-reconciled message when batchReconciled = true', fakeAsync(() => {
      const reconResponse = { ...MOCK_CHECK_IN_RESPONSE, batchReconciled: true, message: 'Batch BATCH001 reconciled.' };
      apiSpy.checkIn.and.returnValue(of(reconResponse));
      component.onCommit();
      tick(200);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('reconciled'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));




  });

  // =========================================================================
  // Form clearing
  // =========================================================================

  describe('clearScanFields (via onClearTemp)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['parsedUnitId'].set('W633300000001');
      component.scanForm.patchValue(
        { productCode: '69101000', deviceNumber: '10', rackNumber: '08', trayNumber: 'T001' },
        { emitEvent: false }
      );
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
    });

    it('should reset parsedUnitId to null', () => {
      component.onClearTemp();
      expect(component['parsedUnitId']()).toBeNull();
    });

    it('should reset productCode to empty string', () => {
      component.onClearTemp();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    });

    it('should reset validationInfo to null', () => {
      component.onClearTemp();
      expect(component.validationInfo()).toBeNull();
    });
  });

  describe('clearAllScanFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scanForm.patchValue(
        { productCode: '69101000', deviceNumber: '10', rackNumber: '08', trayNumber: 'T001' },
        { emitEvent: false }
      );
    });

    it('should clear all scan fields including productCode', () => {
      component['validationInfo'].set({
        collectionDate: '', expirationDate: '', class: '', warehouseId: '', isValid: false,
      });
      component.clearAllScanFields();

      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('deviceNumber')?.value).toBe('');
      expect(component.scanForm.get('rackNumber')?.value).toBe('');
      expect(component.scanForm.get('trayNumber')?.value).toBe('');
    });


  });

  // =========================================================================
  // Unit ID cleared
  // =========================================================================

  describe('onUnitIdCleared', () => {
    it('should reset parsedUnitId, validationInfo, and productCode', () => {
      fixture.detectChanges();
      component['parsedUnitId'].set('W633300000001');
      component['validationInfo'].set({
        collectionDate: '', expirationDate: '', class: '', warehouseId: '', isValid: true,
      });
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });

      component.onUnitIdCleared();

      expect(component['parsedUnitId']()).toBeNull();
      expect(component.validationInfo()).toBeNull();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    });
  });

  // =========================================================================
  // Multiple instance uniqueness (no componentId — verify different instances)
  // =========================================================================

  describe('Multiple instances', () => {
    it('should be independent — scannedUnits on one does not affect the other', () => {
      fixture.detectChanges();
      const fixture2 = TestBed.createComponent(WarehouseCheckIn);
      const component2 = fixture2.componentInstance;
      fixture2.detectChanges();

      component['scannedUnits'].set([{
        unitId: 'UNIT1', collectionDate: '', product: '', expirationDate: '',
        class: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 1,
      }]);

      expect(component2.scannedUnits()).toEqual([]);
    });
  });

  // =========================================================================
  // NEW TESTS — Temperature truncation
  // =========================================================================

  describe('onTempChange truncation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should truncate temperature value when string length exceeds 7', () => {
      component.tempForm.patchValue({ checkInTemp: 12345678 });
      component.onTempChange();
      // '12345678'.length = 8 > 7 => truncate to first 7 chars: '1234567' => 1234567
      expect(component.checkInTemp()).toBe(1234567);
    });

    it('should not truncate temperature value when string length is 7 or less', () => {
      component.tempForm.patchValue({ checkInTemp: -20.5 });
      component.onTempChange();
      expect(component.checkInTemp()).toBe(-20.5);
    });

    it('should handle null temperature value', () => {
      component.tempForm.patchValue({ checkInTemp: null });
      component.onTempChange();
      expect(component.checkInTemp()).toBeNull();
    });

    it('should handle undefined temperature value', () => {
      component.tempForm.patchValue({ checkInTemp: undefined });
      component.onTempChange();
      expect(component.checkInTemp()).toBeNull();
    });
  });

  // =========================================================================
  // NEW TESTS — onPostValidate
  // =========================================================================

  describe('onPostValidate', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set parsedUnitId from event data', () => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([]));
      component.onPostValidate(event);
      expect(component['parsedUnitId']()).toBe('W633300000001');
    });

    it('should clear validationInfo', () => {
      component['validationInfo'].set({
        collectionDate: '', expirationDate: '', class: '', warehouseId: '', isValid: true,
      });
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([]));
      component.onPostValidate(event);
      expect(component.validationInfo()).toBeNull();
    });

    it('should call getUnitProducts with the parsedUnitId', () => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([MOCK_UNIT_PRODUCT]));
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component.onPostValidate(event);
      expect(apiSpy.getUnitProducts).toHaveBeenCalledWith('W633300000001');
    });

    it('should run validateAll if product code already selected', fakeAsync(() => {
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([MOCK_UNIT_PRODUCT]));
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component.onPostValidate(event);
      tick();
      expect(apiSpy.validateAll).toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // NEW TESTS — loadUnitProducts
  // =========================================================================

  describe('loadUnitProducts', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reject event when no products are returned', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([]));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('No products found for this unit');
    }));

    it('should set product options and bind product data for single product', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([MOCK_UNIT_PRODUCT]));
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(component.scanForm.get('productCode')?.value).toBe('69101000');
      // single product: pendingValidateEvent is set, so confirm is NOT called immediately
      expect(event.confirm).not.toHaveBeenCalled();
    }));

    it('should confirm event immediately for multiple products', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(of([MOCK_UNIT_PRODUCT, MOCK_UNIT_PRODUCT_2]));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should reject event and show error on API error', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(throwError(() => ({ message: 'Server error' })));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Server error');
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should handle API error with nested error message', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(throwError(() => ({ error: { message: 'Nested error' } })));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Nested error');
    }));

    it('should handle API error with no message', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      apiSpy.getUnitProducts.and.returnValue(throwError(() => ({})));
      component['loadUnitProducts']('W633300000001', event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Failed to load unit products');
    }));
  });

  // =========================================================================
  // NEW TESTS — bindProductData
  // =========================================================================

  describe('bindProductData', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set validationInfo from product data', () => {
      component['bindProductData'](MOCK_UNIT_PRODUCT);
      const info = component.validationInfo();
      expect(info).toBeTruthy();
      expect(info!.class).toBe('Regular');
      expect(info!.warehouseId).toBe('W2'); // receiving warehouse from headerService
      expect(info!.isValid).toBeFalse();
    });

    it('should format collectionDate and expirationDate', () => {
      component['bindProductData'](MOCK_UNIT_PRODUCT);
      const info = component.validationInfo();
      expect(info!.collectionDate).toContain('MAY');
      expect(info!.expirationDate).toContain('JUN');
    });
  });

  // =========================================================================
  // NEW TESTS — loadLocationCascade
  // =========================================================================

  describe('loadLocationCascade', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
    });

    it('should set deviceError when no warehouses returned', fakeAsync(() => {
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['loadLocationCascade']();
      tick();
      expect(component['deviceError']()).toBe('No warehouse location available');
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should set locationWarehouseId and load devices on success', fakeAsync(() => {
      // First call returns warehouses, second returns devices
      apiSpy.getLocationLookup.and.returnValues(
        of(MOCK_WAREHOUSE_OPTIONS),
        of(MOCK_DEVICE_OPTIONS)
      );
      component['loadLocationCascade']();
      tick();
      expect(component['locationWarehouseId']).toBe('W2');
    }));

    it('should set deviceError on API error', fakeAsync(() => {
      apiSpy.getLocationLookup.and.returnValue(throwError(() => ({ message: 'Network error' })));
      component['loadLocationCascade']();
      tick();
      expect(component['deviceError']()).toBe('Failed to load warehouse locations');
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should fall back to first warehouse when receiving warehouse not matched', fakeAsync(() => {
      headerSpy.getCurrentWarehouseId.and.returnValue('W999');
      const warehouses: LocationLookupOption[] = [
        { value: 'W5', label: 'Warehouse 5' },
      ];
      apiSpy.getLocationLookup.and.returnValues(of(warehouses), of([]));
      component['loadLocationCascade']();
      tick();
      expect(component['locationWarehouseId']).toBe('W5');
    }));
  });

  // =========================================================================
  // NEW TESTS — loadDevices
  // =========================================================================

  describe('loadDevices', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
    });

    it('should do nothing when locationWarehouseId is null', fakeAsync(() => {
      component['locationWarehouseId'] = null;
      apiSpy.getLocationLookup.calls.reset();
      component['loadDevices']();
      tick();
      expect(apiSpy.getLocationLookup).not.toHaveBeenCalled();
    }));

    it('should set deviceError when no devices returned', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['loadDevices']();
      tick();
      expect(component['deviceError']()).toBe('No storage devices available for this warehouse');
    }));

    it('should populate deviceOptions on success', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of(MOCK_DEVICE_OPTIONS));
      component['loadDevices']();
      tick();
      expect(component.deviceOptions()).toEqual(MOCK_DEVICE_OPTIONS);
      expect(component['filteredDeviceOptions']()).toEqual(MOCK_DEVICE_OPTIONS);
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should set deviceError on API error', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadDevices']();
      tick();
      expect(component['deviceError']()).toBe('Failed to load storage devices');
    }));
  });

  // =========================================================================
  // NEW TESTS — loadRacks
  // =========================================================================

  describe('loadRacks', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scanForm.patchValue({ productCode: '69101000', deviceNumber: '10' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
    });

    it('should do nothing when locationWarehouseId is null', fakeAsync(() => {
      component['locationWarehouseId'] = null;
      apiSpy.getLocationLookup.calls.reset();
      component['loadRacks']();
      tick();
      expect(apiSpy.getLocationLookup).not.toHaveBeenCalled();
    }));

    it('should do nothing when deviceNumber is empty', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      component.scanForm.patchValue({ deviceNumber: '' }, { emitEvent: false });
      apiSpy.getLocationLookup.calls.reset();
      component['loadRacks']();
      tick();
      expect(apiSpy.getLocationLookup).not.toHaveBeenCalled();
    }));

    it('should set rackError when no racks returned', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['loadRacks']();
      tick();
      expect(component['rackError']()).toBe('No racks available for this device');
    }));

    it('should populate rackOptions on success', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of(MOCK_RACK_OPTIONS));
      component['loadRacks']();
      tick();
      expect(component['rackOptions']()).toEqual(MOCK_RACK_OPTIONS);
      expect(component['filteredRackOptions']()).toEqual(MOCK_RACK_OPTIONS);
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should set rackError on API error', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadRacks']();
      tick();
      expect(component['rackError']()).toBe('Failed to load racks');
    }));
  });

  // =========================================================================
  // NEW TESTS — loadTrays
  // =========================================================================

  describe('loadTrays', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scanForm.patchValue({ productCode: '69101000', deviceNumber: '10', rackNumber: '08' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
    });

    it('should do nothing when locationWarehouseId is null', fakeAsync(() => {
      component['locationWarehouseId'] = null;
      apiSpy.getLocationLookup.calls.reset();
      component['loadTrays']();
      tick();
      expect(apiSpy.getLocationLookup).not.toHaveBeenCalled();
    }));

    it('should do nothing when rackNumber is empty', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      component.scanForm.patchValue({ rackNumber: '' }, { emitEvent: false });
      apiSpy.getLocationLookup.calls.reset();
      component['loadTrays']();
      tick();
      expect(apiSpy.getLocationLookup).not.toHaveBeenCalled();
    }));

    it('should set trayError when no trays returned', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['loadTrays']();
      tick();
      expect(component['trayError']()).toBe('No trays available for this rack');
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should populate trayOptions on success', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(of(MOCK_TRAY_OPTIONS));
      component['loadTrays']();
      tick();
      expect(component['trayOptions']()).toEqual(MOCK_TRAY_OPTIONS);
      expect(component['filteredTrayOptions']()).toEqual(MOCK_TRAY_OPTIONS);
      expect(component['locationLoading']()).toBeFalse();
    }));

    it('should set trayError on API error', fakeAsync(() => {
      component['locationWarehouseId'] = 'W2';
      apiSpy.getLocationLookup.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadTrays']();
      tick();
      expect(component['trayError']()).toBe('Failed to load trays');
    }));
  });

  // =========================================================================
  // NEW TESTS — onCommit additional branches
  // =========================================================================

  describe('onCommit — additional branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['parsedUnitId'].set('W633300000001');
      component['checkInTemp'].set(-20);
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
      component.scanForm.patchValue(
        { productCode: '69101000', deviceNumber: '', rackNumber: '', trayNumber: '' },
        { emitEvent: false }
      );
    });

    it('should not call checkIn when canCommit is false', fakeAsync(() => {
      component['validationInfo'].set(null);
      component.onCommit();
      tick();
      expect(apiSpy.checkIn).not.toHaveBeenCalled();
    }));

    it('should show warning when stockState is QU (quarantine)', fakeAsync(() => {
      const quarantineResponse = {
        ...MOCK_CHECK_IN_RESPONSE,
        stockState: 'QU',
        message: 'Unit checked in — quarantined',
      };
      apiSpy.checkIn.and.returnValue(of(quarantineResponse));
      component.onCommit();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('quarantined'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should show warning when warningCode is 9928 (temp out of range)', fakeAsync(() => {
      const tempWarnResponse = {
        ...MOCK_CHECK_IN_RESPONSE,
        warningCode: '9928',
        warningMessage: 'Temperature out of range — unit will be quarantined',
      };
      apiSpy.checkIn.and.returnValue(of(tempWarnResponse));
      component.onCommit();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Temperature out of range'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should show error on checkIn API error', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(throwError(() => ({ message: 'Network error' })));
      component.onCommit();
      tick();
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Network error'),
        'Close',
        jasmine.any(Object)
      );
    }));

    it('should show error with errorCode from nested error response', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '0341' }, message: 'Invalid tray' },
      })));
      component.onCommit();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Invalid tray',
        'Close',
        jasmine.any(Object)
      );
    }));

    it('should construct locationId when device, rack, and tray are all set', fakeAsync(() => {
      component.scanForm.patchValue(
        { deviceNumber: '10', rackNumber: '08', trayNumber: 'T001' },
        { emitEvent: false }
      );
      component['locationWarehouseId'] = 'H';
      component['selectedDeviceType'] = 'C';
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();
      const callArgs = apiSpy.checkIn.calls.mostRecent().args[0];
      expect(callArgs.locationId).toBe('HC100800T001');
    }));

    it('should not include locationId when device/rack/tray are not all set', fakeAsync(() => {
      component.scanForm.patchValue(
        { deviceNumber: '10', rackNumber: '', trayNumber: '' },
        { emitEvent: false }
      );
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();
      const callArgs = apiSpy.checkIn.calls.mostRecent().args[0];
      expect(callArgs.locationId).toBeUndefined();
    }));

    it('should add scannedUnit row to the beginning of the list', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();
      expect(component.scannedUnits().length).toBe(1);
      expect(component.scannedUnits()[0].unitId).toBe('W633300000001');
    }));

    it('should show success message for normal check-in', fakeAsync(() => {
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onCommit();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Unit checked in successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should use warningMessage when quarantined and warningMessage available', fakeAsync(() => {
      const response = {
        ...MOCK_CHECK_IN_RESPONSE,
        warningCode: '9928',
        warningMessage: 'Custom warning message',
      };
      apiSpy.checkIn.and.returnValue(of(response));
      component.onCommit();
      tick();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Custom warning message',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  // =========================================================================
  // NEW TESTS — Sort and pagination
  // =========================================================================

  describe('onSortChange and onPageChange', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update sortColumn and sortDirection on sort change', () => {
      component.onSortChange({ column: 'product', direction: 'A' });
      expect(component['sortColumn']()).toBe('product');
      expect(component['sortDirection']()).toBe('A');
    });

    it('should reset page index to 0 on sort change', () => {
      component['currentPageIndex'].set(3);
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component['currentPageIndex']()).toBe(0);
    });

    it('should update pageIndex and pageSize on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 });
      expect(component['currentPageIndex']()).toBe(2);
      expect(component['currentPageSize']()).toBe(25);
    });
  });

  // =========================================================================
  // NEW TESTS — tableData computed
  // =========================================================================

  describe('tableData computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
      const rows = [
        { unitId: 'B', collectionDate: '25-MAY-2026', product: '001', expirationDate: '10-JUN-2026', class: 'Regular', warehouseId: 'W1', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 1 },
        { unitId: 'A', collectionDate: '26-MAY-2026', product: '002', expirationDate: '11-JUN-2026', class: 'Special', warehouseId: 'W2', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 2 },
        { unitId: 'C', collectionDate: '24-MAY-2026', product: '003', expirationDate: '09-JUN-2026', class: 'Regular', warehouseId: 'W3', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 3 },
      ];
      component['scannedUnits'].set(rows);
    });

    it('should sort ascending by unitId', () => {
      component['sortColumn'].set('unitId');
      component['sortDirection'].set('A');
      const data = component.tableData();
      expect(data[0].unitId).toBe('A');
      expect(data[1].unitId).toBe('B');
      expect(data[2].unitId).toBe('C');
    });

    it('should sort descending by unitId', () => {
      component['sortColumn'].set('unitId');
      component['sortDirection'].set('D');
      const data = component.tableData();
      expect(data[0].unitId).toBe('C');
      expect(data[2].unitId).toBe('A');
    });

    it('should sort date columns using moment parsing', () => {
      component['sortColumn'].set('collectionDate');
      component['sortDirection'].set('A');
      const data = component.tableData();
      expect(data[0].unitId).toBe('C'); // 24-MAY
      expect(data[1].unitId).toBe('B'); // 25-MAY
      expect(data[2].unitId).toBe('A'); // 26-MAY
    });

    it('should not sort when direction is default', () => {
      component['sortColumn'].set('unitId');
      component['sortDirection'].set('default');
      const data = component.tableData();
      // Original order preserved
      expect(data[0].unitId).toBe('B');
      expect(data[1].unitId).toBe('A');
      expect(data[2].unitId).toBe('C');
    });

    it('should paginate results', () => {
      component['currentPageSize'].set(2);
      component['currentPageIndex'].set(0);
      component['sortDirection'].set('default');
      const data = component.tableData();
      expect(data.length).toBe(2);
    });

    it('should return second page when pageIndex is 1', () => {
      component['currentPageSize'].set(2);
      component['currentPageIndex'].set(1);
      component['sortDirection'].set('default');
      const data = component.tableData();
      expect(data.length).toBe(1);
      expect(data[0].unitId).toBe('C');
    });
  });

  // =========================================================================
  // NEW TESTS — tableConfig computed
  // =========================================================================

  describe('tableConfig computed', () => {
    beforeEach(() => fixture.detectChanges());

    it('should include column count in unitId header', () => {
      component['scannedUnits'].set([
        { unitId: 'U1', collectionDate: '', product: '', expirationDate: '', class: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 1 },
      ]);
      const config = component.tableConfig();
      const unitIdCol = config.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol?.header).toContain('(1)');
    });

    it('should set pagination totalRecords from scannedUnits length', () => {
      component['scannedUnits'].set([
        { unitId: 'U1', collectionDate: '', product: '', expirationDate: '', class: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 1 },
        { unitId: 'U2', collectionDate: '', product: '', expirationDate: '', class: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '', sequence: 2 },
      ]);
      const config = component.tableConfig();
      expect(config.pagination?.totalRecords).toBe(2);
    });

    it('should show table on empty when canScan is true', () => {
      component['checkInTemp'].set(-20);
      const config = component.tableConfig();
      expect(config.showTableOnEmpty).toBeTrue();
    });
  });

  // =========================================================================
  // NEW TESTS — onTrayNumberKeydown
  // =========================================================================

  describe('onTrayNumberKeydown', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call onCommit and preventDefault when canCommit is true', fakeAsync(() => {
      component['parsedUnitId'].set('W633300000001');
      component['checkInTemp'].set(-20);
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });

      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      apiSpy.checkIn.and.returnValue(of(MOCK_CHECK_IN_RESPONSE));
      component.onTrayNumberKeydown(event);
      tick();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiSpy.checkIn).toHaveBeenCalled();
    }));

    it('should not call onCommit when canCommit is false', () => {
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;
      component.onTrayNumberKeydown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(apiSpy.checkIn).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // NEW TESTS — onlyNumbers
  // =========================================================================

  describe('onlyNumbers', () => {
    beforeEach(() => fixture.detectChanges());

    it('should allow digit keys', () => {
      const event = {
        key: '5', ctrlKey: false,
        target: { value: '12' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow control keys like Backspace', () => {
      const event = {
        key: 'Backspace', ctrlKey: false,
        target: { value: '' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Tab key', () => {
      const event = {
        key: 'Tab', ctrlKey: false,
        target: { value: '' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+a', () => {
      const event = {
        key: 'a', ctrlKey: true,
        target: { value: '123' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow Ctrl+c', () => {
      const event = {
        key: 'c', ctrlKey: true,
        target: { value: '123' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow dot character', () => {
      const event = {
        key: '.', ctrlKey: false,
        target: { value: '12' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should allow minus/dash character', () => {
      const event = {
        key: '-', ctrlKey: false,
        target: { value: '' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeTrue();
    });

    it('should block alphabetic characters', () => {
      const event = {
        key: 'a', ctrlKey: false,
        target: { value: '12' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block input when value length is >= 7', () => {
      const event = {
        key: '1', ctrlKey: false,
        target: { value: '1234567' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault'),
      } as unknown as KeyboardEvent;
      expect(component.onlyNumbers(event)).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // NEW TESTS — loadWarehouseName
  // =========================================================================

  describe('loadWarehouseName', () => {
    it('should set resolvedWarehouseLabel when warehouse matches', fakeAsync(() => {
      apiSpy.getChapterWarehouses.and.returnValue(of([
        { warehouseId: 'W2', warehouseName: 'Home Warehouse' },
        { warehouseId: 'W3', warehouseName: 'Remote Warehouse' },
      ]));
      fixture.detectChanges();
      tick();
      expect(component['resolvedWarehouseLabel']()).toBe('W2 - Home Warehouse');
    }));

    it('should not set label when no match found', fakeAsync(() => {
      apiSpy.getChapterWarehouses.and.returnValue(of([
        { warehouseId: 'W5', warehouseName: 'Other Warehouse' },
      ]));
      fixture.detectChanges();
      tick();
      expect(component['resolvedWarehouseLabel']()).toBe('');
    }));

    it('should not call API when chapterId is falsy', fakeAsync(() => {
      headerSpy.getCurrentChapterId.and.returnValue('');
      apiSpy.getChapterWarehouses.calls.reset();
      fixture.detectChanges();
      tick();
      expect(apiSpy.getChapterWarehouses).not.toHaveBeenCalled();
    }));

    it('should not call API when warehouseId is falsy', fakeAsync(() => {
      headerSpy.getCurrentWarehouseId.and.returnValue('');
      apiSpy.getChapterWarehouses.calls.reset();
      fixture.detectChanges();
      tick();
      expect(apiSpy.getChapterWarehouses).not.toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // NEW TESTS — formatDate / formatDateTime
  // =========================================================================

  describe('formatDate and formatDateTime', () => {
    beforeEach(() => fixture.detectChanges());

    it('formatDate should return empty string for null', () => {
      expect(component['formatDate'](null)).toBe('');
    });

    it('formatDate should return empty string for undefined', () => {
      expect(component['formatDate'](undefined)).toBe('');
    });

    it('formatDate should return empty string for empty string', () => {
      expect(component['formatDate']('')).toBe('');
    });

    it('formatDate should format valid ISO date', () => {
      const result = component['formatDate']('2026-05-25T00:00:00Z');
      expect(result).toContain('25');
      expect(result).toContain('MAY');
      expect(result).toContain('2026');
    });

    it('formatDate should return empty string for invalid date', () => {
      expect(component['formatDate']('not-a-date')).toBe('');
    });

    it('formatDateTime should return empty string for null', () => {
      expect(component['formatDateTime'](null)).toBe('');
    });

    it('formatDateTime should return empty string for undefined', () => {
      expect(component['formatDateTime'](undefined)).toBe('');
    });

    it('formatDateTime should format valid ISO datetime with time', () => {
      const result = component['formatDateTime']('2026-06-10T14:30:00Z');
      expect(result).toContain('10');
      expect(result).toContain('JUN');
      expect(result).toContain('2026');
    });

    it('formatDateTime should return empty for invalid date string', () => {
      expect(component['formatDateTime']('garbage')).toBe('');
    });
  });

  // =========================================================================
  // NEW TESTS — warehouseLabel computed
  // =========================================================================

  describe('warehouseLabel computed', () => {
    it('should return warehouse id when set', () => {
      fixture.detectChanges();
      expect(component['warehouseLabel']()).toBe('W2');
    });

    it('should return empty string when warehouseId is undefined', () => {
      (headerSpy as any).warehouseId = jasmine.createSpy('warehouseId').and.returnValue('undefined');
      fixture = TestBed.createComponent(WarehouseCheckIn);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component['warehouseLabel']()).toBe('');
    });

    it('should return empty string when warehouseId is falsy', () => {
      (headerSpy as any).warehouseId = jasmine.createSpy('warehouseId').and.returnValue('');
      fixture = TestBed.createComponent(WarehouseCheckIn);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component['warehouseLabel']()).toBe('');
    });
  });

  // =========================================================================
  // NEW TESTS — Form accessors
  // =========================================================================

  describe('Form control getters', () => {
    beforeEach(() => fixture.detectChanges());

    it('tempFormControl should return tempForm controls', () => {
      expect(component.tempFormControl).toBe(component.tempForm.controls);
    });

    it('scanFormControl should return scanForm controls', () => {
      expect(component.scanFormControl).toBe(component.scanForm.controls);
    });
  });

  // =========================================================================
  // NEW TESTS — productCode valueChanges subscription
  // =========================================================================

  describe('productCode valueChanges', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call runValidateAll when productCode changes and unitId is set', fakeAsync(() => {
      component['parsedUnitId'].set('W633300000001');
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));

      component.scanForm.patchValue({ productCode: '69101000' }); // emitEvent: true
      tick();

      expect(apiSpy.validateAll).toHaveBeenCalled();
    }));

    it('should not call runValidateAll when productCode changes to empty', fakeAsync(() => {
      apiSpy.validateAll.calls.reset();
      component.scanForm.patchValue({ productCode: '' });
      tick();
      expect(apiSpy.validateAll).not.toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // NEW TESTS — deviceNumber valueChanges subscription
  // =========================================================================

  describe('deviceNumber valueChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['locationWarehouseId'] = 'W2';
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
      component.deviceOptions.set(MOCK_DEVICE_OPTIONS);
    });

    it('should capture deviceType and clear racks/trays when device changes', fakeAsync(() => {
      component['rackOptions'].set(MOCK_RACK_OPTIONS);
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      apiSpy.getLocationLookup.and.returnValue(of(MOCK_RACK_OPTIONS));

      component.scanForm.patchValue({ deviceNumber: '10' }); // emitEvent: true
      tick();

      expect(component['selectedDeviceType']).toBe('C');
      expect(component.scanForm.get('rackNumber')?.value).toBe('');
      expect(component.scanForm.get('trayNumber')?.value).toBe('');
    }));
  });

  // =========================================================================
  // NEW TESTS — Search filtering subscriptions
  // =========================================================================

  describe('Search filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter product options by search term', fakeAsync(() => {
      component['productOptions'].set([
        { productCode: '69101000', productDesc: 'Red Blood Cells' },
        { productCode: '69201000', productDesc: 'Platelets' },
      ]);
      component.productSearchControl.setValue('plate');
      tick();
      const filtered = component['filteredProductOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('69201000');
    }));

    it('should show all product options when search term is empty', fakeAsync(() => {
      component['productOptions'].set([
        { productCode: '69101000' },
        { productCode: '69201000' },
      ]);
      component.productSearchControl.setValue('');
      tick();
      expect(component['filteredProductOptions']().length).toBe(2);
    }));

    it('should filter device options by search term', fakeAsync(() => {
      component.deviceOptions.set(MOCK_DEVICE_OPTIONS);
      component.deviceSearchControl.setValue('device 10');
      tick();
      const filtered = component['filteredDeviceOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('10');
    }));

    it('should filter rack options by search term', fakeAsync(() => {
      component['rackOptions'].set(MOCK_RACK_OPTIONS);
      component.rackSearchControl.setValue('rack 08');
      tick();
      const filtered = component['filteredRackOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('08');
    }));

    it('should filter tray options by search term', fakeAsync(() => {
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      component.traySearchControl.setValue('t001');
      tick();
      const filtered = component['filteredTrayOptions']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('T001');
    }));

    it('should show all device options when search term is empty', fakeAsync(() => {
      component.deviceOptions.set(MOCK_DEVICE_OPTIONS);
      component.deviceSearchControl.setValue('');
      tick();
      expect(component['filteredDeviceOptions']().length).toBe(2);
    }));

    it('should show all rack options when search term is empty', fakeAsync(() => {
      component['rackOptions'].set(MOCK_RACK_OPTIONS);
      component.rackSearchControl.setValue('');
      tick();
      expect(component['filteredRackOptions']().length).toBe(2);
    }));

    it('should show all tray options when search term is empty', fakeAsync(() => {
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      component.traySearchControl.setValue('');
      tick();
      expect(component['filteredTrayOptions']().length).toBe(2);
    }));
  });

  // =========================================================================
  // NEW TESTS — rackNumber valueChanges subscription
  // =========================================================================

  describe('rackNumber valueChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['locationWarehouseId'] = 'W2';
      component.scanForm.patchValue({ productCode: '69101000', deviceNumber: '10' }, { emitEvent: false });
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
    });

    it('should clear tray options and load trays when rack changes', fakeAsync(() => {
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      apiSpy.getLocationLookup.and.returnValue(of(MOCK_TRAY_OPTIONS));

      component.scanForm.patchValue({ rackNumber: '08' }); // emitEvent: true
      tick();

      expect(component.scanForm.get('trayNumber')?.value).toBe('');
    }));
  });

  // =========================================================================
  // NEW TESTS — ngOnDestroy
  // =========================================================================

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // NEW TESTS — runValidateAll warnings flow
  // =========================================================================

  describe('runValidateAll — warnings flow', () => {
    beforeEach(() => fixture.detectChanges());

    it('should open warning dialog when response has warnings', fakeAsync(() => {
      const warningResponse: ValidateAllResponseDto = {
        ...VALID_VALIDATE_RESPONSE,
        isValid: true,
        warnings: [{ code: '9936', message: 'Verify inventory class' }],
      };
      apiSpy.validateAll.and.returnValue(of(warningResponse));
      (dialogSpy.open as jasmine.Spy).and.returnValue({ afterClosed: () => of({ override: true }) });
      apiSpy.getLocationLookup.and.returnValue(of([]));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should invalidate when user cancels warning dialog', fakeAsync(() => {
      const warningResponse: ValidateAllResponseDto = {
        ...VALID_VALIDATE_RESPONSE,
        isValid: true,
        warnings: [{ code: '9936', message: 'Verify inventory class' }],
      };
      apiSpy.validateAll.and.returnValue(of(warningResponse));
      (dialogSpy.open as jasmine.Spy).and.returnValue({ afterClosed: () => of({ override: false }) });

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(component.validationInfo()?.isValid).toBeFalse();
    }));

    it('should load location cascade when user accepts warning dialog', fakeAsync(() => {
      const warningResponse: ValidateAllResponseDto = {
        ...VALID_VALIDATE_RESPONSE,
        isValid: true,
        warnings: [{ code: '9936', message: 'Verify inventory class' }],
      };
      apiSpy.validateAll.and.returnValue(of(warningResponse));
      (dialogSpy.open as jasmine.Spy).and.returnValue({ afterClosed: () => of({ override: true }) });
      apiSpy.getLocationLookup.and.returnValue(of([]));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      // If override was accepted, location cascade should start
      expect(apiSpy.getLocationLookup).toHaveBeenCalled();
    }));

    it('should load location cascade on clean pass with no warnings', fakeAsync(() => {
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));

      component['runValidateAll']('W633300000001', '69101000');
      tick();

      expect(apiSpy.getLocationLookup).toHaveBeenCalled();
    }));

    it('should not call validateAll if unitId is empty', fakeAsync(() => {
      apiSpy.validateAll.calls.reset();
      component['runValidateAll']('', '69101000');
      tick();
      expect(apiSpy.validateAll).not.toHaveBeenCalled();
    }));

    it('should not call validateAll if productCode is empty', fakeAsync(() => {
      apiSpy.validateAll.calls.reset();
      component['runValidateAll']('W633300000001', '');
      tick();
      expect(apiSpy.validateAll).not.toHaveBeenCalled();
    }));

    it('should open dialog and mark invalid on API error with errorCode', fakeAsync(() => {
      component['validationInfo'].set({
        collectionDate: '', expirationDate: '', class: '', warehouseId: '', isValid: true,
      });
      apiSpy.validateAll.and.returnValue(throwError(() => ({ errorCode: '0313', message: 'Not found' })));
      component['runValidateAll']('W633300000001', '69101000');
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.validationInfo()?.isValid).toBeFalse();
    }));

    it('should use ERROR_CODE_MESSAGES for known error codes on invalid response', fakeAsync(() => {
      const invalidResponse: ValidateAllResponseDto = {
        ...VALID_VALIDATE_RESPONSE,
        isValid: false,
        errorCode: '9927',
        errorMessage: '',
      };
      apiSpy.validateAll.and.returnValue(of(invalidResponse));
      component['runValidateAll']('W633300000001', '69101000');
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should reject pendingValidateEvent on invalid response', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      component['pendingValidateEvent'] = event;
      const invalidResponse: ValidateAllResponseDto = {
        ...VALID_VALIDATE_RESPONSE,
        isValid: false,
        errorCode: '0313',
        errorMessage: 'Unit not found',
      };
      apiSpy.validateAll.and.returnValue(of(invalidResponse));
      component['runValidateAll']('W633300000001', '69101000');
      tick();
      expect(event.reject).toHaveBeenCalled();
    }));

    it('should confirm pendingValidateEvent on clean valid response', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      component['pendingValidateEvent'] = event;
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['runValidateAll']('W633300000001', '69101000');
      tick();
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should reject pendingValidateEvent on API error', fakeAsync(() => {
      const event = buildPostValidateEvent('W633300000001');
      component['pendingValidateEvent'] = event;
      apiSpy.validateAll.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['runValidateAll']('W633300000001', '69101000');
      tick();
      expect(event.reject).toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // NEW TESTS — setProductOptions
  // =========================================================================

  describe('setProductOptions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should auto-select productCode when only one option', fakeAsync(() => {
      component['parsedUnitId'].set('W633300000001');
      apiSpy.validateAll.and.returnValue(of(VALID_VALIDATE_RESPONSE));
      apiSpy.getLocationLookup.and.returnValue(of([]));
      component['setProductOptions']([{ productCode: '69101000' }]);
      tick();
      expect(component.scanForm.get('productCode')?.value).toBe('69101000');
    }));

    it('should not auto-select when multiple options', () => {
      component['setProductOptions']([
        { productCode: '69101000' },
        { productCode: '69102000' },
      ]);
      // Does not patch productCode automatically for multiple
      expect(component['productOptions']().length).toBe(2);
      expect(component['filteredProductOptions']().length).toBe(2);
    });

    it('should not call runValidateAll when prevCode === code (already set)', fakeAsync(() => {
      component['parsedUnitId'].set('W633300000001');
      component.scanForm.patchValue({ productCode: '69101000' }, { emitEvent: false });
      apiSpy.validateAll.calls.reset();
      component['setProductOptions']([{ productCode: '69101000' }]);
      tick();
      expect(apiSpy.validateAll).not.toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // NEW TESTS — onClearTemp resets successCount
  // =========================================================================

  describe('onClearTemp — successCount', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset successCount to 0 on clear', () => {
      component['successCount'].set(5);
      component.onClearTemp();
      expect(component.successCount()).toBe(0);
    });
  });

  // =========================================================================
  // NEW TESTS — onUnitIdCleared additional resets
  // =========================================================================

  describe('onUnitIdCleared — additional resets', () => {
    beforeEach(() => fixture.detectChanges());

    it('should clear productOptions and filteredProductOptions', () => {
      component['productOptions'].set([{ productCode: '69101000' }]);
      component['filteredProductOptions'].set([{ productCode: '69101000' }]);
      component.onUnitIdCleared();
      expect(component['productOptions']()).toEqual([]);
      expect(component['filteredProductOptions']()).toEqual([]);
    });

    it('should clear unitProducts', () => {
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
      component.onUnitIdCleared();
      expect(component['unitProducts']()).toEqual([]);
    });

    it('should reset location state', () => {
      component.deviceOptions.set(MOCK_DEVICE_OPTIONS);
      component['rackOptions'].set(MOCK_RACK_OPTIONS);
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      component.onUnitIdCleared();
      expect(component.deviceOptions()).toEqual([]);
      expect(component['rackOptions']()).toEqual([]);
      expect(component['trayOptions']()).toEqual([]);
    });

    it('should clear pendingValidateEvent', () => {
      component['pendingValidateEvent'] = buildPostValidateEvent('X');
      component.onUnitIdCleared();
      expect(component['pendingValidateEvent']).toBeNull();
    });
  });

  // =========================================================================
  // NEW TESTS — resetLocationState
  // =========================================================================

  describe('resetLocationState', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset all location-related state', () => {
      component['locationWarehouseId'] = 'W2';
      component['selectedDeviceType'] = 'C';
      component.deviceOptions.set(MOCK_DEVICE_OPTIONS);
      component['rackOptions'].set(MOCK_RACK_OPTIONS);
      component['trayOptions'].set(MOCK_TRAY_OPTIONS);
      component['filteredDeviceOptions'].set(MOCK_DEVICE_OPTIONS);
      component['filteredRackOptions'].set(MOCK_RACK_OPTIONS);
      component['filteredTrayOptions'].set(MOCK_TRAY_OPTIONS);
      component['deviceError'].set('some error');
      component['rackError'].set('some error');
      component['trayError'].set('some error');
      component['locationLoading'].set(true);

      component['resetLocationState']();

      expect(component['locationWarehouseId']).toBeNull();
      expect(component['selectedDeviceType']).toBeNull();
      expect(component.deviceOptions()).toEqual([]);
      expect(component['rackOptions']()).toEqual([]);
      expect(component['trayOptions']()).toEqual([]);
      expect(component['filteredDeviceOptions']()).toEqual([]);
      expect(component['filteredRackOptions']()).toEqual([]);
      expect(component['filteredTrayOptions']()).toEqual([]);
      expect(component['deviceError']()).toBeNull();
      expect(component['rackError']()).toBeNull();
      expect(component['trayError']()).toBeNull();
      expect(component['locationLoading']()).toBeFalse();
    });
  });

  // =========================================================================
  // NEW TESTS — clearScanFields direct
  // =========================================================================

  describe('clearScanFields — direct', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['parsedUnitId'].set('W633300000001');
      component['unitProducts'].set([MOCK_UNIT_PRODUCT]);
      component['productOptions'].set([{ productCode: '69101000' }]);
      component['filteredProductOptions'].set([{ productCode: '69101000' }]);
      component.scanForm.patchValue(
        { productCode: '69101000', deviceNumber: '10', rackNumber: '08', trayNumber: 'T001' },
        { emitEvent: false }
      );
      component['validationInfo'].set({
        collectionDate: '25-MAY-2026', expirationDate: '10-JUN-2026',
        class: 'Regular', warehouseId: 'W1', isValid: true,
      });
    });

    it('should reset all scan-related state', () => {
      component.clearScanFields();
      expect(component['parsedUnitId']()).toBeNull();
      expect(component['unitProducts']()).toEqual([]);
      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('deviceNumber')?.value).toBe('');
      expect(component.scanForm.get('rackNumber')?.value).toBe('');
      expect(component.scanForm.get('trayNumber')?.value).toBe('');
      expect(component['productOptions']()).toEqual([]);
      expect(component['filteredProductOptions']()).toEqual([]);
      expect(component.validationInfo()).toBeNull();
    });

    it('should mark form as untouched and pristine', () => {
      component.scanForm.markAsTouched();
      component.scanForm.markAsDirty();
      component.clearScanFields();
      expect(component.scanForm.untouched).toBeTrue();
      expect(component.scanForm.pristine).toBeTrue();
    });
  });

  // =========================================================================
  // NEW TESTS — showSuccess / showError / showWarning
  // =========================================================================

  describe('snackBar methods', () => {
    beforeEach(() => fixture.detectChanges());

    it('showSuccess should use DISMISS button', () => {
      component['showSuccess']('Test success');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Test success', 'DISMISS', jasmine.any(Object));
    });

    it('showError should use Close button', () => {
      component['showError']('Test error');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Test error', 'Close', jasmine.any(Object));
    });

    it('showWarning should use DISMISS button', () => {
      component['showWarning']('Test warning');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Test warning', 'DISMISS', jasmine.any(Object));
    });
  });
});
