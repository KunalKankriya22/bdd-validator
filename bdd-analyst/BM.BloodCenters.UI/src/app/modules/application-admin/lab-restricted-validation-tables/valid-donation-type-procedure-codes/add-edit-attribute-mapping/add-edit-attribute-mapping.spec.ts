import moment from 'moment';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AddEditAttributeMapping } from './add-edit-attribute-mapping';
import { ValidDonationTypeProcedureCodesService } from '../services/valid-donation-type-procedure-codes.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesDto,
  UpdateValidDonationTypeProcedureCodesDto
} from '../models/valid-donation-type-procedure-codes.model';

describe('AddEditAttributeMapping', () => {
  let serviceSpyObj: any;
  let component: AddEditAttributeMapping;
  let fixture: ComponentFixture<AddEditAttributeMapping>;
  let serviceSpy: jasmine.SpyObj<ValidDonationTypeProcedureCodesService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let snackBarOpenSpy: jasmine.Spy;

  const mockFilterOptions = {
    donationTypes: ['WB', 'PLT', 'RBC'],
    procedureCodes: ['WBL', 'APLT', 'RBC1'],
    attribGroups: ['PROC', 'QUAL', 'TEST'],
    attribCodes: ['CODE1', 'CODE2', 'CODE3']
  };

  const mockEditData: ValidDonationTypeProcedureCodesModel = {
    donationType: 'WB',
    procedureCode: 'WBL',
    attribGroup: 'PROC',
    attribCode: 'TEST1',
    effectiveDate: '2024-01-01T12:00:00.000Z',
    terminationDate: '2024-12-31T12:00:00.000Z',
    modificationDate: '2024-01-15T12:00:00.000Z',
    sortSequence: 1
  };

  beforeEach(() => {

    serviceSpyObj = jasmine.createSpyObj('ValidDonationTypeProcedureCodesService', [
      'getFilterOptions',
      'addAttributeMapping',
      'updateAttributeMapping'
    ]);

    const snackBarSpyObj = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [
        AddEditAttributeMapping,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: ValidDonationTypeProcedureCodesService, useValue: serviceSpyObj },
        { provide: MatSnackBar, useValue: snackBarSpyObj }
      ]
    });


    });



  beforeEach(() => {


    fixture = TestBed.createComponent(AddEditAttributeMapping);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(ValidDonationTypeProcedureCodesService) as jasmine.SpyObj<ValidDonationTypeProcedureCodesService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    serviceSpy.getFilterOptions.and.returnValue(of(mockFilterOptions));

    // Spy on the actual injected snackBar instance from the component
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

    });

  /* ===============================
     INITIALIZATION - ADD MODE
  =============================== */
  describe('Initialization - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = null;
    });



    it('should load dropdown data on initialization', () => {
      fixture.detectChanges();

      expect(serviceSpy.getFilterOptions).toHaveBeenCalled();
      expect(component.donationTypes).toEqual(mockFilterOptions.donationTypes);
      expect(component.procedureCodes).toEqual(mockFilterOptions.procedureCodes);
      expect(component.attributeGroups).toEqual(mockFilterOptions.attribGroups);
      expect(component.attributeCodes).toEqual(mockFilterOptions.attribCodes);
    });

  });

  /* ===============================
     INITIALIZATION - EDIT MODE
  =============================== */
  describe('Initialization - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
    });

    it('should initialize form with existing data in edit mode', () => {
      fixture.detectChanges();

      expect(component.form.get('donationType')?.value).toBe('WB');
      expect(component.form.get('procedureCode')?.value).toBe('WBL');
      expect(component.form.get('attributeGroup')?.value).toBe('PROC');
      expect(component.form.get('attributeCode')?.value).toBe('TEST1');
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
    });



    it('should store original values for edit mode', () => {
      fixture.detectChanges();

      expect(component['originalValues'].donationType).toBe('WB');
      expect(component['originalValues'].procedureCode).toBe('WBL');
      expect(component['originalValues'].attributeGroup).toBe('PROC');
      expect(component['originalValues'].attributeCode).toBe('TEST1');
      expect(component['originalValues'].effectiveDate).toBeTruthy();
    });

    it('should store edit mode display value for attribute code', () => {
      fixture.detectChanges();

      expect(component.editModeValues.attributeCode).toBe('TEST1');
    });


    it('should format terminationDate for display in edit mode', () => {
      fixture.detectChanges();

      expect(component.editModeValues.terminationDate).toBe('31-Dec-2024');
    });
  });

  /* ===============================
     FORM VALIDATION
  =============================== */
  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should pass validation when termination date is after effective date', () => {
      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date('2026-12-31')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should pass validation when termination date is not provided', () => {
      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });


  });

  /* ===============================
     SAVE - ADD MODE
  =============================== */
  describe('Save - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should call addAttributeMapping with correct payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Added successfully' };
      serviceSpy.addAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      expect(serviceSpy.addAttributeMapping).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'WB',
          procedureCode: 'WBL',
          attribGroup: 'PROC',
          attribCode: 'TEST1',
          sortSequence: 99999
        })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));

  });

  /* ===============================
     SAVE - EDIT MODE
  =============================== */
  describe('Save - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call updateAttributeMapping with correct payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated successfully' };
      serviceSpy.updateAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        terminationDate: new Date('2026-12-31')
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      const payload = serviceSpy.updateAttributeMapping.calls.mostRecent().args[0] as UpdateValidDonationTypeProcedureCodesDto;
      // All composite key fields should use original values to ensure correct record is updated
      expect(payload.currentDonationType).toBe('WB'); // Original value
      expect(payload.currentProcedureCode).toBe('WBL'); // Original value
      expect(payload.currentAttribGroup).toBe('PROC'); // Original value
      expect(payload.currentAttribCode).toBe('TEST1'); // Original value
      expect(payload.sortSequence).toBe(1); // Preserve existing sortSequence
    }));

    it('should use original values for composite key in update', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Updated successfully' };
      serviceSpy.updateAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'PLT',
        procedureCode: 'APLT'
      });

      component.onSave();
      tick();

      const payload = serviceSpy.updateAttributeMapping.calls.mostRecent().args[0] as UpdateValidDonationTypeProcedureCodesDto;
      expect(payload.currentAttribCode).toBe('TEST1'); // Original attribute code
      expect(payload.currentEffectiveDate).toBeTruthy(); // Original effective date
    }));
  });

  /* ===============================
     SAVE AND CREATE ANOTHER - ADD MODE
  =============================== */
  describe('Save and Create Another - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save and create another when form is invalid', () => {
      component.onSaveAndCreateAnother();

      expect(serviceSpy.addAttributeMapping).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
    });

    it('should call addAttributeMapping with correct payload', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Added successfully' };
      serviceSpy.addAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSaveAndCreateAnother();
      tick();

      expect(serviceSpy.addAttributeMapping).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'WB',
          procedureCode: 'WBL',
          attribGroup: 'PROC',
          attribCode: 'TEST1',
          sortSequence: 99999
        })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).not.toHaveBeenCalled(); // Should NOT close panel
    }));

    it('should reset form after successful save and create another', fakeAsync(() => {
      const mockResponse = { success: true, message: 'Added successfully' };
      serviceSpy.addAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date('2026-12-31')
      });

      component.onSaveAndCreateAnother();
      tick();

      // Form should be reset to empty values
      expect(component.form.get('donationType')?.value).toBe('');
      expect(component.form.get('procedureCode')?.value).toBe('');
      expect(component.form.get('attributeGroup')?.value).toBe('');
      expect(component.form.get('attributeCode')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    }));


    it('should handle saving state correctly', fakeAsync(() => {
      const mockResponse = { success: true };
      serviceSpy.addAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1'
      });

      expect(component.isSaving).toBeFalse();

      component.onSaveAndCreateAnother();

      // Should be false after completion (finalize callback)
      tick();
      expect(component.isSaving).toBeFalse();
    }));
  });

  /* ===============================
     DROPDOWN DATA LOADING
  =============================== */
  describe('Dropdown Data Loading', () => {

    it('should handle error when loading dropdown data fails', () => {
      const mockError = { error: 'Failed to load' };
      serviceSpy.getFilterOptions.and.returnValue(throwError(() => mockError));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isLoadingDropdowns).toBeFalse();
    });

    it('should handle empty dropdown responses', () => {
      serviceSpy.getFilterOptions.and.returnValue(of({
        donationTypes: [],
        procedureCodes: [],
        attribGroups: [],
        attribCodes: []
      }));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
      expect(component.procedureCodes).toEqual([]);
      expect(component.attributeGroups).toEqual([]);
      expect(component.attributeCodes).toEqual([]);
    });
  });

  /* ===============================
     CANCEL / CLOSE
  =============================== */
  describe('Cancel / Close', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit closePanel when onCancel is called', () => {
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  /* ===============================
     ERROR MESSAGE GETTERS
  =============================== */
  describe('Error Message Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return donation type error when field is touched and empty', () => {
      const control = component.form.get('donationType');
      control?.markAsTouched();
      control?.setValue('');

      const error = component.getDonationTypeError();

      expect(error).toBe('Donation Type is required');
    });

    it('should return procedure code error when field is touched and empty', () => {
      const control = component.form.get('procedureCode');
      control?.markAsTouched();
      control?.setValue('');

      const error = component.getProcedureCodeError();

      expect(error).toBe('Procedure Code is required');
    });

    it('should return attribute group error when field is touched and empty', () => {
      const control = component.form.get('attributeGroup');
      control?.markAsTouched();
      control?.setValue('');

      const error = component.getAttributeGroupError();

      expect(error).toBe('Attribute Group is required');
    });

    it('should return attribute code error when field is touched and empty', () => {
      const control = component.form.get('attributeCode');
      control?.markAsTouched();
      control?.setValue('');

      const error = component.getAttributeCodeError();

      expect(error).toBe('Attribute Code is required');
    });

    it('should return termination date error when date range is invalid', () => {
      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date('2026-12-01'),
        terminationDate: new Date('2026-11-01')
      });

      component.form.get('terminationDate')?.markAsTouched();

      const error = component.getTerminationDateError();

      expect(error).toBe('Termination Date must be greater than or equal to Effective Date');
    });

  });

  /* ===============================
     FORM CONTROL GETTERS
  =============================== */
  describe('Form Control Getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return donation type control', () => {
      const control = component.donationTypeControl;

      expect(control).toBe(component.form.get('donationType'));
    });

    it('should return procedure code control', () => {
      const control = component.procedureCodeControl;

      expect(control).toBe(component.form.get('procedureCode'));
    });

    it('should return attribute group control', () => {
      const control = component.attributeGroupControl;

      expect(control).toBe(component.form.get('attributeGroup'));
    });

    it('should return attribute code control', () => {
      const control = component.attributeCodeControl;

      expect(control).toBe(component.form.get('attributeCode'));
    });

    it('should return effective date control', () => {
      const control = component.effectiveDateControl;

      expect(control).toBe(component.form.get('effectiveDate'));
    });

    it('should return termination date control', () => {
      const control = component.terminationDateControl;

      expect(control).toBe(component.form.get('terminationDate'));
    });

  });

  /* ===============================
     DATE HANDLING
  =============================== */
  describe('Date Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should convert native Date to ISO string without timezone shift', () => {
      const date = new Date('2026-06-15');
      const isoString = component['toISOStringWithoutTimezone'](date);

      expect(isoString).toContain('2026-06-15');
      expect(isoString).toContain('T12:00:00.000Z');
    });


    it('should handle Date object in toNativeDate', () => {
      const date = new Date(moment().add(10, 'days').format('YYYY-MM-DD'));
      const result = component['toNativeDate'](date);

      expect(result).toEqual(date);
    });

  });

  /* ===============================
     COMPONENT LIFECYCLE
  =============================== */
  /* ===============================
     EDGE CASES
  =============================== */
  describe('Edge Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle saving state correctly', fakeAsync(() => {
      const mockResponse = { success: true };
      serviceSpy.addAttributeMapping.and.returnValue(of(mockResponse));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1'
      });

      expect(component.isSaving).toBeFalse();

      component.onSave();
      tick();

      expect(component.isSaving).toBeFalse(); // After completion
    }));

    it('should handle edit mode with null data gracefully', () => {
      component.mode = 'edit';
      component.data = null;

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  /* ===============================
     PANEL TITLE
  =============================== */
  describe('Panel Title', () => {
    it('should set panelTitle to "Add New Attribute Mapping" in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Add New Attribute Mapping');
    });

    it('should set panelTitle to "Edit Attribute Mapping" in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Attribute Mapping');
    });
  });

  /* ===============================
     isFormValid GETTER
  =============================== */
  describe('isFormValid Getter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when all required fields are filled', () => {
      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: null
      });

      expect(component.isFormValid).toBeTrue();
    });
  });

  /* ===============================
     COMPONENT LIFECYCLE
  =============================== */
  describe('Component Lifecycle', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  /* ===============================
     DATE VALIDATION LISTENERS
  =============================== */
  describe('Date Validation Listeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should revalidate form when effectiveDate changes', () => {
      const updateSpy = spyOn(component.form, 'updateValueAndValidity');

      component.form.get('effectiveDate')?.setValue(new Date(moment().add(5, 'days').format('YYYY-MM-DD')));

      expect(updateSpy).toHaveBeenCalled();
    });

    it('should mark terminationDate as touched when it has a value and effectiveDate changes', () => {
      component.form.get('terminationDate')?.setValue(new Date('2027-12-31'));
      const termControl = component.form.get('terminationDate');

      component.form.get('effectiveDate')?.setValue(new Date(moment().add(5, 'days').format('YYYY-MM-DD')));

      expect(termControl?.touched).toBeTrue();
    });

    it('should not mark terminationDate as touched when it has no value and effectiveDate changes', () => {
      component.form.get('terminationDate')?.setValue(null);

      component.form.get('effectiveDate')?.setValue(new Date(moment().add(5, 'days').format('YYYY-MM-DD')));

      const termControl = component.form.get('terminationDate');
      expect(termControl?.touched).toBeFalse();
    });

    it('should revalidate form when terminationDate changes', () => {
      const updateSpy = spyOn(component.form, 'updateValueAndValidity');

      component.form.get('terminationDate')?.setValue(new Date('2027-12-31'));

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  /* ===============================
     toNativeDate EDGE CASES
  =============================== */
  describe('toNativeDate Edge Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return null for null input', () => {
      const result = component['toNativeDate'](null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = component['toNativeDate'](undefined);
      expect(result).toBeNull();
    });

    it('should convert moment object to Date', () => {
      const m = moment('2026-06-15');
      const result = component['toNativeDate'](m);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should return null for invalid date string', () => {
      const result = component['toNativeDate']('not-a-date');
      expect(result).toBeNull();
    });

    it('should parse valid date string', () => {
      const result = component['toNativeDate']('2026-06-15');
      expect(result).toBeInstanceOf(Date);
    });
  });

  /* ===============================
     SAVE - ERROR HANDLING
  =============================== */
  describe('Save - Error Handling', () => {
    describe('Add Mode Errors', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should not call API when form is invalid', () => {
        component.onSave();

        expect(serviceSpy.addAttributeMapping).not.toHaveBeenCalled();
      });

      it('should show error message from server when error.error.message exists', fakeAsync(() => {
        serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
          error: { message: 'Server validation failed' },
          status: 400
        })));

        component.form.patchValue({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1',
          effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Server validation failed',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should show 409 conflict error message', fakeAsync(() => {
        serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 409
        })));

        component.form.patchValue({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1',
          effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'This attribute mapping already exists',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should show 404 not found error message', fakeAsync(() => {
        serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 404
        })));

        component.form.patchValue({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1',
          effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Attribute mapping not found',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should show generic error message for unknown errors', fakeAsync(() => {
        serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 500
        })));

        component.form.patchValue({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1',
          effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'An error occurred while saving',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should reset isSaving to false after error', fakeAsync(() => {
        serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 500
        })));

        component.form.patchValue({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1',
          effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
        });

        component.onSave();
        tick();

        expect(component.isSaving).toBeFalse();
      }));
    });

    describe('Edit Mode Errors', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockEditData;
        fixture.detectChanges();
      });

      it('should show error message from server on update failure', fakeAsync(() => {
        serviceSpy.updateAttributeMapping.and.returnValue(throwError(() => ({
          error: { message: 'Update conflict detected' },
          status: 400
        })));

        component.form.patchValue({
          terminationDate: new Date('2027-12-31')
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Update conflict detected',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should show 409 conflict error on update', fakeAsync(() => {
        serviceSpy.updateAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 409
        })));

        component.form.patchValue({
          terminationDate: new Date('2027-12-31')
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'This attribute mapping already exists',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));

      it('should show 404 not found error on update', fakeAsync(() => {
        serviceSpy.updateAttributeMapping.and.returnValue(throwError(() => ({
          error: {},
          status: 404
        })));

        component.form.patchValue({
          terminationDate: new Date('2027-12-31')
        });

        component.onSave();
        tick();

        expect(snackBarOpenSpy).toHaveBeenCalledWith(
          'Attribute mapping not found',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      }));
    });
  });

  /* ===============================
     SAVE - SUCCESS SNACKBAR MESSAGES
  =============================== */
  describe('Save - Success Snackbar Messages', () => {
    it('should display add success snackbar message', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();

      serviceSpy.addAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSave();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'WB / WBL has been added successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should display update success snackbar message using original values', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      serviceSpy.updateAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        terminationDate: new Date('2027-12-31')
      });

      component.onSave();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'WB / WBL has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['success-snackbar']
        })
      );
    }));
  });

  /* ===============================
     SAVE - ADD MODE WITH TERMINATION DATE
  =============================== */
  describe('Save - Add Mode with Termination Date', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should include terminationDate in add payload when provided', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date('2027-12-31')
      });

      component.onSave();
      tick();

      const payload = serviceSpy.addAttributeMapping.calls.mostRecent().args[0] as ValidDonationTypeProcedureCodesDto;
      expect(payload.terminationDate).toBeTruthy();
      expect(payload.terminationDate).toContain('T12:00:00.000Z');
    }));
  });

  /* ===============================
     SAVE - EDIT MODE WITH NULL TERMINATION DATE
  =============================== */
  describe('Save - Edit Mode with null Termination Date', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should send undefined terminationDate when cleared in edit mode', fakeAsync(() => {
      serviceSpy.updateAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        terminationDate: null
      });

      component.onSave();
      tick();

      const payload = serviceSpy.updateAttributeMapping.calls.mostRecent().args[0] as UpdateValidDonationTypeProcedureCodesDto;
      expect(payload.terminationDate).toBeUndefined();
    }));

    it('should use default sortSequence 99999 when data.sortSequence is null', fakeAsync(() => {
      const dataWithoutSort = { ...mockEditData, sortSequence: undefined };
      component.mode = 'edit';
      component.data = dataWithoutSort as any;

      // Need to re-trigger ngOnInit to reload
      serviceSpy.getFilterOptions.and.returnValue(of(mockFilterOptions));
      component.ngOnInit();

      serviceSpy.updateAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();
      tick();

      const payload = serviceSpy.updateAttributeMapping.calls.mostRecent().args[0] as UpdateValidDonationTypeProcedureCodesDto;
      expect(payload.sortSequence).toBe(99999);
    }));
  });

  /* ===============================
     POPULATE FORM FOR EDIT - EDGE CASES
  =============================== */
  describe('Populate Form For Edit - Edge Cases', () => {
    it('should handle effectiveDate as a Date object (not string)', () => {
      const dataWithDateObject: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        effectiveDate: new Date('2024-01-01T12:00:00.000Z')
      };
      component.mode = 'edit';
      component.data = dataWithDateObject;
      fixture.detectChanges();

      expect(component['originalValues'].effectiveDate).toBeTruthy();
      expect(component['originalValues'].effectiveDate).toContain('T12:00:00.000Z');
    });

    it('should handle missing effectiveDate in edit data', () => {
      const dataWithoutEffDate: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        effectiveDate: null
      };
      component.mode = 'edit';
      component.data = dataWithoutEffDate;
      fixture.detectChanges();

      expect(component['originalValues'].effectiveDate).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('-');
    });

    it('should handle missing terminationDate in edit data', () => {
      const dataWithoutTermDate: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        terminationDate: null
      };
      component.mode = 'edit';
      component.data = dataWithoutTermDate;
      fixture.detectChanges();

      expect(component.editModeValues.terminationDate).toBe('-');
    });

    it('should handle missing modificationDate in edit data', () => {
      const dataWithoutModDate: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        modificationDate: null
      };
      component.mode = 'edit';
      component.data = dataWithoutModDate;
      fixture.detectChanges();

      expect(component.editModeValues.modificationDate).toBe('-');
    });

    it('should handle missing donationType in edit data', () => {
      const dataWithMissing: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        donationType: undefined
      };
      component.mode = 'edit';
      component.data = dataWithMissing;
      fixture.detectChanges();

      expect(component['originalValues'].donationType).toBe('');
      expect(component.editModeValues.donationType).toBe('-');
    });

    it('should handle missing procedureCode in edit data', () => {
      const dataWithMissing: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        procedureCode: undefined
      };
      component.mode = 'edit';
      component.data = dataWithMissing;
      fixture.detectChanges();

      expect(component['originalValues'].procedureCode).toBe('');
      expect(component.editModeValues.procedureCode).toBe('-');
    });

    it('should handle missing attribGroup in edit data', () => {
      const dataWithMissing: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        attribGroup: undefined
      };
      component.mode = 'edit';
      component.data = dataWithMissing;
      fixture.detectChanges();

      expect(component['originalValues'].attributeGroup).toBe('');
      expect(component.editModeValues.attributeGroup).toBe('-');
    });

    it('should handle missing attribCode in edit data', () => {
      const dataWithMissing: ValidDonationTypeProcedureCodesModel = {
        ...mockEditData,
        attribCode: undefined
      };
      component.mode = 'edit';
      component.data = dataWithMissing;
      fixture.detectChanges();

      expect(component['originalValues'].attributeCode).toBe('');
      expect(component.editModeValues.attributeCode).toBe('-');
    });

    it('should disable all fields except terminationDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.form.get('donationType')?.disabled).toBeTrue();
      expect(component.form.get('procedureCode')?.disabled).toBeTrue();
      expect(component.form.get('attributeGroup')?.disabled).toBeTrue();
      expect(component.form.get('attributeCode')?.disabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });
  });

  /* ===============================
     ERROR GETTERS - UNTOUCHED CONTROLS
  =============================== */
  describe('Error Getters - Untouched Controls', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string for donation type error when control is not touched', () => {
      expect(component.getDonationTypeError()).toBe('');
    });

    it('should return empty string for procedure code error when control is not touched', () => {
      expect(component.getProcedureCodeError()).toBe('');
    });

    it('should return empty string for attribute group error when control is not touched', () => {
      expect(component.getAttributeGroupError()).toBe('');
    });

    it('should return empty string for attribute code error when control is not touched', () => {
      expect(component.getAttributeCodeError()).toBe('');
    });

    it('should return empty string for donation type error when control has a value', () => {
      const control = component.form.get('donationType');
      control?.markAsTouched();
      control?.setValue('WB');

      expect(component.getDonationTypeError()).toBe('');
    });

    it('should return empty string for procedure code error when control has a value', () => {
      const control = component.form.get('procedureCode');
      control?.markAsTouched();
      control?.setValue('WBL');

      expect(component.getProcedureCodeError()).toBe('');
    });

    it('should return empty string for attribute group error when control has a value', () => {
      const control = component.form.get('attributeGroup');
      control?.markAsTouched();
      control?.setValue('PROC');

      expect(component.getAttributeGroupError()).toBe('');
    });

    it('should return empty string for attribute code error when control has a value', () => {
      const control = component.form.get('attributeCode');
      control?.markAsTouched();
      control?.setValue('CODE1');

      expect(component.getAttributeCodeError()).toBe('');
    });
  });

  /* ===============================
     getEffectiveDateError
  =============================== */
  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should delegate to DateFieldValidationUtility.getEffectiveDateError', () => {
      const result = component.getEffectiveDateError();

      // When untouched, should return empty string
      expect(result).toBe('');
    });

    it('should return error when effective date is in the past', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(new Date('2020-01-01'));
      control?.markAsTouched();

      const result = component.getEffectiveDateError();

      expect(result).toBe('Effective date cannot be past date');
    });
  });

  /* ===============================
     SAVE AND CREATE ANOTHER - ERROR HANDLING
  =============================== */
  describe('Save and Create Another - Error Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show error message from server on save and create another failure', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
        error: { message: 'Duplicate entry detected' },
        status: 400
      })));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Duplicate entry detected',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show 409 conflict error on save and create another', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
        error: {},
        status: 409
      })));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'This attribute mapping already exists',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show 404 error on save and create another', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
        error: {},
        status: 404
      })));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Attribute mapping not found',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show generic error on save and create another for unknown status', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
        error: {},
        status: 500
      })));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'An error occurred while saving',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should reset isSaving to false after error on save and create another', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(throwError(() => ({
        error: {},
        status: 500
      })));

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSaving).toBeFalse();
    }));

    it('should show success snackbar on save and create another', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        donationType: 'PLT',
        procedureCode: 'APLT',
        attributeGroup: 'QUAL',
        attributeCode: 'CODE2',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD'))
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'PLT / APLT has been added successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should include terminationDate in save and create another payload when provided', fakeAsync(() => {
      serviceSpy.addAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date(moment().add(10, 'days').format('YYYY-MM-DD')),
        terminationDate: new Date('2027-12-31')
      });

      component.onSaveAndCreateAnother();
      tick();

      const payload = serviceSpy.addAttributeMapping.calls.mostRecent().args[0] as ValidDonationTypeProcedureCodesDto;
      expect(payload.terminationDate).toBeTruthy();
      expect(payload.terminationDate).toContain('T12:00:00.000Z');
    }));
  });

  /* ===============================
     DROPDOWN DATA - NULL FIELD HANDLING
  =============================== */
  describe('Dropdown Data - Null Field Handling', () => {
    it('should handle null/undefined fields in filter options response', () => {
      serviceSpy.getFilterOptions.and.returnValue(of({
        donationTypes: null,
        procedureCodes: null,
        attribGroups: null,
        attribCodes: null
      } as any));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.donationTypes).toEqual([]);
      expect(component.procedureCodes).toEqual([]);
      expect(component.attributeGroups).toEqual([]);
      expect(component.attributeCodes).toEqual([]);
    });
  });

  /* ===============================
     FORM VALIDATION - ADDITIONAL
  =============================== */
  describe('Form Validation - Additional', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should mark all controls as touched when onSave is called with invalid form', () => {
      component.onSave();

      expect(component.form.get('donationType')?.touched).toBeTrue();
      expect(component.form.get('procedureCode')?.touched).toBeTrue();
      expect(component.form.get('attributeGroup')?.touched).toBeTrue();
      expect(component.form.get('attributeCode')?.touched).toBeTrue();
    });

    it('should fail validation with dateRangeInvalid when termination is before effective', () => {
      component.form.patchValue({
        donationType: 'WB',
        procedureCode: 'WBL',
        attributeGroup: 'PROC',
        attributeCode: 'TEST1',
        effectiveDate: new Date('2027-06-01'),
        terminationDate: new Date('2027-01-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should require donationType', () => {
      component.form.get('donationType')?.setValue('');
      expect(component.form.get('donationType')?.hasError('required')).toBeTrue();
    });

    it('should require procedureCode', () => {
      component.form.get('procedureCode')?.setValue('');
      expect(component.form.get('procedureCode')?.hasError('required')).toBeTrue();
    });

    it('should require attributeGroup', () => {
      component.form.get('attributeGroup')?.setValue('');
      expect(component.form.get('attributeGroup')?.hasError('required')).toBeTrue();
    });

    it('should require attributeCode', () => {
      component.form.get('attributeCode')?.setValue('');
      expect(component.form.get('attributeCode')?.hasError('required')).toBeTrue();
    });
  });

  /* ===============================
     SAVE - EMIT RESULT SHAPE
  =============================== */
  describe('Save - Emit Result Shape', () => {
    it('should emit saveSuccess with correct AttributeMappingFormData in add mode', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();

      serviceSpy.addAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      const futureDate = new Date(moment().add(10, 'days').format('YYYY-MM-DD'));
      component.form.patchValue({
        donationType: ' WB ',
        procedureCode: ' WBL ',
        attributeGroup: ' PROC ',
        attributeCode: ' TEST1 ',
        effectiveDate: futureDate,
        terminationDate: null
      });

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'WB',
          procedureCode: 'WBL',
          attributeGroup: 'PROC',
          attributeCode: 'TEST1'
        })
      );
    }));

    it('should emit saveSuccess and closePanel on successful edit save', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      serviceSpy.updateAttributeMapping.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        terminationDate: new Date('2027-12-31')
      });

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });
});
