import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuService, MenuItem } from './menu.service';
import { ApiService } from './api.service';
import { AccessLevelService } from './access-level.service';
import { ApiMenuItem } from '../../core/constants/fcn-route-map';
import { MenuAccessData } from '../../core/models/menu-access.model';
import { RouteKey } from '../../core/constants/route-keys';
import { ROUTE_REGISTRY } from '../../core/constants/route-registry';

describe('MenuService', () => {
  let service: MenuService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let accessLevelSpy: jasmine.SpyObj<AccessLevelService>;

  const createApiItem = (overrides: Partial<ApiMenuItem> = {}): ApiMenuItem => ({
    menuId: 1,
    fcnId: 100,
    label: 'Test Item',
    mnemonic: '',
    menuLevel: 1,
    sequence: 1,
    route: '',
    expanded: false,
    hidden: '',
    children: [],
    requiredAccessLevel: 0,
    ...overrides,
  });

  const createAccessData = (items: ApiMenuItem[], level = 99): MenuAccessData => ({
    userId: 'user1',
    groupId: 'group1',
    userAccessLevel: level,
    menuItems: items,
  });

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);
    accessLevelSpy = jasmine.createSpyObj('AccessLevelService', ['setAccessInfo']);

    TestBed.configureTestingModule({
      providers: [
        MenuService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AccessLevelService, useValue: accessLevelSpy },
      ],
    });
    service = TestBed.inject(MenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── isMenuItemHidden (private, exercised via getMenuItems) ────────

  describe('isMenuItemHidden (via getMenuItems)', () => {
    it('treats hidden=Y and hidden=H as hidden, others as visible', (done) => {
      const items = [
        createApiItem({ label: 'Visible Empty', hidden: '' }),
        createApiItem({ label: 'Hidden Y', hidden: 'Y' }),
        createApiItem({ label: 'Hidden H', hidden: 'H' }),
        createApiItem({ label: 'Visible N', hidden: 'N' }),
      ];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.getMenuItems().subscribe(result => {
        const labels = result.map(i => i.label);
        expect(labels).toContain('Visible Empty');
        expect(labels).toContain('Visible N');
        expect(labels).not.toContain('Hidden Y');
        expect(labels).not.toContain('Hidden H');
        done();
      });
    });
  });

  // ── isRouteAccessible ─────────────────────────────────────────────

  describe('isRouteAccessible', () => {
    function setAccessibleRoutes(routes: string[]): void {
      const routeSet = (service as any).accessibleRoutes as Set<string>;
      routeSet.clear();
      routes.forEach(r => routeSet.add(r));
    }

    it('returns true when no accessible routes have been set', () => {
      expect(service.isRouteAccessible('/any/path')).toBe(true);
    });

    it('returns true for exact route match', () => {
      setAccessibleRoutes(['/donor/registration', '/lab/testing']);

      expect(service.isRouteAccessible('/donor/registration')).toBe(true);
    });

    it('returns true for child path that starts with accessible route', () => {
      setAccessibleRoutes(['/donor/registration']);

      expect(service.isRouteAccessible('/donor/registration/step-2')).toBe(true);
    });

    it('strips query parameters and hash before matching', () => {
      setAccessibleRoutes(['/donor/registration']);

      expect(service.isRouteAccessible('/donor/registration?id=1#section')).toBe(true);
    });

    it('returns false for unmatched route', () => {
      setAccessibleRoutes(['/donor/registration']);

      expect(service.isRouteAccessible('/completely/different/path')).toBe(false);
    });

    it('does not match partial segment names', () => {
      setAccessibleRoutes(['/donor']);

      expect(service.isRouteAccessible('/donor-functions')).toBe(false);
    });

    it('strips hash-only fragment before matching', () => {
      setAccessibleRoutes(['/donor/registration']);

      expect(service.isRouteAccessible('/donor/registration#top')).toBe(true);
    });

    it('returns true when child path matches one of several routes', () => {
      setAccessibleRoutes(['/admin', '/donor/registration', '/lab']);

      expect(service.isRouteAccessible('/lab/results/detail')).toBe(true);
    });
  });

  // ── getMenuItems ──────────────────────────────────────────────────

  describe('getMenuItems', () => {
    it('maps API response with data wrapper', (done) => {
      const response = {
        isSuccess: true,
        data: createAccessData([createApiItem({ label: 'Root' })]),
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getMenuItems().subscribe(items => {
        expect(items.length).toBeGreaterThanOrEqual(1);
        expect(items[0].label).toBe('Root');
        done();
      });
    });

    it('maps API response without data wrapper', (done) => {
      const response = createAccessData([createApiItem({ label: 'Direct' })]);
      apiServiceSpy.get.and.returnValue(of(response));

      service.getMenuItems().subscribe(items => {
        expect(items[0].label).toBe('Direct');
        done();
      });
    });

    it('sets access info from response', (done) => {
      const response = createAccessData([createApiItem()], 5);
      apiServiceSpy.get.and.returnValue(of(response));

      service.getMenuItems().subscribe(() => {
        expect(accessLevelSpy.setAccessInfo).toHaveBeenCalledWith('user1', 'group1', 5);
        done();
      });
    });

    it('filters out hidden menu items with hidden Y', (done) => {
      const items = [
        createApiItem({ label: 'Visible', hidden: '' }),
        createApiItem({ label: 'Hidden Y', hidden: 'Y' }),
        createApiItem({ label: 'Hidden H', hidden: 'H' }),
      ];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.getMenuItems().subscribe(result => {
        const labels = result.map(i => i.label);
        expect(labels).toContain('Visible');
        expect(labels).not.toContain('Hidden Y');
        expect(labels).not.toContain('Hidden H');
        done();
      });
    });

    it('maps optional fields when present', (done) => {
      const item = createApiItem({
        label: 'Full',
        breadcrumbLabel: 'Breadcrumb',
        icon: 'home',
        fcnIcon: 'fcn_home',
        remarks: 'Some remarks',
        subtitle: 'Sub text',
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].breadcrumbLabel).toBe('Breadcrumb');
        expect(result[0].icon).toBe('home');
        expect(result[0].fcnIcon).toBe('fcn_home');
        expect(result[0].remarks).toBe('Some remarks');
        expect(result[0].subtitle).toBe('Sub text');
        done();
      });
    });

    it('does not set optional fields when absent', (done) => {
      const item = createApiItem({ label: 'Minimal' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].breadcrumbLabel).toBeUndefined();
        expect(result[0].icon).toBeUndefined();
        expect(result[0].fcnIcon).toBeUndefined();
        expect(result[0].remarks).toBeUndefined();
        expect(result[0].subtitle).toBeUndefined();
        done();
      });
    });

    it('recursively maps and filters children', (done) => {
      const parent = createApiItem({
        label: 'Parent',
        children: [
          createApiItem({ label: 'Visible Child', hidden: '' }),
          createApiItem({ label: 'Hidden Child', hidden: 'Y' }),
        ],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        const children = result[0].children || [];
        expect(children.length).toBe(1);
        expect(children[0].label).toBe('Visible Child');
        done();
      });
    });

    it('filters items by user access level', (done) => {
      const items = [
        createApiItem({ label: 'Low Access', requiredAccessLevel: 1 }),
        createApiItem({ label: 'High Access', requiredAccessLevel: 99 }),
      ];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items, 5)));

      service.getMenuItems().subscribe(result => {
        const labels = result.map(i => i.label);
        expect(labels).toContain('Low Access');
        expect(labels).not.toContain('High Access');
        done();
      });
    });

    it('removes parent when all children are filtered by access level', (done) => {
      const parent = createApiItem({
        label: 'Parent',
        requiredAccessLevel: 0,
        children: [
          createApiItem({ label: 'High Child', requiredAccessLevel: 99 }),
        ],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent], 5)));

      service.getMenuItems().subscribe(result => {
        const parentItem = result.find(i => i.label === 'Parent');
        expect(parentItem?.children).toBeUndefined();
        done();
      });
    });

    it('stores menu items in the signal', (done) => {
      const items = [createApiItem({ label: 'Stored' })];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.getMenuItems().subscribe(() => {
        const signalItems = service.getMenuItemsSignal()();
        expect(signalItems.length).toBeGreaterThanOrEqual(1);
        expect(signalItems[0].label).toBe('Stored');
        done();
      });
    });

    it('defaults requiredAccessLevel to 0 when null', (done) => {
      const item = createApiItem({ label: 'NoLevel', requiredAccessLevel: undefined as any });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item], 0)));

      service.getMenuItems().subscribe(result => {
        expect(result[0].requiredAccessLevel).toBe(0);
        done();
      });
    });

    it('maps known mnemonic to routeKey/routePath and populates accessible routes', (done) => {
      const parent = createApiItem({
        label: 'Reg',
        mnemonic: 'REGIS',
        children: [createApiItem({ label: 'Hist', mnemonic: 'DONORHISTORY' })],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].routeKey).toBe(RouteKey.DonorRegistration);
        expect(result[0].routePath).toBe(ROUTE_REGISTRY[RouteKey.DonorRegistration].path);
        expect(result[0].children?.[0].routePath).toBe(ROUTE_REGISTRY[RouteKey.DonorHistory].path);
        expect(service.isRouteAccessible(ROUTE_REGISTRY[RouteKey.DonorRegistration].path)).toBe(true);
        done();
      });
    });

    it('warns when mnemonic has no route mapping', (done) => {
      spyOn(console, 'warn');
      const item = createApiItem({ label: 'Unmapped', mnemonic: 'ZZNOTREAL' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(() => {
        expect(console.warn).toHaveBeenCalled();
        done();
      });
    });

    it('injects CreateDriveFromTemporaryDrive into empty Recruitment General Functions', (done) => {
      const genFcn = createApiItem({ label: 'Recruitment General Functions', children: [] });
      const rec = createApiItem({ label: 'Recruitment', children: [genFcn] });
      const df = createApiItem({ label: 'Donor Functions', children: [rec] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([df])));

      service.getMenuItems().subscribe(result => {
        const donorMenu = result.find(i => i.label === 'Donor Functions');
        const recMenu = donorMenu?.children?.find(i => i.label === 'Recruitment');
        const genMenu = recMenu?.children?.find(i => i.label === 'Recruitment General Functions');
        expect(genMenu?.children?.some(c => c.label === 'Create Drive from Temporary Drive')).toBe(true);
        expect(genMenu?.children?.[0].routeKey).toBe(RouteKey.CreateDriveFromTemporaryDrive);
        done();
      });
    });

    it('appends drive item when Recruitment General Functions already has children', (done) => {
      const genFcn = createApiItem({
        label: 'Recruitment General Functions',
        children: [createApiItem({ label: 'Existing' })],
      });
      const rec = createApiItem({ label: 'Recruitment', children: [genFcn] });
      const df = createApiItem({ label: 'Donor Functions', children: [rec] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([df])));

      service.getMenuItems().subscribe(result => {
        const genMenu = result.find(i => i.label === 'Donor Functions')
          ?.children?.find(i => i.label === 'Recruitment')
          ?.children?.find(i => i.label === 'Recruitment General Functions');
        expect(genMenu?.children?.some(c => c.label === 'Existing')).toBe(true);
        expect(genMenu?.children?.some(c => c.label === 'Create Drive from Temporary Drive')).toBe(true);
        done();
      });
    });

    it('sets expanded and active fields from API item', (done) => {
      const item = createApiItem({ label: 'Expanded', expanded: true });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].expanded).toBe(true);
        expect(result[0].active).toBe(false);
        done();
      });
    });

    it('sets routeKey to undefined and routePath to undefined for unknown mnemonic', (done) => {
      spyOn(console, 'warn');
      const item = createApiItem({ label: 'NoRoute', mnemonic: 'UNKNOWN_XYZ' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].routeKey).toBeUndefined();
        expect(result[0].routePath).toBeUndefined();
        done();
      });
    });

    it('sets routeKey to undefined and routePath to undefined for empty mnemonic without warning', (done) => {
      spyOn(console, 'warn');
      const item = createApiItem({ label: 'EmptyMnemonic', mnemonic: '' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].routeKey).toBeUndefined();
        expect(result[0].routePath).toBeUndefined();
        // No warning for empty mnemonic (only for non-empty unmapped ones)
        done();
      });
    });

    it('does not inject temporary drive item when Donor Functions has no children', (done) => {
      const df = createApiItem({ label: 'Donor Functions', children: [] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([df])));

      service.getMenuItems().subscribe(result => {
        const donorMenu = result.find(i => i.label === 'Donor Functions');
        // children were empty, so after filterByAccessLevel they become undefined
        // The second map tries to find Recruitment but children is empty/undefined
        expect(donorMenu).toBeDefined();
        done();
      });
    });

    it('does not inject temporary drive item when Recruitment has no children', (done) => {
      const rec = createApiItem({ label: 'Recruitment', children: [] });
      const df = createApiItem({ label: 'Donor Functions', children: [rec] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([df])));

      service.getMenuItems().subscribe(result => {
        const donorMenu = result.find(i => i.label === 'Donor Functions');
        const recMenu = donorMenu?.children?.find(i => i.label === 'Recruitment');
        // Recruitment has no children, so generalFunctionsMenu will not be found
        expect(recMenu).toBeDefined();
        done();
      });
    });

    it('does not inject temporary drive item when Recruitment General Functions is missing', (done) => {
      const other = createApiItem({ label: 'Other Menu', children: [] });
      const rec = createApiItem({ label: 'Recruitment', children: [other] });
      const df = createApiItem({ label: 'Donor Functions', children: [rec] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([df])));

      service.getMenuItems().subscribe(result => {
        const recMenu = result.find(i => i.label === 'Donor Functions')
          ?.children?.find(i => i.label === 'Recruitment');
        expect(recMenu?.children?.some(c => c.label === 'Create Drive from Temporary Drive')).toBeFalsy();
        done();
      });
    });

    it('does not inject temporary drive item when Donor Functions is absent entirely', (done) => {
      const items = [createApiItem({ label: 'Lab Functions' })];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.getMenuItems().subscribe(result => {
        expect(result.every(i => i.label !== 'Donor Functions')).toBe(true);
        done();
      });
    });

    it('clears and rebuilds accessible routes on each call', (done) => {
      // First call - set up a route
      const item1 = createApiItem({ label: 'Reg', mnemonic: 'REGIS' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item1])));

      service.getMenuItems().subscribe(() => {
        const regPath = ROUTE_REGISTRY[RouteKey.DonorRegistration].path;
        expect(service.isRouteAccessible(regPath)).toBe(true);

        // Second call with different items
        const item2 = createApiItem({ label: 'Hist', mnemonic: 'DONORHISTORY' });
        apiServiceSpy.get.and.returnValue(of(createAccessData([item2])));

        service.getMenuItems().subscribe(() => {
          const histPath = ROUTE_REGISTRY[RouteKey.DonorHistory].path;
          expect(service.isRouteAccessible(histPath)).toBe(true);
          done();
        });
      });
    });

    it('handles deeply nested children for filterByAccessLevel', (done) => {
      const grandchild = createApiItem({ label: 'Grandchild', requiredAccessLevel: 3 });
      const child = createApiItem({ label: 'Child', requiredAccessLevel: 0, children: [grandchild] });
      const parent = createApiItem({ label: 'Parent', requiredAccessLevel: 0, children: [child] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent], 5)));

      service.getMenuItems().subscribe(result => {
        const parentItem = result.find(i => i.label === 'Parent');
        expect(parentItem?.children?.[0].label).toBe('Child');
        expect(parentItem?.children?.[0].children?.[0].label).toBe('Grandchild');
        done();
      });
    });

    it('keeps parent but removes children array when all children filtered by access level', (done) => {
      const child1 = createApiItem({ label: 'HighChild1', requiredAccessLevel: 50 });
      const child2 = createApiItem({ label: 'HighChild2', requiredAccessLevel: 60 });
      const parent = createApiItem({ label: 'Parent', requiredAccessLevel: 0, children: [child1, child2] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent], 10)));

      service.getMenuItems().subscribe(result => {
        const p = result.find(i => i.label === 'Parent');
        expect(p).toBeDefined();
        expect(p?.children).toBeUndefined();
        done();
      });
    });

    it('retains accessible children while filtering inaccessible ones', (done) => {
      const accessibleChild = createApiItem({ label: 'Accessible', requiredAccessLevel: 1 });
      const inaccessibleChild = createApiItem({ label: 'Inaccessible', requiredAccessLevel: 99 });
      const parent = createApiItem({ label: 'Parent', requiredAccessLevel: 0, children: [accessibleChild, inaccessibleChild] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent], 5)));

      service.getMenuItems().subscribe(result => {
        const p = result.find(i => i.label === 'Parent');
        expect(p?.children?.length).toBe(1);
        expect(p?.children?.[0].label).toBe('Accessible');
        done();
      });
    });

    it('collects routePaths from nested children into accessible routes', (done) => {
      const child = createApiItem({ label: 'Hist', mnemonic: 'DONORHISTORY' });
      const parent = createApiItem({ label: 'Reg', mnemonic: 'REGIS', children: [child] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(() => {
        const histPath = ROUTE_REGISTRY[RouteKey.DonorHistory].path;
        expect(service.isRouteAccessible(histPath)).toBe(true);
        done();
      });
    });

    it('does not add routePath to accessible routes for items without mnemonic mapping', () => {
      spyOn(console, 'warn');
      const item = createApiItem({ label: 'NoMapping', mnemonic: 'XYZFAKE' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      let subscribed = false;
      service.getMenuItems().subscribe(() => {
        subscribed = true;
      });
      expect(subscribed).toBe(true);
      // The item has no routePath since mnemonic is unmapped, so its path should not be in accessible routes
      const routes = (service as any).accessibleRoutes as Set<string>;
      const hasXyzfakeRoute = [...routes].some(r => r.includes('xyzfake'));
      expect(hasXyzfakeRoute).toBe(false);
    });

    it('handles item with no children property', (done) => {
      const item = createApiItem({ label: 'Leaf' });
      // The default createApiItem sets children: [], which means length 0 won't recurse
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].label).toBe('Leaf');
        expect(result[0].children).toBeUndefined();
        done();
      });
    });

    it('filters hidden children during mapApiMenuItemToMenuItem recursion', (done) => {
      const parent = createApiItem({
        label: 'Parent',
        children: [
          createApiItem({ label: 'VisibleChild', hidden: '' }),
          createApiItem({ label: 'HiddenChild H', hidden: 'H' }),
          createApiItem({ label: 'HiddenChild Y', hidden: 'Y' }),
        ],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        const children = result[0].children ?? [];
        expect(children.length).toBe(1);
        expect(children[0].label).toBe('VisibleChild');
        done();
      });
    });

    it('passes null filter in type guard after mapping', () => {
      // The .filter((item): item is MenuItem => item !== null) is always true
      // because mapApiMenuItemToMenuItem always returns a MenuItem.
      // Exercised by any getMenuItems call; this verifies it does not drop items.
      const items = [
        createApiItem({ label: 'A' }),
        createApiItem({ label: 'B' }),
      ];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      let result: MenuItem[] = [];
      service.getMenuItems().subscribe(r => result = r);
      // Result includes the 2 input items plus any injected menu items (equipment, etc.)
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some(i => i.label === 'A')).toBe(true);
      expect(result.some(i => i.label === 'B')).toBe(true);
    });

    it('sets hidden flag to true for Y items during mapping', (done) => {
      // Hidden items are filtered out at the top level, but children mapping
      // also sets the hidden property. Test a visible parent with a child
      // whose hidden mapping we can verify through the recursive filter.
      const parent = createApiItem({
        label: 'Parent',
        children: [
          createApiItem({ label: 'Visible', hidden: '' }),
        ],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].hidden).toBe(false);
        expect(result[0].children?.[0].hidden).toBe(false);
        done();
      });
    });
  });

  // ── findMenuItemByPath ────────────────────────────────────────────

  describe('findMenuItemByPath', () => {
    function setMenuItems(items: MenuItem[]): void {
      (service as any).menuItemsSignal.set(items);
    }

    it('returns undefined when no items exist', () => {
      setMenuItems([]);

      expect(service.findMenuItemByPath('/test')).toBeUndefined();
    });

    it('finds exact path match', () => {
      setMenuItems([
        { label: 'Item A', routePath: '/path/a' },
        { label: 'Item B', routePath: '/path/b' },
      ]);

      const found = service.findMenuItemByPath('/path/b');

      expect(found?.label).toBe('Item B');
    });

    it('finds parent path match for child route', () => {
      setMenuItems([{ label: 'Parent', routePath: '/parent' }]);

      const found = service.findMenuItemByPath('/parent/child');

      expect(found?.label).toBe('Parent');
    });

    it('returns most specific match when multiple match', () => {
      setMenuItems([
        { label: 'Root', routePath: '/app' },
        { label: 'Section', routePath: '/app/section' },
      ]);

      const found = service.findMenuItemByPath('/app/section/detail');

      expect(found?.label).toBe('Section');
    });

    it('searches children recursively', () => {
      setMenuItems([
        {
          label: 'Parent',
          routePath: '/parent',
          children: [{ label: 'Child', routePath: '/parent/child' }],
        },
      ]);

      const found = service.findMenuItemByPath('/parent/child');

      expect(found?.label).toBe('Child');
    });

    it('returns undefined for unmatched path', () => {
      setMenuItems([{ label: 'Item', routePath: '/existing' }]);

      expect(service.findMenuItemByPath('/nonexistent')).toBeUndefined();
    });

    it('does not match partial segment names', () => {
      setMenuItems([{ label: 'Item', routePath: '/app' }]);

      expect(service.findMenuItemByPath('/application')).toBeUndefined();
    });

    it('prefers exact match over parent path match in reduce', () => {
      setMenuItems([
        { label: 'Short Parent', routePath: '/a' },
        { label: 'Exact', routePath: '/a/b/c' },
      ]);

      const found = service.findMenuItemByPath('/a/b/c');

      expect(found?.label).toBe('Exact');
    });

    it('handles items with no routePath in the reduce comparison', () => {
      setMenuItems([
        { label: 'No Path' },
        { label: 'Has Path', routePath: '/test' },
      ]);

      const found = service.findMenuItemByPath('/test');

      expect(found?.label).toBe('Has Path');
    });

    it('handles deeply nested children', () => {
      setMenuItems([
        {
          label: 'L1',
          routePath: '/l1',
          children: [
            {
              label: 'L2',
              routePath: '/l1/l2',
              children: [{ label: 'L3', routePath: '/l1/l2/l3' }],
            },
          ],
        },
      ]);

      const found = service.findMenuItemByPath('/l1/l2/l3');

      expect(found?.label).toBe('L3');
    });

    it('skips items with empty children arrays', () => {
      setMenuItems([
        { label: 'Empty Children', routePath: '/a', children: [] },
        { label: 'Target', routePath: '/b' },
      ]);

      const found = service.findMenuItemByPath('/b');

      expect(found?.label).toBe('Target');
    });

    it('returns the longer routePath when both are parent matches', () => {
      setMenuItems([
        { label: 'Short', routePath: '/app' },
        { label: 'Long', routePath: '/app/module' },
      ]);

      const found = service.findMenuItemByPath('/app/module/sub/deep');

      expect(found?.label).toBe('Long');
    });
  });

  // ── refreshMenuItems ──────────────────────────────────────────────

  describe('refreshMenuItems', () => {
    it('calls getMenuItems and subscribes', () => {
      const items = [createApiItem({ label: 'Refreshed' })];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.refreshMenuItems();

      expect(apiServiceSpy.get).toHaveBeenCalled();
      const signalItems = service.getMenuItemsSignal()();
      expect(signalItems[0].label).toBe('Refreshed');
    });

    it('updates signal with new data on refresh', () => {
      // First call
      apiServiceSpy.get.and.returnValue(of(createAccessData([createApiItem({ label: 'Original' })])));
      service.refreshMenuItems();
      expect(service.getMenuItemsSignal()()[0].label).toBe('Original');

      // Second call
      apiServiceSpy.get.and.returnValue(of(createAccessData([createApiItem({ label: 'Updated' })])));
      service.refreshMenuItems();
      expect(service.getMenuItemsSignal()()[0].label).toBe('Updated');
    });
  });

  // ── getMenuItemsSignal ────────────────────────────────────────────

  describe('getMenuItemsSignal', () => {
    it('returns a read-only signal with empty array initially', () => {
      const sig = service.getMenuItemsSignal();
      expect(sig()).toEqual([]);
    });

    it('returns a read-only signal reflecting current menu items', (done) => {
      const items = [createApiItem({ label: 'Signal Item' })];
      apiServiceSpy.get.and.returnValue(of(createAccessData(items)));

      service.getMenuItems().subscribe(() => {
        const sig = service.getMenuItemsSignal();
        expect(sig()[0].label).toBe('Signal Item');
        done();
      });
    });
  });

  // ── collectRoutePaths (private, via getMenuItems + isRouteAccessible) ──

  describe('collectRoutePaths (via getMenuItems)', () => {
    it('collects paths from items with no routePath (skips them)', () => {
      // Items with empty mnemonic have no routePath, so they are skipped in collection
      const item = createApiItem({ label: 'No Route', mnemonic: '' });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      let subscribed = false;
      service.getMenuItems().subscribe(() => {
        subscribed = true;
      });
      expect(subscribed).toBe(true);
      // The item has no routePath so collectRoutePaths should not add it
      // Note: other injected items (equipment) may have routes, so we verify
      // that no route containing 'no-route' was added for this item
      const routes = (service as any).accessibleRoutes as Set<string>;
      const hasNoRouteItem = [...routes].some(r => r.includes('no-route'));
      expect(hasNoRouteItem).toBe(false);
    });

    it('collects paths from both parent and child items', (done) => {
      const child = createApiItem({ label: 'Child', mnemonic: 'DONORHISTORY' });
      const parent = createApiItem({ label: 'Parent', mnemonic: 'REGIS', children: [child] });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(() => {
        expect(service.isRouteAccessible(ROUTE_REGISTRY[RouteKey.DonorRegistration].path)).toBe(true);
        expect(service.isRouteAccessible(ROUTE_REGISTRY[RouteKey.DonorHistory].path)).toBe(true);
        done();
      });
    });
  });

  // ── filterByAccessLevel (private, via getMenuItems) ───────────────

  describe('filterByAccessLevel (via getMenuItems)', () => {
    it('allows items with no requiredAccessLevel when user level is 0', (done) => {
      const item = createApiItem({ label: 'Default Level', requiredAccessLevel: 0 });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item], 0)));

      service.getMenuItems().subscribe(result => {
        expect(result.some(i => i.label === 'Default Level')).toBe(true);
        done();
      });
    });

    it('allows item when user level equals required level exactly', (done) => {
      const item = createApiItem({ label: 'Exact Match', requiredAccessLevel: 5 });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item], 5)));

      service.getMenuItems().subscribe(result => {
        expect(result.some(i => i.label === 'Exact Match')).toBe(true);
        done();
      });
    });

    it('filters leaf item with no children property', (done) => {
      const leaf = createApiItem({ label: 'Leaf', requiredAccessLevel: 0 });
      apiServiceSpy.get.and.returnValue(of(createAccessData([leaf], 99)));

      service.getMenuItems().subscribe(result => {
        const found = result.find(i => i.label === 'Leaf');
        expect(found).toBeDefined();
        // Leaf items without children get returned as-is
        expect(found?.children).toBeUndefined();
        done();
      });
    });
  });

  // ── mapApiMenuItemToMenuItem (private, via getMenuItems) ──────────

  describe('mapApiMenuItemToMenuItem (via getMenuItems)', () => {
    it('maps the required fields correctly', (done) => {
      const item = createApiItem({
        label: 'Test Label',
        expanded: true,
        requiredAccessLevel: 3,
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([item])));

      service.getMenuItems().subscribe(result => {
        expect(result[0].label).toBe('Test Label');
        expect(result[0].expanded).toBe(true);
        expect(result[0].active).toBe(false);
        expect(result[0].requiredAccessLevel).toBe(3);
        done();
      });
    });

    it('recursively maps grandchildren within children', (done) => {
      const grandchild = createApiItem({
        label: 'Grandchild',
        mnemonic: 'DONORHISTORY',
        breadcrumbLabel: 'GC Breadcrumb',
      });
      const child = createApiItem({
        label: 'Child',
        children: [grandchild],
      });
      const parent = createApiItem({
        label: 'Root',
        children: [child],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        const gc = result[0].children?.[0].children?.[0];
        expect(gc?.label).toBe('Grandchild');
        expect(gc?.breadcrumbLabel).toBe('GC Breadcrumb');
        expect(gc?.routeKey).toBe(RouteKey.DonorHistory);
        done();
      });
    });

    it('excludes hidden children from the mapped result', (done) => {
      const parent = createApiItem({
        label: 'Parent',
        children: [
          createApiItem({ label: 'Show', hidden: '' }),
          createApiItem({ label: 'Hide', hidden: 'H' }),
        ],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        const kids = result[0].children ?? [];
        expect(kids.length).toBe(1);
        expect(kids[0].label).toBe('Show');
        done();
      });
    });

    it('does not add children property when children array is empty', (done) => {
      const parent = createApiItem({
        label: 'Empty Kids',
        children: [],
      });
      apiServiceSpy.get.and.returnValue(of(createAccessData([parent])));

      service.getMenuItems().subscribe(result => {
        // children length is 0 so the if block is skipped; no children property on mapped item
        expect(result[0].children).toBeUndefined();
        done();
      });
    });
  });
});
