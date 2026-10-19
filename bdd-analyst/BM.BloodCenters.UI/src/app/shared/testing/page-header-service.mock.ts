import { of } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { PageHeaderService } from '@shared/services/page-header.service';

/**
 * Creates a mock Router with events observable for testing PageHeaderService
 */
export function createMockRouter(initialUrl: string = '/'): Partial<Router> {
  return {
    url: initialUrl,
    events: of(new NavigationEnd(0, initialUrl, initialUrl)),
    navigate: () => Promise.resolve(true),
    createUrlTree: () => ({} as any),
    serializeUrl: () => ''
  } as Partial<Router>;
}

/**
 * Creates a mock PageHeaderService for testing
 */
export function createMockPageHeaderService(): Partial<PageHeaderService> {
  return {
    getTitle: () => undefined,
    getSubtitle: () => undefined,
    getCurrentMenuItem: () => undefined
  };
}

/**
 * Creates a mock ActivatedRoute for testing
 */
export function createMockActivatedRoute(): Partial<ActivatedRoute> {
  return {
    snapshot: { params: {}, queryParams: {} } as any,
    params: of({}),
    queryParams: of({})
  } as Partial<ActivatedRoute>;
}

/**
 * Provides common test mocks for components that inject PageHeaderService
 */
export function provideCommonTestMocks() {
  return [
    { provide: Router, useValue: createMockRouter() },
    { provide: ActivatedRoute, useValue: createMockActivatedRoute() }
  ];
}
