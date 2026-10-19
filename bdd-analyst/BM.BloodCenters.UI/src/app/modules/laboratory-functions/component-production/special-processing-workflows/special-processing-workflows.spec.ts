import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EMPTY, of, Subject } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';

import { SpecialProcessingWorkflowsComponent } from './special-processing-workflows';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpecialProcessingWorkflowsComponent', () => {
  let component: SpecialProcessingWorkflowsComponent;
  let fixture: ComponentFixture<SpecialProcessingWorkflowsComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;

  function createComponent(urlSegments: string[], queryParams: Record<string, string> = {}) {
    const segments = urlSegments.map(s => new UrlSegment(s, {}));

    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: EMPTY,
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getCurrentMenuItem', 'getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(undefined),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

    const headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [SpecialProcessingWorkflowsComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { url: segments, params: {} },
            queryParams: of(queryParams),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(SpecialProcessingWorkflowsComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  describe('Tab initialization from URL path', () => {
    it('should select stages tab when URL contains "stages"', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(0);
    });

    it('should select products tab when URL contains "products"', () => {
      createComponent(['special-processing-workflows', 'products']);
      fixture.detectChanges();

      expect(component.selectedTabIndex()).toBe(1);
    });
  });

  describe('Tab initialization from query params', () => {
    it('should fall back to query param tab=0 when URL has no path match', fakeAsync(() => {
      createComponent(['special-processing-workflows'], { tab: '0' });
      fixture.detectChanges();
      tick();

      expect(component.selectedTabIndex()).toBe(0);
    }));

    it('should default to products tab (index 1) when no query params present', fakeAsync(() => {
      createComponent(['special-processing-workflows']);
      fixture.detectChanges();
      tick();

      expect(component.selectedTabIndex()).toBe(1);
    }));

    it('should default to products tab when query param is invalid', fakeAsync(() => {
      createComponent(['special-processing-workflows'], { tab: 'xyz' });
      fixture.detectChanges();
      tick();

      expect(component.selectedTabIndex()).toBe(1);
    }));
  });

  describe('Tab change navigation', () => {
    it('should navigate to stages path when stages tab is selected', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      component.onTabChange({ index: 0 } as MatTabChangeEvent);

      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/special-processing-workflows/stages',
      ]);
    });

    it('should navigate to products path when products tab is selected', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      component.onTabChange({ index: 1 } as MatTabChangeEvent);

      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/laboratory-functions/component-production/special-processing-workflows/products',
      ]);
    });
  });

  describe('Tab configuration', () => {
    it('should have two tabs with correct ids', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      expect(component.tabs.length).toBe(2);
      expect(component.tabs[0].id).toBe('stages');
      expect(component.tabs[1].id).toBe('products');
    });

    it('should have correct labels for each tab', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      expect(component.tabs[0].label).toBe('Stages');
      expect(component.tabs[1].label).toBe('Products');
    });
  });

  describe('Page header configuration', () => {
    it('should have correct initial pageHeaderConfig before effect runs', () => {
      createComponent(['special-processing-workflows', 'stages']);

      expect(component.pageHeaderConfig.title).toBe('');
      expect(component.pageHeaderConfig.subtitle).toBe('');
      expect(component.pageHeaderConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
      ]);
    });

    it('should update pageHeaderConfig when pageHeaderData returns data with title and subtitle', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue({
        title: 'Special Processing',
        subtitle: 'Manage workflows',
      });
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('Special Processing');
      expect(component.pageHeaderConfig.subtitle).toBe('Manage workflows');
      expect(component.pageHeaderConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
        { label: 'Special Processing', link: null },
      ]);
    });

    it('should set subtitle to empty string when pageHeaderData has title but no subtitle', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue({
        title: 'Special Processing',
      });
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('Special Processing');
      expect(component.pageHeaderConfig.subtitle).toBe('');
    });

    it('should fall back to menuService when pageHeaderData is undefined', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Fallback Title',
        remarks: 'Fallback remarks',
      } as any);
      fixture.detectChanges();

      expect(menuServiceSpy.findMenuItemByPath).toHaveBeenCalledWith(
        '/laboratory-functions/component-production/special-processing-workflows/products'
      );
      expect(component.pageHeaderConfig.title).toBe('Fallback Title');
      expect(component.pageHeaderConfig.subtitle).toBe('Fallback remarks');
      expect(component.pageHeaderConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
        { label: 'Fallback Title', link: null },
      ]);
    });

    it('should use subtitle when fallback item has no remarks', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Fallback Title',
        subtitle: 'Fallback subtitle',
      } as any);
      fixture.detectChanges();

      expect(component.pageHeaderConfig.subtitle).toBe('Fallback subtitle');
    });

    it('should prefer remarks over subtitle when both are present on fallback item', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Fallback Title',
        remarks: 'Has remarks',
        subtitle: 'Has subtitle',
      } as any);
      fixture.detectChanges();

      expect(component.pageHeaderConfig.subtitle).toBe('Has remarks');
    });

    it('should use undefined subtitle when fallback item has neither remarks nor subtitle', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Fallback Title',
      } as any);
      fixture.detectChanges();

      // remarks?.trim() || subtitle?.trim() => undefined || undefined => undefined
      // Then in the outer if(pageData): subtitle: pageData.subtitle || '' => ''
      expect(component.pageHeaderConfig.subtitle).toBe('');
    });

    it('should not update pageHeaderConfig when both pageHeaderData and fallback are undefined', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);
      fixture.detectChanges();

      // pageHeaderConfig should remain at initial values
      expect(component.pageHeaderConfig.title).toBe('');
      expect(component.pageHeaderConfig.subtitle).toBe('');
      expect(component.pageHeaderConfig.breadcrumbs).toEqual([
        { label: 'Home', link: '/home' },
      ]);
    });

    it('should handle fallback item with empty/whitespace remarks falling through to subtitle', () => {
      createComponent(['special-processing-workflows', 'stages']);
      (pageHeaderServiceSpy.pageHeaderData as jasmine.Spy).and.returnValue(undefined);
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Fallback Title',
        remarks: '   ',
        subtitle: 'Actual subtitle',
      } as any);
      fixture.detectChanges();

      // '   '.trim() => '' which is falsy, so falls through to subtitle
      expect(component.pageHeaderConfig.subtitle).toBe('Actual subtitle');
    });
  });

  describe('Query param tab=1', () => {
    it('should select products tab when query param tab is 1', fakeAsync(() => {
      createComponent(['special-processing-workflows'], { tab: '1' });
      fixture.detectChanges();
      tick();

      expect(component.selectedTabIndex()).toBe(1);
    }));
  });

  describe('onTabChange edge cases', () => {
    it('should throw when tab index is out of range', () => {
      createComponent(['special-processing-workflows', 'stages']);
      fixture.detectChanges();

      // tabs[2] is undefined, so accessing tab.id throws a TypeError
      expect(() => component.onTabChange({ index: 2 } as MatTabChangeEvent)).toThrow();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject and unsubscribe from queryParams', fakeAsync(() => {
      const queryParamsSubject = new Subject<Record<string, string>>();
      const segments = ['special-processing-workflows'].map(s => new UrlSegment(s, {}));

      routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
        events: EMPTY,
      });
      routerSpy.createUrlTree.and.returnValue({} as any);
      routerSpy.serializeUrl.and.returnValue('');
      pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getCurrentMenuItem', 'getTitle', 'getSubtitle'], {
        pageHeaderData: jasmine.createSpy().and.returnValue(undefined),
      });
      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
      menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
      menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

      const headerServiceSpy = createMockHeaderService();
      TestBed.configureTestingModule({
        imports: [SpecialProcessingWorkflowsComponent, NoopAnimationsModule],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: Router, useValue: routerSpy },
          { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
          { provide: MenuService, useValue: menuServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { url: segments, params: {} },
              queryParams: queryParamsSubject.asObservable(),
            },
          },
        ],
      });

      fixture = TestBed.createComponent(SpecialProcessingWorkflowsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      // Verify subscription is active
      queryParamsSubject.next({ tab: '0' });
      tick();
      expect(component.selectedTabIndex()).toBe(0);

      // Trigger destroy
      component.ngOnDestroy();

      // After destroy, emitting new values should not change the tab
      queryParamsSubject.next({ tab: '1' });
      tick();
      expect(component.selectedTabIndex()).toBe(0); // Should remain unchanged
    }));
  });

  describe('selectedTabIndex signal', () => {
    it('should default to 0', () => {
      createComponent(['special-processing-workflows', 'stages']);
      // Before detectChanges, the signal has its initial value
      expect(component.selectedTabIndex()).toBe(0);
    });
  });
});
