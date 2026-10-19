import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { AddEditTestMessageMapping } from './add-edit-test-message-mapping';
import { TestMessageMappingService } from '../services/test-message-mapping.service';
import { LoginService } from '@shared/services/login.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { TestMessageMappingModel, LookupItem } from '../models/test-message-mapping.model';

describe('AddEditTestMessageMapping', () => {
  let component: AddEditTestMessageMapping;
  let fixture: ComponentFixture<AddEditTestMessageMapping>;
  let mockService: jasmine.SpyObj<TestMessageMappingService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  /** Use a date safely in the future so add-mode validators never reject it */
  const futureDate = () => moment().add(30, 'days');
  const futureDateLater = () => moment().add(60, 'days');

  const mockLookups: LookupItem[] = [
    { code: 'LT001', description: 'Test 1' },
    { code: 'LT002', description: 'Test 2' }
  ];

  const mockResultCodeLookups: LookupItem[] = [
    { code: 'N', description: 'Negative' },
    { code: 'P', description: 'Positive' }
  ];

  const mockMessageTypeLookups: LookupItem[] = [
    { code: 'MSG1', description: 'Message Type 1' },
    { code: 'MSG2', description: null }
  ];

  const mockEditData: TestMessageMappingModel = {
    ltTestId: 'LT001',
    resultCode: 'N',
    displyTestId: 'DISPLAY',
    antibodyFlag: 'N',
    messageDesc: 'Test Message',
    effDate: moment().add(1, 'day').toISOString(),
    termDate: null,
    insertDate: '2024-06-15T10:30:00Z',
    insertUser: 'admin'
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('TestMessageMappingService', [
      'getTestIdLookups',
      'getMessageTypeLookups',
      'getResultCodeLookups',
      'createRecord',
      'updateRecord'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockHeaderService = createMockHeaderService();

    mockService.getTestIdLookups.and.returnValue(of([]));
    mockService.getMessageTypeLookups.and.returnValue(of([]));
    mockService.getResultCodeLookups.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        AddEditTestMessageMapping,
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
        { provide: TestMessageMappingService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LoginService, useValue: mockLoginService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });
  });

  beforeEach(() => {
    mockLoginService.getStoredUsername.and.returnValue('testuser');
    mockService.getTestIdLookups.and.returnValue(of([]));
    mockService.getMessageTypeLookups.and.returnValue(of([]));
    mockService.getResultCodeLookups.and.returnValue(of([]));

    fixture = TestBed.createComponent(AddEditTestMessageMapping);
    component = fixture.componentInstance;
  });

  /** Helper: fill form with valid data so it passes validation in add mode */
  function fillFormValid() {
    component.form.patchValue({
      ltTestId: 'LT001',
      resultCode: 'N',
      displyTestId: 'DISPLAY',
      antibodyFlag: 'N',
      effDate: futureDate()
    });
  }

  /** Helper: access the component's private snackBar for assertions */
  function getComponentSnackBar(): MatSnackBar {
    return (component as any).snackBar;
  }

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require ltTestId field', () => {
      const control = component.form.get('ltTestId');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('LT001');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require resultCode field', () => {
      const control = component.form.get('resultCode');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('N');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require displyTestId field', () => {
      const control = component.form.get('displyTestId');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('DISPLAY');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should enforce maxlength of 20 on displyTestId', () => {
      const control = component.form.get('displyTestId');
      control?.setValue('A'.repeat(21));
      expect(control?.hasError('maxlength')).toBeTruthy();

      control?.setValue('A'.repeat(20));
      expect(control?.hasError('maxlength')).toBeFalsy();
    });

    it('should accept alphanumeric and special characters in displyTestId', () => {
      const control = component.form.get('displyTestId');

      control?.setValue('ABC123');
      expect(control?.valid).toBeTruthy();

      control?.setValue('Test-01');
      expect(control?.valid).toBeTruthy();

      control?.setValue('A1!@#');
      expect(control?.valid).toBeTruthy();
    });

    it('should require antibodyFlag field', () => {
      const control = component.form.get('antibodyFlag');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue('N');
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should require effDate field', () => {
      const control = component.form.get('effDate');
      expect(control?.hasError('required')).toBeTruthy();

      control?.setValue(moment());
      expect(control?.hasError('required')).toBeFalsy();
    });

    it('should not require messageDesc field', () => {
      const control = component.form.get('messageDesc');
      expect(control?.hasError('required')).toBeFalsy();
    });


    it('should allow termination date on or after effective date', () => {
      component.form.patchValue({
        effDate: moment('2024-01-01'),
        termDate: moment('2024-06-01')
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });
  });

  describe('Component Creation and Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default to add mode', () => {
      expect(component.mode).toBe('add');
    });

    it('should default data to null', () => {
      expect(component.data).toBeNull();
    });

    it('should initialize form with correct controls', () => {
      fixture.detectChanges();
      expect(component.form.get('ltTestId')).toBeTruthy();
      expect(component.form.get('resultCode')).toBeTruthy();
      expect(component.form.get('displyTestId')).toBeTruthy();
      expect(component.form.get('antibodyFlag')).toBeTruthy();
      expect(component.form.get('messageDesc')).toBeTruthy();
      expect(component.form.get('effDate')).toBeTruthy();
      expect(component.form.get('termDate')).toBeTruthy();
    });

    it('should set panelTitle to "Add New Test Message" in add mode', () => {
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Test Message');
    });

    it('should set lastModified to empty string in add mode', () => {
      fixture.detectChanges();
      expect(component.lastModified).toBe('');
    });

    it('should have antibodyFlagOptions with Yes and No', () => {
      expect(component.antibodyFlagOptions).toEqual([
        { value: 'Y', display: 'Yes' },
        { value: 'N', display: 'No' }
      ]);
    });

    it('should initialize isSaving to false', () => {
      expect(component.isSaving).toBe(false);
    });

    it('should initialize savingAction to null', () => {
      expect(component.savingAction).toBeNull();
    });

    it('should initialize noResultCodesAvailable to false', () => {
      expect(component.noResultCodesAvailable).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadTestIdLookups on init', () => {
      fixture.detectChanges();
      expect(mockService.getTestIdLookups).toHaveBeenCalled();
    });

    it('should call loadMessageTypeLookups on init', () => {
      fixture.detectChanges();
      expect(mockService.getMessageTypeLookups).toHaveBeenCalled();
    });

    it('should populate testIdOptions when lookups succeed', () => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookups));
      fixture.detectChanges();

      expect(component.allTestIdOptions.length).toBe(2);
      expect(component.allTestIdOptions[0]).toEqual({ value: 'LT001', display: 'LT001' });
      expect(component.testIdOptions.length).toBe(2);
    });

    it('should populate messageTypeOptions when lookups succeed', () => {
      mockService.getMessageTypeLookups.and.returnValue(of(mockMessageTypeLookups));
      fixture.detectChanges();

      expect(component.allMessageTypeOptions.length).toBe(2);
      expect(component.allMessageTypeOptions[0]).toEqual({ value: 'MSG1', display: 'MSG1' });
      expect(component.messageTypeOptions.length).toBe(2);
    });

    it('should handle error loading test ID lookups', () => {
      mockService.getTestIdLookups.and.returnValue(throwError(() => new Error('Network error')));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fixture.detectChanges();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load AP Test ID options. Please refresh and try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should handle error loading message type lookups', () => {
      mockService.getMessageTypeLookups.and.returnValue(throwError(() => new Error('Network error')));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fixture.detectChanges();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load Message Type options. Please refresh and try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call setupPanel on first change', () => {
      const panelTitleBefore = component.panelTitle;
      const changes: SimpleChanges = {
        mode: new SimpleChange(undefined, 'add', true)
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe(panelTitleBefore);
    });

    it('should call setupPanel on subsequent mode changes', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Test Message');
    });

    it('should reset form when switching to add mode on subsequent changes', () => {
      // First set to edit mode
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      // Now switch to add mode
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Add New Test Message');
      expect(component.form.get('ltTestId')?.enabled).toBeTrue();
      expect(component.form.get('resultCode')?.enabled).toBeTrue();
    });

    it('should call setupPanel when data changes (non-first change)', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.mode = 'edit';
      component.data = mockEditData;
      const changes: SimpleChanges = {
        data: new SimpleChange(null, mockEditData, false)
      };
      component.ngOnChanges(changes);
      expect(component.panelTitle).toBe('Edit Test Message');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('setupPanel - Edit Mode', () => {
    it('should set panelTitle to "Edit Test Message"', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Test Message');
    });

    it('should set lastModified when insertDate exists', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      expect(component.lastModified).toContain('Last Modified:');
    });

    it('should set lastModified to empty when insertDate is null', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, insertDate: null };
      fixture.detectChanges();
      expect(component.lastModified).toBe('');
    });

    it('should populate editModeValues from data', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      expect(component.editModeValues.ltTestId).toBe('LT001');
      expect(component.editModeValues.resultCode).toBe('N');
      expect(component.editModeValues.displyTestId).toBe('DISPLAY');
    });

    it('should populate form values in edit mode', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.ltTestId).toBe('LT001');
      expect(rawValue.resultCode).toBe('N');
      expect(rawValue.displyTestId).toBe('DISPLAY');
      expect(rawValue.antibodyFlag).toBe('N');
      expect(rawValue.messageDesc).toBe('Test Message');
    });

    it('should disable PK fields and effDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.form.get('ltTestId')?.disabled).toBeTrue();
      expect(component.form.get('resultCode')?.disabled).toBeTrue();
      expect(component.form.get('displyTestId')?.disabled).toBeTrue();
      expect(component.form.get('effDate')?.disabled).toBeTrue();
    });

    it('should load result code lookups for the edit data ltTestId', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      expect(mockService.getResultCodeLookups).toHaveBeenCalledWith('LT001');
    });

    it('should handle edit data with null optional fields', () => {
      component.mode = 'edit';
      component.data = {
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: null,
        messageDesc: undefined,
        effDate: null,
        termDate: null
      };
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.antibodyFlag).toBe('N');
      expect(rawValue.messageDesc).toBe('');
    });

    it('should set effectiveDate in editModeValues when effDate exists', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        effDate: '2024-06-15T00:00:00Z'
      };
      fixture.detectChanges();
      expect(component.editModeValues.effectiveDate).toBeTruthy();
    });

    it('should set effectiveDate to empty string when effDate is null', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, effDate: null };
      fixture.detectChanges();
      expect(component.editModeValues.effectiveDate).toBe('');
    });
  });

  describe('loadResultCodeLookups', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate result code options on success', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.allResultCodeOptions.length).toBe(2);
      expect(component.allResultCodeOptions[0].display).toBe('N - Negative');
      expect(component.resultCodeOptions.length).toBe(2);
      expect(component.noResultCodesAvailable).toBe(false);
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should show code without description when description is null', () => {
      const lookups: LookupItem[] = [{ code: 'X', description: null }];
      mockService.getResultCodeLookups.and.returnValue(of(lookups));
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.allResultCodeOptions[0].display).toBe('X');
    });

    it('should handle empty result code lookups', () => {
      mockService.getResultCodeLookups.and.returnValue(of([]));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.allResultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(true);
      expect(component.form.get('resultCode')?.disabled).toBeTrue();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'No result codes available for this AP Test ID. Please select another AP Test ID.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['warning-snackbar'] })
      );
    });

    it('should handle null result code lookups', () => {
      mockService.getResultCodeLookups.and.returnValue(of(null as any));
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.noResultCodesAvailable).toBe(true);
      expect(component.form.get('resultCode')?.disabled).toBeTrue();
    });

    it('should handle result code lookup errors', () => {
      mockService.getResultCodeLookups.and.returnValue(throwError(() => new Error('Server error')));
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.allResultCodeOptions.length).toBe(0);
      expect(component.resultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(true);
      expect(component.form.get('resultCode')?.disabled).toBeTrue();
      expect(component.isLoadingOptions).toBe(false);
    });

    it('should reset result code when ltTestId is cleared in add mode', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.form.get('ltTestId')?.setValue('LT001');

      // Now clear the ltTestId
      component.form.get('ltTestId')?.setValue('');

      expect(component.resultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(false);
    });

    it('should enable resultCode in add mode when lookups return results', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.form.get('ltTestId')?.setValue('LT001');

      expect(component.form.get('resultCode')?.enabled).toBeTrue();
    });

    it('should keep resultCode disabled in edit mode when lookups return results', () => {
      // Create a fresh fixture in edit mode
      component.mode = 'edit';
      component.data = mockEditData;
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      // Re-trigger setup by calling ngOnChanges
      const changes: SimpleChanges = {
        mode: new SimpleChange('add', 'edit', false)
      };
      component.ngOnChanges(changes);

      expect(component.form.get('resultCode')?.disabled).toBeTrue();
    });
  });

  describe('ltTestId valueChanges - auto-populate result codes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not load result codes in edit mode when ltTestId changes', () => {
      component.mode = 'edit';
      mockService.getResultCodeLookups.calls.reset();

      // In edit mode, ltTestId is disabled so valueChanges won't fire normally,
      // but we verify the guard logic
      component.form.get('ltTestId')?.enable();
      component.form.get('ltTestId')?.setValue('LT002');

      // The subscription should check mode === 'add' and skip
      expect(mockService.getResultCodeLookups).not.toHaveBeenCalled();
    });

    it('should load result codes when ltTestId is set with whitespace (trimmed)', () => {
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      component.form.get('ltTestId')?.setValue('  LT001  ');

      expect(mockService.getResultCodeLookups).toHaveBeenCalledWith('LT001');
    });

    it('should reset resultCode when ltTestId is set to null', () => {
      component.form.get('ltTestId')?.setValue(null);
      expect(component.resultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(false);
    });
  });

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

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.onSave();

      expect(mockService.createRecord).not.toHaveBeenCalled();
      expect(mockService.updateRecord).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSave();

      expect(component.form.get('ltTestId')?.touched).toBeTrue();
      expect(component.form.get('resultCode')?.touched).toBeTrue();
      expect(component.form.get('displyTestId')?.touched).toBeTrue();
      expect(component.form.get('antibodyFlag')?.touched).toBeTrue();
      expect(component.form.get('effDate')?.touched).toBeTrue();
    });

    it('should call createRecord with correct payload in add mode', () => {
      mockService.createRecord.and.returnValue(of({ message: 'Created' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'Y',
        messageDesc: 'MSG1',
        effDate: futureDate(),
        termDate: null
      });

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalledWith(
        jasmine.objectContaining({
          ltTestId: 'LT001',
          resultCode: 'N',
          displyTestId: 'DISPLAY',
          antibodyFlag: 'Y',
          loggedInUserName: 'testuser'
        })
      );
    });

    it('should emit saveSuccess and closePanel on successful create', () => {
      mockService.createRecord.and.returnValue(of({ message: 'Test message added successfully' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      fillFormValid();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should show success snackbar with response message', () => {
      mockService.createRecord.and.returnValue(of({ message: 'Custom success message' }));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Custom success message',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should use default success message when response has no message', () => {
      mockService.createRecord.and.returnValue(of({}));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Test message added successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show error snackbar on create failure', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Server error',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should use default error message when error has no message', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should set isSaving to true while saving', () => {
      const subject = new Subject<any>();
      mockService.createRecord.and.returnValue(subject.asObservable());

      fillFormValid();

      component.onSave();
      expect(component.isSaving).toBe(true);
      expect(component.savingAction).toBe('save');

      subject.next({ message: 'ok' });
      subject.complete();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should trim whitespace from form values in add payload', () => {
      mockService.createRecord.and.returnValue(of({ message: 'ok' }));

      component.form.patchValue({
        ltTestId: '  LT001  ',
        resultCode: '  N  ',
        displyTestId: '  DISPLAY  ',
        antibodyFlag: 'N',
        messageDesc: '  MSG1  ',
        effDate: futureDate()
      });

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalledWith(
        jasmine.objectContaining({
          ltTestId: 'LT001',
          resultCode: 'N',
          displyTestId: 'DISPLAY',
          messageDesc: 'MSG1'
        })
      );
    });

    it('should set messageDesc to null when empty', () => {
      mockService.createRecord.and.returnValue(of({ message: 'ok' }));

      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'N',
        messageDesc: '',
        effDate: futureDate()
      });

      component.onSave();

      expect(mockService.createRecord).toHaveBeenCalledWith(
        jasmine.objectContaining({
          messageDesc: null
        })
      );
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;

      fixture.detectChanges();
    });

    it('should call updateRecord and handle error response', () => {
      mockService.updateRecord.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Conflict' } }))
      );

      // Ensure all required fields have values for form to be valid
      if (!component.form.get('effDate')?.value) {
        component.form.get('effDate')?.setValue(moment());
      }
      if (!component.form.get('resultCode')?.value) {
        component.form.get('resultCode')?.setValue('N');
      }
      if (!component.form.get('displyTestId')?.value) {
        component.form.get('displyTestId')?.setValue('DISPLAY');
      }
      if (!component.form.get('antibodyFlag')?.value) {
        component.form.get('antibodyFlag')?.setValue('N');
      }

      component.onSave();

      expect(mockService.updateRecord).toHaveBeenCalled();
      expect(component.isSaving).toBe(false);
    });

    it('should call updateRecord with editModeValues for PK fields', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      // Mark form dirty for edit mode save to be enabled
      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSave();

      expect(mockService.updateRecord).toHaveBeenCalledWith(
        'LT001',  // editModeValues.ltTestId
        'N',      // editModeValues.resultCode
        'DISPLAY', // editModeValues.displyTestId
        jasmine.objectContaining({
          resultCode: 'N',
          displyTestId: 'DISPLAY'
        })
      );
    });

    it('should use default edit success message when response has no message', () => {
      mockService.updateRecord.and.returnValue(of({}));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Test message updated successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should emit result with editModeValues for PK fields in edit mode', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'ok' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          ltTestId: 'LT001',
          resultCode: 'N',
          displyTestId: 'DISPLAY'
        })
      );
    });
  });

  describe('onSaveAndCreateAnother - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.onSaveAndCreateAnother();

      expect(mockService.createRecord).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSaveAndCreateAnother();
      expect(component.form.get('ltTestId')?.touched).toBeTrue();
    });

    it('should call createRecord and reset form on success in add mode', () => {
      mockService.createRecord.and.returnValue(of({ message: 'Created' }));
      spyOn(component.saveSuccess, 'emit');

      fillFormValid();

      component.onSaveAndCreateAnother();

      expect(mockService.createRecord).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();

      // Form should be reset for another entry
      expect(component.form.get('ltTestId')?.value).toBeFalsy();
      expect(component.allResultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(false);
    });

    it('should set savingAction to saveAndCreate', () => {
      const subject = new Subject<any>();
      mockService.createRecord.and.returnValue(subject.asObservable());

      fillFormValid();

      component.onSaveAndCreateAnother();

      expect(component.isSaving).toBe(true);
      expect(component.savingAction).toBe('saveAndCreate');

      subject.next({ message: 'ok' });
      subject.complete();

      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    });

    it('should use default success message when response has no message', () => {
      mockService.createRecord.and.returnValue(of({}));
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Operation completed successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show error snackbar on failure', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Duplicate record' } }))
      );
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Duplicate record',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should use default error message when error has no message', () => {
      mockService.createRecord.and.returnValue(
        throwError(() => ({}))
      );
      const snackBarSpy = spyOn(getComponentSnackBar(), 'open');

      fillFormValid();

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed. Please try again.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('onSaveAndCreateAnother - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should call updateRecord in edit mode', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.modeChange, 'emit');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(mockService.updateRecord).toHaveBeenCalled();
    });

    it('should switch to add mode after successful edit save', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.modeChange, 'emit');
      spyOn(component.saveSuccess, 'emit');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(component.mode).toBe('add');
      expect(component.modeChange.emit).toHaveBeenCalledWith('add');
      expect(component.panelTitle).toBe('Add New Test Message');
    });

    it('should reset editModeValues after switching to add mode', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(component.editModeValues.ltTestId).toBe('');
      expect(component.editModeValues.resultCode).toBe('');
      expect(component.editModeValues.displyTestId).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should enable all form fields after switching to add mode', () => {
      mockService.updateRecord.and.returnValue(of({ message: 'Updated' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.get('antibodyFlag')?.setValue('Y');
      component.form.markAsDirty();

      component.onSaveAndCreateAnother();

      expect(component.form.get('ltTestId')?.enabled).toBeTrue();
      expect(component.form.get('resultCode')?.enabled).toBeTrue();
      expect(component.form.get('displyTestId')?.enabled).toBeTrue();
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });
  });

  describe('Termination Min Date', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should default terminationMinDate to minDate', () => {
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should update terminationMinDate when effDate is set to a future date', () => {
      const fd = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(fd);

      expect(moment(component.terminationMinDate).isSame(fd, 'day')).toBeTrue();
    });

    it('should reset terminationMinDate to minDate when effDate is cleared', () => {
      const fd = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(fd);
      component.form.get('effDate')?.setValue(null);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should not update terminationMinDate when effDate is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.form.get('effDate')?.setValue(pastDate);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });
  });

  describe('Error message getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getLtTestIdError should return empty when control is untouched', () => {
      expect(component.getLtTestIdError()).toBe('');
    });

    it('getLtTestIdError should return required message when touched and empty', () => {
      component.form.get('ltTestId')?.markAsTouched();
      expect(component.getLtTestIdError()).toBe('AP Test ID is required');
    });

    it('getLtTestIdError should return empty when value is set', () => {
      component.form.get('ltTestId')?.setValue('LT001');
      component.form.get('ltTestId')?.markAsTouched();
      expect(component.getLtTestIdError()).toBe('');
    });

    it('getResultCodeError should return empty when untouched', () => {
      expect(component.getResultCodeError()).toBe('');
    });

    it('getResultCodeError should return required message when touched and empty', () => {
      component.form.get('resultCode')?.markAsTouched();
      expect(component.getResultCodeError()).toBe('Result is required');
    });

    it('getDisplyTestIdError should return empty when untouched', () => {
      expect(component.getDisplyTestIdError()).toBe('');
    });

    it('getDisplyTestIdError should return required message when touched and empty', () => {
      component.form.get('displyTestId')?.markAsTouched();
      expect(component.getDisplyTestIdError()).toBe('Label Test ID is required');
    });

    it('getDisplyTestIdError should return maxlength message when exceeded', () => {
      component.form.get('displyTestId')?.setValue('A'.repeat(21));
      component.form.get('displyTestId')?.markAsTouched();
      expect(component.getDisplyTestIdError()).toBe('Label Test ID must not exceed 20 characters');
    });

    it('getMessageDescError should return empty when untouched', () => {
      expect(component.getMessageDescError()).toBe('');
    });

    it('getMessageDescError should return empty when messageDesc is not required', () => {
      component.form.get('messageDesc')?.markAsTouched();
      expect(component.getMessageDescError()).toBe('');
    });
  });

  describe('Control getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('ltTestIdControl should return the form control', () => {
      expect(component.ltTestIdControl).toBe(component.form.get('ltTestId'));
    });

    it('resultCodeControl should return the form control', () => {
      expect(component.resultCodeControl).toBe(component.form.get('resultCode'));
    });

    it('displyTestIdControl should return the form control', () => {
      expect(component.displyTestIdControl).toBe(component.form.get('displyTestId'));
    });

    it('messageDescControl should return the form control', () => {
      expect(component.messageDescControl).toBe(component.form.get('messageDesc'));
    });

    it('effDateControl should return the form control', () => {
      expect(component.effDateControl).toBe(component.form.get('effDate'));
    });

    it('termDateControl should return the form control', () => {
      expect(component.termDateControl).toBe(component.form.get('termDate'));
    });
  });

  describe('isFormValid and isSaveEnabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('isFormValid should return false when form is invalid', () => {
      expect(component.isFormValid).toBe(false);
    });

    it('isFormValid should return true when all required fields are filled', () => {
      fillFormValid();
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBe(true);
    });

    it('isSaveEnabled should return form.valid in add mode', () => {
      component.mode = 'add';
      expect(component.isSaveEnabled).toBe(false);

      fillFormValid();
      component.form.updateValueAndValidity();
      expect(component.isSaveEnabled).toBe(true);
    });

    it('isSaveEnabled should require dirty form in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;

      // Valid form but not dirty
      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'N',
        effDate: futureDate()
      });
      component.form.updateValueAndValidity();
      component.form.markAsPristine();

      expect(component.isSaveEnabled).toBe(false);

      component.form.markAsDirty();
      expect(component.isSaveEnabled).toBe(true);
    });
  });

  describe('Search controls - filtering', () => {
    beforeEach(() => {
      mockService.getTestIdLookups.and.returnValue(of(mockLookups));
      mockService.getMessageTypeLookups.and.returnValue(of(mockMessageTypeLookups));
      fixture.detectChanges();
    });

    it('should filter testIdOptions based on search input', fakeAsync(() => {
      component.testIdSearchControl.setValue('LT001');
      tick(300);

      expect(component.testIdOptions.length).toBe(1);
      expect(component.testIdOptions[0].value).toBe('LT001');
    }));

    it('should reset testIdOptions when search is cleared', fakeAsync(() => {
      component.testIdSearchControl.setValue('LT001');
      tick(300);

      component.testIdSearchControl.setValue('');
      tick(300);

      expect(component.testIdOptions.length).toBe(2);
    }));

    it('should filter resultCodeOptions based on search input', fakeAsync(() => {
      component.allResultCodeOptions = [
        { value: 'N', display: 'N - Negative' },
        { value: 'P', display: 'P - Positive' }
      ];
      component.resultCodeOptions = [...component.allResultCodeOptions];

      component.resultCodeSearchControl.setValue('Neg');
      tick(300);

      expect(component.resultCodeOptions.length).toBe(1);
      expect(component.resultCodeOptions[0].value).toBe('N');
    }));

    it('should reset resultCodeOptions when search is cleared', fakeAsync(() => {
      component.allResultCodeOptions = [
        { value: 'N', display: 'N - Negative' },
        { value: 'P', display: 'P - Positive' }
      ];

      component.resultCodeSearchControl.setValue('Neg');
      tick(300);

      component.resultCodeSearchControl.setValue('');
      tick(300);

      expect(component.resultCodeOptions.length).toBe(2);
    }));

    it('should filter messageTypeOptions based on search input', fakeAsync(() => {
      component.messageTypeSearchControl.setValue('MSG1');
      tick(300);

      expect(component.messageTypeOptions.length).toBe(1);
      expect(component.messageTypeOptions[0].value).toBe('MSG1');
    }));

    it('should reset messageTypeOptions when search is cleared', fakeAsync(() => {
      component.messageTypeSearchControl.setValue('MSG1');
      tick(300);

      component.messageTypeSearchControl.setValue('');
      tick(300);

      expect(component.messageTypeOptions.length).toBe(2);
    }));

    it('should filter case-insensitively', fakeAsync(() => {
      component.testIdSearchControl.setValue('lt001');
      tick(300);

      expect(component.testIdOptions.length).toBe(1);
      expect(component.testIdOptions[0].value).toBe('LT001');
    }));

    it('should return empty array when search matches nothing', fakeAsync(() => {
      component.testIdSearchControl.setValue('ZZZZZ');
      tick(300);

      expect(component.testIdOptions.length).toBe(0);
    }));
  });

  describe('Date input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onEffectiveDateInput without error', () => {
      const event = { target: { value: '15-JAN-2027' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should call onTerminationDateInput without error', () => {
      const event = { target: { value: '15-JUN-2027' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });

    it('should call onTerminationDateInput with edit mode flag', () => {
      component.mode = 'edit';
      const event = { target: { value: '15-JUN-2027' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('resetFormForAddMode', () => {
    it('should reset form and enable all fields when switching from edit to add', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      // Verify edit mode disabled fields
      expect(component.form.get('ltTestId')?.disabled).toBeTrue();

      // Switch to add mode via ngOnChanges
      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      // All fields should be enabled
      expect(component.form.get('ltTestId')?.enabled).toBeTrue();
      expect(component.form.get('resultCode')?.enabled).toBeTrue();
      expect(component.form.get('displyTestId')?.enabled).toBeTrue();
      expect(component.form.get('antibodyFlag')?.enabled).toBeTrue();
      expect(component.form.get('messageDesc')?.enabled).toBeTrue();
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });

    it('should clear editModeValues when resetting for add mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.editModeValues.ltTestId).toBe('');
      expect(component.editModeValues.resultCode).toBe('');
      expect(component.editModeValues.displyTestId).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should clear result code options and flags', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      expect(component.allResultCodeOptions.length).toBe(0);
      expect(component.resultCodeOptions.length).toBe(0);
      expect(component.noResultCodesAvailable).toBe(false);
    });

    it('should restore required validators for all fields', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.mode = 'add';
      const changes: SimpleChanges = {
        mode: new SimpleChange('edit', 'add', false)
      };
      component.ngOnChanges(changes);

      // Check required validators are in place
      expect(component.form.get('ltTestId')?.hasError('required')).toBeTrue();
      expect(component.form.get('resultCode')?.hasError('required')).toBeTrue();
      expect(component.form.get('displyTestId')?.hasError('required')).toBeTrue();
      expect(component.form.get('antibodyFlag')?.hasError('required')).toBeTrue();
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('effDate valueChanges - termination date tracking', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effDate changes', () => {
      component.form.get('effDate')?.setValue(futureDate());
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should set lastChangedDateField to termination when termDate changes', () => {
      component.form.get('termDate')?.setValue(futureDateLater());
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('getEffDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return a string (error or empty)', () => {
      const result = component.getEffDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('getTermDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return a string (error or empty)', () => {
      const result = component.getTermDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('populateFormForEdit with termDate', () => {
    it('should set termDate when data has termination date', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        termDate: moment().add(90, 'days').toISOString()
      };
      fixture.detectChanges();

      const termDateValue = component.form.getRawValue().termDate;
      expect(termDateValue).toBeTruthy();
    });

    it('should handle data with no ltTestId gracefully', () => {
      component.mode = 'edit';
      component.data = {
        ltTestId: '',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'N',
        effDate: moment().add(1, 'day').toISOString(),
        termDate: null
      };
      fixture.detectChanges();

      // Should not try to load result code lookups for empty ltTestId
      expect(component.editModeValues.ltTestId).toBe('');
    });

    it('should handle null data in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      // Should not throw and form should remain in its initial state
      expect(component.panelTitle).toBe('Edit Test Message');
    });
  });

  describe('loadResultCodeLookups - edit mode branch', () => {
    it('should patchValue resultCode in edit mode after loading lookups', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      mockService.getResultCodeLookups.and.returnValue(of(mockResultCodeLookups));
      fixture.detectChanges();

      // In edit mode, after lookups load, it should re-patch the resultCode
      const rawValue = component.form.getRawValue();
      expect(rawValue.resultCode).toBe('N');
      expect(component.form.get('resultCode')?.disabled).toBeTrue();
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle onSave when antibodyFlag is empty (form should be invalid)', () => {
      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: '',
        effDate: futureDate()
      });

      // antibodyFlag is required, so form should be invalid when empty
      expect(component.form.valid).toBe(false);
    });

    it('should emit result with termDate when termDate has a value', () => {
      mockService.createRecord.and.returnValue(of({ message: 'ok' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'N',
        effDate: futureDate(),
        termDate: futureDateLater()
      });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      const emittedResult = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedResult.termDate).toBeTruthy();
    });

    it('should emit result with null termDate when termDate is empty', () => {
      mockService.createRecord.and.returnValue(of({ message: 'ok' }));
      spyOn(component.saveSuccess, 'emit');

      component.form.patchValue({
        ltTestId: 'LT001',
        resultCode: 'N',
        displyTestId: 'DISPLAY',
        antibodyFlag: 'N',
        effDate: futureDate(),
        termDate: null
      });

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      const emittedResult = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedResult.termDate).toBeNull();
    });
  });
});
