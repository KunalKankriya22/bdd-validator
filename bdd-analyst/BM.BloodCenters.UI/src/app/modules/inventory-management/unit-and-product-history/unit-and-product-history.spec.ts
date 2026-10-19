import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UnitAndProductHistory } from './unit-and-product-history';
import { UnitProductHistoryService } from './services/unit-product-history.service';
import { ProductHistoryDialog } from './dialogs/product-history-dialog';
import {
  UnitValidationDto,
  UnitProductDto,
  ProductHistoryDialogData,
  ProductHistoryDto,
} from './models/unit-product-history.model';
import {
  UnitValidationResponse,
  UnitIdPostValidateEvent,
} from '@shared/components/unit-id-field';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

@Component({
  selector: 'app-unit-id-field',
  standalone: true,
  template: '<div></div>',
})
class MockUnitIdFieldComponent {
  @Input() id = '';
  @Input() required = false;
  @Input() label = 'Unit ID';
  @Input() validateFfValue = 'N';
  @Output() postValidate = new EventEmitter<UnitIdPostValidateEvent>();
  @Output() validated = new EventEmitter<UnitValidationResponse>();
  @Output() cleared = new EventEmitter<void>();

  clear = jasmine.createSpy('clear');
  focus = jasmine.createSpy('focus');
}

@Component({
  selector: 'app-page-header-with-breadcrumb',
  standalone: true,
  template: '<div></div>',
})
class MockPageHeaderComponent {
  @Input() config: any;
}

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: '<div></div>',
})
class MockLoadingSpinnerComponent {
  @Input() size = 'medium';
  @Input() message = '';
  @Input() color = '';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: '<div></div>',
})
class MockDataTableComponent {
  @Input() config: any;
  @Input() data: any;
  @Input() loading: any;
  @Output() rowAction = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<any>();
}

