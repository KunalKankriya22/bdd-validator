import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { ProductCodeViewComponent } from './product-code-view';
import { ProductCodesService } from '../services/product-codes.service';
import { ProductCode, ProductAttribute } from '../models/product-codes.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { DataTable } from '@shared/components/data-table/data-table';
import { AddEditProductDialogComponent } from '../add-edit-product-dialog/add-edit-product-dialog';
import { PageHeaderWithBreadcrumbStub, DataTableStub } from '@shared/testing/component-stubs';

@Component({ selector: 'app-add-edit-product-dialog', template: '', standalone: true })
class AddEditProductDialogStub {
  @Input() mode: any;
  @Input() product: any;
  @Output() close = new EventEmitter<any>();
}

describe('ProductCodeViewComponent', () => {
  let component: ProductCodeViewComponent;
  let fixture: ComponentFixture<ProductCodeViewComponent>;
  let service: jasmine.SpyObj<ProductCodesService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let activatedRouteStub: any;

  const mockProduct: ProductCode = {
    productCode: '00161',
    productShortName: 'CPDA WB LV',
    productDesc: 'CPDA1 Whole Blood, Low Volume',
    productType: 'WB',
    productFormula: null as any,
    productClass: 'WB',
    classDesc: 'Whole Blood',
    modifierCode: 'A',
    modifierDesc: 'Standard',
    effDate: '2000-02-23',
    termDate: null,
    cellCountFlag: 'Y',
    poolProductCode: 'N'
  };

  const mockAttributes: ProductAttribute[] = [
    {
      attributeGroup: 'ABO',
      attributeGroupDescription: 'ABO Blood Group',
      attributeCode: 'A',
      attributeDescription: 'Type A'
    },
    {
      attributeGroup: 'RH',
      attributeGroupDescription: 'Rh Factor',
      attributeCode: 'POS',
      attributeDescription: 'Positive'
    }
  ];

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('ProductCodesService', [
      'getProductCodeById',
      'getProductAttributes'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    activatedRouteStub = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('00161')
        }
      }
    };

    TestBed.configureTestingModule({
      imports: [
        ProductCodeViewComponent,
        NoopAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).overrideComponent(ProductCodeViewComponent, {
      remove: {
        imports: [
          PageHeaderWithBreadcrumb,
          DataTable,
          AddEditProductDialogComponent
        ]
      },
      add: {
        imports: [
          PageHeaderWithBreadcrumbStub,
          DataTableStub,
          AddEditProductDialogStub
        ]
      }
    });

    service = TestBed.inject(ProductCodesService) as jasmine.SpyObj<ProductCodesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    service.getProductCodeById.and.returnValue(of(mockProduct));
    service.getProductAttributes.and.returnValue(of(mockAttributes));
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ProductCodeViewComponent);
    component = fixture.componentInstance;
  }

  describe('Component Creation', () => {
    it('should create the component', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      createComponent();
      expect(component.product).toBeNull();
      expect(component.productAttributes).toEqual([]);
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should have attributes table config with correct columns', () => {
      createComponent();
      expect(component.attributesTableConfig.columns.length).toBe(4);
      expect(component.attributesTableConfig.columns[0].key).toBe('attributeGroup');
      expect(component.attributesTableConfig.sortConfig?.column).toBe('attributeGroup');
      expect(component.attributesTableConfig.stickyHeader).toBeTrue();
      expect(component.attributesTableConfig.emptyMessage).toBe('No attributes found');
    });

    it('should have header config with breadcrumbs', () => {
      createComponent();
      expect(component.headerConfig.breadcrumbs?.length).toBe(3);
      expect(component.headerConfig.showBackButton).toBeTrue();
    });
  });

  describe('ngOnInit', () => {
    it('should load product when productCode exists in route params', () => {
      createComponent();
      fixture.detectChanges();

      expect(service.getProductCodeById).toHaveBeenCalledWith('00161');
      expect(component.product).toEqual(mockProduct);
    });

    it('should load product attributes after product is loaded', () => {
      createComponent();
      fixture.detectChanges();

      expect(service.getProductAttributes).toHaveBeenCalledWith('00161');
      expect(component.productAttributes).toEqual(mockAttributes);
    });

    it('should not load product when productCode is null', () => {
      activatedRouteStub.snapshot.paramMap.get.and.returnValue(null);
      createComponent();
      fixture.detectChanges();

      expect(service.getProductCodeById).not.toHaveBeenCalled();
      expect(component.product).toBeNull();
    });
  });

  describe('loadProduct', () => {
    it('should set product and update header on success', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.product).toEqual(mockProduct);
      expect(component.headerConfig.title).toBe('CPDA1 Whole Blood, Low Volume');
      expect(component.headerConfig.subtitle).toBe('00161 | -');
    });

    it('should update header subtitle with formula when present', () => {
      const productWithFormula = {
        ...mockProduct,
        productFormula: 'V0001023-V0012003'
      };
      service.getProductCodeById.and.returnValue(of(productWithFormula));

      createComponent();
      fixture.detectChanges();

      expect(component.headerConfig.subtitle).toBe('00161 | V0001023-V0012003');
    });

    it('should show snackbar and navigate on error', () => {
      service.getProductCodeById.and.returnValue(throwError(() => new Error('Server error')));

      createComponent();
      fixture.detectChanges();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to load product details. Please try again.',
        'Close',
        { duration: 5000, panelClass: 'error-snackbar' }
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/product-codes'
      ]);
    });
  });

  describe('loadProductAttributes', () => {
    it('should set productAttributes on success', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.productAttributes).toEqual(mockAttributes);
    });

    it('should handle error when loading attributes fails', () => {
      service.getProductAttributes.and.returnValue(throwError(() => new Error('Attributes error')));
      spyOn(console, 'error');

      createComponent();
      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith(
        'Error loading product attributes:',
        jasmine.any(Error)
      );
    });
  });

  describe('updateHeader', () => {
    it('should update breadcrumbs with product description', () => {
      createComponent();
      fixture.detectChanges();

      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs?.[0]).toEqual({ label: 'Home', link: '/home' });
      expect(breadcrumbs?.[1]).toEqual({
        label: 'Product Codes',
        link: '/laboratory-functions/component-production/component-administration/product-codes'
      });
      expect(breadcrumbs?.[2]).toEqual({
        label: 'CPDA1 Whole Blood, Low Volume',
        link: null
      });
    });

    it('should use "Product Details" as fallback breadcrumb label when productDesc is empty', () => {
      const productNoDesc = { ...mockProduct, productDesc: '' };
      service.getProductCodeById.and.returnValue(of(productNoDesc));

      createComponent();
      fixture.detectChanges();

      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs?.[2]?.label).toBe('Product Details');
    });

    it('should use empty string for title when productDesc is empty', () => {
      const productNoDesc = { ...mockProduct, productDesc: '' };
      service.getProductCodeById.and.returnValue(of(productNoDesc));

      createComponent();
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('');
    });

    it('should use dash for formula in subtitle when productFormula is null', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.headerConfig.subtitle).toContain('| -');
    });
  });

  describe('onBackClick', () => {
    it('should navigate to product codes list', () => {
      createComponent();
      component.onBackClick();

      expect(router.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/product-codes'
      ]);
    });
  });

  describe('onEditClick', () => {
    it('should open the side panel', () => {
      createComponent();
      expect(component.sidePanelOpen).toBeFalse();

      component.onEditClick();

      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('onDialogClosed', () => {
    it('should close side panel and reload product on success', () => {
      createComponent();
      fixture.detectChanges();
      component.sidePanelOpen = true;

      service.getProductCodeById.calls.reset();
      service.getProductAttributes.calls.reset();

      component.onDialogClosed({ success: true });

      expect(component.sidePanelOpen).toBeFalse();
      expect(service.getProductCodeById).toHaveBeenCalledWith('00161');
    });

    it('should close side panel without reloading on failure', () => {
      createComponent();
      fixture.detectChanges();
      component.sidePanelOpen = true;

      service.getProductCodeById.calls.reset();

      component.onDialogClosed({ success: false });

      expect(component.sidePanelOpen).toBeFalse();
      expect(service.getProductCodeById).not.toHaveBeenCalled();
    });

    it('should handle null result gracefully', () => {
      createComponent();
      fixture.detectChanges();
      component.sidePanelOpen = true;

      service.getProductCodeById.calls.reset();

      component.onDialogClosed(null as any);

      expect(component.sidePanelOpen).toBeFalse();
      expect(service.getProductCodeById).not.toHaveBeenCalled();
    });

    it('should not reload when productCode is null in route', () => {
      activatedRouteStub.snapshot.paramMap.get.and.returnValue(null);
      createComponent();
      component.sidePanelOpen = true;

      service.getProductCodeById.calls.reset();

      component.onDialogClosed({ success: true });

      expect(component.sidePanelOpen).toBeFalse();
      expect(service.getProductCodeById).not.toHaveBeenCalled();
    });
  });

  describe('getProductClassDescription', () => {
    it('should return classDesc from product', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.getProductClassDescription()).toBe('Whole Blood');
    });

    it('should return empty string when product is null', () => {
      createComponent();
      expect(component.getProductClassDescription()).toBe('');
    });

    it('should return empty string when classDesc is undefined', () => {
      const productNoClassDesc = { ...mockProduct, classDesc: undefined };
      service.getProductCodeById.and.returnValue(of(productNoClassDesc));

      createComponent();
      fixture.detectChanges();

      expect(component.getProductClassDescription()).toBe('');
    });
  });

  describe('getModifierDescription', () => {
    it('should return modifierDesc from product', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.getModifierDescription()).toBe('Standard');
    });

    it('should return empty string when product is null', () => {
      createComponent();
      expect(component.getModifierDescription()).toBe('');
    });

    it('should return empty string when modifierDesc is undefined', () => {
      const productNoModDesc = { ...mockProduct, modifierDesc: undefined };
      service.getProductCodeById.and.returnValue(of(productNoModDesc));

      createComponent();
      fixture.detectChanges();

      expect(component.getModifierDescription()).toBe('');
    });
  });

  describe('getCellCountFlagDisplay', () => {
    it('should return "Yes" for flag "Y"', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.getCellCountFlagDisplay()).toBe('Yes');
    });

    it('should return "No" for flag "N"', () => {
      const productN = { ...mockProduct, cellCountFlag: 'N' };
      service.getProductCodeById.and.returnValue(of(productN));
      createComponent();
      fixture.detectChanges();

      expect(component.getCellCountFlagDisplay()).toBe('No');
    });

    it('should return "O" for flag "O"', () => {
      const productO = { ...mockProduct, cellCountFlag: 'O' };
      service.getProductCodeById.and.returnValue(of(productO));
      createComponent();
      fixture.detectChanges();

      expect(component.getCellCountFlagDisplay()).toBe('O');
    });

    it('should return "-" for undefined flag', () => {
      const productUndefined = { ...mockProduct, cellCountFlag: undefined };
      service.getProductCodeById.and.returnValue(of(productUndefined));
      createComponent();
      fixture.detectChanges();

      expect(component.getCellCountFlagDisplay()).toBe('-');
    });

    it('should return "-" when product is null', () => {
      createComponent();
      expect(component.getCellCountFlagDisplay()).toBe('-');
    });
  });

  describe('getPoolProductCodeDisplay', () => {
    it('should return "No" for code "N"', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.getPoolProductCodeDisplay()).toBe('No');
    });

    it('should return "Yes" for code "Y"', () => {
      const productY = { ...mockProduct, poolProductCode: 'Y' };
      service.getProductCodeById.and.returnValue(of(productY));
      createComponent();
      fixture.detectChanges();

      expect(component.getPoolProductCodeDisplay()).toBe('Yes');
    });

    it('should return the code itself for other values', () => {
      const productOther = { ...mockProduct, poolProductCode: 'ABC' };
      service.getProductCodeById.and.returnValue(of(productOther));
      createComponent();
      fixture.detectChanges();

      expect(component.getPoolProductCodeDisplay()).toBe('ABC');
    });

    it('should return "-" for undefined code', () => {
      const productUndefined = { ...mockProduct, poolProductCode: undefined };
      service.getProductCodeById.and.returnValue(of(productUndefined));
      createComponent();
      fixture.detectChanges();

      expect(component.getPoolProductCodeDisplay()).toBe('-');
    });

    it('should return "-" when product is null', () => {
      createComponent();
      expect(component.getPoolProductCodeDisplay()).toBe('-');
    });

    it('should return "-" for empty string code', () => {
      const productEmpty = { ...mockProduct, poolProductCode: '' };
      service.getProductCodeById.and.returnValue(of(productEmpty));
      createComponent();
      fixture.detectChanges();

      expect(component.getPoolProductCodeDisplay()).toBe('-');
    });
  });

  describe('onAttributesSortChange', () => {
    beforeEach(() => {
      createComponent();
      fixture.detectChanges();
    });

    it('should update sort config with new column and direction', () => {
      component.onAttributesSortChange({ column: 'attributeGroup', direction: 'A' });

      expect(component.attributesTableConfig.sortConfig).toEqual({
        column: 'attributeGroup',
        direction: 'A'
      });
    });

    it('should sort attributes ascending', () => {
      component.productAttributes = [
        { attributeGroup: 'RH', attributeGroupDescription: 'Rh Factor', attributeCode: 'POS', attributeDescription: 'Positive' },
        { attributeGroup: 'ABO', attributeGroupDescription: 'ABO Group', attributeCode: 'A', attributeDescription: 'Type A' }
      ];

      component.onAttributesSortChange({ column: 'attributeGroup', direction: 'A' });

      expect(component.productAttributes[0].attributeGroup).toBe('ABO');
      expect(component.productAttributes[1].attributeGroup).toBe('RH');
    });

    it('should sort attributes descending', () => {
      component.productAttributes = [
        { attributeGroup: 'ABO', attributeGroupDescription: 'ABO Group', attributeCode: 'A', attributeDescription: 'Type A' },
        { attributeGroup: 'RH', attributeGroupDescription: 'Rh Factor', attributeCode: 'POS', attributeDescription: 'Positive' }
      ];

      component.onAttributesSortChange({ column: 'attributeGroup', direction: 'D' });

      expect(component.productAttributes[0].attributeGroup).toBe('RH');
      expect(component.productAttributes[1].attributeGroup).toBe('ABO');
    });

    it('should reload attributes when direction is default', () => {
      service.getProductAttributes.calls.reset();

      component.onAttributesSortChange({ column: 'attributeGroup', direction: 'default' });

      expect(service.getProductAttributes).toHaveBeenCalledWith('00161');
    });

    it('should handle sorting with empty attribute values', () => {
      component.productAttributes = [
        { attributeGroup: '', attributeGroupDescription: 'Empty', attributeCode: 'E', attributeDescription: 'Empty Group' },
        { attributeGroup: 'ABO', attributeGroupDescription: 'ABO Group', attributeCode: 'A', attributeDescription: 'Type A' }
      ];

      component.onAttributesSortChange({ column: 'attributeGroup', direction: 'A' });

      expect(component.productAttributes[0].attributeGroup).toBe('');
      expect(component.productAttributes[1].attributeGroup).toBe('ABO');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      createComponent();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('headerConfig.onBackClick callback', () => {
    it('should trigger navigation when header back button callback is invoked', () => {
      createComponent();
      component.headerConfig.onBackClick?.();

      expect(router.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/product-codes'
      ]);
    });
  });
});
