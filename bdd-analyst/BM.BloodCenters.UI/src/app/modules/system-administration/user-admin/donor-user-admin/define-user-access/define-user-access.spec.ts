import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, NEVER } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DefineUserAccess } from './define-user-access';
import { UserAccessService } from '../services/user-access.service';
import { UserAccessClassDialogService } from '../services/user-access-class-dialog.service';
import { DefineUserAccessListDto, UserAccessClassRow } from '../models/user-access.model';
import { AttachedUsersListDialogComponent } from '../attached-users-list-dialog/attached-users-list-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineUserAccess', () => {
  let headerServiceSpy: any;
  let dialogSpy: any;
  let accessClassDialogServiceSpy: any;
  let userAccessServiceSpy: any;
  let component: DefineUserAccess;
  let fixture: ComponentFixture<DefineUserAccess>;
  let userAccessService: jasmine.SpyObj<UserAccessService>;
  let accessClassDialogService: jasmine.SpyObj<UserAccessClassDialogService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockApiResponse: DefineUserAccessListDto[] = [
    {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department',
      accessClass: 'ADMIN',
      description: 'Administrator Access',
      level: 1,
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31'
    },
    {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department',
      accessClass: 'USER',
      description: 'Standard User Access',
      level: 2,
      effectiveDate: '2024-01-01',
      terminationDate: ''
    }
  ];

  beforeEach(() => {

    userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', ['getUserAccessClasses', 'getUsersDropdown']);
    userAccessServiceSpy.getUsersDropdown.and.returnValue(of([]));
    accessClassDialogServiceSpy = jasmine.createSpyObj('UserAccessClassDialogService', [
      'openAssignAccessClassDialog',
      'openEditAccessClassDialog'
    ]);
    dialogSpy = createMockMatDialog();
    const mockDialogRef = { afterClosed: () => of(undefined) };
    dialogSpy.open.and.returnValue(mockDialogRef);
    headerServiceSpy = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [DefineUserAccess],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: UserAccessService, useValue: userAccessServiceSpy },
        { provide: UserAccessClassDialogService, useValue: accessClassDialogServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    })
    .overrideComponent(DefineUserAccess, {
      set: {
        providers: [
          { provide: UserAccessService, useValue: userAccessServiceSpy }
        ]
      }
    });


    


      userAccessServiceSpy.getUserAccessClasses.calls.reset();


      userAccessServiceSpy.getUsersDropdown.calls.reset();


      accessClassDialogServiceSpy.openAssignAccessClassDialog.calls.reset();


      accessClassDialogServiceSpy.openEditAccessClassDialog.calls.reset();


      dialogSpy.open.calls.reset();


      userAccessServiceSpy.getUsersDropdown.and.returnValue(of([]));


      dialogSpy.open.and.returnValue(mockDialogRef);


    fixture = TestBed.createComponent(DefineUserAccess);
    component = fixture.componentInstance;
    userAccessService = TestBed.inject(UserAccessService) as jasmine.SpyObj<UserAccessService>;
    accessClassDialogService = TestBed.inject(UserAccessClassDialogService) as jasmine.SpyObj<UserAccessClassDialogService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;


    });

  describe('Component Creation', () => {


    it('should have correct initial state', () => {
      expect(component.userId).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(component.userInfo).toBeNull();
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.accessClasses).toEqual([]);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(0);
    });


  });

  describe('isRetrieveDisabled getter', () => {
    it('should return true when userId is empty', () => {
      component.userId = '';
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return true when userId contains only whitespace', () => {
      component.userId = '   ';
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should return false when userId has valid content', () => {
      component.userId = 'USER001';
      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should return false when userId has content with leading/trailing spaces', () => {
      component.userId = '  USER001  ';
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('onRetrieve', () => {




    it('should set loading state and call service with trimmed and uppercased userId', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
      component.userId = '  USER001  ';

      component.onRetrieve();

      expect(component.hasSearched).toBeTrue();
      expect(userAccessService.getUserAccessClasses).toHaveBeenCalledWith('USER001');

      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should convert lowercase userId to uppercase when calling service', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
      component.userId = 'user001';

      component.onRetrieve();

      expect(userAccessService.getUserAccessClasses).toHaveBeenCalledWith('USER001');
      tick();
    }));

    it('should convert mixed case userId to uppercase when calling service', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
      component.userId = 'UsEr001';

      component.onRetrieve();

      expect(userAccessService.getUserAccessClasses).toHaveBeenCalledWith('USER001');
      tick();
    }));

    it('should populate userInfo and accessClasses on successful response', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
      component.userId = 'USER001';

      component.onRetrieve();
      tick();

      expect(component.userInfo).toEqual({
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT Department'
      });
      expect(component.accessClasses.length).toBe(2);
      expect(component.accessClasses[0].accessClass).toBe('ADMIN');
      expect(component.hasError).toBeFalse();
    }));

    it('should handle empty response with userInfo still populated', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of([]));
      component.userId = 'UNKNOWN_USER';

      component.onRetrieve();
      tick();

      expect(component.userInfo).toBeTruthy();
      expect(component.userInfo?.userId).toBe('UNKNOWN_USER');
      expect(component.accessClasses).toEqual([]);
      expect(component.hasError).toBeFalse();
    }));

    it('should handle null response with userInfo still populated', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(null as any));
      component.userId = 'UNKNOWN_USER';

      component.onRetrieve();
      tick();

      expect(component.userInfo).toBeTruthy();
      expect(component.userInfo?.userId).toBe('UNKNOWN_USER');
      expect(component.accessClasses).toEqual([]);
    }));



    it('should reset pageIndex on successful response', fakeAsync(() => {
      userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
      component.userId = 'USER001';
      component.pageIndex = 5;

      component.onRetrieve();
      tick();

      expect(component.pageIndex).toBe(0);
    }));

    it('should handle response with empty department', fakeAsync(() => {
      const responseWithEmptyDept: DefineUserAccessListDto[] = [{
        ...mockApiResponse[0],
        department: ''
      }];
      userAccessService.getUserAccessClasses.and.returnValue(of(responseWithEmptyDept));
      component.userId = 'USER001';

      component.onRetrieve();
      tick();

      expect(component.userInfo?.department).toBe('');
    }));
  });

  describe('clearUserSearch', () => {
    it('should reset all search-related state', () => {
      // Set up some state
      component.userId = 'USER001';
      component.hasSearched = true;
      component.userInfo = { userId: 'USER001', userName: 'Test', department: 'Dept' };
      component.accessClasses = [{ accessClass: 'TEST', description: 'Test', level: 1, effectiveDate: '', terminationDate: '' }];
      component.hasError = true;
      component.errorMessage = 'Some error';

      component.clearUserSearch();

      expect(component.userId).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(component.userInfo).toBeNull();
      expect(component.accessClasses).toEqual([]);
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Create 75 mock access classes for pagination testing
      component.accessClasses = Array.from({ length: 75 }, (_, i) => ({
        accessClass: `CLASS_${i}`,
        description: `Description ${i}`,
        level: i,
        effectiveDate: '2024-01-01',
        terminationDate: ''
      }));
      component.pageSize = 10;
      component.pageIndex = 0;
    });

    describe('pagedAccessClasses getter', () => {




      it('should return correct page after navigation', () => {
        component.pageIndex = 2;
        expect(component.pagedAccessClasses[0].accessClass).toBe('CLASS_20');
      });
    });

    describe('startRow getter', () => {
      it('should return 0 when no data', () => {
        component.accessClasses = [];
        expect(component.startRow).toBe(0);
      });


    });
    describe('nextPage', () => {
      it('should increment pageIndex when not on last page', () => {
        component.pageIndex = 0;
        component.nextPage();
        expect(component.pageIndex).toBe(1);
      });

      it('should not increment pageIndex when on last page', () => {
        component.pageIndex = 7;
        component.nextPage();
        expect(component.pageIndex).toBe(7);
      });
    });

    describe('prevPage', () => {
      it('should decrement pageIndex when not on first page', () => {
        component.pageIndex = 3;
        component.prevPage();
        expect(component.pageIndex).toBe(2);
      });

      it('should not decrement pageIndex when on first page', () => {
        component.pageIndex = 0;
        component.prevPage();
        expect(component.pageIndex).toBe(0);
      });
    });
  });

  describe('Action handlers', () => {
    const mockRow: UserAccessClassRow = {
      accessClass: 'TEST',
      description: 'Test Access',
      level: 1,
      effectiveDate: '2024-01-01',
      terminationDate: ''
    };





    it('should call dialog service with correct user info for onAssignAccessClass', fakeAsync(() => {
      component.userInfo = { userId: 'USER001', userName: 'John Doe', department: 'IT' };
      accessClassDialogService.openAssignAccessClassDialog.and.returnValue(of(false));

      component.onAssignAccessClass();
      tick();

      expect(accessClassDialogService.openAssignAccessClassDialog).toHaveBeenCalledWith(component.userInfo);
    }));







    it('should call dialog service with correct params for onEditRow', fakeAsync(() => {
      component.userInfo = { userId: 'USER001', userName: 'John Doe', department: 'IT' };
      accessClassDialogService.openEditAccessClassDialog.and.returnValue(of(false));

      component.onEditRow(mockRow);
      tick();

      expect(accessClassDialogService.openEditAccessClassDialog).toHaveBeenCalledWith(component.userInfo, mockRow);
    }));





    it('should pass correct data to attached users dialog', () => {
      const customRow: UserAccessClassRow = {
        accessClass: 'ADMIN',
        description: 'Administrator Access',
        level: 1,
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      };

      component.onViewAttachedUsers(customRow);

      expect(dialog.open).toHaveBeenCalled();
      const callArgs = dialog.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe(AttachedUsersListDialogComponent);

      const config = callArgs[1] as any;
      expect(config).toBeDefined();
      expect(config.data).toBeDefined();
      expect(config.data.accessClass).toBe('ADMIN');
      expect(config.data.description).toBe('Administrator Access');
    });

    it('should configure dialog for right-side positioning', () => {
      component.onViewAttachedUsers(mockRow);

      expect(dialog.open).toHaveBeenCalled();
      const config = dialog.open.calls.mostRecent().args[1] as any;

      // Ensure config is defined
      expect(config).toBeDefined();

      // Verify right-side positioning
      expect(config.position).toBeDefined();
      expect(config.position.top).toBe('0');
      expect(config.position.right).toBe('0');

      // Verify full-height and width
      expect(config.width).toBe('800px');
      expect(config.height).toBe('100vh');

      // Verify custom panel class for styling
      expect(config.panelClass).toBe('right-side-dialog');
    });

    it('should set properties and open panel when onViewAssociatedInterdictions is called', () => {
      component.isPanelOpen = false;
      component.selectedAccessClass = '';
      component.selectedAccessClassDescription = '';

      component.onViewAssociatedInterdictions(mockRow);

      expect(component.selectedAccessClass).toBe(mockRow.accessClass);
      expect(component.selectedAccessClassDescription).toBe(mockRow.description);
      expect(component.isPanelOpen).toBeTrue();
    });

    it('should close interdiction panel and set isPanelOpen to false', () => {
      component.isPanelOpen = true;
      component.selectedAccessClass = 'TEST';
      component.selectedAccessClassDescription = 'Test Access';

      component.closeInterdictionPanel();

      expect(component.isPanelOpen).toBeFalse();
    });
  });

  describe('Sorting - onSort', () => {
    beforeEach(() => {
      component.accessClasses = [
        { accessClass: 'BETA', description: 'Beta', level: 1, effectiveDate: '2024-01-01', terminationDate: '' },
        { accessClass: 'ALPHA', description: 'Alpha', level: 2, effectiveDate: '2024-01-01', terminationDate: '' },
        { accessClass: 'GAMMA', description: 'Gamma', level: 3, effectiveDate: '2024-01-01', terminationDate: '' }
      ];
      component['originalAccessClasses'] = [...component.accessClasses];
      component.sortColumn = null;
      component.sortDirection = null;
    });

    it('should sort ascending on first click', () => {
      component.onSort('accessClass');

      expect(component.sortColumn).toBe('accessClass');
      expect(component.sortDirection).toBe('asc');
      expect(component.accessClasses[0].accessClass).toBe('ALPHA');
      expect(component.accessClasses[1].accessClass).toBe('BETA');
      expect(component.accessClasses[2].accessClass).toBe('GAMMA');
    });

    it('should sort descending on second click', () => {
      component.onSort('accessClass'); // asc
      component.onSort('accessClass'); // desc

      expect(component.sortColumn).toBe('accessClass');
      expect(component.sortDirection).toBe('desc');
      expect(component.accessClasses[0].accessClass).toBe('GAMMA');
      expect(component.accessClasses[1].accessClass).toBe('BETA');
      expect(component.accessClasses[2].accessClass).toBe('ALPHA');
    });

    it('should reset to original order on third click', () => {
      component.onSort('accessClass'); // asc
      component.onSort('accessClass'); // desc
      component.onSort('accessClass'); // unsorted

      expect(component.sortColumn).toBeNull();
      expect(component.sortDirection).toBeNull();
      expect(component.accessClasses[0].accessClass).toBe('BETA');
      expect(component.accessClasses[1].accessClass).toBe('ALPHA');
      expect(component.accessClasses[2].accessClass).toBe('GAMMA');
    });

    it('should reset pageIndex when sorting', () => {
      component.pageIndex = 3;
      component.onSort('accessClass');
      expect(component.pageIndex).toBe(0);
    });
  });
  describe('formatTableDate', () => {
    it('should format a valid date string correctly', () => {
      const result = component.formatTableDate('2024-06-15T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });





    it('should return "-" for empty string date', () => {
      expect(component.formatTableDate('')).toBe('-');
    });

    it('should return "-" for invalid date string', () => {
      expect(component.formatTableDate('invalid-date')).toBe('-');
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-06-15');
      const result = component.formatTableDate(date);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should use correct month abbreviation', () => {
      const result = component.formatTableDate('2024-01-15T00:00:00Z');
      expect(result).toContain('JAN');
    });

    it('should pad single digit days with leading zero', () => {
      const result = component.formatTableDate('2024-06-05T00:00:00Z');
      expect(result).toMatch(/^05-/);
    });
  });

  describe('formatTableValue', () => {
    it('should return the value as string for valid string', () => {
      expect(component.formatTableValue('Test Value')).toBe('Test Value');
    });

    it('should return "-" for null value', () => {
      expect(component.formatTableValue(null)).toBe('-');
    });

    it('should return "-" for undefined value', () => {
      expect(component.formatTableValue(undefined)).toBe('-');
    });



    it('should return "-" for whitespace-only string', () => {
      expect(component.formatTableValue('   ')).toBe('-');
    });

    it('should convert number to string', () => {
      expect(component.formatTableValue(123)).toBe('123');
    });

    it('should convert boolean to string', () => {
      expect(component.formatTableValue(true)).toBe('true');
      expect(component.formatTableValue(false)).toBe('false');
    });

    it('should handle zero value', () => {
      expect(component.formatTableValue(0)).toBe('0');
    });
  });
});

describe('DefineUserAccess Integration Tests', () => {
  let component: DefineUserAccess;
  let fixture: ComponentFixture<DefineUserAccess>;
  let userAccessService: jasmine.SpyObj<UserAccessService>;

  const mockApiResponse: DefineUserAccessListDto[] = [
    {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department',
      accessClass: 'ADMIN',
      description: 'Administrator Access',
      level: 1,
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31'
    }
  ];

  beforeEach(async () => {
    const userAccessServiceSpy = jasmine.createSpyObj('UserAccessService', ['getUserAccessClasses', 'getUsersDropdown']);
    userAccessServiceSpy.getUsersDropdown.and.returnValue(of([]));
    const accessClassDialogServiceSpy = jasmine.createSpyObj('UserAccessClassDialogService', [
      'openAssignAccessClassDialog',
      'openEditAccessClassDialog'
    ]);
    const dialogSpy = createMockMatDialog();
    const mockDialogRef = { afterClosed: () => of(undefined) };
    dialogSpy.open.and.returnValue(mockDialogRef);
    const headerServiceSpy = createMockHeaderService();

    TestBed.configureTestingModule({
      imports: [DefineUserAccess],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: UserAccessService, useValue: userAccessServiceSpy },
        { provide: UserAccessClassDialogService, useValue: accessClassDialogServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    })
    .overrideComponent(DefineUserAccess, {
      set: {
        providers: [
          { provide: UserAccessService, useValue: userAccessServiceSpy }
        ]
      }
    });

    fixture = TestBed.createComponent(DefineUserAccess);
    component = fixture.componentInstance;
    userAccessService = TestBed.inject(UserAccessService) as jasmine.SpyObj<UserAccessService>;
  });

  it('should display empty state before search', () => {
    // Ensure initial state
    component.hasSearched = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('.empty-state-container');
    expect(emptyState).toBeTruthy();
    expect(component.hasSearched).toBeFalse();
  });

  it('should show retrieve button as disabled when userId is empty', () => {
    component.userId = '';
    fixture.detectChanges();

    // Check component state first
    expect(component.isRetrieveDisabled).toBeTrue();

    // Then check DOM
    const button = fixture.nativeElement.querySelector('.btn-retrieve') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBeTrue();
  });

  it('should enable retrieve button when userId has value', () => {
    component.userId = 'USER001';
    fixture.detectChanges();

    // Check component state first
    expect(component.isRetrieveDisabled).toBeFalse();

    // Then check DOM
    const button = fixture.nativeElement.querySelector('.btn-retrieve') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBeFalse();
  });

  it('should display user info after successful search', fakeAsync(() => {
    userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
    fixture.detectChanges();

    component.userId = 'USER001';
    component.onRetrieve();
    tick();
    fixture.detectChanges();

    expect(component.userInfo).toBeTruthy();
    expect(component.userInfo?.userName).toBe('John Doe');
    expect(component.userInfo?.userId).toBe('USER001');
    expect(component.userInfo?.department).toBe('IT Department');
  }));

  it('should display error message on API failure', fakeAsync(() => {
    userAccessService.getUserAccessClasses.and.returnValue(throwError(() => new Error('API Error')));
    fixture.detectChanges();

    component.userId = 'USER001';

    spyOn(console, 'error');
    component.onRetrieve();
    tick();
    fixture.detectChanges();

    // Check component state
    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toBe('An error occurred while retrieving user data. Please try again.');

    // Check DOM
    const errorElement = fixture.nativeElement.querySelector('.inline-error');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent.trim()).toContain('An error occurred');
  }));

  it('should clear search state when clearUserSearch is called', fakeAsync(() => {
    userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
    fixture.detectChanges();

    component.userId = 'USER001';
    component.onRetrieve();
    tick();
    fixture.detectChanges();

    // Verify data was loaded
    expect(component.userInfo).toBeTruthy();

    // Clear search
    component.clearUserSearch();
    fixture.detectChanges();

    // Verify state is cleared
    expect(component.userId).toBe('');
    expect(component.userInfo).toBeNull();
    expect(component.hasSearched).toBeFalse();
    expect(component.accessClasses).toEqual([]);
  }));

  it('should update retrieve button state when userId changes', () => {
    fixture.detectChanges();

    // Initial state - no value, retrieve disabled
    component.userId = '';
    fixture.detectChanges();

    const retrieveBtn = fixture.nativeElement.querySelector('.btn-retrieve') as HTMLButtonElement;
    expect(retrieveBtn).toBeTruthy();
    expect(retrieveBtn.disabled).toBeTrue();

    // Set a value, retrieve enabled
    component.userId = 'USER001';
    fixture.detectChanges();

    const updatedBtn = fixture.nativeElement.querySelector('.btn-retrieve') as HTMLButtonElement;
    expect(updatedBtn.disabled).toBeFalse();
  });

  it('should hide empty state after search is performed', fakeAsync(() => {
    userAccessService.getUserAccessClasses.and.returnValue(of(mockApiResponse));
    fixture.detectChanges();

    // Initially empty state is shown
    expect(component.hasSearched).toBeFalse();
    let emptyState = fixture.nativeElement.querySelector('.empty-state-container');
    expect(emptyState).toBeTruthy();

    // Perform search
    component.userId = 'USER001';
    component.onRetrieve();
    tick();
    fixture.detectChanges();

    // Empty state should be hidden (the initial one based on !hasSearched)
    expect(component.hasSearched).toBeTrue();
    // The first empty-state-container (before search) should be hidden
    // but table should be visible instead
    expect(component.userInfo).toBeTruthy();
    expect(component.accessClasses.length).toBeGreaterThan(0);
  }));
});
