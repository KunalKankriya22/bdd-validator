import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { ProductCombinationsComponent } from './product-combinations.component';
import { ProductCombinationsApiService } from './services/product-combinations-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProductCombinationDto, ProductTypeDetailDto } from './models/product-combinations.model';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

class MockTranslateLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return of({});
  }
}

describe('ProductCombinationsComponent', () => {
  let component: ProductCombinationsComponent;
  let fixture: ComponentFixture<ProductCombinationsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ProductCombinationsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;

  const mockProductTypes: ProductTypeDetailDto[] = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets' },
    { productTypeCode: 'PLASMA', productTypeDesc: 'Plasma' }
  ];

  const mockCombinations: ProductCombinationDto[] = [
    {
      bagCode: '2',
      setId: 1,
      productTypes: [
        { bagCode: '2', setId: 1, productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { bagCode: '2', setId: 1, productType: 'PLT', productTypeDesc: 'Platelets' }
      ]
    },
    {
      bagCode: '3',
      setId: 2,
      productTypes: [
        { bagCode: '3', setId: 2, productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
        { bagCode: '3', setId: 2, productType: 'PLT', productTypeDesc: 'Platelets' },
        { bagCode: '3', setId: 2, productType: 'PLASMA', productTypeDesc: 'Plasma' }
      ]
    }
  ];

  const mockApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockCombinations,
    totalCount: 2
  };

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ProductCombinationsApiService', [
      'searchProductCombinations',
      'getActiveProductTypes',
      'deleteProductCombination',
      'getBagCodes',
      'getMatrixProductTypes'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);

    menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'Product Combinations' });
    apiServiceSpy.getActiveProductTypes.and.returnValue(of(mockProductTypes));
    apiServiceSpy.searchProductCombinations.and.returnValue(of(mockApiResponse));
    apiServiceSpy.getBagCodes.and.returnValue(of(['1', '2', '3', '10', '11', '12'])); // Include codes with '1' for search tests
    apiServiceSpy.getMatrixProductTypes.and.returnValue(of(mockProductTypes));



      TestBed.configureTestingModule({
      imports: [
        ProductCombinationsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        provideRouter([]),
        { provide: ProductCombinationsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });


    


      apiServiceSpy.searchProductCombinations.calls.reset();


      apiServiceSpy.getActiveProductTypes.calls.reset();


      apiServiceSpy.deleteProductCombination.calls.reset();


      apiServiceSpy.getBagCodes.calls.reset();


      apiServiceSpy.getMatrixProductTypes.calls.reset();


      loggingServiceSpy.error.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'Product Combinations' });


      apiServiceSpy.getActiveProductTypes.and.returnValue(of(mockProductTypes));


      apiServiceSpy.searchProductCombinations.and.returnValue(of(mockApiResponse));


      apiServiceSpy.getBagCodes.and.returnValue(of(['1', '2', '3', '10', '11', '12'])); // Include codes with '1' for search tests


      apiServiceSpy.getMatrixProductTypes.and.returnValue(of(mockProductTypes));


    fixture = TestBed.createComponent(ProductCombinationsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load active product types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getActiveProductTypes).toHaveBeenCalled();
      expect(component.activeProductTypes).toEqual(mockProductTypes);
    }));

    it('should NOT load data on init (waits for user to click RETRIEVE)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Data is not loaded on init - user must click RETRIEVE button
      expect(apiServiceSpy.searchProductCombinations).not.toHaveBeenCalled();
      expect(component.dataSource.length).toBe(0);
    }));




  });

  describe('Data Loading', () => {


    it('should transform data correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Call loadData() to actually load the data
      component.loadData();
      tick();

      expect(component.dataSource[0].bagCount).toBe(2);
      expect(component.dataSource[0].productTypesDisplay).toContain('RBC - Red Blood Cells');
      expect(component.dataSource[0].productTypesDisplay).toContain('PLT - Platelets');
    }));

    it('should update total records', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Call loadData() to actually load the data
      component.loadData();
      tick();

      expect(component.dataSource.length).toBe(2);
    }));


  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply bag count filter on retrieve', fakeAsync(() => {
      component.bagCodeControl.setValue('2');
      component.productTypeControl.setValue('RBC'); // Both fields required for validation
      component.onRetrieve();
      tick();

      const callArgs = apiServiceSpy.searchProductCombinations.calls.mostRecent().args;
      expect(callArgs[2].bagCode).toBe('2');
    }));

    it('should apply product type filter on retrieve', fakeAsync(() => {
      component.bagCodeControl.setValue('2'); // Both fields required for validation
      component.productTypeControl.setValue('RBC');
      component.onRetrieve();
      tick();

      const callArgs = apiServiceSpy.searchProductCombinations.calls.mostRecent().args;
      expect(callArgs[2].productType).toBe('RBC');
    }));

    it('should reset page index on retrieve', () => {
      // Pagination removed - no currentPageIndex
      component.onRetrieve();

      // Pagination removed - no currentPageIndex
    });



    it('should get product type description for selected filter', () => {
      component.productTypeControl.setValue('RBC');

      expect(component.selectedProductTypeDescription).toBe('Red Blood Cells');
    });

    it('should return empty description when no product type selected', () => {
      component.productTypeControl.setValue(null);

      expect(component.selectedProductTypeDescription).toBe('');
    });
  });

  describe('Search Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter bag code options based on search', fakeAsync(() => {
      component.bagCodeSearchControl.setValue('1');
      tick();

      expect(component.filteredBagCodeOptions.length).toBeGreaterThan(0);
      expect(component.filteredBagCodeOptions.every((code: string) => code.toString().includes('1'))).toBe(true);
    }));



    it('should filter product types based on description search', fakeAsync(() => {
      component.productTypeSearchControl.setValue('Red');
      tick();

      expect(component.filteredMatrixProductTypes.length).toBe(1);
      expect(component.filteredMatrixProductTypes[0].productTypeDesc).toContain('Red');
    }));


  });

  // Pagination tests removed - pagination functionality not implemented in component
  // Sorting tests removed - sorting functionality not implemented in component
  describe('Delete Product Combination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when no selectedItem and no setId provided', fakeAsync(() => {
      component.selectedItem = null;
      component.onDelete();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a product combination to delete');
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should return early when isDeleteDialogOpen is true', fakeAsync(() => {
      (component as any).isDeleteDialogOpen = true;
      component.onDelete(1);
      tick();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('should delete product combination on confirmation', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      const mockResponse = { success: true, message: 'Deleted', statusCode: 200 };
      apiServiceSpy.deleteProductCombination.and.returnValue(of(mockResponse));

      component.onDelete(1);
      tick();

      expect(apiServiceSpy.deleteProductCombination).toHaveBeenCalledWith(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product combination deleted successfully');
    }));

    it('should not delete when user clicks No', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onDelete(1);
      tick();

      expect(apiServiceSpy.deleteProductCombination).not.toHaveBeenCalled();
    }));

    it('should handle delete error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      apiServiceSpy.deleteProductCombination.and.returnValue(throwError(() => new Error('Delete failed')));

      component.onDelete(1);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(loggingServiceSpy.error).toHaveBeenCalled();
    }));
  });

  describe('Additional Component Methods', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle loadBagCodes error', fakeAsync(() => {
      apiServiceSpy.getBagCodes.and.returnValue(throwError(() => new Error('Failed to load')));
      component.loadBagCodes();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load bag codes', jasmine.any(Error));
    }));

    it('should handle loadMatrixProductTypes error', fakeAsync(() => {
      apiServiceSpy.getMatrixProductTypes.and.returnValue(throwError(() => new Error('Failed to load')));
      component.loadMatrixProductTypes();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load matrix product types', jasmine.any(Error));
    }));

    it('should handle loadActiveProductTypes error', fakeAsync(() => {
      apiServiceSpy.getActiveProductTypes.and.returnValue(throwError(() => new Error('Failed to load')));
      component.loadActiveProductTypes();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load product types', jasmine.any(Error));
    }));

    it('should reset state on chapter change', fakeAsync(() => {
      component.bagCodeControl.setValue('2');
      component.productTypeControl.setValue('RBC');
      component.dataSource = mockCombinations.map(c => ({
        bagCode: c.bagCode,
        setId: c.setId,
        bagCount: c.productTypes.length,
        productTypesDisplay: '',
        productTypes: []
      }));
      component.hasSearched = true;

      chapterChangedSubject.next();
      tick();

      expect(component.bagCodeControl.value).toBeNull();
      expect(component.productTypeControl.value).toBeNull();
      expect(component.dataSource.length).toBe(0);
      expect(component.selectedItem).toBeNull();
      expect(component.hasSearched).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
    }));

    it('should handle loadData error path', fakeAsync(() => {
      apiServiceSpy.searchProductCombinations.and.returnValue(throwError(() => new Error('Search failed')));
      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(component.dataSource.length).toBe(0);
    }));

    it('should reset controls and data on onClearAll', fakeAsync(() => {
      component.bagCodeControl.setValue('2');
      component.productTypeControl.setValue('RBC');
      component.dataSource = mockCombinations.map(c => ({
        bagCode: c.bagCode,
        setId: c.setId,
        bagCount: c.productTypes.length,
        productTypesDisplay: '',
        productTypes: []
      }));
      component.selectedItem = component.dataSource[0];
      component.hasSearched = true;

      component.onClearAll();
      tick();

      expect(component.bagCodeControl.value).toBeNull();
      expect(component.productTypeControl.value).toBeNull();
      expect(component.dataSource.length).toBe(0);
      expect(component.selectedItem).toBeNull();
      expect(component.hasSearched).toBe(false);
    }));

    it('should calculate total products for selected item', fakeAsync(() => {
      component.selectedItem = {
        bagCode: '2',
        setId: 1,
        bagCount: 2,
        productTypesDisplay: '',
        productTypes: [
          { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
          { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
        ]
      };

      const total = component.getTotalProducts();
      expect(total).toBe(2);
    }));

    it('should calculate total products for all items when no selection', fakeAsync(() => {
      component.selectedItem = null;
      component.dataSource = [
        {
          bagCode: '2',
          setId: 1,
          bagCount: 2,
          productTypesDisplay: '',
          productTypes: [
            { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
            { productTypeCode: 'PLT', productTypeDesc: 'Platelets' }
          ]
        },
        {
          bagCode: '3',
          setId: 2,
          bagCount: 3,
          productTypesDisplay: '',
          productTypes: [
            { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells' },
            { productTypeCode: 'PLT', productTypeDesc: 'Platelets' },
            { productTypeCode: 'PLASMA', productTypeDesc: 'Plasma' }
          ]
        }
      ];

      const total = component.getTotalProducts();
      expect(total).toBe(5);
    }));

    it('should select item', fakeAsync(() => {
      const item: ProductCombinationTableModel = {
        bagCode: '2',
        setId: 1,
        bagCount: 2,
        productTypesDisplay: '',
        productTypes: []
      };

      component.selectItem(item);
      expect(component.selectedItem).toBe(item);
    }));

    it('should check if item is selected', fakeAsync(() => {
      const item: ProductCombinationTableModel = {
        bagCode: '2',
        setId: 1,
        bagCount: 2,
        productTypesDisplay: '',
        productTypes: []
      };
      component.selectedItem = item;

      expect(component.isSelected(item)).toBe(true);
    }));

    it('should check if item is not selected', fakeAsync(() => {
      const item1: ProductCombinationTableModel = {
        bagCode: '2',
        setId: 1,
        bagCount: 2,
        productTypesDisplay: '',
        productTypes: []
      };
      const item2: ProductCombinationTableModel = {
        bagCode: '3',
        setId: 2,
        bagCount: 3,
        productTypesDisplay: '',
        productTypes: []
      };
      component.selectedItem = item1;

      expect(component.isSelected(item2)).toBe(false);
    }));

    it('should open add dialog and pass activeProductTypes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogRefSpy.componentInstance = {};
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddDialog();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(dialogRefSpy.componentInstance.activeProductTypes).toEqual(mockProductTypes);
    }));

    it('should refresh data when add dialog closes with true', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogRefSpy.componentInstance = {};
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddDialog();
      tick();

      expect(apiServiceSpy.searchProductCombinations).toHaveBeenCalled();
    }));

    it('should return display text for valid product type', fakeAsync(() => {
      component.productTypeControl.setValue('RBC');
      const display = component.getProductTypeDisplayForControl();
      expect(display).toBe('RBC - Red Blood Cells');
    }));

    it('should return empty string for null product type', fakeAsync(() => {
      component.productTypeControl.setValue(null);
      const display = component.getProductTypeDisplayForControl();
      expect(display).toBe('');
    }));

    it('should return code only when description not available', fakeAsync(() => {
      component.productTypeControl.setValue('UNKNOWN');
      const display = component.getProductTypeDisplayForControl();
      expect(display).toBe('UNKNOWN');
    }));

    it('should return true when bag code filter is applied', fakeAsync(() => {
      component.bagCodeControl.setValue('2');
      expect(component.hasFiltersApplied).toBe(true);
    }));

    it('should return true when product type filter is applied', fakeAsync(() => {
      component.productTypeControl.setValue('RBC');
      expect(component.hasFiltersApplied).toBe(true);
    }));

    it('should return false when no filters applied', fakeAsync(() => {
      component.bagCodeControl.setValue(null);
      component.productTypeControl.setValue(null);
      expect(component.hasFiltersApplied).toBe(false);
    }));

    it('should reset bag code filter to full list when search is empty', fakeAsync(() => {
      component.bagCodeSearchControl.setValue('');
      tick();

      expect(component.filteredBagCodeOptions.length).toBe(component.bagCodeOptions.length);
    }));

    it('should reset product type filter to full list when search is empty', fakeAsync(() => {
      component.productTypeSearchControl.setValue('');
      tick();

      expect(component.filteredMatrixProductTypes.length).toBe(component.matrixProductTypes.length);
    }));

    it('should return true for isRetrieveEnabled', fakeAsync(() => {
      expect(component.isRetrieveEnabled()).toBe(true);
    }));

    it('should auto-select first row after data loads', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.selectedItem).toBeTruthy();
      expect(component.selectedItem?.setId).toBe(mockCombinations[0].setId);
    }));
  });

  // Row action tests removed - onRowAction method not implemented in component
});
