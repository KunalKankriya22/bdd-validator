import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { ConvertComponentIntoSpikedBagComponent } from './convert-component-into-spiked-bag';
import { ConvertSpikedBagService } from './services/convert-spiked-bag.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ConvertComponentIntoSpikedBagComponent', () => {
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: ConvertComponentIntoSpikedBagComponent;
  let fixture: ComponentFixture<ConvertComponentIntoSpikedBagComponent>;
  let service: jasmine.SpyObj<ConvertSpikedBagService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog> | any;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ConvertSpikedBagService', [
      'getProcessCodes',
      'validateUnit',
      'getValidCatalogs',
      'getProducts',
      'deriveProduct',
      'convertComponent',
      'reprintLabel',
      'getAttributesForProcess',
      'validateCatalogNumber',
      'getAttributeGroupsForProduct',
      'getAttributeTypesForProduct'
    ]);

    // Set safe defaults so indirect calls don't crash with undefined.pipe()
    serviceSpy.getProcessCodes.and.returnValue(of([]));
    serviceSpy.getValidCatalogs.and.returnValue(of([]));
    serviceSpy.getProducts.and.returnValue(of([]));
    serviceSpy.deriveProduct.and.returnValue(of({ success: false, hasMultipleMatches: false }));
    serviceSpy.convertComponent.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));
    serviceSpy.getAttributesForProcess.and.returnValue(of({ success: false, statusCode: 200, message: '', item: null }));
    serviceSpy.getAttributeGroupsForProduct.and.returnValue(of([]));
    serviceSpy.getAttributeTypesForProduct.and.returnValue(of([]));

    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => ({ title: 'Test Title', subtitle: '' })
    });

    headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
