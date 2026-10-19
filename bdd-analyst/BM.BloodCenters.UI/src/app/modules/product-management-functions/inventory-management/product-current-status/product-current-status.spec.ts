import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { ProductCurrentStatusComponent } from './product-current-status';
import { ProductCurrentStatusService } from './product-current-status.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { provideRouter } from '@angular/router';
import {
  ProductCurrentStatusSummaryDto,
  ActiveProductDto,
  ShippedProductDto,
  DiscardedProductDto,
  UnitAntigenDto,
  UnitAttributeDto,
  ProductCodeLovDto,
} from './product-current-status.model';

describe('ProductCurrentStatusComponent', () => {
  let component: ProductCurrentStatusComponent;
  let fixture: ComponentFixture<ProductCurrentStatusComponent>;
  let productStatusServiceSpy: jasmine.SpyObj<ProductCurrentStatusService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockActiveProduct: ActiveProductDto = {
    unitId: 'W1234-18-031401-R',
    productCode: 'ED701V00',
    aliquot: '01',
    bloodType: 'O Positive',
    stockState: 'Available',
    locationId: 'HC1012000055',
    expirationDate: '2025-01-11T13:16:00Z',
    noteId: 123456,
    insertDate: '2025-01-11T13:16:00Z',
  };

  const mockShippedProduct: ShippedProductDto = {
    unitId: 'W1234-18-031401-R',
    productCode: 'ED701V00',
    aliquot: '01',
    bloodType: 'O Positive',
    shippedTo: 'Parkland Hospital',
    shippedDate: '2025-01-11T13:16:00Z',
    stockState: 'Delivered',
    insertDate: '2025-01-11T13:16:00Z',
  };

  const mockDiscardedProduct: DiscardedProductDto = {
    unitId: 'W1234-18-031401-R',
    productCode: 'ED701V00',
    aliquot: '01',
    bloodType: 'O Positive',
    discardDate: '2025-01-15T10:00:00Z',
    rejectReason: 'Expired',
  };

  const mockUnitAntigens: UnitAntigenDto[] = [
    {
      unitId: 'W1234-18-031401-R',
      testId: 'Fya Negative',
      testResult: 'C Positive',
      resultDate: '2025-01-11T00:00:00Z',
      confirmFlag: 'Y',
    },
    {
      unitId: 'W1234-18-031401-R',
      testId: 'K Molecule',
      testResult: 'E Negative',
      resultDate: '2025-01-11T00:00:00Z',
      confirmFlag: 'N',
    },
    {
      unitId: 'W1234-18-031401-R',
      testId: 'M Negative',
      testResult: 'Fya Negative',
      confirmFlag: undefined,
    },
  ];

  const mockUnitAttributes: UnitAttributeDto[] = [
    { attribGroup: 'HLA', attribCode: 'A2' },
    { attribGroup: 'CMV', attribCode: 'NEG' },
  ];

  const mockProductCodes: ProductCodeLovDto[] = [
    { productCode: 'ED701V00', productShortName: 'Whole Blood' },
    { productCode: 'ED702V00', productShortName: 'Red Cells' },
  ];

  const mockSummaryActive: ProductCurrentStatusSummaryDto = {
    unitId: 'W1234-18-031401-R',
    activeProducts: [mockActiveProduct],
    shippedProducts: [],
    discardedProducts: [],
    unitAntigens: mockUnitAntigens,
    unitAttributes: mockUnitAttributes,
  };

  const mockSummaryShipped: ProductCurrentStatusSummaryDto = {
    unitId: 'W1234-18-031401-R',
    activeProducts: [],
    shippedProducts: [mockShippedProduct],
    discardedProducts: [],
    unitAntigens: mockUnitAntigens,
    unitAttributes: mockUnitAttributes,
  };

  const mockSummaryDiscarded: ProductCurrentStatusSummaryDto = {
    unitId: 'W1234-18-031401-R',
    activeProducts: [],
    shippedProducts: [],
    discardedProducts: [mockDiscardedProduct],
    unitAntigens: [],
    unitAttributes: [],
  };

  const mockSummaryEmpty: ProductCurrentStatusSummaryDto = {
    unitId: 'W1234-18-031401-R',
    activeProducts: [],
    shippedProducts: [],
    discardedProducts: [],
    unitAntigens: [],
    unitAttributes: [],
  };

  beforeEach(() => {

    productStatusServiceSpy = jasmine.createSpyObj('ProductCurrentStatusService', ['getSummary', 'getProductCodeLov']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Product Current Status',
        subtitle: 'Review information about a specific product',
      }),
    });

    productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryActive));



      TestBed.configureTestingModule({
      imports: [ProductCurrentStatusComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ProductCurrentStatusService, useValue: productStatusServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });


    


      productStatusServiceSpy.getSummary.calls.reset();


      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryActive));


    fixture = TestBed.createComponent(ProductCurrentStatusComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {






    it('should generate unique component ID', () => {
      expect((component as any).componentId).toMatch(/^product-current-status-\d+$/);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require product code', () => {
      const productCodeControl = component.searchForm.get('productCode');
      expect(productCodeControl?.valid).toBeFalse();

      productCodeControl?.setValue('RBC');
      expect(productCodeControl?.valid).toBeTrue();
    });

    it('should accept valid product code selection', () => {
      const productCodeControl = component.searchForm.get('productCode');
      productCodeControl?.setValue('ED701V00');

      expect(productCodeControl?.valid).toBeTrue();
    });


  });

  describe('Retrieve Product Status', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear'], {
        isValid: true,
        parsedUnitId: 'W1234-18-031401-R',
      });
      component.parsedUnitId.set('W1234-18-031401-R');
      component.unitValidated.set(true);
      component.searchForm.get('productCode')?.setValue('ED701V00');
    });

    it('should call service with correct parameters on retrieve', () => {
      component.onRetrieve();

      expect(productStatusServiceSpy.getSummary).toHaveBeenCalledWith({
        unitId: 'W1234-18-031401-R',
        productCode: 'ED701V00',
        codeScheme: 'I',
      });
    });



    it('should display active product details', fakeAsync(() => {
      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryActive));

      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.summaryData()).toEqual(mockSummaryActive);
      expect(component.hasResults()).toBeTrue();
      expect(component.isShipped()).toBeFalse();

      const panelHeader = fixture.debugElement.query(By.css('.panel-header'));
      expect(panelHeader.nativeElement.textContent).toContain('Product Details - Not Shipped');
    }));

    it('should display shipped product details', fakeAsync(() => {
      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryShipped));

      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.summaryData()).toEqual(mockSummaryShipped);
      expect(component.hasResults()).toBeTrue();
      expect(component.isShipped()).toBeTrue();

      const panelHeader = fixture.debugElement.query(By.css('.panel-header'));
      expect(panelHeader.nativeElement.textContent).toContain('Product Details - Shipped');
    }));

    it('should display discarded product details', fakeAsync(() => {
      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryDiscarded));

      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.summaryData()).toEqual(mockSummaryDiscarded);
      expect(component.hasResults()).toBeTrue();
      expect(component.isDiscarded()).toBeTrue();

      const panelHeader = fixture.debugElement.query(By.css('.panel-header'));
      expect(panelHeader.nativeElement.textContent).toContain('Product Details - Discarded');
    }));



    it('should handle API errors gracefully', fakeAsync(() => {
      const errorResponse = {
        error: { message: 'Invalid Unit ID' },
      };
      productStatusServiceSpy.getSummary.and.returnValue(throwError(() => errorResponse));
      spyOn(component as any, 'showError');

      component.onRetrieve();
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.error()).toBe('Invalid Unit ID');
      expect((component as any).showError).toHaveBeenCalledWith('Invalid Unit ID');
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear'], {
        isValid: true,
        parsedUnitId: 'W1234-18-031401-R',
      });
    });

    it('should clear all form fields and results', () => {
      component.searchForm.get('productCode')?.setValue('RBC');
      component.summaryData.set(mockSummaryActive);

      component.onClearAll();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.searchForm.get('productCode')?.value).toBe('');
      expect(component.summaryData()).toBeNull();
    });

    it('should clear results when unit ID is cleared', () => {
      component.summaryData.set(mockSummaryActive);

      component.onUnitCleared();

      expect(component.summaryData()).toBeNull();
      expect(component.error()).toBeNull();
    });
  });

  describe('Antigens Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitIdField = jasmine.createSpyObj('UnitIdFieldComponent', ['clear'], {
        isValid: true,
        parsedUnitId: 'W1234-18-031401-R',
      });
      component.parsedUnitId.set('W1234-18-031401-R');
      component.unitValidated.set(true);
      component.searchForm.get('productCode')?.setValue('ED701V00');
    });

    it('should display antigens table when data is available', fakeAsync(() => {
      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryActive));

      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.unitAntigens().length).toBe(3);

      const dataTable = fixture.debugElement.query(By.css('app-data-table'));
      expect(dataTable).toBeTruthy();
    }));




  });
  describe('Empty State', () => {
    it('should display empty state when no results', () => {
      component.loading.set(false);
      component.summaryData.set(null);
      component.error.set(null);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No Results to Display');
    });
  });

  describe('Error State', () => {
    it('should display error message', () => {
      component.error.set('Test error message');
      component.loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error message');
    });


  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should mark product code as invalid when empty and touched', () => {
      const productCodeControl = component.searchForm.get('productCode');
      productCodeControl?.markAsTouched();
      fixture.detectChanges();

      expect(productCodeControl?.invalid).toBeTrue();
      expect(productCodeControl?.hasError('required')).toBeTrue();
    });


  });
  describe('Date Formatting', () => {


    it('should format date and time as DD-MMM-YYYY HH:MM', () => {
      const formatted = component.formatDateTime('2025-01-11T13:16:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2}$/);
    });

    it('should return "-" for null or undefined dates', () => {
      expect(component.formatDate(null)).toBe('-');
      expect(component.formatDate(undefined)).toBe('-');
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should handle invalid date strings gracefully', () => {
      const invalidDate = 'not-a-date';
      expect(component.formatDate(invalidDate)).toBe(invalidDate);
    });
  });

  describe('Helper Methods', () => {




    it('should get active product safely', () => {
      component.summaryData.set(mockSummaryActive);
      expect(component.getActiveProduct()).toEqual(mockActiveProduct);

      component.summaryData.set(mockSummaryShipped);
      expect(component.getActiveProduct()).toBeNull();
    });

    it('should get shipped product safely', () => {
      component.summaryData.set(mockSummaryShipped);
      expect(component.getShippedProduct()).toEqual(mockShippedProduct);

      component.summaryData.set(mockSummaryActive);
      expect(component.getShippedProduct()).toBeNull();
    });

    it('should get discarded product safely', () => {
      component.summaryData.set(mockSummaryDiscarded);
      expect(component.getDiscardedProduct()).toEqual(mockDiscardedProduct);

      component.summaryData.set(mockSummaryActive);
      expect(component.getDiscardedProduct()).toBeNull();
    });

    it('should return null for all getters when summaryData is null', () => {
      component.summaryData.set(null);
      expect(component.getActiveProduct()).toBeNull();
      expect(component.getShippedProduct()).toBeNull();
      expect(component.getDiscardedProduct()).toBeNull();
    });
  });

  describe('ID Helper Functions', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('unit-id');
      expect(id).toMatch(/^product-current-status-\d+-unit-id$/);
    });

    it('should generate error IDs with component prefix', () => {
      const id = (component as any).errorId('product-code');
      expect(id).toMatch(/^product-current-status-\d+-product-code-error$/);
    });

    it('should generate label IDs with component prefix', () => {
      const id = (component as any).labelId('product-code');
      expect(id).toMatch(/^product-current-status-\d+-product-code-label$/);
    });
  });

  describe('Computed Signals', () => {
    it('currentProduct should return shipped product when no active products', () => {
      component.summaryData.set(mockSummaryShipped);
      expect(component.currentProduct()).toEqual(mockShippedProduct);
    });

    it('currentProduct should return null when no products', () => {
      component.summaryData.set(mockSummaryEmpty);
      expect(component.currentProduct()).toBeNull();
    });

    it('currentProduct should return null when summaryData is null', () => {
      component.summaryData.set(null);
      expect(component.currentProduct()).toBeNull();
    });

    it('selectedProductDisplay should return empty string when no value', () => {
      component.selectedProductCode.set('');
      expect(component.selectedProductDisplay()).toBe('');
    });

    it('selectedProductDisplay should return raw code when product not found in list', () => {
      component.selectedProductCode.set('UNKNOWN');
      component.productCodes.set(mockProductCodes);
      expect(component.selectedProductDisplay()).toBe('UNKNOWN');
    });

    it('selectedProductDisplay should return code + short name when found', () => {
      component.selectedProductCode.set('ED701V00');
      component.productCodes.set(mockProductCodes);
      expect(component.selectedProductDisplay()).toBe('ED701V00 - Whole Blood');
    });

    it('selectedProductDisplay should return code only when no short name', () => {
      component.selectedProductCode.set('ED703V00');
      component.productCodes.set([{ productCode: 'ED703V00' }]);
      expect(component.selectedProductDisplay()).toBe('ED703V00');
    });

    it('hasResults should return false when summaryData is null', () => {
      component.summaryData.set(null);
      expect(component.hasResults()).toBeFalse();
    });

    it('isShipped should return false when summaryData is null', () => {
      component.summaryData.set(null);
      expect(component.isShipped()).toBeFalse();
    });

    it('isDiscarded should return false when summaryData is null', () => {
      component.summaryData.set(null);
      expect(component.isDiscarded()).toBeFalse();
    });
  });

  describe('Merged Table Rows', () => {
    it('should zip attributes and antigens with max-length', () => {
      component.summaryData.set(mockSummaryActive);
      const rows = component.mergedTableRows();

      expect(rows.length).toBe(3);
      expect(rows[0].attribute).toBe('HLA - A2');
      expect(rows[0].antigen).toBe('Fya Negative - C Positive');
      expect(rows[0].agConfirmed).toBe('Yes');

      expect(rows[1].attribute).toBe('CMV - NEG');
      expect(rows[1].antigen).toBe('K Molecule - E Negative');
      expect(rows[1].agConfirmed).toBe('No');

      // 3rd row: no attribute (only 2), antigen exists with no confirmFlag
      expect(rows[2].attribute).toBe('-');
      expect(rows[2].antigen).toBe('M Negative - Fya Negative');
      expect(rows[2].agConfirmed).toBe('-');
    });

    it('should show dashes when no attributes and no antigens', () => {
      component.summaryData.set(mockSummaryEmpty);
      const rows = component.mergedTableRows();
      expect(rows.length).toBe(0);
    });

    it('should show only attributes when no antigens', () => {
      component.summaryData.set({
        ...mockSummaryEmpty,
        unitAttributes: mockUnitAttributes,
      });
      const rows = component.mergedTableRows();
      expect(rows.length).toBe(2);
      expect(rows[0].attribute).toBe('HLA - A2');
      expect(rows[0].antigen).toBe('-');
      expect(rows[0].agConfirmed).toBe('-');
    });

    it('should show only antigens when no attributes', () => {
      component.summaryData.set({
        ...mockSummaryEmpty,
        unitAntigens: mockUnitAntigens,
      });
      const rows = component.mergedTableRows();
      expect(rows.length).toBe(3);
      expect(rows[0].attribute).toBe('-');
      expect(rows[0].antigen).toBe('Fya Negative - C Positive');
    });
  });

  describe('Unit Post Validate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load product codes on post validate success', fakeAsync(() => {
      productStatusServiceSpy.getProductCodeLov.and.returnValue(of(mockProductCodes));
      const event = {
        data: { parsedUnitId: 'W1234-18-031401-R', codeScheme: 'I' as const },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.confirm).toHaveBeenCalled();
      expect(component.unitValidated()).toBeTrue();
      expect(component.productCodes().length).toBe(2);
    }));

    it('should reject when no product codes found', fakeAsync(() => {
      productStatusServiceSpy.getProductCodeLov.and.returnValue(of([]));
      const event = {
        data: { parsedUnitId: 'W1234-18-031401-R', codeScheme: 'I' as const },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('No products found for this Unit ID.');
      expect(event.confirm).not.toHaveBeenCalled();
    }));

    it('should auto-select when only one product code', fakeAsync(() => {
      productStatusServiceSpy.getProductCodeLov.and.returnValue(of([mockProductCodes[0]]));
      const event = {
        data: { parsedUnitId: 'W1234-18-031401-R', codeScheme: 'I' as const },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(component.searchForm.get('productCode')?.value).toBe('ED701V00');
    }));

    it('should reject on API error', fakeAsync(() => {
      productStatusServiceSpy.getProductCodeLov.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      const event = {
        data: { parsedUnitId: 'W1234-18-031401-R', codeScheme: 'I' as const },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Server error');
      expect(component.isLoadingProductCodes()).toBeFalse();
    }));

    it('should use fallback error message when no message in error', fakeAsync(() => {
      productStatusServiceSpy.getProductCodeLov.and.returnValue(
        throwError(() => ({}))
      );
      const event = {
        data: { parsedUnitId: 'W1234-18-031401-R', codeScheme: 'I' as const },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Failed to load product codes.');
    }));
  });

  describe('Retrieve Validation Guards', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(component as any, 'showError');
    });

    it('should show error when unitId is missing', () => {
      component.parsedUnitId.set(null);
      component.searchForm.get('productCode')?.setValue('ED701V00');

      component.onRetrieve();

      expect((component as any).showError).toHaveBeenCalledWith('Unit ID and Product Code are required.');
      expect(productStatusServiceSpy.getSummary).not.toHaveBeenCalled();
    });

    it('should show error when productCode is missing', () => {
      component.parsedUnitId.set('W1234-18-031401-R');
      component.searchForm.get('productCode')?.setValue('');

      component.onRetrieve();

      expect((component as any).showError).toHaveBeenCalledWith('Unit ID and Product Code are required.');
    });

    it('should show info when results are empty', fakeAsync(() => {
      component.parsedUnitId.set('W1234-18-031401-R');
      component.unitValidated.set(true);
      component.searchForm.get('productCode')?.setValue('ED701V00');
      productStatusServiceSpy.getSummary.and.returnValue(of(mockSummaryEmpty));
      spyOn(component as any, 'showInfo');

      component.onRetrieve();
      tick();

      expect((component as any).showInfo).toHaveBeenCalledWith('No products found for the specified criteria.');
    }));

    it('should use fallback error message on retrieve failure', fakeAsync(() => {
      component.parsedUnitId.set('W1234-18-031401-R');
      component.unitValidated.set(true);
      component.searchForm.get('productCode')?.setValue('ED701V00');
      productStatusServiceSpy.getSummary.and.returnValue(throwError(() => ({ message: 'Network error' })));

      component.onRetrieve();
      tick();

      expect(component.error()).toBe('Network error');
    }));

    it('should use default message when error has no message', fakeAsync(() => {
      component.parsedUnitId.set('W1234-18-031401-R');
      component.unitValidated.set(true);
      component.searchForm.get('productCode')?.setValue('ED701V00');
      productStatusServiceSpy.getSummary.and.returnValue(throwError(() => ({})));

      component.onRetrieve();
      tick();

      expect(component.error()).toBe('Failed to retrieve product status.');
    }));
  });

  describe('Product Code Filter', () => {
    it('should filter product codes by search text', () => {
      component.productCodes.set(mockProductCodes);
      const filtered = (component as any).filterProductCodes('whole');
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('ED701V00');
    });

    it('should return all when search is null', () => {
      component.productCodes.set(mockProductCodes);
      const filtered = (component as any).filterProductCodes(null);
      expect(filtered.length).toBe(2);
    });

    it('should filter by product code string', () => {
      component.productCodes.set(mockProductCodes);
      const filtered = (component as any).filterProductCodes('702');
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('ED702V00');
    });
  });

  describe('Display Helpers', () => {
    it('should return dash for null/undefined values', () => {
      expect(component.displayValue(null)).toBe('-');
      expect(component.displayValue(undefined)).toBe('-');
    });

    it('should return value as-is when defined', () => {
      expect(component.displayValue('Available')).toBe('Available');
      expect(component.displayValue(0)).toBe(0);
    });

    it('should format valid date correctly', () => {
      const formatted = component.formatDate('2025-01-11T13:16:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should format valid datetime correctly', () => {
      const formatted = component.formatDateTime('2025-06-15T09:30:00Z');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2}$/);
    });

    it('should return original string for invalid datetime', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('onUnitValidated', () => {
    it('should be callable without error', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });
});
