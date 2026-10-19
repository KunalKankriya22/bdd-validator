import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OktaRestrictionComponent } from './okta-restriction';
import { HeaderService } from '../../services/header.service';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../../services/auth.service';
import { RestrictionService } from '../../services/restriction.service';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { ROUTES } from '../../../core/constants/route.constants';

describe('OktaRestrictionComponent', () => {
  let component: OktaRestrictionComponent;
  let fixture: ComponentFixture<OktaRestrictionComponent>;
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
      'setOktaRestrictionActive',
      'clearOktaRestriction',
      'clearAllRestrictions'
    ]);

    await TestBed.configureTestingModule({
      imports: [OktaRestrictionComponent],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OktaRestrictionComponent);
    component = fixture.componentInstance;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    restrictionService = TestBed.inject(RestrictionService) as jasmine.SpyObj<RestrictionService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should set okta restriction flag on init', () => {
    component.ngOnInit();

    expect(restrictionService.setOktaRestrictionActive).toHaveBeenCalled();
  });

  it('should clear cookies on init', () => {
    component.ngOnInit();

    expect(headerService.clearCookies).toHaveBeenCalled();
  });

  describe('onLogout', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['preventDefault']);
      authService.logout.and.returnValue(Promise.resolve());
    });

    it('should prevent default event behavior', async () => {
      await component.onLogout(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should broadcast logout', async () => {
      await component.onLogout(mockEvent);

      expect(loginService.broadcastLogout).toHaveBeenCalled();
    });

    it('should clear okta restriction flag', async () => {
      await component.onLogout(mockEvent);

      expect(restrictionService.clearOktaRestriction).toHaveBeenCalled();
    });

    it('should clear token and cookies then call authService.logout on success', async () => {
      await component.onLogout(mockEvent);

      expect(loginService.clearToken).toHaveBeenCalled();
      expect(headerService.clearCookies).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should clear token and cookies before calling authService.logout', async () => {
      const callOrder: string[] = [];
      loginService.clearToken.and.callFake(() => callOrder.push('clearToken'));
      headerService.clearCookies.and.callFake(() => callOrder.push('clearCookies'));
      authService.logout.and.callFake(() => {
        callOrder.push('logout');
        return Promise.resolve();
      });

      await component.onLogout(mockEvent);

      expect(callOrder.indexOf('clearToken')).toBeLessThan(callOrder.indexOf('logout'));
      expect(callOrder.indexOf('clearCookies')).toBeLessThan(callOrder.indexOf('logout'));
    });

    it('should clear token and cookies and navigate to login on logout error', async () => {
      authService.logout.and.returnValue(Promise.reject(new Error('Okta error')));

      await component.onLogout(mockEvent);

      expect(loginService.clearToken).toHaveBeenCalled();
      expect(headerService.clearCookies).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith([ROUTES.AUTH.LOGIN]);
    });

    it('should log error to console when logout fails', async () => {
      const testError = new Error('Okta error');
      authService.logout.and.returnValue(Promise.reject(testError));
      spyOn(console, 'error');

      await component.onLogout(mockEvent);

      expect(console.error).toHaveBeenCalledWith('Error during Okta logout:', testError);
    });

    it('should not navigate to login on successful logout', async () => {
      await component.onLogout(mockEvent);

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should still broadcast logout and clear restriction even when logout fails', async () => {
      authService.logout.and.returnValue(Promise.reject(new Error('fail')));

      await component.onLogout(mockEvent);

      expect(loginService.broadcastLogout).toHaveBeenCalled();
      expect(restrictionService.clearOktaRestriction).toHaveBeenCalled();
    });
  });
});
