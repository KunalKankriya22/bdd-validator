import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AddUpdateProcedureCodeComponent } from './add-update-procedure-code';
import { AddUpdateDialogData } from '../models/procedure-code.model';
import { HeaderService } from '@shared/services/header.service';
import { ProcedureCodeApiService } from '../services/procedure-code-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import moment from 'moment';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddUpdateProcedureCodeComponent', () => {
  let component: AddUpdateProcedureCodeComponent;
  let fixture: ComponentFixture<AddUpdateProcedureCodeComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateProcedureCodeComponent>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockApiService: jasmine.SpyObj<ProcedureCodeApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = createMockHeaderService();
    mockApiService = jasmine.createSpyObj('ProcedureCodeApiService', ['createProcedureCode', 'updateProcedureCode']);
    mockApiService.createProcedureCode.and.returnValue(of({ success: true, message: 'Created successfully', statusCode: 200 }));
    mockApiService.updateProcedureCode.and.returnValue(of({ success: true, message: 'Updated successfully', statusCode: 200 }));

    mockSnackbarService = createMockSnackbarService();



      TestBed.configureTestingModule({
      imports: [AddUpdateProcedureCodeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } as AddUpdateDialogData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ProcedureCodeApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        provideAnimations(),
        provideHttpClient(),
      ],
    });


    


      mockDialogRef.close.calls.reset();


      mockApiService.createProcedureCode.calls.reset();


      mockApiService.updateProcedureCode.calls.reset();


      mockSnackbarService.showSuccess.calls.reset();


      mockSnackbarService.showError.calls.reset();


      mockApiService.createProcedureCode.and.returnValue(of({ success: true, message: 'Created successfully', statusCode: 200 }));


      mockApiService.updateProcedureCode.and.returnValue(of({ success: true, message: 'Updated successfully', statusCode: 200 }));


    fixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize with add mode', () => {
    expect(component.dialogTitle).toBe('Add Procedure Code');
    expect(component.isEditMode).toBeFalse();
  });

  it('should initialize with edit mode when data.mode is edit', () => {
    const editData: AddUpdateDialogData = {
      mode: 'edit',
      procedureCode: 'WB',
      description: 'Whole Blood',
      deferralDays: 56,
      achievementCredits: 1,
      effectiveDate: new Date(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AddUpdateProcedureCodeComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: editData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ProcedureCodeApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        provideAnimations(),
        provideHttpClient(),
      ],
    });

    const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
    const editComponent = editFixture.componentInstance;
    editFixture.detectChanges();

    expect(editComponent.dialogTitle).toBe('Edit Procedure Code');
    expect(editComponent.isEditMode).toBeTrue();
  });

  describe('Form Validation', () => {
    it('should validate procedure code is required', () => {
      const control = component.form.get('procedureCode');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getProcedureCodeError()).toBe('Procedure code is required');
    });

    it('should validate procedure code max length', () => {
      const control = component.form.get('procedureCode');
      control?.setValue('ABCDEF'); // 6 characters (max is 5)
      control?.markAsTouched();

      expect(control?.hasError('maxlength')).toBeTrue();
      expect(component.getProcedureCodeError()).toBe('Procedure code must be at most 5 characters');
    });

    it('should validate procedure code is valid when filled correctly', () => {
      const control = component.form.get('procedureCode');
      control?.setValue('WB');
      control?.markAsTouched();

      expect(control?.valid).toBeTrue();
      expect(component.getProcedureCodeError()).toBe('');
    });



    it('should validate deferral days is required', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getDeferralDaysError()).toBe('Deferral days is required');
    });

    it('should validate deferral days cannot be negative', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(control?.hasError('min')).toBeTrue();
      expect(component.getDeferralDaysError()).toBe('Must be 0 or greater');
    });

    it('should validate deferral days can be zero', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(0);
      control?.markAsTouched();

      expect(control?.valid).toBeTrue();
      expect(component.getDeferralDaysError()).toBe('');
    });

    it('should validate achievement credits is required', () => {
      const control = component.form.get('achievementCredits');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getAchievementCreditsError()).toBe('Achievement credits is required');
    });

    it('should validate achievement credits cannot be negative', () => {
      const control = component.form.get('achievementCredits');
      control?.setValue(-5);
      control?.markAsTouched();

      expect(control?.hasError('min')).toBeTrue();
      expect(component.getAchievementCreditsError()).toBe('Must be 0 or greater');
    });

    it('should validate achievement credits can be zero', () => {
      const control = component.form.get('achievementCredits');
      control?.setValue(0);
      control?.markAsTouched();

      expect(control?.valid).toBeTrue();
      expect(component.getAchievementCreditsError()).toBe('');
    });

    it('should validate procedure duration is optional', () => {
      const control = component.form.get('procedureDuration');
      control?.setValue(null);

      expect(control?.valid).toBeTrue();
    });

    it('should validate procedure duration cannot be zero', () => {
      const control = component.form.get('procedureDuration');
      control?.setValue(0);
      control?.markAsTouched();

      expect(control?.hasError('min')).toBeTrue();
      expect(component.getProcedureDurationError()).toBe('Procedure duration must be greater than 0');
    });

    it('should validate procedure duration cannot be negative', () => {
      const control = component.form.get('procedureDuration');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(control?.hasError('min')).toBeTrue();
      expect(component.getProcedureDurationError()).toBe('Procedure duration must be greater than 0');
    });

    it('should validate description is required', () => {
      const control = component.form.get('description');
      control?.setValue('');
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getDescriptionError()).toBe('Description is required');
    });

    it('should validate description max length', () => {
      const control = component.form.get('description');
      control?.setValue('A'.repeat(51)); // 51 characters (max is 50)
      control?.markAsTouched();

      expect(control?.hasError('maxlength')).toBeTrue();
      expect(component.getDescriptionError()).toBe('Description must be at most 50 characters');
    });

    it('should validate sequence is required', () => {
      const control = component.form.get('sequence');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getSequenceError()).toBe('Sequence is required');
    });

    it('should validate sequence cannot be negative', () => {
      const control = component.form.get('sequence');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });
  });

  describe('Form Submission', () => {


    it('should save with correct data in add mode', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'WB',
        description: 'Whole Blood',
        effectiveDate: futureDate,
        deferralDays: 56,
        achievementCredits: 1,
        procedureDuration: 30,
        sequence: 10,
        standardRbcLoss: 450,
        standardPlasmaLoss: 0,
        extracorporealRbcLoss: 0,
        extracorporealPlasmaLoss: 0,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.procedureCode).toBe('WB');
      expect(savedData.description).toBe('Whole Blood');
      expect(savedData.duration).toBe(56);
      expect(savedData.creditCount).toBe(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    });

    it('should save with valid procedure duration', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'PL',
        description: 'Platelet',
        effectiveDate: futureDate,
        deferralDays: 2,
        achievementCredits: 1,
        procedureDuration: 30,
        sequence: 10,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.schViewInterval).toBe(30);
    });


  });

  describe('Date Validation', () => {
    it('should validate termination date must be after effective date', () => {
      const startDate = moment().add(1, 'year').startOf('day');
      const endDate = moment().add(6, 'months').startOf('day'); // Before start date

      component.form.patchValue({
        effectiveDate: startDate,
        terminationDate: endDate,
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });



    it('should allow same effective and termination date', () => {
      const sameDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        effectiveDate: sameDate,
        terminationDate: sameDate.clone(),
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });
  });
  describe('Error Messages', () => {
    it('should not return error message when field is untouched', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(null);
      // Don't mark as touched

      expect(component.getDeferralDaysError()).toBe('');
    });

    it('should return error message when required field is empty and touched', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(null);
      control?.markAsTouched();

      expect(component.getDeferralDaysError()).toBe('Deferral days is required');
    });

    it('should not return error when valid value is provided', () => {
      const control = component.form.get('deferralDays');
      control?.setValue(56);
      control?.markAsTouched();

      expect(component.getDeferralDaysError()).toBe('');
    });
  });

  describe('Edit Mode', () => {


    it('should display procedure code and description as read-only in edit mode', () => {
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: new Date(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.isEditMode).toBeTrue();
      expect(editComponent.data.procedureCode).toBe('WB');
      expect(editComponent.data.description).toBe('Whole Blood');
    });
  });

  describe('Additional Loss Fields', () => {
    it('should include standard RBC loss in save', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'WB',
        description: 'Whole Blood',
        effectiveDate: futureDate,
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        standardRbcLoss: 450,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.standardRbcLoss).toBe(450);
    });

    it('should include standard plasma loss in save', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'PL',
        description: 'Platelet',
        effectiveDate: futureDate,
        deferralDays: 2,
        achievementCredits: 1,
        sequence: 20,
        standardPlasmaLoss: 200,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.standardPlasmaLoss).toBe(200);
    });

    it('should include extracorporeal losses in save', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'AP',
        description: 'Apheresis',
        effectiveDate: futureDate,
        deferralDays: 7,
        achievementCredits: 2,
        sequence: 30,
        extracorporealRbcLoss: 50,
        extracorporealPlasmaLoss: 100,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.ecvRbcLoss).toBe(50);
      expect(savedData.ecvPlasmaLoss).toBe(100);
    });

    it('should default loss values to 0 when not provided', () => {
      const futureDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        procedureCode: 'WB',
        description: 'Whole Blood',
        effectiveDate: futureDate,
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
      });

      component.onSave();

      expect(mockApiService.createProcedureCode).toHaveBeenCalled();
      const savedData = mockApiService.createProcedureCode.calls.mostRecent().args[0];
      expect(savedData.standardRbcLoss).toBe(0);
      expect(savedData.standardPlasmaLoss).toBe(0);
      expect(savedData.ecvRbcLoss).toBe(0);
      expect(savedData.ecvPlasmaLoss).toBe(0);
    });
  });

  describe('Effective Date Display in Edit Mode', () => {
    it('should display formatted effective date in edit mode', () => {
      const testDate = moment('2027-06-15', 'YYYY-MM-DD');
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: testDate.toDate(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.editEffectiveDateDisplay).toContain('2027');
    });

    it('should display dash when no effective date in edit mode', () => {
      component.form.get('effectiveDate')?.setValue(null);
      expect(component.editEffectiveDateDisplay).toBe('-');
    });
  });

  describe('Min Date Configuration', () => {


    it('should track date field changes for cross-field validation', (done) => {
      const effectiveDate = moment().add(1, 'month').startOf('day');
      component.form.get('effectiveDate')?.setValue(effectiveDate);

      setTimeout(() => {
        // Verify that the effective date was set
        expect(component.form.get('effectiveDate')?.value).toBeTruthy();
        done();
      }, 10);
    });
  });

  describe('Form Dirty State in Edit Mode', () => {
    it('should not allow save in edit mode when form is pristine', () => {
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        effectiveDate: moment().add(1, 'year').toDate(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.isFormValid).toBeFalse();
    });


  });

  describe('Sequence Field Validation', () => {
    it('should require sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(null);
      control?.markAsTouched();

      expect(control?.hasError('required')).toBeTrue();
      expect(component.getSequenceError()).toBe('Sequence is required');
    });

    it('should not allow zero sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(0);
      control?.markAsTouched();

      expect(control?.hasError('min')).toBeTrue();
      expect(component.getSequenceError()).toBe('Sequence must be greater than 0');
    });

    it('should not allow negative sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });

    it('should allow positive sequence', () => {
      const control = component.form.get('sequence');
      control?.setValue(10);

      expect(control?.valid).toBeTrue();
    });
  });

  describe('Loss Field Validations', () => {
    it('should validate standard RBC loss is non-negative', () => {
      const control = component.form.get('standardRbcLoss');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });

    it('should validate standard plasma loss is non-negative', () => {
      const control = component.form.get('standardPlasmaLoss');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });

    it('should validate extracorporeal RBC loss is non-negative', () => {
      const control = component.form.get('extracorporealRbcLoss');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });

    it('should validate extracorporeal plasma loss is non-negative', () => {
      const control = component.form.get('extracorporealPlasmaLoss');
      control?.setValue(-1);

      expect(control?.hasError('min')).toBeTrue();
    });

    it('should allow zero values for all loss fields', () => {
      component.form.patchValue({
        standardRbcLoss: 0,
        standardPlasmaLoss: 0,
        extracorporealRbcLoss: 0,
        extracorporealPlasmaLoss: 0,
      });

      expect(component.form.get('standardRbcLoss')?.valid).toBeTrue();
      expect(component.form.get('standardPlasmaLoss')?.valid).toBeTrue();
      expect(component.form.get('extracorporealRbcLoss')?.valid).toBeTrue();
      expect(component.form.get('extracorporealPlasmaLoss')?.valid).toBeTrue();
    });
  });
  describe('Date Input Handlers', () => {
    it('should handle effective date input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '15-JAN-2027';
      const event = { target: inputElement } as any;

      component.onEffDateInput(event);

      expect(component.form.get('effectiveDate')).toBeDefined();
    });

    it('should handle termination date input in add mode', () => {
      component.isEditMode = false;
      const inputElement = document.createElement('input');
      inputElement.value = '15-DEC-2027';
      const event = { target: inputElement } as any;

      component.onTermDateInput(event);

      expect(component.form.get('terminationDate')).toBeDefined();
    });

    it('should handle termination date input in edit mode', () => {
      const editData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: moment().add(1, 'year').toDate(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const inputElement = document.createElement('input');
      inputElement.value = '15-DEC-2027';
      const event = { target: inputElement } as any;

      editComponent.onTermDateInput(event);

      expect(editComponent.form.get('terminationDate')).toBeDefined();
    });
  });

  describe('Form Validation in Edit Mode - isFormValid', () => {




    it('should return false when termination date has matDatepickerParse error', () => {
      const editData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: moment().add(1, 'year').toDate(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const termControl = editComponent.form.get('terminationDate');
      termControl?.setErrors({ matDatepickerParse: true });
      termControl?.markAsTouched();
      editComponent.form.markAsDirty();

      expect(editComponent.isFormValid).toBeFalse();
    });

    it('should return false when termination date has terminationDatePast error', () => {
      const editData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: moment().add(1, 'year').toDate(),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const termControl = editComponent.form.get('terminationDate');
      termControl?.setErrors({ terminationDatePast: true });
      termControl?.markAsTouched();
      editComponent.form.markAsDirty();

      expect(editComponent.isFormValid).toBeFalse();
    });


  });

  describe('Cross-field Date Error Display', () => {
    it('should track last changed date field for effective date', (done) => {
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'month'));

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');
        done();
      }, 10);
    });

    it('should track last changed date field for termination date', (done) => {
      component.form.get('terminationDate')?.setValue(moment().add(2, 'months'));

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('termination');
        done();
      }, 10);
    });


  });
  describe('TerminationDateFilter Functionality', () => {
    it('should allow dates on or after today', () => {
      const today = DateFieldValidationUtility.getMinDate('America/New_York');
      const futureDate = moment(today).add(1, 'month');

      expect(component.terminationDateFilter(today)).toBeTrue();
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should block dates before today', () => {
      const today = DateFieldValidationUtility.getMinDate('America/New_York');
      const yesterday = moment(today).subtract(1, 'day');
      const pastDate = moment(today).subtract(1, 'year');

      expect(component.terminationDateFilter(yesterday)).toBeFalse();
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should block termination dates before effective date', () => {
      const effectiveDate = moment().add(1, 'year');
      const beforeEffective = moment().add(6, 'months');

      component.form.get('effectiveDate')?.setValue(effectiveDate);

      expect(component.terminationDateFilter(beforeEffective)).toBeFalse();
    });

    it('should allow termination dates on or after effective date', () => {
      const effectiveDate = moment().add(1, 'year');
      const sameAsEffective = effectiveDate.clone();
      const afterEffective = moment().add(2, 'years');

      component.form.get('effectiveDate')?.setValue(effectiveDate);

      expect(component.terminationDateFilter(sameAsEffective)).toBeTrue();
      expect(component.terminationDateFilter(afterEffective)).toBeTrue();
    });

    it('should handle null date input', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should update filter behavior when effective date changes', () => {
      const date = moment().add(6, 'months');

      // Initially, 6 months from now should be allowed
      expect(component.terminationDateFilter(date)).toBeTrue();

      // Set effective date to 1 year from now
      const futureEffDate = moment().add(1, 'year');
      component.form.get('effectiveDate')?.setValue(futureEffDate);

      // Now 6 months from now should be blocked (before effective date)
      expect(component.terminationDateFilter(date)).toBeFalse();
    });

    it('should handle invalid moment objects', () => {
      const invalidMoment = moment('invalid-date');
      component.form.get('effectiveDate')?.setValue(invalidMoment);

      const testDate = moment().add(1, 'month');
      expect(component.terminationDateFilter(testDate)).toBeTrue();
    });
  });

  describe('TerminationDateFilter in Edit Mode', () => {
    it('should allow termination dates on or after future effective date', () => {
      const futureEffDate = moment().add(1, 'year').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: futureEffDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const effMoment = moment(futureEffDate);
      const beforeEff = moment().add(6, 'months');
      const onEff = effMoment.clone();
      const afterEff = moment().add(2, 'years');

      expect(editComponent.terminationDateFilter(beforeEff)).toBeFalse();
      expect(editComponent.terminationDateFilter(onEff)).toBeTrue();
      expect(editComponent.terminationDateFilter(afterEff)).toBeTrue();
    });

    it('should use today as minimum when effective date is in past', () => {
      const pastEffDate = moment().subtract(6, 'months').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: pastEffDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const chapterToday = DateFieldValidationUtility.getMinDate('America/New_York');
      const yesterday = moment(chapterToday).subtract(1, 'day');
      const tomorrow = moment(chapterToday).add(1, 'day');

      expect(editComponent.terminationDateFilter(yesterday)).toBeFalse();
      expect(editComponent.terminationDateFilter(chapterToday)).toBeTrue();
      expect(editComponent.terminationDateFilter(tomorrow)).toBeTrue();
    });

    it('should use today as minimum when effective date is null', () => {
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        deferralDays: 56,
        achievementCredits: 1,
        effectiveDate: undefined,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      const chapterToday = DateFieldValidationUtility.getMinDate('America/New_York');
      const futureDate = moment(chapterToday).add(1, 'month');

      expect(editComponent.terminationDateFilter(chapterToday)).toBeTrue();
      expect(editComponent.terminationDateFilter(futureDate)).toBeTrue();
    });
  });

  describe('Termination Date Validation with Cross-Field Validator', () => {
    it('should validate termination date cannot be before effective date', (done) => {
      const effectiveDate = moment().add(1, 'year').startOf('day');
      const terminationDate = moment().add(6, 'months').startOf('day'); // Before effective date

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      setTimeout(() => {
        expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
        done();
      }, 20);
    });

    it('should allow termination date equal to effective date', (done) => {
      const sameDate = moment().add(1, 'year').startOf('day');

      component.form.patchValue({
        effectiveDate: sameDate,
        terminationDate: sameDate.clone()
      });

      setTimeout(() => {
        expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
        done();
      }, 20);
    });


  });

  describe('Procedure Code Input - Alphanumeric Only', () => {
    it('should remove spaces from procedure code input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'AB CD';
      const event = { target: inputElement } as any;

      component.onProcedureCodeInput(event);

      expect(inputElement.value).toBe('ABCD');
    });

    it('should remove special characters from procedure code input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'AB@#$CD';
      const event = { target: inputElement } as any;

      component.onProcedureCodeInput(event);

      expect(inputElement.value).toBe('ABCD');
    });

    it('should allow alphanumeric characters in procedure code', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'ABC123';
      const event = { target: inputElement } as any;

      component.onProcedureCodeInput(event);

      expect(inputElement.value).toBe('ABC123');
    });

    it('should remove all non-alphanumeric characters including underscores', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'AB_CD-EF.12';
      const event = { target: inputElement } as any;

      component.onProcedureCodeInput(event);

      expect(inputElement.value).toBe('ABCDEF12');
    });

    it('should not change input when already alphanumeric', () => {
      const inputElement = document.createElement('input');
      inputElement.value = 'WB123';
      const event = { target: inputElement } as any;

      component.onProcedureCodeInput(event);

      expect(inputElement.value).toBe('WB123');
    });
  });

  describe('Numeric Input - Max Digits Restriction', () => {
    it('should truncate numeric input to 3 digits', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12345';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('123');
    });

    it('should truncate numeric input to 6 digits', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '1234567890';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 6);

      expect(inputElement.value).toBe('123456');
    });

    it('should not change input when within max digits', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '123';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('123');
    });

    it('should remove non-numeric characters from input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '12a3b4';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('123');
    });

    it('should handle empty input', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('');
    });

    it('should handle zero value', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '0';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('0');
    });

    it('should strip leading zeros and truncate', () => {
      const inputElement = document.createElement('input');
      inputElement.value = '001234';
      const event = { target: inputElement } as any;

      component.onNumericInput(event, 3);

      expect(inputElement.value).toBe('123');
    });
  });

  describe('Loss Field Error Messages', () => {
    it('should return error message for standard RBC loss when negative', () => {
      const control = component.form.get('standardRbcLoss');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(component.getStandardRbcLossError()).toBe('Must be 0 or greater');
    });



    it('should return error message for standard plasma loss when negative', () => {
      const control = component.form.get('standardPlasmaLoss');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(component.getStandardPlasmaLossError()).toBe('Must be 0 or greater');
    });



    it('should return error message for extracorporeal RBC loss when negative', () => {
      const control = component.form.get('extracorporealRbcLoss');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(component.getExtracorporealRbcLossError()).toBe('Must be 0 or greater');
    });



    it('should return error message for extracorporeal plasma loss when negative', () => {
      const control = component.form.get('extracorporealPlasmaLoss');
      control?.setValue(-1);
      control?.markAsTouched();

      expect(component.getExtracorporealPlasmaLossError()).toBe('Must be 0 or greater');
    });



    it('should not return error for untouched loss fields', () => {
      const control = component.form.get('standardRbcLoss');
      control?.setValue(-1);
      // Don't mark as touched

      expect(component.getStandardRbcLossError()).toBe('');
    });
  });

  describe('Edit Mode - Terminated Record Handling', () => {
    it('should allow save when editing terminated record without touching termination date', () => {
      const pastTermDate = moment().subtract(1, 'month').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        effectiveDate: moment().subtract(1, 'year').toDate(),
        terminationDate: pastTermDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Edit another field without touching termination date
      editComponent.form.get('deferralDays')?.setValue(60);
      editComponent.form.markAsDirty();

      // Termination date should not be touched
      expect(editComponent.form.get('terminationDate')?.touched).toBeFalse();

      // Form should be valid for save
      expect(editComponent.isFormValid).toBeTrue();

      // Save should succeed
      editComponent.onSave();
      expect(mockApiService.updateProcedureCode).toHaveBeenCalled();
    });

    it('should not show error when editing terminated record and clicking save without touching term date', () => {
      const pastTermDate = moment().subtract(1, 'month').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        effectiveDate: moment().subtract(1, 'year').toDate(),
        terminationDate: pastTermDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Edit another field
      editComponent.form.get('deferralDays')?.setValue(60);

      // Call save
      editComponent.onSave();

      // Termination date should remain untouched
      expect(editComponent.form.get('terminationDate')?.touched).toBeFalse();

      // No error should be shown
      expect(editComponent.getTerminationDateError()).toBe('');

      // Save should have been called
      expect(mockApiService.updateProcedureCode).toHaveBeenCalled();
    });

    it('should block save when user touches termination date field on terminated record', () => {
      const pastTermDate = moment().subtract(1, 'month').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        effectiveDate: moment().subtract(1, 'year').toDate(),
        terminationDate: pastTermDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // User touches/blurs out of termination date field
      const termControl = editComponent.form.get('terminationDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();
      editComponent.form.markAsDirty();

      // Trigger the validator to set the error
      termControl?.updateValueAndValidity();

      // Error should be shown
      const error = editComponent.getTerminationDateError();
      expect(error).toBeTruthy();
      expect(error).toContain('cannot be past date');

      // Form should not be valid
      expect(editComponent.isFormValid).toBeFalse();
    });

    it('should allow save when user clears termination date on terminated record', () => {
      const pastTermDate = moment().subtract(1, 'month').toDate();
      const editData: AddUpdateDialogData = {
        mode: 'edit',
        procedureCode: 'WB',
        description: 'Whole Blood',
        deferralDays: 56,
        achievementCredits: 1,
        sequence: 10,
        effectiveDate: moment().subtract(1, 'year').toDate(),
        terminationDate: pastTermDate,
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddUpdateProcedureCodeComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: ProcedureCodeApiService, useValue: mockApiService },
          { provide: SnackbarService, useValue: mockSnackbarService },
          provideAnimations(),
          provideHttpClient(),
        ],
      });

      const editFixture = TestBed.createComponent(AddUpdateProcedureCodeComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // User clears termination date
      editComponent.form.get('terminationDate')?.setValue(null);
      editComponent.form.markAsDirty();

      // No error should be shown
      expect(editComponent.getTerminationDateError()).toBe('');

      // Form should be valid
      expect(editComponent.isFormValid).toBeTrue();
    });
  });
});
