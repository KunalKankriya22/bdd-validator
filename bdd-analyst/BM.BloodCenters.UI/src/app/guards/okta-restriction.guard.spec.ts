import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { oktaRestrictionGuard } from './okta-restriction.guard';
import { RestrictionService } from '../shared/services/restriction.service';

describe('oktaRestrictionGuard', () => {
  let restrictionService: jasmine.SpyObj<RestrictionService>;
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: jasmine.SpyObj<RouterStateSnapshot>;

  beforeEach(() => {
    const restrictionServiceSpy = jasmine.createSpyObj('RestrictionService', ['isOktaRestricted', 'isAccessDenied']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: RestrictionService, useValue: restrictionServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    restrictionService = TestBed.inject(RestrictionService) as jasmine.SpyObj<RestrictionService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/home' } as jasmine.SpyObj<RouterStateSnapshot>;
  });

  describe('when user is NOT restricted', () => {
    beforeEach(() => {
      restrictionService.isOktaRestricted.and.returnValue(false);
      restrictionService.isAccessDenied.and.returnValue(false);
    });

    it('should allow navigation to /home', () => {
      mockState.url = '/home';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow navigation to /login', () => {
      mockState.url = '/login';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow navigation to /donor-functions', () => {
      mockState.url = '/donor-functions';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow navigation to /okta-restriction', () => {
      mockState.url = '/okta-restriction';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should allow navigation to nested routes', () => {
      mockState.url = '/donor-functions/donor-tests';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('when user IS in okta-restriction', () => {
    beforeEach(() => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      restrictionService.isAccessDenied.and.returnValue(false);
    });

    it('should allow navigation to /okta-restriction (user already on restriction page)', () => {
      mockState.url = '/okta-restriction';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should block navigation to /home and redirect to /okta-restriction', () => {
      mockState.url = '/home';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to /login and redirect to /okta-restriction', () => {
      mockState.url = '/login';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to /forgot-password and redirect to /okta-restriction', () => {
      mockState.url = '/forgot-password';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to /donor-functions and redirect to /okta-restriction', () => {
      mockState.url = '/donor-functions';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to nested routes and redirect to /okta-restriction', () => {
      mockState.url = '/donor-functions/donor-tests/add-edit';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to /access-denied and redirect to /okta-restriction', () => {
      mockState.url = '/access-denied';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should block navigation to /session-expired and redirect to /okta-restriction', () => {
      mockState.url = '/session-expired';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should log warning when blocking navigation', () => {
      spyOn(console, 'warn');
      mockState.url = '/home';

      TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(console.warn).toHaveBeenCalledWith(
        'Navigation blocked: User is in okta-restriction state. Redirecting to /okta-restriction'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL', () => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      mockState.url = '';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should handle root URL "/"', () => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      mockState.url = '/';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should handle URL with query parameters', () => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      mockState.url = '/home?tab=overview';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should handle URL with fragment', () => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      mockState.url = '/home#section1';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should be case-sensitive for /okta-restriction', () => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      mockState.url = '/OKTA-RESTRICTION';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      // Should block because URL doesn't exactly match '/okta-restriction'
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });
  });

  describe('when user IS in access-denied', () => {
    beforeEach(() => {
      restrictionService.isOktaRestricted.and.returnValue(false);
      restrictionService.isAccessDenied.and.returnValue(true);
    });

    it('should allow navigation to /access-denied (user already on restriction page)', () => {
      mockState.url = '/access-denied';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should block navigation to /home and redirect to /access-denied', () => {
      mockState.url = '/home';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('should block navigation to /login and redirect to /access-denied', () => {
      mockState.url = '/login';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('should block navigation to /okta-restriction and redirect to /access-denied', () => {
      mockState.url = '/okta-restriction';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('should block navigation to /donor-functions and redirect to /access-denied', () => {
      mockState.url = '/donor-functions';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('should log warning when blocking navigation', () => {
      spyOn(console, 'warn');
      mockState.url = '/home';

      TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(console.warn).toHaveBeenCalledWith(
        'Navigation blocked: User is in access-denied state. Redirecting to /access-denied'
      );
    });
  });

  describe('when both restrictions are active (edge case)', () => {
    beforeEach(() => {
      restrictionService.isOktaRestricted.and.returnValue(true);
      restrictionService.isAccessDenied.and.returnValue(true);
    });

    it('should prioritize okta-restriction over access-denied', () => {
      mockState.url = '/home';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/okta-restriction']);
    });

    it('should allow navigation if already on okta-restriction page', () => {
      mockState.url = '/okta-restriction';

      const result = TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('guard lifecycle', () => {
    it('should call both isOktaRestricted and isAccessDenied on every guard execution', () => {
      restrictionService.isOktaRestricted.and.returnValue(false);
      restrictionService.isAccessDenied.and.returnValue(false);
      mockState.url = '/home';

      TestBed.runInInjectionContext(() =>
        oktaRestrictionGuard(mockRoute, mockState)
      );

      expect(restrictionService.isOktaRestricted).toHaveBeenCalledTimes(1);
      expect(restrictionService.isAccessDenied).toHaveBeenCalledTimes(1);
    });

  });
});
