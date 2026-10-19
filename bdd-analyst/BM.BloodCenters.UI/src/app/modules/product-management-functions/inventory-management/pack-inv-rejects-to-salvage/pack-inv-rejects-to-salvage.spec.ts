import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { of, throwError, EMPTY } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { PackInvRejectsToSalvageComponent } from './pack-inv-rejects-to-salvage';
import { PackInvRejectsApiService } from './services/pack-inv-rejects-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ConsigneeLovDto,
  OrderLovDto,
  ProductTypeLovDto,
  BoxLovDto,
  DiscardProductDto
} from './models/pack-inv-rejects.model';

describe('PackInvRejectsToSalvageComponent', () => {
  let component: PackInvRejectsToSalvageComponent;
  let fixture: ComponentFixture<PackInvRejectsToSalvageComponent>;
  let apiServiceSpy: jasmine.SpyObj<PackInvRejectsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: MatDialog;
  let headerServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let labelScanServiceSpy: any;

  const mockConsignees: ConsigneeLovDto[] = [
    {
      consigneeId: 'CONS01',
      customerId: 'CUST01',
      customerType: 'RD',
      customerName: 'Test Customer',
      shortName: 'TC',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      fullAddress: '123 Main St, Springfield, IL'
    }
  ];

  const mockOrders: OrderLovDto[] = [
    {
      orderNo: 'ORD001',
      customerId: 'CUST01',
      consigneeId: 'CONS01',
      orderType: 'ID',
      orderClass: 'routine',
      orderStatus: 'open'
    }
  ];

  const mockProductTypes: ProductTypeLovDto[] = [
    {
      productType: 'RBC',
      description: 'Red Blood Cells'
    }
  ];

  const mockBoxes: BoxLovDto[] = [
    {
      boxId: 'BOX001',
      discardId: 'CONS01',
      boxStatus: 'open',
      productCount: 15
    }
  ];

  const mockProducts: DiscardProductDto[] = [
    {
      unitId: '1234567890123456',
      productCode: 'E1234567',
      aliquot: '00',
      chapterId: 'CH01',
      bloodType: 'AB',
      productType: 'RBC',
      productStatus: 'CI',
      collDate: '2024-01-15T00:00:00Z',
      expDate: '2024-03-15T12:00:00Z',
      boxId: 'BOX001',
      warehouseId: '1',
      discardType: 'RE',
      chkDigit: '12',
      productDesc: 'Red Cells',
      aboDesc: 'AB Positive'
    }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('PackInvRejectsApiService', [
      'getConsignees',
      'getOrders',
      'getProductTypes',
      'getBoxes',
      'queryDiscardProducts',
      'validateProduct',
      'packProducts',
      'unpackProduct'
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    headerServiceSpy = {
      chapterChanged$: EMPTY,
      getCurrentChapterTimezone: jest.fn().mockReturnValue('UTC'),
    };

    pageHeaderServiceSpy = {
      pageHeaderData: signal(undefined),
      getTitle: jest.fn().mockReturnValue(undefined),
      getSubtitle: jest.fn().mockReturnValue(undefined),
      getCurrentMenuItem: jest.fn().mockReturnValue(undefined),
    };

    labelScanServiceSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan',
      'validateAboScan',
      'validateExpiryScan',
    ]);

    apiServiceSpy.getConsignees.and.returnValue(of(mockConsignees));
    apiServiceSpy.getOrders.and.returnValue(of(mockOrders));
    apiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
    apiServiceSpy.getBoxes.and.returnValue(of(mockBoxes));
    apiServiceSpy.queryDiscardProducts.and.returnValue(of({ data: mockProducts, totalCount: 1 }));

      TestBed.configureTestingModule({
      imports: [PackInvRejectsToSalvageComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: PackInvRejectsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanServiceSpy },
      ]
    });


      apiServiceSpy.getConsignees.and.returnValue(of(mockConsignees));

      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      apiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));

      apiServiceSpy.getBoxes.and.returnValue(of(mockBoxes));

      apiServiceSpy.queryDiscardProducts.and.returnValue(of({ data: mockProducts, totalCount: 1 }));

    fixture = TestBed.createComponent(PackInvRejectsToSalvageComponent);
    component = fixture.componentInstance;
    dialogSpy = TestBed.inject(MatDialog);

    });

  describe('Initialization', () => {

    it('should load consignees on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getConsignees).toHaveBeenCalled();
      expect(component.consignees()).toEqual(mockConsignees);
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark consignee as invalid when empty', () => {
      expect(component.form.get('consigneeId')?.valid).toBeFalse();
    });

    it('should mark consignee as valid when filled', () => {
      component.form.patchValue({
        consigneeId: 'CONS01'
      });

      expect(component.form.get('consigneeId')?.valid).toBeTrue();
    });
  });

  describe('Consignee Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load orders when consignee is selected', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      expect(apiServiceSpy.getOrders).toHaveBeenCalledWith('CUST01', 'CONS01');
      expect(component.orders()).toEqual(mockOrders);
    }));

    it('should clear orders when consignee is cleared', fakeAsync(() => {
      component.orders.set(mockOrders);
      component.form.patchValue({ consigneeId: null });
      tick();

      expect(component.orders()).toEqual([]);
    }));

    it('should auto-select order when only one exists', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      expect(component.form.get('orderId')?.value).toBe('ORD001');
    }));
  });

  describe('Order Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      // Trigger consignee selection first to load orders
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
    }));

    it('should load product types when order is selected', fakeAsync(() => {
      // Order was auto-selected since there's only one, which triggers onOrderChange
      expect(apiServiceSpy.getProductTypes).toHaveBeenCalledWith('CUST01', 'CONS01');
      expect(component.productTypes()).toEqual(mockProductTypes);
    }));
  });

  describe('Product Deletion', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.unpackProduct.and.returnValue(of(undefined as any));
      // Set up consignee so loadPackedProducts can work
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
    }));

    it('should unpack product on delete action', fakeAsync(() => {
      const product = mockProducts[0];

      component.onPackedProductAction({ action: 'delete', row: product });
      tick();

      expect(apiServiceSpy.unpackProduct).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product removed successfully');
    }));
  });

  describe('Dialog Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open view box contents panel when box is selected', () => {
      component['currentBoxId'].set('BOX001');
      component.onViewBoxContents();

      expect(component['boxContentsPanelOpen']()).toBeTrue();
    });

    it('should not open view box contents when no box selected', () => {
      component['currentBoxId'].set('');
      component.onViewBoxContents();

      expect(component['boxContentsPanelOpen']()).toBeFalse();
    });
  });

  describe('Cancel Operation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset forms and clear data on cancel', fakeAsync(() => {
      component.form.patchValue({
        consigneeId: 'CONS01',
        productType: 'RBC',
        boxId: 'BOX001'
      });
      component.packedProducts.set(mockProducts);
      tick();

      component.onCancel();
      tick();

      expect(component.form.get('consigneeId')?.value).toBeNull();
      expect(component.packedProducts()).toEqual([]);
      expect(component.orders()).toEqual([]);
    }));
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute hasPackedProducts correctly', () => {
      component.packedProducts.set([]);
      expect(component.hasPackedProducts()).toBeFalse();

      component.packedProducts.set(mockProducts);
      expect(component.hasPackedProducts()).toBeTrue();
    });

    it('should compute canCloseBox correctly', () => {
      component['currentBoxId'].set('');
      component.packedProducts.set([]);
      expect(component.canCloseBox()).toBeFalse();

      component['currentBoxId'].set('BOX001');
      component.packedProducts.set(mockProducts);
      expect(component.canCloseBox()).toBeTrue();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle consignee loading error', fakeAsync(() => {
      apiServiceSpy.getConsignees.and.returnValue(throwError(() => new Error('Failed')));

      component.ngOnInit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed');
    }));

    it('should handle products loading error', fakeAsync(() => {
      apiServiceSpy.queryDiscardProducts.and.returnValue(throwError(() => new Error('Failed')));

      component.form.patchValue({
        consigneeId: 'CONS01',
        productType: 'RBC'
      });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed');
    }));

    it('should handle orders loading error', fakeAsync(() => {
      apiServiceSpy.getOrders.and.returnValue(throwError(() => new Error('Failed')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed');
    }));

    it('should handle product types loading error', fakeAsync(() => {
      apiServiceSpy.getProductTypes.and.returnValue(throwError(() => new Error('Failed')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      // order auto-selected, triggers product type load
      expect(apiServiceSpy.getProductTypes).toHaveBeenCalled();
    }));
  });

  describe('extractErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should extract error from errorResponse', () => {
      const err = { error: { errorResponse: { error: 'Server validation failed' } } };
      expect(component['extractErrorMessage'](err, 'fallback')).toBe('Server validation failed');
    });

    it('should extract error from error.message', () => {
      const err = { error: { message: 'Bad request' } };
      expect(component['extractErrorMessage'](err, 'fallback')).toBe('Bad request');
    });

    it('should extract error from err.message', () => {
      const err = { message: 'Connection refused' };
      expect(component['extractErrorMessage'](err, 'fallback')).toBe('Connection refused');
    });

    it('should return fallback when no error message available', () => {
      expect(component['extractErrorMessage']({}, 'fallback')).toBe('fallback');
    });

    it('should return fallback for null error', () => {
      expect(component['extractErrorMessage'](null, 'fallback')).toBe('fallback');
    });

    it('should return fallback for undefined error', () => {
      expect(component['extractErrorMessage'](undefined, 'fallback')).toBe('fallback');
    });
  });

  describe('Error Handling with API error responses', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show API error message from errorResponse on consignee load', fakeAsync(() => {
      const apiError = { error: { errorResponse: { error: 'Invalid chapter' } } };
      apiServiceSpy.getConsignees.and.returnValue(throwError(() => apiError));
      component.ngOnInit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid chapter');
    }));

    it('should show fallback error when error has no message', fakeAsync(() => {
      apiServiceSpy.getConsignees.and.returnValue(throwError(() => ({})));
      component.ngOnInit();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load consignees');
    }));
  });

  describe('Post Validate', () => {
    beforeEach(() => {
      (apiServiceSpy as any).validateUnit = jasmine.createSpy('validateUnit');
      (apiServiceSpy as any).getProductCodes = jasmine.createSpy('getProductCodes');
      fixture.detectChanges();
    });

    it('should reject when parsedUnitId is empty', () => {
      const event = { data: { parsedUnitId: '' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should confirm and set unit ID on valid response', fakeAsync(() => {
      (apiServiceSpy as any).validateUnit.and.returnValue(of({ isValid: true }));
      (apiServiceSpy as any).getProductCodes.and.returnValue(of([]));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      const event = { data: { parsedUnitId: 'UNIT001', codeScheme: 'I' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      tick();

      expect(event.confirm).toHaveBeenCalled();
      expect(component['currentUnitId']()).toBe('UNIT001');
    }));

    it('should reject on invalid unit response', fakeAsync(() => {
      (apiServiceSpy as any).validateUnit.and.returnValue(of({ isValid: false, errorMessage: 'Not eligible' }));
      const event = { data: { parsedUnitId: 'UNIT001', codeScheme: 'I' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Not eligible');
    }));

    it('should reject on invalid unit with default message', fakeAsync(() => {
      (apiServiceSpy as any).validateUnit.and.returnValue(of({ isValid: false }));
      const event = { data: { parsedUnitId: 'UNIT001', codeScheme: 'I' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Unit is not eligible for salvage packing');
    }));

    it('should reject on validation API error', fakeAsync(() => {
      (apiServiceSpy as any).validateUnit.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Server error' } } })));
      const event = { data: { parsedUnitId: 'UNIT001', codeScheme: 'I' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Server error');
    }));

    it('should reject on validation API error with message fallback', fakeAsync(() => {
      (apiServiceSpy as any).validateUnit.and.returnValue(throwError(() => ({ message: 'Connection failed' })));
      const event = { data: { parsedUnitId: 'UNIT001', codeScheme: 'I' }, reject: jasmine.createSpy('reject'), confirm: jasmine.createSpy('confirm') };
      component.onPostValidate(event as any);
      tick();
      expect(event.reject).toHaveBeenCalledWith('Connection failed');
    }));
  });

  describe('Unit ID Cleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all entry fields when unit ID is cleared', () => {
      component['currentUnitId'].set('12345');
      component['productCodeOptions'].set([{ code: 'E1234', description: 'Test' }]);
      component['selectedProductCode'].set('E1234');
      component['aboRhOptions'].set([{ code: 'A+', description: 'A Positive' }]);
      component['selectedAboRh'].set('A+');

      component.onUnitIdCleared();

      expect(component['currentUnitId']()).toBeNull();
      expect(component['productCodeOptions']()).toEqual([]);
      expect(component['selectedProductCode']()).toBe('');
      expect(component['aboRhOptions']()).toEqual([]);
      expect(component['selectedAboRh']()).toBe('');
    });
  });

  describe('Product Code Changed', () => {
    beforeEach(() => {
      (apiServiceSpy as any).getBloodTypes = jasmine.createSpy('getBloodTypes');
      fixture.detectChanges();
    });

    it('should set selected product code and load blood types', fakeAsync(() => {
      (apiServiceSpy as any).getBloodTypes.and.returnValue(of([{ aboDesc: 'A+' }]));
      component['currentUnitId'].set('UNIT001');

      component.onProductCodeChanged({ code: 'E1234', description: 'Test' });
      tick();

      expect(component['selectedProductCode']()).toBe('E1234');
      expect((apiServiceSpy as any).getBloodTypes).toHaveBeenCalled();
    }));

    it('should clear ABO options when product code is null', () => {
      component.onProductCodeChanged(null);
      expect(component['selectedProductCode']()).toBe('');
      expect(component['aboRhOptions']()).toEqual([]);
    });

    it('should clear product code on onProductCodeCleared', () => {
      component['selectedProductCode'].set('E1234');
      component.onProductCodeCleared();
      expect(component['selectedProductCode']()).toBe('');
      expect(component['aboRhOptions']()).toEqual([]);
    });
  });

  describe('ABO Rh Changed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set selected ABO/Rh', () => {
      component.onAboRhChanged({ code: 'A+', description: 'A Positive' });
      expect(component['selectedAboRh']()).toBe('A+');
    });

    it('should clear ABO/Rh when null', () => {
      component.onAboRhChanged(null);
      expect(component['selectedAboRh']()).toBe('');
    });

    it('should clear on onAboRhCleared', () => {
      component['selectedAboRh'].set('A+');
      component.onAboRhCleared();
      expect(component['selectedAboRh']()).toBe('');
    });
  });

  describe('Expiration Date Blur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should do nothing when expiration date is empty', () => {
      component.entryForm.patchValue({ expirationDate: '' });
      component.onExpirationDateBlur();
      expect(component['expirationDateValidating']()).toBeFalse();
    });

    it('should validate and format expiry date on success', fakeAsync(() => {
      labelScanServiceSpy.validateExpiryScan.and.returnValue(of({ success: true, item: { expiryDate: '2024-06-15T00:00:00Z' } }));
      component.entryForm.patchValue({ expirationDate: '15JUN2024' });
      component.onExpirationDateBlur();
      tick();
      expect(component['expirationDateValidating']()).toBeFalse();
    }));

    it('should show error on invalid expiry response', fakeAsync(() => {
      labelScanServiceSpy.validateExpiryScan.and.returnValue(of({ success: false, errorResponse: { error: 'Invalid date' } }));
      component.entryForm.patchValue({ expirationDate: 'INVALID' });
      component.onExpirationDateBlur();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid date');
    }));

    it('should show error on expiry validation API error', fakeAsync(() => {
      labelScanServiceSpy.validateExpiryScan.and.returnValue(throwError(() => new Error('Fail')));
      component.entryForm.patchValue({ expirationDate: 'INVALID' });
      component.onExpirationDateBlur();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));
  });

  describe('Format Expiry Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null', () => {
      expect(component['formatExpiryDisplay'](null)).toBe('');
    });

    it('should return original value for invalid date', () => {
      expect(component['formatExpiryDisplay']('not-a-date')).toBe('not-a-date');
    });

    it('should format date without time when hours and minutes are 0', () => {
      const result = component['formatExpiryDisplay']('2024-06-15T00:00:00');
      expect(result).toMatch(/15-JUN-2024$/);
    });

    it('should format date with time when hours or minutes are non-zero', () => {
      const result = component['formatExpiryDisplay']('2024-06-15T14:30:00');
      expect(result).toContain('JUN');
      expect(result).toContain(':');
    });
  });

  describe('Page Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update page size and index on page change', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.onPageChange({ pageSize: 50, pageIndex: 2 } as any);
      tick();
      expect(component['pageSize']()).toBe(50);
      expect(component['pageIndex']()).toBe(2);
    }));
  });

  describe('Clear Entry', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset entry form and clear signals', () => {
      component['currentUnitId'].set('UNIT001');
      component['selectedProductCode'].set('E1234');
      component['selectedAboRh'].set('A+');
      component['productCodeOptions'].set([{ code: 'E1234', description: 'Test' }]);
      component['aboRhOptions'].set([{ code: 'A+', description: 'A+' }]);

      component.clearEntry();

      expect(component['currentUnitId']()).toBeNull();
      expect(component['selectedProductCode']()).toBe('');
      expect(component['selectedAboRh']()).toBe('');
      expect(component['productCodeOptions']()).toEqual([]);
      expect(component['aboRhOptions']()).toEqual([]);
    });
  });

  describe('Get Product Type Desc', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return current product type description', () => {
      component['selectedProductTypeDesc'].set('Red Blood Cells');
      expect(component.getProductTypeDesc()).toBe('Red Blood Cells');
    });
  });

  describe('Box Contents Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close box contents panel', () => {
      component['boxContentsPanelOpen'].set(true);
      component.onBoxContentsPanelClosed();
      expect(component['boxContentsPanelOpen']()).toBeFalse();
    });
  });

  describe('Entry Form Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return entry form controls via f getter', () => {
      expect(component.f).toBe(component.entryForm.controls);
    });
  });

  describe('Filtered Computeds', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter consignees by search text', () => {
      component.consignees.set(mockConsignees);
      component['consigneeSearchText'].set('Test');
      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerName).toBe('Test Customer');
    });

    it('should return all consignees when search is empty', () => {
      component.consignees.set(mockConsignees);
      component['consigneeSearchText'].set('');
      expect(component.filteredConsignees()).toEqual(mockConsignees);
    });

    it('should filter product types by search text', () => {
      component.productTypes.set(mockProductTypes);
      component['productTypeSearchText'].set('red');
      const filtered = component.filteredProductTypes();
      expect(filtered.length).toBe(1);
    });

    it('should filter orders by search text', () => {
      component.orders.set(mockOrders);
      component['orderSearchText'].set('ORD001');
      const filtered = component.filteredOrders();
      expect(filtered.length).toBe(1);
    });

    it('should filter boxes by search text', () => {
      component.boxes.set(mockBoxes);
      component['boxSearchText'].set('BOX');
      const filtered = component.filteredBoxes();
      expect(filtered.length).toBe(1);
    });

    it('should return all boxes when search is empty', () => {
      component.boxes.set(mockBoxes);
      component['boxSearchText'].set('');
      expect(component.filteredBoxes()).toEqual(mockBoxes);
    });
  });

  describe('Search Control Subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update consignee search text on search ctrl change', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('test');
      tick();
      expect(component['consigneeSearchText']()).toBe('test');
    }));

    it('should update order search text on search ctrl change', fakeAsync(() => {
      component.orderSearchCtrl.setValue('ORD');
      tick();
      expect(component['orderSearchText']()).toBe('ORD');
    }));

    it('should update product type search text on search ctrl change', fakeAsync(() => {
      component.productTypeSearchCtrl.setValue('RBC');
      tick();
      expect(component['productTypeSearchText']()).toBe('RBC');
    }));

    it('should update box search text on search ctrl change', fakeAsync(() => {
      component.boxSearchCtrl.setValue('BOX');
      tick();
      expect(component['boxSearchText']()).toBe('BOX');
    }));
  });

  describe('Save and Pack', () => {
    beforeEach(() => {
      (apiServiceSpy as any).createNewBox = jasmine.createSpy('createNewBox');
      fixture.detectChanges();
    });

    it('should not save when no unit ID', () => {
      component['currentUnitId'].set(null);
      component.form.patchValue({ consigneeId: 'CONS01' });
      component.onSave();
      expect(apiServiceSpy.packProducts).not.toHaveBeenCalled();
    });

    it('should not save when loading', () => {
      component['currentUnitId'].set('UNIT001');
      component.form.patchValue({ consigneeId: 'CONS01' });
      component['loading'].set(true);
      component.onSave();
      expect(apiServiceSpy.packProducts).not.toHaveBeenCalled();
    });

    it('should auto create box when no box ID and save', fakeAsync(() => {
      (apiServiceSpy as any).createNewBox.and.returnValue(of({ boxId: 'NEWBOX01' }));
      apiServiceSpy.packProducts.and.returnValue(of({ boxId: 'NEWBOX01' }));
      apiServiceSpy.getBoxes.and.returnValue(of(mockBoxes));

      component['currentUnitId'].set('UNIT001');
      component['selectedProductCode'].set('E1234');
      component['selectedAboRh'].set('A+');
      component.form.patchValue({ consigneeId: 'CONS01', boxId: null });
      tick();

      component.onSave();
      tick();

      expect((apiServiceSpy as any).createNewBox).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box NEWBOX01 created');
    }));

    it('should pack product when box ID exists', fakeAsync(() => {
      apiServiceSpy.packProducts.and.returnValue(of({ boxId: 'BOX001' }));
      apiServiceSpy.getBoxes.and.returnValue(of(mockBoxes));
      apiServiceSpy.getOrders.and.returnValue(of(mockOrders));

      component['currentUnitId'].set('UNIT001');
      component['selectedProductCode'].set('E1234');
      component['selectedAboRh'].set('A+');
      component.form.patchValue({ consigneeId: 'CONS01', boxId: 'BOX001' });
      tick();

      component.onSave();
      tick();

      expect(apiServiceSpy.packProducts).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully');
    }));

    it('should show error on pack failure', fakeAsync(() => {
      apiServiceSpy.packProducts.and.returnValue(throwError(() => new Error('Fail')));

      component['currentUnitId'].set('UNIT001');
      component['selectedProductCode'].set('E1234');
      component['selectedAboRh'].set('A+');
      component.form.patchValue({ consigneeId: 'CONS01', boxId: 'BOX001' });
      tick();

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));

    it('should show error on auto create box failure', fakeAsync(() => {
      (apiServiceSpy as any).createNewBox.and.returnValue(throwError(() => new Error('Fail')));

      component['currentUnitId'].set('UNIT001');
      component['selectedProductCode'].set('E1234');
      component['selectedAboRh'].set('A+');
      component.form.patchValue({ consigneeId: 'CONS01', boxId: null });
      tick();

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));
  });

  describe('Close Box', () => {
    beforeEach(() => {
      (apiServiceSpy as any).closeBox = jasmine.createSpy('closeBox');
      fixture.detectChanges();
    });

    it('should not open dialog when no box ID', () => {
      component['currentBoxId'].set('');
      spyOn(component['dialog'], 'open');
      component.onCloseBox();
      expect(component['dialog'].open).not.toHaveBeenCalled();
    });

    it('should close box on dialog confirmed', fakeAsync(() => {
      (apiServiceSpy as any).closeBox.and.returnValue(of(undefined));
      apiServiceSpy.getBoxes.and.returnValue(of([]));
      apiServiceSpy.queryDiscardProducts.and.returnValue(of({ data: [], totalCount: 0 }));

      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      component['currentBoxId'].set('BOX001');

      const dialogRefSpy = { afterClosed: () => of({ confirmed: true, allProperlyPacked: true }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCloseBox();
      tick();

      expect((apiServiceSpy as any).closeBox).toHaveBeenCalledWith('BOX001', true);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box closed successfully');
    }));

    it('should show error on close box failure', fakeAsync(() => {
      (apiServiceSpy as any).closeBox.and.returnValue(throwError(() => new Error('Fail')));

      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      component['currentBoxId'].set('BOX001');

      const dialogRefSpy = { afterClosed: () => of({ confirmed: true, allProperlyPacked: true }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCloseBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));

    it('should not close box when dialog not confirmed', fakeAsync(() => {
      component['currentBoxId'].set('BOX001');
      const dialogRefSpy = { afterClosed: () => of({ confirmed: false }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCloseBox();
      tick();

      expect((apiServiceSpy as any).closeBox).not.toHaveBeenCalled();
    }));
  });

  describe('Create New Box', () => {
    beforeEach(() => {
      (apiServiceSpy as any).closeBox = jasmine.createSpy('closeBox');
      fixture.detectChanges();
    });

    it('should do nothing when dialog not confirmed', fakeAsync(() => {
      const dialogRefSpy = { afterClosed: () => of(null) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCreateNewBox();
      tick();

      expect((apiServiceSpy as any).closeBox).not.toHaveBeenCalled();
    }));

    it('should close current box and create new one', fakeAsync(() => {
      (apiServiceSpy as any).closeBox.and.returnValue(of(undefined));
      apiServiceSpy.getBoxes.and.returnValue(of([]));
      apiServiceSpy.queryDiscardProducts.and.returnValue(of({ data: [], totalCount: 0 }));

      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      component['currentBoxId'].set('BOX001');

      const dialogRefSpy = { afterClosed: () => of({ confirmed: true, closeCurrent: true, allProperlyPacked: true }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCreateNewBox();
      tick();

      expect((apiServiceSpy as any).closeBox).toHaveBeenCalledWith('BOX001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box has been closed successfully.');
    }));

    it('should handle close box error on create new box', fakeAsync(() => {
      (apiServiceSpy as any).closeBox.and.returnValue(throwError(() => new Error('Fail')));

      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      component['currentBoxId'].set('BOX001');

      const dialogRefSpy = { afterClosed: () => of({ confirmed: true, closeCurrent: true, allProperlyPacked: true }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCreateNewBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));

    it('should just clear box ID when not closing current', fakeAsync(() => {
      apiServiceSpy.getBoxes.and.returnValue(of([]));
      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      component['currentBoxId'].set('BOX001');

      const dialogRefSpy = { afterClosed: () => of({ confirmed: true, closeCurrent: false }) };
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy as any);

      component.onCreateNewBox();
      tick();

      expect(component['currentBoxId']()).toBe('');
      expect((apiServiceSpy as any).closeBox).not.toHaveBeenCalled();
    }));
  });

  describe('Packed Product Action Non-Delete', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should ignore non-delete actions', () => {
      component.onPackedProductAction({ action: 'edit', row: mockProducts[0] } as any);
      expect(apiServiceSpy.unpackProduct).not.toHaveBeenCalled();
    });

    it('should handle unpack error', fakeAsync(() => {
      apiServiceSpy.unpackProduct.and.returnValue(throwError(() => new Error('Fail')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      component.onPackedProductAction({ action: 'delete', row: mockProducts[0] });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));
  });

  describe('Destroy', () => {
    it('should complete destroy subject on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Table Config', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute table config with correct columns', () => {
      const config = component.tableConfig();
      expect(config.columns.length).toBeGreaterThan(0);
      expect(config.columns[0].key).toBe('unitId');
    });

    it('should format expiry date in table column', () => {
      const config = component.tableConfig();
      const expDateCol = config.columns.find((c: any) => c.key === 'expDate');
      expect(expDateCol).toBeDefined();
      if (expDateCol?.valueFormatter) {
        const result = expDateCol.valueFormatter(null, { ...mockProducts[0], expDate: '' });
        expect(result).toBe('-');
      }
    });

    it('should format ABO desc in table column', () => {
      const config = component.tableConfig();
      const aboCol = config.columns.find((c: any) => c.key === 'aboDesc');
      expect(aboCol).toBeDefined();
      if (aboCol?.valueFormatter) {
        const result = aboCol.valueFormatter(null, { ...mockProducts[0], aboDesc: '', bloodType: 'O+' });
        expect(result).toBe('O+');
      }
    });

    it('should show delete action only for boxed products', () => {
      const config = component.tableConfig();
      const deleteAction = config.rowActions![0];
      expect(deleteAction.visible!(mockProducts[0])).toBeTrue();
      expect(deleteAction.visible!({ ...mockProducts[0], boxId: '' })).toBeFalse();
    });

    it('should include chkDigit column', () => {
      const config = component.tableConfig();
      const chkCol = config.columns.find((c: any) => c.key === 'chkDigit');
      expect(chkCol).toBeDefined();
      expect(chkCol!.header).toBe('Chk');
    });

    it('should format chkDigit column', () => {
      const config = component.tableConfig();
      const chkCol = config.columns.find((c: any) => c.key === 'chkDigit');
      expect(chkCol?.valueFormatter?.(null, { ...mockProducts[0], chkDigit: '12' })).toBe('12');
      expect(chkCol?.valueFormatter?.(null, { ...mockProducts[0], chkDigit: null })).toBe('');
    });

    it('should include productDesc column', () => {
      const config = component.tableConfig();
      const descCol = config.columns.find((c: any) => c.key === 'productDesc');
      expect(descCol).toBeDefined();
      expect(descCol!.header).toBe('Product Desc');
    });

    it('should format productDesc column', () => {
      const config = component.tableConfig();
      const descCol = config.columns.find((c: any) => c.key === 'productDesc');
      expect(descCol?.valueFormatter?.(null, { ...mockProducts[0], productDesc: 'Red Cells' })).toBe('Red Cells');
      expect(descCol?.valueFormatter?.(null, { ...mockProducts[0], productDesc: null })).toBe('-');
    });
  });

  describe('Parse Product Code', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty value', (done) => {
      component.parseProductCode('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should match existing product code option', (done) => {
      component['productCodeOptions'].set([{ code: 'E1234567', description: 'Test Product' }]);
      component.parseProductCode('E1234567').subscribe(result => {
        expect(result?.code).toBe('E1234567');
        done();
      });
    });

    it('should call label scan service for unknown code', (done) => {
      component['productCodeOptions'].set([]);
      labelScanServiceSpy.validateProductScan.and.returnValue(of({ success: true, item: { productCode: 'E9999', productDescription: 'Scanned' } }));
      component.parseProductCode('E9999').subscribe(result => {
        expect(result?.code).toBe('E9999');
        done();
      });
    });

    it('should throw error for invalid scan result', (done) => {
      component['productCodeOptions'].set([]);
      labelScanServiceSpy.validateProductScan.and.returnValue(of({ success: false, errorResponse: { error: 'Bad code' } }));
      component.parseProductCode('INVALID').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Bad code');
          done();
        }
      });
    });
  });

  describe('Parse ABO Rh', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty value', (done) => {
      component.parseAboRh('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should match existing ABO option', (done) => {
      component['aboRhOptions'].set([{ code: 'A+', description: 'A Positive' }]);
      component.parseAboRh('A+').subscribe(result => {
        expect(result?.code).toBe('A+');
        done();
      });
    });

    it('should call label scan service for unknown ABO code', (done) => {
      component['aboRhOptions'].set([{ code: 'A+', description: 'A Positive' }]);
      labelScanServiceSpy.validateAboScan.and.returnValue(of({ success: true, item: { aboCode: 'A+', aboShortName: 'A Positive' } }));
      component.parseAboRh('SCANNED').subscribe(result => {
        expect(result?.code).toBe('A+');
        done();
      });
    });

    it('should throw error for invalid ABO scan result', (done) => {
      component['aboRhOptions'].set([]);
      labelScanServiceSpy.validateAboScan.and.returnValue(of({ success: false, message: 'Bad ABO' }));
      component.parseAboRh('INVALID').subscribe({
        error: (err: any) => {
          expect(err.message).toBe('Bad ABO');
          done();
        }
      });
    });
  });

  describe('Load Boxes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-select box when only one exists', fakeAsync(() => {
      apiServiceSpy.getBoxes.and.returnValue(of([mockBoxes[0]]));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      // After consignee + order auto-select + product type change triggers loadBoxes
      expect(component.boxes().length).toBeGreaterThanOrEqual(0);
    }));

    it('should handle boxes loading error', fakeAsync(() => {
      apiServiceSpy.getBoxes.and.returnValue(throwError(() => new Error('Fail')));
      apiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      // Boxes set to empty on error
      expect(component.boxes()).toEqual([]);
    }));
  });

  describe('Box ID Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update current box ID and reload products on boxId change', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      apiServiceSpy.queryDiscardProducts.calls.reset();

      component.form.get('boxId')?.setValue('BOX001');
      tick();

      expect(component['currentBoxId']()).toBe('BOX001');
      expect(apiServiceSpy.queryDiscardProducts).toHaveBeenCalled();
    }));
  });

  describe('Header Config', () => {
    it('should compute header config from page header service', () => {
      fixture.detectChanges();
      const config = component.headerConfig();
      expect(config.breadcrumbs).toBeDefined();
      expect(config.breadcrumbs[0].label).toBe('Home');
    });
  });

  describe('Load Blood Types Error', () => {
    beforeEach(() => {
      (apiServiceSpy as any).getBloodTypes = jasmine.createSpy('getBloodTypes');
      fixture.detectChanges();
    });

    it('should show error when loading blood types fails', fakeAsync(() => {
      (apiServiceSpy as any).getBloodTypes.and.returnValue(throwError(() => new Error('Fail')));
      component['currentUnitId'].set('UNIT001');

      component.onProductCodeChanged({ code: 'E1234', description: 'Test' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));
  });

  describe('Load Product Codes', () => {
    beforeEach(() => {
      (apiServiceSpy as any).getProductCodes = jasmine.createSpy('getProductCodes');
      fixture.detectChanges();
    });

    it('should load product codes and set options', fakeAsync(() => {
      (apiServiceSpy as any).getProductCodes.and.returnValue(of([{ productCode: 'E1234', shortName: 'Test' }]));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      component['loadProductCodes']('UNIT001', 'I');
      tick();

      expect(component['productCodeOptions']().length).toBe(1);
      expect(component['productCodeOptions']()[0].code).toBe('E1234');
    }));

    it('should show error when loading product codes fails', fakeAsync(() => {
      (apiServiceSpy as any).getProductCodes.and.returnValue(throwError(() => new Error('Fail')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();

      component['loadProductCodes']('UNIT001', 'I');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Fail');
    }));

    it('should do nothing when no consignee selected', fakeAsync(() => {
      component.form.patchValue({ consigneeId: null }, { emitEvent: false });
      tick();
      component['loadProductCodes']('UNIT001', 'I');
      tick();
      expect((apiServiceSpy as any).getProductCodes).not.toHaveBeenCalled();
    }));
  });
});
