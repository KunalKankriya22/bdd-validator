import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AddEditSystemParameter } from './add-edit-system-parameter';
import { ViewSystemParameterService } from '../services/view-system-parameter.service';
import { SYSTEM_PARAMETER_VALIDATION } from '../constants/validation.constants';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { LoginService } from '@shared/services/login.service';

describe('AddEditSystemParameter', () => {
  let component: AddEditSystemParameter;
  let fixture: ComponentFixture<AddEditSystemParameter>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditSystemParameter>>;
  let serviceSpy: jasmine.SpyObj<ViewSystemParameterService>;

  const setupComponent = (mode: 'add' | 'edit' = 'add', record: any = {}) => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ViewSystemParameterService', ['createSystemParameter', 'updateSystemParameter']);

    TestBed.configureTestingModule({
      imports: [AddEditSystemParameter, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode, record } },
        { provide: MatSnackBar, useValue: createMockMatSnackBar() },
        { provide: ViewSystemParameterService, useValue: serviceSpy },
        { provide: LoginService, useValue: jasmine.createSpyObj('LoginService', ['getStoredUsername']) },
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditSystemParameter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Add mode', () => {
    beforeEach(() => setupComponent('add'));

    it('should set title to Add New Parameter', () => {
      expect(component.title).toBe('Add New Parameter');
    });

    it('should set mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should have required validators on parameterCode', () => {
      component.form.get('parameterCode')?.setValue('');
      expect(component.form.get('parameterCode')?.hasError('required')).toBe(true);
    });

    it('should have required validators on parameterValue', () => {
      component.form.get('parameterValue')?.setValue('');
      expect(component.form.get('parameterValue')?.hasError('required')).toBe(true);
    });

    it('should have required validators on description', () => {
      component.form.get('description')?.setValue('');
      expect(component.form.get('description')?.hasError('required')).toBe(true);
    });

    it('should have required validators on effectiveDate', () => {
      component.form.get('effectiveDate')?.setValue(null);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should have maxLength validator on parameterCode', () => {
      component.form.get('parameterCode')?.setValue('A'.repeat(SYSTEM_PARAMETER_VALIDATION.LIMITS.PARAMETER_CODE_MAX_LENGTH + 1));
      expect(component.form.get('parameterCode')?.hasError('maxlength')).toBe(true);
    });

    it('should have maxLength validator on parameterValue', () => {
      component.form.get('parameterValue')?.setValue('A'.repeat(SYSTEM_PARAMETER_VALIDATION.LIMITS.PARAMETER_VALUE_MAX_LENGTH + 1));
      expect(component.form.get('parameterValue')?.hasError('maxlength')).toBe(true);
    });

    it('should have maxLength validator on description', () => {
      component.form.get('description')?.setValue('A'.repeat(SYSTEM_PARAMETER_VALIDATION.LIMITS.DESCRIPTION_MAX_LENGTH + 1));
      expect(component.form.get('description')?.hasError('maxlength')).toBe(true);
    });

    it('should strip special characters from parameterCode on input', () => {
      const input = { target: { value: 'ABC!@#123_def' } } as unknown as Event;
      component.onParameterCodeInput(input);
      expect(component.form.get('parameterCode')?.value).toBe('ABC123_DEF');
    });

    it('should accept valid parameterCode with alphanumeric and underscores', () => {
      component.form.get('parameterCode')?.setValue('VALID_01');
      expect(component.form.get('parameterCode')?.valid).toBe(true);
    });

    it('should expose validation constants', () => {
      expect(component.V).toBe(SYSTEM_PARAMETER_VALIDATION);
    });
  });

  describe('Edit mode', () => {
    const mockRecord = {
      parameterCode: 'PARM1',
      parameterType: 'ALL',
      parameterValue: 'VALUE1',
      description: 'Test description',
      effectiveDate: '15-JAN-2025',
      terminationDate: null
    };

    beforeEach(() => setupComponent('edit', mockRecord));

    it('should set title to Edit Parameter', () => {
      expect(component.title).toBe('Edit Parameter');
    });

    it('should set mode to edit', () => {
      expect(component.mode).toBe('edit');
    });

    it('should populate parameterCode from record', () => {
      expect(component.form.getRawValue().parameterCode).toBe('PARM1');
    });

    it('should populate form with record values', () => {
      expect(component.form.get('parameterCode')?.value).toBe('PARM1');
      expect(component.form.get('parameterValue')?.value).toBe('VALUE1');
      expect(component.form.get('description')?.value).toBe('Test description');
    });

    describe('isFormValid', () => {
      it('should return false when form is not dirty', () => {
        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when parameterCode has errors', () => {
        component.form.get('parameterCode')?.setValue('');
        component.form.get('parameterCode')?.markAsDirty();
        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when parameterValue has errors', () => {
        component.form.get('parameterValue')?.setValue('');
        component.form.get('parameterValue')?.markAsDirty();
        expect(component.isFormValid()).toBe(false);
      });

      it('should return false when description has errors', () => {
        component.form.get('description')?.setValue('');
        component.form.get('description')?.markAsDirty();
        expect(component.isFormValid()).toBe(false);
      });
    });
  });

  describe('onCancel', () => {
    beforeEach(() => setupComponent('add'));

    it('should close the dialog', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close without returning a result', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('Template structure', () => {
    beforeEach(() => setupComponent('add'));

    it('should render the title in dialog-header', () => {
      const titleEl = fixture.debugElement.query(By.css('.dialog-header .dialog-title'));
      expect(titleEl).toBeTruthy();
      expect(titleEl.nativeElement.textContent.trim()).toBe('Add New Parameter');
    });

    it('should not use mat-dialog-title directive on the title', () => {
      const titleEl = fixture.debugElement.query(By.css('.dialog-title'));
      expect(titleEl.nativeElement.hasAttribute('mat-dialog-title')).toBe(false);
    });

    it('should render close button in header', () => {
      const closeBtn = fixture.debugElement.query(By.css('.dialog-header .close-button'));
      expect(closeBtn).toBeTruthy();
    });

    it('should call onCancel when close button is clicked', () => {
      spyOn(component, 'onCancel');
      const closeBtn = fixture.debugElement.query(By.css('.close-button'));
      closeBtn.nativeElement.click();
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should render dialog-content section', () => {
      const content = fixture.debugElement.query(By.css('.dialog-content'));
      expect(content).toBeTruthy();
    });

    it('should render dialog-actions footer', () => {
      const actions = fixture.debugElement.query(By.css('.dialog-actions'));
      expect(actions).toBeTruthy();
    });

    it('should render CANCEL button in footer', () => {
      const cancelBtn = fixture.debugElement.query(By.css('.dialog-actions .cancel-button'));
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.nativeElement.textContent.trim()).toBe('CANCEL');
    });

    it('should show ADD label on save button in add mode', () => {
      const saveBtn = fixture.debugElement.query(By.css('.dialog-actions button[mat-raised-button]'));
      expect(saveBtn.nativeElement.textContent.trim()).toBe('ADD');
    });
  });

  describe('Template structure - Edit mode', () => {
    beforeEach(() => setupComponent('edit', {
      parameterCode: 'TEST',
      parameterType: 'ALL',
      parameterValue: 'V1',
      description: 'Desc',
      effectiveDate: '15-JAN-2025',
      terminationDate: null
    }));

    it('should render Edit Parameter title', () => {
      const titleEl = fixture.debugElement.query(By.css('.dialog-title'));
      expect(titleEl.nativeElement.textContent.trim()).toBe('Edit Parameter');
    });

    it('should show SAVE label on save button in edit mode', () => {
      const saveBtn = fixture.debugElement.query(By.css('.dialog-actions button[mat-raised-button]'));
      expect(saveBtn.nativeElement.textContent.trim()).toBe('SAVE');
    });
  });

  describe('Error message methods', () => {
    beforeEach(() => setupComponent('add'));

    it('should return required error for parameterCode', () => {
      const control = component.form.get('parameterCode');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getParameterCodeError()).toContain('required');
    });

    it('should return required error for parameterValue', () => {
      const control = component.form.get('parameterValue');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getParameterValueError()).toContain('required');
    });

    it('should return required error for description', () => {
      const control = component.form.get('description');
      control?.setValue('');
      control?.markAsTouched();
      expect(component.getDescriptionError()).toContain('required');
    });
  });

});
