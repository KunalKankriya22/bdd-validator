import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';
import { CheckinDiscardProducts } from './checkin-discard-products';
import { CheckinDiscardProductsService } from './services/checkin-discard-products.service';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('CheckinDiscardProducts', () => {
  let component: CheckinDiscardProducts;
  let fixture: ComponentFixture<CheckinDiscardProducts>;
  let mockService: jasmine.SpyObj<CheckinDiscardProductsService>;
  const pageHeaderDataSignal = signal<any>(undefined);

  const mockDiscardUnitResponse = {
    success: true,
    message: null,
    statusCode: 200,
    item: {
      unitId: 'W633325060201',
      collDate: new Date().toISOString().split('T')[0]
    }
  };

  const mockProductCodes = {
    success: true,
    message: null,
    statusCode: 200,
    item: [
      { productCode: 'E0701V00', productType: 'FFP' }
    ]
  };

  const mockAboTypes = {
    success: true,
    message: null,
    statusCode: 200,
    item: {
      aliquot: '01',
      aliquotOptions: null,
      aboTypes: [
        { bloodType: 'OP', aboDesc: 'O POS', expDate: null }
      ],
      isPool: false
    }
  };

  const mockLocationDefaults = {
    success: true,
    message: null,
    statusCode: 200,
    item: {
      storageClass: 'FR',
      inventoryClass: 'AV',
      defaultWarehouseId: 'H',
      defaultDeviceNumber: '03',
      defaultDeviceType: 'R',
      defaultRackNumber: '01',
      warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
      devices: [{ deviceNumber: '03', deviceType: 'R', description: 'Refrigerator 03' }],
      racks: [{ rackNumber: '01', description: 'Rack 01' }]
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('CheckinDiscardProductsService', [
      'verifyDiscardUnit', 'getProductCodes', 'getAboTypes',
      'getLocationDefaults', 'getDevices', 'getRacks', 'getTrays', 'checkinProduct'
    ]);

    mockService.verifyDiscardUnit.and.returnValue(of(mockDiscardUnitResponse as any));
    mockService.getProductCodes.and.returnValue(of(mockProductCodes as any));
    mockService.getAboTypes.and.returnValue(of(mockAboTypes as any));
    mockService.getLocationDefaults.and.returnValue(of(mockLocationDefaults as any));
    mockService.getDevices.and.returnValue(of({ success: true, item: [] } as any));
    mockService.getRacks.and.returnValue(of({ success: true, item: [] } as any));
    mockService.getTrays.and.returnValue(of({ success: true, item: [] } as any));
    mockService.checkinProduct.and.returnValue(of({ success: true, item: null } as any));



      TestBed.configureTestingModule({
      imports: [
        CheckinDiscardProducts,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CheckinDiscardProductsService, useValue: mockService },
        { provide: PageHeaderService, useValue: { pageHeaderData: pageHeaderDataSignal, getTitle: () => '', getSubtitle: () => undefined } }
      ]
    });


    


      mockService.verifyDiscardUnit.calls.reset();


      mockService.getProductCodes.calls.reset();


      mockService.getAboTypes.calls.reset();


      mockService.getLocationDefaults.calls.reset();


      mockService.getDevices.calls.reset();


      mockService.getRacks.calls.reset();


      mockService.getTrays.calls.reset();


      mockService.checkinProduct.calls.reset();


      mockService.verifyDiscardUnit.and.returnValue(of(mockDiscardUnitResponse as any));


      mockService.getProductCodes.and.returnValue(of(mockProductCodes as any));


      mockService.getAboTypes.and.returnValue(of(mockAboTypes as any));


      mockService.getLocationDefaults.and.returnValue(of(mockLocationDefaults as any));

      mockService.getDevices.and.returnValue(of({ success: true, item: [] } as any));

      mockService.getRacks.and.returnValue(of({ success: true, item: [] } as any));

      mockService.getTrays.and.returnValue(of({ success: true, item: [] } as any));

      mockService.checkinProduct.and.returnValue(of({ success: true, item: null } as any));


    fixture = TestBed.createComponent(CheckinDiscardProducts);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize filter form without unitId (handled by shared component)', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.f['productCode']).toBeDefined();
    expect(component.f['aboRh']).toBeDefined();
    expect(component.f['warehouseId']).toBeDefined();
    expect(component.f['trayNumber']).toBeDefined();
  });



  it('should verify discard unit via postValidate', fakeAsync(() => {
    const mockEvent = {
      data: { parsedUnitId: 'W633325060201' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockService.verifyDiscardUnit).toHaveBeenCalledWith('W633325060201');
    expect(mockEvent.confirm).toHaveBeenCalled();
    expect((component as any).validatedUnit()).toBeTruthy();
  }));

  it('should reject postValidate on service error', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(of({
      success: false, message: 'Invalid unit for this function', statusCode: 400
    } as any));

    const mockEvent = {
      data: { parsedUnitId: 'INVALID' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalled();
    expect(mockEvent.confirm).not.toHaveBeenCalled();
  }));

  it('should load product codes after unit validated', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect(mockService.getProductCodes).toHaveBeenCalled();
    expect((component as any).productCodes().length).toBeGreaterThan(0);
  }));





  it('should display table config with correct columns', () => {
    expect(component.tableConfig.columns.length).toBe(9);
    expect(component.tableConfig.columns[0].key).toBe('unitId');
    expect(component.tableConfig.columns[8].key).toBe('trayNumber');
    expect(component.tableConfig.showPagination).toBeFalse();
  });

  // --- onUnitPostValidate error path ---
  it('should reject postValidate on HTTP error', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(throwError(() => ({
      error: { message: 'Server error' }
    })));

    const mockEvent = {
      data: { parsedUnitId: 'BAD123' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalledWith('Server error');
    expect(mockEvent.confirm).not.toHaveBeenCalled();
  }), 15000);

  it('should reject postValidate on HTTP error with errorResponse.error', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(throwError(() => ({
      error: { errorResponse: { error: 'Detailed error' } }
    })));

    const mockEvent = {
      data: { parsedUnitId: 'BAD123' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalledWith('Detailed error');
  }), 15000);

  it('should reject postValidate with default message when no error details', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(throwError(() => ({
      error: {}
    })));

    const mockEvent = {
      data: { parsedUnitId: 'BAD123' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalledWith('Invalid unit for this function');
  }), 15000);

  // --- onUnitCleared ---
  it('should clear validated unit and reset fields on onUnitCleared', () => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);

    component.onUnitCleared();

    expect((component as any).validatedUnit()).toBeNull();
    expect((component as any).productCodes().length).toBe(0);
  });

  // --- loadProductCodes error path ---
  it('should handle loadProductCodes error', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    mockService.getProductCodes.and.returnValue(throwError(() => ({
      error: { message: 'Product load failed' }
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect((component as any).productCodes().length).toBe(0);
    expect((component as any).isLoadingProductCodes()).toBeFalse();
    expect(snackBar.open).toHaveBeenCalled();
  }), 15000);

  // --- loadProductCodes empty codes path ---
  it('should show error when no product codes returned', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    mockService.getProductCodes.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: []
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'No available products for this unit', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- loadProductCodes early return when unit is null ---
  it('should not load product codes when validatedUnit is null', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    mockService.getProductCodes.calls.reset();

    component.onUnitValidated({} as any);
    tick();

    expect(mockService.getProductCodes).not.toHaveBeenCalled();
  }), 15000);

  // --- onProductCodeSelected ---
  it('should load ABO types when product code selected', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    component.onProductCodeSelected();
    tick();

    expect((component as any).currentProductType()).toBe('FFP');
    expect(mockService.getAboTypes).toHaveBeenCalled();
  }), 15000);

  it('should not load ABO types when no product code selected', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: '' }, { emitEvent: false });
    mockService.getAboTypes.calls.reset();

    component.onProductCodeSelected();
    tick();

    expect(mockService.getAboTypes).not.toHaveBeenCalled();
  }), 15000);

  // --- loadAboTypes pool product path ---
  it('should handle pool product ABO types', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        aliquot: null,
        aliquotOptions: null,
        aboTypes: [{ bloodType: 'PO', aboDesc: 'Pool', expDate: null }],
        isPool: true
      }
    } as any));

    component.onProductCodeSelected();
    tick();

    expect((component as any).isPoolProduct()).toBeTrue();
    expect(component.f['aboRh'].value).toBe('PO');
    expect(mockService.getLocationDefaults).toHaveBeenCalled();
  }), 15000);

  // --- loadAboTypes single type auto-select ---
  it('should auto-select single ABO type', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        aliquot: '01',
        aliquotOptions: null,
        aboTypes: [{ bloodType: 'OP', aboDesc: 'O POS', expDate: null }],
        isPool: false
      }
    } as any));

    component.onProductCodeSelected();
    tick();

    expect(component.f['aboRh'].value).toBe('OP');
    expect(mockService.getLocationDefaults).toHaveBeenCalled();
  }), 15000);

  // --- loadAboTypes error path ---
  it('should handle loadAboTypes error', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(throwError(() => ({
      error: { message: 'ABO load failed' }
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onProductCodeSelected();
    tick();

    expect((component as any).isLoadingAboTypes()).toBeFalse();
    expect(snackBar.open).toHaveBeenCalled();
  }), 15000);

  // --- onAboSelected ---
  it('should load location defaults on ABO selected', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    component.onAboSelected();
    tick();

    expect(mockService.getLocationDefaults).toHaveBeenCalled();
  }), 15000);

  it('should not load location defaults when no bloodType', () => {
    component.filterForm.patchValue({ aboRh: '' }, { emitEvent: false });
    mockService.getLocationDefaults.calls.reset();

    component.onAboSelected();

    expect(mockService.getLocationDefaults).not.toHaveBeenCalled();
  });

  // --- loadLocationDefaults no-location device path ---
  it('should handle no-location device in location defaults', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        storageClass: 'FR', inventoryClass: 'AV',
        defaultWarehouseId: 'H', defaultDeviceNumber: '',
        defaultDeviceType: 'N', defaultRackNumber: '',
        warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
        devices: [{ deviceNumber: '00', deviceType: 'N', description: 'No Location' }],
        racks: []
      }
    } as any));

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Checked in', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: '',
        deviceNumber: '', rackNumber: '', trayNumber: ''
      }
    } as any));

    component.onAboSelected();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalled();
    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.deviceType).toBe('N');
  }), 15000);

  // --- loadLocationDefaults empty devices path ---
  it('should show error 0359 when no devices returned', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        storageClass: 'FR', inventoryClass: 'AV',
        defaultWarehouseId: 'H', defaultDeviceNumber: '',
        defaultDeviceType: '', defaultRackNumber: '',
        warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
        devices: [],
        racks: []
      }
    } as any));

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onAboSelected();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Error 0359: No product storage found for this warehouse and product type',
      'Close', jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- loadLocationDefaults error path ---
  it('should handle loadLocationDefaults error', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(throwError(() => ({
      error: { message: 'Location load failed' }
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onAboSelected();
    tick();

    expect((component as any).isLoadingLocation()).toBeFalse();
    expect(snackBar.open).toHaveBeenCalled();
  }), 15000);

  // --- loadLocationDefaults loads trays when all defaults present ---
  it('should load trays when all defaults present in location defaults', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of(mockLocationDefaults as any));
    mockService.getTrays.and.returnValue(of({
      success: true, item: [{ trayNumber: 'T1' }]
    } as any));

    component.onAboSelected();
    tick();

    expect(mockService.getTrays).toHaveBeenCalled();
    expect((component as any).trays().length).toBe(1);
  }), 15000);

  // --- onWarehouseChanged ---
  it('should load devices when warehouse changed', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: [
        { deviceNumber: '01', deviceType: 'R', description: 'Refrigerator' },
        { deviceNumber: '02', deviceType: 'F', description: 'Freezer' }
      ]
    } as any));

    component.onWarehouseChanged();
    tick();

    expect(mockService.getDevices).toHaveBeenCalledWith('H', 'FFP');
    expect((component as any).devices().length).toBe(2);
  }), 15000);

  it('should auto-select single device when warehouse changed', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ warehouseId: 'H', productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: [
        { deviceNumber: '01', deviceType: 'R', description: 'Refrigerator' }
      ]
    } as any));
    mockService.getRacks.and.returnValue(of({
      success: true, item: [{ rackNumber: '01', description: 'Rack 01' }]
    } as any));

    component.onWarehouseChanged();
    tick();

    expect(component.f['deviceNumber'].value).toBe('01');
    expect(mockService.getRacks).toHaveBeenCalled();
  }), 15000);

  it('should handle no-location device in onWarehouseChanged', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ warehouseId: 'H', productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: [
        { deviceNumber: '00', deviceType: 'N', description: 'No Location' }
      ]
    } as any));

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Checked in', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: '',
        deviceNumber: '', rackNumber: '', trayNumber: ''
      }
    } as any));

    component.onWarehouseChanged();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalled();
    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.deviceType).toBe('N');
  }), 15000);

  it('should show error when no devices in onWarehouseChanged', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: []
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onWarehouseChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Error 0359: No product storage found for this warehouse and product type',
      'Close', jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  it('should not load devices when warehouseId is empty', () => {
    component.filterForm.patchValue({ warehouseId: '' }, { emitEvent: false });
    mockService.getDevices.calls.reset();

    component.onWarehouseChanged();

    expect(mockService.getDevices).not.toHaveBeenCalled();
  });

  it('should handle getDevices error', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H' }, { emitEvent: false });
    mockService.getDevices.and.returnValue(throwError(() => new Error('fail')));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onWarehouseChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load devices', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- onDeviceChanged ---
  it('should load racks when device changed', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    (component as any).storageClass.set('FR');
    (component as any).currentProductType.set('FFP');
    (component as any).devices.set([{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }]);
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', aboRh: 'OP' }, { emitEvent: false });

    mockService.getRacks.and.returnValue(of({
      success: true, item: [{ rackNumber: '01', description: 'Rack 01' }]
    } as any));

    component.onDeviceChanged();
    tick();

    expect(mockService.getRacks).toHaveBeenCalled();
    expect((component as any).racks().length).toBe(1);
  }), 15000);

  it('should not load racks when warehouseId or deviceNumber is empty', () => {
    component.filterForm.patchValue({ warehouseId: '', deviceNumber: '' }, { emitEvent: false });
    mockService.getRacks.calls.reset();

    component.onDeviceChanged();

    expect(mockService.getRacks).not.toHaveBeenCalled();
  });

  it('should handle getRacks error', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    (component as any).storageClass.set('FR');
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', aboRh: 'OP' }, { emitEvent: false });

    mockService.getRacks.and.returnValue(throwError(() => new Error('fail')));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onDeviceChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load racks', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- onRackChanged ---
  it('should load trays when rack changed', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', rackNumber: '01' }, { emitEvent: false });

    mockService.getTrays.and.returnValue(of({
      success: true, item: [{ trayNumber: 'T1' }, { trayNumber: 'T2' }]
    } as any));

    component.onRackChanged();
    tick();

    expect(mockService.getTrays).toHaveBeenCalled();
    expect((component as any).trays().length).toBe(2);
  }), 15000);

  it('should not load trays when rack fields are incomplete', () => {
    component.filterForm.patchValue({ warehouseId: '', deviceNumber: '', rackNumber: '' }, { emitEvent: false });
    mockService.getTrays.calls.reset();

    component.onRackChanged();

    expect(mockService.getTrays).not.toHaveBeenCalled();
  });

  it('should handle getTrays error', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', rackNumber: '01' }, { emitEvent: false });

    mockService.getTrays.and.returnValue(throwError(() => new Error('fail')));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onRackChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load trays', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- onTrayChanged ---
  it('should perform checkin when tray changed and canCheckin is true', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).resolvedAliquot.set('01');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Product checked in successfully', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
      }
    } as any));

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalled();
    expect((component as any).inventoryData().length).toBe(1);
  }), 15000);

  it('should not perform checkin when tray changed but canCheckin is false', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    component.filterForm.patchValue({ trayNumber: 'T1' }, { emitEvent: false });
    mockService.checkinProduct.calls.reset();

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  it('should not do anything when trayNumber is empty', () => {
    component.filterForm.patchValue({ trayNumber: '' }, { emitEvent: false });
    mockService.checkinProduct.calls.reset();

    component.onTrayChanged();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  });

  // --- performCheckin error paths ---
  it('should show error on checkin failure response', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: false, message: 'Failed to check in product', statusCode: 400
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onTrayChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  it('should show expired warning dialog on error code 5106', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorResponse: { errorCode: '5106', error: 'Product is expired', isWarning: true } }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  it('should show expired warning and retry checkin on confirm', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', error: 'Product is expired', isWarning: true } }
        }));
      }
      return of({
        success: true, message: 'Product checked in successfully', statusCode: 200,
        item: {
          unitId: 'W633325060201', collDate: '2026-06-01',
          productCode: 'E0701V00', aboRh: 'OP',
          expirationDate: '2026-12-01', warehouseId: 'H',
          deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
        }
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalledTimes(2);
    const secondCall = mockService.checkinProduct.calls.argsFor(1)[0];
    expect(secondCall.forceExpired).toBeTrue();
  }), 15000);

  it('should show general error on checkin HTTP error without warning', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { message: 'Server error' }
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onTrayChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  // --- performCheckinNoLocation ---
  it('should perform no-location checkin successfully', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    (component as any).resolvedAliquot.set('01');

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Product checked in successfully (no location)', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: '',
        deviceNumber: '', rackNumber: '', trayNumber: ''
      }
    } as any));

    (component as any).performCheckinNoLocation();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalled();
    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.deviceType).toBe('N');
    expect(request.forceExpired).toBeFalse();
    expect((component as any).inventoryData().length).toBe(1);
  }), 15000);

  it('should handle no-location checkin failure response', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: false, message: 'Failed to check in product', statusCode: 400
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  it('should show expired warning dialog for no-location checkin on 5106 error', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorResponse: { errorCode: '5106', isWarning: true } }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).performCheckinNoLocation();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  it('should retry no-location checkin with forceExpired on dialog confirm', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    (component as any).resolvedAliquot.set('01');

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: true, message: 'Forced check in', statusCode: 200,
        item: {
          unitId: 'W633325060201', collDate: '2026-06-01',
          productCode: 'E0701V00', aboRh: 'OP',
          expirationDate: '2026-12-01', warehouseId: '',
          deviceNumber: '', rackNumber: '', trayNumber: ''
        }
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).performCheckinNoLocation();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalledTimes(2);
    const secondCall = mockService.checkinProduct.calls.argsFor(1)[0];
    expect(secondCall.forceExpired).toBeTrue();
    expect(secondCall.deviceType).toBe('N');
  }), 15000);

  it('should handle no-location checkin general HTTP error', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { message: 'Server error' }
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  it('should not perform no-location checkin when unit is null', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    mockService.checkinProduct.calls.reset();

    (component as any).performCheckinNoLocation();
    tick();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  // --- showExpiredWarningForNoLocation: retry error path ---
  it('should handle error on forced no-location checkin retry', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return throwError(() => ({
        error: { message: 'Retry failed' }
      }));
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect((component as any).isCheckingIn()).toBeFalse();
    expect(snackBar.open).toHaveBeenCalled();
  }), 15000);

  // --- showExpiredWarningForNoLocation: failure response on retry ---
  it('should handle failure response on forced no-location checkin retry', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: false, message: 'Still failed', statusCode: 400
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Still failed', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- clearForm ---
  it('should reset form and signals on clearForm', () => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    component.clearForm();

    expect((component as any).validatedUnit()).toBeNull();
    expect((component as any).productCodes().length).toBe(0);
    expect((component as any).aboTypes().length).toBe(0);
    expect((component as any).warehouses().length).toBe(0);
  });

  // --- onSortChange ---
  it('should sort inventory data ascending', () => {
    (component as any).inventoryData.set([
      { unitId: 'B', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' },
      { unitId: 'A', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' }
    ]);

    component.onSortChange({ column: 'unitId', direction: 'A' });

    expect((component as any).inventoryData()[0].unitId).toBe('A');
    expect((component as any).inventoryData()[1].unitId).toBe('B');
  });

  it('should sort inventory data descending', () => {
    (component as any).inventoryData.set([
      { unitId: 'A', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' },
      { unitId: 'B', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' }
    ]);

    component.onSortChange({ column: 'unitId', direction: 'D' });

    expect((component as any).inventoryData()[0].unitId).toBe('B');
    expect((component as any).inventoryData()[1].unitId).toBe('A');
  });

  it('should not reorder on default sort direction', () => {
    (component as any).inventoryData.set([
      { unitId: 'B', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' },
      { unitId: 'A', collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' }
    ]);

    component.onSortChange({ column: 'unitId', direction: 'default' });

    expect((component as any).inventoryData()[0].unitId).toBe('B');
  });

  // --- onDropdownOpened ---
  it('should reset search controls when dropdown opened', () => {
    component.productCodeSearchControl.setValue('test');
    component.aboSearchControl.setValue('test');
    component.warehouseSearchControl.setValue('test');

    component.onDropdownOpened(true);

    expect(component.productCodeSearchControl.value).toBe('');
    expect(component.aboSearchControl.value).toBe('');
    expect(component.warehouseSearchControl.value).toBe('');
  });

  it('should not reset search controls when dropdown closed', () => {
    component.productCodeSearchControl.setValue('test');

    component.onDropdownOpened(false);

    expect(component.productCodeSearchControl.value).toBe('test');
  });

  // --- valueFormatter for collDate ---
  it('should format collection date correctly', () => {
    const collDateCol = component.tableConfig.columns.find(c => c.key === 'collDate');
    expect(collDateCol?.valueFormatter).toBeDefined();
    if (collDateCol?.valueFormatter) {
      const result = collDateCol.valueFormatter('2026-01-15', {} as any);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }
  });

  it('should return dash for empty collection date', () => {
    const collDateCol = component.tableConfig.columns.find(c => c.key === 'collDate');
    if (collDateCol?.valueFormatter) {
      expect(collDateCol.valueFormatter('', {} as any)).toBe('-');
    }
  });

  // --- valueFormatter for expirationDate ---
  it('should format expiration date correctly', () => {
    const expDateCol = component.tableConfig.columns.find(c => c.key === 'expirationDate');
    expect(expDateCol?.valueFormatter).toBeDefined();
    if (expDateCol?.valueFormatter) {
      const result = expDateCol.valueFormatter('2026-12-01T14:30:00', {} as any);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    }
  });

  it('should return dash for empty expiration date', () => {
    const expDateCol = component.tableConfig.columns.find(c => c.key === 'expirationDate');
    if (expDateCol?.valueFormatter) {
      expect(expDateCol.valueFormatter('', {} as any)).toBe('-');
    }
  });

  // --- ngOnDestroy ---
  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // --- isEmpty computed ---
  it('should return true for isEmpty when no data and not checking in', () => {
    (component as any).inventoryData.set([]);
    (component as any).isCheckingIn.set(false);

    expect((component as any).isEmpty()).toBeTrue();
  });

  it('should return false for isEmpty when there is data', () => {
    (component as any).inventoryData.set([{
      unitId: 'W633325060201', collDate: '2026-06-01',
      productCode: 'E0701V00', aboRh: 'OP',
      expirationDate: '2026-12-01', warehouseId: 'H',
      deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
    }]);

    expect((component as any).isEmpty()).toBeFalse();
  });

  it('should return false for isEmpty when checking in', () => {
    (component as any).inventoryData.set([]);
    (component as any).isCheckingIn.set(true);

    expect((component as any).isEmpty()).toBeFalse();
  });

  // --- setupSearchFilters ---
  it('should filter product codes based on search term', fakeAsync(() => {
    (component as any).productCodes.set([
      { productCode: 'E0701V00', productType: 'FFP' },
      { productCode: 'E0200V00', productType: 'RBC' }
    ]);

    component.productCodeSearchControl.setValue('RBC');
    tick();

    expect((component as any).filteredProductCodes().length).toBe(1);
    expect((component as any).filteredProductCodes()[0].productType).toBe('RBC');
  }), 15000);

  it('should filter ABO types based on search term', fakeAsync(() => {
    (component as any).aboTypes.set([
      { bloodType: 'OP', aboDesc: 'O POS', expDate: null },
      { bloodType: 'AN', aboDesc: 'A NEG', expDate: null }
    ]);

    component.aboSearchControl.setValue('NEG');
    tick();

    expect((component as any).filteredAboTypes().length).toBe(1);
    expect((component as any).filteredAboTypes()[0].bloodType).toBe('AN');
  }), 15000);

  it('should filter warehouses based on search term', fakeAsync(() => {
    (component as any).warehouses.set([
      { warehouseId: 'H', description: 'Hospital' },
      { warehouseId: 'L', description: 'Lab' }
    ]);

    component.warehouseSearchControl.setValue('lab');
    tick();

    expect((component as any).filteredWarehouses().length).toBe(1);
    expect((component as any).filteredWarehouses()[0].warehouseId).toBe('L');
  }), 15000);

  // --- elementId and errorId ---
  it('should generate element IDs correctly', () => {
    const id = (component as any).elementId('test');
    expect(id).toContain('checkin-discard-products-');
    expect(id).toContain('-test');
  });

  it('should generate error IDs correctly', () => {
    const id = (component as any).errorId('field');
    expect(id).toContain('checkin-discard-products-');
    expect(id).toContain('-field-error');
  });

  // --- performCheckin with null unit early return ---
  it('should not perform checkin when validatedUnit is null', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    mockService.checkinProduct.calls.reset();

    (component as any).performCheckin(false);
    tick();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  // --- verifyDiscardUnit with response.data instead of response.item ---
  it('should handle verifyDiscardUnit response with data property', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      data: { unitId: 'W633325060201', collDate: '2026-06-01' }
    } as any));

    const mockEvent = {
      data: { parsedUnitId: 'W633325060201' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.confirm).toHaveBeenCalled();
  }), 15000);

  // --- loadProductCodes with data property ---
  it('should handle loadProductCodes response with data property', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    mockService.getProductCodes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      data: [{ productCode: 'E0200V00', productType: 'RBC' }]
    } as any));

    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect((component as any).productCodes().length).toBe(1);
    expect((component as any).productCodes()[0].productCode).toBe('E0200V00');
  }), 15000);

  // --- checkinProduct with data property ---
  it('should handle checkin response with data property', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      data: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
      }
    } as any));

    component.onTrayChanged();
    tick();

    expect((component as any).inventoryData().length).toBe(1);
  }), 15000);

  // --- resetLocationFields ---
  it('should reset location fields properly', () => {
    (component as any).warehouses.set([{ warehouseId: 'H', description: 'Hospital' }]);
    (component as any).devices.set([{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }]);
    (component as any).racks.set([{ rackNumber: '01', description: 'Rack 01' }]);
    (component as any).trays.set([{ trayNumber: 'T1' }]);
    (component as any).storageClass.set('FR');
    (component as any).inventoryClass.set('AV');
    (component as any).currentDeviceType.set('R');

    (component as any).resetLocationFields();

    expect((component as any).warehouses().length).toBe(0);
    expect((component as any).devices().length).toBe(0);
    expect((component as any).racks().length).toBe(0);
    expect((component as any).trays().length).toBe(0);
    expect((component as any).storageClass()).toBe('');
    expect((component as any).inventoryClass()).toBe('');
    expect((component as any).currentDeviceType()).toBe('');
  });

  // --- sort with null/undefined values to cover ?? fallback ---
  it('should handle sort with null/undefined column values', () => {
    (component as any).inventoryData.set([
      { unitId: null, collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' } as any,
      { collDate: '', productCode: '', aboRh: '', expirationDate: '', warehouseId: '', deviceNumber: '', rackNumber: '', trayNumber: '' } as any
    ]);

    component.onSortChange({ column: 'unitId', direction: 'A' });

    expect((component as any).inventoryData().length).toBe(2);
  });

  // --- constructor effect with page header data ---
  it('should update page header config when page header data has subtitle', () => {
    pageHeaderDataSignal.set({ title: 'Test Title', subtitle: 'Test Sub' });
    fixture.detectChanges();

    expect(component.pageHeaderConfig.title).toBe('Test Title');
    expect(component.pageHeaderConfig.subtitle).toBe('Test Sub');
    expect(component.pageHeaderConfig.breadcrumbs.length).toBe(2);

    pageHeaderDataSignal.set(undefined);
  });

  it('should use default subtitle when page header data has no subtitle', () => {
    pageHeaderDataSignal.set({ title: 'No Sub Title' });
    fixture.detectChanges();

    expect(component.pageHeaderConfig.title).toBe('No Sub Title');
    expect(component.pageHeaderConfig.subtitle).toBe('Move products from discard to available inventory');

    pageHeaderDataSignal.set(undefined);
  });

  // --- loadLocationDefaults with null unit early return ---
  it('should not load location defaults when unit is null', () => {
    (component as any).validatedUnit.set(null);
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    mockService.getLocationDefaults.calls.reset();

    component.onAboSelected();

    // loadLocationDefaults should not be called since bloodType is 'OP' but unit is null
    // Actually onAboSelected checks bloodType first, then loadLocationDefaults checks unit
    // But since bloodType is set, it calls loadLocationDefaults which checks unit internally
    expect(mockService.getLocationDefaults).not.toHaveBeenCalled();
  });

  // --- onDeviceChanged updates currentDeviceType ---
  it('should update currentDeviceType when selected device found', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    (component as any).storageClass.set('FR');
    (component as any).currentProductType.set('FFP');
    (component as any).devices.set([
      { deviceNumber: '03', deviceType: 'F', description: 'Freezer' },
      { deviceNumber: '04', deviceType: 'R', description: 'Ref' }
    ]);
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', aboRh: 'OP' }, { emitEvent: false });

    mockService.getRacks.and.returnValue(of({
      success: true, item: [{ rackNumber: '01', description: 'Rack 01' }]
    } as any));

    component.onDeviceChanged();
    tick();

    expect((component as any).currentDeviceType()).toBe('F');
  }), 15000);

  // --- Branch coverage: onUnitPostValidate reject with null message ---
  it('should reject postValidate with default message when response.message is null', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(of({
      success: false, message: null, statusCode: 400
    } as any));

    const mockEvent = {
      data: { parsedUnitId: 'BAD123' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalledWith('Invalid unit for this function');
  }), 15000);

  // --- Branch coverage: onUnitPostValidate success=true but no item/data ---
  it('should reject postValidate when success=true but no item or data', fakeAsync(() => {
    mockService.verifyDiscardUnit.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));

    const mockEvent = {
      data: { parsedUnitId: 'W633325060201' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };

    component.onUnitPostValidate(mockEvent as any);
    tick();

    expect(mockEvent.reject).toHaveBeenCalled();
    expect(mockEvent.confirm).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: loadProductCodes using response.data fallback with empty array ---
  it('should fallback to empty array when both item and data are null', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    mockService.getProductCodes.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect((component as any).productCodes().length).toBe(0);
    expect(snackBar.open).toHaveBeenCalledWith(
      'No available products for this unit', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: loadProductCodes error with no error.message ---
  it('should use default error message when loadProductCodes error has no message', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    mockService.getProductCodes.and.returnValue(throwError(() => ({
      error: {}
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onUnitValidated({ parsedUnitId: 'W633325060201' } as any);
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load product codes', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: loadAboTypes with null data response ---
  it('should handle loadAboTypes with null data response', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));

    component.onProductCodeSelected();
    tick();

    expect((component as any).isLoadingAboTypes()).toBeFalse();
  }), 15000);

  // --- Branch coverage: loadAboTypes error with no error.message ---
  it('should use default error message when loadAboTypes error has no message', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(throwError(() => ({
      error: {}
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onProductCodeSelected();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load ABO types', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: loadAboTypes multiple types (no auto-select, no pool) ---
  it('should not auto-select when multiple ABO types returned', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        aliquot: '01',
        aliquotOptions: ['01', '02'],
        aboTypes: [
          { bloodType: 'OP', aboDesc: 'O POS', expDate: null },
          { bloodType: 'AN', aboDesc: 'A NEG', expDate: null }
        ],
        isPool: false
      }
    } as any));
    mockService.getLocationDefaults.calls.reset();

    component.onProductCodeSelected();
    tick();

    expect((component as any).aboTypes().length).toBe(2);
    expect((component as any).aliquotOptions()).toEqual(['01', '02']);
    expect(mockService.getLocationDefaults).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: loadAboTypes with null aliquot ---
  it('should handle loadAboTypes with null aliquot and empty aboTypes', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        aliquot: null,
        aliquotOptions: null,
        aboTypes: [],
        isPool: false
      }
    } as any));

    component.onProductCodeSelected();
    tick();

    expect((component as any).resolvedAliquot()).toBeNull();
    expect((component as any).aboTypes().length).toBe(0);
    expect((component as any).isPoolProduct()).toBeFalse();
  }), 15000);

  // --- Branch coverage: loadLocationDefaults with null data ---
  it('should handle loadLocationDefaults with null response data', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));

    component.onAboSelected();
    tick();

    expect((component as any).isLoadingLocation()).toBeFalse();
  }), 15000);

  // --- Branch coverage: loadLocationDefaults error with no error.message ---
  it('should use default error message when loadLocationDefaults error has no message', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(throwError(() => ({
      error: {}
    })));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onAboSelected();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load location defaults', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: loadLocationDefaults with missing default values ---
  it('should handle location defaults with missing default values', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
        devices: [{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }],
        racks: [{ rackNumber: '01', description: 'Rack 01' }]
      }
    } as any));

    component.onAboSelected();
    tick();

    expect((component as any).storageClass()).toBe('');
    expect((component as any).inventoryClass()).toBe('');
    expect((component as any).currentDeviceType()).toBe('');
  }), 15000);

  // --- Branch coverage: loadLocationDefaults with defaults but no tray loading ---
  it('should not load trays when defaultRackNumber is missing', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        storageClass: 'FR', inventoryClass: 'AV',
        defaultWarehouseId: 'H', defaultDeviceNumber: '03',
        defaultDeviceType: 'R', defaultRackNumber: '',
        warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
        devices: [{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }],
        racks: []
      }
    } as any));
    mockService.getTrays.calls.reset();

    component.onAboSelected();
    tick();

    expect(mockService.getTrays).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: onProductCodeSelected with no matching product ---
  it('should not set productType when selected product not found in list', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'OTHER', productType: 'PLT' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    component.onProductCodeSelected();
    tick();

    expect(mockService.getAboTypes).toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: onProductCodeSelected with no unit ---
  it('should not load ABO types when unit is null in onProductCodeSelected', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });
    mockService.getAboTypes.calls.reset();

    component.onProductCodeSelected();
    tick();

    expect(mockService.getAboTypes).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: loadLocationDefaults early return with no productCode ---
  it('should not load location defaults when productCode is empty', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: '', aboRh: 'OP' }, { emitEvent: false });
    mockService.getLocationDefaults.calls.reset();

    component.onAboSelected();
    tick();

    expect(mockService.getLocationDefaults).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: performCheckin success with response.data and null message ---
  it('should use default success message when checkin message is null', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).resolvedAliquot.set('01');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
      }
    } as any));

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onTrayChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Product checked in successfully', 'Close',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: performCheckin failure with null message ---
  it('should use default error message when checkin failure message is null', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: false, message: null, statusCode: 400
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onTrayChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: performCheckin success but no item or data ---
  it('should show error when checkin succeeds but has no item or data', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onTrayChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: performCheckinNoLocation success with null message ---
  it('should use default success message for no-location checkin when message is null', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    (component as any).resolvedAliquot.set('01');

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: '',
        deviceNumber: '', rackNumber: '', trayNumber: ''
      }
    } as any));

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Product checked in successfully (no location)', 'Close',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: performCheckinNoLocation failure with null message ---
  it('should use default error message for no-location checkin failure when message is null', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: false, message: null, statusCode: 400
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: performCheckinNoLocation success but no item/data ---
  it('should show error for no-location checkin when success but no item/data', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: null, statusCode: 200, item: null, data: null
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: showExpiredWarningForNoLocation null unit ---
  it('should not retry checkin when unit is null in showExpiredWarningForNoLocation', fakeAsync(() => {
    (component as any).validatedUnit.set(null);
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).showExpiredWarningForNoLocation();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: checkin error with isWarning flag (without errorCode 5106) ---
  it('should show expired warning on isWarning flag without errorCode', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorResponse: { isWarning: true } }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: onTrayChanged with empty tray but canCheckin true ---
  it('should not checkin when trayNumber is set but other fields are missing', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: '', deviceNumber: '',
      rackNumber: '', trayNumber: 'T1'
    }, { emitEvent: false });
    mockService.checkinProduct.calls.reset();

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: search filter with null/undefined input ---
  it('should handle null search term in product code filter', fakeAsync(() => {
    (component as any).productCodes.set([
      { productCode: 'E0701V00', productType: 'FFP' }
    ]);

    component.productCodeSearchControl.setValue(null as any);
    tick();

    expect((component as any).filteredProductCodes().length).toBe(1);
  }), 15000);

  it('should handle null search term in ABO filter', fakeAsync(() => {
    (component as any).aboTypes.set([
      { bloodType: 'OP', aboDesc: 'O POS', expDate: null }
    ]);

    component.aboSearchControl.setValue(null as any);
    tick();

    expect((component as any).filteredAboTypes().length).toBe(1);
  }), 15000);

  it('should handle null search term in warehouse filter', fakeAsync(() => {
    (component as any).warehouses.set([
      { warehouseId: 'H', description: 'Hospital' }
    ]);

    component.warehouseSearchControl.setValue(null as any);
    tick();

    expect((component as any).filteredWarehouses().length).toBe(1);
  }), 15000);

  // --- Branch coverage: performCheckin with empty optional fields ---
  it('should handle performCheckin with empty deviceNumber and rackNumber', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).resolvedAliquot.set(null);
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '',
      rackNumber: '', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Done', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '', rackNumber: '', trayNumber: 'T1'
      }
    } as any));

    (component as any).performCheckin(false);
    tick();

    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.deviceNumber).toBe('');
    expect(request.rackNumber).toBe('');
    expect(request.aliquot).toBe('');
  }), 15000);

  // --- Branch coverage: loadAboTypes with response.data ---
  it('should handle loadAboTypes with response.data instead of item', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).productCodes.set([{ productCode: 'E0701V00', productType: 'FFP' }]);
    component.filterForm.patchValue({ productCode: 'E0701V00' }, { emitEvent: false });

    mockService.getAboTypes.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: null,
      data: {
        aliquot: '01',
        aliquotOptions: null,
        aboTypes: [{ bloodType: 'OP', aboDesc: 'O POS', expDate: null }],
        isPool: false
      }
    } as any));

    component.onProductCodeSelected();
    tick();

    expect((component as any).aboTypes().length).toBe(1);
    expect(component.f['aboRh'].value).toBe('OP');
  }), 15000);

  // --- Branch coverage: loadLocationDefaults with response.data ---
  it('should handle loadLocationDefaults with response.data instead of item', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.getLocationDefaults.and.returnValue(of({
      success: true, message: null, statusCode: 200,
      item: null,
      data: {
        storageClass: 'FR', inventoryClass: 'AV',
        defaultWarehouseId: 'H', defaultDeviceNumber: '03',
        defaultDeviceType: 'R', defaultRackNumber: '01',
        warehouses: [{ warehouseId: 'H', description: 'Hospital' }],
        devices: [{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }],
        racks: [{ rackNumber: '01', description: 'Rack 01' }]
      }
    } as any));
    mockService.getTrays.and.returnValue(of({
      success: true, item: [{ trayNumber: 'T1' }]
    } as any));

    component.onAboSelected();
    tick();

    expect((component as any).storageClass()).toBe('FR');
    expect(mockService.getTrays).toHaveBeenCalled();
  }), 15000);

  // --- Branch coverage: onWarehouseChanged with response.data ---
  it('should handle getDevices with response.data instead of item', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: null,
      data: [
        { deviceNumber: '01', deviceType: 'R', description: 'Refrigerator' },
        { deviceNumber: '02', deviceType: 'F', description: 'Freezer' }
      ]
    } as any));

    component.onWarehouseChanged();
    tick();

    expect((component as any).devices().length).toBe(2);
  }), 15000);

  // --- Branch coverage: onDeviceChanged with response.data ---
  it('should handle getRacks with response.data instead of item', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    (component as any).storageClass.set('FR');
    (component as any).currentProductType.set('FFP');
    (component as any).devices.set([{ deviceNumber: '03', deviceType: 'R', description: 'Ref' }]);
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', aboRh: 'OP' }, { emitEvent: false });

    mockService.getRacks.and.returnValue(of({
      success: true, item: null,
      data: [{ rackNumber: '01', description: 'Rack 01' }]
    } as any));

    component.onDeviceChanged();
    tick();

    expect((component as any).racks().length).toBe(1);
  }), 15000);

  // --- Branch coverage: onRackChanged / loadTrays with response.data ---
  it('should handle getTrays with response.data instead of item', fakeAsync(() => {
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({ warehouseId: 'H', deviceNumber: '03', rackNumber: '01' }, { emitEvent: false });

    mockService.getTrays.and.returnValue(of({
      success: true, item: null,
      data: [{ trayNumber: 'T1' }]
    } as any));

    component.onRackChanged();
    tick();

    expect((component as any).trays().length).toBe(1);
  }), 15000);

  // --- Branch coverage: onWarehouseChanged with null response item and data ---
  it('should handle getDevices with null item and data', fakeAsync(() => {
    (component as any).currentProductType.set('FFP');
    component.filterForm.patchValue({ warehouseId: 'H' }, { emitEvent: false });

    mockService.getDevices.and.returnValue(of({
      success: true, item: null, data: null
    } as any));
    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    component.onWarehouseChanged();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Error 0359: No product storage found for this warehouse and product type',
      'Close', jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- Branch coverage: checkin with no-location checkin using response.data ---
  it('should handle no-location checkin with response.data instead of item', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    (component as any).resolvedAliquot.set('01');

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Checked in', statusCode: 200,
      item: null,
      data: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: '',
        deviceNumber: '', rackNumber: '', trayNumber: ''
      }
    } as any));

    (component as any).performCheckinNoLocation();
    tick();

    expect((component as any).inventoryData().length).toBe(1);
  }), 15000);

  // --- Branch coverage: showExpiredWarningForNoLocation retry success with response.data ---
  it('should handle no-location retry success with response.data', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });
    (component as any).resolvedAliquot.set('01');

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: true, message: 'Forced check in', statusCode: 200,
        item: null,
        data: {
          unitId: 'W633325060201', collDate: '2026-06-01',
          productCode: 'E0701V00', aboRh: 'OP',
          expirationDate: '2026-12-01', warehouseId: '',
          deviceNumber: '', rackNumber: '', trayNumber: ''
        }
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).performCheckinNoLocation();
    tick();

    expect((component as any).inventoryData().length).toBe(1);
  }), 15000);

  // --- TRAY_FULL error code path ---
  it('should show tray full warning dialog on TRAY_FULL error code', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorCode: 'TRAY_FULL' }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  // --- showTrayFullWarning confirm path ---
  it('should retry checkin with forceOverCapacity on tray full dialog confirm', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorCode: 'TRAY_FULL' }
        }));
      }
      return of({
        success: true, message: 'Product checked in successfully', statusCode: 200,
        item: {
          unitId: 'W633325060201', collDate: '2026-06-01',
          productCode: 'E0701V00', aboRh: 'OP',
          expirationDate: '2026-12-01', warehouseId: 'H',
          deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
        }
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).toHaveBeenCalledTimes(2);
    const secondCall = mockService.checkinProduct.calls.argsFor(1)[0];
    expect(secondCall.forceOverCapacity).toBeTrue();
    expect(secondCall.forceExpired).toBeFalse();
  }), 15000);

  // --- TRAY_FULL via errorResponse.errorCode ---
  it('should show tray full warning on errorResponse.errorCode TRAY_FULL', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorResponse: { errorCode: 'TRAY_FULL' } }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
  }), 15000);

  // --- performCheckin with errorCode 5106 directly on error (not errorResponse) ---
  it('should show expired warning on error.errorCode 5106', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorCode: '5106' }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.onTrayChanged();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
  }), 15000);

  // --- performCheckinNoLocation with errorCode 5106 directly on error ---
  it('should show expired warning for no-location checkin on error.errorCode 5106', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorCode: '5106' }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).performCheckinNoLocation();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
  }), 15000);

  // --- onTrayChanged sets selectedShelfNumber from tray ---
  it('should set selectedShelfNumber from matched tray', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).trays.set([
      { trayNumber: 'T1', shelfNumber: 'S1' },
      { trayNumber: 'T2', shelfNumber: 'S2' }
    ]);
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Done', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
      }
    } as any));

    component.onTrayChanged();
    tick();

    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.shelfNumber).toBe('S1');
  }), 15000);

  // --- onTrayChanged with no matching tray falls back to empty shelfNumber ---
  it('should set empty shelfNumber when tray not found in list', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).trays.set([]);
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(of({
      success: true, message: 'Done', statusCode: 200,
      item: {
        unitId: 'W633325060201', collDate: '2026-06-01',
        productCode: 'E0701V00', aboRh: 'OP',
        expirationDate: '2026-12-01', warehouseId: 'H',
        deviceNumber: '03', rackNumber: '01', trayNumber: 'T1'
      }
    } as any));

    component.onTrayChanged();
    tick();

    const request = mockService.checkinProduct.calls.mostRecent().args[0];
    expect(request.shelfNumber).toBe('');
  }), 15000);

  // --- canCheckin returns false when isCheckingIn is true ---
  it('should not perform checkin when isCheckingIn is true', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    (component as any).currentDeviceType.set('R');
    (component as any).isCheckingIn.set(true);
    component.filterForm.patchValue({
      productCode: 'E0701V00', aboRh: 'OP',
      warehouseId: 'H', deviceNumber: '03',
      rackNumber: '01', trayNumber: 'T1'
    }, { emitEvent: false });
    mockService.checkinProduct.calls.reset();

    component.onTrayChanged();
    tick();

    expect(mockService.checkinProduct).not.toHaveBeenCalled();
  }), 15000);

  // --- showExpiredWarningForNoLocation with no-location isWarning on error directly ---
  it('should show expired warning for no-location on errorResponse isWarning flag', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    mockService.checkinProduct.and.returnValue(throwError(() => ({
      error: { errorResponse: { isWarning: true } }
    })));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    (component as any).performCheckinNoLocation();
    tick();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect((component as any).isCheckingIn()).toBeFalse();
  }), 15000);

  // --- clearForm when unitIdField is undefined ---
  it('should handle clearForm when unitIdField is not set', () => {
    (component as any).unitIdField = undefined;
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });

    component.clearForm();

    expect((component as any).validatedUnit()).toBeNull();
  });

  // --- showExpiredWarningForNoLocation retry success with null message ---
  it('should use default success message on no-location retry with null message', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: true, message: null, statusCode: 200,
        item: {
          unitId: 'W633325060201', collDate: '2026-06-01',
          productCode: 'E0701V00', aboRh: 'OP',
          expirationDate: '2026-12-01', warehouseId: '',
          deviceNumber: '', rackNumber: '', trayNumber: ''
        }
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Product checked in successfully (no location)', 'Close',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  }), 15000);

  // --- showExpiredWarningForNoLocation retry failure with null message ---
  it('should use default error message on no-location retry failure with null message', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: false, message: null, statusCode: 400
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

  // --- showExpiredWarningForNoLocation retry success but no item/data ---
  it('should show error on no-location retry when success but no item/data', fakeAsync(() => {
    (component as any).validatedUnit.set({ unitId: 'W633325060201', collDate: '2026-06-01' });
    component.filterForm.patchValue({ productCode: 'E0701V00', aboRh: 'OP' }, { emitEvent: false });

    let callCount = 0;
    mockService.checkinProduct.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => ({
          error: { errorResponse: { errorCode: '5106', isWarning: true } }
        }));
      }
      return of({
        success: true, message: null, statusCode: 200, item: null, data: null
      } as any);
    });

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    const snackBar = component['snackBar'];
    spyOn(snackBar, 'open');

    (component as any).performCheckinNoLocation();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to check in product', 'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] })
    );
  }), 15000);

});
