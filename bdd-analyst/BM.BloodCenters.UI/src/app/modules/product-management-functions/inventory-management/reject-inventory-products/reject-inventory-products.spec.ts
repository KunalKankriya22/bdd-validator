import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { RejectInventoryProducts } from './reject-inventory-products';
import { RejectInventoryProductsService } from './services/reject-inventory-products.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import { provideRouter } from '@angular/router';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('RejectInventoryProducts Component', () => {
  let component: RejectInventoryProducts;
  let fixture: ComponentFixture<RejectInventoryProducts>;
  let mockService: jasmine.SpyObj<RejectInventoryProductsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockPageHeaderService: any;

  const mockRejectionCodes = [
    { code: 'RJ01', codeDesc: 'Damaged Product' },
    { code: 'BROK', codeDesc: 'Broken Bag' },
    { code: 'EXPIRED', codeDesc: 'Product Expired' },
    { code: 'CONTAM', codeDesc: 'Contamination Suspected' }
  ];

  const mockProductCodes = [
    { productCode: 'E0701V00', productDesc: 'FRESH FROZEN PLASMA' },
    { productCode: 'E2807V00', productDesc: 'PLATELETS' },
    { productCode: 'E0100V00', productDesc: 'RED BLOOD CELLS' }
  ];

  const mockScreenValidationResponse = {
    success: true,
    message: null,
    statusCode: 200,
    item: {
      unitId: 'W633325111901',
      collDate: '2026-05-23T00:00:00',
      isValid: true
    }
  };

  const mockSharedUnitData = {
    parsedUnitId: 'W633325111901',
    manualUnitId: 'W633325111901',
    checkDigit: null,
    codeScheme: 'I' as const,
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const
  };

  function createPostValidateEvent(data: UnitValidationResponse = mockSharedUnitData): UnitIdPostValidateEvent {
    return {
      data,
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject')
    };
  }

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RejectInventoryProductsService', [
      'validateUnit',
      'getProductCodes',
      'getRejectionCodes',
      'rejectInventoryProduct'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} })
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Reject Inventory Products',
        subtitle: 'Allows unsuitable inventory products to be rejected for discard.'
      })
    };

    mockService.getRejectionCodes.and.returnValue(of({
      success: true,
      message: 'Success',
      statusCode: 200,
      item: mockRejectionCodes
    }));



      TestBed.configureTestingModule({
      imports: [RejectInventoryProducts,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatSnackBarModule],
      providers: [
        provideRouter([]),
        { provide: RejectInventoryProductsService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    


      mockService.validateUnit.calls.reset();


      mockService.getProductCodes.calls.reset();


      mockService.getRejectionCodes.calls.reset();


      mockService.rejectInventoryProduct.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();


      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


    fixture = TestBed.createComponent(RejectInventoryProducts);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Initialization', () => {


    it('should initialize the form with productCode and rejectionCode controls', () => {
      fixture.detectChanges();
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('productCode')).toBeDefined();
      expect(component.filterForm.get('rejectionCode')).toBeDefined();
    });

    it('should not have unitId in the form (managed by shared component)', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('unitId')).toBeNull();
    });







    it('should have correct page header configuration from PageHeaderService', () => {
      fixture.detectChanges();
      expect(component.pageHeaderConfig.title).toBe('Reject Inventory Products');
      expect(component.pageHeaderConfig.subtitle).toBe('Allows unsuitable inventory products to be rejected for discard.');
      expect(component.pageHeaderConfig.breadcrumbs.length).toBe(2);
      expect(component.pageHeaderConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Reject Inventory Products');
    });

    it('should setup search filters on init', () => {
      fixture.detectChanges();
      expect(component.productCodeSearchControl).toBeDefined();
      expect(component.rejectionCodeSearchControl).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate max length for productCode (8 characters)', () => {
      const control = component.filterForm.get('productCode');
      control?.setValue('123456789'); // 9 chars
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid productCode (8 characters)', () => {
      const control = component.filterForm.get('productCode');
      control?.setValue('E0701V00'); // 8 chars
      expect(control?.valid).toBe(true);
    });
  });

  describe('Unit Post-Validation (postValidate)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call screen-specific validateUnit with parsedUnitId on postValidate', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(of(mockScreenValidationResponse));
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: mockProductCodes
      }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(mockService.validateUnit).toHaveBeenCalledWith({ unitId: 'W633325111901' });
      expect(event.confirm).toHaveBeenCalled();
      expect(event.reject).not.toHaveBeenCalled();
    }));

    it('should store displayUnitId, codeScheme, and parsedUnitId from shared component data', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(of(mockScreenValidationResponse));
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: mockProductCodes
      }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect((component as any).displayUnitId()).toBe('W633325111901');
      expect((component as any).storedCodeScheme()).toBe('I');
      expect((component as any).storedParsedUnitId()).toBe('W633325111901');
    }));

    it('should store collDate from screen-specific validation response', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(of(mockScreenValidationResponse));
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: mockProductCodes
      }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect((component as any).unitCollDate()).toBe('2026-05-23T00:00:00');
    }));

    it('should load product codes after successful screen-specific validation', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(of(mockScreenValidationResponse));
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: mockProductCodes
      }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(mockService.getProductCodes).toHaveBeenCalledWith('W633325111901', '2026-05-23T00:00:00');
      expect((component as any).productCodes().length).toBe(3);
    }));

    it('should reject and reset state when screen-specific validation fails', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(of({
        success: false, message: 'Unit not found', statusCode: 400
      }));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit not found');
      expect(event.confirm).not.toHaveBeenCalled();
      expect((component as any).displayUnitId()).toBe('');
      expect((component as any).storedParsedUnitId()).toBe('');
    }));

    it('should reject and reset state on HTTP error', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(throwError(() => ({
        error: { message: 'Network error' }
      })));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Network error');
      expect(event.confirm).not.toHaveBeenCalled();
    }));

    it('should handle Codabar unit data from shared component', fakeAsync(() => {
      const codabarData = {
        parsedUnitId: 'KJ12345',
        manualUnitId: 'KJ12345',
        checkDigit: null,
        codeScheme: 'C' as const,
        codabarUnitScheme: 'A' as const,
        entryMode: 'M' as const,
        barcodeType: 'CODABAR' as const,
        chapterScheme: 'C' as const
      };

      mockService.validateUnit.and.returnValue(of({
        success: true, message: null, statusCode: 200,
        item: { unitId: 'KJ12345', collDate: '2026-05-20T00:00:00', isValid: true }
      }));
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: mockProductCodes
      }));

      const event = createPostValidateEvent(codabarData);
      component.onUnitPostValidate(event);
      tick();

      expect(mockService.validateUnit).toHaveBeenCalledWith({ unitId: 'KJ12345' });
      expect((component as any).storedCodeScheme()).toBe('C');
      expect(event.confirm).toHaveBeenCalled();
    }));
  });

  describe('Unit Cleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all unit state when cleared', () => {
      (component as any).displayUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23');
      (component as any).productCodes.set(mockProductCodes);
      component.filterForm.patchValue({ productCode: 'E0701V00' });

      component.onUnitCleared();

      expect((component as any).displayUnitId()).toBe('');
      expect((component as any).storedCodeScheme()).toBe('I');
      expect((component as any).storedParsedUnitId()).toBe('');
      expect((component as any).unitCollDate()).toBe('');
      expect((component as any).productCodes().length).toBe(0);
      expect(component.filterForm.get('productCode')?.value).toBe('');
      expect(component.filterForm.get('rejectionCode')?.value).toBe('');
    });
  });

  describe('Product Codes Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle product codes loading error', fakeAsync(() => {
      mockService.getProductCodes.and.returnValue(throwError(() => ({
        error: { message: 'Failed to load products' }
      })));
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23T00:00:00');

      spyOn<any>(component, 'showError').and.callThrough();

      (component as any).loadProductCodesForUnit();
      tick();

      expect((component as any).showError).toHaveBeenCalledWith('Failed to load products');
      expect((component as any).productCodes().length).toBe(0);
    }));






  });

  describe('Product Rejection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject product using parsedUnitId and dynamic codeScheme', fakeAsync(() => {
      const mockResponse = {
        success: true,
        message: 'Product rejected successfully',
        statusCode: 200,
        item: {
          unitId: 'W633325111901',
          productCode: 'E0701V00',
          rejectionCode: 'RJ01',
          rejectionReason: 'Damaged Product',
          aboRh: '17',
          expirationDate: '2026-06-15',
          location: 'DISCARD-BIN'
        }
      };
      mockService.rejectInventoryProduct.and.returnValue(of(mockResponse));

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      (component as any).displayUnitId.set('W633325111901');
      (component as any).rejectionCodes.set([{ code: 'RJ01', description: 'Damaged Product' }]);
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true } as any;
      component.filterForm.patchValue({
        productCode: 'E0701V00',
        rejectionCode: 'RJ01'
      });

      spyOn<any>(component, 'showSuccess').and.callThrough();

      (component as any).rejectProduct();
      tick();

      expect(mockService.rejectInventoryProduct).toHaveBeenCalledWith({
        unitId: 'W633325111901',
        productCode: 'E0701V00',
        rejectCode: 'RJ01',
        codeScheme: 'I'
      });
      expect((component as any).showSuccess).toHaveBeenCalledWith('Product rejected successfully');
      expect((component as any).inventoryData().length).toBe(1);
    }));

    it('should use Codabar codeScheme when unit is Codabar', fakeAsync(() => {
      const mockResponse = {
        success: true, message: 'Success', statusCode: 200,
        item: { unitId: 'KJ12345', productCode: 'E0701V00', rejectionCode: 'RJ01', rejectionReason: 'Damaged Product', aboRh: '17', expirationDate: '2026-06-15', location: 'BIN' }
      };
      mockService.rejectInventoryProduct.and.returnValue(of(mockResponse));

      (component as any).storedParsedUnitId.set('KJ12345');
      (component as any).storedCodeScheme.set('C');
      (component as any).displayUnitId.set('KJ12345');
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      (component as any).rejectProduct();
      tick();

      expect(mockService.rejectInventoryProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({ codeScheme: 'C', unitId: 'KJ12345' })
      );
    }));

    it('should display manualUnitId (displayUnitId) in the grid after rejection', fakeAsync(() => {
      const mockResponse = {
        success: true, message: 'Success', statusCode: 200,
        item: { unitId: 'PARSED123', productCode: 'E0701V00', rejectionCode: 'RJ01', rejectionReason: 'Damaged Product', aboRh: '17', expirationDate: '2026-06-15', location: 'BIN' }
      };
      mockService.rejectInventoryProduct.and.returnValue(of(mockResponse));

      (component as any).storedParsedUnitId.set('PARSED123');
      (component as any).displayUnitId.set('MANUAL_DISPLAY_123');
      (component as any).storedCodeScheme.set('I');
      (component as any).rejectionCodes.set([{ code: 'RJ01', description: 'Damaged' }]);
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      (component as any).rejectProduct();
      tick();

      const data = (component as any).inventoryData();
      expect(data[0].unitId).toBe('MANUAL_DISPLAY_123');
    }));



    it('should reset unit state after successful rejection', fakeAsync(() => {
      const mockResponse = {
        success: true, message: 'Success', statusCode: 200,
        item: { unitId: 'W633325111901', productCode: 'E0701V00', rejectionCode: 'RJ01', rejectionReason: 'Damaged Product', aboRh: '17', expirationDate: '2026-06-15', location: 'BIN' }
      };
      mockService.rejectInventoryProduct.and.returnValue(of(mockResponse));

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      (component as any).displayUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23');
      (component as any).productCodes.set(mockProductCodes);
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      (component as any).rejectProduct();
      tick();

      expect((component as any).storedParsedUnitId()).toBe('');
      expect((component as any).displayUnitId()).toBe('');
      expect((component as any).unitCollDate()).toBe('');
      expect((component as any).productCodes().length).toBe(0);
      expect(component.filterForm.get('productCode')?.value).toBe('');
      expect(component.filterForm.get('rejectionCode')?.value).toBe('');
    }));

    it('should handle rejection error', fakeAsync(() => {
      mockService.rejectInventoryProduct.and.returnValue(throwError(() => ({
        error: { message: 'Rejection failed' }
      })));

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      spyOn<any>(component, 'showError').and.callThrough();

      (component as any).rejectProduct();
      tick();

      expect((component as any).showError).toHaveBeenCalledWith('Rejection failed');
      expect((component as any).inventoryData().length).toBe(0);
    }));


  });

  describe('REJECT Button Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });













    it('should reject product when REJECT button is clicked', fakeAsync(() => {
      const mockResponse = {
        success: true, message: 'Success', statusCode: 200,
        item: { unitId: 'W633325111901', productCode: 'E0701V00', rejectionCode: 'RJ01', rejectionReason: 'Damaged Product', aboRh: '17', expirationDate: '2026-06-15', location: 'BIN' }
      };
      mockService.rejectInventoryProduct.and.returnValue(of(mockResponse));

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      (component as any).displayUnitId.set('W633325111901');
      component.unitIdField = { isValid: true, clear: jasmine.createSpy('clear') } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      component.onRejectClick();
      tick();

      expect(mockService.rejectInventoryProduct).toHaveBeenCalled();
      expect((component as any).inventoryData().length).toBe(1);
    }));


  });

  describe('Dropdown Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).productCodes.set(mockProductCodes);
      (component as any).filteredProductCodes.set(mockProductCodes);
      (component as any).rejectionCodes.set(mockRejectionCodes.map(r => ({ code: r.code, description: r.codeDesc })));
      (component as any).filteredRejectionCodes.set(mockRejectionCodes.map(r => ({ code: r.code, description: r.codeDesc })));
    });







    it('should not reset search when dropdown closes', fakeAsync(() => {
      component.productCodeSearchControl.setValue('test');
      tick(100);

      component.onDropdownOpened(false);
      tick(100);

      expect(component.productCodeSearchControl.value).toBe('test');
    }));
  });

  describe('Computed Display Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).productCodes.set(mockProductCodes);
      (component as any).rejectionCodes.set([
        { code: 'RJ01', description: 'Damaged Product' }
      ]);
    });

    it('should compute product display value with description', () => {
      component.filterForm.patchValue({ productCode: 'E0701V00' });
      fixture.detectChanges();

      const display = (component as any).selectedProductDisplay();
      expect(display).toBe('E0701V00 - FRESH FROZEN PLASMA');
    });

    it('should compute product display value without description', () => {
      (component as any).productCodes.set([{ code: 'TEST', description: '', productCode: 'TEST', productDesc: '' }]);
      component.filterForm.patchValue({ productCode: 'TEST' });
      fixture.detectChanges();

      const display = (component as any).selectedProductDisplay();
      expect(display).toBe('TEST');
    });



    it('should compute rejection display value with description', () => {
      component.filterForm.patchValue({ rejectionCode: 'RJ01' });
      fixture.detectChanges();

      const display = (component as any).selectedRejectionDisplay();
      expect(display).toBe('RJ01 - Damaged Product');
    });


  });

  describe('Text Truncation Detection', () => {
    it('should detect product text truncation', () => {
      const element = document.createElement('span');
      Object.defineProperty(element, 'scrollWidth', { value: 300, configurable: true });
      Object.defineProperty(element, 'clientWidth', { value: 200, configurable: true });

      component.checkProductTruncation(element);

      expect(component.isProductTruncated).toBe(true);
    });

    it('should detect no product truncation', () => {
      const element = document.createElement('span');
      Object.defineProperty(element, 'scrollWidth', { value: 200, configurable: true });
      Object.defineProperty(element, 'clientWidth', { value: 300, configurable: true });

      component.checkProductTruncation(element);

      expect(component.isProductTruncated).toBe(false);
    });

    it('should detect rejection text truncation', () => {
      const element = document.createElement('span');
      Object.defineProperty(element, 'scrollWidth', { value: 250, configurable: true });
      Object.defineProperty(element, 'clientWidth', { value: 150, configurable: true });

      component.checkRejectionTruncation(element);

      expect(component.isRejectionTruncated).toBe(true);
    });

    it('should detect no rejection truncation', () => {
      const element = document.createElement('span');
      Object.defineProperty(element, 'scrollWidth', { value: 150, configurable: true });
      Object.defineProperty(element, 'clientWidth', { value: 200, configurable: true });

      component.checkRejectionTruncation(element);

      expect(component.isRejectionTruncated).toBe(false);
    });
  });
  describe('Rejection Codes Loading Error', () => {
    it('should handle error when loading rejection codes', fakeAsync(() => {
      const freshSnackBarSpy = createMockMatSnackBar();

      const errorService = jasmine.createSpyObj('RejectInventoryProductsService', [
        'validateUnit',
        'getProductCodes',
        'getRejectionCodes',
        'rejectInventoryProduct'
      ]);

      errorService.getRejectionCodes.and.returnValue(throwError(() => ({
        error: { message: 'Failed to load rejection codes' }
      })));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RejectInventoryProducts,
          ReactiveFormsModule,
          HttpClientTestingModule,
          MatSnackBarModule],
        providers: [
        provideRouter([]),
          { provide: RejectInventoryProductsService, useValue: errorService },
          { provide: MatSnackBar, useValue: freshSnackBarSpy },
          { provide: TranslateService, useValue: mockTranslateService },
          { provide: PageHeaderService, useValue: mockPageHeaderService }
        ]
      });

      const newFixture = TestBed.createComponent(RejectInventoryProducts);
      const newComponent = newFixture.componentInstance;

      spyOn<any>(newComponent, 'showError').and.callThrough();

      newFixture.detectChanges();
      tick();

      expect((newComponent as any).showError).toHaveBeenCalledWith('Failed to load rejection codes');
      newFixture.destroy();
    }));
  });

  describe('Date Formatting', () => {
    it('should format expiration date correctly', () => {
      const formatter = component.tableConfig.columns.find(col => col.key === 'expirationDate')?.valueFormatter;
      expect(formatter).toBeDefined();

      if (formatter) {
        const result = formatter('2026-06-15T00:00:00', {} as any);
        expect(result).toContain('JUN');
        expect(result).toContain('15');
        expect(result).toContain('2026');
      }
    });

    it('should handle null expiration date', () => {
      const formatter = component.tableConfig.columns.find(col => col.key === 'expirationDate')?.valueFormatter;

      if (formatter) {
        const result = formatter('', {} as any);
        expect(result).toBe('-');
      }
    });
  });

  describe('isRejectEnabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when unitIdField is not valid', () => {
      component.unitIdField = { isValid: false, clear: jasmine.createSpy('clear'), unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });
      expect(component.isRejectEnabled()).toBe(false);
    });

    it('should return false when productCode is empty', () => {
      component.unitIdField = { isValid: true, clear: jasmine.createSpy('clear'), unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: 'RJ01' });
      expect(component.isRejectEnabled()).toBe(false);
    });

    it('should return false when rejectionCode is empty', () => {
      component.unitIdField = { isValid: true, clear: jasmine.createSpy('clear'), unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: '' });
      expect(component.isRejectEnabled()).toBe(false);
    });

    it('should return false when isRejecting is true', () => {
      component.unitIdField = { isValid: true, clear: jasmine.createSpy('clear'), unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });
      (component as any).isRejecting.set(true);
      expect(component.isRejectEnabled()).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      component.unitIdField = { isValid: true, clear: jasmine.createSpy('clear'), unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });
      (component as any).isRejecting.set(false);
      expect(component.isRejectEnabled()).toBe(true);
    });
  });

  describe('isClearEnabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when all fields are empty', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: false, unitIdControl: { value: '' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: '' });
      expect(component.isClearEnabled()).toBe(false);
    });

    it('should return true when unit has value', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true, unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: '' });
      expect(component.isClearEnabled()).toBe(true);
    });

    it('should return true when productCode has value', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: false, unitIdControl: { value: '' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: '' });
      expect(component.isClearEnabled()).toBe(true);
    });

    it('should return true when rejectionCode has value', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: false, unitIdControl: { value: '' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: 'RJ01' });
      expect(component.isClearEnabled()).toBe(true);
    });
  });

  describe('onClearClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should do nothing when isClearEnabled returns false', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: false, unitIdControl: { value: '' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: '' });

      component.onClearClick();

      expect(component.unitIdField.clear).not.toHaveBeenCalled();
    });

    it('should call unitIdField.clear when enabled', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true, unitIdControl: { value: 'W633325111901' } } as any;
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      component.onClearClick();

      expect(component.unitIdField.clear).toHaveBeenCalled();
    });

    it('should reset all form values and signals', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true, unitIdControl: { value: 'W633325111901' } } as any;
      (component as any).displayUnitId.set('W633325111901');
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      (component as any).unitCollDate.set('2026-05-23');
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      component.onClearClick();

      expect((component as any).displayUnitId()).toBe('');
      expect((component as any).storedParsedUnitId()).toBe('');
      expect((component as any).unitCollDate()).toBe('');
      expect(component.filterForm.get('productCode')?.value).toBe('');
      expect(component.filterForm.get('rejectionCode')?.value).toBe('');
    });
  });

  describe('onRejectClick guard', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call rejectProduct when isRejectEnabled returns false', () => {
      spyOn<any>(component, 'rejectProduct');
      component.unitIdField = { isValid: false, clear: jasmine.createSpy('clear'), unitIdControl: { value: '' } } as any;
      component.filterForm.patchValue({ productCode: '', rejectionCode: '' });

      component.onRejectClick();

      expect((component as any).rejectProduct).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call destroy$.next and destroy$.complete', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onDropdownOpened', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all search controls when dropdown opens (true case)', () => {
      component.productCodeSearchControl.setValue('test');
      component.rejectionCodeSearchControl.setValue('search');

      component.onDropdownOpened(true);

      expect(component.productCodeSearchControl.value).toBe('');
      expect(component.rejectionCodeSearchControl.value).toBe('');
    });
  });

  describe('Product Code Search Filtering', () => {
    it('should filter product codes by search term (code match)', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      (component as any).productCodes.set(mockProductCodes);

      component.productCodeSearchControl.setValue('E0701');
      tick(100);

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('E0701V00');
    }));

    it('should filter product codes case-insensitively by description', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      (component as any).productCodes.set(mockProductCodes);

      component.productCodeSearchControl.setValue('platelets');
      tick(100);

      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productDesc).toBe('PLATELETS');
    }));
  });

  describe('Rejection Code Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).rejectionCodes.set(mockRejectionCodes.map(r => ({ code: r.code, description: r.codeDesc })));
    });

    it('should filter rejection codes by search term', fakeAsync(() => {
      component.rejectionCodeSearchControl.setValue('BROK');
      tick(100);

      const filtered = (component as any).filteredRejectionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('BROK');
    }));

    it('should match rejection codes case-insensitively', fakeAsync(() => {
      component.rejectionCodeSearchControl.setValue('damaged');
      tick(100);

      const filtered = (component as any).filteredRejectionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RJ01');
    }));
  });

  describe('loadLookupData success', () => {
    it('should populate rejectionCodes and filteredRejectionCodes on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const codes = (component as any).rejectionCodes();
      expect(codes.length).toBe(4);
      expect(codes[0].code).toBe('RJ01');
      expect(codes[0].description).toBe('Damaged Product');

      const filtered = (component as any).filteredRejectionCodes();
      expect(filtered.length).toBe(4);
    }));
  });

  describe('loadProductCodesForUnit edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when product codes list is empty', fakeAsync(() => {
      mockService.getProductCodes.and.returnValue(of({
        success: true, message: 'Success', statusCode: 200, item: []
      }));
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23T00:00:00');

      spyOn<any>(component, 'showError').and.callThrough();

      (component as any).loadProductCodesForUnit();
      tick();

      expect((component as any).showError).toHaveBeenCalledWith('No available products for this unit');
    }));

    it('should return early with console.warn when parsedUnitId is missing', () => {
      spyOn(console, 'warn');
      (component as any).storedParsedUnitId.set('');
      (component as any).unitCollDate.set('2026-05-23');

      (component as any).loadProductCodesForUnit();

      expect(console.warn).toHaveBeenCalled();
      expect(mockService.getProductCodes).not.toHaveBeenCalled();
    });
  });

  describe('mapToRejectedInventoryItem edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should fallback to item.unitId when displayUnitId is empty', () => {
      (component as any).displayUnitId.set('');
      (component as any).rejectionCodes.set([]);

      const item = { unitId: 'ITEM_UNIT_123', productCode: 'E0701V00', rejectCode: 'RJ01', aboRh: '', expirationDate: '', location: 'BIN' };
      const result = (component as any).mapToRejectedInventoryItem(item);

      expect(result.unitId).toBe('ITEM_UNIT_123');
    });

    it('should return empty string for rejectionReason when no matching code found', () => {
      (component as any).displayUnitId.set('TEST');
      (component as any).rejectionCodes.set([{ code: 'OTHER', description: 'Other Code' }]);

      const item = { unitId: 'TEST', productCode: 'E0701V00', rejectCode: 'NOMATCH', aboRh: '', expirationDate: '', location: 'BIN' };
      const result = (component as any).mapToRejectedInventoryItem(item);

      expect(result.rejectionReason).toBe('');
    });

    it('should map rejectCode field as rejectionCode', () => {
      (component as any).displayUnitId.set('TEST');
      (component as any).rejectionCodes.set([]);

      const item = { unitId: 'TEST', productCode: 'E0701V00', rejectCode: 'RJ01', aboRh: '', expirationDate: '', location: 'BIN' };
      const result = (component as any).mapToRejectedInventoryItem(item);

      expect(result.rejectionCode).toBe('RJ01');
    });
  });

  describe('rejectProduct with unsuccessful response', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when response.success is false', fakeAsync(() => {
      mockService.rejectInventoryProduct.and.returnValue(of({
        success: false, message: 'Product already rejected', statusCode: 400
      }));

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      spyOn<any>(component, 'showError').and.callThrough();

      (component as any).rejectProduct();
      tick();

      expect((component as any).showError).toHaveBeenCalledWith('Product already rejected');
      expect((component as any).inventoryData().length).toBe(0);
    }));
  });

  describe('Snackbar Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open error snackbar with correct config (5000ms, end, top, error-snackbar)', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');

      (component as any).showError('Test error message');

      expect(openSpy).toHaveBeenCalledWith('Test error message', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    });

    it('should open success snackbar with correct config (3000ms, end, top, success-snackbar)', () => {
      const openSpy = spyOn((component as any).snackBar, 'open');

      (component as any).showSuccess('Test success message');

      expect(openSpy).toHaveBeenCalledWith('Test success message', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    });
  });

  describe('isRejecting signal state', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be true during rejection and false after', () => {
      const responseSubject = new Subject<any>();
      mockService.rejectInventoryProduct.and.returnValue(responseSubject.asObservable());

      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).storedCodeScheme.set('I');
      component.filterForm.patchValue({ productCode: 'E0701V00', rejectionCode: 'RJ01' });

      (component as any).rejectProduct();

      expect((component as any).isRejecting()).toBe(true);

      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true, unitIdControl: { value: 'W633325111901' } } as any;
      responseSubject.next({
        success: true, message: 'Success', statusCode: 200,
        item: { unitId: 'W633325111901', productCode: 'E0701V00', rejectionCode: 'RJ01', rejectionReason: 'Damaged', aboRh: '17', expirationDate: '2026-06-15', location: 'BIN' }
      });
      responseSubject.complete();

      expect((component as any).isRejecting()).toBe(false);
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for isEmpty when inventoryData is empty and not loading', () => {
      (component as any).inventoryData.set([]);
      (component as any).loading.set(false);

      expect((component as any).isEmpty()).toBe(true);
    });

    it('should return true for isReady when not loading and no error', () => {
      (component as any).loading.set(false);
      (component as any).error.set(null);

      expect((component as any).isReady()).toBe(true);
    });
  });

  describe('selectedRejectionDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return just the code when no description available', () => {
      (component as any).rejectionCodes.set([{ code: 'RJ01', description: '' }]);
      component.filterForm.patchValue({ rejectionCode: 'RJ01' });
      fixture.detectChanges();

      const display = (component as any).selectedRejectionDisplay();
      expect(display).toBe('RJ01');
    });
  });

  describe('Product Code Scan Detection - Gap 3', () => {
    it('should auto-select product code when exact 8-char match found in search', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23');
      (component as any).storedCodeScheme.set('I');
      (component as any).productCodes.set([
        { code: 'E0701V00', productCode: 'E0701V00', description: 'FRESH FROZEN PLASMA', productDesc: 'FRESH FROZEN PLASMA' }
      ]);

      component.productCodeSearchControl.setValue('E0701V00');
      tick(100);

      expect(component.filterForm.get('productCode')?.value).toBe('E0701V00');
      expect(component.productCodeSearchControl.value).toBe('');
    }));

    it('should auto-select product code when exact 5-char match found in search', fakeAsync(() => {
      fixture.detectChanges();
      tick(100);
      (component as any).storedParsedUnitId.set('W633325111901');
      (component as any).unitCollDate.set('2026-05-23');
      (component as any).storedCodeScheme.set('C');
      (component as any).productCodes.set([
        { code: 'AB123', productCode: 'AB123', description: 'TEST PRODUCT', productDesc: 'TEST PRODUCT' }
      ]);

      component.productCodeSearchControl.setValue('AB123');
      tick(100);

      expect(component.filterForm.get('productCode')?.value).toBe('AB123');
      expect(component.productCodeSearchControl.value).toBe('');
    }));
  });

  describe('Expiration Date Format - Gap 4', () => {
    it('should format expiration date with time (DD-MMM-YYYY HH:mm)', () => {
      const formatter = component.tableConfig.columns.find(col => col.key === 'expirationDate')?.valueFormatter;
      expect(formatter).toBeDefined();

      if (formatter) {
        const result = formatter('2026-06-15T14:30:00', {} as any);
        expect(result).toBe('15-JUN-2026 14:30');
      }
    });
  });

});
