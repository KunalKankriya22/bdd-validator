import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { RestockUnshippedProducts } from './restock-unshipped-products';
import { RestockUnshippedProductsService } from './services/restock-unshipped-products.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { LoginService } from '@shared/services/login.service';
import {
  PickSlipDto,
  PickSlipProductDto,
  StorageDeviceDto,
  StorageRackDto,
  StorageTrayDto
} from './models/restock-unshipped-products.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { provideRouter } from '@angular/router';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('RestockUnshippedProducts', () => {
  let component: RestockUnshippedProducts;
  let fixture: ComponentFixture<RestockUnshippedProducts>;
  let serviceSpy: jasmine.SpyObj<RestockUnshippedProductsService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockPickSlips: PickSlipDto[] = [
    {
      pickSlipId: 'PU17-00130025',
      chapterId: '001',
      totalProducts: 5,
      restockableProducts: 3,
      createDate: '2025-05-12T00:00:00',
      createUser: 'MAR123',
      warehouseId: 'H'
    },
    {
      pickSlipId: 'PU17-00130026',
      chapterId: '001',
      totalProducts: 2,
      restockableProducts: 2,
      createDate: '2025-05-13T00:00:00',
      createUser: 'JOE456',
      warehouseId: 'H'
    }
  ];

  const mockProducts: PickSlipProductDto[] = [
    {
      pickSlipId: 'PU17-00130025',
      unitId: 'W123417070100',
      productCode: 'E009X00',
      productShortName: 'Red Blood Cells (AS54)',
      aliquot: '00',
      chapterId: '001',
      bloodType: 'AB+',
      bloodTypeDesc: 'AB Positive',
      expDate: '2025-05-12T23:59:00',
      collDate: '2025-04-10T08:00:00',
      productStatus: 'RP',
      warehouseId: 'H',
      device: '50',
      rack: '20',
      tray: '1028'
    },
    {
      pickSlipId: 'PU17-00130025',
      unitId: 'W123417070101',
      productCode: 'E009X00',
      productShortName: 'Red Blood Cells (AS54)',
      aliquot: '01',
      chapterId: '001',
      bloodType: 'AB+',
      bloodTypeDesc: 'AB Positive',
      expDate: '2025-05-12T23:59:00',
      collDate: '2025-04-10T08:00:00',
      productStatus: 'RP',
      warehouseId: 'H',
      device: '50',
      rack: '20',
      tray: '1028'
    }
  ];

  const mockStorageDevices: StorageDeviceDto[] = [
    { deviceType: 'FR', deviceNumber: '50', description: 'Freezer 50' }
  ];

  const mockStorageRacks: StorageRackDto[] = [
    { rackNumber: '20', description: 'Rack 20', mixAbo: 'Y', mixProduct: 'Y', trayCount: 1 }
  ];

  const mockStorageTrays: StorageTrayDto[] = [
    { trayNumber: '1028', shelfNumber: '01', description: 'Tray 1028', itemCount: 5, trayCapacity: 10, isFull: false }
  ];

  const createMockValidationData = (parsedUnitId: string): UnitValidationResponse => ({
    parsedUnitId,
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: parsedUnitId,
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I'
  });

  const setupUnitIdField = () => {
    component['unitIdField'] = {
      clear: jasmine.createSpy('clear'),
      focus: jasmine.createSpy('focus'),
      parsedUnitId: ''
    } as any;
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('RestockUnshippedProductsService', [
      'getPickSlips',
      'getPickSlipProducts',
      'restockProducts',
      'getStorageDevices',
      'getStorageRacks',
      'getStorageTrays'
    ]);

    headerServiceSpy = createMockHeaderService({ chapterId: signal('001') });

    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    snackBarSpy = createMockMatSnackBar();

    serviceSpy.getPickSlips.and.returnValue(of({
      success: true, message: 'Success', statusCode: 200, data: mockPickSlips
    }));

    serviceSpy.getPickSlipProducts.and.returnValue(of({
      success: true, message: 'Success', statusCode: 200, data: mockProducts
    }));

    serviceSpy.getStorageDevices.and.returnValue(of({
      success: true, message: 'Success', statusCode: 200, data: mockStorageDevices
    }));

    serviceSpy.getStorageRacks.and.returnValue(of({
      success: true, message: 'Success', statusCode: 200, data: mockStorageRacks
    }));

    serviceSpy.getStorageTrays.and.returnValue(of({
      success: true, message: 'Success', statusCode: 200, data: mockStorageTrays
    }));

    serviceSpy.restockProducts.and.returnValue(of({
      success: true, message: '1 product(s) restocked successfully', statusCode: 200,
      data: { productsRestocked: 1, rowsAffected: 2, pickSlipClosed: false }
    }));

    TestBed.configureTestingModule({
      imports: [RestockUnshippedProducts, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: RestockUnshippedProductsService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    fixture = TestBed.createComponent(RestockUnshippedProducts);
    component = fixture.componentInstance;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should initialize with empty products', () => {
      expect(component['products']()).toEqual([]);
    });

    it('should initialize with empty displayProducts', () => {
      expect(component['displayProducts']()).toEqual([]);
    });

    it('should initialize pick slip form with pickSlipId control', () => {
      expect(component.pickSlipForm.get('pickSlipId')).toBeTruthy();
    });

    it('should initialize filter form with all controls', () => {
      expect(component.filterForm.get('productCode')).toBeTruthy();
      expect(component.filterForm.get('aboRh')).toBeTruthy();
      expect(component.filterForm.get('device')).toBeTruthy();
      expect(component.filterForm.get('rack')).toBeTruthy();
      expect(component.filterForm.get('tray')).toBeTruthy();
    });

    it('should load pick slips on init', () => {
      expect(serviceSpy.getPickSlips).toHaveBeenCalled();
      expect(component['pickSlips']().length).toBe(2);
    });

    it('should initialize side panel as closed', () => {
      expect(component['showProductsPanel']()).toBeFalse();
    });
  });

  describe('Pick Slip Loading', () => {
    it('should handle pick slip load error', fakeAsync(() => {
      serviceSpy.getPickSlips.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component['loadPickSlips']();
      tick();
      expect(component['error']()).toBe('Server error');
      expect(component['loading']()).toBeFalse();
    }));

    it('should handle pick slip load error without message', fakeAsync(() => {
      serviceSpy.getPickSlips.and.returnValue(throwError(() => ({ error: {} })));
      component['loadPickSlips']();
      tick();
      expect(component['error']()).toBe('Failed to load pick slips');
    }));
  });

  describe('Pick Slip Selection', () => {
    it('should set selectedPickSlip when pick slip is selected', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      expect(component['selectedPickSlip']()).toEqual(mockPickSlips[0]);
    }));

    it('should clear products when pick slip changes', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      component['products'].set(mockProducts);

      serviceSpy.getPickSlipProducts.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, data: []
      }));

      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130026' });
      tick();
      expect(component['products']().length).toBe(0);
    }));

    it('should clear selectedPickSlip when deselected', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: '' });
      tick();
      expect(component['selectedPickSlip']()).toBeNull();
    }));

    it('should clear filter form and unit field when pick slip changes', fakeAsync(() => {
      setupUnitIdField();
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();

      component.filterForm.patchValue({ productCode: 'E009X00' });
      component['pendingProduct'] = mockProducts[0];
      component['selectedProduct'].set(mockProducts[0]);
      component['unitScannedWarning'] = 'test';

      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130026' });
      tick();

      expect(component.filterForm.get('productCode')?.value).toBeFalsy();
      expect(component['pendingProduct']).toBeNull();
      expect(component['selectedProduct']()).toBeNull();
      expect(component['unitScannedWarning']).toBe('');
      expect(component['unitIdField'].clear).toHaveBeenCalled();
    }));
  });

  describe('Product Loading', () => {
    it('should load products and extract filter options', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      expect(serviceSpy.getPickSlipProducts).toHaveBeenCalled();
      expect(component['productCodes']().length).toBeGreaterThan(0);
      expect(component['aboRhOptions']().length).toBeGreaterThan(0);
    }));

    it('should handle product load error', fakeAsync(() => {
      serviceSpy.getPickSlipProducts.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      expect(component['loadingProducts']()).toBeFalse();
      expect(component['products']().length).toBe(0);
    }));

    it('should handle product load error without message', fakeAsync(() => {
      serviceSpy.getPickSlipProducts.and.returnValue(throwError(() => ({ error: {} })));
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      expect(component['loadingProducts']()).toBeFalse();
    }));
  });

  describe('Product Code Selection', () => {
    it('should set selectedProduct when product code is selected with a valid unit ID', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();

      component['currentFilterUnitId'] = 'W123417070100';
      component.filterForm.patchValue({ productCode: 'E009X00' });
      tick();

      expect(component['selectedProduct']()).toBeTruthy();
      expect(component['selectedProduct']()?.productCode).toBe('E009X00');
    }));

    it('should clear selectedProduct when product code is cleared', fakeAsync(() => {
      component['currentFilterUnitId'] = 'W123417070100';
      component['selectedProduct'].set(mockProducts[0]);
      component.filterForm.patchValue({ productCode: '' });
      tick();
      expect(component['selectedProduct']()).toBeNull();
    }));

    it('should clear selectedProduct when no unit ID is set', fakeAsync(() => {
      component['currentFilterUnitId'] = '';
      component.filterForm.patchValue({ productCode: 'E009X00' });
      tick();
      expect(component['selectedProduct']()).toBeNull();
    }));
  });

  describe('Unit Post Validate', () => {
    it('should reject when unit ID is empty', () => {
      const event = {
        data: createMockValidationData(''),
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should reject when no pick slip is selected', () => {
      const event = {
        data: createMockValidationData('W123417070100'),
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Please select an Unpack Slip ID first');
    });

    it('should confirm when unit ID is found in pick slip', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();

      const event = {
        data: createMockValidationData('W123417070100'),
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(event);
      tick();
      expect(event.confirm).toHaveBeenCalled();
      expect(component['pendingProduct']).toBeTruthy();
      expect(component['currentFilterUnitId']).toBe('W123417070100');
    }));

    it('should reject when unit ID is not found in pick slip', fakeAsync(() => {
      serviceSpy.getPickSlipProducts.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, data: []
      }));

      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();

      const event = {
        data: createMockValidationData('INVALID_UNIT'),
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(event);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Unit ID not found in this pick slip');
    }));

    it('should set warning when unit ID is already restocked', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();

      const key = `${mockProducts[0].unitId}_${mockProducts[0].productCode}_${mockProducts[0].aliquot}`;
      component['restockedProducts'].set(new Set([key]));

      const event = {
        data: createMockValidationData('W123417070100'),
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(event);
      expect(component['unitScannedWarning']).toBe('This Unit ID has already been restocked');
      expect(event.confirm).toHaveBeenCalled();
    }));
  });

  describe('Unit Field Events', () => {
    it('should clear warning on unit cleared', () => {
      component['unitScannedWarning'] = 'Test warning';
      component['pendingProduct'] = mockProducts[0];
      component['selectedProduct'].set(mockProducts[0]);
      component.onUnitCleared();
      expect(component['unitScannedWarning']).toBe('');
      expect(component['pendingProduct']).toBeNull();
      expect(component['selectedProduct']()).toBeNull();
    });

    it('should clear warning on unit field focus', () => {
      component['unitScannedWarning'] = 'Test warning';
      component.onUnitFieldFocus();
      expect(component['unitScannedWarning']).toBe('');
    });

    it('should handle onUnitValidated', () => {
      component.onUnitValidated(createMockValidationData('W123417070100'));
    });
  });

  describe('Location Cascading', () => {
    it('should load racks when device is selected', fakeAsync(() => {
      component['storageDevices'].set(mockStorageDevices);
      component.filterForm.patchValue({ device: 'FR-50' });
      tick();
      expect(serviceSpy.getStorageRacks).toHaveBeenCalled();
    }));

    it('should clear rack and tray when device changes', fakeAsync(() => {
      component.filterForm.patchValue({ rack: '20', tray: '1028' });
      tick();
      component['storageDevices'].set(mockStorageDevices);
      component.filterForm.patchValue({ device: 'FR-50' });
      tick();
      expect(component.filterForm.get('rack')?.value).toBe('');
      expect(component.filterForm.get('tray')?.value).toBe('');
    }));

    it('should clear tray when rack changes', fakeAsync(() => {
      component.filterForm.patchValue({ tray: '1028' });
      tick();
      component.filterForm.patchValue({ rack: '21' });
      tick();
      expect(component.filterForm.get('tray')?.value).toBe('');
    }));

    it('should load trays when rack is selected', fakeAsync(() => {
      component['storageRacks'].set(mockStorageRacks);
      component.filterForm.patchValue({ rack: '20' });
      tick();
      expect(serviceSpy.getStorageTrays).toHaveBeenCalled();
    }));

    it('should capture mix flags from selected rack', fakeAsync(() => {
      component['storageRacks'].set(mockStorageRacks);
      component.filterForm.patchValue({ rack: '20' });
      tick();
      expect(component['selectedRackMixAbo']).toBe('Y');
      expect(component['selectedRackMixProduct']).toBe('Y');
    }));

    it('should handle device load error', fakeAsync(() => {
      serviceSpy.getStorageDevices.and.returnValue(throwError(() => new Error('fail')));
      component['loadStorageDevices']();
      tick();
      expect(component['storageDevices']().length).toBe(0);
    }));

    it('should handle rack load error', fakeAsync(() => {
      serviceSpy.getStorageRacks.and.returnValue(throwError(() => new Error('fail')));
      component['loadStorageRacks']();
      tick();
      expect(component['storageRacks']().length).toBe(0);
    }));

    it('should handle tray load error', fakeAsync(() => {
      serviceSpy.getStorageTrays.and.returnValue(throwError(() => new Error('fail')));
      component['loadStorageTrays']('20');
      tick();
      expect(component['storageTrays']().length).toBe(0);
    }));
  });

  describe('Location Selected (Restock)', () => {
    beforeEach(() => {
      setupUnitIdField();
      component['selectedPickSlip'].set(mockPickSlips[0]);
      component['products'].set(mockProducts);
      component['currentFilterUnitId'] = 'W123417070100';
      component['currentWarehouseId'] = 'H';
      component['currentProductType'] = 'E009X00';
      component['storageDevices'].set(mockStorageDevices);
      component['selectedDeviceType'] = 'FR';
      component['selectedDeviceNumber'] = '50';
      component['storageTrays'].set(mockStorageTrays);
    });

    it('should call restockProducts when tray is selected', fakeAsync(() => {
      serviceSpy.restockProducts.calls.reset();
      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();
      expect(serviceSpy.restockProducts).toHaveBeenCalled();
    }));

    it('should not restock when device/rack/tray are incomplete', () => {
      serviceSpy.restockProducts.calls.reset();
      component.filterForm.patchValue({ device: 'FR-50', rack: '', tray: '' }, { emitEvent: false });
      component.onLocationSelected();
      expect(serviceSpy.restockProducts).not.toHaveBeenCalled();
    });

    it('should show confirm dialog when tray is full', fakeAsync(() => {
      const fullTray: StorageTrayDto[] = [
        { trayNumber: '1028', shelfNumber: '01', description: 'Tray 1028', itemCount: 10, trayCapacity: 10, isFull: true }
      ];
      component['storageTrays'].set(fullTray);
      serviceSpy.restockProducts.calls.reset();

      const dialogRefSpy = { afterClosed: () => of(true) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();

      expect(component['dialog'].open).toHaveBeenCalled();
      expect(serviceSpy.restockProducts).toHaveBeenCalled();
    }));

    it('should clear tray when user rejects full tray dialog', fakeAsync(() => {
      const fullTray: StorageTrayDto[] = [
        { trayNumber: '1028', shelfNumber: '01', description: 'Tray 1028', itemCount: 10, trayCapacity: 10, isFull: true }
      ];
      component['storageTrays'].set(fullTray);

      const dialogRefSpy = { afterClosed: () => of(false) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();

      expect(component.filterForm.get('tray')?.value).toBeFalsy();
      expect(serviceSpy.restockProducts).not.toHaveBeenCalled();
    }));

    it('should add restocked entries to displayProducts on success', fakeAsync(() => {
      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();

      expect(component['displayProducts']().length).toBeGreaterThan(0);
      expect(component['displayProducts']()[0].isRestocked).toBeTrue();
    }));

    it('should handle restock failure response', fakeAsync(() => {
      serviceSpy.restockProducts.and.returnValue(of({
        success: false, message: 'Restock failed', statusCode: 400, data: null as any
      }));

      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();

      expect(component['isRestocking']()).toBeFalse();
      expect(component['displayProducts']().length).toBe(0);
    }));

    it('should handle restock API error', fakeAsync(() => {
      serviceSpy.restockProducts.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      component.onLocationSelected();
      tick();

      expect(component['isRestocking']()).toBeFalse();
    }));

    it('should reload pick slips when pick slip is closed', fakeAsync(() => {
      serviceSpy.restockProducts.and.returnValue(of({
        success: true, message: 'All restocked', statusCode: 200,
        data: { productsRestocked: 1, rowsAffected: 1, pickSlipClosed: true }
      }));

      component.filterForm.patchValue({ device: 'FR-50', rack: '20', tray: '1028' }, { emitEvent: false });
      const callCountBefore = serviceSpy.getPickSlips.calls.count();
      component.onLocationSelected();
      tick();

      expect(serviceSpy.getPickSlips.calls.count()).toBeGreaterThan(callCountBefore);
    }));
  });

  describe('Sort', () => {
    it('should update sortConfig on sort change ascending', () => {
      component.onSortChange({ column: 'isRestocked', direction: 'A' });
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });

    it('should update sortConfig on sort change descending', () => {
      component['displayProducts'].set([
        { ...mockProducts[0], isRestocked: true },
        { ...mockProducts[1], isRestocked: false }
      ]);
      component.onSortChange({ column: 'isRestocked', direction: 'D' });
      expect(component.tableConfig.sortConfig?.direction).toBe('D');
      expect(component['displayProducts']()[0].isRestocked).toBeTrue();
    });

    it('should not sort on default direction', () => {
      const products = [
        { ...mockProducts[0], isRestocked: false },
        { ...mockProducts[1], isRestocked: true }
      ];
      component['displayProducts'].set(products);
      component.onSortChange({ column: 'isRestocked', direction: 'default' });
      expect(component['displayProducts']().length).toBe(2);
    });
  });

  describe('Search Filters', () => {
    it('should filter pick slips by search term', fakeAsync(() => {
      component.pickSlipSearchControl.setValue('PU17-00130025');
      tick();
      expect(component['filteredPickSlips']().length).toBe(1);
    }));

    it('should filter product codes by search term', fakeAsync(() => {
      component['productCodes'].set([{ code: 'E009X00', description: 'Red Blood Cells' }]);
      component.productCodeSearchControl.setValue('E009');
      tick();
      expect(component['filteredProductCodes']().length).toBe(1);
    }));

    it('should filter abo/rh by search term', fakeAsync(() => {
      component['aboRhOptions'].set([{ code: 'AB+', description: 'AB Positive' }]);
      component.aboRhSearchControl.setValue('positive');
      tick();
      expect(component['filteredAboRhOptions']().length).toBe(1);
    }));

    it('should filter devices by search term', fakeAsync(() => {
      component['storageDevices'].set(mockStorageDevices);
      component.deviceSearchControl.setValue('Freezer');
      tick();
      expect(component['filteredDevices']().length).toBe(1);
    }));

    it('should filter racks by search term', fakeAsync(() => {
      component['storageRacks'].set(mockStorageRacks);
      component.rackSearchControl.setValue('20');
      tick();
      expect(component['filteredRacks']().length).toBe(1);
    }));

    it('should filter trays by search term', fakeAsync(() => {
      component['storageTrays'].set(mockStorageTrays);
      component.traySearchControl.setValue('1028');
      tick();
      expect(component['filteredTrays']().length).toBe(1);
    }));
  });

  describe('Side Panel', () => {
    it('should open products panel', () => {
      component.openProductsPanel();
      expect(component['showProductsPanel']()).toBeTrue();
    });

    it('should close products panel', () => {
      component['showProductsPanel'].set(true);
      component.closeProductsPanel();
      expect(component['showProductsPanel']()).toBeFalse();
    });

    it('should close panel on exit button click', () => {
      component['showProductsPanel'].set(true);
      component.onPanelButtonClick('exit');
      expect(component['showProductsPanel']()).toBeFalse();
    });

    it('should not close panel on unknown action', () => {
      component['showProductsPanel'].set(true);
      component.onPanelButtonClick('unknown');
      expect(component['showProductsPanel']()).toBeTrue();
    });

    it('should have panel footer buttons configured', () => {
      expect(component['panelFooterButtons'].length).toBe(1);
      expect(component['panelFooterButtons'][0].action).toBe('exit');
    });

    it('should have panel table config with correct columns', () => {
      const columns = component['panelTableConfig'].columns;
      expect(columns.length).toBe(6);
      expect(columns.map(c => c.key)).toEqual(['unitId', 'productCode', 'productShortName', 'aliquot', 'bloodTypeDesc', 'expDate']);
    });
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      setupUnitIdField();
    });

    it('should clear pick slip selection', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      component.clearPickSlip();
      tick();
      expect(component.pickSlipForm.get('pickSlipId')?.value).toBeNull();
      expect(component['selectedPickSlip']()).toBeNull();
      expect(component['unitIdField'].clear).toHaveBeenCalled();
    }));

    it('should clear all filters but preserve table data', fakeAsync(() => {
      component.filterForm.patchValue({ productCode: 'E009X00', aboRh: 'AB+' });
      component['currentFilterUnitId'] = 'W123';
      component['selectedProduct'].set(mockProducts[0]);
      component['pendingProduct'] = mockProducts[0];
      component['unitScannedWarning'] = 'test';
      component['displayProducts'].set([{ ...mockProducts[0], isRestocked: true }]);
      tick();

      component.clearFilters();
      tick();

      expect(component.filterForm.get('productCode')?.value).toBeFalsy();
      expect(component['currentFilterUnitId']).toBe('');
      expect(component['selectedProduct']()).toBeNull();
      expect(component['pendingProduct']).toBeNull();
      expect(component['unitScannedWarning']).toBe('');
      expect(component['displayProducts']().length).toBe(1);
      expect(component['unitIdField'].clear).toHaveBeenCalled();
    }));
  });

  describe('Form Accessors', () => {
    it('should return pick slip form controls via pf getter', () => {
      expect(component.pf).toBe(component.pickSlipForm.controls);
    });

    it('should return filter form controls via f getter', () => {
      expect(component.f).toBe(component.filterForm.controls);
    });
  });

  describe('Computed Values', () => {
    it('should compute isEmpty correctly when no products', () => {
      expect(component['isEmpty']()).toBeTrue();
    });

    it('should compute isEmpty correctly when products exist', fakeAsync(() => {
      component['displayProducts'].set([{ ...mockProducts[0], isRestocked: false }]);
      tick();
      expect(component['isEmpty']()).toBeFalse();
    }));

    it('should compute isReady correctly', fakeAsync(() => {
      component['loading'].set(false);
      component['error'].set(null);
      tick();
      expect(component['isReady']()).toBeTrue();
    }));

    it('should compute isReady as false when loading', () => {
      component['loading'].set(true);
      expect(component['isReady']()).toBeFalse();
    });

    it('should compute isReady as false when error', () => {
      component['error'].set('Error');
      expect(component['isReady']()).toBeFalse();
    });

    it('should compute hasSelectedPickSlip correctly', fakeAsync(() => {
      expect(component['hasSelectedPickSlip']()).toBeFalse();
      component.pickSlipForm.patchValue({ pickSlipId: 'PU17-00130025' });
      tick();
      expect(component['hasSelectedPickSlip']()).toBeTrue();
    }));
  });

  describe('Table Config Formatters', () => {
    it('should format expiration date correctly', () => {
      const dateFormatter = component.tableConfig.columns.find(c => c.key === 'expDate')?.valueFormatter;
      expect(dateFormatter).toBeDefined();
      if (dateFormatter) {
        const result = dateFormatter('2025-05-12T23:59:00', mockProducts[0] as any);
        expect(result).toContain('MAY');
        expect(result).toContain('2025');
      }
    });

    it('should return dash for empty date', () => {
      const dateFormatter = component.tableConfig.columns.find(c => c.key === 'expDate')?.valueFormatter;
      if (dateFormatter) {
        expect(dateFormatter('', mockProducts[0] as any)).toBe('-');
        expect(dateFormatter(null as any, mockProducts[0] as any)).toBe('-');
      }
    });

    it('should format status correctly', () => {
      const statusFormatter = component.tableConfig.columns.find(c => c.key === 'isRestocked')?.valueFormatter;
      expect(statusFormatter).toBeDefined();
      if (statusFormatter) {
        expect(statusFormatter(true, mockProducts[0] as any)).toBe('Restocked');
        expect(statusFormatter(false, mockProducts[0] as any)).toBe('-');
      }
    });

    it('should format panel expiration date correctly', () => {
      const dateFormatter = component['panelTableConfig'].columns.find(c => c.key === 'expDate')?.valueFormatter;
      expect(dateFormatter).toBeDefined();
      if (dateFormatter) {
        const result = dateFormatter('2025-05-12T23:59:00', mockProducts[0] as any);
        expect(result).toContain('MAY');
        expect(result).toContain('2025');
      }
    });
  });

  describe('Accessibility', () => {
    it('should generate unique element IDs', () => {
      const id = component['elementId']('test');
      expect(id).toContain('restock-unshipped-products');
      expect(id).toContain('test');
    });

    it('should generate unique error IDs', () => {
      const id = component['errorId']('field');
      expect(id).toContain('field-error');
    });

    it('should generate unique label IDs', () => {
      const labelId = component['labelId']('unitId');
      expect(labelId).toContain('restock-unshipped-products');
      expect(labelId).toContain('unitId-label');
    });
  });
});
