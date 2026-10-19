import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { ChangeInventoryClassComponent } from './change-inventory-class';
import { ChangeInventoryClassService } from './services/change-inventory-class.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ChangeInventoryClassProductDto,
  ChangeInventoryClassApiResponse,
} from './models/change-inventory-class.model';

describe('ChangeInventoryClassComponent', () => {
  let component: ChangeInventoryClassComponent;
  let fixture: ComponentFixture<ChangeInventoryClassComponent>;
  let serviceSpy: jasmine.SpyObj<ChangeInventoryClassService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockProducts: ChangeInventoryClassProductDto[] = [
    {
      unitId: 'W123418010301',
      productCode: 'E2807D00',
      productType: 'FFP',
      bloodType: '62',
      bloodTypeDesc: null,
      aliquot: '00',
      expDate: '2018-01-08T23:59:00',
      currentInvClass: 'AD',
      locationId: '111',
      collDate: '2018-01-03T00:00:00',
      warehouseId: 'H',
    },
    {
      unitId: 'W123418010301',
      productCode: 'E2808D00',
      productType: 'RBC',
      bloodType: '62',
      bloodTypeDesc: null,
      aliquot: '01',
      expDate: '2018-01-09T23:59:00',
      currentInvClass: 'RE',
      locationId: '222',
      collDate: '2018-01-03T00:00:00',
      warehouseId: 'H',
    },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ChangeInventoryClassService', [
      'getProducts',
      'changeInventoryClass',
      'getWarehouses',
      'getDevices',
      'getRacks',
      'getTrays',
      'getInventoryClasses',
      'preCheckInterdiction',
    ]);
    headerServiceSpy = createMockHeaderService();
    snackbarSpy = createMockSnackbarService();

    serviceSpy.getInventoryClasses.and.returnValue(
      of([{ code: 'AD', description: 'Autologous' }, { code: 'RE', description: 'Regular' }, { code: 'SP', description: 'Special' }]),
    );
    serviceSpy.getWarehouses.and.returnValue(
      of([{ warehouseId: 'H', warehouseName: 'Home Warehouse' }]),
    );
    serviceSpy.getDevices.and.returnValue(
      of([{ deviceId: '01', deviceName: 'Device 1', deviceType: 'C' }]),
    );
    serviceSpy.getRacks.and.returnValue(
      of([{ rackId: '04', rackName: 'Rack 4' }]),
    );
    serviceSpy.getTrays.and.returnValue(
      of([{ trayId: '100', trayName: 'Tray 100', itemCount: 0 }]),
    );
    serviceSpy.getProducts.and.returnValue(of(mockProducts));
    serviceSpy.preCheckInterdiction.and.returnValue(
      of({ success: true, statusCode: 200, message: 'OK', data: null }),
    );

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'closeAll']);
    dialogSpy.open.and.returnValue(dialogRefSpy);

      TestBed.configureTestingModule({
      imports: [ChangeInventoryClassComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ChangeInventoryClassService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });
      serviceSpy.getProducts.and.returnValue(of(mockProducts));


    fixture = TestBed.createComponent(ChangeInventoryClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {




    it('should initialize with empty entries', () => {
      expect(component['entries']()).toEqual([]);
    });

    it('should have default read-only field values', () => {
      expect(component['aboRh']).toBe('--');
      expect(component['expirationDateTime']).toBe('--');
      expect(component['currentClass']).toBe('--');
    });
  });

  describe('Unit Post Validate', () => {
    it('should load products on valid unit scan', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W123418010301', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event);
      tick();

      expect(serviceSpy.getProducts).toHaveBeenCalledWith('W123418010301', 'I');
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should reject when unit ID is empty', () => {
      const event = {
        data: { parsedUnitId: '' },
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event);
      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should reject when no products found', fakeAsync(() => {
      serviceSpy.getProducts.and.returnValue(of([]));
      const event = {
        data: { parsedUnitId: 'NOTFOUND', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('No available products found');
    }));

    it('should show warning for already-scanned unit', fakeAsync(() => {
      const entry = {
        unitId: 'W123418010301',
        product: 'E2807D00',
        aboRh: '62',
        expirationDate: '8-JAN-2018, 23:59',
        currentClass: 'AD',
        newClass: 'RE',
        warehouseId: 'H',
        deviceNo: '01',
        rackNo: '04',
        trayNo: '100',
      };
      component['entries'].set([entry]);

      const event = {
        data: { parsedUnitId: 'W123418010301', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event);
      tick();

      expect(component['unitScannedWarning']).toBe('This Unit ID has been scanned');
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should handle API error on product fetch', fakeAsync(() => {
      serviceSpy.getProducts.and.returnValue(throwError(() => ({ error: { message: 'DB error' } })));
      const event = {
        data: { parsedUnitId: 'U001', codeScheme: 'I' },
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('DB error');
      expect(component['loading']()).toBe(false);
    }));
  });
  describe('Unit Field Focus', () => {
    it('should clear warning on focus', () => {
      component['unitScannedWarning'] = 'This Unit ID has been scanned';
      component.onUnitFieldFocus();
      expect(component['unitScannedWarning']).toBe('');
    });
  });

  describe('Unit Cleared', () => {
    it('should reset all entry fields', () => {
      component['parsedUnitId'] = 'U001';
      component['productCode'] = 'P001';
      component['newClass'] = 'RE';
      component['warehouseId'] = 'H';

      component.onUnitCleared();

      expect(component['parsedUnitId']).toBe('');
      expect(component['productCode']).toBe('');
      expect(component['newClass']).toBe('');
      expect(component['warehouseId']).toBe('');
      expect(component['aboRh']).toBe('--');
      expect(component['currentClass']).toBe('--');
    });
  });

  describe('Location Cascading', () => {
    it('should load devices when warehouse changes', () => {
      component['warehouseId'] = 'H';
      component.onWarehouseChange();

      expect(serviceSpy.getDevices).toHaveBeenCalled();
      expect(component['deviceNo']).toBe('');
      expect(component['rackNo']).toBe('');
    });



    it('should load racks when device changes', () => {
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['deviceType'] = 'C';
      component['devices'].set([{ deviceId: '01', deviceName: 'Device 1', deviceType: 'C' }]);
      component.onDeviceChange();

      expect(serviceSpy.getRacks).toHaveBeenCalled();
      expect(component['rackNo']).toBe('');
    });


  });

  describe('Save Entry', () => {
    beforeEach(fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W123418010301', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
      };
      component.onUnitPostValidate(event);
      tick();

      component['selectedProductKey'] = 'E2807D00:00';
      component['onProductChange']();

      component['newClass'] = 'RE';
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['deviceType'] = 'C';
      component['rackNo'] = '04';
      component['trayNo'] = '100';
    }));

    it('should save entry on tray enter when all fields are filled', fakeAsync(() => {
      const successResponse: ChangeInventoryClassApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Inventory class changed successfully.',
        data: { unitId: 'W123418010301', oldClass: 'AD', newClass: 'RE' },
      };
      serviceSpy.changeInventoryClass.and.returnValue(of(successResponse));

      component.onTrayNoEnter();
      tick();

      expect(serviceSpy.changeInventoryClass).toHaveBeenCalledWith('W123418010301', jasmine.objectContaining({
        newClass: 'RE',
        productCode: 'E2807D00',
        aliquot: '00',
        collDate: '2018-01-03T00:00:00',
        codeScheme: 'I',
        warehouseId: 'H',
        deviceType: 'C',
        deviceNumber: '01',
        rackNumber: '04',
        trayNumber: '100',
      }));
      expect(component['entries']().length).toBe(1);
      expect(component['entries']()[0].unitId).toBe('W123418010301');
      expect(component['entries']()[0].newClass).toBe('RE');
    }));



    it('should show error when API returns failure', fakeAsync(() => {
      const errorResponse: ChangeInventoryClassApiResponse<any> = {
        success: false,
        statusCode: 400,
        message: 'Cannot change inventory class for autologous unit with blood type 40.',
        data: null,
        errorCode: '0369',
      };
      serviceSpy.changeInventoryClass.and.returnValue(of(errorResponse));

      component.onTrayNoEnter();
      tick();

      expect(component['entries']().length).toBe(0);
    }));



    it('should reset fields after successful save', fakeAsync(() => {
      serviceSpy.changeInventoryClass.and.returnValue(
        of({ success: true, statusCode: 200, message: 'OK', data: null }),
      );

      component.onTrayNoEnter();
      tick();

      expect(component['parsedUnitId']).toBe('');
      expect(component['productCode']).toBe('');
      expect(component['newClass']).toBe('');
    }));
  });

  describe('Pagination', () => {


    it('should compute paged data correctly', () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        unitId: `U${i}`,
        product: `P${i}`,
        aboRh: 'A+',
        expirationDate: '--',
        currentClass: 'RE',
        newClass: 'SP',
        warehouseId: 'H',
        deviceNo: '01',
        rackNo: '04',
        trayNo: '100',
      }));
      component['entries'].set(entries);
      component['gridPageSize'].set(10);
      component['gridPageIndex'].set(0);

      expect(component['pagedData']().length).toBe(10);

      component['gridPageIndex'].set(1);
      expect(component['pagedData']().length).toBe(5);
    });
  });

  describe('Auto-selection', () => {
    it('should auto-select device when only one device returned', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(of([{ deviceId: '01', deviceName: 'Dev 1', deviceType: 'C' }]));
      serviceSpy.getRacks.and.returnValue(of([{ rackId: '04', rackName: 'Rack 4' }, { rackId: '05', rackName: 'Rack 5' }]));
      component['warehouseId'] = 'H';
      component.onWarehouseChange();
      tick();
      expect(component['deviceNo']).toBe('01');
      expect(component['deviceType']).toBe('C');
      expect(serviceSpy.getRacks).toHaveBeenCalled();
    }));

    it('should NOT auto-select when multiple devices returned', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(of([
        { deviceId: '01', deviceName: 'Dev 1', deviceType: 'C' },
        { deviceId: '02', deviceName: 'Dev 2', deviceType: 'F' },
      ]));
      component['warehouseId'] = 'H';
      component.onWarehouseChange();
      tick();
      expect(component['deviceNo']).toBe('');
    }));

    it('should auto-select rack when only one rack returned', fakeAsync(() => {
      serviceSpy.getRacks.and.returnValue(of([{ rackId: '04', rackName: 'Rack 4' }]));
      serviceSpy.getTrays.and.returnValue(of([{ trayId: '100', trayName: 'T100', itemCount: 0 }, { trayId: '101', trayName: 'T101', itemCount: 0 }]));
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['deviceType'] = 'C';
      component['devices'].set([{ deviceId: '01', deviceName: 'Dev 1', deviceType: 'C' }]);
      component.onDeviceChange();
      tick();
      expect(component['rackNo']).toBe('04');
      expect(serviceSpy.getTrays).toHaveBeenCalled();
    }));

    it('should auto-select tray when only one tray returned', fakeAsync(() => {
      serviceSpy.getTrays.and.returnValue(of([{ trayId: '100', trayName: 'T100', itemCount: 0 }]));
      component['warehouseId'] = 'H';
      component['deviceType'] = 'C';
      component['deviceNo'] = '01';
      component['rackNo'] = '04';
      component.onRackChange();
      tick();
      expect(component['trayNo']).toBe('100');
    }));
  });

  describe('Inventory Class Description Filter', () => {
    it('should filter inventory classes by description', fakeAsync(() => {
      component['newClassSearchCtrl'].setValue('auto');
      tick(250);
      const filtered = component['filteredInventoryClasses']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('AD');
    }));
  });

  describe('Location Memory', () => {
    it('should retain location after successful save', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W123418010301', codeScheme: 'I' },
        confirm: jasmine.createSpy('confirm'),
      };
      component.onUnitPostValidate(event);
      tick();

      component['selectedProductKey'] = 'E2807D00:00';
      component['onProductChange']();

      component['newClass'] = 'RE';
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['deviceType'] = 'C';
      component['rackNo'] = '04';
      component['trayNo'] = '100';
      component['devices'].set([{ deviceId: '01', deviceName: 'Dev 1', deviceType: 'C' }]);
      component['racks'].set([{ rackId: '04', rackName: 'Rack 4' }]);
      component['trays'].set([{ trayId: '100', trayName: 'T100', itemCount: 0 }]);

      serviceSpy.changeInventoryClass.and.returnValue(
        of({ success: true, statusCode: 200, message: 'OK', data: null }),
      );

      component.onTrayNoEnter();
      tick();

      expect(component['parsedUnitId']).toBe('');
      expect(component['productCode']).toBe('');
      expect(component['warehouseId']).toBe('H');
      expect(component['deviceNo']).toBe('01');
      expect(component['rackNo']).toBe('04');
      expect(component['trayNo']).toBe('100');
    }));

    it('should clear location on explicit clear', () => {
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['rackNo'] = '04';
      component['trayNo'] = '100';
      component.onClear();
      expect(component['warehouseId']).toBe('');
      expect(component['deviceNo']).toBe('');
      expect(component['rackNo']).toBe('');
      expect(component['trayNo']).toBe('');
    });
  });

  describe('Product Required Validation', () => {
    it('should not save when no product is selected', fakeAsync(() => {
      component['parsedUnitId'] = 'U001';
      component['newClass'] = 'RE';
      component['selectedProduct'] = null;
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['rackNo'] = '04';
      component['trayNo'] = '100';
      component['locationRequired'] = true;

      component.onTrayNoEnter();
      tick();

      expect(serviceSpy.changeInventoryClass).not.toHaveBeenCalled();
    }));
  });

  describe('Check Digit', () => {
    it('should display check digit from unit validation', fakeAsync(() => {
      const event = {
        data: { parsedUnitId: 'W123418010301', codeScheme: 'I', checkDigit: '5A' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event);
      tick();
      expect(component['checkDigit']).toBe('5A');
    }));

    it('should clear check digit on reset', () => {
      component['checkDigit'] = '5A';
      component.onUnitCleared();
      expect(component['checkDigit']).toBeNull();
    });
  });

  describe('Sorting', () => {
    it('should sort entries ascending', () => {
      const entries = [
        { unitId: 'B001', product: 'P1', aboRh: 'A+', expirationDate: '--', collectionDate: '--', currentClass: 'RE', newClass: 'SP', warehouseId: 'H', deviceNo: '01', rackNo: '04', trayNo: '100' },
        { unitId: 'A001', product: 'P2', aboRh: 'B+', expirationDate: '--', collectionDate: '--', currentClass: 'SP', newClass: 'RE', warehouseId: 'H', deviceNo: '01', rackNo: '04', trayNo: '100' },
      ];
      component['entries'].set(entries);
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component['sortedEntries']()[0].unitId).toBe('A001');
    });

    it('should sort entries descending', () => {
      const entries = [
        { unitId: 'A001', product: 'P1', aboRh: 'A+', expirationDate: '--', collectionDate: '--', currentClass: 'RE', newClass: 'SP', warehouseId: 'H', deviceNo: '01', rackNo: '04', trayNo: '100' },
        { unitId: 'B001', product: 'P2', aboRh: 'B+', expirationDate: '--', collectionDate: '--', currentClass: 'SP', newClass: 'RE', warehouseId: 'H', deviceNo: '01', rackNo: '04', trayNo: '100' },
      ];
      component['entries'].set(entries);
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component['sortedEntries']()[0].unitId).toBe('B001');
    });
  });

  describe('New Class Change', () => {
    it('should show error when new class equals current class', () => {
      component['currentClass'] = 'RE';
      component['newClass'] = 'RE';
      component.onNewClassChange();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('New inventory class cannot be the same as the current class.');
      expect(component['newClass']).toBe('');
    });

    it('should load racks when class changes with location set', fakeAsync(() => {
      component['warehouseId'] = 'H';
      component['deviceNo'] = '01';
      component['deviceType'] = 'C';
      component['currentClass'] = 'RE';
      component['newClass'] = 'SP';
      component.onNewClassChange();
      tick();
      expect(serviceSpy.getRacks).toHaveBeenCalled();
    }));
  });

  describe('hasChanges', () => {
    it('should return false when no fields are filled', () => {
      expect(component.hasChanges()).toBe(false);
    });

    it('should return true when parsedUnitId is set', () => {
      component['parsedUnitId'] = 'U001';
      expect(component.hasChanges()).toBe(true);
    });
  });
});
