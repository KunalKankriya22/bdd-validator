import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { DiscardProductsDialogComponent, DiscardProductsDialogData } from './discard-products-dialog';
import { PackLabDiscardsService } from '../../services/pack-lab-discards.service';
import { AvailableProduct } from '../../models/pack-lab-discards.model';

const mockProducts: AvailableProduct[] = [
  { unitId: 'UNIT001', collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', systemLabelDecision: 'O+' },
  { unitId: 'UNIT002', collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', systemLabelDecision: 'A-' },
];

describe('DiscardProductsDialogComponent', () => {
  let component: DiscardProductsDialogComponent;
  let fixture: ComponentFixture<DiscardProductsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DiscardProductsDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<PackLabDiscardsService>;

  function setup(
    data: DiscardProductsDialogData = { productType: 'PLT', discardType: 'NFT' },
    productsOrError: AvailableProduct[] | 'error' = mockProducts
  ) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('PackLabDiscardsService', ['getAvailableProducts']);

    if (productsOrError === 'error') {
      serviceSpy.getAvailableProducts.and.returnValue(throwError(() => new Error('load error')));
    } else {
      serviceSpy.getAvailableProducts.and.returnValue(of(productsOrError));
    }

    TestBed.configureTestingModule({
      imports: [DiscardProductsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: PackLabDiscardsService, useValue: serviceSpy },
      ],
    });

    fixture = TestBed.createComponent(DiscardProductsDialogComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization', () => {
    it('should create the component', () => {
      setup();
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start with loading = true', () => {
      setup();
      expect(component['loading']()).toBeTrue();
    });

    it('should call service with productType and discardType on ngOnInit', fakeAsync(() => {
      setup({ productType: 'PLT', discardType: 'NFT' });
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getAvailableProducts).toHaveBeenCalledWith({ productType: 'PLT', discardType: 'NFT' });
    }));

    it('should load products and set loading false on success', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component['products']()).toEqual(mockProducts);
      expect(component['loading']()).toBeFalse();
    }));

    it('should set loading false on error and keep products empty', fakeAsync(() => {
      setup({ productType: 'PLT', discardType: 'NFT' }, 'error');
      fixture.detectChanges();
      tick();
      expect(component['loading']()).toBeFalse();
      expect(component['products']()).toEqual([]);
    }));

    it('should handle undefined productType and discardType', fakeAsync(() => {
      setup({});
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getAvailableProducts).toHaveBeenCalledWith({ productType: undefined, discardType: undefined });
    }));

    it('should handle empty products list', fakeAsync(() => {
      setup({ productType: 'PLT', discardType: 'NFT' }, []);
      fixture.detectChanges();
      tick();
      expect(component['products']()).toEqual([]);
      expect(component['loading']()).toBeFalse();
    }));
  });

  describe('tableConfig', () => {
    it('should have all required columns defined', () => {
      setup();
      fixture.detectChanges();
      const keys = component.tableConfig().columns.map((c: any) => c.key);
      expect(keys).toContain('unitId');
      expect(keys).toContain('collDate');
      expect(keys).toContain('productType');
      expect(keys).toContain('productCode');
      expect(keys).toContain('systemLabelDecision');
    });

    it('should have showPagination set to false', () => {
      setup();
      fixture.detectChanges();
      expect(component.tableConfig().showPagination).toBeFalse();
    });

    it('should have undefined sortConfig when no sort is active', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component.tableConfig().sortConfig).toBeUndefined();
    }));

    it('should reflect sortConfig after onSortChange is called', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      const cfg = component.tableConfig();
      expect(cfg.sortConfig?.column).toBe('unitId');
      expect(cfg.sortConfig?.direction).toBe('A');
    }));
  });

  describe('sortedProducts', () => {
    it('should return products in original order when no sort is set', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component['sortedProducts']()).toEqual(mockProducts);
    }));

    it('should sort ascending by unitId when direction is A', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      const sorted = component['sortedProducts']();
      expect(sorted[0].unitId).toBe('UNIT001');
      expect(sorted[1].unitId).toBe('UNIT002');
    }));

    it('should sort descending by unitId when direction is D', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'D' });
      const sorted = component['sortedProducts']();
      expect(sorted[0].unitId).toBe('UNIT002');
      expect(sorted[1].unitId).toBe('UNIT001');
    }));

    it('should return original order when direction is default', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'default' });
      expect(component['sortedProducts']()).toEqual(mockProducts);
    }));

    it('should not mutate the original products array', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      const original = [...component['products']()];
      component['onSortChange']({ column: 'unitId', direction: 'D' });
      expect(component['products']()).toEqual(original);
    }));

    it('should handle null unitId in sort comparison (first item null)', fakeAsync(() => {
      const productsWithNull: AvailableProduct[] = [
        { unitId: null as any, collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', systemLabelDecision: 'O+' },
        { unitId: 'UNIT002', collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', systemLabelDecision: 'A-' },
      ];
      setup({ productType: 'PLT', discardType: 'NFT' }, productsWithNull);
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'A' });
      const sorted = component['sortedProducts']();
      expect(sorted.length).toBe(2);
      expect(sorted[0].unitId).toBeNull();
      expect(sorted[1].unitId).toBe('UNIT002');
    }));

    it('should handle null unitId in sort comparison (second item null)', fakeAsync(() => {
      const productsNullSecond: AvailableProduct[] = [
        { unitId: 'UNIT001', collDate: '2024-06-01', productType: 'PLT', productCode: 'PROD001', systemLabelDecision: 'O+' },
        { unitId: null as any, collDate: '2024-06-02', productType: 'RBC', productCode: 'PROD002', systemLabelDecision: 'A-' },
      ];
      setup({ productType: 'PLT', discardType: 'NFT' }, productsNullSecond);
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'unitId', direction: 'D' });
      const sorted = component['sortedProducts']();
      expect(sorted.length).toBe(2);
      expect(sorted[0].unitId).toBe('UNIT001');
      expect(sorted[1].unitId).toBeNull();
    }));
  });

  describe('onSortChange', () => {
    it('should update currentSort signal', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onSortChange']({ column: 'productCode', direction: 'D' });
      expect(component['currentSort']()).toEqual({ column: 'productCode', direction: 'D' });
    }));
  });

  describe('onClose', () => {
    it('should call dialogRef.close()', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component['onClose']();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    }));
  });
});
