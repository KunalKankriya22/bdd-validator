import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { DonorSurveyManagerComponent } from './donor-survey-manager';
import { MenuService } from '@shared/services/menu.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { RouteKey } from '../../../core/constants/route-keys';
import { ROUTES } from '../../../core/constants/route.constants';

describe('DonorSurveyManagerComponent', () => {
  let menuServiceSpy: any;
  let routerSpy: any;
  let component: DonorSurveyManagerComponent;
  let fixture: ComponentFixture<DonorSurveyManagerComponent>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: { firstChild: any };
  let menuService: jasmine.SpyObj<MenuService>;
  let routerEventsSubject: Subject<any>;
  let menuItemsSignal: WritableSignal<any[]>;

  beforeEach(() => {

    routerEventsSubject = new Subject();

    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: routerEventsSubject.asObservable(),
      url: '/donor-functions/donor-survey-manager'
    });

    menuItemsSignal = signal<any[]>([]);
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['findMenuItemByPath', 'getMenuItemsSignal']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(menuItemsSignal.asReadonly());

    activatedRoute = {
      firstChild: {
        snapshot: {
          routeConfig: {
            path: 'qa-library'
          }
        }
      }
    };



      TestBed.configureTestingModule({
      imports: [
        DonorSurveyManagerComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute as any },
        { provide: MenuService, useValue: menuServiceSpy }
      ]
    });


    


      routerSpy.navigate.calls.reset();


      routerSpy.createUrlTree.calls.reset();


      routerSpy.serializeUrl.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.getMenuItemsSignal.and.returnValue(menuItemsSignal.asReadonly());


    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    menuService = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;

    fixture = TestBed.createComponent(DonorSurveyManagerComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {


    it('should load page header from menu service', () => {
      const mockMenuItem = {
        label: 'Custom Survey Manager',
        remarks: 'Custom subtitle from menu',
        path: '/donor-functions/donor-survey-manager'
      };
      menuService.findMenuItemByPath.and.returnValue(mockMenuItem);
      menuItemsSignal.set([{ label: 'menu' }]);

      fixture.detectChanges();

      expect(menuService.findMenuItemByPath).toHaveBeenCalled();
      expect(component.headerConfig.title).toBe('Custom Survey Manager');
      expect(component.headerConfig.subtitle).toBe('Custom subtitle from menu');
    });

    it('should use label as subtitle fallback when remarks is not available', () => {
      const mockMenuItem = {
        label: 'Survey Manager',
        subtitle: 'Subtitle from subtitle field',
        path: '/donor-functions/donor-survey-manager'
      };
      menuService.findMenuItemByPath.and.returnValue(mockMenuItem);
      menuItemsSignal.set([{ label: 'menu' }]);

      fixture.detectChanges();

      expect(component.headerConfig.subtitle).toBe('Subtitle from subtitle field');
    });



    it('should sync tab with current route on init', () => {
      activatedRoute.firstChild.snapshot.routeConfig.path = 'survey-template';
      menuService.findMenuItemByPath.and.returnValue(undefined);

      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(1);
    });

    it('should listen to router events and update tab selection', () => {
      menuService.findMenuItemByPath.and.returnValue(undefined);
      fixture.detectChanges();

      activatedRoute.firstChild.snapshot.routeConfig.path = 'access-management';
      routerEventsSubject.next(new NavigationEnd(1, '/donor-survey-manager/access-management', '/donor-survey-manager/access-management'));

      expect(component.selectedTabIndex).toBe(2);
    });

    it('should not update tab for non-NavigationEnd events', () => {
      menuService.findMenuItemByPath.and.returnValue(undefined);
      activatedRoute.firstChild.snapshot.routeConfig.path = 'qa-library';
      fixture.detectChanges();

      const initialTabIndex = component.selectedTabIndex;
      activatedRoute.firstChild.snapshot.routeConfig.path = 'survey-template';
      routerEventsSubject.next({ type: 'NavigationStart' });

      expect(component.selectedTabIndex).toBe(initialTabIndex);
    });
  });

  describe('syncTabWithRoute', () => {
    beforeEach(() => {
      menuService.findMenuItemByPath.and.returnValue(undefined);
    });

    it('should set selectedTabIndex to 0 for qa-library route', () => {
      activatedRoute.firstChild.snapshot.routeConfig.path = 'qa-library';
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(0);
    });

    it('should set selectedTabIndex to 1 for survey-template route', () => {
      activatedRoute.firstChild.snapshot.routeConfig.path = 'survey-template';
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(1);
    });

    it('should set selectedTabIndex to 2 for access-management route', () => {
      activatedRoute.firstChild.snapshot.routeConfig.path = 'access-management';
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(2);
    });

    it('should not change selectedTabIndex for unknown route', () => {
      activatedRoute.firstChild.snapshot.routeConfig.path = 'unknown-route';
      const initialIndex = component.selectedTabIndex;
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(initialIndex);
    });

    it('should handle when firstChild is null', () => {
      activatedRoute.firstChild = null;
      const initialIndex = component.selectedTabIndex;
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(initialIndex);
    });

    it('should handle when routeConfig is undefined', () => {
      activatedRoute.firstChild.snapshot.routeConfig = undefined;
      const initialIndex = component.selectedTabIndex;
      fixture.detectChanges();

      expect(component.selectedTabIndex).toBe(initialIndex);
    });
  });


  describe('component properties', () => {
    it('should have default selectedTabIndex of 0', () => {
      expect(component.selectedTabIndex).toBe(0);
    });

    it('should have routes array with correct order', () => {
      expect(component['routes']).toEqual(['qa-library', 'survey-template', 'access-management']);
    });

    it('should initialize headerConfig with empty values', () => {
      expect(component.headerConfig).toEqual({
        breadcrumbs: [],
        title: '',
        subtitle: '',
        actions: []
      });
    });
  });

  describe('edge cases', () => {


    it('should handle multiple rapid route changes', () => {
      menuService.findMenuItemByPath.and.returnValue(undefined);
      fixture.detectChanges();

      activatedRoute.firstChild.snapshot.routeConfig.path = 'qa-library';
      routerEventsSubject.next(new NavigationEnd(1, '/test1', '/test1'));
      expect(component.selectedTabIndex).toBe(0);

      activatedRoute.firstChild.snapshot.routeConfig.path = 'survey-template';
      routerEventsSubject.next(new NavigationEnd(2, '/test2', '/test2'));
      expect(component.selectedTabIndex).toBe(1);

      activatedRoute.firstChild.snapshot.routeConfig.path = 'access-management';
      routerEventsSubject.next(new NavigationEnd(3, '/test3', '/test3'));
      expect(component.selectedTabIndex).toBe(2);
    });
  });
});
