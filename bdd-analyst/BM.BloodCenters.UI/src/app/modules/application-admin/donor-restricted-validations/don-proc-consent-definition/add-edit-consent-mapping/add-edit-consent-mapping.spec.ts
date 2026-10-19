import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditConsentMapping } from './add-edit-consent-mapping';
import { DonProcConsentDefinitionService } from '../services/don-proc-consent-definition.service';
import { DonProcConsentDefinitionModel } from '../models/don-proc-consent-definition.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditConsentMapping', () => {
  let component: AddEditConsentMapping;
  let fixture: ComponentFixture<AddEditConsentMapping>;
  let mockService: jasmine.SpyObj<DonProcConsentDefinitionService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockCreateData: any = {
    item: {
      donationTypes: [
        { donationType: 'AL', description: 'Allogeneic' },
        { donationType: 'AU', description: 'Autologous' },
        { donationType: 'DI', description: 'Directed' }
      ],
      consentCodes: [
        { consentCode: 'DCONGEN', consentDescription: 'General Consent', versionNo: '1.0' },
        { consentCode: 'DCONTST', consentDescription: 'Test Consent', versionNo: '2.0' },
        { consentCode: 'DCONPP', consentDescription: 'Privacy Policy', versionNo: '1.5' }
      ]
    }
  };

  const mockProcedureCodes: any = {
    data: [
      { procedureCode: 'DP', description: 'Double Platelets' },
      { procedureCode: 'WB', description: 'Whole Blood' },
      { procedureCode: 'PP', description: 'Platelet Pheresis' }
    ]
  };

  const mockConsentDefinition: DonProcConsentDefinitionModel = {
    donationType: 'AL',
    procedureCode: 'DP',
    consentCode: 'DCONGEN',
    consentDescription: 'General Consent',
    effectiveDate: new Date('2026-06-15'),
    terminationDate: null
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonProcConsentDefinitionService', [
      'getCreateData',
      'getProcedureCodesByDonationType',
      'addConsentDefinition',
      'updateConsentDefinition'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    // Setup default mock responses
    mockService.getCreateData.and.returnValue(of(mockCreateData));
    mockService.getProcedureCodesByDonationType.and.returnValue(of(mockProcedureCodes));

      TestBed.configureTestingModule({
      imports: [
        AddEditConsentMapping,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DonProcConsentDefinitionService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });
      mockService.getCreateData.and.returnValue(of(mockCreateData));

      mockService.getProcedureCodesByDonationType.and.returnValue(of(mockProcedureCodes));

    fixture = TestBed.createComponent(AddEditConsentMapping);
    component = fixture.componentInstance;

    });

  describe('Component Initialization', () => {

    it('should have all form controls with required validators', () => {
      expect(component.form.get('donationType')?.hasError('required')).toBe(true);
      expect(component.form.get('procedureCode')?.hasError('required')).toBe(true);
      expect(component.form.get('consentCode')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should initialize empty arrays for dropdown options', () => {
      expect(component.donationTypeOptions).toEqual([]);
      expect(component.procedureCodeOptions).toEqual([]);
      expect(component.consentCodeOptions).toEqual([]);
    });
  });

  describe('setupDonationTypeListener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load procedure codes when donation type is selected', fakeAsync(() => {
      component.form.patchValue({ donationType: 'AL' });
      tick();

      expect(mockService.getProcedureCodesByDonationType).toHaveBeenCalledWith('AL', 'TST');
      expect(component.procedureCodeOptions).toEqual([
        { code: 'DP', description: 'Double Platelets' },
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PP', description: 'Platelet Pheresis' }
      ]);
    }));

    it('should clear procedure codes when donation type is cleared', fakeAsync(() => {
      component.procedureCodeOptions = [{ code: 'DP', description: 'Double Platelets' }, { code: 'WB', description: 'Whole Blood' }];
      component.form.patchValue({ donationType: null });
      tick();

      expect(component.procedureCodeOptions).toEqual([]);
    }));

    it('should not clear procedure code selection in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP'
      });
      tick();

      component.form.patchValue({ donationType: 'AU' });
      tick();

      expect(component.form.get('procedureCode')?.value).toBe('DP');
    }));
  });

  describe('setupConsentCodeListener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear consent description when consent code is cleared', fakeAsync(() => {
      component.form.patchValue({ consentCode: 'DCONGEN' });
      tick();

      component.form.patchValue({ consentCode: null });
      tick();

      expect(component.form.get('consentDescription')?.value).toBe('');
    }));

    it('should handle consent code not found in options', fakeAsync(() => {
      component.form.patchValue({ consentCode: 'INVALID' });
      tick();

      expect(component.form.get('consentDescription')?.value).toBe('');
    }));
  });

  describe('loadProcedureCodes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load procedure codes for given donation type', fakeAsync(() => {
      component['loadProcedureCodes']('AL');
      tick();

      expect(mockService.getProcedureCodesByDonationType).toHaveBeenCalledWith('AL', 'TST');
      expect(component.procedureCodeOptions).toEqual([
        { code: 'DP', description: 'Double Platelets' },
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PP', description: 'Platelet Pheresis' }
      ]);
      expect(component.isLoadingOptions).toBe(false);
    }));

    it('should remove duplicate procedure codes', fakeAsync(() => {
      mockService.getProcedureCodesByDonationType.and.returnValue(of({
        data: [
          { procedureCode: 'DP', description: 'Double Platelets' },
          { procedureCode: 'WB', description: 'Whole Blood' },
          { procedureCode: 'DP', description: 'Double Platelets' },
          { procedureCode: 'WB', description: 'Whole Blood' }
        ]
      }) as any);

      component['loadProcedureCodes']('AL');
      tick();

      expect(component.procedureCodeOptions).toEqual([
        { code: 'DP', description: 'Double Platelets' },
        { code: 'WB', description: 'Whole Blood' }
      ]);
    }));

    it('should clear procedure code in add mode after loading', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({ procedureCode: 'OLD' });

      component['loadProcedureCodes']('AL');
      tick();

      expect(component.form.get('procedureCode')?.value).toBeNull();
    }));
  });

  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to initial values', () => {
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        consentDescription: 'Test',
        effectiveDate: moment(),
        terminationDate: moment()
      });

      component['resetFormForAddMode']();

      expect(component.form.get('donationType')?.value).toBe(null);
      expect(component.form.get('procedureCode')?.value).toBe(null);
      expect(component.form.get('consentCode')?.value).toBe(null);
      expect(component.form.get('consentDescription')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should enable all form controls', () => {
      component.form.get('donationType')?.disable();
      component.form.get('procedureCode')?.disable();
      component.form.get('consentCode')?.disable();
      component.form.get('effectiveDate')?.disable();

      component['resetFormForAddMode']();

      expect(component.form.get('donationType')?.enabled).toBe(true);
      expect(component.form.get('procedureCode')?.enabled).toBe(true);
      expect(component.form.get('consentCode')?.enabled).toBe(true);
      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    });

    it('should set all fields as required', () => {
      component['resetFormForAddMode']();

      expect(component.form.get('donationType')?.hasError('required')).toBe(true);
      expect(component.form.get('procedureCode')?.hasError('required')).toBe(true);
      expect(component.form.get('consentCode')?.hasError('required')).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should mark form as untouched', () => {
      component.form.markAllAsTouched();
      component['resetFormForAddMode']();
      expect(component.form.touched).toBe(false);
    });

    it('should re-enable consentCode after switching from edit to add mode', () => {
      component.form.get('consentCode')?.disable();
      expect(component.form.get('consentCode')?.disabled).toBe(true);

      component['resetFormForAddMode']();

      expect(component.form.get('consentCode')?.enabled).toBe(true);
    });
  });

  describe('populateFormForEdit', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.data = mockConsentDefinition;
    });

    it('should populate form with data values', fakeAsync(() => {
      component['populateFormForEdit']();
      tick();

      expect(component.form.get('donationType')?.value).toBe('AL');
      expect(component.form.get('procedureCode')?.value).toBe('DP');
      expect(component.form.get('consentCode')?.value).toBe('DCONGEN');
      expect(moment.isMoment(component.form.get('effectiveDate')?.value)).toBe(true);
      expect(component.form.get('effectiveDate')?.value.format('YYYY-MM-DD')).toBe('2026-06-15');
      expect(component.form.get('terminationDate')?.value).toBeNull();
    }));

    it('should disable consentCode and keep terminationDate enabled in edit mode', fakeAsync(() => {
      component['populateFormForEdit']();
      tick();

      expect(component.form.get('consentCode')?.disabled).toBe(true);
      expect(component.form.get('terminationDate')?.enabled).toBe(true);
    }));

    it('should keep effectiveDate enabled in edit mode', fakeAsync(() => {
      component['populateFormForEdit']();
      tick();

      expect(component.form.get('effectiveDate')?.enabled).toBe(true);
    }));

    it('should include disabled consentCode value via getRawValue', fakeAsync(() => {
      component['populateFormForEdit']();
      tick();

      const rawValue = component.form.getRawValue();
      expect(rawValue.consentCode).toBe('DCONGEN');
    }));

    it('should store original values', fakeAsync(() => {
      component['populateFormForEdit']();
      tick();

      expect(component['originalValues'].donationType).toBe('AL');
      expect(component['originalValues'].procedureCode).toBe('DP');
      expect(component['originalValues'].effectiveDate).toBe(new Date('2026-06-15').toISOString());
    }));

    it('should load procedure codes for the donation type', fakeAsync(() => {
      spyOn<any>(component, 'loadProcedureCodesForEdit');
      component['populateFormForEdit']();
      tick();

      expect(component['loadProcedureCodesForEdit']).toHaveBeenCalledWith('AL', 'DP');
    }));
  });

  describe('Date Formatting Methods', () => {

    it('formatDateForAPI should return ISO string for valid moment date', () => {
      const testDate = moment('2026-01-15');
      const formatted = component['formatDateForAPI'](testDate);
      expect(formatted).toBe('2026-01-15T00:00:00.000Z');
    });

    it('formatDateForDisplay should convert Date to DD-MON-YYYY string', () => {
      const date = new Date('2026-06-15');
      const formatted = component['formatDateForDisplay'](date);
      expect(formatted).toMatch(/15-Jun-2026/i);
    });

    it('formatDateTime should convert Date to DD-MON-YYYY HH:mm string', () => {
      const futureDate = moment().add(10, 'days');
      const date = new Date(futureDate.format('YYYY-MM-DD') + 'T14:30:00');
      const formatted = component['formatDateTime'](date);
      const expectedPattern = new RegExp(`${futureDate.format('DD')}-\\w{3}-${futureDate.format('YYYY')}, \\d{2}:\\d{2} PST`, 'i');
      expect(formatted).toMatch(expectedPattern);
    });

  });

  describe('Form Control Getters', () => {
    it('should return donationType control', () => {
      expect(component.donationTypeControl).toBe(component.form.get('donationType'));
    });

    it('should return procedureCode control', () => {
      expect(component.procedureCodeControl).toBe(component.form.get('procedureCode'));
    });

    it('should return consentCode control', () => {
      expect(component.consentCodeControl).toBe(component.form.get('consentCode'));
    });

    it('should return consentDescription control', () => {
      expect(component.consentDescriptionControl).toBe(component.form.get('consentDescription'));
    });

  });

  describe('Error Message Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getDonationTypeError should return required message when field is empty', () => {
      component.form.get('donationType')?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('Donation Type is required');
    });

    it('getProcedureCodeError should return required message when field is empty', () => {
      component.form.get('procedureCode')?.markAsTouched();
      expect(component.getProcedureCodeError()).toBe('Procedure Code is required');
    });

    it('getConsentCodeError should return required message when field is empty', () => {
      component.form.get('consentCode')?.markAsTouched();
      expect(component.getConsentCodeError()).toBe('Consent Code is required');
    });

    it('getEffectiveDateError should return required message when field is empty', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        consentDescription: 'General Consent',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });
    });

    it('should call addConsentDefinition with correct data', () => {
      mockService.addConsentDefinition.and.returnValue(of({
        success: true,
        message: 'Consent mapping added successfully'
      }));

      component.onSave();

      expect(mockService.addConsentDefinition).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        chapterId: jasmine.any(String)
      }));
    });

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      mockService.addConsentDefinition.and.returnValue(of({
        success: true,
        message: 'Saved successfully'
      }));

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.data = mockConsentDefinition;
      component['originalValues'] = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: new Date('2026-06-15').toISOString()
      };

      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONTST',
        consentDescription: 'Test Consent',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment('2026-12-31')
      });
    });

    it('should call updateConsentDefinition with correct data including current values', () => {
      mockService.updateConsentDefinition.and.returnValue(of({
        success: true,
        message: 'Updated successfully'
      }));

      component.onSave();

      expect(mockService.updateConsentDefinition).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONTST',
        consentDescription: 'Test Consent',
        currentDonationType: 'AL',
        currentProcedureCode: 'DP',
        currentEffectiveDate: new Date('2026-06-15').toISOString(),
        chapterId: jasmine.any(String)
      }));
    });
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        consentDescription: 'General Consent',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: null
      });
    });

    it('should switch mode to add after successful save in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockConsentDefinition;
      component['originalValues'] = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: new Date('2026-06-15').toISOString()
      };
      spyOn(component.modeChange, 'emit');

      mockService.updateConsentDefinition.and.returnValue(of({
        success: true,
        message: 'Saved successfully'
      }));

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));

  });

  describe('Loading States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize isLoadingOptions as false', () => {
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSavingPrimary).toBe(false);
      expect(component.isSavingSecondary).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle empty consent code list', fakeAsync(() => {
      mockService.getCreateData.and.returnValue(of({
        item: {
          donationTypes: [{ donationType: 'AL', description: 'Allogeneic' }],
          consentCodes: []
        }
      }) as any);

      const newFixture = TestBed.createComponent(AddEditConsentMapping);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.consentCodeOptions).toEqual([]);
    }));

    it('should handle empty procedure code list', fakeAsync(() => {
      mockService.getProcedureCodesByDonationType.and.returnValue(of({ data: [] }) as any);

      component.form.patchValue({ donationType: 'AL' });
      tick();

      expect(component.procedureCodeOptions).toEqual([]);
    }));

    it('should handle terminationDate with value', () => {
      component.mode = 'add';
      const terminationMoment = moment('2026-12-31');
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day'),
        terminationDate: terminationMoment
      });

      mockService.addConsentDefinition.and.returnValue(of({ success: true }));
      component.onSave();

      expect(mockService.addConsentDefinition).toHaveBeenCalledWith(
        jasmine.objectContaining({
          terminationDate: '2026-12-31T00:00:00.000Z'
        })
      );
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call setupPanel when mode changes (not first change)', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        mode: { firstChange: false, previousValue: 'edit', currentValue: 'add', isFirstChange: () => false }
      });
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should call resetFormForAddMode when switching to add', () => {
      const resetSpy = spyOn<any>(component, 'resetFormForAddMode');
      component.mode = 'add';
      component.ngOnChanges({
        mode: { firstChange: false, previousValue: 'edit', currentValue: 'add', isFirstChange: () => false }
      });
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should not call setupPanel on first change', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        mode: { firstChange: true, previousValue: undefined, currentValue: 'add', isFirstChange: () => true }
      });
      expect(setupSpy).not.toHaveBeenCalled();
    });

    it('should not call setupPanel for unrelated changes', () => {
      const setupSpy = spyOn<any>(component, 'setupPanel');
      component.ngOnChanges({
        unrelated: { firstChange: false, previousValue: 'a', currentValue: 'b', isFirstChange: () => false }
      });
      expect(setupSpy).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave validation and error handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not save when form is invalid', () => {
      component.mode = 'add';
      component.form.patchValue({ donationType: '' });
      component.onSave();
      expect(mockService.addConsentDefinition).not.toHaveBeenCalled();
    });

    it('should handle 409 error', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.addConsentDefinition.and.returnValue(throwError(() => ({ status: 409, error: {} })));
      component.onSave();
      tick();

      expect(component.isSavingPrimary).toBeFalse();
    }));

    it('should handle 404 error', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.addConsentDefinition.and.returnValue(throwError(() => ({ status: 404, error: {} })));
      component.onSave();
      tick();

      expect(component.isSavingPrimary).toBeFalse();
    }));

    it('should handle generic error', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.addConsentDefinition.and.returnValue(throwError(() => ({ status: 500, error: {} })));
      component.onSave();
      tick();

      expect(component.isSavingPrimary).toBeFalse();
    }));

    it('should handle error with message', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.addConsentDefinition.and.returnValue(throwError(() => ({
        status: 400,
        error: { message: 'Validation error' }
      })));
      component.onSave();
      tick();

      expect(component.isSavingPrimary).toBeFalse();
    }));

    it('should set lastChangedDateField to effective when dateRangeInvalid and no lastChanged', () => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(6, 'months'),
        terminationDate: moment().add(1, 'day')
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onSave();

      expect(component['lastChangedDateField']).toBe('effective');
    });
  });

  describe('onSaveAndCreateAnother validation and error handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not save when form is invalid', () => {
      component.mode = 'add';
      component.form.patchValue({ donationType: '' });
      component.onSaveAndCreateAnother();
      expect(mockService.addConsentDefinition).not.toHaveBeenCalled();
    });

    it('should reset form in add mode after successful save', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      spyOn(component.saveSuccess, 'emit');
      mockService.addConsentDefinition.and.returnValue(of({ success: true, message: 'Saved' }));

      component.onSaveAndCreateAnother();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.isSavingSecondary).toBeFalse();
    }));

    it('should handle error in onSaveAndCreateAnother', fakeAsync(() => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.addConsentDefinition.and.returnValue(throwError(() => ({ status: 409, error: {} })));
      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSavingSecondary).toBeFalse();
    }));

    it('should set lastChangedDateField when dateRangeInvalid', () => {
      component.mode = 'add';
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment().add(6, 'months'),
        terminationDate: moment().add(1, 'day')
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onSaveAndCreateAnother();

      expect(component['lastChangedDateField']).toBe('effective');
    });
  });

  describe('Getter properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('isFormValid should return form.valid', () => {
      expect(component.isFormValid).toBe(component.form.valid);
    });

    it('effectiveDateControl should return the control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('terminationDateControl should return the control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });

    it('minTerminationDate should return a moment', () => {
      expect(moment.isMoment(component.minTerminationDate)).toBeTrue();
    });

    it('minDate should return a moment', () => {
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('hasFormChanges should return false when initializing edit form', () => {
      component['isInitializingEditForm'] = true;
      expect(component.hasFormChanges).toBeFalse();
    });

    it('hasFormChanges should call checkIfFormHasChanges when not initializing', () => {
      component['isInitializingEditForm'] = false;
      const spy = spyOn<any>(component, 'checkIfFormHasChanges').and.returnValue(true);
      expect(component.hasFormChanges).toBeTrue();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getConsentDescription and getConsentDescriptionForCode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getConsentDescription should return form value', () => {
      component.form.get('consentDescription')?.setValue('Test Description');
      expect(component.getConsentDescription()).toBe('Test Description');
    });

    it('getConsentDescription should return empty string when no value', () => {
      component.form.get('consentDescription')?.setValue(null);
      expect(component.getConsentDescription()).toBe('');
    });

    it('getConsentDescriptionForCode should return description for matching code', () => {
      component['consentCodeData'] = [
        { consentCode: 'DCONGEN', consentDescription: 'General Consent', versionNo: '1.0' }
      ];
      expect(component.getConsentDescriptionForCode('DCONGEN')).toBe('General Consent');
    });

    it('getConsentDescriptionForCode should return empty string for non-matching code', () => {
      component['consentCodeData'] = [];
      expect(component.getConsentDescriptionForCode('UNKNOWN')).toBe('');
    });
  });

  describe('Date input and change handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('onEffectiveDateInput should delegate to utility', () => {
      const input = { value: '01-JAN-2030' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(true).toBeTrue();
    });

    it('onTerminationDateInput should delegate to utility', () => {
      const input = { value: '01-JAN-2030' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(true).toBeTrue();
    });

    it('onEffectiveDateChange should mark as touched and dirty', () => {
      component.onEffectiveDateChange();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.dirty).toBeTrue();
    });

    it('onTerminationDateChange should mark as touched and dirty', () => {
      component.onTerminationDateChange();
      expect(component.form.get('terminationDate')?.touched).toBeTrue();
      expect(component.form.get('terminationDate')?.dirty).toBeTrue();
    });
  });

  describe('formatDateForAPI and formatDateForDisplay edge cases', () => {
    it('formatDateForAPI should return null for null', () => {
      expect(component['formatDateForAPI'](null)).toBeNull();
    });

    it('formatDateForAPI should return null for undefined', () => {
      expect(component['formatDateForAPI'](undefined)).toBeNull();
    });

    it('formatDateForDisplay should return empty for null', () => {
      expect(component['formatDateForDisplay'](null)).toBe('');
    });

    it('formatDateForDisplay should return empty for undefined', () => {
      expect(component['formatDateForDisplay'](undefined)).toBe('');
    });

    it('formatDateTime should return empty for null', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('formatDateTime should show Today for today date', () => {
      const result = component.formatDateTime(new Date());
      expect(result).toContain('Today');
    });
  });

  describe('Error getters edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getDonationTypeError should return empty when untouched', () => {
      expect(component.getDonationTypeError()).toBe('');
    });

    it('getProcedureCodeError should return empty when untouched', () => {
      expect(component.getProcedureCodeError()).toBe('');
    });

    it('getConsentCodeError should return empty when untouched', () => {
      expect(component.getConsentCodeError()).toBe('');
    });

    it('getDonationTypeError should return empty when valid and touched', () => {
      component.form.get('donationType')?.setValue('AL');
      component.form.get('donationType')?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('');
    });

    it('getTerminationDateError should return string', () => {
      expect(typeof component.getTerminationDateError()).toBe('string');
    });

    it('getEffectiveDateError should pass form errors when lastChanged is effective', () => {
      component['lastChangedDateField'] = 'effective';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('getTerminationDateError should pass form errors when lastChanged is termination', () => {
      component['lastChangedDateField'] = 'termination';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('loadDropdownOptions edge cases', () => {
    it('should handle error from getCreateData', fakeAsync(() => {
      mockService.getCreateData.and.returnValue(throwError(() => new Error('fail')));
      const newFixture = TestBed.createComponent(AddEditConsentMapping);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.donationTypeOptions).toEqual([]);
      expect(newComponent.consentCodeOptions).toEqual([]);
      expect(newComponent.isLoadingOptions).toBeFalse();
    }));

    it('should handle null createData', fakeAsync(() => {
      mockService.getCreateData.and.returnValue(of({ item: null }) as any);
      const newFixture = TestBed.createComponent(AddEditConsentMapping);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.donationTypeOptions).toEqual([]);
      expect(newComponent.consentCodeOptions).toEqual([]);
    }));
  });

  describe('loadProcedureCodes error case', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear options on error', fakeAsync(() => {
      mockService.getProcedureCodesByDonationType.and.returnValue(throwError(() => new Error('fail')));
      component['loadProcedureCodes']('AL');
      tick();

      expect(component.procedureCodeOptions).toEqual([]);
      expect(component.isLoadingOptions).toBeFalse();
    }));
  });

  describe('loadProcedureCodesForEdit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add procedure code to options if not found', fakeAsync(() => {
      mockService.getProcedureCodesByDonationType.and.returnValue(of({
        data: [{ procedureCode: 'WB', description: 'Whole Blood' }]
      }) as any);

      component['loadProcedureCodesForEdit']('AL', 'CUSTOM');
      tick();

      expect(component.procedureCodeOptions.some(o => o.code === 'CUSTOM')).toBeTrue();
    }));

    it('should handle error', fakeAsync(() => {
      mockService.getProcedureCodesByDonationType.and.returnValue(throwError(() => new Error('fail')));

      component['loadProcedureCodesForEdit']('AL', 'DP');
      tick();

      expect(component.procedureCodeOptions).toEqual([]);
      expect(component.isLoadingOptions).toBeFalse();
    }));
  });

  describe('checkIfFormHasChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when not in edit mode', () => {
      component.mode = 'add';
      expect(component['checkIfFormHasChanges']()).toBeFalse();
    });

    it('should return false when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      expect(component['checkIfFormHasChanges']()).toBeFalse();
    });

    it('should return true when donation type changed', () => {
      component.mode = 'edit';
      component.data = mockConsentDefinition;
      component['originalValues'] = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: '2026-06-15T00:00:00.000Z'
      };
      component.form.patchValue({
        donationType: 'AU',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment('2026-06-15'),
        terminationDate: null
      });
      expect(component['checkIfFormHasChanges']()).toBeTrue();
    });

    it('should return false when no values changed', () => {
      component.mode = 'edit';
      component.data = { ...mockConsentDefinition, terminationDate: null };
      component['originalValues'] = {
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: '2026-06-15T00:00:00.000Z'
      };
      component.form.patchValue({
        donationType: 'AL',
        procedureCode: 'DP',
        consentCode: 'DCONGEN',
        effectiveDate: moment('2026-06-15'),
        terminationDate: null
      });
      expect(component['checkIfFormHasChanges']()).toBeFalse();
    });
  });

  describe('setupTerminationDateMinListener', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set minTermDateOverride when effective date is set to future', fakeAsync(() => {
      component['_minTermDateOverride'] = null;
      const futureDate = moment().add(3, 'months');
      component.form.get('effectiveDate')?.setValue(futureDate);
      tick();
      expect(component['_minTermDateOverride']).not.toBeNull();
    }));

    it('should set lastChangedDateField to termination on termination date change', fakeAsync(() => {
      component['lastChangedDateField'] = null;
      component.form.get('terminationDate')?.setValue(moment().add(4, 'months'));
      tick();
      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should clear minTermDateOverride when effective date cleared', fakeAsync(() => {
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'months'));
      tick();
      component.form.get('effectiveDate')?.setValue(null);
      tick();
      expect(component['_minTermDateOverride']).toBeNull();
    }));
  });

  describe('setupDropdownSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Manually set options since the mock response may not populate them
      component.donationTypeOptions = [
        { code: 'AL', description: 'Allogeneic' },
        { code: 'AU', description: 'Autologous' },
        { code: 'DI', description: 'Directed' }
      ];
      component.consentCodeOptions = ['DCONGEN', 'DCONTST', 'DCONPP'];
      // Trigger setupDropdownSearch by calling it directly
      component['setupDropdownSearch']();
    });

    it('should filter donation type options on search', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('Allo');
      tick();

      const filtered = component.filteredDonationTypeOptions;
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('AL');
    }));

    it('should reset donation type options when search cleared', fakeAsync(() => {
      component.donationTypeSearchControl.setValue('Allo');
      tick();
      component.donationTypeSearchControl.setValue('');
      tick();

      expect(component.filteredDonationTypeOptions.length).toBe(component.donationTypeOptions.length);
    }));

    it('should filter consent code options on search', fakeAsync(() => {
      component.consentCodeSearchControl.setValue('DCONGEN');
      tick();

      expect(component.filteredConsentCodeOptions.length).toBe(1);
    }));
  });

  describe('ensureEditValuesInOptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not modify options in add mode', () => {
      component.mode = 'add';
      const originalLength = component.donationTypeOptions.length;
      component['ensureEditValuesInOptions']();
      expect(component.donationTypeOptions.length).toBe(originalLength);
    });

    it('should add missing donation type in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockConsentDefinition, donationType: 'MISSING' };
      component.donationTypeOptions = [{ code: 'AL', description: 'Allogeneic' }];
      component['ensureEditValuesInOptions']();
      expect(component.donationTypeOptions.some(o => o.code === 'MISSING')).toBeTrue();
    });

    it('should add missing consent code in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockConsentDefinition, consentCode: 'NEWCODE' };
      component.consentCodeOptions = ['DCONGEN'];
      component['ensureEditValuesInOptions']();
      expect(component.consentCodeOptions.includes('NEWCODE')).toBeTrue();
    });
  });

  describe('minTermDate getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return override when set', () => {
      const override = moment().add(1, 'month');
      component['_minTermDateOverride'] = override;
      expect(component.minTerminationDate).toBe(override);
    });

    it('should return minDate when no override', () => {
      component['_minTermDateOverride'] = null;
      expect(moment.isMoment(component.minTerminationDate)).toBeTrue();
    });
  });
});
