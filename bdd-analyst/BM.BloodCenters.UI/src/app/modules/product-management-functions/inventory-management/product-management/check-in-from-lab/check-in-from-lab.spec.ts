import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ActivatedRoute } from '@angular/router';
import { CheckInFromLabComponent, ERROR_CODES, CheckInRecord } from './check-in-from-lab';
import { CheckInFromLabService } from './check-in-from-lab.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';

describe('CheckInFromLabComponent', () => {
  let component: CheckInFromLabComponent;
  let fixture: ComponentFixture<CheckInFromLabComponent>;
  let checkInServiceSpy: jasmine.SpyObj<CheckInFromLabService>;
  let headerServiceSpy: any;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: any;
  let chapterTimezoneSpy: any;
  let labelScanServiceSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let chapterChanged$: Subject<void>;

  const mockInventoryClasses = [
    { code: 'RE', description: 'Regular' },
    { code: 'AD', description: 'Autologous' },
  ];

  const mockDevices = [
    { deviceId: 'D01', deviceName: 'Freezer 1' },
    { deviceId: 'D02', deviceName: null },
  ];

  const mockRacks = [
    { rackId: 'R01', rackName: 'Rack A' },
    { rackId: 'R02', rackName: null },
  ];

  const mockTrays = [
    { trayId: 'T01', trayName: 'Tray 1', capacity: 10, used: 5, available: 5 },
    { trayId: 'T02', trayName: 'Tray 2', capacity: 10, used: 10, available: 0 },
  ];

  const mockProducts = [
    { productCode: 'E2807D00', productType: 'FFP', componentStatus: 'A' },
    { productCode: 'E2808D00', productType: 'RBC', componentStatus: 'A' },
  ];

  const mockAliquots = [
    { aliquot: '00', componentStatus: 'A' },
    { aliquot: '01', componentStatus: 'A' },
  ];

  const mockAboTypes = [
    { aboCode: '62', aboDescription: 'A Pos' },
    { aboCode: '63', aboDescription: 'B Pos' },
  ];

  const mockUnitValidation = {
    success: true,
    message: '',
    statusCode: 200,
    data: {
      unitId: 'W1234-18-031401',
      collDate: '2018-01-03T00:00:00',
      groupSiteId: null,
      contractType: null,
      driveId: null,
      osokFlag: 'N',
      importFlag: 'N',
    },
  };

  const mockProductValidation = {
    success: true,
    message: '',
    statusCode: 200,
    data: {
      productCode: 'E2807D00',
      invProductType: 'FFP',
      isPoolProduct: false,
      autoExpiryDate: null,
      componentStatus: 'A',
      expiryDate: '2018-01-08T23:59:00',
      isLicensed: 'Y',
    },
  };

  const mockComponentValidation = {
    success: true,
    message: '',
    statusCode: 200,
    data: { isCleared: true, interdictionType: null, interdictionCode: null },
  };

  const mockAboValidation = {
    success: true,
    message: '',
    statusCode: 200,
    data: { isValid: true, aboDescription: 'A Pos', isPoolProduct: false, systemLabelDecision: null },
  };

  const mockLocationValidation = {
    success: true,
    message: '',
    statusCode: 200,
    data: { isValid: true, locationId: 'LOC001', availableCapacity: 5 },
  };

  const mockCheckInResponse = {
    success: true,
    message: '1 Entries transferred.',
    statusCode: 200,
    data: {} as any,
  };

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();

    checkInServiceSpy = jasmine.createSpyObj('CheckInFromLabService', [
      'getInventoryClasses', 'validateUnit', 'getProducts', 'validateProduct',
      'getAliquots', 'getAboTypes', 'validateComponent', 'validateAbo',
      'validateExpiry', 'validateReceiveDate', 'getDevices', 'getRacks',
      'getTrays', 'validateLocation', 'checkIn', 'getBaseAboValue', 'getList',
    ]);

    headerServiceSpy = {
      warehouseId: signal('W'),
      chapterChanged$,
    };

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    pageHeaderServiceSpy = {
      pageHeaderData: signal(null),
      getTitle: jasmine.createSpy('getTitle').and.returnValue(''),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(''),
    };

    chapterTimezoneSpy = {
      chapterLocalDate: signal({
        isValid: () => true,
        format: (fmt: string) => '07-27-26 10:00',
      }),
      getChapterLocalDate: () => ({
        toISOString: () => '2026-07-27T10:00:00.000Z',
      }),
    };

    labelScanServiceSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan', 'validateAboScan', 'validateExpiryScan',
    ]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpy.createUrlTree.and.returnValue({});
    routerSpy.serializeUrl.and.returnValue('');
    (routerSpy as any).events = of();

    const translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.callFake((key: string) => key);
    translateSpy.get.and.callFake((key: string) => of(key));

    // Default return values
    checkInServiceSpy.getInventoryClasses.and.returnValue(of(mockInventoryClasses));
    checkInServiceSpy.validateUnit.and.returnValue(of(mockUnitValidation));
    checkInServiceSpy.getProducts.and.returnValue(of(mockProducts));
    checkInServiceSpy.validateProduct.and.returnValue(of(mockProductValidation));
    checkInServiceSpy.getAliquots.and.returnValue(of(mockAliquots));
    checkInServiceSpy.getAboTypes.and.returnValue(of(mockAboTypes));
    checkInServiceSpy.validateComponent.and.returnValue(of(mockComponentValidation));
    checkInServiceSpy.validateAbo.and.returnValue(of(mockAboValidation));
    checkInServiceSpy.validateExpiry.and.returnValue(of({ success: true, message: '', statusCode: 200, data: { isValid: true, componentExpiryDate: null, enteredExpiryDate: null, chapterLocalDate: '' } }));
    checkInServiceSpy.validateReceiveDate.and.returnValue(of({ success: true, message: '', statusCode: 200, data: { isValid: true, maxAllowedDate: '', chapterLocalDate: '' } }));
    checkInServiceSpy.getDevices.and.returnValue(of(mockDevices));
    checkInServiceSpy.getRacks.and.returnValue(of(mockRacks));
    checkInServiceSpy.getTrays.and.returnValue(of(mockTrays));
    checkInServiceSpy.validateLocation.and.returnValue(of(mockLocationValidation));
    checkInServiceSpy.checkIn.and.returnValue(of(mockCheckInResponse));
    checkInServiceSpy.getBaseAboValue.and.returnValue(of({ aboValue: '62', baseAboValue: 'A' }));
    checkInServiceSpy.getList.and.returnValue(of({ data: [], total: 0 }));

    labelScanServiceSpy.validateProductScan.and.returnValue(of({
      success: true, message: '', statusCode: 200, errorCode: null, errorResponse: null,
      item: { isValid: true, productCode: 'E2807D00', productDescription: 'FFP', entryMode: 'S' },
    }));
    labelScanServiceSpy.validateAboScan.and.returnValue(of({
      success: true, message: '', statusCode: 200, errorCode: null, errorResponse: null,
      item: { isValid: true, aboCode: '62', aboLabel: 'A+', aboShortName: 'A Pos', entryMode: 'S' },
    }));
    labelScanServiceSpy.validateExpiryScan.and.returnValue(of({
      success: true, message: '', statusCode: 200, errorCode: null, errorResponse: null,
      item: { isValid: true, expiryDate: '2026-08-01T00:00:00', expiryDisplay: '01-AUG-2026', hasTime: false, entryMode: 'S' },
    }));

    await TestBed.configureTestingModule({
      imports: [CheckInFromLabComponent, NoopAnimationsModule],
      providers: [
        { provide: CheckInFromLabService, useValue: checkInServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } },
      ],
    })
    .overrideComponent(CheckInFromLabComponent, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MatDialog, useValue: dialogSpy },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckInFromLabComponent);
    component = fixture.componentInstance;

    assignViewChildMocks();
  });

  function assignViewChildMocks(): void {
    component.unitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear'], {
      isValid: true,
      parsedUnitId: 'W1234-18-031401',
      unitIdInput: { nativeElement: { focus: jasmine.createSpy() } },
    });
    component.productCodeField = jasmine.createSpyObj('ScanSelectFieldComponent', ['clear']);
    component.aboRhField = jasmine.createSpyObj('ScanSelectFieldComponent', ['clear']);
  }

  function initComponent(): void {
    fixture.detectChanges();
    assignViewChildMocks();
  }

  // ─── 1. Component creation & initialization ────────────────────────────────

  describe('Component creation & initialization', () => {
    it('should create the component', () => {
      initComponent();
      expect(component).toBeTruthy();
    });

    it('should load inventory classes on init', fakeAsync(() => {
      initComponent();
      tick();
      expect(checkInServiceSpy.getInventoryClasses).toHaveBeenCalled();
      expect(component.inventoryClasses().length).toBe(2);
    }));

    it('should load devices on init when warehouseId is set', fakeAsync(() => {
      initComponent();
      tick();
      expect(checkInServiceSpy.getDevices).toHaveBeenCalledWith('W');
    }));

    it('should not show entry row initially', fakeAsync(() => {
      initComponent();
      tick();
      expect(component.showEntryRow()).toBe(false);
    }));

    it('should set receivedDate from chapterLocalDate effect', fakeAsync(() => {
      initComponent();
      tick();
      const rcvValue = component.filterForm.get('receivedDate')?.value;
      expect(rcvValue).toBe('07-27-26 10:00');
    }));
  });

  // ─── 2. Filter form - Inventory class selection ────────────────────────────

  describe('Filter form - Inventory class selection', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should show entry row when inventory class is selected', fakeAsync(() => {
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      expect(component.showEntryRow()).toBe(true);
    }));

    it('should set inventoryClassDescription from selected code', fakeAsync(() => {
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      expect(component.inventoryClassDescription()).toBe('Regular');
    }));

    it('should hide entry row when inventory class is cleared', fakeAsync(() => {
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      component.filterForm.get('inventoryClassCode')?.setValue(null);
      tick();
      expect(component.showEntryRow()).toBe(false);
    }));

    it('should clear grid data when inventory class is cleared', fakeAsync(() => {
      component.gridData.set([{ unitId: 'U1' } as CheckInRecord]);
      component.filterForm.get('inventoryClassCode')?.setValue(null);
      tick();
      expect(component.gridData().length).toBe(0);
    }));

    it('should set inventoryClassDescription to dash when code not found', fakeAsync(() => {
      component.filterForm.get('inventoryClassCode')?.setValue('UNKNOWN');
      tick();
      expect(component.inventoryClassDescription()).toBe('-');
    }));
  });

  // ─── 3. Unit validation flow ──────────────────────────────────────────────

  describe('Unit validation flow - onUnitPostValidate', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should confirm event on successful unit validation', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(checkInServiceSpy.validateUnit).toHaveBeenCalledWith({ unitId: 'W1234-18-031401' });
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should set collection date on successful validation', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(component.collectionDate()).toBe('03-JAN-2018');
    }));

    it('should load products after unit validation', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(checkInServiceSpy.getProducts).toHaveBeenCalledWith('W1234-18-031401', '2018-01-03T00:00:00');
      expect(component.unitProducts().length).toBe(2);
    }));

    it('should reject when validation returns unsuccessful', fakeAsync(() => {
      checkInServiceSpy.validateUnit.and.returnValue(of({
        success: false, message: 'Unit not found', statusCode: 404, data: null as any,
      }));

      const event = {
        data: { parsedUnitId: 'BADUNIT', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit not found');
      expect(event.confirm).not.toHaveBeenCalled();
    }));

    it('should reject on API error', fakeAsync(() => {
      checkInServiceSpy.validateUnit.and.returnValue(throwError(() => new Error('Server error')));

      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Failed to validate unit. Please try again.');
    }));

    it('should clear product/ABO fields before loading new products', fakeAsync(() => {
      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');

      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(component.selectedProductCode()).toBeNull();
      expect(component.selectedAboRh()).toBeNull();
      expect(component.productCodeField.clear).toHaveBeenCalled();
      expect(component.aboRhField.clear).toHaveBeenCalled();
    }));

    it('should reject with default message when response has no message', fakeAsync(() => {
      checkInServiceSpy.validateUnit.and.returnValue(of({
        success: false, message: null as any, statusCode: 404, data: null as any,
      }));

      const event = {
        data: { parsedUnitId: 'BADUNIT', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit ID not found.');
    }));
  });

  describe('Unit cleared - onUnitCleared', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should clear all unit-related signals', () => {
      component.collectionDate.set('03-JAN-2018');
      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');

      component.onUnitCleared();

      expect(component.collectionDate()).toBe('');
      expect(component.selectedProductCode()).toBeNull();
      expect(component.selectedAboRh()).toBeNull();
      expect(component.unitProducts().length).toBe(0);
      expect(component.aliquotOptions().length).toBe(0);
      expect(component.aboTypes().length).toBe(0);
    });
  });

  // ─── 4. Product code flow ────────────────────────────────────────────────

  describe('Product code flow - onProductCodeChanged', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      // Simulate unit already validated
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
    }));

    it('should set selectedProductCode and trigger validation', fakeAsync(() => {
      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(component.selectedProductCode()).toBe('E2807D00');
      expect(checkInServiceSpy.validateProduct).toHaveBeenCalled();
    }));

    it('should load aliquots after product validation', fakeAsync(() => {
      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(checkInServiceSpy.getAliquots).toHaveBeenCalled();
      expect(component.aliquotOptions().length).toBe(2);
    }));

    it('should auto-select single aliquot', fakeAsync(() => {
      checkInServiceSpy.getAliquots.and.returnValue(of([{ aliquot: '00', componentStatus: 'A' }]));

      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(component.entryForm.get('aliquot')?.value).toBe('00');
    }));

    it('should load ABO types for non-pool product', fakeAsync(() => {
      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(checkInServiceSpy.getAboTypes).toHaveBeenCalled();
      expect(component.aboTypes().length).toBe(2);
    }));

    it('should set ABO to PO for pool product', fakeAsync(() => {
      checkInServiceSpy.validateProduct.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { productCode: 'POOL0100', invProductType: 'PLT', isPoolProduct: true, autoExpiryDate: null, componentStatus: 'A', expiryDate: null, isLicensed: 'Y' },
      }));

      component.onProductCodeChanged({ code: 'POOL0100', description: 'POOL0100' });
      tick();

      expect(component.aboTypes()).toEqual([{ aboCode: 'PO', aboDescription: 'POOL' }]);
    }));

    it('should clear product code on null option', fakeAsync(() => {
      component.selectedProductCode.set('E2807D00');
      component.onProductCodeChanged(null);
      tick();

      expect(component.selectedProductCode()).toBeNull();
    }));
  });

  describe('Product code - Code128 aliquot auto-extraction', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
    }));

    it('should auto-extract aliquot from 8-char Code128 product code', fakeAsync(() => {
      checkInServiceSpy.getAliquots.and.returnValue(of([
        { aliquot: '00', componentStatus: 'A' },
        { aliquot: '01', componentStatus: 'A' },
        { aliquot: '02', componentStatus: 'A' },
      ]));

      component.onProductCodeChanged({ code: 'E2807D02', description: 'E2807D02' });
      tick();

      expect(component.entryForm.get('aliquot')?.value).toBe('02');
    }));
  });

  // ─── 5. Aliquot validation and interdiction check ─────────────────────────

  describe('Aliquot validation and interdiction check', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
      component.selectedProductCode.set('E2807D00');
    }));

    it('should call validateComponent when aliquot changes', fakeAsync(() => {
      component.entryForm.get('aliquot')?.setValue('00');
      tick();

      expect(checkInServiceSpy.validateComponent).toHaveBeenCalled();
    }));

    it('should clear aliquot on interdiction failure', fakeAsync(() => {
      checkInServiceSpy.validateComponent.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isCleared: false, interdictionType: 'HOLD', interdictionCode: '3721' },
      }));

      component.entryForm.get('aliquot')?.setValue('00');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should load ABO types after successful interdiction check for non-pool product', fakeAsync(() => {
      checkInServiceSpy.getAboTypes.calls.reset();
      component.entryForm.get('aliquot')?.setValue('00');
      tick();

      expect(checkInServiceSpy.getAboTypes).toHaveBeenCalled();
    }));

    it('should show error on validateComponent API failure', fakeAsync(() => {
      checkInServiceSpy.validateComponent.and.returnValue(throwError(() => new Error('fail')));

      component.entryForm.get('aliquot')?.setValue('00');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to check component interdictions.',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 }),
      );
    }));
  });

  // ─── 6. ABO/Rh validation ────────────────────────────────────────────────

  describe('ABO/Rh validation', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
      component.selectedProductCode.set('E2807D00');
    }));

    it('should set selectedAboRh on ABO change', () => {
      component.onAboRhChanged({ code: '62', description: 'A Pos' });
      expect(component.selectedAboRh()).toBe('62');
    });

    it('should validate ABO when non-pool product', fakeAsync(() => {
      component.onAboRhChanged({ code: '62', description: 'A Pos' });
      tick();

      expect(checkInServiceSpy.validateAbo).toHaveBeenCalled();
    }));

    it('should clear ABO and show error on invalid blood type', fakeAsync(() => {
      checkInServiceSpy.validateAbo.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: false, aboDescription: null, isPoolProduct: false, systemLabelDecision: null },
      }));

      component.onAboRhChanged({ code: 'XX', description: 'Invalid' });
      tick();

      expect(component.selectedAboRh()).toBeNull();
      expect(component.aboRhField.clear).toHaveBeenCalled();
    }));

    it('should clear selectedAboRh on ABO cleared', () => {
      component.selectedAboRh.set('62');
      component.onAboRhCleared();
      expect(component.selectedAboRh()).toBeNull();
    });
  });

  // ─── 7. Received date validation ─────────────────────────────────────────

  describe('Received date validation - onReceivedDateBlur', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should validate the received date', fakeAsync(() => {
      component.filterForm.patchValue({ receivedDate: '07-27-26 10:00' });
      component.onReceivedDateBlur();
      tick();

      expect(checkInServiceSpy.validateReceiveDate).toHaveBeenCalledWith({ receiveDate: '07-27-26 10:00' });
    }));

    it('should show error and reset date on invalid received date', fakeAsync(() => {
      checkInServiceSpy.validateReceiveDate.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: false, maxAllowedDate: '', chapterLocalDate: '' },
      }));

      component.filterForm.patchValue({ receivedDate: '12-31-99 00:00' });
      component.onReceivedDateBlur();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should do nothing when received date is empty', fakeAsync(() => {
      component.filterForm.patchValue({ receivedDate: '' });
      component.onReceivedDateBlur();
      tick();

      expect(checkInServiceSpy.validateReceiveDate).not.toHaveBeenCalled();
    }));

    it('should show error on API failure', fakeAsync(() => {
      checkInServiceSpy.validateReceiveDate.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ receivedDate: '07-27-26 10:00' });
      component.onReceivedDateBlur();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to validate receive date.',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 }),
      );
    }));
  });

  // ─── 8. Expiration date - onExpirationDateBlur ────────────────────────────

  describe('Expiration date - onExpirationDateBlur', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
      component.selectedProductCode.set('E2807D00');
    }));

    it('should validate expiry via label scan service', fakeAsync(() => {
      component.entryForm.patchValue({ expirationDate: '01-AUG-2026' });
      component.onExpirationDateBlur();
      tick();

      expect(labelScanServiceSpy.validateExpiryScan).toHaveBeenCalled();
    }));

    it('should cross-check expiry with API after label scan success', fakeAsync(() => {
      component.entryForm.patchValue({ expirationDate: '01-AUG-2026' });
      component.onExpirationDateBlur();
      tick();

      expect(checkInServiceSpy.validateExpiry).toHaveBeenCalled();
    }));

    it('should clear expiry and show error on invalid scan', fakeAsync(() => {
      labelScanServiceSpy.validateExpiryScan.and.returnValue(of({
        success: false, message: 'Bad date', statusCode: 400, errorCode: null,
        errorResponse: { errorCode: '', error: 'Invalid expiry date' },
        item: null,
      }));

      component.entryForm.patchValue({ expirationDate: 'BADDATE' });
      component.onExpirationDateBlur();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.entryForm.get('expirationDate')?.value).toBe('');
    }));

    it('should do nothing when expiration date is empty', fakeAsync(() => {
      component.entryForm.patchValue({ expirationDate: '' });
      component.onExpirationDateBlur();
      tick();

      expect(labelScanServiceSpy.validateExpiryScan).not.toHaveBeenCalled();
    }));
  });

  // ─── 9. Location cascades ────────────────────────────────────────────────

  describe('Location cascades - device/rack/tray', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should load racks when device changes', fakeAsync(() => {
      component.selectedAboRh.set('62');
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();

      component.entryForm.get('device')?.setValue('D01');
      tick();

      expect(checkInServiceSpy.getBaseAboValue).toHaveBeenCalledWith('62');
    }));

    it('should clear racks and trays when device changes', fakeAsync(() => {
      component.racks.set(mockRacks);
      component.trays.set(mockTrays);

      component.entryForm.get('device')?.setValue('D01');
      tick();

      // After setting a new device, old racks/trays should have been cleared then reloaded
      expect(checkInServiceSpy.getRacks).toHaveBeenCalled();
    }));

    it('should load trays when rack changes', fakeAsync(() => {
      component.entryForm.patchValue({ device: 'D01' }, { emitEvent: false });
      component.entryForm.get('rack')?.setValue('R01');
      tick();

      expect(checkInServiceSpy.getTrays).toHaveBeenCalledWith('W', 'D01', 'R01', '', '', '');
    }));

    it('should clear trays when rack changes', fakeAsync(() => {
      component.trays.set(mockTrays);
      component.entryForm.patchValue({ device: 'D01' }, { emitEvent: false });

      component.entryForm.get('rack')?.setValue('R01');
      tick();

      expect(checkInServiceSpy.getTrays).toHaveBeenCalled();
    }));

    it('should load racks without base ABO when bloodType is empty', fakeAsync(() => {
      component.selectedAboRh.set(null);
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();

      component.entryForm.get('device')?.setValue('D01');
      tick();

      expect(checkInServiceSpy.getBaseAboValue).not.toHaveBeenCalled();
      expect(checkInServiceSpy.getRacks).toHaveBeenCalledWith('W', 'D01', 'RE', '', '');
    }));

    it('should not load racks when warehouseId is empty', fakeAsync(() => {
      (headerServiceSpy.warehouseId as any) = signal('');
      component.entryForm.get('device')?.setValue('D01');
      tick();

      // getRacks should not have been called for an empty warehouse
      expect(checkInServiceSpy.getRacks).not.toHaveBeenCalled();
    }));
  });

  // ─── 10. Tray tab-out and check-in ───────────────────────────────────────

  describe('Tray tab-out and check-in - onTrayTabOut, submitCheckIn', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();

      // Set up a full valid entry scenario
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();

      component.entryForm.patchValue({
        aliquot: '00',
        expirationDate: '08-JAN-2018',
        device: 'D01',
        rack: 'R01',
        tray: 'T01',
      }, { emitEvent: false });
    }));

    it('should validate location and then check in on tray tab-out', fakeAsync(() => {
      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.validateLocation).toHaveBeenCalled();
      expect(checkInServiceSpy.checkIn).toHaveBeenCalled();
    }));

    it('should reload grid from server on successful check-in', fakeAsync(() => {
      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.getList).toHaveBeenCalled();
    }));

    it('should show toast on successful check-in', fakeAsync(() => {
      component.onTrayTabOut();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringMatching(/Entries transferred/),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] }),
      );
    }));

    it('should not submit when isSaving is true', fakeAsync(() => {
      component.isSaving.set(true);
      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.validateLocation).not.toHaveBeenCalled();
    }));

    it('should not submit when tray is empty', fakeAsync(() => {
      component.entryForm.patchValue({ tray: null }, { emitEvent: false });
      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.validateLocation).not.toHaveBeenCalled();
    }));

    it('should show error on invalid location', fakeAsync(() => {
      checkInServiceSpy.validateLocation.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: false, locationId: '', availableCapacity: 0 },
      }));

      component.onTrayTabOut();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(checkInServiceSpy.checkIn).not.toHaveBeenCalled();
    }));

    it('should show tray-full dialog when availableCapacity is 0', fakeAsync(() => {
      checkInServiceSpy.validateLocation.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: true, locationId: 'LOC001', availableCapacity: 0 },
      }));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

      component.onTrayTabOut();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should proceed with check-in when user confirms tray-full dialog', fakeAsync(() => {
      checkInServiceSpy.validateLocation.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: true, locationId: 'LOC001', availableCapacity: 0 },
      }));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.checkIn).toHaveBeenCalled();
    }));
  });

  // ─── 11. Error handling - mapApiError ─────────────────────────────────────

  describe('Error handling - mapApiError with error codes', () => {
    it('should return known message for ALREADY_CHECKED_IN code', () => {
      const result = component.mapApiError({ errorCode: ERROR_CODES.ALREADY_CHECKED_IN });
      expect(result).toBe('Product already checked in.');
    });

    it('should return known message for SHIPPED_NOT_RETURNED code', () => {
      const result = component.mapApiError({ errorCode: ERROR_CODES.SHIPPED_NOT_RETURNED });
      expect(result).toBe('Product has been shipped and not returned.');
    });

    it('should return known message for QUARANTINED code', () => {
      const result = component.mapApiError({ errorCode: ERROR_CODES.QUARANTINED });
      expect(result).toBe('Product is on quarantine.');
    });

    it('should return known message for COMPONENT_INTERDICTED from nested errorResponse', () => {
      const result = component.mapApiError({ errorResponse: { errorCode: ERROR_CODES.COMPONENT_INTERDICTED } });
      expect(result).toBe('Component has interdictions.');
    });

    it('should return fallback message for unknown error code', () => {
      const result = component.mapApiError({ errorCode: '9999', message: 'Fallback message' });
      expect(result).toBe('Fallback message');
    });

    it('should return empty string when no error code and no message', () => {
      const result = component.mapApiError({});
      expect(result).toBe('');
    });

    it('should return known message for BIO_HOLD_NFT code', () => {
      const result = component.mapApiError({ errorCode: ERROR_CODES.BIO_HOLD_NFT });
      expect(result).toBe('Product is BIO, HOLD, or NFT and cannot be checked in.');
    });

    it('should return known message for FUTURE_DATE code', () => {
      const result = component.mapApiError({ errorCode: ERROR_CODES.FUTURE_DATE });
      expect(result).toBe('Date cannot be in the future.');
    });

    it('should return known message for EXCEEDS_MAX_DAYS from data.errorCode', () => {
      const result = component.mapApiError({ data: { errorCode: ERROR_CODES.EXCEEDS_MAX_DAYS } });
      expect(result).toBe('Date exceeds maximum allowed days for check-in.');
    });
  });

  // ─── 12. Grid operations ─────────────────────────────────────────────────

  describe('Grid operations - sort, pagination', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();

      const records: CheckInRecord[] = [
        { unitId: 'W003', collectionDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', device: '', rack: '', tray: '' },
        { unitId: 'W001', collectionDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', device: '', rack: '', tray: '' },
        { unitId: 'W002', collectionDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', device: '', rack: '', tray: '' },
      ];
      component.gridData.set(records);
    }));

    it('should toggle sort direction on toggleSortUnitId', () => {
      component.toggleSortUnitId();
      expect(component.sortDir()).toBe('asc');

      component.toggleSortUnitId();
      expect(component.sortDir()).toBe('desc');
    });

    it('should call getList on sort ascending', fakeAsync(() => {
      component.filterForm.patchValue({ inventoryClassCode: 'RE' }, { emitEvent: false });
      checkInServiceSpy.getList.calls.reset();
      component.toggleSortUnitId();
      tick();
      expect(component.sortDir()).toBe('asc');
      expect(checkInServiceSpy.getList).toHaveBeenCalled();
    }));

    it('should call getList on sort descending', fakeAsync(() => {
      component.filterForm.patchValue({ inventoryClassCode: 'RE' }, { emitEvent: false });
      checkInServiceSpy.getList.calls.reset();
      component.toggleSortUnitId();
      component.toggleSortUnitId();
      tick();
      expect(component.sortDir()).toBe('desc');
      expect(checkInServiceSpy.getList).toHaveBeenCalled();
    }));

    it('should update page index and size on page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 30 });
      expect(component.gridPageIndex()).toBe(1);
      expect(component.gridPageSize()).toBe(10);
    });
  });

  describe('Grid pagination - server-backed', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should call getList on page change', fakeAsync(() => {
      component.filterForm.patchValue({ inventoryClassCode: 'RE' }, { emitEvent: false });
      checkInServiceSpy.getList.calls.reset();
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 30 });
      tick();
      expect(component.gridPageIndex()).toBe(1);
      expect(component.gridPageSize()).toBe(10);
      expect(checkInServiceSpy.getList).toHaveBeenCalled();
    }));

    it('should set gridTotal from server response', fakeAsync(() => {
      checkInServiceSpy.getList.and.returnValue(of({ data: [{ unitId: 'U1', collDate: '', productCode: '', aliquot: '', bloodType: '', expDate: '', productType: '', inventoryClass: '', stockState: '', locationId: 'B01010001T01', insertDate: '' }], total: 42 }));
      component.filterForm.patchValue({ inventoryClassCode: 'RE' });
      tick();
      expect(component.gridTotal()).toBe(42);
    }));

    it('should map server response to grid records', fakeAsync(() => {
      checkInServiceSpy.getList.and.returnValue(of({ data: [{ unitId: 'U1', collDate: '01-JAN-2026', productCode: 'E0701', aliquot: '00', bloodType: '51', expDate: '08-JAN-2026', productType: 'FFP', inventoryClass: 'RE', stockState: 'AV', locationId: 'B01010001T01', insertDate: '01-JAN-2026' }], total: 1 }));
      component.filterForm.patchValue({ inventoryClassCode: 'RE' });
      tick();
      expect(component.gridData().length).toBe(1);
      expect(component.gridData()[0].unitId).toBe('U1');
    }));
  });

  // ─── 13. Clear operations ────────────────────────────────────────────────

  describe('Clear operations - clearAll, clearEntryRow', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should reset filter form, hide entry row, and clear grid on clearAll', fakeAsync(() => {
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      component.gridData.set([{ unitId: 'U1' } as CheckInRecord]);

      component.clearAll();
      tick();

      expect(component.showEntryRow()).toBe(false);
      expect(component.gridData().length).toBe(0);
      expect(component.inventoryClassDescription()).toBe('-');
      expect(component.filterForm.get('inventoryClassCode')?.value).toBeNull();
    }));

    it('should clear entry fields on clearEntryRow', fakeAsync(() => {
      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');

      component.clearEntryRow();
      tick();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.productCodeField.clear).toHaveBeenCalled();
      expect(component.aboRhField.clear).toHaveBeenCalled();
    }));

    it('should clear racks and trays on clearEntryRow', fakeAsync(() => {
      component.racks.set(mockRacks);
      component.trays.set(mockTrays);

      component.clearEntryRow();
      tick();

      expect(component.racks().length).toBe(0);
      expect(component.trays().length).toBe(0);
    }));
  });

  // ─── 14. Navigation ──────────────────────────────────────────────────────

  describe('Navigation - viewUnitDetails, viewInventoryHistory', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should navigate to product-current-status with unitId param', () => {
      component.viewUnitDetails();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/product-management-functions/inventory-management/product-management/product-current-status'],
        { queryParams: { unitId: 'W1234-18-031401' } },
      );
    });

    it('should navigate to product-status-inquiry with unitId param', () => {
      component.viewInventoryHistory();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/product-management-functions/inventory-management/product-management/product-status-inquiry'],
        { queryParams: { unitId: 'W1234-18-031401' } },
      );
    });
  });

  // ─── Additional coverage tests ────────────────────────────────────────────

  describe('Chapter change subscription', () => {
    it('should clear and reload on chapter change', fakeAsync(() => {
      initComponent();
      tick();

      checkInServiceSpy.getInventoryClasses.calls.reset();
      checkInServiceSpy.getDevices.calls.reset();

      chapterChanged$.next();
      tick();

      expect(checkInServiceSpy.getInventoryClasses).toHaveBeenCalled();
      expect(checkInServiceSpy.getDevices).toHaveBeenCalledWith('W');
    }));
  });

  describe('Page header effect', () => {
    it('should update headerConfig when pageHeaderData emits', fakeAsync(() => {
      pageHeaderServiceSpy.pageHeaderData.set({
        title: 'Check In From Lab',
        subtitle: 'Subtitle text',
      });

      initComponent();
      tick();

      expect(component.headerConfig.title).toBe('Check In From Lab');
    }));
  });

  describe('Computed signals', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should compute productCodeOptions from unitProducts', () => {
      component.unitProducts.set(mockProducts);
      const options = component.productCodeOptions();
      expect(options.length).toBe(2);
      expect(options[0].code).toBe('E2807D00');
    });

    it('should compute aboTypeOptions from aboTypes', () => {
      component.aboTypes.set(mockAboTypes);
      const options = component.aboTypeOptions();
      expect(options.length).toBe(2);
      expect(options[0].code).toBe('62');
      expect(options[0].description).toBe('A Pos');
    });

    it('should compute showAliquotField when more than 1 aliquot', () => {
      component.aliquotOptions.set(mockAliquots);
      expect(component.showAliquotField()).toBe(true);
    });

    it('should not show aliquot field when 1 or fewer aliquots', () => {
      component.aliquotOptions.set([{ aliquot: '00', componentStatus: 'A' }]);
      expect(component.showAliquotField()).toBe(false);
    });

    it('should compute selectedDeviceTooltip', () => {
      component.devices.set(mockDevices);
      component.entryForm.patchValue({ device: 'D01' }, { emitEvent: false });
      expect(component.selectedDeviceTooltip()).toBe('D01 - Freezer 1');
    });

    it('should compute selectedRackTooltip', () => {
      component.racks.set(mockRacks);
      component.entryForm.patchValue({ rack: 'R01' }, { emitEvent: false });
      expect(component.selectedRackTooltip()).toBe('R01 - Rack A');
    });

    it('should compute selectedTrayTooltip', () => {
      component.trays.set(mockTrays);
      component.entryForm.patchValue({ tray: 'T01' }, { emitEvent: false });
      expect(component.selectedTrayTooltip()).toBe('T01 - Tray 1');
    });

    it('should return empty tooltip when device not found', () => {
      component.devices.set(mockDevices);
      component.entryForm.patchValue({ device: 'UNKNOWN' }, { emitEvent: false });
      expect(component.selectedDeviceTooltip()).toBe('');
    });

    it('should compute warehouseId from headerService', () => {
      expect(component.warehouseId()).toBe('W');
    });

    it('should read gridTotal from signal', () => {
      component.gridTotal.set(42);
      expect(component.gridTotal()).toBe(42);
    });
  });

  describe('Product validation - unlicensed warning', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
    }));

    it('should show toast warning when product is not licensed', fakeAsync(() => {
      checkInServiceSpy.validateProduct.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: {
          productCode: 'E2807D00', invProductType: 'FFP', isPoolProduct: false,
          autoExpiryDate: null, componentStatus: 'A', expiryDate: null, isLicensed: 'N',
        },
      }));

      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Warning: Product is not licensed for this chapter.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] }),
      );
    }));
  });

  describe('Product validation failure', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
    }));

    it('should show error and clear product code on failed validation', fakeAsync(() => {
      checkInServiceSpy.validateProduct.and.returnValue(of({
        success: false, message: 'Invalid product', statusCode: 400, data: null as any,
      }));

      component.onProductCodeChanged({ code: 'BADPROD', description: 'BADPROD' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.selectedProductCode()).toBeNull();
      expect(component.productCodeField.clear).toHaveBeenCalled();
    }));

    it('should show error on product validation API failure', fakeAsync(() => {
      checkInServiceSpy.validateProduct.and.returnValue(throwError(() => new Error('fail')));

      component.onProductCodeChanged({ code: 'E2807D00', description: 'E2807D00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to validate product code.',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 }),
      );
    }));
  });

  describe('Check-in error scenarios', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();

      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      component.entryForm.patchValue({
        aliquot: '00', expirationDate: '08-JAN-2018',
        device: 'D01', rack: 'R01', tray: 'T01',
      }, { emitEvent: false });
    }));

    it('should show error when check-in API returns failure', fakeAsync(() => {
      checkInServiceSpy.checkIn.and.returnValue(of({
        success: false, message: 'Failed', statusCode: 400, data: null as any, errorCode: ERROR_CODES.ALREADY_CHECKED_IN,
      }));

      component.onTrayTabOut();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.gridData().length).toBe(0);
    }));

    it('should show error on check-in API error', fakeAsync(() => {
      checkInServiceSpy.checkIn.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onTrayTabOut();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Server error',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 }),
      );
      expect(component.isSaving()).toBe(false);
    }));

    it('should show error on location validation API error', fakeAsync(() => {
      checkInServiceSpy.validateLocation.and.returnValue(throwError(() => ({ error: { message: 'Location error' } })));

      component.onTrayTabOut();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Location error',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 }),
      );
      expect(component.isSaving()).toBe(false);
    }));
  });

  describe('onProductCodeCleared', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('should reset product code and dependent fields', () => {
      component.selectedProductCode.set('E2807D00');
      component.aliquotOptions.set(mockAliquots);
      component.aboTypes.set(mockAboTypes);

      component.onProductCodeCleared();

      expect(component.selectedProductCode()).toBeNull();
      expect(component.aliquotOptions().length).toBe(0);
      expect(component.aboTypes().length).toBe(0);
    });
  });

  describe('onUnitValidated', () => {
    it('should be a no-op method', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  describe('Expiry cross-check failure', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();
      component.selectedProductCode.set('E2807D00');
    }));

    it('should clear expiry and show error when cross-check fails', fakeAsync(() => {
      checkInServiceSpy.validateExpiry.and.returnValue(of({
        success: true, message: 'Mismatch', statusCode: 200,
        data: { isValid: false, componentExpiryDate: null, enteredExpiryDate: null, chapterLocalDate: '' },
      }));

      component.entryForm.patchValue({ expirationDate: '01-AUG-2026' });
      component.onExpirationDateBlur();
      tick();

      expect(component.entryForm.get('expirationDate')?.value).toBe('');
      expect(component.expirationDateValidating()).toBe(false);
    }));

    it('should clear expiry and show error when cross-check API fails', fakeAsync(() => {
      checkInServiceSpy.validateExpiry.and.returnValue(throwError(() => new Error('fail')));

      component.entryForm.patchValue({ expirationDate: '01-AUG-2026' });
      component.onExpirationDateBlur();
      tick();

      expect(component.entryForm.get('expirationDate')?.value).toBe('');
      expect(component.expirationDateValidating()).toBe(false);
    }));
  });

  describe('Loading state indicators', () => {
    it('should set isLoadingClasses during inventory class load', fakeAsync(() => {
      initComponent();
      // After tick, loading should be complete
      tick();
      expect(component.isLoadingClasses()).toBe(false);
    }));

    it('should set isLoadingClasses to false on error', fakeAsync(() => {
      checkInServiceSpy.getInventoryClasses.and.returnValue(throwError(() => new Error('fail')));
      initComponent();
      tick();
      expect(component.isLoadingClasses()).toBe(false);
    }));

    it('should set isLoadingDevices to false on error', fakeAsync(() => {
      checkInServiceSpy.getDevices.and.returnValue(throwError(() => new Error('fail')));
      initComponent();
      tick();
      expect(component.isLoadingDevices()).toBe(false);
    }));

    it('should set isLoadingRacks to false on error', fakeAsync(() => {
      initComponent();
      tick();
      checkInServiceSpy.getRacks.and.returnValue(throwError(() => new Error('fail')));
      component.entryForm.get('device')?.setValue('D01');
      tick();
      expect(component.isLoadingRacks()).toBe(false);
    }));

    it('should set isLoadingTrays to false on error', fakeAsync(() => {
      initComponent();
      tick();
      checkInServiceSpy.getTrays.and.returnValue(throwError(() => new Error('fail')));
      component.entryForm.patchValue({ device: 'D01' }, { emitEvent: false });
      component.entryForm.get('rack')?.setValue('R01');
      tick();
      expect(component.isLoadingTrays()).toBe(false);
    }));
  });

  describe('Rapid scan - location preservation after check-in', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();

      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();

      component.devices.set(mockDevices);
      component.racks.set(mockRacks);
      component.trays.set(mockTrays);
      component.entryForm.patchValue({
        aliquot: '00', expirationDate: '08-JAN-2018',
        device: 'D01', rack: 'R01', tray: 'T01',
      }, { emitEvent: false });
    }));

    it('should restore device/rack/tray values after successful check-in', fakeAsync(() => {
      component.onTrayTabOut();
      tick();

      expect(component.entryForm.get('device')?.value).toBe('D01');
      expect(component.entryForm.get('rack')?.value).toBe('R01');
      expect(component.entryForm.get('tray')?.value).toBe('T01');
    }));

    it('should clear unit fields but preserve devices list after check-in', fakeAsync(() => {
      component.onTrayTabOut();
      tick();

      expect(component.devices().length).toBe(2);
      expect(component.selectedProductCode()).toBeNull();
      expect(component.selectedAboRh()).toBeNull();
    }));
  });

  describe('Tray-full dialog - user cancels', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();

      const event = {
        data: { parsedUnitId: 'W1234-18-031401', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      component.selectedProductCode.set('E2807D00');
      component.selectedAboRh.set('62');
      component.filterForm.get('inventoryClassCode')?.setValue('RE');
      tick();
      component.entryForm.patchValue({
        aliquot: '00', expirationDate: '08-JAN-2018',
        device: 'D01', rack: 'R01', tray: 'T01',
      }, { emitEvent: false });
    }));

    it('should not check in when user cancels tray-full dialog', fakeAsync(() => {
      checkInServiceSpy.validateLocation.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: { isValid: true, locationId: 'LOC001', availableCapacity: 0 },
      }));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      checkInServiceSpy.checkIn.calls.reset();
      component.onTrayTabOut();
      tick();

      expect(checkInServiceSpy.checkIn).not.toHaveBeenCalled();
    }));
  });

  describe('ERROR_CODES export', () => {
    it('should export all known error codes', () => {
      expect(ERROR_CODES.ALREADY_CHECKED_IN).toBe('5322');
      expect(ERROR_CODES.SHIPPED_NOT_RETURNED).toBe('6301');
      expect(ERROR_CODES.QUARANTINED).toBe('3728');
      expect(ERROR_CODES.DISCARDED).toBe('6300');
      expect(ERROR_CODES.COMPONENT_INTERDICTED).toBe('3721');
      expect(ERROR_CODES.UNIT_INTERDICTED).toBe('3722');
      expect(ERROR_CODES.INVENTORY_CLASS_MISMATCH).toBe('0347');
      expect(ERROR_CODES.BIO_HOLD_NFT).toBe('5325');
      expect(ERROR_CODES.FUTURE_DATE).toBe('0503');
      expect(ERROR_CODES.EXCEEDS_MAX_DAYS).toBe('5500');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      initComponent();
      const spy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
