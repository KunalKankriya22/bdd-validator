import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { TablePageEvent } from '@shared/interfaces/data-table.interface';

import { ViewInterdictionCodesComponent } from './view-interdiction-codes';
import { ViewInterdictionCodeService } from '../services/view-interdiction-codes.service';
import { InterdictionCodeApiResponse } from '../interfaces/view-interdiction-code.interface';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ViewInterdictionCodeComponent', () => {
  // Patch MatSidenav to handle null/invalid activeElement in headless environments
  beforeAll(() => {
    const originalIsFocusWithinDrawer = (MatSidenav.prototype as any)._isFocusWithinDrawer;
    (MatSidenav.prototype as any)._isFocusWithinDrawer = function() {
      try {
        if (document.activeElement && document.activeElement instanceof Node) {
          return originalIsFocusWithinDrawer?.call(this) || false;
        }
        return false;
      } catch {
        return false;
      }
    };
  });
  let component: ViewInterdictionCodesComponent;
  let fixture: ComponentFixture<ViewInterdictionCodesComponent>;
  let mockService: jasmine.SpyObj<ViewInterdictionCodeService>;
  let router: jasmine.SpyObj<Router>;
  let matDialogMock: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;
  let originalHistoryState: any;

  const mockRow: InterdictionCodeApiResponse = {
    interCode: 'ABOD',
    interType: 'I',
    interDesc: 'ABO/Rh Donor Discrepancy',
    systemInterCode: 'ABOD',
    systemInterFlag: 'Y',
    effDate: '2025-11-02',
    lastModifiedDate: '2025-12-09',
    auditKey: 1,
    programId: 'LAB',
    changeControlFlag: 'N'
  };

  const mockApiResponse = {
    data: [mockRow],
    totalCount: 1
  };

  beforeEach(async () => {
    // Save original history state
    originalHistoryState = history.state;

    // Set history.state BEFORE creating component to ensure ngOnInit can access it
    history.replaceState({ fromTabNavigation: true }, '');

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('ViewInterdictionCodeService', ['getInterdictionCodes']);
    mockService.getInterdictionCodes.and.returnValue(of(mockApiResponse));

    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    router.createUrlTree.and.returnValue({} as any);
    router.serializeUrl.and.returnValue('');

    matDialogMock = createMockMatDialog();
    matDialogMock.open.and.returnValue({
      afterClosed: () => of(null),
      close: jasmine.createSpy('close')
    } as any);

    // Configure module WITHOUT the MatDialog root provider — it must be
    // injected at component level so it wins over the component's own
    // MatDialogModule provider (standalone component local injector wins).
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatTableModule,
        MatPaginatorModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        ViewInterdictionCodesComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: ViewInterdictionCodeService, useValue: mockService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
        {
          provide: HeaderService,
          useValue: { chapterChanged$: chapterChanged$ }
        }
      ]
    });

    TestBed.overrideComponent(ViewInterdictionCodesComponent, {
      add: { providers: [{ provide: MatDialog, useValue: matDialogMock }] }
    });

    await TestBed.compileComponents();

    fixture = TestBed.createComponent(ViewInterdictionCodesComponent);
    component = fixture.componentInstance;

    // Mock the drawer ViewChild to avoid MatDrawer DOM errors in headless Chrome
    component.drawer = jasmine.createSpyObj('MatDrawer', ['open', 'close']) as any;

    // NOTE: Do NOT call fixture.detectChanges() here
    // Individual tests will trigger change detection as needed
  });

  afterEach(() => {
    // Restore history.state to its original value
    history.replaceState(originalHistoryState, '');
  });

  // ─── Component Creation ──────────────────────────────────────────────────────

  describe('Component Creation', () => {

    it('should initialize dataSource as empty array', () => {
      expect(Array.isArray(component.dataSource)).toBeTrue();
    });

    it('should initialize selectedTabIndex to 1 (Lab tab)', () => {
      expect(component.selectedTabIndex).toBe(1);
    });

    it('should initialize isDrawerOpen as false', () => {
      expect(component.isDrawerOpen).toBeFalse();
    });

    it('should initialize drawerMode as add', () => {
      expect(component.drawerMode).toBe('add');
    });

    it('should initialize isLoading as false after data loads', fakeAsync(() => {
      fixture.detectChanges(); // Trigger ngOnInit
      tick();
      expect(component.isLoading).toBeFalse();
    }));
  });

  // ─── Data Loading ────────────────────────────────────────────────────────────

  describe('Data Loading', () => {
    beforeEach(() => {
      mockService.getInterdictionCodes.calls.reset();
      mockService.getInterdictionCodes.and.returnValue(of(mockApiResponse));
      component.loadData();
    });



    it('should set totalRecords from API response', fakeAsync(() => {
      fixture.detectChanges(); // Trigger ngOnInit
      tick();
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
    }));




    it('should send searchText to API', () => {
      component.currentSearchText = 'ABOD';
      component.loadData();
      const payload = mockService.getInterdictionCodes.calls.mostRecent().args[0];
      expect(payload.searchText).toBe('ABOD');
    });
  });

  // ─── Search ──────────────────────────────────────────────────────────────────

  describe('onSearch', () => {

    it('should call loadData after search', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onSearch('TEST');
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should handle empty search string', () => {
      component.onSearch('');
      expect(component.currentSearchText).toBe('');
    });
  });

  describe('onSearchCleared', () => {

    it('should call loadData after clearing search', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onSearchCleared();
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── Pagination ──────────────────────────────────────────────────────────────

  describe('onPageChange', () => {


    it('should call loadData after page change', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onPageChange({ pageIndex: 1, pageSize: 10, previousPageIndex: 0 } as TablePageEvent);
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── Sort ────────────────────────────────────────────────────────────────────

  describe('onSortChange', () => {


    it('should call loadData after sort change', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onSortChange({ column: 'effDate', direction: 'A' });
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });



  });

  // ─── Tab Change ──────────────────────────────────────────────────────────────

  describe('onTabChange', () => {
    it('should set selectedTabIndex', () => {
      component.onTabChange(0);
      expect(component.selectedTabIndex).toBe(0);
    });



    it('should reset pageIndex to 0 on tab change', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      component.onTabChange(1);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should call loadData after tab change', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onTabChange(1);
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── Row Actions ─────────────────────────────────────────────────────────────

  describe('onRowAction', () => {
    it('should open drawer in edit mode for edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRow });
      expect(component.isDrawerOpen).toBeTrue();
      expect(component.drawerMode).toBe('edit');
    });

    it('should set drawerData to the row for edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRow });
      expect(component.drawerData).toBe(mockRow);
    });

    it('should set activeRow on dataTableComponent when editing', () => {
      const mockDataTable = { activeRow: null } as any;
      component.dataTableComponent = mockDataTable;
      component.onRowAction({ action: 'edit', row: mockRow });
      expect(mockDataTable.activeRow).toBe(mockRow);
    });
  });

  // ─── Drawer Management ───────────────────────────────────────────────────────

  describe('openAddEditDrawer — Add Mode', () => {
    it('should set isDrawerOpen to true', () => {
      component.openAddEditDrawer('add');
      expect(component.isDrawerOpen).toBeTrue();
    });


  });

  describe('openAddEditDrawer — Edit Mode', () => {
    it('should set isDrawerOpen to true', () => {
      component.openAddEditDrawer('edit', mockRow);
      expect(component.isDrawerOpen).toBeTrue();
    });


    it('should set drawerData to provided row', () => {
      component.openAddEditDrawer('edit', mockRow);
      expect(component.drawerData).toBe(mockRow);
    });

    it('should not clear activeRow on dataTableComponent when editing', () => {
      const mockDataTable = { activeRow: mockRow } as any;
      component.dataTableComponent = mockDataTable;
      component.openAddEditDrawer('edit', mockRow);
      expect(mockDataTable.activeRow).toBe(mockRow);
    });
  });

  describe('closeDrawer', () => {
    it('should set isDrawerOpen to false', () => {
      component.isDrawerOpen = true;
      component.closeDrawer();
      expect(component.isDrawerOpen).toBeFalse();
    });


  });

  describe('onDrawerSaved', () => {
    it('should close drawer', () => {
      component.isDrawerOpen = true;
      component.onDrawerSaved();
      expect(component.isDrawerOpen).toBeFalse();
    });

    it('should reload data', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.onDrawerSaved();
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── getInterTypeLabel ───────────────────────────────────────────────────────

  describe('getInterTypeLabel', () => {
    it('should return HOLD for H', () => {
      expect(component.getInterTypeLabel('H')).toBe('HOLD');
    });

    it('should return BIO for B', () => {
      expect(component.getInterTypeLabel('B')).toBe('BIO');
    });

    it('should return NFT for N', () => {
      expect(component.getInterTypeLabel('N')).toBe('NFT');
    });

    it('should return INITIAL for I', () => {
      expect(component.getInterTypeLabel('I')).toBe('INITIAL');
    });

    it('should return the original value for unknown type code', () => {
      expect(component.getInterTypeLabel('X')).toBe('X');
    });
  });

  // ─── Filter Chips ────────────────────────────────────────────────────────────

  describe('updateFilterChips', () => {
    it('should produce no chips when no filters are applied', () => {
      component.appliedFilters = {};
      component.updateFilterChips();
      expect(component.filterChips.length).toBe(0);
    });

    it('should produce a type chip with HOLD label when type is H', () => {
      component.appliedFilters = { type: 'H' };
      component.updateFilterChips();
      const chip = component.filterChips.find(c => c.key === 'type');
      expect(chip?.label).toBe('Type: HOLD');
    });

    it('should produce a system chip with Yes label when system is Y', () => {
      component.appliedFilters = { system: 'Y' };
      component.updateFilterChips();
      const chip = component.filterChips.find(c => c.key === 'system');
      expect(chip?.label).toBe('System: Yes');
    });

    it('should produce a system chip with No label when system is N', () => {
      component.appliedFilters = { system: 'N' };
      component.updateFilterChips();
      const chip = component.filterChips.find(c => c.key === 'system');
      expect(chip?.label).toBe('System: No');
    });

    it('should produce an effDate chip when both effDate and effPeriod are set', () => {
      component.appliedFilters = {
        effDate: new Date(),
        effPeriod: 'After'
      };
      component.updateFilterChips();
      const chip = component.filterChips.find(c => c.key === 'effDate');
      expect(chip).toBeTruthy();
      expect(chip?.label).toContain('≥');
    });

    it('should produce a termDate chip with ≤ when termPeriod is Before', () => {
      component.appliedFilters = {
        termDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        termPeriod: 'Before'
      };
      component.updateFilterChips();
      const chip = component.filterChips.find(c => c.key === 'termDate');
      expect(chip?.label).toContain('≤');
    });

    it('should not produce effDate chip when effDate has no accompanying period', () => {
      component.appliedFilters = { effDate: new Date() };
      component.updateFilterChips();
      expect(component.filterChips.find(c => c.key === 'effDate')).toBeUndefined();
    });
  });

  // ─── removeFilter ────────────────────────────────────────────────────────────

  describe('removeFilter', () => {
    beforeEach(() => {
      component.appliedFilters = {
        type: 'I',
        system: 'Y',
        effDate: new Date(),
        effPeriod: 'After',
        termDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        termPeriod: 'Before'
      };
    });



    it('should remove effDate and effPeriod together', () => {
      component.removeFilter('effDate');
      expect(component.appliedFilters.effDate).toBeUndefined();
      expect(component.appliedFilters.effPeriod).toBeUndefined();
    });

    it('should remove termDate and termPeriod together', () => {
      component.removeFilter('termDate');
      expect(component.appliedFilters.termDate).toBeUndefined();
      expect(component.appliedFilters.termPeriod).toBeUndefined();
    });

    it('should call loadData after removing a filter', () => {
      const callsBefore = mockService.getInterdictionCodes.calls.count();
      component.removeFilter('type');
      expect(mockService.getInterdictionCodes.calls.count()).toBeGreaterThan(callsBefore);
    });

  });

  // ─── clearAllFilters ─────────────────────────────────────────────────────────


  // ─── goHome ──────────────────────────────────────────────────────────────────
  // ─── emptyMessage ────────────────────────────────────────────────────────────

  describe('updateEmptyMessage', () => {
    it('should show default message when no search or filters', () => {
      component.currentSearchText = '';
      component.appliedFilters = {};
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toBe(
        'No interdiction codes available to display'
      );
    });

    it('should show "no results" message when search is active', () => {
      component.currentSearchText = 'ABCD';
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toContain('No results found');
    });

    it('should show "no results" message when filters are active', () => {
      component.appliedFilters = { type: 'I' };
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toContain('No results found');
    });
  });

  // ─── onFilter ────────────────────────────────────────────────────────────────
  // ─── ngOnDestroy ─────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next() and complete() on destroy$', () => {
      const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from chapterChanged$ on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      let subscriptionActive = true;
      component['destroy$'].subscribe(() => {
        subscriptionActive = false;
      });

      expect(subscriptionActive).toBeTrue();

      component.ngOnDestroy();
      tick();

      expect(subscriptionActive).toBeFalse();

      expect(() => {
        chapterChanged$.next();
        tick();
      }).not.toThrow();
    }));
  });
});
