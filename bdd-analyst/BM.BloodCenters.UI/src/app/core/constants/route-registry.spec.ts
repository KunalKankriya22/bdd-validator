import { ROUTE_REGISTRY } from './route-registry';
import { RouteKey } from './route-keys';

describe('RouteRegistry - Modify Component Weight', () => {
  describe('ModifyComponentWeight route', () => {

    it('should have correct path', () => {
      const route = ROUTE_REGISTRY[RouteKey.ModifyComponentWeight];
      expect(route.path).toBe('/laboratory-functions/component-production/routine-component-production/modify-component-weight');
    });

    it('should have loadComponent function', () => {
      const route = ROUTE_REGISTRY[RouteKey.ModifyComponentWeight];
      expect(route.loadComponent).toBeDefined();
      expect(typeof route.loadComponent).toBe('function');
    });

    it('should load ModifyComponentWeightComponent', async () => {
      const route = ROUTE_REGISTRY[RouteKey.ModifyComponentWeight];
      const component = await route.loadComponent();

      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should have path starting with /laboratory-functions', () => {
      const route = ROUTE_REGISTRY[RouteKey.ModifyComponentWeight];
      expect(route.path).toMatch(/^\/laboratory-functions/);
    });

    it('should have path for component-production/routine-component-production', () => {
      const route = ROUTE_REGISTRY[RouteKey.ModifyComponentWeight];
      expect(route.path).toContain('/component-production/routine-component-production');
    });
  });
});
