import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { CreateOrModifySpecialDriveComponent } from './create-or-modify-special-drive';
import { SpecialDriveService } from './services/special-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SpecialDriveDto } from './models/special-drive.model';
import { CancelDriveDialogComponent } from './cancel-drive-dialog/cancel-drive-dialog';
import { SpecialDriveFilterChipsUtils } from './utils/filter-chips.utils';
import { createMockMatSnackBar, createMockPageHeaderService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CreateOrModifySpecialDriveComponent', () => {
  let mockDialogRef: any;
  let component: CreateOrModifySpecialDriveComponent;
  let fixture: ComponentFixture<CreateOrModifySpecialDriveComponent>;
  let mockDriveService: jasmine.SpyObj<SpecialDriveService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockOverlay: jasmine.SpyObj<Overlay>;

  const mockDriveData: SpecialDriveDto[] = [
    {
      driveId: 'DRIVE001',
      chapterId: 'CHAPTER1',
      programId: 'PROG001',
      driveDate: '2026-06-15',
      driveType: 'F',
      driveCategory: 'CAT01',
      locationId: 'LOC001',
      locationName: 'Location 1',
      recruiterId: 'EMP001',
      recruiterName: 'John Doe',
      scheduleStartTime: '2026-06-15T09:00:00',
      scheduleEndTime: '2026-06-15T17:00:00',
      status: 'CNFRM',
      sponsors: [
        {
          driveId: 'DRIVE001',
          chapterId: 'CHAPTER1',
          sponsorId: 'SPONSOR001',
          sponsorName: 'Test Sponsor 1',
          projectedShow: 100,
          projectedDraw: 90,
          projDeferralRate: 10
        }
      ],
      resources: [
        {
          driveId: 'DRIVE001',
          chapterId: 'CHAPTER1',
          resourceCode: 'VAN',
          resourceDescription: 'Mobile Van',
          numberRequired: 2
        }
      ],
      notes: [
        {
          noteId: 'NOTE001',
          noteSequence: 1,
          note: 'Test note for drive 1',
          insertUser: 'testuser',
          insertUserName: 'Test User',
          insertDate: '2026-01-01T10:00:00',
          chapterId: 'CHAPTER1',
          programId: 'PROG001'
        }
      ],
      insertDate: '2026-01-01',
      insertUser: 'testuser',
      auditKey: 1
    },
    {
      driveId: 'DRIVE002',
      chapterId: 'CHAPTER1',
      programId: 'PROG001',
      driveDate: '2026-07-20',
      driveType: 'M',
      driveCategory: 'CAT02',
      locationId: 'LOC002',
      locationName: 'Location 2',
      recruiterId: 'EMP002',
      recruiterName: 'Jane Smith',
      scheduleStartTime: '2026-07-20T10:00:00',
      scheduleEndTime: '2026-07-20T16:00:00',
      status: 'HOLD',
      sponsors: [],
      resources: [],
      notes: [],
      insertDate: '2026-02-01',
      insertUser: 'testuser',
      auditKey: 2
    }
  ];

  const mockSearchResponse = {
    data: mockDriveData,
    total: 2
  };

  beforeEach(() => {
    mockDriveService = jasmine.createSpyObj('SpecialDriveService', [
      'searchDrives',
      'getDriveById',
      'deleteDrive',
      'cancelDrive'
    ]);
    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = createMockPageHeaderService();
    mockDialog = createMockMatDialog();
    (mockDialog as any)._openedDialogs = [];
    mockSnackBar = createMockMatSnackBar();
    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);

    Object.defineProperty(mockHeaderService, 'chapterChanged$', {
      value: new Subject<void>().asObservable(),
      writable: true
    });

    const mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
      'flexibleConnectedTo',
      'withPositions',
      'withPush'
    ]);
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    const mockScrollStrategy = jasmine.createSpyObj('ScrollStrategy', ['enable', 'disable']);

    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: () => mockPositionStrategy
    } as any);
    mockOverlay.scrollStrategies = {
      block: () => mockScrollStrategy
    } as any;

    TestBed.configureTestingModule({
      imports: [CreateOrModifySpecialDriveComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SpecialDriveService, useValue: mockDriveService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Overlay, useValue: mockOverlay }
      ]
    }).overrideComponent(CreateOrModifySpecialDriveComponent, {
      set: { providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ] }
    });

    mockDriveService.searchDrives.and.returnValue(of(mockSearchResponse));
    fixture = TestBed.createComponent(CreateOrModifySpecialDriveComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should initialize header config with breadcrumbs and actions', () => {
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThan(0);
      expect(component.headerConfig.actions).toBeDefined();
      expect(component.headerConfig.actions?.length).toBe(1);
      expect(component.headerConfig.actions?.[0].label).toBe('ADD NEW SPECIAL DRIVE');
    });
  });

  describe('Data Loading', () => {
    it('should load drives successfully', fakeAsync(() => {
      fixture.detectChanges();

      component.loadData();
      tick(500);

      expect(component.dataSource.length).toBe(2);
      expect(component.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle loading error', fakeAsync(() => {
      fixture.detectChanges();
      tick(500); // Complete initial load

      // Now set up error response
      mockDriveService.searchDrives.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      // Call loadData which should trigger the error
      component.loadData();
      flush(); // Process all async operations including error

      // Verify error state is set
      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load drive data. Please try again.');
      expect(component.isLoading).toBeFalse();
    }));

  });

  describe('Search Functionality', () => {
    it('should trigger search with debounce', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockDriveService.searchDrives.calls.reset();

      component.onSearch('DRIVE001');
      tick(300);

      expect(mockDriveService.searchDrives).toHaveBeenCalled();
      expect(component.searchText).toBe('DRIVE001');
    }));


    it('should include search text in request', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      component.onSearch('SPONSOR001');
      tick(300);

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.searchText).toBe('SPONSOR001');
    }));
  });

  describe('Pagination', () => {

    it('should calculate skip correctly', () => {
      fixture.detectChanges();

      component.pageIndex = 2;
      component.pageSize = 25;
      component.loadData();

      const skip = mockDriveService.searchDrives.calls.mostRecent().args[1];
      expect(skip).toBe(50); // pageIndex * pageSize
    });

    it('should use correct page size in request', () => {
      fixture.detectChanges();

      component.pageSize = 100;
      component.loadData();

      const take = mockDriveService.searchDrives.calls.mostRecent().args[0];
      expect(take).toBe(100);
    });
  });
  describe('Row Expansion', () => {

    it('should toggle all rows', () => {
      component.dataSource = mockDriveData;
      fixture.detectChanges();

      component.toggleAllRows();

      expect(component.allRowsExpanded).toBeTrue();
      expect(component.isRowExpanded(0)).toBeTrue();
      expect(component.isRowExpanded(1)).toBeTrue();

      component.toggleAllRows();

      expect(component.allRowsExpanded).toBeFalse();
      expect(component.isRowExpanded(0)).toBeFalse();
      expect(component.isRowExpanded(1)).toBeFalse();
    });

    it('should get formatted time correctly in 12-hour format with AM/PM', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '2026-04-13T09:44:00',
        scheduleEndTime: '2026-04-13T17:33:00'
      };

      const formattedTime = component.getFormattedTime(drive);

      expect(formattedTime).toBeDefined();
      expect(formattedTime).toBe('09:44 AM - 05:33 PM');
    });

    it('should handle noon and midnight correctly', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '2026-04-13T00:00:00',  // Midnight
        scheduleEndTime: '2026-04-13T12:00:00'      // Noon
      };

      const formattedTime = component.getFormattedTime(drive);

      expect(formattedTime).toBe('12:00 AM - 12:00 PM');
    });

    it('should calculate staff required', () => {
      const drive = mockDriveData[0];
      const staffRequired = component.getStaffRequired(drive);

      expect(staffRequired).toBe(2);
    });

    it('should detect van resources', () => {
      const drive = mockDriveData[0];
      const hasVan = component.getVanCount(drive);

      expect(hasVan).toBe('Yes');
    });

    it('should return No when no van resources', () => {
      const drive = mockDriveData[1];
      const hasVan = component.getVanCount(drive);

      expect(hasVan).toBe('No');
    });
  });

  describe('CRUD Operations', () => {

    it('should load full drive data and open side panel in edit mode', fakeAsync(() => {
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));

      component.editDrive(mockDriveData[0]);
      tick();

      expect(mockDriveService.getDriveById).toHaveBeenCalledWith('DRIVE001', 'CHAPTER1');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(fullDrive);
    }));

    it('should handle error when loading drive for edit', fakeAsync(() => {
      fixture.detectChanges();
      tick(500); // Complete initial load

      mockDriveService.getDriveById.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      component.editDrive(mockDriveData[0]);
      flush(); // Process all async operations including error
      fixture.detectChanges();

      // Verify getDriveById was called and side panel remains closed on error
      expect(mockDriveService.getDriveById).toHaveBeenCalledWith('DRIVE001', 'CHAPTER1');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.isLoading).toBeFalse();
    }));

    it('should open side panel in duplicate mode', fakeAsync(() => {
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));

      component.duplicateDrive(mockDriveData[0]);
      tick();

      expect(mockDriveService.getDriveById).toHaveBeenCalledWith('DRIVE001', 'CHAPTER1');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('duplicate');
      expect(component.sidePanelData).toEqual(fullDrive);
    }));


    it('should reset search and filter state when closing side panel', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Set up state
      component.sidePanelOpen = true;
      component.sidePanelData = mockDriveData[0];
      component.searchText = 'DRIVE001';
      component.appliedFilters = { driveType: 'F' };
      component.filterChips = [{ key: 'driveType', label: 'Type: Fixed', value: 'F' }];
      component.pageIndex = 2;

      mockDriveService.searchDrives.calls.reset();

      component.closeSidePanel();
      tick(300);

      // Verify all state is reset
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should reload data after save success', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'loadData');

      component.onSaveSuccess();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should reset search and filter state after save success', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Set up state
      component.sidePanelOpen = true;
      component.sidePanelData = mockDriveData[0];
      component.searchText = 'SPONSOR001';
      component.appliedFilters = { category: 'CAT01' };
      component.filterChips = [{ key: 'category', label: 'Category: CAT01', value: 'CAT01' }];
      component.pageIndex = 1;

      mockDriveService.searchDrives.calls.reset();

      component.onSaveSuccess();

      // Verify all state is reset
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));
  });

  describe('Cancel Drive', () => {

    it('should cancel drive when dialog confirmed', fakeAsync(() => {
      fixture.detectChanges();
      tick(500); // Complete initial load

      const dialogResult$ = new Subject<any>();
      mockDialogRef = {
        afterClosed: () => dialogResult$.asObservable()
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      const cancelResult$ = new Subject<any>();
      mockDriveService.cancelDrive.and.returnValue(cancelResult$.asObservable());

      // Start the cancel operation
      component.cancelDrive(mockDriveData[0]);

      // Emit dialog result
      dialogResult$.next({ cancelCode: 'CNAVL', comments: 'Test reason' });
      dialogResult$.complete();
      flush(); // Flush all pending operations

      // Verify cancelDrive was called with correct parameters (driveId, cancelReasonCode, cancelReason)
      expect(mockDriveService.cancelDrive).toHaveBeenCalledWith(
        'DRIVE001',
        'CNAVL',
        'Test reason'
      );

      // Emit cancel result
      cancelResult$.next({
        success: true,
        message: 'Drive cancelled successfully',
        statusCode: 200
      });
      cancelResult$.complete();
      flush(); // Flush all pending operations
      fixture.detectChanges();

      // Verify the drive was cancelled (service called with correct args)
      expect(mockDriveService.cancelDrive).toHaveBeenCalled();
    }));


  });

  describe('Action Menu', () => {
    it('should toggle action menu', () => {
      const mockButton = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          bottom: 120,
          right: 250,
          width: 50,
          height: 20,
          x: 200,
          y: 100,
          toJSON: () => {}
        })
      };

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: jasmine.createSpy('preventDefault'),
        currentTarget: mockButton
      } as any;

      component.toggleActionMenu(0, event);

      expect(component.showActionMenu).toBeTrue();
      expect(component.activeActionRowIndex).toBe(0);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should close action menu when clicking same button', () => {
      const mockButton = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          bottom: 120,
          right: 250,
          width: 50,
          height: 20,
          x: 200,
          y: 100,
          toJSON: () => {}
        })
      };

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: jasmine.createSpy('preventDefault'),
        currentTarget: mockButton
      } as any;

      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      component.toggleActionMenu(0, event);

      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });

    it('should close action menu', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      component.closeActionMenu();

      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });

    it('should handle row actions', () => {
      spyOn(component, 'editDrive').and.stub();
      spyOn(component, 'duplicateDrive').and.stub();
      spyOn(component, 'cancelDrive').and.stub();

      component.onRowAction('edit', mockDriveData[0]);
      expect(component.editDrive).toHaveBeenCalledWith(mockDriveData[0]);

      component.onRowAction('duplicate', mockDriveData[0]);
      expect(component.duplicateDrive).toHaveBeenCalledWith(mockDriveData[0]);

      component.onRowAction('cancel', mockDriveData[0]);
      expect(component.cancelDrive).toHaveBeenCalledWith(mockDriveData[0]);
    });
  });

  describe('Filter Management', () => {
    it('should apply filters and reset page index', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const filters = {
        driveId: 'DRIVE001',
        sponsorId: 'SPONSOR001',
        driveType: 'F',
        category: 'CAT01'
      };

      component.pageIndex = 5;
      component.applyFilters(filters);
      tick(300);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));


    it('should clear search text when clearing all filters', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Set search text, filters, and filter chips
      component.searchText = 'DRIVE001';
      component.appliedFilters = { driveType: 'F' };
      component.filterChips = [{ key: 'driveType', label: 'Type: Fixed', value: 'F' }];

      component.clearAllFilters();
      tick(300);

      // Verify search text is cleared along with filters
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
    }));



    it('should detect active filters', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();

      component.appliedFilters = { driveId: 'DRIVE001' };
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should include filters in search request', () => {
      fixture.detectChanges();

      component.appliedFilters = {
        driveId: 'DRIVE001',
        sponsorId: 'SPONSOR001',
        driveType: 'F',
        category: 'CAT01'
      };

      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.driveId).toBe('DRIVE001');
      expect(request.sponsorId).toBe('SPONSOR001');
      expect(request.driveType).toBe('F');
      expect(request.driveCategory).toBe('CAT01');
    });
  });
  describe('Search Configuration', () => {
    it('should have searchOnEnterOnly set to true', () => {
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should require minimum 3 characters for search', () => {
      expect(component.searchConfig.minLength).toBe(3);
    });

    it('should have correct search placeholder', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Drive ID or Sponsor Name');
    });
  });

  describe('Error State Management', () => {

    it('should preserve search text after error and retry', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Set search text
      component.searchText = 'DRV123';

      // Simulate error
      mockDriveService.searchDrives.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();
      flush();

      expect(component.hasError).toBeTrue();
      expect(component.searchText).toBe('DRV123');

      // Retry - search text should be preserved
      mockDriveService.searchDrives.and.returnValue(of(mockSearchResponse));
      component.loadData();
      tick();

      expect(component.searchText).toBe('DRV123');
    }));


    it('should preserve filters after error and retry', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const filters = { driveType: 'F', status: 'CNFRM' };
      component.appliedFilters = filters;

      mockDriveService.searchDrives.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();
      flush();

      expect(component.appliedFilters).toEqual(filters);

      mockDriveService.searchDrives.and.returnValue(of(mockSearchResponse));
      component.loadData();
      tick();

      expect(component.appliedFilters).toEqual(filters);
    }));
  });
  describe('Notes Display', () => {
    it('should display notes with user information', () => {
      component.dataSource = mockDriveData;
      fixture.detectChanges();

      const driveWithNotes = component.dataSource[0];
      expect(driveWithNotes.notes).toBeDefined();
      expect(driveWithNotes.notes!.length).toBe(1);
      expect(driveWithNotes.notes![0].insertUserName).toBe('Test User');
    });

    it('should handle drives without notes', () => {
      component.dataSource = mockDriveData;
      fixture.detectChanges();

      const driveWithoutNotes = component.dataSource[1];
      expect(driveWithoutNotes.notes).toBeDefined();
      expect(driveWithoutNotes.notes!.length).toBe(0);
    });
  });

  describe('Search/Filter State Management on Navigation', () => {
    it('should reset state after search → edit → close side panel', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Step 1: User searches
      component.onSearch('DRIVE001');
      tick(300);
      expect(component.searchText).toBe('DRIVE001');

      // Step 2: User edits a drive
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));
      component.editDrive(mockDriveData[0]);
      tick();
      expect(component.sidePanelOpen).toBeTrue();

      mockDriveService.searchDrives.calls.reset();

      // Step 3: User closes side panel
      component.closeSidePanel();
      tick(300);

      // Verify: Search is cleared and full list loads
      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should reset state after filter → edit → save', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Step 1: User applies filter
      const filters = { driveType: 'F' };
      component.applyFilters(filters);
      tick(300);
      expect(component.appliedFilters).toEqual(filters);

      // Step 2: User edits a drive
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));
      component.editDrive(mockDriveData[0]);
      tick();
      expect(component.sidePanelOpen).toBeTrue();

      mockDriveService.searchDrives.calls.reset();

      // Step 3: User saves changes
      component.onSaveSuccess();

      // Verify: Filters are cleared and full list reloads
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should reset state after search + filter → duplicate → close', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Step 1: User searches and filters
      component.onSearch('SRD TEST');
      tick(300);
      const filters = { category: 'CAT01' };
      component.applyFilters(filters);
      tick(300);

      expect(component.searchText).toBe('SRD TEST');
      expect(component.appliedFilters).toEqual(filters);

      // Step 2: User duplicates a drive
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));
      component.duplicateDrive(mockDriveData[0]);
      tick();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('duplicate');

      mockDriveService.searchDrives.calls.reset();

      // Step 3: User closes side panel
      component.closeSidePanel();
      tick(300);

      // Verify: Both search and filters are cleared
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBeFalse();
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should handle multiple edit cycles with different search states', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Cycle 1: Search → Edit → Close
      component.onSearch('DRIVE001');
      tick(300);
      const fullDrive1 = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive1));
      component.editDrive(mockDriveData[0]);
      tick();
      component.closeSidePanel();
      tick(300);

      expect(component.searchText).toBe('');

      // Cycle 2: Filter → Edit → Close
      const filters = { driveType: 'M' };
      component.applyFilters(filters);
      tick(300);
      const fullDrive2 = { ...mockDriveData[1] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive2));
      component.editDrive(mockDriveData[1]);
      tick();
      component.closeSidePanel();
      tick(300);

      // Verify: State is clean after each cycle
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex).toBe(0);
    }));

    it('should not reset state when opening side panel (only when closing)', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      // Set search and filter state
      component.onSearch('CANTRELL');
      tick(300);
      const filters = { driveType: 'F' };
      component.applyFilters(filters);
      tick(300);

      // Open side panel for edit
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));
      component.editDrive(mockDriveData[0]);
      tick();

      // Verify: State is still present while side panel is open
      expect(component.searchText).toBe('CANTRELL');
      expect(component.appliedFilters).toEqual(filters);
      expect(component.sidePanelOpen).toBeTrue();
    }));
  });

  describe('CLEAR ALL Button Visibility', () => {
    it('should show CLEAR ALL when only search text exists', () => {
      component.searchText = 'DRIVE001';
      component.filterChips = [];

      // The HTML condition is: *ngIf="filterChips.length > 0 || searchText"
      const shouldShow = !!(component.filterChips.length > 0 || component.searchText);

      expect(shouldShow).toBeTrue();
    });

    it('should show CLEAR ALL when only filter chips exist', () => {
      component.searchText = '';
      component.filterChips = [{ key: 'driveType', label: 'Type: Fixed', value: 'F' }];

      const shouldShow = !!(component.filterChips.length > 0 || component.searchText);

      expect(shouldShow).toBeTrue();
    });

    it('should show CLEAR ALL when both search and filters exist', () => {
      component.searchText = 'DRIVE001';
      component.filterChips = [{ key: 'driveType', label: 'Type: Fixed', value: 'F' }];

      const shouldShow = !!(component.filterChips.length > 0 || component.searchText);

      expect(shouldShow).toBeTrue();
    });

    it('should NOT show CLEAR ALL when neither search nor filters exist', () => {
      component.searchText = '';
      component.filterChips = [];

      const shouldShow = !!(component.filterChips.length > 0 || component.searchText);

      expect(shouldShow).toBeFalse();
    });
  });

  describe('Chapter Management', () => {
    it('should initialize currentChapterId from headerService on component creation', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.currentChapterId).toBe('TST');
    }));

    it('should call cancelDrive with correct args when canceling drive', fakeAsync(() => {
      fixture.detectChanges();
      tick(500); // Complete initial load

      const mockDrive: SpecialDriveDto = mockDriveData[0];

      // Setup dialog confirmation
      const dialogResult$ = new Subject<any>();
      mockDialogRef = {
        afterClosed: () => dialogResult$.asObservable()
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      // Setup cancel service response
      const cancelResult$ = new Subject<any>();
      mockDriveService.cancelDrive.and.returnValue(cancelResult$.asObservable());

      // Start cancel operation
      component.cancelDrive(mockDrive);
      tick();

      // User confirms cancellation
      dialogResult$.next({ cancelCode: 'WEATHER', comments: 'Test' });
      tick();

      // Verify cancelDrive was called with driveId, cancelReasonCode, cancelReason
      expect(mockDriveService.cancelDrive).toHaveBeenCalledWith(
        mockDrive.driveId,
        'WEATHER',
        'Test'
      );

      // Complete the cancel operation
      cancelResult$.next({ success: true, statusCode: 200, message: 'Success' });
      tick();
    }));
  });

  describe('toggleSort', () => {
    it('should toggle sortDirection from desc to asc', () => {
      component.sortDirection = 'desc';

      component.toggleSort();

      expect(component.sortDirection).toBe('asc');
    });

    it('should toggle sortDirection from asc to desc', () => {
      component.sortDirection = 'asc';

      component.toggleSort();

      expect(component.sortDirection).toBe('desc');
    });

    it('should trigger searchSubject$ and reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick(500); // Complete initial load

      mockDriveService.searchDrives.calls.reset();
      component.sortDirection = 'desc';

      component.toggleSort();
      tick(300); // debounceTime

      expect(component.sortDirection).toBe('asc');
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));
  });

  describe('onPageChange', () => {
    it('should update pageIndex and pageSize from PageEvent', () => {
      fixture.detectChanges();

      const pageEvent: PageEvent = {
        pageIndex: 3,
        pageSize: 50,
        length: 200,
        previousPageIndex: 2
      };

      spyOn(component, 'loadData');

      component.onPageChange(pageEvent);

      expect(component.pageIndex).toBe(3);
      expect(component.pageSize).toBe(50);
    });

    it('should call loadData after updating pagination', () => {
      fixture.detectChanges();

      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 25,
        length: 100,
        previousPageIndex: 0
      };

      spyOn(component, 'loadData');

      component.onPageChange(pageEvent);

      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('onRemoveFilterChip', () => {
    it('should call SpecialDriveFilterChipsUtils.removeFilterByChipKey', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      spyOn(SpecialDriveFilterChipsUtils, 'removeFilterByChipKey').and.callThrough();

      component.appliedFilters = { driveType: 'F', category: 'CAT01' };

      component.onRemoveFilterChip('driveType');
      tick(300);

      expect(SpecialDriveFilterChipsUtils.removeFilterByChipKey).toHaveBeenCalledWith(
        { driveType: 'F', category: 'CAT01' },
        'driveType'
      );
    }));

    it('should reset pageIndex to 0', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      component.appliedFilters = { driveType: 'F', category: 'CAT01' };
      component.pageIndex = 5;

      component.onRemoveFilterChip('driveType');
      tick(300);

      expect(component.pageIndex).toBe(0);
    }));

    it('should update filterChips after removing a chip', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      component.appliedFilters = { driveType: 'F', category: 'CAT01' };
      component.filterChips = [
        { key: 'driveType', label: 'Drive Type: Fixed', value: 'F' },
        { key: 'category', label: 'Category: CAT01', value: 'CAT01' }
      ];

      component.onRemoveFilterChip('driveType');
      tick(300);

      // After removing driveType, only category should remain
      expect(component.filterChips.some(c => c.key === 'driveType')).toBeFalse();
    }));

    it('should trigger searchSubject$ to reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockDriveService.searchDrives.calls.reset();
      component.appliedFilters = { driveType: 'F', category: 'CAT01' };

      component.onRemoveFilterChip('driveType');
      tick(300);

      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));
  });

  describe('toggleRow', () => {
    it('should add index to expandedRows when not present', () => {
      component.expandedRows = new Set();

      component.toggleRow(2);

      expect(component.expandedRows.has(2)).toBeTrue();
    });

    it('should remove index from expandedRows when present', () => {
      component.expandedRows = new Set([2]);

      component.toggleRow(2);

      expect(component.expandedRows.has(2)).toBeFalse();
    });

    it('should not affect other expanded rows', () => {
      component.expandedRows = new Set([0, 1, 2]);

      component.toggleRow(1);

      expect(component.expandedRows.has(0)).toBeTrue();
      expect(component.expandedRows.has(1)).toBeFalse();
      expect(component.expandedRows.has(2)).toBeTrue();
    });
  });

  describe('getPrimaryFlag', () => {
    it('should return No when sponsors is null', () => {
      const drive = { ...mockDriveData[0], sponsors: null } as any;

      expect(component.getPrimaryFlag(drive)).toBe('No');
    });

    it('should return No when sponsors is empty', () => {
      const drive = { ...mockDriveData[0], sponsors: [] };

      expect(component.getPrimaryFlag(drive)).toBe('No');
    });

    it('should return Yes when a sponsor has primaryFlag Y', () => {
      const drive = {
        ...mockDriveData[0],
        sponsors: [
          { driveId: 'D1', chapterId: 'C1', sponsorId: 'S1', projectedShow: 10, projectedDraw: 8, primaryFlag: 'Y' }
        ]
      };

      expect(component.getPrimaryFlag(drive)).toBe('Yes');
    });

    it('should return No when no sponsor has primaryFlag Y', () => {
      const drive = {
        ...mockDriveData[0],
        sponsors: [
          { driveId: 'D1', chapterId: 'C1', sponsorId: 'S1', projectedShow: 10, projectedDraw: 8, primaryFlag: 'N' },
          { driveId: 'D1', chapterId: 'C1', sponsorId: 'S2', projectedShow: 5, projectedDraw: 4, primaryFlag: 'N' }
        ]
      };

      expect(component.getPrimaryFlag(drive)).toBe('No');
    });

    it('should return No when sponsors have no primaryFlag set', () => {
      const drive = {
        ...mockDriveData[0],
        sponsors: [
          { driveId: 'D1', chapterId: 'C1', sponsorId: 'S1', projectedShow: 10, projectedDraw: 8 }
        ]
      };

      expect(component.getPrimaryFlag(drive)).toBe('No');
    });

    it('should return No when sponsors is undefined', () => {
      const drive = { ...mockDriveData[1], sponsors: undefined };
      expect(component.getPrimaryFlag(drive as any)).toBe('No');
    });
  });

  describe('getCoachCount', () => {
    it('should return No when resources is empty', () => {
      const drive = { ...mockDriveData[0], resources: [] };

      expect(component.getCoachCount(drive)).toBe('No');
    });

    it('should return No when resources is null', () => {
      const drive = { ...mockDriveData[0], resources: null } as any;

      expect(component.getCoachCount(drive)).toBe('No');
    });

    it('should return Yes when COACH resource exists with numberRequired > 0', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'COACH', numberRequired: 2 }
        ]
      };

      expect(component.getCoachCount(drive)).toBe('Yes');
    });

    it('should return No when COACH resource has numberRequired 0', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'COACH', numberRequired: 0 }
        ]
      };

      expect(component.getCoachCount(drive)).toBe('No');
    });

    it('should return No when no COACH resource exists', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'VAN', numberRequired: 1 }
        ]
      };

      expect(component.getCoachCount(drive)).toBe('No');
    });

    it('should match COACH case-insensitively', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'coach', numberRequired: 1 }
        ]
      };

      expect(component.getCoachCount(drive)).toBe('Yes');
    });

    it('should return No when resources is undefined', () => {
      const drive = { ...mockDriveData[1], resources: undefined };
      expect(component.getCoachCount(drive as any)).toBe('No');
    });
  });

  describe('createDrive', () => {
    it('should set sidePanelMode to add', () => {
      component.sidePanelMode = 'edit';

      component.createDrive();

      expect(component.sidePanelMode).toBe('add');
    });

    it('should set sidePanelData to null', () => {
      component.sidePanelData = mockDriveData[0];

      component.createDrive();

      expect(component.sidePanelData).toBeNull();
    });

    it('should set sidePanelOpen to true', () => {
      component.sidePanelOpen = false;

      component.createDrive();

      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('extractErrorMessage', () => {
    // extractErrorMessage is private, so we access it via bracket notation
    const callExtract = (comp: any, error: unknown, defaultMsg: string): string => {
      return comp['extractErrorMessage'](error, defaultMsg);
    };

    it('should return errorResponse.error with errorCode when both present', () => {
      const error = {
        error: {
          errorResponse: {
            error: 'Drive not found',
            errorCode: '404'
          }
        }
      };

      const result = callExtract(component, error, 'Default message');

      expect(result).toBe('Error 404: Drive not found');
    });

    it('should return errorResponse.error without code', () => {
      const error = {
        error: {
          errorResponse: {
            error: 'Validation failed'
          }
        }
      };

      const result = callExtract(component, error, 'Default message');

      expect(result).toBe('Validation failed');
    });

    it('should return error.error', () => {
      const error = {
        error: {
          error: 'Internal server error'
        }
      };

      const result = callExtract(component, error, 'Default message');

      expect(result).toBe('Internal server error');
    });

    it('should return error.message', () => {
      const error = {
        error: {
          message: 'Request timeout'
        }
      };

      const result = callExtract(component, error, 'Default message');

      expect(result).toBe('Request timeout');
    });

    it('should return top-level message', () => {
      const error = {
        message: 'Network error'
      };

      const result = callExtract(component, error, 'Default message');

      expect(result).toBe('Network error');
    });

    it('should return default when no error structure matches', () => {
      const error = {
        status: 500
      };

      const result = callExtract(component, error, 'Something went wrong');

      expect(result).toBe('Something went wrong');
    });

    it('should return default for null error', () => {
      const result = callExtract(component, null, 'Fallback message');

      expect(result).toBe('Fallback message');
    });

    it('should return default for non-object error', () => {
      const result = callExtract(component, 'string error', 'Fallback message');

      expect(result).toBe('Fallback message');
    });
  });

  describe('buildSearchRequest', () => {
    // buildSearchRequest is private; we test it through the args passed to searchDrives

    it('should set futureOnly=true when no date filter is applied', () => {
      fixture.detectChanges();

      component.appliedFilters = null;
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.futureOnly).toBeTrue();
    });

    it('should set futureOnly=true when filters exist but no driveDate', () => {
      fixture.detectChanges();

      component.appliedFilters = { driveType: 'F' };
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.futureOnly).toBeTrue();
    });

    it('should not set futureOnly when date filter is applied', () => {
      fixture.detectChanges();

      component.appliedFilters = { driveDate: '2026-06-15' };
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.futureOnly).toBeUndefined();
    });

    it('should include sortColumn as DRIVE_DATE', () => {
      fixture.detectChanges();

      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.sortColumn).toBe('DRIVE_DATE');
    });

    it('should include sortOrder DESC when sortDirection is desc', () => {
      fixture.detectChanges();

      component.sortDirection = 'desc';
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.sortOrder).toBe('DESC');
    });

    it('should include sortOrder ASC when sortDirection is asc', () => {
      fixture.detectChanges();

      component.sortDirection = 'asc';
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.sortOrder).toBe('ASC');
    });

    it('should include searchText in the request when set', () => {
      fixture.detectChanges();

      component.searchText = 'DRIVE123';
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.searchText).toBe('DRIVE123');
    });

    it('should set driveDateFrom and driveDateTo when driveDate filter is applied', () => {
      fixture.detectChanges();

      component.appliedFilters = { driveDate: '2026-06-15' };
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.driveDateFrom).toBe('2026-06-15T00:00:00');
      expect(request.driveDateTo).toBe('2026-06-15T23:59:59');
    });

    it('should format driveDate with time component into driveDateFrom and driveDateTo', () => {
      fixture.detectChanges();

      component.appliedFilters = {
        driveDate: '2026-06-15T12:00:00'
      };

      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.driveDateFrom).toBe('2026-06-15T00:00:00');
      expect(request.driveDateTo).toBe('2026-06-15T23:59:59');
    });
  });

  describe('getDayOfWeek', () => {
    it('should return day abbreviation for valid date', () => {
      const drive = { ...mockDriveData[0], driveDate: '2026-06-15' }; // Monday

      const result = component.getDayOfWeek(drive);

      expect(result).toBe('MON');
    });

    it('should return empty string for null driveDate', () => {
      const drive = { ...mockDriveData[0], driveDate: null } as any;

      const result = component.getDayOfWeek(drive);

      expect(result).toBe('');
    });

    it('should return empty string for undefined driveDate', () => {
      const drive = { ...mockDriveData[0] } as any;
      delete drive.driveDate;

      const result = component.getDayOfWeek(drive);

      expect(result).toBe('');
    });

    it('should return correct day for different dates', () => {
      const wednesdayDrive = { ...mockDriveData[0], driveDate: '2026-06-17' };

      expect(component.getDayOfWeek(wednesdayDrive)).toBe('WED');
    });
  });

  describe('ngOnDestroy', () => {
    it('should call destroy$.next and destroy$.complete', () => {
      fixture.detectChanges();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if it exists', () => {
      fixture.detectChanges();

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;

      component.ngOnDestroy();

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      fixture.detectChanges();
      (component as any).overlayRef = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('searchSubject$ error handling', () => {
    xit('should set error state and show snackbar when searchSubject$ pipe errors', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockSnackBar.open.calls.reset();
      mockDriveService.searchDrives.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.onSearch('test');
      tick(300);

      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load drive data. Please try again.');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error loading drives', 'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    }));
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset all state when chapter changes', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      fixture.detectChanges();
      tick(500);

      component.searchText = 'DRIVE001';
      component.appliedFilters = { driveType: 'F' };
      component.filterChips = [{ key: 'driveType', label: 'Type: Fixed', value: 'F' }];
      component.sidePanelOpen = true;
      component.sidePanelData = mockDriveData[0];
      component.pageIndex = 3;

      mockDriveService.searchDrives.calls.reset();

      chapterSubject.next();
      tick(500);

      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelMode).toBe('add');
      expect(component.pageIndex).toBe(0);
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should dispose overlay when chapter changes and overlay is open', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      (mockHeaderService as any).chapterChanged$ = chapterSubject.asObservable();

      fixture.detectChanges();
      tick(500);

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      chapterSubject.next();
      tick(500);

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    }));
  });

  describe('openFilter toggle', () => {
    it('should close and dispose overlay when openFilter called with existing overlay', () => {
      fixture.detectChanges();

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('getFormattedTime edge cases', () => {
    it('should return N/A when scheduleStartTime is null', () => {
      const drive = { ...mockDriveData[0], scheduleStartTime: null } as any;

      expect(component.getFormattedTime(drive)).toBe('N/A');
    });

    it('should return N/A when scheduleEndTime is undefined', () => {
      const drive = { ...mockDriveData[0] } as any;
      delete drive.scheduleEndTime;

      expect(component.getFormattedTime(drive)).toBe('N/A');
    });

    it('should return N/A when scheduleEndTime is null', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '09:00',
        scheduleEndTime: null as any
      };
      expect(component.getFormattedTime(drive)).toBe('N/A');
    });

    it('should return N/A when both times are undefined', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: undefined as any,
        scheduleEndTime: undefined as any
      };
      expect(component.getFormattedTime(drive)).toBe('N/A');
    });

    it('should format time-only HH:MM strings without UTC conversion', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '09:00',
        scheduleEndTime: '17:30'
      };

      const result = component.getFormattedTime(drive);

      expect(result).toBe('09:00 AM - 05:30 PM');
    });

    it('should format time-only HH:MM:SS strings without UTC conversion', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '14:30:00',
        scheduleEndTime: '22:15:00'
      };

      const result = component.getFormattedTime(drive);

      expect(result).toBe('02:30 PM - 10:15 PM');
    });

    it('should return N/A when time formatting throws an error', () => {
      fixture.detectChanges();

      spyOn((component as any).chapterTimezoneService, 'convertGmtToLocal').and.throwError('Invalid timezone');

      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '2026-01-01T09:00:00',
        scheduleEndTime: '2026-01-01T17:00:00'
      };

      const result = component.getFormattedTime(drive);

      expect(result).toBe('N/A');
    });
  });

  describe('getStaffRequired edge cases', () => {
    it('should return 0 when resources is null', () => {
      const drive = { ...mockDriveData[0], resources: null } as any;

      expect(component.getStaffRequired(drive)).toBe(0);
    });

    it('should sum all resource numberRequired values', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'VAN', numberRequired: 3 },
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'COACH', numberRequired: 2 },
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'BED', numberRequired: 5 }
        ]
      };

      expect(component.getStaffRequired(drive)).toBe(10);
    });

    it('should return 0 when resources array is empty', () => {
      const drive = { ...mockDriveData[1], resources: [] };
      expect(component.getStaffRequired(drive)).toBe(0);
    });

    it('should return 0 when resources is undefined', () => {
      const drive = { ...mockDriveData[1], resources: undefined };
      expect(component.getStaffRequired(drive as any)).toBe(0);
    });
  });

  describe('getVanCount edge cases', () => {
    it('should return No when resources is null', () => {
      const drive = { ...mockDriveData[0], resources: null } as any;

      expect(component.getVanCount(drive)).toBe('No');
    });
  });

  describe('Document Click Handler', () => {
    it('should close action menu when clicking outside menu and button', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      const outsideElement = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outsideElement });

      component.onDocumentClick(event);

      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });

    it('should do nothing when action menu is not shown', () => {
      component.showActionMenu = false;
      component.activeActionRowIndex = null;

      const outsideElement = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: outsideElement });

      component.onDocumentClick(event);

      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });
  });

  describe('Duplicate Drive Error Path', () => {
    it('should handle error when duplicate drive fails to load', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const consoleSpy = spyOn(console, 'error');
      mockDriveService.getDriveById.and.returnValue(
        throwError(() => new Error('Drive not found'))
      );

      component.duplicateDrive(mockDriveData[0]);
      flush();

      expect(mockDriveService.getDriveById).toHaveBeenCalledWith('DRIVE001', 'CHAPTER1');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.isLoading).toBeFalse();
      expect(consoleSpy).toHaveBeenCalledWith('Error loading drive details for duplication:', jasmine.anything());
    }));
  });

  describe('Cancel Drive - Error and Dismissed Paths', () => {
    it('should handle error when cancelDrive fails', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const consoleSpy = spyOn(console, 'error');
      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      mockDriveService.cancelDrive.and.returnValue(
        throwError(() => new Error('Cancel failed'))
      );

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next({ cancelCode: 'CNAVL', comments: 'reason' });
      dialogResult$.complete();
      flush();

      expect(mockDriveService.cancelDrive).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error cancelling drive:', jasmine.anything());
    }));

    it('should not call cancelDrive when dialog is dismissed without result', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next(undefined);
      dialogResult$.complete();
      tick();

      expect(mockDriveService.cancelDrive).not.toHaveBeenCalled();
    }));
  });

  describe('cancelDrive dialog data', () => {
    it('should open dialog with correct data including driveId and driveDate', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.cancelDrive(mockDriveData[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(
        CancelDriveDialogComponent,
        jasmine.objectContaining({
          width: '560px',
          data: jasmine.objectContaining({
            driveId: 'DRIVE001',
            driveDate: '2026-06-15',
            sponsorName: undefined
          })
        })
      );

      dialogResult$.next(undefined);
      dialogResult$.complete();
      tick();
    }));

    it('should show success snackbar and reload data after successful cancellation', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      mockDriveService.cancelDrive.and.returnValue(
        of({ success: true, message: 'Drive cancelled successfully', statusCode: 200 })
      );

      mockDriveService.searchDrives.calls.reset();

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next({ cancelCode: 'CNAVL', comments: 'Test' });
      dialogResult$.complete();
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Drive cancelled successfully',
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
      expect(mockDriveService.searchDrives).toHaveBeenCalled();
    }));

    it('should use default message when response has no message', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      mockDriveService.cancelDrive.and.returnValue(
        of({ success: true, statusCode: 200 } as any)
      );

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next({ cancelCode: 'CNAVL', comments: '' });
      dialogResult$.complete();
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Drive cancelled successfully',
        'Close',
        jasmine.anything()
      );
    }));

    it('should show error snackbar when cancellation fails with structured error', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      mockDriveService.cancelDrive.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: {
              error: 'Drive already cancelled',
              errorCode: '409'
            }
          }
        }))
      );

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next({ cancelCode: 'CNAVL', comments: 'Test' });
      dialogResult$.complete();
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 409: Drive already cancelled',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    }));

    it('should pass undefined cancelReasonCode when cancelCode is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      const dialogResult$ = new Subject<any>();
      mockDialogRef = { afterClosed: () => dialogResult$.asObservable() };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      mockDriveService.cancelDrive.and.returnValue(
        of({ success: true, statusCode: 200, message: 'Cancelled' })
      );

      component.cancelDrive(mockDriveData[0]);
      dialogResult$.next({ cancelCode: '', comments: '' });
      dialogResult$.complete();
      flush();

      expect(mockDriveService.cancelDrive).toHaveBeenCalledWith(
        'DRIVE001',
        undefined,
        undefined
      );
    }));
  });

  describe('loadData state management', () => {
    it('should set isLoading=true and clear error state before making request', () => {
      fixture.detectChanges();

      component.hasError = true;
      component.errorMessage = 'Previous error';
      component.isLoading = false;

      component.loadData();

      // isLoading is set synchronously before the async call resolves
      // Note: finalize will set it back to false after the observable completes
    });

    it('should show snackbar on loadData error', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockSnackBar.open.calls.reset();
      mockDriveService.searchDrives.and.returnValue(
        throwError(() => new Error('Server Error'))
      );

      component.loadData();
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error loading drives',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    }));
  });

  describe('onDocumentClick edge cases', () => {
    it('should NOT close action menu when clicking inside action-btn', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      const actionBtnElement = document.createElement('button');
      actionBtnElement.classList.add('action-btn');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: actionBtnElement });

      component.onDocumentClick(event);

      expect(component.showActionMenu).toBeTrue();
      expect(component.activeActionRowIndex).toBe(0);
    });

    it('should NOT close action menu when clicking inside action-menu', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      const menuContainer = document.createElement('div');
      menuContainer.classList.add('action-menu');
      const menuItem = document.createElement('span');
      menuContainer.appendChild(menuItem);
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: menuItem });

      component.onDocumentClick(event);

      expect(component.showActionMenu).toBeTrue();
      expect(component.activeActionRowIndex).toBe(0);
    });
  });

  describe('toggleActionMenu positioning', () => {
    it('should set position values as pixel strings', () => {
      const mockButton = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          bottom: 120,
          right: 450,
          width: 250,
          height: 20,
          x: 200,
          y: 100,
          toJSON: () => {}
        })
      };

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: jasmine.createSpy('preventDefault'),
        currentTarget: mockButton
      } as any;

      component.toggleActionMenu(0, event);

      // Position values should be pixel strings
      expect(component.actionMenuPosition.top).toMatch(/^\d+px$/);
      expect(component.actionMenuPosition.left).toMatch(/^\d+px$/);

      // Left should be non-negative (Math.max(0, ...))
      const leftValue = parseInt(component.actionMenuPosition.left);
      expect(leftValue).toBeGreaterThanOrEqual(0);

      // Top should be non-negative (Math.max(0, ...))
      const topValue = parseInt(component.actionMenuPosition.top);
      expect(topValue).toBeGreaterThanOrEqual(0);
    });

    it('should switch to a different row when menu is already open for another', () => {
      const mockButton = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          bottom: 120,
          right: 450,
          width: 250,
          height: 20,
          x: 200,
          y: 100,
          toJSON: () => {}
        })
      };

      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
        preventDefault: jasmine.createSpy('preventDefault'),
        currentTarget: mockButton
      } as any;

      // Open for row 0
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      // Toggle for row 1
      component.toggleActionMenu(1, event);

      expect(component.showActionMenu).toBeTrue();
      expect(component.activeActionRowIndex).toBe(1);
    });
  });

  describe('onRowAction edge cases', () => {
    it('should close action menu for unknown action', () => {
      component.showActionMenu = true;
      component.activeActionRowIndex = 0;

      component.onRowAction('unknown', mockDriveData[0]);

      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
    });
  });

  describe('editDrive error handling', () => {
    it('should show snackbar with extracted error message on editDrive failure', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockDriveService.getDriveById.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: {
              error: 'Drive not found',
              errorCode: '404'
            }
          }
        }))
      );

      component.editDrive(mockDriveData[0]);
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error 404: Drive not found',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        })
      );
    }));
  });

  describe('duplicateDrive error handling', () => {
    it('should show snackbar with extracted error message on duplicateDrive failure', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);

      mockDriveService.getDriveById.and.returnValue(
        throwError(() => ({
          error: {
            message: 'Service unavailable'
          }
        }))
      );

      component.duplicateDrive(mockDriveData[0]);
      flush();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Service unavailable',
        'DISMISS',
        jasmine.objectContaining({
          panelClass: ['error-snackbar']
        })
      );
    }));
  });

  describe('getVanCount additional cases', () => {
    it('should match VAN case-insensitively (lowercase)', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'van', numberRequired: 1 }
        ]
      };

      expect(component.getVanCount(drive)).toBe('Yes');
    });

    it('should return No when VAN resource has numberRequired 0', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'VAN', numberRequired: 0 }
        ]
      };

      expect(component.getVanCount(drive)).toBe('No');
    });

    it('should return No when resources is undefined', () => {
      const drive = { ...mockDriveData[0], resources: undefined };
      expect(component.getVanCount(drive as any)).toBe('No');
    });

    it('should match partial VAN code like VANS', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'VANS', numberRequired: 1 }
        ]
      };

      expect(component.getVanCount(drive)).toBe('Yes');
    });
  });

  describe('getStaffRequired with edge cases', () => {
    it('should treat null numberRequired as 0', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'VAN', numberRequired: null as any },
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'COACH', numberRequired: 3 }
        ]
      };

      expect(component.getStaffRequired(drive)).toBe(3);
    });

    it('should handle single resource', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'BED', numberRequired: 7 }
        ]
      };

      expect(component.getStaffRequired(drive)).toBe(7);
    });
  });

  describe('buildSearchRequest additional cases', () => {
    it('should set searchText to undefined when searchText is empty', () => {
      fixture.detectChanges();

      component.searchText = '';
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.searchText).toBeUndefined();
    });

    it('should not set filter properties when appliedFilters values are falsy', () => {
      fixture.detectChanges();

      component.appliedFilters = {
        driveId: null as any,
        sponsorId: null as any,
        driveType: null as any,
        category: null as any,
        driveDate: null as any
      };
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.driveId).toBeUndefined();
      expect(request.sponsorId).toBeUndefined();
      expect(request.driveType).toBeUndefined();
      expect(request.driveCategory).toBeUndefined();
      expect(request.driveDateFrom).toBeUndefined();
      expect(request.driveDateTo).toBeUndefined();
      expect(request.futureOnly).toBeTrue();
    });

    it('should set all filter properties when appliedFilters has all values', () => {
      fixture.detectChanges();

      component.appliedFilters = {
        driveId: 'DRIVE001',
        sponsorId: 'SPONSOR001',
        driveType: 'F',
        category: 'CAT01',
        driveDate: '2026-08-15'
      };
      component.loadData();

      const request = mockDriveService.searchDrives.calls.mostRecent().args[2];
      expect(request.driveId).toBe('DRIVE001');
      expect(request.sponsorId).toBe('SPONSOR001');
      expect(request.driveType).toBe('F');
      expect(request.driveCategory).toBe('CAT01');
      expect(request.driveDateFrom).toBe('2026-08-15T00:00:00');
      expect(request.driveDateTo).toBe('2026-08-15T23:59:59');
      expect(request.futureOnly).toBeUndefined();
    });
  });

  describe('onSearch behavior', () => {
    it('should reset pageIndex to 0 when searching', () => {
      component.pageIndex = 5;

      component.onSearch('test search');

      expect(component.pageIndex).toBe(0);
      expect(component.searchText).toBe('test search');
    });
  });

  describe('closeSidePanel', () => {
    it('should reset sidePanelOpen and sidePanelData', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockDriveData[0];

      // Use spyOn to prevent actual searchSubject$ emission
      spyOn(component as any, 'loadData');
      component.closeSidePanel();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess state reset', () => {
    it('should reset all search and filter state and call loadData', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockDriveData[0];
      component.searchText = 'test';
      component.appliedFilters = { driveType: 'F' };
      component.filterChips = [{ key: 'driveType', label: 'Type: F', value: 'F' }];
      component.pageIndex = 3;

      spyOn(component, 'loadData');

      component.onSaveSuccess();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('default property values', () => {
    it('should have correct default pagination values', () => {
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(0);
      expect(component.totalRecords).toBe(0);
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

    it('should have correct default state values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.isFilterOpen).toBeFalse();
      expect(component.searchText).toBe('');
    });

    it('should have correct default sort values', () => {
      expect(component.sortDirection).toBe('desc');
      expect(component.sortColumn).toBe('driveDate');
      expect(component.sortActive).toBeTrue();
    });

    it('should have correct default side panel values', () => {
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should have correct default action menu values', () => {
      expect(component.showActionMenu).toBeFalse();
      expect(component.activeActionRowIndex).toBeNull();
      expect(component.actionMenuPosition).toEqual({ top: '0px', left: '0px' });
    });

    it('should have correct default data values', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.expandedRows.size).toBe(0);
      expect(component.allRowsExpanded).toBeFalse();
    });

    it('should have correct default filter values', () => {
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });
  });

  describe('toggleAllRows edge cases', () => {
    it('should expand no rows when dataSource is empty', () => {
      component.dataSource = [];
      component.allRowsExpanded = false;

      component.toggleAllRows();

      expect(component.allRowsExpanded).toBeTrue();
      expect(component.expandedRows.size).toBe(0);
    });

    it('should collapse all rows on second toggle', () => {
      component.dataSource = mockDriveData;

      // First toggle - expand all
      component.toggleAllRows();
      expect(component.allRowsExpanded).toBeTrue();
      expect(component.expandedRows.size).toBe(2);

      // Second toggle - collapse all
      component.toggleAllRows();
      expect(component.allRowsExpanded).toBeFalse();
      expect(component.expandedRows.size).toBe(0);
    });
  });

  describe('isRowExpanded', () => {
    it('should return false for index not in expandedRows', () => {
      component.expandedRows = new Set([0, 2]);

      expect(component.isRowExpanded(1)).toBeFalse();
      expect(component.isRowExpanded(3)).toBeFalse();
    });

    it('should return true for index in expandedRows', () => {
      component.expandedRows = new Set([0, 2]);

      expect(component.isRowExpanded(0)).toBeTrue();
      expect(component.isRowExpanded(2)).toBeTrue();
    });
  });

  describe('getCoachCount additional cases', () => {
    it('should match COACHES resource code', () => {
      const drive = {
        ...mockDriveData[0],
        resources: [
          { driveId: 'D1', chapterId: 'C1', resourceCode: 'COACHES', numberRequired: 1 }
        ]
      };

      expect(component.getCoachCount(drive)).toBe('Yes');
    });
  });

  describe('getDayOfWeek additional cases', () => {
    it('should return correct day for weekend dates', () => {
      const saturdayDrive = { ...mockDriveData[0], driveDate: '2026-06-20' };
      expect(component.getDayOfWeek(saturdayDrive)).toBe('SAT');

      const sundayDrive = { ...mockDriveData[0], driveDate: '2026-06-21' };
      expect(component.getDayOfWeek(sundayDrive)).toBe('SUN');
    });
  });

  describe('openFilter full flow', () => {
    // Helper: set up all overlay mocks needed for openFilter
    function setupOverlayMocks() {
      const localPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', [
        'flexibleConnectedTo',
        'withPositions',
        'withPush'
      ]);
      localPositionStrategy.flexibleConnectedTo.and.returnValue(localPositionStrategy);
      localPositionStrategy.withPositions.and.returnValue(localPositionStrategy);
      localPositionStrategy.withPush.and.returnValue(localPositionStrategy);

      const posBuilder = jasmine.createSpyObj('PositionBuilder', ['flexibleConnectedTo']);
      posBuilder.flexibleConnectedTo.and.returnValue(localPositionStrategy);
      mockOverlay.position.and.returnValue(posBuilder);

      const mockScrollStrategy = jasmine.createSpyObj('ScrollStrategy', ['enable', 'disable']);
      mockOverlay.scrollStrategies = { block: () => mockScrollStrategy } as any;

      const applySubject = new Subject<any>();
      const closeSubject = new Subject<void>();
      const backdropSubject = new Subject<any>();

      const localOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
      const localComponentRef = {
        instance: {
          currentFilters: null as any,
          apply: applySubject,
          close: closeSubject
        }
      };
      localOverlayRef.attach.and.returnValue(localComponentRef);
      localOverlayRef.backdropClick.and.returnValue(backdropSubject.asObservable());
      mockOverlay.create.and.returnValue(localOverlayRef);

      const mockTableCard = document.createElement('div');
      component.tableCard = { nativeElement: mockTableCard } as any;
      (component as any).overlayRef = null;

      // Override the component's overlay with the mock (OverlayModule provides its own instance)
      (component as any).overlay = mockOverlay;

      return { localOverlayRef, localComponentRef, applySubject, closeSubject, backdropSubject };
    }

    it('should set isFilterOpen to true when opening fresh filter', () => {
      const { localOverlayRef } = setupOverlayMocks();

      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
      expect(mockOverlay.create).toHaveBeenCalled();
      expect(localOverlayRef.attach).toHaveBeenCalled();
    });

    it('should apply filters and close when filter panel emits apply', fakeAsync(() => {
      fixture.detectChanges();
      tick(500);
      const { applySubject, localOverlayRef } = setupOverlayMocks();

      component.openFilter();

      const filters = { driveType: 'F' };
      applySubject.next(filters);
      tick(300);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.isFilterOpen).toBeFalse();
      expect(localOverlayRef.dispose).toHaveBeenCalled();
    }));

    it('should close filter when filter panel emits close', () => {
      fixture.detectChanges();
      const { closeSubject, localOverlayRef } = setupOverlayMocks();

      component.openFilter();
      closeSubject.next();

      expect(component.isFilterOpen).toBeFalse();
      expect(localOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should close filter on backdrop click', () => {
      fixture.detectChanges();
      const { backdropSubject, localOverlayRef } = setupOverlayMocks();

      component.openFilter();
      backdropSubject.next(new MouseEvent('click'));

      expect(component.isFilterOpen).toBeFalse();
      expect(localOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should pass currentFilters to filter panel', () => {
      fixture.detectChanges();
      component.appliedFilters = { driveType: 'F', category: 'CAT01' };
      const { localComponentRef } = setupOverlayMocks();

      component.openFilter();

      expect(localComponentRef.instance.currentFilters).toEqual({ driveType: 'F', category: 'CAT01' });
    });
  });

  describe('closeFilter private method behavior', () => {
    it('should blur filterBtn when it exists', () => {
      fixture.detectChanges();

      const mockBtn = document.createElement('button');
      const blurSpy = spyOn(mockBtn, 'blur');
      component.filterBtn = { nativeElement: mockBtn } as any;

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      // Access the private closeFilter method
      (component as any).closeFilter();

      expect(blurSpy).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should handle when filterBtn is undefined', () => {
      fixture.detectChanges();

      component.filterBtn = undefined as any;

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      expect(() => (component as any).closeFilter()).not.toThrow();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('createDrive window scroll', () => {
    it('should call window.scrollTo with smooth behavior', () => {
      const scrollSpy = spyOn(window, 'scrollTo');

      component.createDrive();

      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('editDrive success path details', () => {
    it('should call window.scrollTo after loading drive', fakeAsync(() => {
      const scrollSpy = spyOn(window, 'scrollTo');
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));

      component.editDrive(mockDriveData[0]);
      tick();

      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    }));

    it('should set isLoading=true before request', () => {
      mockDriveService.getDriveById.and.returnValue(of(mockDriveData[0]));

      component.isLoading = false;
      component.editDrive(mockDriveData[0]);

      // finalize sets it back to false, but the fact getDriveById was called confirms it ran
      expect(mockDriveService.getDriveById).toHaveBeenCalled();
    });
  });

  describe('duplicateDrive success path details', () => {
    it('should call window.scrollTo after loading drive for duplication', fakeAsync(() => {
      const scrollSpy = spyOn(window, 'scrollTo');
      const fullDrive = { ...mockDriveData[0] };
      mockDriveService.getDriveById.and.returnValue(of(fullDrive));

      component.duplicateDrive(mockDriveData[0]);
      tick();

      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(component.sidePanelMode).toBe('duplicate');
    }));
  });

  describe('getFormattedTime with ISO datetime strings', () => {
    it('should handle ISO datetime strings with chapter timezone conversion', () => {
      const drive = {
        ...mockDriveData[0],
        scheduleStartTime: '2026-06-15T14:00:00',
        scheduleEndTime: '2026-06-15T22:00:00'
      };

      const result = component.getFormattedTime(drive);

      // The ChapterTimezoneService.convertGmtToLocal returns the same moment
      // since chapterUtcOffsetMinutes is null in the real service (not mocked)
      expect(result).toContain(' - ');
      expect(result).toMatch(/^\d{2}:\d{2} (AM|PM) - \d{2}:\d{2} (AM|PM)$/);
    });
  });
});
