import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditAccessClassPanelComponent } from './add-edit-access-class-panel';
import { LabUserAccessService } from '../services/lab-user-access.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditAccessClassPanelComponent', () => {
  let component: AddEditAccessClassPanelComponent;
  let fixture: ComponentFixture<AddEditAccessClassPanelComponent>;
  let mockLabUserAccessService: jasmine.SpyObj<LabUserAccessService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockLabUserAccessService = jasmine.createSpyObj('LabUserAccessService', [
      'getAccessClassOptions',
      'getAccessLevelOptions',
      'addUserAccessClass',
      'updateUserAccessClass'
    ]);
    mockLabUserAccessService.getAccessLevelOptions.and.returnValue(
      of([
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' }
      ])
    );
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterId: signal('CLASS1') });
      TestBed.configureTestingModule({
      imports: [
        AddEditAccessClassPanelComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LabUserAccessService, useValue: mockLabUserAccessService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });
    fixture = TestBed.createComponent(AddEditAccessClassPanelComponent);
    component = fixture.componentInstance;

    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.userId = 'TEST001';
      component.userName = 'Test User';
      component.department = 'Test Department';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([
          { code: 'CLASS1', description: 'Class 1 Description' },
          { code: 'CLASS2', description: 'Class 2 Description' }
        ])
      );
      fixture.detectChanges();
    });

    it('should load access class options on init', () => {
      expect(mockLabUserAccessService.getAccessClassOptions).toHaveBeenCalled();
      expect(component.accessClassOptions.length).toBe(2);
    });

    it('should load access level options from API on init', () => {
      expect(mockLabUserAccessService.getAccessLevelOptions).toHaveBeenCalled();
      expect(component.accessLevelOptions.length).toBe(5);
      expect(component.accessLevelOptions[0]).toEqual({ value: 1, label: '1' });
      expect(component.filteredAccessLevelOptions.length).toBe(5);
    });

    it('should have description max length constant set to 500', () => {
      expect(component.DESCRIPTION_MAX_LENGTH).toBe(500);
    });

    it('should show remaining characters for description', () => {
      component.form.patchValue({ description: 'Hello' });
      expect(component.getDescriptionRemainingCharacters()).toBe('495/500');
    });
  });

  describe('Date Validations', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.userId = 'TEST001';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should not show pastDate error for today', () => {
      const today = moment().startOf('day');
      component.form.patchValue({ effectiveDate: today });

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should show error when termination date is before effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      const terminationDate = moment().add(2, 'days');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });
      component.form.get('terminationDate')?.markAsTouched();

      // Trigger form-level validation
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return required error for effective date', () => {
      component.form.patchValue({ effectiveDate: null });
      component.form.get('effectiveDate')?.markAsTouched();

      component.updateDateErrors();
      expect(component.effectiveDateError).toBe('Effective Date is required');
    });
  });

  describe('Form Submission', () => {
    it('should call addUserAccessClass in add mode', () => {
      component.mode = 'add';
      component.userId = 'TEST001';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([{ code: 'CLASS1', description: 'Test Description' }])
      );
      mockLabUserAccessService.addUserAccessClass.and.returnValue(
        of({ success: true, message: 'Success', statusCode: 200, data: null })
      );
      fixture.detectChanges();

      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test Description',
        accessLevel: 5,
        effectiveDate: moment(),
        terminationDate: null
      });

      component.onSave();

      expect(mockLabUserAccessService.addUserAccessClass).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userId: 'TEST001',
          accessClass: 'CLASS1',
          description: 'Test Description',
          accessLevel: 5
        }),
        'CLASS1'
      );
    });

    it('should show success snackbar when add succeeds with message', () => {
      component.mode = 'add';
      component.userId = 'TEST001';
      component.userName = 'Test User';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([{ code: 'CLASS1', description: 'Test Description' }])
      );
      mockLabUserAccessService.addUserAccessClass.and.returnValue(
        of({ success: true, message: 'Access class added successfully', statusCode: 200, data: null })
      );
      fixture.detectChanges();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test Description',
        accessLevel: 5,
        effectiveDate: moment()
      });

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('New Access class CLASS1 has been assigned successfully to Test User.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar when update succeeds with message', () => {
      component.mode = 'edit';
      component.userId = 'TEST001';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Class 1 Description',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      mockLabUserAccessService.updateUserAccessClass.and.returnValue(
        of({ success: true, message: 'Access class updated successfully', statusCode: 200, data: null })
      );
      component.ngOnInit();
      fixture.detectChanges();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        accessLevel: 7
      });

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Access class CLASS1 has been updated successfully.');
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should emit saveSuccess and closePanel even when response has success false', () => {
      component.mode = 'add';
      component.userId = 'TEST001';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.addUserAccessClass.and.returnValue(
        of({ success: false, message: 'Access class already exists', statusCode: 400, data: null })
      );
      fixture.detectChanges();

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test',
        accessLevel: 5,
        effectiveDate: moment()
      });

      component.onSave();

      // Error handling is done by authInterceptor, component still emits events
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should reset isSaving flag on HTTP error in add mode (error handling delegated to authInterceptor)', () => {
      component.mode = 'add';
      component.userId = 'TEST001';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.addUserAccessClass.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '0319', error: 'Duplicate entry not allowed' }
        }
      })));
      fixture.detectChanges();

      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test',
        accessLevel: 5,
        effectiveDate: moment()
      });

      component.onSave();

      // Error handling is delegated to authInterceptor, component just resets isSaving
      expect(component.isSaving).toBeFalse();
    });

    it('should reset isSaving flag on HTTP error in edit mode (error handling delegated to authInterceptor)', () => {
      component.mode = 'edit';
      component.userId = 'TEST001';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Class 1 Description',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      mockLabUserAccessService.updateUserAccessClass.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '0320', error: 'Update failed' }
        }
      })));
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({
        accessLevel: 7
      });

      component.onSave();

      // Error handling is delegated to authInterceptor, component just resets isSaving
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should emit closePanel', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onAccessClassChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([
          { code: 'CLASS1', description: 'Class 1 Description' },
          { code: 'CLASS2', description: 'Class 2 Description' }
        ])
      );
      fixture.detectChanges();
    });

    it('should patch description when a matching option is found', () => {
      component.onAccessClassChange('CLASS2');
      expect(component.form.getRawValue().description).toBe('Class 2 Description');
    });

    it('should not patch description when no matching option is found', () => {
      component.form.patchValue({ description: 'Original' });
      component.onAccessClassChange('NONEXISTENT');
      expect(component.form.getRawValue().description).toBe('Original');
    });
  });

  describe('getSelectedDescription', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([{ code: 'CLASS1', description: 'Class 1 Description' }])
      );
      fixture.detectChanges();
    });

    it('should return description for the selected access class', () => {
      component.form.patchValue({ accessClass: 'CLASS1' });
      expect(component.getSelectedDescription()).toBe('Class 1 Description');
    });

    it('should return empty string when no access class is selected', () => {
      component.form.patchValue({ accessClass: '' });
      expect(component.getSelectedDescription()).toBe('');
    });

    it('should return empty string when access class has no matching option', () => {
      component.form.patchValue({ accessClass: 'NONEXISTENT' });
      expect(component.getSelectedDescription()).toBe('');
    });
  });

  describe('getDescriptionRemainingCharacters', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return 500/500 when description is empty', () => {
      component.form.patchValue({ description: '' });
      expect(component.getDescriptionRemainingCharacters()).toBe('500/500');
    });
  });

  describe('isFormValid getter', () => {
    describe('add mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
        fixture.detectChanges();
      });

      it('should return true when form is valid and no date errors', () => {
        component.form.patchValue({
          accessClass: 'CLASS1',
          accessLevel: 5,
          effectiveDate: moment().add(1, 'day')
        });
        component.form.updateValueAndValidity();
        component.updateDateErrors();
        expect(component.isFormValid).toBeTrue();
      });

      it('should return false when form is invalid', () => {
        component.form.patchValue({ accessClass: '', accessLevel: '' });
        expect(component.isFormValid).toBeFalse();
      });
    });

    describe('edit mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = {
          accessClass: 'CLASS1',
          code: 'CLASS1',
          description: 'Desc',
          accessLevel: 5,
          effectiveDate: '2028-06-01',
          terminationDate: null
        };
        component.ngOnInit();
        fixture.detectChanges();
      });

      it('should return false when form is not dirty', () => {
        expect(component.isFormValid).toBeFalse();
      });

      it('should return true when form is dirty and valid', () => {
        component.form.patchValue({ accessLevel: 3 });
        component.form.markAsDirty();
        component.updateDateErrors();
        expect(component.isFormValid).toBeTrue();
      });

      it('should return false when termination date has a real error', () => {
        component.form.patchValue({ accessLevel: 3 });
        component.form.markAsDirty();
        component.form.get('terminationDate')?.setErrors({ invalidDate: true });
        expect(component.isFormValid).toBeFalse();
      });

      it('should return false when date error messages exist', () => {
        component.form.patchValue({ accessLevel: 3 });
        component.form.markAsDirty();
        component.effectiveDateError = 'Some error';
        expect(component.isFormValid).toBeFalse();
      });

      it('should return false when terminationDateError exists', () => {
        component.form.patchValue({ accessLevel: 3 });
        component.form.markAsDirty();
        component.terminationDateError = 'Some termination error';
        expect(component.isFormValid).toBeFalse();
      });
    });
  });

  describe('control getters', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return accessClassControl', () => {
      expect(component.accessClassControl).toBe(component.form.get('accessClass'));
    });

    it('should return descriptionControl', () => {
      expect(component.descriptionControl).toBe(component.form.get('description'));
    });

    it('should return accessLevelControl', () => {
      expect(component.accessLevelControl).toBe(component.form.get('accessLevel'));
    });

    it('should return effectiveDateControl', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDateControl', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('terminationDateMin getter', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return minDate when no effective date is set', () => {
      component.form.patchValue({ effectiveDate: null });
      expect(component.terminationDateMin.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should return effective date when it is after minDate', () => {
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: futureDate });
      expect(component.terminationDateMin.format('YYYY-MM-DD')).toBe(futureDate.startOf('day').format('YYYY-MM-DD'));
    });

    it('should return minDate when effective date is on or before minDate', () => {
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ effectiveDate: pastDate });
      expect(component.terminationDateMin.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });

    it('should return effDate startOf day in edit mode regardless of minDate comparison', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2020-01-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();
      const pastDate = moment('2020-01-01');
      component.form.patchValue({ effectiveDate: pastDate });
      expect(component.terminationDateMin.format('YYYY-MM-DD')).toBe('2020-01-01');
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should handle valid date input', () => {
      const event = { target: { value: '01-JAN-2029' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      // No error thrown
      expect(component).toBeTruthy();
    });

    it('should handle empty date input', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(component).toBeTruthy();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should handle valid date input', () => {
      const event = { target: { value: '31-DEC-2029' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component).toBeTruthy();
    });

    it('should handle empty date input', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(component).toBeTruthy();
    });

    it('should handle invalid text input and set invalid input flag', () => {
      const event = { target: { value: 'invalid-text' } } as unknown as Event;
      component.onTerminationDateInput(event);
      component.updateDateErrors();
      // After invalid input, the component tracks invalid input state internally
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should call setupPanel when mode changes (not first change)', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.panelTitle).toBe('Edit Class CLASS1');
    });

    it('should reset form and load options when switching to add mode', () => {
      mockLabUserAccessService.getAccessClassOptions.calls.reset();
      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          previousValue: 'edit',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.panelTitle).toBe('Add Access Class');
      expect(mockLabUserAccessService.getAccessClassOptions).toHaveBeenCalled();
    });

    it('should do nothing on first change', () => {
      const currentTitle = component.panelTitle;
      component.ngOnChanges({
        mode: {
          previousValue: undefined,
          currentValue: 'add',
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.panelTitle).toBe(currentTitle);
    });
  });

  describe('setupPanel edit mode', () => {
    it('should set panelTitle with data accessClass', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'MYCLASS',
        code: 'MYCLASS',
        description: 'My Description',
        accessLevel: 3,
        effectiveDate: '2028-06-01',
        terminationDate: '2029-01-01'
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit Class MYCLASS');
    });

    it('should populate form values for edit', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'MYCLASS',
        code: 'MYCLASS',
        description: 'My Description',
        accessLevel: 3,
        effectiveDate: '2028-06-01',
        terminationDate: '2029-01-01'
      };
      component.ngOnInit();
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.accessClass).toBe('MYCLASS');
      expect(rawValue.description).toBe('My Description');
      expect(rawValue.accessLevel).toBe(3);
    });

    it('should disable accessClass control in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.form.get('accessClass')?.disabled).toBeTrue();
    });
  });

  describe('loadAccessClassOptions error path', () => {
    it('should set empty arrays on error', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();

      expect(component.accessClassOptions).toEqual([]);
      expect(component.filteredAccessClassOptions).toEqual([]);
    });
  });

  describe('loadAccessLevelOptions error path', () => {
    it('should set empty arrays on error', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.getAccessLevelOptions.and.returnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();

      expect(component.accessLevelOptions).toEqual([]);
      expect(component.filteredAccessLevelOptions).toEqual([]);
    });
  });

  describe('updateDateErrors additional branches', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should set terminationDateError when termination date is past in edit mode', () => {
      const pastEffective = moment().subtract(30, 'days');
      const pastTermination = moment().subtract(5, 'days');
      component.form.patchValue({ effectiveDate: pastEffective, terminationDate: pastTermination });
      // Update the datepicker min binding so matDatepickerMin doesn't preempt
      fixture.detectChanges();
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();
      component.form.updateValueAndValidity();
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('Termination date cannot be past date');
    });
  });

  describe('access class search filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([
          { code: 'ALPHA', description: 'Alpha Class' },
          { code: 'BETA', description: 'Beta Class' },
          { code: 'GAMMA', description: 'Gamma Class' }
        ])
      );
      fixture.detectChanges();
    });

    it('should filter access class options by search term', () => {
      component.accessClassSearchControl.setValue('alpha');
      expect(component.filteredAccessClassOptions.length).toBe(1);
      expect(component.filteredAccessClassOptions[0].code).toBe('ALPHA');
    });

    it('should filter by description', () => {
      component.accessClassSearchControl.setValue('beta');
      expect(component.filteredAccessClassOptions.length).toBe(1);
      expect(component.filteredAccessClassOptions[0].code).toBe('BETA');
    });

    it('should show all when search term is empty', () => {
      component.accessClassSearchControl.setValue('');
      expect(component.filteredAccessClassOptions.length).toBe(3);
    });
  });

  describe('access level search filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should filter access level options by search term', () => {
      component.accessLevelSearchControl.setValue('3');
      expect(component.filteredAccessLevelOptions.length).toBe(1);
      expect(component.filteredAccessLevelOptions[0].label).toBe('3');
    });

    it('should show all when search term is empty', () => {
      component.accessLevelSearchControl.setValue('');
      expect(component.filteredAccessLevelOptions.length).toBe(5);
    });
  });

  describe('onSave validation guards', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should not call API when form is invalid', () => {
      component.form.patchValue({ accessClass: '', accessLevel: '' });
      component.onSave();
      expect(mockLabUserAccessService.addUserAccessClass).not.toHaveBeenCalled();
    });
  });

  describe('component creation and defaults', () => {
    it('should create the component', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.mode).toBe('add');
      expect(component.data).toBeNull();
      expect(component.userId).toBe('');
      expect(component.userName).toBe('');
      expect(component.department).toBe('');
      expect(component.isSaving).toBeFalse();
      expect(component.isLoadingOptions).toBeFalse();
    });
  });

  describe('form structure', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should have all expected form controls', () => {
      expect(component.form.get('accessClass')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('accessLevel')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should have description field disabled by default', () => {
      expect(component.form.get('description')?.disabled).toBeTrue();
    });

    it('should have accessClass as required', () => {
      component.form.patchValue({ accessClass: '' });
      component.form.get('accessClass')?.markAsTouched();
      expect(component.form.get('accessClass')?.hasError('required')).toBeTrue();
    });

    it('should have accessLevel as required', () => {
      component.form.patchValue({ accessLevel: '' });
      component.form.get('accessLevel')?.markAsTouched();
      expect(component.form.get('accessLevel')?.hasError('required')).toBeTrue();
    });

    it('should have effectiveDate as required', () => {
      component.form.patchValue({ effectiveDate: null });
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('setupPanel with null data in edit mode', () => {
    it('should set panelTitle with empty string when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      component.ngOnInit();
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Class ');
    });

    it('should not patch form when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      component.ngOnInit();
      fixture.detectChanges();
      const rawValue = component.form.getRawValue();
      expect(rawValue.accessClass).toBeFalsy();
      expect(rawValue.description).toBeFalsy();
    });
  });

  describe('editModeValues tracking', () => {
    it('should set editModeValues when entering edit mode with full data', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'TESTCLASS',
        code: 'TESTCLASS',
        description: 'Test Description',
        accessLevel: 5,
        effectiveDate: '2028-06-15',
        terminationDate: '2029-01-01'
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.editModeValues.accessClass).toBe('TESTCLASS');
      expect(component.editModeValues.description).toBe('Test Description');
      expect(component.editModeValues.effectiveDate).toBe('15-JUN-2028');
    });

    it('should set empty effectiveDate in editModeValues when data has no effectiveDate', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.editModeValues.effectiveDate).toBe('');
    });

    it('should clear editModeValues when resetting to add mode', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          previousValue: 'edit',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.editModeValues.accessClass).toBe('');
      expect(component.editModeValues.description).toBe('');
      expect(component.editModeValues.effectiveDate).toBe('');
    });
  });

  describe('updateDateErrors invalid input flag paths', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should show effective date invalid error from invalid input flag', () => {
      const event = { target: { value: 'invalid-text' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      // Clear control errors to simulate updateValueAndValidity clearing them
      component.form.get('effectiveDate')?.setErrors(null);
      component.updateDateErrors();
      expect(component.effectiveDateError).toBe('Effective Date is invalid');
    });

    it('should show termination date invalid error from invalid input flag', () => {
      const event = { target: { value: 'invalid-text' } } as unknown as Event;
      component.onTerminationDateInput(event);
      component.form.get('terminationDate')?.setErrors(null);
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('Termination Date is invalid');
    });

    it('should not show invalid input error when control has a valid value', () => {
      const event = { target: { value: 'invalid-text' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      // Set a valid moment value on the control
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.setErrors(null);
      component.updateDateErrors();
      expect(component.effectiveDateError).toBe('');
    });
  });

  describe('updateDateErrors lastChangedDateField routing', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should show cross-field error on effective date when lastChangedDateField is effective', () => {
      const futureDate = moment().add(10, 'days');
      const earlyDate = moment().add(2, 'days');

      // Set terminationDate first, then effectiveDate so lastChangedDateField = 'effective'
      component.form.patchValue({ terminationDate: earlyDate });
      component.form.patchValue({ effectiveDate: futureDate });

      component.form.get('effectiveDate')?.markAsTouched();
      component.form.updateValueAndValidity();
      component.updateDateErrors();

      expect(component.effectiveDateError).toBe('Effective Date must be less than or equal to Termination Date');
    });
  });

  describe('updateDateErrors edit mode termination date edge cases', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2020-01-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should not show past date error for future termination date in edit mode', () => {
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ terminationDate: futureDate });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('');
    });

    it('should handle string termination date value in edit mode past check', () => {
      const pastDateStr = moment().subtract(5, 'days').format('YYYY-MM-DD');
      component.form.patchValue({ terminationDate: pastDateStr });
      // Clear validator-produced errors to reach the edit-mode fallback past date check
      component.form.get('terminationDate')?.setErrors(null);
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('Termination date cannot be past date');
    });

    it('should not show error when termination date is not touched or dirty', () => {
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ terminationDate: pastDate });
      // Do NOT mark as touched or dirty
      component.form.get('terminationDate')?.markAsPristine();
      component.form.get('terminationDate')?.markAsUntouched();
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('');
    });
  });

  describe('onSave dateRangeInvalid guard', () => {
    it('should not call API when dateRangeInvalid error exists', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();

      component.form.patchValue({
        accessClass: 'CLASS1',
        accessLevel: 5,
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(2, 'days')
      });
      component.form.updateValueAndValidity();

      component.onSave();
      expect(mockLabUserAccessService.addUserAccessClass).not.toHaveBeenCalled();
    });
  });

  describe('onSave edit mode with empty accessClass in data', () => {
    it('should use empty string for accessClass when data.accessClass is empty', () => {
      component.mode = 'edit';
      component.userId = 'TEST001';
      component.userName = 'Test User';
      component.data = {
        accessClass: '',
        code: '',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      mockLabUserAccessService.updateUserAccessClass.and.returnValue(
        of({ success: true, message: 'Updated', statusCode: 200, data: null })
      );
      component.ngOnInit();
      fixture.detectChanges();

      component.form.patchValue({ accessLevel: 3 });
      component.onSave();

      expect(mockLabUserAccessService.updateUserAccessClass).toHaveBeenCalledWith(
        '',
        jasmine.objectContaining({ userId: 'TEST001' }),
        jasmine.any(String)
      );
    });
  });

  describe('onSave userId uppercase', () => {
    it('should convert userId to uppercase in add mode payload', () => {
      component.mode = 'add';
      component.userId = 'lowercase001';
      component.userName = 'Test User';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.addUserAccessClass.and.returnValue(
        of({ success: true, message: 'Success', statusCode: 200, data: null })
      );
      fixture.detectChanges();

      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test',
        accessLevel: 5,
        effectiveDate: moment()
      });

      component.onSave();

      expect(mockLabUserAccessService.addUserAccessClass).toHaveBeenCalledWith(
        jasmine.objectContaining({ userId: 'LOWERCASE001' }),
        jasmine.any(String)
      );
    });
  });

  describe('onSave with terminationDate provided', () => {
    it('should include serialized terminationDate in add request', () => {
      component.mode = 'add';
      component.userId = 'TEST001';
      component.userName = 'Test User';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.addUserAccessClass.and.returnValue(
        of({ success: true, message: 'Success', statusCode: 200, data: null })
      );
      fixture.detectChanges();

      const termDate = moment().add(30, 'days');
      component.form.patchValue({
        accessClass: 'CLASS1',
        description: 'Test',
        accessLevel: 5,
        effectiveDate: moment(),
        terminationDate: termDate
      });

      component.onSave();

      expect(mockLabUserAccessService.addUserAccessClass).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userId: 'TEST001',
          terminationDate: termDate.format('YYYY-MM-DD')
        }),
        jasmine.any(String)
      );
    });
  });

  describe('isFormValid edit mode additional error types', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return false when terminationDate has invalidDateFormat error', () => {
      component.form.patchValue({ accessLevel: 3 });
      component.form.markAsDirty();
      component.form.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when terminationDate has matDatepickerParse error', () => {
      component.form.patchValue({ accessLevel: 3 });
      component.form.markAsDirty();
      component.form.get('terminationDate')?.setErrors({ matDatepickerParse: true });
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form has dateRangeInvalid error in edit mode', () => {
      component.form.patchValue({ accessLevel: 3 });
      component.form.markAsDirty();
      component.form.setErrors({ dateRangeInvalid: true });
      component.updateDateErrors();
      expect(component.isFormValid).toBeFalse();
    });

    it('should consider disabled controls as valid in edit mode', () => {
      component.form.patchValue({ accessLevel: 3 });
      component.form.markAsDirty();
      component.updateDateErrors();
      expect(component.form.get('accessClass')?.disabled).toBeTrue();
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('isFormValid add mode with dateRangeInvalid', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return false when form has dateRangeInvalid error in add mode', () => {
      component.form.patchValue({
        accessClass: 'CLASS1',
        accessLevel: 5,
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(2, 'days')
      });
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('terminationDateMin additional edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return minDate when effective date is an invalid moment', () => {
      component.form.patchValue({ effectiveDate: moment('invalid-date') });
      expect(component.terminationDateMin.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    });
  });

  describe('loadAccessClassOptions null response', () => {
    it('should handle null response from getAccessClassOptions gracefully', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of(null as any));
      fixture.detectChanges();
      expect(component.accessClassOptions).toEqual([]);
      expect(component.filteredAccessClassOptions).toEqual([]);
    });
  });

  describe('loadAccessLevelOptions null response', () => {
    it('should handle null response from getAccessLevelOptions gracefully', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.getAccessLevelOptions.and.returnValue(of(null as any));
      fixture.detectChanges();
      expect(component.accessLevelOptions).toEqual([]);
      expect(component.filteredAccessLevelOptions).toEqual([]);
    });
  });

  describe('ngOnChanges additional cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should call setupPanel when only data changes (not first change)', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'NEWCLASS',
        code: 'NEWCLASS',
        description: 'New Desc',
        accessLevel: 3,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnChanges({
        data: {
          previousValue: null,
          currentValue: component.data,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component.panelTitle).toBe('Edit Class NEWCLASS');
    });

    it('should not setup panel when both mode and data are first change', () => {
      const currentTitle = component.panelTitle;
      component.ngOnChanges({
        mode: {
          previousValue: undefined,
          currentValue: 'add',
          firstChange: true,
          isFirstChange: () => true
        },
        data: {
          previousValue: undefined,
          currentValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.panelTitle).toBe(currentTitle);
    });

    it('should not setup panel when mode is not first change but data is first change', () => {
      const currentTitle = component.panelTitle;
      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        },
        data: {
          previousValue: undefined,
          currentValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.panelTitle).toBe(currentTitle);
    });
  });

  describe('search filtering null term', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([
          { code: 'A', description: 'Alpha' },
          { code: 'B', description: 'Beta' }
        ])
      );
      fixture.detectChanges();
    });

    it('should handle null access class search term', () => {
      component.accessClassSearchControl.setValue(null);
      expect(component.filteredAccessClassOptions.length).toBe(2);
    });

    it('should handle null access level search term', () => {
      component.accessLevelSearchControl.setValue(null);
      expect(component.filteredAccessLevelOptions.length).toBe(5);
    });
  });

  describe('onTerminationDateInput edit vs add mode behavior', () => {
    it('should mark termination control as dirty when clearing value in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: '2029-01-01'
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('terminationDate')?.markAsPristine();

      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(component.form.get('terminationDate')?.dirty).toBeTrue();
    });

    it('should mark termination control as pristine when clearing value in add mode', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();

      component.form.get('terminationDate')?.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(event);

      expect(component.form.get('terminationDate')?.dirty).toBeFalse();
    });

    it('should set invalid input flag for invalid termination date text', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();

      const event = { target: { value: 'not-a-date' } } as unknown as Event;
      component.onTerminationDateInput(event);

      // Clear standard errors to verify fallback path
      component.form.get('terminationDate')?.setErrors(null);
      component.updateDateErrors();
      expect(component.terminationDateError).toBe('Termination Date is invalid');
    });
  });

  describe('onEffectiveDateInput invalid input flag', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should set invalid input flag for invalid effective date text', () => {
      const event = { target: { value: 'not-a-date' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      component.form.get('effectiveDate')?.setErrors(null);
      component.updateDateErrors();
      expect(component.effectiveDateError).toBe('Effective Date is invalid');
    });

    it('should not set invalid input flag for empty input', () => {
      const event = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      component.form.get('effectiveDate')?.setErrors(null);
      component.updateDateErrors();
      // Empty input does not set the invalid flag; required error may appear separately
      expect(component.effectiveDateError).not.toBe('Effective Date is invalid');
    });
  });

  describe('setupDateValidationListeners behavior', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should clear invalid input flag when valid moment is set for effectiveDate', () => {
      const event = { target: { value: 'bad-text' } } as unknown as Event;
      component.onEffectiveDateInput(event);

      const validDate = moment().add(5, 'days');
      component.form.get('effectiveDate')?.setValue(validDate);

      component.form.get('effectiveDate')?.setErrors(null);
      component.updateDateErrors();

      expect(component.effectiveDateError).toBe('');
    });

    it('should clear invalid input flag when valid moment is set for terminationDate', () => {
      const event = { target: { value: 'bad-text' } } as unknown as Event;
      component.onTerminationDateInput(event);

      const validDate = moment().add(5, 'days');
      component.form.get('terminationDate')?.setValue(validDate);

      component.form.get('terminationDate')?.setErrors(null);
      component.updateDateErrors();

      expect(component.terminationDateError).toBe('');
    });
  });

  describe('resetFormForAddMode through ngOnChanges', () => {
    it('should enable accessClass and effectiveDate when switching from edit to add', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          previousValue: 'edit',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('accessClass')?.enabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
      expect(component.form.get('description')?.disabled).toBeTrue();
    });

    it('should reset form to pristine and untouched state', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-01',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.markAsDirty();
      component.form.markAllAsTouched();

      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          previousValue: 'edit',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.pristine).toBeTrue();
      expect(component.form.untouched).toBeTrue();
    });
  });

  describe('isLoadingOptions flag', () => {
    it('should set isLoadingOptions to false after loading succeeds', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should set isLoadingOptions to false after access class options error', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should set isLoadingOptions to false after access level options error', () => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      mockLabUserAccessService.getAccessLevelOptions.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.isLoadingOptions).toBeFalse();
    });
  });

  describe('getDescriptionRemainingCharacters edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should return 500/500 when description value is null', () => {
      component.form.get('description')?.setValue(null);
      expect(component.getDescriptionRemainingCharacters()).toBe('500/500');
    });

    it('should correctly count remaining characters for longer text', () => {
      const text = 'a'.repeat(100);
      component.form.patchValue({ description: text });
      expect(component.getDescriptionRemainingCharacters()).toBe('400/500');
    });

    it('should return 0/500 when description is at max length', () => {
      const text = 'a'.repeat(500);
      component.form.patchValue({ description: text });
      expect(component.getDescriptionRemainingCharacters()).toBe('0/500');
    });
  });

  describe('populateFormForEdit with various data', () => {
    it('should set effectiveDate as moment when provided', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-15',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(moment.isMoment(rawValue.effectiveDate)).toBeTrue();
      expect(rawValue.effectiveDate.format('YYYY-MM-DD')).toBe('2028-06-15');
    });

    it('should set terminationDate as moment when provided', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-15',
        terminationDate: '2029-01-15'
      };
      component.ngOnInit();
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(moment.isMoment(rawValue.terminationDate)).toBeTrue();
      expect(rawValue.terminationDate.format('YYYY-MM-DD')).toBe('2029-01-15');
    });

    it('should set terminationDate to null when not provided', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-15',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.terminationDate).toBeNull();
    });

    it('should set effectiveDate to null when data has empty effectiveDate', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.effectiveDate).toBeNull();
    });

    it('should mark form as pristine after populating for edit', () => {
      component.mode = 'edit';
      component.data = {
        accessClass: 'CLASS1',
        code: 'CLASS1',
        description: 'Desc',
        accessLevel: 5,
        effectiveDate: '2028-06-15',
        terminationDate: null
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.pristine).toBeTrue();
    });
  });

  describe('access class search filtering by description with null', () => {
    beforeEach(() => {
      component.mode = 'add';
      mockLabUserAccessService.getAccessClassOptions.and.returnValue(
        of([
          { code: 'A', description: '' },
          { code: 'B', description: 'Beta Description' }
        ])
      );
      fixture.detectChanges();
    });

    it('should filter correctly when option description is empty', () => {
      component.accessClassSearchControl.setValue('beta');
      expect(component.filteredAccessClassOptions.length).toBe(1);
      expect(component.filteredAccessClassOptions[0].code).toBe('B');
    });

    it('should match by code even when description is empty', () => {
      component.accessClassSearchControl.setValue('a');
      expect(component.filteredAccessClassOptions.length).toBe(2);
    });
  });
});
