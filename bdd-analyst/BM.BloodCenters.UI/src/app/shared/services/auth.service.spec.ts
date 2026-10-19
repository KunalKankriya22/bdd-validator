import { TestBed } from '@angular/core/testing';
import { AuthService, ForgotPasswordResponse, ResetPasswordResponse } from './auth.service';
import { ApiService } from './api.service';
import { OktaAuth } from '@okta/okta-auth-js';
import { of, throwError } from 'rxjs';
import { API } from '../../core/constants/api.constants';
import { environment } from '../../../environments/environment';

// --- Jasmine spy objects for OktaAuth internals ---

const mockTokenManager = jasmine.createSpyObj('tokenManager', ['on', 'get', 'renew', 'clear']);

const mockOktaAuth = jasmine.createSpyObj('oktaAuth', [
  'isAuthenticated',
  'signInWithRedirect',
  'signOut',
  'getAccessToken',
  'handleLoginRedirect',
  'start',
]);
mockOktaAuth.tokenManager = mockTokenManager;

// Replace the @okta/okta-auth-js module so the AuthService constructor
// receives our spy-backed mock instead of a real OktaAuth instance.
// The closure `() => mockOktaAuth` defers access until invocation time,
// avoiding the temporal dead-zone for the module-level const.
jest.mock('@okta/okta-auth-js', () => ({
  OktaAuth: jasmine.createSpy('OktaAuth').and.callFake(() => mockOktaAuth),
}));

// Alias for the mocked constructor spy so tests can inspect call args
const OktaAuthSpy = OktaAuth as any;

