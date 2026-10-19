import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { Odtoff } from './odtoff';
import { OdtoffApiService } from './services/odtoff-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  PickSlipDropdownDto,
  PickSlipSummaryDto,
  PickSlipProductDto,
  ProductRemovalResultDto,
  ApiResponse,
} from './models/odtoff.model';
import { ViewItemsDialogComponent } from './view-items-dialog/view-items-dialog';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('Odtoff', () => {
  let component: Odtoff;
  let fixture: ComponentFixture<Odtoff>;
  let apiServiceSpy: jasmine.SpyObj<OdtoffApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockActivePickSlips: PickSlipDropdownDto[] = [
    { pickSlipId: 'PO001', insertDate: '2026-05-30T10:00:00', productCount: 5 },
    { pickSlipId: 'PO002', insertDate: '2026-05-29T14:30:00', productCount: 3 },
  ];

  const mockPickSlipSummary: PickSlipSummaryDto = {
    pickSlipId: 'PO001',
    insertDate: '2026-05-30T10:00:00',
    totalProducts: 10,
    outdateProducts: 8,
    cancelledProducts: 2,
    pickSlipStatus: 'OP',
  };

  const mockProducts: PickSlipProductDto[] = [
    {
      unitId: 'U123456',
      checkDigit: 'K',
      productCode: 'P12345',
      productType: 'RBC',
      productDescription: 'Red Blood Cells',
      aboRh: 'O+',
      expirationDate: '2026-06-15T00:00:00',
      productStatus: 'OD',
      productStatusDescription: 'Outdated',
      aliquot: null,
      bloodType: 'Whole Blood',
      collectionDate: '2026-05-01T00:00:00',
    },
    {
      unitId: 'U123456',
      checkDigit: null,
      productCode: 'P67890',
      productType: 'PLT',
      productDescription: 'Platelets',
      aboRh: 'A+',
      expirationDate: '2026-06-20T00:00:00',
      productStatus: 'OD',
      productStatusDescription: 'Outdated',
      aliquot: null,
      bloodType: 'Whole Blood',
      collectionDate: '2026-05-01T00:00:00',
    },
  ];

  const mockRemovalResult: ProductRemovalResultDto = {
    unitId: 'U123456',
    productCode: 'P12345',
    productType: 'RBC',
    aboRh: 'O+',
    expirationDate: '2026-06-15T00:00:00',
    pickSlipAutoClosed: false,
    message: 'Product removed successfully',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('OdtoffApiService', [
      'getActivePickSlips',
      'getPickSlipSummary',
      'getPickSlipProducts',
      'removeProduct',
    ]);

    apiServiceSpy.getActivePickSlips.and.returnValue(of(mockActivePickSlips));
    apiServiceSpy.getPickSlipSummary.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Success', item: mockPickSlipSummary } as ApiResponse<PickSlipSummaryDto>)
    );
    apiServiceSpy.getPickSlipProducts.and.returnValue(of(mockProducts));

    snackBarSpy = createMockMatSnackBar();
    snackBarSpy.open.and.returnValue({ onAction: () => of(void 0), dismiss: () => {} } as any);
    dialogSpy = createMockMatDialog();

    const headerServiceMock = {
      chapterChanged$: new Subject(),
      chapterTimeZone: () => 'UTC',
    };

    const pageHeaderServiceMock = {
      pageHeaderData: () => undefined,
    };



      TestBed.configureTestingModule({
      imports: [
        Odtoff,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        { provide: OdtoffApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: MatDialog, useValue: dialogSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });

    TestBed.overrideComponent(Odtoff, {
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarSpy }] },
    });


      apiServiceSpy.getActivePickSlips.and.returnValue(of(mockActivePickSlips));


      apiServiceSpy.getPickSlipProducts.and.returnValue(of(mockProducts));


      snackBarSpy.open.and.returnValue({ onAction: () => of(void 0), dismiss: () => {} } as any);


    fixture = TestBed.createComponent(Odtoff);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load active pick slips on init', () => {
    expect(apiServiceSpy.getActivePickSlips).toHaveBeenCalled();
    expect(component.activePickSlips().length).toBe(2);
  });

  it('should initialize forms with correct structure', () => {
    expect(component.pickSlipForm.get('pickSlipId')).toBeTruthy();
    expect(component.productForm.get('productCode')).toBeTruthy();
  });



  it('should have table config with 5 columns', () => {
    expect(component.tableConfig.columns.length).toBe(5);
    expect(component.tableConfig.columns[0].key).toBe('unitId');
    expect(component.tableConfig.columns[1].key).toBe('productCode');
    expect(component.tableConfig.columns[2].key).toBe('productDescription');
    expect(component.tableConfig.columns[3].key).toBe('aboRh');
    expect(component.tableConfig.columns[4].key).toBe('expirationDate');
  });







  it('should show sticky header', () => {
    expect(component.tableConfig.stickyHeader).toBe(true);
  });

  it('should compute hasPickSlipSelected as false initially', () => {
    expect(component.hasPickSlipSelected()).toBeFalse();
  });

  it('should compute hasRemovedProducts as false initially', () => {
    expect(component.hasRemovedProducts()).toBeFalse();
  });

  describe('Pick Slip Selection', () => {
    it('should load summary when pick slip is selected', () => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();

      expect(apiServiceSpy.getPickSlipSummary).toHaveBeenCalledWith('PO001');
      expect(component.selectedPickSlipSummary()).toEqual(mockPickSlipSummary);
      expect(component.hasPickSlipSelected()).toBeTrue();
    });

    it('should load all pick slip products when selected', () => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();

      expect(apiServiceSpy.getPickSlipProducts).toHaveBeenCalledWith('PO001');
      expect(component.allPickSlipProducts().length).toBe(2);
    });

    it('should reset product state on pick slip change', () => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();

      expect(component.eligibleProducts().length).toBe(0);
      expect(component.validatedProduct()).toBeNull();
      expect(component.parsedUnitId()).toBeNull();
    });
  });

  describe('Unit ID Validation', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
    });

    it('should filter eligible OD products by parsed unit ID', () => {
      component.onUnitIdValidated({ parsedUnitId: 'U123456' } as any);

      expect(component.eligibleProducts().length).toBe(2);
      expect(component.eligibleProducts()[0].productCode).toBe('P12345');
      expect(component.parsedUnitId()).toBe('U123456');
    });



    it('should clear state on unit ID cleared', () => {
      component.onUnitIdValidated({ parsedUnitId: 'U123456' } as any);
      component.onUnitIdCleared();

      expect(component.parsedUnitId()).toBeNull();
      expect(component.eligibleProducts().length).toBe(0);
      expect(component.validatedProduct()).toBeNull();
    });
  });

  describe('Product Removal', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      component.onUnitIdValidated({ parsedUnitId: 'U123456' } as any);
    });





    it('should handle pick slip auto-close', () => {
      const autoClosedResult = { ...mockRemovalResult, pickSlipAutoClosed: true };
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: autoClosedResult } as ApiResponse<ProductRemovalResultDto>)
      );

      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('automatically closed'),
        'Close',
        jasmine.objectContaining({ panelClass: ['info-snackbar'] })
      );
    });

    it('should reset product form after successful removal', () => {
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: mockRemovalResult } as ApiResponse<ProductRemovalResultDto>)
      );

      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();

      expect(component.productForm.get('productCode')?.value).toBeFalsy();
      expect(component.eligibleProducts().length).toBe(0);
      expect(component.parsedUnitId()).toBeNull();
    });

    it('should handle API error with mapped error code', () => {
      apiServiceSpy.removeProduct.and.returnValue(
        throwError(() => ({ error: { message: 'Unit ID not found', errorCode: 312 } }))
      );

      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Unit ID not found in system for this chapter',
        'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should compute hasRemovedProducts after removal', () => {
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: mockRemovalResult } as ApiResponse<ProductRemovalResultDto>)
      );

      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();

      expect(component.hasRemovedProducts()).toBeTrue();
    });
  });

  describe('Clear Actions', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
    });

    it('should reset all state on clear', () => {
      component.onClear();

      expect(component.pickSlipForm.get('pickSlipId')?.value).toBeFalsy();
      expect(component.selectedPickSlipSummary()).toBeNull();
      expect(component.removedProducts().length).toBe(0);
      expect(component.allPickSlipProducts().length).toBe(0);
      expect(component.hasPickSlipSelected()).toBeFalse();
    });

    it('should reset only product state on clear all', () => {
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: mockRemovalResult } as ApiResponse<ProductRemovalResultDto>)
      );

      component.onUnitIdValidated({ parsedUnitId: 'U123456' } as any);
      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();

      component.onClearAll();

      expect(component.removedProducts().length).toBe(0);
      expect(component.selectedPickSlipSummary()).not.toBeNull();
      expect(component.hasPickSlipSelected()).toBeTrue();
    });
  });
  describe('Error Handling', () => {
    it('should handle active pick slips loading error', () => {
      apiServiceSpy.getActivePickSlips.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      (component as any).loadActivePickSlips();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to load active pick slips',
        'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle pick slip summary loading error', () => {
      apiServiceSpy.getPickSlipSummary.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      (component as any).loadPickSlipSummary('PO001');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to load pick slip summary',
        'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle pick slip products loading error', () => {
      apiServiceSpy.getPickSlipProducts.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      expect(component.allPickSlipProducts().length).toBe(0);
    });
  });

  describe('onPickSlipSelected early return', () => {
    it('should return early when no pickSlipId is set', () => {
      component.pickSlipForm.patchValue({ pickSlipId: '' });
      apiServiceSpy.getPickSlipSummary.calls.reset();
      component.onPickSlipSelected();
      expect(apiServiceSpy.getPickSlipSummary).not.toHaveBeenCalled();
    });
  });

  describe('loadPickSlipSummary — failed response', () => {
    it('should set error when response.success is false', () => {
      apiServiceSpy.getPickSlipSummary.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Not found', item: null } as any)
      );
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      expect(component.selectedPickSlipSummary()).toBeNull();
    });
  });

  describe('onUnitIdValidated — no matching products', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
    });

    it('should show error when no eligible products found for unit ID', () => {
      component.onUnitIdValidated({ parsedUnitId: 'NOMATCH', codeScheme: 'I' } as any);
      expect(component.eligibleProducts().length).toBe(0);
      expect(snackBarSpy.open).toHaveBeenCalled();
    });
  });

  describe('onProductCodeChange early return', () => {
    it('should return early when no pickSlipId is set', () => {
      apiServiceSpy.removeProduct = jasmine.createSpy('removeProduct');
      component.onProductCodeChange();
      expect(apiServiceSpy.removeProduct).not.toHaveBeenCalled();
    });

    it('should return early when no parsedUnitId', () => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.productForm.patchValue({ productCode: 'P12345' });
      apiServiceSpy.removeProduct = jasmine.createSpy('removeProduct');
      component.onProductCodeChange();
      expect(apiServiceSpy.removeProduct).not.toHaveBeenCalled();
    });
  });

  describe('removeProduct — failed response', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      component.onUnitIdValidated({ parsedUnitId: 'U123456', codeScheme: 'I' } as any);
    });

    it('should show error when response.success is false', () => {
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Failed to remove', item: null } as any)
      );
      component.productForm.patchValue({ productCode: 'P12345' });
      component.onProductCodeChange();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to remove',
        'Close',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('onViewItemsOnPickSlip', () => {
    it('should open dialog when pick slip is selected', () => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      component.onViewItemsOnPickSlip();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should return early when no pickSlipId', () => {
      dialogSpy.open.calls.reset();
      component.onViewItemsOnPickSlip();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update tableConfig pagination on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    });
  });

  describe('filteredPickSlips', () => {
    it('should return all pick slips when search term is empty', () => {
      component.pickSlipSearchControl.setValue('');
      expect(component.filteredPickSlips().length).toBe(2);
    });

    it('should filter pick slips by search term', () => {
      component.pickSlipSearchControl.setValue('PO001');
      expect(component.filteredPickSlips().length).toBe(1);
      expect(component.filteredPickSlips()[0].pickSlipId).toBe('PO001');
    });

    it('should return empty array when no match found', () => {
      component.pickSlipSearchControl.setValue('NOMATCH');
      expect(component.filteredPickSlips().length).toBe(0);
    });
  });

  describe('filteredProductCodes', () => {
    beforeEach(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
      component.onUnitIdValidated({ parsedUnitId: 'U123456', codeScheme: 'I' } as any);
    });

    it('should return all product codes when search term is empty', () => {
      component.productCodeSearchControl.setValue('');
      expect(component.filteredProductCodes().length).toBe(2);
    });

    it('should filter product codes by search term', () => {
      component.productCodeSearchControl.setValue('P12345');
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].productCode).toBe('P12345');
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      apiServiceSpy.removeProduct.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Success', item: { ...mockRemovalResult, unitId: 'B123' } } as any)
      );
      component.pickSlipForm.patchValue({ pickSlipId: 'PO001' });
      component.onPickSlipSelected();
    });

    it('should sort removed products ascending', () => {
      component.removedProducts.set([
        { unitId: 'Z999', checkDigit: null, productCode: 'P1', productDescription: '', aboRh: '', expirationDate: '' },
        { unitId: 'A001', checkDigit: null, productCode: 'P2', productDescription: '', aboRh: '', expirationDate: '' },
      ]);
      component.onSortChange({ column: 'unitId', direction: 'A' } as any);
      expect(component.removedProducts()[0].unitId).toBe('A001');
    });

    it('should sort removed products descending', () => {
      component.removedProducts.set([
        { unitId: 'A001', checkDigit: null, productCode: 'P2', productDescription: '', aboRh: '', expirationDate: '' },
        { unitId: 'Z999', checkDigit: null, productCode: 'P1', productDescription: '', aboRh: '', expirationDate: '' },
      ]);
      component.onSortChange({ column: 'unitId', direction: 'D' } as any);
      expect(component.removedProducts()[0].unitId).toBe('Z999');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      const next = spyOn((component as any).destroy$, 'next').and.callThrough();
      const complete = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(next).toHaveBeenCalled();
      expect(complete).toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('should expose psf from pickSlipForm', () => {
      expect(component.psf).toBe(component.pickSlipForm.controls);
    });

    it('should expose pf from productForm', () => {
      expect(component.pf).toBe(component.productForm.controls);
    });

    it('should expose dataSource from removedProducts signal', () => {
      expect(component.dataSource).toEqual(component.removedProducts());
    });
  });

  describe('formatDateTime', () => {
    it('should return dash for empty string', () => {
      expect((component as any).formatDateTime('')).toBe('-');
    });

    it('should format valid date string', () => {
      const result = (component as any).formatDateTime('2026-06-15T00:00:00');
      expect(result).toContain('JUN');
    });

    it('should return original string for invalid date', () => {
      const result = (component as any).formatDateTime('not-a-date');
      expect(result).toBe('not-a-date');
    });
  });

  describe('formatDate', () => {
    it('should return dash for empty string', () => {
      expect((component as any).formatDate('')).toBe('-');
    });

    it('should format valid date without time portion', () => {
      const result = (component as any).formatDate('2026-06-15T10:30:00');
      expect(result).toContain('JUN');
      expect(result).not.toContain(':');
    });

    it('should return original string for invalid date', () => {
      expect((component as any).formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('unitId column valueFormatter', () => {
    it('should append check digit with dash when present', () => {
      const col = component.tableConfig.columns[0];
      expect(col.valueFormatter!('U123456', { unitId: 'U123456', checkDigit: 'K' } as any)).toBe('U123456-K');
    });

    it('should return plain unitId when checkDigit is null', () => {
      const col = component.tableConfig.columns[0];
      expect(col.valueFormatter!('U123456', { unitId: 'U123456', checkDigit: null } as any)).toBe('U123456');
    });
  });

  describe('Unit ID column header — dynamic count', () => {
    it('should show Unit ID (0) initially when no products removed', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns[0].header).toBe('Unit ID (0)');
    });

    it('should update Unit ID header to Unit ID (1) after one product is added', () => {
      component.removedProducts.set([
        { unitId: 'A001', checkDigit: null, productCode: 'P001', productDescription: 'RBC', aboRh: 'O+', expirationDate: '2026-06-15T00:00:00' },
      ]);
      fixture.detectChanges();
      expect(component.tableConfig.columns[0].header).toBe('Unit ID (1)');
    });

    it('should update Unit ID header count when products are cleared', () => {
      component.removedProducts.set([
        { unitId: 'A001', checkDigit: null, productCode: 'P001', productDescription: 'RBC', aboRh: 'O+', expirationDate: '2026-06-15T00:00:00' },
      ]);
      fixture.detectChanges();
      component.removedProducts.set([]);
      fixture.detectChanges();
      expect(component.tableConfig.columns[0].header).toBe('Unit ID (0)');
    });
  });
});
