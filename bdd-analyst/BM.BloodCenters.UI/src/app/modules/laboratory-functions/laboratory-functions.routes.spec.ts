import { LABORATORY_FUNCTIONS_ROUTES } from './laboratory-functions.routes';
import { ROUTE_REGISTRY } from '@core/constants/route-registry';
import { RouteKey } from '@core/constants/route-keys';

describe('LaboratoryFunctionsRoutes - Modify Component Weight', () => {
  it('should include modify-component-weight route in component-production routes', () => {
    const componentProductionRoute = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'component-production');
    expect(componentProductionRoute).toBeDefined();

    const children = componentProductionRoute?.children || [];
    const modifyComponentWeightRoute = children.find(c =>
      c.path?.includes('routine-component-production/modify-component-weight')
    );

    expect(modifyComponentWeightRoute).toBeDefined();
  });

  it('should use correct loadComponent from ROUTE_REGISTRY', () => {
    const componentProductionRoute = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'component-production');
    const children = componentProductionRoute?.children || [];
    const modifyComponentWeightRoute = children.find(c =>
      c.path?.includes('routine-component-production/modify-component-weight')
    );

    expect(modifyComponentWeightRoute?.loadComponent).toBe(
      ROUTE_REGISTRY[RouteKey.ModifyComponentWeight].loadComponent
    );
  });

  it('should have correct path structure', () => {
    const componentProductionRoute = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'component-production');
    const children = componentProductionRoute?.children || [];
    const modifyComponentWeightRoute = children.find(c =>
      c.path?.includes('routine-component-production/modify-component-weight')
    );

    expect(modifyComponentWeightRoute?.path).toBe('routine-component-production/modify-component-weight');
  });

  it('should be accessible from laboratory-functions base route', () => {
    const baseRoute = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'component-production');
    expect(baseRoute).toBeDefined();
    expect(baseRoute?.children).toBeDefined();
    expect(baseRoute?.children?.length).toBeGreaterThan(0);
  });
});

describe('LaboratoryFunctionsRoutes - Instrument Error Log Query', () => {

  it('should use correct loadComponent from ROUTE_REGISTRY', () => {
    const route = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'instrument-error-log-query');

    expect(route?.loadComponent).toBe(
      ROUTE_REGISTRY[RouteKey.InstrumentErrorLogQuery].loadComponent
    );
  });

  it('should have correct path', () => {
    const route = LABORATORY_FUNCTIONS_ROUTES.find(r => r.path === 'instrument-error-log-query');
    expect(route?.path).toBe('instrument-error-log-query');
  });
});
