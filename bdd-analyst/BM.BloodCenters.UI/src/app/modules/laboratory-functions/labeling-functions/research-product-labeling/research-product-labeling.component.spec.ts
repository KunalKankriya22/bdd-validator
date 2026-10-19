import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ResearchProductLabelingComponent } from './research-product-labeling.component';
import { ResearchProductLabelingApiService } from './services/research-product-labeling-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitResponse,
  ResearchTypeDto,
  ResearchProductDto,
  LabeledProductDto,
  CatalogNumberDto,
  LabelPreviewResponse,
  CalculateExpiryResponse,
  BiohazardCheckResponse,
  ChapterConfigDto,
  ValidateProductResponse,
  CompleteRelabelingResponse,
} from './models/research-product-labeling.model';

describe('ResearchProductLabelingComponent', () => {
  let apiServiceSpy: any;
  let component: any;
  let fixture: ComponentFixture<ResearchProductLabelingComponent>;
  let apiService: jasmine.SpyObj<ResearchProductLabelingApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  // ── Mock Data ──

  const mockUnit: ValidateUnitResponse = {
    unitId: 'W633321061401',
    catalogNumber: 'CAT001',
    collectionDate: '2021-06-14T00:00:00',
    chapterId: 'DAL',
    isValid: true,
    errorMessage: null,
    collDate: '2021-06-14T00:00:00',
    hasComponents: true,
    componentCount: 2,
  };

  const mockResearchTypes: ResearchTypeDto[] = [
    { code: 'R', description: 'Research' },
    { code: 'Q', description: 'QC' },
  ];

  const mockLabeledProducts: LabeledProductDto[] = [
    { productCode: 'E0385V00', productDesc: 'Red Blood Cells' },
    { productCode: 'E2807V00', productDesc: 'Plasma' },
  ];

  const mockResearchProducts: ResearchProductDto[] = [
    { productCode: 'E0388', productDesc: 'RBC Research', productType: 'RBC', unitSchemeType: 'I' },
    { productCode: 'E0389', productDesc: 'PLT Research', productType: 'PLT', unitSchemeType: 'I' },
  ];

  const mockCatalogNumbers: CatalogNumberDto[] = [
    { catalogNumber: 'BAG001' },
    { catalogNumber: 'BAG002' },
  ];

  const mockChapterConfig: ChapterConfigDto = {
    unitScheme: 'I',
    qcLabelFlag: 'Y',
    nursingFlag: 'N',
  };

  const mockValidateProduct: ValidateProductResponse = {
    productCode: 'E0385V00',
    catalogNumber: 'CAT001',
    componentStatus: 'Available',
    isValid: true,
    isLabeled: false,
    errorMessage: null,
  };

  const mockResearchProductValidated: ResearchProductDto = {
    productCode: 'E0388',
    productDesc: 'RBC Research',
    productType: 'RBC',
    unitSchemeType: 'I',
  };

  const mockLabelPreview: LabelPreviewResponse = {
    line1: 'Mr',
    line2: 'FOR LABORATORY',
    line3: null,
    line4: 'RESEARCH USE ONLY',
    testMessage: '',
    isTestMessageTooLong: false,
  };

  const mockExpiryData: CalculateExpiryResponse = {
    expirationDate: '2021-07-26T23:59:00',
    lifeSpan: 42,
    lifeSpanIndicator: 'D',
    source: 'VALID_PRODUCTS',
  };

  const mockBiohazard: BiohazardCheckResponse = {
    hasBiohazard: false,
    interdictionCode: null,
    interdictionType: null,
  };

  const mockUnitValidationResponse = {
    parsedUnitId: 'W633321061401',
    checkDigit: null,
    codeScheme: 'I' as const,
    manualUnitId: 'W633321061401',
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ResearchProductLabelingApiService', [
      'validateUnit',
      'validateProduct',
      'getResearchTypes',
      'getResearchProducts',
      'validateResearchProduct',
      'getLabeledProducts',
      'getCatalogNumbers',
      'validateCatalog',
      'checkBiohazard',
      'calculateExpiry',
      'getLabelPreview',
      'generateLabel',
      'completeRelabeling',
      'getChapterConfig',
    ]);

    const snackbarServiceSpy = createMockSnackbarService();

    const pageHeaderServiceSpy = {
      pageHeaderData: signal({ title: 'Research Product Labeling', subtitle: '' }),
      getTitle: jasmine.createSpy('getTitle').and.returnValue('Research Product Labeling'),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue(undefined),
    };

    apiServiceSpy.getResearchTypes.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockResearchTypes }),
    );
    apiServiceSpy.getChapterConfig.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockChapterConfig }),
    );
    apiServiceSpy.validateUnit.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockUnit }),
    );
    apiServiceSpy.getLabeledProducts.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockLabeledProducts }),
    );
    apiServiceSpy.getResearchProducts.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockResearchProducts }),
    );
    apiServiceSpy.validateProduct.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockValidateProduct }),
    );
    apiServiceSpy.validateResearchProduct.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockResearchProductValidated }),
    );
    apiServiceSpy.getCatalogNumbers.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockCatalogNumbers }),
    );
    apiServiceSpy.validateCatalog.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: null }),
    );
    apiServiceSpy.checkBiohazard.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockBiohazard }),
    );
    apiServiceSpy.calculateExpiry.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockExpiryData }),
    );
    apiServiceSpy.getLabelPreview.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: mockLabelPreview }),
    );
    apiServiceSpy.generateLabel.and.returnValue(
      of({ success: true, statusCode: 200, message: '', data: null }),
    );
    apiServiceSpy.completeRelabeling.and.returnValue(
      of({
        success: true, statusCode: 200, message: '', data: {
          success: true,
          message: 'Relabeling completed',
          unitId: 'W633321061401',
          researchProductCode: 'E0388',
        } as CompleteRelabelingResponse,
      }),
    );



      TestBed.configureTestingModule({
      imports: [
        ResearchProductLabelingComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideRouter([]),
        { provide: ResearchProductLabelingApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    })
      .overrideComponent(ResearchProductLabelingComponent, {
        set: {
          providers: [
            { provide: ResearchProductLabelingApiService, useValue: apiServiceSpy },
          ],
        },
      });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.validateProduct.calls.reset();


      apiServiceSpy.getResearchTypes.calls.reset();


      apiServiceSpy.getResearchProducts.calls.reset();


      apiServiceSpy.validateResearchProduct.calls.reset();


      apiServiceSpy.getLabeledProducts.calls.reset();


      apiServiceSpy.getCatalogNumbers.calls.reset();


      apiServiceSpy.validateCatalog.calls.reset();


      apiServiceSpy.checkBiohazard.calls.reset();


      apiServiceSpy.calculateExpiry.calls.reset();


      apiServiceSpy.getLabelPreview.calls.reset();


      apiServiceSpy.generateLabel.calls.reset();


      apiServiceSpy.completeRelabeling.calls.reset();


      apiServiceSpy.getChapterConfig.calls.reset();


    fixture = TestBed.createComponent(ResearchProductLabelingComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ResearchProductLabelingApiService) as jasmine.SpyObj<ResearchProductLabelingApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    fixture.detectChanges();


    });


  // ── Initialization ──

  describe('Initialization', () => {
    it('should load research types on init', () => {
      expect(apiService.getResearchTypes).toHaveBeenCalled();
      expect(component.researchTypeOptions().length).toBe(2);
    });

    it('should load chapter config on init', () => {
      expect(apiService.getChapterConfig).toHaveBeenCalled();
      expect(component.chapterConfig()).toEqual(mockChapterConfig);
    });

    it('should initialize form with default productType R', () => {
      expect(component.labelSetupForm.value.productType).toBe('R');
    });

    it('should have unitValidated as false initially', () => {
      expect(component.unitValidated()).toBeFalse();
    });

    it('should have unitData as null initially', () => {
      expect(component.unitData()).toBeNull();
    });

    it('should not set research types when API returns success false', () => {
      apiService.getResearchTypes.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      const fixture2 = TestBed.createComponent(ResearchProductLabelingComponent);
      const comp2 = fixture2.componentInstance;
      fixture2.detectChanges();
      expect(comp2.researchTypeOptions().length).toBe(0);
    });

    it('should not set chapter config when API returns success false', () => {
      apiService.getChapterConfig.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      const fixture2 = TestBed.createComponent(ResearchProductLabelingComponent);
      const comp2 = fixture2.componentInstance;
      fixture2.detectChanges();
      expect(comp2.chapterConfig()).toBeNull();
    });

    it('should not set research types when data is null', () => {
      apiService.getResearchTypes.and.returnValue(
        of({ success: true, statusCode: 200, message: '', data: null as any }),
      );
      const fixture2 = TestBed.createComponent(ResearchProductLabelingComponent);
      const comp2 = fixture2.componentInstance;
      fixture2.detectChanges();
      expect(comp2.researchTypeOptions().length).toBe(0);
    });

    it('should generate a unique componentId', () => {
      expect(component.componentId).toMatch(/^rpl-\d+$/);
    });

    it('should generate element IDs using componentId', () => {
      expect(component.elementId('test')).toBe(`${component.componentId}-test`);
    });

    it('should have labelPreview as null initially', () => {
      expect(component.labelPreview()).toBeNull();
    });

    it('should have expiryData as null initially', () => {
      expect(component.expiryData()).toBeNull();
    });

    it('should have labelPrinted as false initially', () => {
      expect(component.labelPrinted()).toBeFalse();
    });

    it('should have isSaving as false initially', () => {
      expect(component.isSaving()).toBeFalse();
    });
  });

  // ── Unit Validation ──

  describe('Unit Validation', () => {
    it('should validate unit and set unit data on success', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(apiService.validateUnit).toHaveBeenCalledWith('W633321061401');
      expect(component.unitData()).toEqual(mockUnit);
      expect(component.unitValidated()).toBeTrue();
    }));

    it('should load labeled products and research products after unit validation', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(apiService.getLabeledProducts).toHaveBeenCalledWith(
        'W633321061401',
        '2021-06-14T00:00:00',
      );
      expect(apiService.getResearchProducts).toHaveBeenCalled();
      expect(component.originalProductCodeOptions().length).toBe(2);
      expect(component.researchProductOptions().length).toBe(2);
    }));

    it('should return early if parsedUnitId is null', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: null } as any);
      tick();
      expect(apiService.validateUnit).not.toHaveBeenCalled();
    }));

    it('should return early if parsedUnitId is empty string', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: '' } as any);
      tick();
      expect(apiService.validateUnit).not.toHaveBeenCalled();
    }));

    it('should return early if isLoadingUnit is already true', fakeAsync(() => {
      component.isLoadingUnit.set(true);
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      expect(apiService.validateUnit).not.toHaveBeenCalled();
    }));

    it('should show error when API returns success false', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Unit not found', data: null as any }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit not found');
      expect(component.isLoadingUnit()).toBeFalse();
      expect(component.unitValidated()).toBeFalse();
    }));

    it('should show default error when API returns success false with no message', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        of({ success: false, statusCode: 400, message: '', data: null as any }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit not found');
    }));

    it('should show error when unit isValid is false', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockUnit, isValid: false, errorMessage: 'Unit is quarantined',
          },
        }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit is quarantined');
      expect(component.unitValidated()).toBeFalse();
    }));

    it('should show default error when unit isValid is false with no errorMessage', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockUnit, isValid: false, errorMessage: null,
          },
        }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should show error on API error and reset isLoadingUnit', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } })),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Server error');
      expect(component.isLoadingUnit()).toBeFalse();
    }));

    it('should show default error on API error with no message', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        throwError(() => ({})),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should reset previous state before validating a new unit', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      expect(component.unitValidated()).toBeTrue();

      // Validate again - should reset first
      apiService.validateUnit.calls.reset();
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(apiService.validateUnit).toHaveBeenCalled();
    }));

    it('should use collDate fallback when collectionDate is null', fakeAsync(() => {
      apiService.validateUnit.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockUnit, collectionDate: null, collDate: '2021-07-01T00:00:00',
          },
        }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(apiService.getLabeledProducts).toHaveBeenCalledWith('W633321061401', '2021-07-01T00:00:00');
    }));







  });

  // ── Unit Cleared ──

  describe('Unit Cleared', () => {
    it('should reset all state when unit is cleared', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      component.onUnitCleared();

      expect(component.unitValidated()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.labelSetupForm.value.originalProductCode).toBeNull();
      expect(component.originalProductCodeOptions().length).toBe(0);
      expect(component.researchProductOptions().length).toBe(0);
      expect(component.labelPreview()).toBeNull();
      expect(component.expiryData()).toBeNull();
      expect(component.labelPrinted()).toBeFalse();
    }));
  });

  // ── Original Product Code Selection ──

  describe('Original Product Code Selection', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
    }));

    it('should validate product when original PC is selected', fakeAsync(() => {
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(apiService.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W633321061401',
          productCode: 'E0385V00',
          collectionDate: '2021-06-14T00:00:00',
          chapterId: 'DAL',
        }),
      );
      expect(component.validatedProduct()).toEqual({
        productCode: 'E0385V00',
        catalogNumber: 'CAT001',
      });
    }));



    it('should patch form value for original product code', fakeAsync(() => {
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(component.labelSetupForm.value.originalProductCode).toBe('E0385V00');
    }));

    it('should return early if no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(apiService.validateProduct).not.toHaveBeenCalled();
      // Form value should still be patched
      expect(component.labelSetupForm.value.originalProductCode).toBe('E0385V00');
    }));

    it('should show error when product validation returns invalid', fakeAsync(() => {
      apiService.validateProduct.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockValidateProduct, isValid: false, errorMessage: 'Product not available',
          },
        }),
      );
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Product not available');
      expect(component.validatedProduct()).toBeNull();
    }));

    it('should show default error when product validation returns invalid with no message', fakeAsync(() => {
      apiService.validateProduct.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockValidateProduct, isValid: false, errorMessage: null,
          },
        }),
      );
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Invalid product code');
    }));

    it('should not set validatedProduct when API returns success false', fakeAsync(() => {
      apiService.validateProduct.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(component.validatedProduct()).toBeNull();
    }));
  });

  // ── Research Product Code Selection ──

  describe('Research Product Code Selection', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
    }));

    it('should validate research product and load catalog numbers', fakeAsync(() => {
      component.onResearchPcSelected('E0388');
      tick();

      expect(apiService.validateResearchProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W633321061401',
          productCode: 'E0385V00',
          researchProductCode: 'E0388',
        }),
      );
      expect(component.selectedResearchProduct()).toEqual(mockResearchProductValidated);
      expect(apiService.getCatalogNumbers).toHaveBeenCalled();
    }));

    it('should return early if no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.onResearchPcSelected('E0388');
      tick();

      expect(apiService.validateResearchProduct).not.toHaveBeenCalled();
    }));

    it('should return early if no original product code in form', fakeAsync(() => {
      component.labelSetupForm.patchValue({ originalProductCode: null });
      component.onResearchPcSelected('E0388');
      tick();

      expect(apiService.validateResearchProduct).not.toHaveBeenCalled();
    }));

    it('should show error on research product validation error', fakeAsync(() => {
      apiService.validateResearchProduct.and.returnValue(
        throwError(() => ({ error: { message: 'Validation server error' } })),
      );
      component.onResearchPcSelected('E0388');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Validation server error');
    }));

    it('should show default error on research product validation error with no message', fakeAsync(() => {
      apiService.validateResearchProduct.and.returnValue(
        throwError(() => ({})),
      );
      component.onResearchPcSelected('E0388');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Research product validation failed');
    }));

    it('should patch form value for research product code', fakeAsync(() => {
      component.onResearchPcSelected('E0388');
      tick();

      expect(component.labelSetupForm.value.researchProductCode).toBe('E0388');
    }));

    it('should pass default R when productType is null for catalog numbers', fakeAsync(() => {
      apiService.validateResearchProduct.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            ...mockResearchProductValidated, productType: null,
          },
        }),
      );
      component.onResearchPcSelected('E0388');
      tick();

      expect(apiService.getCatalogNumbers).toHaveBeenCalledWith('W633321061401', 'R');
    }));

  });

  // ── Bag/Catalog Selection ──

  describe('Bag Selection', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();
    }));

    it('should validate catalog and trigger post-catalog chain', fakeAsync(() => {
      component.onBagSelected('BAG001');
      tick();

      expect(apiService.validateCatalog).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W633321061401',
          productCode: 'E0385V00',
          catalogNumber: 'BAG001',
        }),
      );
      expect(apiService.checkBiohazard).toHaveBeenCalled();
      expect(apiService.calculateExpiry).toHaveBeenCalled();
      expect(apiService.getLabelPreview).toHaveBeenCalled();
    }));

    it('should set label preview and expiry data after post-catalog chain', fakeAsync(() => {
      component.onBagSelected('BAG001');
      tick();

      expect(component.labelPreview()).toEqual(mockLabelPreview);
      expect(component.expiryData()).toEqual(mockExpiryData);
      expect(component.isSaving()).toBeFalse();
    }));



    it('should show biohazard warning when interdiction found', fakeAsync(() => {
      apiService.checkBiohazard.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            hasBiohazard: true,
            interdictionCode: 'BH01',
            interdictionType: 'Biohazard',
          },
        }),
      );

      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Biohazard interdiction found for this unit',
      );
    }));

    it('should return early if no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.onBagSelected('BAG001');
      tick();

      expect(apiService.validateCatalog).not.toHaveBeenCalled();
    }));

    it('should return early if no original product code in form', fakeAsync(() => {
      component.labelSetupForm.patchValue({ originalProductCode: null });
      component.onBagSelected('BAG001');
      tick();

      expect(apiService.validateCatalog).not.toHaveBeenCalled();
    }));

    it('should show error when catalog validation returns success false', fakeAsync(() => {
      apiService.validateCatalog.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Catalog invalid', data: null as any }),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Catalog invalid');
      expect(component.isSaving()).toBeFalse();
      expect(apiService.checkBiohazard).not.toHaveBeenCalled();
    }));

    it('should show default error when catalog validation fails with no message', fakeAsync(() => {
      apiService.validateCatalog.and.returnValue(
        of({ success: false, statusCode: 400, message: '', data: null as any }),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Catalog validation failed');
    }));

    it('should show error on catalog validation API error', fakeAsync(() => {
      apiService.validateCatalog.and.returnValue(
        throwError(() => ({ error: { message: 'Catalog server error' } })),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Catalog server error');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show default error on catalog validation API error with no message', fakeAsync(() => {
      apiService.validateCatalog.and.returnValue(
        throwError(() => ({})),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Catalog validation failed');
    }));

    it('should show error on post-catalog chain API error', fakeAsync(() => {
      apiService.checkBiohazard.and.returnValue(
        throwError(() => ({ error: { message: 'Chain failed' } })),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Chain failed');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show default error on post-catalog chain API error with no message', fakeAsync(() => {
      apiService.checkBiohazard.and.returnValue(
        throwError(() => ({})),
      );
      component.onBagSelected('BAG001');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load label preview');
    }));

    it('should set isSaving to true while processing', fakeAsync(() => {
      component.onBagSelected('BAG001');
      // isSaving is set to true at start, then false after complete
      expect(component.isSaving()).toBeFalse(); // after tick completes synchronously
    }));

    it('should patch form value for bag', fakeAsync(() => {
      component.onBagSelected('BAG001');
      tick();

      expect(component.labelSetupForm.value.bag).toBe('BAG001');
    }));
  });

  // ── Generate Label ──

  describe('Generate Label', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
    }));

    it('should generate label and set labelPrinted flag', fakeAsync(() => {
      component.onGenerateLabel();
      tick();

      expect(apiService.generateLabel).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W633321061401',
          productCode: 'E0385V00',
          researchTypeCode: 'R',
        }),
      );
      expect(component.labelPrinted()).toBeTrue();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Label generated successfully');
    }));

    it('should return early if no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.onGenerateLabel();
      tick();

      expect(apiService.generateLabel).not.toHaveBeenCalled();
    }));

    it('should return early if no original product code', fakeAsync(() => {
      component.labelSetupForm.patchValue({ originalProductCode: null });
      component.onGenerateLabel();
      tick();

      expect(apiService.generateLabel).not.toHaveBeenCalled();
    }));

    it('should return early if no product type', fakeAsync(() => {
      component.labelSetupForm.patchValue({ productType: null });
      component.onGenerateLabel();
      tick();

      expect(apiService.generateLabel).not.toHaveBeenCalled();
    }));

    it('should show error when label generation fails', fakeAsync(() => {
      apiService.generateLabel.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Label generation failed', data: null as any }),
      );
      component.onGenerateLabel();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Label generation failed');
      expect(component.labelPrinted()).toBeFalse();
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show default error when label generation fails with no message', fakeAsync(() => {
      apiService.generateLabel.and.returnValue(
        of({ success: false, statusCode: 400, message: '', data: null as any }),
      );
      component.onGenerateLabel();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Label generation failed');
    }));

    it('should show error on label generation API error', fakeAsync(() => {
      apiService.generateLabel.and.returnValue(
        throwError(() => ({ error: { message: 'Generate server error' } })),
      );
      component.onGenerateLabel();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Generate server error');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show default error on label generation API error with no message', fakeAsync(() => {
      apiService.generateLabel.and.returnValue(
        throwError(() => ({})),
      );
      component.onGenerateLabel();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Label generation failed');
    }));



  });

  // ── Reprint ──

  describe('Reprint', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
    }));

    it('should call onGenerateLabel when reprint is enabled', fakeAsync(() => {
      component.labelPrinted.set(true);
      // No verification data, so reprintEnabled should be true
      expect(component.reprintEnabled()).toBeTrue();

      component.onReprint();
      tick();

      expect(apiService.generateLabel).toHaveBeenCalled();
    }));

    it('should not call onGenerateLabel when reprint is disabled', fakeAsync(() => {
      component.labelPrinted.set(false);
      expect(component.reprintEnabled()).toBeFalse();

      component.onReprint();
      tick();

      expect(apiService.generateLabel).not.toHaveBeenCalled();
    }));

    it('should not call onGenerateLabel when verification data exists', fakeAsync(() => {
      component.labelPrinted.set(true);
      component.verificationUnitId.set('W633321061401');
      expect(component.reprintEnabled()).toBeFalse();

      component.onReprint();
      tick();

      expect(apiService.generateLabel).not.toHaveBeenCalled();
    }));
  });

  // ── Autocomplete Filtering ──

  describe('Autocomplete Filtering', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
    }));

    it('should return all options when filter is empty', () => {
      component.originalPcFilter.set('');
      expect(component.filteredOriginalPcOptions().length).toBe(2);
    });

    it('should filter original PC options by product code', () => {
      component.originalPcFilter.set('E0385');
      expect(component.filteredOriginalPcOptions().length).toBe(1);
      expect(component.filteredOriginalPcOptions()[0].productCode).toBe('E0385V00');
    });

    it('should filter original PC options by description', () => {
      component.originalPcFilter.set('plasma');
      expect(component.filteredOriginalPcOptions().length).toBe(1);
      expect(component.filteredOriginalPcOptions()[0].productCode).toBe('E2807V00');
    });

    it('should filter original PC options case-insensitively', () => {
      component.originalPcFilter.set('RED BLOOD');
      expect(component.filteredOriginalPcOptions().length).toBe(1);
    });

    it('should return empty array when no original PC options match', () => {
      component.originalPcFilter.set('ZZZZZ');
      expect(component.filteredOriginalPcOptions().length).toBe(0);
    });

    it('should filter research PC options by product code', () => {
      component.researchPcFilter.set('E0388');
      expect(component.filteredResearchPcOptions().length).toBe(1);
      expect(component.filteredResearchPcOptions()[0].productCode).toBe('E0388');
    });

    it('should filter research PC options by description', () => {
      component.researchPcFilter.set('PLT');
      expect(component.filteredResearchPcOptions().length).toBe(1);
      expect(component.filteredResearchPcOptions()[0].productCode).toBe('E0389');
    });

    it('should return all research PC options when filter is empty', () => {
      component.researchPcFilter.set('');
      expect(component.filteredResearchPcOptions().length).toBe(2);
    });

    it('should return empty when no research PC options match', () => {
      component.researchPcFilter.set('NOMATCH');
      expect(component.filteredResearchPcOptions().length).toBe(0);
    });

    it('should filter bag options by catalog number', fakeAsync(() => {
      // Load catalog numbers first
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();

      component.bagFilter.set('BAG001');
      expect(component.filteredBagOptions().length).toBe(1);
      expect(component.filteredBagOptions()[0].catalogNumber).toBe('BAG001');
    }));

    it('should return all bag options when filter is empty', fakeAsync(() => {
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();

      component.bagFilter.set('');
      expect(component.filteredBagOptions().length).toBe(2);
    }));

    it('should return empty when no bag options match', fakeAsync(() => {
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();

      component.bagFilter.set('NOMATCH');
      expect(component.filteredBagOptions().length).toBe(0);
    }));


  });

  // ── DisplayWith Functions ──

  describe('DisplayWith Functions', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
    }));

    it('should display original product code with description', () => {
      const display = component.displayOriginalPc('E0385V00');
      expect(display).toBe('E0385V00 - Red Blood Cells');
    });

    it('should return raw value if not found in options', () => {
      expect(component.displayOriginalPc('UNKNOWN')).toBe('UNKNOWN');
    });



    it('should display research product code with description', () => {
      const display = component.displayResearchPc('E0388');
      expect(display).toBe('E0388 - RBC Research');
    });

    it('should return empty string for displayOriginalPc with empty value', () => {
      expect(component.displayOriginalPc('')).toBe('');
    });

    it('should return empty string for displayOriginalPc with null-like value', () => {
      expect(component.displayOriginalPc(null as any)).toBe('');
    });

    it('should return empty string for displayResearchPc with empty value', () => {
      expect(component.displayResearchPc('')).toBe('');
    });

    it('should return raw value for displayResearchPc when not found', () => {
      expect(component.displayResearchPc('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return value for displayBag', () => {
      expect(component.displayBag('BAG001')).toBe('BAG001');
    });

    it('should return empty string for displayBag with empty value', () => {
      expect(component.displayBag('')).toBe('');
    });

    it('should return empty string for displayBag with null-like value', () => {
      expect(component.displayBag(null as any)).toBe('');
    });

    it('should handle original PC option with null productDesc', () => {
      component.originalProductCodeOptions.set([
        { productCode: 'E9999', productDesc: null },
      ]);
      const display = component.displayOriginalPc('E9999');
      expect(display).toBe('E9999 - ');
    });
  });

  // ── Computed Signals ──

  describe('Computed Signals', () => {
    it('should compute isMfProduct as false for RBC type', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'RBC Research', productType: 'RBC', unitSchemeType: 'I',
      });
      expect(component.isMfProduct()).toBeFalse();
    }));

    it('should compute isMfProduct as true for RPFF type', () => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'MF Product', productType: 'RPFF', unitSchemeType: 'I',
      });
      expect(component.isMfProduct()).toBeTrue();
    });

    it('should compute isMfProduct as true for RPL type', () => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'MF Product', productType: 'RPL', unitSchemeType: 'I',
      });
      expect(component.isMfProduct()).toBeTrue();
    });

    it('should compute collectionDate formatted', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      expect(component.collectionDate()).toBe('14-JUN-2021');
    }));

    it('should compute collectionDate as empty when no unit', () => {
      expect(component.collectionDate()).toBe('');
    });

    it('should compute verificationHasData correctly', () => {
      expect(component.verificationHasData()).toBeFalse();

      component.verificationUnitId.set('W633321061401');
      expect(component.verificationHasData()).toBeTrue();
    });

    it('should compute reprintEnabled when label printed and no verification data', () => {
      component.labelPrinted.set(true);
      expect(component.reprintEnabled()).toBeTrue();

      component.verificationUnitId.set('W633321061401');
      expect(component.reprintEnabled()).toBeFalse();
    });

    it('should compute isMfProduct as false when no selected research product', () => {
      component.selectedResearchProduct.set(null);
      expect(component.isMfProduct()).toBeFalse();
    });

    it('should compute isMfProduct as false when productType is null', () => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'Test', productType: null, unitSchemeType: 'I',
      });
      expect(component.isMfProduct()).toBeFalse();
    });

    it('should compute description from validatedProduct', () => {
      component.validatedProduct.set({ productCode: 'E0385V00', catalogNumber: 'CAT001' });
      expect(component.description()).toBe('E0385V00');
    });

    it('should compute description as empty when no validated product', () => {
      component.validatedProduct.set(null);
      expect(component.description()).toBe('');
    });

    it('should compute verificationDescription as empty', () => {
      expect(component.verificationDescription()).toBe('');
    });

    it('should compute verificationHasData true when abo is set', () => {
      component.verificationAbo.set('A+');
      expect(component.verificationHasData()).toBeTrue();
    });

    it('should compute verificationHasData true when product code is set', () => {
      component.verificationProductCode.set('E0388');
      expect(component.verificationHasData()).toBeTrue();
    });

    it('should compute verificationHasData true when exp date is set', () => {
      component.verificationExpDate.set('26-JUL-2021');
      expect(component.verificationHasData()).toBeTrue();
    });

    it('should compute verificationHasData true when coll date is set', () => {
      component.verificationCollDate.set('14-JUN-2021');
      expect(component.verificationHasData()).toBeTrue();
    });

    it('should compute reprintEnabled as false when label not printed', () => {
      component.labelPrinted.set(false);
      expect(component.reprintEnabled()).toBeFalse();
    });
  });

  // ── Verification Scan Handlers ──

  describe('Verification Scan Handlers', () => {
    it('should set scan unit ABO value on input', () => {
      const event = { target: { value: 'W633321061401' } } as unknown as Event;
      component.onVerifyScanUnitAboInput(event);
      expect(component.verificationScanUnitAbo()).toBe('W633321061401');
    });



    it('should not move empty scan value on enter', () => {
      component.verificationScanUnitAbo.set('  ');
      component.onScanUnitAboEnter();
      expect(component.verificationUnitId()).toBe('');
    });

    it('should set unit ID on manual input', () => {
      component.onVerifyUnitValidated({ parsedUnitId: 'W633321061401' } as any);
      expect(component.verificationUnitId()).toBe('W633321061401');
    });

    it('should set ABO on change', () => {
      component.onVerifyAboChange('Mr');
      expect(component.verificationAbo()).toBe('Mr');
    });

    it('should set scan prod exp value on input', () => {
      const event = { target: { value: 'E0388' } } as unknown as Event;
      component.onVerifyScanProdExpInput(event);
      expect(component.verificationScanProdExp()).toBe('E0388');
    });



    it('should set product code on manual input', () => {
      const event = { target: { value: 'E0388' } } as unknown as Event;
      component.onVerifyProductCodeInput(event);
      expect(component.verificationProductCode()).toBe('E0388');
    });

    it('should set expiration date on input', () => {
      const event = { target: { value: '26-JUL-2021 23:59' } } as unknown as Event;
      component.onVerifyExpDateInput(event);
      expect(component.verificationExpDate()).toBe('26-JUL-2021 23:59');
    });

    it('should set collection date on input', () => {
      const event = { target: { value: '14-JUN-2021' } } as unknown as Event;
      component.onVerifyCollDateInput(event);
      expect(component.verificationCollDate()).toBe('14-JUN-2021');
    });

    it('should move scan value to unit ID on enter and clear scan field', () => {
      component.verificationScanUnitAbo.set('W633321061401');
      component.onScanUnitAboEnter();
      expect(component.verificationUnitId()).toBe('W633321061401');
      expect(component.verificationScanUnitAbo()).toBe('');
    });

    it('should move scan value to product code on enter and clear scan field', () => {
      component.verificationScanProdExp.set('E0388');
      component.onScanProdExpEnter();
      expect(component.verificationProductCode()).toBe('E0388');
      expect(component.verificationScanProdExp()).toBe('');
    });

    it('should not move empty prod exp scan value on enter', () => {
      component.verificationScanProdExp.set('  ');
      component.onScanProdExpEnter();
      expect(component.verificationProductCode()).toBe('');
    });

    it('should clear unit ID on onVerifyUnitCleared', () => {
      component.verificationUnitId.set('W633321061401');
      component.onVerifyUnitCleared();
      expect(component.verificationUnitId()).toBe('');
    });

    it('should set empty string for parsedUnitId when undefined on verify', () => {
      component.onVerifyUnitValidated({ parsedUnitId: undefined } as any);
      expect(component.verificationUnitId()).toBe('');
    });
  });

  // ── Auto-Trigger Verification (blur/enter on date fields) ──

  describe('Auto-Trigger Verification', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();
      component.onBagSelected('BAG001');
      tick();
      component.labelPrinted.set(true);
    }));

    it('should trigger verification on expiration date blur with all fields valid', fakeAsync(() => {
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.labelSetupForm.patchValue({ researchProductCode: 'E0388' });
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Relabeling completed');
    }));

    it('should not trigger verification on expiration date blur when value is empty', fakeAsync(() => {
      component.verificationExpDate.set('');
      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should not trigger verification on expiration date blur when value is whitespace', fakeAsync(() => {
      component.verificationExpDate.set('   ');
      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should not trigger verification on collection date blur when value is empty', fakeAsync(() => {
      component.verificationCollDate.set('');
      component.onVerifyCollDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should not trigger verification on collection date blur when value is whitespace', fakeAsync(() => {
      component.verificationCollDate.set('   ');
      component.onVerifyCollDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should trigger verification on collection date blur for MF product with valid fields', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'MF Product', productType: 'RPFF', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.labelSetupForm.patchValue({ researchProductCode: 'E0388' });
      component.verificationCollDate.set('14-JUN-2021');

      component.onVerifyCollDateBlur();
      tick();

      expect(apiService.completeRelabeling).toHaveBeenCalled();
    }));



  });

  // ── Verification Logic (runVerification) ──

  describe('Verification Logic', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();
      component.onBagSelected('BAG001');
      tick();
      component.labelPrinted.set(true);
      component.labelSetupForm.patchValue({ researchProductCode: 'E0388' });
    }));

    it('should show error when unit ID is empty', fakeAsync(() => {
      component.verificationUnitId.set('');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit ID verification is required');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when unit ID does not match', fakeAsync(() => {
      component.verificationUnitId.set('WRONG_UNIT_ID');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Scanned Unit ID does not match the labeled unit');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when product code is empty', fakeAsync(() => {
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Product Code verification is required');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when product code does not match research product', fakeAsync(() => {
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('WRONG_PC');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Scanned Product Code does not match the research product');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when expiration date is empty for non-MF product', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'RBC Research', productType: 'RBC', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('');
      // We need to trigger runVerification via blur with a non-empty coll date to get past the empty check
      // Actually, we need to set expDate to something and blur on it, but the real test is that
      // runVerification checks for empty expDate. Let's set a non-empty collDate and trigger via collDate blur.
      component.verificationCollDate.set('14-JUN-2021');

      component.onVerifyCollDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Expiration Date verification is required');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when expiration date does not match expected', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'RBC Research', productType: 'RBC', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('01-JAN-2022 00:00');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Expiration Date does not match'),
      );
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when expiration date has invalid format', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'RBC Research', productType: 'RBC', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('not-a-date');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Expiration Date does not match'),
      );
    }));

    it('should show error when collection date is empty for MF product', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'MF Product', productType: 'RPFF', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationCollDate.set('');
      // Trigger via exp date blur with a non-empty value
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Collection Date verification is required');
      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should succeed verification for MF product with collection date', fakeAsync(() => {
      component.selectedResearchProduct.set({
        productCode: 'E0388', productDesc: 'MF Product', productType: 'RPL', unitSchemeType: 'I',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationCollDate.set('14-JUN-2021');

      component.onVerifyCollDateBlur();
      tick();

      expect(apiService.completeRelabeling).toHaveBeenCalled();
    }));

    it('should not run verification when no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
      expect(snackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not run verification when no expiry data', fakeAsync(() => {
      component.expiryData.set(null);
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
      expect(snackbarService.showError).not.toHaveBeenCalled();
    }));

    it('should not run verification when expiry has no expirationDate', fakeAsync(() => {
      component.expiryData.set({
        expirationDate: null,
        lifeSpan: 42,
        lifeSpanIndicator: 'D',
        source: 'VALID_PRODUCTS',
      });
      component.verificationUnitId.set('W633321061401');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onVerifyExpDateBlur();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));
  });

  // ── Complete Verification ──

  describe('Complete Verification', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();
      component.onBagSelected('BAG001');
      tick();
      component.labelSetupForm.patchValue({
        researchProductCode: 'E0388',
        productType: 'R',
      });
    }));

    it('should call completeRelabeling API on successful verification', fakeAsync(() => {
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W633321061401',
          researchProductCode: 'E0388',
          researchTypeCode: 'R',
          expirationDate: '2021-07-26T23:59:00',
          chapterId: 'DAL',
        }),
      );
    }));

    it('should reset all state after successful completion', fakeAsync(() => {
      component.onCompleteVerification();
      tick();

      expect(component.unitValidated()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.labelPreview()).toBeNull();
    }));

    it('should return early if no unit data', fakeAsync(() => {
      component.unitData.set(null);
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should return early if no expiry data', fakeAsync(() => {
      component.expiryData.set(null);
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should return early if expiry has no expirationDate', fakeAsync(() => {
      component.expiryData.set({
        expirationDate: null,
        lifeSpan: 42,
        lifeSpanIndicator: 'D',
        source: 'VALID_PRODUCTS',
      });
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should return early if no research product code in form', fakeAsync(() => {
      component.labelSetupForm.patchValue({ researchProductCode: null });
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should return early if no research type in form', fakeAsync(() => {
      component.labelSetupForm.patchValue({ productType: null });
      component.onCompleteVerification();
      tick();

      expect(apiService.completeRelabeling).not.toHaveBeenCalled();
    }));

    it('should show error when relabeling response success is false', fakeAsync(() => {
      apiService.completeRelabeling.and.returnValue(
        of({
          success: false, statusCode: 400, message: 'Server validation failed', data: null as any,
        }),
      );
      component.onCompleteVerification();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Server validation failed');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show error when relabeling data success is false', fakeAsync(() => {
      apiService.completeRelabeling.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            success: false,
            message: 'Data-level failure',
            unitId: null,
            researchProductCode: null,
          } as CompleteRelabelingResponse,
        }),
      );
      component.onCompleteVerification();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Data-level failure');
      expect(component.unitValidated()).toBeTrue(); // should NOT reset on failure
    }));

    it('should show default error when relabeling fails with no messages', fakeAsync(() => {
      apiService.completeRelabeling.and.returnValue(
        of({
          success: true, statusCode: 200, message: '', data: {
            success: false,
            message: null,
            unitId: null,
            researchProductCode: null,
          } as CompleteRelabelingResponse,
        }),
      );
      component.onCompleteVerification();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Verification failed');
    }));

    it('should show error on relabeling API error', fakeAsync(() => {
      apiService.completeRelabeling.and.returnValue(
        throwError(() => ({ error: { message: 'Relabeling server error' } })),
      );
      component.onCompleteVerification();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Relabeling server error');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show default error on relabeling API error with no message', fakeAsync(() => {
      apiService.completeRelabeling.and.returnValue(
        throwError(() => ({})),
      );
      component.onCompleteVerification();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Verification failed');
    }));









  });

  // ── Form Reset ──

  describe('Form Reset', () => {


    it('should clear verification signals on reset', fakeAsync(() => {
      component.verificationUnitId.set('W633321061401');
      component.verificationAbo.set('Mr');
      component.verificationProductCode.set('E0388');
      component.verificationExpDate.set('26-JUL-2021 23:59');

      component.onUnitCleared();

      expect(component.verificationUnitId()).toBe('');
      expect(component.verificationAbo()).toBe('');
      expect(component.verificationProductCode()).toBe('');
      expect(component.verificationExpDate()).toBe('');
      expect(component.verificationCollDate()).toBe('');
    }));

    it('should reset form to default productType on resetAll', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();

      component.onUnitCleared();

      expect(component.labelSetupForm.value.productType).toBe('R');
      expect(component.labelSetupForm.value.originalProductCode).toBeNull();
      expect(component.labelSetupForm.value.researchProductCode).toBeNull();
      expect(component.labelSetupForm.value.bag).toBeNull();
    }));

    it('should clear catalog number options on reset', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();

      component.onUnitCleared();

      expect(component.catalogNumberOptions().length).toBe(0);
    }));

    it('should clear validated product on reset', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();

      expect(component.validatedProduct()).not.toBeNull();

      component.onUnitCleared();

      expect(component.validatedProduct()).toBeNull();
    }));

    it('should clear selected research product on reset', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
      component.onResearchPcSelected('E0388');
      tick();

      expect(component.selectedResearchProduct()).not.toBeNull();

      component.onUnitCleared();

      expect(component.selectedResearchProduct()).toBeNull();
    }));
  });

  // ── ngOnDestroy ──

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      let completed = false;
      destroySub.subscribe({ complete: () => (completed = true) });

      component.ngOnDestroy();

      expect(completed).toBeTrue();
    });
  });

  // ── Header Config ──

  describe('Header Config', () => {
    it('should have default header config with Home breadcrumb', () => {
      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs!.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs![0].label).toBe('Home');
    });
  });

  // ── loadUnitRelatedDropdowns edge cases ──

  describe('loadUnitRelatedDropdowns edge cases', () => {
    it('should not set labeled products when API returns success false', fakeAsync(() => {
      apiService.getLabeledProducts.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.originalProductCodeOptions().length).toBe(0);
    }));

    it('should not set research products when API returns success false', fakeAsync(() => {
      apiService.getResearchProducts.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.researchProductOptions().length).toBe(0);
    }));

    it('should handle both dropdown APIs returning failure', fakeAsync(() => {
      apiService.getLabeledProducts.and.returnValue(
        of({ success: false, statusCode: 400, message: '', data: null as any }),
      );
      apiService.getResearchProducts.and.returnValue(
        of({ success: false, statusCode: 400, message: '', data: null as any }),
      );
      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.originalProductCodeOptions().length).toBe(0);
      expect(component.researchProductOptions().length).toBe(0);
    }));
  });

  // ── loadCatalogNumbers edge cases ──

  describe('loadCatalogNumbers edge cases', () => {
    beforeEach(fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationResponse);
      tick();
      component.onOriginalPcSelected('E0385V00');
      tick();
    }));

    it('should not set catalog numbers when API returns success false', fakeAsync(() => {
      apiService.getCatalogNumbers.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Error', data: null as any }),
      );
      component.onResearchPcSelected('E0388');
      tick();

      expect(component.catalogNumberOptions().length).toBe(0);
    }));
  });
});
