import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AccessDeniedComponent } from './access-denied';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';
import { RestrictionService } from '../../services/restriction.service';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { ROUTES } from '../../../core/constants/route.constants';

describe('AccessDeniedComponent', () => {
  let component: AccessDeniedComponent;
  let fixture: ComponentFixture<AccessDeniedComponent>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let loginService: jasmine.SpyObj<LoginService>;
  let authService: jasmine.SpyObj<AuthService>;
  let restrictionService: jasmine.SpyObj<RestrictionService>;
  let router: Router;

  beforeEach(async () => {
    const headerServiceSpy = createMockHeaderService();
    const loginServiceSpy = jasmine.createSpyObj('LoginService', [
      'isOktaUser',
      'clearToken',
      'broadcastLogout',
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'clearTokens']);
    const restrictionServiceSpy = jasmine.createSpyObj('RestrictionService', [
      'setAccessDeniedActive',
      'clearAccessDenied',
      'clearAllRestrictions'
    ]);

    await TestBed.configureTestingModule({
      imports: [AccessDeniedComponent],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDeniedComponent);
    component = fixture.componentInstance;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    restrictionService = TestBed.inject(RestrictionService) as jasmine.SpyObj<RestrictionService>;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    loginService.isOktaUser.and.returnValue(false);
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set access denied restriction flag on init', () => {
      loginService.isOktaUser.and.returnValue(false);

      component.ngOnInit();

      expect(restrictionService.setAccessDeniedActive).toHaveBeenCalled();
    });

    it('should clear cookies on init', () => {
      loginService.isOktaUser.and.returnValue(false);

      component.ngOnInit();

      expect(loginService.clearToken).toHaveBeenCalled();
      expect(headerService.clearCookies).toHaveBeenCalled();
    });

    it('should call isOktaUser and store the result', () => {
      loginService.isOktaUser.and.returnValue(true);

      component.ngOnInit();

      expect(loginService.isOktaUser).toHaveBeenCalled();
    });

    it('should call clearToken before clearCookies', () => {
      loginService.isOktaUser.and.returnValue(false);
      const callOrder: string[] = [];
      loginService.clearToken.and.callFake(() => { callOrder.push('clearToken'); });
      headerService.clearCookies.and.callFake(() => { callOrder.push('clearCookies'); });

      component.ngOnInit();

      expect(callOrder).toEqual(['clearToken', 'clearCookies']);
    });
  });

  describe('onLogout', () => {
    let event: Event;

    beforeEach(() => {
      event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(router, 'navigate');
    });

    it('should call event.preventDefault', async () => {
      loginService.isOktaUser.and.returnValue(false);
      component.ngOnInit();

      await component.onLogout(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call broadcastLogout', async () => {
      loginService.isOktaUser.and.returnValue(false);
      component.ngOnInit();

      await component.onLogout(event);

      expect(loginService.broadcastLogout).toHaveBeenCalled();
    });

    it('should clear access denied restriction flag', async () => {
      loginService.isOktaUser.and.returnValue(false);
      component.ngOnInit();

      await component.onLogout(event);

      expect(restrictionService.clearAccessDenied).toHaveBeenCalled();
    });

    it('should clear token and cookies during logout', async () => {
      loginService.isOktaUser.and.returnValue(false);
      component.ngOnInit();
      loginService.clearToken.calls.reset();
      headerService.clearCookies.calls.reset();

      await component.onLogout(event);

      expect(loginService.clearToken).toHaveBeenCalled();
      expect(headerService.clearCookies).toHaveBeenCalled();
    });

    describe('non-Okta user', () => {
      beforeEach(() => {
        loginService.isOktaUser.and.returnValue(false);
        component.ngOnInit();
      });

      it('should navigate to login page', async () => {
        await component.onLogout(event);

        expect(router.navigate).toHaveBeenCalledWith([ROUTES.AUTH.LOGIN]);
      });

      it('should not call authService.logout', async () => {
        await component.onLogout(event);

        expect(authService.logout).not.toHaveBeenCalled();
      });
    });

    describe('Okta user', () => {
      beforeEach(() => {
        loginService.isOktaUser.and.returnValue(true);
        component.ngOnInit();
      });

      it('should call authService.logout on successful Okta logout', async () => {
        authService.logout.and.returnValue(Promise.resolve());

        await component.onLogout(event);

        expect(authService.logout).toHaveBeenCalled();
      });

      it('should not navigate to login on successful Okta logout', async () => {
        authService.logout.and.returnValue(Promise.resolve());

        await component.onLogout(event);

        expect(router.navigate).not.toHaveBeenCalled();
      });

      it('should handle Okta logout error by clearing tokens and navigating to login', async () => {
        const error = new Error('Okta logout failed');
        authService.logout.and.returnValue(Promise.reject(error));
        authService.clearTokens.and.returnValue(Promise.resolve());
        spyOn(console, 'error');

        await component.onLogout(event);

        expect(console.error).toHaveBeenCalledWith('Error during Okta logout:', error);
        expect(authService.clearTokens).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([ROUTES.AUTH.LOGIN]);
      });

      it('should log the error to console when Okta logout fails', async () => {
        const error = new Error('Network error');
        authService.logout.and.returnValue(Promise.reject(error));
        authService.clearTokens.and.returnValue(Promise.resolve());
        spyOn(console, 'error');

        await component.onLogout(event);

        expect(console.error).toHaveBeenCalledWith('Error during Okta logout:', error);
      });
    });
  });
});
