import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login';
import { LoginService } from '../../../shared/services/login.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../../../shared/services/auth.service';
import { HeaderService } from '../../../shared/services/header.service';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: jasmine.SpyObj<LoginService>;
  let router: jasmine.SpyObj<Router>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let cookieService: jasmine.SpyObj<CookieService>;
  let authService: jasmine.SpyObj<AuthService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  let dialogClose$ = new Subject<string | undefined>();

  beforeEach(() => {

    loginService = jasmine.createSpyObj(
      'LoginService',
      ['login', 'resetLockState', 'checkOktaEnabled', 'checkPasswordConfig', 'storePasswordConfig', 'setPasswordWarning', 'getStoredToken', 'getStoredUsername', 'broadcastLogout', 'listenForCrossTabLogout', 'getAuthMethod'],
      {
        isLoading: signal(false),
        error: signal(null)
      }
    );
    loginService.getStoredToken.and.returnValue('');
    loginService.getStoredUsername.and.returnValue('');
    loginService.getAuthMethod.and.returnValue('');
    loginService.checkOktaEnabled.and.returnValue(of({ isSuccess: false }));
    loginService.checkPasswordConfig.and.returnValue(of({
      isStrongPasswordConfigured: false,
      isResetPasswordRequested: false
    }));

    router = jasmine.createSpyObj('Router', ['navigate']);

    dialog = createMockMatDialog();
    dialog.open.and.returnValue({
      afterClosed: () => dialogClose$.asObservable(),
      close: jasmine.createSpy('close')
    } as any);

    cookieService = jasmine.createSpyObj('CookieService', ['set', 'get']);

    authService = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated', 'getAccessToken', 'getUser', 'logout', 'handleLoginRedirect', 'getOktaAuth'], {
      getOktaAuth: jasmine.createSpy('getOktaAuth')
    });

    headerService = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        TranslateModule.forRoot() // ✅ CRITICAL FIX
      ],
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
        { provide: CookieService, useValue: cookieService },
        { provide: AuthService, useValue: authService },
        { provide: HeaderService, useValue: headerService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: { queryParams: {} }
          }
        }
      ]
    });


    


      loginService.login.calls.reset();


      loginService.resetLockState.calls.reset();


      loginService.checkOktaEnabled.calls.reset();


      loginService.checkPasswordConfig.calls.reset();


      loginService.storePasswordConfig.calls.reset();


      loginService.setPasswordWarning.calls.reset();


      loginService.getStoredToken.calls.reset();


      loginService.getStoredUsername.calls.reset();


      loginService.broadcastLogout.calls.reset();


      loginService.listenForCrossTabLogout.calls.reset();


      loginService.getAuthMethod.calls.reset();


      router.navigate.calls.reset();


      cookieService.set.calls.reset();


      cookieService.get.calls.reset();


      authService.login.calls.reset();


      authService.isAuthenticated.calls.reset();


      authService.getAccessToken.calls.reset();


      authService.getUser.calls.reset();


      authService.logout.calls.reset();


      authService.handleLoginRedirect.calls.reset();


      authService.getOktaAuth.calls.reset();


      headerService.clearCookies.calls.reset();


      loginService.getStoredToken.and.returnValue('');


      loginService.getStoredUsername.and.returnValue('');


      loginService.checkOktaEnabled.and.returnValue(of({ isSuccess: false }));


    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    dialogClose$ = new Subject();
  });


  it('should update username in uppercase and clear errors', () => {
    component.usernameError.set('error');
    component.onUsernameChange({ target: { value: 'user' } } as any);

    expect(component.username()).toBe('USER');
    expect(component.usernameError()).toBeNull();
  });

  it('should convert mixed-case username to uppercase', () => {
    component.onUsernameChange({ target: { value: 'JohnDoe' } } as any);
    expect(component.username()).toBe('JOHNDOE');
  });

  it('should keep already uppercase username as uppercase', () => {
    component.onUsernameChange({ target: { value: 'ADMIN' } } as any);
    expect(component.username()).toBe('ADMIN');
  });

  it('should set username error when empty', () => {
    component.onUsernameChange({ target: { value: '' } } as any);
    expect(component.usernameError()).toBe('Username is required');
  });

  it('should set password error when empty', () => {
    component.onPasswordChange({ target: { value: '' } } as any);
    expect(component.passwordError()).toBe('Password is required');
  });
  it('should toggle password visibility', () => {
    expect(component.hidePassword()).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.hidePassword()).toBeFalse();
  });



  it('should login successfully and navigate', async () => {
    loginService.login.and.resolveTo({ success: true, token: 'token' });

    component.username.set('admin');
    component.password.set('admin@123');

    await component.onSubmit();

    expect(loginService.login).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should show attempts message when remaining attempts exist', async () => {
    loginService.login.and.resolveTo({
      success: false,
      error: 'Invalid',
      pass_attempts_left: 2,
      total_no_of_pass_attempts: 3,
      is_account_locked: false,
      lockout_period: 5,
      password_warning_notice: 7
    });

    component.username.set('user');
    component.password.set('wrong');

    await component.onSubmit();

    expect(component.authError()).toBe('AUTH.LOGIN.INVALID_CREDENTIALS');
    expect(component.attemptsMessage()).toBe('AUTH.LOGIN.ATTEMPTS_LEFT_MESSAGE');
    expect(component.attemptsParams()).toEqual({ remaining: 2, max: 3 });
  });


  it('should reset form and unlock after dialog closes', fakeAsync(() => {
    component['openAccountLockedDialog']();

    dialogClose$.next(undefined);
    tick();

    expect(loginService.resetLockState).toHaveBeenCalled();
    expect(component.isAccountLocked()).toBeFalse();
    expect(component.username()).toBe('');
    expect(component.password()).toBe('');
  }));


  it('should compute form validity correctly', () => {
    component.username.set('');
    component.password.set('');
    expect(component.isFormValid()).toBeFalse();

    component.username.set('user');
    component.password.set('pass');
    expect(component.isFormValid()).toBeTrue();
  });

});