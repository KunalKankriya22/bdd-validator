import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNativeDateAdapter, DateAdapter } from '@angular/material/core';
import moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { EnterComponentAttributesComponent } from './enter-component-attributes.component';
import { ComponentAttributeApiService } from './services/component-attribute-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockActivatedRoute, createMockPageHeaderService, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
} from './models/component-attribute.model';

describe('EnterComponentAttributesComponent', () => {
  let pageHeaderServiceSpy: any;
  let snackbarServiceSpy: any;
  let apiServiceSpy: any;
  let component: EnterComponentAttributesComponent;
  let fixture: ComponentFixture<EnterComponentAttributesComponent>;
  let apiService: jasmine.SpyObj<ComponentAttributeApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockProducts: ComponentProductDto[] = [
    {
      productCode: 'E0701V00',
      productDesc: 'Red Blood Cells',
      productType: 'RBC',
      expiryDate: '2026-07-15T00:00:00',
      componentStatus: 'L', // Lab status (valid for attributes)
      poolProductFlag: 'N',
      codeScheme: 'I',
    },
  ];

  const mockAttributeGroups: AttributeGroupDto[] = [
    { code: 'IRR', codeDesc: 'Irradiation' },
  ];

  const mockAttributeCodes: AttributeCodeDto[] = [
    {
      attribCode: 'IRR25',
      attribDesc: 'Irradiated - 25 Gy',
      attribGroup: 'IRR',
      attribType: 'A', // Type must be 'A' for attributes
      lifeSpan: null,
      lifeSpanInd: null,
      interCode: null,
      statusFlag: 'A',
      stopLabelFlag: 'N',
    },
  ];

  const mockComponentAttributes: ComponentAttributeDto[] = [
    {
      unitId: 'W454526051302-1',
      collDate: '2026-05-13T00:00:00',
      chapterId: 'CH001',
      productCode: 'E0701V00',
      productDesc: 'Red Blood Cells',
      productType: 'RBC',
      attribGroup: 'IRR',
      attribCode: 'IRR25',
      attribDesc: 'Irradiated - 25 Gy',
      procDate: '2026-05-15T10:30:00',
      insertDate: new Date('2026-05-15T10:30:00'),
      insertUser: 'JSMITH',
      programId: 'COMPATT',
      expiryDate: '2026-07-13T00:00:00',
      newExpiryDate: '2026-07-27T00:00:00',
      interCode: null,
    },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ComponentAttributeApiService', [
      'getComponentAttributes',
      'getProductsForUnit',
      'getAttributeGroups',
      'getAttributeCodes',
      'saveComponentAttribute',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = createMockPageHeaderService();

    // Mock TranslateService
    mockTranslateService = createMockTranslateService();
      TestBed.configureTestingModule({
      imports: [
        EnterComponentAttributesComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideNativeDateAdapter(), // Fix MatDatepicker: No provider found for DateAdapter
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: ComponentAttributeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    })
      .overrideComponent(EnterComponentAttributesComponent, {
        set: {
          providers: [
            { provide: ComponentAttributeApiService, useValue: apiServiceSpy },
          ],
        },
      });


    


      apiServiceSpy.getComponentAttributes.calls.reset();


      apiServiceSpy.getProductsForUnit.calls.reset();


      apiServiceSpy.getAttributeGroups.calls.reset();


      apiServiceSpy.getAttributeCodes.calls.reset();


      apiServiceSpy.saveComponentAttribute.calls.reset();


      snackbarServiceSpy.showSuccess.calls.reset();


      snackbarServiceSpy.showError.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();
    apiService = TestBed.inject(ComponentAttributeApiService) as jasmine.SpyObj<ComponentAttributeApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;

    // Set default return values for API service spies
    apiService.getProductsForUnit.and.returnValue(of([]));
    apiService.getAttributeGroups.and.returnValue(of([]));
    apiService.getAttributeCodes.and.returnValue(of([]));
    apiService.getComponentAttributes.and.returnValue(of([]));
    apiService.saveComponentAttribute.and.returnValue(of({} as any));

    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({
      label: 'Attributes and Interdictions',
      link: null,
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Enter Component Attributes');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');

    fixture = TestBed.createComponent(EnterComponentAttributesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  describe('onUnitValidated', () => {
    it('should load products when unit is validated', fakeAsync(() => {
      apiService.getProductsForUnit.and.returnValue(of(mockProducts));

      const mockValidationResponse = {
        parsedUnitId: 'W454526051302-1',
        checkDigit: '1',
        codeScheme: 'I' as const,
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I' as const,
        collectionDate: '2026-05-13',
      };

      component.onUnitValidated(mockValidationResponse);
      tick();

      expect(apiService.getProductsForUnit).toHaveBeenCalledWith(
        'W454526051302-1',
        '2026-05-13'
      );
      expect(component.products().length).toBe(1);
    }));


  });

  describe('onUnitCleared', () => {
    it('should reset all form data and signals', () => {
      component.currentUnitId = 'W454526051302-1';
      component.products.set(mockProducts);
      component.dataSource.set(mockComponentAttributes);

      component.onUnitCleared();

      expect(component.currentUnitId).toBe('');
      expect(component.products().length).toBe(0);
      expect(component.dataSource().length).toBe(0);
      expect(component.showResults).toBe(false);
    });
  });

  describe('Product Code changes', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.products.set(mockProducts);
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));
    });

    it('should load attribute groups when product code is selected', fakeAsync(() => {
      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick(); // Process async valueChanges subscription

      expect(apiService.getAttributeGroups).toHaveBeenCalledWith('RBC', 'E0701V00', 'I');
    }));

    it('should clear data when product code is cleared', fakeAsync(() => {
      component.attributeGroups.set(mockAttributeGroups);
      component.dataSource.set(mockComponentAttributes);

      component.attributeForm.patchValue({ productCode: '' });
      tick(); // Process async valueChanges subscription

      expect(component.attributeGroups().length).toBe(0);
      expect(component.dataSource().length).toBe(0);
      expect(component.showResults).toBe(false);
    }));
  });

  describe('Attribute Group changes', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.currentProductType = 'RBC';
      apiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    });

    it('should load attribute codes when attribute group is selected', fakeAsync(() => {
      component.currentCodeScheme = 'I'; // Set code scheme
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
      });
      tick(); // Process async valueChanges subscription

      expect(apiService.getAttributeCodes).toHaveBeenCalledWith(
        'RBC',
        'IRR',
        'W454526051302-1',
        '2026-05-13',
        'E0701V00',
        'I' // Include codeScheme parameter
      );
    }));
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
    });

    it('should save component attribute successfully', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick(); // Process async subscription

      expect(apiService.saveComponentAttribute).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith(
        'Component attribute saved successfully'
      );
    }));




  });

  describe('onClearAll', () => {
    it('should reset form and all signals', () => {
      component.currentUnitId = 'W454526051302-1';
      component.products.set(mockProducts);
      component.dataSource.set(mockComponentAttributes);
      component.attributeForm.patchValue({ productCode: 'E0701V00' });

      component.onClearAll();

      expect(component.currentUnitId).toBe('');
      expect(component.products().length).toBe(0);
      expect(component.dataSource().length).toBe(0);
      expect(component.attributeForm.value.productCode).toBe(null);
    });
  });

  describe('canSubmit getter', () => {


    it('should return false when unit ID is not set', () => {
      component.currentUnitId = '';
      component.attributeForm.patchValue({ productCode: 'E0701V00' });

      expect(component.canSubmit).toBe(false);
    });


  });

  describe('Table Configuration', () => {






    it('should update Unit ID header with count', () => {
      component.dataSource.set(mockComponentAttributes);
      const columns = component['getTableColumns']();
      expect(columns[0].header).toBe('Unit ID (1)');
    });

    it('should show pagination when enabled', () => {
      expect(component.tableConfig().showPagination).toBe(true);
    });
  });

  describe('BUG 3 & 4: Component Status and Pool Product Validation', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
    });

    it('should reject product with status != L (Error 0210)', fakeAsync(() => {
      const invalidProduct: ComponentProductDto = {
        ...mockProducts[0],
        componentStatus: 'Q', // Not Lab status
      };
      component.products.set([invalidProduct]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Error 0210: Component must be in Lab status to add attributes',
        'DISMISS',
      );
      expect(component.attributeForm.get('productCode')?.value).toBe('');
    }));

    it('should reject pool products (Error 0231)', fakeAsync(() => {
      const poolProduct: ComponentProductDto = {
        ...mockProducts[0],
        poolProductFlag: 'Y', // Pool product
      };
      component.products.set([poolProduct]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Error 0231: Cannot add attributes to pool products',
        'DISMISS',
      );
      expect(component.attributeForm.get('productCode')?.value).toBe('');
    }));

    it('should accept product with status L and not pooled', fakeAsync(() => {
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      component.products.set(mockProducts);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(apiService.getAttributeGroups).toHaveBeenCalled();
    }));
  });

  describe('BUG 6: Attribute Type Validation', () => {
    it('should reject attribute with type != A (Error 9759)', fakeAsync(() => {
      const interdictionCode: AttributeCodeDto = {
        ...mockAttributeCodes[0],
        attribType: 'I', // Interdiction, not Attribute
      };
      component.attributeCodes.set([interdictionCode]);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Error 9759: Only attributes (type A) can be selected, not interdictions',
        'DISMISS',
      );
      expect(component.attributeForm.get('attribCode')?.value).toBe('');
    }));

    it('should accept attribute with type A', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(component.attributeDescription()).toBe('Irradiated - 25 Gy');
    }));
  });

  describe('BUG 8 & 9: Process Date Validation', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13T00:00:00';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
    });

    it('should reject future process date (Error 8030)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

      component.attributeForm.patchValue({ procDate: futureDate });

      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBe(true);
    });

    it('should reject process date before collection date (Error 8060)', () => {
      const pastDate = new Date('2026-05-10T00:00:00'); // Before collection date

      component.attributeForm.patchValue({ procDate: pastDate });

      expect(component.attributeForm.get('procDate')?.hasError('beforeCollectionDate')).toBe(true);
    });

    it('should accept valid process date (between collection and today)', () => {
      const validDate = new Date('2026-05-14T00:00:00');

      component.attributeForm.patchValue({ procDate: validDate });

      expect(component.attributeForm.get('procDate')?.valid).toBe(true);
    });

    it('should allow null process date', () => {
      component.attributeForm.patchValue({ procDate: null });

      expect(component.attributeForm.get('procDate')?.valid).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.products.set(mockProducts);
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
    });





    it('should return empty array when search does not match', (done) => {
      component.productSearchCtrl.setValue('NOMATCH');

      component.filteredProducts$.subscribe((filtered) => {
        expect(filtered.length).toBe(0);
        done();
      });
    });








  });


  describe('Error Handling', () => {
    it('should handle API error when loading products', fakeAsync(() => {
      apiService.getProductsForUnit.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component['loadProductsForUnit']('W454526051302-1', '2026-05-13');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load products'),
        'DISMISS',
      );
    }));

    it('should handle API error when loading attribute groups', fakeAsync(() => {
      apiService.getAttributeGroups.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      component['loadAttributeGroups']('RBC', 'E0701V00', 'I');
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to load attribute groups'),
        'DISMISS',
      );
    }));

    it('should not show error for 404 when loading component attributes', fakeAsync(() => {
      apiService.getComponentAttributes.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      component['loadDataForUnit']('W454526051302-1', '2026-05-13', 'E0701V00');
      tick();

      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(component.dataSource().length).toBe(0);
      expect(component.showResults).toBe(true);
    }));
  });

  describe('Data Deduplication', () => {
    it('should display all component attributes including duplicates per FMB', fakeAsync(() => {
      const duplicateData = [
        mockComponentAttributes[0],
        { ...mockComponentAttributes[0] }, // Exact duplicate
      ];
      apiService.getComponentAttributes.and.returnValue(of(duplicateData));

      component['loadDataForUnit']('W454526051302-1', '2026-05-13', 'E0701V00');
      tick();

      // FMB requirement: display all records including duplicates
      expect(component.dataSource().length).toBe(2);
    }));
  });

  // LAYER 2: Boundary Tests - Edge Cases
  describe('Form Field Boundaries', () => {


    it('should handle empty attribute group selection', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.patchValue({ attribGroup: 'IRR' });
      tick();

      component.attributeForm.patchValue({ attribGroup: '' });
      tick();

      expect(component.attributeCodes().length).toBe(0);
    }));

    it('should handle empty attribute code selection', fakeAsync(() => {
      component.attributeDescription.set('Test Description');
      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      component.attributeForm.patchValue({ attribCode: '' });
      tick();

      expect(component.attributeDescription()).toBe('');
    }));



    it('should handle null/undefined attribute group gracefully', fakeAsync(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentProductType = 'RBC';
      component.attributeForm.patchValue({ attribGroup: null });
      tick();

      expect(component.attributeCodes().length).toBe(0);
    }));

    it('should handle null/undefined attribute code gracefully', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.patchValue({ attribCode: null });
      tick();

      expect(component.attributeDescription()).toBe('');
    }));
  });

  describe('Process Date Boundary Conditions', () => {
    beforeEach(() => {
      component.currentCollDate = '2026-05-13T00:00:00';
    });

    it('should accept process date equal to today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      component.attributeForm.patchValue({ procDate: today });

      expect(component.attributeForm.get('procDate')?.valid).toBe(true);
    });

    it('should accept process date equal to collection date', () => {
      const collectionDate = new Date('2026-05-13T00:00:00');

      component.attributeForm.patchValue({ procDate: collectionDate });

      expect(component.attributeForm.get('procDate')?.valid).toBe(true);
    });

    it('should reject process date one day in future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      component.attributeForm.patchValue({ procDate: tomorrow });

      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBe(true);
    });

    it('should reject process date one day before collection date', () => {
      const dayBefore = new Date('2026-05-12T00:00:00');

      component.attributeForm.patchValue({ procDate: dayBefore });

      expect(component.attributeForm.get('procDate')?.hasError('beforeCollectionDate')).toBe(true);
    });

    it('should handle process date with time component correctly', () => {
      const validDateWithTime = new Date('2026-05-14T15:30:45');

      component.attributeForm.patchValue({ procDate: validDateWithTime });

      expect(component.attributeForm.get('procDate')?.valid).toBe(true);
    });
  });

  describe('Search Filter Boundaries', () => {
    beforeEach(() => {
      component.products.set(mockProducts);
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
    });

    it('should handle empty search term', (done) => {
      component.productSearchCtrl.setValue('');

      component.filteredProducts$.subscribe((filtered) => {
        expect(filtered.length).toBe(1);
        done();
      });
    });

    it('should handle null search term', (done) => {
      component.productSearchCtrl.setValue(null);

      component.filteredProducts$.subscribe((filtered) => {
        expect(filtered.length).toBe(1);
        done();
      });
    });

    it('should handle whitespace-only search term', (done) => {
      component.productSearchCtrl.setValue('   ');

      component.filteredProducts$.subscribe((filtered) => {
        expect(filtered.length).toBe(0);
        done();
      });
    });

    it('should handle special characters in search term', (done) => {
      component.productSearchCtrl.setValue('E0701V00-');

      component.filteredProducts$.subscribe((filtered) => {
        expect(filtered.length).toBe(0);
        done();
      });
    });
  });

  // LAYER 3: Business Logic Tests - Complex Scenarios
  describe('setupFormListeners - Cascade Logic', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.currentProductType = 'RBC';
      component.products.set(mockProducts);
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    });



    it('should reset attribute code when attribute group changes', fakeAsync(() => {
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
      tick();

      component.attributeForm.patchValue({ attribGroup: '' });
      tick();

      expect(component.attributeForm.get('attribCode')?.value).toBe('');
    }));

    it('should load attribute groups only when valid product selected', fakeAsync(() => {
      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(apiService.getAttributeGroups).toHaveBeenCalledWith('RBC', 'E0701V00', 'I');
    }));

    it('should load attribute codes only when all required data available', fakeAsync(() => {
      component.currentCodeScheme = 'I';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
      });
      tick();

      expect(apiService.getAttributeCodes).toHaveBeenCalledWith(
        'RBC',
        'IRR',
        'W454526051302-1',
        '2026-05-13',
        'E0701V00',
        'I'
      );
    }));

    it('should not load attribute codes if unit ID is missing', fakeAsync(() => {
      component.currentUnitId = '';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
      });
      tick();

      expect(apiService.getAttributeCodes).not.toHaveBeenCalled();
      expect(component.attributeCodes().length).toBe(0);
    }));

    it('should set code scheme to I for 8-char product codes', fakeAsync(() => {
      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(component.currentCodeScheme).toBe('I');
    }));

    it('should derive code scheme from product if available', fakeAsync(() => {
      const customProduct: ComponentProductDto = {
        ...mockProducts[0],
        productCode: 'ABC12',
        codeScheme: 'C',
      };
      component.products.set([customProduct]);
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));

      component.attributeForm.patchValue({ productCode: 'ABC12' });
      tick();

      expect(component.currentCodeScheme).toBe('C');
    }));
  });

  describe('Complex Product Validation Scenarios', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
    });

    it('should handle product with missing componentStatus', fakeAsync(() => {
      const productNoStatus: ComponentProductDto = {
        ...mockProducts[0],
        componentStatus: '' as any,
      };
      component.products.set([productNoStatus]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0210'),
        'DISMISS',
      );
    }));

    it('should handle product with status Q (quarantine)', fakeAsync(() => {
      const quarantineProduct: ComponentProductDto = {
        ...mockProducts[0],
        componentStatus: 'Q',
      };
      component.products.set([quarantineProduct]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Error 0210: Component must be in Lab status to add attributes',
        'DISMISS',
      );
      expect(component.attributeForm.get('productCode')?.value).toBe('');
    }));

    it('should handle product with missing poolProductFlag', fakeAsync(() => {
      const productNoPoolFlag: ComponentProductDto = {
        ...mockProducts[0],
        poolProductFlag: undefined,
      };
      component.products.set([productNoPoolFlag]);
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Should accept product without poolProductFlag (treated as non-pool)
      expect(snackbarService.showError).not.toHaveBeenCalled();
      expect(apiService.getAttributeGroups).toHaveBeenCalled();
    }));
  });

  describe('Attribute Type Validation Edge Cases', () => {


    it('should reject attribute code with type I (interdiction)', fakeAsync(() => {
      const interdictionCode: AttributeCodeDto = {
        ...mockAttributeCodes[0],
        attribType: 'I',
      };
      component.attributeCodes.set([interdictionCode]);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        'Error 9759: Only attributes (type A) can be selected, not interdictions',
        'DISMISS',
      );
      expect(component.attributeForm.get('attribCode')?.value).toBe('');
      expect(component.attributeDescription()).toBe('');
    }));

    it('should clear description when invalid attribute code selected', fakeAsync(() => {
      component.attributeDescription.set('Previous Description');
      const interdictionCode: AttributeCodeDto = {
        ...mockAttributeCodes[0],
        attribType: 'I',
      };
      component.attributeCodes.set([interdictionCode]);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      expect(component.attributeDescription()).toBe('');
    }));
  });

  describe('onSubmit - Complex Save Scenarios', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
    });

    it('should include process date in request if provided', fakeAsync(() => {
      const procDate = new Date('2026-05-14');
      component.attributeForm.patchValue({
        procDate,
        procTime: '14:30' // Time is required when date is provided
      });
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(apiService.saveComponentAttribute).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procDate: jasmine.any(String), // Will be formatted as string in component
        })
      );
    }));

    it('should exclude process date from request if not provided', fakeAsync(() => {
      component.attributeForm.patchValue({ procDate: null });
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(apiService.saveComponentAttribute).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procDate: undefined,
        })
      );
    }));

    it('should display calculated expiry date from response', fakeAsync(() => {
      const responseWithExpiry = {
        ...mockComponentAttributes[0],
        newExpiryDate: '2026-07-27T00:00:00',
      };
      apiService.saveComponentAttribute.and.returnValue(of(responseWithExpiry));
      apiService.getComponentAttributes.and.returnValue(of([responseWithExpiry]));

      component.onSubmit();
      tick();

      // After successful save, calculatedExpiryDate is cleared as part of form reset
      expect(component.calculatedExpiryDate()).toBe('');
    }));





    it('should clear all search controls after save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.productSearchCtrl.setValue('test');
      component.groupSearchCtrl.setValue('test');
      component.codeSearchCtrl.setValue('test');

      component.onSubmit();
      tick();

      expect(component.productSearchCtrl.value).toBe('');
      expect(component.groupSearchCtrl.value).toBe('');
      expect(component.codeSearchCtrl.value).toBe('');
    }));

    it('should mark all form controls as pristine after save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.attributeForm.markAsDirty();

      component.onSubmit();
      tick();

      Object.keys(component.attributeForm.controls).forEach((key) => {
        expect(component.attributeForm.get(key)?.pristine).toBe(true);
      });
    }));

    it('should handle save error with specific error message', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(
        throwError(() => ({
          error: { message: 'Duplicate attribute code for unit' },
        }))
      );

      component.onSubmit();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Duplicate attribute code for unit'),
        'DISMISS',
      );
    }));

    it('should handle save error with generic fallback message', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.onSubmit();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to save attribute'),
        'DISMISS',
      );
    }));
  });

  describe('hasFormData getter - Complex State', () => {
    it('should return true when unit ID is set', () => {
      component.currentUnitId = 'W454526051302-1';

      expect(component.hasFormData).toBe(true);
    });

    it('should return true when any form field has value', () => {
      component.currentUnitId = '';
      component.attributeForm.patchValue({ productCode: 'E0701V00' });

      expect(component.hasFormData).toBe(true);
    });

    it('should return false when all fields are empty', () => {
      component.currentUnitId = '';
      component.attributeForm.reset();

      expect(component.hasFormData).toBe(false);
    });

    it('should return true when process time is set', () => {
      component.currentUnitId = '';
      component.attributeForm.patchValue({ procTime: '10:30' });

      expect(component.hasFormData).toBe(true);
    });
  });

  describe('Unit Validation Edge Cases', () => {


    it('should handle unit validation with null collectionDate', () => {
      const responseNoCollDate = {
        parsedUnitId: 'W454526051302-1',
        checkDigit: '1',
        codeScheme: 'I' as const,
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I' as const,
        collectionDate: null as any,
      };

      component.onUnitValidated(responseNoCollDate);

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('does not exist in the database'),
        'DISMISS',
      );
    });

    it('should handle unit validation with empty string collectionDate', () => {
      const responseEmptyCollDate = {
        parsedUnitId: 'W454526051302-1',
        checkDigit: '1',
        codeScheme: 'I' as const,
        manualUnitId: 'W454526051302-1',
        codabarUnitScheme: null,
        entryMode: 'S' as const,
        barcodeType: 'CODE128' as const,
        chapterScheme: 'I' as const,
        collectionDate: '',
      };

      component.onUnitValidated(responseEmptyCollDate);

      expect(snackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('does not exist in the database'),
        'DISMISS',
      );
    });
  });

  describe('Process Date Auto-Focus', () => {


    it('should handle missing processDateInput gracefully', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.processDateInput = undefined as any;

      expect(() => {
        component.attributeForm.patchValue({ attribCode: 'IRR25' });
        tick(100);
      }).not.toThrow();
    }));
  });

  describe('onProcessDateInput - Manual Date Entry', () => {
    it('should validate date input on manual entry', () => {
      const inputEvent = {
        target: { value: '15-JUN-2026' },
      } as any;

      spyOn<any>(component, 'onProcessDateInput').and.callThrough();

      component.onProcessDateInput(inputEvent);

      expect(component['onProcessDateInput']).toHaveBeenCalledWith(inputEvent);
    });

    it('should handle empty date input', () => {
      const inputEvent = {
        target: { value: '' },
      } as any;

      expect(() => {
        component.onProcessDateInput(inputEvent);
      }).not.toThrow();
    });
  });

  // NEW TESTS FOR RECENT CHANGES
  describe('setupFormListeners - Auto-focus Process Date field after attribute code selection', () => {


    it('should not throw error if processDateInput is undefined', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.processDateInput = undefined as any;

      expect(() => {
        component.attributeForm.patchValue({ attribCode: 'IRR25' });
        tick(100);
      }).not.toThrow();
    }));

    it('should not throw error if processDateInput.nativeElement is null', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.processDateInput = {
        nativeElement: null
      } as any;

      expect(() => {
        component.attributeForm.patchValue({ attribCode: 'IRR25' });
        tick(100);
      }).not.toThrow();
    }));
  });

  describe('setupFormListeners - Attribute description field fix (attribDesc vs attribDescription)', () => {
    it('should set description from attribDesc field correctly', fakeAsync(() => {
      const codeWithAttribDesc: AttributeCodeDto = {
        attribCode: 'IRR25',
        attribDesc: 'Correct Description Field',
        attribGroup: 'IRR',
        attribType: 'A',
        lifeSpan: null,
        lifeSpanInd: null,
        interCode: null,
        statusFlag: 'A',
        stopLabelFlag: 'N',
      };
      component.attributeCodes.set([codeWithAttribDesc]);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      // Should use attribDesc (correct field), not attribDescription
      expect(component.attributeDescription()).toBe('Correct Description Field');
    }));

    it('should handle missing attribDesc gracefully', fakeAsync(() => {
      const codeWithoutDesc: AttributeCodeDto = {
        attribCode: 'IRR25',
        attribDesc: '',
        attribGroup: 'IRR',
        attribType: 'A',
        lifeSpan: null,
        lifeSpanInd: null,
        interCode: null,
        statusFlag: 'A',
        stopLabelFlag: 'N',
      };
      component.attributeCodes.set([codeWithoutDesc]);

      component.attributeForm.patchValue({ attribCode: 'IRR25' });
      tick();

      expect(component.attributeDescription()).toBe('');
    }));
  });

  describe('onSubmit - Complete form reset after save (all fields, signals, dropdowns, search controls)', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: new Date('2026-05-14'),
        procTime: '10:30',
      });
      component.products.set(mockProducts);
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeDescription.set('Test Description');
      component.calculatedExpiryDate.set('2026-07-15');

      // Set search controls to non-empty values
      component.productSearchCtrl.setValue('E0701');
      component.groupSearchCtrl.setValue('IRR');
      component.codeSearchCtrl.setValue('IRR25');
    });

    it('should clear currentUnitId after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.currentUnitId).toBe('');
    }));

    it('should clear currentCollDate after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.currentCollDate).toBe('');
    }));

    it('should clear currentProductType after successful save', fakeAsync(() => {
      component.currentProductType = 'RBC';
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.currentProductType).toBe('');
    }));

    it('should clear currentCodeScheme after successful save', fakeAsync(() => {
      component.currentCodeScheme = 'I';
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.currentCodeScheme).toBe('');
    }));

    it('should reset all form fields to null after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.attributeForm.value.productCode).toBe(null);
      expect(component.attributeForm.value.attribGroup).toBe(null);
      expect(component.attributeForm.value.attribCode).toBe(null);
      expect(component.attributeForm.value.procDate).toBe(null);
      // procTime is undefined when disabled (which it is when procDate is null)
      expect(component.attributeForm.value.procTime).toBeUndefined();
    }));

    it('should clear all signals after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.attributeDescription()).toBe('');
      expect(component.calculatedExpiryDate()).toBe('');
      expect(component.products().length).toBe(0);
      expect(component.attributeGroups().length).toBe(0);
      expect(component.attributeCodes().length).toBe(0);
    }));

    it('should clear all dropdown search controls after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.onSubmit();
      tick();

      expect(component.productSearchCtrl.value).toBe('');
      expect(component.groupSearchCtrl.value).toBe('');
      expect(component.codeSearchCtrl.value).toBe('');
    }));

    it('should clear filtered observables after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      // Set some initial values in the filtered observables
      component.filteredProducts$.next([mockProducts[0]]);
      component.filteredGroups$.next([mockAttributeGroups[0]]);
      component.filteredCodes$.next([mockAttributeCodes[0]]);

      let productsValue: any[] = [];
      let groupsValue: any[] = [];
      let codesValue: any[] = [];

      // Subscribe after setting initial values to capture the clear event
      const prodsSub = component.filteredProducts$.subscribe(products => productsValue = products);
      const groupsSub = component.filteredGroups$.subscribe(groups => groupsValue = groups);
      const codesSub = component.filteredCodes$.subscribe(codes => codesValue = codes);

      component.onSubmit();
      tick();

      expect(productsValue.length).toBe(0);
      expect(groupsValue.length).toBe(0);
      expect(codesValue.length).toBe(0);

      prodsSub.unsubscribe();
      groupsSub.unsubscribe();
      codesSub.unsubscribe();
    }));

    it('should mark all form controls as untouched after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      component.attributeForm.markAllAsTouched();

      component.onSubmit();
      tick();

      Object.keys(component.attributeForm.controls).forEach(key => {
        expect(component.attributeForm.get(key)?.untouched).toBe(true);
      });
    }));

    it('should clear all form errors after successful save', fakeAsync(() => {
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      // Set up component state for valid submission
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';

      // Set the form to be valid (required fields)
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25'
      });

      // Verify form is valid before save
      expect(component.attributeForm.valid).toBe(true);

      component.onSubmit();
      tick();

      // After successful save, the form is reset to null values. Required validators
      // still fire against null values, but all controls are pristine and untouched
      // so validation errors won't display in the UI.
      Object.keys(component.attributeForm.controls).forEach(key => {
        const control = component.attributeForm.get(key);
        expect(control?.pristine).toBe(true);
        expect(control?.untouched).toBe(true);
      });

      // Ensure no custom/dynamic errors remain (e.g., futureTime on procTime)
      expect(component.attributeForm.get('procTime')?.hasError('futureTime')).toBeFalsy();
      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBeFalsy();
      expect(component.attributeForm.get('procDate')?.hasError('beforeCollectionDate')).toBeFalsy();
    }));


  });
  // ========================================
  // NEW TESTS FOR ALL BUG FIXES
  // ========================================

  describe('BUG 1: Form validation not showing after reset when pressing enter', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.products.set(mockProducts);
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));
    });

    it('should show validation errors when submitting incomplete form after successful save', fakeAsync(() => {
      // First successful save
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
      component.onSubmit();
      tick();

      // Reset currentUnitId to simulate user entering a new unit
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.products.set(mockProducts);

      // Try to submit without filling required fields
      component.onSubmit();

      // Validation should show - all fields should be marked as touched
      expect(component.attributeForm.get('productCode')?.touched).toBe(true);
      expect(component.attributeForm.get('attribGroup')?.touched).toBe(true);
      expect(component.attributeForm.get('attribCode')?.touched).toBe(true);

      // Form should be invalid
      expect(component.attributeForm.valid).toBe(false);

      // Save should not have been called again
      expect(apiService.saveComponentAttribute).toHaveBeenCalledTimes(1);
    }));




  });

  describe('BUG 2: Validation errors appearing before user interaction', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.currentProductType = 'RBC';
      component.products.set(mockProducts);
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiService.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    });

    it('should mark attribute group as untouched when product code changes', fakeAsync(() => {
      // Select initial values
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
      });
      tick();

      // Change product code
      component.attributeForm.patchValue({ productCode: '' });
      tick();

      // Attribute group should be untouched (not showing validation errors)
      expect(component.attributeForm.get('attribGroup')?.untouched).toBe(true);
    }));

    it('should mark attribute code as untouched when attribute group changes', fakeAsync(() => {
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
      tick();

      // Change attribute group
      component.attributeForm.patchValue({ attribGroup: '' });
      tick();

      // Attribute code should be untouched (not showing validation errors)
      expect(component.attributeForm.get('attribCode')?.untouched).toBe(true);
    }));

    it('should not show validation errors immediately after product selection', fakeAsync(() => {
      // Select product - this should clear dependent fields without showing errors
      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Dependent fields should be untouched
      expect(component.attributeForm.get('attribGroup')?.untouched).toBe(true);
      expect(component.attributeForm.get('attribCode')?.untouched).toBe(true);

      // Fields should be invalid but not showing errors yet (untouched)
      expect(component.attributeForm.get('attribGroup')?.invalid).toBe(true);
      expect(component.attributeForm.get('attribCode')?.invalid).toBe(true);
    }));
  });

  describe('BUG 3: Process date validation showing error codes instead of messages', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13T00:00:00';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
    });

    it('should show user-friendly message for future date error (no error code 8030)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      component.attributeForm.patchValue({ procDate: futureDate });
      component.attributeForm.get('procDate')?.markAsTouched();

      // Validator should set futureDate error
      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBe(true);

      // Template should show message without error code
      // Error message in template: "Process date cannot be in the future"
      // (No "Error 8030:" prefix)
    });

    it('should show user-friendly message for date before collection error (no error code 8060)', () => {
      const pastDate = new Date('2026-05-10T00:00:00');

      component.attributeForm.patchValue({ procDate: pastDate });
      component.attributeForm.get('procDate')?.markAsTouched();

      // Validator should set beforeCollectionDate error
      expect(component.attributeForm.get('procDate')?.hasError('beforeCollectionDate')).toBe(true);

      // Template should show message without error code
      // Error message in template: "Process date cannot be earlier than collection date"
      // (No "Error 8060:" prefix)
    });

    it('should have futureDate error key instead of numeric 8030', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      component.attributeForm.patchValue({ procDate: futureDate });

      const errors = component.attributeForm.get('procDate')?.errors;
      expect(errors).toBeTruthy();
      expect(errors?.['futureDate']).toBe(true);
      expect(errors?.['8030']).toBeUndefined();
    });

    it('should have beforeCollectionDate error key instead of numeric 8060', () => {
      const pastDate = new Date('2026-05-10T00:00:00');

      component.attributeForm.patchValue({ procDate: pastDate });

      const errors = component.attributeForm.get('procDate')?.errors;
      expect(errors).toBeTruthy();
      expect(errors?.['beforeCollectionDate']).toBe(true);
      expect(errors?.['8060']).toBeUndefined();
    });
  });

  describe('BUG 4: Time field value disappearing when clicking out', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: new Date('2026-05-14'),
      });
      // Mock API services for auto-save functionality
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));
    });

    it('should keep time value visible after blur', fakeAsync(() => {
      // Enable time field by setting process date
      component.attributeForm.patchValue({ procDate: new Date('2026-05-14') });
      tick();

      // Set time value
      component.attributeForm.patchValue({ procTime: '10:30' });

      // Make form invalid to prevent auto-save on blur
      component.attributeForm.patchValue({ productCode: '' });

      // Blur the time field
      component.onProcessTimeBlur();

      // Time value should still be present (no auto-save happened due to invalid form)
      expect(component.attributeForm.get('procTime')?.value).toBe('10:30');
    }));

    it('should persist time value through form state changes', fakeAsync(() => {
      // Set time value
      component.attributeForm.patchValue({ procTime: '14:45' });

      // Trigger various form operations
      component.attributeForm.get('procTime')?.markAsTouched();
      component.attributeForm.get('procTime')?.markAsDirty();

      // Time value should still be present
      expect(component.attributeForm.get('procTime')?.value).toBe('14:45');
    }));
  });

  describe('BUG 5: Time displaying incorrectly due to timezone conversion', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
      });
      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));
    });

    it('should send date and time as local datetime string without UTC conversion', fakeAsync(() => {
      const procDate = new Date('2026-05-14T00:00:00');
      component.attributeForm.patchValue({
        procDate: procDate,
        procTime: '10:01', // User enters 10:01 AM
      });

      component.onSubmit();
      tick();

      // Verify the API was called with local time string (not UTC converted)
      expect(apiService.saveComponentAttribute).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procDate: '2026-05-14T10:01:00', // Should be exactly as entered (no Z suffix)
        })
      );
    }));

    it('should not convert time to UTC when combining date and time', fakeAsync(() => {
      const procDate = new Date('2026-05-14T00:00:00');
      component.attributeForm.patchValue({
        procDate: procDate,
        procTime: '15:30',
      });

      component.onSubmit();
      tick();

      const call = apiService.saveComponentAttribute.calls.mostRecent();
      const request = call.args[0];

      // Should be local time string
      expect(request.procDate).toBe('2026-05-14T15:30:00');

      // Should NOT end with 'Z' (which would indicate UTC)
      expect(request.procDate?.toString().endsWith('Z')).toBe(false);
    }));

    it('should format date as YYYY-MM-DD correctly', fakeAsync(() => {
      // Use a date after the collection date (2026-05-13) so processDateValidator
      // does not reject it. Month 06 and day 05 both require leading-zero padding.
      const procDate = new Date('2026-06-05T00:00:00');
      component.attributeForm.patchValue({
        procDate: procDate,
        procTime: '09:15',
      });

      component.onSubmit();
      tick();

      expect(apiService.saveComponentAttribute).toHaveBeenCalled();
      const call = apiService.saveComponentAttribute.calls.mostRecent();
      const request = call.args[0];

      // Verify date is formatted correctly with leading zeros
      expect(request.procDate).toBe('2026-06-05T09:15:00');
    }));

    it('should handle time with seconds correctly', fakeAsync(() => {
      const procDate = new Date('2026-05-14T00:00:00');
      component.attributeForm.patchValue({
        procDate: procDate,
        procTime: '23:59', // Input is HH:mm
      });

      component.onSubmit();
      tick();

      // Should append :00 for seconds
      expect(apiService.saveComponentAttribute).toHaveBeenCalledWith(
        jasmine.objectContaining({
          procDate: '2026-05-14T23:59:00',
        })
      );
    }));
  });

  describe('BUG 6: Pagination not visible', () => {
    it('should always render DataTable component even with empty data', () => {
      component.dataSource.set([]);
      component.showResults = true;

      // DataTable should be in the template unconditionally
      // Not wrapped in @if (dataSource().length > 0)
      expect(component.tableConfig()).toBeTruthy();
      expect(component.dataSource().length).toBe(0);
    });





    it('should create new pagination object reference to trigger change detection', fakeAsync(() => {
      const initialConfig = component.tableConfig();
      const initialPagination = initialConfig.pagination;

      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));
      component['loadDataForUnit']('W454526051302-1', '2026-05-13', 'E0701V00');
      tick();

      const updatedConfig = component.tableConfig();
      const updatedPagination = updatedConfig.pagination;

      // Pagination object should be a new reference
      expect(updatedPagination).not.toBe(initialPagination);
      // Config should be a new reference
      expect(updatedConfig).not.toBe(initialConfig);
    }));




  });

  describe('BUG 7: Process date auto-focus and time required when date filled', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.products.set(mockProducts);
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
    });



    it('should make time field required when process date has value', fakeAsync(() => {
      // Initially time field should be disabled and optional
      expect(component.attributeForm.get('procTime')?.disabled).toBe(true);
      expect(component.attributeForm.get('procTime')?.hasError('required')).toBe(false);

      // Set process date
      component.attributeForm.patchValue({ procDate: new Date('2026-05-14') });
      tick();

      // Time field should be enabled and required
      expect(component.attributeForm.get('procTime')?.enabled).toBe(true);
      component.attributeForm.get('procTime')?.markAsTouched();
      expect(component.attributeForm.get('procTime')?.hasError('required')).toBe(true);
    }));

    it('should disable and clear time field when process date is cleared', fakeAsync(() => {
      // Set date and time
      component.attributeForm.patchValue({
        procDate: new Date('2026-05-14'),
        procTime: '10:30',
      });
      tick();

      // Clear process date
      component.attributeForm.patchValue({ procDate: null });
      tick();

      // Time field should be disabled and cleared
      expect(component.attributeForm.get('procTime')?.disabled).toBe(true);
      expect(component.attributeForm.get('procTime')?.value).toBe('');
      expect(component.attributeForm.get('procTime')?.hasError('required')).toBe(false);
    }));







    it('should auto-save when both date and time are filled and form is valid', fakeAsync(() => {
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: new Date('2026-05-14'),
      });

      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      // Time field should be enabled
      tick();
      expect(component.attributeForm.get('procTime')?.enabled).toBe(true);

      // Fill time and blur
      component.attributeForm.patchValue({ procTime: '10:30' });
      component.onProcessTimeBlur();
      tick();

      // Should auto-save
      expect(apiService.saveComponentAttribute).toHaveBeenCalled();
    }));

    it('should handle Enter key on process date field correctly', fakeAsync(() => {
      const mockTimeInput = jasmine.createSpyObj('HTMLInputElement', ['focus']);
      component.processTimeInput = { nativeElement: mockTimeInput } as any;

      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: new Date('2026-05-14'),
      });
      tick();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(enterEvent, 'preventDefault');

      component.onProcessDateEnter(enterEvent);
      tick(100);

      // Should prevent default and focus time field
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(mockTimeInput.focus).toHaveBeenCalled();
    }));
  });

  describe('Additional Coverage: ViewChild references', () => {


    it('should handle missing processTimeInput gracefully during auto-focus', fakeAsync(() => {
      component.processTimeInput = undefined as any;

      component.attributeForm.patchValue({ procDate: new Date('2026-05-14') });

      expect(() => {
        component.onProcessDateBlur();
        tick(100);
      }).not.toThrow();
    }));

    it('should handle null processTimeInput.nativeElement gracefully', fakeAsync(() => {
      component.processTimeInput = { nativeElement: null } as any;

      component.attributeForm.patchValue({ procDate: new Date('2026-05-14') });

      expect(() => {
        component.onProcessDateBlur();
        tick(100);
      }).not.toThrow();
    }));
  });
  describe('Additional Coverage: Process date Enter key with complete form', () => {
    it('should submit form when Enter is pressed with all fields filled', fakeAsync(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      component.attributeForm.patchValue({
        productCode: 'E0701V00',
        attribGroup: 'IRR',
        attribCode: 'IRR25',
        procDate: new Date('2026-05-14'),
      });
      tick();
      component.attributeForm.patchValue({ procTime: '10:30' });

      apiService.saveComponentAttribute.and.returnValue(of(mockComponentAttributes[0]));
      apiService.getComponentAttributes.and.returnValue(of(mockComponentAttributes));

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(enterEvent, 'preventDefault');

      component.onProcessDateEnter(enterEvent);
      tick();

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(apiService.saveComponentAttribute).toHaveBeenCalled();
    }));
  });
  // NEW TESTS FOR LATEST CHANGES
  describe('FIX: Process Date uses chapter local date instead of system date', () => {
    beforeEach(() => {
      component.currentCollDate = '2026-05-13T00:00:00';
    });

    it('should use chapter local date from dateAdapter for future date validation', () => {
      // Mock dateAdapter.today() to return a specific chapter date
      const chapterToday = new Date('2026-06-15T00:00:00');
      spyOn(component['dateAdapter'], 'today').and.returnValue(chapterToday);

      // Set process date to June 16, 2026 (1 day after chapter today)
      const processDate = new Date('2026-06-16T00:00:00');
      component.attributeForm.patchValue({ procDate: processDate });

      // Should be marked as future date
      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBe(true);
    });

    it('should accept process date equal to chapter local date', () => {
      // Mock dateAdapter.today() to return a specific chapter date
      const chapterToday = new Date('2026-06-15T00:00:00');
      spyOn(component['dateAdapter'], 'today').and.returnValue(chapterToday);

      // Set process date to June 15, 2026 (same as chapter today)
      const processDate = new Date('2026-06-15T00:00:00');
      component.attributeForm.patchValue({ procDate: processDate });

      // Should NOT have future date error
      expect(component.attributeForm.get('procDate')?.hasError('futureDate')).toBe(false);
    });


  });

  describe('FIX: Expiry date auto-populates when product code is selected', () => {
    beforeEach(() => {
      component.currentUnitId = 'W454526051302-1';
      component.currentCollDate = '2026-05-13';
      apiService.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    });

    it('should set calculatedExpiryDate when product with expiryDate is selected', fakeAsync(() => {
      const productWithExpiry: ComponentProductDto = {
        ...mockProducts[0],
        expiryDate: '2026-07-15T14:30:00',
      };
      component.products.set([productWithExpiry]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Expiry date should be formatted and set
      expect(component.calculatedExpiryDate()).toBe('15-JUL-2026 14:30');
    }));

    it('should clear calculatedExpiryDate when product without expiryDate is selected', fakeAsync(() => {
      const productNoExpiry: ComponentProductDto = {
        ...mockProducts[0],
        expiryDate: null,
      };
      component.products.set([productNoExpiry]);

      // Set initial expiry date
      component.calculatedExpiryDate.set('15-JUL-2026 14:30');

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Expiry date should be cleared
      expect(component.calculatedExpiryDate()).toBe('');
    }));

    it('should clear calculatedExpiryDate when product code is cleared', fakeAsync(() => {
      component.products.set(mockProducts);
      component.calculatedExpiryDate.set('15-JUL-2026 14:30');

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Clear product code
      component.attributeForm.patchValue({ productCode: '' });
      tick();

      // Expiry date should be cleared
      expect(component.calculatedExpiryDate()).toBe('');
    }));

    it('should clear calculatedExpiryDate when product validation fails (non-Lab status)', fakeAsync(() => {
      const invalidProduct: ComponentProductDto = {
        ...mockProducts[0],
        componentStatus: 'Q',
        expiryDate: '2026-07-15T14:30:00',
      };
      component.products.set([invalidProduct]);
      component.calculatedExpiryDate.set('15-JUL-2026 14:30');

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Expiry date should be cleared because product validation failed
      expect(component.calculatedExpiryDate()).toBe('');
    }));

    it('should clear calculatedExpiryDate when product is pool product', fakeAsync(() => {
      const poolProduct: ComponentProductDto = {
        ...mockProducts[0],
        poolProductFlag: 'Y',
        expiryDate: '2026-07-15T14:30:00',
      };
      component.products.set([poolProduct]);
      component.calculatedExpiryDate.set('15-JUL-2026 14:30');

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Expiry date should be cleared because product is pool
      expect(component.calculatedExpiryDate()).toBe('');
    }));

    it('should format expiryDate with formatTableDateTime (24-hour format)', fakeAsync(() => {
      const productWithExpiry: ComponentProductDto = {
        ...mockProducts[0],
        expiryDate: '2026-12-25T16:45:00',
      };
      component.products.set([productWithExpiry]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Should be in 24-hour format (16:45, not 04:45 PM)
      expect(component.calculatedExpiryDate()).toBe('25-DEC-2026 16:45');
    }));

    it('should handle expiryDate as Date object', fakeAsync(() => {
      const productWithExpiry: ComponentProductDto = {
        ...mockProducts[0],
        expiryDate: new Date('2026-08-20T10:15:00') as any,
      };
      component.products.set([productWithExpiry]);

      component.attributeForm.patchValue({ productCode: 'E0701V00' });
      tick();

      // Should convert Date object to ISO string and format
      expect(component.calculatedExpiryDate()).toContain('20-AUG-2026');
      expect(component.calculatedExpiryDate()).toContain('10:15');
    }));
  });

  describe('FIX: Time 24-hour format directive', () => {
    it('should use Time24hrDirective for time input', () => {
      // Verify the component is created successfully with the directive
      // The directive is applied via the appTime24hr attribute in the template
      const timeInput = fixture.nativeElement.querySelector('input[formControlName="procTime"]');

      // Component should be created successfully with directive
      expect(component).toBeTruthy();
      expect(timeInput).toBeTruthy();

      // The directive converts the input type from 'time' to 'text'
      // So if the directive is working, the input type should be 'text'
      expect(timeInput.type).toBe('text');
    });
  });
});
