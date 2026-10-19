import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SpProductsSpecialProcessesComponent } from './sp-products-special-processes.component';
import { SpProductsSpecialProcessesApiService } from './services/sp-products-special-processes-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ProductType, SpProductModel } from './models/sp-products-special-processes.model';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpProductsSpecialProcessesComponent', () => {
  let component: SpProductsSpecialProcessesComponent;
  let fixture: ComponentFixture<SpProductsSpecialProcessesComponent>;
  let mockApiService: jasmine.SpyObj<SpProductsSpecialProcessesApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockProcessCodes = [
    { code: 'DEGLY', name: 'Deglycerolization' },
    { code: 'FROZ', name: 'Freezing' },
  ];

  const mockProducts: SpProductModel[] = [
    {
      processCode: 'DEGLY', processDesc: 'Deglycerolization',
      productCode: 'E3102', productDesc: 'APHERESIS PLATELETS',
      attribGroup: 'VBD14', attribGroupDesc: 'VBD14',
      attribCode: 'V001', attribCodeDesc: 'APHERESIS',
      effDate: '2024-11-20', termDate: null,
      lastModifiedDate: null, programId: null
    },
    {
      processCode: 'DEGLY', processDesc: 'Deglycerolization',
      productCode: 'E0471', productDesc: 'Washed Red blood cells',
      attribGroup: '+', attribGroupDesc: '+',
      attribCode: '+02', attribCodeDesc: 'Washed',
      effDate: '2024-11-20', termDate: null,
      lastModifiedDate: null, programId: null
    },
  ];

  const mockProductsResponse = { data: mockProducts, totalRecords: 2 };

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockApiService = jasmine.createSpyObj('SpProductsSpecialProcessesApiService', [
      'getProducts',
      'getProcessCodes',
      'getProductCodes',
      'getAttributeGroups',
      'getAttributeCodes',
      'createProduct',
      'updateProduct',
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error', 'info']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });
    mockDialog = createMockMatDialog();



      TestBed.configureTestingModule({
      imports: [SpProductsSpecialProcessesComponent],
      providers: [
        { provide: SpProductsSpecialProcessesApiService, useValue: mockApiService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    });




      mockApiService.getProducts.calls.reset();


      mockApiService.getProcessCodes.calls.reset();


      mockApiService.getProductCodes.calls.reset();


      mockApiService.getAttributeGroups.calls.reset();


      mockApiService.getAttributeCodes.calls.reset();


      mockApiService.createProduct.calls.reset();


      mockApiService.updateProduct.calls.reset();


      mockLoggingService.error.calls.reset();


      mockLoggingService.info.calls.reset();


    fixture = TestBed.createComponent(SpProductsSpecialProcessesComponent);
    component = fixture.componentInstance;
    mockApiService.getProcessCodes.and.returnValue(of(mockProcessCodes));
    mockApiService.getProductCodes.and.returnValue(of([]));
    mockApiService.getProducts.and.returnValue(of(mockProductsResponse));


    });


  describe('ngOnInit', () => {
    it('should load process codes and product code options', () => {
      component.ngOnInit();

      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
      expect(mockApiService.getProductCodes).toHaveBeenCalled();
    });

    it('should auto-select first process code and load products', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.productTypes.length).toBe(2);
        expect(component.selectedProductType).toBeTruthy();
        expect(component.selectedProductType?.code).toBe('DEGLY');
        expect(mockApiService.getProducts).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should map process codes to product types correctly', () => {
      component.ngOnInit();

      expect(component.allProductTypes).toEqual([
        { code: 'DEGLY', description: 'Deglycerolization' },
        { code: 'FROZ', description: 'Freezing' },
      ]);
      expect(component.productTypes).toEqual(component.allProductTypes);
    });

    it('should set isLoadingProcessCodes to false after loading', () => {
      component.ngOnInit();

      expect(component.isLoadingProcessCodes).toBe(false);
    });

    it('should not auto-select when process codes are empty', () => {
      mockApiService.getProcessCodes.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.selectedProductType).toBeNull();
      expect(component.productTypes.length).toBe(0);
    });

    it('should not auto-select if a product type is already selected', () => {
      const preSelected: ProductType = { code: 'FROZ', description: 'Freezing' };
      component.selectedProductType = preSelected;

      component.ngOnInit();

      expect(component.selectedProductType).toBe(preSelected);
    });

    it('should store product code options on successful load', () => {
      const mockCodeOptions = [
        { code: 'E3102', name: 'APHERESIS PLATELETS' },
        { code: 'E0471', name: 'Washed Red blood cells' },
      ];
      mockApiService.getProductCodes.and.returnValue(of(mockCodeOptions));

      component.ngOnInit();

      expect(component.productCodeOptions).toEqual(mockCodeOptions);
    });

    it('should log error when loading process codes fails', () => {
      const error = new Error('Network error');
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading process codes', error);
      expect(component.isLoadingProcessCodes).toBe(false);
    });

    it('should log error when loading product code options fails', () => {
      const error = new Error('Product codes error');
      mockApiService.getProductCodes.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading product code options', error);
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset state and reload process codes on chapter change', () => {
      component.ngOnInit();
      mockApiService.getProcessCodes.calls.reset();
      mockApiService.getProducts.calls.reset();

      component.selectedProductType = { code: 'FROZ', description: 'Freezing' };
      component.filteredProducts = [...mockProducts];

      // Make getProcessCodes return empty so auto-select does not trigger
      mockApiService.getProcessCodes.and.returnValue(of([]));

      chapterChangedSubject.next();

      expect(component.selectedProductType).toBeNull();
      expect(component.filteredProducts).toEqual([]);
      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
    });

    it('should auto-select first process code after chapter change when codes exist', () => {
      component.ngOnInit();
      mockApiService.getProcessCodes.calls.reset();
      mockApiService.getProducts.calls.reset();

      chapterChangedSubject.next();

      // loadProcessCodes re-runs, auto-selects first because selectedProductType was reset to null
      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
      expect(component.selectedProductType).toEqual({ code: 'DEGLY', description: 'Deglycerolization' });
      expect(mockApiService.getProducts).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnInit();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onProductTypeSelected', () => {
    it('should select a product type and load products', () => {
      const productType: ProductType = { code: 'DEGLY', description: 'Deglycerolization' };

      component.onProductTypeSelected(productType);

      expect(component.selectedProductType).toEqual(productType);
      expect(mockApiService.getProducts).toHaveBeenCalled();
    });
  });

  describe('loadProducts', () => {
    it('should load products for selected process code', (done) => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };

      component.loadProducts();

      setTimeout(() => {
        expect(component.filteredProducts).toEqual(mockProducts);
        expect(component.isLoadingProducts).toBe(false);
        done();
      }, 100);
    });

    it('should return early if no product type is selected', () => {
      component.selectedProductType = null;

      component.loadProducts();

      expect(mockApiService.getProducts).not.toHaveBeenCalled();
    });

    it('should set isLoadingProducts to true while loading', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      mockApiService.getProducts.and.returnValue(new Subject().asObservable() as any);

      component.loadProducts();

      expect(component.isLoadingProducts).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('should include searchKeyword in params when set', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.requestState.searchKeyword = 'test';

      component.loadProducts();

      expect(mockApiService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ processCode: 'DEGLY', searchKeyword: 'test' })
      );
    });

    it('should include sort params when set', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.requestState.sortColumn = 'productCode';
      component.requestState.sortOrder = 'ASC';

      component.loadProducts();

      expect(mockApiService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ sortColumn: 'productCode', sortOrder: 'ASC' })
      );
    });

    it('should pass null for undefined optional params', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.requestState = {};

      component.loadProducts();

      expect(mockApiService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ searchKeyword: null, sortColumn: null, sortOrder: null })
      );
    });

    it('should handle error loading products', () => {
      const error = new Error('Load failed');
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      mockApiService.getProducts.and.returnValue(throwError(() => error));

      component.loadProducts();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading products', error);
      expect(component.hasError).toBe(true);
      expect(component.isLoadingProducts).toBe(false);
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    });
  });

  describe('onProductTypeSearch', () => {
    beforeEach(() => {
      component.allProductTypes = [
        { code: 'DEGLY', description: 'Deglycerolization' },
        { code: 'FROZ', description: 'Freezing' },
      ];
    });

    it('should show all when search is empty', () => {
      component.onProductTypeSearch('');

      expect(component.productTypes.length).toBe(2);
    });

    it('should filter by code (case-insensitive)', () => {
      component.onProductTypeSearch('degly');

      expect(component.productTypes.length).toBe(1);
      expect(component.productTypes[0].code).toBe('DEGLY');
    });

    it('should filter by description (case-insensitive)', () => {
      component.onProductTypeSearch('Freezing');

      expect(component.productTypes.length).toBe(1);
      expect(component.productTypes[0].code).toBe('FROZ');
    });

    it('should return empty array when no match found', () => {
      component.onProductTypeSearch('XYZ');

      expect(component.productTypes.length).toBe(0);
    });

    it('should match partial text in code', () => {
      component.onProductTypeSearch('FR');

      expect(component.productTypes.length).toBe(1);
      expect(component.productTypes[0].code).toBe('FROZ');
    });

    it('should match partial text in description', () => {
      component.onProductTypeSearch('glyc');

      expect(component.productTypes.length).toBe(1);
      expect(component.productTypes[0].description).toBe('Deglycerolization');
    });
  });

  describe('onProductSearch', () => {
    it('should set search keyword and reload products', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };

      component.onProductSearch('test');

      expect(component.requestState.searchKeyword).toBe('test');
      expect(mockApiService.getProducts).toHaveBeenCalled();
    });

    it('should set searchKeyword to null when search text is empty', () => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.requestState.searchKeyword = 'previous';

      component.onProductSearch('');

      expect(component.requestState.searchKeyword).toBeNull();
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
    });

    it('should set sort column and ASC direction', () => {
      component.onSortChange({ column: 'productCode', direction: 'A' });

      expect(component.requestState.sortColumn).toBe('productCode');
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(mockApiService.getProducts).toHaveBeenCalled();
    });

    it('should set sort column and DESC direction', () => {
      component.onSortChange({ column: 'effDate', direction: 'D' });

      expect(component.requestState.sortColumn).toBe('effDate');
      expect(component.requestState.sortOrder).toBe('DESC');
    });

    it('should set sortOrder to undefined for default direction', () => {
      component.onSortChange({ column: 'productCode', direction: 'default' });

      expect(component.requestState.sortColumn).toBe('productCode');
      expect(component.requestState.sortOrder).toBeUndefined();
    });

    it('should reload products after sort change', () => {
      component.onSortChange({ column: 'productCode', direction: 'A' });

      expect(mockApiService.getProducts).toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    it('should call onEditProduct for edit action', () => {
      const mockDialogRef = {
        componentInstance: {
          mode: '',
          data: null as any,
          productCodeOptions: [] as any[],
          save: new Subject(),
          close: new Subject(),
          saveAndCreateAnother: new Subject()
        },
        close: jasmine.createSpy('close')
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.onRowAction({ action: 'edit', row: mockProducts[0] });

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.mode).toBe('edit');
      expect(mockDialogRef.componentInstance.data).toBe(mockProducts[0]);
    });

    it('should not open dialog for non-edit action', () => {
      component.onRowAction({ action: 'delete', row: mockProducts[0] });

      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('onAddProduct', () => {
    let mockDialogRef: any;
    let saveSubject: Subject<any>;
    let saveAndCreateAnotherSubject: Subject<any>;
    let closeSubject: Subject<void>;

    beforeEach(() => {
      saveSubject = new Subject();
      saveAndCreateAnotherSubject = new Subject();
      closeSubject = new Subject();
      mockDialogRef = {
        componentInstance: {
          mode: '',
          data: null,
          productCodeOptions: [] as any[],
          save: saveSubject.asObservable(),
          saveAndCreateAnother: saveAndCreateAnotherSubject.asObservable(),
          close: closeSubject.asObservable(),
          form: { reset: jasmine.createSpy('reset') },
          isSubmitting: false,
          errorMessage: '',
          cdr: { markForCheck: jasmine.createSpy('markForCheck') }
        },
        close: jasmine.createSpy('close')
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.productCodeOptions = [{ code: 'E3102', name: 'APHERESIS PLATELETS' }];
    });

    it('should open dialog in add mode', () => {
      component.onAddProduct();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.mode).toBe('add');
    });

    it('should pass productCodeOptions to dialog', () => {
      component.onAddProduct();

      expect(mockDialogRef.componentInstance.productCodeOptions).toEqual(component.productCodeOptions);
    });

    it('should open dialog with correct config', () => {
      component.onAddProduct();

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        width: '745px',
        height: '100vh',
        disableClose: true,
        panelClass: 'side-panel-dialog',
        hasBackdrop: true,
        data: null,
        autoFocus: false
      }));
    });

    it('should close dialog when close event is emitted', () => {
      component.onAddProduct();

      closeSubject.next();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should create product and close dialog on save (not createAnother)', () => {
      mockApiService.createProduct.and.returnValue(of({}));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
        processCode: 'DEGLY',
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
      }));
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Product has been successfully added.');
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should reset form instead of closing when saveAndCreateAnother', () => {
      mockApiService.createProduct.and.returnValue(of({}));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveAndCreateAnotherSubject.next(formValue);

      expect(mockApiService.createProduct).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Product has been successfully added.');
      expect(mockDialogRef.componentInstance.form.reset).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.isSubmitting).toBe(false);
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle create error with error.error.message', () => {
      const error = { error: { message: 'Duplicate product' }, message: 'Server error' };
      mockApiService.createProduct.and.returnValue(throwError(() => error));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.isSubmitting).toBe(false);
      expect(mockDialogRef.componentInstance.errorMessage).toBe('Duplicate product');
      expect(mockDialogRef.componentInstance.cdr.markForCheck).toHaveBeenCalled();
    });

    it('should handle create error with error.message fallback', () => {
      const error = { error: {}, message: 'Server error' };
      mockApiService.createProduct.and.returnValue(throwError(() => error));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.errorMessage).toBe('Server error');
    });

    it('should handle create error with default message fallback', () => {
      const error = { error: {} };
      mockApiService.createProduct.and.returnValue(throwError(() => error));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.errorMessage).toBe('Failed to add product. Please try again.');
    });

    it('should pass null for empty attribGroup and attribCode', () => {
      mockApiService.createProduct.and.returnValue(of({}));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
        attribGroup: null,
        attribCode: null,
      }));
    });

    it('should use empty string for processCode when selectedProductType is null', () => {
      component.selectedProductType = null;
      mockApiService.createProduct.and.returnValue(of({}));
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
        processCode: '',
      }));
    });

    it('should reload products after successful save', () => {
      mockApiService.createProduct.and.returnValue(of({}));
      mockApiService.getProducts.calls.reset();
      component.onAddProduct();

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.getProducts).toHaveBeenCalled();
    });
  });

  describe('onEditProduct', () => {
    let mockDialogRef: any;
    let saveSubject: Subject<any>;
    let closeSubject: Subject<void>;

    beforeEach(() => {
      saveSubject = new Subject();
      closeSubject = new Subject();
      mockDialogRef = {
        componentInstance: {
          mode: '',
          data: null as any,
          productCodeOptions: [] as any[],
          save: saveSubject.asObservable(),
          saveAndCreateAnother: new Subject().asObservable(),
          close: closeSubject.asObservable(),
          form: { reset: jasmine.createSpy('reset') },
          isSubmitting: false,
          errorMessage: '',
          cdr: { markForCheck: jasmine.createSpy('markForCheck') }
        },
        close: jasmine.createSpy('close')
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      component.selectedProductType = { code: 'DEGLY', description: 'Deglycerolization' };
      component.productCodeOptions = [{ code: 'E3102', name: 'APHERESIS PLATELETS' }];
    });

    it('should open dialog in edit mode with row data', () => {
      component.onEditProduct(mockProducts[0]);

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialogRef.componentInstance.mode).toBe('edit');
      expect(mockDialogRef.componentInstance.data).toBe(mockProducts[0]);
    });

    it('should pass productCodeOptions to edit dialog', () => {
      component.onEditProduct(mockProducts[0]);

      expect(mockDialogRef.componentInstance.productCodeOptions).toEqual(component.productCodeOptions);
    });

    it('should close dialog when close event is emitted from edit', () => {
      component.onEditProduct(mockProducts[0]);

      closeSubject.next();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should update product on save', () => {
      mockApiService.updateProduct.and.returnValue(of({}));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.updateProduct).toHaveBeenCalledWith(
        mockProducts[0].processCode,
        mockProducts[0].productCode,
        jasmine.objectContaining({
          attribGroup: 'VBD14',
          attribCode: 'V001',
        }),
        mockProducts[0].attribGroup,
        mockProducts[0].attribCode
      );
    });

    it('should close dialog and show success after update', () => {
      mockApiService.updateProduct.and.returnValue(of({}));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Product has been successfully updated.');
    });

    it('should reload products after successful update', () => {
      mockApiService.updateProduct.and.returnValue(of({}));
      mockApiService.getProducts.calls.reset();
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.getProducts).toHaveBeenCalled();
    });

    it('should handle update error with error.error.message', () => {
      const error = { error: { message: 'Conflict detected' }, message: 'Server error' };
      mockApiService.updateProduct.and.returnValue(throwError(() => error));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: 'VBD14',
        attribCode: 'V001',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.isSubmitting).toBe(false);
      expect(mockDialogRef.componentInstance.errorMessage).toBe('Conflict detected');
      expect(mockDialogRef.componentInstance.cdr.markForCheck).toHaveBeenCalled();
    });

    it('should handle update error with error.message fallback', () => {
      const error = { error: {}, message: 'Network error' };
      mockApiService.updateProduct.and.returnValue(throwError(() => error));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.errorMessage).toBe('Network error');
    });

    it('should handle update error with default message fallback', () => {
      const error = { error: {} };
      mockApiService.updateProduct.and.returnValue(throwError(() => error));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockDialogRef.componentInstance.errorMessage).toBe('Failed to update product. Please try again.');
    });

    it('should pass null for empty attribGroup and attribCode in update payload', () => {
      mockApiService.updateProduct.and.returnValue(of({}));
      component.onEditProduct(mockProducts[0]);

      const formValue = {
        productCode: 'E3102',
        attribGroup: '',
        attribCode: '',
        effDate: null,
        termDate: null
      };
      saveSubject.next(formValue);

      expect(mockApiService.updateProduct).toHaveBeenCalledWith(
        mockProducts[0].processCode,
        mockProducts[0].productCode,
        jasmine.objectContaining({
          attribGroup: null,
          attribCode: null,
        }),
        mockProducts[0].attribGroup,
        mockProducts[0].attribCode
      );
    });
  });

  describe('searchConfig', () => {
    it('should have correct default search configuration', () => {
      expect(component.searchConfig).toEqual({
        placeholder: 'Search by process code or description',
        minLength: 1,
        ariaLabel: 'Search product types',
        searchOnEnterOnly: true
      });
    });
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      expect(component.allProductTypes).toEqual([]);
      expect(component.productTypes).toEqual([]);
      expect(component.selectedProductType).toBeNull();
      expect(component.filteredProducts).toEqual([]);
      expect(component.requestState).toEqual({});
      expect(component.productCodeOptions).toEqual([]);
      expect(component.isLoadingProducts).toBe(false);
      expect(component.isLoadingProcessCodes).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });
});
