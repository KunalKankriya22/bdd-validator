import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ComponentsMadeFromUnitIsbtComponent } from './components-made-from-unit-isbt';
import { ComponentsMadeFromUnitIsbtService } from './services/components-made-from-unit-isbt.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockMatSnackBar, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ComponentsMadeFromUnitIsbtComponent', () => {
  let component: ComponentsMadeFromUnitIsbtComponent;
  let fixture: ComponentFixture<ComponentsMadeFromUnitIsbtComponent>;
  let mockService: jasmine.SpyObj<ComponentsMadeFromUnitIsbtService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let chapterChanged$: Subject<void>;

  const mockProductTypes = [
    { productTypeCode: 'RBC', productTypeDesc: 'Red Blood Cells', weightRequired: 'N', attribFlag: 'Y' },
    { productTypeCode: 'FFP', productTypeDesc: 'Fresh Frozen Plasma', weightRequired: 'Y', attribFlag: 'Y' },
    { productTypeCode: 'PLT', productTypeDesc: 'Platelets', weightRequired: 'N', attribFlag: 'N' }
  ];

  const mockAttributes = [
    { attribCode: '+4202', attribDesc: 'RPL (E4202)' },
    { attribCode: '+49', attribDesc: 'RPL A5' }
  ];

  const mockCatalogNumbers = [
    { catalogNumber: '1TE0088994' },
    { catalogNumber: '2AB0012345' },
    { catalogNumber: '3CD0067890' }
  ];

  const mockUnitValidationResult = {
    collDate: '2024-03-15',
    bagCode: 'BAG123',
    bagCount: 1,
    addOnBags: 0
  };

  const mockSingleProductResult = {
    productCode: 'E0385V00',
    productDesc: 'RED BLOOD CELLS',
    productShortName: 'RBC',
    specificGravity: 1.053,
    isMultiple: false,
    labelPrintRequired: false,
    timeLimitWarning: null as string | null
  };

  const mockMultipleProductResult = {
    isMultiple: true,
    productOptions: [
      { productCode: 'E0385V00', productDesc: 'RED BLOOD CELLS', specificGravity: 1.053 },
      { productCode: 'E2457V00', productDesc: 'PLASMA', specificGravity: 1.026 }
    ],
    labelPrintRequired: true,
    timeLimitWarning: null as string | null
  };

  const mockCreateResponse = {
    success: true,
    statusCode: 201,
    message: 'Component successfully added',
    data: [{
      UnitId: 'W633311070052',
      ProductCode: 'E0385V00',
      CatalogNumber: '1TE0088994',
      Weight: 200,
      ExpiryDate: '2024-06-15T23:59:00',
      ComponentPrefix: 'E0',
      CmvStatus: 'N'
    }]
  };

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('ComponentsMadeFromUnitIsbtService', [
      'getProductTypes',
      'getAttributes',
      'validateUnit',
      'getCatalogNumbers',
      'determineProductCode',
      'getSpecificGravity',
      'createComponent',
      'reprintLabel'
    ]);

    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = createMockPageHeaderService();

    mockService.getProductTypes.and.returnValue(of(mockProductTypes));
    mockService.getAttributes.and.returnValue(of(mockAttributes));
    mockService.getCatalogNumbers.and.returnValue(of(mockCatalogNumbers));
    mockService.validateUnit.and.returnValue(of(mockUnitValidationResult));
    mockService.determineProductCode.and.returnValue(of(mockSingleProductResult));
    mockService.createComponent.and.returnValue(of(mockCreateResponse));

    TestBed.configureTestingModule({
      imports: [
        ComponentsMadeFromUnitIsbtComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ComponentsMadeFromUnitIsbtService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(ComponentsMadeFromUnitIsbtComponent, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });
  });

  beforeEach(() => {
    mockService.getProductTypes.and.returnValue(of(mockProductTypes));
    mockService.getAttributes.and.returnValue(of(mockAttributes));
    fixture = TestBed.createComponent(ComponentsMadeFromUnitIsbtComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ──────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(component['components']()).toEqual([]);
      expect(component['currentUnitId']()).toBeNull();
      expect(component['isLoading']()).toBe(false);
    });

    it('should load product types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockService.getProductTypes).toHaveBeenCalled();
      expect(component['productTypes']().length).toBe(3);
      expect(component['isLoading']()).toBe(false);
    }));

    it('should handle error when loading product types', fakeAsync(() => {
      mockService.getProductTypes.and.returnValue(throwError(() => ({ message: 'Network error' })));
      fixture.detectChanges();
      tick();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should set header config with default title', () => {
      expect(component.headerConfig.title).toBe('Components Made from Unit (ISBT)');
    });

    it('should have correct displayed columns', () => {
      expect(component['displayedColumns']).toEqual([
        'unitId', 'catalogNumber', 'productCode', 'description', 'verifyProduct', 'weight', 'volume'
      ]);
    });
  });

  // ── Product Type Selection ──────────────────────────────────────────

  describe('Product Type Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load attributes when product type with attribFlag=Y is selected', fakeAsync(() => {
      component['onProductTypeChange']('RBC');
      tick();
      expect(mockService.getAttributes).toHaveBeenCalledWith('RBC');
      expect(component['selectedProductType']()?.productTypeCode).toBe('RBC');
    }));

    it('should not load attributes when product type with attribFlag=N is selected', fakeAsync(() => {
      mockService.getAttributes.calls.reset();
      component['onProductTypeChange']('PLT');
      tick();
      expect(mockService.getAttributes).not.toHaveBeenCalled();
      expect(component['attributes']()).toEqual([]);
    }));

    it('should set weightRequired based on product type', fakeAsync(() => {
      component['onProductTypeChange']('FFP');
      tick();
      expect(component['weightRequired']()).toBe(true);
    }));

    it('should handle error when loading attributes', fakeAsync(() => {
      mockService.getAttributes.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['onProductTypeChange']('RBC');
      tick();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should reset entry fields when product type changes', fakeAsync(() => {
      component['currentUnitId'].set('W123');
      component['onProductTypeChange']('RBC');
      tick();
      expect(component['currentUnitId']()).toBeNull();
    }));

    it('should do nothing if product type not found', fakeAsync(() => {
      component['onProductTypeChange']('INVALID');
      tick();
      expect(component['selectedProductType']()).toBeNull();
    }));

    it('should filter product types by search', fakeAsync(() => {
      component['productTypeSearchCtrl'].setValue('RBC');
      tick();
      expect(component['filteredProductTypes']().length).toBe(1);
      expect(component['filteredProductTypes']()[0].productTypeCode).toBe('RBC');
    }));

    it('should reset filter when search is empty', fakeAsync(() => {
      component['productTypeSearchCtrl'].setValue('RBC');
      tick();
      component['productTypeSearchCtrl'].setValue('');
      tick();
      expect(component['filteredProductTypes']().length).toBe(3);
    }));
  });

  // ── Attribute Selection ─────────────────────────────────────────────

  describe('Attribute Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['onProductTypeChange']('RBC');
      tick();
    }));

    it('should select attribute', () => {
      component['onAttributeChange']('+4202');
      expect(component['selectedAttribute']()?.attribCode).toBe('+4202');
    });

    it('should set null for unknown attribute code', () => {
      component['onAttributeChange']('UNKNOWN');
      expect(component['selectedAttribute']()).toBeNull();
    });

    it('should filter attributes by search', fakeAsync(() => {
      component['attributeSearchCtrl'].setValue('RPL A5');
      tick();
      expect(component['filteredAttributes']().length).toBe(1);
    }));
  });

  // ── Unit Validation ─────────────────────────────────────────────────

  describe('Unit Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['onProductTypeChange']('RBC');
      tick();
    }));

    it('should validate unit successfully', fakeAsync(() => {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'W633311070052' },
        confirm: confirmSpy,
        reject: rejectSpy
      };

      component['onUnitPostValidate'](event as any);
      tick();

      expect(confirmSpy).toHaveBeenCalled();
      expect(component['unitIdValid']()).toBe(true);
      expect(component['collectionDate']()).toBe('2024-03-15');
      expect(mockService.getCatalogNumbers).toHaveBeenCalled();
    }));

    it('should reject unit on validation error', fakeAsync(() => {
      mockService.validateUnit.and.returnValue(throwError(() => ({
        error: { errorCode: '0063' },
        message: 'Collection date not present'
      })));
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'W454512071199' },
        confirm: confirmSpy,
        reject: rejectSpy
      };

      component['onUnitPostValidate'](event as any);
      tick();

      expect(rejectSpy).toHaveBeenCalled();
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should reject when no product type selected', () => {
      component['selectedProductType'].set(null);
      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'W123' },
        confirm: jasmine.createSpy(),
        reject: rejectSpy
      };

      component['onUnitPostValidate'](event as any);
      expect(rejectSpy).toHaveBeenCalledWith('Please select a product type first');
    });

    it('should skip when already loading', () => {
      component['isLoading'].set(true);
      const confirmSpy = jasmine.createSpy('confirm');
      const event = {
        data: { parsedUnitId: 'W123' },
        confirm: confirmSpy,
        reject: jasmine.createSpy()
      };

      component['onUnitPostValidate'](event as any);
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('should reset fields on unit cleared', () => {
      component['unitIdValid'].set(true);
      component['currentUnitId'].set('W123');
      component['collectionDate'].set('2024-01-01');

      component['onUnitCleared']();

      expect(component['unitIdValid']()).toBe(false);
      expect(component['currentUnitId']()).toBeNull();
      expect(component['collectionDate']()).toBeNull();
    });
  });

  // ── Catalog Number ──────────────────────────────────────────────────

  describe('Catalog Number', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['onProductTypeChange']('RBC');
      tick();
      // Simulate unit validation success
      component['selectedProductType'].set(mockProductTypes[0]);
      component['unitIdValid'].set(true);
      component['currentUnitId'].set('W633311070052');
      component['collectionDate'].set('2024-03-15');
      component['catalogNumbers'].set(mockCatalogNumbers);
      component['filteredCatalogNumbers'].set(mockCatalogNumbers);
      component['catalogNumberControl'].enable();
    }));

    it('should select catalog number and determine product code', fakeAsync(() => {
      component['onCatalogNumberSelected']('1TE0088994');
      tick();
      expect(component['catalogNumberControl'].value).toBe('1TE0088994');
      expect(mockService.determineProductCode).toHaveBeenCalled();
    }));

    it('should validate on enter with valid catalog', fakeAsync(() => {
      component['catalogNumberControl'].setValue('1TE0088994');
      component['onCatalogNumberEnter']();
      tick();
      expect(mockService.determineProductCode).toHaveBeenCalled();
    }));

    it('should show error on enter with invalid catalog', () => {
      component['catalogNumberControl'].setValue('INVALID');
      component['onCatalogNumberEnter']();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['catalogNumberControl'].value).toBeNull();
    });

    it('should do nothing on enter with empty value', () => {
      component['catalogNumberControl'].setValue('');
      component['onCatalogNumberEnter']();
      expect(mockService.determineProductCode).not.toHaveBeenCalled();
    });

    it('should show error on blur with invalid catalog', () => {
      component['catalogNumberControl'].setValue('INVALID');
      component['onCatalogNumberBlur']();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should do nothing on blur with empty value', () => {
      component['catalogNumberControl'].setValue('');
      component['onCatalogNumberBlur']();
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });

    it('should filter catalog numbers', () => {
      component['filterCatalogNumbers']('1TE');
      expect(component['filteredCatalogNumbers']().length).toBe(1);
    });

    it('should reset filter with empty value', () => {
      component['filterCatalogNumbers']('');
      expect(component['filteredCatalogNumbers']().length).toBe(3);
    });

    it('should handle error when loading catalog numbers', fakeAsync(() => {
      mockService.getCatalogNumbers.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadCatalogNumbers']('W633311070052');
      tick();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));
  });

  // ── Product Code Determination ──────────────────────────────────────

  describe('Product Code Determination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['selectedProductType'].set(mockProductTypes[0]);
      component['unitIdValid'].set(true);
      component['currentUnitId'].set('W633311070052');
      component['collectionDate'].set('2024-03-15');
      component['catalogNumbers'].set(mockCatalogNumbers);
      component['catalogNumberControl'].enable();
      component['catalogNumberControl'].setValue('1TE0088994');
    }));

    it('should auto-resolve single product', fakeAsync(() => {
      mockService.determineProductCode.and.returnValue(of(mockSingleProductResult));
      component['determineProductCode']('1TE0088994');
      tick();

      expect(component['currentProductCode']()).toBe('E0385V00');
      expect(component['productDescription']()).toBe('RED BLOOD CELLS');
      expect(component['specificGravity']()).toBe(1.053);
      expect(component['hasMultipleProducts']()).toBe(false);
    }));

    it('should open dialog for multiple products', fakeAsync(() => {
      mockService.determineProductCode.and.returnValue(of(mockMultipleProductResult));
      component['determineProductCode']('1TE0088994');
      tick();

      expect(component['productCodeDialogOpen']()).toBe(true);
      expect(component['hasMultipleProducts']()).toBe(true);
      expect(component['productCodeOptions']().length).toBe(2);
    }));

    it('should show error when no valid combination', fakeAsync(() => {
      mockService.determineProductCode.and.returnValue(of({
        isMultiple: false,
        productCode: undefined
      } as any));
      component['determineProductCode']('1TE0088994');
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();
    }));

    it('should show time limit warning', fakeAsync(() => {
      const resultWithWarning = { ...mockSingleProductResult, timeLimitWarning: 'Time limit exceeded for FFP', labelPrintRequired: true };
      mockService.determineProductCode.and.returnValue(of(resultWithWarning));
      component['determineProductCode']('1TE0088994');
      tick();

      expect(component['timeLimitWarning']()).toBe('Time limit exceeded for FFP');
      expect(mockSnackBar.open).toHaveBeenCalled();
    }));

    it('should set labelPrintRequired false and attempt commit when no verify and no weight required', fakeAsync(() => {
      mockService.determineProductCode.and.returnValue(of({
        ...mockSingleProductResult,
        labelPrintRequired: false
      }));
      component['weightRequired'].set(false);
      component['determineProductCode']('1TE0088994');
      tick();

      expect(component['labelPrintRequired']()).toBe(false);
      expect(component['currentProductCode']()).toBe('E0385V00');
    }));

    it('should handle determination error', fakeAsync(() => {
      mockService.determineProductCode.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['determineProductCode']('1TE0088994');
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should skip when already loading', () => {
      component['isLoading'].set(true);
      component['determineProductCode']('1TE0088994');
      expect(mockService.determineProductCode).not.toHaveBeenCalled();
    });
  });

  // ── Product Code Dialog ─────────────────────────────────────────────

  describe('Product Code Dialog', () => {
    beforeEach(() => {
      component['hasMultipleProducts'].set(true);
      component['productCodeOptions'].set(mockMultipleProductResult.productOptions!);
    });

    it('should open dialog on click when multiple products', () => {
      component['onProductCodeClick']();
      expect(component['productCodeDialogOpen']()).toBe(true);
    });

    it('should not open dialog when no multiple products', () => {
      component['hasMultipleProducts'].set(false);
      component['onProductCodeClick']();
      expect(component['productCodeDialogOpen']()).toBe(false);
    });

    it('should save selected product code from dialog', () => {
      const option = { productCode: 'E2457V00', productDesc: 'PLASMA', specificGravity: 1.026 };
      component['productCodeDialogOpen'].set(true);

      component['onProductCodeDialogSave'](option);

      expect(component['currentProductCode']()).toBe('E2457V00');
      expect(component['productDescription']()).toBe('PLASMA');
      expect(component['specificGravity']()).toBe(1.026);
      expect(component['productCodeDialogOpen']()).toBe(false);
    });

    it('should close dialog and restore focus', () => {
      const mockElement = { focus: jasmine.createSpy('focus') } as any;
      component['dialogTriggerElement'] = mockElement;
      component['productCodeDialogOpen'].set(true);

      component['onProductCodeDialogClose']();

      expect(component['productCodeDialogOpen']()).toBe(false);
      expect(mockElement.focus).toHaveBeenCalled();
      expect(component['dialogTriggerElement']).toBeNull();
    });
  });

  // ── Verify Product ──────────────────────────────────────────────────

  describe('Verify Product', () => {
    beforeEach(() => {
      component['currentProductCode'].set('E0385V00');
      component['labelPrintRequired'].set(true);
      component['verifyProductControl'].enable();
    });

    it('should accept matching verify code on blur', () => {
      component['verifyProductControl'].setValue('E0385V00');
      component['onVerifyProductBlur']();
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });

    it('should show error for non-matching verify code on blur', () => {
      component['verifyProductControl'].setValue('WRONG');
      component['onVerifyProductBlur']();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['verifyProductControl'].value).toBeNull();
    });

    it('should skip blur validation when label print not required', () => {
      component['labelPrintRequired'].set(false);
      component['verifyProductControl'].setValue('WRONG');
      component['onVerifyProductBlur']();
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    });

    it('should commit on enter with matching code and no weight required', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['selectedProductType'].set(mockProductTypes[0]);
      component['currentUnitId'].set('W633311070052');
      component['collectionDate'].set('2024-03-15');
      component['catalogNumberControl'].setValue('1TE0088994');
      component['weightRequired'].set(false);
      component['verifyProductControl'].setValue('E0385V00');

      component['onVerifyProductEnter']();
      tick();

      expect(mockService.createComponent).toHaveBeenCalled();
    }));

    it('should show error on enter with non-matching code', () => {
      component['verifyProductControl'].setValue('WRONG');
      component['onVerifyProductEnter']();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['verifyProductControl'].value).toBeNull();
    });
  });

  // ── Weight ──────────────────────────────────────────────────────────

  describe('Weight', () => {
    beforeEach(() => {
      component['specificGravity'].set(1.053);
      component['weightRequired'].set(true);
      component['weightControl'].enable();
    });

    it('should calculate volume on valid weight input', () => {
      component['onWeightInput']('500');
      expect(component['computedVolume']()).toBeTruthy();
    });

    it('should clear volume on empty input', () => {
      component['computedVolume'].set('474.83');
      component['onWeightInput']('');
      expect(component['computedVolume']()).toBe('');
    });

    it('should clear volume on invalid weight', () => {
      component['onWeightInput']('0');
      expect(component['computedVolume']()).toBe('');
    });

    it('should clear volume on non-numeric input', () => {
      component['onWeightInput']('abc');
      expect(component['computedVolume']()).toBe('');
    });

    it('should commit component on valid weight enter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['selectedProductType'].set(mockProductTypes[0]);
      component['currentUnitId'].set('W633311070052');
      component['currentProductCode'].set('E0385V00');
      component['collectionDate'].set('2024-03-15');
      component['catalogNumberControl'].setValue('1TE0088994');
      component['weightControl'].setValue('500');

      component['onWeightEnter']();
      tick();

      expect(mockService.createComponent).toHaveBeenCalled();
    }));

    it('should show error on invalid weight enter', () => {
      component['weightControl'].setValue('0');
      component['onWeightEnter']();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should show error on weight exceeding max', () => {
      component['weightControl'].setValue('1000');
      component['onWeightEnter']();
      expect(mockSnackBar.open).toHaveBeenCalled();
    });

    it('should do nothing on empty weight enter', () => {
      component['weightControl'].setValue('');
      component['onWeightEnter']();
      expect(mockService.createComponent).not.toHaveBeenCalled();
    });
  });

  // ── Commit Component ────────────────────────────────────────────────

  describe('Commit Component', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['selectedProductType'].set(mockProductTypes[0]);
      component['currentUnitId'].set('W633311070052');
      component['currentProductCode'].set('E0385V00');
      component['productDescription'].set('RED BLOOD CELLS');
      component['collectionDate'].set('2024-03-15');
      component['catalogNumberControl'].setValue('1TE0088994');
    }));

    it('should create component and add to table', fakeAsync(() => {
      component['commitComponent']();
      tick();

      expect(mockService.createComponent).toHaveBeenCalled();
      expect(component['components']().length).toBe(1);
      expect(component['components']()[0].unitId).toBe('W633311070052');
      expect(component['entryCount']()).toBe(1);
    }));

    it('should reset entry fields after successful commit', fakeAsync(() => {
      component['commitComponent']();
      tick();

      expect(component['currentUnitId']()).toBeNull();
      expect(component['currentProductCode']()).toBeNull();
    }));

    it('should handle commit error', fakeAsync(() => {
      mockService.createComponent.and.returnValue(throwError(() => ({ message: 'Failed' })));
      component['commitComponent']();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should show error when required fields missing', fakeAsync(() => {
      component['currentUnitId'].set(null);
      component['commitComponent']();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(mockService.createComponent).not.toHaveBeenCalled();
    }));

    it('should skip when loading', () => {
      component['isLoading'].set(true);
      component['commitComponent']();
      expect(mockService.createComponent).not.toHaveBeenCalled();
    });
  });

  // ── Reprint ─────────────────────────────────────────────────────────

  describe('Reprint', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['selectedProductType'].set(mockProductTypes[0]);
      component['currentUnitId'].set('W633311070052');
      component['currentProductCode'].set('E0385V00');
      component['collectionDate'].set('2024-03-15');
    }));

    it('should reprint label successfully', fakeAsync(() => {
      mockService.reprintLabel.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Label data generated',
        data: [{
          unitId: 'W633311070052',
          productCode: 'E0385V00',
          productType: 'RBC',
          collDate: '2024-03-15',
          preprintedLabel: false,
          timeLimitWarning: null
        }]
      }));

      component['onReprint']();
      tick();

      expect(mockService.reprintLabel).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should show message for preprinted label', fakeAsync(() => {
      mockService.reprintLabel.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Label data generated',
        data: [{
          unitId: 'W633311070052',
          productCode: 'E0385V00',
          productType: 'RBC',
          collDate: '2024-03-15',
          preprintedLabel: true,
          timeLimitWarning: null
        }]
      }));

      component['onReprint']();
      tick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[0]).toContain('preprinted');
    }));

    it('should show time limit warning on reprint', fakeAsync(() => {
      mockService.reprintLabel.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Label data generated',
        data: [{
          unitId: 'W633311070052',
          productCode: 'E0385V00',
          productType: 'RBC',
          collDate: '2024-03-15',
          preprintedLabel: false,
          timeLimitWarning: 'Time limit exceeded'
        }]
      }));

      component['onReprint']();
      tick();

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      expect(callArgs[0]).toContain('Warning');
    }));

    it('should handle reprint error', fakeAsync(() => {
      mockService.reprintLabel.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['onReprint']();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(component['isLoading']()).toBe(false);
    }));

    it('should show error when required fields missing', () => {
      component['currentUnitId'].set(null);
      component['onReprint']();
      expect(mockSnackBar.open).toHaveBeenCalled();
      expect(mockService.reprintLabel).not.toHaveBeenCalled();
    });

    it('should skip when loading', () => {
      component['isLoading'].set(true);
      component['onReprint']();
      expect(mockService.reprintLabel).not.toHaveBeenCalled();
    });
  });

  // ── Table / Pagination / Sorting ────────────────────────────────────

  describe('Table', () => {
    const mockRows = [
      { unitId: 'W111', catalogNumber: 'C1', productCode: 'P1', weight: 100 },
      { unitId: 'W222', catalogNumber: 'C2', productCode: 'P2', weight: 200 },
      { unitId: 'W333', catalogNumber: 'C3', productCode: 'P3', weight: 300 }
    ] as any[];

    beforeEach(() => {
      component['components'].set(mockRows);
    });

    it('should return paginated data', () => {
      component['currentPage'] = 0;
      component['currentPageSize'] = 2;
      const data = component['getPaginatedData']();
      expect(data.length).toBe(2);
      expect(data[0].unitId).toBe('W111');
    });

    it('should return second page', () => {
      component['currentPage'] = 1;
      component['currentPageSize'] = 2;
      const data = component['getPaginatedData']();
      expect(data.length).toBe(1);
      expect(data[0].unitId).toBe('W333');
    });

    it('should update page on page change', () => {
      component['onPageChange']({ pageIndex: 2, pageSize: 10 } as any);
      expect(component['currentPage']).toBe(2);
      expect(component['currentPageSize']).toBe(10);
    });

    it('should update sort state', () => {
      component['onSortChange']({ active: 'unitId', direction: 'asc' } as any);
      expect(component['sortState']().active).toBe('unitId');
      expect(component['sortState']().direction).toBe('asc');
    });

    it('should sort data ascending', () => {
      component['sortState'].set({ active: 'weight', direction: 'asc' });
      const sorted = component['sortedData']();
      expect(sorted[0].weight).toBe(100);
      expect(sorted[2].weight).toBe(300);
    });

    it('should sort data descending', () => {
      component['sortState'].set({ active: 'weight', direction: 'desc' });
      const sorted = component['sortedData']();
      expect(sorted[0].weight).toBe(300);
      expect(sorted[2].weight).toBe(100);
    });

    it('should return unsorted data when no sort active', () => {
      component['sortState'].set({ active: '', direction: '' });
      const sorted = component['sortedData']();
      expect(sorted).toEqual(mockRows);
    });

    it('should handle null values in sort', () => {
      const rowsWithNull = [
        { unitId: 'W111', weight: null },
        { unitId: 'W222', weight: 200 },
        { unitId: 'W333', weight: null }
      ] as any[];
      component['components'].set(rowsWithNull);
      component['sortState'].set({ active: 'weight', direction: 'asc' });
      const sorted = component['sortedData']();
      expect(sorted.length).toBe(3);
    });
  });

  // ── Clear All ───────────────────────────────────────────────────────

  describe('Clear Functionality', () => {
    it('should clear all fields when CLEAR ALL is clicked', () => {
      component['currentUnitId'].set('W633311070052');
      component['catalogNumberControl'].setValue('1TE0088994');
      component['weightControl'].setValue('200');

      component['onClearAll']();

      expect(component['currentUnitId']()).toBeNull();
      expect(component['catalogNumberControl'].value).toBeNull();
      expect(component['weightControl'].value).toBeNull();
    });
  });

  // ── Chapter Change ──────────────────────────────────────────────────

  describe('Chapter Change', () => {
    it('should reset all fields and reload product types', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockService.getProductTypes.calls.reset();

      component['selectedProductType'].set(mockProductTypes[0]);
      component['currentUnitId'].set('W123');
      component['components'].set([{ unitId: 'W123' } as any]);

      component['handleChapterChange']();
      tick();

      expect(component['selectedProductType']()).toBeNull();
      expect(component['currentUnitId']()).toBeNull();
      expect(component['components']()).toEqual([]);
      expect(component['entryCount']()).toBe(0);
      expect(mockService.getProductTypes).toHaveBeenCalled();
    }));
  });

  // ── Computed signals ────────────────────────────────────────────────

  describe('Computed Signals', () => {
    it('should compute showAttributeFields based on product type', () => {
      component['selectedProductType'].set(mockProductTypes[0]); // attribFlag='Y'
      expect(component['showAttributeFields']()).toBe(true);

      component['selectedProductType'].set(mockProductTypes[2]); // attribFlag='N'
      expect(component['showAttributeFields']()).toBe(false);
    });

    it('should return false for showAttributeFields when no product type', () => {
      component['selectedProductType'].set(null);
      expect(component['showAttributeFields']()).toBe(false);
    });
  });
});
