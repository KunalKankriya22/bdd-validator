import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { AvailableProductsQuery } from './available-products-query';
import { AvailableProductsQueryService } from './services/available-products-query.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { provideRouter } from '@angular/router';

const mockProduct = {
  unitId: 'U001',
  checkDigit: '3',
  productCode: 'E0070',
  aliquot: '01',
  bloodType: 'O+',
  bloodTypeDesc: 'O Positive',
  expDate: '2026-06-15T14:30:00',
  collDate: '2026-06-01T10:00:00',
  daysToExpiration: 1,
  warehouseId: 'WH01',
  inventoryClass: 'BLD',
  productType: 'RBC',
};

const mockLookupsResponse = {
  success: true,
  message: 'OK',
  statusCode: 200,
  item: {
    warehouses: [{ code: 'WH01', description: 'Warehouse 1' }],
    inventoryClasses: [{ code: 'BLD', description: 'Blood' }],
    productTypes: [{ code: 'RBC', description: 'Red Blood Cells' }],
    productCodes: [],
    bloodTypes: [{ code: 'O+', description: 'O Positive' }],
    attributeGroups: [{ code: 'CMV', description: 'CMV Status' }],
    attributeCodes: [],
  },
};

const mockProductCodesResponse = {
  success: true,
  message: 'OK',
  statusCode: 200,
  data: [{ code: 'E0070', description: 'Packed RBC' }],
  total: 1,
};

const mockQueryResponse = {
  success: true,
  message: 'OK',
  statusCode: 200,
  data: [mockProduct],
  total: 1,
};

const mockAntigensResponse = {
  success: true,
  message: 'OK',
  statusCode: 200,
  data: [{ antigenCode: 'C', antigenDescription: 'C antigen', result: 'POS' }],
  total: 1,
};

