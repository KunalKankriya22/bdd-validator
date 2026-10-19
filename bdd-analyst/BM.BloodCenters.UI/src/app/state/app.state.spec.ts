import { AppStateService } from './app.state';

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    service = new AppStateService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should not be loading', () => {
      expect(service.isLoading()).toBe(false);
    });

    it('should have null user', () => {
      expect(service.user()).toBeNull();
    });

    it('should have null error', () => {
      expect(service.error()).toBeNull();
    });

    it('should not be authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      service.setLoading(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      service.setLoading(true);
      service.setLoading(false);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set the user', () => {
      const user = { id: '1', name: 'John' };
      service.setUser(user);
      expect(service.user()).toEqual(user);
    });

    it('should mark as authenticated when user is set', () => {
      service.setUser({ id: '1' });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should clear error when setting user', () => {
      service.setError('Some error');
      service.setUser({ id: '1' });
      expect(service.error()).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set the error', () => {
      service.setError('Something went wrong');
      expect(service.error()).toBe('Something went wrong');
    });
  });

  describe('clearError', () => {
    it('should clear the error', () => {
      service.setError('Error');
      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should clear the user', () => {
      service.setUser({ id: '1' });
      service.clearUser();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset all state to defaults', () => {
      service.setLoading(true);
      service.setUser({ id: '1' });
      service.setError('Error');

      service.resetState();

      expect(service.isLoading()).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
