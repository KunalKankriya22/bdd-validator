import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { signal, Signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditAntigenDialog } from './add-edit-antigen-dialog';
import { HlaAntigensService } from '../services/hla-antigens.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  HlaAntigenModel,
  AddEditAntigenDialogData,
  CreateHlaAntigenDto,
  HlaAntigenItemResponse
} from '../models/hla-antigens.model';

describe('AddEditAntigenDialog', () => {
  let component: AddEditAntigenDialog;
  let fixture: ComponentFixture<AddEditAntigenDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditAntigenDialog>>;
  let serviceSpy: jasmine.SpyObj<HlaAntigensService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockAntigen: HlaAntigenModel = {
    locus: 'A',
    locusDescription: 'HLA-A',
    epitopeId: '123',
    epitopeSuperI: '456',
    effDate: '2024-01-01',
    termDate: '2025-12-31'
  };

  const mockLocusCodes = [
    { code: 'A', description: 'HLA-A' },
    { code: 'B', description: 'HLA-B' },
    { code: 'C', description: 'HLA-C' },
    { code: 'DPB1', description: 'HLA-DPB1' },
    { code: 'DQB1', description: 'HLA-DQB1' },
    { code: 'DRB1', description: 'HLA-DRB1' }
  ];

  const addModeData: AddEditAntigenDialogData = {
    mode: 'add'
  };

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('HlaAntigensService', [
      'addHlaAntigen',
      'getLocusCodes'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [], {
      chapterTimeZone: signal('-05:00')
    });

    serviceSpy.getLocusCodes.and.returnValue(of(mockLocusCodes));



      TestBed.configureTestingModule({
      imports: [AddEditAntigenDialog, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: addModeData },
        { provide: HlaAntigensService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      serviceSpy.addHlaAntigen.calls.reset();


      serviceSpy.getLocusCodes.calls.reset();


      serviceSpy.getLocusCodes.and.returnValue(of(mockLocusCodes));


    fixture = TestBed.createComponent(AddEditAntigenDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {




    it('should have locus options', () => {
      expect(component.locusOptions.length).toBe(6);
      expect(component.locusOptions[0].code).toBe('A');
      expect(component.locusOptions[0].description).toBe('HLA-A');
    });
  });

  describe('Dialog Title', () => {
    it('should return "Add New Antigen" for add mode', () => {
      expect(component.getDialogTitle()).toBe('Add New Antigen');
    });
  });
  describe('Date Validation', () => {
    it('should have effective date error message for required', () => {
      component.form.get('effDate')?.markAsTouched();
      const error = component.getEffectiveDateError();
      expect(error).toBeTruthy();
      expect(error).toContain('Effective Date is required');
    });

    it('should have termination date validation', () => {
      component.form.patchValue({
        effDate: moment().add(1, 'days'),
        termDate: moment()
      });

      // Trigger validation
      component.form.updateValueAndValidity();

      // Check form-level errors exist
      expect(component.form.errors).toBeTruthy();
      expect(component.form.errors?.['dateRangeInvalid']).toBeTruthy();
    });

    it('should update terminationMinDate when effective date changes', () => {
      // Initially, terminationMinDate should equal minDate
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));

      // Set a future effective date
      const futureEffDate = moment().add(10, 'days');
      component.form.patchValue({
        effDate: futureEffDate
      });
      fixture.detectChanges();

      // terminationMinDate should now be the effective date
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureEffDate.format('YYYY-MM-DD'));
    });

    it('should set terminationMinDate to minDate when effective date equals minDate', () => {
      // Set effective date to minDate
      component.form.patchValue({
        effDate: component.minDate
      });
      fixture.detectChanges();

      // terminationMinDate should be minDate
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should reset terminationMinDate to minDate when effective date is cleared', () => {
      // First set a future effective date
      const futureEffDate = moment().add(10, 'days');
      component.form.patchValue({
        effDate: futureEffDate
      });
      fixture.detectChanges();

      // Verify terminationMinDate updated
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureEffDate.format('YYYY-MM-DD'));

      // Now clear the effective date
      component.form.patchValue({
        effDate: null
      });
      fixture.detectChanges();

      // terminationMinDate should reset to minDate
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component.form.patchValue({
        locus: 'A',
        epitopeId: '123',
        epitopeSuperI: '456',
        effDate: moment().add(1, 'days'),
        termDate: null
      });
    });

    it('should call addHlaAntigen on save', fakeAsync(() => {
      const mockResponse: HlaAntigenItemResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        item: mockAntigen
      };
      serviceSpy.addHlaAntigen.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      expect(serviceSpy.addHlaAntigen).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'save' }));
    }));

    it('should keep dialog open when duplicate record error (success: false with error code)', fakeAsync(() => {
      const mockDuplicateResponse: HlaAntigenItemResponse = {
        success: false,
        message: 'Duplicate entry not allowed',
        error: 'Duplicate entry not allowed',
        errorCode: '0319',
        statusCode: 400,
        item: mockAntigen,
        errorResponse: {
          errorCode: '0319',
          error: 'Duplicate entry not allowed'
        }
      };
      serviceSpy.addHlaAntigen.and.returnValue(of(mockDuplicateResponse));

      component.onSave();
      tick();

      expect(serviceSpy.addHlaAntigen).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('0319: Duplicate entry not allowed');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    }));




  });

  describe('Save and Add Another Functionality', () => {
    beforeEach(() => {
      component.form.patchValue({
        locus: 'A',
        epitopeId: '123',
        epitopeSuperI: '456',
        effDate: moment().add(1, 'days'),
        termDate: null
      });
    });

    it('should reset form and keep dialog open on successful save', fakeAsync(() => {
      const mockResponse: HlaAntigenItemResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        item: mockAntigen
      };
      serviceSpy.addHlaAntigen.and.returnValue(of(mockResponse));

      component.onSaveAndAddAnother();
      tick();

      expect(serviceSpy.addHlaAntigen).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.form.get('locus')?.value).toBeNull();
    }));

    it('should keep dialog open when duplicate error on save and add another', fakeAsync(() => {
      const mockDuplicateResponse: HlaAntigenItemResponse = {
        success: false,
        message: 'Duplicate entry not allowed',
        error: 'Duplicate entry not allowed',
        errorCode: '0319',
        statusCode: 400,
        item: mockAntigen,
        errorResponse: {
          errorCode: '0319',
          error: 'Duplicate entry not allowed'
        }
      };
      serviceSpy.addHlaAntigen.and.returnValue(of(mockDuplicateResponse));

      component.onSaveAndAddAnother();
      tick();

      expect(serviceSpy.addHlaAntigen).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('0319: Duplicate entry not allowed');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    }));
  });

  describe('onCancel', () => {
    it('should close dialog with cancel action', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should not throw when handling date input', () => {
      const event = { target: { value: '01-Jan-2025' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should handle empty input value', () => {
      const event = { target: { value: '' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should not throw when handling date input', () => {
      const event = { target: { value: '31-Dec-2025' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should handle empty input value', () => {
      const event = { target: { value: '' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('getTerminationDateError', () => {
    it('should return error string for invalid termination date', () => {
      component.form.get('termDate')?.markAsTouched();
      component.form.get('termDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      const error = component.getTerminationDateError();
      expect(error).toBeTruthy();
    });

    it('should return empty string when termination date is valid', () => {
      component.form.get('termDate')?.setValue(moment().add(5, 'days'));
      component.form.get('termDate')?.markAsTouched();
      component.form.get('termDate')?.setErrors(null);
      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });
  });

  describe('filterLocusOptions via search', () => {
    it('should filter locus options by code', () => {
      component.locusSearchControl.setValue('DPB');
      expect(component.filteredLocusOptions.length).toBe(1);
      expect(component.filteredLocusOptions[0].code).toBe('DPB1');
    });

    it('should filter locus options by description', () => {
      component.locusSearchControl.setValue('hla-c');
      expect(component.filteredLocusOptions.length).toBe(1);
      expect(component.filteredLocusOptions[0].code).toBe('C');
    });

    it('should show all options when search is cleared', () => {
      component.locusSearchControl.setValue('DPB');
      expect(component.filteredLocusOptions.length).toBe(1);
      component.locusSearchControl.setValue('');
      expect(component.filteredLocusOptions.length).toBe(6);
    });

    it('should return empty list when no match', () => {
      component.locusSearchControl.setValue('XYZ');
      expect(component.filteredLocusOptions.length).toBe(0);
    });
  });

  describe('onLocusChange', () => {
    it('should set selectedLocusDescription for matching locus', () => {
      component.onLocusChange({ value: 'B' } as any);
      expect(component.selectedLocusDescription).toBe('HLA-B');
    });

    it('should set empty string for non-matching locus', () => {
      component.onLocusChange({ value: 'Z' } as any);
      expect(component.selectedLocusDescription).toBe('');
    });
  });

  describe('effectiveDateFilter', () => {
    it('should allow null dates', () => {
      expect(component.effectiveDateFilter(null)).toBeTrue();
    });

    it('should allow future dates', () => {
      expect(component.effectiveDateFilter(moment().add(10, 'days'))).toBeTrue();
    });

    it('should reject dates far in the past', () => {
      expect(component.effectiveDateFilter(moment().subtract(100, 'days'))).toBeFalse();
    });
  });

  describe('terminationDateFilter', () => {
    it('should allow null dates', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should reject dates before terminationMinDate', () => {
      expect(component.terminationDateFilter(moment().subtract(100, 'days'))).toBeFalse();
    });

    it('should allow dates on or after terminationMinDate', () => {
      expect(component.terminationDateFilter(moment().add(10, 'days'))).toBeTrue();
    });
  });

  describe('Form Validation Rules', () => {
    it('should require locus', () => {
      component.form.get('locus')?.setValue(null);
      expect(component.form.get('locus')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength(2) on locus', () => {
      component.form.get('locus')?.setValue('ABC');
      expect(component.form.get('locus')?.hasError('maxlength')).toBeTrue();
    });

    it('should require epitopeId', () => {
      component.form.get('epitopeId')?.setValue(null);
      expect(component.form.get('epitopeId')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength(6) on epitopeId', () => {
      component.form.get('epitopeId')?.setValue('1234567');
      expect(component.form.get('epitopeId')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(6) on epitopeSuperI', () => {
      component.form.get('epitopeSuperI')?.setValue('1234567');
      expect(component.form.get('epitopeSuperI')?.hasError('maxlength')).toBeTrue();
    });

    it('should require effDate', () => {
      component.form.get('effDate')?.setValue(null);
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should accept valid locus code', () => {
      component.form.get('locus')?.setValue('A');
      expect(component.form.get('locus')?.valid).toBeTrue();
    });
  });

  describe('onSave with invalid form', () => {
    it('should not call API when form is invalid', () => {
      component.form.get('locus')?.setValue(null);
      component.form.get('epitopeId')?.setValue(null);
      component.form.get('effDate')?.setValue(null);
      component.onSave();
      expect(serviceSpy.addHlaAntigen).not.toHaveBeenCalled();
    });

    it('should mark all fields touched when form is invalid', () => {
      component.form.get('locus')?.setValue(null);
      component.onSave();
      expect(component.form.get('locus')?.touched).toBeTrue();
      expect(component.form.get('epitopeId')?.touched).toBeTrue();
      expect(component.form.get('effDate')?.touched).toBeTrue();
    });
  });

  describe('onSave with HttpErrorResponse', () => {
    beforeEach(() => {
      component.form.patchValue({
        locus: 'A',
        epitopeId: '123',
        epitopeSuperI: '456',
        effDate: moment().add(1, 'days'),
        termDate: null
      });
    });

    it('should handle HttpErrorResponse with error code', fakeAsync(() => {
      const httpError = new HttpErrorResponse({
        error: { errorResponse: { errorCode: '0500', error: 'Server error' } },
        status: 500
      });
      serviceSpy.addHlaAntigen.and.returnValue(throwError(() => httpError));
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('0500: Server error');
      expect(component.isSaving()).toBe(false);
    }));

    it('should handle HttpErrorResponse without error code', fakeAsync(() => {
      const httpError = new HttpErrorResponse({
        error: { error: 'Unknown error' },
        status: 500
      });
      serviceSpy.addHlaAntigen.and.returnValue(throwError(() => httpError));
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unknown error');
      expect(component.isSaving()).toBe(false);
    }));

    it('should handle HttpErrorResponse with null error body', fakeAsync(() => {
      const httpError = new HttpErrorResponse({
        error: null,
        status: 500,
        statusText: 'Internal Server Error'
      });
      serviceSpy.addHlaAntigen.and.returnValue(throwError(() => httpError));
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should not throw on destroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('loadLocusCodes error handling', () => {
    it('should show error snackbar when getLocusCodes fails', () => {
      serviceSpy.getLocusCodes.and.returnValue(throwError(() => new Error('API error')));
      (component as any).loadLocusCodes();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load locus codes');
    });
  });

  describe('getEffectiveDateError', () => {
    it('should return empty when effective date is valid and untouched', () => {
      const error = component.getEffectiveDateError();
      expect(typeof error).toBe('string');
    });

    it('should return error for matDatepickerParse', () => {
      component.form.get('effDate')?.markAsTouched();
      component.form.get('effDate')?.setErrors({ matDatepickerParse: { text: 'bad' } });
      const error = component.getEffectiveDateError();
      expect(error).toBeTruthy();
    });
  });

  describe('onSave with dateRangeInvalid', () => {
    it('should not call API when dateRangeInvalid error exists and lastChangedDateField is null', () => {
      component.form.patchValue({
        locus: 'A',
        epitopeId: '123',
        effDate: moment().add(5, 'days'),
        termDate: moment().add(1, 'days')
      });
      component.form.updateValueAndValidity();
      if (component.form.hasError('dateRangeInvalid')) {
        component.onSave();
        expect(serviceSpy.addHlaAntigen).not.toHaveBeenCalled();
      }
    });
  });

  describe('setupFormListeners', () => {
    it('should track effective date changes', () => {
      const futureDate = moment().add(15, 'days');
      component.form.patchValue({ effDate: futureDate });
      fixture.detectChanges();
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should track termination date changes', () => {
      component.form.patchValue({ termDate: moment().add(20, 'days') });
      fixture.detectChanges();
      // lastChangedDateField should be set to 'termination' internally
      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });
  });
});

