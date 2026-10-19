import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../shared/services/auth.service';
import { LoginService } from '../shared/services/login.service';

describe('authGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let loginService: jest.Mocked<LoginService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    authService = {
      isAuthenticated: jest.fn(),
      clearTokens: jest.fn().mockResolvedValue(undefined),
    } as any;

    loginService = {
      getStoredToken: jest.fn(),
      getStoredUsername: jest.fn(),
      getAuthMethod: jest.fn(),
      clearToken: jest.fn(),
    } as any;

    router = {
      navigate: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: LoginService, useValue: loginService },
        { provide: Router, useValue: router },
      ],
    });
  });

  function runGuard(): Promise<boolean> {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/dashboard' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, state)) as Promise<boolean>;
  }

  describe('Okta authentication', () => {
    beforeEach(() => {
      loginService.getAuthMethod.mockReturnValue('okta');
    });

    it('should allow access when Okta session is authenticated', async () => {
      authService.isAuthenticated.mockResolvedValue(true);
      expect(await runGuard()).toBe(true);
    });

    it('should deny access and redirect to login when Okta session is not authenticated', async () => {
      authService.isAuthenticated.mockResolvedValue(false);
      expect(await runGuard()).toBe(false);
      expect(authService.clearTokens).toHaveBeenCalled();
      expect(loginService.clearToken).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Standard JWT authentication', () => {
    beforeEach(() => {
      loginService.getAuthMethod.mockReturnValue('standard');
    });

    it('should allow access when JWT token and username exist', async () => {
      loginService.getStoredToken.mockReturnValue('jwt-token');
      loginService.getStoredUsername.mockReturnValue('user1');
      expect(await runGuard()).toBe(true);
    });

    it('should deny access when JWT token is missing', async () => {
      loginService.getStoredToken.mockReturnValue(null);
      loginService.getStoredUsername.mockReturnValue('user1');
      expect(await runGuard()).toBe(false);
      expect(loginService.clearToken).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should deny access when username is missing', async () => {
      loginService.getStoredToken.mockReturnValue('jwt-token');
      loginService.getStoredUsername.mockReturnValue(null);
      expect(await runGuard()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('No authentication method', () => {
    it('should deny access and redirect to login', async () => {
      loginService.getAuthMethod.mockReturnValue('');
      expect(await runGuard()).toBe(false);
      expect(loginService.clearToken).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
