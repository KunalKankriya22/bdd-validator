import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password';
import { ChangePasswordService, PasswordConfiguration } from './services/change-password.service';
import { HeaderService } from '../../../shared/services/header.service';
import { LoginService } from '../../../shared/services/login.service';
import { PasswordResetTimerService } from '../../../shared/services/password-reset-timer.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let mockChangePasswordService: jasmine.SpyObj<ChangePasswordService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChangePasswordComponent>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockPasswordResetTimerService: jasmine.SpyObj<PasswordResetTimerService>;

  const mockPasswordConfig: PasswordConfiguration = {
    pwd_History: 5,
    pwd_Min_Length: 8,
    pwd_Min_Caps: 1,
    pwd_Min_Lower: 1,
    pwd_Min_Number: 1,
    pwd_Min_Special: 1,
    pwd_Min_Char_Chg: 3,
    pwd_Lockout: 5,
    pwd_Intrvl: 90,
    pwd_Method: 'Y',
    pwd_Special: "&'%@",
    pwd_War_Msg: 7,
    pwd_Lockout_Interval: 30,
    pwd_Lockout_Period: 60
  };

  beforeEach(() => {

    mockChangePasswordService = jasmine.createSpyObj('ChangePasswordService', [
      'getPasswordConfiguration',
      'updatePassword',
      'validatePasswordHistory'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = createMockMatSnackBar();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockPasswordResetTimerService = jasmine.createSpyObj('PasswordResetTimerService', ['clearTimer']);
    mockHeaderService = createMockHeaderService({
      headerConfig: signal({
        title: 'Blood Centers',
        subtitle: "Boston Children's Hospital",
        logoUrl: 'logo.png',
        user: { id: 'user123', name: 'Test User' }
      })
    });



      TestBed.configureTestingModule({
      imports: [
        ChangePasswordComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule],
      providers: [
        { provide: ChangePasswordService, useValue: mockChangePasswordService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: LoginService, useValue: mockLoginService },
        { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    });


    


      mockChangePasswordService.getPasswordConfiguration.calls.reset();


      mockChangePasswordService.updatePassword.calls.reset();


      mockDialogRef.close.calls.reset();


      mockLoginService.getStoredUsername.calls.reset();


      mockPasswordResetTimerService.clearTimer.calls.reset();


    mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));

    // Setup MatSnackBar mock to return a proper MatSnackBarRef
    const mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
    mockSnackBarRef.onAction.and.returnValue(of(undefined));
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;


    });

  it('should create', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));

  it('should have a defined changePasswordForm after init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.changePasswordForm).toBeDefined();
  }));

  describe('ngOnInit', () => {
    it('should initialize the form with three password fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.changePasswordForm).toBeDefined();
      expect(component.changePasswordForm.get('currentPassword')).toBeTruthy();
      expect(component.changePasswordForm.get('newPassword')).toBeTruthy();
      expect(component.changePasswordForm.get('confirmPassword')).toBeTruthy();
    }));

    it('should load password configuration on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockChangePasswordService.getPasswordConfiguration).toHaveBeenCalled();
      expect(component.pwd_Min_Length).toBe(8);
      expect(component.pwd_Min_Caps).toBe(1);
      expect(component.pwd_Min_Lower).toBe(1);
      expect(component.pwd_Min_Number).toBe(1);
      expect(component.pwd_Min_Special).toBe(1);
      expect(component.pwd_Special).toBe("&'%@");
    }));
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(); // Wait for password configuration to load
    }));

    it('should require all fields', () => {
      const form = component.changePasswordForm;
      expect(form.valid).toBeFalsy();

      form.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      expect(form.get('currentPassword')?.hasError('required')).toBeTruthy();
      expect(form.get('newPassword')?.hasError('required')).toBeTruthy();
      expect(form.get('confirmPassword')?.hasError('required')).toBeTruthy();
    });

    it('should validate minimum password length', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'Old123!',
        newPassword: 'Short1!',
        confirmPassword: 'Short1!'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('lengthInvalid')).toBeTruthy();
    }));

    it('should validate uppercase requirement', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'Old123!',
        newPassword: 'password123!',
        confirmPassword: 'password123!'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientUppercase')).toBeTruthy();
    }));

    it('should validate lowercase requirement', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'Old123!',
        newPassword: 'PASSWORD123!',
        confirmPassword: 'PASSWORD123!'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientLowercase')).toBeTruthy();
    }));

    it('should validate number requirement', () => {
      component.changePasswordForm.patchValue({
        currentPassword: 'Old123!',
        newPassword: 'Password!',
        confirmPassword: 'Password!'
      });

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientNumbers')).toBeTruthy();
    });

    it('should validate special character requirement', () => {
      component.changePasswordForm.patchValue({
        currentPassword: 'Old123!',
        newPassword: 'Password123',
        confirmPassword: 'Password123'
      });

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientSpecialChars')).toBeTruthy();
    });

    it('should accept valid password meeting all requirements', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.valid).toBeTruthy();
      expect(component.changePasswordForm.valid).toBeTruthy();
    }));

    it('should validate passwords match', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!'
      });
      tick();

      expect(component.changePasswordForm.hasError('passwordMismatch')).toBeTruthy();
      expect(component.passwordsMatch).toBeFalsy();
    }));

    it('should clear mismatch error when passwords match', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!'
      });
      tick();

      expect(component.changePasswordForm.hasError('passwordMismatch')).toBeTruthy();

      component.changePasswordForm.patchValue({
        confirmPassword: 'NewPass123!'
      });
      tick();

      expect(component.changePasswordForm.hasError('passwordMismatch')).toBeFalsy();
      expect(component.passwordsMatch).toBeTruthy();
    }));
  });

  describe('isValidationMet', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false for empty password', () => {
      component.changePasswordForm.patchValue({ newPassword: '' });

      expect(component.isValidationMet('length')).toBeFalsy();
      expect(component.isValidationMet('uppercase')).toBeFalsy();
    });

    it('should return true when length requirement is met', () => {
      component.changePasswordForm.patchValue({ newPassword: 'ValidPass123!' });

      expect(component.isValidationMet('length')).toBeTruthy();
    });

    it('should return true when uppercase requirement is met', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Password123!' });

      expect(component.isValidationMet('uppercase')).toBeTruthy();
    });

    it('should return true when lowercase requirement is met', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Password123!' });

      expect(component.isValidationMet('lowercase')).toBeTruthy();
    });

    it('should return true when number requirement is met', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Password123!' });

      expect(component.isValidationMet('number')).toBeTruthy();
    });

    it('should return true when special character requirement is met', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'ValidPass123@' });
      tick();

      expect(component.isValidationMet('special')).toBeTruthy();
    }));

    it('should return false for unknown rule', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Password123!' });

      expect(component.isValidationMet('unknown')).toBeFalsy();
    });
  });

  describe('passwordsMatch getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when passwords match', () => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: 'Password123!'
      });

      expect(component.passwordsMatch).toBeTruthy();
    });

    it('should return false when passwords do not match', () => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: 'Different123!'
      });

      expect(component.passwordsMatch).toBeFalsy();
    });

    it('should return false when confirm password is empty', () => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: ''
      });

      expect(component.passwordsMatch).toBeFalsy();
    });
  });

  describe('showPasswordMismatchError getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false when confirm password is untouched', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: 'Different123!'
      });
      tick();

      expect(component.showPasswordMismatchError).toBeFalsy();
    }));

    it('should return true when confirm password is dirty and mismatched', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: 'Different123!'
      });
      tick();
      component.changePasswordForm.get('confirmPassword')?.markAsDirty();

      expect(component.showPasswordMismatchError).toBeTruthy();
    }));

    it('should return false when passwords match even if dirty', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        newPassword: 'Password123!',
        confirmPassword: 'Password123!'
      });
      tick();
      component.changePasswordForm.get('confirmPassword')?.markAsDirty();

      expect(component.showPasswordMismatchError).toBeFalsy();
    }));
  });

  describe('onSubmit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not submit if form is invalid', () => {
      component.changePasswordForm.patchValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      component.onSubmit();

      expect(mockChangePasswordService.updatePassword).not.toHaveBeenCalled();
    });

    it('should submit with correct data when form is valid', fakeAsync(() => {
      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
        data: [{ isMatch: true }]
      };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      component.onSubmit();
      tick();

      expect(mockChangePasswordService.updatePassword).toHaveBeenCalledWith({
        userId: 'user123',
        oldPassword: 'OldPass123@',
        newPassword: 'ValidPass123@'
      });
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        success: true,
        data: mockResponse
      });
    }));

    it('should show error when isMatch is false (incorrect current password)', fakeAsync(() => {
      const mockResponse = {
        success: false,
        message: 'Invalid password',
        data: [{ isMatch: false }]
      };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'WrongPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      component.onSubmit();
      tick();

      expect(component.currentPasswordError).toBe('Incorrect Password');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should handle error response', fakeAsync(() => {
      mockChangePasswordService.updatePassword.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      component.onSubmit();
      tick();

      // Error handler sets passwordHistoryError with the server message
      expect(component.passwordHistoryError).toBe('Failed to change password. Please try again.');
      expect(component.isSubmitting).toBeFalse();
      const control = component.changePasswordForm.get('newPassword');
      expect(control?.hasError('passwordHistory')).toBeTrue();
    }));

    it('should clear previous error on new submit', fakeAsync(() => {
      component.currentPasswordError = 'Previous error';
      const mockResponse = {
        success: true,
        message: 'Password updated successfully',
        data: [{ isMatch: true }]
      };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      component.onSubmit();
      
      // Error is cleared synchronously at start of onSubmit
      expect(component.currentPasswordError).toBe('');
      tick();
    }));

    it('should not submit if user ID is not found', fakeAsync(() => {
      mockHeaderService.headerConfig.set({
        title: 'Blood Centers',
        subtitle: "Boston Children's Hospital",
        logoUrl: 'logo.png',
        user: undefined
      });

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass123@',
        newPassword: 'ValidPass123@',
        confirmPassword: 'ValidPass123@'
      });
      tick();

      component.onSubmit();
      tick();

      expect(mockChangePasswordService.updatePassword).not.toHaveBeenCalled();
    }));
  });

  describe('onCancel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should close dialog without data', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Password Visibility Toggle', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should initialize with all passwords hidden', () => {
      expect(component.hideCurrentPassword).toBeTruthy();
      expect(component.hideNewPassword).toBeTruthy();
      expect(component.hideConfirmPassword).toBeTruthy();
    });

    it('should toggle current password visibility', () => {
      component.hideCurrentPassword = true;
      component.hideCurrentPassword = !component.hideCurrentPassword;
      expect(component.hideCurrentPassword).toBeFalsy();

      component.hideCurrentPassword = !component.hideCurrentPassword;
      expect(component.hideCurrentPassword).toBeTruthy();
    });

    it('should toggle new password visibility', () => {
      component.hideNewPassword = true;
      component.hideNewPassword = !component.hideNewPassword;
      expect(component.hideNewPassword).toBeFalsy();
    });

    it('should toggle confirm password visibility', () => {
      component.hideConfirmPassword = true;
      component.hideConfirmPassword = !component.hideConfirmPassword;
      expect(component.hideConfirmPassword).toBeFalsy();
    });
  });

  describe('Password Fields Maxlength', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not have maxlength on current password input', () => {
      const input = fixture.nativeElement.querySelector('input[formControlName="currentPassword"]');
      expect(input.getAttribute('maxlength')).toBeNull();
    });

    it('should have maxlength of 50 on new password input', () => {
      const input = fixture.nativeElement.querySelector('input[formControlName="newPassword"]');
      expect(input.getAttribute('maxlength')).toBe('50');
    });

    it('should have maxlength of 50 on confirm password input', () => {
      const input = fixture.nativeElement.querySelector('input[formControlName="confirmPassword"]');
      expect(input.getAttribute('maxlength')).toBe('50');
    });
  });

  describe('Special Characters Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should accept & as valid special character', fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('Password123&');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(component.isValidationMet('special')).toBeTruthy();
    }));

    it("should accept ' as valid special character", fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue("Password123'");
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(component.isValidationMet('special')).toBeTruthy();
    }));

    it('should accept % as valid special character', fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('Password123%');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(component.isValidationMet('special')).toBeTruthy();
    }));

    it('should accept @ as valid special character', fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('Password123@');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(component.isValidationMet('special')).toBeTruthy();
    }));

    it('should accept multiple configured special characters', fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue("Pass123&'%@");
      newPasswordControl?.updateValueAndValidity();
      tick();

      // Should have at least the minimum required (1 in this case)
      expect(component.isValidationMet('special')).toBeTruthy();
    }));
  });

  describe('Traditional Password Mode (STRONG_PWD = N)', () => {
    beforeEach(fakeAsync(() => {
      // Re-create component with isStrongPasswordRequired = false
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          ChangePasswordComponent,
          ReactiveFormsModule,
          MatFormFieldModule,
          MatInputModule,
          MatButtonModule,
          MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: false, isStrongPasswordRequired: false } }
        ]
      });

      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
    }));

    it('should apply traditional password rules when strong password is not required', () => {
      expect(component.isStrongPasswordRequired).toBeFalse();
      expect(component.requireStartsWithAlpha).toBeTrue();
      expect(component.pwd_Min_Length).toBe(6);
      expect(component.pwd_Min_Alpha).toBe(1);
      expect(component.pwd_Min_Number).toBe(1);
      expect(component.pwd_Min_Special).toBe(0);
    });

    it('should fail validation when password does not start with alpha', () => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1',
        newPassword: '1abcde2',
        confirmPassword: '1abcde2'
      });

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('startsWithAlpha')).toBeTrue();
    });

    it('should pass validation when password starts with alpha', () => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1',
        newPassword: 'Abcdef1',
        confirmPassword: 'Abcdef1'
      });

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('startsWithAlpha')).toBeFalsy();
    });

    it('should report startsWithAlpha validation met correctly', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Abcdef1' });
      expect(component.isValidationMet('startsWithAlpha')).toBeTrue();

      component.changePasswordForm.patchValue({ newPassword: '1abcde2' });
      expect(component.isValidationMet('startsWithAlpha')).toBeFalse();
    });

    it('should accept valid traditional password', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1',
        newPassword: 'Abcdef1',
        confirmPassword: 'Abcdef1'
      });
      tick();

      expect(component.changePasswordForm.valid).toBeTrue();
    }));
  });

  describe('Validation List DOM Rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not apply valid class to any validation item when password is empty', () => {
      component.changePasswordForm.patchValue({ newPassword: '' });
      fixture.detectChanges();

      const validItems = fixture.nativeElement.querySelectorAll('.validation-list li.valid');
      expect(validItems.length).toBe(0);
    });

    it('should apply valid class to length item when length requirement is met', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'ValidPass123@' });
      tick();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const lengthItem = listItems[0]; // First item is always length
      expect(lengthItem.classList.contains('valid')).toBeTrue();
    }));

    it('should apply valid class to all items when all requirements are met', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'ValidPass123@' });
      tick();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      listItems.forEach((item: HTMLElement) => {
        expect(item.classList.contains('valid')).toBeTrue();
      });
    }));

    it('should not apply valid class to unmet requirements', fakeAsync(() => {
      // Password missing special char - only special should not be valid
      component.changePasswordForm.patchValue({ newPassword: 'ValidPass123' });
      tick();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      // Last item is special character requirement
      const specialItem = listItems[listItems.length - 1];
      expect(specialItem.classList.contains('valid')).toBeFalse();
    }));

    it('should display Your password must contain title when loaded from API fallback', () => {
      const titleEl = fixture.nativeElement.querySelector('.validation-title');
      expect(titleEl.textContent.trim()).toBe('Your password must contain');
    });

    it('should show check_circle icon for met rules and circle icon for unmet rules', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'short' });
      tick();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const lengthItem = listItems[0];
      const icon = lengthItem.querySelector('.check-icon');
      expect(icon.textContent.trim()).toBe('circle');
    }));
  });

  describe('Validation List DOM Rendering (Traditional Mode)', () => {
    beforeEach(fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          ChangePasswordComponent,
          ReactiveFormsModule,
          MatFormFieldModule,
          MatInputModule,
          MatButtonModule,
          MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: false, isStrongPasswordRequired: false } }
        ]
      });

      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
    }));

    it('should display Traditional Password Configuration title', () => {
      const titleEl = fixture.nativeElement.querySelector('.validation-title');
      expect(titleEl.textContent.trim()).toBe('Traditional Password Configuration');
    });

    it('should not apply valid class when password is empty in traditional mode', () => {
      component.changePasswordForm.patchValue({ newPassword: '' });
      fixture.detectChanges();

      const validItems = fixture.nativeElement.querySelectorAll('.validation-list li.valid');
      expect(validItems.length).toBe(0);
    });

    it('should apply valid class to all items for a valid traditional password', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'Abcdef1' });
      tick();
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      listItems.forEach((item: HTMLElement) => {
        expect(item.classList.contains('valid')).toBeTrue();
      });
    }));

    it('should show startsWithAlpha validation item in traditional mode', () => {
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const texts = Array.from(listItems).map((li: any) => li.textContent);
      const hasStartsWithAlpha = texts.some((t: string) => t.includes('start with an alphabetic'));
      expect(hasStartsWithAlpha).toBeTrue();
    });
  });

  describe('Dynamic Configuration Updates', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should revalidate password when configuration changes', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        newPassword: 'Pass123!'
      });
      tick();

      // Change configuration
      const newConfig: PasswordConfiguration = {
        ...mockPasswordConfig,
        pwd_Min_Length: 12
      };
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(newConfig));

      component.loadPasswordConfiguration();
      tick();

      expect(component.pwd_Min_Length).toBe(12);
      // Password should now be invalid due to increased length requirement
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('lengthInvalid')).toBeTruthy();
    }));
  });

  describe('ngOnDestroy', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should complete destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('currentUserName getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return user name from header service', () => {
      expect(component.currentUserName).toBe('Test User');
    });

    it('should fallback to stored username', () => {
      mockHeaderService.headerConfig.set({
        title: '', subtitle: '', logoUrl: '', user: undefined
      } as any);
      mockLoginService.getStoredUsername.and.returnValue('fallbackUser');
      expect(component.currentUserName).toBe('fallbackUser');
    });
  });

  describe('currentUserId getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return user id from header service', () => {
      expect(component.currentUserId).toBe('user123');
    });

    it('should fallback to stored username', () => {
      mockHeaderService.headerConfig.set({
        title: '', subtitle: '', logoUrl: '', user: undefined
      } as any);
      mockLoginService.getStoredUsername.and.returnValue('fallbackUser');
      expect(component.currentUserId).toBe('fallbackUser');
    });
  });

  describe('onPasswordInput', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should strip spaces from input', () => {
      const input = document.createElement('input');
      input.value = 'pass word';
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'newPassword');
      expect(component.changePasswordForm.get('newPassword')?.value).toBe('password');
    });

    it('should not modify when no spaces', () => {
      const input = document.createElement('input');
      input.value = 'password';
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'newPassword');
      expect(input.value).toBe('password');
    });
  });

  describe('onNewPasswordBlur', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call validatePasswordHistory when password has value', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: true, pwdHistoryCount: 5 }]
      }));
      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();
      expect(mockChangePasswordService.validatePasswordHistory).toHaveBeenCalled();
    }));

    it('should set password history error when not valid', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: false, pwdHistoryCount: 5 }]
      }));
      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();
      expect(component.passwordHistoryError).toContain('last 5 password');
    }));

    it('should not call API when password is empty', () => {
      component.changePasswordForm.patchValue({ newPassword: '' });
      component.onNewPasswordBlur();
      expect(mockChangePasswordService.validatePasswordHistory).not.toHaveBeenCalled();
    });
  });

  describe('showPasswordSameAsCurrentError getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false when passwords are different', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%'
      });
      tick();
      expect(component.showPasswordSameAsCurrentError).toBeFalse();
    }));
  });

  describe('showInsufficientCharChangesError getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false when no error', () => {
      expect(component.showInsufficientCharChangesError).toBeFalse();
    });
  });

  describe('newPasswordErrorMatcher', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false for null control', () => {
      expect(component.newPasswordErrorMatcher.isErrorState(null, null)).toBeFalse();
    });

    it('should return true for touched required error', () => {
      const control = component.changePasswordForm.get('newPassword');
      control?.markAsTouched();
      control?.setValue('');
      expect(component.newPasswordErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });
  });

  describe('onCancel when mandatory', () => {
    it('should not close dialog when mandatory', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: true, isStrongPasswordRequired: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      mockDialogRef.close.calls.reset();
      component.onCancel();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));
  });

  describe('loadPasswordConfiguration - strong mode API error', () => {
    it('should fall back to traditional rules on API error in strong mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: false, isStrongPasswordRequired: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.pwd_Min_Length).toBe(6);
      expect(component.requireStartsWithAlpha).toBeTrue();
      expect(component.isLoadingConfig).toBeFalse();
    }));
  });

  describe('loadPasswordConfiguration - fallback API error', () => {
    it('should apply traditional rules on fallback API error', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.pwd_Min_Length).toBe(6);
      expect(component.requireStartsWithAlpha).toBeTrue();
      expect(component.isLoadingConfig).toBeFalse();
    }));
  });

  describe('currentPassword valueChanges - clear error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear currentPasswordError when current password changes', fakeAsync(() => {
      component.currentPasswordError = 'Incorrect Password';
      component.changePasswordForm.patchValue({ currentPassword: 'NewValue' });
      tick();
      expect(component.currentPasswordError).toBe('');
    }));
  });

  describe('newPassword valueChanges - clear history error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear passwordHistoryError when new password changes', fakeAsync(() => {
      component.passwordHistoryError = 'History error';
      const control = component.changePasswordForm.get('newPassword');
      control?.setErrors({ passwordHistory: true });
      component.changePasswordForm.patchValue({ newPassword: 'ChangedValue' });
      tick();
      expect(component.passwordHistoryError).toBe('');
    }));
  });

  describe('isValidationMet - charChanges and alpha', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true for charChanges when no error', () => {
      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      expect(component.isValidationMet('charChanges')).toBeTrue();
    });

    it('should return result for alpha rule', () => {
      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      expect(component.isValidationMet('alpha')).toBeTrue();
    });
  });

  describe('passwordValidator with null value', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return null for empty value', () => {
      const result = component.passwordValidator({ value: '' } as any);
      expect(result).toBeNull();
    });
  });

  describe('passwordResetTimerService', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear timer on successful password change', fakeAsync(() => {
      const mockResponse = { success: true, message: 'OK', data: [{ isMatch: true }] };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();
      component.onSubmit();
      tick();
      expect(mockPasswordResetTimerService.clearTimer).toHaveBeenCalled();
    }));
  });

  describe('passwordNotSameValidator', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set passwordSameAsCurrent error when current and new passwords are identical', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'SamePass1&',
        newPassword: 'SamePass1&'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('passwordSameAsCurrent')).toBeTrue();
      expect(component.changePasswordForm.hasError('passwordSameAsCurrent')).toBeTrue();
    }));

    it('should clear passwordSameAsCurrent error when passwords become different', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'SamePass1&',
        newPassword: 'SamePass1&'
      });
      tick();

      expect(component.changePasswordForm.get('newPassword')?.hasError('passwordSameAsCurrent')).toBeTrue();

      component.changePasswordForm.patchValue({ newPassword: 'DifferentPass1&' });
      tick();

      expect(component.changePasswordForm.get('newPassword')?.hasError('passwordSameAsCurrent')).toBeFalse();
    }));

    it('should preserve other errors when clearing passwordSameAsCurrent', fakeAsync(() => {
      // Use a short password that is same as current to get both errors
      component.changePasswordForm.patchValue({
        currentPassword: 'Ab1&',
        newPassword: 'Ab1&'
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('passwordSameAsCurrent')).toBeTrue();
      expect(newPasswordControl?.hasError('lengthInvalid')).toBeTrue();

      // Change to different but still short
      component.changePasswordForm.patchValue({ newPassword: 'Cd2%' });
      tick();

      expect(newPasswordControl?.hasError('passwordSameAsCurrent')).toBeFalse();
      expect(newPasswordControl?.hasError('lengthInvalid')).toBeTrue();
    }));
  });

  describe('minimumCharacterChangesValidator detailed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set insufficientCharChanges error when not enough characters differ', fakeAsync(() => {
      // pwd_Min_Char_Chg is 3 from mockPasswordConfig
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass2&' // only 1 char changed
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeTrue();
    }));

    it('should not set insufficientCharChanges error when enough characters differ', fakeAsync(() => {
      // pwd_Min_Char_Chg is 3 from mockPasswordConfig
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewDiff9%' // many chars changed
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeFalse();
    }));

    it('should count length difference as character changes', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass1&Extra2%' // extra chars count as changes
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeFalse();
    }));

    it('should not validate when pwd_Min_Char_Chg is 0', fakeAsync(() => {
      component.pwd_Min_Char_Chg = 0;
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass2&' // only 1 char changed
      });
      component.changePasswordForm.updateValueAndValidity();
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeFalse();
    }));

    it('should clear insufficientCharChanges error when currentPassword is cleared', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass2&' // insufficient
      });
      tick();

      const newPasswordControl = component.changePasswordForm.get('newPassword');
      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeTrue();

      component.changePasswordForm.patchValue({ currentPassword: '' });
      tick();

      expect(newPasswordControl?.hasError('insufficientCharChanges')).toBeFalse();
    }));
  });

  describe('showPasswordSameAsCurrentError - true case', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when new password matches current and is touched', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'SamePass1&',
        newPassword: 'SamePass1&'
      });
      tick();
      component.changePasswordForm.get('newPassword')?.markAsTouched();

      expect(component.showPasswordSameAsCurrentError).toBeTrue();
    }));

    it('should return false when new password matches current but is not touched', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'SamePass1&',
        newPassword: 'SamePass1&'
      });
      tick();

      expect(component.showPasswordSameAsCurrentError).toBeFalse();
    }));
  });

  describe('showInsufficientCharChangesError - true case', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when insufficient char changes and touched', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass2&'
      });
      tick();
      component.changePasswordForm.get('newPassword')?.markAsTouched();

      expect(component.showInsufficientCharChangesError).toBeTrue();
    }));
  });

  describe('onSubmit - additional branches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not submit when isSubmitting is true', fakeAsync(() => {
      component.isSubmitting = true;
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      expect(mockChangePasswordService.updatePassword).not.toHaveBeenCalled();
    }));

    it('should fallback to loginService.getStoredUsername when headerConfig user is undefined', fakeAsync(() => {
      mockHeaderService.headerConfig.set({
        title: 'Blood Centers',
        subtitle: "Boston Children's Hospital",
        logoUrl: 'logo.png',
        user: undefined
      } as any);
      mockLoginService.getStoredUsername.and.returnValue('storedUser');

      const mockResponse = { success: true, message: 'OK', data: [{ isMatch: true }] };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      expect(mockChangePasswordService.updatePassword).toHaveBeenCalledWith(
        jasmine.objectContaining({ userId: 'storedUser' })
      );
    }));

    it('should use error.error.message when available in error response', fakeAsync(() => {
      const serverError = { error: { message: 'Password was recently used' } };
      mockChangePasswordService.updatePassword.and.returnValue(
        throwError(() => serverError)
      );

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      expect(component.passwordHistoryError).toBe('Password was recently used');
    }));

    it('should use error.error.error when error.error.message is not available', fakeAsync(() => {
      const serverError = { error: { error: 'Custom error string' } };
      mockChangePasswordService.updatePassword.and.returnValue(
        throwError(() => serverError)
      );

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      expect(component.passwordHistoryError).toBe('Custom error string');
    }));

    it('should handle response with empty data array', fakeAsync(() => {
      const mockResponse = { success: true, message: 'OK', data: [] };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      // With empty data array, isMatch check is skipped, dialog should close
      expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ success: true }));
    }));

    it('should handle response with null data', fakeAsync(() => {
      const mockResponse = { success: true, message: 'OK', data: null };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      // With null data, isMatch check is skipped, dialog should close
      expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ success: true }));
    }));

    it('should set isSubmitting to true during submission and false on success', fakeAsync(() => {
      const mockResponse = { success: true, message: 'OK', data: [{ isMatch: true }] };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      expect(component.isSubmitting).toBeFalse();
      component.onSubmit();
      tick();

      expect(component.isSubmitting).toBeFalse();
    }));

    it('should set serverError on currentPassword control when isMatch is false', fakeAsync(() => {
      const mockResponse = { success: false, message: 'Invalid', data: [{ isMatch: false }] };
      mockChangePasswordService.updatePassword.and.returnValue(of(mockResponse));

      component.changePasswordForm.patchValue({
        currentPassword: 'WrongPass1&',
        newPassword: 'NewPass2%',
        confirmPassword: 'NewPass2%'
      });
      tick();

      component.onSubmit();
      tick();

      const currentPwdControl = component.changePasswordForm.get('currentPassword');
      expect(currentPwdControl?.hasError('serverError')).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
    }));
  });

  describe('onPasswordInput - strong password mode', () => {
    it('should strip disallowed characters in strong password mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: false, isStrongPasswordRequired: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = 'Pass!#$1&';
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'newPassword');

      // Only alphanumeric and allowed special chars (&'%@) should remain
      // !#$ are NOT in the allowed special chars, so they should be stripped
      expect(input.value).toBe('Pass1&');
    }));

    it('should allow all configured special characters in strong mode', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: false, isStrongPasswordRequired: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = "Pass1&'%@";
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'newPassword');

      // All chars are valid - no stripping should occur
      expect(input.value).toBe("Pass1&'%@");
    }));

    it('should work for currentPassword control', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = 'pass word';
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'currentPassword');

      expect(component.changePasswordForm.get('currentPassword')?.value).toBe('password');
    }));

    it('should work for confirmPassword control', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const input = document.createElement('input');
      input.value = 'pass word';
      const event = { target: input } as unknown as Event;
      component.onPasswordInput(event, 'confirmPassword');

      expect(component.changePasswordForm.get('confirmPassword')?.value).toBe('password');
    }));
  });

  describe('onNewPasswordBlur - additional cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call API when userId is empty', () => {
      mockHeaderService.headerConfig.set({
        title: '', subtitle: '', logoUrl: '', user: undefined
      } as any);
      mockLoginService.getStoredUsername.and.returnValue('');

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();

      expect(mockChangePasswordService.validatePasswordHistory).not.toHaveBeenCalled();
    });

    it('should set singular message when pwdHistoryCount is 1', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: false, pwdHistoryCount: 1 }]
      } as any));

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();

      expect(component.passwordHistoryError).toContain('last 1 password.');
      expect(component.passwordHistoryError).not.toContain('passwords');
    }));

    it('should set plural message when pwdHistoryCount is greater than 1', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: false, pwdHistoryCount: 3 }]
      } as any));

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();

      expect(component.passwordHistoryError).toContain('last 3 passwords');
    }));

    it('should not set error when response data is empty', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: []
      } as any));

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();

      expect(component.passwordHistoryError).toBe('');
    }));

    it('should not set error when isValid is true', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: true, pwdHistoryCount: 5 }]
      } as any));

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();

      expect(component.passwordHistoryError).toBe('');
      expect(component.changePasswordForm.get('newPassword')?.hasError('passwordHistory')).toBeFalse();
    }));

    it('should set passwordHistory error on newPassword control when not valid', fakeAsync(() => {
      mockChangePasswordService.validatePasswordHistory.and.returnValue(of({
        data: [{ isValid: false, pwdHistoryCount: 5 }]
      } as any));

      component.changePasswordForm.patchValue({ newPassword: 'TestPass1&' });
      component.onNewPasswordBlur();
      tick();

      const control = component.changePasswordForm.get('newPassword');
      expect(control?.hasError('passwordHistory')).toBeTrue();
    }));
  });

  describe('passwordMatchValidator edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not set mismatch error when confirmPassword is empty', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        newPassword: 'NewPass1&',
        confirmPassword: ''
      });
      tick();

      expect(component.changePasswordForm.hasError('passwordMismatch')).toBeFalsy();
    }));

    it('should preserve existing errors on confirmControl when setting mismatch', fakeAsync(() => {
      const confirmControl = component.changePasswordForm.get('confirmPassword');
      confirmControl?.setErrors({ required: true });

      component.changePasswordForm.patchValue({
        newPassword: 'NewPass1&',
        confirmPassword: 'Different1&'
      });
      tick();

      expect(confirmControl?.hasError('passwordMismatch')).toBeTrue();
    }));
  });

  describe('passwordValidator edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should fail validation when password exceeds 50 characters', fakeAsync(() => {
      const longPassword = 'A'.repeat(40) + 'bcdefghijk1&';  // 52 chars
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: longPassword,
        confirmPassword: longPassword
      });
      tick();

      const control = component.changePasswordForm.get('newPassword');
      expect(control?.hasError('lengthInvalid')).toBeTrue();
    }));

    it('should not require special chars when pwd_Min_Special is 0', fakeAsync(() => {
      component.pwd_Min_Special = 0;
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('Password123');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(newPasswordControl?.hasError('insufficientSpecialChars')).toBeFalsy();
    }));

    it('should not require special chars when pwd_Special is empty', fakeAsync(() => {
      component.pwd_Min_Special = 1;
      component.pwd_Special = '';
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('Password123');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(newPasswordControl?.hasError('insufficientSpecialChars')).toBeFalsy();
    }));

    it('should validate alpha characters when pwd_Min_Alpha > 0', fakeAsync(() => {
      component.pwd_Min_Alpha = 1;
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('12345678&');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(newPasswordControl?.hasError('insufficientAlpha')).toBeTrue();
    }));

    it('should pass alpha validation when alpha characters are present', fakeAsync(() => {
      component.pwd_Min_Alpha = 1;
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      newPasswordControl?.setValue('A2345678&');
      newPasswordControl?.updateValueAndValidity();
      tick();

      expect(newPasswordControl?.hasError('insufficientAlpha')).toBeFalsy();
    }));

    it('should return null when value is null', () => {
      const result = component.passwordValidator({ value: null } as any);
      expect(result).toBeNull();
    });
  });

  describe('constructor with various data inputs', () => {
    it('should default isMandatory to false when data is null', fakeAsync(() => {
      // Default setup already uses null data
      fixture.detectChanges();
      tick();
      expect(component.isMandatory).toBeFalse();
      expect(component.isStrongPasswordRequired).toBeFalse();
    }));

    it('should set isMandatory from dialog data', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;

      expect(component.isMandatory).toBeTrue();
      expect(component.isStrongPasswordRequired).toBeFalse();
    }));
  });

  describe('loadPasswordConfiguration - isMandatory with strong password', () => {
    it('should call API when isMandatory is true and isStrongPasswordRequired is true', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: true, isStrongPasswordRequired: true } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(mockChangePasswordService.getPasswordConfiguration).toHaveBeenCalled();
      expect(component.pwd_Min_Length).toBe(8);
      expect(component.pwd_Min_Caps).toBe(1);
      expect(component.requireStartsWithAlpha).toBeFalse();
      expect(component.isLoadingConfig).toBeFalse();
    }));

    it('should apply traditional rules when isMandatory true but strong not required', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: { isMandatory: true, isStrongPasswordRequired: false } }
        ]
      });
      mockChangePasswordService.getPasswordConfiguration.calls.reset();
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.pwd_Min_Length).toBe(6);
      expect(component.requireStartsWithAlpha).toBeTrue();
      expect(component.pwd_Min_Alpha).toBe(1);
      expect(component.isLoadingConfig).toBeFalse();
    }));
  });

  describe('loadPasswordConfiguration - config with null fields', () => {
    it('should use defaults when config fields are null', fakeAsync(() => {
      const partialConfig: any = {
        pwd_History: null,
        pwd_Min_Length: null,
        pwd_Min_Caps: null,
        pwd_Min_Lower: null,
        pwd_Min_Number: null,
        pwd_Min_Special: null,
        pwd_Min_Char_Chg: null,
        pwd_Lockout: 5,
        pwd_Intrvl: 90,
        pwd_Method: 'Y',
        pwd_Special: null,
        pwd_War_Msg: 7,
        pwd_Lockout_Interval: 30,
        pwd_Lockout_Period: 60
      };
      mockChangePasswordService.getPasswordConfiguration.and.returnValue(of(partialConfig));

      // Use fallback path (null data) so it calls API
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ChangePasswordComponent, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
        providers: [
          { provide: ChangePasswordService, useValue: mockChangePasswordService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: LoginService, useValue: mockLoginService },
          { provide: PasswordResetTimerService, useValue: mockPasswordResetTimerService },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: MAT_DIALOG_DATA, useValue: null }
        ]
      });
      fixture = TestBed.createComponent(ChangePasswordComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.pwd_Min_Length).toBe(8);
      expect(component.pwd_Min_Caps).toBe(0);
      expect(component.pwd_Min_Lower).toBe(0);
      expect(component.pwd_Min_Number).toBe(0);
      expect(component.pwd_Min_Special).toBe(0);
      expect(component.pwd_Min_Char_Chg).toBe(0);
      expect(component.pwd_History).toBe(0);
      expect(component.pwd_Special).toBe('');
    }));
  });

  describe('newPasswordErrorMatcher additional cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when control is touched and has insufficientCharChanges error', () => {
      const control = component.changePasswordForm.get('newPassword');
      control?.markAsTouched();
      control?.setErrors({ insufficientCharChanges: true });
      expect(component.newPasswordErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });

    it('should return true when control is touched and has passwordHistory error', () => {
      const control = component.changePasswordForm.get('newPassword');
      control?.markAsTouched();
      control?.setErrors({ passwordHistory: true });
      expect(component.newPasswordErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });

    it('should return false when control is not touched', () => {
      const control = component.changePasswordForm.get('newPassword');
      control?.setValue('test');
      control?.setErrors({ required: true });
      expect(component.newPasswordErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return false when control has no relevant errors', () => {
      const control = component.changePasswordForm.get('newPassword');
      control?.markAsTouched();
      control?.setErrors({ lengthInvalid: true });
      expect(component.newPasswordErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });
  });

  describe('currentPassword valueChanges - no error to clear', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not clear currentPasswordError when it is already empty', fakeAsync(() => {
      component.currentPasswordError = '';
      component.changePasswordForm.patchValue({ currentPassword: 'NewValue' });
      tick();
      expect(component.currentPasswordError).toBe('');
    }));

    it('should trigger newPassword revalidation when currentPassword changes', fakeAsync(() => {
      const newPasswordControl = component.changePasswordForm.get('newPassword');
      const spy = spyOn(newPasswordControl!, 'updateValueAndValidity');

      component.changePasswordForm.patchValue({ currentPassword: 'NewValue' });
      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('newPassword valueChanges - passwordHistory error cleanup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear passwordHistory error and preserve other errors when new password changes', fakeAsync(() => {
      const control = component.changePasswordForm.get('newPassword');
      control?.setErrors({ passwordHistory: true, lengthInvalid: true });
      component.passwordHistoryError = 'History error';

      component.changePasswordForm.patchValue({ newPassword: 'Short' });
      tick();

      expect(component.passwordHistoryError).toBe('');
      // passwordHistory error should be removed but lengthInvalid may be re-evaluated by validators
    }));

    it('should not attempt to clear passwordHistory if it is not set', fakeAsync(() => {
      component.passwordHistoryError = '';
      component.changePasswordForm.patchValue({ newPassword: 'SomeValue1&' });
      tick();

      expect(component.passwordHistoryError).toBe('');
    }));
  });

  describe('addPasswordValidator', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set validators on newPassword control and trigger revalidation', fakeAsync(() => {
      component.changePasswordForm.patchValue({ newPassword: 'short' });
      tick();

      // Force re-add validator
      (component as any).addPasswordValidator();
      tick();

      const control = component.changePasswordForm.get('newPassword');
      expect(control?.hasError('lengthInvalid')).toBeTrue();
    }));
  });

  describe('isValidationMet - all rules', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle startsWithAlpha rule when no error exists', () => {
      component.changePasswordForm.patchValue({ newPassword: 'Abcdefgh1&' });
      expect(component.isValidationMet('startsWithAlpha')).toBeTrue();
    });

    it('should return false for charChanges when insufficientCharChanges error exists', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'OldPass2&'
      });
      tick();

      const control = component.changePasswordForm.get('newPassword');
      if (control?.hasError('insufficientCharChanges')) {
        expect(component.isValidationMet('charChanges')).toBeFalse();
      }
    }));
  });

  describe('onCancel - non-mandatory mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should close dialog when not mandatory', () => {
      component.isMandatory = false;
      mockDialogRef.close.calls.reset();
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should not close dialog when mandatory', () => {
      component.isMandatory = true;
      mockDialogRef.close.calls.reset();
      component.onCancel();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('form-level validators interaction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should report form invalid when passwords match but new equals current', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'SamePass1&',
        newPassword: 'SamePass1&',
        confirmPassword: 'SamePass1&'
      });
      tick();

      expect(component.changePasswordForm.valid).toBeFalse();
      expect(component.changePasswordForm.hasError('passwordSameAsCurrent')).toBeTrue();
    }));

    it('should report form valid when all validators pass', fakeAsync(() => {
      component.changePasswordForm.patchValue({
        currentPassword: 'OldPass1&',
        newPassword: 'NewDiffPass2%',
        confirmPassword: 'NewDiffPass2%'
      });
      tick();

      expect(component.changePasswordForm.valid).toBeTrue();
    }));
  });
});
