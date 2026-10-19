import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { NavigationEnd } from '@angular/router';

import { LeftSidenav } from './left-sidenav';
import { MenuService, MenuItem } from '../../services/menu.service';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-search',
  standalone: true,
  template: '',
})
class SearchComponentStub {
  menuItems: MenuItem[] = [];
  isExpanded = false;
  isCollapsed = false;
  clearSearchValue = jest.fn();
}

const makeMenuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  label: 'Test Item',
  active: false,
  ...overrides,
});

const buildMenuTree = (): MenuItem[] => [
  makeMenuItem({
    label: 'Donor Functions',
    fcnIcon: ' Donate ',
    children: [
      makeMenuItem({
        label: 'Recruitment',
        children: [
          makeMenuItem({ label: 'Drive List', routePath: '/donor/recruitment/drive-list', routeKey: 'DriveList' as any }),
          makeMenuItem({ label: 'Create Drive', routePath: '/donor/recruitment/create-drive', routeKey: 'CreateDrive' as any }),
        ],
      }),
      makeMenuItem({ label: 'Donor Search', routePath: '/donor/search', routeKey: 'DonorSearch' as any }),
    ],
  }),
  makeMenuItem({
    label: 'Lab',
    fcnIcon: 'Science',
    children: [
      makeMenuItem({ label: 'Blood Typing', routePath: '/lab/blood-typing', routeKey: 'BloodTyping' as any }),
    ],
  }),
  makeMenuItem({ label: 'Distribution', routePath: '/distribution', routeKey: 'Distribution' as any }),
];

