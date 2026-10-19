import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';

import { PackComponent } from './pack.component';
import { PackService, LookupOption } from './services/pack.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  OrderDetailDto, OrderSearchDto, PickSlipDto, ActiveBoxDto,
  BoxTypeDto, PackedProductDto, BoxContentsDto, PackStatusItemDto,
  ApiResponse
} from './models/pack.models';

describe('PackComponent', () => {
  let component: PackComponent;
  let fixture: ComponentFixture<PackComponent>;
  let packServiceSpy: jasmine.SpyObj<PackService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let labelScanSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  const chapterChanged$ = new Subject<void>();

  const emptyApiList = <T>(): ApiResponse<T[]> => ({ success: true, statusCode: 200, message: '', data: [] as any });

  const mockOrder: OrderSearchDto = { orderNo: 'ORD-001', consigneeName: 'Hospital' };
  const mockOrderDetail: OrderDetailDto = {
    orderNo: 'ORD-001', items: [
      { itemNo: 1, productType: 'FFP', bloodType: '51', aboRhDescription: 'O Pos', remainingQty: 1, itemStatusDescription: 'Allocated' }
    ], shipToAddress: 'PARKLAND, TX', estArrivalTime: '2026-08-01T10:00:00'
  };
  const mockPickSlip: PickSlipDto = { pickSlipId: 'PA1-001', orderNo: 'ORD-001', pickSlipStatus: 'OP', pickSlipType: 'AL' };
  const mockBox: ActiveBoxDto = { boxId: 'BOX-001', boxType: 'CO', boxTypeDescription: 'Cooler', boxStatus: 'OP' };
  const mockBoxType: BoxTypeDto = { code: 'CO', description: 'Cooler' };
  const mockPacked: PackedProductDto = { unitId: 'W123', productCode: 'E0385V00', aliquot: '00', aboRhDescription: 'O Pos', expDate: '2026-12-31T23:59:00', boxId: 'BOX-001', insertUser: 'USER1' };
  const lookupOpt = (v: string): LookupOption => ({ value: v, label: v });

  beforeEach(() => {

    packServiceSpy = jasmine.createSpyObj('PackService', [
      'getAllOrders', 'getOrderDetails', 'getOrderItems', 'getPickSlipsForOrder',
      'getActiveBoxes', 'getBoxTypes', 'createBox', 'closeBox', 'getBoxContents',
      'packProduct', 'unpackProduct', 'getPackedProducts', 'getPackStatus',
      'validateExpiry', 'getProductCodes', 'getAliquots', 'getBloodTypes',
      'validateUnit', 'getUnitExpiry', 'quarantineProduct'
    ]);
    snackbarSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], { pageHeaderData: signal(null) });
    dialogSpy = createMockMatDialog();
    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', ['validateAboScan', 'validateExpiryScan']);

    // Default stubs for ngOnInit calls
    packServiceSpy.getAllOrders.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockOrder] }));
    packServiceSpy.getBoxTypes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBoxType] }));



      TestBed.configureTestingModule({
      imports: [PackComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: PackService, useValue: packServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy }
      ]
    });

      packServiceSpy.getAllOrders.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockOrder] }));


      packServiceSpy.getBoxTypes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBoxType] }));


    fixture = TestBed.createComponent(PackComponent);
    component = fixture.componentInstance;
    Object.defineProperty(component, 'dialog', { value: dialogSpy, writable: true, configurable: true });


    });

  // ── Init ─────────────────────────────────────────────────────────────────────

  describe('Initialization', () => {


    it('should load orders and box types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(packServiceSpy.getAllOrders).toHaveBeenCalled();
      expect(packServiceSpy.getBoxTypes).toHaveBeenCalled();
    }));

    it('should have unique componentId across instances', () => {
      const f2 = TestBed.createComponent(PackComponent);
      expect((component as any).componentId).not.toBe((f2.componentInstance as any).componentId);
    });


  });

  // ── Order selection ───────────────────────────────────────────────────────────

  describe('onOrderSelected', () => {
    it('should clear all when empty order selected', () => {
      fixture.detectChanges();
      (component as any).orderDetails.set(mockOrderDetail);
      component.onOrderSelected('');
      expect((component as any).orderDetails()).toBeNull();
    });

    it('should load order details, pick slips and active boxes on selection', fakeAsync(() => {
      packServiceSpy.getOrderDetails.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockOrderDetail }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));

      fixture.detectChanges();
      component.onOrderSelected('ORD-001');
      tick();

      expect((component as any).orderDetails()).toEqual(mockOrderDetail);
      expect((component as any).currentPickSlipId()).toBe('PA1-001');
      expect((component as any).orderItems().length).toBe(1);
    }));



    it('should auto-select first non-cancelled item when first item is CA', fakeAsync(() => {
      const orderWithCancelledFirst: OrderDetailDto = {
        orderNo: 'ORD-002',
        items: [
          { itemNo: 1, productType: 'FFP', bloodType: '51', aboRhDescription: 'O Pos', remainingQty: 0, itemStatusDescription: 'Cancelled', itemStatus: 'CA' },
          { itemNo: 2, productType: 'FFP', bloodType: '51', aboRhDescription: 'O Pos', remainingQty: 1, itemStatusDescription: 'Ordered', itemStatus: 'OR' }
        ],
        shipToAddress: 'PARKLAND, TX', estArrivalTime: '2026-08-01T10:00:00'
      };
      packServiceSpy.getOrderDetails.and.returnValue(of({ success: true, statusCode: 200, message: '', data: orderWithCancelledFirst }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));

      fixture.detectChanges();
      component.onOrderSelected('ORD-002');
      tick();

      expect(component.packForm.get('itemNo')?.value).toBe(2);
    }));
  });

  // ── Box selection ─────────────────────────────────────────────────────────────

  describe('onBoxSelected', () => {
    it('should set currentBoxId and resolve box type from activeBoxes', () => {
      (component as any).activeBoxes.set([mockBox]);
      component.onBoxSelected('BOX-001');
      expect((component as any).currentBoxId()).toBe('BOX-001');
      expect((component as any).currentBoxType()).toBe('CO');
      expect((component as any).currentBoxTypeDesc()).toBe('Cooler');
    });


  });

  // ── Unit ID cascade ───────────────────────────────────────────────────────────

  describe('onUnitValidated', () => {
    it('should load product codes on unit validation', fakeAsync(() => {
      packServiceSpy.getProductCodes.and.returnValue(of([lookupOpt('E0385V00')]));

      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W123', rawValue: 'W123', isValid: true } as any);
      tick();

      expect(packServiceSpy.getProductCodes).toHaveBeenCalledWith('W123');
      expect((component as any).productCodeOptions().length).toBe(1);
      expect((component as any).productCodeOptions()[0].value).toBe('E0385V00');
    }));


  });

  describe('onUnitCleared', () => {
    it('should clear form fields and lookup options', () => {
      fixture.detectChanges();
      component.packForm.patchValue({ productCode: 'P', aliquot: '00', aboRh: '51' });
      (component as any).productCodeOptions.set([lookupOpt('P')]);
      component.onUnitCleared();
      expect(component.packForm.get('productCode')?.value).toBe('');
      expect((component as any).productCodeOptions().length).toBe(0);
      expect((component as any).allowedExpiryMoment).toBeNull();
    });
  });

  // ── onQcTab ───────────────────────────────────────────────────────────────────

  describe('onQcTab', () => {
    it('should call preventDefault, stopPropagation and onPackProduct', () => {
      const mockEvent = jasmine.createSpyObj<Event>('Event', ['preventDefault', 'stopPropagation']);
      spyOn(component, 'onPackProduct').and.stub();

      component.onQcTab(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.onPackProduct).toHaveBeenCalled();
    });
  });

  // ── Pack product ──────────────────────────────────────────────────────────────

  describe('onPackProduct', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).currentPickSlipId.set('PA1-001');
      (component as any).currentBoxId.set('BOX-001');
      component.headerForm.patchValue({ orderNo: 'ORD-001' });
      (component as any).activeBoxes.set([mockBox]);
    });







    it('should call pack API and show success on valid form', fakeAsync(() => {
      packServiceSpy.packProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'Product packed successfully' }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));

      (component as any).unitIdField = { isValid: true, clear: () => {}, focus: () => {} };
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00', aboRh: '51', expirationDate: '31-DEC-2026 23:59', qualityCheck: 'Y' });

      component.onPackProduct();
      tick();

      expect(packServiceSpy.packProduct).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully');
    }));


  });

  // ── Create new box ────────────────────────────────────────────────────────────
  // ── Pack Status dialog ────────────────────────────────────────────────────────
  // ── Box Contents dialog ───────────────────────────────────────────────────────
  // ── Auto-pack cascade ─────────────────────────────────────────────────────────

  describe('onAliquotChange', () => {
    it('should load blood types and cache expiry when aliquot changes', fakeAsync(() => {
      fixture.detectChanges();
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00' });

      packServiceSpy.getBloodTypes.and.returnValue(of([lookupOpt('51')]));
      packServiceSpy.getUnitExpiry.and.returnValue(of({ success: true, data: '31-DEC-2026 23:59' }));

      component.onAliquotChange('00', true);
      tick();

      expect(packServiceSpy.getBloodTypes).toHaveBeenCalled();
      expect(packServiceSpy.getUnitExpiry).toHaveBeenCalled();
      expect((component as any).bloodTypeOptions().length).toBe(1);
      expect((component as any).allowedExpiryMoment).not.toBeNull();
    }));


  });

  // ── onExpirationDateBlur ──────────────────────────────────────────────────────

  describe('onExpirationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should normalise "22-SEP-2026 23:59" and leave it unchanged', () => {
      component.packForm.get('expirationDate')?.setValue('22-SEP-2026 23:59');
      component.onExpirationDateBlur();
      expect(component.packForm.get('expirationDate')?.value).toBe('22-SEP-2026 23:59');
      expect(component.packForm.get('expirationDate')?.hasError('invalidFormat')).toBeFalse();
      expect(component.packForm.get('expirationDate')?.hasError('invalidTime')).toBeFalse();
    });

    it('should parse "22092026 2359" and normalise to "22-SEP-2026 23:59"', () => {
      component.packForm.get('expirationDate')?.setValue('22092026 2359');
      component.onExpirationDateBlur();
      expect(component.packForm.get('expirationDate')?.value).toBe('22-SEP-2026 23:59');
      expect(component.packForm.get('expirationDate')?.hasError('invalidFormat')).toBeFalse();
    });

    it('should set invalidFormat error for unparseable input "abc"', () => {
      component.packForm.get('expirationDate')?.setValue('abc');
      component.onExpirationDateBlur();
      expect(component.packForm.get('expirationDate')?.hasError('invalidFormat')).toBeTrue();
    });

    it('should set invalidTime error for valid date with invalid time "22-SEP-2026 2599"', () => {
      component.packForm.get('expirationDate')?.setValue('22-SEP-2026 2599');
      component.onExpirationDateBlur();
      expect(component.packForm.get('expirationDate')?.hasError('invalidTime')).toBeTrue();
    });
  });

  // ── aliquot form control ──────────────────────────────────────────────────────

  describe('aliquot form control', () => {
    it('should not have Validators.required on aliquot', () => {
      fixture.detectChanges();
      const ctrl = component.packForm.get('aliquot');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeFalse();
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  describe('formatDate / formatDateTime', () => {


    it('should format ISO datetime to DD-MMM-YYYY HH:mm', () => {
      expect(component.formatDateTime('2026-05-31T14:30:00Z')).toContain('2026');
    });


  });

  describe('computed signals', () => {
    it('isEmpty should be true when no order loaded', () => {
      (component as any).orderDetails.set(null);
      expect((component as any).isEmpty()).toBeTrue();
    });

    it('isEmpty should be false when order is loaded', () => {
      (component as any).orderDetails.set(mockOrderDetail);
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('hasOrderData should reflect orderDetails presence', () => {
      (component as any).orderDetails.set(null);
      expect((component as any).hasOrderData()).toBeFalse();
      (component as any).orderDetails.set(mockOrderDetail);
      expect((component as any).hasOrderData()).toBeTrue();
    });
  });

  describe('chapter change', () => {
    it('should reload orders and box types on chapter change', fakeAsync(() => {
      fixture.detectChanges();

      chapterChanged$.next();
      tick();

      expect(packServiceSpy.getAllOrders).toHaveBeenCalled();
      expect(packServiceSpy.getBoxTypes).toHaveBeenCalled();
    }));
  });

  // ── Additional coverage tests ─────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should return empty string for null/undefined', () => {
      expect(component.formatDate(null)).toBe('');
      expect(component.formatDate(undefined)).toBe('');
      expect(component.formatDate('')).toBe('');
    });

    it('should format valid ISO date to DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate('2026-05-31');
      expect(result).toContain('2026');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should return empty string for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('');
    });
  });

  describe('formatDateTime extended', () => {
    it('should return empty string for null/undefined', () => {
      expect(component.formatDateTime(null)).toBe('');
      expect(component.formatDateTime(undefined)).toBe('');
      expect(component.formatDateTime('')).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('');
    });
  });

  describe('isFieldInvalid', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return false for untouched field', () => {
      expect(component.isFieldInvalid('productCode')).toBeFalse();
    });

    it('should return true for touched invalid field', () => {
      const ctrl = component.packForm.get('productCode');
      ctrl?.markAsTouched();
      ctrl?.setValue('');
      expect(component.isFieldInvalid('productCode')).toBeTrue();
    });

    it('should return false for touched valid field', () => {
      const ctrl = component.packForm.get('productCode');
      ctrl?.setValue('E0385V00');
      ctrl?.markAsTouched();
      expect(component.isFieldInvalid('productCode')).toBeFalse();
    });

    it('should return false for nonexistent field', () => {
      expect(component.isFieldInvalid('nonExistent')).toBeFalse();
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty for untouched field', () => {
      expect(component.getFieldError('productCode')).toBe('');
    });

    it('should return Product Code required message', () => {
      const ctrl = component.packForm.get('productCode');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(component.getFieldError('productCode')).toContain('Product Code');
    });

    it('should return ABO/Rh required message', () => {
      const ctrl = component.packForm.get('aboRh');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(component.getFieldError('aboRh')).toContain('ABO/Rh');
    });

    it('should return empty for nonexistent field', () => {
      expect(component.getFieldError('nonExistent')).toBe('');
    });
  });

  describe('getExpirationDateError', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty for untouched field', () => {
      expect(component.getExpirationDateError()).toBe('');
    });

    it('should return required message', () => {
      const ctrl = component.packForm.get('expirationDate');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ required: true });
      expect(component.getExpirationDateError()).toContain('required');
    });

    it('should return scan invalid message', () => {
      const ctrl = component.packForm.get('expirationDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ scanInvalid: true });
      expect(component.getExpirationDateError()).toContain('scan');
    });

    it('should return invalid format message', () => {
      const ctrl = component.packForm.get('expirationDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ invalidFormat: true });
      expect(component.getExpirationDateError()).toContain('Invalid date');
    });

    it('should return invalid time message', () => {
      const ctrl = component.packForm.get('expirationDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ invalidTime: true });
      expect(component.getExpirationDateError()).toContain('Invalid time');
    });

    it('should return DB mismatch message', () => {
      const ctrl = component.packForm.get('expirationDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ expiryDbMismatch: true });
      expect(component.getExpirationDateError()).toContain('0308');
    });
  });

  describe('onAboRhChanged', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set aboRh form value from option', () => {
      component.onAboRhChanged({ code: '51', description: 'O Pos' });
      expect(component.packForm.get('aboRh')?.value).toBe('51');
    });

    it('should clear aboRh form value when null', () => {
      component.packForm.patchValue({ aboRh: '51' }, { emitEvent: false });
      component.onAboRhChanged(null);
      expect(component.packForm.get('aboRh')?.value).toBe('');
    });
  });

  describe('onAboRhCleared', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear aboRh and mark untouched', () => {
      component.packForm.patchValue({ aboRh: '51' }, { emitEvent: false });
      component.packForm.get('aboRh')?.markAsTouched();
      component.onAboRhCleared();
      expect(component.packForm.get('aboRh')?.value).toBe('');
      expect(component.packForm.get('aboRh')?.touched).toBeFalse();
    });
  });

  describe('isPackFormValid', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return false when unitIdField is not valid', () => {
      (component as any).unitIdField = { isValid: false };
      expect(component.isPackFormValid()).toBeFalse();
    });

    it('should return false when unitIdField is undefined', () => {
      (component as any).unitIdField = undefined;
      expect(component.isPackFormValid()).toBeFalse();
    });

    it('should return false when productCode is empty', () => {
      (component as any).unitIdField = { isValid: true };
      component.packForm.patchValue({ productCode: '', aboRh: '51' }, { emitEvent: false });
      expect(component.isPackFormValid()).toBeFalse();
    });

    it('should return false when aboRh is empty', () => {
      (component as any).unitIdField = { isValid: true };
      component.packForm.patchValue({ productCode: 'E0385V00', aboRh: '' }, { emitEvent: false });
      expect(component.isPackFormValid()).toBeFalse();
    });

    it('should return true when all required fields valid', () => {
      (component as any).unitIdField = { isValid: true };
      component.packForm.patchValue({ productCode: 'E0385V00', aboRh: '51' }, { emitEvent: false });
      expect(component.isPackFormValid()).toBeTrue();
    });
  });

  describe('onTypeSelected', () => {
    it('should set currentBoxType and resolve description', () => {
      (component as any).boxTypes.set([mockBoxType]);
      component.onTypeSelected('CO');
      expect((component as any).currentBoxType()).toBe('CO');
      expect((component as any).currentBoxTypeDesc()).toBe('Cooler');
    });

    it('should set null when empty code', () => {
      component.onTypeSelected('');
      expect((component as any).currentBoxType()).toBeNull();
      expect((component as any).currentBoxTypeDesc()).toBeNull();
    });
  });

  describe('onBoxSelected edge cases', () => {
    it('should set null box type when box not found in activeBoxes', () => {
      (component as any).activeBoxes.set([]);
      component.onBoxSelected('UNKNOWN');
      expect((component as any).currentBoxId()).toBe('UNKNOWN');
      expect((component as any).currentBoxType()).toBeNull();
    });

    it('should set null when empty boxId', () => {
      component.onBoxSelected('');
      expect((component as any).currentBoxId()).toBeNull();
    });
  });

  // ── onPackProduct branch coverage ─────────────────────────────────────────────

  describe('onPackProduct branches', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).currentPickSlipId.set('PA1-001');
      (component as any).currentBoxId.set('BOX-001');
      component.headerForm.patchValue({ orderNo: 'ORD-001' }, { emitEvent: false });
      (component as any).activeBoxes.set([mockBox]);
      (component as any).unitIdField = { isValid: true, clear: () => {}, focus: () => {} };
    });

    it('should show error when no order selected', () => {
      component.headerForm.patchValue({ orderNo: '' }, { emitEvent: false });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select an order');
    });

    it('should show error when unitId is not valid', () => {
      (component as any).unitIdField = { isValid: false };
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please enter a valid Unit ID');
    });

    it('should show error when productCode is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: '', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Product Code is required');
    });

    it('should show error when aboRh is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('ABO/Rh is required');
    });

    it('should show error when qualityCheck is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: '', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Quality Check is required');
    });

    it('should show error when expirationDate is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '' }, { emitEvent: false });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Expiration date & time is required');
    });

    it('should show error when expiry control has errors', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: 'some-date' }, { emitEvent: false });
      component.packForm.get('expirationDate')?.setErrors({ invalidFormat: true });
      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalled();
    });

    it('should show error when box is closed', fakeAsync(() => {
      const closedBox: ActiveBoxDto = { boxId: 'BOX-001', boxType: 'CO', boxStatus: 'CL' };
      (component as any).activeBoxes.set([closedBox]);
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('already closed'));
    }));

    it('should auto-create box when no box selected', fakeAsync(() => {
      (component as any).currentBoxId.set(null);
      (component as any).currentBoxType.set('CO');
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      packServiceSpy.createBox.and.returnValue(of({ success: true, statusCode: 200, message: '', data: 'BOX-NEW' }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));
      packServiceSpy.packProduct.and.returnValue(of({ success: true, statusCode: 200, message: '' }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));

      component.onPackProduct();
      tick();

      expect(packServiceSpy.createBox).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Box BOX-NEW created');
    }));

    it('should show error when auto-create box fails with error response', fakeAsync(() => {
      (component as any).currentBoxId.set(null);
      (component as any).currentBoxType.set('CO');
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      packServiceSpy.createBox.and.returnValue(of({ success: false, statusCode: 500, message: 'Box creation failed' }));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Box creation failed');
    }));

    it('should show error when auto-create box throws', fakeAsync(() => {
      (component as any).currentBoxId.set(null);
      (component as any).currentBoxType.set('CO');
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      packServiceSpy.createBox.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should show error when no box type available for auto-create', () => {
      (component as any).currentBoxId.set(null);
      (component as any).currentBoxType.set(null);
      (component as any).boxTypes.set([]);
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      component.onPackProduct();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a Box Type before packing');
    });

    it('should open quarantine dialog when QC is N', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'N', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      const qDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      qDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(qDialogRef);

      packServiceSpy.quarantineProduct.and.returnValue(of({ success: true, statusCode: 200, message: '' }));

      component.onPackProduct();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(packServiceSpy.quarantineProduct).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('quarantine'));
    }));

    it('should not quarantine when user cancels dialog', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'N', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      const qDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      qDialogRef.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(qDialogRef);

      component.onPackProduct();
      tick();

      expect(packServiceSpy.quarantineProduct).not.toHaveBeenCalled();
    }));

    it('should show error when quarantine fails', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'N', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      const qDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      qDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(qDialogRef);

      packServiceSpy.quarantineProduct.and.returnValue(of({ success: false, statusCode: 500, message: 'Quarantine failed' }));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Quarantine failed');
    }));

    it('should show error when quarantine throws', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'N', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      const qDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      qDialogRef.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(qDialogRef);

      packServiceSpy.quarantineProduct.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should handle pack failure response', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      packServiceSpy.packProduct.and.returnValue(of({ success: false, statusCode: 400, message: 'Pack failed' }));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Pack failed');
    }));

    it('should handle pack API error', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      packServiceSpy.packProduct.and.returnValue(throwError(() => ({ error: { message: 'Network error' } })));

      component.onPackProduct();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network error');
      expect((component as any).packingLoading()).toBeFalse();
    }));

    it('should reload pick slips when resolvedPickSlipId not in pickSlips list', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });
      (component as any).pickSlips.set([]);

      packServiceSpy.packProduct.and.returnValue(of({ success: true, statusCode: 200, message: '', pickSlipId: 'NEW-PS' } as any));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));

      component.onPackProduct();
      tick(100);

      expect(packServiceSpy.getPickSlipsForOrder).toHaveBeenCalled();
    }));

    it('should load pick slips when no resolvedPickSlipId in response', fakeAsync(() => {
      (component as any).currentPickSlipId.set(null);
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aboRh: '51', qualityCheck: 'Y', expirationDate: '31-DEC-2026 23:59' }, { emitEvent: false });

      packServiceSpy.packProduct.and.returnValue(of({ success: true, statusCode: 200, message: '' }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBox] }));

      component.onPackProduct();
      tick(100);

      expect(packServiceSpy.getPickSlipsForOrder).toHaveBeenCalledWith('ORD-001');
    }));
  });

  // ── onCloseCurrentBox ──────────────────────────────────────────────────────────

  describe('onCloseCurrentBox', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should do nothing when no box selected', () => {
      (component as any).currentBoxId.set(null);
      component.onCloseCurrentBox();
      expect(packServiceSpy.closeBox).not.toHaveBeenCalled();
    });

    it('should close box and clear boxId on success', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX-001');
      packServiceSpy.closeBox.and.returnValue(of({ success: true, statusCode: 200, message: '' }));

      component.onCloseCurrentBox();
      tick();

      expect(packServiceSpy.closeBox).toHaveBeenCalledWith('BOX-001');
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('BOX-001'));
      expect((component as any).currentBoxId()).toBeNull();
      expect((component as any).loading()).toBeFalse();
    }));

    it('should show error on close box failure', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX-001');
      packServiceSpy.closeBox.and.returnValue(throwError(() => new Error('fail')));

      component.onCloseCurrentBox();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to close box');
      expect((component as any).loading()).toBeFalse();
    }));
  });

  // ── onCreateNewBox ─────────────────────────────────────────────────────────────

  describe('onCreateNewBox', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should show error when no order data', () => {
      (component as any).orderDetails.set(null);
      component.onCreateNewBox();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select an order first');
    });

    it('should open dialog and create new box on confirm without closing', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxId.set(null);
      (component as any).currentBoxType.set('CO');
      (component as any).boxTypes.set([mockBoxType]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      packServiceSpy.createBox.and.returnValue(of({ success: true, statusCode: 200, message: '', data: 'BOX-NEW' }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));

      component.onCreateNewBox();
      tick(600);

      expect(packServiceSpy.createBox).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('BOX-NEW'));
    }));

    it('should do nothing when dialog is cancelled', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      component.onCreateNewBox();
      tick();

      expect(packServiceSpy.createBox).not.toHaveBeenCalled();
    }));

    it('should close current box then create new when closeCurrentBox is true', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxId.set('BOX-001');
      (component as any).currentBoxType.set('CO');
      (component as any).boxTypes.set([mockBoxType]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      packServiceSpy.closeBox.and.returnValue(of({ success: true, statusCode: 200, message: '' }));
      packServiceSpy.createBox.and.returnValue(of({ success: true, statusCode: 200, message: '', data: 'BOX-NEW2' }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));

      component.onCreateNewBox();
      tick(600);

      expect(packServiceSpy.closeBox).toHaveBeenCalledWith('BOX-001');
      expect(packServiceSpy.createBox).toHaveBeenCalled();
    }));

    it('should show error when close box fails during create new', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxId.set('BOX-001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      packServiceSpy.closeBox.and.returnValue(throwError(() => new Error('fail')));

      component.onCreateNewBox();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to close current box');
    }));
  });

  // ── createNewBox (private, tested through onCreateNewBox) ──────────────────────

  describe('createNewBox edge cases', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should show error when no box type available', () => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxType.set(null);
      (component as any).boxTypes.set([]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      component.onCreateNewBox();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('No box type'));
    });

    it('should show error when createBox returns failure', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxType.set('CO');
      (component as any).boxTypes.set([mockBoxType]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      packServiceSpy.createBox.and.returnValue(of({ success: false, statusCode: 500, message: 'Create failed' }));

      component.onCreateNewBox();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Create failed');
    }));

    it('should show error when createBox throws', fakeAsync(() => {
      (component as any).orderDetails.set(mockOrderDetail);
      (component as any).currentBoxType.set('CO');
      (component as any).boxTypes.set([mockBoxType]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false }));
      (component as any).dialog.open.and.returnValue(dialogRefSpy);

      packServiceSpy.createBox.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onCreateNewBox();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    }));
  });

  // ── onPackStatus ──────────────────────────────────────────────────────────────

  describe('onPackStatus', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should do nothing when already loading', () => {
      (component as any).packStatusLoading.set(true);
      component.onPackStatus();
      expect(packServiceSpy.getPackStatus).not.toHaveBeenCalled();
    });

    it('should show error when no pick slip selected', () => {
      (component as any).currentPickSlipId.set(null);
      component.onPackStatus();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('No pick slip selected');
    });

    it('should open pack status dialog on success', fakeAsync(() => {
      (component as any).currentPickSlipId.set('PA1-001');
      (component as any).pickSlips.set([mockPickSlip]);

      const statusItems: PackStatusItemDto[] = [
        { unitId: 'W123', productCode: 'E0385V00', productStatus: 'PK' },
        { unitId: 'W456', productCode: 'E0385V00', productStatus: 'AL' }
      ];
      packServiceSpy.getPackStatus.and.returnValue(of({ success: true, statusCode: 200, message: '', data: statusItems }));

      component.onPackStatus();
      tick();

      expect((component as any).dialog.open).toHaveBeenCalled();
      expect((component as any).packStatusLoading()).toBeFalse();
    }));

    it('should show error on pack status failure', fakeAsync(() => {
      (component as any).currentPickSlipId.set('PA1-001');
      (component as any).pickSlips.set([mockPickSlip]);

      packServiceSpy.getPackStatus.and.returnValue(throwError(() => new Error('fail')));

      component.onPackStatus();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load pack status');
      expect((component as any).packStatusLoading()).toBeFalse();
    }));
  });

  // ── onViewBoxContents ─────────────────────────────────────────────────────────

  describe('onViewBoxContents', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should do nothing when already loading', () => {
      (component as any).boxContentsLoading.set(true);
      component.onViewBoxContents();
      expect(packServiceSpy.getBoxContents).not.toHaveBeenCalled();
    });

    it('should show error when no box selected', () => {
      (component as any).currentBoxId.set(null);
      component.onViewBoxContents();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('No box selected');
    });

    it('should open box contents dialog on success', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX-001');
      packServiceSpy.getBoxContents.and.returnValue(of({ success: true, statusCode: 200, message: '', data: { boxId: 'BOX-001', products: [mockPacked] } }));

      component.onViewBoxContents();
      tick();

      expect((component as any).dialog.open).toHaveBeenCalled();
      expect((component as any).boxContentsLoading()).toBeFalse();
    }));

    it('should show error on box contents failure response', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX-001');
      packServiceSpy.getBoxContents.and.returnValue(of({ success: false, statusCode: 500, message: 'Not found' }));

      component.onViewBoxContents();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Not found');
    }));

    it('should show error on box contents API error', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX-001');
      packServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('fail')));

      component.onViewBoxContents();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load box contents');
      expect((component as any).boxContentsLoading()).toBeFalse();
    }));
  });

  // ── onUnpackProduct ───────────────────────────────────────────────────────────

  describe('onUnpackProduct', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should do nothing when no pickSlipId available', () => {
      (component as any).currentPickSlipId.set(null);
      component.onUnpackProduct({ unitId: 'W123', productCode: 'E0385V00' } as PackedProductDto);
      expect(packServiceSpy.unpackProduct).not.toHaveBeenCalled();
    });

    it('should use product pickSlipId if available', fakeAsync(() => {
      (component as any).currentPickSlipId.set('PA1-001');
      packServiceSpy.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: '' }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      (component as any).pickSlips.set([mockPickSlip]);

      component.onUnpackProduct({ unitId: 'W123', productCode: 'E0385V00', pickSlipId: 'PS-CUSTOM' } as PackedProductDto);
      tick();

      expect(packServiceSpy.unpackProduct).toHaveBeenCalledWith(jasmine.objectContaining({ pickSlipId: 'PS-CUSTOM' }));
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Product unpacked');
    }));

    it('should show error on unpack failure response', fakeAsync(() => {
      (component as any).currentPickSlipId.set('PA1-001');
      packServiceSpy.unpackProduct.and.returnValue(of({ success: false, statusCode: 400, message: 'Cannot unpack' }));

      component.onUnpackProduct({ unitId: 'W123', productCode: 'E0385V00' } as PackedProductDto);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot unpack');
    }));

    it('should show error on unpack API error', fakeAsync(() => {
      (component as any).currentPickSlipId.set('PA1-001');
      packServiceSpy.unpackProduct.and.returnValue(throwError(() => new Error('fail')));

      component.onUnpackProduct({ unitId: 'W123', productCode: 'E0385V00' } as PackedProductDto);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to unpack product');
    }));
  });

  // ── onProductCodeChange ───────────────────────────────────────────────────────

  describe('onProductCodeChange', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return early when unitId is empty', () => {
      component.packForm.patchValue({ unitId: '' }, { emitEvent: false });
      component.onProductCodeChange('E0385V00');
      expect(packServiceSpy.getAliquots).not.toHaveBeenCalled();
    });

    it('should return early when productCode is empty', () => {
      component.packForm.patchValue({ unitId: 'W123' }, { emitEvent: false });
      component.onProductCodeChange('');
      expect(packServiceSpy.getAliquots).not.toHaveBeenCalled();
    });

    it('should default to 00 when no aliquots returned', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123' }, { emitEvent: false });
      packServiceSpy.getAliquots.and.returnValue(of([]));
      packServiceSpy.getBloodTypes.and.returnValue(of([lookupOpt('51')]));
      packServiceSpy.getUnitExpiry.and.returnValue(of({ success: true, data: '31-DEC-2026 23:59' }));

      component.onProductCodeChange('E0385V00');
      tick();

      expect(component.packForm.get('aliquot')?.value).toBe('00');
    }));

    it('should auto-select first aliquot when data returned', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123' }, { emitEvent: false });
      packServiceSpy.getAliquots.and.returnValue(of([lookupOpt('01'), lookupOpt('02')]));
      packServiceSpy.getBloodTypes.and.returnValue(of([lookupOpt('51')]));
      packServiceSpy.getUnitExpiry.and.returnValue(of({ success: true, data: '31-DEC-2026 23:59' }));

      component.onProductCodeChange('E0385V00');
      tick();

      expect(component.packForm.get('aliquot')?.value).toBe('01');
    }));

    it('should show error when getAliquots fails', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123' }, { emitEvent: false });
      packServiceSpy.getAliquots.and.returnValue(throwError(() => new Error('fail')));

      component.onProductCodeChange('E0385V00');
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('aliquots'));
    }));
  });

  // ── onAliquotChange extended ──────────────────────────────────────────────────

  describe('onAliquotChange extended', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return early when unitId is empty', () => {
      component.packForm.patchValue({ unitId: '', productCode: 'E0385V00' }, { emitEvent: false });
      component.onAliquotChange('00');
      expect(packServiceSpy.getBloodTypes).not.toHaveBeenCalled();
    });

    it('should return early when productCode is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: '' }, { emitEvent: false });
      component.onAliquotChange('00');
      expect(packServiceSpy.getBloodTypes).not.toHaveBeenCalled();
    });

    it('should return early when aliquot is empty', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00' }, { emitEvent: false });
      component.onAliquotChange('');
      expect(packServiceSpy.getBloodTypes).not.toHaveBeenCalled();
    });

    it('should show error when no blood types found', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00' }, { emitEvent: false });
      packServiceSpy.getBloodTypes.and.returnValue(of([]));
      packServiceSpy.getUnitExpiry.and.returnValue(of({ success: true, data: '31-DEC-2026 23:59' }));

      component.onAliquotChange('00');
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('No ABO/Rh'));
    }));

    it('should handle error from forkJoin', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00' }, { emitEvent: false });
      packServiceSpy.getBloodTypes.and.returnValue(throwError(() => new Error('fail')));
      packServiceSpy.getUnitExpiry.and.returnValue(of({ success: true, data: '31-DEC-2026 23:59' }));

      component.onAliquotChange('00');
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load product details'));
    }));
  });

  // ── onUnitValidated extended ──────────────────────────────────────────────────

  describe('onUnitValidated extended', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return early when parsedUnitId is empty', () => {
      component.onUnitValidated({ parsedUnitId: '', rawValue: '', isValid: false } as any);
      expect(packServiceSpy.getProductCodes).not.toHaveBeenCalled();
    });

    it('should set codeScheme from validation response', fakeAsync(() => {
      packServiceSpy.getProductCodes.and.returnValue(of([]));
      component.onUnitValidated({ parsedUnitId: 'W123', rawValue: 'W123', isValid: true, codeScheme: 'C' } as any);
      tick();
      expect((component as any).codeScheme()).toBe('C');
    }));

    it('should show error when getProductCodes fails', fakeAsync(() => {
      packServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      component.onUnitValidated({ parsedUnitId: 'W123', rawValue: 'W123', isValid: true } as any);
      tick();
      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('product codes'));
    }));
  });

  // ── onExpirationDateBlur extended (scan paths) ────────────────────────────────

  describe('onExpirationDateBlur scan paths', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should do nothing when expiry field is empty', () => {
      component.packForm.get('expirationDate')?.setValue('');
      component.onExpirationDateBlur();
      // Method returns early for empty value — no scan or parse errors added
      // (only the pre-existing 'required' validator error remains)
      expect(component.packForm.get('expirationDate')?.hasError('invalidFormat')).toBeFalse();
      expect(component.packForm.get('expirationDate')?.hasError('scanInvalid')).toBeFalse();
    });

    it('should handle ISBT scan (&>) successfully', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: true, item: { expiryDisplay: '31-DEC-2026 23:59' } } as any));
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('&>262650000');
      component.onExpirationDateBlur();
      tick();

      expect(labelScanSpy.validateExpiryScan).toHaveBeenCalled();
      expect((component as any).expiryProcessing()).toBeFalse();
    }));

    it('should set scanInvalid error when ISBT scan fails', fakeAsync(() => {
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: false } as any));

      component.packForm.get('expirationDate')?.setValue('&>123456789012');
      component.onExpirationDateBlur();
      tick();

      expect(component.packForm.get('expirationDate')?.hasError('scanInvalid')).toBeTrue();
    }));

    it('should set scanInvalid error when scan API throws', fakeAsync(() => {
      labelScanSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('fail')));

      component.packForm.get('expirationDate')?.setValue('&>123456789012');
      component.onExpirationDateBlur();
      tick();

      expect(component.packForm.get('expirationDate')?.hasError('scanInvalid')).toBeTrue();
      expect((component as any).expiryProcessing()).toBeFalse();
    }));

    it('should handle Codabar scan (A...C) successfully', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: true, item: { expiryDisplay: '16-MAY-2012 00:00' } } as any));
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('A051612C');
      component.onExpirationDateBlur();
      tick();

      expect(labelScanSpy.validateExpiryScan).toHaveBeenCalledWith('A051612C', 'C');
    }));

    it('should handle &< scan prefix', fakeAsync(() => {
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: true, item: { expiryDisplay: '31-DEC-2026 23:59' } } as any));
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('&<262650000');
      component.onExpirationDateBlur();
      tick();

      expect(labelScanSpy.validateExpiryScan).toHaveBeenCalledWith('&<262650000', 'I');
    }));

    it('should handle => scan prefix', fakeAsync(() => {
      labelScanSpy.validateExpiryScan.and.returnValue(of({ success: true, item: { expiryDisplay: '31-DEC-2026 00:00' } } as any));
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('=>261231');
      component.onExpirationDateBlur();
      tick();

      expect(labelScanSpy.validateExpiryScan).toHaveBeenCalledWith('=>261231', 'I');
    }));

    it('should normalise manual date without time to 00:00', () => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('31-DEC-2026');
      component.onExpirationDateBlur();

      expect(component.packForm.get('expirationDate')?.value).toBe('31-DEC-2026 00:00');
    });
  });

  // ── validateExpiryAgainstDb ───────────────────────────────────────────────────

  describe('validateExpiryAgainstDb', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set expiryDbMismatch when validation fails', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      packServiceSpy.validateExpiry.and.returnValue(of({ success: false, message: 'Mismatch' }));

      component.packForm.get('expirationDate')?.setValue('31-DEC-2026');
      component.onExpirationDateBlur();
      tick();

      expect(component.packForm.get('expirationDate')?.hasError('expiryDbMismatch')).toBeTrue();
    }));

    it('should clear errors when validation succeeds', fakeAsync(() => {
      component.packForm.patchValue({ unitId: 'W123', productCode: 'E0385V00', aliquot: '00' }, { emitEvent: false });
      packServiceSpy.validateExpiry.and.returnValue(of({ success: true }));

      component.packForm.get('expirationDate')?.setValue('31-DEC-2026');
      component.onExpirationDateBlur();
      tick();

      expect(component.packForm.get('expirationDate')?.hasError('expiryDbMismatch')).toBeFalse();
    }));

    it('should return early when unitId is empty', fakeAsync(() => {
      component.packForm.patchValue({ unitId: '', productCode: 'E0385V00' }, { emitEvent: false });

      component.packForm.get('expirationDate')?.setValue('31-DEC-2026');
      component.onExpirationDateBlur();
      tick();

      expect(packServiceSpy.validateExpiry).not.toHaveBeenCalled();
    }));
  });

  // ── loadOrders / loadBoxTypes error paths ─────────────────────────────────────

  describe('data loading error paths', () => {
    it('should handle loadOrders error', fakeAsync(() => {
      packServiceSpy.getAllOrders.and.returnValue(throwError(() => new Error('fail')));
      packServiceSpy.getBoxTypes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockBoxType] }));

      fixture.detectChanges();
      tick();

      expect((component as any).allOrders().length).toBe(0);
      expect((component as any).filteredOrders().length).toBe(0);
    }));

    it('should handle loadBoxTypes error', fakeAsync(() => {
      packServiceSpy.getAllOrders.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockOrder] }));
      packServiceSpy.getBoxTypes.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      tick();

      expect((component as any).boxTypes().length).toBe(0);
    }));
  });

  // ── onOrderSelected extended ──────────────────────────────────────────────────

  describe('onOrderSelected extended', () => {
    it('should show error when order not found', fakeAsync(() => {
      packServiceSpy.getOrderDetails.and.returnValue(of({ success: false, statusCode: 404, message: 'Not found' }));

      fixture.detectChanges();
      component.onOrderSelected('BAD');
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Order not found');
      expect((component as any).orderLoading()).toBeFalse();
    }));

    it('should show error on API failure', fakeAsync(() => {
      packServiceSpy.getOrderDetails.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      fixture.detectChanges();
      component.onOrderSelected('BAD');
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
      expect((component as any).orderLoading()).toBeFalse();
    }));

    it('should fallback to first item when all items are cancelled', fakeAsync(() => {
      const allCancelled: OrderDetailDto = {
        orderNo: 'ORD-003',
        items: [
          { itemNo: 1, productType: 'FFP', bloodType: '51', aboRhDescription: 'O Pos', remainingQty: 0, itemStatusDescription: 'Cancelled', itemStatus: 'CA' },
          { itemNo: 2, productType: 'FFP', bloodType: '51', aboRhDescription: 'O Pos', remainingQty: 0, itemStatusDescription: 'Packed', itemStatus: 'PK' },
        ],
        shipToAddress: 'PARKLAND, TX', estArrivalTime: '2026-08-01T10:00:00'
      };
      packServiceSpy.getOrderDetails.and.returnValue(of({ success: true, statusCode: 200, message: '', data: allCancelled }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));

      fixture.detectChanges();
      component.onOrderSelected('ORD-003');
      tick();

      // Falls back to items[0] since all are CA/PK/SH
      expect(component.packForm.get('itemNo')?.value).toBe(1);
    }));
  });

  // ── loadPickSlips / loadPackedProducts ─────────────────────────────────────────

  describe('loadPickSlips', () => {
    it('should handle error response', fakeAsync(() => {
      packServiceSpy.getOrderDetails.and.returnValue(of({
        success: true, statusCode: 200, message: '', data: { ...mockOrderDetail, items: [] }
      }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(throwError(() => new Error('fail')));
      packServiceSpy.getActiveBoxes.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));

      fixture.detectChanges();
      component.onOrderSelected('ORD-001');
      tick();

      expect((component as any).pickSlips().length).toBe(0);
    }));
  });

  // ── aboRhSelectOptions computed ───────────────────────────────────────────────

  describe('aboRhSelectOptions', () => {
    it('should convert bloodTypeOptions to ScanSelectOption format', () => {
      (component as any).bloodTypeOptions.set([{ value: '51', label: 'O Pos' }, { value: '62', label: 'A Neg' }]);
      const options = (component as any).aboRhSelectOptions();
      expect(options.length).toBe(2);
      expect(options[0].code).toBe('51');
      expect(options[0].description).toBe('O Pos');
    });

    it('should return empty array when no blood types', () => {
      (component as any).bloodTypeOptions.set([]);
      expect((component as any).aboRhSelectOptions().length).toBe(0);
    });
  });

  // ── elementId helper ──────────────────────────────────────────────────────────

  describe('elementId', () => {
    it('should generate prefixed element IDs', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('pack-');
      expect(id).toContain('-test');
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      fixture.detectChanges();
      const spy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── parseAboRh ────────────────────────────────────────────────────────────────

  describe('parseAboRh', () => {
    it('should parse ISBT ABO scan (=%)', fakeAsync(() => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true, item: { aboCode: '51', aboShortName: 'O Pos' }
      } as any));

      let result: any;
      (component as any).parseAboRh('=%9500').subscribe((r: any) => result = r);
      tick();

      expect(labelScanSpy.validateAboScan).toHaveBeenCalledWith('=%9500', 'I');
      expect(result.code).toBe('51');
    }));

    it('should parse Codabar ABO scan (D...0B)', fakeAsync(() => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true, item: { aboCode: '95', aboShortName: 'O Pos' }
      } as any));

      let result: any;
      (component as any).parseAboRh('D950B').subscribe((r: any) => result = r);
      tick();

      expect(labelScanSpy.validateAboScan).toHaveBeenCalledWith('D950B', 'C');
    }));

    it('should use codeScheme for manual entry', fakeAsync(() => {
      (component as any).codeScheme.set('C');
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true, item: { aboCode: '51', aboLabel: 'O Pos' }
      } as any));

      let result: any;
      (component as any).parseAboRh('51').subscribe((r: any) => result = r);
      tick();

      expect(labelScanSpy.validateAboScan).toHaveBeenCalledWith('51', 'C');
      expect(result.code).toBe('51');
    }));

    it('should throw error on invalid scan result', fakeAsync(() => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: false, errorResponse: { error: 'Invalid scan' }
      } as any));

      let error: any;
      (component as any).parseAboRh('bad').subscribe({ error: (e: any) => error = e });
      tick();

      expect(error).toBeDefined();
    }));
  });

  // ── loadActiveBoxes ───────────────────────────────────────────────────────────

  describe('loadActiveBoxes via onOrderSelected', () => {
    it('should handle loadActiveBoxes error', fakeAsync(() => {
      packServiceSpy.getOrderDetails.and.returnValue(of({ success: true, statusCode: 200, message: '', data: mockOrderDetail }));
      packServiceSpy.getPickSlipsForOrder.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [mockPickSlip] }));
      packServiceSpy.getPackedProducts.and.returnValue(of({ success: true, statusCode: 200, message: '', data: [] }));
      packServiceSpy.getActiveBoxes.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      component.onOrderSelected('ORD-001');
      tick();

      expect((component as any).activeBoxes().length).toBe(0);
      expect((component as any).filteredBoxes().length).toBe(0);
    }));
  });

  // ── packedProductsTableConfig valueFormatter ──────────────────────────────────

  describe('packedProductsTableConfig', () => {
    it('should have a valueFormatter for expDate column', () => {
      const config = component.packedProductsTableConfig;
      const expDateCol = config.columns.find(c => c.key === 'expDate');
      expect(expDateCol).toBeDefined();
      expect(expDateCol!.valueFormatter).toBeDefined();
      const result = expDateCol!.valueFormatter!('2026-12-31T23:59:00');
      expect(result).toContain('2026');
    });
  });
});
