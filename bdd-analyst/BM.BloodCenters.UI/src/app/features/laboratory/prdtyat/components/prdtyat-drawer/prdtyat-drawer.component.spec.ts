import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { PrdtyatDrawerComponent } from './prdtyat-drawer.component';
import { PrdtyatService } from '../../services/prdtyat.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ProductTypeAttribute } from '../../models/product-type-attribute.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('PrdtyatDrawerComponent', () => {
  let prdtyatServiceSpy: any;
  let component: PrdtyatDrawerComponent;
  let fixture: ComponentFixture<PrdtyatDrawerComponent>;
  let prdtyatService: jasmine.SpyObj<PrdtyatService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockRecord: ProductTypeAttribute = {
    anticoagulantCode: '5',
    volume: 450,
    productType: 'APLS',
    attributeGroup: 'V0001035',
    attributeGroupDesc: 'Blood Core',
    attributeCode: 'V0001035',
    attributeCodeDesc: 'CPD/XX/<=18C',
    productClass: 'C0008',
    modifierCode: 'M0000',
    effDate: '2012-10-07',
    termDate: null
  };

  beforeEach(() => {

    prdtyatServiceSpy = jasmine.createSpyObj('PrdtyatService', [
      'getAnticoagulantCodes',
      'getProductTypes',
      'getAttributeGroups',
      'getAttributeCodes',
      'getProductClasses',
      'getModifierCodes',
      'createProductTypeAttribute',
      'updateProductTypeAttribute'
    ]);
    const snackbarServiceSpy = createMockSnackbarService();
    const headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [PrdtyatDrawerComponent, NoopAnimationsModule],
      providers: [
        { provide: PrdtyatService, useValue: prdtyatServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      prdtyatServiceSpy.getAnticoagulantCodes.calls.reset();


      prdtyatServiceSpy.getProductTypes.calls.reset();


      prdtyatServiceSpy.getAttributeGroups.calls.reset();


      prdtyatServiceSpy.getAttributeCodes.calls.reset();


      prdtyatServiceSpy.getProductClasses.calls.reset();


      prdtyatServiceSpy.getModifierCodes.calls.reset();


      prdtyatServiceSpy.createProductTypeAttribute.calls.reset();


      prdtyatServiceSpy.updateProductTypeAttribute.calls.reset();


    prdtyatService = TestBed.inject(PrdtyatService) as jasmine.SpyObj<PrdtyatService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    prdtyatService.getAnticoagulantCodes.and.returnValue(of([{ code: '5', description: 'Test AC' }]));
    prdtyatService.getProductTypes.and.returnValue(of([{ code: 'APLS', description: 'Apheresis Platelet' }]));
    prdtyatService.getAttributeGroups.and.returnValue(of([{ code: 'V0001035', description: 'Blood Core' }]));
    prdtyatService.getAttributeCodes.and.returnValue(of([{ code: 'V0001035', description: 'CPD' }]));
    prdtyatService.getProductClasses.and.returnValue(of([{ code: 'C0008', description: 'Class' }]));
    prdtyatService.getModifierCodes.and.returnValue(of([{ code: 'M0000', description: 'Modifier' }]));
    prdtyatService.createProductTypeAttribute.and.returnValue(of({ success: true }));
    prdtyatService.updateProductTypeAttribute.and.returnValue(of({ success: true }));

    fixture = TestBed.createComponent(PrdtyatDrawerComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should load all dropdown options on init', () => {
      fixture.detectChanges();
      expect(prdtyatService.getAnticoagulantCodes).toHaveBeenCalled();
      expect(prdtyatService.getProductTypes).toHaveBeenCalled();
      expect(prdtyatService.getAttributeGroups).toHaveBeenCalled();
      expect(prdtyatService.getProductClasses).toHaveBeenCalled();
      expect(prdtyatService.getModifierCodes).toHaveBeenCalled();
    });




  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should require anticoagulantCode', () => {
      const control = component.form.get('anticoagulantCode');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      const control = component.form.get('effDate');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should not require volume', () => {
      const control = component.form.get('volume');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should not require termDate', () => {
      const control = component.form.get('termDate');
      expect(control?.hasError('required')).toBeFalsy();
    });
  });

  describe('Description Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update attributeGroupDescription when attributeGroup changes', () => {
      component.form.patchValue({ attributeGroup: 'V0001035' });
      expect(component.attributeGroupDescription()).toBe('Blood Core');
    });

    it('should show --- when no attributeGroup selected', () => {
      component.form.patchValue({ attributeGroup: '' });
      expect(component.attributeGroupDescription()).toBe('---');
    });

    it('should load attribute codes when attributeGroup changes', () => {
      component.form.patchValue({ attributeGroup: 'V0001035' });
      expect(prdtyatService.getAttributeCodes).toHaveBeenCalledWith('V0001035');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should populate editModeValues from data', () => {
      expect(component.editModeValues.anticoagulantCode).toBe('5');
      expect(component.editModeValues.volume).toBe('450');
      expect(component.editModeValues.productType).toBe('APLS');
    });

    it('should disable non-editable fields in edit mode', () => {
      expect(component.form.get('anticoagulantCode')?.disabled).toBeTrue();
      expect(component.form.get('volume')?.disabled).toBeTrue();
      expect(component.form.get('productType')?.disabled).toBeTrue();
      expect(component.form.get('effDate')?.disabled).toBeTrue();
      expect(component.form.get('termDate')?.disabled).toBeTrue();
    });

    it('should keep editable fields enabled in edit mode', () => {
      expect(component.form.get('attributeGroup')?.enabled).toBeTrue();
      expect(component.form.get('attributeCode')?.enabled).toBeTrue();
      expect(component.form.get('productClass')?.enabled).toBeTrue();
      expect(component.form.get('modifierCode')?.enabled).toBeTrue();
    });


  });

  describe('Save - Create Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should call createProductTypeAttribute with correct payload', () => {
      component.form.patchValue({
        anticoagulantCode: '5',
        volume: '450',
        productType: 'APLS',
        attributeGroup: 'V0001035',
        attributeCode: 'V0001035',
        productClass: 'C0008',
        modifierCode: 'M0000',
        effDate: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()
      });

      component.onSave();

      const call = prdtyatService.createProductTypeAttribute.calls.mostRecent();
      const payload = call.args[0];
      expect(payload.anticoagulantCode).toBe('5');
      expect(payload.volume).toBe(450);
      expect(payload.productType).toBe('APLS');
      expect(payload.attributeGroup).toBe('V0001035');
      expect(payload.productClass).toBe('C0008');
      expect(payload.modifierCode).toBe('M0000');
    });




  });

  describe('Save - Update Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should call updateProductTypeAttribute with composite key and update DTO', () => {
      component.form.patchValue({
        attributeGroup: 'NEWGRP',
        attributeCode: 'NEWCODE',
        productClass: 'C0009',
        modifierCode: 'M0001'
      });

      component.onSave();

      expect(prdtyatService.updateProductTypeAttribute).toHaveBeenCalledWith(
        'APLS',
        'V0001035',
        'V0001035',
        '5',
        450,
        jasmine.objectContaining({
          attributeGroup: 'NEWGRP',
          attributeCode: 'NEWCODE',
          productClass: 'C0009',
          modifierCode: 'M0001'
        })
      );
    });


  });




  describe('Date Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error for effDate', () => {
      component.form.get('effDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });




  });
});
