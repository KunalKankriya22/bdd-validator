import { StandingOrderStateService, StandingOrderListState } from './standing-order-state.service';

describe('StandingOrderStateService', () => {
  let service: StandingOrderStateService;

  beforeEach(() => {
    service = new StandingOrderStateService();
  });

  describe('save / restore', () => {
    it('should return saved state on first restore and null on subsequent restore', () => {
      const state: StandingOrderListState = {
        customerType: 'Hospital',
        contractId: 'C100',
        consigneeId: 'CON-1',
        contracts: [],
        consignees: []
      };

      service.save(state);

      expect(service.restore()).toEqual(state);
      expect(service.restore()).toBeNull();
    });
  });

  describe('restore', () => {
    it('should return null when no state has been saved', () => {
      expect(service.restore()).toBeNull();
    });
  });
});
