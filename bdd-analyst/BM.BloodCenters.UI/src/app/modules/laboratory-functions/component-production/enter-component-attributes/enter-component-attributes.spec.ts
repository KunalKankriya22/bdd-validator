import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, from } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';

import { EnterComponentAttributesComponent } from './enter-component-attributes';
import { ComponentAttributesApiService } from './services/component-attributes-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { createMockActivatedRoute, createMockHeaderService, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  ComponentAttributeDto,
  ComponentProductDto,
  AttributeGroupDto,
  AttributeCodeDto,
} from './models/component-attributes.model';

describe('EnterComponentAttributesComponent', () => {
  let component: EnterComponentAttributesComponent;
  let fixture: ComponentFixture<EnterComponentAttributesComponent>;
  let apiServiceSpy: jasmine.SpyObj<ComponentAttributesApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  // Mock data
  const mockProducts: ComponentProductDto[] = [
    {
      productCode: 'E1234',
      productDesc: 'Red Blood Cells Leukoreduced',
      productType: 'RBC',
      expiryDate: '2024-06-15T23:59:59Z',
      componentStatus: 'L',
    },
    {
      productCode: 'P5678',
      productDesc: 'Platelets Apheresis',
      productType: 'PLT',
      expiryDate: '2024-05-20T23:59:59Z',
      componentStatus: 'L',
    },
  ];

  const mockAttributeGroups: AttributeGroupDto[] = [
    { code: 'ATTR', codeDesc: 'Component Attributes' },
    { code: 'PROC', codeDesc: 'Processing Attributes' },
  ];

  const mockAttributeCodes: AttributeCodeDto[] = [
    {
      attribCode: 'CMV',
      attribDesc: 'CMV Negative',
      interCode: 'CMVI',
      statusFlag: 'A',
      stopLabelFlag: 'Y',
      lifeSpan: 5,
      lifeSpanInd: 'D',
    },
    {
      attribCode: 'IRR',
      attribDesc: 'Irradiated',
      interCode: undefined,
      statusFlag: 'A',
      stopLabelFlag: 'N',
    },
  ];

  const mockExistingAttributes: ComponentAttributeDto[] = [
    {
      unitId: 'A123456789',
      collDate: '2024-05-15T00:00:00Z',
      chapterId: 'CHAP',
      productCode: 'E1234',
      attribGroup: 'ATTR',
      attribCode: 'WASH',
      attribDesc: 'Washed',
      procDate: '2024-05-20T14:30:00Z',
      insertDate: '2024-05-20T15:00:00Z',
      insertUser: 'USER01',
      programId: 'CPIATTR',
    },
  ];

  const mockAddedAttribute: ComponentAttributeDto = {
    unitId: 'A123456789',
    collDate: '2024-05-15T00:00:00Z',
    chapterId: 'CHAP',
    productCode: 'E1234',
    attribGroup: 'ATTR',
    attribCode: 'CMV',
    attribDesc: 'CMV Negative',
    procDate: '2024-05-20T14:30:00Z',
    insertDate: '2024-05-20T15:00:00Z',
    insertUser: 'USER01',
    programId: 'CPIATTR',
    interCode: 'CMVI',
    expiryDate: '2024-06-15T23:59:59Z',
    newExpiryDate: '2024-06-20T23:59:59Z',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ComponentAttributesApiService', [
      'addComponentAttribute',
      'getAttributesForComponent',
      'getProductsForUnit',
      'getAttributeGroups',
      'getAttributeCodes',
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    headerServiceSpy = createMockHeaderService();

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    translateServiceSpy = createMockTranslateService();
    // Default spy returns
    apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
    apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
    apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));
    apiServiceSpy.addComponentAttribute.and.returnValue(of(mockAddedAttribute));
    loginServiceSpy.getStoredUsername.and.returnValue('USER01');



      TestBed.configureTestingModule({
      imports: [EnterComponentAttributesComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideNativeDateAdapter(),
        { provide: ComponentAttributesApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });


    


      apiServiceSpy.addComponentAttribute.calls.reset();


      apiServiceSpy.getAttributesForComponent.calls.reset();


      apiServiceSpy.getProductsForUnit.calls.reset();


      apiServiceSpy.getAttributeGroups.calls.reset();


      apiServiceSpy.getAttributeCodes.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentWarehouseId.calls.reset();


      loginServiceSpy.getStoredUsername.calls.reset();


      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));


      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));


      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));


      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));


      apiServiceSpy.addComponentAttribute.and.returnValue(of(mockAddedAttribute));
      loginServiceSpy.getStoredUsername.and.returnValue('USER01');


    fixture = TestBed.createComponent(EnterComponentAttributesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should have collection date disabled', () => {
      fixture.detectChanges();
      expect(component.form.get('collectionDate')?.disabled).toBeTrue();
    });

    it('should initialize signals with default values', () => {
      fixture.detectChanges();
      expect(component['collectionDate']()).toBeNull();
      expect(component['products']()).toEqual([]);
      expect(component['attributeGroups']()).toEqual([]);
      expect(component['attributeCodes']()).toEqual([]);
      expect(component['existingAttributes']()).toEqual([]);
      expect(component['loading']()).toBeFalse();
      expect(component['submitting']()).toBeFalse();
    });
  });

  describe('Unit ID Lookup', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Reset spy call history after initial detectChanges
      apiServiceSpy.getProductsForUnit.calls.reset();
      apiServiceSpy.getAttributeGroups.calls.reset();
      apiServiceSpy.getAttributeCodes.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();
      snackbarServiceSpy.showSuccess.calls.reset();
      snackbarServiceSpy.showError.calls.reset();

      // Re-setup return values after reset
      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));
    });



    it('should populate products after successful lookup', fakeAsync(() => {
      component.form.patchValue({ unitId: 'A123456789' });
      component.onUnitIdLookup();
      tick();

      expect(component['products']()).toEqual(mockProducts);
      expect(component['collectionDate']()).not.toBeNull();
    }));





    it('should set lookingUp signal during lookup', fakeAsync(() => {
      // Use a delayed observable to test the signal state during the API call
      let resolveProducts: any;
      const productsPromise = new Promise<ComponentProductDto[]>(resolve => { resolveProducts = resolve; });
      apiServiceSpy.getProductsForUnit.and.returnValue(from(productsPromise));

      component.form.patchValue({ unitId: 'A123456789' });
      fixture.detectChanges();

      // Call the lookup method
      component.onUnitIdLookup();

      // lookingUp should be true while waiting for the API response
      expect(component['lookingUp']()).toBeTrue();

      // Resolve the promise
      resolveProducts(mockProducts);
      tick();

      // After API completes, lookingUp should be false
      expect(component['lookingUp']()).toBeFalse();
    }));

    it('should clear downstream fields on new lookup', fakeAsync(() => {
      component.form.patchValue({
        unitId: 'A123456789',
        product: 'E1234',
        attributeGroup: 'ATTR',
      });
      component.onUnitIdLookup();
      tick();

      expect(component.form.get('product')?.value).toBeNull();
      expect(component.form.get('attributeGroup')?.value).toBeNull();
    }));
  });

  describe('Cascading Dropdowns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getProductsForUnit.calls.reset();
      apiServiceSpy.getAttributeGroups.calls.reset();
      apiServiceSpy.getAttributeCodes.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();

      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));

      component.form.patchValue({ unitId: 'A123456789' });
      component.onUnitIdLookup();
      tick();

      // Reset calls again after lookup
      apiServiceSpy.getAttributeGroups.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();
      apiServiceSpy.getAttributeCodes.calls.reset();
    }));

    it('should load attribute groups when product is selected', fakeAsync(() => {
      component.form.patchValue({ product: 'E1234' });
      tick();

      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalledWith('RBC');
      expect(component['attributeGroups']()).toEqual(mockAttributeGroups);
    }));

    it('should load attribute codes when group is selected', fakeAsync(() => {
      component.form.patchValue({ product: 'E1234' });
      tick();

      // Reset to only check for attribute codes call
      apiServiceSpy.getAttributeCodes.calls.reset();

      component.form.patchValue({ attributeGroup: 'ATTR' });
      tick();

      expect(apiServiceSpy.getAttributeCodes).toHaveBeenCalled();
      expect(component['attributeCodes']()).toEqual(mockAttributeCodes);
    }));

    it('should clear downstream fields when product changes', fakeAsync(() => {
      component.form.patchValue({
        product: 'E1234',
        attributeGroup: 'ATTR',
        attributeCode: 'CMV',
      });
      tick();

      component.form.patchValue({ product: 'P5678' });
      tick();

      expect(component.form.get('attributeGroup')?.value).toBeNull();
      expect(component.form.get('attributeCode')?.value).toBeNull();
    }));

    it('should load existing attributes when product is selected', fakeAsync(() => {
      component.form.patchValue({ product: 'E1234' });
      tick();

      expect(apiServiceSpy.getAttributesForComponent).toHaveBeenCalled();
      expect(component['existingAttributes']()).toEqual(mockExistingAttributes);
    }));
  });

  describe('Process Date Field', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getProductsForUnit.calls.reset();
      apiServiceSpy.getAttributeGroups.calls.reset();
      apiServiceSpy.getAttributeCodes.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();

      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));

      component.form.patchValue({ unitId: 'A123456789' });
      component.onUnitIdLookup();
      tick();
      component.form.patchValue({ product: 'E1234' });
      tick();
      component.form.patchValue({ attributeGroup: 'ATTR' });
      tick();
    }));





    it('should require process date when attribute has life span', fakeAsync(() => {
      component.form.patchValue({ attributeCode: 'CMV' });
      tick();

      expect(component.form.get('processDate')?.hasError('required')).toBeTrue();
    }));

    it('should not require process date when attribute has no life span', fakeAsync(() => {
      component.form.patchValue({ attributeCode: 'IRR' });
      tick();

      expect(component.form.get('processDate')?.hasError('required')).toBeFalsy();
    }));
  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getProductsForUnit.calls.reset();
      apiServiceSpy.getAttributeGroups.calls.reset();
      apiServiceSpy.getAttributeCodes.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();
      apiServiceSpy.addComponentAttribute.calls.reset();
      snackbarServiceSpy.showSuccess.calls.reset();
      snackbarServiceSpy.showError.calls.reset();

      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));
      apiServiceSpy.addComponentAttribute.and.returnValue(of(mockAddedAttribute));

      component.form.patchValue({ unitId: 'A123456789' });
      component.onUnitIdLookup();
      tick();
      component.form.patchValue({ product: 'E1234' });
      tick();
      component.form.patchValue({ attributeGroup: 'ATTR' });
      tick();

      // Reset calls after setup
      apiServiceSpy.addComponentAttribute.calls.reset();
      apiServiceSpy.getAttributesForComponent.calls.reset();
      snackbarServiceSpy.showSuccess.calls.reset();
      snackbarServiceSpy.showError.calls.reset();
    }));



    it('should submit valid form without process date', fakeAsync(() => {
      component.form.patchValue({ attributeCode: 'IRR' });
      tick();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.addComponentAttribute).toHaveBeenCalled();
      const request = apiServiceSpy.addComponentAttribute.calls.mostRecent().args[0];
      expect(request.attribCode).toBe('IRR');
      expect(request.procDate).toBeUndefined();
    }));

    it('should submit valid form with process date', fakeAsync(() => {
      const processDate = moment();
      component.form.patchValue({
        attributeCode: 'CMV',
        processDate: processDate,
      });
      tick();

      component.onSubmit();
      tick();

      expect(apiServiceSpy.addComponentAttribute).toHaveBeenCalled();
      const request = apiServiceSpy.addComponentAttribute.calls.mostRecent().args[0];
      expect(request.procDate).toBeDefined();
    }));



    it('should include interdiction info in success message', fakeAsync(() => {
      component.form.patchValue({
        attributeCode: 'CMV',
        processDate: moment(),
      });
      tick();

      component.onSubmit();
      tick();

      const successMessage = snackbarServiceSpy.showSuccess.calls.mostRecent().args[0];
      expect(successMessage).toContain('CMVI');
      expect(successMessage.toLowerCase()).toContain('interdiction');
    }));

    it('should include expiry date change in success message', fakeAsync(() => {
      component.form.patchValue({
        attributeCode: 'CMV',
        processDate: moment(),
      });
      tick();

      component.onSubmit();
      tick();

      const successMessage = snackbarServiceSpy.showSuccess.calls.mostRecent().args[0];
      expect(successMessage).toContain('Expiry date updated');
    }));



    it('should clear form after successful submission (keeping unit context)', fakeAsync(() => {
      const unitId = 'A123456789';
      component.form.patchValue({
        attributeCode: 'IRR',
      });
      tick();

      component.onSubmit();
      tick();

      expect(component.form.get('unitId')?.value).toBe(unitId);
      expect(component.form.get('product')?.value).toBeNull();
      expect(component.form.get('attributeGroup')?.value).toBeNull();
      expect(component.form.get('attributeCode')?.value).toBeNull();
    }));
  });



  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });









    it('should link errors with aria-describedby', fakeAsync(() => {
      component.form.get('unitId')?.markAsTouched();
      component['submitted'].set(true);
      fixture.detectChanges();
      tick();

      const input = fixture.debugElement.query(By.css('[id$="-unitId"]'));
      if (input) {
        const errorId = component['errorId']('unitId');
        expect(input.attributes['aria-describedby']).toContain(errorId);
      }
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
      apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      apiServiceSpy.getAttributesForComponent.and.returnValue(of(mockExistingAttributes));

      component.form.patchValue({ unitId: 'A123456789' });
      component.onUnitIdLookup();
      tick();
      component.form.patchValue({
        product: 'E1234',
        attributeGroup: 'ATTR',
        attributeCode: 'IRR',
      });
      tick();
    }));

    it('should clear form fields except unit ID', () => {
      const unitId = component.form.get('unitId')?.value;
      component.onClear();

      expect(component.form.get('unitId')?.value).toBe(unitId);
      expect(component.form.get('product')?.value).toBeNull();
      expect(component.form.get('attributeGroup')?.value).toBeNull();
      expect(component.form.get('attributeCode')?.value).toBeNull();
    });


  });
  describe('Pagination Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should have correct pagination defaults', () => {
      expect(component.dataTableConfig.pagination?.pageSize).toBe(10);
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(0);
      expect(component.dataTableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50]);
      expect(component.dataTableConfig.pagination?.showFirstLastButtons).toBeTrue();
    });








  });
});