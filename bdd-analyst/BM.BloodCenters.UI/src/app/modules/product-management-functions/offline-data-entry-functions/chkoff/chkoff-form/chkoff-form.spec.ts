import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ChkOffForm } from './chkoff-form';
import { ChkOffService } from '../services/chkoff.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';
import moment from 'moment';

describe('ChkOffForm', () => {
  let component: ChkOffForm;
  let fixture: ComponentFixture<ChkOffForm>;
  let serviceSpy: jasmine.SpyObj<ChkOffService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;

  const mockHeaderService: any = {
    chapterTimeZone: signal(''),
    getCurrentWarehouseId: jasmine.createSpy('getCurrentWarehouseId').and.returnValue('')
  };

  const mockChapterTimezoneService = {
    isChapterLocalDateAvailable: () => false,
    getChapterLocalDate: () => ({ clone: () => ({ hour: () => ({ minute: () => ({}) }) }) })
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ChkOffService', [
      'getInventoryClasses',
      'validateUnit',
      'checkInProduct',
      'getProductCodes',
      'getAboTypes',
      'getWarehouses',
      'getDevices',
      'getRacks',
      'getTrays'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();
    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan',
      'validateAboScan',
      'validateExpdateScan'
    ]);

    serviceSpy.getInventoryClasses.and.returnValue(of([
      { code: 'RE', codeDesc: 'Regular', effDate: '2020-01-01', termDate: null },
      { code: 'SP', codeDesc: 'Special', effDate: '2020-01-01', termDate: null }
    ]));
    serviceSpy.getWarehouses.and.returnValue(of([]));
    serviceSpy.getDevices.and.returnValue(of([]));
    serviceSpy.getRacks.and.returnValue(of([]));
    serviceSpy.getTrays.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [ChkOffForm, NoopAnimationsModule],
      providers: [
        { provide: ChkOffService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });


    


      serviceSpy.getInventoryClasses.calls.reset();


      serviceSpy.validateUnit.calls.reset();


      serviceSpy.checkInProduct.calls.reset();


      serviceSpy.getProductCodes.calls.reset();


      serviceSpy.getAboTypes.calls.reset();


      serviceSpy.getWarehouses.calls.reset();


      serviceSpy.getDevices.calls.reset();


      serviceSpy.getRacks.calls.reset();


      serviceSpy.getTrays.calls.reset();


      labelScanSpy.validateProductScan.calls.reset();


      labelScanSpy.validateAboScan.calls.reset();


      labelScanSpy.validateExpdateScan.calls.reset();


      serviceSpy.getWarehouses.and.returnValue(of([]));


      serviceSpy.getDevices.and.returnValue(of([]));


      serviceSpy.getRacks.and.returnValue(of([]));


      serviceSpy.getTrays.and.returnValue(of([]));


    fixture = TestBed.createComponent(ChkOffForm);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with empty receivedDate', () => {
      fixture.detectChanges();
      expect(component.form).toBeDefined();
      expect(component.form.get('inventoryClass')?.value).toBe('');
      expect(component.form.get('receivedDate')?.value).toBe('');
    });





    it('should have all required form controls', () => {
      fixture.detectChanges();
      expect(component.form.contains('inventoryClass')).toBe(true);
      expect(component.form.contains('receivedDate')).toBe(true);
      expect(component.form.contains('productCode')).toBe(true);
      expect(component.form.contains('bloodType')).toBe(true);
      expect(component.form.contains('expirationDate')).toBe(true);
      expect(component.form.contains('warehouseId')).toBe(true);
      expect(component.form.contains('deviceNumber')).toBe(true);
      expect(component.form.contains('rackNumber')).toBe(true);
      expect(component.form.contains('trayId')).toBe(true);
    });
  });

  describe('Received Date Population', () => {
    it('should not auto-populate receivedDate when inventoryClass is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      spyOn(component as any, 'getChapterLocalDateTime').and.returnValue('19-JUN-2026 10:00');
      component.form.patchValue({ inventoryClass: 'RE' });
      tick();
      expect(component.form.get('receivedDate')?.value).toBe('');
    }));

    it('should show detail rows when both inventoryClass and receivedDate are set', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.form.patchValue({ inventoryClass: 'RE', receivedDate: '19-JUN-2026 10:00' });
      tick();
      expect((component as any).showDetailRows()).toBe(true);
    }));
  });



  describe('Clear Functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should reset storage fields on clearStorageFields', () => {
      component.form.patchValue({
        warehouseId: '1',
        deviceNumber: 'D1',
        rackNumber: 'R1',
        trayId: 'T1'
      });
      component.clearStorageFields();
      expect(component.form.get('warehouseId')?.value).toBe('');
      expect(component.form.get('deviceNumber')?.value).toBe('');
      expect(component.form.get('rackNumber')?.value).toBe('');
      expect(component.form.get('trayId')?.value).toBe('');
    });
  });

  describe('Storage Cascade', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load devices when warehouseId changes', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(of([]));
      component.form.patchValue({ warehouseId: '1' });
      tick();
      expect(serviceSpy.getDevices).toHaveBeenCalledWith('1', '');
    }));

    it('should auto-select single device when only one returned', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(of([{ deviceNumber: 'D1', deviceType: 'C', deviceDesc: 'Device 1' }]));
      component.form.patchValue({ warehouseId: 'W1' }, { emitEvent: false });
      component['loadDevices']('W1');
      tick();
      expect(component.form.get('deviceNumber')?.value).toBe('D1');
    }));

    it('should load racks when deviceNumber changes', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(of([{ deviceNumber: 'D1', deviceType: 'C', deviceDesc: 'Dev' }]));
      serviceSpy.getRacks.and.returnValue(of([]));
      component.form.patchValue({ warehouseId: 'W1' }, { emitEvent: false });
      component.form.patchValue({ deviceNumber: 'D1' });
      tick();
      expect(serviceSpy.getRacks).toHaveBeenCalled();
    }));

    it('should auto-select single rack when only one returned', fakeAsync(() => {
      serviceSpy.getRacks.and.returnValue(of([{ rackNumber: 'R1', rackDesc: 'Rack 1' }]));
      component.form.patchValue({ warehouseId: 'W1', deviceNumber: 'D1' }, { emitEvent: false });
      component['loadRacks']('W1', 'D1');
      tick();
      expect(component.form.get('rackNumber')?.value).toBe('R1');
    }));

    it('should load trays when rackNumber changes', fakeAsync(() => {
      serviceSpy.getTrays.and.returnValue(of([{ trayId: 'T1', maxCapacity: 10, currentCount: 0 }]));
      component.form.patchValue({ warehouseId: 'W1', deviceNumber: 'D1' }, { emitEvent: false });
      component.form.patchValue({ rackNumber: 'R1' });
      tick();
      expect(serviceSpy.getTrays).toHaveBeenCalled();
    }));

    it('should clear downstream fields when warehouseId changes', fakeAsync(() => {
      component.form.patchValue({ deviceNumber: 'D1', rackNumber: 'R1', trayId: 'T1' }, { emitEvent: false });
      serviceSpy.getDevices.and.returnValue(of([]));
      component.form.patchValue({ warehouseId: 'W2' });
      tick();
      expect(component.form.get('deviceNumber')?.value).toBe('');
      expect(component.form.get('rackNumber')?.value).toBe('');
      expect(component.form.get('trayId')?.value).toBe('');
    }));

    it('should clear rack and tray when deviceNumber changes', fakeAsync(() => {
      component.form.patchValue({ warehouseId: 'W1', rackNumber: 'R1', trayId: 'T1' }, { emitEvent: false });
      serviceSpy.getRacks.and.returnValue(of([]));
      component.form.patchValue({ deviceNumber: 'D2' });
      tick();
      expect(component.form.get('rackNumber')?.value).toBe('');
      expect(component.form.get('trayId')?.value).toBe('');
    }));

    it('should set selectedDeviceType when device is found in list', fakeAsync(() => {
      const devs = [{ deviceNumber: 'D1', deviceType: 'R', deviceDesc: 'Ref' }];
      component['devices'].set(devs);
      serviceSpy.getRacks.and.returnValue(of([]));
      component.form.patchValue({ warehouseId: 'W1' }, { emitEvent: false });
      component.form.patchValue({ deviceNumber: 'D1' });
      tick();
      expect(component['selectedDeviceType']()).toBe('R');
    }));

    it('should clear tray when rackNumber changes', fakeAsync(() => {
      component.form.patchValue({ warehouseId: 'W1', deviceNumber: 'D1', trayId: 'T1' }, { emitEvent: false });
      serviceSpy.getTrays.and.returnValue(of([]));
      component.form.patchValue({ rackNumber: 'R2' });
      tick();
      expect(component.form.get('trayId')?.value).toBe('');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('getChapterLocalDateTime', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use headerService timezone when available and not UTC', () => {
      mockHeaderService.chapterTimeZone.set('-05:00');
      const result = component['getChapterLocalDateTime']();
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should use chapterTimezoneService when timezone is UTC', () => {
      mockHeaderService.chapterTimeZone.set('UTC');
      spyOn(mockChapterTimezoneService, 'isChapterLocalDateAvailable').and.returnValue(true);
      const fakeMoment = moment();
      spyOn(mockChapterTimezoneService, 'getChapterLocalDate').and.returnValue(fakeMoment);
      const result = component['getChapterLocalDateTime']();
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should use moment() when no timezone info available', () => {
      mockHeaderService.chapterTimeZone.set('');
      spyOn(mockChapterTimezoneService, 'isChapterLocalDateAvailable').and.returnValue(false);
      const result = component['getChapterLocalDateTime']();
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });
  });

  describe('onUnitPostValidate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject when no unitId is provided', () => {
      const event = { data: { parsedUnitId: '', manualUnitId: '' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should confirm and set collDate when validation succeeds', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-15', unitId: 'U1', chapterId: 'C1', message: '' }));
      serviceSpy.getProductCodes.and.returnValue(of([]));
      const event = { data: { parsedUnitId: 'U1', manualUnitId: '' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      tick();
      expect(event.confirm).toHaveBeenCalled();
      expect(component['collDate']()).toBe('2026-01-15');
    }));

    it('should reject when validation fails with message', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: false, collDate: null, unitId: 'U1', chapterId: null, message: 'Not found' }));
      const event = { data: { parsedUnitId: 'U1', manualUnitId: '' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Not found');
    }));

    it('should reject with default message when validation fails without message', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: false, collDate: null, unitId: 'U1', chapterId: null, message: '' }));
      const event = { data: { parsedUnitId: 'U1', manualUnitId: '' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Unit not found in system for this chapter');
    }));

    it('should reject on validation error', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));
      const event = { data: { parsedUnitId: 'U1', manualUnitId: '' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Failed to validate unit ID');
    }));

    it('should use manualUnitId when parsedUnitId is empty', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({ isValid: true, collDate: '2026-01-15', unitId: 'M1', chapterId: 'C1', message: '' }));
      serviceSpy.getProductCodes.and.returnValue(of([]));
      const event = { data: { parsedUnitId: '', manualUnitId: 'M1' }, confirm: jasmine.createSpy('confirm'), reject: jasmine.createSpy('reject') };
      component.onUnitPostValidate(event as any);
      tick();
      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('M1');
    }));
  });

  describe('onUnitValidated', () => {
    it('should be a no-op', () => {
      fixture.detectChanges();
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  describe('onUnitCleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all product-related state', () => {
      component['collDate'].set('2026-01-01');
      component['validatedUnitId'].set('U1');
      component['productCodes'].set([{ productCode: 'PC1', productType: null, storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }]);
      component.onUnitCleared();
      expect(component['collDate']()).toBeNull();
      expect(component['validatedUnitId']()).toBeNull();
      expect(component['productCodes']()).toEqual([]);
      expect(component.filteredProductCodes).toEqual([]);
      expect(component['aboTypes']()).toEqual([]);
      expect(component.filteredAboTypes).toEqual([]);
      expect(component['selectedProduct']()).toBeNull();
      expect(component['locationRequired']()).toBe(true);
      expect(component.form.get('productCode')?.value).toBe('');
      expect(component.form.get('bloodType')?.value).toBe('');
    });
  });

  describe('onProductCodeOptionSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set form value and call onProductCodeSelected', () => {
      spyOn(component, 'onProductCodeSelected' as any);
      component.onProductCodeOptionSelected('PC1');
      expect(component.form.get('productCode')?.value).toBe('PC1');
      expect(component['productCodeOptionJustSelected']).toBe(true);
    });
  });

  describe('onProductCodeSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if productCode is empty', () => {
      component.onProductCodeSelected('');
      expect(component['selectedProduct']()).toBeNull();
    });

    it('should set selectedProduct from productCodes list', () => {
      const products = [{ productCode: 'PC1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }];
      component['productCodes'].set(products);
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('PC1');
      expect(component['selectedProduct']()?.productCode).toBe('PC1');
    });

    it('should set bloodType to PO and disable for pool products', () => {
      const products = [{ productCode: 'POOL1', productType: 'WB', storageProductType: null, poolProductCode: 'Y', lifeSpan: 0, lifeSpanInd: null }];
      component['productCodes'].set(products);
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('POOL1');
      expect(component.form.getRawValue().bloodType).toBe('PO');
      expect(component.form.get('bloodType')?.disabled).toBe(true);
      expect(component['locationRequired']()).toBe(false);
    });

    it('should set bloodType to PO for productType starting with PO', () => {
      const products = [{ productCode: 'P1', productType: 'POOL', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }];
      component['productCodes'].set(products);
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('P1');
      expect(component.form.getRawValue().bloodType).toBe('PO');
      expect(component.form.get('bloodType')?.disabled).toBe(true);
    });

    it('should auto-calculate expiration for RPL product with lifeSpan days', () => {
      const products = [{ productCode: 'RPL1', productType: 'RPL', storageProductType: null, poolProductCode: 'N', lifeSpan: 5, lifeSpanInd: 'D' }];
      component['productCodes'].set(products);
      component['collDate'].set('2026-01-15');
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('RPL1');
      const expValue = component.form.getRawValue().expirationDate;
      expect(expValue).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
      expect(component.form.get('expirationDate')?.disabled).toBe(true);
    });

    it('should auto-calculate expiration for RPFF product with lifeSpan years', () => {
      const products = [{ productCode: 'RPFF1', productType: 'RPFF', storageProductType: null, poolProductCode: 'N', lifeSpan: 1, lifeSpanInd: 'Y' }];
      component['productCodes'].set(products);
      component['collDate'].set('2026-01-15');
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('RPFF1');
      const expValue = component.form.getRawValue().expirationDate;
      expect(expValue).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should auto-calculate expiration with hours lifeSpanInd', () => {
      const products = [{ productCode: 'RPL2', productType: 'RPL', storageProductType: null, poolProductCode: 'N', lifeSpan: 24, lifeSpanInd: 'H' }];
      component['productCodes'].set(products);
      component['collDate'].set('2026-01-15');
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('RPL2');
      expect(component.form.getRawValue().expirationDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should use days as default for unknown lifeSpanInd', () => {
      const products = [{ productCode: 'RPL3', productType: 'RPL', storageProductType: null, poolProductCode: 'N', lifeSpan: 3, lifeSpanInd: 'X' }];
      component['productCodes'].set(products);
      component['collDate'].set('2026-01-15');
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('RPL3');
      expect(component.form.getRawValue().expirationDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should load ABO types when unitId is available', () => {
      const products = [{ productCode: 'PC1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }];
      component['productCodes'].set(products);
      component['validatedUnitId'].set('U1');
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component.onProductCodeSelected('PC1');
      expect(serviceSpy.getAboTypes).toHaveBeenCalledWith('U1', 'PC1', '00');
    });
  });

  describe('loadProductCodes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set productCodes and auto-select when only one result', fakeAsync(() => {
      const codes = [{ productCode: 'ONLY1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }];
      serviceSpy.getProductCodes.and.returnValue(of(codes));
      serviceSpy.getAboTypes.and.returnValue(of([]));
      component['validatedUnitId'].set('U1');
      component['loadProductCodes']('U1');
      tick();
      expect(component['productCodes']()).toEqual(codes);
      expect(component.form.get('productCode')?.value).toBe('ONLY1');
    }));

    it('should not auto-select when multiple results', fakeAsync(() => {
      const codes = [
        { productCode: 'PC1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null },
        { productCode: 'PC2', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }
      ];
      serviceSpy.getProductCodes.and.returnValue(of(codes));
      component['loadProductCodes']('U1');
      tick();
      expect(component['productCodes']()).toEqual(codes);
      expect(component.filteredProductCodes).toEqual(codes);
    }));

    it('should show error on failure', fakeAsync(() => {
      serviceSpy.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      component['loadProductCodes']('U1');
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load product codes');
      expect(component['loadingProductCodes']()).toBe(false);
    }));
  });

  describe('onAboOptionSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set form value and call onAboSelected', () => {
      spyOn(component as any, 'checkLocationRequired');
      component.onAboOptionSelected('AP');
      expect(component.form.get('bloodType')?.value).toBe('AP');
      expect(component['aboOptionJustSelected']).toBe(true);
    });
  });

  describe('onAboSelected', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if aboCode is empty', () => {
      spyOn(component as any, 'checkLocationRequired');
      component.onAboSelected('');
      expect(component['checkLocationRequired']).not.toHaveBeenCalled();
    });

    it('should call checkLocationRequired with aboCode', () => {
      spyOn(component as any, 'checkLocationRequired');
      component.onAboSelected('AP');
      expect(component['checkLocationRequired']).toHaveBeenCalledWith('AP');
    });
  });

  describe('loadAboTypes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set aboTypes and auto-select when only one result', fakeAsync(() => {
      const types = [{ aboCode: 'AP', aboDescription: 'A Positive' }];
      serviceSpy.getAboTypes.and.returnValue(of(types));
      spyOn(component as any, 'checkLocationRequired');
      component['loadAboTypes']('U1', 'PC1', '00');
      tick();
      expect(component['aboTypes']()).toEqual(types);
      expect(component.form.get('bloodType')?.value).toBe('AP');
      expect(component['checkLocationRequired']).toHaveBeenCalledWith('AP');
    }));

    it('should not auto-select when multiple results', fakeAsync(() => {
      const types = [{ aboCode: 'AP', aboDescription: 'A Pos' }, { aboCode: 'BN', aboDescription: 'B Neg' }];
      serviceSpy.getAboTypes.and.returnValue(of(types));
      component['loadAboTypes']('U1', 'PC1', '00');
      tick();
      expect(component['aboTypes']()).toEqual(types);
      expect(component.filteredAboTypes).toEqual(types);
    }));

    it('should show error on failure', fakeAsync(() => {
      serviceSpy.getAboTypes.and.returnValue(throwError(() => new Error('fail')));
      component['loadAboTypes']('U1', 'PC1', '00');
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load ABO types');
      expect(component['loadingAboTypes']()).toBe(false);
    }));
  });

  describe('checkLocationRequired', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set locationRequired false for pool products', () => {
      component['selectedProduct'].set({ productCode: 'P1', productType: 'WB', storageProductType: null, poolProductCode: 'Y', lifeSpan: 0, lifeSpanInd: null });
      component['checkLocationRequired']('AP');
      expect(component['locationRequired']()).toBe(false);
    });

    it('should set locationRequired false for emergency ABO codes', () => {
      component['selectedProduct'].set({ productCode: 'P1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null });
      component['checkLocationRequired']('71');
      expect(component['locationRequired']()).toBe(false);
    });

    it('should set locationRequired true for non-pool, non-emergency', () => {
      component['selectedProduct'].set({ productCode: 'P1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null });
      component['checkLocationRequired']('AP');
      expect(component['locationRequired']()).toBe(true);
    });

    it('should auto-select default warehouse when location is required', () => {
      component['selectedProduct'].set({ productCode: 'P1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null });
      component['warehouses'].set([{ warehouseId: 'WH01', warehouseDesc: 'W1' }]);
      mockHeaderService.chapterTimeZone.set('');
      (mockHeaderService as any).getCurrentWarehouseId = jasmine.createSpy().and.returnValue('WH01');
      component['checkLocationRequired']('AP');
      expect(component['locationRequired']()).toBe(true);
    });
  });

  describe('autoSelectDefaultWarehouse', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (mockHeaderService as any).getCurrentWarehouseId = jasmine.createSpy().and.returnValue('');
    });

    it('should select session warehouse when available', () => {
      (mockHeaderService as any).getCurrentWarehouseId.and.returnValue('W1');
      component['warehouses'].set([{ warehouseId: 'W1', warehouseDesc: 'Warehouse 1' }]);
      component['autoSelectDefaultWarehouse']();
      expect(component.form.get('warehouseId')?.value).toBe('W1');
    });

    it('should select single warehouse when only one available', () => {
      (mockHeaderService as any).getCurrentWarehouseId.and.returnValue('');
      component['warehouses'].set([{ warehouseId: 'W2', warehouseDesc: 'Only Warehouse' }]);
      component['autoSelectDefaultWarehouse']();
      expect(component.form.get('warehouseId')?.value).toBe('W2');
    });

    it('should not select when session warehouse not in list', () => {
      (mockHeaderService as any).getCurrentWarehouseId.and.returnValue('W99');
      component['warehouses'].set([
        { warehouseId: 'W1', warehouseDesc: 'W1' },
        { warehouseId: 'W2', warehouseDesc: 'W2' }
      ]);
      component['autoSelectDefaultWarehouse']();
      expect(component.form.get('warehouseId')?.value).toBe('');
    });
  });

  describe('onExpirationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if value is empty', () => {
      component.form.patchValue({ expirationDate: '' }, { emitEvent: false });
      component.onExpirationDateBlur();
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });

    it('should validate barcode pattern starting with &>', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({ success: true, item: { expiryDate: '2026-06-15T00:00:00' }, message: '' }));
      component.form.patchValue({ expirationDate: '&>123456' }, { emitEvent: false });
      component.onExpirationDateBlur();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalledWith('&>123456');
    }));

    it('should validate barcode pattern starting with =>', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({ success: true, item: { expiryDate: '2026-06-15T00:00:00' }, message: '' }));
      component.form.patchValue({ expirationDate: '=>123456' }, { emitEvent: false });
      component.onExpirationDateBlur();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalled();
    }));

    it('should validate numeric barcode pattern', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({ success: true, item: { expiryDate: '2026-06-15T00:00:00' }, message: '' }));
      component.form.patchValue({ expirationDate: '20260615' }, { emitEvent: false });
      component.onExpirationDateBlur();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalled();
    }));

    it('should show error for failed barcode scan', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({ success: false, item: null, message: 'Bad scan' }));
      component.form.patchValue({ expirationDate: '&>bad' }, { emitEvent: false });
      component.onExpirationDateBlur();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Bad scan');
    }));

    it('should show error on barcode scan HTTP error', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.form.patchValue({ expirationDate: '&>err' }, { emitEvent: false });
      component.onExpirationDateBlur();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should show error for invalid manual format', () => {
      component.form.patchValue({ expirationDate: 'invalid' }, { emitEvent: false });
      component.onExpirationDateBlur();
      expect(component.form.get('expirationDate')?.hasError('invalidFormat')).toBeTrue();
    });

    it('should accept valid DD-MMM-YYYY HH:mm format', () => {
      component.form.patchValue({ expirationDate: '15-JAN-2026 14:30' }, { emitEvent: false });
      component.onExpirationDateBlur();
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('validateBloodType', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error for restricted blood type', () => {
      component['validateBloodType']('BIO');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Restricted blood type — cannot check in');
    });

    it('should show error for HOLD blood type', () => {
      component['validateBloodType']('HOLD');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Restricted blood type — cannot check in');
    });

    it('should not show error for valid blood type', () => {
      component['validateBloodType']('AP');
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });

    it('should return early if empty', () => {
      component['validateBloodType']('');
      expect(snackbarSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('setFieldError and clearFieldError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set error on control and mark as touched', () => {
      component['setFieldError']('productCode', 'Bad code');
      expect(component.fieldErrors['productCode']).toBe('Bad code');
      expect(component.form.get('productCode')?.hasError('serverError')).toBe(true);
      expect(component.form.get('productCode')?.touched).toBe(true);
    });

    it('should clear error on control', () => {
      component['setFieldError']('productCode', 'Bad code');
      component['clearFieldError']('productCode');
      expect(component.fieldErrors['productCode']).toBe('');
      expect(component.form.get('productCode')?.errors).toBeNull();
    });
  });

  describe('clearHeaderFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset header fields and emit clearAll', () => {
      spyOn(component.clearAll, 'emit');
      component.form.patchValue({ inventoryClass: 'RE', receivedDate: '15-JAN-2026 10:00' }, { emitEvent: false });
      component.clearHeaderFields();
      expect(component.form.get('inventoryClass')?.value).toBe('');
      expect(component.form.get('receivedDate')?.value).toBe('');
      expect(component.clearAll.emit).toHaveBeenCalled();
    });
  });

  describe('clearDetailFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onUnitCleared and clearStorageFields', () => {
      spyOn(component, 'onUnitCleared');
      spyOn(component, 'clearStorageFields');
      component.clearDetailFields();
      expect(component.onUnitCleared).toHaveBeenCalled();
      expect(component.clearStorageFields).toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should be a no-op', () => {
      fixture.detectChanges();
      expect(() => component.onSubmit()).not.toThrow();
    });
  });

  describe('onTrayChanged', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if trayId is empty', () => {
      component.form.patchValue({ trayId: '' }, { emitEvent: false });
      spyOn(component as any, 'performCheckIn');
      component.onTrayChanged();
      expect(component['performCheckIn']).not.toHaveBeenCalled();
    });

    it('should not call performCheckIn when canAutoSubmit is false', () => {
      component.form.patchValue({ trayId: 'T1' }, { emitEvent: false });
      spyOn(component as any, 'performCheckIn');
      component.onTrayChanged();
      expect(component['performCheckIn']).not.toHaveBeenCalled();
    });
  });

  describe('performCheckIn', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error for invalid receivedDate format', () => {
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: 'bad-date',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-JAN-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['performCheckIn']();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Invalid Received Date format. Use DD-MMM-YYYY HH:mm');
      expect(component['submitting']()).toBe(false);
    });

    it('should call checkInProduct with correct payload on valid data', fakeAsync(() => {
      serviceSpy.checkInProduct.and.returnValue(of({ success: true, message: '', item: { unitId: 'U1', productCode: 'PC1', aliquot: '00', warnings: [] } }));
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['performCheckIn']();
      tick();
      expect(serviceSpy.checkInProduct).toHaveBeenCalled();
      const payload = serviceSpy.checkInProduct.calls.mostRecent().args[0];
      expect(payload.unitId).toBe('U1');
      expect(payload.productCode).toBe('PC1');
      expect(payload.bloodType).toBe('AP');
      expect(payload.inventoryClass).toBe('RE');
    }));
  });

  describe('handleCheckInSuccess', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit checkInSuccess and reset on successful response', () => {
      spyOn(component.checkInSuccess, 'emit');
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['aboTypes'].set([{ aboCode: 'AP', aboDescription: 'A Positive' }]);
      component['handleCheckInSuccess']({
        success: true,
        message: '',
        item: { unitId: 'U1', productCode: 'PC1', aliquot: '00', warnings: [] }
      });
      expect(component.checkInSuccess.emit).toHaveBeenCalled();
      expect(component['submitting']()).toBe(false);
    });

    it('should use response.data when item is not present', () => {
      spyOn(component.checkInSuccess, 'emit');
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['handleCheckInSuccess']({
        success: true,
        message: '',
        data: [{ unitId: 'U1', productCode: 'PC1', aliquot: '00', warnings: [] }] as any
      });
      expect(component.checkInSuccess.emit).toHaveBeenCalled();
    });

    it('should show error when response is not successful', () => {
      component['handleCheckInSuccess']({
        success: false,
        message: 'Check-in failed for reasons'
      });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Check-in failed for reasons');
    });

    it('should show default error when no message', () => {
      component['handleCheckInSuccess']({
        success: false,
        message: ''
      });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Check-in failed');
    });
  });

  describe('handleCheckInError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show specific message for error code 5322', () => {
      component['handleCheckInError']({ error: { errorCode: '5322', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('5322: Product already exists in active products');
    });

    it('should show specific message for error code 5327', () => {
      component['handleCheckInError']({ error: { errorCode: '5327', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('5327: No component with status Lab-ready found');
    });

    it('should show specific message for error code 0313', () => {
      component['handleCheckInError']({ error: { errorCode: '0313', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('0313: Component prefix not found with lab-ready status');
    });

    it('should show specific message for error code 5325', () => {
      component['handleCheckInError']({ error: { errorCode: '5325', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('5325: Restricted blood type — cannot check in');
    });

    it('should show specific message for error code 3701', () => {
      component['handleCheckInError']({ error: { errorCode: '3701', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('3701: Product has expired');
    });

    it('should show specific message for error code 0341', () => {
      component['handleCheckInError']({ error: { errorCode: '0341', message: '' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('0341: Tray ID not found');
    });

    it('should handle tray overflow for error code 0318', () => {
      const localDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      localDialogSpy.open.and.returnValue(dialogRefSpy);
      component['dialog'] = localDialogSpy;
      component['handleCheckInError']({ error: { errorCode: '0318', message: '' } });
      expect(localDialogSpy.open).toHaveBeenCalled();
    });

    it('should show generic error for unknown error codes', () => {
      component['handleCheckInError']({ error: { errorCode: '9999', message: 'Something went wrong' } });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('9999: Something went wrong');
    });

    it('should use fallback error message', () => {
      component['handleCheckInError']({ message: 'Fallback error' });
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Fallback error');
    });

    it('should use default error message when no message available', () => {
      component['handleCheckInError']({});
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to check in product');
    });

    it('should set submitting to false', () => {
      component['submitting'].set(true);
      component['handleCheckInError']({});
      expect(component['submitting']()).toBe(false);
    });
  });

  describe('showWarningsDialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open dialog with warnings', () => {
      const localDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      localDialogSpy.open.and.returnValue(dialogRefSpy);
      component['dialog'] = localDialogSpy;
      component['showWarningsDialog'](['Warning 1', 'Warning 2']);
      expect(localDialogSpy.open).toHaveBeenCalled();
      const callArgs = localDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.details).toEqual(['Warning 1', 'Warning 2']);
    });
  });

  describe('handleTrayOverflow', () => {
    let localDialogSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      fixture.detectChanges();
      localDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      component['dialog'] = localDialogSpy;
    });

    it('should open confirmation dialog', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      localDialogSpy.open.and.returnValue(dialogRefSpy);
      component['handleTrayOverflow']();
      expect(localDialogSpy.open).toHaveBeenCalled();
      const callArgs = localDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.type).toBe('confirm');
    });

    it('should call resubmitWithTrayOverride when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      localDialogSpy.open.and.returnValue(dialogRefSpy);
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      serviceSpy.checkInProduct.and.returnValue(of({ success: true, message: '', item: { unitId: 'U1', productCode: 'PC1', aliquot: '00', warnings: [] } }));
      component['handleTrayOverflow']();
      tick();
      expect(serviceSpy.checkInProduct).toHaveBeenCalled();
      const payload = serviceSpy.checkInProduct.calls.mostRecent().args[0];
      expect(payload.trayOverflowConfirmation).toBe('Y');
    }));

    it('should not resubmit when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      localDialogSpy.open.and.returnValue(dialogRefSpy);
      spyOn(component as any, 'resubmitWithTrayOverride');
      component['handleTrayOverflow']();
      tick();
      expect(component['resubmitWithTrayOverride']).not.toHaveBeenCalled();
    }));
  });

  describe('resubmitWithTrayOverride', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should submit with trayOverflowConfirmation Y', fakeAsync(() => {
      serviceSpy.checkInProduct.and.returnValue(of({ success: true, message: '', item: { unitId: 'U1', productCode: 'PC1', aliquot: '00', warnings: [] } }));
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00',
        warehouseId: 'W1',
        deviceNumber: 'D1',
        rackNumber: 'R1',
        trayId: 'T1'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['resubmitWithTrayOverride']();
      tick();
      expect(serviceSpy.checkInProduct).toHaveBeenCalled();
      const payload = serviceSpy.checkInProduct.calls.mostRecent().args[0];
      expect(payload.trayOverflowConfirmation).toBe('Y');
    }));

    it('should handle error from resubmit', fakeAsync(() => {
      serviceSpy.checkInProduct.and.returnValue(throwError(() => ({ error: { message: 'Still failed' } })));
      component.form.patchValue({
        inventoryClass: 'RE',
        receivedDate: '20-JAN-2026 14:00',
        productCode: 'PC1',
        bloodType: 'AP',
        expirationDate: '20-FEB-2026 14:00'
      }, { emitEvent: false });
      component['validatedUnitId'].set('U1');
      component['resubmitWithTrayOverride']();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Still failed');
    }));
  });

  describe('resetProductFields', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all product-related fields and state', () => {
      component.form.patchValue({ productCode: 'PC1', bloodType: 'AP', expirationDate: '20-JAN-2026 10:00' }, { emitEvent: false });
      component.form.get('bloodType')?.disable();
      component.form.get('expirationDate')?.disable();
      component['collDate'].set('2026-01-01');
      component['aboTypes'].set([{ aboCode: 'AP', aboDescription: 'A Positive' }]);
      component['productCodes'].set([{ productCode: 'PC1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }]);
      component['selectedProduct'].set({ productCode: 'PC1', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null });

      component['resetProductFields']();

      expect(component.form.get('bloodType')?.enabled).toBe(true);
      expect(component.form.get('expirationDate')?.enabled).toBe(true);
      expect(component.form.get('productCode')?.value).toBe('');
      expect(component['collDate']()).toBeNull();
      expect(component['aboTypes']()).toEqual([]);
      expect(component['productCodes']()).toEqual([]);
      expect(component['selectedProduct']()).toBeNull();
      expect(component['locationRequired']()).toBe(true);
    });
  });

  describe('loadInventoryClasses', () => {
    it('should handle error', fakeAsync(() => {
      serviceSpy.getInventoryClasses.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load inventory classes');
      expect(component['loadingInventoryClasses']()).toBe(false);
    }));
  });

  describe('loadWarehouses', () => {
    it('should set warehouses on success', fakeAsync(() => {
      const warehouses = [{ warehouseId: 'W1', warehouseDesc: 'Warehouse 1' }];
      serviceSpy.getWarehouses.and.returnValue(of(warehouses));
      fixture.detectChanges();
      tick();
      expect(component['warehouses']()).toEqual(warehouses);
    }));
  });

  describe('loadTrays', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set trays on success', fakeAsync(() => {
      const trays = [{ trayId: 'T1', maxCapacity: 10, currentCount: 5 }];
      serviceSpy.getTrays.and.returnValue(of(trays));
      component['loadTrays']('W1', 'D1', 'R1');
      tick();
      expect(component['trays']()).toEqual(trays);
    }));
  });

  describe('productCode valueChanges filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter productCodes on typing', fakeAsync(() => {
      component['productCodes'].set([
        { productCode: 'WB001', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null },
        { productCode: 'PLT01', productType: 'PLT', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }
      ]);
      component['productCodeOptionJustSelected'] = false;
      component.form.patchValue({ productCode: 'wb' });
      tick();
      expect(component.filteredProductCodes.length).toBe(1);
      expect(component.filteredProductCodes[0].productCode).toBe('WB001');
    }));

    it('should show all when empty string', fakeAsync(() => {
      component['productCodes'].set([
        { productCode: 'WB001', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null },
        { productCode: 'PLT01', productType: 'PLT', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }
      ]);
      component['productCodeOptionJustSelected'] = false;
      component.form.patchValue({ productCode: '' });
      tick();
      expect(component.filteredProductCodes.length).toBe(2);
    }));

    it('should skip filtering when productCodeOptionJustSelected is true', fakeAsync(() => {
      component['productCodes'].set([
        { productCode: 'WB001', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }
      ]);
      component.filteredProductCodes = [];
      component['productCodeOptionJustSelected'] = true;
      component.form.patchValue({ productCode: 'WB' });
      tick();
      expect(component.filteredProductCodes).toEqual([]);
    }));
  });

  describe('bloodType valueChanges filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter aboTypes on typing', fakeAsync(() => {
      component['aboTypes'].set([
        { aboCode: 'AP', aboDescription: 'A Positive' },
        { aboCode: 'BN', aboDescription: 'B Negative' }
      ]);
      component['aboOptionJustSelected'] = false;
      component.form.patchValue({ bloodType: 'pos' });
      tick();
      expect(component.filteredAboTypes.length).toBe(1);
      expect(component.filteredAboTypes[0].aboCode).toBe('AP');
    }));

    it('should filter by aboCode', fakeAsync(() => {
      component['aboTypes'].set([
        { aboCode: 'AP', aboDescription: 'A Positive' },
        { aboCode: 'BN', aboDescription: 'B Negative' }
      ]);
      component['aboOptionJustSelected'] = false;
      component.form.patchValue({ bloodType: 'bn' });
      tick();
      expect(component.filteredAboTypes.length).toBe(1);
      expect(component.filteredAboTypes[0].aboCode).toBe('BN');
    }));

    it('should show all when empty', fakeAsync(() => {
      component['aboTypes'].set([
        { aboCode: 'AP', aboDescription: 'A Positive' },
        { aboCode: 'BN', aboDescription: 'B Negative' }
      ]);
      component['aboOptionJustSelected'] = false;
      component.form.patchValue({ bloodType: '' });
      tick();
      expect(component.filteredAboTypes.length).toBe(2);
    }));

    it('should skip filtering when aboOptionJustSelected is true', fakeAsync(() => {
      component['aboTypes'].set([{ aboCode: 'AP', aboDescription: 'A Positive' }]);
      component.filteredAboTypes = [];
      component['aboOptionJustSelected'] = true;
      component.form.patchValue({ bloodType: 'AP' });
      tick();
      expect(component.filteredAboTypes).toEqual([]);
    }));
  });

  describe('onProductCodeScanBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if productCodeOptionJustSelected', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = true;
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(component['productCodeOptionJustSelected']).toBe(false);
      expect(trigger.closePanel).not.toHaveBeenCalled();
    }));

    it('should return early if scanValue is empty', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = false;
      component.form.patchValue({ productCode: '' }, { emitEvent: false });
      const trigger = { panelOpen: true, closePanel: jasmine.createSpy() } as any;
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(trigger.closePanel).toHaveBeenCalled();
    }));

    it('should resolve exact match from productCodes list', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = false;
      component['productCodes'].set([{ productCode: 'WB001', productType: 'WB', storageProductType: null, poolProductCode: 'N', lifeSpan: 0, lifeSpanInd: null }]);
      component.form.patchValue({ productCode: 'wb001' }, { emitEvent: false });
      const trigger = { closePanel: jasmine.createSpy() } as any;
      spyOn(component, 'onProductCodeSelected' as any);
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(component.form.get('productCode')?.value).toBe('WB001');
    }));

    it('should call labelScanService when no exact match', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = false;
      component['productCodes'].set([]);
      component.form.patchValue({ productCode: 'SCAN123' }, { emitEvent: false });
      labelScanSpy.validateProductScan.and.returnValue(of({ success: true, item: { productCode: 'RESOLVED' }, message: '' }));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      spyOn(component, 'onProductCodeSelected' as any);
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(labelScanSpy.validateProductScan).toHaveBeenCalledWith('SCAN123');
      expect(component.form.get('productCode')?.value).toBe('RESOLVED');
    }));

    it('should set field error on scan failure', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = false;
      component['productCodes'].set([]);
      component.form.patchValue({ productCode: 'BAD' }, { emitEvent: false });
      labelScanSpy.validateProductScan.and.returnValue(of({ success: false, item: null, message: 'Invalid scan' }));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(component.fieldErrors['productCode']).toBe('Invalid scan');
    }));

    it('should handle HTTP error on product scan', fakeAsync(() => {
      component['productCodeOptionJustSelected'] = false;
      component['productCodes'].set([]);
      component.form.patchValue({ productCode: 'ERR' }, { emitEvent: false });
      labelScanSpy.validateProductScan.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onProductCodeScanBlur(trigger);
      tick(350);
      expect(component.fieldErrors['productCode']).toBe('Server error');
      expect(component.fieldProcessing['productCode']).toBe(false);
    }));
  });

  describe('onAboScanBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if aboOptionJustSelected', fakeAsync(() => {
      component['aboOptionJustSelected'] = true;
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onAboScanBlur(trigger);
      tick(350);
      expect(component['aboOptionJustSelected']).toBe(false);
      expect(trigger.closePanel).not.toHaveBeenCalled();
    }));

    it('should return early if scanValue is empty', fakeAsync(() => {
      component['aboOptionJustSelected'] = false;
      component.form.patchValue({ bloodType: '' }, { emitEvent: false });
      const trigger = { panelOpen: true, closePanel: jasmine.createSpy() } as any;
      component.onAboScanBlur(trigger);
      tick(350);
      expect(trigger.closePanel).toHaveBeenCalled();
    }));

    it('should resolve exact match from aboTypes list', fakeAsync(() => {
      component['aboOptionJustSelected'] = false;
      component['aboTypes'].set([{ aboCode: 'AP', aboDescription: 'A Positive' }]);
      component.form.patchValue({ bloodType: 'ap' }, { emitEvent: false });
      const trigger = { closePanel: jasmine.createSpy() } as any;
      spyOn(component as any, 'checkLocationRequired');
      component.onAboScanBlur(trigger);
      tick(350);
      expect(component.form.get('bloodType')?.value).toBe('AP');
    }));

    it('should call labelScanService when no exact match', fakeAsync(() => {
      component['aboOptionJustSelected'] = false;
      component['aboTypes'].set([]);
      component.form.patchValue({ bloodType: '=W123' }, { emitEvent: false });
      labelScanSpy.validateAboScan.and.returnValue(of({ success: true, item: { aboCode: 'AP' }, message: '' }));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      spyOn(component as any, 'checkLocationRequired');
      component.onAboScanBlur(trigger);
      tick(350);
      expect(labelScanSpy.validateAboScan).toHaveBeenCalledWith('=W123');
      expect(component.form.get('bloodType')?.value).toBe('AP');
    }));

    it('should set field error on ABO scan failure', fakeAsync(() => {
      component['aboOptionJustSelected'] = false;
      component['aboTypes'].set([]);
      component.form.patchValue({ bloodType: 'BAD' }, { emitEvent: false });
      labelScanSpy.validateAboScan.and.returnValue(of({ success: false, item: null, message: 'Invalid ABO' }));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onAboScanBlur(trigger);
      tick(350);
      expect(component.fieldErrors['bloodType']).toBe('Invalid ABO');
    }));

    it('should handle HTTP error on ABO scan', fakeAsync(() => {
      component['aboOptionJustSelected'] = false;
      component['aboTypes'].set([]);
      component.form.patchValue({ bloodType: 'ERR' }, { emitEvent: false });
      labelScanSpy.validateAboScan.and.returnValue(throwError(() => ({ error: { message: 'ABO server error' } })));
      const trigger = { closePanel: jasmine.createSpy() } as any;
      component.onAboScanBlur(trigger);
      tick(350);
      expect(component.fieldErrors['bloodType']).toBe('ABO server error');
      expect(component.fieldProcessing['bloodType']).toBe(false);
    }));
  });

  describe('collectionDate computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return formatted date when collDate is set', () => {
      component['collDate'].set('2026-01-15');
      expect(component['collectionDate']()).toMatch(/15-JAN-2026/);
    });

    it('should return empty string when collDate is null', () => {
      component['collDate'].set(null);
      expect(component['collectionDate']()).toBe('');
    });
  });

  describe('elementId', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return componentId-name pattern', () => {
      const id = component['elementId']('test');
      expect(id).toContain('chkoff-form-');
      expect(id).toContain('-test');
    });
  });
});
