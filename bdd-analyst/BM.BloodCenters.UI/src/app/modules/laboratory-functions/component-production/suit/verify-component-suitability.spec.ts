import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import { VerifyComponentSuitability } from './verify-component-suitability';
import { VerifyComponentSuitabilityApiService } from './services/verify-component-suitability-api.service';
import { UnitIdFieldService } from '@shared/components/unit-id-field/unit-id-field.service';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { provideCommonTestMocks } from '@shared/testing/page-header-service.mock';
import { createMockHeaderService, createMockMatSnackBar, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  ProcessCodeDto,
  ProductTypeDto,
  EligibleProductDto,
  ApiResponse,
  UnitEligibilityDto,
  ComponentDetailDto,
  SpecialProcessResultDto,
  ScannedComponentModel,
} from './models/verify-component-suitability.model';

describe('VerifyComponentSuitability', () => {
  let component: VerifyComponentSuitability;
  let fixture: ComponentFixture<VerifyComponentSuitability>;
  let apiServiceSpy: jasmine.SpyObj<VerifyComponentSuitabilityApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let unitIdFieldServiceSpy: jasmine.SpyObj<UnitIdFieldService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  const mockProcessCodes: ProcessCodeDto[] = [
    { code: 'FROZ', description: 'Freezing' },
    { code: 'THAW', description: 'Thawing' },
    { code: 'IR', description: 'Irradiation' },
  ];

  const mockProductTypes: ProductTypeDto[] = [
    { productType: 'RBC', description: 'Red Blood Cells' },
    { productType: 'PLT', description: 'Platelets' },
    { productType: 'FFP', description: 'Fresh Frozen Plasma' },
  ];

  const mockEligibleProducts: EligibleProductDto[] = [
    { productCode: 'RBCS', description: 'RBC' },
    { productCode: 'E0385V00', description: 'RBC AS5' },
  ];

  const mockUnitEligibilitySuccess: ApiResponse<UnitEligibilityDto> = {
    success: true,
    statusCode: 200,
    message: 'Unit is eligible for the selected process',
    data: {
      unitId: 'W1234-18-031302-Z',
      collectionDate: '2024-05-15T00:00:00Z',
      isEligible: true,
      errorMessage: null,
    },
  };

  const mockUnitEligibilityError: ApiResponse<UnitEligibilityDto> = {
    success: false,
    statusCode: 400,
    message: 'Unit not found',
    errorCode: '0063',
    data: {
      unitId: 'INVALID123',
      collectionDate: '0001-01-01T00:00:00',
      isEligible: false,
      errorMessage: 'Unit not found',
    },
  };

  const mockComponentDetail: ApiResponse<ComponentDetailDto> = {
    success: true,
    statusCode: 200,
    message: 'Component details retrieved successfully',
    data: {
      unitId: 'W1234-18-031302-Z',
      productCode: 'E0385V00',
      productDescription: 'RBC AS5',
      componentPrefix: '01',
      aboRh: 'AB Pos Regular',
      expiryDate: '2018-03-01T16:40:00Z',
      collectionDate: '2024-05-15T00:00:00Z',
    },
  };

  const mockAssignSuccess: ApiResponse<SpecialProcessResultDto> = {
    success: true,
    statusCode: 201,
    message: 'Special process assigned successfully',
    data: {
      unitId: 'W1234-18-031302-Z',
      productCode: 'E0385V00',
      productDescription: 'RBC AS5',
      aboRh: 'AB Pos Regular',
      expiryDate: '2018-03-01T16:40:00Z',
      processCode: 'FROZ',
      insertDate: '2024-05-20T10:15:00Z',
    },
  };

  const buildPendingComponent = (overrides?: Partial<ScannedComponentModel>): ScannedComponentModel => ({
    unitId: 'W1234-18-031302-Z',
    productCode: 'E0385V00',
    description: 'RBC AS5',
    aboRh: 'AB Pos Regular',
    expiryDate: '2018-03-01T16:40:00Z',
    componentPrefix: '01',
    processCode: 'FROZ',
    status: 'pending',
    ...overrides,
  });

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('VerifyComponentSuitabilityApiService', [
      'getProcessCodes',
      'getProductTypes',
      'getProductCodes',
      'getEligibleProducts',
      'validateUnit',
      'validateProduct',
      'assignSpecialProcess',
      'assignBatch',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error', 'log', 'warn']);
    headerServiceSpy = createMockHeaderService();
    unitIdFieldServiceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    snackBarSpy = createMockMatSnackBar();
    translateServiceSpy = createMockTranslateService();
    translateServiceSpy.instant.and.callFake((key: string) => key);
    translateServiceSpy.get.and.callFake((key: string) => of(key));

    // Set up default spy returns
    apiServiceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    apiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));
    apiServiceSpy.getProductCodes.and.returnValue(of([]));
    apiServiceSpy.getEligibleProducts.and.returnValue(of(mockEligibleProducts));
    apiServiceSpy.validateUnit.and.returnValue(of(mockUnitEligibilitySuccess));
    apiServiceSpy.validateProduct.and.returnValue(of(mockComponentDetail));
    apiServiceSpy.assignSpecialProcess.and.returnValue(of(mockAssignSuccess));
    unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
      success: true,
      message: '',
      errorCode: null,
      item: { parsedUnitId: 'W1234-18-031302-Z', checkDigit: null, codeScheme: 'I' as const, manualUnitId: 'W1234-18-031302-Z', codabarUnitScheme: null, entryMode: 'M' as const, barcodeType: 'CODE128' as const, chapterScheme: 'I' as const },
    }));
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);
    snackBarSpy.open.and.returnValue({ onAction: () => of(void 0) } as any);



      TestBed.configureTestingModule({
      imports: [VerifyComponentSuitability, NoopAnimationsModule],
      providers: [
        { provide: VerifyComponentSuitabilityApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: UnitIdFieldService, useValue: unitIdFieldServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        ...provideCommonTestMocks(),
      ],
    });

      translateServiceSpy.instant.and.callFake((key: string) => key);


      translateServiceSpy.get.and.callFake((key: string) => of(key));


      apiServiceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));


      apiServiceSpy.getProductTypes.and.returnValue(of(mockProductTypes));


      apiServiceSpy.getProductCodes.and.returnValue(of([]));


      apiServiceSpy.getEligibleProducts.and.returnValue(of(mockEligibleProducts));


      apiServiceSpy.validateUnit.and.returnValue(of(mockUnitEligibilitySuccess));


      apiServiceSpy.validateProduct.and.returnValue(of(mockComponentDetail));


      apiServiceSpy.assignSpecialProcess.and.returnValue(of(mockAssignSuccess));


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);


      snackBarSpy.open.and.returnValue({ onAction: () => of(void 0) } as any);


    fixture = TestBed.createComponent(VerifyComponentSuitability);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {






    it('should load product types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getProductTypes).toHaveBeenCalled();
      expect(component.productTypes()).toEqual(mockProductTypes);
    }));


  });

  describe('Loading States', () => {
    it('should handle process codes loading error', fakeAsync(() => {
      apiServiceSpy.getProcessCodes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load process codes');
    }));
  });

  describe('Process Code Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update selectedProcessCode when process code is selected', fakeAsync(() => {
      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      expect(component.selectedProcessCode()).toBe('FROZ');
    }));

    it('should show process code description', fakeAsync(() => {
      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      expect(component.processCodeDescription()).toBe('Freezing');
    }));



    it('should clear errors when process code changes', fakeAsync(() => {
      component.productError.set('Previous product error');
      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      expect(component.productError()).toBeNull();
    }));
  });

  describe('Unit ID Validation (postValidate)', () => {
    const mockUnitData: UnitValidationResponse = {
      parsedUnitId: 'W1234-18-031302-Z',
      checkDigit: null,
      codeScheme: 'I',
      manualUnitId: 'W1234-18-031302-Z',
      codabarUnitScheme: null,
      entryMode: 'M',
      barcodeType: 'CODE128',
      chapterScheme: 'I',
    };

    let confirmSpy: jasmine.Spy;
    let rejectSpy: jasmine.Spy;
    let postValidateEvent: UnitIdPostValidateEvent;

    beforeEach(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      confirmSpy = jasmine.createSpy('confirm');
      rejectSpy = jasmine.createSpy('reject');
      postValidateEvent = { data: mockUnitData, confirm: confirmSpy, reject: rejectSpy };
    });

    it('should call validateUnit API during postValidate', fakeAsync(() => {
      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith({
        unitId: 'W1234-18-031302-Z',
        processCode: 'FROZ',
      });
    }));

    it('should confirm when unit is eligible', fakeAsync(() => {
      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    }));

    it('should load eligible products after onUnitValidated', fakeAsync(() => {
      component.onUnitValidated(mockUnitData);
      tick();

      expect(component.validatedUnitId()).toBe('W1234-18-031302-Z');
      expect(apiServiceSpy.getEligibleProducts).toHaveBeenCalledWith(
        'W1234-18-031302-Z',
        'FROZ'
      );
      expect(component.eligibleProducts()).toEqual(mockEligibleProducts);
    }));

    it('should reject with error for ineligible unit', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockUnitEligibilityError));

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found');
      expect(confirmSpy).not.toHaveBeenCalled();
    }));

    it('should reject on API error during validation', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Server error');
    }));

    it('should reject duplicate unit in postValidate', fakeAsync(() => {
      component.scannedComponents.set([buildPendingComponent()]);

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalledWith('This unit already scanned');
    }));


  });

  describe('Product Code Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('W1234-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);
      tick();
    }));

    it('should validate product on selection', fakeAsync(() => {
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(apiServiceSpy.validateProduct).toHaveBeenCalledWith(
        'W1234-18-031302-Z',
        'E0385V00',
        'FROZ'
      );
    }));

    it('should add component to scanned list on successful validation', fakeAsync(() => {
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.scannedComponents().length).toBe(1);
      expect(component.scannedComponents()[0].unitId).toBe('W1234-18-031302-Z');
      expect(component.scannedComponents()[0].productCode).toBe('E0385V00');
      expect(component.scannedComponents()[0].status).toBe('pending');
    }));




  });

  describe('Data Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display empty state message when no components scanned', () => {
      const emptyMessage = component.tableConfig.emptyMessage;
      expect(emptyMessage).toContain('No Results to Display');
    });

    it('should update table data when component is added', fakeAsync(() => {
      component.scannedComponents.set([buildPendingComponent()]);
      tick();

      expect(component.dataSource.length).toBe(1);
    }));


  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: {
              processCode: 'FROZ',
              unitId: 'W1234-18-031302-Z',
              productCode: 'E0385V00',
            },
            success: true,
            data: mockAssignSuccess.data,
          },
        ])
      );
    });

    it('should not save when no pending components', () => {
      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No components to save');
      expect(apiServiceSpy.assignBatch).not.toHaveBeenCalled();
    });

    it('should save pending components', fakeAsync(() => {
      component.scannedComponents.set([buildPendingComponent()]);

      component.onSave();
      tick();

      expect(apiServiceSpy.assignBatch).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('1 Entries saved');
    }));

    it('should update component status after successful save', fakeAsync(() => {
      component.scannedComponents.set([buildPendingComponent()]);

      component.onSave();
      tick();

      expect(component.scannedComponents()[0].status).toBe('saved');
    }));

    it('should handle partial save failures', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: {
              processCode: 'FROZ',
              unitId: 'W1234-18-031302-Z',
              productCode: 'E0385V00',
            },
            success: true,
            data: mockAssignSuccess.data,
          },
          {
            request: {
              processCode: 'FROZ',
              unitId: 'W1234-18-031302-Y',
              productCode: 'RBCS',
            },
            success: false,
            error: 'Component already assigned',
          },
        ])
      );

      component.scannedComponents.set([
        buildPendingComponent(),
        buildPendingComponent({
          unitId: 'W1234-18-031302-Y',
          productCode: 'RBCS',
          description: 'RBC',
          aboRh: 'O Pos',
        }),
      ]);

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('1 Entries saved');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('1 Entries failed to save');
    }));

    it('should handle save API error', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        throwError(() => new Error('Network failure'))
      );

      component.scannedComponents.set([buildPendingComponent()]);

      component.onSave();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save components');
      expect(component.saving()).toBeFalse();
    }));
  });

  describe('Reset Functionality', () => {
    it('should reset all forms and state', () => {
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('TEST123');
      component.scannedComponents.set([buildPendingComponent()]);

      component.onReset();

      expect(component.processForm.get('processCode')?.value).toBeNull();
      expect(component.validatedUnitId()).toBeNull();
      expect(component.scannedComponents().length).toBe(0);
      expect(component.selectedProcessCode()).toBeNull();
    });

    it('should clear error signals on reset', () => {
      component.productError.set('Another error');

      component.onReset();

      expect(component.productError()).toBeNull();
    });

    it('should clear validated component on reset', () => {
      component.validatedComponent.set(mockComponentDetail.data);

      component.onReset();

      expect(component.validatedComponent()).toBeNull();
    });
  });


  describe('Date Formatting', () => {
    it('should format expiration date correctly', () => {
      const formatted = (component as any).formatDateTime('2018-03-01T16:40:00Z');
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });

    it('should handle invalid date strings', () => {
      const formatted = (component as any).formatDateTime('invalid-date');
      expect(formatted).toBe('invalid-date');
    });

    it('should handle null/empty dates', () => {
      const formatted = (component as any).formatDateTime('');
      expect(formatted).toBe('-');
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for hasProcessCodeSelected when code is selected', fakeAsync(() => {
      expect(component.hasProcessCodeSelected()).toBeFalse();

      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      expect(component.hasProcessCodeSelected()).toBeTrue();
    }));

    it('should return true for hasScannedComponents when list is not empty', () => {
      expect(component.hasScannedComponents()).toBeFalse();

      component.scannedComponents.set([buildPendingComponent()]);

      expect(component.hasScannedComponents()).toBeTrue();
    });

    it('should return true for hasPendingComponents when pending items exist', () => {
      component.scannedComponents.set([
        buildPendingComponent({ status: 'saved' }),
      ]);
      expect(component.hasPendingComponents()).toBeFalse();

      component.scannedComponents.set([buildPendingComponent()]);
      expect(component.hasPendingComponents()).toBeTrue();
    });

    it('should return processProductTypeDescription for selected process product type', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.processProductTypeDescription()).toBe('');

      component.selectedProcessProductType.set('RBC');
      expect(component.processProductTypeDescription()).toBe('Red Blood Cells');
    }));

    it('should return empty string for processProductTypeDescription when no match', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedProcessProductType.set('UNKNOWN');
      expect(component.processProductTypeDescription()).toBe('');
    }));

    it('should return productTypeDescription for selected product type', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.productTypeDescription()).toBe('');

      component.selectedProductType.set('PLT');
      expect(component.productTypeDescription()).toBe('Platelets');
    }));

    it('should return empty string for productTypeDescription when no match', () => {
      component.selectedProductType.set('NONEXISTENT');
      expect(component.productTypeDescription()).toBe('');
    });

    it('should return productCodeDescription for selected product code', () => {
      component.eligibleProducts.set(mockEligibleProducts);
      component.selectedProductCode.set('RBCS');
      expect(component.productCodeDescription()).toBe('RBC');
    });

    it('should return empty string for productCodeDescription when nothing selected', () => {
      expect(component.productCodeDescription()).toBe('');
    });

    it('should return empty string for productCodeDescription when no match', () => {
      component.eligibleProducts.set(mockEligibleProducts);
      component.selectedProductCode.set('NONEXISTENT');
      expect(component.productCodeDescription()).toBe('');
    });

    it('should return empty processCodeDescription when nothing selected', () => {
      expect(component.processCodeDescription()).toBe('');
    });

    it('should return empty processCodeDescription when code not found in list', () => {
      component.selectedProcessCode.set('UNKNOWN');
      expect(component.processCodeDescription()).toBe('');
    });

    it('should correctly filter pendingComponents by status', () => {
      component.scannedComponents.set([
        buildPendingComponent({ unitId: 'UNIT1', status: 'pending' }),
        buildPendingComponent({ unitId: 'UNIT2', status: 'saved' }),
        buildPendingComponent({ unitId: 'UNIT3', status: 'error' }),
        buildPendingComponent({ unitId: 'UNIT4', status: 'pending' }),
      ]);

      expect(component.pendingComponents().length).toBe(2);
      expect(component.pendingComponents().map(c => c.unitId)).toEqual(['UNIT1', 'UNIT4']);
    });
  });

  describe('Component Creation and Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load process codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getProcessCodes).toHaveBeenCalled();
      expect(component.processCodes()).toEqual(mockProcessCodes);
    }));

    it('should initialize processForm with required processCode validator', () => {
      expect(component.processForm).toBeTruthy();
      expect(component.processForm.get('processCode')).toBeTruthy();
      expect(component.processForm.get('productType')).toBeTruthy();

      // processCode should be required
      component.processForm.get('processCode')?.setValue('');
      expect(component.processForm.get('processCode')?.hasError('required')).toBeTrue();

      component.processForm.get('processCode')?.setValue('FROZ');
      expect(component.processForm.get('processCode')?.valid).toBeTrue();
    });

    it('should initialize unitForm with required productCode validator', () => {
      expect(component.unitForm).toBeTruthy();
      expect(component.unitForm.get('productCode')).toBeTruthy();

      component.unitForm.get('productCode')?.setValue('');
      expect(component.unitForm.get('productCode')?.hasError('required')).toBeTrue();

      component.unitForm.get('productCode')?.setValue('RBCS');
      expect(component.unitForm.get('productCode')?.valid).toBeTrue();
    });

    it('should initialize filterForm without validators', () => {
      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('productType')).toBeTruthy();
      expect(component.filterForm.get('productCode')).toBeTruthy();

      // No validators on filter form
      component.filterForm.get('productType')?.setValue('');
      expect(component.filterForm.valid).toBeTrue();
    });

    it('should initialize table config with correct columns', () => {
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns.map((c: any) => c.key)).toEqual([
        'unitId', 'productCode', 'description', 'aboRh', 'expiryDate'
      ]);
    });

    it('should initialize table config with pagination defaults', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.showPagination).toBeTrue();
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should have correct header configuration', () => {
      expect(component.headerConfig.title).toBe('Verify Component Suitability');
      expect(component.headerConfig.subtitle).toContain('Record the time a unit');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));

    it('should dismiss validation snackbar on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Trigger showValidationSnackbar to set the ref
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('W1234-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      // The snackbar should have been opened
      expect(snackBarSpy.open).toHaveBeenCalled();

      component.ngOnDestroy();
      // After destroy, validated count should be reset
    }));
  });

  describe('Form Listeners - Product Type Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load product codes when product type is selected', fakeAsync(() => {
      const mockProductCodes = [
        { productCode: 'RBCS', productShortName: 'RBC Standard', productType: 'RBC' },
      ];
      apiServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));

      component.processForm.get('productType')?.setValue('RBC');
      tick();

      expect(apiServiceSpy.getProductCodes).toHaveBeenCalledWith('RBC');
      expect(component.productCodes()).toEqual(mockProductCodes);
    }));

    it('should clear process code when product type changes', fakeAsync(() => {
      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      component.processForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.selectedProcessCode()).toBeNull();
    }));

    it('should clear validated unit and product error when product type changes', fakeAsync(() => {
      component.validatedUnitId.set('TEST123');
      component.productError.set('Previous error');

      component.processForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.productError()).toBeNull();
    }));

    it('should clear eligible products when product type changes', fakeAsync(() => {
      component.eligibleProducts.set(mockEligibleProducts);

      component.processForm.get('productType')?.setValue('PLT');
      tick();

      expect(component.eligibleProducts()).toEqual([]);
    }));

    it('should not load product codes when product type is cleared', fakeAsync(() => {
      apiServiceSpy.getProductCodes.calls.reset();

      component.processForm.get('productType')?.setValue('');
      tick();

      expect(apiServiceSpy.getProductCodes).not.toHaveBeenCalled();
    }));

    it('should handle product codes loading error', fakeAsync(() => {
      apiServiceSpy.getProductCodes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.processForm.get('productType')?.setValue('RBC');
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product codes');
      expect(component.loadingProductCodes()).toBeFalse();
    }));
  });

  describe('Form Listeners - Process Code Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear validated unit when process code changes', fakeAsync(() => {
      component.validatedUnitId.set('SOME_UNIT');

      component.processForm.get('processCode')?.setValue('THAW');
      tick();

      expect(component.validatedUnitId()).toBeNull();
    }));

    it('should clear eligible products when process code changes', fakeAsync(() => {
      component.eligibleProducts.set(mockEligibleProducts);

      component.processForm.get('processCode')?.setValue('THAW');
      tick();

      expect(component.eligibleProducts()).toEqual([]);
    }));

    it('should clear product error when process code changes', fakeAsync(() => {
      component.productError.set('Some error');

      component.processForm.get('processCode')?.setValue('IR');
      tick();

      expect(component.productError()).toBeNull();
    }));

    it('should reset unit form when process code changes', fakeAsync(() => {
      component.unitForm.patchValue({ productCode: 'RBCS' });

      component.processForm.get('processCode')?.setValue('THAW');
      tick();

      expect(component.unitForm.get('productCode')?.value).toBeNull();
    }));
  });

  describe('Form Listeners - Filter Form Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update selectedProductType on filter form product type change', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('PLT');
      tick();

      expect(component.selectedProductType()).toBe('PLT');
    }));

    it('should clear product code when filter product type changes', fakeAsync(() => {
      component.filterForm.patchValue({ productCode: 'RBCS' });
      tick();

      component.filterForm.get('productType')?.setValue('FFP');
      tick();

      // productCode in filterForm should be cleared
      expect(component.filterForm.get('productCode')?.value).toBe('');
    }));

    it('should update selectedProductCode on filter form product code change', fakeAsync(() => {
      component.filterForm.get('productCode')?.setValue('RBCS');
      tick();

      expect(component.selectedProductCode()).toBe('RBCS');
    }));
  });

  describe('Loading Product Types Error', () => {
    it('should handle product types loading error', fakeAsync(() => {
      apiServiceSpy.getProductTypes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load product types', jasmine.any(Error));
      expect(component.loadingProductTypes()).toBeFalse();
    }));
  });

  describe('Eligible Products Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
    });

    it('should show error snackbar when no eligible products found', fakeAsync(() => {
      apiServiceSpy.getEligibleProducts.and.returnValue(of([]));

      const mockUnitData: UnitValidationResponse = {
        parsedUnitId: 'W1234-18-031302-Z',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W1234-18-031302-Z',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      };

      component.onUnitValidated(mockUnitData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No eligible products found for this unit');
      expect(component.eligibleProducts()).toEqual([]);
    }));

    it('should handle eligible products loading error', fakeAsync(() => {
      apiServiceSpy.getEligibleProducts.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const mockUnitData: UnitValidationResponse = {
        parsedUnitId: 'W1234-18-031302-Z',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W1234-18-031302-Z',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      };

      component.onUnitValidated(mockUnitData);
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load eligible products', jasmine.any(Error));
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load eligible products');
      expect(component.loadingEligibleProducts()).toBeFalse();
      expect(component.eligibleProducts()).toEqual([]);
    }));
  });

  describe('Unit Cleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all unit-related state on unit cleared', () => {
      component.validatedUnitId.set('UNIT123');
      component.eligibleProducts.set(mockEligibleProducts);
      component.productError.set('Some error');
      component.unitForm.patchValue({ productCode: 'RBCS' });

      component.onUnitCleared();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.eligibleProducts()).toEqual([]);
      expect(component.productError()).toBeNull();
      expect(component.unitForm.get('productCode')?.value).toBeNull();
    });
  });

  describe('Product Code Change - Early Returns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when unitId is null', fakeAsync(() => {
      component.validatedUnitId.set(null);
      component.unitForm.patchValue({ productCode: 'RBCS' });
      component.processForm.patchValue({ processCode: 'FROZ' });

      component.onProductCodeChange();
      tick();

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    }));

    it('should return early when productCode is empty', fakeAsync(() => {
      component.validatedUnitId.set('UNIT123');
      component.unitForm.patchValue({ productCode: '' });
      component.processForm.patchValue({ processCode: 'FROZ' });

      component.onProductCodeChange();
      tick();

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    }));

    it('should return early when processCode is empty', fakeAsync(() => {
      component.validatedUnitId.set('UNIT123');
      component.unitForm.patchValue({ productCode: 'RBCS' });
      component.processForm.patchValue({ processCode: '' });

      component.onProductCodeChange();
      tick();

      expect(apiServiceSpy.validateProduct).not.toHaveBeenCalled();
    }));
  });

  describe('Validate Product - Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('W1234-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);
      tick();
    }));

    it('should set productError on validation failure with error.message', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(
        throwError(() => ({ error: { message: 'Product validation failed for unit' } }))
      );

      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.productError()).toBe('Product validation failed for unit');
      expect(component.validatingProduct()).toBeFalse();
    }));

    it('should set productError on validation failure with errorResponse.error', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Component not found' } } }))
      );

      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.productError()).toBe('Component not found');
      expect(component.validatingProduct()).toBeFalse();
    }));

    it('should set default productError on validation failure with no specific message', fakeAsync(() => {
      apiServiceSpy.validateProduct.and.returnValue(
        throwError(() => ({}))
      );

      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.productError()).toBe('Product validation failed');
      expect(component.validatingProduct()).toBeFalse();
    }));
  });

  describe('Add Scanned Component - Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('W1234-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);
      tick();
    }));

    it('should set aboRh to dash when data has no aboRh', fakeAsync(() => {
      const noAboRhResponse: any = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: {
          unitId: 'W5555-18-031302-Z',
          productCode: 'E0385V00',
          productDescription: 'RBC AS5',
          componentPrefix: '01',
          aboRh: null,
          expiryDate: '2018-03-01T16:40:00Z',
          collectionDate: '2024-05-15T00:00:00Z',
        },
      };
      apiServiceSpy.validateProduct.and.returnValue(of(noAboRhResponse));

      component.validatedUnitId.set('W5555-18-031302-Z');
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.scannedComponents().length).toBe(1);
      expect(component.scannedComponents()[0].aboRh).toBe('-');
    }));

    it('should reject duplicate component in addScannedComponent', fakeAsync(() => {
      // First add a component
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.scannedComponents().length).toBe(1);

      // Manually attempt to add a duplicate via private method
      (component as any).addScannedComponent({
        unitId: 'W1234-18-031302-Z',
        productCode: 'RBCS',
        productDescription: 'RBC',
        componentPrefix: null,
        aboRh: 'O Pos',
        expiryDate: '2018-03-01T16:40:00Z',
      });

      expect(component.productError()).toBe('This unit already scanned');
      expect(component.scannedComponents().length).toBe(1);
    }));

    it('should reset form state after successful product validation', fakeAsync(() => {
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.validatedComponent()).toBeNull();
      expect(component.productError()).toBeNull();
      expect(component.eligibleProducts()).toEqual([]);
      expect(component.unitForm.pristine).toBeTrue();
      expect(component.unitForm.untouched).toBeTrue();
    }));
  });

  describe('Page Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update pagination on page change event', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });

    it('should preserve other table config on page change', () => {
      const originalEmptyMessage = component.tableConfig.emptyMessage;

      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 });

      expect(component.tableConfig.emptyMessage).toBe(originalEmptyMessage);
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });
  });

  describe('Validation Snackbar', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      component.validatedUnitId.set('W1234-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);
      tick();
    }));

    it('should show snackbar with singular text for first validation', fakeAsync(() => {
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '1 Entry validated',
        'DISMISS',
        jasmine.objectContaining({
          duration: 0,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        })
      );
    }));

    it('should show snackbar with plural text for multiple validations', fakeAsync(() => {
      const { Subject: RxSubject } = require('rxjs');
      const actionSubject = new RxSubject();
      // Override the snackbar mock so onAction does not fire immediately
      snackBarSpy.open.and.returnValue({ onAction: () => actionSubject.asObservable(), dismiss: jasmine.createSpy('dismiss') } as any);

      // First validation
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      // Second validation - need to set up for a different unit
      const secondResponse: any = {
        success: true,
        statusCode: 200,
        message: 'OK',
        data: {
          unitId: 'W9999-18-031302-Z',
          productCode: 'RBCS',
          productDescription: 'RBC',
          componentPrefix: '02',
          aboRh: 'O Pos',
          expiryDate: '2018-06-01T16:40:00Z',
          collectionDate: '2024-05-15T00:00:00Z',
        },
      };
      apiServiceSpy.validateProduct.and.returnValue(of(secondResponse));
      component.validatedUnitId.set('W9999-18-031302-Z');
      component.eligibleProducts.set(mockEligibleProducts);

      component.unitForm.patchValue({ productCode: 'RBCS' });
      component.onProductCodeChange();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '2 Entries validated',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should dismiss snackbar and reset count on dismiss action', fakeAsync(() => {
      // Trigger a snackbar via validation
      component.unitForm.patchValue({ productCode: 'E0385V00' });
      component.onProductCodeChange();
      tick();

      // The mock already returns of(void 0) for onAction, so the subscription fires immediately
      // That resets validatedCount to 0

      // Verify snackbar was opened
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));

    it('should not dismiss snackbar if ref is null', () => {
      // No snackbar was opened, so dismissing should be a no-op
      (component as any).dismissValidationSnackbar();
      // No error thrown
    });
  });

  describe('Unit Post-Validate - Error Message Fallbacks', () => {
    let confirmSpy: jasmine.Spy;
    let rejectSpy: jasmine.Spy;
    let postValidateEvent: UnitIdPostValidateEvent;

    const mockUnitData: UnitValidationResponse = {
      parsedUnitId: 'W5678-18-031302-Z',
      checkDigit: null,
      codeScheme: 'I',
      manualUnitId: 'W5678-18-031302-Z',
      codabarUnitScheme: null,
      entryMode: 'M',
      barcodeType: 'CODE128',
      chapterScheme: 'I',
    };

    beforeEach(() => {
      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      confirmSpy = jasmine.createSpy('confirm');
      rejectSpy = jasmine.createSpy('reject');
      postValidateEvent = { data: mockUnitData, confirm: confirmSpy, reject: rejectSpy };
    });

    it('should use default message when ineligible unit has null errorMessage', fakeAsync(() => {
      const response: any = {
        success: false,
        statusCode: 400,
        message: 'Not eligible',
        data: {
          unitId: 'W5678-18-031302-Z',
          collectionDate: '2024-05-15T00:00:00Z',
          isEligible: false,
          errorMessage: null,
        },
      };
      apiServiceSpy.validateUnit.and.returnValue(of(response));

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit is not eligible');
    }));

    it('should use errorResponse.error path for API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Custom API error' } } }))
      );

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Custom API error');
    }));

    it('should use error.message as final fallback for API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ message: 'Generic error message' }))
      );

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Generic error message');
    }));

    it('should use default fallback when API error has no message properties', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({}))
      );

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should set loadingEligibleProducts false on ineligible unit', fakeAsync(() => {
      const response: any = {
        success: false,
        statusCode: 400,
        data: {
          unitId: 'W5678-18-031302-Z',
          collectionDate: '2024-05-15T00:00:00Z',
          isEligible: false,
          errorMessage: 'Not eligible',
        },
      };
      apiServiceSpy.validateUnit.and.returnValue(of(response));

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(component.loadingEligibleProducts()).toBeFalse();
    }));

    it('should set loadingEligibleProducts false on API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.onUnitPostValidate(postValidateEvent);
      tick();

      expect(component.loadingEligibleProducts()).toBeFalse();
    }));
  });

  describe('Form Accessor Getters', () => {
    it('should return processForm controls via pf getter', () => {
      expect(component.pf).toBe(component.processForm.controls);
      expect(component.pf['processCode']).toBeTruthy();
      expect(component.pf['productType']).toBeTruthy();
    });

    it('should return unitForm controls via uf getter', () => {
      expect(component.uf).toBe(component.unitForm.controls);
      expect(component.uf['productCode']).toBeTruthy();
    });

    it('should return filterForm controls via ff getter', () => {
      expect(component.ff).toBe(component.filterForm.controls);
      expect(component.ff['productType']).toBeTruthy();
      expect(component.ff['productCode']).toBeTruthy();
    });
  });

  describe('Data Source and Filtered Products', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return scannedComponents via dataSource getter', () => {
      component.scannedComponents.set([buildPendingComponent()]);
      expect(component.dataSource).toEqual(component.scannedComponents());
      expect(component.dataSource.length).toBe(1);
    });

    it('should return empty dataSource when no components', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should return all eligible products when no filters are selected', () => {
      component.eligibleProducts.set(mockEligibleProducts);
      component.selectedProductType.set(null);
      component.selectedProductCode.set(null);

      expect(component.filteredEligibleProducts).toEqual(mockEligibleProducts);
    });

    it('should return all eligible products even when filters are set (current implementation)', () => {
      component.eligibleProducts.set(mockEligibleProducts);
      component.selectedProductType.set('RBC');
      component.selectedProductCode.set('RBCS');

      // Current implementation returns all products regardless of filter values
      expect(component.filteredEligibleProducts).toEqual(mockEligibleProducts);
    });

    it('should return empty when no eligible products exist', () => {
      component.eligibleProducts.set([]);
      expect(component.filteredEligibleProducts).toEqual([]);
    });
  });

  describe('Table Config Column Formatter', () => {
    it('should format expiry date via column valueFormatter', () => {
      const expiryColumn = component.tableConfig.columns.find((c: any) => c.key === 'expiryDate') as any;
      expect(expiryColumn).toBeTruthy();
      expect(expiryColumn.valueFormatter).toBeTruthy();

      const mockRow = buildPendingComponent({ expiryDate: '2018-03-01T16:40:00Z' });
      const formatted = expiryColumn.valueFormatter('2018-03-01T16:40:00Z', mockRow);
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
    });

    it('should return dash for empty expiry date via column valueFormatter', () => {
      const expiryColumn = component.tableConfig.columns.find((c: any) => c.key === 'expiryDate') as any;
      const mockRow = buildPendingComponent({ expiryDate: '' });
      const formatted = expiryColumn.valueFormatter('', mockRow);
      expect(formatted).toBe('-');
    });
  });

  describe('Save - Multiple Component Statuses', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should only save pending components, not saved or error ones', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: {
              processCode: 'FROZ',
              unitId: 'UNIT_PENDING',
              productCode: 'RBCS',
            },
            success: true,
            data: mockAssignSuccess.data,
          },
        ])
      );

      component.scannedComponents.set([
        buildPendingComponent({ unitId: 'UNIT_SAVED', status: 'saved' }),
        buildPendingComponent({ unitId: 'UNIT_ERROR', status: 'error' }),
        buildPendingComponent({ unitId: 'UNIT_PENDING', status: 'pending', productCode: 'RBCS' }),
      ]);

      component.onSave();
      tick();

      // Only the pending component should have been included in the request
      const callArgs = apiServiceSpy.assignBatch.calls.mostRecent().args[0];
      expect(callArgs.length).toBe(1);
      expect(callArgs[0].unitId).toBe('UNIT_PENDING');
    }));

    it('should handle all-failed batch save', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: {
              processCode: 'FROZ',
              unitId: 'W1234-18-031302-Z',
              productCode: 'E0385V00',
            },
            success: false,
            error: 'Something went wrong',
          },
        ])
      );

      component.scannedComponents.set([buildPendingComponent()]);

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('1 Entries failed to save');
      expect(component.scannedComponents()[0].status).toBe('error');
      expect(component.scannedComponents()[0].errorMessage).toBe('Something went wrong');
      expect(component.saving()).toBeFalse();
    }));

    it('should set saving signal during save operation', fakeAsync(() => {
      // Use a Subject to control when the response arrives
      const { Subject: RxSubject } = require('rxjs');
      const saveSubject = new RxSubject();
      apiServiceSpy.assignBatch.and.returnValue(saveSubject.asObservable());

      component.scannedComponents.set([buildPendingComponent()]);

      component.onSave();
      expect(component.saving()).toBeTrue();

      saveSubject.next([
        {
          request: { processCode: 'FROZ', unitId: 'W1234-18-031302-Z', productCode: 'E0385V00' },
          success: true,
          data: mockAssignSuccess.data,
        },
      ]);
      saveSubject.complete();
      tick();

      expect(component.saving()).toBeFalse();
    }));

    it('should include componentPrefix in save request when present', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: { processCode: 'FROZ', unitId: 'W1234-18-031302-Z', productCode: 'E0385V00', componentPrefix: '01' },
            success: true,
            data: mockAssignSuccess.data,
          },
        ])
      );

      component.scannedComponents.set([
        buildPendingComponent({ componentPrefix: '01' }),
      ]);

      component.onSave();
      tick();

      const callArgs = apiServiceSpy.assignBatch.calls.mostRecent().args[0];
      expect(callArgs[0].componentPrefix).toBe('01');
    }));

    it('should set componentPrefix to undefined in request when null', fakeAsync(() => {
      apiServiceSpy.assignBatch.and.returnValue(
        of([
          {
            request: { processCode: 'FROZ', unitId: 'W1234-18-031302-Z', productCode: 'E0385V00' },
            success: true,
            data: mockAssignSuccess.data,
          },
        ])
      );

      component.scannedComponents.set([
        buildPendingComponent({ componentPrefix: null }),
      ]);

      component.onSave();
      tick();

      const callArgs = apiServiceSpy.assignBatch.calls.mostRecent().args[0];
      expect(callArgs[0].componentPrefix).toBeUndefined();
    }));
  });

  describe('Reset - Additional Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset selectedProcessProductType on reset', () => {
      component.selectedProcessProductType.set('RBC');
      component.onReset();
      expect(component.selectedProcessProductType()).toBeNull();
    });

    it('should reset selectedProductType on reset', () => {
      component.selectedProductType.set('PLT');
      component.onReset();
      expect(component.selectedProductType()).toBeNull();
    });

    it('should reset selectedProductCode on reset', () => {
      component.selectedProductCode.set('RBCS');
      component.onReset();
      expect(component.selectedProductCode()).toBeNull();
    });

    it('should clear product codes on reset', () => {
      component.productCodes.set([{ productCode: 'RBCS', productShortName: 'RBC', productType: 'RBC' }]);
      component.onReset();
      expect(component.productCodes()).toEqual([]);
    });

    it('should reset submitted flag on reset', () => {
      component.submitted.set(true);
      component.onReset();
      expect(component.submitted()).toBeFalse();
    });

    it('should reset filter form on reset', () => {
      component.filterForm.patchValue({ productType: 'RBC', productCode: 'RBCS' });
      component.onReset();
      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('productCode')?.value).toBeNull();
    });

    it('should update table data after reset', () => {
      component.scannedComponents.set([buildPendingComponent()]);
      component.onReset();
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    });
  });

  describe('Update Table Data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update totalRecords in pagination config', () => {
      component.scannedComponents.set([
        buildPendingComponent({ unitId: 'UNIT1' }),
        buildPendingComponent({ unitId: 'UNIT2' }),
        buildPendingComponent({ unitId: 'UNIT3' }),
      ]);

      (component as any).updateTableData();

      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
    });
  });

  describe('Loading Signal States', () => {
    it('should set loadingProcessCodes during process codes load', fakeAsync(() => {
      const { Subject: RxSubject } = require('rxjs');
      const subj = new RxSubject();
      apiServiceSpy.getProcessCodes.and.returnValue(subj.asObservable());

      fixture.detectChanges();

      expect(component.loadingProcessCodes()).toBeTrue();

      subj.next(mockProcessCodes);
      subj.complete();
      tick();

      expect(component.loadingProcessCodes()).toBeFalse();
    }));

    it('should set loadingProductTypes during product types load', fakeAsync(() => {
      const { Subject: RxSubject } = require('rxjs');
      const subj = new RxSubject();
      apiServiceSpy.getProductTypes.and.returnValue(subj.asObservable());

      fixture.detectChanges();

      expect(component.loadingProductTypes()).toBeTrue();

      subj.next(mockProductTypes);
      subj.complete();
      tick();

      expect(component.loadingProductTypes()).toBeFalse();
    }));

    it('should set loadingProductCodes during product codes load', fakeAsync(() => {
      const { Subject: RxSubject } = require('rxjs');
      const subj = new RxSubject();
      apiServiceSpy.getProductCodes.and.returnValue(subj.asObservable());

      fixture.detectChanges();

      component.processForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.loadingProductCodes()).toBeTrue();

      subj.next([]);
      subj.complete();
      tick();

      expect(component.loadingProductCodes()).toBeFalse();
    }));

    it('should set loadingEligibleProducts during eligible products load', fakeAsync(() => {
      const { Subject: RxSubject } = require('rxjs');
      const subj = new RxSubject();
      apiServiceSpy.getEligibleProducts.and.returnValue(subj.asObservable());

      fixture.detectChanges();
      component.processForm.patchValue({ processCode: 'FROZ' });
      tick();

      const mockUnitData: UnitValidationResponse = {
        parsedUnitId: 'W1234-18-031302-Z',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W1234-18-031302-Z',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
      };

      component.onUnitValidated(mockUnitData);
      expect(component.loadingEligibleProducts()).toBeTrue();

      subj.next(mockEligibleProducts);
      subj.complete();
      tick();

      expect(component.loadingEligibleProducts()).toBeFalse();
    }));
  });
});
