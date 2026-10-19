import { TestBed } from '@angular/core/testing';
import { LoginService } from './login.service';
import { ApiService } from './api.service';
import { RestrictionService } from './restriction.service';
import { AccessLevelService } from './access-level.service';
import { LoginCredentials } from '../interfaces/auth.interface';
import { of, throwError } from 'rxjs';

describe('LoginService', () => {
  let service: LoginService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let restrictionServiceSpy: jasmine.SpyObj<RestrictionService>;
  let accessLevelServiceSpy: jasmine.SpyObj<AccessLevelService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'get']);
    restrictionServiceSpy = jasmine.createSpyObj('RestrictionService', ['clearAllRestrictions']);
    accessLevelServiceSpy = jasmine.createSpyObj('AccessLevelService', ['clear']);

    TestBed.configureTestingModule({
      providers: [
        LoginService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        { provide: AccessLevelService, useValue: accessLevelServiceSpy },
      ],
    });

    service = TestBed.inject(LoginService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---- login ----

  describe('login', () => {
    const validCredentials: LoginCredentials = { username: 'testuser', password: 'testpass' };

    const successResponse = {
      isSuccess: true,
      message: 'Login successful',
      responseCode: 200,
      data: {
        token: 'jwt-token-123',
        username: 'TESTUSER',
        is_account_locked: false,
        pass_attempts_left: null,
        total_no_of_pass_attempts: null,
        password_warning_notice: 7,
        password_expiry_date: null,
      },
    };

    const failureResponse = {
      isSuccess: false,
      message: 'Password is incorrect',
      responseCode: 401,
      data: {
        is_account_locked: false,
        pass_attempts_left: 2,
        total_no_of_pass_attempts: 3,
        is_password_expired: false,
        lockout_period: 5,
        password_warning_notice: 7,
        password_expiry_date: null,
      },
    };

    it('should return success with token on valid credentials', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(true);
      expect(result.token).toBe('jwt-token-123');
      expect(sessionStorage.getItem('jwt_token')).toBe('jwt-token-123');
    });

    it('should store username in sessionStorage on success', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);

      expect(sessionStorage.getItem('current_username')).toBe('TESTUSER');
    });

    it('should store auth_method as standard on success', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);

      expect(sessionStorage.getItem('auth_method')).toBe('standard');
    });

    it('should clear sessionStorage drive/label contexts on success', async () => {
      sessionStorage.setItem('driveContext', 'old');
      sessionStorage.setItem('labelPrinterContext', 'old');
      apiServiceSpy.post.and.returnValue(of(successResponse));

      await service.login(validCredentials);

      expect(sessionStorage.getItem('driveContext')).toBeNull();
      expect(sessionStorage.getItem('labelPrinterContext')).toBeNull();
    });

    it('should clear error on successful login', async () => {
      service.error.set('Previous error');
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);
      expect(service.error()).toBeNull();
    });

    it('should return password_warning_notice on success', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      const result = await service.login(validCredentials);
      expect(result.password_warning_notice).toBe(7);
    });

    it('should convert username to uppercase', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login({ username: 'myUser', password: 'pass' });

      const body = apiServiceSpy.post.calls.argsFor(0)[1];
      expect(body.username).toBe('MYUSER');
    });

    it('should return error on invalid credentials', async () => {
      apiServiceSpy.post.and.returnValue(of(failureResponse));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is incorrect');
      expect(result.pass_attempts_left).toBe(2);
      expect(result.total_no_of_pass_attempts).toBe(3);
    });

    it('should return lockout info when account is locked', async () => {
      const lockedResponse = {
        ...failureResponse,
        message: 'Account is locked',
        data: { ...failureResponse.data, is_account_locked: true, pass_attempts_left: 0, lockout_period: 5 },
      };
      apiServiceSpy.post.and.returnValue(of(lockedResponse));
      const result = await service.login(validCredentials);

      expect(result.is_account_locked).toBe(true);
      expect(result.pass_attempts_left).toBe(0);
      expect(result.lockout_period).toBe(5);
    });

    it('should return error when username is empty', async () => {
      const result = await service.login({ username: '', password: 'pass' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should return error when password is empty', async () => {
      const result = await service.login({ username: 'user', password: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should set error signal on failed login', async () => {
      apiServiceSpy.post.and.returnValue(of(failureResponse));
      await service.login(validCredentials);
      expect(service.error()).toBe('Password is incorrect');
    });

    it('should handle API network error gracefully', async () => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Network error')));
      const result = await service.login(validCredentials);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should set isLoading true during login and false after', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);
      expect(service.isLoading()).toBe(false);
    });

    it('should set isLoading false even on error', async () => {
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('fail')));
      await service.login(validCredentials);
      expect(service.isLoading()).toBe(false);
    });

    it('should send X-Device-Name header', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);

      const options = apiServiceSpy.post.calls.argsFor(0)[2];
      expect(options.headers.has('X-Device-Name')).toBe(true);
    });

    it('should default to null for missing password fields in success response', async () => {
      const minimalSuccess = {
        isSuccess: true,
        data: { token: 'tok', username: 'U' },
      };
      apiServiceSpy.post.and.returnValue(of(minimalSuccess));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(true);
      expect(result.password_warning_notice).toBeNull();
      expect(result.password_expiry_date).toBeNull();
    });

    it('should use default error message when response has no message', async () => {
      const noMessageResponse = {
        isSuccess: false,
        data: {
          is_account_locked: false,
          pass_attempts_left: null,
          total_no_of_pass_attempts: null,
        },
      };
      apiServiceSpy.post.and.returnValue(of(noMessageResponse));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password.');
    });

    it('should handle non-Error thrown objects in catch block', async () => {
      apiServiceSpy.post.and.returnValue(throwError(() => 'string error'));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unknown error occurred');
    });

    it('should default missing data fields to false/null in failure response', async () => {
      const sparseFailure = {
        isSuccess: false,
        message: 'Failed',
        data: {},
      };
      apiServiceSpy.post.and.returnValue(of(sparseFailure));
      const result = await service.login(validCredentials);

      expect(result.success).toBe(false);
      expect(result.is_account_locked).toBe(false);
      expect(result.pass_attempts_left).toBeNull();
      expect(result.total_no_of_pass_attempts).toBeNull();
      expect(result.is_password_expired).toBe(false);
      expect(result.lockout_period).toBeNull();
      expect(result.lockout_until).toBeNull();
      expect(result.reset_request).toBe(false);
      expect(result.password_warning_notice).toBeNull();
      expect(result.password_expiry_date).toBeNull();
    });

    it('should return lockout_until and reset_request from failure response data', async () => {
      const lockoutResponse = {
        isSuccess: false,
        message: 'Locked',
        data: {
          is_account_locked: true,
          lockout_until: '2026-07-16T00:00:00Z',
          reset_request: true,
        },
      };
      apiServiceSpy.post.and.returnValue(of(lockoutResponse));
      const result = await service.login(validCredentials);

      expect(result.lockout_until).toBe('2026-07-16T00:00:00Z');
      expect(result.reset_request).toBe(true);
    });

    it('should call post with the correct API URL', async () => {
      apiServiceSpy.post.and.returnValue(of(successResponse));
      await service.login(validCredentials);

      const url = apiServiceSpy.post.calls.argsFor(0)[0];
      expect(url).toBe('/api/v1/Auth/Login/WithoutOkta');
    });
  });

  // ---- forgotPassword ----

  describe('forgotPassword', () => {
    it('should return success for valid username', async () => {
      const result = await service.forgotPassword('testuser');
      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset instructions');
    });

    it('should return error for empty username', async () => {
      const result = await service.forgotPassword('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should set isLoading false after completion', async () => {
      await service.forgotPassword('user');
      expect(service.isLoading()).toBe(false);
    });

    it('should set error signal on failure', async () => {
      await service.forgotPassword('');
      expect(service.error()).toBe('Username is required');
    });

    it('should clear error at start of call', async () => {
      service.error.set('Previous error');
      await service.forgotPassword('validuser');
      expect(service.error()).toBeNull();
    });
  });

  // ---- resetLockState ----

  describe('resetLockState', () => {
    it('should clear error signal', () => {
      service.error.set('some error');
      service.resetLockState();
      expect(service.error()).toBeNull();
    });
  });

  // ---- password warning ----

  describe('setPasswordWarning / clearPasswordWarning', () => {
    it('should set password warning state', () => {
      service.setPasswordWarning(5);
      expect(service.showPasswordWarning()).toBe(true);
      expect(service.passwordExpiryDays()).toBe(5);
    });

    it('should clear password warning state', () => {
      service.setPasswordWarning(3);
      service.clearPasswordWarning();
      expect(service.showPasswordWarning()).toBe(false);
      expect(service.passwordExpiryDays()).toBe(0);
    });
  });

  // ---- checkOktaEnabled ----

  describe('checkOktaEnabled', () => {
    it('should call apiService.get with okta config endpoint', () => {
      const mockResp = { isSuccess: true, data: { enabled: true } };
      apiServiceSpy.get.and.returnValue(of(mockResp));

      service.checkOktaEnabled().subscribe(result => {
        expect(result).toEqual(mockResp);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/api/v1/Auth/Login/LoginWithOkta', {});
    });
  });

  // ---- token / username / auth method ----

  describe('getStoredToken', () => {
    it('should return JWT from sessionStorage', () => {
      sessionStorage.setItem('jwt_token', 'my-jwt');
      expect(service.getStoredToken()).toBe('my-jwt');
    });

    it('should return empty string when no token', () => {
      expect(service.getStoredToken()).toBe('');
    });
  });

  describe('getStoredUsername', () => {
    it('should return username from sessionStorage', () => {
      sessionStorage.setItem('current_username', 'ADMIN');
      expect(service.getStoredUsername()).toBe('ADMIN');
    });

    it('should return empty string when no username', () => {
      expect(service.getStoredUsername()).toBe('');
    });
  });

  describe('storeUsername', () => {
    it('should store username in sessionStorage', () => {
      service.storeUsername('TESTUSER');
      expect(sessionStorage.getItem('current_username')).toBe('TESTUSER');
    });
  });

  describe('storeAuthMethod', () => {
    it('should store auth method in sessionStorage', () => {
      service.storeAuthMethod('okta');
      expect(sessionStorage.getItem('auth_method')).toBe('okta');
    });
  });

  describe('isOktaUser', () => {
    it('should return true when auth_method is okta', () => {
      sessionStorage.setItem('auth_method', 'okta');
      expect(service.isOktaUser()).toBe(true);
    });

    it('should return false when auth_method is standard', () => {
      sessionStorage.setItem('auth_method', 'standard');
      expect(service.isOktaUser()).toBe(false);
    });

    it('should return false when no auth_method', () => {
      expect(service.isOktaUser()).toBe(false);
    });
  });

  describe('getAuthMethod', () => {
    it('should return auth method from sessionStorage', () => {
      sessionStorage.setItem('auth_method', 'okta');
      expect(service.getAuthMethod()).toBe('okta');
    });

    it('should return empty string when not set', () => {
      expect(service.getAuthMethod()).toBe('');
    });
  });

  // ---- clearToken ----

  describe('clearToken', () => {
    it('should remove all auth data from sessionStorage', () => {
      sessionStorage.setItem('jwt_token', 'tok');
      sessionStorage.setItem('current_username', 'user');
      sessionStorage.setItem('auth_method', 'standard');
      sessionStorage.setItem('password_config', '{}');

      service.clearToken();

      expect(sessionStorage.getItem('jwt_token')).toBeNull();
      expect(sessionStorage.getItem('current_username')).toBeNull();
      expect(sessionStorage.getItem('auth_method')).toBeNull();
      expect(sessionStorage.getItem('password_config')).toBeNull();
    });

    it('should clear restriction flags', () => {
      service.clearToken();
      expect(restrictionServiceSpy.clearAllRestrictions).toHaveBeenCalled();
    });

    it('should clear access level service', () => {
      service.clearToken();
      expect(accessLevelServiceSpy.clear).toHaveBeenCalled();
    });
  });

  // ---- cross-tab logout ----

  describe('broadcastLogout', () => {
    it('should set logout_event in localStorage', () => {
      const spy = spyOn(Storage.prototype, 'setItem');
      service.broadcastLogout();
      expect(spy).toHaveBeenCalledWith('logout_event', jasmine.any(String));
    });
  });

  describe('listenForCrossTabLogout', () => {
    it('should add a storage event listener', () => {
      const addSpy = spyOn(window, 'addEventListener');
      const cb = jasmine.createSpy('callback');
      service.listenForCrossTabLogout(cb);
      expect(addSpy).toHaveBeenCalledWith('storage', jasmine.any(Function));
    });

    it('should invoke callback when logout_event fires', () => {
      const cb = jasmine.createSpy('callback');
      service.listenForCrossTabLogout(cb);

      const event = new StorageEvent('storage', { key: 'logout_event' });
      window.dispatchEvent(event);

      expect(cb).toHaveBeenCalled();
    });

    it('should not invoke callback for unrelated storage events', () => {
      const cb = jasmine.createSpy('callback');
      service.listenForCrossTabLogout(cb);

      const event = new StorageEvent('storage', { key: 'other_key' });
      window.dispatchEvent(event);

      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ---- password config ----

  describe('checkPasswordConfig', () => {
    it('should call apiService.get with username endpoint', () => {
      const mockResp = { isStrongPasswordConfigured: true, isResetPasswordRequested: false };
      apiServiceSpy.get.and.returnValue(of(mockResp));

      service.checkPasswordConfig('ADMIN').subscribe(result => {
        expect(result).toEqual(mockResp);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        jasmine.stringContaining('ADMIN')
      );
    });
  });

  describe('storePasswordConfig', () => {
    it('should store config as JSON in sessionStorage', () => {
      const config = { isStrongPasswordConfigured: true, isResetPasswordRequested: false };
      service.storePasswordConfig(config);

      expect(sessionStorage.getItem('password_config')).toBe(JSON.stringify(config));
    });
  });

  describe('getStoredPasswordConfig', () => {
    it('should parse and return stored config', () => {
      const config = { isStrongPasswordConfigured: true, isResetPasswordRequested: false };
      sessionStorage.setItem('password_config', JSON.stringify(config));

      expect(service.getStoredPasswordConfig()).toEqual(config);
    });

    it('should return null when no config stored', () => {
      expect(service.getStoredPasswordConfig()).toBeNull();
    });

    it('should return null on invalid JSON', () => {
      spyOn(console, 'error');
      sessionStorage.setItem('password_config', '{broken');
      expect(service.getStoredPasswordConfig()).toBeNull();
    });
  });

  describe('isStrongPasswordRequired', () => {
    it('should return true when config says strong password configured', () => {
      const config = { isStrongPasswordConfigured: true, isResetPasswordRequested: false };
      sessionStorage.setItem('password_config', JSON.stringify(config));
      expect(service.isStrongPasswordRequired()).toBe(true);
    });

    it('should return false when no config', () => {
      expect(service.isStrongPasswordRequired()).toBe(false);
    });
  });

  describe('isPasswordResetRequested', () => {
    it('should return true when reset is requested', () => {
      const config = { isStrongPasswordConfigured: false, isResetPasswordRequested: true };
      sessionStorage.setItem('password_config', JSON.stringify(config));
      expect(service.isPasswordResetRequested()).toBe(true);
    });

    it('should return false when no config', () => {
      expect(service.isPasswordResetRequested()).toBe(false);
    });
  });
});
