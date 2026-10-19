import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { EnterComponentInterdictionComponent } from './enter-component-interdiction';
import { ComponentInterdictionApiService } from './services/component-interdiction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { BARCODE_SCHEMES } from './models/component-interdiction.model';

describe('EnterComponentInterdictionComponent', () => {
  let component: EnterComponentInterdictionComponent;
  let fixture: ComponentFixture<EnterComponentInterdictionComponent>;
  let apiService: jasmine.SpyObj<ComponentInterdictionApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let headerServiceSpy: any;
  let menuServiceSpy: any;
  let chapterChangedSubject: Subject<void>;

  const mockUnitResponse = {
    unitId: 'ABC123456789',
    collectionDate: '2024-06-08T00:00:00Z',
    chapterId: '0001',
    hasComponents: true
  };

  const mockProducts = [
    { productCode: 'RBC01', productDescription: 'Red Blood Cells' },
    { productCode: 'PLT01', productDescription: 'Platelets' }
  ];

  const mockInterdictions = [
    { code: 'NFTH', description: 'Not For Transfusion', type: 'NFT' },
    { code: 'HOLD', description: 'Component on Hold', type: 'Hold' }
  ];

  const mockExistingInterdictions = [
    {
      unitId: 'ABC123456789',
      checkDigit: 'F',
      collectionDate: '2024-06-08T00:00:00Z',
      chapterId: '0001',
      productCode: 'RBC01',
      productDescription: 'Red Blood Cells',
      interdictionCode: 'PREV',
      interdictionDescription: 'Previously Applied',
      interdictionType: 'NFT',
      insertDate: '2024-06-01T10:00:00Z',
      interdictionUserId: 'USER001'
    }
  ];

  const mockCreateResponse = {
    unitId: 'ABC123456789',
    checkDigit: 'F',
    collectionDate: '2024-06-08T00:00:00Z',
    chapterId: '0001',
    productCode: 'RBC01',
    productDescription: 'Red Blood Cells',
    interdictionCode: 'NFTH',
    interdictionDescription: 'Not For Transfusion',
    interdictionType: 'NFT',
    insertDate: '2024-06-08T14:30:00Z',
    interdictionUserId: 'USER001'
  };

  function setValidatedUnitState(): void {
    component.formState.update(s => ({
      ...s,
      scannedUnitId: 'ABC123456789',
      unitId: 'ABC123456789',
      collectionDate: '2024-06-08T00:00:00Z',
      chapterId: '0001',
      barcodeScheme: BARCODE_SCHEMES.CODABAR,
      isUnitValidated: true
    }));
  }

  function setFullyValidatedState(): void {
    component.formState.set({
      scannedUnitId: 'ABC123456789',
      scannedProductCode: 'RBC01',
      unitId: 'ABC123456789',
      collectionDate: '2024-06-08T00:00:00Z',
      chapterId: '0001',
      productCode: 'RBC01',
      productDescription: 'Red Blood Cells',
      interdictionCode: 'NFTH',
      interdictionDescription: 'Not For Transfusion',
      interdictionType: 'NFT',
      barcodeScheme: BARCODE_SCHEMES.CODABAR,
      isUnitValidated: true,
      isProductValidated: true,
      isInterdictionValidated: true
    });
  }

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ComponentInterdictionApiService', [
      'validateUnit',
      'validateProduct',
      'getValidProducts',
      'getValidInterdictions',
      'createInterdiction',
      'getInterdictionsByUnit'
    ]);
    const snackbarSpy = createMockSnackbarService();
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);
    chapterChangedSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    menuServiceSpy.findMenuItemByPath.and.returnValue({
      title: 'Enter Component Interdiction',
      description: 'Enter Component Interdiction'
    });

    TestBed.configureTestingModule({
      imports: [
        EnterComponentInterdictionComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: ComponentInterdictionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });

    apiService = TestBed.inject(ComponentInterdictionApiService) as jasmine.SpyObj<ComponentInterdictionApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;

    apiService.validateUnit.and.returnValue(of(mockUnitResponse));
    apiService.getValidProducts.and.returnValue(of([]));
    apiService.getValidInterdictions.and.returnValue(of([]));
    apiService.getInterdictionsByUnit.and.returnValue(of([]));
    apiService.validateProduct.and.returnValue(of({ productCode: 'RBC01', productDescription: 'Red Blood Cells' }));
    apiService.createInterdiction.and.returnValue(of(mockCreateResponse));

    fixture = TestBed.createComponent(EnterComponentInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ===== Component Initialization =====

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form state', () => {
      const state = component.formState();
      expect(state.scannedUnitId).toBe('');
      expect(state.scannedProductCode).toBe('');
      expect(state.unitId).toBe('');
      expect(state.collectionDate).toBe('');
      expect(state.chapterId).toBe('');
      expect(state.productCode).toBe('');
      expect(state.productDescription).toBe('');
      expect(state.interdictionCode).toBe('');
      expect(state.interdictionDescription).toBe('');
      expect(state.interdictionType).toBe('');
      expect(state.barcodeScheme).toBe(BARCODE_SCHEMES.CODABAR);
      expect(state.isUnitValidated).toBe(false);
      expect(state.isProductValidated).toBe(false);
      expect(state.isInterdictionValidated).toBe(false);
    });

    it('should initialize loading states to false', () => {
      expect(component.isValidatingUnit()).toBe(false);
      expect(component.isValidatingProduct()).toBe(false);
      expect(component.isLoadingInterdictions()).toBe(false);
      expect(component.isSubmitting()).toBe(false);
    });

    it('should initialize with empty data signals', () => {
      expect(component.validProducts()).toEqual([]);
      expect(component.filteredProducts()).toEqual([]);
      expect(component.validInterdictions()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
      expect(component.dataSource()).toEqual([]);
    });

    it('should have correct table configuration', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.showPagination).toBe(false);
      expect(component.tableConfig.stickyHeader).toBe(true);
    });
  });

  // ===== Computed Signals =====

  describe('Computed Signals', () => {
    it('should compute isFormReady as false initially', () => {
      expect(component.isFormReady()).toBe(false);
    });

    it('should compute isFormReady as true when all validations pass', () => {
      component.formState.update(s => ({
        ...s,
        isUnitValidated: true,
        isProductValidated: true,
        isInterdictionValidated: true
      }));
      expect(component.isFormReady()).toBe(true);
    });

    it('should compute isFormReady as false when any validation is missing', () => {
      component.formState.update(s => ({
        ...s,
        isUnitValidated: true,
        isProductValidated: true,
        isInterdictionValidated: false
      }));
      expect(component.isFormReady()).toBe(false);
    });

    it('should compute canSubmit as false when form is not ready', () => {
      expect(component.canSubmit()).toBe(false);
    });

    it('should compute canSubmit as true when form is ready and not submitting', () => {
      setFullyValidatedState();
      expect(component.canSubmit()).toBe(true);
    });

    it('should compute canSubmit as false when submitting', () => {
      setFullyValidatedState();
      component.isSubmitting.set(true);
      expect(component.canSubmit()).toBe(false);
    });

    it('should compute isFormDirty as false initially', () => {
      expect(component.isFormDirty()).toBe(false);
    });

    it('should compute isFormDirty as true when unit is validated', () => {
      component.formState.update(s => ({ ...s, isUnitValidated: true }));
      expect(component.isFormDirty()).toBe(true);
    });

    it('should compute isFormDirty as true when product code has value', () => {
      component.formState.update(s => ({ ...s, productCode: 'RBC01' }));
      expect(component.isFormDirty()).toBe(true);
    });

    it('should compute isFormDirty as true when interdiction code has value', () => {
      component.formState.update(s => ({ ...s, interdictionCode: 'NFTH' }));
      expect(component.isFormDirty()).toBe(true);
    });
  });

  // ===== Unit Validation =====

  describe('Unit Validation via onUnitPostValidate', () => {
    it('should validate unit successfully and load products', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(of(mockUnitResponse));
      apiService.getValidProducts.and.returnValue(of(mockProducts));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123456789', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      const state = component.formState();
      expect(state.unitId).toBe('ABC123456789');
      expect(state.collectionDate).toBe('2024-06-08T00:00:00Z');
      expect(state.chapterId).toBe('0001');
      expect(state.isUnitValidated).toBe(true);
      expect(state.barcodeScheme).toBe('C');
      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(loggingService.log).toHaveBeenCalled();
      expect(apiService.getValidProducts).toHaveBeenCalled();
    }));

    it('should reset product and interdiction state on new unit validation', fakeAsync(() => {
      setFullyValidatedState();
      apiService.validateUnit.and.returnValue(of(mockUnitResponse));

      const mockEvent = {
        data: { parsedUnitId: 'NEW123456789', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      const state = component.formState();
      expect(state.productCode).toBe('');
      expect(state.interdictionCode).toBe('');
      expect(state.isProductValidated).toBe(false);
      expect(state.isInterdictionValidated).toBe(false);
    }));

    it('should handle unit validation error with error code', fakeAsync(() => {
      const mockError = { error: { errorCode: '0063', message: 'Unit not found' } };
      apiService.validateUnit.and.returnValue(throwError(() => mockError));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalled();
      expect(component.formState().isUnitValidated).toBe(false);
      expect(component.formState().unitId).toBe('');
      expect(loggingService.error).toHaveBeenCalled();
    }));

    it('should handle unit validation error without error code', fakeAsync(() => {
      const mockError = { error: { message: 'Network error' } };
      apiService.validateUnit.and.returnValue(throwError(() => mockError));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Network error');
    }));
  });

  describe('onUnitValidated', () => {
    it('should be callable without errors', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });
  });

  describe('onUnitCleared', () => {
    it('should reset form when unit is cleared', () => {
      setFullyValidatedState();
      component.dataSource.set([{ unitId: 'X', checkDigit: '', productCode: 'Y', productDescription: '', interdiction: '', interdictionDescription: '', type: '' }]);

      component.onUnitCleared();

      expect(component.formState().unitId).toBe('');
      expect(component.formState().isUnitValidated).toBe(false);
      expect(component.dataSource()).toEqual([]);
      expect(component.validProducts()).toEqual([]);
      expect(component.validInterdictions()).toEqual([]);
    });
  });

  // ===== Product Loading =====

  describe('Load Valid Products (via onUnitPostValidate)', () => {
    it('should load products after unit validation', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(of(mockUnitResponse));
      apiService.getValidProducts.and.returnValue(of(mockProducts));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123456789', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(component.validProducts()).toEqual(mockProducts);
      expect(component.filteredProducts()).toEqual(mockProducts);
    }));

    it('should show info when no products available', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(of(mockUnitResponse));
      apiService.getValidProducts.and.returnValue(of([]));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123456789', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(snackbarService.showInfo).toHaveBeenCalledWith('No products available for this unit');
    }));

    it('should handle load products error', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(of(mockUnitResponse));
      apiService.getValidProducts.and.returnValue(throwError(() => new Error('API error')));

      const mockEvent = {
        data: { parsedUnitId: 'ABC123456789', codeScheme: 'C' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load product codes');
      expect(component.validProducts()).toEqual([]);
      expect(component.filteredProducts()).toEqual([]);
    }));
  });

  // ===== Product Code Selection =====

  describe('Product Code Selection (onProductCodeChange)', () => {
    beforeEach(() => {
      setValidatedUnitState();
      component.validProducts.set(mockProducts);
    });

    it('should select product successfully and load interdictions', fakeAsync(() => {
      apiService.getValidInterdictions.and.returnValue(of(mockInterdictions));

      component.onProductCodeChange('RBC01');
      tick();

      const state = component.formState();
      expect(state.productCode).toBe('RBC01');
      expect(state.productDescription).toBe('Red Blood Cells');
      expect(state.isProductValidated).toBe(true);
      expect(apiService.getValidInterdictions).toHaveBeenCalled();
    }));

    it('should reset interdiction on product change', fakeAsync(() => {
      component.formState.update(s => ({
        ...s,
        interdictionCode: 'NFTH',
        isInterdictionValidated: true
      }));

      apiService.getValidInterdictions.and.returnValue(of([]));
      component.onProductCodeChange('PLT01');
      tick();

      expect(component.formState().interdictionCode).toBe('');
      expect(component.formState().isInterdictionValidated).toBe(false);
    }));

    it('should reset product state when selecting invalid code', () => {
      component.onProductCodeChange('NONEXISTENT');

      const state = component.formState();
      expect(state.productCode).toBe('');
      expect(state.productDescription).toBe('');
      expect(state.isProductValidated).toBe(false);
    });

    it('should reset product state when selecting empty value', () => {
      component.onProductCodeChange('');

      const state = component.formState();
      expect(state.productCode).toBe('');
      expect(state.isProductValidated).toBe(false);
    });
  });

  // ===== Load Interdictions =====

  describe('Load Valid Interdictions (via onProductCodeChange)', () => {
    beforeEach(() => {
      setValidatedUnitState();
      component.validProducts.set(mockProducts);
    });

    it('should load interdictions successfully', fakeAsync(() => {
      apiService.getValidInterdictions.and.returnValue(of(mockInterdictions));

      component.onProductCodeChange('RBC01');
      tick();

      expect(component.validInterdictions()).toEqual(mockInterdictions);
      expect(component.filteredInterdictions()).toEqual(mockInterdictions);
    }));

    it('should show info when no interdictions available', fakeAsync(() => {
      apiService.getValidInterdictions.and.returnValue(of([]));

      component.onProductCodeChange('RBC01');
      tick();

      expect(snackbarService.showInfo).toHaveBeenCalledWith('No valid interdictions available for this component');
    }));

    it('should handle load interdictions error', fakeAsync(() => {
      apiService.getValidInterdictions.and.returnValue(throwError(() => new Error('API error')));

      component.onProductCodeChange('RBC01');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load interdiction codes');
      expect(component.validInterdictions()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    }));
  });

  // ===== Interdiction Code Selection =====

  describe('Interdiction Code Selection (onInterdictionCodeChange)', () => {
    beforeEach(() => {
      setValidatedUnitState();
      component.validInterdictions.set(mockInterdictions);
    });

    it('should update interdiction details on valid selection', () => {
      apiService.getInterdictionsByUnit.and.returnValue(of([]));

      component.onInterdictionCodeChange('NFTH');

      const state = component.formState();
      expect(state.interdictionCode).toBe('NFTH');
      expect(state.interdictionDescription).toBe('Not For Transfusion');
      expect(state.interdictionType).toBe('NFT');
      expect(state.isInterdictionValidated).toBe(true);
    });

    it('should load existing interdictions on valid selection', fakeAsync(() => {
      apiService.getInterdictionsByUnit.and.returnValue(of(mockExistingInterdictions));

      component.onInterdictionCodeChange('NFTH');
      tick();

      expect(apiService.getInterdictionsByUnit).toHaveBeenCalledWith('ABC123456789');
      expect(component.dataSource().length).toBe(1);
      expect(component.dataSource()[0].interdiction).toBe('PREV');
    }));

    it('should handle load existing interdictions error', fakeAsync(() => {
      apiService.getInterdictionsByUnit.and.returnValue(throwError(() => new Error('Failed')));

      component.onInterdictionCodeChange('NFTH');
      tick();

      expect(component.dataSource()).toEqual([]);
      expect(loggingService.error).toHaveBeenCalled();
    }));

    it('should reset interdiction state on invalid selection', () => {
      component.onInterdictionCodeChange('NONEXISTENT');

      const state = component.formState();
      expect(state.interdictionCode).toBe('');
      expect(state.interdictionDescription).toBe('');
      expect(state.interdictionType).toBe('');
      expect(state.isInterdictionValidated).toBe(false);
    });

    it('should not call loadExistingInterdictions on invalid selection', () => {
      component.onInterdictionCodeChange('NONEXISTENT');

      expect(apiService.getInterdictionsByUnit).not.toHaveBeenCalled();
    });
  });

  // ===== Keyboard Handlers =====

  describe('Interdiction Key Handlers', () => {
    it('should submit on ENTER when form is ready', fakeAsync(() => {
      setFullyValidatedState();
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      component.onInterdictionKeyEnter(event as any);
      tick();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiService.createInterdiction).toHaveBeenCalled();
    }));

    it('should not submit on ENTER when form is not ready', () => {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      component.onInterdictionKeyEnter(event as any);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(apiService.createInterdiction).not.toHaveBeenCalled();
    });

    it('should submit on TAB when form is ready', fakeAsync(() => {
      setFullyValidatedState();
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      component.onInterdictionKeyTab(event as any);
      tick();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiService.createInterdiction).toHaveBeenCalled();
    }));

    it('should not submit on TAB when form is not ready', () => {
      const event = { preventDefault: jasmine.createSpy('preventDefault') };
      component.onInterdictionKeyTab(event as any);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(apiService.createInterdiction).not.toHaveBeenCalled();
    });
  });

  // ===== Form Submission =====

  describe('Form Submission (onSubmit)', () => {
    beforeEach(() => {
      setFullyValidatedState();
    });

    it('should submit successfully and add row to table', fakeAsync(() => {
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      component.onSubmit();
      tick();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('1 Entry saved');
      expect(component.dataSource().length).toBe(1);
      expect(component.dataSource()[0].unitId).toBe('ABC123456789');
      expect(component.dataSource()[0].interdiction).toBe('NFTH');
    }));

    it('should clear interdiction fields after successful submit', fakeAsync(() => {
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      component.onSubmit();
      tick();

      const state = component.formState();
      expect(state.interdictionCode).toBe('');
      expect(state.interdictionDescription).toBe('');
      expect(state.interdictionType).toBe('');
      expect(state.isInterdictionValidated).toBe(false);
    }));

    it('should keep unit and product state after successful submit', fakeAsync(() => {
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      component.onSubmit();
      tick();

      const state = component.formState();
      expect(state.unitId).toBe('ABC123456789');
      expect(state.productCode).toBe('RBC01');
      expect(state.isUnitValidated).toBe(true);
      expect(state.isProductValidated).toBe(true);
    }));

    it('should reload valid interdictions after successful submit', fakeAsync(() => {
      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of(mockInterdictions));

      component.onSubmit();
      tick();

      expect(apiService.getValidInterdictions).toHaveBeenCalled();
    }));

    it('should append new rows to existing table data', fakeAsync(() => {
      component.dataSource.set([{
        unitId: 'ABC123456789', checkDigit: 'F', productCode: 'RBC01', productDescription: 'Red Blood Cells',
        interdiction: 'PREV', interdictionDescription: 'Previous', type: 'NFT'
      }]);

      apiService.createInterdiction.and.returnValue(of(mockCreateResponse));
      apiService.getValidInterdictions.and.returnValue(of([]));

      component.onSubmit();
      tick();

      expect(component.dataSource().length).toBe(2);
    }));

    it('should handle submission error with error code', fakeAsync(() => {
      const mockError = { error: { errorCode: '1185', message: 'Invalid interdiction' } };
      apiService.createInterdiction.and.returnValue(throwError(() => mockError));

      component.onSubmit();
      tick();

      expect(snackbarService.showError).toHaveBeenCalled();
      expect(loggingService.error).toHaveBeenCalled();
    }));

    it('should handle submission error without error code', fakeAsync(() => {
      const mockError = { error: { message: 'Conflict' } };
      apiService.createInterdiction.and.returnValue(throwError(() => mockError));

      component.onSubmit();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Conflict');
    }));

    it('should handle submission error with no message', fakeAsync(() => {
      apiService.createInterdiction.and.returnValue(throwError(() => ({ error: {} })));

      component.onSubmit();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to create interdiction');
    }));

    it('should not submit if form is not ready', () => {
      component.formState.update(s => ({ ...s, isInterdictionValidated: false }));

      component.onSubmit();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please complete all required fields');
      expect(apiService.createInterdiction).not.toHaveBeenCalled();
    });

    it('should not submit if already submitting', () => {
      component.isSubmitting.set(true);

      component.onSubmit();

      expect(apiService.createInterdiction).not.toHaveBeenCalled();
    });
  });

  // ===== Clear All =====

  describe('Clear All (onClearAll)', () => {
    it('should reset all form state', () => {
      setFullyValidatedState();
      component.validProducts.set(mockProducts);
      component.validInterdictions.set(mockInterdictions);
      component.dataSource.set([{ unitId: 'X', checkDigit: '', productCode: 'Y', productDescription: '', interdiction: '', interdictionDescription: '', type: '' }]);

      component.onClearAll();

      const state = component.formState();
      expect(state.unitId).toBe('');
      expect(state.productCode).toBe('');
      expect(state.interdictionCode).toBe('');
      expect(state.isUnitValidated).toBe(false);
      expect(state.isProductValidated).toBe(false);
      expect(state.isInterdictionValidated).toBe(false);
      expect(component.validProducts()).toEqual([]);
      expect(component.validInterdictions()).toEqual([]);
      expect(component.dataSource()).toEqual([]);
    });

    it('should clear search controls', () => {
      component.productSearchControl.setValue('test');
      component.interdictionSearchControl.setValue('test');

      component.onClearAll();

      expect(component.productSearchControl.value).toBe('');
      expect(component.interdictionSearchControl.value).toBe('');
    });
  });

  // ===== Search Filters =====

  describe('Search Filters', () => {
    it('should filter products by product code', fakeAsync(() => {
      component.validProducts.set(mockProducts);
      component.filteredProducts.set(mockProducts);

      component.productSearchControl.setValue('rbc');
      tick();

      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('RBC01');
    }));

    it('should filter products by description', fakeAsync(() => {
      component.validProducts.set(mockProducts);
      component.filteredProducts.set(mockProducts);

      component.productSearchControl.setValue('platelet');
      tick();

      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('PLT01');
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.validProducts.set(mockProducts);

      component.productSearchControl.setValue('');
      tick();

      expect(component.filteredProducts().length).toBe(2);
    }));

    it('should filter interdictions by code', fakeAsync(() => {
      component.validInterdictions.set(mockInterdictions);
      component.filteredInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue('nfth');
      tick();

      expect(component.filteredInterdictions().length).toBe(1);
      expect(component.filteredInterdictions()[0].code).toBe('NFTH');
    }));

    it('should filter interdictions by description', fakeAsync(() => {
      component.validInterdictions.set(mockInterdictions);
      component.filteredInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue('hold');
      tick();

      const filtered = component.filteredInterdictions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('HOLD');
    }));

    it('should show all interdictions when search is empty', fakeAsync(() => {
      component.validInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue('');
      tick();

      expect(component.filteredInterdictions().length).toBe(2);
    }));

    it('should handle null search value for products', fakeAsync(() => {
      component.validProducts.set(mockProducts);

      component.productSearchControl.setValue(null as any);
      tick();

      expect(component.filteredProducts().length).toBe(2);
    }));

    it('should handle null search value for interdictions', fakeAsync(() => {
      component.validInterdictions.set(mockInterdictions);

      component.interdictionSearchControl.setValue(null as any);
      tick();

      expect(component.filteredInterdictions().length).toBe(2);
    }));
  });

  // ===== Chapter Change =====

  describe('Chapter Change Subscription', () => {
    it('should reset form on chapter change', fakeAsync(() => {
      setFullyValidatedState();
      component.validProducts.set(mockProducts);
      component.dataSource.set([{ unitId: 'X', checkDigit: '', productCode: 'Y', productDescription: '', interdiction: '', interdictionDescription: '', type: '' }]);

      chapterChangedSubject.next();
      tick();

      const state = component.formState();
      expect(state.unitId).toBe('');
      expect(state.isUnitValidated).toBe(false);
      expect(component.validProducts()).toEqual([]);
      expect(component.dataSource()).toEqual([]);
      expect(component.isValidatingUnit()).toBe(false);
      expect(component.isValidatingProduct()).toBe(false);
      expect(component.isLoadingInterdictions()).toBe(false);
      expect(component.isSubmitting()).toBe(false);
    }));

  });

  // ===== Accessibility (WCAG 2.1 AA) =====

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should have aria-label on main element', () => {
      const main = fixture.nativeElement.querySelector('main');
      expect(main.getAttribute('aria-label')).toBe('Enter Component Interdiction');
    });

    it('should have role="form" and aria-label on filter card', () => {
      const filterCard = fixture.nativeElement.querySelector('.filter-card');
      expect(filterCard.getAttribute('role')).toBe('form');
      expect(filterCard.getAttribute('aria-label')).toBe('Component interdiction entry');
    });

    it('should use span instead of label for read-only description labels', () => {
      const labels = fixture.nativeElement.querySelectorAll('.description-label');
      labels.forEach((label: Element) => {
        expect(label.tagName.toLowerCase()).toBe('span');
      });
    });

    it('should have id attributes on description labels for aria-labelledby', () => {
      const productLabel = fixture.nativeElement.querySelector('#product-desc-label');
      const interdictionLabel = fixture.nativeElement.querySelector('#interdiction-desc-label');
      expect(productLabel).toBeTruthy();
      expect(interdictionLabel).toBeTruthy();
    });

    it('should have aria-labelledby on description values linking to labels', () => {
      const descValues = fixture.nativeElement.querySelectorAll('.description-value');
      expect(descValues.length).toBe(2);
      expect(descValues[0].getAttribute('aria-labelledby')).toBe('product-desc-label');
      expect(descValues[1].getAttribute('aria-labelledby')).toBe('interdiction-desc-label');
    });

    it('should have tabindex=0 on description values for keyboard tooltip access', () => {
      const descValues = fixture.nativeElement.querySelectorAll('.description-value');
      descValues.forEach((val: Element) => {
        expect(val.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have role="text" on description values', () => {
      const descValues = fixture.nativeElement.querySelectorAll('.description-value');
      descValues.forEach((val: Element) => {
        expect(val.getAttribute('role')).toBe('text');
      });
    });

    it('should have type="button" on Clear All button', () => {
      const clearBtn = fixture.nativeElement.querySelector('.clear-all-btn');
      expect(clearBtn.getAttribute('type')).toBe('button');
    });

    it('should have aria-live region on table wrapper', () => {
      const tableWrapper = fixture.nativeElement.querySelector('.table-wrapper');
      expect(tableWrapper.getAttribute('aria-live')).toBe('polite');
      expect(tableWrapper.getAttribute('aria-atomic')).toBe('false');
    });

    it('should have aria-hidden on decorative barcode icons', () => {
      const barcodeSpan = fixture.nativeElement.querySelector('.unit-id-barcode');
      expect(barcodeSpan.getAttribute('aria-hidden')).toBe('true');

      const suffixSpan = fixture.nativeElement.querySelector('.suffix-icons');
      if (suffixSpan) {
        expect(suffixSpan.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  // ===== Lifecycle =====

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