describe('LeftSidenav', () => {
  let component: LeftSidenav;
  let fixture: ComponentFixture<LeftSidenav>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockNavigationService: jasmine.SpyObj<NavigationService>;
  let mockRouter: { url: string; navigate: jest.Mock; events: Subject<any> };
  let menuItemsSignal: ReturnType<typeof signal<MenuItem[]>>;

  const menuTree = buildMenuTree();

  beforeEach(async () => {
    menuItemsSignal = signal<MenuItem[]>([]);

    mockMenuService = jasmine.createSpyObj('MenuService', [
      'getMenuItems',
      'getMenuItemsSignal',
      'isRouteAccessible',
    ]);
    mockMenuService.getMenuItems.and.returnValue(of(menuTree));
    mockMenuService.getMenuItemsSignal.and.returnValue(menuItemsSignal.asReadonly());
    mockMenuService.isRouteAccessible.and.returnValue(true);

    mockNavigationService = jasmine.createSpyObj('NavigationService', ['getNavigationPath']);
    mockNavigationService.getNavigationPath.and.returnValue('/donor/search');

    mockRouter = {
      url: '/home',
      navigate: jest.fn().mockResolvedValue(true),
      events: new Subject(),
    };

    await TestBed.configureTestingModule({
      imports: [LeftSidenav],
      providers: [
        provideRouter([]),
        { provide: MenuService, useValue: mockMenuService },
        { provide: NavigationService, useValue: mockNavigationService },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(LeftSidenav, {
        set: {
          imports: [SearchComponentStub],
          template: '<app-search></app-search>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LeftSidenav);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // ngOnInit / loadMenuItems
  // ---------------------------------------------------------------------------

  describe('ngOnInit / loadMenuItems', () => {
    it('should load menu items on init and set displayedMenuItems', () => {
      expect(mockMenuService.getMenuItems).toHaveBeenCalled();
      expect(component.menuItems.length).toBe(3);
      expect(component.displayedMenuItems.length).toBe(3);
      expect(component.isLoadingMenu).toBe(false);
    });

    it('should redirect to /home when current route is not accessible', () => {
      mockMenuService.isRouteAccessible.and.returnValue(false);
      mockRouter.url = '/some/restricted';
      mockMenuService.getMenuItems.and.returnValue(of(menuTree));

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not redirect when current route is /home', () => {
      mockRouter.url = '/home';
      mockMenuService.getMenuItems.and.returnValue(of(menuTree));

      mockRouter.navigate.mockClear();
      component.ngOnInit();

      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
    });

    it('should handle menu load error', () => {
      mockMenuService.getMenuItems.and.returnValue(throwError(() => new Error('API down')));

      component.ngOnInit();

      expect(component.isLoadingMenu).toBe(false);
      expect(component.menuLoadError).toBe('Failed to load menu items. Please try refreshing the page.');
      expect(component.menuItems).toEqual([]);
      expect(component.displayedMenuItems).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getProcessedIcon
  // ---------------------------------------------------------------------------

  describe('getProcessedIcon', () => {
    it('should trim and lowercase the icon name', () => {
      expect(component.getProcessedIcon(' Donate ')).toBe('donate');
    });

    it('should return empty string for undefined', () => {
      expect(component.getProcessedIcon(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.getProcessedIcon('')).toBe('');
    });

    it('should handle already lowercase icon', () => {
      expect(component.getProcessedIcon('science')).toBe('science');
    });
  });

  // ---------------------------------------------------------------------------
  // getCollapseIcon
  // ---------------------------------------------------------------------------

  describe('getCollapseIcon', () => {
    it('should return right arrow when collapsed', () => {
      component.isCollapsed = true;

      expect(component.getCollapseIcon()).toBe('keyboard_double_arrow_right');
    });

    it('should return left arrow when expanded', () => {
      component.isCollapsed = false;

      expect(component.getCollapseIcon()).toBe('keyboard_double_arrow_left');
    });
  });

  // ---------------------------------------------------------------------------
  // getMenuIcon (legacy)
  // ---------------------------------------------------------------------------

  describe('getMenuIcon', () => {
    it('should return regular icon path for non-hovered item', () => {
      component.hoveredItem = null;
      component.currentParentMenu = null;

      const result = component.getMenuIcon('Donor Functions');

      expect(result).toBe('assets/images/navigation/donor-functions.svg');
    });

    it('should return filled icon path for hovered item', () => {
      component.hoveredItem = 'Donor Functions';

      const result = component.getMenuIcon('Donor Functions');

      expect(result).toBe('assets/images/navigation/filled-donor-functions.svg');
    });

    it('should return filled icon for current parent menu', () => {
      component.hoveredItem = null;
      component.currentParentMenu = makeMenuItem({ label: 'Lab' });

      const result = component.getMenuIcon('Lab');

      expect(result).toBe('assets/images/navigation/filled-lab.svg');
    });

    it('should return empty string for unknown label', () => {
      const result = component.getMenuIcon('Unknown');

      expect(result).toBe('');
    });

    it('should map all known labels correctly', () => {
      component.hoveredItem = null;
      component.currentParentMenu = null;

      expect(component.getMenuIcon('Distribution')).toBe('assets/images/navigation/distributions.svg');
      expect(component.getMenuIcon('User Utilities')).toBe('assets/images/navigation/user-utilities.svg');
      expect(component.getMenuIcon('APIs and Integration')).toBe('assets/images/navigation/api-integration.svg');
      expect(component.getMenuIcon('Application Administration')).toBe('assets/images/navigation/app-administration.svg');
      expect(component.getMenuIcon('System Administration')).toBe('assets/images/navigation/system-admin.svg');
    });
  });

  // ---------------------------------------------------------------------------
  // getParentMenuIcon (legacy)
  // ---------------------------------------------------------------------------

  describe('getParentMenuIcon', () => {
    it('should return filled icon for current parent menu', () => {
      component.currentParentMenu = makeMenuItem({ label: 'Lab' });

      const result = component.getParentMenuIcon();

      expect(result).toBe('assets/images/navigation/filled-lab.svg');
    });

    it('should return empty string when no parent menu', () => {
      component.currentParentMenu = null;

      const result = component.getParentMenuIcon();

      expect(result).toBe('');
    });

    it('should return empty string for unmapped parent label', () => {
      component.currentParentMenu = makeMenuItem({ label: 'Unknown' });

      const result = component.getParentMenuIcon();

      expect(result).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onMenuItemMouseEnter / onMenuItemMouseLeave
  // ---------------------------------------------------------------------------

  describe('onMenuItemMouseEnter / onMenuItemMouseLeave', () => {
    it('should set hoveredItem on mouse enter', () => {
      component.onMenuItemMouseEnter('Lab');

      expect(component.hoveredItem).toBe('Lab');
    });

    it('should clear hoveredItem on mouse leave', () => {
      component.hoveredItem = 'Lab';

      component.onMenuItemMouseLeave();

      expect(component.hoveredItem).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // clearAllActiveStates
  // ---------------------------------------------------------------------------

  describe('clearAllActiveStates', () => {
    it('should clear active flag on flat list', () => {
      const items = [
        makeMenuItem({ label: 'A', active: true }),
        makeMenuItem({ label: 'B', active: true }),
      ];

      component.clearAllActiveStates(items);

      expect(items.every(i => i.active === false)).toBe(true);
    });

    it('should clear active flag recursively through children', () => {
      const items = [
        makeMenuItem({
          label: 'Parent',
          active: true,
          children: [
            makeMenuItem({
              label: 'Child',
              active: true,
              children: [
                makeMenuItem({ label: 'Grandchild', active: true }),
              ],
            }),
          ],
        }),
      ];

      component.clearAllActiveStates(items);

      expect(items[0].active).toBe(false);
      expect(items[0].children![0].active).toBe(false);
      expect(items[0].children![0].children![0].active).toBe(false);
    });

    it('should handle items with no children', () => {
      const items = [makeMenuItem({ label: 'Solo', active: true })];

      component.clearAllActiveStates(items);

      expect(items[0].active).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // isSidebarExpanded / isSidebarCollapsed getters
  // ---------------------------------------------------------------------------

  describe('isSidebarExpanded / isSidebarCollapsed', () => {
    it('should be expanded when not collapsed', () => {
      component.isCollapsed = false;
      component.isHovering = false;

      expect(component.isSidebarExpanded).toBe(true);
      expect(component.isSidebarCollapsed).toBe(false);
    });

    it('should be collapsed when collapsed and not hovering', () => {
      component.isCollapsed = true;
      component.isHovering = false;

      expect(component.isSidebarExpanded).toBe(false);
      expect(component.isSidebarCollapsed).toBe(true);
    });

    it('should be expanded when collapsed but hovering', () => {
      component.isCollapsed = true;
      component.isHovering = true;

      expect(component.isSidebarExpanded).toBe(true);
      expect(component.isSidebarCollapsed).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toggleCollapse
  // ---------------------------------------------------------------------------

  describe('toggleCollapse', () => {
    it('should toggle isCollapsed from false to true', () => {
      component.isCollapsed = false;

      component.toggleCollapse();

      expect(component.isCollapsed).toBe(true);
    });

    it('should toggle isCollapsed from true to false', () => {
      component.isCollapsed = true;

      component.toggleCollapse();

      expect(component.isCollapsed).toBe(false);
    });

    it('should clear isHovering and set suppressHoverUntil when collapsing', () => {
      component.isCollapsed = false;
      component.isHovering = true;

      component.toggleCollapse();

      expect(component.isHovering).toBe(false);
      expect(component.suppressHoverUntil).toBeGreaterThan(0);
    });

    it('should collapse all expanded children when collapsing', () => {
      component.menuItems = [
        makeMenuItem({ label: 'A', expanded: true, children: [makeMenuItem()] }),
        makeMenuItem({ label: 'B', expanded: true, children: [makeMenuItem()] }),
      ];
      component.isCollapsed = false;

      component.toggleCollapse();

      expect(component.menuItems[0].expanded).toBe(false);
      expect(component.menuItems[1].expanded).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // expand
  // ---------------------------------------------------------------------------

  describe('expand', () => {
    it('should set isCollapsed to false', () => {
      component.isCollapsed = true;

      component.expand();

      expect(component.isCollapsed).toBe(false);
    });

    it('should clear suppressHoverUntil', () => {
      component.suppressHoverUntil = Date.now() + 10000;

      component.expand();

      expect(component.suppressHoverUntil).toBe(0);
    });

    it('should clear isHovering', () => {
      component.isHovering = true;

      component.expand();

      expect(component.isHovering).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onMouseEnter / onMouseLeave
  // ---------------------------------------------------------------------------

  describe('onMouseEnter', () => {
    it('should set isHovering to true when collapsed', () => {
      component.isCollapsed = true;
      component.suppressHoverUntil = 0;

      component.onMouseEnter();

      expect(component.isHovering).toBe(true);
    });

    it('should not set isHovering when not collapsed', () => {
      component.isCollapsed = false;

      component.onMouseEnter();

      expect(component.isHovering).toBe(false);
    });

    it('should ignore hover during suppression window', () => {
      component.isCollapsed = true;
      component.suppressHoverUntil = Date.now() + 10000;

      component.onMouseEnter();

      expect(component.isHovering).toBe(false);
    });

    it('should allow hover after suppression window expires', () => {
      component.isCollapsed = true;
      component.suppressHoverUntil = Date.now() - 1;

      component.onMouseEnter();

      expect(component.isHovering).toBe(true);
    });
  });

  describe('onMouseLeave', () => {
    it('should clear isHovering when hovering', () => {
      component.isHovering = true;
      component.isCollapsed = true;
      component.menuItems = buildMenuTree();

      component.onMouseLeave();

      expect(component.isHovering).toBe(false);
    });

    it('should do nothing when not hovering', () => {
      component.isHovering = false;

      component.onMouseLeave();

      expect(component.isHovering).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toggleSubmenu
  // ---------------------------------------------------------------------------

  describe('toggleSubmenu', () => {
    it('should switch to submenu view from main when item has children', () => {
      const item = makeMenuItem({
        label: 'Donor Functions',
        children: [makeMenuItem({ label: 'Child' })],
      });
      component.isCollapsed = false;
      component.currentView = 'main';
      component.menuItems = [item];

      component.toggleSubmenu(item);

      expect(component.currentView).toBe('submenu');
      expect(component.currentParentMenu).toBe(item);
      expect(component.displayedMenuItems).toBe(item.children!);
      expect(component.breadcrumbTrail).toEqual([item]);
    });

    it('should navigate to nested submenu when already in submenu view', () => {
      const childItem = makeMenuItem({
        label: 'Nested',
        children: [makeMenuItem({ label: 'Leaf' })],
      });
      component.currentView = 'submenu';
      component.isCollapsed = false;
      component.breadcrumbTrail = [makeMenuItem({ label: 'Parent' })];

      component.toggleSubmenu(childItem);

      expect(component.currentSubmenu).toBe(childItem);
      expect(component.displayedMenuItems).toBe(childItem.children!);
      expect(component.breadcrumbTrail.length).toBe(2);
    });

    it('should not toggle when item has no children', () => {
      const item = makeMenuItem({ label: 'Leaf' });
      component.currentView = 'main';

      component.toggleSubmenu(item);

      expect(component.currentView).toBe('main');
    });

    it('should not toggle when collapsed and not hovering', () => {
      const item = makeMenuItem({
        label: 'Folder',
        children: [makeMenuItem()],
      });
      component.isCollapsed = true;
      component.isHovering = false;
      component.currentView = 'main';

      component.toggleSubmenu(item);

      expect(component.currentView).toBe('main');
    });

    it('should toggle when collapsed but hovering', () => {
      const item = makeMenuItem({
        label: 'Folder',
        children: [makeMenuItem()],
      });
      component.isCollapsed = true;
      component.isHovering = true;
      component.currentView = 'main';
      component.menuItems = [item];

      component.toggleSubmenu(item);

      expect(component.currentView).toBe('submenu');
    });

    it('should set the clicked item as active and clear others', () => {
      const itemA = makeMenuItem({ label: 'A', active: true, children: [makeMenuItem()] });
      const itemB = makeMenuItem({ label: 'B', children: [makeMenuItem()] });
      component.currentView = 'main';
      component.isCollapsed = false;
      component.menuItems = [itemA, itemB];

      component.toggleSubmenu(itemB);

      expect(itemA.active).toBe(false);
      expect(itemB.active).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // navigateBack
  // ---------------------------------------------------------------------------

  describe('navigateBack', () => {
    it('should pop last breadcrumb and show previous children when multiple levels deep', () => {
      const parent = makeMenuItem({
        label: 'Parent',
        children: [makeMenuItem({ label: 'ParentChild' })],
      });
      const child = makeMenuItem({
        label: 'Child',
        children: [makeMenuItem({ label: 'Leaf' })],
      });
      component.breadcrumbTrail = [parent, child];

      component.navigateBack();

      expect(component.breadcrumbTrail).toEqual([parent]);
      expect(component.currentSubmenu).toBe(parent);
      expect(component.displayedMenuItems).toEqual(parent.children!);
    });

    it('should reset to main menu when at first breadcrumb level', () => {
      const parent = makeMenuItem({ label: 'Parent' });
      component.breadcrumbTrail = [parent];
      component.menuItems = buildMenuTree();

      component.navigateBack();

      expect(component.currentView).toBe('main');
      expect(component.currentParentMenu).toBeNull();
      expect(component.breadcrumbTrail).toEqual([]);
    });

    it('should reset to main menu when breadcrumb is empty', () => {
      component.breadcrumbTrail = [];
      component.menuItems = buildMenuTree();

      component.navigateBack();

      expect(component.currentView).toBe('main');
    });
  });

  // ---------------------------------------------------------------------------
  // navigateToBreadcrumb
  // ---------------------------------------------------------------------------

  describe('navigateToBreadcrumb', () => {
    it('should navigate to first level when index is 0', () => {
      const root = makeMenuItem({
        label: 'Root',
        children: [makeMenuItem({ label: 'RootChild' })],
      });
      const nested = makeMenuItem({ label: 'Nested' });
      component.breadcrumbTrail = [root, nested];

      component.navigateToBreadcrumb(0);

      expect(component.currentView).toBe('submenu');
      expect(component.breadcrumbTrail).toEqual([root]);
      expect(component.currentSubmenu).toBeNull();
      expect(component.displayedMenuItems).toEqual(root.children!);
    });

    it('should navigate to specific nested level', () => {
      const root = makeMenuItem({ label: 'Root' });
      const mid = makeMenuItem({
        label: 'Mid',
        children: [makeMenuItem({ label: 'MidChild' })],
      });
      const deep = makeMenuItem({ label: 'Deep' });
      component.breadcrumbTrail = [root, mid, deep];

      component.navigateToBreadcrumb(1);

      expect(component.breadcrumbTrail).toEqual([root, mid]);
      expect(component.currentSubmenu).toBe(mid);
      expect(component.displayedMenuItems).toEqual(mid.children!);
    });
  });

  // ---------------------------------------------------------------------------
  // goToHome
  // ---------------------------------------------------------------------------

  describe('goToHome', () => {
    it('should navigate to /home', () => {
      component.menuItems = buildMenuTree();

      component.goToHome();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should reset to main menu view', () => {
      component.currentView = 'submenu';
      component.currentParentMenu = makeMenuItem({ label: 'P' });
      component.breadcrumbTrail = [makeMenuItem()];
      component.menuItems = buildMenuTree();

      component.goToHome();

      expect(component.currentView).toBe('main');
      expect(component.currentParentMenu).toBeNull();
      expect(component.breadcrumbTrail).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // navigateToChild
  // ---------------------------------------------------------------------------

  describe('navigateToChild', () => {
    it('should call router.navigate with navigation service path', () => {
      mockNavigationService.getNavigationPath.and.returnValue('/donor/search');
      const child = makeMenuItem({ label: 'Donor Search', routeKey: 'DonorSearch' as any });

      component.navigateToChild(child);

      expect(mockNavigationService.getNavigationPath).toHaveBeenCalledWith(child);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/donor/search']);
    });

    it('should collapse sidebar after navigation when hovering', fakeAsync(() => {
      mockNavigationService.getNavigationPath.and.returnValue('/donor/search');
      component.isHovering = true;
      component.isCollapsed = true;
      component.menuItems = buildMenuTree();
      const child = makeMenuItem({ label: 'Donor Search' });

      component.navigateToChild(child);
      tick(0);

      expect(component.isCollapsed).toBe(true);
      expect(component.isHovering).toBe(false);
      expect(component.suppressHoverUntil).toBeGreaterThan(0);
    }));

    it('should collapse and show main menu when no route found and hovering', () => {
      mockNavigationService.getNavigationPath.and.returnValue('');
      component.isHovering = true;
      component.isCollapsed = false;
      component.menuItems = buildMenuTree();
      const child = makeMenuItem({ label: 'NoRoute' });

      component.navigateToChild(child);

      expect(component.isCollapsed).toBe(true);
      expect(component.isHovering).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // onSearchResultSelected
  // ---------------------------------------------------------------------------

  describe('onSearchResultSelected', () => {
    it('should navigate to search result route', () => {
      mockNavigationService.getNavigationPath.and.returnValue('/lab/blood-typing');
      const result = {
        item: makeMenuItem({ label: 'Blood Typing', routeKey: 'BloodTyping' as any }),
        breadcrumb: ['Lab', 'Blood Typing'],
      };

      component.onSearchResultSelected(result);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/lab/blood-typing']);
    });

    it('should collapse sidebar after search navigation when hovering', fakeAsync(() => {
      mockNavigationService.getNavigationPath.and.returnValue('/lab/blood-typing');
      component.isHovering = true;
      component.isCollapsed = true;
      component.menuItems = buildMenuTree();

      const result = {
        item: makeMenuItem({ label: 'Blood Typing' }),
        breadcrumb: ['Lab'],
      };

      component.onSearchResultSelected(result);
      tick(0);

      expect(component.isCollapsed).toBe(true);
      expect(component.isHovering).toBe(false);
      expect(component.currentView).toBe('main');
    }));

    it('should collapse when no route found and hovering', () => {
      mockNavigationService.getNavigationPath.and.returnValue('');
      component.isHovering = true;
      component.menuItems = buildMenuTree();

      const result = {
        item: makeMenuItem({ label: 'Unknown' }),
        breadcrumb: [],
      };

      component.onSearchResultSelected(result);

      expect(component.isCollapsed).toBe(true);
      expect(component.isHovering).toBe(false);
      expect(component.currentView).toBe('main');
    });
  });

  // ---------------------------------------------------------------------------
  // updateNavigationState
  // ---------------------------------------------------------------------------

  describe('updateNavigationState', () => {
    it('should set submenu view and breadcrumb trail for deeply nested route', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/donor/recruitment/drive-list';

      (component as any).updateNavigationState();

      expect(component.currentView).toBe('submenu');
      expect(component.breadcrumbTrail.length).toBe(2);
      expect(component.currentParentMenu!.label).toBe('Donor Functions');
    });

    it('should stay in main view for top-level exact match route', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/distribution';

      (component as any).updateNavigationState();

      expect(component.currentView).toBe('main');
      expect(component.breadcrumbTrail).toEqual([]);
    });

    it('should do nothing when route is not found in menu tree', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/nonexistent';
      component.currentView = 'main';

      (component as any).updateNavigationState();

      expect(component.currentView).toBe('main');
    });

    it('should preserve state after navigation for collapsed hover cycle', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/donor/recruitment/drive-list';

      (component as any).updateNavigationState();

      expect((component as any).preservedView).toBe('submenu');
      expect((component as any).preservedParentMenu!.label).toBe('Donor Functions');
      expect((component as any).preservedBreadcrumb.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // findMenuItemByRoute (partial matching)
  // ---------------------------------------------------------------------------

  describe('findMenuItemByRoute', () => {
    it('should return best partial match when no exact match exists', () => {
      component.menuItems = buildMenuTree();

      const result = (component as any).findMenuItemByRoute(
        component.menuItems,
        '/donor/search/details'
      );

      expect(result).not.toBeNull();
      expect(result.label).toBe('Donor Search');
    });

    it('should return null when no route matches at all', () => {
      component.menuItems = buildMenuTree();

      const result = (component as any).findMenuItemByRoute(
        component.menuItems,
        '/completely/unknown'
      );

      expect(result).toBeNull();
    });

    it('should prefer exact match over partial match in children', () => {
      component.menuItems = buildMenuTree();

      const result = (component as any).findMenuItemByRoute(
        component.menuItems,
        '/lab/blood-typing'
      );

      expect(result).not.toBeNull();
      expect(result.label).toBe('Blood Typing');
    });
  });

  // ---------------------------------------------------------------------------
  // restoreNavigationState
  // ---------------------------------------------------------------------------

  describe('restoreNavigationState', () => {
    it('should restore preserved submenu state', () => {
      component.menuItems = buildMenuTree();
      const parent = component.menuItems[0];
      (component as any).preservedView = 'submenu';
      (component as any).preservedParentMenu = parent;
      (component as any).preservedSubmenu = null;
      (component as any).preservedDisplayedItems = parent.children!;
      (component as any).preservedBreadcrumb = [parent];

      mockRouter.url = '/donor/search';

      (component as any).restoreNavigationState();

      expect(component.currentView).toBe('submenu');
    });

    it('should not restore when preserved state is main with no parent', () => {
      (component as any).preservedView = 'main';
      (component as any).preservedParentMenu = null;
      component.currentView = 'main';

      (component as any).restoreNavigationState();

      expect(component.currentView).toBe('main');
    });
  });

  // ---------------------------------------------------------------------------
  // showMainMenuWithTopLevelSelected
  // ---------------------------------------------------------------------------

  describe('showMainMenuWithTopLevelSelected', () => {
    it('should mark top-level parent as active for current route', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/donor/search';

      (component as any).showMainMenuWithTopLevelSelected();

      expect(component.menuItems[0].active).toBe(true);
      expect(component.currentParentMenu!.label).toBe('Donor Functions');
    });

    it('should fallback to preserved parent when route not found', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/nonexistent';
      const preserved = makeMenuItem({ label: 'Lab' });
      (component as any).preservedParentMenu = preserved;

      (component as any).showMainMenuWithTopLevelSelected();

      expect(preserved.active).toBe(true);
      expect(component.currentParentMenu).toBe(preserved);
    });

    it('should do nothing when neither route found nor preserved parent exists', () => {
      component.menuItems = buildMenuTree();
      mockRouter.url = '/nonexistent';
      (component as any).preservedParentMenu = null;

      (component as any).showMainMenuWithTopLevelSelected();

      expect(component.menuItems.every(i => !i.active)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // navigateToChild / onSearchResultSelected (not hovering)
  // ---------------------------------------------------------------------------

  describe('navigateToChild (not hovering)', () => {
    it('should not collapse when not hovering', fakeAsync(() => {
      mockNavigationService.getNavigationPath.and.returnValue('/donor/search');
      component.isHovering = false;
      component.isCollapsed = false;

      component.navigateToChild(makeMenuItem({ label: 'Donor Search' }));
      tick(0);

      expect(component.isCollapsed).toBe(false);
    }));

    it('should not collapse when no route found and not hovering', () => {
      mockNavigationService.getNavigationPath.and.returnValue('');
      component.isHovering = false;
      component.isCollapsed = false;

      component.navigateToChild(makeMenuItem({ label: 'NoRoute' }));

      expect(component.isCollapsed).toBe(false);
    });
  });

  describe('onSearchResultSelected (not hovering)', () => {
    it('should navigate without collapsing when not hovering', fakeAsync(() => {
      mockNavigationService.getNavigationPath.and.returnValue('/lab/blood-typing');
      component.isHovering = false;
      component.isCollapsed = false;

      const result = {
        item: makeMenuItem({ label: 'Blood Typing' }),
        breadcrumb: ['Lab'],
      };
      component.onSearchResultSelected(result);
      tick(0);

      expect(component.isCollapsed).toBe(false);
    }));

    it('should not collapse when no route found and not hovering', () => {
      mockNavigationService.getNavigationPath.and.returnValue('');
      component.isHovering = false;
      component.isCollapsed = false;

      const result = {
        item: makeMenuItem({ label: 'Unknown' }),
        breadcrumb: [],
      };
      component.onSearchResultSelected(result);

      expect(component.isCollapsed).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // clearSearch
  // ---------------------------------------------------------------------------

  describe('clearSearch', () => {
    it('should not throw when search component is not available', () => {
      (component as any).searchComponent = () => null;

      expect(() => (component as any).clearSearch()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // route change handling
  // ---------------------------------------------------------------------------

  describe('route change handling', () => {
    it('should update navigation state on NavigationEnd', () => {
      mockRouter.url = '/donor/search';
      component.menuItems = buildMenuTree();

      mockRouter.events.next(new NavigationEnd(1, '/donor/search', '/donor/search'));

      const donorSearch = component.menuItems[0].children![1];
      expect(donorSearch.active).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnDestroy
  // ---------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('should unsubscribe from router events', () => {
      component.ngOnInit();
      const routerSub = (component as any).routerSubscription;
      const spy = jest.spyOn(routerSub, 'unsubscribe');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });

    it('should unsubscribe from menu subscription', () => {
      component.ngOnInit();
      const menuSub = (component as any).menuSubscription;
      const spy = jest.spyOn(menuSub, 'unsubscribe');

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    });

    it('should not throw when subscriptions are undefined', () => {
      (component as any).routerSubscription = undefined;
      (component as any).menuSubscription = undefined;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
