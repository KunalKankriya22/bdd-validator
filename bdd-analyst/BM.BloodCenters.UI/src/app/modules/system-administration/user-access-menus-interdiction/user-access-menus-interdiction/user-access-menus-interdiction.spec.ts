import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserAccessMenusInterdiction } from './user-access-menus-interdiction';
import { UserAccessService } from '../services/user-access.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

describe('UserAccessMenusInterdiction', () => {
  let mockMenuUsers: any;
  let backdropClickSubject: any;
  let component: UserAccessMenusInterdiction;
  let fixture: ComponentFixture<UserAccessMenusInterdiction>;
  let mockService: jasmine.SpyObj<UserAccessService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockDrawer: jasmine.SpyObj<any>;

  const mockMenuAccessData = [
    {
      menuTitle: 'User Management',
      program: 'SYS',
      effectiveDate: '01-JAN-2025',
      terminationDate: '31-DEC-2025',
      otherUsers: 5,
      mnemonic: 'USR_MAN',
      modificationDate: '01-JAN-2025'
    },
    {
      menuTitle: 'Report Generation',
      program: 'RPT',
      effectiveDate: '15-FEB-2025',
      terminationDate: '',
      otherUsers: 3,
      mnemonic: 'RPT_GEN',
      modificationDate: '15-FEB-2025'
    }
  ];

  const mockAccessClassesData = [
    {
      class: 'ADMIN',
      description: 'Administrator Access',
      accessLevel: '9',
      usersInClass: 10,
      effectiveDate: '01-JAN-2025',
      terminationDate: '',
      modificationDate: '01-JAN-2025'
    },
    {
      class: 'USER',
      description: 'Standard User Access',
      accessLevel: '5',
      usersInClass: 25,
      effectiveDate: '01-FEB-2025',
      terminationDate: '31-DEC-2025',
      modificationDate: '01-FEB-2025'
    }
  ];

  const mockGroupDetails = {
    success: true,
    statusCode: 200,
    item: {
      userId: 'TEST123',
      groupId: 'GRP001',
      groupDescription: 'Test Group',
      accessLevel: 5,
      effectiveDate: '01-JAN-2025',
      terminationDate: '31-DEC-2025'
    }
  };

  const mockMenuItemsResponse = {
    success: true,
    statusCode: 200,
    data: mockMenuAccessData.map(item => ({
      userID: 'TEST123',
      menuTitle: item.menuTitle,
      program: item.program,
      effectiveDate: item.effectiveDate,
      terminationDate: item.terminationDate,
      otherUsers: item.otherUsers,
      mnemonic: item.mnemonic
    })),
    total: 2
  };

  const mockAccessClassesResponse = {
    success: true,
    statusCode: 200,
    data: mockAccessClassesData.map(item => ({
      userID: 'TEST123',
      class: item.class,
      description: item.description,
      accessLevel: parseInt(item.accessLevel),
      usersInClass: item.usersInClass,
      effectiveDate: item.effectiveDate,
      terminationDate: item.terminationDate
    })),
    total: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('UserAccessService', [
      'getUserMenuItems',
      'getUserAccessClasses',
      'getUserGroupDetails',
      'getMenuUsers',
      'getAccessClassUsers',
      'getAssociatedInterdictions',
      'getMenuFilterData',
      'getAccessClassesFilterData',
      'getActiveUsers',
      'formatDate'
    ]);
    mockService.getUserMenuItems.and.returnValue(of(mockMenuItemsResponse));
    mockService.getUserAccessClasses.and.returnValue(of(mockAccessClassesResponse));
    mockService.getUserGroupDetails.and.returnValue(of(mockGroupDetails));
    mockService.getActiveUsers.and.returnValue(of([]));
    mockService.formatDate.and.callFake((date: any) => date);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.callFake(function(this: any) {
        return {
          withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
          withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
        };
      })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue(mockPositionStrategy as any);
    mockOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);



      TestBed.configureTestingModule({
      imports: [
        UserAccessMenusInterdiction,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: UserAccessService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})  // Will be empty for most tests, can be overridden per test
          }
        }
      ]
    });


      mockService.getUserMenuItems.and.returnValue(of(mockMenuItemsResponse));


      mockService.getUserAccessClasses.and.returnValue(of(mockAccessClassesResponse));


      mockService.getUserGroupDetails.and.returnValue(of(mockGroupDetails));


      mockService.getActiveUsers.and.returnValue(of([]));


      mockService.formatDate.and.callFake((date: any) => date);


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.position.and.returnValue(mockPositionStrategy as any);


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(UserAccessMenusInterdiction);
    component = fixture.componentInstance;

    // Mock the drawer ViewChild
    mockDrawer = jasmine.createSpyObj('MatDrawer', ['open', 'close']);
    component.drawer = mockDrawer;


    });

  describe('Component Initialization', () => {






    it('should initialize form with userId control', () => {
      expect(component.form.get('userId')).toBeDefined();
    });

    it('should initialize with selectedTabIndex as 0', () => {
      expect(component.selectedTabIndex).toBe(0);
    });




  });

  describe('onRetrieve', () => {


    it('should load group details and menu access data successfully', fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(mockService.getUserGroupDetails).toHaveBeenCalledWith('TEST123');
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
      expect(component.hasSearched).toBe(true);
      expect(component.userCode).toBe('TEST123');
      expect(component.userGroup).toBe('GRP001');
    }));

    it('should handle error when loading group details', fakeAsync(() => {
      mockService.getUserGroupDetails.and.returnValue(throwError(() => new Error('API Error')));
      component.form.patchValue({ userId: 'TEST123' });

      component.onRetrieve();
      tick();

      expect(component.userCode).toBe('TEST123');
    }));

    it('should load menu access data when retrieving', fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });

      component.onRetrieve();
      tick();

      expect(mockService.getUserGroupDetails).toHaveBeenCalledWith('TEST123');
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));
  });

  describe('clear', () => {
    it('should reset all data and form state', () => {
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;
      component.menuAccessData = mockMenuAccessData;
      component.accessClassesData = mockAccessClassesData;
      component.userCode = 'TEST123';
      component.userGroup = 'GRP001';

      component.clear();

      const userIdValue = component.form.value.userId;
      expect(userIdValue === '' || userIdValue == null).toBe(true);
      expect(component.hasSearched).toBe(false);
      expect(component.menuAccessData).toEqual([]);
      expect(component.accessClassesData).toEqual([]);
      expect(component.userCode).toBe('');
      expect(component.userGroup).toBe('');
    });




  });

  describe('onTabChange', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should update selectedTabIndex', () => {
      component.onTabChange(1);
      expect(component.selectedTabIndex).toBe(1);
    });






  });

  describe('onTableSearch', () => {


    it('should debounce search calls', fakeAsync(() => {
      component.ngAfterViewInit();
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
      mockService.getUserMenuItems.calls.reset();
      component.selectedTabIndex = 0;
      component.onTableSearch('test');
      tick(100);
      component.onTableSearch('test search');
      tick(300);

      expect(mockService.getUserMenuItems).toHaveBeenCalledTimes(1);
    }));


  });

  describe('Filter Operations', () => {
    describe('Menu Access Filters', () => {
      it('should apply menu access filters and reload data', fakeAsync(() => {
        component.selectedTabIndex = 0;
        component.hasSearched = true;
        component.form.patchValue({ userId: 'TEST123' });
        const filters = {
          menuTitle: 'User Management',
          program: 'SYS',
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyMenuAccessFilters(filters);
        tick();

        expect(component.menuAccessFilters).toBe(filters);
        expect(mockService.getUserMenuItems).toHaveBeenCalled();
      }));



      it('should generate filter chips from filters', fakeAsync(() => {
        component.selectedTabIndex = 0;
        component.hasSearched = true;
        component.form.patchValue({ userId: 'TEST123' });

        const filters = {
          menuTitle: 'User Management',
          program: 'SYS',
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyMenuAccessFilters(filters);
        tick();

        expect(component.menuAccessFilterChips.length).toBeGreaterThan(0);
      }));
    });

    describe('Access Classes Filters', () => {
      it('should apply access classes filters and reload data', fakeAsync(() => {
        component.selectedTabIndex = 1;
        component.hasSearched = true;
        component.form.patchValue({ userId: 'TEST123' });
        const filters = {
          class: 'ADMIN',
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyAccessClassesFilters(filters);
        tick();

        expect(component.accessClassesFilters).toBe(filters);
        expect(mockService.getUserAccessClasses).toHaveBeenCalled();
      }));
    });








  });

  describe('onTabChange - full behavior', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should reset filters and reload menu access data when switching to tab 0', fakeAsync(() => {
      component.selectedTabIndex = 1;
      component.menuAccessSearchText = 'old';
      component.menuAccessFilters = { menuTitle: 'X', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      component.menuAccessFilterChips = [{ key: 'menuTitle', label: 'X' }];
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onTabChange(0);
      tick();

      expect(component.selectedTabIndex).toBe(0);
      expect(component.menuAccessSearchText).toBe('');
      expect(component.menuAccessFilters).toBeNull();
      expect(component.menuAccessFilterChips).toEqual([]);
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('should reset filters and reload access classes data when switching to tab 1', fakeAsync(() => {
      component.accessClassesSearchText = 'old';
      component.accessClassesFilters = { class: 'X', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      component.accessClassesFilterChips = [{ key: 'class', label: 'X' }];
      mockService.getUserAccessClasses.calls.reset();

      component.onTabChange(1);
      tick();

      expect(component.selectedTabIndex).toBe(1);
      expect(component.accessClassesSearchText).toBe('');
      expect(component.accessClassesFilters).toBeNull();
      expect(component.accessClassesFilterChips).toEqual([]);
      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));

    it('should not reload data when hasSearched is false', () => {
      component.hasSearched = false;
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserAccessClasses.calls.reset();

      component.onTabChange(1);

      expect(component.selectedTabIndex).toBe(1);
      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
      expect(mockService.getUserAccessClasses).not.toHaveBeenCalled();
    });

    it('should clear tableSearchText when switching tabs', () => {
      component.tableSearchText = 'something';
      component.onTabChange(1);
      expect(component.tableSearchText).toBe('');
    });
  });

  describe('onRetrieve - edge cases', () => {
    it('should return early if userId is whitespace only', () => {
      component.form.patchValue({ userId: '   ' });
      component.hasSearched = false;
      component.onRetrieve();
      expect(component.hasSearched).toBe(false);
      expect(mockService.getUserGroupDetails).not.toHaveBeenCalled();
    });

    it('should return early if userId is null', () => {
      component.form.patchValue({ userId: null });
      component.onRetrieve();
      expect(component.hasSearched).toBe(false);
    });

    it('should reset filters and pagination on retrieve', fakeAsync(() => {
      component.menuAccessFilters = { menuTitle: 'X' } as any;
      component.accessClassesFilters = { class: 'Y' } as any;
      component.menuAccessFilterChips = [{ key: 'a', label: 'b' }];
      component.accessClassesFilterChips = [{ key: 'c', label: 'd' }];

      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.menuAccessFilters).toBeNull();
      expect(component.accessClassesFilters).toBeNull();
      expect(component.menuAccessFilterChips).toEqual([]);
      expect(component.accessClassesFilterChips).toEqual([]);
      expect(component.selectedTabIndex).toBe(0);
    }));
  });

  describe('loadMenuAccessData - additional paths', () => {
    it('should handle getUserMenuItems returning empty data', fakeAsync(() => {
      mockService.getUserMenuItems.and.returnValue(of({ success: true, statusCode: 200, data: [], total: 0 }));
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.menuAccessData).toEqual([]);
      expect(component.filteredMenuAccessData).toEqual([]);
      expect(component.isMenuAccessLoading).toBe(false);
    }));

    it('should handle getUserMenuItems returning null data', fakeAsync(() => {
      mockService.getUserMenuItems.and.returnValue(of({ success: true, statusCode: 200, data: null, total: 0 }));
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.menuAccessData).toEqual([]);
      expect(component.filteredMenuAccessData).toEqual([]);
    }));

    it('should handle getUserMenuItems error', fakeAsync(() => {
      mockService.getUserMenuItems.and.returnValue(throwError(() => new Error('Network Error')));
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.menuAccessData).toEqual([]);
      expect(component.filteredMenuAccessData).toEqual([]);
      expect(component.userName).toBe('Error loading data');
      expect(component.isMenuAccessLoading).toBe(false);
    }));

    it('should set user group info when group details response has item', fakeAsync(() => {
      const groupResp = {
        success: true, statusCode: 200,
        item: { userId: 'USR1', groupId: 'G1', groupDescription: 'Grp One', accessLevel: 7, effectiveDate: '01-JAN-2025', terminationDate: '31-DEC-2025' }
      };
      mockService.getUserGroupDetails.and.returnValue(of(groupResp));
      component.form.patchValue({ userId: 'USR1' });
      component.onRetrieve();
      tick();

      expect(component.userCode).toBe('USR1');
      expect(component.userGroup).toBe('G1');
      expect(component.userGroupDescription).toBe('Grp One');
      expect(component.userLevel).toBe('7');
      expect(component.isUserInfoLoading).toBe(false);
    }));

    it('should set terminationDate to empty when group details has no terminationDate', fakeAsync(() => {
      const groupResp = {
        success: true, statusCode: 200,
        item: { userId: 'USR1', groupId: 'G1', groupDescription: 'Grp', accessLevel: 3, effectiveDate: '01-JAN-2025', terminationDate: '' }
      };
      mockService.getUserGroupDetails.and.returnValue(of(groupResp));
      component.form.patchValue({ userId: 'USR1' });
      component.onRetrieve();
      tick();

      expect(component.terminationDate).toBe('');
    }));
  });

  describe('loadAccessClassesData', () => {
    it('should map access classes data on success', fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.accessClassesData.length).toBe(2);
      expect(component.accessClassesData[0].class).toBe('ADMIN');
      expect(component.accessClassesData[0].accessLevel).toBe('9');
      expect(component.filteredAccessClassesData.length).toBe(2);
      expect(component.isAccessClassesLoading).toBe(false);
    }));

    it('should handle getUserAccessClasses error', fakeAsync(() => {
      mockService.getUserAccessClasses.and.returnValue(throwError(() => new Error('Error')));
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.accessClassesData).toEqual([]);
      expect(component.filteredAccessClassesData).toEqual([]);
      expect(component.isAccessClassesLoading).toBe(false);
    }));

    it('should handle empty access classes response', fakeAsync(() => {
      mockService.getUserAccessClasses.and.returnValue(of({ success: true, statusCode: 200, data: [], total: 0 }));
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();

      expect(component.accessClassesData).toEqual([]);
      expect(component.filteredAccessClassesData).toEqual([]);
    }));
  });

  describe('onAccessClassesRowAction', () => {
    const mockAccessClassUsersResponse = {
      success: true, statusCode: 200,
      data: [
        { userId: 'U1', userName: 'User One', groupId: 'G1', groupDescription: 'Group 1', accessLevel: 5, effectiveDate: '01-JAN-2025', terminationDate: '31-DEC-2025' }
      ],
      total: 1
    };

    const mockInterdictionsResponse = {
      success: true, statusCode: 200,
      data: [
        { type: 'PROC', code: 'INT001', description: 'Test Interdiction', accessLevel: 3, insertDate: '15-MAR-2025' }
      ],
      total: 1
    };

    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;
      component.onRetrieve();
      tick();
    }));

    it('should load access class users on view-users action', fakeAsync(() => {
      mockService.getAccessClassUsers.and.returnValue(of(mockAccessClassUsersResponse));
      const row = mockAccessClassesData[0];
      component.onAccessClassesRowAction({ action: 'view-users', row });
      tick();

      expect(mockService.getAccessClassUsers).toHaveBeenCalled();
      expect(component.drawerType).toBe('users');
      expect(mockDrawer.open).toHaveBeenCalled();
      expect(component.drawerData.length).toBe(1);
    }));

    it('should load interdictions on view-interdictions action', fakeAsync(() => {
      mockService.getAssociatedInterdictions.and.returnValue(of(mockInterdictionsResponse));
      const row = mockAccessClassesData[0];
      component.onAccessClassesRowAction({ action: 'view-interdictions', row });
      tick();

      expect(mockService.getAssociatedInterdictions).toHaveBeenCalled();
      expect(component.drawerType).toBe('interdictions');
      expect(mockDrawer.open).toHaveBeenCalled();
      expect(component.drawerData.length).toBe(1);
    }));

    it('should handle access class users error', fakeAsync(() => {
      mockService.getAccessClassUsers.and.returnValue(throwError(() => new Error('Error')));
      const row = mockAccessClassesData[0];
      component.onAccessClassesRowAction({ action: 'view-users', row });
      tick();

      expect(component.drawerData).toEqual([]);
      expect(component.isDrawerLoading).toBe(false);
    }));

    it('should handle interdictions error', fakeAsync(() => {
      mockService.getAssociatedInterdictions.and.returnValue(throwError(() => new Error('Error')));
      const row = mockAccessClassesData[0];
      component.onAccessClassesRowAction({ action: 'view-interdictions', row });
      tick();

      expect(component.drawerData).toEqual([]);
      expect(component.isDrawerLoading).toBe(false);
    }));

    it('should not call API if accessClass is missing', () => {
      const row = { ...mockAccessClassesData[0], class: '' };
      component.onAccessClassesRowAction({ action: 'view-users', row });
      expect(mockService.getAccessClassUsers).not.toHaveBeenCalled();
    });

    it('should not call API for view-interdictions if accessClass is missing', () => {
      const row = { ...mockAccessClassesData[0], class: '' };
      component.onAccessClassesRowAction({ action: 'view-interdictions', row });
      expect(mockService.getAssociatedInterdictions).not.toHaveBeenCalled();
    });

    it('should highlight the selected row for view-users', fakeAsync(() => {
      mockService.getAccessClassUsers.and.returnValue(of(mockAccessClassUsersResponse));
      const row = mockAccessClassesData[0];
      component.onAccessClassesRowAction({ action: 'view-users', row });
      tick();

      expect(component.highlightedAccessClassRow).toBe(row);
    }));
  });

  describe('onMenuAccessRowAction - edge cases', () => {
    it('should not call API if mnemonic is missing', () => {
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;
      const row = { ...mockMenuAccessData[0], mnemonic: '' };
      component.onMenuAccessRowAction({ action: 'view', row });
      expect(mockService.getMenuUsers).not.toHaveBeenCalled();
    });

    it('should not call API if userId is empty', () => {
      component.form.patchValue({ userId: '' });
      const row = mockMenuAccessData[0];
      component.onMenuAccessRowAction({ action: 'view', row });
      expect(mockService.getMenuUsers).not.toHaveBeenCalled();
    });
  });

  describe('loadMenuUsersDrawer - additional paths', () => {
    beforeEach(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;
      component.drawerContext_mnemonic = 'USR_MAN';
      component.drawerContext_userId = 'TEST123';
      component.drawerContext_description = 'User Management';
    });

    it('should handle zero total records', fakeAsync(() => {
      mockService.getMenuUsers.and.returnValue(of({ success: true, statusCode: 200, data: [], total: 0 }));
      const row = mockMenuAccessData[0];
      component.onMenuAccessRowAction({ action: 'view', row });
      tick();

      expect(component.drawerData).toEqual([]);
      expect(component.isDrawerLoading).toBe(false);
    }));

    it('should handle error on initial count fetch', fakeAsync(() => {
      mockService.getMenuUsers.and.returnValue(throwError(() => new Error('Error')));
      const row = mockMenuAccessData[0];
      component.onMenuAccessRowAction({ action: 'view', row });
      tick();

      expect(component.drawerData).toEqual([]);
      expect(component.isDrawerLoading).toBe(false);
    }));

    it('should handle error on full data fetch', fakeAsync(() => {
      let callCount = 0;
      mockService.getMenuUsers.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return of({ success: true, statusCode: 200, data: [{ userID: 'U1' }], total: 5 });
        }
        return throwError(() => new Error('Full fetch error'));
      });
      const row = mockMenuAccessData[0];
      component.onMenuAccessRowAction({ action: 'view', row });
      tick();

      expect(component.drawerData).toEqual([]);
      expect(component.isDrawerLoading).toBe(false);
    }));
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should remove menu access filter chip on tab 0', fakeAsync(() => {
      component.selectedTabIndex = 0;
      component.menuAccessFilters = { menuTitle: 'User Management', program: 'SYS', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onRemoveFilterChip('menuTitle');
      tick();

      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('should remove access classes filter chip on tab 1', fakeAsync(() => {
      component.selectedTabIndex = 1;
      component.accessClassesFilters = { class: 'ADMIN', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      mockService.getUserAccessClasses.calls.reset();

      component.onRemoveFilterChip('class');
      tick();

      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));
  });

  describe('clearAllFilters', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should clear menu access filters on tab 0', fakeAsync(() => {
      component.selectedTabIndex = 0;
      component.menuAccessFilters = { menuTitle: 'X' } as any;
      component.menuAccessFilterChips = [{ key: 'menuTitle', label: 'X' }];
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.clearAllFilters();
      tick();

      expect(component.menuAccessFilters).toBeNull();
      expect(component.menuAccessFilterChips).toEqual([]);
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('should clear access classes filters on tab 1', fakeAsync(() => {
      component.selectedTabIndex = 1;
      component.accessClassesFilters = { class: 'ADMIN' } as any;
      component.accessClassesFilterChips = [{ key: 'class', label: 'ADMIN' }];
      mockService.getUserAccessClasses.calls.reset();

      component.clearAllFilters();
      tick();

      expect(component.accessClassesFilters).toBeNull();
      expect(component.accessClassesFilterChips).toEqual([]);
      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters on tab 0', () => {
      component.selectedTabIndex = 0;
      component.menuAccessFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return false when no filters on tab 1', () => {
      component.selectedTabIndex = 1;
      component.accessClassesFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return false for unknown tab index', () => {
      component.selectedTabIndex = 5;
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('getCurrentFilterChips', () => {
    it('should return menuAccessFilterChips on tab 0', () => {
      component.selectedTabIndex = 0;
      component.menuAccessFilterChips = [{ key: 'a', label: 'b' }];
      expect(component.getCurrentFilterChips()).toEqual([{ key: 'a', label: 'b' }]);
    });

    it('should return accessClassesFilterChips on tab 1', () => {
      component.selectedTabIndex = 1;
      component.accessClassesFilterChips = [{ key: 'c', label: 'd' }];
      expect(component.getCurrentFilterChips()).toEqual([{ key: 'c', label: 'd' }]);
    });

    it('should return empty array for unknown tab index', () => {
      component.selectedTabIndex = 5;
      expect(component.getCurrentFilterChips()).toEqual([]);
    });
  });

  describe('Sort and Page Changes', () => {
    beforeEach(fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should update sort config and reload on menu access sort change', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onMenuAccessSortChange({ column: 'menuTitle', direction: 'A' });
      tick();

      expect(component.menuAccessTableConfig.sortConfig!.column).toBe('menuTitle');
      expect(component.menuAccessTableConfig.sortConfig!.direction).toBe('A');
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('should update sort config and reload on access classes sort change', fakeAsync(() => {
      mockService.getUserAccessClasses.calls.reset();

      component.onAccessClassesSortChange({ column: 'class', direction: 'D' });
      tick();

      expect(component.accessClassesTableConfig.sortConfig!.column).toBe('class');
      expect(component.accessClassesTableConfig.sortConfig!.direction).toBe('D');
      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));

    it('should update pagination and reload on menu access page change', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onMenuAccessPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });
      tick();

      expect(component.menuAccessTableConfig.pagination!.pageIndex).toBe(2);
      expect(component.menuAccessTableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('should update pagination and reload on access classes page change', fakeAsync(() => {
      mockService.getUserAccessClasses.calls.reset();

      component.onAccessClassesPageChange({ pageIndex: 1, pageSize: 10, previousPageIndex: 0 });
      tick();

      expect(component.accessClassesTableConfig.pagination!.pageIndex).toBe(1);
      expect(component.accessClassesTableConfig.pagination!.pageSize).toBe(10);
      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));
  });

  describe('onDrawerPageChange - different types', () => {
    it('should reload access class users drawer on page change', fakeAsync(() => {
      const mockResp = { success: true, statusCode: 200, data: [], total: 0 };
      mockService.getAccessClassUsers.and.returnValue(of(mockResp));
      component.drawerType = 'users';
      component.drawerContext_userId = 'TEST123';
      component.drawerContext_accessClass = 'ADMIN';
      component.drawerContext_description = 'Admin';

      component.onDrawerPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
      tick();

      expect(component.drawerTableConfig.pagination!.pageIndex).toBe(1);
      expect(mockService.getAccessClassUsers).toHaveBeenCalled();
    }));

    it('should reload interdictions drawer on page change', fakeAsync(() => {
      const mockResp = { success: true, statusCode: 200, data: [], total: 0 };
      mockService.getAssociatedInterdictions.and.returnValue(of(mockResp));
      component.drawerType = 'interdictions';
      component.drawerContext_accessClass = 'ADMIN';
      component.drawerContext_description = 'Admin';

      component.onDrawerPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });
      tick();

      expect(component.drawerTableConfig.pagination!.pageIndex).toBe(2);
      expect(mockService.getAssociatedInterdictions).toHaveBeenCalled();
    }));
  });

  describe('onDrawerSortChange and sortDrawerData', () => {
    it('should update drawer sort config', () => {
      component.drawerData = [
        { userId: 'B', userName: 'Beta', groupId: 'G1', groupDescription: 'G', accessLevel: '5', effectiveDate: '01-JAN-2025' },
        { userId: 'A', userName: 'Alpha', groupId: 'G2', groupDescription: 'G', accessLevel: '3', effectiveDate: '01-FEB-2025' }
      ];

      component.onDrawerSortChange({ column: 'userId', direction: 'A' });

      expect(component.drawerTableConfig.sortConfig!.column).toBe('userId');
      expect(component.drawerTableConfig.sortConfig!.direction).toBe('A');
      expect((component.drawerData[0] as any).userId).toBe('A');
    });

    it('should sort drawer data descending', () => {
      component.drawerData = [
        { userId: 'A', userName: 'Alpha', groupId: 'G1', groupDescription: 'G', accessLevel: '3', effectiveDate: '01-JAN-2025' },
        { userId: 'B', userName: 'Beta', groupId: 'G2', groupDescription: 'G', accessLevel: '5', effectiveDate: '01-FEB-2025' }
      ];

      component.onDrawerSortChange({ column: 'userId', direction: 'D' });

      expect((component.drawerData[0] as any).userId).toBe('B');
    });

    it('should reload data on default sort direction for menu-users', fakeAsync(() => {
      const mockResp = { success: true, statusCode: 200, data: [], total: 0 };
      mockService.getMenuUsers.and.returnValue(of(mockResp));
      component.drawerType = 'menu-users';
      component.drawerContext_mnemonic = 'USR_MAN';
      component.drawerContext_userId = 'TEST123';
      component.drawerContext_description = 'Test';

      component.onDrawerSortChange({ column: 'userId', direction: 'default' });
      tick();

      expect(mockService.getMenuUsers).toHaveBeenCalled();
    }));

    it('should handle null values during sort', () => {
      component.drawerData = [
        { userId: null as any, userName: 'Alpha', groupId: 'G1', groupDescription: 'G', accessLevel: '3', effectiveDate: '01-JAN-2025' },
        { userId: 'B', userName: 'Beta', groupId: 'G2', groupDescription: 'G', accessLevel: '5', effectiveDate: '01-FEB-2025' }
      ];

      component.onDrawerSortChange({ column: 'userId', direction: 'A' });

      expect((component.drawerData[0] as any).userId).toBe('B');
    });
  });

  describe('Search Operations', () => {
    beforeEach(fakeAsync(() => {
      component.ngAfterViewInit();
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('onTableSearchEnter should emit to search subject for valid text', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();
      component.selectedTabIndex = 0;
      component.tableSearchText = 'ab';

      component.onTableSearchEnter();
      tick(300);

      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('onTableSearchEnter should emit for empty text to clear search', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();
      component.selectedTabIndex = 0;
      component.tableSearchText = '';

      component.onTableSearchEnter();
      tick(300);

      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('onTableSearchEnter should not emit for single character', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();
      component.selectedTabIndex = 0;
      component.tableSearchText = 'a';

      component.onTableSearchEnter();
      tick(300);

      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
    }));

    it('onTableSearchInput should trigger reload when text is cleared', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();
      component.selectedTabIndex = 0;
      component.tableSearchText = '';

      component.onTableSearchInput();
      tick(300);

      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('clearTableSearch should clear text and trigger reload', fakeAsync(() => {
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();
      component.selectedTabIndex = 0;
      component.tableSearchText = 'some search';

      component.clearTableSearch();
      tick(300);

      expect(component.tableSearchText).toBe('');
      expect(mockService.getUserMenuItems).toHaveBeenCalled();
    }));

    it('performSearch should search on tab 1 for access classes', fakeAsync(() => {
      mockService.getUserAccessClasses.calls.reset();
      component.selectedTabIndex = 1;

      component.onTableSearch('searchterm');
      tick(300);

      expect(component.accessClassesSearchText).toBe('searchterm');
      expect(mockService.getUserAccessClasses).toHaveBeenCalled();
    }));
  });

  describe('closeFilterPanel', () => {
    it('should dispose overlay and reset state', () => {
      (component as any).overlayRef = mockOverlayRef;
      (component as any).filterButtonElement = document.createElement('button');
      component.isFilterOpen = true;

      component.closeFilterPanel();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
      expect((component as any).overlayRef).toBeNull();
      expect((component as any).filterButtonElement).toBeNull();
    });

    it('should do nothing if overlayRef is null', () => {
      (component as any).overlayRef = null;
      component.closeFilterPanel();
      expect(mockOverlayRef.dispose).not.toHaveBeenCalled();
    });
  });

  describe('filterMenuAccessData', () => {
    const testData: any[] = [
      { menuTitle: 'Menu A', program: 'SYS', effectiveDate: '2025-01-15', terminationDate: '2025-06-15', modificationDate: '-', otherUsers: 1 },
      { menuTitle: 'Menu B', program: 'RPT', effectiveDate: '2025-03-01', terminationDate: '2025-12-31', modificationDate: '-', otherUsers: 2 }
    ];

    it('should return all data if filters is null', () => {
      const result = component.filterMenuAccessData(testData, null);
      expect(result).toEqual(testData);
    });

    it('should filter by menuTitle', () => {
      const filters = { menuTitle: 'Menu A', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].menuTitle).toBe('Menu A');
    });

    it('should filter by program', () => {
      const filters = { menuTitle: '', program: 'RPT', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].program).toBe('RPT');
    });

    it('should filter by effectiveDate After', () => {
      const filters = { menuTitle: '', program: '', effectiveDatePeriod: 'After', effectiveDate: '2025-02-01', terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].menuTitle).toBe('Menu B');
    });

    it('should filter by effectiveDate Before', () => {
      const filters = { menuTitle: '', program: '', effectiveDatePeriod: 'Before', effectiveDate: '2025-02-01', terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].menuTitle).toBe('Menu A');
    });

    it('should filter by terminationDate After', () => {
      const filters = { menuTitle: '', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: 'After', terminationDate: '2025-07-01' } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].menuTitle).toBe('Menu B');
    });

    it('should filter by terminationDate Before', () => {
      const filters = { menuTitle: '', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: 'Before', terminationDate: '2025-07-01' } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].menuTitle).toBe('Menu A');
    });

    it('should pass through menuTitle "All"', () => {
      const filters = { menuTitle: 'All', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterMenuAccessData(testData, filters);
      expect(result.length).toBe(2);
    });
  });

  describe('filterAccessClassesData', () => {
    const testData: any[] = [
      { class: 'ADMIN', description: 'Admin', accessLevel: '9', usersInClass: 10, effectiveDate: '2025-01-01', terminationDate: '2025-06-30', modificationDate: '-' },
      { class: 'USER', description: 'User', accessLevel: '5', usersInClass: 25, effectiveDate: '2025-03-01', terminationDate: '2025-12-31', modificationDate: '-' }
    ];

    it('should return all data if filters is null', () => {
      const result = component.filterAccessClassesData(testData, null);
      expect(result).toEqual(testData);
    });

    it('should filter by class', () => {
      const filters = { class: 'ADMIN', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterAccessClassesData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].class).toBe('ADMIN');
    });

    it('should filter by effectiveDate After', () => {
      const filters = { class: '', effectiveDatePeriod: 'After', effectiveDate: '2025-02-01', terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterAccessClassesData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].class).toBe('USER');
    });

    it('should filter by terminationDate Before', () => {
      const filters = { class: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: 'Before', terminationDate: '2025-07-01' } as any;
      const result = component.filterAccessClassesData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].class).toBe('ADMIN');
    });
  });

  describe('convertDateToISO (private)', () => {
    beforeEach(() => {
      (mockService as any).formatDateForAPI = jasmine.createSpy('formatDateForAPI').and.callFake((d: string) => d);
    });

    it('should return empty string for null', () => {
      const result = (component as any).convertDateToISO(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = (component as any).convertDateToISO(undefined);
      expect(result).toBe('');
    });

    it('should convert Date object to ISO string', () => {
      const date = new Date('2025-06-15T00:00:00Z');
      const result = (component as any).convertDateToISO(date);
      expect(result).toContain('2025-06-15');
    });

    it('should return empty string for invalid Date object', () => {
      const date = new Date('invalid');
      const result = (component as any).convertDateToISO(date);
      expect(result).toBe('');
    });

    it('should handle string values using formatDateForAPI', () => {
      const result = (component as any).convertDateToISO('15-JAN-2025');
      expect((mockService as any).formatDateForAPI).toHaveBeenCalledWith('15-JAN-2025');
    });

    it('should handle object with toISOString method', () => {
      const momentLike = { toISOString: () => '2025-06-15T00:00:00.000Z' };
      const result = (component as any).convertDateToISO(momentLike);
      expect(result).toBe('2025-06-15T00:00:00.000Z');
    });
  });

  describe('buildMenuAccessFilterRequest (private)', () => {
    it('should include effectiveDate with AFTER period', () => {
      component.menuAccessFilters = {
        menuTitle: '', program: '',
        effectiveDatePeriod: 'After', effectiveDate: '2025-01-01',
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.effectiveDate).toBe('2025-01-01');
      expect(result.effectiveDatePeriod).toBe('AFTER');
    });

    it('should include effectiveDate with BEFORE period', () => {
      component.menuAccessFilters = {
        menuTitle: '', program: '',
        effectiveDatePeriod: 'Before', effectiveDate: '2025-01-01',
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.effectiveDatePeriod).toBe('BEFORE');
    });

    it('should include terminationDate with AFTER period', () => {
      component.menuAccessFilters = {
        menuTitle: '', program: '',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: 'After', terminationDate: '2025-12-31'
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.terminationDate).toBe('2025-12-31');
      expect(result.terminationDatePeriod).toBe('AFTER');
    });

    it('should include terminationDate with BEFORE period', () => {
      component.menuAccessFilters = {
        menuTitle: '', program: '',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: 'Before', terminationDate: '2025-12-31'
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.terminationDatePeriod).toBe('BEFORE');
    });

    it('should include sort direction when not default', () => {
      component.menuAccessTableConfig.sortConfig = { column: 'menuTitle', direction: 'A' };
      component.menuAccessFilters = null;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.sort).toBe('A');
    });

    it('should not include sort when direction is default', () => {
      component.menuAccessTableConfig.sortConfig = { column: 'menuTitle', direction: 'default' };
      component.menuAccessFilters = null;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.sort).toBeUndefined();
    });
  });

  describe('buildAccessClassesFilterRequest (private)', () => {
    it('should include effectiveDate with AFTER period', () => {
      component.accessClassesFilters = {
        class: '',
        effectiveDatePeriod: 'After', effectiveDate: '2025-01-01',
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.effectiveDate).toBe('2025-01-01');
      expect(result.effectiveDatePeriod).toBe('AFTER');
    });

    it('should include terminationDate with BEFORE period', () => {
      component.accessClassesFilters = {
        class: '',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: 'Before', terminationDate: '2025-12-31'
      } as any;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.terminationDatePeriod).toBe('BEFORE');
    });

    it('should include sort direction when not default', () => {
      component.accessClassesTableConfig.sortConfig = { column: 'class', direction: 'D' };
      component.accessClassesFilters = null;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.sort).toBe('D');
    });
  });

  describe('Drawer Operations', () => {
    mockMenuUsers = {
      success: true,
      statusCode: 200,
      data: [
        { userID: 'USR001', userName: 'User One', groupID: 'GRP001', groupDescription: 'Group 1', accessLevel: 5, effectiveDate: '01-JAN-2025' }
      ],
      total: 1
    };

    beforeEach(() => {
      mockService.getMenuUsers.and.returnValue(of(mockMenuUsers));
    });

    it('should open drawer when viewing other users', fakeAsync(() => {
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;

      const row = mockMenuAccessData[0];
      component.onMenuAccessRowAction({ action: 'view', row });
      tick();

      expect(mockService.getMenuUsers).toHaveBeenCalled();
      expect(mockDrawer.open).toHaveBeenCalled();
      expect(component.drawerData.length).toBeGreaterThan(0);
    }));

    it('should handle drawer pagination', fakeAsync(() => {
      component.drawerType = 'menu-users';
      component.drawerContext_mnemonic = 'USR_MAN';
      component.drawerContext_userId = 'TEST123';
      const pageEvent = { pageIndex: 1, pageSize: 25, previousPageIndex: 0 };
      component.onDrawerPageChange(pageEvent);
      tick();

      expect(component.drawerTableConfig.pagination?.pageIndex).toBe(1);
      expect(mockService.getMenuUsers).toHaveBeenCalled();
    }));



    it('should close drawer and clear data', () => {
      component.drawerType = 'menu-users';
      component.drawerData = [{ userId: 'TEST', userName: 'Test', groupId: 'G1', groupDescription: 'Group', accessLevel: '5', effectiveDate: '01-JAN-2025' }];
      component.drawerTitle = 'Test Title';

      component.closeDrawer();

      expect(mockDrawer.close).toHaveBeenCalled();
      expect(component.drawerData).toEqual([]);
      expect(component.drawerTitle).toBe('');
    });
  });

  describe('openFilter toggle and portal branching', () => {
    it('should close existing overlay when openFilter called with overlay already open', () => {
      (component as any).overlayRef = mockOverlayRef;
      (component as any).filterButtonElement = document.createElement('button');
      component.isFilterOpen = true;

      const btn = document.createElement('button');
      component.openFilter(btn);

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });

    it('onFilterClick should call openFilter', () => {
      spyOn(component, 'openFilter');
      const btn = document.createElement('button');
      const event = { currentTarget: btn } as unknown as MouseEvent;
      component.onFilterClick(event);
      expect(component.openFilter).toHaveBeenCalledWith(btn);
    });
  });

  describe('applyFiltersToData', () => {
    it('should apply filters for tab 0', () => {
      component.selectedTabIndex = 0;
      component.menuAccessData = [
        { menuTitle: 'Menu A', program: 'SYS', effectiveDate: '2025-01-15', terminationDate: '2025-06-15', modificationDate: '-', otherUsers: 1 }
      ];
      component.menuAccessFilters = { menuTitle: 'Menu A', program: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      component.hasSearched = false; // avoid API call in onTableSearch

      component.applyFiltersToData();

      expect(component.filteredMenuAccessData.length).toBe(1);
    });

    it('should apply filters for tab 1', () => {
      component.selectedTabIndex = 1;
      component.accessClassesData = [
        { class: 'ADMIN', description: 'Admin', accessLevel: '9', usersInClass: 10, effectiveDate: '2025-01-01', terminationDate: '2025-06-30', modificationDate: '-' }
      ];
      component.accessClassesFilters = { class: 'ADMIN', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: null, terminationDate: null } as any;
      component.hasSearched = false;

      component.applyFiltersToData();

      expect(component.filteredAccessClassesData.length).toBe(1);
    });
  });

  describe('loadUsersDropdown', () => {
    it('should set userOptions on success', fakeAsync(() => {
      const users = [{ userId: 'U1', firstName: 'John', lastName: 'Doe' }];
      mockService.getActiveUsers.and.returnValue(of(users));

      (component as any).loadUsersDropdown();
      tick();

      expect(component.userOptions().length).toBe(1);
    }));

    it('should set empty userOptions on error', fakeAsync(() => {
      mockService.getActiveUsers.and.returnValue(throwError(() => new Error('Error')));

      (component as any).loadUsersDropdown();
      tick();

      expect(component.userOptions()).toEqual([]);
    }));
  });

  describe('filteredUserOptions computed', () => {
    it('should return all options when search is empty', fakeAsync(() => {
      const users = [
        { userId: 'U1', firstName: 'John', lastName: 'Doe' },
        { userId: 'U2', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('');
      tick();

      expect(component.filteredUserOptions().length).toBe(2);
    }));

    it('should filter options by userId', fakeAsync(() => {
      const users = [
        { userId: 'ADMIN1', firstName: 'John', lastName: 'Doe' },
        { userId: 'USER1', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('admin');
      tick();

      const filtered = component.filteredUserOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].userId).toBe('ADMIN1');
    }));

    it('should filter options by firstName', fakeAsync(() => {
      const users = [
        { userId: 'U1', firstName: 'John', lastName: 'Doe' },
        { userId: 'U2', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('john');
      tick();

      expect(component.filteredUserOptions().length).toBe(1);
    }));

    it('should filter options by lastName', fakeAsync(() => {
      const users = [
        { userId: 'U1', firstName: 'John', lastName: 'Doe' },
        { userId: 'U2', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('smith');
      tick();

      expect(component.filteredUserOptions().length).toBe(1);
    }));

    it('should filter options by full name (firstName + lastName)', fakeAsync(() => {
      const users = [
        { userId: 'U1', firstName: 'John', lastName: 'Doe' },
        { userId: 'U2', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('John Doe');
      tick();

      const filtered = component.filteredUserOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].userId).toBe('U1');
    }));

    it('should filter options by userId combined with name', fakeAsync(() => {
      const users = [
        { userId: 'U1', firstName: 'John', lastName: 'Doe' },
        { userId: 'U2', firstName: 'Jane', lastName: 'Smith' }
      ];
      component.userOptions.set(users as any);
      component.userSearchControl.setValue('U2 Jane');
      tick();

      const filtered = component.filteredUserOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].userId).toBe('U2');
    }));
  });

  describe('openDrawer methods', () => {
    it('openDrawer should set correct state for menu-users', () => {
      component.openDrawer('Title', 'Context', 'Subtitle', []);
      expect(component.drawerTitle).toBe('Title');
      expect(component.drawerContext).toBe('Context');
      expect(component.drawerSubtitle).toBe('Subtitle');
      expect(component.drawerType).toBe('menu-users');
      expect(mockDrawer.open).toHaveBeenCalled();
    });

    it('openDrawerForUsers should set correct state for users type', () => {
      component.openDrawerForUsers('Title', 'Ctx', 'Sub', []);
      expect(component.drawerType).toBe('users');
      expect(mockDrawer.open).toHaveBeenCalled();
    });

    it('openDrawerForInterdictions should set correct state for interdictions type', () => {
      component.openDrawerForInterdictions('Title', 'Ctx', 'Sub', []);
      expect(component.drawerType).toBe('interdictions');
      expect(mockDrawer.open).toHaveBeenCalled();
    });

    it('closeDrawer should clear highlighted rows', () => {
      component.highlightedMenuAccessRow = mockMenuAccessData[0] as any;
      component.highlightedAccessClassRow = mockAccessClassesData[0] as any;
      component.closeDrawer();
      expect(component.highlightedMenuAccessRow).toBeNull();
      expect(component.highlightedAccessClassRow).toBeNull();
    });
  });

  describe('sortDrawerData - additional branches', () => {
    it('should reload users drawer on default sort', fakeAsync(() => {
      const mockResp = { success: true, statusCode: 200, data: [], total: 0 };
      mockService.getAccessClassUsers.and.returnValue(of(mockResp));
      component.drawerType = 'users';
      component.drawerContext_userId = 'TEST123';
      component.drawerContext_accessClass = 'ADMIN';
      component.drawerContext_description = 'Admin';

      component.onDrawerSortChange({ column: 'userId', direction: 'default' });
      tick();

      expect(mockService.getAccessClassUsers).toHaveBeenCalled();
    }));

    it('should reload interdictions drawer on default sort', fakeAsync(() => {
      const mockResp = { success: true, statusCode: 200, data: [], total: 0 };
      mockService.getAssociatedInterdictions.and.returnValue(of(mockResp));
      component.drawerType = 'interdictions';
      component.drawerContext_accessClass = 'ADMIN';
      component.drawerContext_description = 'Admin';

      component.onDrawerSortChange({ column: 'type', direction: 'default' });
      tick();

      expect(mockService.getAssociatedInterdictions).toHaveBeenCalled();
    }));

    it('should handle undefined values during sort', () => {
      component.drawerData = [
        { userId: undefined as any, userName: 'Alpha', groupId: 'G1', groupDescription: 'G', accessLevel: '3', effectiveDate: '01-JAN-2025' },
        { userId: 'B', userName: 'Beta', groupId: 'G2', groupDescription: 'G', accessLevel: '5', effectiveDate: '01-FEB-2025' }
      ];

      component.onDrawerSortChange({ column: 'userId', direction: 'D' });

      expect((component.drawerData[1] as any).userId).toBeUndefined();
    });

    it('should compare equal string values correctly', () => {
      component.drawerData = [
        { userId: 'A', userName: 'Alpha', groupId: 'G1', groupDescription: 'G', accessLevel: '3', effectiveDate: '01-JAN-2025' },
        { userId: 'A', userName: 'Beta', groupId: 'G2', groupDescription: 'G', accessLevel: '5', effectiveDate: '01-FEB-2025' }
      ];

      component.onDrawerSortChange({ column: 'userId', direction: 'A' });

      expect(component.drawerData.length).toBe(2);
    });
  });

  describe('buildAccessClassesFilterRequest - additional branches', () => {
    it('should include class filter', () => {
      component.accessClassesFilters = {
        class: 'ADMIN',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.class).toBe('ADMIN');
    });

    it('should include effectiveDate with BEFORE period', () => {
      component.accessClassesFilters = {
        class: '',
        effectiveDatePeriod: 'Before', effectiveDate: '2025-06-01',
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.effectiveDatePeriod).toBe('BEFORE');
    });

    it('should include terminationDate with AFTER period', () => {
      component.accessClassesFilters = {
        class: '',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: 'After', terminationDate: '2025-12-31'
      } as any;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.terminationDatePeriod).toBe('AFTER');
    });

    it('should not include sort when direction is default', () => {
      component.accessClassesTableConfig.sortConfig = { column: 'class', direction: 'default' };
      component.accessClassesFilters = null;
      const result = (component as any).buildAccessClassesFilterRequest();
      expect(result.sort).toBeUndefined();
    });
  });

  describe('buildMenuAccessFilterRequest - additional branches', () => {
    it('should include menuTitle filter', () => {
      component.menuAccessFilters = {
        menuTitle: 'UserMgmt', program: '',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.menuTitle).toBe('UserMgmt');
    });

    it('should include program filter', () => {
      component.menuAccessFilters = {
        menuTitle: '', program: 'SYS',
        effectiveDatePeriod: null, effectiveDate: null,
        terminationDatePeriod: null, terminationDate: null
      } as any;
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.program).toBe('SYS');
    });

    it('should include tableSearchText as searchKeyword', () => {
      component.menuAccessFilters = null;
      component.tableSearchText = 'mysearch';
      const result = (component as any).buildMenuAccessFilterRequest();
      expect(result.searchKeyword).toBe('mysearch');
    });
  });

  describe('Sort/page changes without hasSearched', () => {
    it('should not reload menu data on sort change if not searched', () => {
      component.hasSearched = false;
      mockService.getUserMenuItems.calls.reset();

      component.onMenuAccessSortChange({ column: 'menuTitle', direction: 'A' });

      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
    });

    it('should not reload access classes data on sort change if not searched', () => {
      component.hasSearched = false;
      mockService.getUserAccessClasses.calls.reset();

      component.onAccessClassesSortChange({ column: 'class', direction: 'D' });

      expect(mockService.getUserAccessClasses).not.toHaveBeenCalled();
    });

    it('should not reload menu data on page change if not searched', () => {
      component.hasSearched = false;
      mockService.getUserMenuItems.calls.reset();

      component.onMenuAccessPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
    });

    it('should not reload access classes on page change if not searched', () => {
      component.hasSearched = false;
      mockService.getUserAccessClasses.calls.reset();

      component.onAccessClassesPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

      expect(mockService.getUserAccessClasses).not.toHaveBeenCalled();
    });
  });

  describe('filterAccessClassesData - additional branches', () => {
    const testData: any[] = [
      { class: 'ADMIN', description: 'Admin', accessLevel: '9', usersInClass: 10, effectiveDate: '2025-01-01', terminationDate: '2025-06-30', modificationDate: '-' },
      { class: 'USER', description: 'User', accessLevel: '5', usersInClass: 25, effectiveDate: '2025-03-01', terminationDate: '2025-12-31', modificationDate: '-' }
    ];

    it('should filter by effectiveDate Before', () => {
      const filters = { class: '', effectiveDatePeriod: 'Before', effectiveDate: '2025-02-01', terminationDatePeriod: null, terminationDate: null } as any;
      const result = component.filterAccessClassesData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].class).toBe('ADMIN');
    });

    it('should filter by terminationDate After', () => {
      const filters = { class: '', effectiveDatePeriod: null, effectiveDate: null, terminationDatePeriod: 'After', terminationDate: '2025-07-01' } as any;
      const result = component.filterAccessClassesData(testData, filters);
      expect(result.length).toBe(1);
      expect(result[0].class).toBe('USER');
    });
  });

  describe('performSearch - edge cases', () => {
    beforeEach(fakeAsync(() => {
      component.ngAfterViewInit();
      component.form.patchValue({ userId: 'TEST123' });
      component.onRetrieve();
      tick();
    }));

    it('should not make API calls when userId is empty during search on tab 0', fakeAsync(() => {
      component.form.patchValue({ userId: '' });
      component.selectedTabIndex = 0;
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onTableSearch('searchtext');
      tick(300);

      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
    }));

    it('should not make API calls when userId is empty during search on tab 1', fakeAsync(() => {
      component.form.patchValue({ userId: '' });
      component.selectedTabIndex = 1;
      mockService.getUserAccessClasses.calls.reset();

      component.onTableSearch('searchtext');
      tick(300);

      expect(mockService.getUserAccessClasses).not.toHaveBeenCalled();
    }));

    it('should store menuAccessSearchText when searching on tab 0', fakeAsync(() => {
      component.selectedTabIndex = 0;
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onTableSearch('menusearch');
      tick(300);

      expect(component.menuAccessSearchText).toBe('menusearch');
    }));
  });

  describe('onTableSearchInput - non-empty text', () => {
    it('should not trigger search when text is not empty', fakeAsync(() => {
      component.ngAfterViewInit();
      component.form.patchValue({ userId: 'TEST123' });
      component.hasSearched = true;
      component.selectedTabIndex = 0;
      component.tableSearchText = 'non-empty';
      mockService.getUserMenuItems.calls.reset();
      mockService.getUserGroupDetails.calls.reset();

      component.onTableSearchInput();
      tick(300);

      // Should not have called API since text is non-empty
      expect(mockService.getUserMenuItems).not.toHaveBeenCalled();
    }));
  });
});
