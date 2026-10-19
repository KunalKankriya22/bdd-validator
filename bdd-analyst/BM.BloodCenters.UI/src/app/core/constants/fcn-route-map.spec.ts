
import { MNEMONIC_ROUTE_MAP, getRouteKeyForMenuItem } from './fcn-route-map';
import { RouteKey } from './route-keys';

describe('FcnRouteMap - Modify Component Weight', () => {
  describe('MNEMONIC_ROUTE_MAP', () => {
    it('should map CPIWEIGH mnemonic to ModifyComponentWeight route', () => {
      expect(MNEMONIC_ROUTE_MAP['CPIWEIGH']).toBe(RouteKey.ModifyComponentWeight);
    });

    it('should map COMPWT mnemonic to ModifyComponentWeight route', () => {
      expect(MNEMONIC_ROUTE_MAP['COMPWT']).toBe(RouteKey.ModifyComponentWeight);
    });

    it('should have both mnemonics pointing to the same route', () => {
      expect(MNEMONIC_ROUTE_MAP['CPIWEIGH']).toBe(MNEMONIC_ROUTE_MAP['COMPWT']);
    });
  });

  describe('getRouteKeyForMenuItem', () => {
    it('should return ModifyComponentWeight route for CPIWEIGH mnemonic', () => {
      const menuItem = { mnemonic: 'CPIWEIGH' };
      const routeKey = getRouteKeyForMenuItem(menuItem);

      expect(routeKey).toBe(RouteKey.ModifyComponentWeight);
    });

    it('should return ModifyComponentWeight route for COMPWT mnemonic', () => {
      const menuItem = { mnemonic: 'COMPWT' };
      const routeKey = getRouteKeyForMenuItem(menuItem);

      expect(routeKey).toBe(RouteKey.ModifyComponentWeight);
    });


  });
});
