import { TestBed } from '@angular/core/testing';
import { RestrictionService } from './restriction.service';

describe('RestrictionService', () => {
  let service: RestrictionService;
  let sessionStorageSpy: jasmine.SpyObj<Storage>;
  let originalSessionStorage: Storage;

  beforeEach(() => {
    originalSessionStorage = window.sessionStorage;

    sessionStorageSpy = jasmine.createSpyObj('sessionStorage', [
      'setItem',
      'getItem',
      'removeItem',
      'clear',
      'key'
    ]);

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageSpy,
      writable: true,
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [RestrictionService]
    });

    service = TestBed.inject(RestrictionService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
      configurable: true
    });
  });

  describe('setOktaRestrictionActive', () => {
    it('should set okta_restriction_active in sessionStorage to true', () => {
      service.setOktaRestrictionActive();

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith(
        'okta_restriction_active',
        'true'
      );
    });

    it('should be called once when setting restriction', () => {
      service.setOktaRestrictionActive();

      expect(sessionStorageSpy.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('isOktaRestricted', () => {
    it('should return true when okta_restriction_active is "true"', () => {
      sessionStorageSpy.getItem.and.returnValue('true');

      const result = service.isOktaRestricted();

      expect(result).toBe(true);
      expect(sessionStorageSpy.getItem).toHaveBeenCalledWith('okta_restriction_active');
    });

    it('should return false when okta_restriction_active is null', () => {
      sessionStorageSpy.getItem.and.returnValue(null);

      const result = service.isOktaRestricted();

      expect(result).toBe(false);
    });

    it('should return false when okta_restriction_active has any value other than "true"', () => {
      sessionStorageSpy.getItem.and.returnValue('false');

      const result = service.isOktaRestricted();

      expect(result).toBe(false);
    });

    it('should return false when okta_restriction_active is "True" (case sensitive)', () => {
      sessionStorageSpy.getItem.and.returnValue('True');

      const result = service.isOktaRestricted();

      expect(result).toBe(false);
    });
  });

  describe('clearOktaRestriction', () => {
    it('should remove okta_restriction_active from sessionStorage', () => {
      service.clearOktaRestriction();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('okta_restriction_active');
    });

    it('should be called once when clearing restriction', () => {
      service.clearOktaRestriction();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('setAccessDeniedActive', () => {
    it('should set access_denied_active in sessionStorage to true', () => {
      service.setAccessDeniedActive();

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith(
        'access_denied_active',
        'true'
      );
    });

    it('should be called once when setting access denied', () => {
      service.setAccessDeniedActive();

      expect(sessionStorageSpy.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAccessDenied', () => {
    it('should return true when access_denied_active is "true"', () => {
      sessionStorageSpy.getItem.and.returnValue('true');

      const result = service.isAccessDenied();

      expect(result).toBe(true);
      expect(sessionStorageSpy.getItem).toHaveBeenCalledWith('access_denied_active');
    });

    it('should return false when access_denied_active is null', () => {
      sessionStorageSpy.getItem.and.returnValue(null);

      const result = service.isAccessDenied();

      expect(result).toBe(false);
    });

    it('should return false when access_denied_active has any value other than "true"', () => {
      sessionStorageSpy.getItem.and.returnValue('false');

      const result = service.isAccessDenied();

      expect(result).toBe(false);
    });
  });

  describe('clearAccessDenied', () => {
    it('should remove access_denied_active from sessionStorage', () => {
      service.clearAccessDenied();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('access_denied_active');
    });

    it('should be called once when clearing access denied', () => {
      service.clearAccessDenied();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAllRestrictions', () => {
    it('should clear both okta-restriction and access-denied flags', () => {
      service.clearAllRestrictions();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('okta_restriction_active');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('access_denied_active');
      expect(sessionStorageSpy.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration scenarios', () => {
    it('should correctly manage okta restriction lifecycle: set, check, clear', () => {
      // Set restriction
      service.setOktaRestrictionActive();
      expect(sessionStorageSpy.setItem).toHaveBeenCalled();

      // Check restriction (simulate item exists)
      sessionStorageSpy.getItem.and.returnValue('true');
      expect(service.isOktaRestricted()).toBe(true);

      // Clear restriction
      service.clearOktaRestriction();
      expect(sessionStorageSpy.removeItem).toHaveBeenCalled();

      // Check restriction after clear (simulate item removed)
      sessionStorageSpy.getItem.and.returnValue(null);
      expect(service.isOktaRestricted()).toBe(false);
    });

    it('should correctly manage access denied lifecycle: set, check, clear', () => {
      // Set access denied
      service.setAccessDeniedActive();
      expect(sessionStorageSpy.setItem).toHaveBeenCalled();

      // Check access denied (simulate item exists)
      sessionStorageSpy.getItem.and.returnValue('true');
      expect(service.isAccessDenied()).toBe(true);

      // Clear access denied
      service.clearAccessDenied();
      expect(sessionStorageSpy.removeItem).toHaveBeenCalled();

      // Check access denied after clear (simulate item removed)
      sessionStorageSpy.getItem.and.returnValue(null);
      expect(service.isAccessDenied()).toBe(false);
    });

    it('should manage both restrictions independently', () => {
      // Set both restrictions
      service.setOktaRestrictionActive();
      service.setAccessDeniedActive();

      // Simulate both items exist
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'okta_restriction_active') return 'true';
        if (key === 'access_denied_active') return 'true';
        return null;
      });

      expect(service.isOktaRestricted()).toBe(true);
      expect(service.isAccessDenied()).toBe(true);

      // Clear only okta restriction
      service.clearOktaRestriction();

      // Simulate only access_denied item remains
      sessionStorageSpy.getItem.and.callFake((key: string) => {
        if (key === 'access_denied_active') return 'true';
        return null;
      });

      expect(service.isOktaRestricted()).toBe(false);
      expect(service.isAccessDenied()).toBe(true);
    });

    it('should handle multiple set calls (idempotent)', () => {
      service.setOktaRestrictionActive();
      service.setOktaRestrictionActive();
      service.setOktaRestrictionActive();

      expect(sessionStorageSpy.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple clear calls (idempotent)', () => {
      service.clearOktaRestriction();
      service.clearOktaRestriction();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledTimes(2);
    });
  });
});
