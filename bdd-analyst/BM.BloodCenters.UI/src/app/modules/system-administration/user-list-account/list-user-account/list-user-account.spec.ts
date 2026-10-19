import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { ListUserAccountComponent } from './list-user-account';
import { UserAccountService } from '../list-user-account.service';
import { UserAccount } from '@shared/interfaces/user-account.interface';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UserAccountFilterChipsUtils } from '../utils/filter-chips.utils';
import { UserAccountFilter } from '../filter/user-account-filter/user-account-filter';

describe('ListUserAccountComponent', () => {
  let component: ListUserAccountComponent;
  let fixture: ComponentFixture<ListUserAccountComponent>;
  let userAccountServiceSpy: jasmine.SpyObj<UserAccountService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarOpenSpy: jasmine.Spy;
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal<any>> };
  let chapterChanged$: Subject<void>;
  let mockHeaderService: { chapterChanged$: ReturnType<Subject<void>['asObservable']> };

  const mockUsers: UserAccount[] = [
    {
      userId: 'JDOE001',
      name: 'John Doe',
      userClass: 'Admin',
      labCode: 'LAB1',
      effectiveDate: '2024-01-01',
      terminationDate: '',
      isActive: true
    }
  ];

  const mockUsersMultiple: UserAccount[] = [
    {
      userId: 'JDOE001',
      name: 'John Doe',
      userClass: 'Admin',
      labCode: 'LAB1',
      effectiveDate: '2024-01-01',
      terminationDate: '',
      isActive: true,
      email: 'john@test.com'
    },
    {
      userId: 'JDOE002',
      name: 'Jane Doe',
      userClass: 'User',
      labCode: 'LAB2',
      effectiveDate: '2024-02-01',
      terminationDate: '2025-12-31',
      isActive: false
    }
  ];

  beforeEach(() => {
    userAccountServiceSpy = jasmine.createSpyObj<UserAccountService>(
      'UserAccountService',
      ['getUserAccounts', 'toggleAccountLock']
    );
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    mockPageHeaderService = { pageHeaderData: signal<any>(undefined) };
    chapterChanged$ = new Subject<void>();
    mockHeaderService = { chapterChanged$: chapterChanged$.asObservable() };

    TestBed.configureTestingModule({
      imports: [
        ListUserAccountComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: UserAccountService, useValue: userAccountServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });

    fixture = TestBed.createComponent(ListUserAccountComponent);
    component = fixture.componentInstance;

    // Spy on the component's actual snackBar instance (MatSnackBarModule provides its own)
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');
  });

  // -------------------------------------------------------
  // COMPONENT CREATION
  // -------------------------------------------------------

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize editForm with correct controls and validators', () => {
    const form = component.editForm;
    expect(form).toBeTruthy();
    expect(form.get('userId')).toBeTruthy();
    expect(form.get('name')).toBeTruthy();
    expect(form.get('userClass')).toBeTruthy();
    expect(form.get('labCode')).toBeTruthy();
    expect(form.get('effectiveDate')).toBeTruthy();
    expect(form.get('terminationDate')).toBeTruthy();
  });

  it('should have userId control disabled', () => {
    expect(component.editForm.get('userId')!.disabled).toBe(true);
  });

  it('should mark name invalid when empty', () => {
    component.editForm.get('name')!.setValue('');
    expect(component.editForm.get('name')!.valid).toBe(false);
  });

  it('should mark name invalid when too short (less than 2 chars)', () => {
    component.editForm.get('name')!.setValue('A');
    expect(component.editForm.get('name')!.valid).toBe(false);
  });

  it('should mark name valid when 2+ chars', () => {
    component.editForm.get('name')!.setValue('AB');
    expect(component.editForm.get('name')!.valid).toBe(true);
  });

  it('should mark userClass invalid when empty', () => {
    component.editForm.get('userClass')!.setValue('');
    expect(component.editForm.get('userClass')!.valid).toBe(false);
  });

  it('should mark labCode invalid when empty', () => {
    component.editForm.get('labCode')!.setValue('');
    expect(component.editForm.get('labCode')!.valid).toBe(false);
  });

  it('should mark effectiveDate invalid when empty', () => {
    component.editForm.get('effectiveDate')!.setValue('');
    expect(component.editForm.get('effectiveDate')!.valid).toBe(false);
  });

  it('should allow terminationDate to be empty (no required validator)', () => {
    component.editForm.get('terminationDate')!.setValue('');
    expect(component.editForm.get('terminationDate')!.valid).toBe(true);
  });

  it('should initialize default header and search config', () => {
    expect(component.headerConfig).toBeTruthy();
    expect(component.headerConfig.actions!.length).toBe(2);
    expect(component.searchConfig.placeholder).toContain('Search by User ID');
    expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    expect(component.searchConfig.alwaysShowTooltip).toBe(true);
  });

  it('should initialize with default state values', () => {
    expect(component.userAccounts).toEqual([]);
    expect(component.filteredAccounts).toEqual([]);
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.searchQuery).toBe('');
    expect(component.isFilterOpen).toBe(false);
    expect(component.isLoading).toBe(false);
    expect(component.showActionMenu).toBe(false);
    expect(component.activeActionUserId).toBeNull();
    expect(component.sortDirection).toBe('desc');
  });

  // -------------------------------------------------------
  // ngOnInit
  // -------------------------------------------------------

  it('should call loadUserAccounts on ngOnInit', () => {
    spyOn(component, 'loadUserAccounts');
    component.ngOnInit();
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  it('should subscribe to chapter changes on ngOnInit', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.ngOnInit();
    // The subscription should not throw when chapter changes
    expect(() => chapterChanged$.next()).not.toThrow();
  });

  // -------------------------------------------------------
  // ngOnDestroy
  // -------------------------------------------------------

  it('should complete destroy$ subject on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // NAVIGATION METHODS
  // -------------------------------------------------------

  it('should navigate to /home when goHome is called', () => {
    component.goHome();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should navigate to system admin menu when goSystemAdmin is called', () => {
    component.goSystemAdmin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system-administration/menu-admin']);
  });

  it('should navigate to user admin when goUserAdmin is called', () => {
    component.goUserAdmin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system-administration/manage-users']);
  });

  // -------------------------------------------------------
  // ACCOUNT STATUS HELPERS
  // -------------------------------------------------------

  it('should return true for locked account', () => {
    const lockedUser: UserAccount = {
      userId: 'JDOE003',
      name: 'Bob Smith',
      userClass: 'User',
      labCode: 'LAB3',
      effectiveDate: '2024-01-01',
      terminationDate: '',
      isActive: false
    };
    expect(component.isAccountLocked(lockedUser)).toBe(true);
  });

  it('should return false for unlocked account', () => {
    const unlockedUser: UserAccount = {
      userId: 'JDOE004',
      name: 'Alice Johnson',
      userClass: 'Admin',
      labCode: 'LAB4',
      effectiveDate: '2024-01-01',
      terminationDate: '',
      isActive: true
    };
    expect(component.isAccountLocked(unlockedUser)).toBe(false);
  });

  it('should return "Unlocked" for active user', () => {
    expect(component.getAccountStatusText({ userId: 'U1', name: 'N', userClass: 'C', labCode: 'L', effectiveDate: '2024-01-01', isActive: true })).toBe('Unlocked');
  });

  it('should return "Locked" for inactive user', () => {
    expect(component.getAccountStatusText({ userId: 'U1', name: 'N', userClass: 'C', labCode: 'L', effectiveDate: '2024-01-01', isActive: false })).toBe('Locked');
  });

  it('should return lock-open icon for active user', () => {
    const result = component.getAccountStatusIconPath({ userId: 'U1', name: 'N', userClass: 'C', labCode: 'L', effectiveDate: '2024-01-01', isActive: true });
    expect(result).toContain('lock-open');
  });

  it('should return Vector icon for inactive user', () => {
    const result = component.getAccountStatusIconPath({ userId: 'U1', name: 'N', userClass: 'C', labCode: 'L', effectiveDate: '2024-01-01', isActive: false });
    expect(result).toContain('Vector');
  });

  // -------------------------------------------------------
  // loadUserAccounts
  // -------------------------------------------------------

  it('should load user accounts', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of(mockUsers));
    component.loadUserAccounts();
    expect(userAccountServiceSpy.getUserAccounts).toHaveBeenCalled();
    expect(component.userAccounts).toEqual(mockUsers);
  });

  it('should set filteredAccounts same as userAccounts on successful load', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of(mockUsersMultiple));
    component.loadUserAccounts();
    expect(component.filteredAccounts).toEqual(mockUsersMultiple);
  });

  it('should set isLoading to false after successful load', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of(mockUsers));
    component.loadUserAccounts();
    expect(component.isLoading).toBe(false);
  });

  it('should handle API error when loading user accounts', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(throwError(() => new Error('API Error')));
    component.loadUserAccounts();
    expect(component.isLoading).toBe(false);
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to load user accounts',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should not call API when already loading', () => {
    component.isLoading = true;
    userAccountServiceSpy.getUserAccounts.calls.reset();
    component.loadUserAccounts();
    expect(userAccountServiceSpy.getUserAccounts).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // buildRequestPayload (tested via loadUserAccounts)
  // -------------------------------------------------------

  it('should build request with search keyword', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.searchQuery = '  JohnDoe  ';
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.searchKeyword).toBe('JohnDoe');
  });

  it('should build request with null searchKeyword when searchQuery is empty', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.searchQuery = '';
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.searchKeyword).toBeNull();
  });

  it('should build request with sort direction uppercased', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.sortDirection = 'asc';
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.sortDirection).toBe('ASC');
  });

  it('should include accountStatus in request when filter has accountStatus', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.appliedFilters = {
      accountStatus: 'ACTIVE',
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: 'AFTER'
    };
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.accountStatus).toBe('ACTIVE');
  });

  it('should include effectiveDate and periodEffDate in request when filter has effectiveDate', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    const testDate = new Date('2024-06-15');
    component.appliedFilters = {
      accountStatus: null,
      effectiveDate: testDate,
      effectiveDatePeriod: 'BEFORE',
      terminationDate: null,
      terminationDatePeriod: 'AFTER'
    };
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.effectiveDate).toBe('2024-06-15');
    expect(request.periodEffDate).toBe('BEFORE');
  });

  it('should include termDate and periodTermDate in request when filter has terminationDate', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    const testDate = new Date('2025-03-20');
    component.appliedFilters = {
      accountStatus: null,
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: testDate,
      terminationDatePeriod: 'AFTER'
    };
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.termDate).toBe('2025-03-20');
    expect(request.periodTermDate).toBe('AFTER');
  });

  it('should not include filter fields when appliedFilters is null', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.appliedFilters = null;
    component.loadUserAccounts();
    const request = userAccountServiceSpy.getUserAccounts.calls.mostRecent().args[0];
    expect(request.accountStatus).toBeNull();
    expect(request.effectiveDate).toBeNull();
    expect(request.termDate).toBeNull();
    expect(request.periodEffDate).toBeNull();
    expect(request.periodTermDate).toBeNull();
  });

  // -------------------------------------------------------
  // SORT
  // -------------------------------------------------------

  it('should toggle sort direction from desc to asc', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.sortDirection = 'desc';
    component.isLoading = false;
    component.toggleSort('userId');
    expect(component.sortDirection).toBe('asc');
  });

  it('should toggle sort direction from asc to desc', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    component.sortDirection = 'asc';
    component.isLoading = false;
    component.toggleSort('userId');
    expect(component.sortDirection).toBe('desc');
  });

  it('should call loadUserAccounts after toggling sort', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    spyOn(component, 'loadUserAccounts');
    component.isLoading = false;
    component.toggleSort('userId');
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  it('should not toggle sort when isLoading is true', () => {
    component.sortDirection = 'desc';
    component.isLoading = true;
    component.toggleSort('userId');
    expect(component.sortDirection).toBe('desc');
  });

  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  it('should set searchQuery and call loadUserAccounts on search', () => {
    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    spyOn(component, 'loadUserAccounts');
    component.onSearch('test query');
    expect(component.searchQuery).toBe('test query');
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  it('should not search when isLoading is true', () => {
    component.isLoading = true;
    spyOn(component, 'loadUserAccounts');
    component.onSearch('test');
    expect(component.loadUserAccounts).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // editUser
  // -------------------------------------------------------

  it('should navigate to edit user route and close action menu', () => {
    spyOn(component, 'closeActionMenu');
    component.editUser('JDOE001');
    expect(component.closeActionMenu).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system-administration/manage-users/edit-user', 'JDOE001']);
  });

  // -------------------------------------------------------
  // ACTION MENU
  // -------------------------------------------------------

  it('should position action menu to the left of button by default', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: {
        getBoundingClientRect: () => ({
          top: 100, left: 500, right: 540, bottom: 140, width: 40, height: 40
        })
      }
    } as unknown as MouseEvent;

    component.toggleActionMenu(0, mockEvent);

    expect(component.showActionMenu).toBe(true);
    expect(component.activeActionRowIndex).toBe(0);
    expect(component.actionMenuPosition.left).toBe('232px');
  });

  it('should close menu when toggling same index while menu is open', () => {
    component.showActionMenu = true;
    component.activeActionRowIndex = 2;

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: {
        getBoundingClientRect: () => ({ top: 100, left: 500, right: 540, bottom: 140, width: 40, height: 40 })
      }
    } as unknown as MouseEvent;

    component.toggleActionMenu(2, mockEvent);
    expect(component.showActionMenu).toBe(false);
    expect(component.activeActionRowIndex).toBeNull();
  });

  it('should position menu to the right when left position would be negative', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: {
        getBoundingClientRect: () => ({
          top: 100, left: 50, right: 90, bottom: 140, width: 40, height: 40
        })
      }
    } as unknown as MouseEvent;

    component.toggleActionMenu(0, mockEvent);
    // When leftPos < 0 (50 - 260 - 8 = -218), it should use right: 90 + 0 + 8 = 98
    expect(component.actionMenuPosition.left).toBe('98px');
  });

  it('should clamp menu to right edge when it would overflow on the right', () => {
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: {
        getBoundingClientRect: () => ({
          top: 100, left: 50, right: 90, bottom: 140, width: 40, height: 40
        })
      }
    } as unknown as MouseEvent;

    component.toggleActionMenu(0, mockEvent);
    // left would be 98, but 98 + 260 = 358 > 300, so clamp to 300 - 260 - 16 = 24
    expect(component.actionMenuPosition.left).toBe('24px');
  });

  it('should position menu above button when it would overflow at the bottom', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 200, writable: true });
    Object.defineProperty(window, 'scrollX', { value: 0, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });

    const mockEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
      currentTarget: {
        getBoundingClientRect: () => ({
          top: 100, left: 500, right: 540, bottom: 140, width: 40, height: 40
        })
      }
    } as unknown as MouseEvent;

    component.toggleActionMenu(0, mockEvent);
    // topPos = 100, 100 + 250 = 350 > 0 + 200 = 200, so: topPos = 140 + 0 - 250 = -110 => max(0, -110) = 0
    expect(component.actionMenuPosition.top).toBe('0px');
  });

  it('should close action menu', () => {
    component.showActionMenu = true;
    component.activeActionRowIndex = 1;
    component.closeActionMenu();
    expect(component.showActionMenu).toBe(false);
    expect(component.activeActionRowIndex).toBeNull();
  });

  // -------------------------------------------------------
  // onDocumentClick
  // -------------------------------------------------------

  it('should do nothing if menu is not shown', () => {
    component.showActionMenu = false;
    const mockEvent = { target: document.createElement('div') } as unknown as MouseEvent;
    component.onDocumentClick(mockEvent);
    expect(component.showActionMenu).toBe(false);
  });

  it('should close menu when clicking outside action-btn and action-menu', () => {
    component.showActionMenu = true;
    component.activeActionRowIndex = 0;
    const outsideElement = document.createElement('div');
    const mockEvent = { target: outsideElement } as unknown as MouseEvent;
    component.onDocumentClick(mockEvent);
    expect(component.showActionMenu).toBe(false);
  });

  it('should not close menu when clicking on action-btn', () => {
    component.showActionMenu = true;
    component.activeActionRowIndex = 0;
    const btn = document.createElement('button');
    btn.classList.add('action-btn');
    document.body.appendChild(btn);
    const mockEvent = { target: btn } as unknown as MouseEvent;
    component.onDocumentClick(mockEvent);
    expect(component.showActionMenu).toBe(true);
    document.body.removeChild(btn);
  });

  it('should not close menu when clicking on action-menu child', () => {
    component.showActionMenu = true;
    component.activeActionRowIndex = 0;
    const menu = document.createElement('div');
    menu.classList.add('action-menu');
    const child = document.createElement('span');
    menu.appendChild(child);
    document.body.appendChild(menu);
    const mockEvent = { target: child } as unknown as MouseEvent;
    component.onDocumentClick(mockEvent);
    expect(component.showActionMenu).toBe(true);
    document.body.removeChild(menu);
  });

  // -------------------------------------------------------
  // onRowAction
  // -------------------------------------------------------

  it('should call editUser for edit action', () => {
    spyOn(component, 'editUser');
    component.onRowAction('edit', 'JDOE001');
    expect(component.editUser).toHaveBeenCalledWith('JDOE001');
  });

  it('should call viewUserDetails for view action', () => {
    spyOn(component, 'viewUserDetails');
    component.onRowAction('view', 'JDOE001');
    expect(component.viewUserDetails).toHaveBeenCalledWith('JDOE001');
  });

  it('should call assignToWarehouse for assignWarehouse action', () => {
    spyOn(component, 'assignToWarehouse');
    component.onRowAction('assignWarehouse', 'JDOE001');
    expect(component.assignToWarehouse).toHaveBeenCalledWith('JDOE001');
  });

  it('should call assignInterdictions for assignInterdictions action', () => {
    spyOn(component, 'assignInterdictions');
    component.onRowAction('assignInterdictions', 'JDOE001');
    expect(component.assignInterdictions).toHaveBeenCalledWith('JDOE001');
  });

  it('should open reset password dialog for resetPassword action', () => {
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    component.userAccounts = mockUsersMultiple;
    component.onRowAction('resetPassword', 'JDOE001');

    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        data: { userId: 'JDOE001', email: 'john@test.com', userFullName: 'John Doe' }
      })
    );
  });

  it('should pass undefined email and name when user not found for resetPassword', () => {
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    component.userAccounts = [];
    component.onRowAction('resetPassword', 'NONEXIST');

    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        data: { userId: 'NONEXIST', email: undefined, userFullName: undefined }
      })
    );
  });

  it('should call toggleAccountLock for lockAccount action', () => {
    spyOn(component, 'toggleAccountLock');
    component.onRowAction('lockAccount', 'JDOE001');
    expect(component.toggleAccountLock).toHaveBeenCalledWith('JDOE001');
  });

  it('should close action menu for every row action', () => {
    spyOn(component, 'closeActionMenu');
    spyOn(component, 'editUser');
    component.onRowAction('edit', 'JDOE001');
    expect(component.closeActionMenu).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // viewUserDetails
  // -------------------------------------------------------

  it('should navigate to unauthorized page when viewing user details', () => {
    component.viewUserDetails('JDOE001');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  // -------------------------------------------------------
  // assignToWarehouse
  // -------------------------------------------------------

  it('should navigate to user-warehouse with userId query param', () => {
    component.assignToWarehouse('JDOE001');
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/system-administration/user-admin/user-warehouse'],
      { queryParams: { userId: 'JDOE001' } }
    );
  });

  // -------------------------------------------------------
  // assignInterdictions
  // -------------------------------------------------------

  it('should navigate to interdiction page with userId query param', () => {
    component.assignInterdictions('JDOE001');
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/system-administration/user-admin/donor-user-admin/user-access-menus-interdiction'],
      { queryParams: { userId: 'JDOE001' } }
    );
  });

  // -------------------------------------------------------
  // toggleAccountLock
  // -------------------------------------------------------

  it('should call API to lock account when user is active', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      of({ success: true, message: 'User account locked successfully' })
    );
    spyOn(component, 'loadUserAccounts');
    component.toggleAccountLock('JDOE001');
    expect(userAccountServiceSpy.toggleAccountLock).toHaveBeenCalledWith('JDOE001', true);
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  it('should call API to unlock account when user is inactive', () => {
    const inactiveUser: UserAccount = {
      userId: 'JDOE002',
      name: 'Jane Doe',
      userClass: 'User',
      labCode: 'LAB2',
      effectiveDate: '2024-01-01',
      terminationDate: '',
      isActive: false
    };
    component.userAccounts = [inactiveUser];
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      of({ success: true, message: 'User account unlocked successfully' })
    );
    spyOn(component, 'loadUserAccounts');
    component.toggleAccountLock('JDOE002');
    expect(userAccountServiceSpy.toggleAccountLock).toHaveBeenCalledWith('JDOE002', false);
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  it('should do nothing when user not found for toggleAccountLock', () => {
    component.userAccounts = [];
    component.toggleAccountLock('NONEXIST');
    expect(userAccountServiceSpy.toggleAccountLock).not.toHaveBeenCalled();
  });

  it('should show snackbar on successful account lock toggle', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      of({ success: true, message: 'OK' })
    );
    spyOn(component, 'loadUserAccounts');
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'User account locked successfully',
      'DISMISS',
      jasmine.objectContaining({ duration: 3000 })
    );
  });

  it('should show default error message on toggleAccountLock failure', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: {} }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to lock user account',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show errorResponse.error message on toggleAccountLock failure', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: { errorResponse: { error: 'Custom API error' } } }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Custom API error',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show errorCode message on toggleAccountLock failure when no errorResponse', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: { errorCode: 'ERR_LOCKED' } }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'ERR_LOCKED',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show error field message on toggleAccountLock failure when no errorCode', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: { error: 'Some error string' } }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Some error string',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should show message field on toggleAccountLock failure when no other fields', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: { message: 'Server message' } }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Server message',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should use default error message when message field is empty/whitespace', () => {
    component.userAccounts = mockUsers;
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: { message: '   ' } }))
    );
    component.toggleAccountLock('JDOE001');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to lock user account',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should handle unlock error messages correctly', () => {
    const inactiveUser: UserAccount = {
      userId: 'U1', name: 'N', userClass: 'C', labCode: 'L',
      effectiveDate: '2024-01-01', isActive: false
    };
    component.userAccounts = [inactiveUser];
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      throwError(() => ({ error: {} }))
    );
    component.toggleAccountLock('U1');
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'Failed to unlock user account',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000 })
    );
  });

  it('should treat isActive undefined as false for lock toggle', () => {
    const userNoActive: UserAccount = {
      userId: 'U1', name: 'N', userClass: 'C', labCode: 'L',
      effectiveDate: '2024-01-01'
    };
    component.userAccounts = [userNoActive];
    userAccountServiceSpy.toggleAccountLock.and.returnValue(
      of({ success: true, message: 'OK' })
    );
    spyOn(component, 'loadUserAccounts');
    component.toggleAccountLock('U1');
    // isActive is undefined, so shouldLock = undefined ?? false = false
    expect(userAccountServiceSpy.toggleAccountLock).toHaveBeenCalledWith('U1', false);
  });

  // -------------------------------------------------------
  // openResetPasswordDialog
  // -------------------------------------------------------

  it('should open reset password dialog with correct data', () => {
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    component.openResetPasswordDialog('JDOE001', 'john@test.com', 'John Doe');

    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        width: '600px',
        panelClass: 'reset-password-dialog',
        autoFocus: false,
        disableClose: false,
        data: { userId: 'JDOE001', email: 'john@test.com', userFullName: 'John Doe' }
      })
    );
  });

  it('should handle dialog close with result', () => {
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    component.openResetPasswordDialog('JDOE001', 'john@test.com', 'John Doe');
    // Should not throw
    afterClosedSubject.next(true);
    afterClosedSubject.complete();
  });

  it('should handle dialog close without result (cancelled)', () => {
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    component.openResetPasswordDialog('JDOE001');
    // Should not throw
    afterClosedSubject.next(undefined);
    afterClosedSubject.complete();
  });

  // -------------------------------------------------------
  // BUTTON ACTIONS: addNewUser
  // -------------------------------------------------------

  it('should navigate to add-user when addNewUser is called', () => {
    component.addNewUser();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system-administration/manage-users/add-user']);
  });

  it('should close filter dialog if open before navigating to add-user', () => {
    const mockFilterRef = jasmine.createSpyObj('DialogRef', ['close']);
    (component as any).filterDialogRef = mockFilterRef;
    component.addNewUser();
    expect(mockFilterRef.close).toHaveBeenCalled();
    expect((component as any).filterDialogRef).toBeNull();
  });

  it('should not throw when filterDialogRef is null in addNewUser', () => {
    (component as any).filterDialogRef = null;
    expect(() => component.addNewUser()).not.toThrow();
  });

  // -------------------------------------------------------
  // BUTTON ACTIONS: goPasswordConfig
  // -------------------------------------------------------

  it('should navigate to password-configuration when goPasswordConfig is called', () => {
    component.goPasswordConfig();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/system-administration/password-configuration']);
  });

  it('should close filter dialog if open before navigating to password config', () => {
    const mockFilterRef = jasmine.createSpyObj('DialogRef', ['close']);
    (component as any).filterDialogRef = mockFilterRef;
    component.goPasswordConfig();
    expect(mockFilterRef.close).toHaveBeenCalled();
    expect((component as any).filterDialogRef).toBeNull();
  });

  // -------------------------------------------------------
  // openFilter
  // -------------------------------------------------------

  it('should not open filter dialog when isLoading is true', () => {
    component.isLoading = true;
    const mockEvent = { currentTarget: document.createElement('button') } as unknown as MouseEvent;
    component.openFilter(mockEvent);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('should open filter dialog and set isFilterOpen to true', () => {
    component.isLoading = false;
    const afterClosedSubject = new Subject<any>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const buttonEl = document.createElement('button');
    spyOn(buttonEl, 'blur');
    spyOn(buttonEl, 'getBoundingClientRect').and.returnValue({
      top: 50, left: 100, right: 200, bottom: 80, width: 100, height: 30, x: 100, y: 50, toJSON: () => {}
    });
    const mockEvent = { currentTarget: buttonEl } as unknown as MouseEvent;

    component.openFilter(mockEvent);
    expect(component.isFilterOpen).toBe(true);
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should apply filters when filter dialog returns filters', () => {
    component.isLoading = false;
    const afterClosedSubject = new Subject<UserAccountFilter | undefined>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const buttonEl = document.createElement('button');
    spyOn(buttonEl, 'blur');
    spyOn(buttonEl, 'getBoundingClientRect').and.returnValue({
      top: 50, left: 100, right: 200, bottom: 80, width: 100, height: 30, x: 100, y: 50, toJSON: () => {}
    });

    userAccountServiceSpy.getUserAccounts.and.returnValue(of([]));
    const mockEvent = { currentTarget: buttonEl } as unknown as MouseEvent;
    component.openFilter(mockEvent);

    const filters: UserAccountFilter = {
      accountStatus: 'LOCKED',
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: 'AFTER'
    };
    afterClosedSubject.next(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.isFilterOpen).toBe(false);
    expect((component as any).filterDialogRef).toBeNull();
  });

  it('should not apply filters when dialog is closed without filters', () => {
    component.isLoading = false;
    component.appliedFilters = null;
    const afterClosedSubject = new Subject<UserAccountFilter | undefined>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const buttonEl = document.createElement('button');
    spyOn(buttonEl, 'blur');
    spyOn(buttonEl, 'getBoundingClientRect').and.returnValue({
      top: 50, left: 100, right: 200, bottom: 80, width: 100, height: 30, x: 100, y: 50, toJSON: () => {}
    });

    const mockEvent = { currentTarget: buttonEl } as unknown as MouseEvent;
    component.openFilter(mockEvent);

    afterClosedSubject.next(undefined);
    expect(component.appliedFilters).toBeNull();
    expect(component.isFilterOpen).toBe(false);
  });

  it('should blur the button after filter dialog closes', () => {
    component.isLoading = false;
    const afterClosedSubject = new Subject<UserAccountFilter | undefined>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const buttonEl = document.createElement('button');
    const blurSpy = spyOn(buttonEl, 'blur');
    spyOn(buttonEl, 'getBoundingClientRect').and.returnValue({
      top: 50, left: 100, right: 200, bottom: 80, width: 100, height: 30, x: 100, y: 50, toJSON: () => {}
    });

    const mockEvent = { currentTarget: buttonEl } as unknown as MouseEvent;
    component.openFilter(mockEvent);
    afterClosedSubject.next(undefined);

    expect(blurSpy).toHaveBeenCalled();
  });

  it('should pass existing filters as data to filter dialog', () => {
    component.isLoading = false;
    const existingFilters: UserAccountFilter = {
      accountStatus: 'ACTIVE',
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: 'BEFORE'
    };
    component.appliedFilters = existingFilters;

    const afterClosedSubject = new Subject<UserAccountFilter | undefined>();
    const mockDialogRef = { afterClosed: () => afterClosedSubject.asObservable() };
    dialogSpy.open.and.returnValue(mockDialogRef as any);

    const buttonEl = document.createElement('button');
    spyOn(buttonEl, 'blur');
    spyOn(buttonEl, 'getBoundingClientRect').and.returnValue({
      top: 50, left: 100, right: 200, bottom: 80, width: 100, height: 30, x: 100, y: 50, toJSON: () => {}
    });

    const mockEvent = { currentTarget: buttonEl } as unknown as MouseEvent;
    component.openFilter(mockEvent);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({
        data: existingFilters
      })
    );
  });

  // -------------------------------------------------------
  // onRemoveFilterChip
  // -------------------------------------------------------

  it('should remove filter chip and reload accounts', () => {
    const originalFilters: UserAccountFilter = {
      accountStatus: 'ACTIVE',
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: 'AFTER'
    };

    spyOn(UserAccountFilterChipsUtils, 'removeFilterByChipKey').and.returnValue(null);
    spyOn(UserAccountFilterChipsUtils, 'convertFiltersToChips').and.returnValue([]);
    spyOn(component, 'loadUserAccounts');

    component.appliedFilters = originalFilters;
    component.onRemoveFilterChip('accountStatus');

    expect(UserAccountFilterChipsUtils.removeFilterByChipKey).toHaveBeenCalledWith(originalFilters, 'accountStatus');
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // clearAllFilters
  // -------------------------------------------------------

  it('should clear all filters and reload accounts', () => {
    spyOn(component, 'loadUserAccounts');
    component.appliedFilters = {
      accountStatus: 'ACTIVE',
      effectiveDate: null,
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: 'AFTER'
    };
    component.filterChips = [{ key: 'accountStatus', label: 'Active', value: 'ACTIVE' }];

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.loadUserAccounts).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // headerConfig actions (PASSWORD CONFIGURATION, ADD NEW USER)
  // -------------------------------------------------------

  it('should invoke goPasswordConfig through header action', () => {
    spyOn(component, 'goPasswordConfig');
    const passwordAction = component.headerConfig.actions!.find(a => a.label === 'PASSWORD CONFIGURATION');
    expect(passwordAction).toBeTruthy();
    passwordAction!.onClick();
    expect(component.goPasswordConfig).toHaveBeenCalled();
  });

  it('should invoke addNewUser through header action', () => {
    spyOn(component, 'addNewUser');
    const addUserAction = component.headerConfig.actions!.find(a => a.label === 'ADD NEW USER');
    expect(addUserAction).toBeTruthy();
    addUserAction!.onClick();
    expect(component.addNewUser).toHaveBeenCalled();
  });
});
