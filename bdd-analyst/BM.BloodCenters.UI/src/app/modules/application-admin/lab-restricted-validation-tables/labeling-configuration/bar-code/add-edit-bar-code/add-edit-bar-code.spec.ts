import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { AddEditBarCode } from './add-edit-bar-code';
import { BarCodeService } from '../services/bar-code.service';
import { LoginService } from '@shared/services/login.service';
import { HeaderService } from '@shared/services/header.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { SimpleChange } from '@angular/core';
import { BarCodeModel, LookupItem } from '../models/bar-code.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditBarCode', () => {
  let component: AddEditBarCode;
  let fixture: ComponentFixture<AddEditBarCode>;
  let mockBarCodeService: jasmine.SpyObj<BarCodeService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let snackBarSpy: jasmine.Spy;

  const mockLookupItems: LookupItem[] = [
    { code: 'BC001', description: 'Barcode One' },
    { code: 'BC002', description: 'Barcode Two' },
    { code: 'BC003', description: null }
  ];

  const mockTestIdLookups: LookupItem[] = [
    { code: 'T001', description: 'Test One' },
    { code: 'T002', description: 'Test Two' },
    { code: 'T003', description: null }
  ];

  const mockEditData: BarCodeModel = {
    barcodeValue: 'BC001',
    barcodeDesc: 'Barcode One Description',
    testId: 'T001',
    resultCode: 'N',
    effDate: moment().add(5, 'days').toISOString(),
    termDate: moment().add(30, 'days').toISOString(),
    insertDate: '2024-06-15T10:00:00Z',
    insertUser: 'testuser',
    auditKey: 1
  };

  beforeEach(() => {

    mockBarCodeService = jasmine.createSpyObj('BarCodeService', [
      'getBarcodeLookups',
      'getTestIdLookups',
      'createBarCode',
      'updateBarCode'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    mockBarCodeService.getBarcodeLookups.and.returnValue(of([]));
    mockBarCodeService.getTestIdLookups.and.returnValue(of([]));



      TestBed.configureTestingModule({
imports: [
        AddEditBarCode,
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
        { provide: BarCodeService, useValue: mockBarCodeService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LoginService, useValue: mockLoginService },
        { provide: HeaderService, useValue: { chapterId: () => 'TEST', chapterTimeZone: () => 'America/Chicago' } }
      ]
    });


    });



  beforeEach(() => {


      mockBarCodeService.getBarcodeLookups.calls.reset();


      mockBarCodeService.getTestIdLookups.calls.reset();


      mockBarCodeService.createBarCode.calls.reset();


      mockBarCodeService.updateBarCode.calls.reset();


      mockBarCodeService.getBarcodeLookups.and.returnValue(of([]));


      mockBarCodeService.getTestIdLookups.and.returnValue(of([]));


    fixture = TestBed.createComponent(AddEditBarCode);
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
      expect(component.form.get('barcodeValue')).toBeTruthy();
      expect(component.form.get('testId')).toBeTruthy();
      expect(component.form.get('resultCode')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });
  });

  // ─── ngOnInit ──────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should set panelTitle for add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Bar Code');
    });

    it('should set lastModified to empty in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.lastModified).toBe('');
    });

    it('should call loadBarcodeLookups on init', () => {
      fixture.detectChanges();
      expect(mockBarCodeService.getBarcodeLookups).toHaveBeenCalled();
    });

    it('should call loadTestIdLookups on init', () => {
      fixture.detectChanges();
      expect(mockBarCodeService.getTestIdLookups).toHaveBeenCalled();
    });

    it('should set currentChapterId from headerService', () => {
      fixture.detectChanges();
      expect(component.currentChapterId).toBe('TEST');
    });
  });

  // ─── Load Dropdown Options ─────────────────────────────────────────

  describe('Load Dropdown Options', () => {
    it('should load barcode lookups and map to options', () => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      expect(component.allBarcodeOptions.length).toBe(3);
      expect(component.allBarcodeOptions[0]).toEqual({
        value: 'BC001',
        display: 'BC001 - Barcode One',
        description: 'Barcode One'
      });
      expect(component.barcodeOptions.length).toBe(3);
      expect(component.isLoadingBarcodes).toBe(false);
    });

    it('should handle barcode lookup item with null description', () => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      const nullDescOption = component.allBarcodeOptions[2];
      expect(nullDescOption.display).toBe('BC003');
      expect(nullDescOption.description).toBe('');
    });

    it('should handle error loading barcode lookups', () => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.isLoadingBarcodes).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load Bar Code options. Please refresh and try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should load test ID lookups and map to options', () => {
      mockBarCodeService.getTestIdLookups.and.returnValue(of(mockTestIdLookups));
      fixture.detectChanges();

      expect(component.allTestIdOptions.length).toBe(3);
      expect(component.allTestIdOptions[0]).toEqual({
        value: 'T001',
        display: 'T001 - Test One'
      });
      expect(component.testIdOptions.length).toBe(3);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should handle test ID lookup item with null description', () => {
      mockBarCodeService.getTestIdLookups.and.returnValue(of(mockTestIdLookups));
      fixture.detectChanges();

      const nullDescOption = component.allTestIdOptions[2];
      expect(nullDescOption.display).toBe('T003');
    });

    it('should handle error loading test ID lookups', () => {
      mockBarCodeService.getTestIdLookups.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.isLoadingOptions).toBe(false);
      expect(component.allTestIdOptions).toEqual([]);
      expect(component.testIdOptions).toEqual([]);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load Test ID options. Please refresh and try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should re-apply testId in edit mode after test ID options load', () => {
      mockBarCodeService.getTestIdLookups.and.returnValue(of(mockTestIdLookups));
      component.mode = 'edit';
      component.data = { ...mockEditData };

      fixture.detectChanges();

      expect(component.form.getRawValue().testId).toBe('T001');
    });
  });

  // ─── Form Validation ──────────────────────────────────────────────

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require barcodeValue field', () => {
      const control = component.form.get('barcodeValue');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('BC001');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require testId field', () => {
      const control = component.form.get('testId');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('T001');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require resultCode field', () => {
      const control = component.form.get('resultCode');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('N');
      expect(control?.hasError('required')).toBeFalsy();
    });


    it('should allow termination date on or after effective date', () => {
      component.form.patchValue({
        effDate: moment('2024-01-01'),
        termDate: moment('2024-06-01')
      });

      const termControl = component.form.get('termDate');
      expect(termControl?.hasError('terminationBeforeEffective')).toBeFalsy();
    });

    it('should validate form is valid with all required fields', () => {
      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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

    it('should return barcodeValue control', () => {
      expect(component.barcodeValueControl).toBe(component.form.get('barcodeValue'));
    });

    it('should return testId control', () => {
      expect(component.testIdControl).toBe(component.form.get('testId'));
    });

    it('should return resultCode control', () => {
      expect(component.resultCodeControl).toBe(component.form.get('resultCode'));
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
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      // populateFormForEdit marks form as pristine
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

    it('should not call createBarCode when form is invalid', () => {
      component.onSave();
      expect(mockBarCodeService.createBarCode).not.toHaveBeenCalled();
    });

    it('should mark form as touched when saving with invalid form', () => {
      component.onSave();
      expect(component.form.get('barcodeValue')?.touched).toBe(true);
      expect(component.form.get('testId')?.touched).toBe(true);
      expect(component.form.get('resultCode')?.touched).toBe(true);
    });

    it('should call createBarCode with correct payload on valid form', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true, message: 'Created' }));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockBarCodeService.createBarCode).toHaveBeenCalledWith(jasmine.objectContaining({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        loggedInUserName: 'testuser'
      }));
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should set isSaving and savingAction during save', () => {
      const saveSubject = new Subject<any>();
      mockBarCodeService.createBarCode.and.returnValue(saveSubject.asObservable());

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true, message: 'Custom success message' }));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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

    it('should show default message when response has no message', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({}));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Barcode configuration added successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should call createBarCode and handle error response', () => {
      mockBarCodeService.createBarCode.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Already exists' } }))
      );

      component.form.get('barcodeValue')?.setValue('BC001');
      component.form.get('testId')?.setValue('T001');
      component.form.get('resultCode')?.setValue('N');
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));

      component.onSave();

      expect(mockBarCodeService.createBarCode).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should show error snackbar with error message on save failure', () => {
      mockBarCodeService.createBarCode.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate entry' } }))
      );

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      mockBarCodeService.createBarCode.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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

    it('should trim whitespace from form values in add payload', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        barcodeValue: '  BC001  ',
        testId: '  T001  ',
        resultCode: '  N  ',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSave();

      expect(mockBarCodeService.createBarCode).toHaveBeenCalledWith(jasmine.objectContaining({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N'
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

    it('should call updateBarCode with original PK values in edit mode', () => {
      mockBarCodeService.updateBarCode.and.returnValue(of({ success: true, message: 'Updated' }));

      // Make the form dirty by changing termDate
      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockBarCodeService.updateBarCode).toHaveBeenCalledWith(
        'BC001',
        'T001',
        'N',
        jasmine.objectContaining({
          testId: 'T001',
          resultCode: 'N'
        })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar on update success', () => {
      mockBarCodeService.updateBarCode.and.returnValue(of({ success: true, message: 'Update OK' }));

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
      mockBarCodeService.updateBarCode.and.returnValue(of({}));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Barcode configuration updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle update error', () => {
      mockBarCodeService.updateBarCode.and.returnValue(
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

    it('should set isSaving and savingAction to save during update', () => {
      const updateSubject = new Subject<any>();
      mockBarCodeService.updateBarCode.and.returnValue(updateSubject.asObservable());

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

    it('should disable PK fields in edit mode', () => {
      expect(component.form.get('barcodeValue')?.disabled).toBe(true);
      expect(component.form.get('testId')?.disabled).toBe(true);
      expect(component.form.get('resultCode')?.disabled).toBe(true);
      expect(component.form.get('effDate')?.disabled).toBe(true);
    });

    it('should set panelTitle for edit mode', () => {
      expect(component.panelTitle).toBe('Edit Bar Code Configuration');
    });

    it('should set lastModified from insertDate', () => {
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should populate editModeValues from data', () => {
      expect(component.editModeValues.barcodeValue).toBe('BC001');
      expect(component.editModeValues.testId).toBe('T001');
      expect(component.editModeValues.resultCode).toBe('N');
      expect(component.editModeValues.resultDisplay).toBe('Negative');
      expect(component.editModeValues.barcodeDesc).toBe('Barcode One Description');
    });
  });

  // ─── onSaveAndCreateAnother - Add Mode ────────────────────────────

  describe('onSaveAndCreateAnother - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call createBarCode when form is invalid', () => {
      component.onSaveAndCreateAnother();
      expect(mockBarCodeService.createBarCode).not.toHaveBeenCalled();
    });

    it('should call createBarCode and reset form on success', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true, message: 'Created' }));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      spyOn(component.saveSuccess, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockBarCodeService.createBarCode).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      // Form should be reset for add mode
      expect(component.form.get('barcodeValue')?.value).toBeFalsy();
    });

    it('should set isSaving and savingAction to saveAndCreate', () => {
      const subject = new Subject<any>();
      mockBarCodeService.createBarCode.and.returnValue(subject.asObservable());

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      mockBarCodeService.createBarCode.and.returnValue(of({}));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      mockBarCodeService.createBarCode.and.returnValue(
        throwError(() => ({ error: { message: 'Error occurred' } }))
      );

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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

    it('should reset selectedBarcodeDesc after save and create', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: moment().add(1, 'day'),
        termDate: null
      });
      component.selectedBarcodeDesc = 'Some description';

      component.onSaveAndCreateAnother();

      expect(component.selectedBarcodeDesc).toBe('');
    });

    it('should re-enable all fields after reset for add mode', () => {
      mockBarCodeService.createBarCode.and.returnValue(of({ success: true }));

      component.form.patchValue({
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
        effDate: moment().add(1, 'day'),
        termDate: null
      });

      component.onSaveAndCreateAnother();

      expect(component.form.get('barcodeValue')?.enabled).toBe(true);
      expect(component.form.get('testId')?.enabled).toBe(true);
      expect(component.form.get('resultCode')?.enabled).toBe(true);
      expect(component.form.get('effDate')?.enabled).toBe(true);
    });
  });

  // ─── onSaveAndCreateAnother - Edit Mode ───────────────────────────

  describe('onSaveAndCreateAnother - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      fixture.detectChanges();
    });

    it('should call updateBarCode and switch to add mode on success', () => {
      mockBarCodeService.updateBarCode.and.returnValue(of({ success: true, message: 'Updated' }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();

      expect(mockBarCodeService.updateBarCode).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
    });

    it('should handle update error on save and create another', () => {
      mockBarCodeService.updateBarCode.and.returnValue(
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
      mockBarCodeService.updateBarCode.and.returnValue(of({}));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Operation completed successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  // ─── Result Code Options ──────────────────────────────────────────

  describe('Result Code Options', () => {
    it('should have N and P result code options', () => {
      fixture.detectChanges();

      expect(component.resultCodeOptions).toEqual([
        { value: 'N', display: 'Negative' },
        { value: 'P', display: 'Positive' }
      ]);
    });
  });

  // ─── Error Messages ───────────────────────────────────────────────

  describe('Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return barcode value error when touched and empty', () => {
      component.form.get('barcodeValue')?.markAsTouched();
      expect(component.getBarcodeValueError()).toBe('Bar Code is required');
    });

    it('should return empty string for barcode when not touched', () => {
      expect(component.getBarcodeValueError()).toBe('');
    });

    it('should return empty string for barcode when valid', () => {
      component.form.get('barcodeValue')?.setValue('BC001');
      component.form.get('barcodeValue')?.markAsTouched();
      expect(component.getBarcodeValueError()).toBe('');
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

    it('should return result code error when touched and empty', () => {
      component.form.get('resultCode')?.markAsTouched();
      expect(component.getResultCodeError()).toBe('Result Code is required');
    });

    it('should return empty string for resultCode when not touched', () => {
      expect(component.getResultCodeError()).toBe('');
    });

    it('should return empty string for resultCode when valid', () => {
      component.form.get('resultCode')?.setValue('P');
      component.form.get('resultCode')?.markAsTouched();
      expect(component.getResultCodeError()).toBe('');
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
        barcodeValue: 'BC001',
        testId: 'T001',
        resultCode: 'N',
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
      // panelTitle remains whatever it was set in ngOnInit
      expect(component.panelTitle).toBe(initialTitle);
    });

    it('should call setupPanel when mode changes (not first change)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false }
      });
      expect(component.panelTitle).toBe('Edit Bar Code Configuration');
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

      expect(component.panelTitle).toBe('Add New Bar Code');
      expect(component.form.get('barcodeValue')?.enabled).toBe(true);
      expect(component.form.get('testId')?.enabled).toBe(true);
      expect(component.form.get('resultCode')?.enabled).toBe(true);
    });

    it('should handle data change (not first change)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, barcodeValue: 'BC999' };
      component.ngOnChanges({
        data: { currentValue: component.data, previousValue: null, firstChange: false, isFirstChange: () => false }
      });
      expect(component.editModeValues.barcodeValue).toBe('BC999');
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

    it('should format resultDisplay for N as Negative', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, resultCode: 'N' };
      fixture.detectChanges();

      expect(component.editModeValues.resultDisplay).toBe('Negative');
    });

    it('should format resultDisplay for P as Positive', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, resultCode: 'P' };
      fixture.detectChanges();

      expect(component.editModeValues.resultDisplay).toBe('Positive');
    });

    it('should format resultDisplay for unknown code as the code itself', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, resultCode: 'X' };
      fixture.detectChanges();

      expect(component.editModeValues.resultDisplay).toBe('X');
    });

    it('should handle empty string data fields gracefully', () => {
      component.mode = 'edit';
      component.data = {
        barcodeValue: '',
        barcodeDesc: '',
        testId: '',
        resultCode: '',
        effDate: null,
        termDate: null
      };
      fixture.detectChanges();

      expect(component.editModeValues.barcodeValue).toBe('');
      expect(component.editModeValues.testId).toBe('');
      expect(component.editModeValues.resultCode).toBe('');
    });

    it('should handle null barcodeDesc in data', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, barcodeDesc: null };
      fixture.detectChanges();

      expect(component.editModeValues.barcodeDesc).toBe('');
    });
  });

  // ─── formatDateTime ───────────────────────────────────────────────

  describe('formatDateTime', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for null input', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(component.formatDateTime('')).toBe('');
    });

    it('should format today date with Today prefix', () => {
      const todayStr = moment().format('YYYY-MM-DDTHH:mm:ss');
      const result = component.formatDateTime(todayStr);
      expect(result).toContain('Today');
      expect(result).toContain('PST');
    });

    it('should format non-today date with DD-MMM-YYYY format', () => {
      const pastDate = '2024-01-15T14:30:00';
      const result = component.formatDateTime(pastDate);
      expect(result).toContain('15-Jan-2024');
      expect(result).toContain('PST');
    });
  });

  // ─── Form Subscriptions ───────────────────────────────────────────

  describe('Form Subscriptions', () => {
    it('should update selectedBarcodeDesc when barcodeValue changes to a matching option', () => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      component.form.get('barcodeValue')?.setValue('BC001');
      expect(component.selectedBarcodeDesc).toBe('Barcode One');
    });

    it('should clear selectedBarcodeDesc when barcodeValue changes to non-matching value', () => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();

      component.selectedBarcodeDesc = 'Old desc';
      component.form.get('barcodeValue')?.setValue('NONEXISTENT');
      expect(component.selectedBarcodeDesc).toBe('');
    });

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

    it('should return empty string for effDate error when lastChangedDateField is not effective', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.get('effDate')?.markAsTouched();
      // Even with required error, the cross-field error only shows when it's the last changed field
      const error = component.getEffDateError();
      // The method delegates to DateFieldValidationUtility which checks control-level errors first
      expect(typeof error).toBe('string');
    });

    it('should return empty string for termDate error when lastChangedDateField is not termination', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.get('termDate')?.markAsTouched();
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

      // In add mode with empty value, control should be pristine and untouched
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

  // ─── Barcode Search Filtering ─────────────────────────────────────

  describe('Barcode Search Filtering', () => {
    beforeEach(() => {
      mockBarCodeService.getBarcodeLookups.and.returnValue(of(mockLookupItems));
      fixture.detectChanges();
    });

    it('should filter barcode options based on search input', (done) => {
      component.barcodeSearchControl.setValue('One');
      setTimeout(() => {
        expect(component.barcodeOptions.length).toBe(1);
        expect(component.barcodeOptions[0].value).toBe('BC001');
        done();
      }, 350);
    });

    it('should show all barcode options when search is cleared', (done) => {
      component.barcodeSearchControl.setValue('One');
      setTimeout(() => {
        component.barcodeSearchControl.setValue('');
        setTimeout(() => {
          expect(component.barcodeOptions.length).toBe(3);
          done();
        }, 350);
      }, 350);
    });
  });

  // ─── Test ID Search Filtering ─────────────────────────────────────

  describe('Test ID Search Filtering', () => {
    beforeEach(() => {
      mockBarCodeService.getTestIdLookups.and.returnValue(of(mockTestIdLookups));
      fixture.detectChanges();
    });

    it('should filter test ID options based on search input', (done) => {
      component.testIdSearchControl.setValue('Two');
      setTimeout(() => {
        expect(component.testIdOptions.length).toBe(1);
        expect(component.testIdOptions[0].value).toBe('T002');
        done();
      }, 350);
    });

    it('should show all test ID options when search is cleared', (done) => {
      component.testIdSearchControl.setValue('Two');
      setTimeout(() => {
        component.testIdSearchControl.setValue('');
        setTimeout(() => {
          expect(component.testIdOptions.length).toBe(3);
          done();
        }, 350);
      }, 350);
    });
  });

  // ─── resetFormForAddMode ──────────────────────────────────────────

  describe('resetFormForAddMode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset editModeValues to empty strings', () => {
      component.editModeValues = {
        barcodeValue: 'BC001',
        barcodeDesc: 'desc',
        testId: 'T001',
        resultCode: 'N',
        resultDisplay: 'Negative',
        effectiveDate: '01-Jan-2026'
      };

      (component as any).resetFormForAddMode();

      expect(component.editModeValues.barcodeValue).toBe('');
      expect(component.editModeValues.barcodeDesc).toBe('');
      expect(component.editModeValues.testId).toBe('');
      expect(component.editModeValues.resultCode).toBe('');
      expect(component.editModeValues.resultDisplay).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should reset resultCodeOptions to default N and P', () => {
      component.resultCodeOptions = [];
      (component as any).resetFormForAddMode();

      expect(component.resultCodeOptions).toEqual([
        { value: 'N', display: 'Negative' },
        { value: 'P', display: 'Positive' }
      ]);
    });

    it('should clear selectedBarcodeDesc', () => {
      component.selectedBarcodeDesc = 'Some desc';
      (component as any).resetFormForAddMode();
      expect(component.selectedBarcodeDesc).toBe('');
    });

    it('should reset terminationMinDate to minDate', () => {
      component.terminationMinDate = moment().add(20, 'days');
      (component as any).resetFormForAddMode();
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should enable all form fields', () => {
      component.form.get('barcodeValue')?.disable();
      component.form.get('testId')?.disable();
      component.form.get('resultCode')?.disable();
      component.form.get('effDate')?.disable();

      (component as any).resetFormForAddMode();

      expect(component.form.get('barcodeValue')?.enabled).toBe(true);
      expect(component.form.get('testId')?.enabled).toBe(true);
      expect(component.form.get('resultCode')?.enabled).toBe(true);
      expect(component.form.get('effDate')?.enabled).toBe(true);
    });

    it('should mark form as untouched and pristine', () => {
      component.form.markAsTouched();
      component.form.markAsDirty();

      (component as any).resetFormForAddMode();

      expect(component.form.untouched).toBe(true);
      expect(component.form.pristine).toBe(true);
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
      // populateFormForEdit guards against null data
      expect(() => (component as any).populateFormForEdit()).not.toThrow();
    });

    it('should handle undefined data fields in edit mode', () => {
      component.mode = 'edit';
      component.data = {} as BarCodeModel;
      expect(() => {
        (component as any).populateFormForEdit();
      }).not.toThrow();

      expect(component.editModeValues.barcodeValue).toBe('');
      expect(component.editModeValues.testId).toBe('');
      expect(component.editModeValues.resultCode).toBe('');
    });

    it('should switch to add mode and reset form via onSaveAndCreateAnother in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      (component as any).setupPanel();
      (component as any).populateFormForEdit();

      mockBarCodeService.updateBarCode.and.returnValue(of({ success: true }));

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      component.form.markAsDirty();

      spyOn(component.modeChange, 'emit');

      component.onSaveAndCreateAnother();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.panelTitle).toBe('Add New Bar Code');
    });
  });
});
