import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { DonorInterdictionCodesComponent } from './donor-interdiction-codes';
import {
  DonorInterdictionsService,
  DonorInterdiction,
  InterdictionLookupsResult,
} from '../services/donor-interdictions';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockLookupsResult: InterdictionLookupsResult = {
  dropdowns: {
    types: ['CAUTN'],
    typeItems: [{ code: 'CAUTN', codeType: 'INTER', description: 'Caution' }],
    owners: [],
    fixedPeriods: [],
    periods: ['P'],
    periodItems: [{ code: 'P', codeType: 'PERIOD', description: 'Permanent' }],
    labFlags: [],
    viewLimit: 3,
  },
  labFlags: [
    { code: 'A', codeType: 'LBHLD', description: 'Discard all products from donor' },
  ],
};

const mockRow: DonorInterdiction = {
  code: 'ADH',
  type: 'CAUTN',
  owner: 'D',
  deferral: 'Y',
  effectiveDate: '2025-11-02',
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

class DonorInterdictionsServiceMock {
  getLookups     = jasmine.createSpy('getLookups').and.returnValue(of(mockLookupsResult));
  searchSortFilter = jasmine.createSpy('searchSortFilter').and.returnValue(of({
    success: true, statusCode: 200, data: [mockRow], total: 1,
  }));
  getByCode = jasmine.createSpy('getByCode').and.returnValue(of(mockRow));
  getAll    = jasmine.createSpy('getAll').and.returnValue(of([]));
  create    = jasmine.createSpy('create').and.returnValue(of('SUCCESS'));
  update    = jasmine.createSpy('update').and.returnValue(of('UPDATED'));
}

class RouterMock {
  navigate = jasmine.createSpy('navigate');
  events = new Subject<any>();
  url = '/';
}

class MatDialogMock {
  open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(null) });
}

class MenuServiceMock {
  private _signal = signal<any[]>([]);
  getMenuItemsSignal = () => this._signal;
  findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(null);
}

