import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { SimpleChange } from '@angular/core';
import { AddEditRecoveredPlasmaTest } from './add-edit-recovered-plasma-test';
import { RecoveredPlasmaTestService } from '../services/recovered-plasma-test.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { RecoveredPlasmaTestModel, LookupItem } from '../models/recovered-plasma-test.model';

describe('AddEditRecoveredPlasmaTest', () => {
  let component: AddEditRecoveredPlasmaTest;
  let fixture: ComponentFixture<AddEditRecoveredPlasmaTest>;
  let mockService: jasmine.SpyObj<RecoveredPlasmaTestService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let snackBarSpy: jasmine.Spy;

  const mockLookupItems: LookupItem[] = [
    { code: 'T001', description: 'Test One' },
    { code: 'T002', description: 'Test Two' },
    { code: 'T003', description: null }
  ];

  const mockEditData: RecoveredPlasmaTestModel = {
    testId: 'T001',
    effDate: moment().add(5, 'days').toISOString(),
    termDate: moment().add(30, 'days').toISOString(),
    insertDate: '2024-06-15T10:00:00Z',
    insertUser: 'testuser',
    auditKey: 1
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RecoveredPlasmaTestService', [
      'getTestIdLookups',
      'createRecord',
      'updateRecord'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');
    mockService.getTestIdLookups.and.returnValue(of([]));



      TestBed.configureTestingModule({
imports: [
        AddEditRecoveredPlasmaTest,
        ReactiveFormsModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RecoveredPlasmaTestService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });


    });



  beforeEach(() => {


      mockService.getTestIdLookups.and.returnValue(of([]));


    fixture = TestBed.createComponent(AddEditRecoveredPlasmaTest);
    component = fixture.componentInstance;

    // Spy on the actual injected snackBar instance from the component
    snackBarSpy = spyOn((component as any).snackBar, 'open');

    });

  // ─── Component Creation ────────────────────────────────────────────

  describe('Component Creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should initialize form with required validators', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('testId')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should initialize isSaving to false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize savingAction to null', () => {
      expect(component.savingAction).toBeNull();
    });

    it('should initialize isLoadingOptions to false', () => {
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should initialize empty testIdOptions and filteredTestIdOptions', () => {
      expect(component.testIdOptions).toEqual([]);
      expect(component.filteredTestIdOptions).toEqual([]);
    });
  });

  // ─── ngOnInit ──────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set panelTitle for add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Test ID');
    });

    it('should set lastModified to empty in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.lastModified).toBe('');
    });

    it('should call getTestIdLookups on init', () => {
      fixture.detectChanges();
      expect(mockService.getTestIdLookups).toHaveBeenCalled();
    });
  });

  // ─── Load Dropdown Options ─────────────────────────────────────────

  describe('Load Dropdown Options', () => {
    it('should load test ID lookups and map to options', () => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      expect(component.testIdOptions.length).toBe(3);
      expect(component.testIdOptions[0]).toEqual({
        value: 'T001',
        display: 'T001 - Test One'
      });
      expect(component.filteredTestIdOptions.length).toBe(3);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle lookup item with null description', () => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      const nullDescOption = component.testIdOptions[2];
      expect(nullDescOption.display).toBe('T003');
    });

    it('should handle error loading test ID lookups', () => {
      mockService.getTestIdLookups.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.isLoadingOptions).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load Test ID options. Please refresh and try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should re-apply testId in edit mode after options load', () => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookupItems));
      component.mode = 'edit';
      component.data = { ...mockEditData };

      fixture.detectChanges();

      expect(component.form.getRawValue().testId).toBe('T001');
    });

    it('should not re-apply testId in add mode after options load', () => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookupItems));
      component.mode = 'add';
      component.data = null;

      fixture.detectChanges();

      expect(component.form.getRawValue().testId).toBe('');
    });
  });

  // ─── Form Validation ──────────────────────────────────────────────

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require testId field', () => {
      const control = component.form.get('testId');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('T001');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require effDate field', () => {
      const control = component.form.get('effDate');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue(moment());
      expect(control?.hasError('required')).toBeFalsy();
    });


    it('should allow termination date on or after effective date', () => {
      component.form.patchValue({
        effDate: moment('2024-01-01'),
        termDate: moment('2024-06-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });

    it('should not require termDate field', () => {
      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      expect(component.form.valid).toBeTruthy();
    });

    it('should validate form is valid with all required fields', () => {
      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      expect(component.form.valid).toBeTruthy();
      expect(component.isFormValid).toBeTruthy();
    });

    it('should be invalid when required fields are empty', () => {
      expect(component.form.valid).toBeFalsy();
      expect(component.isFormValid).toBeFalsy();
    });
  });

  // ─── Control Accessors ────────────────────────────────────────────

  describe('Control Accessors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return testId control', () => {
      expect(component.testIdControl).toBe(component.form.get('testId'));
    });

    it('should return effDate control', () => {
      expect(component.effDateControl).toBe(component.form.get('effDate'));
    });

    it('should return termDate control', () => {
      expect(component.termDateControl).toBe(component.form.get('termDate'));
    });
  });

  // ─── isSaveEnabled ────────────────────────────────────────────────

  describe('isSaveEnabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true in add mode when form is valid', () => {
      component.mode = 'add';
      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });
      expect(component.isSaveEnabled).toBe(true);
    });

    it('should return false in add mode when form is invalid', () => {
      component.mode = 'add';
      expect(component.isSaveEnabled).toBe(false);
    });

    it('should return false in edit mode when form is valid but not dirty', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      (component as any).populateFormForEdit();
      expect(component.isSaveEnabled).toBe(false);
    });

    it('should return true in edit mode when form is valid and dirty', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      (component as any).populateFormForEdit();
      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();
      expect(component.isSaveEnabled).toBe(true);
    });
  });

  // ─── onCancel ─────────────────────────────────────────────────────

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ─── onSave - Add Mode ────────────────────────────────────────────

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call createRecord when form is invalid', () => {
      component.onSave();
      expect(mockService.createRecord).not.toHaveBeenCalled();
    });

    it('should mark form as touched when saving with invalid form', () => {
      component.onSave();
      expect(component.form.get('testId')?.touched).toBe(true);
      expect(component.form.get('effDate')?.touched).toBe(true);
    });

    it('should call createRecord with correct payload on valid form', () => {
      mockService.createRecord.and.returnValue(of({ success: true, message: 'Created' }));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalledWith(jasmine.objectContaining({
        testId: 'T001',
        loggedInUserName: 'testuser'
      }));
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should set isSaving and savingAction during save', () => {
      const saveSubject = new Subject<any>();
      mockService.createRecord.and.returnValue(saveSubject.asObservable());

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();
      expect(component.isSaving).toBe(true);
      expect(component.savingAction).toBe('save');

      saveSubject.next({ success: true, message: 'OK' });
      saveSubject.complete();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should show success snackbar with response message on save', () => {
      mockService.createRecord.and.returnValue(of({ success: true, message: 'Custom success message' }));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom success message',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'], duration: 3000 })
      );
    });

    it('should show default add message when response has no message', () => {
      mockService.createRecord.and.returnValue(of({}));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Plasma test added successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call createRecord and handle error response', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Already exists' } }))
      );

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should show error snackbar with error message on save failure', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate entry' } }))
      );

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Duplicate entry',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'], duration: 5000 })
      );
    });

    it('should show default error message when error has no message', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should trim whitespace from testId in add payload', () => {
      mockService.createRecord.and.returnValue(of({ success: true }));

      component.form.patchValue({
        testId: '  T001  ',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalledWith(jasmine.objectContaining({
        testId: 'T001'
      }));
    });
  });

  // ─── onSave - Edit Mode ───────────────────────────────────────────

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      fixture.detectChanges();
    });

    it('should call updateRecord on valid form in edit mode', () => {
      mockService.updateRecord.and.returnValue(of({ success: true, message: 'Updated' }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.updateRecord).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar on update success', () => {
      mockService.updateRecord.and.returnValue(of({ success: true, message: 'Update OK' }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Update OK',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should use default message when update response has no message', () => {
      mockService.updateRecord.and.returnValue(of({}));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Plasma test updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle update error', () => {
      mockService.updateRecord.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSave();

      expect(component.isSaving).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Update failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should call updateRecord and handle error response', () => {
      mockService.updateRecord.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );

      // In edit mode, testId is disabled. effDate is required and set from data.
      if (!component.form.get('effDate')?.value) {
        component.form.get('effDate')?.setValue(moment());
      }

      component.onSave();

      expect(mockService.updateRecord).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should set isSaving and savingAction to save during update', () => {
      const updateSubject = new Subject<any>();
      mockService.updateRecord.and.returnValue(updateSubject.asObservable());

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSave();
      expect(component.isSaving).toBe(true);
      expect(component.savingAction).toBe('save');

      updateSubject.next({ success: true });
      updateSubject.complete();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should disable testId and effDate fields in edit mode', () => {
      expect(component.form.get('testId')?.disabled).toBe(true);
      expect(component.form.get('effDate')?.disabled).toBe(true);
    });

    it('should set panelTitle for edit mode', () => {
      expect(component.panelTitle).toBe('Edit Test ID');
    });

    it('should set lastModified from insertDate', () => {
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should populate editModeValues from data', () => {
      expect(component.editModeValues.testId).toBe('T001');
      expect(component.editModeValues.effectiveDate).toBeTruthy();
    });
  });

  // ─── onSaveAndCreateAnother - Add Mode ────────────────────────────

  describe('onSaveAndCreateAnother - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call createRecord when form is invalid', () => {
      component.onSaveAndCreateAnother();
      expect(mockService.createRecord).not.toHaveBeenCalled();
    });

    it('should call createRecord and reset form on success', () => {
      mockService.createRecord.and.returnValue(of({ success: true, message: 'Created' }));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockService.createRecord).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      // Form should be reset for add mode
      expect(component.form.get('testId')?.value).toBeFalsy();
    });

    it('should set isSaving and savingAction to saveAndCreate', () => {
      const subject = new Subject<any>();
      mockService.createRecord.and.returnValue(subject.asObservable());

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();
      expect(component.isSaving).toBe(true);
      expect(component.savingAction).toBe('saveAndCreate');

      subject.next({ success: true });
      subject.complete();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should show default message when response has no message', () => {
      mockService.createRecord.and.returnValue(of({}));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Operation completed successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle error on save and create another', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ error: { message: 'Error occurred' } }))
      );

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();

      expect(component.isSaving).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error occurred',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when error has no message', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should re-enable testId field after reset for add mode', () => {
      mockService.createRecord.and.returnValue(of({ success: true }));

      component.form.patchValue({
        testId: 'T001',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();

      expect(component.form.get('testId')?.enabled).toBe(true);
    });
  });

  // ─── onSaveAndCreateAnother - Edit Mode ───────────────────────────

  describe('onSaveAndCreateAnother - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      fixture.detectChanges();
    });

    it('should call updateRecord and switch to add mode on success', () => {
      mockService.updateRecord.and.returnValue(of({ success: true, message: 'Updated' }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockService.updateRecord).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    });

    it('should handle update error on save and create another', () => {
      mockService.updateRecord.and.returnValue(
        throwError(() => ({ error: { message: 'Update error' } }))
      );

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(component.isSaving).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Update error',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default message on update success without message', () => {
      mockService.updateRecord.and.returnValue(of({}));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Operation completed successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should reset panelTitle to add mode title after switching', () => {
      mockService.updateRecord.and.returnValue(of({ success: true }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(component.panelTitle).toBe('Add New Test ID');
    });
  });

  // ─── Error Messages ───────────────────────────────────────────────

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return test ID error when touched and empty', () => {
      component.form.get('testId')?.markAsTouched();
      expect(component.getTestIdError()).toBe('Test ID is required');
    });

    it('should return empty string for testId when not touched', () => {
      expect(component.getTestIdError()).toBe('');
    });

    it('should return empty string for testId when valid', () => {
      component.form.get('testId')?.setValue('T001');
      component.form.get('testId')?.markAsTouched();
      expect(component.getTestIdError()).toBe('');
    });
  });

  // ─── Termination Min Date ─────────────────────────────────────────

  describe('Termination Min Date', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should default terminationMinDate to minDate', () => {
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should update terminationMinDate when effDate is set to a future date', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);

      expect(moment(component.terminationMinDate).isSame(futureDate, 'day')).toBeTrue();
    });

    it('should reset terminationMinDate to minDate when effDate is cleared', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('effDate')?.setValue(null);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should set terminationMinDate from effective date in edit mode', () => {
      const futureEffDate = moment().add(5, 'days').toISOString();
      component.mode = 'edit';
      component.data = {
        testId: 'T001',
        effDate: futureEffDate,
        termDate: null
      };
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
        data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false }
      });

      const expectedDate = moment(moment.utc(futureEffDate).format('YYYY-MM-DD'));
      expect(moment(component.terminationMinDate).isSame(expectedDate, 'day')).toBeTrue();
    });
  });

  // ─── ngOnChanges ──────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should skip setup on first change', () => {
      const initialTitle = component.panelTitle;
      component.ngOnChanges({
        mode: { currentValue: 'add', previousValue: undefined, firstChange: true, isFirstChange: () => true }
      });
      expect(component.panelTitle).toBe(initialTitle);
    });

    it('should call setupPanel when mode changes (not first change)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false }
      });
      expect(component.panelTitle).toBe('Edit Test ID');
    });

    it('should reset form when switching to add mode', () => {
      // First go to edit mode
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false }
      });

      // Now switch back to add mode
      component.mode = 'add';
      component.ngOnChanges({
        mode: { currentValue: 'add', previousValue: 'edit', firstChange: false, isFirstChange: () => false }
      });

      expect(component.panelTitle).toBe('Add New Test ID');
      expect(component.form.get('testId')?.enabled).toBe(true);
    });

    it('should handle data change (not first change)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, testId: 'T999' };
      component.ngOnChanges({
        data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      expect(component.editModeValues.testId).toBe('T999');
    });

    it('should not resetFormForAddMode in edit mode on non-first change', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false }
      });
      expect(component.form.get('testId')?.disabled).toBe(true);
    });
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ─── Edit Mode Panel Setup ────────────────────────────────────────

  describe('Edit Mode Panel Setup', () => {
    it('should set lastModified when insertDate is present', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, insertDate: '2024-06-15T10:00:00Z' };
      fixture.detectChanges();

      expect(component.lastModified).toContain('Last Modified:');
      expect(component.lastModified.length).toBeGreaterThan(0);
    });

    it('should set empty lastModified when insertDate is null', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, insertDate: null };
      fixture.detectChanges();

      expect(component.lastModified).toBe('');
    });

    it('should populate effDate from data in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      fixture.detectChanges();

      const effDateValue = component.form.getRawValue().effDate;
      expect(effDateValue).toBeTruthy();
    });

    it('should populate termDate from data in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      fixture.detectChanges();

      const termDateValue = component.form.getRawValue().termDate;
      expect(termDateValue).toBeTruthy();
    });

    it('should handle null effDate in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, effDate: null };
      fixture.detectChanges();

      const effDateValue = component.form.getRawValue().effDate;
      expect(effDateValue).toBeNull();
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should handle null termDate in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, termDate: null };
      fixture.detectChanges();

      const termDateValue = component.form.getRawValue().termDate;
      expect(termDateValue).toBeNull();
    });

    it('should handle empty string data fields gracefully', () => {
      component.mode = 'edit';
      component.data = {
        testId: '',
        effDate: null,
        termDate: null
      };
      fixture.detectChanges();

      expect(component.editModeValues.testId).toBe('');
    });
  });

  // ─── Form Subscriptions ───────────────────────────────────────────

  describe('Form Subscriptions', () => {
    it('should track lastChangedDateField as effective when effDate changes', () => {
      fixture.detectChanges();
      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should track lastChangedDateField as termination when termDate changes', () => {
      fixture.detectChanges();
      component.form.get('termDate')?.setValue(moment().add(30, 'days'));
      expect((component as any).lastChangedDateField).toBe('termination');
    });
  });

  // ─── getEffDateError and getTermDateError ─────────────────────────

  describe('getEffDateError and getTermDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return a string for effDate error when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.get('effDate')?.markAsTouched();
      const error = component.getEffDateError();
      expect(typeof error).toBe('string');
    });

    it('should return a string for termDate error when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.get('termDate')?.markAsTouched();
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass form errors to getEffDateError when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      const error = component.getEffDateError();
      expect(typeof error).toBe('string');
    });

    it('should pass form errors to getTermDateError when lastChangedDateField is termination', () => {
      (component as any).lastChangedDateField = 'termination';
      const error = component.getTermDateError();
      expect(typeof error).toBe('string');
    });
  });

  // ─── Date Input Handlers ──────────────────────────────────────────

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle effective date input with empty value by setting required error', () => {
      const effControl = component.form.get('effDate');
      const event = { target: { value: '' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(effControl?.touched).toBe(true);
      expect(effControl?.hasError('required')).toBe(true);
    });

    it('should handle effective date input with valid text by marking touched and dirty', () => {
      const effControl = component.form.get('effDate');
      effControl?.setValue(moment().add(1, 'day'));

      const event = { target: { value: '01-Jan-2027' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      expect(effControl?.touched).toBe(true);
      expect(effControl?.dirty).toBe(true);
    });

    it('should handle termination date input with empty value in add mode', () => {
      component.mode = 'add';
      const termControl = component.form.get('termDate');

      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(termControl?.value).toBeNull();
    });

    it('should handle termination date input with empty value in edit mode by marking dirty', () => {
      component.mode = 'edit';
      const termControl = component.form.get('termDate');
      termControl?.setValue(moment().add(30, 'days'));

      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(termControl?.value).toBeNull();
      expect(termControl?.dirty).toBe(true);
    });

    it('should handle termination date input with valid text by marking touched and dirty', () => {
      const termControl = component.form.get('termDate');
      termControl?.setValue(moment().add(30, 'days'));

      const event = { target: { value: '01-Jun-2027' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(termControl?.touched).toBe(true);
      expect(termControl?.dirty).toBe(true);
    });
  });

  // ─── Test ID Search Filtering ─────────────────────────────────────

  describe('Test ID Search Filtering', () => {
    beforeEach(() => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();
    });

    it('should filter test ID options based on search input', () => {
      component.testIdSearchControl.setValue('Two');

      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].value).toBe('T002');
    });

    it('should show all test ID options when search is cleared', () => {
      component.testIdSearchControl.setValue('Two');
      component.testIdSearchControl.setValue('');

      expect(component.filteredTestIdOptions.length).toBe(3);
    });

    it('should filter by value code', () => {
      component.testIdSearchControl.setValue('T001');

      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].value).toBe('T001');
    });

    it('should be case-insensitive', () => {
      component.testIdSearchControl.setValue('test one');

      expect(component.filteredTestIdOptions.length).toBe(1);
      expect(component.filteredTestIdOptions[0].value).toBe('T001');
    });

    it('should return empty when no match', () => {
      component.testIdSearchControl.setValue('NONEXISTENT');

      expect(component.filteredTestIdOptions.length).toBe(0);
    });
  });

  // ─── resetFormForAddMode ──────────────────────────────────────────

  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset editModeValues to empty strings', () => {
      component.editModeValues = {
        testId: 'T001',
        effectiveDate: '01-Jan-2026'
      };

      (component as any).resetFormForAddMode();

      expect(component.editModeValues.testId).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should reset terminationMinDate to minDate', () => {
      component.terminationMinDate = moment().add(20, 'days');
      (component as any).resetFormForAddMode();
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should enable testId field', () => {
      component.form.get('testId')?.disable();

      (component as any).resetFormForAddMode();

      expect(component.form.get('testId')?.enabled).toBe(true);
    });

    it('should mark form as untouched and pristine', () => {
      component.form.markAsTouched();
      component.form.markAsDirty();

      (component as any).resetFormForAddMode();

      expect(component.form.untouched).toBe(true);
      expect(component.form.pristine).toBe(true);
    });

    it('should restore required validator on testId', () => {
      component.form.get('testId')?.clearValidators();
      component.form.get('testId')?.updateValueAndValidity();

      (component as any).resetFormForAddMode();

      component.form.get('testId')?.setValue('');
      component.form.get('testId')?.updateValueAndValidity();
      expect(component.form.get('testId')?.hasError('required')).toBe(true);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle data being null in edit mode gracefully', () => {
      component.mode = 'edit';
      component.data = null;
      expect(() => (component as any).populateFormForEdit()).not.toThrow();
    });

    it('should handle undefined data fields in edit mode', () => {
      component.mode = 'edit';
      component.data = {} as RecoveredPlasmaTestModel;
      expect(() => {
        (component as any).populateFormForEdit();
      }).not.toThrow();

      expect(component.editModeValues.testId).toBe('');
    });

    it('should switch to add mode and reset form via onSaveAndCreateAnother in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      (component as any).setupPanel();
      (component as any).populateFormForEdit();

      mockService.updateRecord.and.returnValue(of({ success: true }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.panelTitle).toBe('Add New Test ID');
    });

    it('should not call service on saveAndCreateAnother when form is invalid in add mode', () => {
      component.mode = 'add';
      // form has no values, so it's invalid
      component.onSaveAndCreateAnother();

      expect(mockService.createRecord).not.toHaveBeenCalled();
      expect(component.mode).toBe('add');
    });

    it('should handle updateTerminationMinDate with invalid effDate', () => {
      component.form.get('effDate')?.setValue('not-a-date');
      expect(() => (component as any).updateTerminationMinDate()).not.toThrow();
    });
  });
});
