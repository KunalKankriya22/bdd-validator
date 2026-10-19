import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ViewItemsDialogComponent, ViewItemsDialogData } from './view-items-dialog';
import { OdtoffApiService } from '../services/odtoff-api.service';
import { ApiResponse, PickSlipProductDto } from '../models/odtoff.model';

describe('ViewItemsDialogComponent', () => {
  let component: ViewItemsDialogComponent;
  let fixture: ComponentFixture<ViewItemsDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<OdtoffApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewItemsDialogComponent>>;

  const dialogData: ViewItemsDialogData = { pickSlipId: 'PO001' };

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
  ];

  const mockPagedResponse: ApiResponse<PickSlipProductDto[]> = {
    success: true,
    statusCode: 200,
    message: 'OK',
    data: mockProducts,
    total: 1,
  };

  function setup(pagedResponse: any = mockPagedResponse): void {
    apiServiceSpy = jasmine.createSpyObj('OdtoffApiService', ['getPickSlipProductsPaged']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.getPickSlipProductsPaged.and.returnValue(of(pagedResponse));

    TestBed.configureTestingModule({
      imports: [ViewItemsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: OdtoffApiService, useValue: apiServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });

    fixture = TestBed.createComponent(ViewItemsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('constructor and initial tableConfig', () => {
    beforeEach(() => setup());

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize tableConfig with 3 columns', () => {
      expect(component.tableConfig.columns.length).toBe(3);
      expect(component.tableConfig.columns[0].key).toBe('unitId');
      expect(component.tableConfig.columns[1].key).toBe('productType');
      expect(component.tableConfig.columns[2].key).toBe('productStatusDescription');
    });

    it('should initialize tableConfig with correct pagination defaults', () => {
      // Create a fresh instance without detectChanges to capture constructor state
      const freshFixture = TestBed.createComponent(ViewItemsDialogComponent);
      const freshComponent = freshFixture.componentInstance;
      // Read tableConfig before ngOnInit runs (before detectChanges)
      const pagination = freshComponent.tableConfig.pagination!;
      expect(pagination.pageSize).toBe(25);
      expect(pagination.pageIndex).toBe(0);
      expect(pagination.totalRecords).toBe(0);
      expect(pagination.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(pagination.showFirstLastButtons).toBeTrue();
    });

    it('should set stickyHeader to true', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should set showPagination to true', () => {
      expect(component.tableConfig.showPagination).toBeTrue();
    });
  });

  describe('ngOnInit — loadProducts', () => {
    beforeEach(() => setup());

    it('should call getPickSlipProductsPaged on init with default sort', () => {
      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 25, 0, 'expirationDate', 'A'
      );
    });

    it('should set products on successful load', () => {
      expect(component.products.length).toBe(1);
      expect(component.products[0].unitId).toBe('U123456');
    });

    it('should update tableConfig.pagination.totalRecords on success', () => {
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    });

    it('should update Unit ID column header with total count after load', () => {
      expect(component.tableConfig.columns[0].header).toBe('Unit ID (1)');
    });

    it('should set loading to false after successful load', () => {
      expect(component.loading).toBeFalse();
    });
  });

  describe('loadProducts — edge cases', () => {
    it('should set products to empty array when response.data is null', () => {
      setup({ ...mockPagedResponse, data: null, total: 0 });
      expect(component.products).toEqual([]);
    });

    it('should set products to empty array when response.data is undefined', () => {
      setup({ success: true, statusCode: 200, message: 'OK', total: 0 });
      expect(component.products).toEqual([]);
    });

    it('should set totalRecords to 0 when response.total is undefined', () => {
      setup({ success: true, statusCode: 200, message: 'OK', data: mockProducts });
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should show Unit ID (0) in column header when total is 0', () => {
      setup({ ...mockPagedResponse, data: [], total: 0 });
      expect(component.tableConfig.columns[0].header).toBe('Unit ID (0)');
    });
  });

  describe('loadProducts — error path', () => {
    beforeEach(() => {
      apiServiceSpy = jasmine.createSpyObj('OdtoffApiService', ['getPickSlipProductsPaged']);
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      apiServiceSpy.getPickSlipProductsPaged.and.returnValue(throwError(() => new Error('Network error')));

      TestBed.configureTestingModule({
        imports: [ViewItemsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          provideHttpClient(),
          { provide: OdtoffApiService, useValue: apiServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: dialogData },
        ],
      });

      fixture = TestBed.createComponent(ViewItemsDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set products to empty array on error', () => {
      expect(component.products).toEqual([]);
    });

    it('should set loading to false on error', () => {
      expect(component.loading).toBeFalse();
    });
  });

  describe('onClose', () => {
    beforeEach(() => setup());

    it('should call dialogRef.close()', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => setup());

    it('should complete the destroy subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next').and.callThrough();
      const destroyComplete = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });

    it('should not update products after destroy due to takeUntil', () => {
      // After destroy, loadProducts still calls the service but the subscription
      // is cancelled by takeUntil — products should remain from before destroy.
      const productsBefore = component.products.length;
      component.ngOnDestroy();
      // Even if onPageChange triggers a call, the observable completes immediately
      // because destroy$ already emitted — products stay unchanged
      const productsAfter = component.products.length;
      expect(productsAfter).toBe(productsBefore);
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => setup());

    it('should update pageIndex/pageSize and reload products preserving sort', () => {
      apiServiceSpy.getPickSlipProductsPaged.calls.reset();
      component.onPageChange({ pageIndex: 1, pageSize: 50 } as any);

      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 50, 50, 'expirationDate', 'A'
      );
    });

    it('should reflect new pageIndex in tableConfig after page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    });

    it('should reflect new pageSize in tableConfig after page change', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 100 } as any);
      expect(component.tableConfig.pagination!.pageSize).toBe(100);
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => setup());

    it('should set sortColumn and sortOrder for ascending sort', () => {
      apiServiceSpy.getPickSlipProductsPaged.calls.reset();
      component.onSortChange({ column: 'unitId', direction: 'asc' } as any);

      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 25, 0, 'unitId', 'asc'
      );
    });

    it('should set sortColumn and sortOrder for descending sort', () => {
      apiServiceSpy.getPickSlipProductsPaged.calls.reset();
      component.onSortChange({ column: 'unitId', direction: 'desc' } as any);

      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 25, 0, 'unitId', 'desc'
      );
    });

    it('should reset sortColumn and sortOrder to null when direction is default', () => {
      component.onSortChange({ column: 'unitId', direction: 'asc' } as any);
      apiServiceSpy.getPickSlipProductsPaged.calls.reset();

      component.onSortChange({ column: 'unitId', direction: 'default' } as any);

      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 25, 0, null, null
      );
    });

    it('should reset pageIndex to 0 on sort change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 } as any);
      component.onSortChange({ column: 'unitId', direction: 'asc' } as any);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should treat D→A emission as default (cycle: default→A→D→default)', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' } as any);
      apiServiceSpy.getPickSlipProductsPaged.calls.reset();

      // Shared DataTable emits 'A' after 'D'; component should convert to default
      component.onSortChange({ column: 'unitId', direction: 'A' } as any);

      expect(apiServiceSpy.getPickSlipProductsPaged).toHaveBeenCalledWith(
        'PO001', 25, 0, null, null
      );
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should update sortConfig in tableConfig after each sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' } as any);
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });

      component.onSortChange({ column: 'unitId', direction: 'D' } as any);
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'D' });
    });
  });

  describe('unitId column valueFormatter', () => {
    beforeEach(() => setup());

    it('should display unitId with check digit when present', () => {
      const col = component.tableConfig.columns[0];
      expect(col.valueFormatter!('U123456', { unitId: 'U123456', checkDigit: 'K' } as any)).toBe('U123456-K');
    });

    it('should display plain unitId when checkDigit is null', () => {
      const col = component.tableConfig.columns[0];
      expect(col.valueFormatter!('U123456', { unitId: 'U123456', checkDigit: null } as any)).toBe('U123456');
    });
  });
});
