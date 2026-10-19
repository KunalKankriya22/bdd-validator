import { DeferralsOnHoldStateService } from './deferrals-on-hold-state.service';

describe('DeferralsOnHoldStateService', () => {
  let service: DeferralsOnHoldStateService;

  beforeEach(() => {
    service = new DeferralsOnHoldStateService();
  });

  describe('saveState / getState', () => {
    it('should store and return a defensive copy of the state', () => {
      const state = { filter: 'active', page: 1 };
      service.saveState(state);

      const retrieved = service.getState();
      expect(retrieved).toEqual({ filter: 'active', page: 1 });
      expect(retrieved).not.toBe(state);
    });
  });

  describe('getState', () => {
    it('should return null when no state has been saved', () => {
      expect(service.getState()).toBeNull();
    });
  });

  describe('clearState', () => {
    it('should remove saved state so getState returns null', () => {
      service.saveState({ filter: 'test' });
      service.clearState();
      expect(service.getState()).toBeNull();
    });
  });

  describe('hasState', () => {
    it('should return true only when state has been saved with non-empty keys', () => {
      expect(service.hasState()).toBeFalse();

      service.saveState({ key: 'val' });
      expect(service.hasState()).toBeTrue();

      service.clearState();
      expect(service.hasState()).toBeFalse();
    });

    it('should return false when state is an empty object', () => {
      service.saveState({});
      expect(service.hasState()).toBeFalse();
    });

    it('should return true when state has multiple keys', () => {
      service.saveState({ a: 1, b: 'two', c: true });
      expect(service.hasState()).toBeTrue();
    });
  });

  describe('saveState', () => {
    it('should create a defensive copy so modifying the original does not affect stored state', () => {
      const original = { filter: 'active', page: 2 };
      service.saveState(original);
      original.filter = 'modified';
      original.page = 99;

      const retrieved = service.getState();
      expect(retrieved!.filter).toBe('active');
      expect(retrieved!.page).toBe(2);
    });
  });

  describe('getState', () => {
    it('should return a new copy on each call so mutations do not affect stored state', () => {
      service.saveState({ count: 5 });
      const first = service.getState();
      first!.count = 999;

      const second = service.getState();
      expect(second!.count).toBe(5);
    });

    it('should return null after clearState even if state was previously set', () => {
      service.saveState({ x: 1 });
      expect(service.getState()).not.toBeNull();
      service.clearState();
      expect(service.getState()).toBeNull();
    });
  });

  describe('clearState', () => {
    it('should be safe to call when no state has been saved', () => {
      expect(() => service.clearState()).not.toThrow();
      expect(service.getState()).toBeNull();
      expect(service.hasState()).toBeFalse();
    });

    it('should be safe to call multiple times', () => {
      service.saveState({ data: 'test' });
      service.clearState();
      service.clearState();
      expect(service.getState()).toBeNull();
    });
  });

  describe('save/get/clear lifecycle', () => {
    it('should support overwriting saved state with a new saveState call', () => {
      service.saveState({ version: 1 });
      expect(service.getState()).toEqual({ version: 1 });

      service.saveState({ version: 2, extra: 'data' });
      expect(service.getState()).toEqual({ version: 2, extra: 'data' });
    });

    it('should support saving state after clearing', () => {
      service.saveState({ first: true });
      service.clearState();
      service.saveState({ second: true });
      expect(service.getState()).toEqual({ second: true });
      expect(service.hasState()).toBeTrue();
    });
  });
});