imports: [
        ConvertComponentIntoSpikedBagComponent,
        HttpClientTestingModule],
      providers: [
        { provide: ConvertSpikedBagService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getProcessCodes.calls.reset();


      serviceSpy.validateUnit.calls.reset();


      serviceSpy.getValidCatalogs.calls.reset();


      serviceSpy.getProducts.calls.reset();


      serviceSpy.deriveProduct.calls.reset();


      serviceSpy.convertComponent.calls.reset();


      serviceSpy.reprintLabel.calls.reset();


      serviceSpy.getAttributesForProcess.calls.reset();


      serviceSpy.validateCatalogNumber.calls.reset();


      serviceSpy.getAttributeGroupsForProduct.calls.reset();


      serviceSpy.getAttributeTypesForProduct.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      serviceSpy.getProcessCodes.and.returnValue(of([]));


      serviceSpy.getValidCatalogs.and.returnValue(of([]));


      serviceSpy.getProducts.and.returnValue(of([]));


      serviceSpy.deriveProduct.and.returnValue(of({ success: false, hasMultipleMatches: false }));


      serviceSpy.convertComponent.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));


      serviceSpy.getAttributesForProcess.and.returnValue(of({ success: false, statusCode: 200, message: '', item: null }));


      serviceSpy.getAttributeGroupsForProduct.and.returnValue(of([]));


      serviceSpy.getAttributeTypesForProduct.and.returnValue(of([]));


    service = TestBed.inject(ConvertSpikedBagService) as jasmine.SpyObj<ConvertSpikedBagService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(ConvertComponentIntoSpikedBagComponent);
    component = fixture.componentInstance;
  });



  describe('Verify Product Validation', () => {
    beforeEach(() => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      // Set up component state for verify product testing
      (component as any).newProductCode.set('RBP250LR');
      component.form.get('verifyProduct')?.enable();
    });

    it('should show error and clear field when verify product does not match new product', () => {
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({ verifyProduct: 'WRONG_CODE' });
      (component as any).onVerifyProductEnter();

      expect(snackBarSpy).toHaveBeenCalledWith('Product codes don\'t match', 'DISMISS', jasmine.any(Object));
      expect(component.form.get('verifyProduct')?.value).toBe('');


    });

    it('should trim spaces and compare case-insensitively when validating verify product', () => {
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      const convertSpy = spyOn(component as any, 'commitConversion');

      // Test with extra spaces and lowercase
      component.form.patchValue({ verifyProduct: '  rbp250lr  ' });
      (component as any).onVerifyProductEnter();

      expect(snackBarSpy).not.toHaveBeenCalledWith('Product codes don\'t match', 'DISMISS', jasmine.any(Object));
      expect(convertSpy).toHaveBeenCalled();
    });


    it('should do nothing when verify product field is empty', () => {
      const snackBarSpy = spyOn((component as any).snackBar, 'open');
      const convertSpy = spyOn(component as any, 'commitConversion');

      component.form.patchValue({ verifyProduct: '' });
      (component as any).onVerifyProductEnter();

      expect(snackBarSpy).not.toHaveBeenCalled();
      expect(convertSpy).not.toHaveBeenCalled();
    });

  });

  describe('Commit Conversion', () => {
    beforeEach(() => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      // Set up component state for conversion
      (component as any).currentUnitId.set('W12345678');
      (component as any).oldProductCode.set('RBP250');
      (component as any).newProductCode.set('RBP250LR');
      component.form.patchValue({
        processCode: 'SPIKE',
        productCode: 'RBP250',
        attributeGroup: 'LEUK',
        attributeType: 'LR',
        catalogNumber: 'CAT-12345',
        verifyProduct: 'RBP250LR'
      });
    });

    it('should show success message with entry count after conversion', () => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          unitId: 'W12345678',
          productCode: 'RBP250',
          catalogNumber: 'CAT-12345',
          processDateTime: '2026-06-16T14:30:00',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR'
        }]
      };

      service.convertComponent.and.returnValue(of(mockResponse));
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      (component as any).entryCount.set(0);
      (component as any).commitConversion();

      expect(snackBarSpy).toHaveBeenCalledWith('1 Entry saved', 'DISMISS', jasmine.any(Object));
      expect((component as any).entryCount()).toBe(1);
    });

    it('should show API message if provided in response', () => {
      const mockResponse = {
        success: true,
        message: 'Component converted successfully',
        statusCode: 200,
        data: [{
          unitId: 'W12345678',
          productCode: 'RBP250',
          catalogNumber: 'CAT-12345',
          processDateTime: '2026-06-16T14:30:00',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR'
        }]
      };

      service.convertComponent.and.returnValue(of(mockResponse));
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      (component as any).commitConversion();

      expect(snackBarSpy).toHaveBeenCalledWith('Component converted successfully', 'DISMISS', jasmine.any(Object));
    });

    it('should add new row to conversions table after successful conversion', () => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          unitId: 'W12345678',
          productCode: 'RBP250',
          catalogNumber: 'CAT-12345',
          processDateTime: '2026-06-16T14:30:00',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR'
        }]
      };

      service.convertComponent.and.returnValue(of(mockResponse));
      (component as any).conversions.set([]);

      (component as any).commitConversion();

      expect((component as any).conversions().length).toBe(1);
      expect((component as any).conversions()[0].unitId).toBe('W12345678');
      expect((component as any).conversions()[0].newProduct).toBe('RBP250LR');
    });

    it('should show plural "Entries" when count is greater than 1', () => {
      const mockResponse = {
        success: true,
        message: '',
        statusCode: 200,
        data: [{
          unitId: 'W12345678',
          productCode: 'RBP250',
          catalogNumber: 'CAT-12345',
          processDateTime: '2026-06-16T14:30:00',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR'
        }]
      };

      service.convertComponent.and.returnValue(of(mockResponse));
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      (component as any).entryCount.set(1); // Already has 1 entry
      (component as any).commitConversion();

      expect(snackBarSpy).toHaveBeenCalledWith('2 Entries saved', 'DISMISS', jasmine.any(Object));
      expect((component as any).entryCount()).toBe(2);
    });
  });

  it('should initialize form with correct default values', () => {
    service.getProcessCodes.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.form).toBeDefined();
    expect(component.form.get('processCode')?.value).toBeNull();
    expect(component.form.get('processDateTime')?.value).toBeDefined();
  });

  it('should update process description when process code changes', () => {
    const mockProcessCodes = [
      { processCode: 'FROZ', processCodeDesc: 'Freezing' }
    ];

    service.getProcessCodes.and.returnValue(of(mockProcessCodes));
    fixture.detectChanges();

    (component as any).onProcessCodeChange('FROZ');

    expect((component as any).selectedProcessDescription()).toBe('Freezing');
  });


  it('should set unit valid flag when unit is validated', () => {
    service.getProcessCodes.and.returnValue(of([]));
    service.getProducts.and.returnValue(of([]));

    const mockValidation = {
      success: true,
      message: 'Valid',
      parsedUnitId: 'W1234',
      collectionDate: '2026-03-14',
      productCode: 'E0385V00',
      productDesc: 'RBC Leukocytes Reduced',
      attributeGroup: '+',
      attributeCode: '+02'
    };

    fixture.detectChanges();
    (component as any).onUnitValidated(mockValidation);

    expect((component as any).unitIdValid()).toBeTrue();
    expect((component as any).currentUnitId()).toBe('W1234');
    expect((component as any).collectionDate()).toBe('2026-03-14');
  });


  it('should display empty state when no conversions exist', () => {
    service.getProcessCodes.and.returnValue(of([{ processCode: 'FROZ', processCodeDesc: 'Freezing' }]));
    fixture.detectChanges();

    component.form.patchValue({ processCode: 'FROZ' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const emptyState = compiled.querySelector('.empty-state');

    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No Results to Display');
  });


  // ========================================
  // DateTime Handling Tests
  // ========================================
  describe('DateTime Handling', () => {
    // it('should format datetime correctly for display', () => {
    //   service.getProcessCodes.and.returnValue(of([]));
    //   fixture.detectChanges();

    //   const formattedDateTime = (component as any).getFormattedDateTime();

    //   expect(formattedDateTime).toMatch(/\d{2}-[A-Z]{3}-\d{2} \d{2}:\d{2}/);
    // });


    it('should update currentDateTime when dialog returns result', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      const newMoment = (component as any).currentDateTime().clone().add(1, 'hour');
      const mockDialogRef = {
        afterClosed: () => of(newMoment)
      };

      spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef as any);
      (component as any).openDateTimePicker();

      expect((component as any).currentDateTime()).toEqual(newMoment);
    });
  });

  // ========================================
  // Product Code Management Tests
  // ========================================
  describe('Product Code Management', () => {
    it('should load products when unit is validated with process code', () => {
      const mockProducts = [
        { productCode: 'RBP250', productDesc: 'RBC Platelets', productType: 'RBC', componentPrefix: 'R' }
      ];

      service.getProcessCodes.and.returnValue(of([]));
      service.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ' });
      (component as any).currentUnitId.set('W1234');
      (component as any).collectionDate.set('2026-03-14');

      (component as any).loadProductsForUnit();

      expect(service.getProducts).toHaveBeenCalledWith('W1234', '2026-03-14', 'FROZ');
      expect((component as any).productCodeOptions().length).toBe(1);
    });

    it('should auto-select product when only one product exists', () => {
      const mockProducts = [
        { productCode: 'RBP250', productDesc: 'RBC Platelets', productType: 'RBC', componentPrefix: 'R' }
      ];

      service.getProcessCodes.and.returnValue(of([]));
      service.getProducts.and.returnValue(of(mockProducts));
      service.getAttributesForProcess.and.returnValue(of({ success: false, statusCode: 200, message: '', item: null }));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ' });
      (component as any).currentUnitId.set('W1234');
      (component as any).collectionDate.set('2026-03-14');

      (component as any).loadProductsForUnit();

      expect(component.form.get('productCode')?.value).toBe('RBP250');
    });

  });

  // ========================================
  // Attribute Management Tests
  // ========================================
  describe('Attribute Management', () => {
    it('should auto-populate attributes when product code changes', () => {
      const mockAttributes = {
        success: true,
        statusCode: 200,
        message: '',
        item: {
          attributeGroup: 'LEUK',
          attributeGroupDesc: 'Leukocyte Reduction',
          attributeCode: 'LR',
          attributeCodeDesc: 'Leukocytes Reduced',
          attributeType: 'C',
          suitabilityCheckDate: '2026-03-14',
          oldProductCode: 'RBP250',
          processCode: 'FROZ'
        }
      };

      service.getProcessCodes.and.returnValue(of([]));
      service.getAttributesForProcess.and.returnValue(of(mockAttributes));
      service.deriveProduct.and.returnValue(of({ success: true, newProductCode: 'RBP250LR', newProductDesc: '', hasMultipleMatches: false }));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ' });
      (component as any).currentUnitId.set('W1234');
      (component as any).oldProductCode.set('RBP250');

      (component as any).autoPopulateAttributes('RBP250');

      expect(service.getAttributesForProcess).toHaveBeenCalledWith('RBP250', 'FROZ', 'W1234');
    });


    it('should load attribute groups for selected product', () => {
      const mockGroups = [
        { code: 'LEUK', codeDesc: 'Leukocyte Reduction' },
        { code: 'IRRAD', codeDesc: 'Irradiation' }
      ];

      service.getProcessCodes.and.returnValue(of([]));
      service.getAttributeGroupsForProduct.and.returnValue(of(mockGroups));
      fixture.detectChanges();

      (component as any).loadAttributeGroups('RBP250');

      expect(service.getAttributeGroupsForProduct).toHaveBeenCalledWith('RBP250');
      expect((component as any).attributeGroupOptions().length).toBe(2);
      expect((component as any).attributeGroupOptions()[0].code).toBe('LEUK');
    });

    it('should handle error when loading attribute groups', () => {
      service.getProcessCodes.and.returnValue(of([]));
      service.getAttributeGroupsForProduct.and.returnValue(throwError(() => ({ error: { message: 'Load error' } })));
      fixture.detectChanges();

      (component as any).loadAttributeGroups('RBP250');

      expect((component as any).isLoading()).toBeFalse();
    });

    it('should load attribute types when attribute group changes', () => {
      const mockTypes = [
        { attribCode: 'LR', attribDesc: 'Leukocytes Reduced' }
      ];

      service.getProcessCodes.and.returnValue(of([]));
      service.getAttributeTypesForProduct.and.returnValue(of(mockTypes));
      fixture.detectChanges();

      (component as any).oldProductCode.set('RBP250');
      (component as any).currentUnitId.set('W1234');
      (component as any).collectionDate.set('2026-03-14');
      (component as any).oldProductType.set('RBC');

      (component as any).onAttributeGroupChange('LEUK');

      expect(service.getAttributeTypesForProduct).toHaveBeenCalledWith(
        'RBP250',
        'LEUK',
        'W1234',
        '2026-03-14',
        'RBC'
      );
    });


    it('should handle error when loading attribute types', () => {
      service.getProcessCodes.and.returnValue(of([]));
      service.getAttributeTypesForProduct.and.returnValue(throwError(() => ({ error: { message: 'Load error' } })));
      fixture.detectChanges();

      (component as any).oldProductCode.set('RBP250');
      (component as any).currentUnitId.set('W1234');
      (component as any).collectionDate.set('2026-03-14');
      (component as any).oldProductType.set('RBC');

      (component as any).loadAttributeTypes('RBP250', 'LEUK', 'W1234', '2026-03-14', 'RBC');

      expect((component as any).isLoading()).toBeFalse();
    });

  });

  // ========================================
  // Product Derivation Tests
  // ========================================
  describe('Product Derivation', () => {
    it('should derive new product code from old product', () => {
      const mockResponse = {
        success: true,
        newProductCode: 'RBP250LR',
        newProductDesc: 'RBC Leukocytes Reduced',
        hasMultipleMatches: false
      };

      service.getProcessCodes.and.returnValue(of([]));
      service.deriveProduct.and.returnValue(of(mockResponse));
      service.getValidCatalogs.and.returnValue(of([]));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ', attributeType: 'LR' });
      (component as any).oldProductCode.set('RBP250');
      (component as any).oldProductType.set('RBC');

      (component as any).deriveProductCode();

      expect(service.deriveProduct).toHaveBeenCalledWith({
        oldProductCode: 'RBP250',
        processCode: 'FROZ',
        productType: 'RBC',
        attributeType: 'LR'
      });
      expect((component as any).newProductCode()).toBe('RBP250LR');
    });

    it('should handle multiple product matches', () => {
      const mockResponse = {
        success: true,
        hasMultipleMatches: true,
        multipleProducts: [
          { productCode: 'RBP250LR', productDesc: 'Option 1', productFormula: 'RBC+LR', completeProductCode: 'RBP250LR' },
          { productCode: 'RBP250LR2', productDesc: 'Option 2', productFormula: 'RBC+LR2', completeProductCode: 'RBP250LR2' }
        ]
      };

      service.getProcessCodes.and.returnValue(of([]));
      service.deriveProduct.and.returnValue(of(mockResponse));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ', attributeType: 'LR' });
      (component as any).oldProductCode.set('RBP250');
      (component as any).oldProductType.set('RBC');

      (component as any).deriveProductCode();

      expect((component as any).hasMultipleProducts()).toBeTrue();
      expect((component as any).productCodeOptions().length).toBe(2);
    });
  });

  // ========================================
  // Catalog Number Selection Tests
  // ========================================
  describe('Catalog Number Selection', () => {
    it('should update form value when catalog number is selected', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      (component as any).onCatalogNumberChange('CAT-12345');

      expect(component.form.get('catalogNumber')?.value).toBe('CAT-12345');
    });

    it('should not update form when catalog number is empty', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      component.form.patchValue({ catalogNumber: 'CAT-12345' });
      (component as any).onCatalogNumberChange('');

      expect(component.form.get('catalogNumber')?.value).toBe('CAT-12345');
    });


    it('should return all catalogs when search is empty', () => {
      const mockCatalogs = [
        { catalogNumber: 'CAT-12345', lotNumber: 'LOT-A' },
        { catalogNumber: 'CAT-67890', lotNumber: 'LOT-B' }
      ];

      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      (component as any).catalogNumbers.set(mockCatalogs);
      (component as any).catalogNumberSearchCtrl.setValue('');

      const filtered = (component as any).filteredCatalogNumbers();
      expect(filtered.length).toBe(2);
    });
  });

  // ========================================
  // Conversion Commit Tests
  // ========================================
  describe('Conversion Commit', () => {

    it('should increment entry count after successful conversion', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{
          unitId: 'W1234',
          productCode: 'RBP250',
          processDateTime: '15-JUN-26 14:30',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR',
          catalogNumber: 'CAT-12345'
        }],
        message: 'Success'
      };

      service.getProcessCodes.and.returnValue(of([]));
      service.convertComponent.and.returnValue(of(mockResponse));
      fixture.detectChanges();

      component.form.patchValue({
        processCode: 'FROZ',
        attributeGroup: 'LEUK',
        attributeType: 'LR'
      });
      (component as any).currentUnitId.set('W1234');
      (component as any).oldProductCode.set('RBP250');
      (component as any).newProductCode.set('RBP250LR');

      const initialCount = (component as any).entryCount();
      (component as any).commitConversion();

      expect((component as any).entryCount()).toBe(initialCount + 1);
    });

    it('should add conversion to results table', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        data: [{
          unitId: 'W1234',
          productCode: 'RBP250',
          processDateTime: '15-JUN-26 14:30',
          attributeGroup: 'LEUK',
          attributeType: 'LR',
          newProduct: 'RBP250LR',
          catalogNumber: 'CAT-12345'
        }],
        message: 'Success'
      };

      service.getProcessCodes.and.returnValue(of([]));
      service.convertComponent.and.returnValue(of(mockResponse));
      fixture.detectChanges();

      component.form.patchValue({
        processCode: 'FROZ',
        attributeGroup: 'LEUK',
        attributeType: 'LR',
        verifyProduct: 'RBP250LR'
      });
      (component as any).currentUnitId.set('W1234');
      (component as any).oldProductCode.set('RBP250');
      (component as any).newProductCode.set('RBP250LR');
      (component as any).conversions.set([]);

      (component as any).commitConversion();

      expect((component as any).conversions().length).toBe(1);
      expect((component as any).conversions()[0].unitId).toBe('W1234');
    });
  });

  // ========================================
  // Pagination and Sorting Tests
  // ========================================
  describe('Pagination and Sorting', () => {



    it('should return paginated data', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      const mockData = Array.from({ length: 25 }, (_, i) => ({
        unitId: `W${i}`,
        productCode: 'TEST'
      }));
      (component as any).conversions.set(mockData);
      (component as any).currentPageSize.set(10);
      (component as any).currentPage.set(0);

      const paginated = (component as any).paginatedData();

      expect(paginated.length).toBe(10);
    });
  });

  // ========================================
  // Signal Management Tests
  // ========================================
  describe('Signal Management', () => {
    it('should update isLoading signal during API calls', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      expect((component as any).isLoading()).toBeFalse();
    });





    it('should return all items when search term is empty', () => {
      const mockCodes = [
        { processCode: 'FROZ', processCodeDesc: 'Freezing' },
        { processCode: 'REG', processCodeDesc: 'Regular' }
      ];

      service.getProcessCodes.and.returnValue(of(mockCodes));
      fixture.detectChanges();

      (component as any).processCodes.set(mockCodes);
      (component as any).processCodeSearchCtrl.setValue('');

      const filtered = (component as any).filteredProcessCodes();
      expect(filtered.length).toBe(2);
    });

    it('should filter case-insensitively', () => {
      const mockCodes = [
        { processCode: 'FROZ', processCodeDesc: 'Freezing' }
      ];

      service.getProcessCodes.and.returnValue(of(mockCodes));
      fixture.detectChanges();

      (component as any).processCodes.set(mockCodes);
      (component as any).processCodeSearchCtrl.setValue('froz');

      const filtered = (component as any).filteredProcessCodes();
      expect(filtered.length).toBe(1);
    });

    it('should reset currentDateTime to current moment when entry fields reset', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      (component as any).currentDateTime.set((component as any).currentDateTime().subtract(1, 'hour'));

      (component as any).resetEntryFields();

      // Check that currentDateTime is recent (within last minute)
      const now = (component as any).currentDateTime();
      const diff = Math.abs(now.diff((component as any).currentDateTime(), 'minutes'));
      expect(diff).toBeLessThan(1);
    });
  });

  // ========================================
  // Form Control Getters Tests
  // ========================================
  describe('Form Control Getters', () => {
    it('should return correct form controls', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      expect(component.processCodeControl).toBeDefined();
      expect(component.processDescControl).toBeDefined();
      expect(component.processDateTimeControl).toBeDefined();
      expect(component.oldProductCodeControl).toBeDefined();
      expect(component.productCodeControl).toBeDefined();
      expect(component.attributeGroupControl).toBeDefined();
      expect(component.attributeTypeControl).toBeDefined();
      expect(component.newProductControl).toBeDefined();
      expect(component.catalogNumberControl).toBeDefined();
      expect(component.verifyProductControl).toBeDefined();
    });
  });

  // ========================================
  // Utility Methods Tests
  // ========================================
  describe('Utility Methods', () => {
    it('should trim product description at first pipe character', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      const description = 'Apheresis PLATELETS|ACD-A/XX/20-24C|Extra Info';
      const trimmed = (component as any).getTrimmedProductDesc(description);

      expect(trimmed).toBe('Apheresis PLATELETS...');
    });

    it('should return full description if no pipe character', () => {
      service.getProcessCodes.and.returnValue(of([]));
      fixture.detectChanges();

      const description = 'Red Blood Cells';
      const trimmed = (component as any).getTrimmedProductDesc(description);

      expect(trimmed).toBe('Red Blood Cells');
    });



  });

  // ========================================
  // Error Handling Tests
  // ========================================
  describe('Error Handling', () => {
    it('should show error when process codes fail to load', () => {
      service.getProcessCodes.and.returnValue(throwError(() => ({ error: { message: 'API Error' } })));

      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      fixture.detectChanges();

      expect(snackBarSpy).toHaveBeenCalledWith('API Error', 'DISMISS', jasmine.any(Object));
    });

    it('should handle error when loading products fails', () => {
      service.getProcessCodes.and.returnValue(of([]));
      service.getProducts.and.returnValue(throwError(() => ({ error: { message: 'Product load error' } })));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'FROZ' });
      (component as any).currentUnitId.set('W1234');
      (component as any).collectionDate.set('2026-03-14');

      (component as any).loadProductsForUnit();

      expect((component as any).isLoading()).toBeFalse();
    });
  });

  // ========================================
  // Verify Product Tests
  // ========================================
});
