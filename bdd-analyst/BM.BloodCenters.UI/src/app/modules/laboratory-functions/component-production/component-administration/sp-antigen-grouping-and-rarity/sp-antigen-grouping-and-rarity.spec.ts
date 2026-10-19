import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { Subject, of } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SpAntigenGroupingAndRarityComponent } from './sp-antigen-grouping-and-rarity';

@Component({ selector: 'app-page-header-with-breadcrumb', standalone: true, template: '' })
class MockPageHeaderComponent {}

@Component({ selector: 'app-antigen-group', standalone: true, template: '' })
class MockAntigenGroupComponent {}

@Component({ selector: 'app-antigen-rarity', standalone: true, template: '' })
class MockAntigenRarityComponent {}

describe('SpAntigenGroupingAndRarityComponent', () => {
  let component: SpAntigenGroupingAndRarityComponent;
  let fixture: ComponentFixture<SpAntigenGroupingAndRarityComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParams$: Subject<any>;

  function createUrlSegments(paths: string[]): UrlSegment[] {
    return paths.map(p => new UrlSegment(p, {}));
  }

  function buildAndCreate(urlPaths: string[], queryParamsSource?: any) {
    queryParams$ = new Subject<any>();

    const mockActivatedRoute: any = {
      snapshot: {
        url: createUrlSegments(urlPaths)
      },
      queryParams: queryParamsSource !== undefined ? queryParamsSource : queryParams$.asObservable()
    };

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [
        SpAntigenGroupingAndRarityComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideComponent(SpAntigenGroupingAndRarityComponent, {
      set: {
        imports: [
          MockPageHeaderComponent,
          MockAntigenGroupComponent,
          MockAntigenRarityComponent
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }
    });

    fixture = TestBed.createComponent(SpAntigenGroupingAndRarityComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Creation', () => {
    beforeEach(() => {
      buildAndCreate([]);
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have two tabs defined', () => {
      expect(component.tabs.length).toBe(2);
      expect(component.tabs[0]).toEqual({ id: 'antigen-group', label: 'Antigen Group' });
      expect(component.tabs[1]).toEqual({ id: 'antigen-rarity', label: 'Antigen Rarity' });
    });

    it('should initialize selectedTabIndex to 0', () => {
      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should have correct pageHeaderConfig title', () => {
      expect(component.pageHeaderConfig.title).toBe('Special Processing Antigen Grouping and Rarity');
    });

    it('should have correct pageHeaderConfig subtitle', () => {
      expect(component.pageHeaderConfig.subtitle).toBe(
        'Define antigen combinations and rarity criteria for product classification and search.'
      );
    });

    it('should have correct breadcrumbs', () => {
      expect(component.pageHeaderConfig.breadcrumbs.length).toBe(2);
      expect(component.pageHeaderConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.pageHeaderConfig.breadcrumbs[1]).toEqual({
        label: 'Special Processing Antigen Grouping and Rarity',
        link: null
      });
    });
  });

  describe('ngOnInit - URL-based tab selection', () => {
    it('should set selectedTabIndex to 1 when URL contains antigen-rarity', () => {
      buildAndCreate(['sp-antigen-grouping-and-rarity', 'antigen-rarity']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(1);
    });

    it('should set selectedTabIndex to 0 when URL contains antigen-group', () => {
      buildAndCreate(['sp-antigen-grouping-and-rarity', 'antigen-group']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should match antigen-rarity even if it is the only URL segment', () => {
      buildAndCreate(['antigen-rarity']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(1);
    });

    it('should match antigen-group even if it is the only URL segment', () => {
      buildAndCreate(['antigen-group']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should not subscribe to queryParams when URL matches antigen-rarity', () => {
      buildAndCreate(['antigen-rarity']);
      fixture.detectChanges();

      // The queryParams$ subject should have no subscribers since URL matched
      queryParams$.next({ tab: '0' });
      // Tab should remain 1 because queryParams subscription was never set up
      expect(component.selectedTabIndex()).toBe(1);
    });

    it('should not subscribe to queryParams when URL matches antigen-group', () => {
      buildAndCreate(['antigen-group']);
      fixture.detectChanges();

      queryParams$.next({ tab: '1' });
      // Tab should remain 0 because queryParams subscription was never set up
      expect(component.selectedTabIndex()).toBe(0);
    });
  });

  describe('ngOnInit - queryParams-based tab selection', () => {
    it('should set selectedTabIndex to 0 when queryParam tab is 0', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: '0' });

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should set selectedTabIndex to 1 when queryParam tab is 1', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: '1' });

      expect(component.selectedTabIndex()).toBe(1);
    });

    it('should default to 0 when queryParam tab is an invalid string', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: 'abc' });

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should default to 0 when queryParam tab is not present', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({});

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should default to 0 when queryParam tab is a number other than 0 or 1', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: '5' });

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should default to 0 when queryParam tab is negative', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: '-1' });

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should default to 0 when queryParam tab is NaN-producing value', () => {
      buildAndCreate([]);
      fixture.detectChanges();
      queryParams$.next({ tab: undefined });

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should respond to multiple sequential queryParam changes', () => {
      buildAndCreate([]);
      fixture.detectChanges();

      queryParams$.next({ tab: '0' });
      expect(component.selectedTabIndex()).toBe(0);

      queryParams$.next({ tab: '1' });
      expect(component.selectedTabIndex()).toBe(1);

      queryParams$.next({ tab: '0' });
      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should use queryParams when URL path is empty', () => {
      buildAndCreate([], undefined);
      fixture.detectChanges();
      queryParams$.next({ tab: '1' });

      expect(component.selectedTabIndex()).toBe(1);
    });

    it('should use queryParams when URL does not contain tab identifiers', () => {
      buildAndCreate(['some-other-path'], undefined);
      fixture.detectChanges();
      queryParams$.next({ tab: '1' });

      expect(component.selectedTabIndex()).toBe(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$ subject', () => {
      buildAndCreate([]);
      fixture.detectChanges();

      const destroySubject = (component as any).destroy$ as Subject<void>;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });

    it('should unsubscribe from queryParams after destroy', () => {
      buildAndCreate([]);
      fixture.detectChanges();

      queryParams$.next({ tab: '1' });
      expect(component.selectedTabIndex()).toBe(1);

      component.ngOnDestroy();

      // After destroy, further emissions should not change the tab
      queryParams$.next({ tab: '0' });
      expect(component.selectedTabIndex()).toBe(1);
    });
  });

  describe('onTabChange', () => {
    beforeEach(() => {
      buildAndCreate([]);
      fixture.detectChanges();
    });

    it('should navigate to antigen-group path when first tab is selected', () => {
      const event = { index: 0 } as MatTabChangeEvent;

      component.onTabChange(event);

      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/antigen-group'
      ]);
    });

    it('should navigate to antigen-rarity path when second tab is selected', () => {
      const event = { index: 1 } as MatTabChangeEvent;

      component.onTabChange(event);

      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/antigen-rarity'
      ]);
    });

    it('should call router.navigate exactly once per tab change', () => {
      const event = { index: 0 } as MatTabChangeEvent;
      component.onTabChange(event);

      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should construct the path using the tab id from the tabs array', () => {
      const event = { index: 1 } as MatTabChangeEvent;
      component.onTabChange(event);

      const expectedPath = '/laboratory-functions/component-production/component-administration/sp-antigen-grouping-and-rarity/' + component.tabs[1].id;
      expect(routerSpy.navigate).toHaveBeenCalledWith([expectedPath]);
    });
  });
});
