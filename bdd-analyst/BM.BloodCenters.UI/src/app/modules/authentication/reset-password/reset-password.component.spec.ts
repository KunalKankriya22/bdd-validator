import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../shared/services/auth.service';
import { ChangePasswordService, PasswordConfiguration } from '../../system-administration/change-password/services/change-password.service';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() {
    return of({
      VALIDATION: {
        EMAIL: {
          REQUIRED: 'Email address is required',
          INVALID: 'Please enter a valid email address',
          MIN_LENGTH: 'Email is too short'
        }
      }
    });
  }
}

const mockPasswordConfig: PasswordConfiguration = {
  pwd_History: 0,
  pwd_Min_Length: 8,
  pwd_Min_Caps: 1,
  pwd_Min_Lower: 1,
  pwd_Min_Number: 1,
  pwd_Min_Special: 1,
  pwd_Min_Char_Chg: 3,
  pwd_Lockout: 3,
  pwd_Intrvl: 90,
  pwd_Method: 'Y',
  pwd_Special: "&'%@",
  pwd_War_Msg: 7,
  pwd_Lockout_Interval: 0,
  pwd_Lockout_Period: 0
};

function setupTestBed(token: string | null) {
  const authSpy = jasmine.createSpyObj('AuthService', ['resetPasswordWithToken', 'forgotPassword']);
  const changePwdSpy = jasmine.createSpyObj('ChangePasswordService', ['getPasswordConfiguration']);
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

  changePwdSpy.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));

  return TestBed.configureTestingModule({
    imports: [
      ResetPasswordComponent,
      ReactiveFormsModule,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
      })
    ],
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: ChangePasswordService, useValue: changePwdSpy },
      { provide: Router, useValue: routerSpy },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: (key: string) => key === 'token' ? token : null,
              has: (key: string) => key === 'token' && token !== null
            }
          }
        }
      }
    ]
  }).compileComponents();
}

