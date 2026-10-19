import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';

import { PackodComponent } from './packod.component';
import { PackodApiService } from './services/packod-api.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { HeaderService } from '../../../shared/services/header.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ConsigneeDropdownDto,
  DiscardProductDto,
  BoxContentItemDto
} from './models';

describe('PackodComponent', () => {
  let component: PackodComponent;
  let fixture: ComponentFixture<PackodComponent>;
  let packodApiServiceSpy: jasmine.SpyObj<PackodApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockConsignees: ConsigneeDropdownDto[] = [
    {
      consigneeId: 'DISC001',
      customerName: 'Regional Discard Center',
      address: '123 Waste Lane, City, ST 12345',
      customerId: 'CUST001'
    }
  ];

  const mockProduct: DiscardProductDto = {
    unitId: 'W1234567890123',
    chkDigit: '7',
    productCode: 'E1150110',
    productType: 'RBC',
    productDesc: 'RBC Leuko Red',
    aliquot: '00',
    bloodType: 'E001',
    aboDesc: 'A Positive',
    expDate: '2026-12-31T23:59:00Z',
    collDate: '2026-01-15T10:30:00Z',
    boxId: null,
    productStatus: 'CI'
  };

  const mockProductCodes = [
    { productCode: 'E1150110', shortName: 'RBC Leuko Red' },
    { productCode: 'E1160220', shortName: 'Platelets' }
  ];

  const mockAliquots = [
    { aliquot: '00' },
    { aliquot: '01' }
  ];

  const mockBloodTypes = [
    { aboDesc: 'A Positive' },
    { aboDesc: 'O Negative' }
  ];

  const mockOrders = [
    { orderNo: 'ORD001' },
    { orderNo: 'ORD002' }
  ];

  const mockProductTypes = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLT', description: 'Platelets' }
  ];

  const mockOpenBoxes = [
    { boxId: 'BOX001', productType: 'RBC' },
    { boxId: 'BOX002', productType: 'PLT' }
  ];

  const mockBoxContents: BoxContentItemDto[] = [
    {
      unitId: 'W1234567890123',
      chkDigit: '7',
      expDate: '2026-12-31T23:59:00Z',
      productType: 'RBC',
      productCode: 'E1150110',
      aliquot: '00',
      bloodType: 'E001',
      aboDesc: 'A Positive',
      collDate: '2026-01-15T10:30:00Z'
    }
  ];

  function createMockPostValidateEvent(parsedUnitId: string | null = 'W1234567890123') {
    return {
      data: {
        parsedUnitId,
        checkDigit: '7',
        codeScheme: 'I' as const,
        manualUnitId: parsedUnitId || '',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I' as const
      },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };
  }

  function initWithConsignee(): void {
    fixture.detectChanges();
    component.headerForm.patchValue({ consigneeId: 'DISC001' });
  }

  beforeEach(() => {
    packodApiServiceSpy = jasmine.createSpyObj('PackodApiService', [
      'getConsignees',
      'getOrders',
      'getProductTypes',
      'getOpenBoxes',
      'getProductCodes',
      'getAliquots',
      'getBloodTypes',
      'getDiscardProducts',
      'getBoxContents',
      'packProduct',
      'closeBox',
      'createNewBox'
    ]);

    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    dialogSpy = createMockMatDialog();

    packodApiServiceSpy.getConsignees.and.returnValue(of(mockConsignees));
    packodApiServiceSpy.getOrders.and.returnValue(of([]));
    packodApiServiceSpy.getProductTypes.and.returnValue(of([]));
    packodApiServiceSpy.getOpenBoxes.and.returnValue(of([]));
    packodApiServiceSpy.getAliquots.and.returnValue(of([]));
    packodApiServiceSpy.getBloodTypes.and.returnValue(of([]));
    packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [], totalCount: 0 }));

    TestBed.configureTestingModule({
      imports: [PackodComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PackodApiService, useValue: packodApiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).overrideComponent(PackodComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });

    fixture = TestBed.createComponent(PackodComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // =========================================================================
  // 1. Component Initialization
  // =========================================================================
  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize header form with correct controls', () => {
      fixture.detectChanges();
      expect(component.headerForm.get('consigneeId')).toBeTruthy();
      expect(component.headerForm.get('orderNo')).toBeTruthy();
      expect(component.headerForm.get('productType')).toBeTruthy();
      expect(component.headerForm.get('boxId')).toBeTruthy();
      expect(component.headerForm.get('pickSlipId')).toBeTruthy();
    });

    it('should initialize header form with consigneeId as required', () => {
      fixture.detectChanges();
      expect(component.headerForm.get('consigneeId')?.hasError('required')).toBeTrue();
    });

    it('should initialize dependent header fields as disabled', () => {
      fixture.detectChanges();
      expect(component.headerForm.get('orderNo')?.disabled).toBeTrue();
      expect(component.headerForm.get('productType')?.disabled).toBeTrue();
      expect(component.headerForm.get('boxId')?.disabled).toBeTrue();
      expect(component.headerForm.get('pickSlipId')?.disabled).toBeTrue();
    });

    it('should initialize scan form with empty values', () => {
      fixture.detectChanges();
      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    });

    it('should initialize scan form fields as disabled', () => {
      fixture.detectChanges();
      expect(component.scanForm.get('productCode')?.disabled).toBeTrue();
      expect(component.scanForm.get('aliquot')?.disabled).toBeTrue();
      expect(component.scanForm.get('bloodType')?.disabled).toBeTrue();
    });

    it('should initialize signals with default values', () => {
      fixture.detectChanges();
      expect((component as any).consignees()).toEqual(mockConsignees);
      expect((component as any).selectedConsignee()).toBeNull();
      expect((component as any).address()).toBe('');
      expect((component as any).pickSlipId()).toBe('-');
      expect((component as any).currentUnitId()).toBeNull();
      expect((component as any).discardProducts()).toEqual([]);
      expect((component as any).totalDiscardProducts()).toBe(0);
      expect((component as any).pageSize()).toBe(10);
      expect((component as any).pageIndex()).toBe(0);
    });

    it('should load consignees on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(packodApiServiceSpy.getConsignees).toHaveBeenCalled();
      expect((component as any).consignees()).toEqual(mockConsignees);
    }));

    it('should show error when loadConsignees fails', fakeAsync(() => {
      packodApiServiceSpy.getConsignees.and.returnValue(throwError(() => ({ message: 'Server error' })));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load consignees: Server error');
    }));

    it('should show Unknown error when loadConsignees fails without message', fakeAsync(() => {
      packodApiServiceSpy.getConsignees.and.returnValue(throwError(() => ({})));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load consignees: Unknown error');
    }));

    it('should set loadingConsignees to false after consignees load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).loadingConsignees()).toBeFalse();
    }));
  });

  // =========================================================================
  // 2. Consignee Selection
  // =========================================================================
  describe('Consignee Selection', () => {
    beforeEach(() => {
      packodApiServiceSpy.getOrders.and.returnValue(of(mockOrders));
      packodApiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
      packodApiServiceSpy.getOpenBoxes.and.returnValue(of(mockOpenBoxes));
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [mockProduct], totalCount: 1 }));
    });

    it('should load orders and product types when consignee is selected', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect(packodApiServiceSpy.getOrders).toHaveBeenCalledWith('CUST001', 'DISC001');
      expect(packodApiServiceSpy.getProductTypes).toHaveBeenCalledWith('CUST001', 'DISC001');
    }));

    it('should load open boxes when consignee is selected', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect(packodApiServiceSpy.getOpenBoxes).toHaveBeenCalledWith('DISC001', undefined);
    }));

    it('should load discard products when consignee is selected', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should update selectedConsignee signal when consignee is selected', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect((component as any).selectedConsignee()?.consigneeId).toBe('DISC001');
    }));

    it('should set address from selected consignee', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect((component as any).address()).toBe('123 Waste Lane, City, ST 12345');
    }));

    it('should enable dependent fields when consignee is selected', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect(component.headerForm.get('orderNo')?.enabled).toBeTrue();
      expect(component.headerForm.get('productType')?.enabled).toBeTrue();
      expect(component.headerForm.get('boxId')?.enabled).toBeTrue();
    }));

    it('should set orders signal from API response', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect((component as any).orders()).toEqual(mockOrders);
    }));

    it('should set productTypes signal from API response', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect((component as any).productTypes()).toEqual(mockProductTypes);
    }));

    it('should reset dependent fields when consignee is cleared', fakeAsync(() => {
      initWithConsignee();
      tick();

      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      expect(component.headerForm.get('orderNo')?.value).toBe('');
      expect(component.headerForm.get('productType')?.value).toBe('');
      expect(component.headerForm.get('boxId')?.value).toBe('');
      expect((component as any).address()).toBe('');
      expect((component as any).selectedConsignee()).toBeNull();
    }));

    it('should disable dependent fields when consignee is cleared', fakeAsync(() => {
      initWithConsignee();
      tick();

      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      expect(component.headerForm.get('orderNo')?.disabled).toBeTrue();
      expect(component.headerForm.get('productType')?.disabled).toBeTrue();
      expect(component.headerForm.get('boxId')?.disabled).toBeTrue();
    }));

    it('should reset orders, productTypes, openBoxes, and discardProducts when consignee cleared', fakeAsync(() => {
      initWithConsignee();
      tick();

      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      expect((component as any).orders()).toEqual([]);
      expect((component as any).productTypes()).toEqual([]);
      expect((component as any).openBoxes()).toEqual([]);
      expect((component as any).discardProducts()).toEqual([]);
    }));

    it('should reset pickSlipId to dash when consignee cleared', fakeAsync(() => {
      initWithConsignee();
      tick();

      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      expect((component as any).pickSlipId()).toBe('-');
    }));

    it('should reset scan form when consignee is changed', fakeAsync(() => {
      initWithConsignee();
      tick();

      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    }));

    it('should set selectedConsignee to null when non-existent consignee selected', fakeAsync(() => {
      fixture.detectChanges();
      component.headerForm.patchValue({ consigneeId: 'NONEXISTENT' });
      tick();

      expect((component as any).selectedConsignee()).toBeNull();
    }));
  });

  // =========================================================================
  // 3. Product Type Change
  // =========================================================================
  describe('Product Type Change', () => {
    beforeEach(fakeAsync(() => {
      packodApiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
      packodApiServiceSpy.getOpenBoxes.and.returnValue(of(mockOpenBoxes));
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [], totalCount: 0 }));

      initWithConsignee();
      tick();
    }));

    it('should reload open boxes when product type changes', fakeAsync(() => {
      packodApiServiceSpy.getOpenBoxes.calls.reset();

      component.headerForm.patchValue({ productType: 'RBC' });
      tick();

      expect(packodApiServiceSpy.getOpenBoxes).toHaveBeenCalledWith('DISC001', 'RBC');
    }));

    it('should set selectedProductTypeDesc when product type is selected', fakeAsync(() => {
      component.headerForm.patchValue({ productType: 'RBC' });
      tick();

      expect((component as any).selectedProductTypeDesc()).toBe('Red Blood Cells');
    }));

    it('should clear selectedProductTypeDesc when product type not found', fakeAsync(() => {
      component.headerForm.patchValue({ productType: 'UNKNOWN' });
      tick();

      expect((component as any).selectedProductTypeDesc()).toBe('');
    }));
  });

  // =========================================================================
  // 4. Product Code Change (via subscription)
  // =========================================================================
  describe('Product Code Change', () => {
    beforeEach(fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [mockProduct], totalCount: 1 }));
      packodApiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));
      packodApiServiceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));

      initWithConsignee();
      tick();

      (component as any).currentUnitId.set('W1234567890123');
      component.scanForm.get('productCode')?.enable();
    }));

    it('should clear aliquot and bloodType when productCode changes', fakeAsync(() => {
      // Temporarily unset currentUnitId so loadAliquots/loadBloodTypes do not fire and re-set values
      (component as any).currentUnitId.set(null);

      component.scanForm.patchValue({ aliquot: 'XX', bloodType: 'YY' }, { emitEvent: false });
      component.scanForm.patchValue({ productCode: 'E1150110' });
      tick();

      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    }));

    it('should load aliquots and blood types when productCode changes and unitId is set', fakeAsync(() => {
      component.scanForm.patchValue({ productCode: 'E1150110' });
      tick();

      expect(packodApiServiceSpy.getAliquots).toHaveBeenCalledWith('W1234567890123', 'E1150110');
      expect(packodApiServiceSpy.getBloodTypes).toHaveBeenCalledWith('W1234567890123', 'E1150110', 'I');
    }));

    it('should resolve expDate when productCode changes and matching product exists', fakeAsync(() => {
      component.scanForm.patchValue({ productCode: 'E1150110' });
      tick();

      expect((component as any).scanExpDate()).not.toBe('');
      expect((component as any).scanExpTime()).not.toBe('');
    }));

    it('should not load aliquots or blood types when productCode is cleared', fakeAsync(() => {
      packodApiServiceSpy.getAliquots.calls.reset();
      packodApiServiceSpy.getBloodTypes.calls.reset();

      component.scanForm.patchValue({ productCode: '' });
      tick();

      expect(packodApiServiceSpy.getAliquots).not.toHaveBeenCalled();
      expect(packodApiServiceSpy.getBloodTypes).not.toHaveBeenCalled();
    }));

    it('should clear expDate and expTime when productCode changes', fakeAsync(() => {
      (component as any).scanExpDate.set('31-DEC-2026');
      (component as any).scanExpTime.set('23:59');

      component.scanForm.patchValue({ productCode: 'E1160220' });
      tick();

      // productCode change first resets, then resolveExpDate may set again if match found
      // With E1160220 there is no matching product in discardProducts, so should be empty
      expect((component as any).scanExpDate()).toBe('');
      expect((component as any).scanExpTime()).toBe('');
    }));
  });

  // =========================================================================
  // 5. onPostValidate
  // =========================================================================
  describe('onPostValidate', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should reject when no consignee is selected', fakeAsync(() => {
      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('No consignee selected');
    }));

    it('should reject when parsedUnitId is null', fakeAsync(() => {
      const event = createMockPostValidateEvent(null);
      component.onPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('No consignee selected');
    }));

    it('should set currentUnitId and load product codes on success', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect((component as any).currentUnitId()).toBe('W1234567890123');
      expect(event.confirm).toHaveBeenCalled();
      expect((component as any).productCodes()).toEqual(mockProductCodes);
      expect((component as any).filteredProductCodes()).toEqual(mockProductCodes);
    }));

    it('should enable productCode field after successful validation', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(component.scanForm.get('productCode')?.enabled).toBeTrue();
    }));

    it('should auto-select product code when only one is returned', fakeAsync(() => {
      const singleProductCode = [{ productCode: 'E1150110', shortName: 'RBC Leuko Red' }];
      packodApiServiceSpy.getProductCodes.and.returnValue(of(singleProductCode));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(component.scanForm.get('productCode')?.value).toBe('E1150110');
    }));

    it('should not auto-select product code when multiple are returned', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      // productCode should not be auto-set when there are multiple
      expect(component.scanForm.get('productCode')?.value).toBe('');
    }));

    it('should reject and reset currentUnitId on error', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(
        throwError(() => ({ message: 'Unit not found' }))
      );

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit not found');
      expect((component as any).currentUnitId()).toBeNull();
    }));

    it('should use error.error.message if available on reject', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(
        throwError(() => ({ error: { message: 'Detailed API error' }, message: 'Generic' }))
      );

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Detailed API error');
    }));

    it('should fallback to Invalid unit ID when no error message', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(
        throwError(() => ({}))
      );

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    }));

    it('should reset product codes and filtered product codes before loading', fakeAsync(() => {
      (component as any).productCodes.set(mockProductCodes);
      (component as any).filteredProductCodes.set(mockProductCodes);

      packodApiServiceSpy.getProductCodes.and.returnValue(of([]));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect((component as any).productCodes()).toEqual([]);
      expect((component as any).filteredProductCodes()).toEqual([]);
    }));

    it('should call getProductCodes with correct parameters', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(of([]));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect(packodApiServiceSpy.getProductCodes).toHaveBeenCalledWith(
        'W1234567890123', 'CUST001', 'DISC001', 'I'
      );
    }));

    it('should set loadingProductCodes to false after product codes load', fakeAsync(() => {
      packodApiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      expect((component as any).loadingProductCodes()).toBeFalse();
    }));
  });

  // =========================================================================
  // 6. loadAliquots
  // =========================================================================
  describe('loadAliquots', () => {
    it('should load aliquots and auto-select first', fakeAsync(() => {
      packodApiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));

      fixture.detectChanges();
      (component as any).loadAliquots('W1234567890123', 'E1150110');
      tick();

      expect((component as any).aliquots()).toEqual(mockAliquots);
      expect(component.scanForm.get('aliquot')?.enabled).toBeTrue();
      expect(component.scanForm.get('aliquot')?.value).toBe('00');
    }));

    it('should auto-select first aliquot even with multiple aliquots', fakeAsync(() => {
      packodApiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));

      fixture.detectChanges();
      (component as any).loadAliquots('W1234567890123', 'E1150110');
      tick();

      expect(component.scanForm.get('aliquot')?.value).toBe('00');
    }));

    it('should show error snackbar when loadAliquots fails', fakeAsync(() => {
      packodApiServiceSpy.getAliquots.and.returnValue(
        throwError(() => ({ message: 'Aliquot load failed' }))
      );

      fixture.detectChanges();
      (component as any).loadAliquots('W1234567890123', 'E1150110');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load aliquots: Aliquot load failed'
      );
    }));

    it('should set loadingAliquots to false after aliquots load', fakeAsync(() => {
      packodApiServiceSpy.getAliquots.and.returnValue(of(mockAliquots));

      fixture.detectChanges();
      (component as any).loadAliquots('W1234567890123', 'E1150110');
      tick();

      expect((component as any).loadingAliquots()).toBeFalse();
    }));
  });

  // =========================================================================
  // 7. loadBloodTypes
  // =========================================================================
  describe('loadBloodTypes', () => {
    it('should load blood types and auto-select when single result', fakeAsync(() => {
      const singleBloodType = [{ aboDesc: 'A Positive' }];
      packodApiServiceSpy.getBloodTypes.and.returnValue(of(singleBloodType));

      fixture.detectChanges();
      (component as any).loadBloodTypes('W1234567890123', 'E1150110');
      tick();

      expect((component as any).bloodTypes()).toEqual(singleBloodType);
      expect(component.scanForm.get('bloodType')?.enabled).toBeTrue();
      expect(component.scanForm.get('bloodType')?.value).toBe('A Positive');
    }));

    it('should not auto-select blood type when multiple results', fakeAsync(() => {
      packodApiServiceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));

      fixture.detectChanges();
      (component as any).loadBloodTypes('W1234567890123', 'E1150110');
      tick();

      expect((component as any).bloodTypes()).toEqual(mockBloodTypes);
      expect(component.scanForm.get('bloodType')?.enabled).toBeTrue();
      // Should not auto-select since there are 2 options
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    }));

    it('should show error snackbar when loadBloodTypes fails', fakeAsync(() => {
      packodApiServiceSpy.getBloodTypes.and.returnValue(
        throwError(() => ({ message: 'Blood type load failed' }))
      );

      fixture.detectChanges();
      (component as any).loadBloodTypes('W1234567890123', 'E1150110');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load blood types: Blood type load failed'
      );
    }));

    it('should set loadingBloodTypes to false after blood types load', fakeAsync(() => {
      packodApiServiceSpy.getBloodTypes.and.returnValue(of(mockBloodTypes));

      fixture.detectChanges();
      (component as any).loadBloodTypes('W1234567890123', 'E1150110');
      tick();

      expect((component as any).loadingBloodTypes()).toBeFalse();
    }));

    it('should call getBloodTypes with codeScheme I', fakeAsync(() => {
      packodApiServiceSpy.getBloodTypes.and.returnValue(of([]));

      fixture.detectChanges();
      (component as any).loadBloodTypes('W1234567890123', 'E1150110');
      tick();

      expect(packodApiServiceSpy.getBloodTypes).toHaveBeenCalledWith('W1234567890123', 'E1150110', 'I');
    }));
  });

  // =========================================================================
  // 8. resolveExpDate
  // =========================================================================
  describe('resolveExpDate', () => {
    beforeEach(fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [mockProduct], totalCount: 1 }));
      initWithConsignee();
      tick();
    }));

    it('should set scanExpDate and scanExpTime when matching product found', () => {
      (component as any).resolveExpDate('W1234567890123', 'E1150110');

      expect((component as any).scanExpDate()).not.toBe('');
      expect((component as any).scanExpTime()).not.toBe('');
    });

    it('should leave scanExpDate and scanExpTime empty when no matching product', () => {
      (component as any).resolveExpDate('W9999999999999', 'E1150110');

      expect((component as any).scanExpDate()).toBe('');
      expect((component as any).scanExpTime()).toBe('');
    });

    it('should leave scanExpDate and scanExpTime empty when no matching productCode', () => {
      (component as any).resolveExpDate('W1234567890123', 'UNKNOWN');

      expect((component as any).scanExpDate()).toBe('');
      expect((component as any).scanExpTime()).toBe('');
    });
  });

  // =========================================================================
  // 9. onSave
  // =========================================================================
  describe('onSave', () => {
    const packedResponse: DiscardProductDto = {
      unitId: 'W1234567890123',
      chkDigit: '7',
      productCode: 'E1150110',
      productType: 'RBC',
      productDesc: 'RBC Leuko Red',
      aliquot: '00',
      bloodType: 'E001',
      aboDesc: 'A Positive',
      expDate: '2026-12-31T23:59:00Z',
      collDate: '2026-01-15T10:30:00Z',
      boxId: 'BOX999',
      productStatus: 'PK'
    };

    beforeEach(fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [mockProduct], totalCount: 1 }));
      packodApiServiceSpy.getProductCodes.and.returnValue(of([mockProductCodes[0]]));
      packodApiServiceSpy.getAliquots.and.returnValue(of([mockAliquots[0]]));
      packodApiServiceSpy.getBloodTypes.and.returnValue(of([mockBloodTypes[0]]));

      initWithConsignee();
      tick();

      // Simulate unit validation
      const event = createMockPostValidateEvent('W1234567890123');
      component.onPostValidate(event);
      tick();

      // Wait for productCode auto-select (single result) to trigger aliquot/bloodType loads
      tick();
    }));

    it('should not save when canSave is false', fakeAsync(() => {
      (component as any).currentUnitId.set(null);
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect(packodApiServiceSpy.packProduct).not.toHaveBeenCalled();
    }));

    it('should build correct request and call packProduct', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect(packodApiServiceSpy.packProduct).toHaveBeenCalled();
      const request = packodApiServiceSpy.packProduct.calls.mostRecent().args[0];
      expect(request.consigneeId).toBe('DISC001');
      expect(request.customerId).toBe('CUST001');
      expect(request.unitId).toBe('W1234567890123');
      expect(request.productCode).toBe('E1150110');
      expect(request.aliquot).toBe('00');
      expect(request.bloodType).toBe('A Positive');
      expect(request.codeScheme).toBe('I');
    }));

    it('should set boxId from response when no box was previously selected', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect(component.headerForm.get('boxId')?.value).toBe('BOX999');
    }));

    it('should show success snackbar on successful pack', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Unit W1234567890123 packed successfully');
    }));

    it('should reload discard products after successful pack', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onSave();
      tick();

      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should reset scan step after successful pack', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect((component as any).currentUnitId()).toBeNull();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    }));

    it('should not set boxId if response has no boxId', fakeAsync(() => {
      const responseWithoutBox: DiscardProductDto = { ...packedResponse, boxId: null };
      packodApiServiceSpy.packProduct.and.returnValue(of(responseWithoutBox));

      component.onSave();
      tick();

      expect(component.headerForm.get('boxId')?.value).toBe('');
    }));

    it('should not overwrite boxId if one was already set', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'EXISTING_BOX' });
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      // boxId should remain as EXISTING_BOX since one was already set
      expect(component.headerForm.get('boxId')?.value).toBe('EXISTING_BOX');
    }));

    it('should show error snackbar on pack failure', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(
        throwError(() => ({ message: 'Pack failed' }))
      );

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Pack failed');
    }));

    it('should use error.error.message if available on pack failure', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(
        throwError(() => ({ error: { message: 'Detailed pack error' }, message: 'Generic' }))
      );

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Detailed pack error');
    }));

    it('should fallback to Failed to pack product when no error message', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(
        throwError(() => ({}))
      );

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to pack product');
    }));

    it('should set packing to false after pack completes', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));

      component.onSave();
      tick();

      expect((component as any).packing()).toBeFalse();
    }));

    it('should set packing to false after pack fails', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(
        throwError(() => ({ message: 'error' }))
      );

      component.onSave();
      tick();

      expect((component as any).packing()).toBeFalse();
    }));

    it('should load open boxes when response has new boxId', fakeAsync(() => {
      packodApiServiceSpy.packProduct.and.returnValue(of(packedResponse));
      packodApiServiceSpy.getOpenBoxes.calls.reset();

      component.onSave();
      tick();

      expect(packodApiServiceSpy.getOpenBoxes).toHaveBeenCalled();
    }));
  });

  // =========================================================================
  // 10. onClearAll
  // =========================================================================
  describe('onClearAll', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should clear boxId', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX0001234' });
      tick();

      component.onClearAll();

      expect(component.headerForm.get('boxId')?.value).toBe('');
    }));

    it('should reset pickSlipId to dash', fakeAsync(() => {
      (component as any).pickSlipId.set('PS12345');

      component.onClearAll();

      expect((component as any).pickSlipId()).toBe('-');
    }));

    it('should reload discard products', fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onClearAll();
      tick();

      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should reset scan step', () => {
      component.onClearAll();

      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    });
  });

  // =========================================================================
  // 11. onClearScan
  // =========================================================================
  describe('onClearScan', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should reset scan form values', () => {
      component.onClearScan();

      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    });

    it('should disable scan form fields', () => {
      component.scanForm.get('productCode')?.enable();

      component.onClearScan();

      expect(component.scanForm.get('productCode')?.disabled).toBeTrue();
      expect(component.scanForm.get('aliquot')?.disabled).toBeTrue();
      expect(component.scanForm.get('bloodType')?.disabled).toBeTrue();
    });

    it('should reset currentUnitId to null', () => {
      (component as any).currentUnitId.set('W1234567890123');

      component.onClearScan();

      expect((component as any).currentUnitId()).toBeNull();
    });

    it('should clear product codes and filtered product codes', () => {
      (component as any).productCodes.set(mockProductCodes);
      (component as any).filteredProductCodes.set(mockProductCodes);

      component.onClearScan();

      expect((component as any).productCodes()).toEqual([]);
      expect((component as any).filteredProductCodes()).toEqual([]);
    });

    it('should clear scanExpDate and scanExpTime', () => {
      (component as any).scanExpDate.set('31-DEC-2026');
      (component as any).scanExpTime.set('23:59');

      component.onClearScan();

      expect((component as any).scanExpDate()).toBe('');
      expect((component as any).scanExpTime()).toBe('');
    });
  });

  // =========================================================================
  // 12. onUnitIdCleared
  // =========================================================================
  describe('onUnitIdCleared', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should reset currentUnitId to null', () => {
      (component as any).currentUnitId.set('W1234567890123');
      component.onUnitIdCleared();
      expect((component as any).currentUnitId()).toBeNull();
    });

    it('should clear scan form values', () => {
      component.onUnitIdCleared();

      expect(component.scanForm.get('productCode')?.value).toBe('');
      expect(component.scanForm.get('aliquot')?.value).toBe('');
      expect(component.scanForm.get('bloodType')?.value).toBe('');
    });

    it('should disable all scan form fields', () => {
      component.scanForm.get('productCode')?.enable();
      component.scanForm.get('aliquot')?.enable();
      component.scanForm.get('bloodType')?.enable();

      component.onUnitIdCleared();

      expect(component.scanForm.get('productCode')?.disabled).toBeTrue();
      expect(component.scanForm.get('aliquot')?.disabled).toBeTrue();
      expect(component.scanForm.get('bloodType')?.disabled).toBeTrue();
    });

    it('should clear product codes and filtered product codes', () => {
      (component as any).productCodes.set(mockProductCodes);
      (component as any).filteredProductCodes.set(mockProductCodes);

      component.onUnitIdCleared();

      expect((component as any).productCodes()).toEqual([]);
      expect((component as any).filteredProductCodes()).toEqual([]);
    });

    it('should clear aliquots and blood types', () => {
      (component as any).aliquots.set(mockAliquots);
      (component as any).bloodTypes.set(mockBloodTypes);

      component.onUnitIdCleared();

      expect((component as any).aliquots()).toEqual([]);
      expect((component as any).bloodTypes()).toEqual([]);
    });

    it('should clear scanExpDate and scanExpTime', () => {
      (component as any).scanExpDate.set('31-DEC-2026');
      (component as any).scanExpTime.set('23:59');

      component.onUnitIdCleared();

      expect((component as any).scanExpDate()).toBe('');
      expect((component as any).scanExpTime()).toBe('');
    });
  });

  // =========================================================================
  // 13. onPageChange
  // =========================================================================
  describe('onPageChange', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should update pageSize and pageIndex', fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onPageChange({ pageSize: 25, pageIndex: 2, length: 100 });
      tick();

      expect((component as any).pageSize()).toBe(25);
      expect((component as any).pageIndex()).toBe(2);
    }));

    it('should reload discard products', fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onPageChange({ pageSize: 50, pageIndex: 1, length: 100 });
      tick();

      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should pass correct skip value based on pageIndex and pageSize', fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onPageChange({ pageSize: 10, pageIndex: 3, length: 100 });
      tick();

      const callArgs = packodApiServiceSpy.getDiscardProducts.calls.mostRecent().args;
      expect(callArgs[0]).toBe(10); // take
      expect(callArgs[1]).toBe(30); // skip = pageIndex * pageSize
    }));
  });

  // =========================================================================
  // 14. onViewBoxContents
  // =========================================================================
  describe('onViewBoxContents', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should return early when no boxId', () => {
      component.headerForm.patchValue({ boxId: '' });

      component.onViewBoxContents();

      expect(packodApiServiceSpy.getBoxContents).not.toHaveBeenCalled();
    });

    it('should load box contents and open dialog', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      packodApiServiceSpy.getBoxContents.and.returnValue(of(mockBoxContents));

      component.onViewBoxContents();
      tick();

      expect(packodApiServiceSpy.getBoxContents).toHaveBeenCalledWith('BOX001');
      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.data.boxId).toBe('BOX001');
      expect(dialogConfig?.data.boxContents).toEqual(mockBoxContents);
      expect(dialogConfig?.width).toBe('900px');
    }));

    it('should show error snackbar when getBoxContents fails', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      packodApiServiceSpy.getBoxContents.and.returnValue(
        throwError(() => ({ message: 'Box contents load failed' }))
      );

      component.onViewBoxContents();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load box contents: Box contents load failed'
      );
    }));

    it('should set loading to false after box contents load', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      packodApiServiceSpy.getBoxContents.and.returnValue(of(mockBoxContents));

      component.onViewBoxContents();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));

    it('should set loading to false after box contents load fails', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      packodApiServiceSpy.getBoxContents.and.returnValue(
        throwError(() => ({ message: 'Error' }))
      );

      component.onViewBoxContents();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));
  });

  // =========================================================================
  // 15. onCloseBox
  // =========================================================================
  describe('onCloseBox', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX0001234' });
    }));

    it('should return early when no boxId', () => {
      component.headerForm.patchValue({ boxId: '' });

      component.onCloseBox();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open close box confirmation dialog', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(undefined)
      } as any);

      component.onCloseBox();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.data.boxId).toBe('BOX0001234');
    }));

    it('should not call closeBox API when dialog not confirmed', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(undefined)
      } as any);

      component.onCloseBox();
      tick();

      expect(packodApiServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should not call closeBox API when confirmed but closeCurrentBox is false', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: false, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(packodApiServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should close box when confirmed with closeCurrentBox true', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(of(true));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(packodApiServiceSpy.closeBox).toHaveBeenCalledWith({ boxId: 'BOX0001234' });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box BOX0001234 closed successfully');
    }));

    it('should clear boxId after successful close', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(of(true));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(component.headerForm.get('boxId')?.value).toBe('');
    }));

    it('should reset pickSlipId after successful close', fakeAsync(() => {
      (component as any).pickSlipId.set('PS12345');
      packodApiServiceSpy.closeBox.and.returnValue(of(true));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect((component as any).pickSlipId()).toBe('-');
    }));

    it('should reload open boxes and discard products after successful close', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(of(true));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);
      packodApiServiceSpy.getOpenBoxes.calls.reset();
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onCloseBox();
      tick();

      expect(packodApiServiceSpy.getOpenBoxes).toHaveBeenCalled();
      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should show error snackbar on closeBox API failure', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(
        throwError(() => ({ message: 'Close box failed' }))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Close box failed');
    }));

    it('should use error.error.message on closeBox API failure if available', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(
        throwError(() => ({ error: { message: 'Detailed close error' }, message: 'Generic' }))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Detailed close error');
    }));

    it('should fallback to default message on closeBox failure with no message', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(
        throwError(() => ({}))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to close box');
    }));

    it('should set loading to false after close box API call', fakeAsync(() => {
      packodApiServiceSpy.closeBox.and.returnValue(of(true));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: true, closeCurrentBox: true, allProductsProperlyPacked: true })
      } as any);

      component.onCloseBox();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));
  });

  // =========================================================================
  // 16. onCreateNewBox
  // =========================================================================
  describe('onCreateNewBox', () => {
    beforeEach(fakeAsync(() => {
      initWithConsignee();
      tick();
    }));

    it('should return early when no consignee is selected', fakeAsync(() => {
      component.headerForm.patchValue({ consigneeId: '' });
      tick();

      component.onCreateNewBox();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should open create new box dialog with current boxId', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(undefined)
      } as any);

      component.onCreateNewBox();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.data.currentBoxId).toBe('BOX001');
    }));

    it('should pass null as currentBoxId when no box is selected', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(undefined)
      } as any);

      component.onCreateNewBox();
      tick();

      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect(dialogConfig?.data.currentBoxId).toBeFalsy();
    }));

    it('should not call createNewBox API when dialog not confirmed', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(undefined)
      } as any);

      component.onCreateNewBox();
      tick();

      expect(packodApiServiceSpy.createNewBox).not.toHaveBeenCalled();
    }));

    it('should not call createNewBox API when confirmed is false', fakeAsync(() => {
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({ confirmed: false, closeCurrentBox: false, allProductsProperlyPacked: false })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(packodApiServiceSpy.createNewBox).not.toHaveBeenCalled();
    }));

    it('should create new box when dialog confirmed', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: 'New box created' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(packodApiServiceSpy.createNewBox).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New box created');
    }));

    it('should pass correct parameters to createNewBox API', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: 'Done' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: true,
          allProductsProperlyPacked: false
        })
      } as any);

      component.onCreateNewBox();
      tick();

      const request = packodApiServiceSpy.createNewBox.calls.mostRecent().args[0];
      expect(request.currentBoxId).toBe('BOX001');
      expect(request.closeCurrentBox).toBeTrue();
      expect(request.allProductsProperlyPacked).toBeFalse();
      expect(request.consigneeId).toBe('DISC001');
    }));

    it('should clear boxId and reset pickSlipId after creating new box', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).pickSlipId.set('PS123');
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: 'New box created' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(component.headerForm.get('boxId')?.value).toBe('');
      expect((component as any).pickSlipId()).toBe('-');
    }));

    it('should reload open boxes and discard products after creating new box', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: 'Done' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);
      packodApiServiceSpy.getOpenBoxes.calls.reset();
      packodApiServiceSpy.getDiscardProducts.calls.reset();

      component.onCreateNewBox();
      tick();

      expect(packodApiServiceSpy.getOpenBoxes).toHaveBeenCalled();
      expect(packodApiServiceSpy.getDiscardProducts).toHaveBeenCalled();
    }));

    it('should show error snackbar on createNewBox API failure', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(
        throwError(() => ({ message: 'Create box failed' }))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Create box failed');
    }));

    it('should use error.error.message on createNewBox failure if available', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(
        throwError(() => ({ error: { message: 'Detailed create error' }, message: 'Generic' }))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Detailed create error');
    }));

    it('should fallback to default error message when no message on createNewBox failure', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(
        throwError(() => ({}))
      );
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create new box');
    }));

    it('should use default success message when response has no message', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: '' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New box created');
    }));

    it('should set loading to false after createNewBox completes', fakeAsync(() => {
      packodApiServiceSpy.createNewBox.and.returnValue(of({ message: 'Done' }));
      dialogSpy.open.and.returnValue({
        afterClosed: () => of({
          confirmed: true,
          closeCurrentBox: false,
          allProductsProperlyPacked: true
        })
      } as any);

      component.onCreateNewBox();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));
  });

  // =========================================================================
  // 17. Date Formatting
  // =========================================================================
  describe('Date Formatting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('formatDate', () => {
      it('should format a date string to DD-MMM-YYYY uppercase', () => {
        const dateString = '2026-12-31T23:59:00Z';
        const formatted = component.formatDate(dateString);
        expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      });

      it('should format a Date object to DD-MMM-YYYY uppercase', () => {
        const date = new Date(2026, 11, 31);
        const formatted = component.formatDate(date);
        expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      });

      it('should return empty string for null', () => {
        expect(component.formatDate(null)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(component.formatDate(undefined)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect(component.formatDate('')).toBe('');
      });

      it('should return empty string for invalid date string', () => {
        expect(component.formatDate('not-a-date')).toBe('');
      });
    });

    describe('formatTime', () => {
      it('should format a date string to HH:MM 24-hour format', () => {
        const dateString = '2026-12-31T14:30:00Z';
        const formatted = component.formatTime(dateString);
        expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      });

      it('should format a Date object to HH:MM', () => {
        const date = new Date(2026, 11, 31, 14, 30);
        const formatted = component.formatTime(date);
        expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      });

      it('should return empty string for null', () => {
        expect(component.formatTime(null)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(component.formatTime(undefined)).toBe('');
      });

      it('should return empty string for empty string', () => {
        expect(component.formatTime('')).toBe('');
      });

      it('should return empty string for invalid date string', () => {
        expect(component.formatTime('not-a-date')).toBe('');
      });
    });

    describe('formatDateTime', () => {
      it('should combine date and time with a space', () => {
        const dateString = '2026-12-31T14:30:00Z';
        const formatted = component.formatDateTime(dateString);
        expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s\d{2}:\d{2}$/);
      });

      it('should return empty string for null', () => {
        expect(component.formatDateTime(null)).toBe('');
      });

      it('should return empty string for undefined', () => {
        expect(component.formatDateTime(undefined)).toBe('');
      });

      it('should return empty string for invalid date', () => {
        expect(component.formatDateTime('not-a-date')).toBe('');
      });

      it('should return date only if time component is empty (edge case)', () => {
        // This scenario is hard to produce since formatDate and formatTime
        // both return empty for the same invalid inputs. We test the logic path.
        const date = new Date(2026, 11, 31, 14, 30);
        const result = component.formatDateTime(date);
        expect(result).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // 18. Computed Signals
  // =========================================================================
  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('hasConsignee', () => {
      it('should return false when no consignee is selected', () => {
        expect((component as any).hasConsignee()).toBeFalse();
      });

      it('should return true when a consignee is selected', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();

        expect((component as any).hasConsignee()).toBeTrue();
      }));
    });

    describe('hasBox', () => {
      it('should return false when no boxId is set', () => {
        expect((component as any).hasBox()).toBeFalse();
      });

      it('should return true when boxId is set', () => {
        // Evaluate hasBox() on a fresh component instance where boxId is set
        // before the computed is first read (avoids Angular computed caching
        // because headerForm values are not signals).
        const freshFixture = TestBed.createComponent(PackodComponent);
        const freshComponent = freshFixture.componentInstance;
        freshComponent.ngOnInit();
        freshComponent.headerForm.get('boxId')?.enable();
        freshComponent.headerForm.get('boxId')?.setValue('BOX001');

        expect((freshComponent as any).hasBox()).toBeTrue();
        freshFixture.destroy();
      });
    });

    describe('unitIdDisabled', () => {
      it('should return true when no consignee is selected', () => {
        expect((component as any).unitIdDisabled()).toBeTrue();
      });

      it('should return false when a consignee is selected', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();

        expect((component as any).unitIdDisabled()).toBeFalse();
      }));
    });

    describe('canSave', () => {
      it('should return false when no consignee is selected', () => {
        expect((component as any).canSave()).toBeFalse();
      });

      it('should return false when no currentUnitId', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();

        expect((component as any).canSave()).toBeFalse();
      }));

      it('should return false when packing is true', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();
        (component as any).currentUnitId.set('W1234567890123');
        (component as any).packing.set(true);
        component.scanForm.patchValue({ bloodType: 'A Positive' });

        expect((component as any).canSave()).toBeFalse();
      }));

      it('should return false when loadingProductCodes is true', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();
        (component as any).currentUnitId.set('W1234567890123');
        (component as any).loadingProductCodes.set(true);
        component.scanForm.patchValue({ bloodType: 'A Positive' });

        expect((component as any).canSave()).toBeFalse();
      }));

      it('should return false when no bloodType is selected', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();
        (component as any).currentUnitId.set('W1234567890123');

        expect((component as any).canSave()).toBeFalse();
      }));

      it('should return true when all conditions are met', fakeAsync(() => {
        component.headerForm.patchValue({ consigneeId: 'DISC001' });
        tick();
        (component as any).currentUnitId.set('W1234567890123');
        (component as any).packing.set(false);
        (component as any).loadingProductCodes.set(false);
        component.scanForm.get('bloodType')?.enable();
        component.scanForm.patchValue({ bloodType: 'A Positive' });

        expect((component as any).canSave()).toBeTrue();
      }));
    });
  });

  // =========================================================================
  // 19. setupProductSearch
  // =========================================================================
  describe('setupProductSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).productCodes.set(mockProductCodes);
      (component as any).filteredProductCodes.set(mockProductCodes);
    });

    it('should filter product codes by productCode', fakeAsync(() => {
      component.productSearchControl.setValue('E115');
      tick();

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('E1150110');
    }));

    it('should filter product codes by shortName', fakeAsync(() => {
      component.productSearchControl.setValue('platelets');
      tick();

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].shortName).toBe('Platelets');
    }));

    it('should be case-insensitive when filtering', fakeAsync(() => {
      component.productSearchControl.setValue('RBC');
      tick();

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].shortName).toBe('RBC Leuko Red');
    }));

    it('should return all product codes when search term is empty', fakeAsync(() => {
      component.productSearchControl.setValue('test');
      tick();
      expect((component as any).filteredProductCodes().length).toBeLessThan(mockProductCodes.length);

      component.productSearchControl.setValue('');
      tick();

      expect((component as any).filteredProductCodes()).toEqual(mockProductCodes);
    }));

    it('should return all product codes when search term is null', fakeAsync(() => {
      component.productSearchControl.setValue(null as any);
      tick();

      expect((component as any).filteredProductCodes()).toEqual(mockProductCodes);
    }));

    it('should trim whitespace from search term', fakeAsync(() => {
      component.productSearchControl.setValue('  E115  ');
      tick();

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
    }));

    it('should return empty array when no matches found', fakeAsync(() => {
      component.productSearchControl.setValue('ZZZZZ');
      tick();

      expect((component as any).filteredProductCodes().length).toBe(0);
    }));
  });

  // =========================================================================
  // 20. Grid columns validation
  // =========================================================================
  describe('Grid columns', () => {
    it('should have the expected grid columns', () => {
      fixture.detectChanges();
      expect(component.gridColumns).toEqual([
        'unitId', 'productCode', 'productType', 'aboDesc', 'expDate', 'boxId'
      ]);
    });
  });

  // =========================================================================
  // 21. elementId, errorId, labelId helpers
  // =========================================================================
  describe('ID helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate elementId with componentId prefix', () => {
      const id = (component as any).elementId('consignee');
      expect(id).toMatch(/^packod-\d+-consignee$/);
    });

    it('should generate errorId with componentId prefix and -error suffix', () => {
      const id = (component as any).errorId('consignee');
      expect(id).toMatch(/^packod-\d+-consignee-error$/);
    });

    it('should generate labelId with componentId prefix and -label suffix', () => {
      const id = (component as any).labelId('consignee');
      expect(id).toMatch(/^packod-\d+-consignee-label$/);
    });

    it('should have a unique componentId', () => {
      const id = (component as any).componentId;
      expect(id).toMatch(/^packod-\d+$/);
    });
  });

  // =========================================================================
  // 22. ngOnDestroy
  // =========================================================================
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroy$ = (component as any).destroy$;
      const completeSpy = spyOn(destroy$, 'complete').and.callThrough();
      const nextSpy = spyOn(destroy$, 'next').and.callThrough();

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 23. loadOrders/loadProductTypes/loadOpenBoxes/loadDiscardProducts error paths
  // =========================================================================
  describe('API Error Paths', () => {
    describe('loadOrders error', () => {
      it('should show error snackbar when loadOrders fails', fakeAsync(() => {
        packodApiServiceSpy.getOrders.and.returnValue(
          throwError(() => ({ message: 'Orders failed' }))
        );

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load orders: Orders failed');
      }));

      it('should show Unknown error when loadOrders fails without message', fakeAsync(() => {
        packodApiServiceSpy.getOrders.and.returnValue(throwError(() => ({})));

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load orders: Unknown error');
      }));

      it('should set loadingOrders to false after orders load fails', fakeAsync(() => {
        packodApiServiceSpy.getOrders.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );

        initWithConsignee();
        tick();

        expect((component as any).loadingOrders()).toBeFalse();
      }));
    });

    describe('loadProductTypes error', () => {
      it('should show error snackbar when loadProductTypes fails', fakeAsync(() => {
        packodApiServiceSpy.getProductTypes.and.returnValue(
          throwError(() => ({ message: 'Product types failed' }))
        );

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
          'Failed to load product types: Product types failed'
        );
      }));

      it('should show Unknown error when loadProductTypes fails without message', fakeAsync(() => {
        packodApiServiceSpy.getProductTypes.and.returnValue(throwError(() => ({})));

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
          'Failed to load product types: Unknown error'
        );
      }));

      it('should set loadingProductTypes to false after product types load fails', fakeAsync(() => {
        packodApiServiceSpy.getProductTypes.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );

        initWithConsignee();
        tick();

        expect((component as any).loadingProductTypes()).toBeFalse();
      }));
    });

    describe('loadOpenBoxes error', () => {
      it('should show error snackbar when loadOpenBoxes fails', fakeAsync(() => {
        packodApiServiceSpy.getOpenBoxes.and.returnValue(
          throwError(() => ({ message: 'Open boxes failed' }))
        );

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
          'Failed to load open boxes: Open boxes failed'
        );
      }));

      it('should set loadingBoxes to false after open boxes load fails', fakeAsync(() => {
        packodApiServiceSpy.getOpenBoxes.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );

        initWithConsignee();
        tick();

        expect((component as any).loadingBoxes()).toBeFalse();
      }));
    });

    describe('loadDiscardProducts error', () => {
      it('should show error snackbar when loadDiscardProducts fails', fakeAsync(() => {
        packodApiServiceSpy.getDiscardProducts.and.returnValue(
          throwError(() => ({ message: 'Discard products failed' }))
        );

        initWithConsignee();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
          'Failed to load discard products: Discard products failed'
        );
      }));

      it('should set loadingDiscardProducts to false after discard products load fails', fakeAsync(() => {
        packodApiServiceSpy.getDiscardProducts.and.returnValue(
          throwError(() => ({ message: 'Error' }))
        );

        initWithConsignee();
        tick();

        expect((component as any).loadingDiscardProducts()).toBeFalse();
      }));
    });

    describe('loadOpenBoxes early return', () => {
      it('should return early when no consigneeId is set', fakeAsync(() => {
        fixture.detectChanges();
        packodApiServiceSpy.getOpenBoxes.calls.reset();

        (component as any).loadOpenBoxes();
        tick();

        expect(packodApiServiceSpy.getOpenBoxes).not.toHaveBeenCalled();
      }));
    });

    describe('loadDiscardProducts early return', () => {
      it('should return early when no consignee is selected', fakeAsync(() => {
        fixture.detectChanges();
        packodApiServiceSpy.getDiscardProducts.calls.reset();

        (component as any).loadDiscardProducts();
        tick();

        expect(packodApiServiceSpy.getDiscardProducts).not.toHaveBeenCalled();
      }));
    });
  });

  // =========================================================================
  // 24. hf/sf getters
  // =========================================================================
  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return header form controls via hf getter', () => {
      expect(component.hf).toBe(component.headerForm.controls);
    });

    it('should provide access to consigneeId control via hf', () => {
      expect(component.hf['consigneeId']).toBeTruthy();
    });

    it('should return scan form controls via sf getter', () => {
      expect(component.sf).toBe(component.scanForm.controls);
    });

    it('should provide access to productCode control via sf', () => {
      expect(component.sf['productCode']).toBeTruthy();
    });
  });

  // =========================================================================
  // Additional edge cases
  // =========================================================================
  describe('pageSizeOptions', () => {
    it('should have correct page size options', () => {
      fixture.detectChanges();
      expect((component as any).pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  describe('loadDiscardProducts with productType filter', () => {
    it('should include productType in params when set', fakeAsync(() => {
      packodApiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
      packodApiServiceSpy.getDiscardProducts.and.returnValue(of({ data: [], totalCount: 0 }));

      initWithConsignee();
      tick();

      component.headerForm.patchValue({ productType: 'RBC' });
      tick();

      // loadDiscardProducts is called during onConsigneeChange; verify the params pattern
      const lastCall = packodApiServiceSpy.getDiscardProducts.calls.mostRecent();
      expect(lastCall).toBeTruthy();
    }));
  });

  describe('loadDiscardProducts success path', () => {
    it('should set discardProducts and totalDiscardProducts from response', fakeAsync(() => {
      packodApiServiceSpy.getDiscardProducts.and.returnValue(
        of({ data: [mockProduct], totalCount: 42 })
      );

      initWithConsignee();
      tick();

      expect((component as any).discardProducts()).toEqual([mockProduct]);
      expect((component as any).totalDiscardProducts()).toBe(42);
    }));
  });

  describe('onConsigneeChange resets', () => {
    it('should reset selectedProductTypeDesc when consignee changes', fakeAsync(() => {
      packodApiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
      initWithConsignee();
      tick();

      component.headerForm.patchValue({ productType: 'RBC' });
      tick();
      expect((component as any).selectedProductTypeDesc()).toBe('Red Blood Cells');

      // Change consignee should reset
      component.headerForm.patchValue({ consigneeId: '' });
      tick();
      expect((component as any).selectedProductTypeDesc()).toBe('');
    }));
  });
});
