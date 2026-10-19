import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { REPORT_ACTIONS_ROUTES } from './report-actions.routes';

describe('REPORT_ACTIONS_ROUTES', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(REPORT_ACTIONS_ROUTES)
      ]
    });

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should have routes defined', () => {
    expect(REPORT_ACTIONS_ROUTES).toBeDefined();
    expect(REPORT_ACTIONS_ROUTES.length).toBeGreaterThan(0);
  });

  it('should have empty path as root route', () => {
    const rootRoute = REPORT_ACTIONS_ROUTES[0];
    expect(rootRoute.path).toBe('');
  });

  it('should have authGuard on root route', () => {
    const rootRoute = REPORT_ACTIONS_ROUTES[0];
    expect(rootRoute.canActivate).toBeDefined();
    expect(rootRoute.canActivate?.length).toBe(1);
  });

  it('should have children routes', () => {
    const rootRoute = REPORT_ACTIONS_ROUTES[0];
    expect(rootRoute.children).toBeDefined();
    expect(rootRoute.children?.length).toBeGreaterThan(0);
  });

  it('should have Report Actions list component as default child route', () => {
    const rootRoute = REPORT_ACTIONS_ROUTES[0];
    const defaultChild = rootRoute.children?.[0];

    expect(defaultChild?.path).toBe('');
    expect(defaultChild?.loadComponent).toBeDefined();
    expect(defaultChild?.title).toBe('Report Actions');
  });

  it('should have loadComponent function for lazy loading', () => {
    const rootRoute = REPORT_ACTIONS_ROUTES[0];
    const defaultChild = rootRoute.children?.[0];

    const componentLoader = defaultChild?.loadComponent;
    expect(componentLoader).toBeDefined();
    expect(typeof componentLoader).toBe('function');
  });
});