describe('ResetPasswordComponent (with valid token)', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let changePasswordService: jasmine.SpyObj<ChangePasswordService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    await setupTestBed('valid-test-token');

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    changePasswordService = TestBed.inject(ChangePasswordService) as jasmine.SpyObj<ChangePasswordService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with RESET_FORM view state', () => {
    expect(component.viewState()).toBe('RESET_FORM');
  });

  describe('Password Configuration Loading', () => {
    it('should load password configuration on init', fakeAsync(() => {
      tick();
      expect(changePasswordService.getPasswordConfiguration).toHaveBeenCalled();
      expect(component.passwordConfig).toEqual(mockPasswordConfig);
      expect(component.pwd_Min_Length).toBe(8);
      expect(component.pwd_Min_Caps).toBe(1);
      expect(component.pwd_Min_Number).toBe(1);
    }));



    it('should retry loading config successfully after failure', fakeAsync(() => {
      changePasswordService.getPasswordConfiguration.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.loadPasswordConfiguration();
      tick();
      expect(component.configError()).toBe(true);

      changePasswordService.getPasswordConfiguration.and.returnValue(of(mockPasswordConfig));
      component.loadPasswordConfiguration();
      tick();

      expect(component.configError()).toBe(false);
      expect(component.passwordConfig).toEqual(mockPasswordConfig);
    }));
  });

  describe('Form Initialization', () => {

    it('should have newPassword as required', () => {
      const control = component.resetPasswordForm.get('newPassword');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should have confirmPassword as required', () => {
      const control = component.resetPasswordForm.get('confirmPassword');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('Password Validation (API config driven)', () => {
    beforeEach(fakeAsync(() => {
      tick(); // wait for config to load
    }));

    it('should fail length when too short', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Ab1&');
      expect(component.isValidationMet('length')).toBe(false);
    });

    it('should pass length when within range', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Abcdefg1&');
      expect(component.isValidationMet('length')).toBe(true);
    });

    it('should fail number when insufficient digits', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Abcdefgh&');
      expect(component.isValidationMet('number')).toBe(false);
    });

    it('should pass number when sufficient digits', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Abcdefg1&');
      expect(component.isValidationMet('number')).toBe(true);
    });

    it('should return false for all rules when password is empty', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('');
      expect(component.isValidationMet('length')).toBe(false);
      expect(component.isValidationMet('uppercase')).toBe(false);
      expect(component.isValidationMet('lowercase')).toBe(false);
      expect(component.isValidationMet('number')).toBe(false);
    });

    it('should return false for unknown rule', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      expect(component.isValidationMet('unknownRule')).toBe(false);
    });
  });


  describe('Validation List DOM Rendering', () => {
    beforeEach(fakeAsync(() => {
      tick(); // wait for config to load
      fixture.detectChanges();
    }));


    it('should apply valid class to length item when length requirement is met', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Abcdefg1&');
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const lengthItem = listItems[0]; // First item is always length
      expect(lengthItem.classList.contains('valid')).toBeTrue();
    });

    it('should apply valid class to all items when all requirements are met', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      listItems.forEach((item: HTMLElement) => {
        expect(item.classList.contains('valid')).toBeTrue();
      });
    });

    it('should not apply valid class to unmet requirements', () => {
      // Password missing special char
      component.resetPasswordForm.get('newPassword')?.setValue('Password1');
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      // Last item is special character requirement
      const specialItem = listItems[listItems.length - 1];
      expect(specialItem.classList.contains('valid')).toBeFalse();
    });

    it('should display validation title text', () => {
      const titleEl = fixture.nativeElement.querySelector('.validation-title');
      expect(titleEl.textContent.trim()).toBe('Your password must contain');
    });

    it('should show check_circle icon for met rules and radio_button_unchecked for unmet', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('short');
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const lengthItem = listItems[0];
      const icon = lengthItem.querySelector('.check-icon');
      expect(icon.textContent.trim()).toBe('radio_button_unchecked');
    });

    it('should show check_circle icon when rule is met', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      fixture.detectChanges();

      const listItems = fixture.nativeElement.querySelectorAll('.validation-list li');
      const lengthItem = listItems[0];
      const icon = lengthItem.querySelector('.check-icon');
      expect(icon.textContent.trim()).toBe('check_circle');
    });

  });

  describe('Password Match', () => {
    it('should show mismatch error when passwords differ and confirm is touched', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.setValue('Different1&');
      component.resetPasswordForm.get('confirmPassword')?.markAsTouched();

      expect(component.showPasswordMismatchError).toBe(true);
    });

    it('should not show mismatch when passwords match', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.markAsTouched();

      expect(component.showPasswordMismatchError).toBe(false);
    });

    it('should not show mismatch when confirm not touched', () => {
      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.setValue('Different1&');

      expect(component.showPasswordMismatchError).toBe(false);
    });
  });

  describe('onResetPassword - Success', () => {
    beforeEach(fakeAsync(() => {
      tick();
    }));

    it('should call API with correct params', fakeAsync(() => {
      authService.resetPasswordWithToken.and.returnValue(of({ success: true, message: 'Password reset' }));

      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.setValue('Password1&');
      component.onResetPassword();
      tick();

      expect(authService.resetPasswordWithToken).toHaveBeenCalledWith(
        'valid-test-token', 'Password1&', 'Password1&'
      );
    }));


  });

  describe('onResetPassword - Error', () => {
    beforeEach(fakeAsync(() => {
      tick();
    }));

    it('should set TOKEN_EXPIRED on 400 error', fakeAsync(() => {
      authService.resetPasswordWithToken.and.returnValue(
        throwError(() => ({ status: 400 }))
      );

      component.resetPasswordForm.get('newPassword')?.setValue('Password1&');
      component.resetPasswordForm.get('confirmPassword')?.setValue('Password1&');
      component.onResetPassword();
      tick();

      expect(component.viewState()).toBe('TOKEN_EXPIRED');
    }));

  });
  describe('Password Visibility', () => {

    it('should toggle new password visibility', () => {
      component.hideNewPassword = !component.hideNewPassword;
      expect(component.hideNewPassword).toBe(false);
    });

    it('should toggle confirm password visibility', () => {
      component.hideConfirmPassword = !component.hideConfirmPassword;
      expect(component.hideConfirmPassword).toBe(false);
    });
  });
});

describe('ResetPasswordComponent (no token)', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let changePasswordService: jasmine.SpyObj<ChangePasswordService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    await setupTestBed(null);

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    changePasswordService = TestBed.inject(ChangePasswordService) as jasmine.SpyObj<ChangePasswordService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set TOKEN_EXPIRED when no token', () => {
    expect(component.viewState()).toBe('TOKEN_EXPIRED');
  });


  describe('Resend Link', () => {
    it('should call forgotPassword on valid email', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: true, message: 'Sent' }));

      component.resendForm.get('email')?.setValue('test@wellsky.com');
      component.onSendResetLink();
      tick();

      expect(authService.forgotPassword).toHaveBeenCalledWith('test@wellsky.com');
      expect(component.linkSent()).toBe(true);
    }));


    it('should set serverError on API failure', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      component.resendForm.get('email')?.setValue('test@wellsky.com');
      component.onSendResetLink();
      tick();

      expect(component.resendForm.get('email')?.hasError('serverError')).toBe(true);
    }));

    it('should set userNotFound on 404 error', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      component.resendForm.get('email')?.setValue('test@wellsky.com');
      component.onSendResetLink();
      tick();

      expect(component.resendForm.get('email')?.hasError('userNotFound')).toBe(true);
    }));
  });
  describe('hasError helper', () => {
    it('should return true for invalid touched field', () => {
      component.resendForm.get('email')?.setValue('');
      component.resendForm.get('email')?.markAsTouched();
      expect(component.hasError('email')).toBe(true);
    });

    it('should return false for valid field', () => {
      component.resendForm.get('email')?.setValue('test@example.com');
      expect(component.hasError('email')).toBe(false);
    });

    it('should return false for untouched field', () => {
      expect(component.hasError('email')).toBe(false);
    });
  });

});
