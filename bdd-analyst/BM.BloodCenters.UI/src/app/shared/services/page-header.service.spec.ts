import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { PageHeaderService } from './page-header.service';
import { MenuService, MenuItem } from './menu.service';

describe('PageHeaderService', () => {
  let service: PageHeaderService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let routerEventsSubject: Subject<any>;

  const mockMenuItem: MenuItem = {
    label: 'Define HLA Antigens',
    subtitle: 'Manage HLA antigens',
    remarks: '',
    routePath: '/donor-functions/define-hla-antigens',
    icon: 'biotech'
  };

  beforeEach(() => {
    routerEventsSubject = new Subject<any>();

    mockRouter = jasmine.createSpyObj<Router>('Router', [] as any, {
      events: routerEventsSubject.asObservable(),
      url: '/donor-functions/define-hla-antigens'
    } as any);

    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    mockMenuService.findMenuItemByPath.and.returnValue(mockMenuItem);

    TestBed.configureTestingModule({
      providers: [
        PageHeaderService,
        { provide: Router, useValue: mockRouter },
        { provide: MenuService, useValue: mockMenuService }
      ]
    });

    service = TestBed.inject(PageHeaderService);
  });

  describe('pageHeaderData', () => {
    it('should return page header data for route without query params', () => {
      const data = service.pageHeaderData();

      expect(data).toBeDefined();
      expect(data?.title).toBe('Define HLA Antigens');
      expect(data?.subtitle).toBe('Manage HLA antigens');
    });

    it('should strip query parameters before matching menu item', () => {
      // Simulate navigation to route with query params
      Object.defineProperty(mockRouter, 'url', {
        get: () => '/donor-functions/define-hla-antigens?donorid=DN30122386',
        configurable: true
      });

      routerEventsSubject.next(new NavigationEnd(
        1,
        '/donor-functions/define-hla-antigens?donorid=DN30122386',
        '/donor-functions/define-hla-antigens?donorid=DN30122386'
      ));

      const data = service.pageHeaderData();

      // Should have called findMenuItemByPath with stripped URL
      expect(mockMenuService.findMenuItemByPath).toHaveBeenCalledWith(
        '/donor-functions/define-hla-antigens'
      );
      expect(data).toBeDefined();
      expect(data?.title).toBe('Define HLA Antigens');
    });

    it('should strip hash fragments before matching menu item', () => {
      // Simulate navigation to route with hash
      Object.defineProperty(mockRouter, 'url', {
        get: () => '/donor-functions/define-hla-antigens#section',
        configurable: true
      });

      routerEventsSubject.next(new NavigationEnd(
        1,
        '/donor-functions/define-hla-antigens#section',
        '/donor-functions/define-hla-antigens#section'
      ));

      const data = service.pageHeaderData();

      expect(mockMenuService.findMenuItemByPath).toHaveBeenCalledWith(
        '/donor-functions/define-hla-antigens'
      );
      expect(data).toBeDefined();
    });

    it('should strip both query params and hash fragments', () => {
      Object.defineProperty(mockRouter, 'url', {
        get: () => '/donor-functions/define-hla-antigens?donorid=DN30122386#top',
        configurable: true
      });

      routerEventsSubject.next(new NavigationEnd(
        1,
        '/donor-functions/define-hla-antigens?donorid=DN30122386#top',
        '/donor-functions/define-hla-antigens?donorid=DN30122386#top'
      ));

      const data = service.pageHeaderData();

      expect(mockMenuService.findMenuItemByPath).toHaveBeenCalledWith(
        '/donor-functions/define-hla-antigens'
      );
      expect(data).toBeDefined();
    });


    it('should prioritize remarks over subtitle', () => {
      const itemWithRemarks: MenuItem = {
        ...mockMenuItem,
        remarks: 'Important note',
        subtitle: 'Regular subtitle'
      };
      mockMenuService.findMenuItemByPath.and.returnValue(itemWithRemarks);

      const data = service.pageHeaderData();

      expect(data?.subtitle).toBe('Important note');
    });

    it('should use subtitle when remarks is empty', () => {
      const itemWithSubtitle: MenuItem = {
        ...mockMenuItem,
        remarks: '',
        subtitle: 'Regular subtitle'
      };
      mockMenuService.findMenuItemByPath.and.returnValue(itemWithSubtitle);

      const data = service.pageHeaderData();

      expect(data?.subtitle).toBe('Regular subtitle');
    });
  });

  describe('getTitle', () => {
    it('should return title from page header data', () => {
      expect(service.getTitle()).toBe('Define HLA Antigens');
    });

    it('should return undefined when no menu item found', () => {
      mockMenuService.findMenuItemByPath.and.returnValue(undefined);
      expect(service.getTitle()).toBeUndefined();
    });
  });

  describe('getSubtitle', () => {
    it('should return subtitle from page header data', () => {
      expect(service.getSubtitle()).toBe('Manage HLA antigens');
    });

    it('should return undefined when no menu item found', () => {
      mockMenuService.findMenuItemByPath.and.returnValue(undefined);
      expect(service.getSubtitle()).toBeUndefined();
    });
  });

  describe('getCurrentMenuItem', () => {
    it('should return current menu item', () => {
      const menuItem = service.getCurrentMenuItem();
      expect(menuItem).toEqual(mockMenuItem);
    });

    it('should strip query params when finding menu item', () => {
      Object.defineProperty(mockRouter, 'url', {
        get: () => '/donor-functions/define-hla-antigens?donorid=DN30122386',
        configurable: true
      });

      routerEventsSubject.next(new NavigationEnd(
        1,
        '/donor-functions/define-hla-antigens?donorid=DN30122386',
        '/donor-functions/define-hla-antigens?donorid=DN30122386'
      ));

      service.getCurrentMenuItem();

      expect(mockMenuService.findMenuItemByPath).toHaveBeenCalledWith(
        '/donor-functions/define-hla-antigens'
      );
    });
  });
});
