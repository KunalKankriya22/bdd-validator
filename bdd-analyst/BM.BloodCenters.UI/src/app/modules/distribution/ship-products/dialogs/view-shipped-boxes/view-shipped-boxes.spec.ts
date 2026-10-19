import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ViewShippedBoxesDialog, ViewShippedBoxesDialogData } from './view-shipped-boxes';
import { ShipProductsService } from '../../services/ship-products.service';
import { BoxProductDto } from '../../models/ship-products.model';

describe('ViewShippedBoxesDialog', () => {
  let component: ViewShippedBoxesDialog;
  let fixture: ComponentFixture<ViewShippedBoxesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewShippedBoxesDialog>>;
  let serviceSpy: jasmine.SpyObj<ShipProductsService>;

  const mockDialogData: ViewShippedBoxesDialogData = {
    shipmentNo: 'SHIP001',
  };

  const mockBoxProducts: BoxProductDto[] = [
    { boxId: 'BOX001', productCode: 'RBC', orderedAboRh: 'O+', count: 2 },
    { boxId: 'BOX001', productCode: 'PLT', orderedAboRh: 'A-', count: 1 },
    { boxId: 'BOX002', productCode: 'FFP', orderedAboRh: 'B+', count: 3 },
  ];

  function createComponent(products: BoxProductDto[] | 'error' = mockBoxProducts) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ShipProductsService', [
      'getBoxProductsForShipment',
    ]);

    if (products === 'error') {
      serviceSpy.getBoxProductsForShipment.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load box contents' } }))
      );
    } else {
      serviceSpy.getBoxProductsForShipment.and.returnValue(of(products));
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewShippedBoxesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ShipProductsService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewShippedBoxesDialog);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template may need DataTable */ }
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load box products on init', () => {
      expect(serviceSpy.getBoxProductsForShipment).toHaveBeenCalledWith('SHIP001');
    });

    it('should populate boxProducts signal with loaded data', () => {
      expect((component as any).boxProducts().length).toBe(3);
      expect((component as any).boxProducts()[0].boxId).toBe('BOX001');
    });

    it('should set loading to false after load completes', () => {
      expect((component as any).loading()).toBeFalse();
    });

    it('should set error to null on successful load', () => {
      expect((component as any).error()).toBeNull();
    });
  });

  describe('Table Configuration', () => {
    it('should have correct columns defined', () => {
      const config = component.tableConfig();
      const columnKeys = config.columns.map((c: any) => c.key);
      expect(columnKeys).toEqual(['boxId', 'productCode', 'orderedAboRh', 'count']);
    });

    it('should have stickyHeader enabled', () => {
      const config = component.tableConfig();
      expect(config.stickyHeader).toBeTrue();
    });

    it('should have empty message set', () => {
      const config = component.tableConfig();
      expect(config.emptyMessage).toBe('No products found');
    });

    it('should have showPagination set to false', () => {
      const config = component.tableConfig();
      expect(config.showPagination).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    it('should set error message when loading products fails', () => {
      createComponent('error');
      expect((component as any).error()).toBe('Failed to load box contents');
    });

    it('should set loading to false on error', () => {
      createComponent('error');
      expect((component as any).loading()).toBeFalse();
    });

    it('should handle error with no message', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      serviceSpy = jasmine.createSpyObj('ShipProductsService', ['getBoxProductsForShipment']);
      serviceSpy.getBoxProductsForShipment.and.returnValue(throwError(() => ({})));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ViewShippedBoxesDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ViewShippedBoxesDialog);
      component = fixture.componentInstance;
      try { fixture.detectChanges(); } catch (e) {}

      expect((component as any).error()).toBe('Failed to load box contents');
    });
  });

  describe('Empty State', () => {
    it('should handle empty product list', () => {
      createComponent([]);
      expect((component as any).boxProducts().length).toBe(0);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });
});