describe('AvailableProductsQuery', () => {
  let component: AvailableProductsQuery;
  let fixture: ComponentFixture<AvailableProductsQuery>;
  let serviceSpy: jasmine.SpyObj<AvailableProductsQueryService>;

  const mockHeaderService = {
    getCurrentChapterId: () => 'CH01',
  };

  const mockMenuService = {
    getMenuItemsSignal: () => signal([]),
    findMenuItemByPath: () => null,
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AvailableProductsQueryService', [
      'getLookups',
      'getProductCodes',
      'getAttributeCodes',
      'queryProducts',
      'getProductAntigens',
      'getProductAttributes',
    ]);
    serviceSpy.getLookups.and.returnValue(of(mockLookupsResponse));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));
    serviceSpy.getAttributeCodes.and.returnValue(of(mockProductCodesResponse));
    serviceSpy.queryProducts.and.returnValue(of(mockQueryResponse));
    serviceSpy.getProductAntigens.and.returnValue(of(mockAntigensResponse));
    serviceSpy.getProductAttributes.and.returnValue(of({ success: true, data: [], message: '', statusCode: 200, total: 0 }));



      TestBed.configureTestingModule({
      imports: [AvailableProductsQuery, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AvailableProductsQueryService, useValue: serviceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService },
      ],
    });


    


      serviceSpy.getLookups.calls.reset();


      serviceSpy.getProductCodes.calls.reset();


      serviceSpy.getAttributeCodes.calls.reset();


      serviceSpy.queryProducts.calls.reset();


      serviceSpy.getProductAntigens.calls.reset();


      serviceSpy.getProductAttributes.calls.reset();


      serviceSpy.getLookups.and.returnValue(of(mockLookupsResponse));


      serviceSpy.getProductCodes.and.returnValue(of(mockProductCodesResponse));


      serviceSpy.getAttributeCodes.and.returnValue(of(mockProductCodesResponse));


      serviceSpy.queryProducts.and.returnValue(of(mockQueryResponse));


      serviceSpy.getProductAntigens.and.returnValue(of(mockAntigensResponse));


      serviceSpy.getProductAttributes.and.returnValue(of({ success: true, data: [], message: '', statusCode: 200, total: 0 }));


    fixture = TestBed.createComponent(AvailableProductsQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  describe('Filter form validation', () => {
    it('should mark required fields invalid when empty on submit', () => {
      component.onSearch();

      expect(component.filterForm.get('warehouseId')?.touched).toBeTrue();
      expect(component.filterForm.get('inventoryClass')?.touched).toBeTrue();
      expect(component.filterForm.get('productType')?.touched).toBeTrue();
      expect(serviceSpy.queryProducts).not.toHaveBeenCalled();
    });



    it('should execute query when all required fields are filled', () => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
      component.onSearch();
      expect(serviceSpy.queryProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          warehouseId: 'WH01',
          inventoryClass: 'BLD',
          productType: 'RBC',
        }),
        25, // pageSize
        0,  // skip
      );
    });
  });

  describe('Query execution', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
    });

    it('should populate products on successful query', () => {
      component.onSearch();
      expect(component.products.length).toBe(1);
      expect(component.totalRecords).toBe(1);
      expect(component.hasSearched).toBeTrue();
    });

    it('should set hasSearched to true after search', () => {
      expect(component.hasSearched).toBeFalse();
      component.onSearch();
      expect(component.hasSearched).toBeTrue();
    });




  });

  describe('Server validation errors', () => {
    it('should apply server error to warehouseId field for error code 0350', () => {
      component.filterForm.patchValue({
        warehouseId: 'INVALID',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({
          error: { errors: [{ errorCode: '0350', field: 'warehouseId' }] },
        })),
      );

      component.onSearch();

      const control = component.filterForm.get('warehouseId');
      expect(control?.hasError('serverError')).toBeTrue();
      expect(control?.getError('serverError')).toContain('0350');
    });
  });

  describe('Row selection', () => {
    it('should select product and load antigens on row click', () => {
      component.onRowSelect(mockProduct);

      expect(component.selectedProduct).toEqual(mockProduct);
      expect(serviceSpy.getProductAntigens).toHaveBeenCalledWith('U001');
    });



    it('should update selection when a different row is clicked', () => {
      const anotherProduct = { ...mockProduct, unitId: 'U002' };
      component.onRowSelect(mockProduct);
      component.onRowSelect(anotherProduct);
      expect(component.selectedProduct?.unitId).toBe('U002');
      expect(serviceSpy.getProductAntigens).toHaveBeenCalledWith('U002');
    });

    it('isSelected should return true for selected product', () => {
      component.selectedProduct = mockProduct;
      expect(component.isSelected(mockProduct)).toBeTrue();
    });

    it('isSelected should return false for non-selected product', () => {
      component.selectedProduct = mockProduct;
      const other = { ...mockProduct, unitId: 'U002' };
      expect(component.isSelected(other)).toBeFalse();
    });
  });

  describe('Clear', () => {
    it('should reset all state when onClear is called', () => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
      component.products = [mockProduct];
      component.totalRecords = 1;
      component.hasSearched = true;
      component.selectedProduct = mockProduct;
      component.antigens = [{ antigenCode: 'C', antigenDescription: 'C', result: 'POS' }];

      component.onClear();

      expect(component.filterForm.value.warehouseId).toBe('');
      expect(component.products).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.hasSearched).toBeFalse();
      expect(component.selectedProduct).toBeNull();
      expect(component.antigens).toEqual([]);
    });
  });

  describe('hasAnyFieldValue', () => {
    it('should return false when all fields are empty', () => {
      component.filterForm.reset({
        warehouseId: '',
        inventoryClass: '',
        productType: '',
        productCode: '',
        bloodType: '',
        attributeGroup: '',
        attributeCode: '',
      });
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when warehouseId has a value', () => {
      component.filterForm.patchValue({ warehouseId: 'WH01' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when any optional field has a value', () => {
      component.filterForm.reset({
        warehouseId: '',
        inventoryClass: '',
        productType: '',
        productCode: '',
        bloodType: 'O+',
        attributeGroup: '',
        attributeCode: '',
      });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('Product Code filtering by Product Type', () => {
    it('should clear product code when product type changes', () => {
      component.filterForm.patchValue({ productType: 'RBC', productCode: 'E0070' });
      component.filterForm.get('productType')?.setValue('PLT');
      expect(component.filterForm.get('productCode')?.value).toBe('');
    });

    it('should load product codes when product type is selected', () => {
      component.filterForm.get('productType')?.setValue('RBC');
      expect(serviceSpy.getProductCodes).toHaveBeenCalledWith('RBC');
    });


  });

  describe('Attribute Code filtering by Attribute Group', () => {
    it('should clear attribute code when attribute group changes', () => {
      component.filterForm.patchValue({ attributeGroup: 'CMV', attributeCode: 'NEG' });
      component.filterForm.get('attributeGroup')?.setValue('IRR');
      expect(component.filterForm.get('attributeCode')?.value).toBe('');
    });

    it('should load attribute codes when attribute group is selected', () => {
      component.filterForm.get('attributeGroup')?.setValue('CMV');
      expect(serviceSpy.getAttributeCodes).toHaveBeenCalledWith('CMV');
    });


  });
  describe('Read-only screen', () => {
    it('should not expose any add/edit/delete method', () => {
      expect((component as unknown as Record<string, unknown>)['onAdd']).toBeUndefined();
      expect((component as unknown as Record<string, unknown>)['onEdit']).toBeUndefined();
      expect((component as unknown as Record<string, unknown>)['onDelete']).toBeUndefined();
    });
  });

  describe('filterOptions (via search controls)', () => {
    it('should filter warehouse options by code (case-insensitive)', () => {
      // warehouseOptions set to [{ code: 'WH01', description: 'Warehouse 1' }] by ngOnInit
      component.warehouseSearchCtrl.setValue('wh01');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should filter warehouse options by description (case-insensitive)', () => {
      component.warehouseSearchCtrl.setValue('warehouse 1');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should return empty array when search does not match any option', () => {
      component.warehouseSearchCtrl.setValue('NOMATCH');
      expect(component.filteredWarehouses().length).toBe(0);
    });

    it('should return all options when search is cleared', () => {
      component.warehouseSearchCtrl.setValue('wh01');
      component.warehouseSearchCtrl.setValue('');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should handle options with null code gracefully', () => {
      component.warehouseOptions.set([{ code: null as unknown as string, description: 'No-code item' }]);
      component.warehouseSearchCtrl.setValue('no-code');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should handle options with null description gracefully', () => {
      component.warehouseOptions.set([{ code: 'WH99', description: null }]);
      component.warehouseSearchCtrl.setValue('wh99');
      expect(component.filteredWarehouses().length).toBe(1);
    });

    it('should filter inventoryClass options', () => {
      component.inventoryClassSearchCtrl.setValue('bld');
      expect(component.filteredInventoryClasses().length).toBe(1);
    });

    it('should filter productType options', () => {
      component.productTypeSearchCtrl.setValue('rbc');
      expect(component.filteredProductTypes().length).toBe(1);
    });

    it('should filter bloodType options', () => {
      component.bloodTypeSearchCtrl.setValue('o+');
      expect(component.filteredBloodTypes().length).toBe(1);
    });

    it('should filter attributeGroup options', () => {
      component.attributeGroupSearchCtrl.setValue('cmv');
      expect(component.filteredAttributeGroups().length).toBe(1);
    });

    it('should filter attributeCode options after they are loaded', () => {
      component.attributeCodeOptions.set([{ code: 'NEG', description: 'Negative' }]);
      component.attributeCodeSearchCtrl.setValue('neg');
      expect(component.filteredAttributeCodes().length).toBe(1);
    });

    it('should filter productCode options after they are loaded', () => {
      component.productCodeOptions.set([{ code: 'E0070', description: 'Packed RBC' }]);
      component.productCodeSearchCtrl.setValue('e0070');
      expect(component.filteredProductCodes().length).toBe(1);
    });
  });

  describe('loadLookups error handling', () => {
    it('should set isLoadingLookups to false on HTTP error', () => {
      serviceSpy.getLookups.and.returnValue(throwError(() => new Error('Network error')));
      (component as unknown as Record<string, () => void>)['loadLookups']();
      expect(component.isLoadingLookups).toBeFalse();
    });

    it('should not update options when response.success is false', () => {
      component.warehouseOptions.set([]);
      serviceSpy.getLookups.and.returnValue(
        of({ success: false, item: null as unknown as never }),
      );
      (component as unknown as Record<string, () => void>)['loadLookups']();
      expect(component.warehouseOptions()).toEqual([]);
    });
  });

  describe('loadProductCodes error handling', () => {
    it('should set isLoadingProductCodes to false on error', () => {
      serviceSpy.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as unknown as Record<string, (a: string) => void>)['loadProductCodes']('RBC');
      expect(component.isLoadingProductCodes).toBeFalse();
    });

    it('should not update productCodeOptions when response.success is false', () => {
      serviceSpy.getProductCodes.and.returnValue(
        of({ success: false, data: [], message: '', statusCode: 200, total: 0 }),
      );
      component.productCodeOptions.set([]);
      (component as unknown as Record<string, (a: string) => void>)['loadProductCodes']('RBC');
      expect(component.productCodeOptions()).toEqual([]);
    });
  });

  describe('loadAttributeCodes', () => {
    it('should set attributeCodeOptions on success', () => {
      const mockAttrResp = {
        success: true,
        data: [{ code: 'NEG', description: 'Negative' }],
        message: '',
        statusCode: 200,
        total: 1,
      };
      serviceSpy.getAttributeCodes.and.returnValue(of(mockAttrResp));
      (component as unknown as Record<string, (a: string) => void>)['loadAttributeCodes']('CMV');
      expect(component.attributeCodeOptions()).toEqual([{ code: 'NEG', description: 'Negative' }]);
    });

    it('should set isLoadingAttributeCodes to false on error', () => {
      serviceSpy.getAttributeCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as unknown as Record<string, (a: string) => void>)['loadAttributeCodes']('CMV');
      expect(component.isLoadingAttributeCodes).toBeFalse();
    });

    it('should not update attributeCodeOptions when response.success is false', () => {
      serviceSpy.getAttributeCodes.and.returnValue(
        of({ success: false, data: [], message: '', statusCode: 200, total: 0 }),
      );
      component.attributeCodeOptions.set([]);
      (component as unknown as Record<string, (a: string) => void>)['loadAttributeCodes']('CMV');
      expect(component.attributeCodeOptions()).toEqual([]);
    });
  });

  describe('loadAntigens', () => {
    it('should set antigens on successful antigen load', () => {
      component.onRowSelect(mockProduct);
      expect(component.antigens.length).toBe(1);
      expect(component.antigens[0].antigenCode).toBe('C');
      expect(component.isLoadingAntigens).toBeFalse();
    });

    it('should set isLoadingAntigens to false on error', () => {
      serviceSpy.getProductAntigens.and.returnValue(throwError(() => new Error('fail')));
      (component as unknown as Record<string, (a: string) => void>)['loadAntigens']('U001');
      expect(component.isLoadingAntigens).toBeFalse();
    });

    it('should not update antigens when response.success is false', () => {
      serviceSpy.getProductAntigens.and.returnValue(
        of({ success: false, data: [], message: '', statusCode: 200, total: 0 }),
      );
      component.antigens = [];
      (component as unknown as Record<string, (a: string) => void>)['loadAntigens']('U001');
      expect(component.antigens).toEqual([]);
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
      serviceSpy.queryProducts.calls.reset();
    });

    it('should update pageIndex, pageSize and call executeQuery', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 10, length: 100 });

      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(10);
      expect(serviceSpy.queryProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ warehouseId: 'WH01' }),
        10,
        20,
      );
    });

    it('should use skip = pageIndex * pageSize', () => {
      component.onPageChange({ pageIndex: 3, pageSize: 25, length: 200 });
      expect(serviceSpy.queryProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({}),
        25,
        75,
      );
    });
  });

  describe('onSortChange', () => {
    it('should set sortDirection to A and re-query when direction is asc', () => {
      serviceSpy.queryProducts.calls.reset();
      component.onSortChange({ active: 'unitId', direction: 'asc' });
      expect((component as unknown as { sortDirection: string }).sortDirection).toBe('A');
      expect(serviceSpy.queryProducts).toHaveBeenCalledTimes(1);
    });

    it('should set sortDirection to D and re-query when direction is desc', () => {
      serviceSpy.queryProducts.calls.reset();
      component.onSortChange({ active: 'unitId', direction: 'desc' });
      expect((component as unknown as { sortDirection: string }).sortDirection).toBe('D');
      expect(serviceSpy.queryProducts).toHaveBeenCalledTimes(1);
    });

    it('should set sortDirection to A and re-query when direction is empty string', () => {
      serviceSpy.queryProducts.calls.reset();
      component.onSortChange({ active: 'unitId', direction: '' });
      expect((component as unknown as { sortDirection: string }).sortDirection).toBe('A');
      expect(serviceSpy.queryProducts).toHaveBeenCalledTimes(1);
    });

    it('should reset pageIndex to 0 and re-query on sort change', () => {
      (component as unknown as { pageIndex: number }).pageIndex = 3;
      serviceSpy.queryProducts.calls.reset();
      component.onSortChange({ active: 'unitId', direction: 'asc' });
      expect((component as unknown as { pageIndex: number }).pageIndex).toBe(0);
      expect(serviceSpy.queryProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFieldError', () => {
    it('should return null for a field name not present in the form', () => {
      expect(component.getFieldError('nonExistentField')).toBeNull();
    });

    it('should return null when control is untouched', () => {
      expect(component.getFieldError('warehouseId')).toBeNull();
    });

    it('should return required message when control is touched and has required error', () => {
      const ctrl = component.filterForm.get('warehouseId')!;
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.getFieldError('warehouseId')).toBe('This field is required');
    });

    it('should return serverError message when control has a serverError', () => {
      const ctrl = component.filterForm.get('warehouseId')!;
      ctrl.setErrors({ serverError: 'Invalid warehouse ID (error 0350)' });
      ctrl.markAsTouched();
      expect(component.getFieldError('warehouseId')).toBe('Invalid warehouse ID (error 0350)');
    });

    it('should return null when control is touched but has no errors', () => {
      const ctrl = component.filterForm.get('warehouseId')!;
      ctrl.setValue('WH01');
      ctrl.markAsTouched();
      expect(component.getFieldError('warehouseId')).toBeNull();
    });
  });

  describe('executeQuery with optional fields', () => {
    it('should include optional fields in query request when all are set', () => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
        productCode: 'E0070',
        bloodType: 'O+',
        attributeGroup: 'CMV',
        attributeCode: 'NEG',
      });
      serviceSpy.queryProducts.calls.reset();
      component.onSearch();

      expect(serviceSpy.queryProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productCode: 'E0070',
          bloodType: 'O+',
          attributeGroup: 'CMV',
          attributeCode: 'NEG',
        }),
        25,
        0,
      );
    });

    it('should NOT include optional fields when they are empty', () => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
        productCode: '',
        bloodType: '',
        attributeGroup: '',
        attributeCode: '',
      });
      serviceSpy.queryProducts.calls.reset();
      component.onSearch();

      const callArgs = serviceSpy.queryProducts.calls.mostRecent().args[0] as Record<string, unknown>;
      expect(callArgs['productCode']).toBeUndefined();
      expect(callArgs['bloodType']).toBeUndefined();
      expect(callArgs['attributeGroup']).toBeUndefined();
      expect(callArgs['attributeCode']).toBeUndefined();
    });

    it('should not update products when queryProducts returns success=false', () => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
      component.products = [mockProduct];
      serviceSpy.queryProducts.and.returnValue(
        of({ success: false, data: [], message: '', statusCode: 200, total: 0 }),
      );
      component.onSearch();
      expect(component.products).toEqual([mockProduct]);
    });
  });

  describe('Server validation errors - additional cases', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        warehouseId: 'WH01',
        inventoryClass: 'BLD',
        productType: 'RBC',
      });
    });

    it('should do nothing when error has no errors array', () => {
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({ error: { message: 'General error' } })),
      );
      expect(() => component.onSearch()).not.toThrow();
      expect(component.filterForm.get('warehouseId')?.hasError('serverError')).toBeFalse();
    });

    it('should skip unknown error codes without throwing', () => {
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({ error: { errors: [{ errorCode: '9999' }] } })),
      );
      component.onSearch();
      expect(component.filterForm.get('warehouseId')?.hasError('serverError')).toBeFalse();
    });

    it('should apply server errors for multiple known error codes', () => {
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({
          error: {
            errors: [
              { errorCode: '5307' },
              { errorCode: '0322' },
            ],
          },
        })),
      );
      component.onSearch();
      expect(component.filterForm.get('inventoryClass')?.hasError('serverError')).toBeTrue();
      expect(component.filterForm.get('productType')?.hasError('serverError')).toBeTrue();
    });

    it('should apply server errors for blood type error code 0300', () => {
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({ error: { errors: [{ errorCode: '0300' }] } })),
      );
      component.onSearch();
      expect(component.filterForm.get('bloodType')?.hasError('serverError')).toBeTrue();
    });

    it('should apply server errors for attributeGroup code 0301 and attributeCode 0305', () => {
      serviceSpy.queryProducts.and.returnValue(
        throwError(() => ({
          error: {
            errors: [{ errorCode: '0301' }, { errorCode: '0305' }],
          },
        })),
      );
      component.onSearch();
      expect(component.filterForm.get('attributeGroup')?.hasError('serverError')).toBeTrue();
      expect(component.filterForm.get('attributeCode')?.hasError('serverError')).toBeTrue();
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const nextSpy = jest.spyOn((component as unknown as Record<string, unknown>)['destroy$'] as { next: () => void }, 'next');
      const completeSpy = jest.spyOn((component as unknown as Record<string, unknown>)['destroy$'] as { complete: () => void }, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