describe('UnitAndProductHistory', () => {
  let pageHeaderServiceSpy: any;
  let component: UnitAndProductHistory;
  let fixture: ComponentFixture<UnitAndProductHistory>;
  let historyServiceSpy: jasmine.SpyObj<UnitProductHistoryService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockValidationData: UnitValidationDto = {
    unitId: '12345678901',
    collectionDate: '2024-01-15',
    source: 'COMPONENTS',
  };

  const mockProducts: UnitProductDto[] = [
    {
      unitId: '12345678901',
      productCode: 'PRB',
      aliquot: '00',
      aboCodeDesc: 'O POS',
      expDate: '2024-02-14T23:59:00',
      productStatus: 'Available',
      inventoryClass: 'AV',
      disposition: 'Available',
      orderNumber: null,
      boxId: 'BOX-001',
    },
    {
      unitId: '12345678901',
      productCode: 'PLT',
      aliquot: '01',
      aboCodeDesc: 'O POS',
      expDate: '2024-01-20T23:59:00',
      productStatus: 'Shipped',
      inventoryClass: 'SH',
      disposition: 'Shipped',
      orderNumber: 'ORD-2024-001',
      boxId: null,
    },
  ];

  const mockHistoryRecords: ProductHistoryDto[] = [
    {
      statusDescription: 'Component Production - Create Product',
      statusInd: 'AV',
      fromDate: '2024-01-15T10:30:00',
      personName: 'John Smith',
      destination: 'LAB-01',
      inventoryClass: 'AV',
      customerName: null,
      consigneeName: null,
    },
  ];

  const mockPostValidateEvent: UnitIdPostValidateEvent = {
    data: {
      parsedUnitId: '12345678901',
      checkDigit: null,
      codeScheme: 'I',
      manualUnitId: '12345678901',
      codabarUnitScheme: null,
      entryMode: 'M',
      barcodeType: 'CODE128',
      chapterScheme: 'I',
    },
    confirm: jasmine.createSpy('confirm'),
    reject: jasmine.createSpy('reject'),
  };

  beforeEach(() => {

    historyServiceSpy = jasmine.createSpyObj('UnitProductHistoryService', [
      'validateUnit',
      'getProducts',
      'getProductHistory',
    ]);
    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal', 'convertLocalToGmt']);
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: any) => m.clone());

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: signal(undefined),
    });

    historyServiceSpy.validateUnit.and.returnValue(of(mockValidationData));
    historyServiceSpy.getProducts.and.returnValue(of(mockProducts));

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    });



      TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: UnitProductHistoryService, useValue: historyServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    })
      .overrideComponent(UnitAndProductHistory, {
        set: {
          imports: [
            CommonModule,
            MatButtonModule,
            MatIconModule,
            MatChipsModule,
            MockPageHeaderComponent,
            MockUnitIdFieldComponent,
            MockLoadingSpinnerComponent,
            MockDataTableComponent,
          ],
        },
      });


    


      historyServiceSpy.validateUnit.calls.reset();


      historyServiceSpy.getProducts.calls.reset();


      historyServiceSpy.getProductHistory.calls.reset();


      dialogSpy.open.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      chapterTimezoneServiceSpy.convertGmtToLocal.calls.reset();


      historyServiceSpy.validateUnit.and.returnValue(of(mockValidationData));


      historyServiceSpy.getProducts.and.returnValue(of(mockProducts));


    fixture = TestBed.createComponent(UnitAndProductHistory);
    component = fixture.componentInstance;


    });

  describe('Unit Post-Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate unit and load products on postValidate', fakeAsync(() => {
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      expect(historyServiceSpy.validateUnit).toHaveBeenCalledWith('12345678901');
      expect(mockPostValidateEvent.confirm).toHaveBeenCalled();
      expect(component.unitValidated()).toBeTrue();
      expect(component.unitId()).toBe(mockValidationData.unitId);
      expect(component.collectionDate()).toBe(mockValidationData.collectionDate);
    }));

    it('should load products after successful validation', fakeAsync(() => {
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      expect(historyServiceSpy.getProducts).toHaveBeenCalledWith(
        mockValidationData.unitId,
        mockValidationData.collectionDate
      );
      expect(component.products().length).toBe(2);
    }));

    it('should reject on validation error', fakeAsync(() => {
      const errorMessage = 'Unit not found or has no collection date';
      historyServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: errorMessage } }))
      );

      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      expect(mockPostValidateEvent.reject).toHaveBeenCalledWith(errorMessage);
      expect(component.unitValidated()).toBeFalse();
    }));
  });

  describe('Loading Products', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should map products to table rows', fakeAsync(() => {
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      const products = component.products();
      expect(products.length).toBe(2);
      expect(products[0].product).toBe('PRB00');
      expect(products[1].product).toBe('PLT01');
    }));

    it('should format expiration dates', fakeAsync(() => {
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      const products = component.products();
      expect(products[0].formattedExpDate).toContain('14-FEB-2024');
    }));


  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle products loading error', fakeAsync(() => {
      historyServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('Failed to load products'))
      );

      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      expect(component.error()).toContain('Failed to load products');
      expect(component.loading()).toBeFalse();
      expect(component.products().length).toBe(0);
    }));



    it('should display error message in UI', fakeAsync(() => {
      historyServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('Failed to load products'))
      );

      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Failed to load products');
    }));
  });
  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();
    }));

    it('should clear products on unit cleared', () => {
      component.onUnitCleared();

      expect(component.products().length).toBe(0);
    });

    it('should clear collection date on unit cleared', () => {
      component.onUnitCleared();

      expect(component.collectionDate()).toBe('');
    });

    it('should reset unitValidated flag on unit cleared', () => {
      component.onUnitCleared();

      expect(component.unitValidated()).toBeFalse();
    });

    it('should reset unitId on unit cleared', () => {
      component.onUnitCleared();

      expect(component.unitId()).toBe('');
    });

    it('should clear error on unit cleared', () => {
      component.error.set('some error');
      component.onUnitCleared();

      expect(component.error()).toBeNull();
    });

    it('should call unitIdField.clear on clearAll', () => {
      const unitIdFieldDebug = fixture.debugElement.query(By.directive(MockUnitIdFieldComponent));
      const unitIdFieldInstance = unitIdFieldDebug.componentInstance as MockUnitIdFieldComponent;
      (component as any).unitIdField = unitIdFieldInstance;

      component.onClearAll();

      expect(unitIdFieldInstance.clear).toHaveBeenCalled();
      expect(component.products().length).toBe(0);
      expect(component.unitValidated()).toBeFalse();
    });
  });

  describe('View Product History', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
    }));



    it('should pass correct data to dialog', fakeAsync(() => {
      const product = component.products()[0];

      component.viewProductHistory(product);
      tick();

      const dialogCall = dialogSpy.open.calls.mostRecent();
      const dialogData = dialogCall.args[1]?.data as ProductHistoryDialogData;

      expect(dialogData.unitId).toBe('12345678901');
      expect(dialogData.productCode).toBe('PRB');
      expect(dialogData.aliquot).toBe('00');
      expect(dialogData.product).toBe('PRB00');
      expect(dialogData.historyRecords).toEqual(mockHistoryRecords);
    }));



    it('should include shipmentNumber when order number exists', fakeAsync(() => {
      const product = component.products()[1]; // PLT01 with orderNumber

      component.viewProductHistory(product);
      tick();

      const dialogCall = dialogSpy.open.calls.mostRecent();
      const dialogData = dialogCall.args[1]?.data as ProductHistoryDialogData;

      expect(dialogData.shipmentNumber).toBe('ORD-2024-001');
    }));

    it('should show error when product has no history', fakeAsync(() => {
      historyServiceSpy.getProductHistory.and.returnValue(of([]));
      const product = component.products()[0];

      component.viewProductHistory(product);
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product has no history',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    }));

    it('should show error when history API fails', fakeAsync(() => {
      historyServiceSpy.getProductHistory.and.returnValue(
        throwError(() => new Error('API error'))
      );
      const product = component.products()[0];

      component.viewProductHistory(product);
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product has no history',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    }));

    it('should open dialog with correct configuration', fakeAsync(() => {
      const product = component.products()[0];
      component.viewProductHistory(product);
      tick();

      const dialogCall = dialogSpy.open.calls.mostRecent();
      expect(dialogCall.args[0]).toBe(ProductHistoryDialog);
      expect(dialogCall.args[1]?.width).toBe('1000px');
      expect(dialogCall.args[1]?.hasBackdrop).toBeFalse();
      expect(dialogCall.args[1]?.position).toEqual({ right: '0', top: '64px' });
    }));

    it('should show error when history records are null', fakeAsync(() => {
      historyServiceSpy.getProductHistory.and.returnValue(of(null as any));
      const product = component.products()[0];

      component.viewProductHistory(product);
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product has no history',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    }));
  });



  describe('Computed Values', () => {
    it('should compute hasProducts correctly', fakeAsync(() => {
      fixture.detectChanges();
      expect(component.hasProducts()).toBeFalse();

      component.onUnitPostValidate(mockPostValidateEvent);
      tick();

      expect(component.hasProducts()).toBeTrue();
    }));

    it('should format collection date correctly', () => {
      component.collectionDate.set('2024-01-15');
      expect(component.formattedCollectionDate()).toBe('15-JAN-2024');
    });

    it('should return raw date string when converted date is invalid', () => {
      chapterTimezoneServiceSpy.convertGmtToLocal.and.returnValue(moment.invalid());
      component.collectionDate.set('invalid-date-string');
      expect(component.formattedCollectionDate()).toBe('invalid-date-string');
    });
  });

  describe('Status Badge', () => {
    it('should return correct color for known status', () => {
      expect(component.getStatusBadgeColor('Available')).toBe('primary');
      expect(component.getStatusBadgeColor('Delivered')).toBe('accent');
      expect(component.getStatusBadgeColor('Allocated')).toBe('warn');
    });

    it('should return primary for unknown status', () => {
      expect(component.getStatusBadgeColor('UnknownStatus')).toBe('primary');
    });
  });

  describe('Timezone Conversion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use ChapterTimezoneService for collection date formatting', () => {
      component.collectionDate.set('2024-01-15');
      const result = component.formattedCollectionDate();
      expect(chapterTimezoneServiceSpy.convertGmtToLocal).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should use ChapterTimezoneService for expiration date formatting', fakeAsync(() => {
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      const products = component.products();
      expect(chapterTimezoneServiceSpy.convertGmtToLocal).toHaveBeenCalled();
      expect(products[0].formattedExpDate).toBeTruthy();
    }));

    it('should handle null expiration date gracefully', fakeAsync(() => {
      const productsWithNull = [{ ...mockProducts[0], expDate: null }];
      historyServiceSpy.getProducts.and.returnValue(of(productsWithNull));
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      const products = component.products();
      expect(products[0].formattedExpDate).toBe('');
    }));

    it('should return empty string for empty collection date', () => {
      component.collectionDate.set('');
      expect(component.formattedCollectionDate()).toBe('');
    });

    it('should return empty string when formatDateTime receives null', () => {
      expect(component['formatDateTime'](null)).toBe('');
    });
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
    }));

    it('should sort products ascending by product column', () => {
      component.onSortChange({ column: 'product', direction: 'A' });
      const products = component.products();
      expect(products[0].productCode).toBe('PLT');
      expect(products[1].productCode).toBe('PRB');
    });

    it('should sort products descending by product column', () => {
      component.onSortChange({ column: 'product', direction: 'D' });
      const products = component.products();
      expect(products[0].productCode).toBe('PRB');
      expect(products[1].productCode).toBe('PLT');
    });

    it('should handle null values during sort', () => {
      component.onSortChange({ column: 'orderNumber', direction: 'A' });
      const products = component.products();
      // null values should be pushed to end
      expect(products[1].orderNumber).toBeNull();
    });

    it('should update tableConfig sortConfig on sort change', () => {
      component.onSortChange({ column: 'product', direction: 'A' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'product', direction: 'A' });
    });
  });

  describe('Row Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
    }));

    it('should call viewProductHistory on viewHistory action', fakeAsync(() => {
      const product = component.products()[0];
      component.onRowAction({ action: 'viewHistory', row: product });
      tick();
      expect(historyServiceSpy.getProductHistory).toHaveBeenCalled();
    }));

    it('should ignore unknown actions', fakeAsync(() => {
      const product = component.products()[0];
      component.onRowAction({ action: 'unknownAction', row: product });
      tick();
      expect(historyServiceSpy.getProductHistory).not.toHaveBeenCalled();
    }));
  });

  describe('Lifecycle', () => {
    it('should call onUnitValidated without error', () => {
      fixture.detectChanges();
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });

    it('should complete destroy subject on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should show empty state when no products and not loading', () => {
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should show error container when error exists', fakeAsync(() => {
      fixture.detectChanges();
      historyServiceSpy.getProducts.and.returnValue(
        throwError(() => new Error('Test error'))
      );
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();
      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
    }));

    it('should display collection date in header', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();
      const dateDisplay = fixture.nativeElement.querySelector('.collection-date-display .value');
      expect(dateDisplay).toBeTruthy();
      expect(dateDisplay.textContent.trim()).not.toBe('-');
    }));
  });

  describe('Validation Error Fallback', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use fallback message when error has no message property', fakeAsync(() => {
      historyServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({}))
      );
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      expect(mockPostValidateEvent.reject).toHaveBeenCalledWith('Unit not found or has no collection date');
    }));

    it('should use error.message when error has message', fakeAsync(() => {
      historyServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ message: 'Custom error message' }))
      );
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      expect(mockPostValidateEvent.reject).toHaveBeenCalledWith('Custom error message');
    }));

    it('should use products error message when available', fakeAsync(() => {
      historyServiceSpy.getProducts.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      expect(component.error()).toBeTruthy();
    }));
  });

  describe('Status Badge Class', () => {
    it('should return correct badge class for all known statuses', fakeAsync(() => {
      fixture.detectChanges();
      const statuses = ['Available', 'Delivered', 'Shipped', 'Allocated', 'Packed', 'Returned', 'Discarded', 'Quarantine', 'Outdated', 'In Lab'];
      statuses.forEach(status => {
        const result = component['getStatusBadgeClass'](status);
        expect(result).not.toBe('status-default');
      });
    }));

    it('should return status-default for unknown status', () => {
      fixture.detectChanges();
      expect(component['getStatusBadgeClass']('Unknown')).toBe('status-default');
    });

    it('should return specific badge class for each status including In Lab', () => {
      fixture.detectChanges();
      expect(component['getStatusBadgeClass']('Available')).toBe('status-available');
      expect(component['getStatusBadgeClass']('Delivered')).toBe('status-delivered');
      expect(component['getStatusBadgeClass']('Shipped')).toBe('status-shipped');
      expect(component['getStatusBadgeClass']('Allocated')).toBe('status-allocated');
      expect(component['getStatusBadgeClass']('Packed')).toBe('status-packed');
      expect(component['getStatusBadgeClass']('Returned')).toBe('status-returned');
      expect(component['getStatusBadgeClass']('Discarded')).toBe('status-discarded');
      expect(component['getStatusBadgeClass']('Quarantine')).toBe('status-quarantine');
      expect(component['getStatusBadgeClass']('Outdated')).toBe('status-outdated');
      expect(component['getStatusBadgeClass']('In Lab')).toBe('status-in-lab');
    });
  });

  describe('Products Table Display', () => {
    it('should show data table when products loaded', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();
      const dataTable = fixture.debugElement.query(By.directive(MockDataTableComponent));
      expect(dataTable).toBeTruthy();
    }));

    it('should not show empty state when products loaded', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeFalsy();
    }));

    it('should update pagination total on product load', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should handle equal values during sort', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      component.onSortChange({ column: 'aboCodeDesc', direction: 'A' });
      const products = component.products();
      expect(products.length).toBe(2);
    }));

    it('should sort numeric-like values correctly', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitPostValidate(mockPostValidateEvent);
      tick();
      component.onSortChange({ column: 'boxId', direction: 'A' });
      const products = component.products();
      expect(products.length).toBe(2);
    }));
  });
});