// Helper: reset every spy method on a jasmine spy-object
function resetSpyObj(spyObj: any): void {
  Object.keys(spyObj).forEach((key) => {
    const val = spyObj[key];
    if (typeof val === 'function' && val.calls && val.calls.reset) {
      val.calls.reset();
    }
  });
}

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    // Reset all OktaAuth spy call histories via jasmine API
    resetSpyObj(mockTokenManager);
    resetSpyObj(mockOktaAuth);
    OktaAuthSpy.calls.reset();

    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---- constructor ----

  describe('constructor', () => {
    it('should create OktaAuth with environment config and restoreOriginalUri', () => {
      expect(OktaAuthSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          ...environment.okta,
          restoreOriginalUri: expect.any(Function),
        })
      );
    });

    it('should register renewed, expired, and error token-manager listeners', () => {
      expect(mockTokenManager.on).toHaveBeenCalledWith('renewed', expect.any(Function));
      expect(mockTokenManager.on).toHaveBeenCalledWith('expired', expect.any(Function));
      expect(mockTokenManager.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should start the OktaAuth service', () => {
      expect(mockOktaAuth.start).toHaveBeenCalled();
    });

    it('should provide a restoreOriginalUri callback that resolves without error', async () => {
      // Arrange
      const config = OktaAuthSpy.calls.mostRecent().args[0];

      // Act
      const result = await config.restoreOriginalUri();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should log the token key when a token is renewed', () => {
      // Arrange
      const consoleSpy = spyOn(console, 'log');
      const renewedCall = (mockTokenManager.on as any).calls
        .all()
        .find((c: any) => c.args[0] === 'renewed');
      const callback = renewedCall.args[1];

      // Act
      callback('accessToken', { value: 'new' }, { value: 'old' });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Token renewed:', 'accessToken');
    });

    it('should log the token key when a token expires', () => {
      // Arrange
      const consoleSpy = spyOn(console, 'log');
      const expiredCall = (mockTokenManager.on as any).calls
        .all()
        .find((c: any) => c.args[0] === 'expired');
      const callback = expiredCall.args[1];

      // Act
      callback('idToken', { value: 'expired-token' });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Token expired:', 'idToken');
    });

    it('should log the error when the token manager encounters an error', () => {
      // Arrange
      const consoleSpy = spyOn(console, 'error');
      const errorCall = (mockTokenManager.on as any).calls
        .all()
        .find((c: any) => c.args[0] === 'error');
      const callback = errorCall.args[1];
      const tokenError = new Error('network error during renewal');

      // Act
      callback(tokenError);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Token manager error:', tokenError);
    });
  });

  // ---- isAuthenticated ----

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      // Arrange
      mockOktaAuth.isAuthenticated.and.resolveTo(true);

      // Act & Assert
      expect(await service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      // Arrange
      mockOktaAuth.isAuthenticated.and.resolveTo(false);

      // Act & Assert
      expect(await service.isAuthenticated()).toBe(false);
    });
  });

  // ---- login ----

  describe('login', () => {
    it('should call signInWithRedirect and emit on success', (done) => {
      // Arrange
      mockOktaAuth.signInWithRedirect.and.resolveTo(undefined);

      // Act
      service.login().subscribe({
        next: (value) => {
          // Assert
          expect(value).toBeUndefined();
          expect(mockOktaAuth.signInWithRedirect).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should propagate error when signInWithRedirect rejects', (done) => {
      // Arrange
      const error = new Error('redirect failed');
      mockOktaAuth.signInWithRedirect.and.rejectWith(error);

      // Act
      service.login().subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---- logout ----

  describe('logout', () => {
    it('should call signOut with revoke and redirect options', async () => {
      // Arrange
      mockOktaAuth.signOut.and.resolveTo(undefined);

      // Act
      await service.logout();

      // Assert
      expect(mockOktaAuth.signOut).toHaveBeenCalledWith({
        revokeAccessToken: true,
        revokeRefreshToken: true,
        postLogoutRedirectUri: window.location.origin + '/',
      });
    });

    it('should propagate error when signOut rejects', async () => {
      // Arrange
      const error = new Error('signout failed');
      mockOktaAuth.signOut.and.rejectWith(error);

      // Act & Assert
      await expect(service.logout()).rejects.toThrow('signout failed');
    });
  });

  // ---- getUser ----

  describe('getUser', () => {
    it('should return claims from idToken', async () => {
      // Arrange
      const claims = { sub: 'user123', name: 'Test User' };
      mockTokenManager.get.and.resolveTo({ claims });

      // Act
      const user = await service.getUser();

      // Assert
      expect(user).toEqual(claims);
      expect(mockTokenManager.get).toHaveBeenCalledWith('idToken');
    });

    it('should return null when no idToken exists', async () => {
      // Arrange
      mockTokenManager.get.and.resolveTo(null);

      // Act & Assert
      expect(await service.getUser()).toBeNull();
    });

    it('should return null when token has no claims property', async () => {
      // Arrange
      mockTokenManager.get.and.resolveTo({ value: 'token-value' });

      // Act & Assert
      expect(await service.getUser()).toBeNull();
    });
  });

  // ---- getAccessToken ----

  describe('getAccessToken', () => {
    it('should return the access token string', () => {
      // Arrange
      mockOktaAuth.getAccessToken.and.returnValue('access-token-123');

      // Act & Assert
      expect(service.getAccessToken()).toBe('access-token-123');
    });

    it('should return undefined when no access token exists', () => {
      // Arrange
      mockOktaAuth.getAccessToken.and.returnValue(undefined);

      // Act & Assert
      expect(service.getAccessToken()).toBeUndefined();
    });
  });

  // ---- handleLoginRedirect ----

  describe('handleLoginRedirect', () => {
    it('should delegate to oktaAuth.handleLoginRedirect', async () => {
      // Arrange
      mockOktaAuth.handleLoginRedirect.and.resolveTo(undefined);

      // Act
      await service.handleLoginRedirect();

      // Assert
      expect(mockOktaAuth.handleLoginRedirect).toHaveBeenCalled();
    });

    it('should propagate error when handleLoginRedirect rejects', async () => {
      // Arrange
      const error = new Error('callback handling failed');
      mockOktaAuth.handleLoginRedirect.and.rejectWith(error);

      // Act & Assert
      await expect(service.handleLoginRedirect()).rejects.toThrow(
        'callback handling failed'
      );
    });
  });

  // ---- hasValidSession ----

  describe('hasValidSession', () => {
    it('should return true when both accessToken and idToken exist', async () => {
      // Arrange
      mockTokenManager.get.and.callFake((key: string) => {
        if (key === 'accessToken') return Promise.resolve({ accessToken: 'at' });
        if (key === 'idToken') return Promise.resolve({ idToken: 'it' });
        return Promise.resolve(null);
      });

      // Act & Assert
      expect(await service.hasValidSession()).toBe(true);
    });

    it('should return false when accessToken is missing', async () => {
      // Arrange
      mockTokenManager.get.and.callFake((key: string) => {
        if (key === 'accessToken') return Promise.resolve(null);
        if (key === 'idToken') return Promise.resolve({ idToken: 'it' });
        return Promise.resolve(null);
      });

      // Act & Assert
      expect(await service.hasValidSession()).toBe(false);
    });

    it('should return false when idToken is missing', async () => {
      // Arrange
      mockTokenManager.get.and.callFake((key: string) => {
        if (key === 'accessToken') return Promise.resolve({ accessToken: 'at' });
        if (key === 'idToken') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      // Act & Assert
      expect(await service.hasValidSession()).toBe(false);
    });

    it('should return false when both tokens are missing', async () => {
      // Arrange
      mockTokenManager.get.and.resolveTo(null);

      // Act & Assert
      expect(await service.hasValidSession()).toBe(false);
    });

    it('should return false and log error on exception', async () => {
      // Arrange
      const consoleSpy = spyOn(console, 'error');
      mockTokenManager.get.and.rejectWith(new Error('storage error'));

      // Act
      const result = await service.hasValidSession();

      // Assert
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking session validity:',
        expect.any(Error)
      );
    });
  });

  // ---- renewTokens ----

  describe('renewTokens', () => {
    it('should renew both accessToken and idToken and log success', async () => {
      // Arrange
      const consoleSpy = spyOn(console, 'log');
      mockTokenManager.renew.and.resolveTo(undefined);

      // Act
      await service.renewTokens();

      // Assert
      expect(mockTokenManager.renew).toHaveBeenCalledWith('accessToken');
      expect(mockTokenManager.renew).toHaveBeenCalledWith('idToken');
      expect(consoleSpy).toHaveBeenCalledWith('Tokens renewed successfully');
    });

    it('should throw and log error on renewal failure', async () => {
      // Arrange
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('renewal failed');
      mockTokenManager.renew.and.rejectWith(error);

      // Act & Assert
      await expect(service.renewTokens()).rejects.toThrow('renewal failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error renewing tokens:', error);
    });
  });

  // ---- clearTokens ----

  describe('clearTokens', () => {
    it('should clear all tokens from the token manager', async () => {
      // Arrange
      mockTokenManager.clear.and.resolveTo(undefined);

      // Act
      await service.clearTokens();

      // Assert
      expect(mockTokenManager.clear).toHaveBeenCalled();
    });
  });

  // ---- getOktaAuth ----

  describe('getOktaAuth', () => {
    it('should return the OktaAuth instance', () => {
      // Act
      const oktaAuth = service.getOktaAuth();

      // Assert
      expect(oktaAuth).toBe(mockOktaAuth);
    });
  });

  // ---- checkOktaEnabled ----

  describe('checkOktaEnabled', () => {
    it('should call apiService.get with the okta-auth endpoint', (done) => {
      // Arrange
      const mockResponse = { enabled: true };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.checkOktaEnabled().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        done();
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('okta-auth');
    });

    it('should propagate API error', (done) => {
      // Arrange
      const error = new Error('API unavailable');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.checkOktaEnabled().subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---- forgotPassword ----

  describe('forgotPassword', () => {
    it('should post email to the forgot-password endpoint', (done) => {
      // Arrange
      const mockResponse: ForgotPasswordResponse = {
        success: true,
        message: 'Email sent',
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service.forgotPassword('user@example.com').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse);
        done();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.AUTH.FORGOT_PASSWORD,
        { email: 'user@example.com' }
      );
    });

    it('should propagate API error', (done) => {
      // Arrange
      const error = new Error('Server error');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.forgotPassword('user@example.com').subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // ---- resetPasswordWithToken ----

  describe('resetPasswordWithToken', () => {
    it('should post token and passwords to the reset endpoint', (done) => {
      // Arrange
      const mockResponse: ResetPasswordResponse = {
        success: true,
        message: 'Password reset',
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      // Act
      service
        .resetPasswordWithToken('tok123', 'newPass', 'newPass')
        .subscribe((result) => {
          // Assert
          expect(result).toEqual(mockResponse);
          done();
        });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.AUTH.RESET_PASSWORD_WITH_TOKEN,
        { token: 'tok123', newPassword: 'newPass', confirmPassword: 'newPass' }
      );
    });

    it('should propagate API error', (done) => {
      // Arrange
      const error = new Error('Reset failed');
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.resetPasswordWithToken('tok', 'p1', 'p1').subscribe({
        error: (err) => {
          // Assert
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
