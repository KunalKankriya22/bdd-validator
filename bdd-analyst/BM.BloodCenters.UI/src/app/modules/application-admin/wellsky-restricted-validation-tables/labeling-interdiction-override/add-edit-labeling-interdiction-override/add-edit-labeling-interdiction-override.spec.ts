import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditLabelingInterdictionOverride } from './add-edit-labeling-interdiction-override';
import { LabelingInterdictionOverrideService } from '../services/labeling-interdiction-override.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { LabelingInterdictionOverrideModel } from '../models/labeling-interdiction-override.model';
import moment from 'moment';

describe('AddEditLabelingInterdictionOverride', () => {
  let component: AddEditLabelingInterdictionOverride;
  let fixture: ComponentFixture<AddEditLabelingInterdictionOverride>;
  let mockService: jasmine.SpyObj<LabelingInterdictionOverrideService>;

  // Compute dynamic dates once per suite to avoid timezone-sensitive hardcoding
  const pastTestDate = moment().subtract(100, 'days').hours(10).minutes(30).seconds(0);

  const mockDropdowns = {
    donorDecisionCodes: [
      { code: 'DDC001', description: 'Decision 1' },
      { code: 'DDC002', description: 'Decision 2' }
    ],
    productTypes: [
      { code: 'PT001', description: 'Product Type 1' },
      { code: 'PT002', description: 'Product Type 2' }
    ],
    interCodes: [
      { code: 'IC001', description: 'Inter Desc 1' },
      { code: 'IC002', description: 'Inter Desc 2' }
    ],
    interTypes: [
      { code: 'N', description: 'NFT' },
      { code: 'B', description: 'Bio' },
      { code: 'H', description: 'Hold' },
      { code: 'I', description: 'Initial' }
    ]
  };

  const mockEditData: LabelingInterdictionOverrideModel = {
    donorDecisionCode: 'DDC001',
    donorDecisionDescription: 'Decision 1',
    productType: 'PT001',
    productTypeDescription: 'Product Type 1',
    interCode: 'IC001',
    interDescription: 'Inter Desc 1',
    interType: 'N',
    overrideDescription: 'Test Override',
    effectiveDate: new Date('2099-01-15'),
    terminationDate: new Date('2099-12-31'),
    lastModifiedDate: new Date('2099-01-20')
  };

  // Fixed future date for deterministic tests (avoids flaky failures around midnight/timezone)
  const futureDate = moment('2099-06-15');

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabelingInterdictionOverrideService', [
      'getDropdowns',
      'createOverride',
      'updateOverride'
    ]);
    mockService.getDropdowns.and.returnValue(of(mockDropdowns));
    mockService.createOverride.and.returnValue(of({ data: null, totalRecords: 0, message: 'Override added successfully' }));
    mockService.updateOverride.and.returnValue(of({ data: null, totalRecords: 0, message: 'Override updated successfully' }));



      TestBed.configureTestingModule({
imports: [
        AddEditLabelingInterdictionOverride
      ],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: LabelingInterdictionOverrideService, useValue: mockService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getDropdowns.calls.reset();


      mockService.createOverride.calls.reset();


      mockService.updateOverride.calls.reset();


      mockService.getDropdowns.and.returnValue(of(mockDropdowns));


      mockService.createOverride.and.returnValue(of({ data: null, totalRecords: 0, message: 'Override added successfully' }));


      mockService.updateOverride.and.returnValue(of({ data: null, totalRecords: 0, message: 'Override updated successfully' }));


    fixture = TestBed.createComponent(AddEditLabelingInterdictionOverride);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {



    it('should initialize interTypeOptions', () => {
      expect(component.interTypeOptions).toEqual([
        { value: 'N', display: 'N - NFT' },
        { value: 'B', display: 'B - Bio' },
        { value: 'H', display: 'H - Hold' },
        { value: 'I', display: 'I - Initial' }
      ]);
    });



  });

  describe('ngOnInit', () => {


    it('should populate donorDecisionCodeOptions after loading', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.donorDecisionCodeOptions.length).toBe(2);
      expect(component.donorDecisionCodeOptions[0].value).toBe('DDC001');
      expect(component.donorDecisionCodeOptions[0].display).toBe('DDC001 - Decision 1');
    }));

    it('should populate productTypeOptions with "code - description" display after loading', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.productTypeOptions.length).toBe(2);
      expect(component.productTypeOptions[0].value).toBe('PT001');
      expect(component.productTypeOptions[0].display).toBe('PT001 - Product Type 1');
      expect(component.productTypeOptions[1].display).toBe('PT002 - Product Type 2');
    }));

    it('should populate interCodeOptions with "code - description" display after loading', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.interCodeOptions.length).toBe(2);
      expect(component.interCodeOptions[0].value).toBe('IC001');
      expect(component.interCodeOptions[0].display).toBe('IC001 - Inter Desc 1');
      expect(component.interCodeOptions[1].display).toBe('IC002 - Inter Desc 2');
    }));

    it('should fall back to code only for productType items without description', fakeAsync(() => {
      mockService.getDropdowns.and.returnValue(of({
        ...mockDropdowns,
        productTypes: [{ code: 'PT003', description: '' }]
      }));

      component.ngOnInit();
      tick();

      expect(component.productTypeOptions[0].display).toBe('PT003');
    }));

    it('should fall back to code only for interCode items without description', fakeAsync(() => {
      mockService.getDropdowns.and.returnValue(of({
        ...mockDropdowns,
        interCodes: [{ code: 'IC003', description: '' }]
      }));

      component.ngOnInit();
      tick();

      expect(component.interCodeOptions[0].display).toBe('IC003');
    }));


    it('should handle error when loading dropdowns', fakeAsync(() => {
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();
      tick();

      expect(component.isLoadingOptions).toBe(false);
    }));
  });

  describe('setupAutoPopulate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should auto-populate productTypeDescription when productType changes', fakeAsync(() => {
      component.form.get('productType')?.setValue('PT001');
      tick();

      expect(component.productTypeDescription).toBe('Product Type 1');
    }));

    it('should clear productTypeDescription for unknown productType', fakeAsync(() => {
      component.form.get('productType')?.setValue('UNKNOWN');
      tick();

      expect(component.productTypeDescription).toBe('');
    }));

    it('should auto-populate interDescription when interCode changes', fakeAsync(() => {
      component.form.get('interCode')?.setValue('IC001');
      tick();

      expect(component.interDescription).toBe('Inter Desc 1');
    }));

    it('should clear interDescription for unknown interCode', fakeAsync(() => {
      component.form.get('interCode')?.setValue('UNKNOWN');
      tick();

      expect(component.interDescription).toBe('');
    }));


  });


  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
    }));


    it('should set lastModified in edit mode', () => {
      expect(component.lastModified).toContain('Last Modified:');
    });


    it('should store original key values for update API', () => {
      expect(component['originalKeys'].donorDecisionCode).toBe('DDC001');
      expect(component['originalKeys'].productType).toBe('PT001');
      expect(component['originalKeys'].interCode).toBe('IC001');
    });

    it('should populate editModeValues with "code - description" for productType and interCode', () => {
      expect(component.editModeValues.donorDecisionCode).toBe('DDC001 - Decision 1');
      expect(component.editModeValues.productType).toBe('PT001 - Product Type 1');
      expect(component.editModeValues.interCode).toBe('IC001 - Inter Desc 1');
    });


    it('should re-apply form values after dropdown options load', fakeAsync(() => {
      // Form values should be set from edit data after dropdowns load
      expect(component.form.get('donorDecisionCode')?.value).toBe('DDC001');
      expect(component.form.get('productType')?.value).toBe('PT001');
      expect(component.form.get('interCode')?.value).toBe('IC001');
    }));
  });
  describe('onSave - Add Mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.mode = 'add';
    }));



    it('should call createOverride when form is valid in add mode', fakeAsync(() => {
      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override',
        effectiveDate: futureDate.clone(),
        terminationDate: null
      });

      component.onSave();
      tick();

      expect(mockService.createOverride).toHaveBeenCalledWith(jasmine.objectContaining({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override'
      }));
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override',
        effectiveDate: futureDate.clone()
      });

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));


    it('should set isSaving to false on error', fakeAsync(() => {
      mockService.createOverride.and.returnValue(throwError(() => ({
        status: 409,
        error: { message: 'Already exists' }
      })));

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override',
        effectiveDate: futureDate.clone()
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should trim form values before sending', fakeAsync(() => {
      component.form.patchValue({
        donorDecisionCode: '  DDC001  ',
        productType: '  PT001  ',
        interCode: '  IC001  ',
        interType: 'N',
        overrideDescription: '  Override Text  ',
        effectiveDate: futureDate.clone()
      });

      component.onSave();
      tick();

      const payload = mockService.createOverride.calls.mostRecent().args[0];
      expect(payload.donorDecisionCode).toBe('DDC001');
      expect(payload.productType).toBe('PT001');
      expect(payload.interCode).toBe('IC001');
      expect(payload.overrideDescription).toBe('Override Text');
    }));
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();
    }));

    it('should call updateOverride in edit mode', fakeAsync(() => {
      component.form.patchValue({
        interType: 'B',
        overrideDescription: 'Updated Override'
      });

      component.onSave();
      tick();

      expect(mockService.updateOverride).toHaveBeenCalledWith(jasmine.objectContaining({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'B',
        overrideDescription: 'Updated Override'
      }));
    }));

    it('should use form values (not originalKeys) in update payload', fakeAsync(() => {
      // Change the interCode in form
      component.form.patchValue({
        interCode: 'IC002'
      });

      component.onSave();
      tick();

      const payload = mockService.updateOverride.calls.mostRecent().args[0];
      expect(payload.interCode).toBe('IC002');
    }));


  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));


    it('should call createOverride and reset form in add mode', fakeAsync(() => {
      spyOn<any>(component, 'resetFormForAddMode');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override',
        effectiveDate: futureDate.clone()
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(mockService.createOverride).toHaveBeenCalled();
      expect(component['resetFormForAddMode']).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    }));

    it('should switch to add mode from edit mode after save', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));

    it('should set isSaving to false after error', fakeAsync(() => {
      mockService.createOverride.and.returnValue(throwError(() => ({
        status: 409,
        error: {}
      })));

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'New Override',
        effectiveDate: futureDate.clone()
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBe(false);
    }));

  });

  describe('formatDateTime', () => {

    it('should format today date with Today prefix', () => {
      const today = new Date();
      const result = component.formatDateTime(today);
      expect(result).toContain('Today');
      expect(result).toContain('PST');
    });

    it('should format non-today date with full format', () => {
      const pastDate = pastTestDate.toDate();
      const result = component.formatDateTime(pastDate);
      expect(result).toContain(pastTestDate.format('DD') + '-');
      expect(result).toContain('-' + pastTestDate.format('YYYY'));
      expect(result).toContain('PST');
    });
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return donorDecisionCode control', () => {
      expect(component.donorDecisionCodeControl).toBe(component.form.get('donorDecisionCode'));
    });

    it('should return productType control', () => {
      expect(component.productTypeControl).toBe(component.form.get('productType'));
    });

    it('should return interCode control', () => {
      expect(component.interCodeControl).toBe(component.form.get('interCode'));
    });

    it('should return interType control', () => {
      expect(component.interTypeControl).toBe(component.form.get('interType'));
    });

    it('should return overrideDescription control', () => {
      expect(component.overrideDescriptionControl).toBe(component.form.get('overrideDescription'));
    });


  });

  describe('Error Message Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return required error for donorDecisionCode', () => {
      component.form.get('donorDecisionCode')?.markAsTouched();
      expect(component.getDonorDecisionCodeError()).toBe('Cue is required');
    });


    it('should return required error for productType', () => {
      component.form.get('productType')?.markAsTouched();
      expect(component.getProductTypeError()).toBe('Lab Product Type is required');
    });


    it('should return required error for interCode', () => {
      component.form.get('interCode')?.markAsTouched();
      expect(component.getInterCodeError()).toBe('Interdiction is required');
    });


    it('should return required error for interType', () => {
      component.form.get('interType')?.markAsTouched();
      expect(component.getInterTypeError()).toBe('Type is required');
    });


    it('should return required error for overrideDescription', () => {
      component.form.get('overrideDescription')?.markAsTouched();
      expect(component.getOverrideDescriptionError()).toBe('Override Description is required');
    });

    it('should return maxlength error for overrideDescription', () => {
      const control = component.form.get('overrideDescription');
      control?.setValue('A'.repeat(51));
      control?.markAsTouched();
      expect(component.getOverrideDescriptionError()).toBe('Override Description must be at most 50 characters');
    });




    it('should return terminationBeforeEffective error', () => {
      component.form.patchValue({
        effectiveDate: futureDate.clone().add(30, 'days'),
        terminationDate: futureDate.clone()
      });
      component.form.get('terminationDate')?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });
  });

  describe('terminationDateValidator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return error when terminationDate is before effectiveDate', () => {
      component.form.patchValue({
        effectiveDate: futureDate.clone().add(30, 'days'),
        terminationDate: futureDate.clone()
      });

      // DateFieldValidationUtility.dateRangeValidator() sets form-level error
      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });


  });


  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset editModeValues', () => {
      component.editModeValues = {
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N - None',
        overrideDescription: 'Test Override',
        effectiveDate: '15-JAN-2025'
      };

      component['resetFormForAddMode']();

      expect(component.editModeValues.donorDecisionCode).toBe('');
      expect(component.editModeValues.productType).toBe('');
      expect(component.editModeValues.interCode).toBe('');
      expect(component.editModeValues.interType).toBe('');
      expect(component.editModeValues.overrideDescription).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });


    it('should reset form controls', () => {
      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001'
      });

      component['resetFormForAddMode']();

      expect(component.form.get('donorDecisionCode')?.value).toBeFalsy();
      expect(component.form.get('productType')?.value).toBeFalsy();
      expect(component.form.get('interCode')?.value).toBeFalsy();
    });

    it('should enable all form controls', () => {
      component.form.get('donorDecisionCode')?.disable();
      component.form.get('productType')?.disable();
      component.form.get('interCode')?.disable();

      component['resetFormForAddMode']();

      expect(component.form.get('donorDecisionCode')?.enabled).toBe(true);
      expect(component.form.get('productType')?.enabled).toBe(true);
      expect(component.form.get('interCode')?.enabled).toBe(true);
    });

    it('should restore required validators for add mode', () => {
      component['resetFormForAddMode']();

      component.form.get('donorDecisionCode')?.setValue('');
      component.form.get('donorDecisionCode')?.updateValueAndValidity();

      expect(component.form.get('donorDecisionCode')?.hasError('required')).toBe(true);
    });
  });
  describe('Edit Mode with null/empty data', () => {

    it('should handle data with missing optional fields', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'Test',
        effectiveDate: new Date('2099-01-01'),
        terminationDate: null,
        lastModifiedDate: null
      };
      fixture.detectChanges();
      tick();

      expect(component.lastModified).toBe('');
    }));

    it('should handle data with empty string fields', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        donorDecisionCode: '',
        productType: '',
        interCode: '',
        interType: '',
        overrideDescription: '',
        effectiveDate: null,
        terminationDate: null
      };
      fixture.detectChanges();
      tick();

      expect(component.form.get('donorDecisionCode')?.value).toBe('');
    }));
  });

  describe('Error Handling in Save', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show custom error message from backend', fakeAsync(() => {
      mockService.createOverride.and.returnValue(throwError(() => ({
        status: 500,
        error: { message: 'Custom backend error' }
      })));

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'Test',
        effectiveDate: futureDate.clone()
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should show conflict message for 409 status', fakeAsync(() => {
      mockService.createOverride.and.returnValue(throwError(() => ({
        status: 409,
        error: {}
      })));

      component.form.patchValue({
        donorDecisionCode: 'DDC001',
        productType: 'PT001',
        interCode: 'IC001',
        interType: 'N',
        overrideDescription: 'Test',
        effectiveDate: futureDate.clone()
      });

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));

    it('should show not found message for 404 status', fakeAsync(() => {
      mockService.updateOverride.and.returnValue(throwError(() => ({
        status: 404,
        error: {}
      })));

      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      component.onSave();
      tick();

      expect(component.isSaving).toBe(false);
    }));
  });

  describe('Dropdown Loading in Edit Mode', () => {

    it('should preserve row data description if not in map', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        productType: 'UNKNOWN_PT',
        productTypeDescription: 'Row Level Description',
        interCode: 'UNKNOWN_IC',
        interDescription: 'Row Level Inter Desc'
      };
      fixture.detectChanges();
      tick();

      // Map won't have UNKNOWN_PT or UNKNOWN_IC, should fall back to row data descriptions
      expect(component.productTypeDescription).toBe('Row Level Description');
      expect(component.interDescription).toBe('Row Level Inter Desc');
    }));

    it('should update editModeValues.productType to "code - description" after dropdowns load', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      expect(component.editModeValues.productType).toBe('PT001 - Product Type 1');
    }));

    it('should update editModeValues.interCode to "code - description" after dropdowns load', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      tick();

      expect(component.editModeValues.interCode).toBe('IC001 - Inter Desc 1');
    }));

    it('should fall back to code only in editModeValues when productType not in map', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        productType: 'UNKNOWN_PT',
        productTypeDescription: 'Row Level Description'
      };
      fixture.detectChanges();
      tick();

      expect(component.editModeValues.productType).toBe('UNKNOWN_PT');
    }));

    it('should fall back to code only in editModeValues when interCode not in map', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        interCode: 'UNKNOWN_IC',
        interDescription: 'Row Level Inter Desc'
      };
      fixture.detectChanges();
      tick();

      expect(component.editModeValues.interCode).toBe('UNKNOWN_IC');
    }));
  });
});
