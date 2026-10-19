import { ComponentFixture, TestBed, fakeAsync, tick, flush, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError, Observable } from 'rxjs';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../shared/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';

class MockTranslateLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return of({
      AUTH: {
        FORGOT_PASSWORD: {
          TITLE: 'Forgot Password',
          DESCRIPTION: 'Enter your email address and we\'ll send you a link to reset your password',
          EMAIL_LABEL: 'Email',
          EMAIL_PLACEHOLDER: 'Enter your email address',
          SEND_RESET_LINK: 'SEND TEMPORARY PASSWORD',
          GO_BACK_TO_LOGIN: 'Go Back to Login',
          CANCEL: 'CANCEL'
        }
      },
      VALIDATION: {
        EMAIL: {
          REQUIRED: 'Email address is required',
          INVALID: 'Please enter a valid email address',
          NOT_FOUND: 'It looks like a user with that email address does not exist, please try again.'
        }
      }
    });
  }
}

describe('ForgotPasswordComponent', () => {
  let routerSpy: any;
  let authServiceSpy: any;
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {

    authServiceSpy = jasmine.createSpyObj('AuthService', ['forgotPassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);



      TestBed.configureTestingModule({
      imports: [
        ForgotPasswordComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        }),
        AlertComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });


    


      authServiceSpy.forgotPassword.calls.reset();


      routerSpy.navigate.calls.reset();


    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Form Initialization', () => {
    it('should initialize with EMAIL_ENTRY view state', () => {
      expect(component.viewState()).toBe('EMAIL_ENTRY');
    });

    it('should initialize form with empty email field', () => {
      expect(component.forgotPasswordForm.get('email')?.value).toBe('');
    });

    it('should have email field as required', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      expect(emailControl?.invalid).toBe(true);
    });

    it('should accept valid email', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
    });
  });

  describe('onSubmit - Success Flow', () => {
    it('should call authService.forgotPassword with email value', fakeAsync(() => {
      const testEmail = 'test@wellsky.com';
      authService.forgotPassword.and.returnValue(of({ success: true, message: 'User processed successfully' }));

      component.forgotPasswordForm.get('email')?.setValue(testEmail);
      component.onSubmit();

      expect(authService.forgotPassword).toHaveBeenCalledWith(testEmail);
    }));



    it('should change viewState to EMAIL_SENT on success', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: true, message: 'User processed successfully' }));

      component.forgotPasswordForm.get('email')?.setValue('test@wellsky.com');
      component.onSubmit();
      flush();

      expect(component.viewState()).toBe('EMAIL_SENT');
    }));


  });

  describe('onSubmit - Error Flow (success: false response)', () => {
    it('should handle success: false response and set viewState to ERROR', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: false, message: 'User not found' }));

      component.forgotPasswordForm.get('email')?.setValue('notfound@example.com');
      component.onSubmit();

      tick();
      flushMicrotasks();
      tick(0);

      expect(component.viewState()).toBe('ERROR');
    }));

    it('should set userNotFound error on email control when success: false', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: false, message: 'User not found' }));

      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('notfound@example.com');
      component.onSubmit();

      tick();
      flushMicrotasks();
      tick(0);

      expect(emailControl?.hasError('userNotFound')).toBe(true);
    }));

    it('should mark email control as touched when success: false', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: false, message: 'User not found' }));

      component.forgotPasswordForm.get('email')?.setValue('notfound@example.com');
      component.onSubmit();

      tick();
      flushMicrotasks();
      tick(0);

      expect(component.emailControl().touched).toBe(true);
    }));
  });

  describe('onSubmit - Error Flow (404 - User Not Found)', () => {
    it('should handle 404 error and set viewState to ERROR', fakeAsync(() => {
      const error = { status: 404, error: { message: 'User does not exist' } };
      authService.forgotPassword.and.returnValue(throwError(() => error));

      component.forgotPasswordForm.get('email')?.setValue('notfound@example.com');
      component.onSubmit();

      tick();
      flushMicrotasks();
      tick(0);

      expect(component.viewState()).toBe('ERROR');
    }));

    it('should set userNotFound error on email control for 404', fakeAsync(() => {
      const error = { status: 404, error: { message: 'User does not exist' } };
      authService.forgotPassword.and.returnValue(throwError(() => error));

      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('notfound@example.com');
      component.onSubmit();
      
      tick();
      flushMicrotasks();
      tick(0);

      expect(emailControl?.hasError('userNotFound')).toBe(true);
    }));

    it('should mark email control as touched on error', fakeAsync(() => {
      const error = { status: 404, error: { message: 'User does not exist' } };
      authService.forgotPassword.and.returnValue(throwError(() => error));

      component.forgotPasswordForm.get('email')?.setValue('notfound@example.com');
      component.onSubmit();
      
      tick();
      flushMicrotasks();
      tick(0);

      expect(component.emailControl().touched).toBe(true);
    }));
  });

  describe('onSubmit - Error Flow (Server Error)', () => {
    it('should handle server error and set serverError', fakeAsync(() => {
      const error = { status: 500, error: { message: 'Internal server error' } };
      authService.forgotPassword.and.returnValue(throwError(() => error));

      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('test@example.com');
      component.onSubmit();
      
      tick();
      flushMicrotasks();
      tick(0);

      expect(emailControl?.hasError('serverError')).toBe(true);
    }));
  });

  describe('onCancel', () => {




    it('should change viewState to EMAIL_ENTRY', () => {
      component.viewState.set('ERROR');
      component.onCancel();

      expect(component.viewState()).toBe('EMAIL_ENTRY');
    });
  });
  describe('emailError getter', () => {
    it('should return userNotFound message when userNotFound error exists', () => {
      component.emailControl().setErrors({ userNotFound: true });

      expect(component.emailError).toBeTruthy();
      expect(component.emailError).toBe('VALIDATION.EMAIL.NOT_FOUND');
    });




  });

  describe('hasFieldError computed', () => {
    it('should return true when field is invalid and touched', () => {
      const emailControl = component.emailControl();
      emailControl.setValue('');
      emailControl.markAsTouched();

      expect(component.hasFieldError()).toBe(true);
    });

    it('should return false when field is valid', () => {
      const emailControl = component.emailControl();
      emailControl.setValue('test@example.com');
      emailControl.markAsTouched();

      expect(component.hasFieldError()).toBe(false);
    });

    it('should return false when field is invalid but not touched', () => {
      const emailControl = component.emailControl();
      emailControl.setValue('');

      expect(component.hasFieldError()).toBe(false);
    });
  });

  describe('hasError method', () => {
    it('should return true for invalid touched field', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();

      expect(component.hasError('email')).toBe(true);
    });

    it('should return false for valid field', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('test@example.com');
      emailControl?.markAsTouched();

      expect(component.hasError('email')).toBe(false);
    });

    it('should return false for untouched invalid field', () => {
      const emailControl = component.forgotPasswordForm.get('email');
      emailControl?.setValue('');

      expect(component.hasError('email')).toBe(false);
    });
  });

  describe('View State Management', () => {


    it('should change to EMAIL_SENT state after successful submission', fakeAsync(() => {
      authService.forgotPassword.and.returnValue(of({ success: true, message: 'Success' }));

      component.forgotPasswordForm.get('email')?.setValue('valid@example.com');
      component.onSubmit();
      flush();
      fixture.detectChanges();

      expect(component.viewState()).toBe('EMAIL_SENT');
    }));
  });
});