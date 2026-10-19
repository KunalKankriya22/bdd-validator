import { InvestigateDuplicateStateService, InvestigateSavedState } from './investigate-duplicate-state.service';

describe('InvestigateDuplicateStateService', () => {
  let service: InvestigateDuplicateStateService;

  beforeEach(() => {
    service = new InvestigateDuplicateStateService();
  });

  describe('save / restore', () => {
    it('should return saved state on first restore and clear it so second restore returns null', () => {
      const state: InvestigateSavedState = {
        batchId: 'B001',
        selectedDonorId: 'D123',
        visitedSections: {} as any
      };

      service.save(state);
      const restored = service.restore();

      expect(restored).toEqual(state);
      expect(service.restore()).toBeNull();
    });
  });

  describe('hasSavedState', () => {
    it('should return true after save and false after restore consumes it', () => {
      expect(service.hasSavedState()).toBeFalse();

      service.save({ batchId: 'B1', selectedDonorId: 'D1', visitedSections: {} as any });
      expect(service.hasSavedState()).toBeTrue();

      service.restore();
      expect(service.hasSavedState()).toBeFalse();
    });
  });
});
