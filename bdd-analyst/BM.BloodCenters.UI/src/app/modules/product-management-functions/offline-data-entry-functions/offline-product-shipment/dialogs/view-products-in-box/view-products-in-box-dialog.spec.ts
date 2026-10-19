import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ViewProductsInBoxDialog, ViewProductsInBoxDialogData } from './view-products-in-box-dialog';
import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { ProductInBoxDto } from '../../models/offline-product-shipment.model';

describe('ViewProductsInBoxDialog', () => {
  let component: ViewProductsInBoxDialog;
  let fixture: ComponentFixture<ViewProductsInBoxDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewProductsInBoxDialog>>;
  let apiServiceSpy: jasmine.SpyObj<OfflineProductShipmentApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ViewProductsInBoxDialogData = {
    shipmentNo: 'SH001'
  };

  const mockProducts: ProductInBoxDto[] = [
    { boxId: 'BOX001', productCode: 'RBC-01', aboRhDesc: 'O Positive', productCount: 2 },
    { boxId: 'BOX002', productCode: 'PLT-01', aboRhDesc: 'A Negative', productCount: 1 },
    { boxId: 'BOX001', productCode: 'FFP-01', aboRhDesc: 'B Positive', productCount: 3 }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('OfflineProductShipmentApiService', ['getProductsInBox']);
    apiServiceSpy.getProductsInBox.and.returnValue(of(mockProducts));
    snackbarServiceSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [ViewProductsInBoxDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: OfflineProductShipmentApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewProductsInBoxDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have a unique componentId', () => {
    fixture.detectChanges();
    expect(component['componentId']).toContain('view-products-in-box-dialog-');
  });

  it('should set shipmentNo from injected data', () => {
    fixture.detectChanges();
    expect(component['shipmentNo']).toBe('SH001');
  });

  it('should call getProductsInBox on init', () => {
    fixture.detectChanges();
    expect(apiServiceSpy.getProductsInBox).toHaveBeenCalledWith('SH001');
  });

  it('should populate products signal on successful load', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component['products']()).toEqual(mockProducts);
    expect(component['loading']()).toBeFalse();
  }));

  it('should set error signal on API failure', fakeAsync(() => {
    apiServiceSpy.getProductsInBox.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(component['error']()).toBe('Failed to load products');
    expect(component['loading']()).toBeFalse();
  }));

  it('should close dialog on onClose', () => {
    fixture.detectChanges();
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should initialize table config with 4 columns', () => {
    fixture.detectChanges();
    expect(component['tableConfig']).toBeTruthy();
    expect(component['tableConfig'].columns.length).toBe(4);
    expect(component['tableConfig'].columns.map(c => c.key)).toEqual(['boxId', 'productCode', 'aboRhDesc', 'productCount']);
  });

  it('should have boxId column as sortable', () => {
    fixture.detectChanges();
    const boxIdCol = component['tableConfig'].columns.find(c => c.key === 'boxId');
    expect(boxIdCol?.sortable).toBeTrue();
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('isEmpty should return true when products is empty', () => {
      component['products'].set([]);
      expect(component['isEmpty']()).toBeTrue();
    });

    it('isEmpty should return false when products has data', () => {
      component['products'].set(mockProducts);
      expect(component['isEmpty']()).toBeFalse();
    });

    it('isReady should be true when not loading and no error', () => {
      component['loading'].set(false);
      component['error'].set(null);
      expect(component['isReady']()).toBeTrue();
    });

    it('isReady should be false when loading', () => {
      component['loading'].set(true);
      expect(component['isReady']()).toBeFalse();
    });

    it('isReady should be false when error exists', () => {
      component['error'].set('Error');
      expect(component['isReady']()).toBeFalse();
    });
  });

  describe('onProductSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update productSort signal', () => {
      component.onProductSortChange({ column: 'productCode', direction: 'A' });
      expect(component['productSort']()).toEqual({ column: 'productCode', direction: 'A' });
    });

    it('should update tableConfig sortConfig', () => {
      component.onProductSortChange({ column: 'boxId', direction: 'D' });
      expect(component['tableConfig'].sortConfig).toEqual({ column: 'boxId', direction: 'D' });
    });
  });

  describe('sortedProducts', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['products'].set(mockProducts);
    });

    it('should return original order for default sort direction', () => {
      component['productSort'].set({ column: 'boxId', direction: 'default' });
      expect(component['sortedProducts']()).toEqual(mockProducts);
    });

    it('should sort ascending by column', () => {
      component['productSort'].set({ column: 'boxId', direction: 'A' });
      const sorted = component['sortedProducts']();
      expect(sorted[0].boxId).toBe('BOX001');
      expect(sorted[sorted.length - 1].boxId).toBe('BOX002');
    });

    it('should sort descending by column', () => {
      component['productSort'].set({ column: 'boxId', direction: 'D' });
      const sorted = component['sortedProducts']();
      expect(sorted[0].boxId).toBe('BOX002');
    });

    it('should handle null column values', () => {
      component['products'].set([
        { boxId: 'BOX001', productCode: 'RBC', aboRhDesc: null as any, productCount: 1 },
        { boxId: 'BOX002', productCode: 'PLT', aboRhDesc: 'A Pos', productCount: 2 }
      ]);
      component['productSort'].set({ column: 'aboRhDesc', direction: 'A' });
      expect(() => component['sortedProducts']()).not.toThrow();
    });

    it('should return original order when column is empty', () => {
      component['productSort'].set({ column: '', direction: 'A' });
      expect(component['sortedProducts']()).toEqual(mockProducts);
    });
  });

  it('should generate unique element IDs', () => {
    fixture.detectChanges();
    const id = component['elementId']('header');
    expect(id).toContain('view-products-in-box-dialog-');
    expect(id).toContain('-header');
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    fixture.detectChanges();
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
