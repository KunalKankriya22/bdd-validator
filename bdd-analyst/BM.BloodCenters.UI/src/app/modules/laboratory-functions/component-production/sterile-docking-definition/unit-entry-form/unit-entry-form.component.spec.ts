import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { of, throwError, Subject } from 'rxjs';

import { UnitEntryFormComponent } from './unit-entry-form.component';
import { SterileDockingLovService } from '../services/sterile-docking-lov.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitIdFieldService } from '@shared/components/unit-id-field';
import { UnitEntryDto } from '../models/sterile-docking-definition.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('UnitEntryFormComponent', () => {
  let unitIdFieldServiceSpy: any;
  let lovServiceSpy: any;
  let component: UnitEntryFormComponent;
  let fixture: ComponentFixture<UnitEntryFormComponent>;
  let lovService: jasmine.SpyObj<SterileDockingLovService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockProductCodes = [
    { code: '00161', description: 'Product 1', shortName: 'P1', productTypeId: 'PT1' },
    { code: '00162', description: 'Product 2', shortName: 'P2', productTypeId: 'PT2' }
  ];

  const mockUnitValidationResponse = {
    parsedUnitId: 'W454526051302',
    checkDigit: '2',
    codeScheme: 'I' as const,
    manualUnitId: 'W454526051302',
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const
  };

  beforeEach(() => {

    lovServiceSpy = jasmine.createSpyObj('SterileDockingLovService', [
      'getProductCodes',
      'validateUnitForDocking',
      'getUnitProductCodes'
    ]);

    const headerServiceSpy = createMockHeaderService();

    const snackbarServiceSpy = createMockSnackbarService();

    unitIdFieldServiceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);



      TestBed.configureTestingModule({
      imports: [
        UnitEntryFormComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        NgxMatSelectSearchModule],
      providers: [
        { provide: SterileDockingLovService, useValue: lovServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: UnitIdFieldService, useValue: unitIdFieldServiceSpy }
      ]
    });


    


      lovServiceSpy.getProductCodes.calls.reset();


      lovServiceSpy.validateUnitForDocking.calls.reset();


      lovServiceSpy.getUnitProductCodes.calls.reset();


      unitIdFieldServiceSpy.validateUnitId.calls.reset();


    lovService = TestBed.inject(SterileDockingLovService) as jasmine.SpyObj<SterileDockingLovService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    lovService.getProductCodes.and.returnValue(of(mockProductCodes));
    lovService.getUnitProductCodes.and.returnValue(of(mockProductCodes));

    fixture = TestBed.createComponent(UnitEntryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {
    it('should initialize form with 3 fields (unitId managed by shared component)', () => {
      expect(component.form.get('originalProductCode')).toBeTruthy();
      expect(component.form.get('weldOk')).toBeTruthy();
      expect(component.form.get('verifyProduct')).toBeTruthy();
    });

    it('should mark originalProductCode as required', () => {
      const productControl = component.form.get('originalProductCode');
      productControl?.setValue('');
      expect(productControl?.hasError('required')).toBe(true);
    });



    it('should not require verifyProduct by default', () => {
      expect(component.form.get('verifyProduct')?.valid).toBe(true);
    });

    it('should start with empty product codes before unit validation', () => {
      expect(component.productCodes.length).toBe(0);
    });

    it('should accept maxUnits input', () => {
      component.maxUnits = 5;
      expect(component.maxUnits).toBe(5);
    });

    it('should accept currentUnitCount input', () => {
      component.currentUnitCount = 3;
      expect(component.currentUnitCount).toBe(3);
    });

    it('should accept existingUnitIds input', () => {
      component.existingUnitIds = ['UNIT1', 'UNIT2'];
      expect(component.existingUnitIds).toEqual(['UNIT1', 'UNIT2']);
    });
  });

  describe('Product Code Search', () => {
    it('should auto-select product code on exact match (barcode scan)', () => {
      component.form.get('originalProductCode')?.setValue('00161');

      expect(component.form.get('originalProductCode')?.value).toBe('00161');
    });



    it('should return all products when search is empty', () => {
      const filtered = component['filterProductOptions'](mockProductCodes, '');

      expect(filtered.length).toBe(2);
    });



    it('should keep selected value in form control after selection', () => {
      component.form.get('originalProductCode')?.setValue('00161');

      expect(component.form.get('originalProductCode')?.value).toBe('00161');
    });
  });

  describe('Shared Unit ID Field Events', () => {
    it('should store validated unit data on onUnitValidated', () => {
      component.onUnitValidated(mockUnitValidationResponse);

      expect(component.validatedUnitData).toBeTruthy();
      expect(component.validatedUnitData.isValid).toBe(true);
      expect(component.validatedUnitData.unitId).toBe('W454526051302');
    });

    it('should load unit product codes after validation', () => {
      component.onUnitValidated(mockUnitValidationResponse);

      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', undefined);
    });

    it('should use config productType over validation productType for FB docking', () => {
      component.configuration = { itemInd: 'FB', productType: 'PLT' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true, productType: 'RBC' }));

      const confirmSpy = jasmine.createSpy('confirm');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject')
      });

      component.onUnitValidated(mockUnitValidationResponse);

      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', 'PLT');
    });

    it('should fall back to validation productType when config has no productType', () => {
      component.configuration = { itemInd: 'FB' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true, productType: 'RBC' }));

      const confirmSpy = jasmine.createSpy('confirm');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject')
      });

      component.onUnitValidated(mockUnitValidationResponse);

      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', 'RBC');
    });

    it('should not auto-select product code when only one component exists', fakeAsync(() => {
      const singleProduct = [{ code: '00161', description: 'Product 1', shortName: 'P1', productTypeId: 'PT1' }];
      lovService.getUnitProductCodes.and.returnValue(of(singleProduct));

      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.productCodes.length).toBe(1);
      expect(component.form.get('originalProductCode')?.value).toBeFalsy();
    }));

    it('should not auto-select product code when multiple components exist', fakeAsync(() => {
      lovService.getUnitProductCodes.and.returnValue(of(mockProductCodes));

      component.onUnitValidated(mockUnitValidationResponse);
      tick();

      expect(component.productCodes.length).toBe(2);
    }));

    it('should clear validated data on onUnitCleared', () => {
      component.validatedUnitData = { isValid: true };
      component.onUnitCleared();

      expect(component.validatedUnitData).toBeNull();
      expect(component.productCodes.length).toBe(0);
      expect(component.filteredProducts.length).toBe(0);
    });

    it('should reset original product code on onUnitCleared', () => {
      component.form.patchValue({ originalProductCode: '00161' });
      component.onUnitCleared();

      expect(component.form.get('originalProductCode')?.value).toBe('');
    });
  });

  describe('Post Validation for Docking', () => {
    it('should confirm when no configuration is set', () => {
      component.configuration = null;
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: rejectSpy
      });

      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    });

    it('should confirm when docking validation succeeds', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true }));
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: rejectSpy
      });
      tick();

      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
    }));

    it('should reject when docking validation fails', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({
        success: false,
        errorCode: 'ERR001',
        message: 'Unit not eligible'
      }));
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: rejectSpy
      });
      tick();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalledWith('[ERR001] Unit not eligible');
    }));

    it('should reject on docking validation API error', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(
        throwError(() => ({ error: { errorCode: 'ERR002', message: 'Server error' } }))
      );
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: confirmSpy,
        reject: rejectSpy
      });
      tick();

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(rejectSpy).toHaveBeenCalledWith('[ERR002] Server error');
    }));
  });

  describe('Verify Product Conditional Logic', () => {
    it('should not require verifyProduct for BA docking type', () => {
      component.configuration = { itemInd: 'BA' } as any;
      expect(component.requiresVerifyProduct()).toBe(false);
    });

    it('should not require verifyProduct for FI docking type', () => {
      component.configuration = { itemInd: 'FI' } as any;
      expect(component.requiresVerifyProduct()).toBe(false);
    });

    it('should not require verifyProduct for SE docking type', () => {
      component.configuration = { itemInd: 'SE' } as any;
      expect(component.requiresVerifyProduct()).toBe(false);
    });

    it('should not require verifyProduct for NE docking type', () => {
      component.configuration = { itemInd: 'NE' } as any;
      expect(component.requiresVerifyProduct()).toBe(false);
    });

    it('should require verifyProduct for FB docking type', () => {
      component.configuration = { itemInd: 'FB' } as any;
      expect(component.requiresVerifyProduct()).toBe(true);
    });

    it('should require verifyProduct for BF docking type', () => {
      component.configuration = { itemInd: 'BF' } as any;
      expect(component.requiresVerifyProduct()).toBe(true);
    });




  });

  describe('Auto-Add via Weld OK / Verify Product Close', () => {












    it('should re-enable form on save error via onSaveError', () => {
      component.isSaving = true;
      component.onSaveError();
      expect(component.isSaving).toBe(false);
    });
  });

  describe('NE Needle Docking', () => {
    it('should return true for isNeedleDocking when NE', () => {
      component.configuration = { itemInd: 'NE' } as any;
      expect(component.isNeedleDocking()).toBe(true);
    });

    it('should return false for isNeedleDocking when BA', () => {
      component.configuration = { itemInd: 'BA' } as any;
      expect(component.isNeedleDocking()).toBe(false);
    });

    it('should clear product code validators for NE', () => {
      component.configuration = { itemInd: 'NE' } as any;
      component.ngOnChanges({ configuration: {} as any });

      const ctrl = component.form.get('originalProductCode');
      ctrl?.setValue('');
      expect(ctrl?.valid).toBe(true);
    });

    it('should keep product code required for BA', () => {
      component.configuration = { itemInd: 'BA' } as any;
      component.ngOnChanges({ configuration: {} as any });

      const ctrl = component.form.get('originalProductCode');
      ctrl?.setValue('');
      expect(ctrl?.hasError('required')).toBe(true);
    });
  });

  describe('Original Product Code - Text Input for Scan', () => {
    it('should accept typed product code directly', () => {
      component.form.patchValue({ originalProductCode: '00161' });
      expect(component.form.get('originalProductCode')?.value).toBe('00161');
    });

    it('should require originalProductCode', () => {
      component.form.patchValue({ originalProductCode: '' });
      expect(component.form.get('originalProductCode')?.hasError('required')).toBe(true);
    });
  });

  describe('Product Code Validation on Blur', () => {
    beforeEach(() => {
      component.productCodes = mockProductCodes;
    });

    it('should validate exact product code match', () => {
      component.form.patchValue({ originalProductCode: '00161' });
      component.onProductCodeBlur();

      expect(component.productCodeValidated).toBe(true);
      expect(component.form.get('originalProductCode')?.errors).toBeNull();
    });





    it('should not validate empty product code', () => {
      component.form.patchValue({ originalProductCode: '' });
      component.onProductCodeBlur();

      expect(component.productCodeValidated).toBe(false);
    });


  });
  describe('Reset and Cleanup', () => {




    it('should set isSaving to false after resetFormForNextEntry', () => {
      component.isSaving = true;
      component.resetFormForNextEntry();

      expect(component.isSaving).toBe(false);
    });


  });

  describe('Component Cleanup', () => {


    it('should clear pending reset timer on destroy', fakeAsync(() => {
      component.resetFormForNextEntry();
      expect(component['resetTimerId']).not.toBeNull();

      component.ngOnDestroy();
      expect(component['resetTimerId']).not.toBeNull();

      tick(200);
    }));
  });

  describe('Derived Product Calculation', () => {
    it('should calculate derived product when product code selected for FB docking', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V0014004' } as any;
      lovService.calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));

      component['calculateDerivedProductIfNeeded']('E0385V00');

      expect(lovService.calculateDerivedProduct).toHaveBeenCalledWith('E0385V00', 'V0014004', undefined);
      expect(component.derivedProductCode).toBe('E2940V00');
      expect(component.derivedProductError).toBeNull();
    });



    it('should set derivedProductError when API returns error', () => {
      component.configuration = { itemInd: 'FB', attributeCode: '+93' } as any;
      lovService.calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E0385V00', error: '[9735] Error in deriving new product formula / product code' }));

      component['calculateDerivedProductIfNeeded']('E0385V00');

      expect(component.derivedProductError).toBe('[9735] Error in deriving new product formula / product code');
    });

    it('should skip duplicate API call for same product code', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V0014004' } as any;
      lovService.calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));

      component['calculateDerivedProductIfNeeded']('E0385V00');
      component['calculateDerivedProductIfNeeded']('E0385V00');

      expect(lovService.calculateDerivedProduct).toHaveBeenCalledTimes(1);
    });

    it('should allow API call for different product code', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V0014004' } as any;
      lovService.calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));

      component['calculateDerivedProductIfNeeded']('E0385V00');
      component['calculateDerivedProductIfNeeded']('E0386V00');

      expect(lovService.calculateDerivedProduct).toHaveBeenCalledTimes(2);
    });

    it('should clear derivedProductCode and error on resetFormForNextEntry', () => {
      component.derivedProductCode = 'E2940V00';
      component.derivedProductError = 'some error';
      component['lastDerivedProductCode'] = 'E0385V00';
      component.resetFormForNextEntry();

      expect(component.derivedProductCode).toBeNull();
      expect(component.derivedProductError).toBeNull();
      expect(component['lastDerivedProductCode']).toBeNull();
    });

    it('should clear derivedProductError and lastDerivedProductCode on onUnitCleared', () => {
      component['productTypeFromValidation'] = 'RBC';
      component.derivedProductCode = 'E2940V00';
      component.derivedProductError = 'some error';
      component['lastDerivedProductCode'] = 'E0385V00';
      component.onUnitCleared();

      expect(component['productTypeFromValidation']).toBeUndefined();
      expect(component.derivedProductError).toBeNull();
      expect(component['lastDerivedProductCode']).toBeNull();
    });


  });

  describe('Verify Product Validation', () => {
    beforeEach(() => {
      component.configuration = { itemInd: 'FB' } as any;
    });





    it('should fail when no derived product calculated', () => {
      component.derivedProductCode = null;
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'E0385V00' });

      component.onVerifyProductBlur();

      expect(component.verifyProductValidated).toBe(false);
      expect(component.form.get('verifyProduct')?.hasError('mismatch')).toBe(true);
    });

    it('should match on first 5 characters', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'E2940' });

      component.onVerifyProductBlur();

      expect(component.verifyProductValidated).toBe(true);
    });

    it('should clear derivedProductCode after successful verification', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'E2940V00' });

      component.onVerifyProductBlur();

      expect(component.verifyProductValidated).toBe(true);
      expect(component.derivedProductCode).toBeNull();
    });


  });

  describe('Product Code Autocomplete Filtering', () => {
    it('should filter products by code on value change', fakeAsync(() => {
      const localFixture = TestBed.createComponent(UnitEntryFormComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent.productCodes = mockProductCodes;
      localComponent.form.get('originalProductCode')?.setValue('00161');
      tick(300);
      expect(localComponent.filteredProducts.length).toBe(1);
      expect(localComponent.filteredProducts[0].code).toBe('00161');

      localComponent.ngOnDestroy();
      tick(200);
    }));

    it('should filter products by description on value change', fakeAsync(() => {
      const localFixture = TestBed.createComponent(UnitEntryFormComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent.productCodes = mockProductCodes;
      localComponent.form.get('originalProductCode')?.setValue('Product 2');
      tick(300);
      expect(localComponent.filteredProducts.length).toBe(1);
      expect(localComponent.filteredProducts[0].code).toBe('00162');

      localComponent.ngOnDestroy();
      tick(200);
    }));

    it('should show all products when search is cleared', fakeAsync(() => {
      const localFixture = TestBed.createComponent(UnitEntryFormComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent.productCodes = mockProductCodes;
      localComponent.form.get('originalProductCode')?.setValue('00161');
      tick(300);
      expect(localComponent.filteredProducts.length).toBe(1);
      localComponent.form.get('originalProductCode')?.setValue('');
      tick(300);
      expect(localComponent.filteredProducts.length).toBe(2);

      localComponent.ngOnDestroy();
      tick(200);
    }));

    it('should show all products when search is whitespace only', fakeAsync(() => {
      const localFixture = TestBed.createComponent(UnitEntryFormComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent.productCodes = mockProductCodes;
      localComponent.form.get('originalProductCode')?.setValue('   ');
      tick(300);
      expect(localComponent.filteredProducts.length).toBe(2);

      localComponent.ngOnDestroy();
      tick(200);
    }));
  });

  describe('filterProductOptions - Additional', () => {
    it('should return all options when search is null', () => {
      const result = component['filterProductOptions'](mockProductCodes, null);
      expect(result.length).toBe(2);
    });

    it('should filter case-insensitively by description', () => {
      const result = component['filterProductOptions'](mockProductCodes, 'PRODUCT 1');
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('00161');
    });

    it('should filter by partial code match', () => {
      const result = component['filterProductOptions'](mockProductCodes, '0016');
      expect(result.length).toBe(2);
    });

    it('should return empty when no match found', () => {
      const result = component['filterProductOptions'](mockProductCodes, 'ZZZZZ');
      expect(result.length).toBe(0);
    });
  });

  describe('onProductCodeFocus', () => {
    it('should reset filteredProducts to full product list', () => {
      component.productCodes = mockProductCodes;
      component.filteredProducts = [mockProductCodes[0]];
      component.onProductCodeFocus();
      expect(component.filteredProducts).toEqual(mockProductCodes);
    });

    it('should set filteredProducts to empty when productCodes is empty', () => {
      component.productCodes = [];
      component.filteredProducts = mockProductCodes;
      component.onProductCodeFocus();
      expect(component.filteredProducts).toEqual([]);
    });
  });

  describe('onProductCodeSelected', () => {
    it('should set form value and validate on selection', () => {
      component.productCodes = mockProductCodes;
      component.onProductCodeSelected('00162');
      expect(component.form.get('originalProductCode')?.value).toBe('00162');
      expect(component.productCodeValidated).toBe(true);
    });

    it('should not update if code not found in productCodes', () => {
      component.productCodes = mockProductCodes;
      component.form.patchValue({ originalProductCode: '00161' });
      component.productCodeValidated = false;
      component.onProductCodeSelected('ZZZZZ');
      expect(component.form.get('originalProductCode')?.value).toBe('00161');
      expect(component.productCodeValidated).toBe(false);
    });

    it('should trigger derived product calculation for FB docking', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V001' } as any;
      component.productCodes = mockProductCodes;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));

      component.onProductCodeSelected('00161');

      expect((lovService as any).calculateDerivedProduct).toHaveBeenCalled();
    });
  });

  describe('Product Code Blur - Additional Branches', () => {
    beforeEach(() => {
      component.productCodes = mockProductCodes;
    });

    it('should match on substring (first 5 chars) and set to matched code', () => {
      component.form.patchValue({ originalProductCode: '00161EXTRA' });
      component.onProductCodeBlur();
      expect(component.productCodeValidated).toBe(true);
      expect(component.form.get('originalProductCode')?.value).toBe('00161');
    });

    it('should match case-insensitively', () => {
      const products = [{ code: 'ABCDE', description: 'Test', shortName: 'T', productTypeId: 'PT1' }];
      component.productCodes = products;
      component.form.patchValue({ originalProductCode: 'abcde' });
      component.onProductCodeBlur();
      expect(component.productCodeValidated).toBe(true);
      expect(component.form.get('originalProductCode')?.value).toBe('ABCDE');
    });

    it('should set invalidProduct error for non-matching code', () => {
      component.form.patchValue({ originalProductCode: 'ZZZZZ' });
      component.onProductCodeBlur();
      expect(component.productCodeValidated).toBe(false);
      expect(component.form.get('originalProductCode')?.hasError('invalidProduct')).toBe(true);
    });

    it('should accept any value when no products are loaded', () => {
      component.productCodes = [];
      component.form.patchValue({ originalProductCode: 'ANYTHING' });
      component.onProductCodeBlur();
      expect(component.productCodeValidated).toBe(true);
    });

    it('should handle whitespace-only value as empty', () => {
      component.form.patchValue({ originalProductCode: '   ' });
      component.onProductCodeBlur();
      expect(component.productCodeValidated).toBe(false);
    });

    it('should trigger derived product calculation on valid match for FB docking', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V001' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));
      component.form.patchValue({ originalProductCode: '00161' });
      component.onProductCodeBlur();
      expect((lovService as any).calculateDerivedProduct).toHaveBeenCalled();
    });
  });

  describe('getFieldError', () => {
    it('should return error message for touched required field', () => {
      const ctrl = component.form.get('originalProductCode');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      const error = component.getFieldError('originalProductCode');
      expect(error).toBe('Original Product Code is required');
    });

    it('should return empty string for untouched field', () => {
      const error = component.getFieldError('originalProductCode');
      expect(error).toBe('');
    });

    it('should return empty string for valid field', () => {
      const ctrl = component.form.get('originalProductCode');
      ctrl?.setValue('00161');
      ctrl?.markAsTouched();
      const error = component.getFieldError('originalProductCode');
      expect(error).toBe('');
    });

    it('should use field name as fallback label for unknown field', () => {
      const error = component.getFieldError('unknownField');
      expect(error).toBe('');
    });

    it('should return error for weldOk when touched and empty', () => {
      const ctrl = component.form.get('weldOk');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      const error = component.getFieldError('weldOk');
      expect(error).toBe('Weld OK is required');
    });

    it('should return error for verifyProduct when touched, required, and empty', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.ngOnChanges({ configuration: {} as any });
      const ctrl = component.form.get('verifyProduct');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      const error = component.getFieldError('verifyProduct');
      expect(error).toBe('Verify Product is required');
    });
  });

  describe('onWeldOkClosed', () => {
    it('should do nothing when isResetting is true', () => {
      component['isResetting'] = true;
      spyOn(component as any, 'tryAutoAdd');
      component.onWeldOkClosed();
      expect((component as any).tryAutoAdd).not.toHaveBeenCalled();
    });

    it('should call tryAutoAdd when not FB/BF docking', () => {
      component['isResetting'] = false;
      component.configuration = { itemInd: 'BA' } as any;
      spyOn(component as any, 'tryAutoAdd');
      component.onWeldOkClosed();
      expect((component as any).tryAutoAdd).toHaveBeenCalled();
    });

    it('should not call tryAutoAdd when FB docking (requires verify product)', () => {
      component['isResetting'] = false;
      component.configuration = { itemInd: 'FB' } as any;
      spyOn(component as any, 'tryAutoAdd');
      component.onWeldOkClosed();
      expect((component as any).tryAutoAdd).not.toHaveBeenCalled();
    });

    it('should not call tryAutoAdd when BF docking (requires verify product)', () => {
      component['isResetting'] = false;
      component.configuration = { itemInd: 'BF' } as any;
      spyOn(component as any, 'tryAutoAdd');
      component.onWeldOkClosed();
      expect((component as any).tryAutoAdd).not.toHaveBeenCalled();
    });

    it('should call tryAutoAdd for NE docking', () => {
      component['isResetting'] = false;
      component.configuration = { itemInd: 'NE' } as any;
      spyOn(component as any, 'tryAutoAdd');
      component.onWeldOkClosed();
      expect((component as any).tryAutoAdd).toHaveBeenCalled();
    });
  });

  describe('onEnterKey', () => {
    it('should prevent default and call tryAutoAdd', () => {
      const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      spyOn(component as any, 'tryAutoAdd');
      component.onEnterKey(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect((component as any).tryAutoAdd).toHaveBeenCalled();
    });
  });

  describe('tryAutoAdd', () => {
    const createMockEvent = () => ({ preventDefault: jasmine.createSpy('preventDefault') } as any);

    beforeEach(() => {
      component.form.patchValue({ originalProductCode: '00161', weldOk: 'Y' });
      component.validatedUnitData = { isValid: true };
      component.unitIdField = {
        isValid: true,
        parsedUnitId: 'W454526051302',
        clear: jasmine.createSpy('clear')
      } as any;
      component.existingUnitIds = [];
      component.maxUnits = 10;
      component.currentUnitCount = 0;
      component.derivedProductError = null;
    });

    it('should do nothing when isSaving is true', () => {
      component.isSaving = true;
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).not.toHaveBeenCalled();
    });

    it('should mark fields as touched when form is invalid', () => {
      component.form.patchValue({ originalProductCode: '', weldOk: '' });
      component.onEnterKey(createMockEvent());
      expect(component.form.get('originalProductCode')?.touched).toBe(true);
      expect(component.form.get('weldOk')?.touched).toBe(true);
      expect(component.form.get('verifyProduct')?.touched).toBe(true);
      expect(component.isSaving).toBe(false);
    });

    it('should mark fields as touched when unitIdField is invalid', () => {
      component.unitIdField = { isValid: false, parsedUnitId: null, clear: jasmine.createSpy('clear') } as any;
      component.onEnterKey(createMockEvent());
      expect(component.form.get('originalProductCode')?.touched).toBe(true);
      expect(component.isSaving).toBe(false);
    });

    it('should mark fields as touched when unitIdField is undefined', () => {
      component.unitIdField = undefined as any;
      component.onEnterKey(createMockEvent());
      expect(component.form.get('originalProductCode')?.touched).toBe(true);
      expect(component.isSaving).toBe(false);
    });

    it('should show error when unit data is not validated', () => {
      component.validatedUnitData = null;
      component.onEnterKey(createMockEvent());
      expect(snackbarService.showError).toHaveBeenCalledWith('Please validate the Unit ID first');
    });

    it('should show error when validatedUnitData.isValid is false', () => {
      component.validatedUnitData = { isValid: false };
      component.onEnterKey(createMockEvent());
      expect(snackbarService.showError).toHaveBeenCalledWith('Please validate the Unit ID first');
    });

    it('should show error for duplicate unit ID', () => {
      component.existingUnitIds = ['W454526051302'];
      component.onEnterKey(createMockEvent());
      expect(snackbarService.showError).toHaveBeenCalledWith('Unit W454526051302 has already been added');
    });

    it('should show error and emit unitLimitReached when max units exceeded', () => {
      component.maxUnits = 3;
      component.currentUnitCount = 3;
      spyOn(component.unitLimitReached, 'emit');
      component.onEnterKey(createMockEvent());
      expect(snackbarService.showError).toHaveBeenCalledWith('Err: 0109: Exceeded declared number of units - 3 units');
      expect(component.unitLimitReached.emit).toHaveBeenCalled();
    });

    it('should not check limit when maxUnits is 0', () => {
      component.maxUnits = 0;
      component.currentUnitCount = 100;
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).toHaveBeenCalled();
    });

    it('should return early when derivedProductError is set', () => {
      component.derivedProductError = 'Some error';
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).not.toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should emit unitAdded with verifyProduct N for non-FB/BF docking', () => {
      component.configuration = { itemInd: 'BA' } as any;
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W454526051302',
        originalProductCode: '00161',
        weldOk: 'Y',
        verifyProduct: 'N'
      }));
      expect(component.isSaving).toBe(true);
    });

    it('should emit unitAdded with verifyProduct Y when verified for FB docking', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.ngOnChanges({ configuration: {} as any });
      component.form.patchValue({ originalProductCode: '00161', weldOk: 'Y', verifyProduct: 'E2940V00' });
      component.verifyProductValidated = true;
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        verifyProduct: 'Y'
      }));
    });

    it('should emit unitAdded with verifyProduct N when not verified for FB docking', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.ngOnChanges({ configuration: {} as any });
      component.form.patchValue({ originalProductCode: '00161', weldOk: 'Y', verifyProduct: 'somevalue' });
      component.verifyProductValidated = false;
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        verifyProduct: 'N'
      }));
    });

    it('should set isSaving to true on successful add', () => {
      spyOn(component.unitAdded, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.isSaving).toBe(true);
    });

    it('should not emit when maxUnits equals currentUnitCount and maxUnits > 0', () => {
      component.maxUnits = 5;
      component.currentUnitCount = 5;
      spyOn(component.unitAdded, 'emit');
      spyOn(component.unitLimitReached, 'emit');
      component.onEnterKey(createMockEvent());
      expect(component.unitAdded.emit).not.toHaveBeenCalled();
      expect(component.unitLimitReached.emit).toHaveBeenCalled();
    });
  });

  describe('resetFormForNextEntry - Additional', () => {
    it('should emit unitLimitReached when newCount reaches maxUnits', () => {
      component.maxUnits = 5;
      component.currentUnitCount = 4;
      spyOn(component.unitLimitReached, 'emit');
      component.resetFormForNextEntry();
      expect(component.unitLimitReached.emit).toHaveBeenCalled();
    });

    it('should not emit unitLimitReached when newCount is less than maxUnits', () => {
      component.maxUnits = 5;
      component.currentUnitCount = 2;
      spyOn(component.unitLimitReached, 'emit');
      component.resetFormForNextEntry();
      expect(component.unitLimitReached.emit).not.toHaveBeenCalled();
    });

    it('should not emit unitLimitReached when maxUnits is 0', () => {
      component.maxUnits = 0;
      component.currentUnitCount = 100;
      spyOn(component.unitLimitReached, 'emit');
      component.resetFormForNextEntry();
      expect(component.unitLimitReached.emit).not.toHaveBeenCalled();
    });

    it('should emit reprintEligibleChange with false after reset', () => {
      spyOn(component.reprintEligibleChange, 'emit');
      component.resetFormForNextEntry();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should clear unitIdField', () => {
      component.unitIdField = { clear: jasmine.createSpy('clear'), isValid: true, parsedUnitId: 'X' } as any;
      component.resetFormForNextEntry();
      expect(component.unitIdField.clear).toHaveBeenCalled();
    });

    it('should reset productCodeValidated and verifyProductValidated', () => {
      component.productCodeValidated = true;
      component.verifyProductValidated = true;
      component.resetFormForNextEntry();
      expect(component.productCodeValidated).toBe(false);
      expect(component.verifyProductValidated).toBe(false);
    });

    it('should reset productTypeFromValidation', () => {
      component['productTypeFromValidation'] = 'RBC';
      component.resetFormForNextEntry();
      expect(component['productTypeFromValidation']).toBeUndefined();
    });

    it('should set isResetting and clear it after timeout', fakeAsync(() => {
      component.resetFormForNextEntry();
      expect(component['isResetting']).toBe(true);
      tick(150);
      expect(component['isResetting']).toBe(false);
    }));

    it('should reset form values', () => {
      component.form.patchValue({ originalProductCode: '00161', weldOk: 'Y', verifyProduct: 'E2940V00' });
      component.resetFormForNextEntry();
      expect(component.form.get('weldOk')?.value).toBe('');
      expect(component.form.get('verifyProduct')?.value).toBe('');
    });
  });

  describe('emitReprintEligible', () => {
    it('should emit true when FB docking with derivedProductCode and not verified', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.derivedProductCode = 'E2940V00';
      component.verifyProductValidated = false;
      spyOn(component.reprintEligibleChange, 'emit');
      component['emitReprintEligible']();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false when not FB/BF docking', () => {
      component.configuration = { itemInd: 'BA' } as any;
      component.derivedProductCode = 'E2940V00';
      component.verifyProductValidated = false;
      spyOn(component.reprintEligibleChange, 'emit');
      component['emitReprintEligible']();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit false when derivedProductCode is null', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.derivedProductCode = null;
      component.verifyProductValidated = false;
      spyOn(component.reprintEligibleChange, 'emit');
      component['emitReprintEligible']();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit false when already verified', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.derivedProductCode = 'E2940V00';
      component.verifyProductValidated = true;
      spyOn(component.reprintEligibleChange, 'emit');
      component['emitReprintEligible']();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit true for BF docking with derivedProductCode and not verified', () => {
      component.configuration = { itemInd: 'BF' } as any;
      component.derivedProductCode = 'E2940V00';
      component.verifyProductValidated = false;
      spyOn(component.reprintEligibleChange, 'emit');
      component['emitReprintEligible']();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalledWith(true);
    });
  });

  describe('Verify Product Blur - Additional Branches', () => {
    beforeEach(() => {
      component.configuration = { itemInd: 'FB' } as any;
    });

    it('should set verifyProductValidated to false when value is empty', () => {
      component.form.patchValue({ verifyProduct: '' });
      component.onVerifyProductBlur();
      expect(component.verifyProductValidated).toBe(false);
    });

    it('should set verifyProductValidated to false when value is whitespace only', () => {
      component.form.patchValue({ verifyProduct: '   ' });
      component.onVerifyProductBlur();
      expect(component.verifyProductValidated).toBe(false);
    });

    it('should pass through when no originalProductCode set', () => {
      component.form.patchValue({ originalProductCode: '', verifyProduct: 'E2940V00' });
      component.onVerifyProductBlur();
      expect(component.verifyProductValidated).toBe(true);
      expect(component.form.get('verifyProduct')?.errors).toBeNull();
    });

    it('should set mismatch error on non-matching value', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'WRONG' });
      component.onVerifyProductBlur();
      expect(component.verifyProductValidated).toBe(false);
      expect(component.form.get('verifyProduct')?.hasError('mismatch')).toBe(true);
    });

    it('should call emitReprintEligible after match validation', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'E2940V00' });
      spyOn(component.reprintEligibleChange, 'emit');
      component.onVerifyProductBlur();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalled();
    });

    it('should call emitReprintEligible after mismatch validation', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'WRONG' });
      spyOn(component.reprintEligibleChange, 'emit');
      component.onVerifyProductBlur();
      expect(component.reprintEligibleChange.emit).toHaveBeenCalled();
    });

    it('should match case-insensitively on full value', () => {
      component.derivedProductCode = 'E2940V00';
      component.form.patchValue({ originalProductCode: 'E0385V00', verifyProduct: 'e2940v00' });
      component.onVerifyProductBlur();
      expect(component.verifyProductValidated).toBe(true);
    });
  });

  describe('calculateDerivedProductIfNeeded - Additional', () => {
    it('should skip calculation when not FB/BF docking', () => {
      component.configuration = { itemInd: 'BA' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct');
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect((lovService as any).calculateDerivedProduct).not.toHaveBeenCalled();
    });

    it('should skip calculation when configuration is undefined', () => {
      component.configuration = undefined;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct');
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect((lovService as any).calculateDerivedProduct).not.toHaveBeenCalled();
    });

    it('should pass filterType from configuration', () => {
      component.configuration = { itemInd: 'FB', attributeCode: 'V001', filterType: 'FT1' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect((lovService as any).calculateDerivedProduct).toHaveBeenCalledWith('E0385V00', 'V001', 'FT1');
    });

    it('should use attribCode as fallback for attributeCode', () => {
      component.configuration = { itemInd: 'BF', attribCode: 'ATT1' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect((lovService as any).calculateDerivedProduct).toHaveBeenCalledWith('E0385V00', 'ATT1', undefined);
    });

    it('should emit derivedProductErrorChange with null on success', () => {
      component.configuration = { itemInd: 'FB' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));
      spyOn(component.derivedProductErrorChange, 'emit');
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect(component.derivedProductErrorChange.emit).toHaveBeenCalledWith(null);
    });

    it('should emit derivedProductErrorChange with error string when API returns error', () => {
      component.configuration = { itemInd: 'FB' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: null, error: 'calc error' }));
      spyOn(component.derivedProductErrorChange, 'emit');
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect(component.derivedProductErrorChange.emit).toHaveBeenCalledWith('calc error');
    });

    it('should call emitReprintEligible after calculation', () => {
      component.configuration = { itemInd: 'FB' } as any;
      (lovService as any).calculateDerivedProduct = jasmine.createSpy('calculateDerivedProduct')
        .and.returnValue(of({ derivedProduct: 'E2940V00' }));
      spyOn(component.reprintEligibleChange, 'emit');
      component['calculateDerivedProductIfNeeded']('E0385V00');
      expect(component.reprintEligibleChange.emit).toHaveBeenCalled();
    });
  });

  describe('onUnitPostValidate - Additional Error Handling', () => {
    it('should reject with empty errorCode when no errorCode on failure', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({
        success: false,
        message: 'Custom failure'
      }));
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy
      });
      tick();
      expect(rejectSpy).toHaveBeenCalledWith('[] Custom failure');
    }));

    it('should reject with default message on failure with no message', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({
        success: false
      }));
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy
      });
      tick();
      expect(rejectSpy).toHaveBeenCalledWith('[] Unit validation failed');
    }));

    it('should reject with message on API error without errorCode', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(
        throwError(() => ({ error: { message: 'Server down' } }))
      );
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy
      });
      tick();
      expect(rejectSpy).toHaveBeenCalledWith('Server down');
    }));

    it('should reject with fallback message on API error with empty error body', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy
      });
      tick();
      expect(rejectSpy).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should reject with fallback on API error with no error body', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(
        throwError(() => ({}))
      );
      const rejectSpy = jasmine.createSpy('reject');
      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy
      });
      tick();
      expect(rejectSpy).toHaveBeenCalledWith('Unit validation failed');
    }));

    it('should build request with all configuration properties', fakeAsync(() => {
      component.configuration = {
        itemInd: 'BA',
        filterType: 'FT1',
        attributeCode: 'ATT1',
        processDate: '2024-01-01',
        collDate: '2024-01-01'
      } as any;
      component.form.patchValue({ originalProductCode: '00161' });
      lovService.validateUnitForDocking.and.returnValue(of({ success: true }));

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      });
      tick();

      expect(lovService.validateUnitForDocking).toHaveBeenCalledWith(jasmine.objectContaining({
        unitId: 'W454526051302',
        dockingType: 'BA',
        productCode: '00161',
        filterType: 'FT1',
        attribCode: 'ATT1',
        processDate: '2024-01-01',
        collDate: '2024-01-01'
      }));
    }));

    it('should store productType from validation result on success', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true, productType: 'PLT' }));

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      });
      tick();

      expect(component['productTypeFromValidation']).toBe('PLT');
    }));

    it('should set productTypeFromValidation to undefined when not provided', fakeAsync(() => {
      component.configuration = { itemInd: 'BA' } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true }));

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      });
      tick();

      expect(component['productTypeFromValidation']).toBeUndefined();
    }));

    it('should use attribCode when attributeCode is not present', fakeAsync(() => {
      component.configuration = {
        itemInd: 'BA',
        attribCode: 'ATT2'
      } as any;
      lovService.validateUnitForDocking.and.returnValue(of({ success: true }));

      component.onUnitPostValidate({
        data: mockUnitValidationResponse,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      });
      tick();

      expect(lovService.validateUnitForDocking).toHaveBeenCalledWith(jasmine.objectContaining({
        attribCode: 'ATT2'
      }));
    }));
  });

  describe('loadUnitProductCodes - Additional', () => {
    it('should pass productType from config for BF docking', () => {
      component.configuration = { itemInd: 'BF', productType: 'PLT' } as any;
      component.onUnitValidated(mockUnitValidationResponse);
      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', 'PLT');
    });

    it('should pass productTypeFromValidation when config has no productType for BF', () => {
      component.configuration = { itemInd: 'BF' } as any;
      component['productTypeFromValidation'] = 'RBC';
      component.onUnitValidated(mockUnitValidationResponse);
      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', 'RBC');
    });

    it('should pass undefined productType for non-FB/BF docking', () => {
      component.configuration = { itemInd: 'BA' } as any;
      component.onUnitValidated(mockUnitValidationResponse);
      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', undefined);
    });

    it('should pass undefined productType for SE docking', () => {
      component.configuration = { itemInd: 'SE' } as any;
      component.onUnitValidated(mockUnitValidationResponse);
      expect(lovService.getUnitProductCodes).toHaveBeenCalledWith('W454526051302', undefined);
    });
  });

  describe('ngOnChanges - Additional Branches', () => {
    it('should not update validators when configuration change is not present', () => {
      const ctrl = component.form.get('originalProductCode');
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
      component.ngOnChanges({ maxUnits: {} as any });
      ctrl?.setValue('');
      expect(ctrl?.valid).toBe(true);
    });

    it('should update verify product validator to required for FB on change', () => {
      component.configuration = { itemInd: 'FB' } as any;
      component.ngOnChanges({ configuration: {} as any });
      const ctrl = component.form.get('verifyProduct');
      ctrl?.setValue('');
      expect(ctrl?.hasError('required')).toBe(true);
    });

    it('should clear verify product validator for BA on change', () => {
      component.configuration = { itemInd: 'BA' } as any;
      component.ngOnChanges({ configuration: {} as any });
      const ctrl = component.form.get('verifyProduct');
      ctrl?.setValue('');
      expect(ctrl?.valid).toBe(true);
    });

    it('should clear and reset product code value for NE docking', () => {
      component.configuration = { itemInd: 'NE' } as any;
      component.form.patchValue({ originalProductCode: '00161' });
      component.ngOnChanges({ configuration: {} as any });
      expect(component.form.get('originalProductCode')?.value).toBe('');
    });
  });

  describe('ngOnDestroy - Additional', () => {
    it('should complete destroy$ to unsubscribe all observables', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should clear resetTimerId when timer is pending', fakeAsync(() => {
      component.resetFormForNextEntry();
      const timerId = component['resetTimerId'];
      expect(timerId).not.toBeNull();
      component.ngOnDestroy();
      tick(200);
    }));

    it('should handle destroy when no timer is pending', () => {
      component['resetTimerId'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should reset form and clear data when chapter changes', () => {
      const chapterSubject = new Subject<void>();
      const headerService = TestBed.inject(HeaderService) as any;
      headerService.chapterChanged$ = chapterSubject.asObservable();

      const newFixture = TestBed.createComponent(UnitEntryFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      newComponent.validatedUnitData = { isValid: true };
      newComponent.productCodes = mockProductCodes;
      newComponent.filteredProducts = mockProductCodes;
      newComponent.form.patchValue({ weldOk: 'Y', verifyProduct: 'E2940V00' });

      chapterSubject.next();

      expect(newComponent.validatedUnitData).toBeNull();
      expect(newComponent.productCodes.length).toBe(0);
      expect(newComponent.filteredProducts.length).toBe(0);
      expect(newComponent.form.get('weldOk')?.value).toBe('');
      expect(newComponent.form.get('verifyProduct')?.value).toBe('');

      newComponent.ngOnDestroy();
    });
  });

  describe('loadProductCodes', () => {
    it('should load and set product codes from service', () => {
      component['loadProductCodes']();
      expect(lovService.getProductCodes).toHaveBeenCalled();
      expect(component.productCodes).toEqual(mockProductCodes);
      expect(component.filteredProducts).toEqual(mockProductCodes);
    });
  });
});
