import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AddEditProcedureExclusion } from './add-edit-procedure-exclusion';
import { DefineProcedureExclusionsService } from '../services/define-procedure-exclusions.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { SimpleChange } from '@angular/core';
import { DefineProcedureExclusionsModel } from '../models/define-procedure-exclusions.model';
import moment from 'moment';

describe('AddEditProcedureExclusion', () => {
  let component: AddEditProcedureExclusion;
  let fixture: ComponentFixture<AddEditProcedureExclusion>;
  let mockService: jasmine.SpyObj<DefineProcedureExclusionsService>;
  let mockHeaderService: any;

  // Use dynamic dates to avoid test failures when hardcoded dates become past dates
  const futureEffectiveDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
  const futureTerminationDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months from now

  const mockLookupResponse = {
    success: true,
    data: [{
      donationTypes: [
        { key: '99 - Not Recorded', value: '99' },
        { key: 'AL - Allogeneic', value: 'AL' },
        { key: 'AU - Autologous', value: 'AU' }
      ],
      procedureCodes: [
        { key: '99 - Not Present', value: '99' },
        { key: 'BM - Bone Marrow', value: 'BM' },
        { key: 'WB - Whole Blood', value: 'WB' }
      ],
      interdictionCodes: [
          { key: 'CODE001 - Description 1', value: 'CODE001' },
          { key: 'CODE002 - Description 2', value: 'CODE002' },
          { key: 'CODE003 - Description 3', value: 'CODE003' }
        ]
    }]
  };

  const mockEditData: DefineProcedureExclusionsModel = {
    donationType: 'AL',
    donationTypeDesc: 'AL - Allogeneic',
    procedure: 'BM',
    procedureDesc: 'BM - Bone Marrow',
    interdiction: 'CODE001',
    effectiveDate: new Date('2027-01-15'),
    terminationDate: new Date('2027-12-31')
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineProcedureExclusionsService', [
      'getLookups',
      'addProcedureExclusion',
      'updateProcedureExclusion',
      'getProcedureCodesByDonationType'
    ]);
    mockService.getLookups.and.returnValue(of(mockLookupResponse));
    mockService.addProcedureExclusion.and.returnValue(of({ success: true, message: 'Added successfully' }));
    mockService.updateProcedureExclusion.and.returnValue(of({ success: true, message: 'Updated successfully' }));
    mockService.getProcedureCodesByDonationType.and.returnValue(of({
      success: true,
      data: mockLookupResponse.data[0].procedureCodes
    }));

    mockHeaderService = { chapterTimeZone: signal('America/Los_Angeles') };



      TestBed.configureTestingModule({
imports: [
        AddEditProcedureExclusion,
        HttpClientTestingModule
      ],
      providers: [
        provideAnimationsAsync(),
        { provide: DefineProcedureExclusionsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {

      mockService.getLookups.and.returnValue(of(mockLookupResponse));


      mockService.addProcedureExclusion.and.returnValue(of({ success: true, message: 'Added successfully' }));


      mockService.updateProcedureExclusion.and.returnValue(of({ success: true, message: 'Updated successfully' }));


      mockService.getProcedureCodesByDonationType.and.returnValue(of({
    }));


    fixture = TestBed.createComponent(AddEditProcedureExclusion);
    component = fixture.componentInstance;


    });
  describe('ngOnInit', () => {

    it('should load lookup data on init', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      expect(mockService.getLookups).toHaveBeenCalled();
      expect(component.filteredDonationTypes().length).toBe(3);
      expect(component.filteredInterdictions().length).toBe(3);
    }));

    it('should map lookup data correctly with key-value pairs', fakeAsync(() => {
      component.mode = 'add';
      component.ngOnInit();
      tick();

      expect(component.filteredDonationTypes()[0].key).toBe('99 - Not Recorded');
      expect(component.filteredDonationTypes()[0].value).toBe('99');
      expect(component.filteredInterdictions()[0].key).toBe('CODE001 - Description 1');
    }));


    it('should handle error when loading lookup data', fakeAsync(() => {
      mockService.getLookups.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();
      tick();

      expect(component.isLoadingOptions).toBe(false);
    }));
  });


  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });



    it('should store original values for update API', () => {
      expect(component['originalValues'].donationType).toBe('AL');
      expect(component['originalValues'].procedure).toBe('BM');
      expect(component['originalValues'].interdiction).toBe('CODE001');
    });

    it('should format effective date for storage', () => {
      // Check that date is formatted as ISO string (YYYY-MM-DD)
      expect(component['originalValues'].effectiveDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should not have past date validator in edit mode', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      // Patch with a past date
      effectiveDateControl?.patchValue(moment('2020-01-01'));
      effectiveDateControl?.updateValueAndValidity();

      // Should not have effectiveDatePast error since validator is removed in edit mode
      expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);
    });

    it('should allow saving with past effective date in edit mode', () => {
      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2020-01-01'), // Past date
        terminationDate: moment('2027-12-31')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(true);
    });
  });

  describe('Date Range Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should not allow past effective date in add mode', () => {
      // Component is already in add mode from beforeEach
      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2020-01-01') // Past date
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(false);
    });

    it('should allow termination date equal to effective date', () => {
      component.form.patchValue({
        effectiveDate: moment('2027-01-15'),
        terminationDate: moment('2027-01-15')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRange')).toBe(false);
    });


    it('should show error when termination date is before effective date', () => {
      component.form.patchValue({
        effectiveDate: moment('2027-12-31'),
        terminationDate: moment('2027-01-15')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
    });

    it('should clear dateRange error when dates are valid', () => {
      // Set invalid dates first
      component.form.patchValue({
        effectiveDate: moment('2027-12-31'),
        terminationDate: moment('2027-01-15')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      // Fix the dates
      component.form.patchValue({
        effectiveDate: moment('2027-01-15'),
        terminationDate: moment('2027-12-31')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      expect(component.terminationDateControl?.hasError('dateRange')).toBe(false);
    });
  });

  describe('Date Validation - Cross Field Error Display', () => {
    it('should initialize minDate using chapter timezone from HeaderService', () => {
      fixture.detectChanges();
      expect(moment.isMoment(component.minDate)).toBe(true);
    });




    it('should prevent save when date range is invalid', () => {
      fixture.detectChanges();
      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2027-12-31'),
        terminationDate: moment('2027-01-15')
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBe(false);
    });
  });
  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'add';
    });



    it('should call addProcedureExclusion when form is valid in add mode', fakeAsync(() => {
      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(mockService.addProcedureExclusion).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001',
        effectiveDate: '2027-01-15T00:00:00.000Z',
        terminationDate: null
      }));
    }));

    it('should emit saveSuccess and closePanel on successful save', fakeAsync(() => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001'
      }));
      expect(component.closePanel.emit).toHaveBeenCalled();
    }));


  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call updateProcedureExclusion in edit mode', fakeAsync(() => {
      component.form.patchValue({
        donationType: 'AU',
        procedure: 'WB',
        interdiction: 'CODE002',
        terminationDate: moment('2027-12-31')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();
      tick();

      expect(mockService.updateProcedureExclusion).toHaveBeenCalledWith(jasmine.objectContaining({
        originalDonationType: 'AL',
        originalProcedureCode: 'BM',
        originalInterdictionCode: 'CODE001',
        donationType: 'AU',
        procedureCode: 'WB',
        interdictionCode: 'CODE002'
      }));
    }));

  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should call addProcedureExclusion and reset form in add mode', fakeAsync(() => {
      spyOn<any>(component, 'resetFormForAddMode');
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2027-01-15'),
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();
      tick();

      expect(mockService.addProcedureExclusion).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedureCode: 'BM',
        interdictionCode: 'CODE001',
        effectiveDate: '2027-01-15T00:00:00.000Z',
        terminationDate: null
      }));
      expect(component['resetFormForAddMode']).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001'
      }));
    }));

    it('should switch to add mode from edit mode after save', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component['setupPanel']();

      spyOn(component.modeChange, 'emit');

      component.form.patchValue({
        donationType: 'AU',
        effectiveDate: moment('2027-01-15')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSaveAndCreateAnother();
      tick();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    }));

    it('should set isSaving to false after error', fakeAsync(() => {
      mockService.addProcedureExclusion.and.returnValue(throwError(() => ({
        status: 409,
        error: {}
      })));

      component.form.patchValue({
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: moment('2027-01-15')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

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
      expect(result).toContain('PT');
    });

    it('should format non-today date with full format', () => {
      const pastDate = new Date('2026-01-15T10:30:00');
      const result = component.formatDateTime(pastDate);
      expect(result).toContain('15-');
      expect(result).toContain('-2026');
      expect(result).toContain('PT');
    });
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return donationType control', () => {
      expect(component.donationTypeControl).toBe(component.form.get('donationType'));
    });

    it('should return procedure control', () => {
      expect(component.procedureControl).toBe(component.form.get('procedure'));
    });

    it('should return interdiction control', () => {
      expect(component.interdictionControl).toBe(component.form.get('interdiction'));
    });


  });

  describe('Error Message Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should return required error for donationType', () => {
      component.form.get('donationType')?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('Donation Type is required');
    });


    it('should return required error for procedure', () => {
      component.form.get('procedure')?.markAsTouched();
      expect(component.getProcedureError()).toBe('Procedure is required');
    });


    it('should return required error for interdiction', () => {
      component.form.get('interdiction')?.markAsTouched();
      expect(component.getInterdictionError()).toBe('Interdiction is required');
    });



  });


  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should mark form as pristine', () => {
      component.form.markAsDirty();

      component['resetFormForAddMode']();

      expect(component.form.pristine).toBe(true);
    });
  });
  describe('Edit Mode with null/empty data', () => {

    it('should handle data with missing optional fields', () => {
      component.mode = 'edit';
      component.data = {
        donationType: 'AL',
        procedure: 'BM',
        interdiction: 'CODE001',
        effectiveDate: futureEffectiveDate,
        terminationDate: null
      };
      fixture.detectChanges();

      expect(component.form.get('terminationDate')?.value).toBeFalsy();
    });
  });

  describe('terminationMinDate getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return effective date when effective date is after today', () => {
      const futureDate = moment().add(7, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(futureDate);

      const terminationMin = component.terminationMinDate;
      expect(terminationMin.isSame(futureDate, 'day')).toBeTrue();
    });

    it('should return today when effective date is before today', () => {
      const chapterOffset = mockHeaderService.chapterTimeZone();
      const today = DateFieldValidationUtility.getMinDate(chapterOffset);
      const pastDate = today.clone().subtract(10, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(pastDate);

      const terminationMin = component.terminationMinDate;
      expect(terminationMin.isSameOrAfter(today, 'day')).toBeTrue();
    });

    it('should return today when effective date is today', () => {
      const chapterOffset = mockHeaderService.chapterTimeZone();
      const today = DateFieldValidationUtility.getMinDate(chapterOffset);
      component.form.get('effectiveDate')?.setValue(today);

      const terminationMin = component.terminationMinDate;
      expect(terminationMin.isSame(today, 'day')).toBeTrue();
    });

    it('should return minDate when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);

      const terminationMin = component.terminationMinDate;
      expect(terminationMin).toBeTruthy();
      expect(moment.isMoment(terminationMin)).toBeTrue();
    });
  });

  describe('Lookup Data Loading', () => {
    it('should handle empty lookup response', fakeAsync(() => {
      mockService.getLookups.and.returnValue(of({ data: [] }));

      component.ngOnInit();
      tick();

      expect(component.filteredDonationTypes()).toEqual([]);
      expect(component.filteredProcedures()).toEqual([]);
      expect(component.filteredInterdictions()).toEqual([]);
    }));

  });
});