class HeaderServiceMock {
  chapterChanged$ = new Subject<void>().asObservable();
  chapterTimeZone = jasmine.createSpy('chapterTimeZone').and.returnValue('UTC');
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('DonorInterdictionCodesComponent', () => {
  let component: DonorInterdictionCodesComponent;
  let fixture: ComponentFixture<DonorInterdictionCodesComponent>;
  let service: DonorInterdictionsServiceMock;
  let router: RouterMock;
  let dialog: MatDialogMock;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorInterdictionCodesComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorInterdictionsService, useClass: DonorInterdictionsServiceMock },
        { provide: MatDialog,   useClass: MatDialogMock },
        { provide: Router,      useClass: RouterMock },
        { provide: MenuService, useClass: MenuServiceMock },
        { provide: HeaderService, useClass: HeaderServiceMock },
      ],
    }).compileComponents();
  });

  beforeEach(fakeAsync(() => {
    fixture   = TestBed.createComponent(DonorInterdictionCodesComponent);
    component = fixture.componentInstance;
    service   = TestBed.inject(DonorInterdictionsService) as unknown as DonorInterdictionsServiceMock;
    router    = TestBed.inject(Router) as unknown as RouterMock;
    dialog    = TestBed.inject(MatDialog) as unknown as MatDialogMock;

    // Mock the drawer ViewChild to avoid MatDrawer DOM errors in headless Chrome
    component.drawer = jasmine.createSpyObj('MatDrawer', ['open', 'close']) as any;

    // Paginator must be stubbed before detectChanges so ngAfterViewInit can subscribe to page events
    component.paginator = { pageSize: 25, pageIndex: 0, page: { pipe: () => ({ subscribe: () => ({}) }) } } as any;

    fixture.detectChanges();
    tick();

    // Sort must be stubbed after detectChanges because @ViewChild(MatSort) overwrites it to undefined
    component.sort = { active: 'code', direction: 'asc', sortChange: { pipe: () => of() } } as any;
  }));

  afterEach(() => {
    fixture.destroy();
    (service.getLookups as jasmine.Spy).calls.reset();
    (service.searchSortFilter as jasmine.Spy).calls.reset();
  });

  // ─── Component Creation ──────────────────────────────────────────────────

  describe('Component Creation', () => {

    it('should initialize sidePanelOpen as false', () => {
      expect(component.sidePanelOpen).toBeFalse();
    });



    it('should initialize loading signal as false after init', () => {
      expect(component.loading()).toBeFalse();
    });
  });

  // ─── Dropdown Loading ────────────────────────────────────────────────────

  describe('Dropdown Loading', () => {

    it('should set dropdowns from getLookups result', () => {
      expect(component.dropdowns).toBeTruthy();
      expect(component.dropdowns.typeItems.length).toBe(1);
    });


    it('should set ownerList to [B, U, D] regardless of API response', () => {
      expect(component.ownerList).toEqual(['B', 'U', 'D']);
    });


    it('should log error when getLookups fails', fakeAsync(() => {
      spyOn(console, 'error');
      (service.getLookups as jasmine.Spy).and.returnValue(throwError(() => new Error('fail')));
      component.loadDropdowns();
      tick();
      expect(console.error).toHaveBeenCalledWith('Failed to load lookups', jasmine.any(Error));
    }));
  });

  // ─── Table Loading ───────────────────────────────────────────────────────

  describe('Table Loading', () => {



    it('should set totalRecords from response', () => {
      component.loadWithServerSort();
      expect(component.totalRecords).toBe(1);
    });

    it('should pass correct take/skip from paginator to searchSortFilter', () => {
      component.paginator.pageIndex = 1;
      component.paginator.pageSize = 10;
      component.loadWithServerSort();
      expect(service.searchSortFilter).toHaveBeenCalledWith(
        10,
        10,
        jasmine.objectContaining({ sortBy: 'code', sortDirection: 'ASC' })
      );
    });

    it('should log error when searchSortFilter fails', () => {
      spyOn(console, 'error');
      (service.searchSortFilter as jasmine.Spy).and.returnValue(throwError(() => new Error('fail')));
      component.loadWithServerSort();
      expect(console.error).toHaveBeenCalledWith('API Error:', jasmine.any(Error));
    });

  });

  // ─── Search ──────────────────────────────────────────────────────────────

  describe('Search', () => {
    it('should clear search filter and reload when value is empty string', () => {
      component.serverFilters = { search: 'test' };
      spyOn(component, 'loadWithServerSort');
      component.onSearch('');
      expect(component.serverFilters['search']).toBeUndefined();
      expect(component.loadWithServerSort).toHaveBeenCalled();
    });

    it('should set search filter and reload when value is provided', () => {
      spyOn(component, 'loadWithServerSort');
      component.onSearch('adh');
      expect(component.serverFilters.search).toBe('adh');
      expect(component.loadWithServerSort).toHaveBeenCalled();
    });



    it('should clear search on onSearchCleared', () => {
      component.serverFilters = { search: 'existing' };
      spyOn(component, 'loadWithServerSort');
      component.onSearchCleared();
      expect(component.serverFilters['search']).toBeUndefined();
      expect(component.searchText).toBe('');
      expect(component.loadWithServerSort).toHaveBeenCalled();
    });

  });

  // ─── Sort ────────────────────────────────────────────────────────────────

  describe('Sort', () => {

    it('should toggle asc to desc when toggleSort called for same column', () => {
      component.sort.active = 'code';
      component.sort.direction = 'asc';
      spyOn(component, 'loadWithServerSort');
      component.toggleSort('code');
      expect(component.sort.direction).toBe('desc');
    });

    it('should toggle desc to asc when toggleSort called for same column', () => {
      component.sort.active = 'code';
      component.sort.direction = 'desc';
      spyOn(component, 'loadWithServerSort');
      component.toggleSort('code');
      expect(component.sort.direction).toBe('asc');
    });

    it('should reset pageIndex to 0 on sort', () => {
      component.paginator.pageIndex = 2;
      component.toggleSort('type');
      expect(component.paginator.pageIndex).toBe(0);
    });


    it('getSortIcon should return unfold_more when column is not active', () => {
      component.sort.active = 'code';
      component.sort.direction = 'asc';
      expect(component.getSortIcon('owner')).toBe('unfold_more');
    });

    it('getSortIcon should return arrow_upward when column is sorted asc', () => {
      component.sort.active = 'code';
      component.sort.direction = 'asc';
      expect(component.getSortIcon('code')).toBe('arrow_upward');
    });

    it('getSortIcon should return arrow_downward when column is sorted desc', () => {
      component.sort.active = 'code';
      component.sort.direction = 'desc';
      expect(component.getSortIcon('code')).toBe('arrow_downward');
    });

  });

  // ─── Row Interactions ────────────────────────────────────────────────────

  describe('Row Interactions', () => {
    it('should expand row when toggleRow called on new row', () => {
      component.toggleRow(mockRow);
      expect(component.expandedRow).toBe(mockRow);
    });


    it('should switch expanded row when toggleRow called on different row', () => {
      const row2: DonorInterdiction = { ...mockRow, code: 'XYZ' };
      component.expandedRow = mockRow;
      component.toggleRow(row2);
      expect(component.expandedRow).toBe(row2);
    });
  });

  // ─── Side Panel ──────────────────────────────────────────────────────────

  describe('Side Panel', () => {
    it('should open add mode via createRecord', () => {
      component.createRecord();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });


    it('should open edit mode via editRecord on success', () => {
      component.editRecord(mockRow);
      expect(service.getByCode).toHaveBeenCalledWith('ADH');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockRow);
    });

    it('should set selectedRow during editRecord', () => {
      component.editRecord(mockRow);
      expect(component.selectedRow).toBe(mockRow);
    });


    it('should log error and set loading false when editRecord fails', () => {
      spyOn(console, 'error');
      (service.getByCode as jasmine.Spy).and.returnValue(throwError(() => new Error('fail')));
      component.editRecord(mockRow);
      expect(console.error).toHaveBeenCalledWith('API Error:', jasmine.any(Error));
      expect(component.loading()).toBeFalse();
    });

    it('should close side panel on closeSidePanel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockRow;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });



    it('should reset pageIndex on onSaveSuccess', () => {
      component.paginator.pageIndex = 3;
      component.onSaveSuccess();
      expect(component.paginator.pageIndex).toBe(0);
    });
  });

  // ─── Filters ─────────────────────────────────────────────────────────────

  describe('Filters — onApplyFilter', () => {

    it('should apply owner filter', () => {
      component.filterForm.patchValue({ owner: 'D' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      expect(component.serverFilters.owner).toBe('D');
    });

    it('should apply interdictionType filter', () => {
      component.filterForm.patchValue({ interdictionType: 'CAUTN' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      expect(component.serverFilters.interType).toBe('CAUTN');
    });

    it('should apply deferral filter', () => {
      component.filterForm.patchValue({ deferral: 'Y' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      expect(component.serverFilters.deferralFlag).toBe('Y');
    });

    it('should apply effectiveDate filter when period and date are both set', () => {
      const testDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ effectivePeriod: 'AFTER', effectiveDate: testDate as any });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      expect(component.serverFilters.effectivePeriod).toBe('AFTER');
      expect(component.serverFilters.effectiveDate).toBeTruthy();
    });


    it('should apply terminationDate filter when both period and date are set', () => {
      const termDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ terminationPeriod: 'BEFORE', terminationDate: termDate as any });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      expect(component.serverFilters.terminationPeriod).toBe('BEFORE');
      expect(component.serverFilters.terminationDate).toBeTruthy();
    });

    it('should reset pageIndex to 0 on apply', () => {
      component.paginator.pageIndex = 2;
      component.filterForm.patchValue({ owner: 'D' });
      component.onApplyFilter();
      expect(component.paginator.pageIndex).toBe(0);
    });
  });

  describe('Filters — updateFilterChips', () => {
    it('should add owner chip after applying owner filter', () => {
      component.filterForm.patchValue({ owner: 'D' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      const ownerChip = component.filterChips.find(c => c.key === 'owner');
      expect(ownerChip).toBeTruthy();
      expect(ownerChip!.label).toContain('Donor');
    });

    it('should add interdictionType chip after filter', () => {
      component.filterForm.patchValue({ interdictionType: 'CAUTN' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      const chip = component.filterChips.find(c => c.key === 'interdictionType');
      expect(chip).toBeTruthy();
      expect(chip!.label).toContain('CAUTN');
    });

    it('should add deferral chip with Yes/No label', () => {
      component.filterForm.patchValue({ deferral: 'Y' });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      const chip = component.filterChips.find(c => c.key === 'deferral');
      expect(chip).toBeTruthy();
      expect(chip!.label).toContain('Yes');
    });

    it('should add effectiveDate chip with ≥ operator for AFTER', () => {
      const testDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ effectivePeriod: 'AFTER', effectiveDate: testDate as any });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      const chip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(chip).toBeTruthy();
      expect(chip!.label).toContain('≥');
    });

    it('should add terminationDate chip with ≤ operator for BEFORE', () => {
      const termDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ terminationPeriod: 'BEFORE', terminationDate: termDate as any });
      spyOn(component, 'loadWithServerSort');
      component.onApplyFilter();
      const chip = component.filterChips.find(c => c.key === 'terminationDate');
      expect(chip).toBeTruthy();
      expect(chip!.label).toContain('≤');
    });

  });
  describe('Filters — removeFilter', () => {
    it('should remove owner filter and reload', () => {
      component.serverFilters = { owner: 'D' };
      component.appliedFilters = { owner: 'D' };
      spyOn(component, 'loadWithServerSort');
      component.removeFilter('owner');
      expect(component.serverFilters['owner']).toBeUndefined();
      expect(component.appliedFilters.owner).toBeUndefined();
      expect(component.loadWithServerSort).toHaveBeenCalled();
    });

    it('should remove interdictionType filter and reload', () => {
      component.serverFilters = { interType: 'CAUTN' };
      component.appliedFilters = { interdictionType: 'CAUTN' };
      spyOn(component, 'loadWithServerSort');
      component.removeFilter('interdictionType');
      expect(component.serverFilters['interType']).toBeUndefined();
      expect(component.appliedFilters.interdictionType).toBeUndefined();
      expect(component.loadWithServerSort).toHaveBeenCalled();
    });

    it('should remove deferral filter and reload', () => {
      component.serverFilters = { deferralFlag: 'Y' };
      component.appliedFilters = { deferral: 'Y' };
      spyOn(component, 'loadWithServerSort');
      component.removeFilter('deferral');
      expect(component.serverFilters['deferralFlag']).toBeUndefined();
      expect(component.appliedFilters.deferral).toBeUndefined();
    });

    it('should remove effectiveDate filter including period', () => {
      component.serverFilters = { effectiveDate: '2025-01-01', effectivePeriod: 'AFTER' };
      component.appliedFilters = { effectiveDate: new Date(), effectivePeriod: 'AFTER' };
      spyOn(component, 'loadWithServerSort');
      component.removeFilter('effectiveDate');
      expect(component.serverFilters['effectiveDate']).toBeUndefined();
      expect(component.serverFilters['effectivePeriod']).toBeUndefined();
      expect(component.appliedFilters.effectiveDate).toBeUndefined();
      expect(component.appliedFilters.effectivePeriod).toBeUndefined();
    });

    it('should remove terminationDate filter including period', () => {
      component.serverFilters = { terminationDate: '2025-12-31', terminationPeriod: 'BEFORE' };
      component.appliedFilters = { terminationDate: new Date(), terminationPeriod: 'BEFORE' };
      spyOn(component, 'loadWithServerSort');
      component.removeFilter('terminationDate');
      expect(component.serverFilters['terminationDate']).toBeUndefined();
      expect(component.serverFilters['terminationPeriod']).toBeUndefined();
      expect(component.appliedFilters.terminationDate).toBeUndefined();
      expect(component.appliedFilters.terminationPeriod).toBeUndefined();
    });
  });

  describe('Filters — isFilterFormValid', () => {
    it('should return true when no filter values are set', () => {
      expect(component.isFilterFormValid).toBeTrue();
    });

    it('should return false when effectiveDate control is invalid', () => {
      component.filterForm.get('effectiveDate')!.setErrors({ invalidDateFormat: true });
      expect(component.isFilterFormValid).toBeFalse();
    });

    it('should return false when terminationDate control is invalid', () => {
      component.filterForm.get('terminationDate')!.setErrors({ invalidDateFormat: true });
      expect(component.isFilterFormValid).toBeFalse();
    });

    it('should return false when terminationDate is before effectiveDate', () => {
      const eff  = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const term = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ effectiveDate: eff as any, terminationDate: term as any });
      expect(component.isFilterFormValid).toBeFalse();
    });

    it('should return true when terminationDate is after effectiveDate', () => {
      const eff  = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const term = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      component.filterForm.patchValue({ effectiveDate: eff as any, terminationDate: term as any });
      expect(component.isFilterFormValid).toBeTrue();
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────────

  describe('Navigation', () => {

    it('should navigate to lab and set selectedTab on onTabChange(1)', () => {
      component.onTabChange(1);
      expect(component.selectedTab).toBe('lab');
      expect(router.navigate).toHaveBeenCalledWith(
        ['/application-administration/lab-restricted/lab-interdiction-codes'],
        { state: { fromTabNavigation: true } }
      );
    });

    it('should navigate to lab on goToLab', () => {
      component.goToLab();
      expect(router.navigate).toHaveBeenCalledWith(
        ['/application-administration/lab-restricted/lab-interdiction-codes'],
        { state: { fromTabNavigation: true } }
      );
      expect(component.selectedTab).toBe('lab');
    });
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────

  describe('Helpers', () => {
    it('isValidDate should return true for a valid Date object', () => {
      expect(component.isValidDate(new Date())).toBeTrue();
    });

    it('isValidDate should return true for null (no filter)', () => {
      expect(component.isValidDate(null)).toBeTrue();
    });


    it('isValidDate should return true for a valid date string', () => {
      expect(component.isValidDate('2025-01-01')).toBeTrue();
    });

    it('getOwnerDisplayName should return Donor (D) for code D', () => {
      expect(component.getOwnerDisplayName('D')).toBe('Donor (D)');
    });

    it('getOwnerDisplayName should return Unit (U) for code U', () => {
      expect(component.getOwnerDisplayName('U')).toBe('Unit (U)');
    });

    it('getOwnerDisplayName should return Both (B) for code B', () => {
      expect(component.getOwnerDisplayName('B')).toBe('Both (B)');
    });

    it('getOwnerDisplayName should return code itself for unknown code', () => {
      expect(component.getOwnerDisplayName('X')).toBe('X (X)');
    });
  });

  // ─── Filter Dialog ────────────────────────────────────────────────────────
  // ─── ngOnDestroy ─────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next() and complete() on destroy$', () => {
      const nextSpy     = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