describe('UnitAndProductHistory - Query Parameter Handling', () => {
  let component: UnitAndProductHistory;
  let fixture: ComponentFixture<UnitAndProductHistory>;
  let pageHeaderServiceSpy: any;

  function setup(queryParams: any) {
    TestBed.resetTestingModule();

    const historyServiceSpy = jasmine.createSpyObj('UnitProductHistoryService', [
      'validateUnit', 'getProducts', 'getProductHistory',
    ]);
    const dialogSpy = createMockMatDialog();
    const snackBarSpy = createMockMatSnackBar();
    const chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal', 'convertLocalToGmt']);
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: any) => m.clone());
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: signal(undefined),
    });

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: of(queryParams),
      snapshot: { queryParams },
    });

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: UnitProductHistoryService, useValue: historyServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    })
    .overrideComponent(UnitAndProductHistory, {
      set: {
        imports: [
          CommonModule, MatButtonModule, MatIconModule, MatChipsModule,
          MockPageHeaderComponent, MockUnitIdFieldComponent, MockLoadingSpinnerComponent, MockDataTableComponent,
        ],
      },
    });

    fixture = TestBed.createComponent(UnitAndProductHistory);
    component = fixture.componentInstance;
  }

  it('should auto-populate unit ID when unitId query param is present', fakeAsync(() => {
    setup({ unitId: 'W12341707011600' });

    const mockControl = {
      setValue: jasmine.createSpy('setValue'),
      markAsTouched: jasmine.createSpy('markAsTouched'),
    };
    const mockNativeEl = {
      focus: jasmine.createSpy('focus'),
      blur: jasmine.createSpy('blur'),
    };

    fixture.detectChanges();

    (component as any).unitIdField = {
      unitIdControl: mockControl,
      unitIdInput: { nativeElement: mockNativeEl },
    };

    tick(200);
    tick(50);
    tick(50);

    expect(mockControl.setValue).toHaveBeenCalledWith('=W1234170701160000');
    expect(mockControl.markAsTouched).toHaveBeenCalled();
    expect(mockNativeEl.focus).toHaveBeenCalled();
    expect(mockNativeEl.blur).toHaveBeenCalled();
  }));

  it('should update breadcrumbs when from and fromPath query params are present', fakeAsync(() => {
    setup({ from: 'Inventory', fromPath: '/inventory' });

    fixture.detectChanges();
    tick(50);

    expect(component.headerConfig.breadcrumbs.length).toBe(3);
    expect(component.headerConfig.breadcrumbs[1].label).toBe('Inventory');
    expect(component.headerConfig.breadcrumbs[1].link).toBe('/inventory');
    expect(component.headerConfig.breadcrumbs[2].label).toBe('Unit and Product History');
  }));

  it('should handle unitId param when unitIdField is not yet initialized', fakeAsync(() => {
    setup({ unitId: 'W12341707011600' });

    fixture.detectChanges();
    (component as any).unitIdField = null;
    tick(200);
    tick(50);
    tick(50);
    // Should not throw
  }));

  it('should handle no query params gracefully', fakeAsync(() => {
    setup({});
    fixture.detectChanges();
    tick(200);
    expect(component.headerConfig.breadcrumbs.length).toBeLessThanOrEqual(2);
  }));

  it('should use pageData title when available for breadcrumbs', fakeAsync(() => {
    setup({ from: 'Source', fromPath: '/source' });

    pageHeaderServiceSpy.pageHeaderData.set({ title: 'Custom Title', subtitle: 'Custom Sub' });

    fixture.detectChanges();
    tick(50);

    expect(component.headerConfig.breadcrumbs[2].label).toBe('Custom Title');
    expect(component.headerConfig.title).toBe('Custom Title');
    expect(component.headerConfig.subtitle).toBe('Custom Sub');
  }));

  it('should handle unitId param when unitIdInput becomes null mid-timeout', fakeAsync(() => {
    setup({ unitId: 'W12341707011600' });

    const mockControl = {
      setValue: jasmine.createSpy('setValue'),
      markAsTouched: jasmine.createSpy('markAsTouched'),
    };

    fixture.detectChanges();
    (component as any).unitIdField = {
      unitIdControl: mockControl,
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus'), blur: jasmine.createSpy('blur') } },
    };
    tick(200);

    // Remove unitIdInput before inner timeouts fire
    (component as any).unitIdField.unitIdInput = null;
    tick(50);
    tick(50);
    // Should not throw
    expect(mockControl.setValue).toHaveBeenCalled();
  }));
});
