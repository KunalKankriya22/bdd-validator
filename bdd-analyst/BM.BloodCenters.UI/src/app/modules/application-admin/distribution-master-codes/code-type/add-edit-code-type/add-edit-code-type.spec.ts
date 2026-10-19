import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddEditCodeType, CodeTypeDialogData } from './add-edit-code-type';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditCodeType', () => {
  let component: AddEditCodeType;
  let fixture: ComponentFixture<AddEditCodeType>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditCodeType>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const mockDialogData: CodeTypeDialogData = {
    mode: 'add',
    codeType: 'APITY',
    codeTypeDescription: 'Test Type'
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');



      TestBed.configureTestingModule({
      imports: [
        AddEditCodeType
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });


    


      mockDialogRef.close.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockLoginService.getStoredUsername.calls.reset();
      mockLoginService.getStoredUsername.and.returnValue('testuser');


    fixture = TestBed.createComponent(AddEditCodeType);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {


    it('should initialize with empty form values in add mode', () => {
      expect(component.codeType).toBe('APITY');
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });



    it('should populate all fields with data in edit mode', () => {
      const editData: CodeTypeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        codeTypeDescription: 'Test Type',
        code: 'APITY001',
        description: 'Test Description',
        effectiveDate: new Date('2026-04-13'),
        termDate: new Date('2026-12-31'),
        numericalValue: 100,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ AddEditCodeType],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditCodeType);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.form.get('numericalValue')?.value).toBe(100);
      expect(editComponent.form.get('sequence1')?.value).toBe(1);
      expect(editComponent.form.get('sequence2')?.value).toBe(2);
      expect(editComponent.form.get('sequence3')?.value).toBe(3);
    });
  });
  describe('onSave', () => {
    it('should mark required fields as touched', () => {
      component.onSave();
      fixture.detectChanges();

      // Check that key required fields are marked as touched
      expect(component.form.get('description')?.touched).toBe(true);
    });



    it('should save valid form data', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Equipment malfunction',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month'),
        terminationDate: moment('2026-12-31'),
        numericalValue: 100,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3
      });

      let emittedResult: any;
      component.saveRequest.subscribe(val => emittedResult = val);
      component.onSave();

      expect(emittedResult).toEqual(
        jasmine.objectContaining({
          codeType: 'APITY',
          code: 'API01',
          description: 'Equipment malfunction',
          numericalValue: 100,
          sequence1: 1,
          sequence2: 2,
          sequence3: 3
        })
      );
    });

    it('should save with null termination date', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Test',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month'),
        terminationDate: null
      });

      let emittedResult: any;
      component.saveRequest.subscribe(val => emittedResult = val);
      component.onSave();

      expect(emittedResult).toEqual(
        jasmine.objectContaining({ termDate: null })
      );
    });

    it('should save with null numerical value and sequences', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Test',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month'),
        numericalValue: null,
        sequence1: null,
        sequence2: null,
        sequence3: null
      });

      let emittedResult: any;
      component.saveRequest.subscribe(val => emittedResult = val);
      component.onSave();

      expect(emittedResult).toEqual(
        jasmine.objectContaining({
          numericalValue: null,
          sequence1: null,
          sequence2: null,
          sequence3: null
        })
      );
    });
  });

  describe('Validation', () => {
    it('should return true when all required fields are valid in add mode', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Test',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month')
      });
      expect(component.isFormValid()).toBe(true);
    });

    it('should return false when code is missing', () => {
      component.form.patchValue({
        code: '',
        description: 'Test',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month')
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when description is missing', () => {
      component.form.patchValue({
        code: 'API01',
        description: '',
        codeBehavior: 'D',
        effectiveDate: moment().add(1, 'month')
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when effective date is missing', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Test',
        codeBehavior: 'D',
        effectiveDate: null
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when code behavior is missing in add mode', () => {
      component.form.patchValue({
        code: 'API01',
        description: 'Test',
        codeBehavior: '',
        effectiveDate: moment().add(1, 'month')
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false in edit mode when no changes have been made', () => {
      const editData: CodeTypeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        codeTypeDescription: 'Test Type',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effectiveDate: new Date('2026-04-13'),
        termDate: null,
        numericalValue: 10,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        codeBehavior: 'D'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ AddEditCodeType],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditCodeType);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // No changes made, form should be invalid for saving
      expect(editComponent.isFormValid()).toBe(false);
    });

    it('should return true in edit mode when description changes', () => {
      const editData: CodeTypeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        codeTypeDescription: 'Test Type',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effectiveDate: new Date('2026-04-13'),
        termDate: null,
        numericalValue: 10,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        codeBehavior: 'D'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ AddEditCodeType],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditCodeType);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Change description and mark form as dirty (isFormValid checks form.dirty)
      editComponent.form.patchValue({
        description: 'Updated Description'
      });
      editComponent.form.markAsDirty();

      // Form should now be valid for saving
      expect(editComponent.isFormValid()).toBe(true);
    });

    it('should return true in edit mode when termination date changes', () => {
      const editData: CodeTypeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        codeTypeDescription: 'Test Type',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effectiveDate: new Date('2026-04-13'),
        termDate: null,
        numericalValue: 10,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        codeBehavior: 'D'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ AddEditCodeType],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditCodeType);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Add termination date and mark form as dirty (isFormValid checks form.dirty)
      editComponent.form.patchValue({
        terminationDate: moment('2026-12-31')
      });
      editComponent.form.markAsDirty();

      // Form should now be valid for saving
      expect(editComponent.isFormValid()).toBe(true);
    });

    it('should return true in edit mode when numerical value changes', () => {
      const editData: CodeTypeDialogData = {
        mode: 'edit',
        codeType: 'APITY',
        codeTypeDescription: 'Test Type',
        code: 'APITY001',
        description: 'Equipment malfunction',
        effectiveDate: new Date('2026-04-13'),
        termDate: null,
        numericalValue: 10,
        sequence1: 1,
        sequence2: 2,
        sequence3: 3,
        codeBehavior: 'D'
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ AddEditCodeType],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: LoginService, useValue: mockLoginService }
        ]
      });

      const editFixture = TestBed.createComponent(AddEditCodeType);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Change numerical value and mark form as dirty (isFormValid checks form.dirty)
      editComponent.form.patchValue({
        numericalValue: 20
      });
      editComponent.form.markAsDirty();

      // Form should now be valid for saving
      expect(editComponent.isFormValid()).toBe(true);
    });
  });

  describe('Error Message Methods', () => {
    describe('getCodeError', () => {


      it('should return error message when field is touched and invalid', () => {
        component.form.get('code')?.markAsTouched();
        component.form.patchValue({ code: '' });
        expect(component.getCodeError()).toBe('Code Type is required');
      });


    });

    describe('getDescriptionError', () => {


      it('should return error message when field is touched and invalid', () => {
        component.form.get('description')?.markAsTouched();
        component.form.patchValue({ description: '' });
        expect(component.getDescriptionError()).toBe('Description is required');
      });


    });

    describe('getEffectiveDateError', () => {


      it('should return error message when field is touched and null', () => {
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.patchValue({ effectiveDate: null });
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });


    });
    describe('getCodeBehaviorError', () => {


      it('should return error message when field is touched and empty', () => {
        component.form.get('codeBehavior')?.markAsTouched();
        component.form.patchValue({ codeBehavior: '' });
        expect(component.getCodeBehaviorError()).toBe('Code Behavior is required');
      });
    });
  });

  describe('Computed Properties', () => {
    it('should calculate codeRemainingChars correctly', () => {
      component.form.patchValue({ code: 'AB' });
      expect(component.codeRemainingChars).toBe(3);
    });

    it('should calculate descriptionRemainingChars correctly', () => {
      component.form.patchValue({ description: 'Hello' });
      expect(component.descriptionRemainingChars).toBe(45);
    });
  });

  describe('formatDate', () => {




    it('should format date with single-digit day', () => {
      const date = new Date('2026-04-05');
      expect(component.formatDate(date)).toBe('05-APR-2026');
    });

    it('should format date with double-digit day', () => {
      const date = new Date('2026-12-25');
      expect(component.formatDate(date)).toBe('25-DEC-2026');
    });
  });
});
