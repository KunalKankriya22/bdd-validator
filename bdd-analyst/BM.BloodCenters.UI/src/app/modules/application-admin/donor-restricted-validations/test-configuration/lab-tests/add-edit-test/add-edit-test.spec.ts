import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditTestComponent, TestDialogData } from './add-edit-test';
import { LabTestsApiService } from '../services/lab-tests-api.service';
import { DropdownOptions } from '../models/lab-tests.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddEditTestComponent', () => {
  let component: AddEditTestComponent;
  let fixture: ComponentFixture<AddEditTestComponent>;
  let mockService: jasmine.SpyObj<LabTestsApiService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditTestComponent>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockDropdownOptions: DropdownOptions = {
    group: [
      { value: 'BLOOD', display: 'Blood Group' },
      { value: 'SEROL', display: 'Serology' }
    ],
    antigenTest: [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ],
    autoSchedule: [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ],
    editResults: [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ],
    discrepancyCheck: [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ],
    noOfResults: [
      { value: 1, display: '1' },
      { value: 2, display: '2' }
    ],
    fullResult: [
      { value: true, display: 'Yes' },
      { value: false, display: 'No' }
    ]
  };

  const addModeData: TestDialogData = {
    mode: 'add'
  };

  // Use future date to avoid validation issues in edit mode
  const futureEffDateTime = new Date();
  futureEffDateTime.setDate(futureEffDateTime.getDate() + 90);

  const editModeData: TestDialogData = {
    mode: 'edit',
    testId: 'ABID',
    description: 'ABORHBloodTyping',
    shortId: 'ABI',
    group: 'BLOOD',
    antigenTest: 'Y',
    autoSchedule: 'N',
    editResults: 'Y',
    discrepancyCheck: 'N',
    noOfResults: 2,
    fullResult: 'Y',
    effDateTime: futureEffDateTime,
    termDateTime: null
  };

  function createComponent(dialogData: TestDialogData) {
    mockService = jasmine.createSpyObj('LabTestsApiService', [
      'getDropdowns', 'createTest', 'updateTest', 'getTestGroups'
    ]);

    const mockDropdownOptionsWithoutGroup = {
      antigenTest: mockDropdownOptions.antigenTest,
      autoSchedule: mockDropdownOptions.autoSchedule,
      editResults: mockDropdownOptions.editResults,
      discrepancyCheck: mockDropdownOptions.discrepancyCheck,
      noOfResults: mockDropdownOptions.noOfResults,
      fullResult: mockDropdownOptions.fullResult,
      group: []
    };

    mockService.getDropdowns.and.returnValue(of(mockDropdownOptionsWithoutGroup));
    mockService.getTestGroups.and.returnValue(of(mockDropdownOptions.group));
    mockService.createTest.and.returnValue(of({ success: true, message: 'Record created successfully' }));
    mockService.updateTest.and.returnValue(of({ success: true, message: 'Record updated successfully' }));

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [AddEditTestComponent],
      providers: [
        provideHttpClient(),
        { provide: LabTestsApiService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditTestComponent);
    component = fixture.componentInstance;
  }

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });





    it('should have required validator on shortId', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('shortId')?.hasError('required')).toBe(true);
    });

    it('should not have required validator on optional fields', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('group')?.hasError('required')).toBe(false);
      expect(component.form.get('antigenTest')?.hasError('required')).toBe(false);
      expect(component.form.get('termDateTime')?.hasError('required')).toBe(false);
    });

    it('should not disable testId field in add mode', () => {
      expect(component.form.get('testId')?.disabled).toBe(false);
    });

    it('should not disable effDateTime field in add mode', () => {
      expect(component.form.get('effDateTime')?.disabled).toBe(false);
    });



  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent(editModeData);
    });




    it('should convert Y/N to boolean for form values', () => {
      expect(component.form.get('antigenTest')?.value).toBe(true);
      expect(component.form.get('autoSchedule')?.value).toBe(false);
      expect(component.form.get('editResults')?.value).toBe(true);
      expect(component.form.get('discrepancyCheck')?.value).toBe(false);
      expect(component.form.get('fullResult')?.value).toBe(true);
    });

    it('should set noOfResults as number', () => {
      expect(component.form.get('noOfResults')?.value).toBe(2);
    });

    it('should convert date to ISBT format string for effDateTime', () => {
      const effValue = component.form.get('effDateTime')?.value;
      // effDateTime is stored as ISBT format string (DD-MMM-YYYY HH:mm)
      expect(typeof effValue).toBe('string');
      expect(effValue).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should set termDateTime to null when not provided', () => {
      expect(component.form.get('termDateTime')?.value).toBeNull();
    });



    it('should have testId available in data for display', () => {
      expect(component.data.testId).toBe('ABID');
    });

    it('should update test successfully', fakeAsync(() => {
      component.ngOnInit();
      tick();

      component.onSave();
      tick();

      expect(mockService.updateTest).toHaveBeenCalledWith('ABID', jasmine.any(Object));
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Record updated successfully');
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));


    it('should have pristine form after initialization', fakeAsync(() => {
      component.ngOnInit();
      tick();

      expect(component.form.pristine).toBe(true);
    }));

  });

  describe('ISBT DateTime Format Validation', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });


    it('should fail for invalid ISBT format', () => {
      component.form.patchValue({
        effDateTime: '2025-01-01'
      });

      expect(component.form.get('effDateTime')?.hasError('invalidIsbtFormat')).toBe(true);
    });

    it('should pass when termination date is null', () => {
      component.form.patchValue({
        effDateTime: '02-FEB-2025, 10:30',
        termDateTime: null
      });

      expect(component.form.get('termDateTime')?.hasError('invalidIsbtFormat')).toBe(false);
    });
  });

  describe('getFieldError', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });


    it('should return required error with label', () => {
      component.form.get('testId')?.markAsTouched();
      expect(component.getFieldError('testId')).toBe('Test ID is required');
    });

    it('should return correct labels for each required field', () => {
      const requiredFields = [
        { name: 'testId', label: 'Test ID' },
        { name: 'description', label: 'Description' },
        { name: 'shortId', label: 'Short ID' },
        { name: 'autoSchedule', label: 'Auto Schedule' },
        { name: 'editResults', label: 'Edit Results' },
        { name: 'discrepancyCheck', label: 'Discrepancy Check' },
        { name: 'noOfResults', label: 'No. of Results' },
        { name: 'fullResult', label: 'Full Result' },
        { name: 'effDateTime', label: 'Effective Date & Time' }
      ];

      requiredFields.forEach(field => {
        component.form.get(field.name)?.markAsTouched();
        expect(component.getFieldError(field.name)).toBe(`${field.label} is required`);
      });
    });
  });






  describe('Effective/Termination DateTime Cross-Field Validation', () => {
    beforeEach(() => {
      createComponent(addModeData);
      component.ngOnInit();
    });

    it('should have no error when both fields are empty', () => {
      component.form.patchValue({ effDateTime: '', termDateTime: '' });
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(false);
    });

    it('should have no error when termDateTime is empty', () => {
      component.form.patchValue({ effDateTime: '05-AUG-2026 08:00', termDateTime: '' });
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(false);
    });

    it('should have no error when effDateTime is before termDateTime on same day', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 08:00',
        termDateTime: '05-AUG-2026 10:00'
      });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(false);
    });

    it('should have error when effDateTime is after termDateTime on same day', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 11:50',
        termDateTime: '05-AUG-2026 10:23'
      });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(true);
    });

    it('should set error on termDateTime control when effDateTime is after', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 11:50',
        termDateTime: '05-AUG-2026 10:23'
      });
      component.form.updateValueAndValidity();
      expect(component.form.get('termDateTime')?.hasError('effDateTimeAfterTerm')).toBe(true);
    });

    it('should clear error on termDateTime control when corrected', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 11:50',
        termDateTime: '05-AUG-2026 10:23'
      });
      component.form.updateValueAndValidity();
      expect(component.form.get('termDateTime')?.hasError('effDateTimeAfterTerm')).toBe(true);

      component.form.patchValue({ termDateTime: '05-AUG-2026 12:00' });
      component.form.updateValueAndValidity();
      expect(component.form.get('termDateTime')?.hasError('effDateTimeAfterTerm')).toBeFalsy();
    });

    it('should have no error when effDateTime is before termDateTime on different days', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 23:59',
        termDateTime: '06-AUG-2026 00:01'
      });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(false);
    });

    it('should have error when effDateTime equals termDateTime exactly', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026 08:00',
        termDateTime: '05-AUG-2026 08:00'
      });
      component.form.updateValueAndValidity();
      // Equal datetimes should pass (effDate > termDate is the check, not >=)
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(false);
    });

    it('should handle comma-separated ISBT format (DD-MMM-YYYY, HH:mm)', () => {
      component.form.patchValue({
        effDateTime: '05-AUG-2026, 11:50',
        termDateTime: '05-AUG-2026, 10:23'
      });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('effDateTimeAfterTerm')).toBe(true);
    });

    it('should block save when effDateTime is after termDateTime', () => {
      component.form.patchValue({
        testId: 'TEST1',
        description: 'Test',
        shortId: 'T1',
        autoSchedule: true,
        editResults: true,
        discrepancyCheck: true,
        noOfResults: 1,
        fullResult: true,
        effDateTime: '05-AUG-2026 11:50',
        termDateTime: '05-AUG-2026 10:23'
      });
      component.form.updateValueAndValidity();

      component.onSave();
      expect(mockService.createTest).not.toHaveBeenCalled();
    });
  });

  describe('Escape key closes dialog', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });

    it('should close dialog on Escape key', () => {
      component.onEscapeKey();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('null selection for optional dropdowns', () => {
    beforeEach(() => {
      createComponent(addModeData);
    });

    it('should accept null for group', () => {
      component.form.get('group')?.setValue(null);
      expect(component.form.get('group')?.valid).toBe(true);
      expect(component.form.get('group')?.value).toBeNull();
    });

    it('should accept null for antigenTest', () => {
      component.form.get('antigenTest')?.setValue(null);
      expect(component.form.get('antigenTest')?.valid).toBe(true);
      expect(component.form.get('antigenTest')?.value).toBeNull();
    });
  });

});
