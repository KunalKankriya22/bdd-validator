import { LABORATORY_FUNCTIONS_ROUTES } from '../../laboratory-functions.routes';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { MNEMONIC_ROUTE_MAP } from 'src/app/core/constants/fcn-route-map';
import { Routes } from '@angular/router';

describe('Research Product Labeling Routes', () => {
  function findRouteByPath(routes: Routes, segments: string[]): any {
    let current = routes;
    for (const segment of segments) {
      const route = current.find((r) => r.path === segment);
      if (!route) return null;
      if (route.children) {
        current = route.children;
      } else {
        return route;
      }
    }
    return current.find((r) => r.path === segments[segments.length - 1]) || null;
  }

  it('should have ResearchProductLabeling in RouteKey', () => {
    expect(RouteKey.ResearchProductLabeling).toBe('RESEARCH_PRODUCT_LABELING');
  });

  it('should map LBLRSH mnemonic to ResearchProductLabeling', () => {
    expect(MNEMONIC_ROUTE_MAP['LBLRSH']).toBe(RouteKey.ResearchProductLabeling);
  });

  it('should have ResearchProductLabeling in ROUTE_REGISTRY', () => {
    const entry = ROUTE_REGISTRY[RouteKey.ResearchProductLabeling];
    expect(entry).toBeDefined();
    expect(entry.path).toBe(
      '/laboratory-functions/labeling-functions/special-labeling-functions/research-product-labeling',
    );
    expect(entry.loadComponent).toBeDefined();
    expect(typeof entry.loadComponent).toBe('function');
  });

  it('should have research-product-labeling route under special-labeling-functions', () => {
    const labelingFunctions = LABORATORY_FUNCTIONS_ROUTES.find(
      (r) => r.path === 'labeling-functions',
    );
    expect(labelingFunctions).toBeDefined();
    expect(labelingFunctions!.children).toBeDefined();

    const specialLabeling = labelingFunctions!.children!.find(
      (r) => r.path === 'special-labeling-functions',
    );
    expect(specialLabeling).toBeDefined();
    expect(specialLabeling!.children).toBeDefined();

    const rplRoute = specialLabeling!.children!.find(
      (r) => r.path === 'research-product-labeling',
    );
    expect(rplRoute).toBeDefined();
    expect(rplRoute!.loadComponent).toBe(
      ROUTE_REGISTRY[RouteKey.ResearchProductLabeling].loadComponent,
    );
  });

  it('should lazy-load ResearchProductLabelingComponent', async () => {
    const entry = ROUTE_REGISTRY[RouteKey.ResearchProductLabeling];
    const component = await entry.loadComponent();
    expect(component).toBeDefined();
    expect(component.name).toBe('ResearchProductLabelingComponent');
  });
});
